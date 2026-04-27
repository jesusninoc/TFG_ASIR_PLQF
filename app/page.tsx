/**
 * app/page.tsx
 * Home - productos destacados desde PostgreSQL.
 */

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatPrice } from "@/lib/compatibility";
import { prisma } from "@/lib/prisma";
import { dbProductsToTypes } from "@/lib/db-to-types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const raw = await prisma.product.findMany({
    take: 6,
    orderBy: { createdAt: "asc" },
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
  const featured = dbProductsToTypes(raw);

  return (
    <main className="bg-white">
      <section className="design-hero overflow-hidden px-4 pb-16 pt-12 sm:px-6 md:pb-24 md:pt-18">
        <div className="mx-auto w-full max-w-7xl gap-12">
          <div className="flex flex-col items-center text-center">
            <h1 className="max-w-5xl text-[clamp(3.5rem,10vw,8rem)] font-normal leading-none text-[var(--text-primary)]">
              Hardware que encaja contigo.
            </h1>
            <p className="mt-8 max-w-2xl text-xl leading-8 text-[var(--text-secondary)] md:text-2xl md:leading-10">
              Explora componentes, valida una build completa y deja que Chipi revise tu carrito, responda dudas o prepare un PC con el presupuesto que tengas.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/builder" className="btn-pill inline-flex min-h-11 items-center gap-2 px-5 py-3">
                Abrir PC Builder
                <ArrowIcon />
              </Link>
              <Link href="/shop" className="btn-pill-2 inline-flex min-h-11 items-center gap-2 px-5 py-3">
                Ver catálogo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-20">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--accent)]">Destacados</p>
            <h2 className="mt-2 text-4xl font-normal leading-tight text-[var(--text-primary)] md:text-5xl">
              Componentes para builds actuales.
            </h2>
          </div>
          <Link href="/shop" className="btn-pill-2 inline-flex min-h-11 w-fit items-center px-5 py-3">
            Ver todo
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 border-t border-l">
           {featured.map((product) => (
            <article key={product.id} className="grid-mesh-item group flex flex-col bg-white transition-colors hover:bg-[var(--bg-subtle)]">
              <Link href={`/product/${product.slug}`} className="block h-44 overflow-hidden" style={{ borderBottom: "1px solid var(--border)" }}>
                <Image
                  src={product.image}
                  alt={product.name}
                  width={600}
                  height={400}
                  className="h-full w-full object-contain p-6 transition-transform duration-300 group-hover:scale-[1.04]"
                />
              </Link>
              <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-1 text-sm font-medium text-[var(--text-primary)]">
                      <Link href={`/product/${product.slug}`}>{product.name}</Link>
                    </h3>
                    <span className="shrink-0 text-sm font-semibold text-[var(--text-primary)]">
                      {formatPrice(product.priceCents)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {product.brand}
                    <span className="mx-1.5 opacity-40">·</span>
                    <span className="uppercase tracking-wide">{product.type}</span>
                  </p>
                  <p className="line-clamp-1 text-xs text-[var(--text-tertiary)]">{product.description}</p>
                </div>
                <AddToCartButton product={product} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-14" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--accent)]">Explorar</p>
            <h2 className="mt-2 text-4xl font-normal leading-tight text-[var(--text-primary)] md:text-5xl">Navega por categoría</h2>
          </div>
          <Link href="/shop" className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
            Ver todo &rarr;
          </Link>
        </div>

        <div
          className="grid-mesh grid grid-cols-2 md:grid-cols-3"
          style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)" }}
        >
          {([
            { label: "Procesadores",    type: "CPU",         desc: "Intel & AMD · última generación", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect x="7" y="7" width="10" height="10" rx="1.5" /><path d="M10 4v3M14 4v3M10 17v3M14 17v3M4 10h3M4 14h3M17 10h3M17 14h3" /></svg> },
            { label: "Placas base",     type: "MOTHERBOARD", desc: "ATX, mATX e ITX",                 icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect x="3" y="3" width="18" height="18" rx="2" /><rect x="6" y="6" width="5" height="5" rx="0.75" /><rect x="13" y="6" width="5" height="5" rx="0.75" /><path d="M6 14h5M6 17h3M13 14h5M13 17h2" /></svg> },
            { label: "Memorias RAM",    type: "MEMORY",      desc: "DDR4 & DDR5 · hasta 128 GB",     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect x="3" y="7" width="18" height="10" rx="1.5" /><path d="M7 7V5M10 7V5M14 7V5M17 7V5M7 17v2M10 17v2M14 17v2M17 17v2" /><path d="M7 12h2M12 12h2" /></svg> },
            { label: "Tarjetas gráficas", type: "GPU",       desc: "Nvidia RTX & AMD RX",             icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect x="2" y="8" width="20" height="8" rx="1.5" /><path d="M7 8V6M11 8V6M15 8V6M6 16v2M18 16v2" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /></svg> },
            { label: "Almacenamiento",  type: "STORAGE",     desc: "NVMe · SSD · HDD",               icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><ellipse cx="12" cy="7" rx="8" ry="3" /><path d="M4 7v10c0 1.66 3.58 3 8 3s8-1.34 8-3V7" /><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" /></svg> },
            { label: "Fuentes de poder", type: "PSU",        desc: "80+ Gold & Platinum",            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg> },
          ] as { label: string; type: string; desc: string; icon: React.ReactNode }[]).map((cat) => (
            <Link
              key={cat.type}
              href={`/shop?type=${encodeURIComponent(cat.type)}`}
              className="grid-mesh-item group relative flex flex-col justify-between overflow-hidden bg-white p-6 transition-colors hover:bg-[var(--bg-subtle)]"
              style={{ minHeight: "160px" }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--text-primary)] transition-colors group-hover:bg-white">
                {cat.icon}
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">{cat.label}</p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{cat.desc}</p>
              </div>
              <span className="absolute right-5 top-5 text-sm text-[var(--text-tertiary)] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100">→</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
