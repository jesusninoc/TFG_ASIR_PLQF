/**
 * Herramientas relacionadas con generación de builds
 */

import { z } from "zod";
import { generateBuilds } from "@/lib/build-engine";
import { formatPrice } from "@/lib/compatibility";
import type { BuildMessage, ComponentRecommendation, Product, BuildIds, BuildFilters } from "@/lib/types";
import type { ToolDefinition, ToolResult } from "../types";
import { getMetricsCollector } from "../metrics";

// Output schema for generate_build
const GenerateBuildResultSchema = z.object({
  builds: z.array(
    z.object({
      tier: z.enum(["budget", "mid", "premium"]),
      answer: z.string(),
      totalPriceCents: z.number(),
      buildIds: z.object({
        cpu: z.string().optional(),
        gpu: z.string().optional(),
        memory: z.string().optional(),
        storage: z.string().optional(),
        motherboard: z.string().optional(),
        psu: z.string().optional(),
        case: z.string().optional(),
      }),
      componentRecommendations: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          image: z.string(),
          priceCents: z.number(),
          componentType: z.string(),
          brand: z.string(),
          keySpecs: z.array(z.string()),
          reasoning: z.string(),
          productLink: z.string(),
        })
      ),
    })
  ),
  answer: z.string(),
});

// ----------------------
// Validation Schema (Zod - internal use only)
// ----------------------

export const generateBuildValidationSchema = z.object({
  budgetCents: z.number().positive().describe("Presupuesto total en céntimos de euro (ej: 1500€ = 150000"),
  useCase: z.enum(["gaming", "workstation_gpu", "workstation_cpu", "office"]).optional().describe("Tipo de uso del PC"),
  preferBrands: z
    .object({
      cpu: z.array(z.string()).optional(),
      gpu: z.array(z.string()).optional(),
      ram: z.array(z.string()).optional(),
      storage: z.array(z.string()).optional(),
      motherboard: z.array(z.string()).optional(),
      psu: z.array(z.string()).optional(),
      case: z.array(z.string()).optional(),
    })
    .optional()
    .describe("Marcas preferidas por componente"),
  excludeBrands: z
    .object({
      cpu: z.array(z.string()).optional(),
      gpu: z.array(z.string()).optional(),
      ram: z.array(z.string()).optional(),
      storage: z.array(z.string()).optional(),
      motherboard: z.array(z.string()).optional(),
      psu: z.array(z.string()).optional(),
      case: z.array(z.string()).optional(),
    })
    .optional()
    .describe("Marcas a excluir"),
  minSpecs: z
    .object({
      cpuCores: z.number().optional(),
      gpuVramGb: z.number().optional(),
      memoryGb: z.number().optional(),
      storageGb: z.number().optional(),
    })
    .optional()
    .describe("Especificaciones mínimas"),
  requireDedicatedGpu: z.boolean().optional().describe("Si es true, requiere tarjeta gráfica dedicada"),
  preferFormFactor: z.enum(["Mini-ITX", "mATX", "ATX", "E-ATX", "XL-ATX"]).optional().describe("Factor de forma preferido para placa base"),
  lockedComponents: z
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
    .describe("IDs de componentes fijados (forzar uso)"),
  maxPriceCents: z.number().positive().optional().describe("Precio máximo"),
  includePeripheral: z.boolean().optional().describe("Incluir periféricos"),
});

// ----------------------
// OpenAI Tool Definition (plain JSON schema)
// ----------------------

