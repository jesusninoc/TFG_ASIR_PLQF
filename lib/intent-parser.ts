/**
 * lib/intent-parser.ts
 * Thin wrapper around Ollama (Mistral) that converts natural language into a
 * structured AssistantIntent JSON.
 *
 * The LLM is ONLY a parsing layer — no business logic lives here.
 * All filtering and build generation is done by build-engine.ts.
 *
 * Requires Ollama running at http://localhost:11434 with the model downloaded.
 * Configure via env:
 *   OLLAMA_HOST  (default: http://localhost:11434)
 *   OLLAMA_MODEL (default: mistral)
 */

import { z } from "zod";
import type { AssistantIntent, ConversationMessage } from "@/lib/types";

// ─── Zod schema for output validation ─────────────────────────────────────────

const brandFiltersSchema = z.object({
  cpu:         z.array(z.string()).optional(),
  gpu:         z.array(z.string()).optional(),
  ram:         z.array(z.string()).optional(),
  storage:     z.array(z.string()).optional(),
  motherboard: z.array(z.string()).optional(),
  psu:         z.array(z.string()).optional(),
  case:        z.array(z.string()).optional(),
}).optional();

const minSpecsSchema = z.object({
  cpuCores:  z.number().optional(),
  gpuVramGb: z.number().optional(),
  memoryGb:  z.number().optional(),
  storageGb: z.number().optional(),
}).optional();

const buildFiltersSchema = z.object({
  budgetCents:         z.number(),
  useCase:             z.enum(["gaming", "workstation_gpu", "workstation_cpu", "office"]).optional(),
  preferBrands:        brandFiltersSchema,
  excludeBrands:       brandFiltersSchema,
  minSpecs:            minSpecsSchema,
  requireDedicatedGpu: z.boolean().optional(),
  preferFormFactor:    z.enum(["Mini-ITX", "mATX", "ATX", "E-ATX", "XL-ATX"]).optional(),
}).optional();

const orderQuerySchema = z.object({
  email: z.string().optional(),
}).optional();

const catalogQuerySchema = z.object({
  componentType: z.enum(["cpu", "gpu", "ram", "memory", "storage", "motherboard", "psu", "case"]).optional(),
  brand:         z.string().optional(),
  maxPriceCents: z.number().optional(),
  minPriceCents: z.number().optional(),
}).optional();

const intentSchema = z.object({
  intent:          z.enum(["build", "clarify", "faq", "unknown", "order_status", "escalate", "catalog_search"]),
  buildFilters:    buildFiltersSchema,
  clarifyQuestion: z.string().optional(),
  faqQuery:        z.string().optional(),
  orderQuery:      orderQuerySchema,
  catalogQuery:    catalogQuerySchema,
});

// ─── System prompt ─────────────────────────────────────────────────────────────
// NOTE: This prompt is for the INTENT PARSER only (structured JSON extraction).
// Personality / conversational tone is baked into the clarifyQuestion examples.
// Do NOT add conversational prose here — it conflicts with "output ONLY JSON".

