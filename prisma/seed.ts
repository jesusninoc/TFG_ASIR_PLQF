/**
 * prisma/seed.ts
 * Popula la base de datos con todos los productos del catálogo estático.
 * Ejecutar con:  npx prisma db seed
 */

import { PrismaClient, FormFactor, PsuEfficiency } from "@prisma/client";
import { products, faqEntries } from "../lib/catalog";
import type {
  CpuProduct,
  MotherboardProduct,
  MemoryProduct,
  StorageProduct,
  GpuProduct,
  PsuProduct,
  CaseProduct,
} from "../lib/types";

const prisma = new PrismaClient();

// ─── Helpers de conversión ────────────────────────────────────────────────────

function toDbFormFactor(ff: string): FormFactor {
  const map: Record<string, FormFactor> = {
    "Mini-ITX": FormFactor.MINI_ITX,
    mATX: FormFactor.MATX,
    ATX: FormFactor.ATX,
    "E-ATX": FormFactor.E_ATX,
    "XL-ATX": FormFactor.XL_ATX,
  };
  const result = map[ff];
  if (!result) throw new Error(`FormFactor desconocido: ${ff}`);
  return result;
}

function toDbEfficiency(e: string): PsuEfficiency {
  const map: Record<string, PsuEfficiency> = {
    "80+ Bronze": PsuEfficiency.BRONZE_80PLUS,
    "80+ Gold": PsuEfficiency.GOLD_80PLUS,
    "80+ Platinum": PsuEfficiency.PLATINUM_80PLUS,
  };
  const result = map[e];
  if (!result) throw new Error(`PsuEfficiency desconocida: ${e}`);
  return result;
}

// ─── Seed principal ───────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Iniciando seed…");

  // Limpia en orden correcto (FK)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.cpuSpec.deleteMany();
  await prisma.motherboardSpec.deleteMany();
  await prisma.memorySpec.deleteMany();
  await prisma.storageSpec.deleteMany();
  await prisma.gpuSpec.deleteMany();
  await prisma.psuSpec.deleteMany();
  await prisma.caseSpec.deleteMany();
  await prisma.product.deleteMany();
  await prisma.faqEntry.deleteMany();

  console.log("🗑️   Tablas vaciadas");

  // ── Productos ────────────────────────────────────────────────
  for (const product of products) {
    const base = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      description: product.description,
      image: product.image,
      priceCents: product.priceCents,
      stock: 99, // stock demo
    };

    switch (product.type) {
      case "cpu": {
        const p = product as CpuProduct;
        await prisma.product.create({
          data: {
            ...base,
            componentType: "CPU",
            cpuSpec: {
              create: {
                socket: p.socket,
                cores: p.cores,
                threads: p.threads,
                tdpWatts: p.tdpWatts,
              },
            },
          },
        });
        break;
      }

      case "motherboard": {
        const p = product as MotherboardProduct;
        await prisma.product.create({
          data: {
            ...base,
            componentType: "MOTHERBOARD",
            motherboardSpec: {
              create: {
                socket: p.socket,
                formFactor: toDbFormFactor(p.formFactor),
                memoryType: p.memoryType,
                maxMemoryGb: p.maxMemoryGb,
                m2Slots: p.m2Slots,
                sataPorts: p.sataPorts,
              },
            },
          },
        });
        break;
      }

      case "memory": {
        const p = product as MemoryProduct;
        await prisma.product.create({
          data: {
            ...base,
            componentType: "MEMORY",
            memorySpec: {
              create: {
                memoryType: p.memoryType,
                speedMhz: p.speedMhz,
                capacityGb: p.capacityGb,
                modules: p.modules,
              },
            },
          },
        });
        break;
      }

      case "storage": {
        const p = product as StorageProduct;
        await prisma.product.create({
          data: {
            ...base,
            componentType: "STORAGE",
            storageSpec: {
              create: {
                interface: p.interface,
                capacityGb: p.capacityGb,
              },
            },
          },
        });
        break;
      }

      case "gpu": {
        const p = product as GpuProduct;
        await prisma.product.create({
          data: {
            ...base,
            componentType: "GPU",
            gpuSpec: {
              create: {
                vramGb: p.vramGb,
                tdpWatts: p.tdpWatts,
              },
            },
          },
        });
        break;
      }

      case "psu": {
        const p = product as PsuProduct;
        await prisma.product.create({
          data: {
            ...base,
            componentType: "PSU",
            psuSpec: {
              create: {
                wattage: p.wattage,
                efficiency: toDbEfficiency(p.efficiency),
              },
            },
          },
        });
        break;
      }

      case "case": {
        const p = product as CaseProduct;
        await prisma.product.create({
          data: {
            ...base,
            componentType: "CASE",
            caseSpec: {
              create: {
                supportedFormFactors: p.supportedFormFactors.map(toDbFormFactor),
              },
            },
          },
        });
        break;
      }
    }
  }

  console.log(`✅  ${products.length} productos insertados`);

  // ── FAQ ──────────────────────────────────────────────────────
  for (const entry of faqEntries) {
    await prisma.faqEntry.create({
      data: { id: entry.id, question: entry.question, answer: entry.answer },
    });
  }

  console.log(`✅  ${faqEntries.length} entradas FAQ insertadas`);
  console.log("🎉  Seed completado");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
