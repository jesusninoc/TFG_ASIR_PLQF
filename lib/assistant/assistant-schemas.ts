import { z } from "zod";
import type { AgentResponse } from "@/lib/types";

const ComponentTypeSchema = z.enum(["cpu", "motherboard", "memory", "storage", "gpu", "psu", "case"]);
const MemoryTypeSchema = z.enum(["DDR4", "DDR5"]);
const StorageInterfaceSchema = z.enum(["M2_NVME", "SATA"]);
const FormFactorSchema = z.enum(["Mini-ITX", "mATX", "ATX", "E-ATX", "XL-ATX"]);

const MessageTypeSchema = z.enum([
  "clarify",
  "faq",
  "catalog",
  "components",
  "build",
  "unknown",
  "order_status",
  "escalate",
]);

const ComponentRecommendationSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  priceCents: z.number(),
  componentType: z.enum(["cpu", "motherboard", "memory", "storage", "gpu", "psu", "case"]),
  brand: z.string(),
  keySpecs: z.array(z.string()),
  reasoning: z.string(),
  productLink: z.string(),
  compatibilityNote: z.string().optional(),
});

const BaseProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  brand: z.string(),
  priceCents: z.number(),
  image: z.string(),
  description: z.string(),
  type: ComponentTypeSchema,
});

const ProductSchema = z.discriminatedUnion("type", [
  BaseProductSchema.extend({
    type: z.literal("cpu"),
    socket: z.string(),
    cores: z.number(),
    threads: z.number(),
    tdpWatts: z.number(),
  }),
  BaseProductSchema.extend({
    type: z.literal("motherboard"),
    socket: z.string(),
    formFactor: FormFactorSchema,
    memoryType: MemoryTypeSchema,
    maxMemoryGb: z.number(),
    m2Slots: z.number(),
    sataPorts: z.number(),
  }),
  BaseProductSchema.extend({
    type: z.literal("memory"),
    memoryType: MemoryTypeSchema,
    speedMhz: z.number(),
    capacityGb: z.number(),
    modules: z.number(),
  }),
  BaseProductSchema.extend({
    type: z.literal("storage"),
    interface: StorageInterfaceSchema,
    capacityGb: z.number(),
  }),
  BaseProductSchema.extend({
    type: z.literal("gpu"),
    vramGb: z.number(),
    tdpWatts: z.number(),
  }),
  BaseProductSchema.extend({
    type: z.literal("psu"),
    wattage: z.number(),
    efficiency: z.enum(["80+ Bronze", "80+ Gold", "80+ Platinum"]),
  }),
  BaseProductSchema.extend({
    type: z.literal("case"),
    supportedFormFactors: z.array(FormFactorSchema),
  }),
]);

const BuildIdsSchema = z.object({
  cpu: z.string().optional(),
  gpu: z.string().optional(),
  motherboard: z.string().optional(),
  memory: z.string().optional(),
  storage: z.string().optional(),
  psu: z.string().optional(),
  case: z.string().optional(),
});

const BuildMessageSchema = z.object({
  tier: z.enum(["budget", "mid", "premium"]),
  answer: z.string(),
  totalPriceCents: z.number(),
  buildIds: BuildIdsSchema,
  componentRecommendations: z.array(ComponentRecommendationSchema).optional(),
});

export const AssistantFinalResponseSchema = z.object({
  answer: z.string().trim().min(1),
  references: z.array(z.string()).default([]),
  messageType: MessageTypeSchema,
  components: z.array(ComponentRecommendationSchema).optional(),
  builds: z.array(BuildMessageSchema).optional(),
  catalogResults: z.array(ProductSchema).optional(),
  clarifyQuestion: z.string().optional(),
  orderData: z.unknown().optional(),
  builderPayload: z
    .object({
      fullBuildIds: BuildIdsSchema.optional(),
      partialSelection: BuildIdsSchema.optional(),
    })
    .optional(),
  navigation: z
    .object({
      path: z.string(),
      buildIds: BuildIdsSchema.optional(),
    })
    .optional(),
});

export type AssistantFinalResponse = z.infer<typeof AssistantFinalResponseSchema>;

export function normalizeAssistantResponse(raw: unknown): AgentResponse {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) {
      return {
        answer: "No pude preparar una respuesta completa. ¿Puedes reformular tu pregunta?",
        references: [],
        messageType: "unknown",
      };
    }

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return normalizeAssistantResponse(parsed);
    } catch {
      return {
        answer: trimmed,
        references: [],
        messageType: "unknown",
      };
    }
  }

  const parsed = AssistantFinalResponseSchema.safeParse(raw);
  if (parsed.success) {
    return parsed.data as AgentResponse;
  }

  return {
    answer: "No pude preparar una respuesta completa. ¿Puedes reformular tu pregunta?",
    references: [],
    messageType: "unknown",
  };
}
