export type ComponentType =
  | "cpu"
  | "motherboard"
  | "memory"
  | "storage"
  | "gpu"
  | "psu"
  | "case";

export type MemoryType = "DDR4" | "DDR5";
export type StorageInterface = "M2_NVME" | "SATA";
export type FormFactor = "Mini-ITX" | "mATX" | "ATX" | "E-ATX" | "XL-ATX";

export interface BaseProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  priceCents: number;
  image: string;
  description: string;
  type: ComponentType;
}

export interface CpuProduct extends BaseProduct {
  type: "cpu";
  socket: string;
  cores: number;
  threads: number;
  tdpWatts: number;
}

export interface MotherboardProduct extends BaseProduct {
  type: "motherboard";
  socket: string;
  formFactor: FormFactor;
  memoryType: MemoryType;
  maxMemoryGb: number;
  m2Slots: number;
  sataPorts: number;
}

export interface MemoryProduct extends BaseProduct {
  type: "memory";
  memoryType: MemoryType;
  speedMhz: number;
  capacityGb: number;
  modules: number;
}

export interface StorageProduct extends BaseProduct {
  type: "storage";
  interface: StorageInterface;
  capacityGb: number;
}

export interface GpuProduct extends BaseProduct {
  type: "gpu";
  vramGb: number;
  tdpWatts: number;
}

export interface PsuProduct extends BaseProduct {
  type: "psu";
  wattage: number;
  efficiency: "80+ Bronze" | "80+ Gold" | "80+ Platinum";
}

export interface CaseProduct extends BaseProduct {
  type: "case";
  supportedFormFactors: FormFactor[];
}

export type Product =
  | CpuProduct
  | MotherboardProduct
  | MemoryProduct
  | StorageProduct
  | GpuProduct
  | PsuProduct
  | CaseProduct;

export interface PcBuildSelection {
  cpu?: CpuProduct;
  motherboard?: MotherboardProduct;
  memory?: MemoryProduct;
  storage?: StorageProduct;
  gpu?: GpuProduct;
  psu?: PsuProduct;
  case?: CaseProduct;
}

export interface CompatibilityCheck {
  label: string;
  ok: boolean;
  detail: string;
}

export interface CompatibilityReport {
  checks: CompatibilityCheck[];
  totalPriceCents: number;
  estimatedPowerWatts: number;
  isCompatible: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

// ─── Build Engine types ────────────────────────────────────────────────────────

export type UseCase =
  | "gaming"
  | "workstation_gpu"
  | "workstation_cpu"
  | "office";

export interface BrandFilters {
  cpu?: string[];
  gpu?: string[];
  ram?: string[];
  storage?: string[];
  motherboard?: string[];
  psu?: string[];
  case?: string[];
}

export interface MinSpecs {
  cpuCores?: number;
  gpuVramGb?: number;
  memoryGb?: number;
  storageGb?: number;
}

export interface BuildFilters {
  budgetCents: number;
  useCase?: UseCase;
  preferBrands?: BrandFilters;
  excludeBrands?: BrandFilters;
  minSpecs?: MinSpecs;
  requireDedicatedGpu?: boolean;
  preferFormFactor?: FormFactor;
  lockedComponents?: {
    cpu?: string;
    gpu?: string;
    motherboard?: string;
    memory?: string;
    storage?: string;
    psu?: string;
    case?: string;
  };
}

export type BuildTier = "budget" | "mid" | "premium";

export interface BuildResult {
  tier: BuildTier;
  build: PcBuildSelection;
  report: CompatibilityReport;
  totalPriceCents: number;
}

// ─── Intent Parser types ───────────────────────────────────────────────────────

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export type IntentType =
  | "build"
  | "clarify"
  | "faq"
  | "unknown"
  | "order_status"
  | "escalate"
  | "catalog_search";

export interface OrderQuery {
  email?: string;
}

export interface CatalogQuery {
  componentType?: string;
  brand?: string;
  maxPriceCents?: number;
  minPriceCents?: number;
}

export interface AssistantIntent {
  intent: IntentType;
  buildFilters?: BuildFilters;
  clarifyQuestion?: string;
  faqQuery?: string;
  orderQuery?: OrderQuery;
  catalogQuery?: CatalogQuery;
  recommendComponentQuery?: RecommendComponentQuery;
}

// ─── Agent System Types ─────────────────────────────────────────────────────────

export type PersonalityType = "educational";

export interface RecommendComponentQuery {
  componentType: ComponentType;
  criteria?: {
    budgetCents?: number;
    preferBrands?: string[];
    minSpecs?: Partial<MinSpecs>;
    useCase?: UseCase;
  };
}

export interface ComponentRecommendation {
  id: string;
  name: string;
  image: string;
  priceCents: number;
  componentType: ComponentType;
  brand: string;
  keySpecs: string[];
  reasoning: string;
  productLink: string;
  compatibilityNote?: string;
}

export type PartialSelection = Partial<Record<keyof PcBuildSelection, string>>;

export type BuildIds = PartialSelection;

export interface BuildMessage {
  tier: BuildTier;
  answer: string;
  totalPriceCents: number;
  buildIds: BuildIds;
  componentRecommendations?: ComponentRecommendation[];
}

export interface AgentResponse {
  answer: string;
  references: string[];
  messageType: "clarify" | "faq" | "catalog" | "components" | "build" | "unknown" | "order_status" | "escalate";
  components?: ComponentRecommendation[];
  builds?: BuildMessage[];
  catalogResults?: Product[];
  clarifyQuestion?: string;
  orderData?: unknown;
  builderPayload?: {
    fullBuildIds?: BuildIds;
    partialSelection?: PartialSelection;
  };
  // NUEVO: Campo para acciones de navegación automática
  navigation?: {
    path: string;
    buildIds?: BuildIds;
  };
}