export const generateBuildTool: ToolDefinition = {
  name: "generate_build",
  description:
    "Genera o actualiza una configuración de PC completa (build) basada en presupuesto y tipo de uso. " +
    "Puede fijar componentes específicos usando lockedComponents (cpu, gpu, motherboard, memory, storage, psu, case). " +
    "Devuelve builds compatibles ordenadas por gama (budget, mid, premium).",
  parameters: {
    type: "object",
    properties: {
      budgetCents: {
        type: "number",
        description: "Presupuesto total en céntimos de euro (ej: 1500€ = 150000",
        minimum: 0,
      },
      useCase: {
        type: "string",
        enum: ["gaming", "workstation_gpu", "workstation_cpu", "office"],
        description: "Tipo de uso del PC",
      },
      preferBrands: {
        type: "object",
        properties: {
          cpu: { type: "array", items: { type: "string" } },
          gpu: { type: "array", items: { type: "string" } },
          ram: { type: "array", items: { type: "string" } },
          storage: { type: "array", items: { type: "string" } },
          motherboard: { type: "array", items: { type: "string" } },
          psu: { type: "array", items: { type: "string" } },
          case: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
      excludeBrands: {
        type: "object",
        properties: {
          cpu: { type: "array", items: { type: "string" } },
          gpu: { type: "array", items: { type: "string" } },
          ram: { type: "array", items: { type: "string" } },
          storage: { type: "array", items: { type: "string" } },
          motherboard: { type: "array", items: { type: "string" } },
          psu: { type: "array", items: { type: "string" } },
          case: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
      minSpecs: {
        type: "object",
        properties: {
          cpuCores: { type: "number" },
          gpuVramGb: { type: "number" },
          memoryGb: { type: "number" },
          storageGb: { type: "number" },
        },
        additionalProperties: false,
      },
      requireDedicatedGpu: {
        type: "boolean",
      },
      preferFormFactor: {
        type: "string",
        enum: ["Mini-ITX", "mATX", "ATX", "E-ATX", "XL-ATX"],
        description: "Factor de forma preferido para placa base",
      },
      lockedComponents: {
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
      },
      maxPriceCents: {
        type: "number",
        description: "Precio máximo",
        minimum: 0,
      },
      includePeripheral: {
        type: "boolean",
        description: "Incluir periféricos",
      },
    },
    required: ["budgetCents"],
  },
};

// ----------------------
// Helper para convertir resultados a ComponentRecommendation
// ----------------------

function getComponentSpecs(product: Product): string[] {
  switch (product.type) {
    case "cpu":
      return [`${product.socket}`, `${product.cores}C/${product.threads}T`, `${product.tdpWatts}W`];
    case "motherboard":
      return [`${product.socket}`, `${product.formFactor}`, `${product.memoryType}`, `${product.maxMemoryGb}GB max`];
    case "memory":
      return [`${product.memoryType}`, `${product.speedMhz} MHz`, `${product.capacityGb} GB`];
    case "storage":
      const cap = product.capacityGb >= 1000 ? `${product.capacityGb / 1000} TB` : `${product.capacityGb} GB`;
      return [product.interface === "M2_NVME" ? "NVMe M.2" : "SATA", cap];
    case "gpu":
      return [`${product.vramGb} GB VRAM`, `${product.tdpWatts}W`];
    case "psu":
      return [`${product.wattage}W`, product.efficiency];
    case "case":
      return product.supportedFormFactors || [];
    default:
      return [];
  }
}

// ----------------------
// Ejecutor de la herramienta
// ----------------------

export async function executeGenerateBuild(params: Record<string, unknown>): Promise<ToolResult> {
  const start = Date.now();
  let success = false;
  try {
    // Validar parámetros usando el schema (en runtime)
    const validated = generateBuildValidationSchema.parse(params);

    const filters: BuildFilters = {
      budgetCents: validated.budgetCents,
      useCase: validated.useCase,
      preferBrands: validated.preferBrands,
      excludeBrands: validated.excludeBrands,
      minSpecs: validated.minSpecs,
      requireDedicatedGpu: validated.requireDedicatedGpu,
      preferFormFactor: validated.preferFormFactor,
      lockedComponents: validated.lockedComponents,
    };

    // Importar generador en runtime (evita circular)
    const results = await generateBuilds(filters);

    if (results.length === 0) {
      return { success: false, error: "No se encontraron builds compatibles con esos filtros" };
    }

    // Convertir resultados a formato API
    const builds: BuildMessage[] = results.map((r) => {
      const buildIdEntries: [string, string][] = [];
      if (r.build.cpu?.id) buildIdEntries.push(["cpu", r.build.cpu.id]);
      if (r.build.gpu?.id) buildIdEntries.push(["gpu", r.build.gpu.id]);
      if (r.build.memory?.id) buildIdEntries.push(["memory", r.build.memory.id]);
      if (r.build.storage?.id) buildIdEntries.push(["storage", r.build.storage.id]);
      if (r.build.motherboard?.id) buildIdEntries.push(["motherboard", r.build.motherboard.id]);
      if (r.build.psu?.id) buildIdEntries.push(["psu", r.build.psu.id]);
      if (r.build.case?.id) buildIdEntries.push(["case", r.build.case.id]);
      const buildIds = Object.fromEntries(buildIdEntries) as BuildIds;

      const componentRecommendations: ComponentRecommendation[] = Object.values(r.build)
        .filter((comp): comp is Product => !!comp)
        .map((comp) => ({
          id: comp.id,
          name: comp.name,
          image: comp.image,
          priceCents: comp.priceCents,
          componentType: comp.type,
          brand: comp.brand,
          keySpecs: getComponentSpecs(comp),
          reasoning: `Seleccionado para la build ${r.tier}`,
          productLink: `/product/${comp.slug}`,
        }));

      const componentNames = Object.values(r.build)
        .filter((c): c is Product => !!c)
        .map((c) => c.name)
        .join(", ");

      const answer = `Build ${r.tier}: ${formatPrice(r.totalPriceCents)}. Incluye ${componentNames}.`;

      return {
        tier: r.tier,
        answer,
        totalPriceCents: r.totalPriceCents,
        buildIds,
        componentRecommendations,
      };
    });

    const answer = `Se han generado ${builds.length} builds compatibles.`;

    // Validate output shape
    const validatedData = GenerateBuildResultSchema.parse({
      builds,
      answer,
    });

    success = true;
    return {
      success: true,
      data: validatedData,
    };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: `Parámetros inválidos: ${error.issues.map(i => i.message).join(", ")}` };
    }
    return { success: false, error: `Error generando build: ${error instanceof Error ? error.message : "desconocido"}` };
  } finally {
    const duration = Date.now() - start;
    getMetricsCollector().recordDuration("tool_execution_ms", duration, { tool: "generate_build", status: success ? "success" : "error" });
    if (success) {
      getMetricsCollector().increment("tool_call_total", { tool: "generate_build" });
    } else {
      getMetricsCollector().increment("tool_call_error_total", { tool: "generate_build" });
    }
  }
}
