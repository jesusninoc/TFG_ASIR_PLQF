import { PcBuilder } from "@/components/pc-builder";

export default function BuilderPage() {
  return (
    <main className="flex min-h-[calc(100vh-57px)] flex-col bg-white">
      <div
        className="px-6 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h1 className="text-sm font-semibold text-[var(--text-primary)]">PC Builder</h1>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
          Sigue los pasos, valida la compatibilidad y añade la build al carrito.
        </p>
      </div>
      <PcBuilder />
    </main>
  );
}