const SYSTEM_PROMPT = `You are a strict JSON intent-parser for a Spanish PC hardware store. You know these content creators: Xokas (AMD high-end), ElRubius (Intel+NVIDIA high-end), Ibai (professional setup), Auronplay (balanced, any brand). Output ONLY valid JSON — absolutely nothing else, no markdown, no prose.

Output schema:
{
  "intent": "build" | "clarify" | "faq" | "unknown" | "order_status" | "escalate" | "catalog_search",
  "buildFilters": {                         // only when intent = "build"
    "budgetCents": number,                  // budget in euro cents (e.g. 1200€ → 120000)
    "useCase": "gaming" | "workstation_gpu" | "workstation_cpu" | "office",
    "preferBrands": { "cpu": [...], "gpu": [...], "ram": [...], "storage": [...], "motherboard": [...] },
    "excludeBrands": { "cpu": [...], "gpu": [...] },
    "minSpecs": { "cpuCores": number, "gpuVramGb": number, "memoryGb": number, "storageGb": number },
    "requireDedicatedGpu": boolean,
    "preferFormFactor": "Mini-ITX" | "mATX" | "ATX" | "E-ATX" | "XL-ATX"
  },
  "clarifyQuestion": "string",              // only when intent = "clarify", ALWAYS in Spanish, friendly tone
  "faqQuery": "string",                     // only when intent = "faq"
  "orderQuery": { "email": "string" },       // only when intent = "order_status"; email optional if not mentioned
  "catalogQuery": {                          // only when intent = "catalog_search"
    "componentType": "cpu"|"gpu"|"ram"|"storage"|"motherboard"|"psu"|"case",
    "brand": "string",
    "maxPriceCents": number,
    "minPriceCents": number
  }
}

Rules:
0. Currency: users ALWAYS speak in euros. "10k" = 10000€, "2k" = 2000€, "1.5k" = 1500€. Convert shorthand first, then multiply by 100 for budgetCents.
1. If the user asks for a PC/build and gives a budget → intent = "build". Fill budgetCents (multiply euros × 100).
2. If the user mentions a streamer or influencer WITHOUT a budget → intent = "clarify". Ask for budget while referencing what that streamer's setup is known for.
3. If the user asks for a build but NO budget is given → intent = "clarify". Ask for an approximate budget.
4. If user says "sin límite", "lo más caro posible", "sin límite de presupuesto" → intent = "clarify". Ask for a rough ceiling in a friendly way.
5. If useCase is "workstation" and it is NOT clear whether they need heavy GPU workloads → intent = "clarify".
6. If useCase = "workstation_cpu" or "office" → set requireDedicatedGpu = false.
7. If the user asks about specs, differences between components, or general PC questions → intent = "faq".
8. If the message is a greeting, a short thanks ("gracias", "genial", "perfecto", "ok"), or purely social with no PC request → intent = "unknown". Do NOT ask for a build.
9. CRITICAL — Context carry-forward: if earlier user messages already established a budget, useCase, or brand preference, YOU MUST copy those values into the current buildFilters. Never output budgetCents:0 if the budget was mentioned in a prior turn.
10. Never add keys not in the schema. All text values in Spanish.

Single-turn examples:
User: "hazme una PC gamer por 1500€ con AMD"
→ {"intent":"build","buildFilters":{"budgetCents":150000,"useCase":"gaming","preferBrands":{"cpu":["AMD"],"gpu":["AMD"]},"requireDedicatedGpu":true}}

User: "quiero gaming por 10k"
→ {"intent":"build","buildFilters":{"budgetCents":1000000,"useCase":"gaming","requireDedicatedGpu":true}}

User: "PC para gaming con 2k"
→ {"intent":"build","buildFilters":{"budgetCents":200000,"useCase":"gaming","requireDedicatedGpu":true}}

User: "quiero el ordenador como el del Xokas"
→ {"intent":"clarify","clarifyQuestion":"¡El Xokas tiene buen gusto — setup AMD de alta gama! 😄 ¿Con qué presupuesto contamos? El suyo rondaba los 3000-4000€, pero puedo hacerte algo similar con lo que hay en stock."}

User: "quiero una build gaming como la de ElRubius"
→ {"intent":"clarify","clarifyQuestion":"¡Buena referencia! ElRubius siempre ha tirado por setups Intel+NVIDIA de alto nivel. ¿Cuál sería tu presupuesto? Con eso te armo algo similar con lo que hay en stock."}

User: "la build más cara posible, sin límite de presupuesto"
→ {"intent":"clarify","clarifyQuestion":"¡Me gusta la actitud! 🚀 Para no desperdiciar nada, ¿tienes algún techo aunque sea orientativo? A veces meter los componentes más caros juntos no da el mejor rendimiento por euro."}

User: "quiero una workstation"
→ {"intent":"clarify","clarifyQuestion":"Para una workstation hay dos mundos muy distintos. ¿La vas a usar para cargas gráficas pesadas (renders 3D, Revit, Blender, edición de vídeo)? ¿O más bien para CPU pura — análisis de datos, programación, simulaciones sin GPU?"}

User: "workstation para arquitecto"
→ {"intent":"clarify","clarifyQuestion":"¿Usarás Revit, 3ds Max o Blender con renders pesados que necesiten GPU? ¿O trabajas principalmente en 2D/BIM donde lo que manda es la CPU?"}

User: "workstation para arquitecto con renders en 3D y mucha RAM"
→ {"intent":"build","buildFilters":{"budgetCents":0,"useCase":"workstation_gpu","requireDedicatedGpu":true,"minSpecs":{"memoryGb":32}}}

User: "workstation para análisis de datos, sin gráfica"
→ {"intent":"build","buildFilters":{"budgetCents":0,"useCase":"workstation_cpu","requireDedicatedGpu":false}}

User: "PC para ofimática barata, unos 600€"
→ {"intent":"build","buildFilters":{"budgetCents":60000,"useCase":"office","requireDedicatedGpu":false}}

User: "¿qué diferencia hay entre DDR4 y DDR5?"
→ {"intent":"faq","faqQuery":"diferencia DDR4 DDR5"}

User: "gracias", "genial", "perfecto", "de nada", "ok", "👍"
→ {"intent":"unknown"}

User: "hola", "buenas", "hey"
→ {"intent":"unknown"}

Multi-turn examples — READ full conversation history before deciding:

[History] User: "quiero gaming por 1500€"  [History] Assistant: generated builds
[Current] User: "sin nvidia"
→ {"intent":"build","buildFilters":{"budgetCents":150000,"useCase":"gaming","requireDedicatedGpu":true,"excludeBrands":{"gpu":["NVIDIA","Nvidia","nvidia"]}}}

[History] User: "PC gaming con 2000€"  [History] Assistant: generated builds
[Current] User: "prefiero AMD tanto CPU como GPU"
→ {"intent":"build","buildFilters":{"budgetCents":200000,"useCase":"gaming","requireDedicatedGpu":true,"preferBrands":{"cpu":["AMD"],"gpu":["AMD"]}}}

[History] User: "workstation GPU con 3000€ y mucha RAM"  [History] Assistant: generated builds
[Current] User: "¿puedes incluir más RAM?"
→ {"intent":"build","buildFilters":{"budgetCents":300000,"useCase":"workstation_gpu","requireDedicatedGpu":true,"minSpecs":{"memoryGb":64}}}

[History] User: "1200€ para oficina"  [History] Assistant: "¡Aquíestan las builds!"
[Current] User: "ok, perfecto"
→ {"intent":"unknown"}

11. If the user asks about the status, location, or tracking of their order ("estado de mi pedido", "¿dónde está mi pedido?", "tengo un pedido", "cuándo llega mi pedido", etc.) → intent = "order_status". If an email address is visible in the message or in recent history, extract it into orderQuery.email. If no email is present, set orderQuery to {}.
12. If the user explicitly asks to speak with a human, requests customer support or an agent, or mentions a payment or delivery problem that the chatbot cannot solve → intent = "escalate". No extra fields needed.
13. If the user asks to browse or see a list of products of a specific component type ("¿qué GPUs tenéis?", "muéstrame CPUs Intel", "placas base por menos de 200€") WITHOUT asking for a complete PC build → intent = "catalog_search". Extract componentType (one of: cpu, gpu, ram, storage, motherboard, psu, case). Optionally extract brand, maxPriceCents and minPriceCents (in euro cents, euros × 100).

Additional examples:

User: "¿cuál es el estado de mi pedido?"
→ {"intent":"order_status","orderQuery":{}}

User: "¿dónde está mi pedido? Mi email es juan@gmail.com"
→ {"intent":"order_status","orderQuery":{"email":"juan@gmail.com"}}

User: "quiero hablar con alguien de soporte"
→ {"intent":"escalate"}

User: "tengo un problema con un pago, quiero un agente humano"
→ {"intent":"escalate"}

User: "¿qué GPUs AMD tenéis en stock?"
→ {"intent":"catalog_search","catalogQuery":{"componentType":"gpu","brand":"AMD"}}

User: "muéstrame CPUs Intel por menos de 400€"
→ {"intent":"catalog_search","catalogQuery":{"componentType":"cpu","brand":"Intel","maxPriceCents":40000}}

User: "quiero ver placas base disponibles"
→ {"intent":"catalog_search","catalogQuery":{"componentType":"motherboard"}}

User: "¿cuánta RAM DDR5 tenéis?"
→ {"intent":"catalog_search","catalogQuery":{"componentType":"ram"}}`;


