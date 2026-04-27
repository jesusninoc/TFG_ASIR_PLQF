/**
 * app/product/[slug]/page.tsx
 * Página de producto individual — datos desde PostgreSQL.
 */

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatPrice } from "@/lib/compatibility";
import { prisma } from "@/lib/prisma";
import { dbProductToType } from "@/lib/db-to-types";
import type { Product } from "@/lib/types";
import type {
  CpuProduct,
  MotherboardProduct,
  MemoryProduct,
  StorageProduct,
  GpuProduct,
  PsuProduct,
  CaseProduct,
} from "@/lib/types";

export const dynamic = "force-dynamic";

// ─── Static params para build estático ───────────────────────────────────────

export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({ select: { slug: true } });
    return products.map((p) => ({ slug: p.slug }));
  } catch (error) {
    console.warn("[product] Skipping static params; database unavailable at build time.", error);
    return [];
  }
}

// ─── Spec table helper ────────────────────────────────────────────────────────

function getSpecs(product: Product): [string, string][] {
  switch (product.type) {
    case "cpu": {
      const p = product as CpuProduct;
      return [
        ["Socket", p.socket],
        ["Núcleos", String(p.cores)],
        ["Hilos", String(p.threads)],
        ["TDP", `${p.tdpWatts}W`],
      ];
    }
    case "motherboard": {
      const p = product as MotherboardProduct;
      return [
        ["Socket", p.socket],
        ["Formato", p.formFactor],
        ["Memoria", p.memoryType],
        ["M.2", String(p.m2Slots)],
        ["SATA", String(p.sataPorts)],
      ];
    }
    case "memory": {
      const p = product as MemoryProduct;
      return [
        ["Tipo", p.memoryType],
        ["Frecuencia", `${p.speedMhz} MHz`],
        ["Capacidad", `${p.capacityGb} GB`],
        ["Módulos", String(p.modules)],
      ];
    }
    case "storage": {
      const p = product as StorageProduct;
      return [
        ["Interfaz", p.interface],
        ["Capacidad", `${p.capacityGb} GB`],
      ];
    }
    case "gpu": {
      const p = product as GpuProduct;
      return [
        ["VRAM", `${p.vramGb} GB`],
        ["TDP", `${p.tdpWatts}W`],
      ];
    }
    case "psu": {
      const p = product as PsuProduct;
      return [
        ["Potencia", `${p.wattage}W`],
        ["Eficiencia", p.efficiency],
      ];
    }
    case "case": {
      const p = product as CaseProduct;
      return [["Formatos soportados", p.supportedFormFactors.join(", ")]];
    }
    default:
      return [];
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const raw = await prisma.product.findUnique({
    where: { slug },
    include: {
      cpuSpec: true,
      motherboardSpec: true,
      memorySpec: true,
      storageSpec: true,
      gpuSpec: true,
      psuSpec: true,
      caseSpec: true,
    },
  });

  if (!raw) notFound();

  const product = dbProductToType(raw);
  if (!product) notFound();

  // Related products — same type, excluding self
  const relatedRaw = await prisma.product.findMany({
    where: { componentType: raw.componentType, id: { not: raw.id } },
    take: 3,
    include: {
      cpuSpec: true, motherboardSpec: true, memorySpec: true,
      storageSpec: true, gpuSpec: true, psuSpec: true, caseSpec: true,
    },
  });
  const related = relatedRaw.flatMap((r) => {
    const c = dbProductToType(r);
    return c ? [c] : [];
  });

  const specs = getSpecs(product);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 pb-14 pt-8">
      {/* Breadcrumb */}
      <p className="text-xs text-[var(--text-tertiary)]">
        <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Inicio</Link>{" "}
        /{" "}
        <Link href="/shop" className="hover:text-[var(--text-primary)] transition-colors">Tienda</Link>{" "}
        / <span className="text-[var(--text-secondary)]">{product.name}</span>
      </p>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        {/* Image */}
        <div>
          <div className="relative rounded-xl p-8" style={{ border: "1px solid var(--border)" }}>
            <div className="flex min-h-[520px] items-center justify-center">
              <Image
                src={product.image}
                alt={product.name}
                width={1400}
                height={1200}
                className="max-h-[480px] w-auto object-contain"
                priority
              />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`overflow-hidden rounded-lg p-2 ${i === 0 ? "ring-1 ring-[var(--text-primary)]" : ""}`} style={{ border: "1px solid var(--border)" }}>
                <Image src={product.image} alt={`${product.name} vista ${i + 1}`} width={400} height={300} className="h-24 w-full object-contain" />
              </div>
            ))}
          </div>
        </div>

        {/* Info panel */}
        <div className="rounded-xl p-6">
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)]">{product.type}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--text-primary)]">{product.name}</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{product.brand}</p>

          <div className="mt-4 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="text-3xl font-semibold text-[var(--text-primary)]">{formatPrice(product.priceCents)}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            {specs.slice(0, 4).map(([label, value]) => (
              <span key={label} className="rounded-md bg-[var(--bg-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]" style={{ border: "1px solid var(--border)" }}>
                {value}
              </span>
            ))}
          </div>

          <div className="mt-5">
            <AddToCartButton product={product} variant="primary" />
          </div>

          <article className="mt-5 pb-5" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Descripción</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{product.description}</p>
          </article>

          <article className="mt-5">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Incluye</h2>
            <ul className="mt-2 space-y-1.5 text-sm text-[var(--text-secondary)]">
              {["Garantía oficial de 3 años", "Soporte técnico de compatibilidad", "Envío 24/48h · Devolución 30 días"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-[var(--text-tertiary)]" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="mt-5">
        {/* Specs */}
        <article className="rounded-xl bg-[var(--bg-card)] p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Especificaciones</h2>
          <dl className="mt-3 divide-y" style={{ borderColor: "var(--border)" }}>
            {specs.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-2.5 text-sm">
                <dt className="text-[var(--text-secondary)]">{label}</dt>
                <dd className="font-medium text-[var(--text-primary)]">{value}</dd>
              </div>
            ))}
          </dl>
        </article>
      </section>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-base font-semibold text-[var(--text-primary)]">Productos relacionados</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {related.map((item) => (
              <Link key={item.id} href={`/product/${item.slug}`} className="rounded-xl bg-[var(--bg-card)] p-4 transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)]" style={{ border: "1px solid var(--border)" }}>
                <p className="text-sm font-medium text-[var(--text-primary)]">{item.name}</p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{item.brand}</p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{formatPrice(item.priceCents)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
