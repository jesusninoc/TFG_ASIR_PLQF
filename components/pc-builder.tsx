"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AI_BUILDER_LOAD_EVENT, AI_SUGGESTED_FULL_BUILD_KEY, AI_SUGGESTED_PARTIAL_SELECTION_KEY, normalizeSelectionIds } from "@/lib/builder-transfer";
import { TOGGLE_CART_EVENT } from "@/lib/assistant/assistant-events";
import { evaluateBuildCompatibility, formatPrice } from "@/lib/compatibility";
import type {
  PcBuildSelection,
  PartialSelection,
  Product,
  CpuProduct,
  MotherboardProduct,
  MemoryProduct,
  StorageProduct,
  GpuProduct,
  PsuProduct,
  CaseProduct,
} from "@/lib/types";
import { useStore } from "@/components/store-provider";

// ─── Steps ───────────────────────────────────────────────────────────────────

const STEPS: Array<{
  key: keyof PcBuildSelection;
  label: string;
  subtitle: string;
  optional?: boolean;
}> = [
  { key: "cpu",         label: "Procesador",     subtitle: "El corazón de tu build" },
  { key: "motherboard", label: "Placa base",      subtitle: "Socket compatible con el CPU" },
  { key: "memory",      label: "Memoria RAM",     subtitle: "Tipo y velocidad" },
  { key: "storage",     label: "Almacenamiento",  subtitle: "NVMe, SSD o HDD" },
  { key: "gpu",         label: "Tarjeta gráfica", subtitle: "Para gaming y creación",       optional: true },
  { key: "psu",         label: "Fuente de poder", subtitle: "Adecuada a tu consumo" },
  { key: "case",        label: "Torre",           subtitle: "Formato compatible con la placa", optional: true },
];

type ProductsByType = {
  cpu:         CpuProduct[];
  motherboard: MotherboardProduct[];
  memory:      MemoryProduct[];
  storage:     StorageProduct[];
  gpu:         GpuProduct[];
  psu:         PsuProduct[];
  case:        CaseProduct[];
};

// ─── Spec badges ──────────────────────────────────────────────────────────────

function getSpecs(product: Product): string[] {
  switch (product.type) {
    case "cpu": {
      const p = product as CpuProduct;
      return [p.socket, `${p.cores}C / ${p.threads}T`, `${p.tdpWatts}W`];
    }
    case "motherboard": {
      const p = product as MotherboardProduct;
      return [p.socket, p.formFactor, p.memoryType, `${p.maxMemoryGb}GB max`];
    }
    case "memory": {
      const p = product as MemoryProduct;
      return [p.memoryType, `${p.speedMhz} MHz`, `${p.capacityGb} GB`];
    }
    case "storage": {
      const p = product as StorageProduct;
      const cap = p.capacityGb >= 1000 ? `${p.capacityGb / 1000} TB` : `${p.capacityGb} GB`;
      return [p.interface === "M2_NVME" ? "NVMe M.2" : "SATA", cap];
    }
    case "gpu": {
      const p = product as GpuProduct;
      return [`${p.vramGb} GB VRAM`, `${p.tdpWatts}W`];
    }
    case "psu": {
      const p = product as PsuProduct;
      return [`${p.wattage}W`, p.efficiency];
    }
    case "case": {
      const p = product as CaseProduct;
      return p.supportedFormFactors;
    }
    default:
      return [];
  }
}

// ─── Compatibility helpers ────────────────────────────────────────────────────

function isCompatible(product: Product, key: keyof PcBuildSelection, sel: PcBuildSelection): boolean {
  if (key === "motherboard" && sel.cpu)
    return (product as MotherboardProduct).socket === sel.cpu.socket;
  if (key === "memory" && sel.motherboard)
    return (product as MemoryProduct).memoryType === sel.motherboard.memoryType;
  if (key === "storage" && sel.motherboard) {
    const iface = (product as StorageProduct).interface;
    return iface === "M2_NVME" ? sel.motherboard.m2Slots > 0 : sel.motherboard.sataPorts > 0;
  }
  if (key === "case" && sel.motherboard)
    return (product as CaseProduct).supportedFormFactors.includes(sel.motherboard.formFactor);
  return true;
}

