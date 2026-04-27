/**
 * Herramientas básicas: lookup_faq, get_order_status, get_cart_contents, get_current_page_context
 */

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { ToolDefinition, ToolResult, AgentContext } from "../types";
import { withRetry, getDefaultRetryConfig } from "../retry";

// Output schemas for validation
const LookupFaqResultSchema = z.object({
  faq: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ),
  products: z.array(
    z.object({
      name: z.string(),
      brand: z.string(),
      priceCents: z.number(),
      description: z.string(),
    })
  ),
});

const GetOrderStatusResultSchema = z.object({
  email: z.string().optional(),
  orders: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      total: z.string(),
      date: z.string(),
      items: z.array(z.string()),
    })
  ),
});

const GetCartContentsResultSchema = z.object({
  cart: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      priceCents: z.number(),
      quantity: z.number(),
      image: z.string().optional(),
    })
  ),
  totalCents: z.number(),
  itemCount: z.number(),
});

const GetCurrentPageContextResultSchema = z.object({
  page: z.string(),
  productId: z.string().optional(),
});

// ----------------------
// Validation Schemas (Zod)
// ----------------------

const lookupFaqParamsSchema = z.object({
  query: z.string().min(1).describe("Pregunta o palabras clave para buscar en FAQ"),
});

// ─── In-memory cache for FAQ lookups ───────────────────────────────────────────────
const lookupFaqCache = new Map<string, { data: ToolResult; expires: number }>();
const FAQ_CACHE_TTL = 60000; // 1 minute


const getOrderStatusParamsSchema = z.object({
  email: z.string().email().optional().describe("Email del cliente (opcional si ya está en contexto)"),
});


const navigateToPageParamsSchema = z.object({
  path: z.string().describe("Ruta interna (ej: /shop/cpu, /builder, /cart)"),
  buildIds: z
    .object({
      cpu: z.string().optional(),
      gpu: z.string().optional(),
      motherboard: z.string().optional(),
      memory: z.string().optional(),
      storage: z.string().optional(),
      psu: z.string().optional(),
      case: z.string().optional(),
    })
    .optional()
    .describe("IDs de componentes para pre-cargar en el builder"),
});

// ----------------------
// Tool Definitions (JSON Schema for OpenAI)
// ----------------------

export const lookupFaqTool: ToolDefinition = {
  name: "lookup_faq",
  description: "Busca en las preguntas frecuentes (FAQ) para responder consultas comunes sobre la tienda, productos o políticas.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Pregunta o palabras clave para buscar en FAQ",
        minLength: 1,
      },
    },
    required: ["query"],
  },
};

export const getOrderStatusTool: ToolDefinition = {
  name: "get_order_status",
  description: "Consulta el estado de un pedido a partir del email del cliente. Devuelve hasta 5 pedidos recientes.",
  parameters: {
    type: "object",
    properties: {
      email: {
        type: "string",
        format: "email",
        description: "Email del cliente (opcional si ya está en contexto)",
      },
    },
    required: [],
  },
};

export const getCartContentsTool: ToolDefinition = {
  name: "get_cart_contents",
  description: "Obtiene el contenido actual del carrito de compras del usuario. No requiere parámetros.",
  parameters: {
    type: "object",
    properties: {},
    required: [],
  },
};

export const getCurrentPageContextTool: ToolDefinition = {
  name: "get_current_page_context",
  description: "Obtiene información sobre la página actual y producto visualizado. No requiere parámetros.",
  parameters: {
    type: "object",
    properties: {},
    required: [],
  },
};

export const navigateToPageTool: ToolDefinition = {
  name: "navigate_to_page",
  description: "Sugiere navegación a otra página de la tienda. El frontend puede decidir si lo implementa.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Ruta interna (ej: /shop/cpu, /builder, /cart)",
      },
      buildIds: {
        type: "object",
        properties: {
          cpu: { type: "string" },
          gpu: { type: "string" },
          motherboard: { type: "string" },
          memory: { type: "string" },
          storage: { type: "string" },
          psu: { type: "string" },
          case: { type: "string" },
        },
        additionalProperties: false,
        description: "IDs de componentes para pre-cargar en el builder",
      },
    },
    required: ["path"],
  },
};

// ----------------------
// Tool Implementations
// ----------------------

