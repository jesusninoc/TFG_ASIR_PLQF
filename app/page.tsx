import React from "react";
import Link from "next/link";
import Image from "next/image";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { products } from "@/lib/catalog";
import { formatPrice } from "@/lib/compatibility";

export default function Home() {
  const featured = products.slice(0, 6);

  return (
    <main>
      {/* ─── Hero ──────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-white"
      >
        {/* Line grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.12) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Radial vignette — fades grid toward edges and bottom */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,transparent_30%,#ffffff_100%)]" />

        <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-20 md:pt-28">
          {/* Pill badge */}
          <div
            className="mb-7 inline-flex items-center gap-2 rounded-full py-1 pl-2 pr-3 text-xs font-medium text-[var(--text-secondary)]"
            style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)" }}
          >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-500/15 text-green-600">
              <svg viewBox="0 0 8 8" fill="currentColor" className="h-2 w-2"><circle cx="4" cy="4" r="3" /></svg>
            </span>
            Catálogo actualizado · Marzo 2026
          </div>

          <h1 className="max-w-2xl text-[2.65rem] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--text-primary)] md:text-5xl">
            El mejor hardware,<br />
            configurado para ti.
          </h1>
          <p className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-[var(--text-secondary)]">
            Selecciona componentes, valida compatibilidad en tiempo real y paga en un solo flujo. Asistencia de IA incluida.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/builder"
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              Abrir PC Builder
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link
              href="/shop"
              className="btn-secondary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              Ir a la tienda
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Featured products ─────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-14 pb-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Destacados</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Hardware para builds actuales</h2>
          </div>
          <Link
            href="/shop"
            className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            Ver todo &rarr;
          </Link>
        </div>

        {/* Grid mesh — shared borders, no gaps, no rounded corners */}
        <div
          className="grid-mesh grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)" }}
        >
          {featured.map((product) => (
            <article
              key={product.id}
              className="grid-mesh-item group flex flex-col bg-white transition-colors hover:bg-[var(--bg-subtle)]"
            >
              <Link
                href={`/product/${product.slug}`}
                className="block h-44 overflow-hidden"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
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

      {/* ─── Category quick-links ──────────────────────────────── */}
      <section
        className="mx-auto w-full max-w-6xl px-6 py-14"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Explorar</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Navega por categoría</h2>
          </div>
          <Link
            href="/shop"
            className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            Ver todo &rarr;
          </Link>
        </div>

        <div
          className="grid-mesh grid grid-cols-2 md:grid-cols-3"
          style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)" }}
        >
          {([
            {
              label: "Procesadores",
              type: "CPU",
              desc: "Intel & AMD · última generación",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <rect x="7" y="7" width="10" height="10" rx="1.5" />
                  <path d="M10 4v3M14 4v3M10 17v3M14 17v3M4 10h3M4 14h3M17 10h3M17 14h3" />
                </svg>
              ),
            },
            {
              label: "Placas base",
              type: "Motherboard",
              desc: "ATX, mATX e ITX",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <rect x="6" y="6" width="5" height="5" rx="0.75" />
                  <rect x="13" y="6" width="5" height="5" rx="0.75" />
                  <path d="M6 14h5M6 17h3M13 14h5M13 17h2" />
                </svg>
              ),
            },
            {
              label: "Memorias RAM",
              type: "Memory",
              desc: "DDR4 & DDR5 · hasta 128 GB",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <rect x="3" y="7" width="18" height="10" rx="1.5" />
                  <path d="M7 7V5M10 7V5M14 7V5M17 7V5M7 17v2M10 17v2M14 17v2M17 17v2" />
                  <path d="M7 12h2M12 12h2" />
                </svg>
              ),
            },
            {
              label: "Tarjetas gráficas",
              type: "GPU",
              desc: "Nvidia RTX & AMD RX",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <rect x="2" y="8" width="20" height="8" rx="1.5" />
                  <path d="M7 8V6M11 8V6M15 8V6M6 16v2M18 16v2" />
                  <circle cx="9" cy="12" r="1.5" />
                  <circle cx="15" cy="12" r="1.5" />
                </svg>
              ),
            },
            {
              label: "Almacenamiento",
              type: "Storage",
              desc: "NVMe · SSD · HDD",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <ellipse cx="12" cy="7" rx="8" ry="3" />
                  <path d="M4 7v10c0 1.66 3.58 3 8 3s8-1.34 8-3V7" />
                  <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
                </svg>
              ),
            },
            {
              label: "Fuentes de poder",
              type: "PSU",
              desc: "80+ Gold & Platinum",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
                </svg>
              ),
            },
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
              <span className="absolute right-5 top-5 text-sm text-[var(--text-tertiary)] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