function hasCompatCtx(key: keyof PcBuildSelection, sel: PcBuildSelection): boolean {
  if (key === "motherboard") return Boolean(sel.cpu);
  if (key === "memory" || key === "storage") return Boolean(sel.motherboard);
  if (key === "case") return Boolean(sel.motherboard);
  return false;
}

function compatHint(key: keyof PcBuildSelection, sel: PcBuildSelection): string | null {
  if (key === "motherboard" && sel.cpu)     return `Mostrando socket ${sel.cpu.socket} primero`;
  if (key === "memory"      && sel.motherboard) return `Tu placa usa ${sel.motherboard.memoryType}`;
  if (key === "storage"     && sel.motherboard) {
    const m = sel.motherboard;
    const opts = [m.m2Slots > 0 && "NVMe M.2", m.sataPorts > 0 && "SATA"].filter(Boolean).join(" y ");
    return `Tu placa soporta ${opts}`;
  }
  if (key === "case" && sel.motherboard) return `Tu placa es ${sel.motherboard.formFactor}`;
  return null;
}

// ─── Step bar ─────────────────────────────────────────────────────────────────

function StepBar({ current, selection, onGoTo }: { current: number; selection: PcBuildSelection; onGoTo: (i: number) => void }) {
  return (
    <ol className="flex w-full items-start">
      {STEPS.map((step, i) => {
        const done = Boolean(selection[step.key]);
        const active = i === current;
        const reachable = i <= current || done;
        const passed = i < current || done;
        return (
          <li key={step.key} className="flex flex-1 items-start">
            <button type="button" disabled={!reachable} onClick={() => reachable && onGoTo(i)} className="flex flex-col items-center gap-1.5 pb-1 pt-0.5 disabled:cursor-default">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-all ${done ? "bg-[var(--text-primary)] text-white" : active ? "bg-[var(--accent)] text-white shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_15%,transparent)]" : reachable ? "border border-[var(--border-strong)] bg-white text-[var(--text-secondary)]" : "border border-[var(--border)] bg-white text-[var(--text-tertiary)]"}`}>
                {done ? (<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M2 6l3 3 5-5" /></svg>) : i + 1}
              </span>
              <span className={`whitespace-nowrap text-[10px] font-medium transition-colors ${active ? "text-[var(--text-primary)]" : done ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>{step.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className="mx-1 mt-3.5 h-px flex-1 transition-colors" style={{ background: passed ? "var(--text-primary)" : "var(--border)" }} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────

const ProductCard = memo(function ProductCard({ product, selected, incompatible, onClick }: { product: Product; selected: boolean; incompatible: boolean; onClick: () => void }) {
  const specs = getSpecs(product);
  return (
    <button type="button" onClick={onClick} className={`group relative flex flex-col gap-2.5 p-3.5 text-left transition-colors ${selected ? "bg-[var(--bg-subtle)]" : incompatible ? "opacity-35 hover:opacity-60" : "bg-white hover:bg-[var(--bg-subtle)]"}`}>
      {selected && (<span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-white"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-2 w-2"><path d="M2 6l3 3 5-5" /></svg></span>)}
      {incompatible && !selected && (<span className="absolute right-2.5 top-2.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-red-500">incompatible</span>)}
      <div className="h-20 w-full overflow-hidden rounded-lg">
        <Image src={product.image} alt={product.name} width={320} height={200} className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.04]" />
      </div>
      <div>
        <p className="line-clamp-2 text-xs font-medium leading-snug text-[var(--text-primary)]">{product.name}</p>
        <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">{product.brand}</p>
      </div>
      <div className="flex flex-wrap gap-1">
        {specs.map((spec) => (<span key={spec} className="rounded px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]" style={{ background: "var(--bg-subtle)" }}>{spec}</span>))}
      </div>
      <p className="text-sm font-semibold text-[var(--text-primary)]">{formatPrice(product.priceCents)}</p>
    </button>
  );
});

function readStoredSelection(rawValue: string | null): PartialSelection | undefined {
  if (!rawValue) {
    return undefined;
  }

  try {
    return normalizeSelectionIds(JSON.parse(rawValue) as Record<string, string>);
  } catch {
    return undefined;
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PcBuilder() {
  const { addToCart, removeFromCart } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [selection, setSelection] = useState<PcBuildSelection>({});
  const [productsByType, setProductsByType] = useState<ProductsByType | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Load products from API
  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products/by-type");
      if (!res.ok) throw new Error("Error cargando productos");
      const data = await res.json() as ProductsByType;
      setProductsByType(data);
      setLoadError(false);
    } catch (err) {
      console.error("Error loading products:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const applyStoredSelection = useCallback(() => {
    if (!productsByType) return;
    const fullIds = readStoredSelection(localStorage.getItem(AI_SUGGESTED_FULL_BUILD_KEY));
    const partialIds = readStoredSelection(localStorage.getItem(AI_SUGGESTED_PARTIAL_SELECTION_KEY));

    if (!fullIds && !partialIds) {
      return;
    }

    const preselect: PcBuildSelection = fullIds ? {} : { ...selection };

    for (const selectionIds of [fullIds, partialIds]) {
      if (!selectionIds) {
        continue;
      }

      for (const [key, id] of Object.entries(selectionIds)) {
        const selectionKey = key as keyof PcBuildSelection;
        const list = productsByType[selectionKey] as Product[];
        const found = list?.find((product) => product.id === id);
        if (found) {
          (preselect as Record<string, Product>)[selectionKey] = found;
        }
      }
    }

    localStorage.removeItem(AI_SUGGESTED_FULL_BUILD_KEY);
    localStorage.removeItem(AI_SUGGESTED_PARTIAL_SELECTION_KEY);

    setSelection(preselect);
    const firstEmpty = STEPS.findIndex((s) => !preselect[s.key]);
    setCurrentStep(firstEmpty === -1 ? STEPS.length - 1 : firstEmpty);
  }, [productsByType, selection]);

  useEffect(() => {
    applyStoredSelection();
  }, [applyStoredSelection]);

  useEffect(() => {
    if (!productsByType) {
      return;
    }

    const handleSuggestedLoad = () => {
      applyStoredSelection();
    };

    window.addEventListener(AI_BUILDER_LOAD_EVENT, handleSuggestedLoad);

    return () => {
      window.removeEventListener(AI_BUILDER_LOAD_EVENT, handleSuggestedLoad);
    };
  }, [applyStoredSelection, productsByType]);

  const report = useMemo(() => evaluateBuildCompatibility(selection), [selection]);

  const step = STEPS[currentStep];
  const key = step.key;
  const isLastStep = currentStep === STEPS.length - 1;

  const allProducts = (productsByType?.[key] ?? []) as Product[];
  const withCompat = allProducts.map((p) => ({ product: p, compat: isCompatible(p, key, selection) }));
  const sortedProducts = [...withCompat].sort((a, b) => a.compat === b.compat ? 0 : a.compat ? -1 : 1);

  const ctxExists = hasCompatCtx(key, selection);
  const hint = compatHint(key, selection);
  const selectedCount = Object.values(selection).filter(Boolean).length;
  const requiredCount = STEPS.filter((s) => !s.optional).length;

  const toggleProduct = (product: Product) => {
    setSelection((prev) => ({ ...prev, [key]: prev[key]?.id === product.id ? undefined : product }));
  };

  const goNext = () => { if (currentStep < STEPS.length - 1) setCurrentStep((n) => n + 1); };
  const goPrev = () => { if (currentStep > 0) setCurrentStep((n) => n - 1); };
  const addBuildToCart = () => {
    const selected = Object.values(selection).filter((p): p is Product => Boolean(p));
    // Remove any existing build items to prevent duplicating on repeated clicks
    selected.forEach((p) => removeFromCart(p.id));
    selected.forEach((p) => addToCart(p));
    // Open the cart
    window.dispatchEvent(new Event(TOGGLE_CART_EVENT));
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-[var(--text-tertiary)]">
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
        Cargando componentes…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-sm text-[var(--text-secondary)]">
        <p>No se pudieron cargar los componentes. Comprueba tu conexión e inténtalo de nuevo.</p>
        <button
          type="button"
          className="btn-primary px-4 py-2 text-xs"
          onClick={() => { setLoading(true); setLoadError(false); loadProducts(); }}
        >
          Volver a intentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      {/* ── Left: steps + products + nav ── */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        {/* Step bar */}
        <div className="flex items-end gap-4 px-6 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex-1">
            <StepBar current={currentStep} selection={selection} onGoTo={setCurrentStep} />
          </div>
          <span className="mb-1 shrink-0 text-[11px] text-[var(--text-tertiary)]">{selectedCount}/{requiredCount}</span>
        </div>

        {/* Step header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">{step.label}</h2>
              {step.optional && <span className="text-[11px] text-[var(--text-tertiary)]">(opcional)</span>}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">{step.subtitle}</p>
          </div>
          {hint && (
            <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] text-[var(--text-secondary)]" style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3 shrink-0 text-[var(--accent)]"><circle cx="8" cy="8" r="6" /><path d="M8 5v3M8 10.5v.5" strokeLinecap="round" /></svg>
              {hint}
            </div>
          )}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" style={{ background: "var(--border)" }}>
            {sortedProducts.map(({ product, compat }) => (
              <ProductCard key={product.id} product={product} selected={selection[key]?.id === product.id} incompatible={ctxExists && !compat} onClick={() => toggleProduct(product)} />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={goPrev} disabled={currentStep === 0} className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs disabled:opacity-30">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3 w-3"><path d="M10 4L6 8l4 4" /></svg>
            Atrás
          </button>
          <div className="flex items-center gap-3">
            {step.optional && !selection[key] && !isLastStep && (
              <button type="button" onClick={goNext} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Saltar</button>
            )}
            {!isLastStep ? (
              <button type="button" onClick={goNext} disabled={!step.optional && !selection[key]} className="btn-primary flex items-center gap-1.5 px-3.5 py-2 text-xs disabled:opacity-40">
                Siguiente
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3 w-3"><path d="M6 4l4 4-4 4" /></svg>
              </button>
            ) : (
              <button type="button" onClick={addBuildToCart} disabled={selectedCount === 0} className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs disabled:opacity-40">
                Añadir al carrito
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3 w-3"><path d="M6 4l4 4-4 4" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: summary sidebar ── */}
      <aside className="hidden w-[260px] shrink-0 overflow-y-auto lg:flex lg:flex-col" style={{ borderLeft: "1px solid var(--border)", background: "var(--bg-sidebar)" }}>
        <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-[11px] font-medium text-[var(--text-tertiary)]">Tu build</p>
        </div>

        <div className="flex-1">
          <div className="divide-y divide-[var(--border)]">
            {STEPS.map((s, i) => {
              const picked = selection[s.key];
              const isCurrent = s.key === key;
              return (
                <button key={s.key} type="button" onClick={() => setCurrentStep(i)} className={`flex w-full items-center gap-2.5 px-5 py-3 text-left transition-colors hover:bg-white/60 ${isCurrent ? "bg-white/60" : ""}`}>
                  <span className={`flex h-1.5 w-1.5 shrink-0 rounded-full ${picked ? "bg-green-500" : isCurrent ? "bg-[var(--accent)]" : "bg-[var(--border-strong)]"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-[var(--text-secondary)]">{s.label}</p>
                    {picked ? (<p className="line-clamp-1 text-[11px] text-[var(--text-primary)]">{picked.name}</p>) : (<p className="text-[11px] text-[var(--text-tertiary)]">{isCurrent ? "Seleccionando…" : s.optional ? "—" : "Pendiente"}</p>)}
                  </div>
                  {picked && <span className="shrink-0 text-[11px] text-[var(--text-secondary)]">{formatPrice(picked.priceCents)}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)" }}>
          <div className="divide-y divide-[var(--border)]">
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-xs text-[var(--text-secondary)]">Total</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">{formatPrice(report.totalPriceCents)}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-2.5">
              <span className="text-xs text-[var(--text-secondary)]">Consumo est.</span>
              <span className="text-xs text-[var(--text-primary)]">{report.estimatedPowerWatts} W</span>
            </div>
            <div className="flex items-center justify-between px-5 py-2.5">
              <span className="text-xs text-[var(--text-secondary)]">Compatibilidad</span>
              <span className={`text-xs font-medium ${report.checks.length === 0 ? "text-[var(--text-tertiary)]" : report.isCompatible ? "text-[var(--success)]" : "text-[var(--destructive)]"}`}>
                {report.checks.length === 0 ? "—" : report.isCompatible ? "OK" : "Revisar"}
              </span>
            </div>
          </div>
        </div>

        {report.checks.length > 0 && (
          <div className="space-y-1 px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            {report.checks.map((check) => (
              <div key={check.label} className={`rounded-lg px-3 py-2 text-[11px] ${check.ok ? "status-ok" : "status-error"}`}>
                <p className="font-medium">{check.label}</p>
                <p className="mt-0.5 opacity-70">{check.detail}</p>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