export async function executeLookupFaq(params: Record<string, unknown>): Promise<ToolResult> {
  try {
    const { query } = lookupFaqParamsSchema.parse(params);
    const cacheKey = `lookupFaq:${query.trim().toLowerCase()}`;
    const cached = lookupFaqCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }

    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2).slice(0, 5);
    const faqWhere = words.length > 0
      ? {
          OR: words.flatMap((word) => [
            { question: { contains: word, mode: "insensitive" as const } },
            { answer: { contains: word, mode: "insensitive" as const } },
          ]),
        }
      : {};
    const productWhere = words.length > 0
      ? {
          OR: words.flatMap((word) => [
            { name: { contains: word, mode: "insensitive" as const } },
            { brand: { contains: word, mode: "insensitive" as const } },
            { description: { contains: word, mode: "insensitive" as const } },
          ]),
          stock: { gt: 0 },
        }
      : { stock: { gt: 0 } };

    const [faqCandidates, productCandidates] = await Promise.all([
      withRetry(
      () => prisma.faqEntry.findMany({
        where: faqWhere,
        select: { id: true, question: true, answer: true },
        take: 10,
      }),
      getDefaultRetryConfig()
      ),
      withRetry(
        () => prisma.product.findMany({
          where: productWhere,
          select: { id: true, name: true, brand: true, description: true, priceCents: true },
          take: 10,
        }),
        getDefaultRetryConfig()
      ),
    ]);

    const scoreMatch = (source: string) => {
      return words.reduce((n, w) => source.toLowerCase().includes(w) ? n + 1 : n, 0);
    };

    const rankedFaq = faqCandidates
      .map((faq) => ({ faq, score: scoreMatch(`${faq.question} ${faq.answer}`) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const rankedProducts = productCandidates
      .map((p) => ({ p, score: scoreMatch(`${p.name} ${p.brand} ${p.description}`) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const resultData = {
      faq: rankedFaq.map((x) => ({ question: x.faq.question, answer: x.faq.answer })),
      products: rankedProducts.map((x) => ({
        name: x.p.name,
        brand: x.p.brand,
        priceCents: x.p.priceCents,
        description: x.p.description,
      })),
    };

    // Validate output shape
    LookupFaqResultSchema.parse(resultData);

    const result: ToolResult = {
      success: true,
      data: resultData,
    };

    // Cache successful result
    lookupFaqCache.set(cacheKey, { data: result, expires: Date.now() + FAQ_CACHE_TTL });

    return result;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: `Parámetros inválidos: ${error.issues.map(i => i.message).join(", ")}` };
    }
    return { success: false, error: `Error consultando FAQ: ${error instanceof Error ? error.message : "desconocido"}` };
  }
}

export async function executeGetOrderStatus(params: Record<string, unknown>): Promise<ToolResult> {
  try {
    const { email } = getOrderStatusParamsSchema.parse(params);

    const emailToUse = email?.trim();
    if (!emailToUse) {
      return { success: false, error: "Se requiere email para consultar pedidos" };
    }

    // Use retry for database operations
    const orders = await withRetry(
      () => prisma.order.findMany({
        where: { customerEmail: emailToUse },
        select: {
          id: true,
          status: true,
          totalCents: true,
          createdAt: true,
          items: {
            select: {
              quantity: true,
              priceCents: true,
              product: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      getDefaultRetryConfig()
    );

    if (orders.length === 0) {
      const emptyResult = { orders: [], email: emailToUse };
      GetOrderStatusResultSchema.parse(emptyResult);
      return { success: true, data: emptyResult };
    }

    const ORDER_STATUS_LABEL: Record<string, string> = {
      PENDING: "⏳ Pendiente de pago",
      PAID: "✅ Pagado / en preparación",
      FAILED: "❌ Pago fallido",
      REFUNDED: "↩️ Reembolsado",
    };

    const resultData = {
      email: emailToUse,
      orders: orders.map((o) => ({
        id: o.id,
        status: ORDER_STATUS_LABEL[o.status] ?? o.status,
        total: `${(o.totalCents / 100).toFixed(2)}€`,
        date: o.createdAt.toLocaleDateString("es-ES"),
        items: o.items.map((i) => `${i.product.name} ×${i.quantity}`),
      })),
    };

    // Validate output shape
    GetOrderStatusResultSchema.parse(resultData);

    return {
      success: true,
      data: resultData,
    };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: `Parámetros inválidos: ${error.issues.map(i => i.message).join(", ")}` };
    }
    return { success: false, error: `Error consultando pedidos: ${error instanceof Error ? error.message : "desconocido"}` };
  }
}

export function executeGetCartContents(context: AgentContext): ToolResult {
  const cart = context.cart ?? [];
  const resultData = {
    cart: cart.map(item => ({
      productId: item.productId,
      name: item.name,
      priceCents: item.priceCents,
      quantity: item.quantity,
    })),
    totalCents: cart.reduce((sum, i) => sum + i.quantity * i.priceCents, 0),
    itemCount: cart.reduce((sum, i) => sum + i.quantity, 0),
  };
  GetCartContentsResultSchema.parse(resultData);
  return {
    success: true,
    data: resultData,
  };
}

export function executeGetCurrentPageContext(context: AgentContext): ToolResult {
  const resultData = {
    page: context.currentPage,
    productId: context.currentProductId,
  };
  GetCurrentPageContextResultSchema.parse(resultData);
  return {
    success: true,
    data: resultData,
  };
}

export async function executeNavigateToPage(params: Record<string, unknown>): Promise<ToolResult> {
  try {
    const validated = navigateToPageParamsSchema.parse(params);
    return {
      success: true,
      data: {
        path: validated.path,
        buildIds: validated.buildIds,
      },
    };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: `Parámetros inválidos: ${error.issues.map(i => i.message).join(", ")}` };
    }
    return { success: false, error: `Error navegando: ${error instanceof Error ? error.message : "desconocido"}` };
  }
}

// ----------------------
// Index de exportaciones
// ----------------------

export const BASIC_TOOLS = [
  lookupFaqTool,
  getOrderStatusTool,
  getCartContentsTool,
  getCurrentPageContextTool,
  navigateToPageTool,
];

export const BASIC_TOOL_EXECUTORS = {
  lookup_faq: executeLookupFaq,
  get_order_status: executeGetOrderStatus,
  get_cart_contents: (_params: Record<string, never>, context?: AgentContext) =>
    executeGetCartContents(context ?? ({} as AgentContext)),
  get_current_page_context: (_params: Record<string, never>, context?: AgentContext) =>
    executeGetCurrentPageContext(context ?? ({} as AgentContext)),
  navigate_to_page: executeNavigateToPage,
};
