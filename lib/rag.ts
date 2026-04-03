/**
 * lib/rag.ts
 * Orquestador del asistente IA.
 *
 * Flujo:
 *   1. parseIntent()       → AssistantIntent (Mistral/Ollama)
 *   2a. intent = "build"   → generateBuilds() → formatea builds
 *   2b. intent = "clarify" → devuelve la pregunta de clarificación directamente
 *   2c. intent = "faq"     → búsqueda en FAQ + productos (sin LLM)
 *   2d. intent = "unknown" → mensaje de ayuda genérico
 *
 * La lógica de negocio (compatibilidad, stock, filtros) vive en build-engine.ts.
 * Este archivo es solo un coordinador.
 */

import { prisma } from "@/lib/prisma";
import { dbProductsToTypes } from "@/lib/db-to-types";
import { formatPrice } from "@/lib/compatibility";
import { generateBuilds } from "@/lib/build-engine";
import { parseIntent } from "@/lib/intent-parser";
import type { BuildResult, ConversationMessage, Product } from "@/lib/types";

interface FaqRow { id: string; question: string; answer: string; }

// ─── FAQ helpers ──────────────────────────────────────────────────────────────

function scoreMatch(source: string, query: string): number {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  return words.reduce((n, w) => (source.toLowerCase().includes(w) ? n + 1 : n), 0);
}

// ─── Budget recovery from conversation history ──────────────────────────────────────
// Safety net when the LLM fails rule-9 (context carry-forward) and outputs
// budgetCents:0 even though the user established a budget in a prior turn.

function extractBudgetCentsFromHistory(
  messages: ConversationMessage[],
  question: string,
): number | null {
  const userText = [
    ...messages.filter((m) => m.role === "user").map((m) => m.content),
    question,
  ].join(" ");

  // Match e.g. "1.5k", "2k", "10k", "1500€", "1500 euros", "1.500€"
  const kPattern   = /(\d+(?:[.,]\d+)?)\s*k\b/gi;
  const euroPattern = /(\d+(?:[.,]\d+)?)\s*(?:€|euros?)/gi;

  let latestCents: number | null = null;

  for (const [pattern, multiplier] of [
    [kPattern, 100_000] as const,
    [euroPattern, 100]  as const,
  ]) {
    const matches = [...userText.matchAll(pattern)];
    for (const match of matches) {
      const raw   = match[1].replace(/\./g, "").replace(",", ".");
      const value = parseFloat(raw);
      if (!Number.isFinite(value) || value <= 0) continue;
      const cents = Math.round(value * multiplier);
      // Sanity: between 100€ and 100k€
      if (cents >= 10_000 && cents <= 10_000_000) latestCents = cents;
    }
  }

  return latestCents;
}


const USE_CASE_LABEL: Record<string, string> = {
  gaming:          "gaming",
  workstation_gpu: "workstation GPU",
  workstation_cpu: "workstation CPU",
  office:          "ofimática",
};

const TIER_LABEL: Record<string, string> = {
  budget:  "Económica",
  mid:     "Equilibrada",
  premium: "Premium",
};

// Maps LLM component type names (lowercase) → Prisma ComponentType enum values
const COMPONENT_TYPE_MAP: Record<string, string> = {
  cpu:         "CPU",
  gpu:         "GPU",
  ram:         "MEMORY",
  memory:      "MEMORY",
  storage:     "STORAGE",
  motherboard: "MOTHERBOARD",
  psu:         "PSU",
  case:        "CASE",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING:  "⏳ Pendiente de pago",
  PAID:     "✅ Pagado / en preparación",
  FAILED:   "❌ Pago fallido",
  REFUNDED: "↩️ Reembolsado",
};

export interface BuildMessage {
  tier: string;
  answer: string;
  buildIds: Record<string, string>;
}

function formatSingleBuild(r: BuildResult): string {
  const { build, report, tier, totalPriceCents } = r;
  const lines = [
    `🖥️  Build ${TIER_LABEL[tier]} — ${formatPrice(totalPriceCents)}`,
    `CPU: ${build.cpu!.name} (${formatPrice(build.cpu!.priceCents)})`,
    `Placa: ${build.motherboard!.name} (${formatPrice(build.motherboard!.priceCents)})`,
    `RAM: ${build.memory!.name} (${formatPrice(build.memory!.priceCents)})`,
    `Disco: ${build.storage!.name} (${formatPrice(build.storage!.priceCents)})`,
    ...(build.gpu ? [`GPU: ${build.gpu.name} (${formatPrice(build.gpu.priceCents)})`] : []),
    `Fuente: ${build.psu!.name} (${formatPrice(build.psu!.priceCents)})`,
    `Torre: ${build.case!.name} (${formatPrice(build.case!.priceCents)})`,
    `Consumo: ~${report.estimatedPowerWatts}W`,
  ];
  return lines.join("\n");
}

function extractSingleBuildIds(r: BuildResult): Record<string, string> {
  return {
    cpu:         r.build.cpu!.id,
    motherboard: r.build.motherboard!.id,
    memory:      r.build.memory!.id,
    storage:     r.build.storage!.id,
    ...(r.build.gpu ? { gpu: r.build.gpu.id } : {}),
    psu:         r.build.psu!.id,
    case:        r.build.case!.id,
  };
}

