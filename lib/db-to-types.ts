/**
 * lib/db-to-types.ts
 * Convierte los registros de Prisma (con sus specs incluidas) a los tipos
 * del dominio definidos en lib/types.ts, que usa toda la UI.
 */

import {
  Product as PrismaProduct,
  CpuSpec,
  MotherboardSpec,
  MemorySpec,
  StorageSpec,
  GpuSpec,
  PsuSpec,
  CaseSpec,
  FormFactor as PrismaFormFactor,
  PsuEfficiency,
} from "@prisma/client";

import type {
  Product,
  CpuProduct,
  MotherboardProduct,
  MemoryProduct,
  StorageProduct,
  GpuProduct,
  PsuProduct,
  CaseProduct,
  FormFactor,
  MemoryType,
  StorageInterface,
} from "@/lib/types";

// ─── Enum converters ──────────────────────────────────────────────────────────

function toFormFactor(ff: PrismaFormFactor): FormFactor {
  const map: Record<PrismaFormFactor, FormFactor> = {
    MINI_ITX: "Mini-ITX",
    MATX: "mATX",
    ATX: "ATX",
    E_ATX: "E-ATX",
    XL_ATX: "XL-ATX",
  };
  return map[ff];
}

function toEfficiency(e: PsuEfficiency): PsuProduct["efficiency"] {
  const map: Record<PsuEfficiency, PsuProduct["efficiency"]> = {
    BRONZE_80PLUS: "80+ Bronze",
    GOLD_80PLUS: "80+ Gold",
    PLATINUM_80PLUS: "80+ Platinum",
  };
  return map[e];
}

// ─── Full product type with all relations ─────────────────────────────────────

type PrismaProductFull = PrismaProduct & {
  cpuSpec:         CpuSpec         | null;
  motherboardSpec: MotherboardSpec | null;
  memorySpec:      MemorySpec      | null;
  storageSpec:     StorageSpec     | null;
  gpuSpec:         GpuSpec         | null;
  psuSpec:         PsuSpec         | null;
  caseSpec:        CaseSpec        | null;
};

// ─── Main converter ───────────────────────────────────────────────────────────

export function dbProductToType(p: PrismaProductFull): Product | null {
  const base = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    description: p.description,
    image: p.image,
    priceCents: p.priceCents,
  };

  switch (p.componentType) {
    case "CPU": {
      if (!p.cpuSpec) return null;
      const result: CpuProduct = {
        ...base,
        type: "cpu",
        socket: p.cpuSpec.socket,
        cores: p.cpuSpec.cores,
        threads: p.cpuSpec.threads,
        tdpWatts: p.cpuSpec.tdpWatts,
      };
      return result;
    }

    case "MOTHERBOARD": {
      if (!p.motherboardSpec) return null;
      const result: MotherboardProduct = {
        ...base,
        type: "motherboard",
        socket: p.motherboardSpec.socket,
        formFactor: toFormFactor(p.motherboardSpec.formFactor),
        memoryType: p.motherboardSpec.memoryType as MemoryType,
        maxMemoryGb: p.motherboardSpec.maxMemoryGb,
        m2Slots: p.motherboardSpec.m2Slots,
        sataPorts: p.motherboardSpec.sataPorts,
      };
      return result;
    }

    case "MEMORY": {
      if (!p.memorySpec) return null;
      const result: MemoryProduct = {
        ...base,
        type: "memory",
        memoryType: p.memorySpec.memoryType as MemoryType,
        speedMhz: p.memorySpec.speedMhz,
        capacityGb: p.memorySpec.capacityGb,
        modules: p.memorySpec.modules,
      };
      return result;
    }

    case "STORAGE": {
      if (!p.storageSpec) return null;
      const result: StorageProduct = {
        ...base,
        type: "storage",
        interface: p.storageSpec.interface as StorageInterface,
        capacityGb: p.storageSpec.capacityGb,
      };
      return result;
    }

    case "GPU": {
      if (!p.gpuSpec) return null;
      const result: GpuProduct = {
        ...base,
        type: "gpu",
        vramGb: p.gpuSpec.vramGb,
        tdpWatts: p.gpuSpec.tdpWatts,
      };
      return result;
    }

    case "PSU": {
      if (!p.psuSpec) return null;
      const result: PsuProduct = {
        ...base,
        type: "psu",
        wattage: p.psuSpec.wattage,
        efficiency: toEfficiency(p.psuSpec.efficiency),
      };
      return result;
    }

    case "CASE": {
      if (!p.caseSpec) return null;
      const result: CaseProduct = {
        ...base,
        type: "case",
        supportedFormFactors: p.caseSpec.supportedFormFactors.map(toFormFactor),
      };
      return result;
    }

    default:
      return null;
  }
}

export function dbProductsToTypes(products: PrismaProductFull[]): Product[] {
  return products.flatMap((p) => {
    const converted = dbProductToType(p);
    return converted ? [converted] : [];
  });
}
