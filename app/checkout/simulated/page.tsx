export default async function SimulatedCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; session?: string }>;
}) {
  const params = await searchParams;
  const ok = params.status === "ok";

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center px-6">
      <section
        className={`w-full rounded-3xl border p-8 ${
          ok
            ? "border-blue-200 bg-blue-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <h1 className="text-3xl font-semibold text-zinc-900">
          {ok ? "Pago simulado completado" : "Pago cancelado"}
        </h1>
        <p className="mt-2 text-sm text-zinc-700">
          {ok
            ? `Modo demo activo. Session ${params.session ?? "demo"}.`
            : "No se completó la transacción."}
        </p>
      </section>
    </main>
  );
}