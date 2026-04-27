/**
 * app/shop/page.tsx
 * Tienda — lee productos desde PostgreSQL vía Prisma.
 */

import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatPrice } from "@/lib/compatibility";
import { prisma } from "@/lib/prisma";
import { dbProductsToTypes } from "@/lib/db-to-types";

export const dynamic = "force-dynamic";

interface ShopSearchParams {
  q?: string;
  type?: string;
  brand?: string;
  max?: string;
  min?: string;
  sort?: string;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const params = await searchParams;

  // ── Fetch all products (for filter options) and filtered products ──
  const [allRaw, brandsRaw, typesRaw] = await Promise.all([
    // Filtered products for the grid
    prisma.product.findMany({
      where: {
        ...(params.type ? { componentType: params.type.toUpperCase() as never } : {}),
        ...(params.brand ? { brand: { equals: params.brand, mode: "insensitive" } } : {}),
        ...(params.q
          ? {
              OR: [
                { name: { contains: params.q, mode: "insensitive" } },
                { description: { contains: params.q, mode: "insensitive" } },
                { brand: { contains: params.q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(params.min || params.max
          ? {
              priceCents: {
                ...(params.min ? { gte: Number(params.min) * 100 } : {}),
                ...(params.max ? { lte: Number(params.max) * 100 } : {}),
              },
            }
          : {}),
      },
      orderBy:
        params.sort === "price-asc"
          ? { priceCents: "asc" }
          : params.sort === "price-desc"
          ? { priceCents: "desc" }
          : params.sort === "name"
          ? { name: "asc" }
          : { createdAt: "asc" },
      include: {
        cpuSpec: true,
        motherboardSpec: true,
        memorySpec: true,
        storageSpec: true,
        gpuSpec: true,
        psuSpec: true,
        caseSpec: true,
      },
    }),
    // Distinct brands
    prisma.product.findMany({
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
    // Distinct types
    prisma.product.findMany({
      select: { componentType: true },
      distinct: ["componentType"],
    }),
  ]);

  const filtered = dbProductsToTypes(allRaw);
  const brands = brandsRaw.map((b) => b.brand);
  const types = typesRaw.map((t) => t.componentType.toLowerCase());

  return (
    <div className="flex min-h-[calc(100vh-57px)]" style={{ borderTop: "1px solid var(--border)" }}>

      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <aside
        className="hidden w-[220px] shrink-0 lg:block"
        style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)" }}
      >
        <div className="sticky top-[57px] overflow-y-auto" style={{ maxHeight: "calc(100vh - 57px)" }}>
          <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Filtros</p>
          </div>

          <form className="p-4 space-y-5" method="GET">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-secondary)]" htmlFor="q">Buscar</label>
              <input
                id="q" type="text" name="q"
                defaultValue={params.q ?? ""}
                placeholder="CPU, DDR5…"
                className="input-base w-full px-3 py-1.5 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-secondary)]" htmlFor="type">Tipo</label>
              <select id="type" name="type" defaultValue={params.type ?? ""} className="input-base w-full px-3 py-1.5 text-xs">
                <option value="">Todos</option>
                {types.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-secondary)]" htmlFor="brand">Marca</label>
              <select id="brand" name="brand" defaultValue={params.brand ?? ""} className="input-base w-full px-3 py-1.5 text-xs">
                <option value="">Todas</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">Precio (€)</span>
              <div className="flex items-center gap-2">
                <input type="number" min={0} name="min" defaultValue={params.min ?? ""} placeholder="Min" className="input-base w-full px-3 py-1.5 text-xs" />
                <span className="text-[var(--text-tertiary)] text-xs">–</span>
                <input type="number" min={0} name="max" defaultValue={params.max ?? ""} placeholder="Max" className="input-base w-full px-3 py-1.5 text-xs" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-secondary)]" htmlFor="sort">Ordenar</label>
              <select id="sort" name="sort" defaultValue={params.sort ?? "featured"} className="input-base w-full px-3 py-1.5 text-xs">
                <option value="featured">Destacados</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name">Nombre</option>
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary flex-1 py-1.5 text-xs">Aplicar</button>
              <a href="/shop" className="btn-secondary px-3 py-1.5 text-xs">Limpiar</a>
            </div>
          </form>
        </div>
      </aside>

      {/* ─── Main content ─────────────────────────────────────── */}
      <main className="flex-1 bg-white">
        <div className="flex items-center justify-between px-6 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">Tienda</h1>
          <p className="text-xs text-[var(--text-secondary)]">
            {filtered.length} producto{filtered.length === 1 ? "" : "s"}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">Sin resultados</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Prueba ajustando los filtros del panel lateral.</p>
            <a href="/shop" className="btn-secondary mt-4 px-4 py-2 text-xs">Limpiar filtros</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 grid-mesh">
            {filtered.map((product) => (
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
                      <h2 className="line-clamp-1 text-sm font-medium text-[var(--text-primary)]">
                        <Link href={`/product/${product.slug}`}>{product.name}</Link>
                      </h2>
                      <span className="shrink-0 text-sm font-semibold text-[var(--text-primary)]">
                        {formatPrice(product.priceCents)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {product.brand}
                      <span className="mx-1.5 opacity-40">·</span>
                      <span className="uppercase tracking-wide">{product.type}</span>
                    </p>
                    <p className="line-clamp-2 text-[11px] leading-relaxed text-[var(--text-tertiary)]">
                      {product.description}
                    </p>
                  </div>
                  <AddToCartButton product={product} />
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
