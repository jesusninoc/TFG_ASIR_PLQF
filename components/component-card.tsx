"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/compatibility";
import type { ComponentRecommendation } from "@/lib/types";

interface ComponentCardProps {
  recommendation: ComponentRecommendation;
  onAddToCart: (comp: ComponentRecommendation) => void;
  onViewProduct: (comp: ComponentRecommendation) => void;
}

export function ComponentCard({ recommendation, onAddToCart, onViewProduct }: ComponentCardProps) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-[var(--border)] bg-white p-3 shadow-sm transition-all hover:shadow-md">
      {/* Image */}
      <div className="relative h-24 w-full overflow-hidden rounded-lg bg-[var(--bg-subtle)]">
        <Image
          src={recommendation.image}
          alt={recommendation.name}
          fill
          sizes="(max-width: 320px) 50vw, (max-width: 768px) 33vw, 25vw"
          className="object-contain p-2"
        />
      </div>

      {/* Name & Brand */}
      <div>
        <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-[var(--text-primary)]">
          {recommendation.name}
        </h3>
        <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">{recommendation.brand}</p>
      </div>

      {/* Specs */}
      <div className="flex flex-wrap gap-1">
        {recommendation.keySpecs.map((spec) => (
          <span
            key={spec}
            className="rounded px-1.5 py-0.5 text-[9px] font-medium text-[var(--text-secondary)]"
            style={{ background: "var(--bg-subtle)" }}
          >
            {spec}
          </span>
        ))}
      </div>

      {/* Price */}
      <p className="text-sm font-bold text-[var(--text-primary)]">{formatPrice(recommendation.priceCents)}</p>

      {/* Reasoning */}
      <p className="text-[10px] leading-relaxed text-[var(--text-secondary)] italic">
        {recommendation.reasoning}
      </p>

      {/* Actions */}
      <div className="mt-auto flex gap-2">
        <button
          type="button"
          onClick={() => onAddToCart(recommendation)}
          className="flex-1 rounded-lg bg-[var(--accent)] px-2.5 py-1.5 text-[10px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Añadir al carrito
        </button>
        <button
          type="button"
          onClick={() => onViewProduct(recommendation)}
          className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)]"
        >
          Ver producto
        </button>
      </div>
    </div>
  );
}
