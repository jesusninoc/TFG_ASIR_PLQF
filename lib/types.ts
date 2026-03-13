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