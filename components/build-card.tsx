"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/compatibility";
import type { BuildMessage, ComponentRecommendation } from "@/lib/types";

interface BuildCardProps {
  build: BuildMessage;
  onLoad: () => void;
}

const TIER_LABELS: Record<BuildMessage["tier"], string> = {
  budget: "Budget",
  mid: "Mid",
  premium: "Premium",
};

const COMPONENT_LABELS: Record<ComponentRecommendation["componentType"], string> = {
  cpu: "CPU",
  motherboard: "Placa",
  memory: "RAM",
  storage: "SSD",
  gpu: "GPU",
  psu: "PSU",
  case: "Caja",
};

export function BuildCard({ build, onLoad }: BuildCardProps) {
  const recommendations = build.componentRecommendations ?? [];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="inline-flex rounded-full bg-[var(--bg-subtle)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {TIER_LABELS[build.tier] ?? build.tier}
          </span>
          <p className="text-lg font-semibold leading-none text-[var(--text-primary)]">
            {formatPrice(build.totalPriceCents)}
          </p>
        </div>
        <button
          type="button"
          onClick={onLoad}
          className="rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          Cargar en el Builder
        </button>
      </div>

      {recommendations.length > 0 ? (
        <ul className="divide-y divide-[var(--border)]">
          {recommendations.map((component) => (
            <li key={component.id} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="mt-0.5 w-10 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {COMPONENT_LABELS[component.componentType]}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={component.productLink}
                  className="block truncate text-sm font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--accent)]"
                  title={component.name}
                >
                  {component.name}
                </Link>
                {component.keySpecs.length > 0 ? (
                  <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                    {component.keySpecs.slice(0, 2).join(" · ")}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 text-xs font-semibold text-[var(--text-primary)]">
                {formatPrice(component.priceCents)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-relaxed text-[var(--text-primary)]">
          {build.answer}
        </p>
      )}
    </div>
  );
}