// ─── Main export ──────────────────────────────────────────────────────────────

export async function parseIntent(
  messages: ConversationMessage[],
  question: string,
): Promise<AssistantIntent> {
  try {
    const ollamaHost  = process.env.OLLAMA_HOST  ?? "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL ?? "mistral";

    // Guard against SSRF via misconfigured OLLAMA_HOST
    try {
      const parsed = new URL(ollamaHost);
      const forbidden = ["169.254.169.254", "metadata.google.internal", "metadata.internal"];
      if (forbidden.some((h) => parsed.hostname === h) || !["http:", "https:"].includes(parsed.protocol)) {
        console.error("[intent-parser] Blocked dangerous OLLAMA_HOST:", ollamaHost);
        return { intent: "unknown" };
      }
    } catch {
      console.error("[intent-parser] Invalid OLLAMA_HOST:", ollamaHost);
      return { intent: "unknown" };
    }

    // Build conversation history for context-aware parsing
    const historyText = messages
      .slice(-6) // last 3 exchanges
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const userPrompt = historyText
      ? `Previous conversation:\n${historyText}\n\nNew message: ${question}`
      : question;

    // Timeout guard — Ollama can hang; abort after 30 s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    let response: Response;
    try {
      response = await fetch(`${ollamaHost}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: ollamaModel,
          format: "json",
          stream: false,
          messages: [
            { role: "system",  content: SYSTEM_PROMPT },
            { role: "user",    content: userPrompt },
          ],
        }),
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      console.error("[intent-parser] Ollama error:", response.status, await response.text());
      return { intent: "unknown" };
    }

    const data = await response.json() as { message?: { content?: string } };
    const raw = data?.message?.content ?? "";

    const parsed = JSON.parse(raw);
    const validated = intentSchema.safeParse(parsed);

    if (!validated.success) {
      console.error("[intent-parser] Zod validation failed:", validated.error.flatten());
      return { intent: "unknown" };
    }

    return validated.data as AssistantIntent;
  } catch (err) {
    console.error("[intent-parser] Unexpected error:", err);
    return { intent: "unknown" };
  }
}
