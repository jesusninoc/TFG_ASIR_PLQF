/**
 * Tipos base compartidos para la arquitectura de agentes
 * NOTA: Se usan nombres distintos para evitar colisión con `@/lib/types.AgentResponse`
 */

import type { BuildIds, PartialSelection, BuildMessage, PersonalityType } from "@/lib/types";

// ----------------------
// Tipos de agente
// ----------------------

export type AgentType =
  | "coordinator"
  | "build"
  | "catalog"
  | "faq"
  | "order"
  | "context"
  | "general"
  | "unknown"
  | "navigate";

export interface AgentContext {
  currentPage: string;
  currentProductId?: string;
  cart?: CartItem[];
  // Campos enriquecidos por ContextAgent (opcional)
  cartSummary?: {
    itemCount: number;
    totalCents: number;
    itemTypes: string[];
  };
  currentPageInfo?: {
    page: string;
    productId?: string;
    title?: string;
  };
}

export interface CartItem {
  productId: string;
  quantity: number;
  priceCents: number;
  name: string;
  type: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface AgentParams {
  question: string;
  history: Message[];
  context: AgentContext;
  personality: PersonalityType;
  resolvedContext?: ResolvedContext;
}

export interface ResolvedContext {
  pageContext?: { page: string; productId?: string };
  cartContents?: CartData;
}

export interface CartData {
  cart: CartItem[];
  totalCents: number;
  itemCount: number;
}

// ----------------------
// Interfaz principal IAgent
// ----------------------

export interface IAgent {
  execute(params: AgentParams): Promise<SpecialistResponse>;
  getType(): AgentType;
  getTools(): ToolDefinition[];
}

// ----------------------
// Respuesta especializada (interna)
// ----------------------

export interface SpecialistResponse {
  type: AgentType;
  data: SpecialistResponseData;
  confidence: number;
  sources?: Source[];
  suggestions?: string[];
  metadata?: Record<string, unknown>;
}

export type SpecialistResponseData =
  | BuildResponseData
  | CatalogResponseData
  | FaqResponseData
  | OrderResponseData
  | ContextResponseData
  | GeneralResponseData
  | UnknownResponseData
  | NavigateResponseData;

// Respuestas específicas por tipo

export interface BuildResponseData {
  builds?: BuildMessage[];
  answer: string;
  builderPayload?: {
    fullBuildIds?: BuildIds;
    partialSelection?: PartialSelection;
  };
  warnings?: string[];
  recommendations?: string[];
}

export interface CatalogResponseData {
  products: CatalogProduct[];
  total: number;
  query: string;
  totalPriceCents?: number;
  answer?: string; // optional, used by legacy conversion
}

export interface CatalogProduct {
  id: string;
  name: string;
  brand: string;
  priceCents: number;
  type: string;
  image?: string;
  specs: string[];
  productLink: string;
  reasoning?: string;
}

export interface FaqResponseData {
  response: string;
  faq?: Array<{ question: string; answer: string }>;
  sources?: Source[];
}

export interface OrderResponseData {
  response: string;
  orders?: Array<{
    id: string;
    status: string;
    total: string;
    date: string;
    items: string[];
  }>;
  email?: string;
}

export interface ContextResponseData {
  cartSummary?: {
    itemCount: number;
    totalCents: number;
    itemTypes: string[];
  };
  currentPageInfo?: {
    page: string;
    productId?: string;
    title?: string;
  };
  relatedProducts?: CatalogProduct[];
}

export interface GeneralResponseData {
  response: string;
  topic?: string;
}

export interface UnknownResponseData {
  response: string;
  suggestedQuestions?: string[];
}

export interface NavigateResponseData {
  path: string;
  buildIds?: BuildIds;
}

// ----------------------
// Fuentes y referencias
// ----------------------

export interface Source {
  id: string;
  title: string;
  snippet: string;
  url?: string;
}

// ----------------------
// Herramientas (Tools)
// ----------------------

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // plain JSON schema for OpenAI function calling
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ----------------------
// Clasificación de intención
// ----------------------

export interface IntentClassification {
  agent: AgentType;
  confidence: number;
  parameters: Record<string, unknown>;
  reasoning?: string;
}

export interface IIntentClassifier {
  classify(
    question: string,
    history: Message[],
    context: AgentContext
  ): Promise<IntentClassification>;
}

// ----------------------
// Logger
// ----------------------

export interface AgentLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
  debug?(message: string, meta?: Record<string, unknown>): void;
}

// ----------------------
// Re-exports
// ----------------------

export type { PersonalityType } from "@/lib/types";