// ─── Public response type ─────────────────────────────────────────────────────

export interface AssistantResponse {
  answer: string;
  references: string[];
  builds?: BuildMessage[];
  clarifyQuestion?: string;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateAssistantResponse(
  question: string,
  messages: ConversationMessage[] = [],
): Promise<AssistantResponse> {
  // 1. Parse intent via Mistral
  const intent = await parseIntent(messages, question);

  // 2a. Build intent
  if (intent.intent === "build" && intent.buildFilters) {
    let filters = intent.buildFilters;

    if (!filters.budgetCents || filters.budgetCents <= 0) {
      // Safety net: LLM failed rule-9 (carry-forward) — try to recover from history
      const recovered = extractBudgetCentsFromHistory(messages, question);
      if (recovered) {
        filters = { ...filters, budgetCents: recovered };
      } else {
        return {
          answer: "¡Vamos a montar algo! ¿Con qué presupuesto contamos? Aunque sea orientativo — 900€, 1500€, 2500€... con eso busco las mejores opciones en stock ahora mismo. 💰",
          references: [],
          clarifyQuestion: "¿Cuál es tu presupuesto aproximado para la build?",
        };
      }
    }

    const results = await generateBuilds(filters);
    const refs = results.flatMap((r) =>
      [r.build.cpu?.name, r.build.gpu?.name].filter(Boolean) as string[],
    );

    if (results.length === 0) {
      return {
        answer: "Mmm, con ese presupuesto y esas restricciones no encontré una build completa en stock ahora mismo. Prueba a subir un poco el presupuesto o a quitar alguna restricción de marca — a veces hay combinaciones increíbles fuera de las marcas habituales.",
        references: [],
      };
    }

    const useCaseStr = filters.useCase ? ` para **${USE_CASE_LABEL[filters.useCase] ?? filters.useCase}**` : "";
    const budgetStr  = formatPrice(filters.budgetCents);
    const countStr   = results.length === 1 ? "1 opción" : `${results.length} opciones`;

    return {
      answer: `¡Listo! Aquí tienes ${countStr}${useCaseStr} con un presupuesto de ${budgetStr} 🚀 Las ordeno de más ajustada a más completa:`,
      references: [...new Set(refs)],
      builds: results.map((r) => ({
        tier:     r.tier,
        answer:   formatSingleBuild(r),
        buildIds: extractSingleBuildIds(r),
      })),
    };
  }

  // 2b. Clarify intent — return the question back to the user
  if (intent.intent === "clarify" && intent.clarifyQuestion) {
    return {
      answer: intent.clarifyQuestion,
      references: [],
      clarifyQuestion: intent.clarifyQuestion,
    };
  }

  // 2c. FAQ intent — keyword search in DB (no LLM)
  if (intent.intent === "faq") {
    const query = intent.faqQuery ?? question;
    const [allFaq, allProductsRaw] = await Promise.all([
      prisma.faqEntry.findMany(),
      prisma.product.findMany({
        include: {
          cpuSpec: true, motherboardSpec: true, memorySpec: true,
          storageSpec: true, gpuSpec: true, psuSpec: true, caseSpec: true,
        },
      }),
    ]);

    const allProducts: Product[] = dbProductsToTypes(allProductsRaw);

    const rankedFaq: { e: FaqRow; score: number }[] = (allFaq as FaqRow[])
      .map((e) => ({ e, score: scoreMatch(`${e.question} ${e.answer}`, query) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    const rankedProducts = allProducts
      .map((p) => ({ p, score: scoreMatch(`${p.name} ${p.brand} ${p.description}`, query) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (rankedFaq.length === 0 && rankedProducts.length === 0) {
      return {
        answer: "No tengo información específica sobre eso en la base de datos. Si me das más contexto te ayudo a aclarar la duda, o si quieres te monto una build directamente — dime tipo de uso y presupuesto.",
        references: [],
      };
    }

    const faqSummary = rankedFaq
      .map((x) => `**${x.e.question}**\n${x.e.answer}`)
      .join("\n\n");
    const productSummary = rankedProducts
      .map((x) => `- ${x.p.name} (${formatPrice(x.p.priceCents)}): ${x.p.description}`)
      .join("\n");

    return {
      answer: [
        "Esto es lo que encontré:",
        faqSummary     ? `\n${faqSummary}` : "",
        productSummary ? `\nProductos relacionados:\n${productSummary}` : "",
      ].filter(Boolean).join("\n"),
      references: rankedProducts.map((x) => x.p.name),
    };
  }

  // 2d. Order status intent
  if (intent.intent === "order_status") {
    const email = intent.orderQuery?.email?.trim();
    if (!email) {
      return {
        answer:
          "Para consultar tu pedido necesito el email con el que realizaste la compra — es el mismo al que Stripe te envió la confirmación. ¿Me lo puedes indicar? 📧",
        references: [],
      };
    }

    const orders = await prisma.order.findMany({
      where: { customerEmail: email },
      select: {
        id:         true,
        status:     true,
        totalCents: true,
        createdAt:  true,
        items: {
          select: {
            quantity:   true,
            priceCents: true,
            product:    { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (orders.length === 0) {
      return {
        answer: `No encontré pedidos asociados al email **${email}**. ¿Puede que usaras otro email? Si crees que hay un error, escríbenos a soporte@pcselector.es 📧`,
        references: [],
      };
    }

    const orderLines = orders.map((o) => {
      const statusLabel = ORDER_STATUS_LABEL[o.status] ?? o.status;
      const total = formatPrice(o.totalCents);
      const date  = o.createdAt.toLocaleDateString("es-ES");
      const items = o.items.map((i) => `  • ${i.product.name} ×${i.quantity}`).join("\n");
      return `📦 **${date}** — ${statusLabel} — ${total}\n${items}`;
    });

    return {
      answer: `Aquí están tus pedidos para **${email}**:\n\n${orderLines.join("\n\n")}`,
      references: [],
    };
  }

  // 2e. Escalate to human support
  if (intent.intent === "escalate") {
    return {
      answer:
        "¡Claro! Para hablar con el equipo de soporte puedes contactarnos por:\n\n" +
        "📧 **Email:** soporte@pcselector.es\n" +
        "📞 **Teléfono:** +34 900 000 000 _(L–V, 9:00–18:00)_\n\n" +
        "Si tienes el número de pedido a mano, menciónalo al escribir y te atenderemos mucho más rápido.",
      references: [],
    };
  }

  // 2f. Catalog search — list products of a specific component type with optional filters
  if (intent.intent === "catalog_search" && intent.catalogQuery) {
    const { componentType, brand, maxPriceCents, minPriceCents } = intent.catalogQuery;
    const prismaType = componentType ? COMPONENT_TYPE_MAP[componentType] : undefined;

    if (!prismaType) {
      return {
        answer:
          "Puedo mostrarte el catálogo de: **CPUs**, **GPUs**, **RAM**, **almacenamiento**, **placas base**, **fuentes de alimentación** y **torres**. ¿Cuál te interesa?",
        references: [],
      };
    }

    const products = await prisma.product.findMany({
      where: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        componentType: prismaType as any,
        stock:         { gt: 0 },
        ...(brand
          ? { brand: { contains: brand, mode: "insensitive" as const } }
          : {}),
        ...(maxPriceCents !== undefined || minPriceCents !== undefined
          ? {
              priceCents: {
                ...(minPriceCents !== undefined ? { gte: minPriceCents } : {}),
                ...(maxPriceCents !== undefined ? { lte: maxPriceCents } : {}),
              },
            }
          : {}),
      },
      select: {
        id:          true,
        name:        true,
        brand:       true,
        priceCents:  true,
        description: true,
        stock:       true,
      },
      orderBy: { priceCents: "asc" },
      take: 8,
    });

    if (products.length === 0) {
      const filterDesc = [
        brand             && `marca ${brand}`,
        maxPriceCents     && `hasta ${formatPrice(maxPriceCents)}`,
        minPriceCents     && `desde ${formatPrice(minPriceCents)}`,
      ]
        .filter(Boolean)
        .join(", ");
      return {
        answer: `No hay ${componentType?.toUpperCase() ?? "productos"} en stock${
          filterDesc ? ` con los filtros: ${filterDesc}` : ""
        }. Prueba a ampliar los criterios o consúltame sin restricciones de precio.`,
        references: [],
      };
    }

    const COMPONENT_LABELS: Record<string, string> = {
      CPU:         "CPUs",
      GPU:         "GPUs",
      MEMORY:      "módulos de RAM",
      STORAGE:     "discos de almacenamiento",
      MOTHERBOARD: "placas base",
      PSU:         "fuentes de alimentación",
      CASE:        "torres",
    };

    const header = [
      `Aquí tienes los **${COMPONENT_LABELS[prismaType] ?? prismaType}** disponibles en stock`,
      brand         ? ` de **${brand}**`                   : "",
      maxPriceCents ? ` hasta **${formatPrice(maxPriceCents)}**` : "",
      minPriceCents ? ` desde **${formatPrice(minPriceCents)}**` : "",
      ":",
    ].join("");

    const lines = products.map(
      (p) =>
        `• **${p.name}** — ${formatPrice(p.priceCents)} _(${p.stock} en stock)_\n  ${
          p.description.slice(0, 90)
        }${p.description.length > 90 ? "…" : ""}`,
    );

    return {
      answer:     `${header}\n\n${lines.join("\n\n")}`,
      references: products.map((p) => p.name),
    };
  }

  // 2g. Unknown / fallback — could be a greeting, thanks, or truly unclear
  // Keep it warm: don't assume it was a failed build request
  return {
    answer: "¡Aquí estoy! 😊 Si quieres que te monte una build, dime el tipo de uso (gaming, ofimática, workstation) y un presupuesto orientativo — con eso busco las mejores opciones en stock.",
    references: [],
  };
}
