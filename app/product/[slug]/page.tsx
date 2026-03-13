import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { products } from "@/lib/catalog";
import { formatPrice } from "@/lib/compatibility";
import { Product } from "@/lib/types";

function getSpecs(product: Product) {
  switch (product.type) {
    case "cpu":
      return [
        ["Socket", product.socket],
        ["Núcleos", String(product.cores)],
        ["Hilos", String(product.threads)],
        ["TDP", `${product.tdpWatts}W`],
      ];
    case "motherboard":
      return [
        ["Socket", product.socket],
        ["Formato", product.formFactor],
        ["Memoria", product.memoryType],
        ["M.2", String(product.m2Slots)],
        ["SATA", String(product.sataPorts)],
      ];
    case "memory":
      return [
        ["Tipo", product.memoryType],
        ["Frecuencia", `${product.speedMhz} MHz`],
        ["Capacidad", `${product.capacityGb} GB`],
        ["Módulos", String(product.modules)],
      ];
    case "storage":
      return [
        ["Interfaz", product.interface],
        ["Capacidad", `${product.capacityGb} GB`],
      ];
    case "gpu":
      return [
        ["VRAM", `${product.vramGb} GB`],
        ["TDP", `${product.tdpWatts}W`],
      ];
    case "psu":
      return [
        ["Potencia", `${product.wattage}W`],
        ["Eficiencia", product.efficiency],
      ];
    case "case":
      return [["Formatos soportados", product.supportedFormFactors.join(", ")]];
    default:
      return [];
  }
}

function getReviews(product: Product) {
  return [
    {
      author: "Laura M.",
      rating: 5,
      title: "Rinde exactamente como esperaba",
      body: `Muy buena compra para mi build. ${product.name} se siente premium y estable incluso en sesiones largas.`,
    },
    {
      author: "Carlos G.",
      rating: 4,
      title: "Gran relación calidad/precio",
      body: "Instalación sencilla, buen acabado y sin sorpresas. Lo recomendaría para gaming y productividad.",
    },
    {
      author: "Marta R.",
      rating: 5,
      title: "Perfecto para actualizar mi PC",
      body: "El envío fue rápido y el componente llegó impecable. El rendimiento final superó mis expectativas.",
    },
  ];
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    notFound();
  }

  const specs = getSpecs(product);
  const reviews = getReviews(product);
  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const stars = "★".repeat(Math.round(average));
  const related = products
    .filter((item) => item.type === product.type && item.id !== product.id)
    .slice(0, 3);

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
        {/* Images */}
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
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`${product.id}-${index}`}
                className={`overflow-hidden rounded-lg p-2 transition-colors cursor-pointer ${
                  index === 0 ? "ring-1 ring-[var(--text-primary)]" : ""
                }`}
                style={{ border: "1px solid var(--border)" }}
              >
                <Image
                  src={product.image}
                  alt={`${product.name} vista ${index + 1}`}
                  width={400}
                  height={300}
                  className="h-24 w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Info panel */}
        <div className="rounded-xl p-6">
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)]">{product.type}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--text-primary)]">
            {product.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{product.brand}</p>

          <div className="mt-4 flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="text-sm text-[var(--text-secondary)]">{average.toFixed(1)}</span>
            <span className="text-amber-500 text-sm">{stars}</span>
            <a href="#reviews" className="text-sm font-medium text-[var(--accent)] hover:underline">
              {reviews.length} reseñas
            </a>
          </div>

          <div className="mt-4 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="text-3xl font-semibold text-[var(--text-primary)]">{formatPrice(product.priceCents)}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            {specs.slice(0, 4).map(([label, value]) => (
              <span
                key={label}
                className="rounded-md bg-[var(--bg-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]"
                style={{ border: "1px solid var(--border)" }}
              >
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
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-[var(--text-tertiary)]" />
                Garantía oficial de 3 años
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-[var(--text-tertiary)]" />
                Soporte técnico de compatibilidad
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-[var(--text-tertiary)]" />
                Envío 24/48h · Devolución 30 días
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
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

        {/* Reviews */}
        <article id="reviews" className="rounded-xl bg-[var(--bg-card)] p-5">
          <div className="flex items-end justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Reseñas</h2>
            <p className="text-xs text-[var(--text-secondary)]">⭐ {average.toFixed(1)} / 5</p>
          </div>
          <div className="mt-3 space-y-2">
            {reviews.map((review) => (
              <article
                key={review.author + review.title}
                className="rounded-lg bg-[var(--bg-subtle)] p-3"
                style={{ border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{review.author}</p>
                  <p className="text-xs text-amber-500">{"★".repeat(review.rating)}</p>
                </div>
                <p className="mt-1 text-xs font-medium text-[var(--text-primary)]">{review.title}</p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{review.body}</p>
              </article>
            ))}
          </div>
        </article>
      </section>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-base font-semibold text-[var(--text-primary)]">Productos relacionados</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/product/${item.slug}`}
                className="rounded-xl bg-[var(--bg-card)] p-4 transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)]"
                style={{ border: "1px solid var(--border)" }}
              >
                <p className="text-sm font-medium text-[var(--text-primary)]">{item.name}</p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{item.brand}</p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  {formatPrice(item.priceCents)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
