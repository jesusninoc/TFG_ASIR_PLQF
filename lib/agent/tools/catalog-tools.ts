/**
 * Herramientas de búsqueda de catálogo
 */

import { z } from "zod";
import type { Product } from "@/lib/types";
import { dbProductsToTypes } from "@/lib/db-to-types";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { ComponentType } from "@/lib/types";
import type { ToolDefinition, ToolResult, CatalogProduct } from "../types";
import { withRetry, getDefaultRetryConfig } from "../retry";

// ─── Output schemas for validation ───────────────────────────────────────
const SearchCatalogResultSchema = z.object({
  products: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      brand: z.string(),
      priceCents: z.number(),
      type: z.string(),
      image: z.string().optional(),
      specs: z.array(z.string()),
      productLink: z.string(),
    })
  ),
  total: z.number(),
  query: z.string().optional(),
  brand: z.string().optional(),
  maxPriceCents: z.number().optional(),
});

// ─── Simple in-memory cache for tool results ───────────────────────────────────────
const searchCatalogCache = new Map<string, { data: ToolResult; expires: number }>();
const SEARCH_CACHE_TTL = 60000; // 1 minute


// Zod validation schema (internal use)
export const searchCatalogValidationSchema = z.object({
  componentType: z.enum(["cpu", "gpu", "memory", "storage", "motherboard", "psu", "case"]),
  brand: z.string().optional(),
  maxPriceCents: z.number().positive().optional(),
  minPriceCents: z.number().nonnegative().optional(),
  limit: z.number().int().positive().max(50).default(12),
});

// OpenAI tool definition (plain JSON schema)
export const searchCatalogTool: ToolDefinition = {
  name: "search_catalog",
  description:
    "Busca productos en el catálogo de componentes para PC. " +
    "Puedes filtrar por tipo (cpu, gpu, memory, storage, motherboard, psu, case), marca, rango de precios y límite de resultados.",
  parameters: {
    type: "object",
    properties: {
      componentType: {
        type: "string",
        enum: ["cpu", "gpu", "memory", "storage", "motherboard", "psu", "case"],
        description: "Tipo de componente a buscar",
      },
      brand: {
        type: "string",
        description: "Marca específica (ej: Intel, NVIDIA, AMD, Corsair, etc.)",
      },
      maxPriceCents: {
        type: "number",
        description: "Precio máximo en céntimos",
        minimum: 0,
      },
      minPriceCents: {
        type: "number",
        description: "Precio mínimo en céntimos",
        minimum: 0,
      },
      limit: {
        type: "number",
        description: "Número máximo de resultados",
        minimum: 1,
        maximum: 50,
        default: 12,
      },
    },
    required: ["componentType"],
  },
};

// ----------------------
// Helper para obtener specs de un producto
// ----------------------

function getComponentSpecs(product: Product): string[] {
  switch (product.type) {
    case "cpu": {
      const specs: string[] = [];
      specs.push(`${product.cores}C/${product.threads}T`);
      specs.push(`${product.tdpWatts}W TDP`);
      if (product.socket) specs.push(`Socket: ${product.socket}`);
      return specs;
    }
    case "motherboard": {
      const specs: string[] = [];
      if (product.socket) specs.push(`Socket: ${product.socket}`);
      specs.push(`Formato: ${product.formFactor}`);
      specs.push(`RAM: ${product.memoryType}`);
      specs.push(`Hasta ${product.maxMemoryGb}GB RAM`);
      if (product.m2Slots) specs.push(`${product.m2Slots} ranuras M.2`);
      if (product.sataPorts) specs.push(`${product.sataPorts} puertos SATA`);
      return specs;
    }
    case "memory": {
      const specs: string[] = [];
      specs.push(`${product.memoryType} ${product.speedMhz}MHz`);
      specs.push(`${product.capacityGb}GB`);
      if (product.modules) specs.push(`${product.modules} módulos`);
      return specs;
    }
    case "storage": {
      const specs: string[] = [];
      if (product.interface === "M2_NVME") {
        specs.push("NVMe M.2");
      } else {
        specs.push(product.interface);
      }
      const cap = product.capacityGb >= 1000
        ? `${product.capacityGb / 1000} TB`
        : `${product.capacityGb} GB`;
      specs.push(cap);
      return specs;
    }
    case "gpu": {
      const specs: string[] = [];
      specs.push(`${product.vramGb} GB VRAM`);
      specs.push(`${product.tdpWatts}W TDP`);
      return specs;
    }
    case "psu": {
      const specs: string[] = [];
      specs.push(`${product.wattage}W`);
      specs.push(product.efficiency);
      return specs;
    }
    case "case":
      return product.supportedFormFactors || [];
    default:
      return [];
  }
}

// ----------------------
// Ejecutor de búsqueda de catálogo
// ----------------------

export async function executeSearchCatalog(params: Record<string, unknown>): Promise<ToolResult> {
  try {
    // Parsear y validar parámetros
    const validated = searchCatalogValidationSchema.parse(params);
    const cacheKey = `searchCatalog:${JSON.stringify(validated)}`;
    const cached = searchCatalogCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }

    // Mapear tipo de componente a valor de Prisma (uppercase)
    const componentTypeMap = {
      cpu: "CPU",
      gpu: "GPU",
      memory: "MEMORY",
      storage: "STORAGE",
      motherboard: "MOTHERBOARD",
      psu: "PSU",
      case: "CASE",
    } as const;
    const componentType = componentTypeMap[validated.componentType];

    // Construir query de Prisma
    const where: Prisma.ProductWhereInput = {
      componentType,
      stock: { gt: 0 },
    };

    if (validated.brand) {
      where.brand = { contains: validated.brand, mode: "insensitive" as const };
    }

    if (validated.minPriceCents !== undefined || validated.maxPriceCents !== undefined) {
      where.priceCents = {};
      if (validated.minPriceCents !== undefined) {
        where.priceCents.gte = validated.minPriceCents;
      }
      if (validated.maxPriceCents !== undefined) {
        where.priceCents.lte = validated.maxPriceCents;
      }
    }

    // Fetch productos (with retry for transient DB errors)
    const productsRaw = await withRetry(
      () => prisma.product.findMany({
        where,
        include: {
          cpuSpec: true,
          motherboardSpec: true,
          memorySpec: true,
          storageSpec: true,
          gpuSpec: true,
          psuSpec: true,
          caseSpec: true,
        },
        orderBy: { priceCents: "asc" },
        take: validated.limit,
      }),
      getDefaultRetryConfig()
    );

    const products: Product[] = dbProductsToTypes(productsRaw);

    // Formatear resultados
    const converted: CatalogProduct[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      priceCents: p.priceCents,
      type: p.type.toLowerCase() as ComponentType,
      image: p.image,
      specs: getComponentSpecs(p),
      productLink: `/product/${p.slug}`,
    }));

    const result: ToolResult = {
      success: true,
      data: {
        products: converted,
        total: converted.length,
        query: validated.componentType,
        brand: validated.brand,
        maxPriceCents: validated.maxPriceCents,
      },
    };

    // Validate output shape
    SearchCatalogResultSchema.parse(result.data);

    // Cache successful result
    searchCatalogCache.set(cacheKey, { data: result, expires: Date.now() + SEARCH_CACHE_TTL });

    return result;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: `Parámetros inválidos: ${error.issues.map(i => i.message).join(", ")}` };
    }
    return { success: false, error: `Error buscando en catálogo: ${error instanceof Error ? error.message : "desconocido"}` };
  }
}
