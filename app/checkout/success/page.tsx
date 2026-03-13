export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; payment_intent?: string; pi?: string }>;
}) {
  const params = await searchParams;
  const reference = params.pi ?? params.payment_intent ?? params.session_id ?? "N/A";

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center px-6">
      <section className="w-full rounded-3xl border border-emerald-200 bg-emerald-50 p-8">
        <h1 className="text-3xl font-semibold text-emerald-900">Pago completado</h1>
        <p className="mt-2 text-sm text-emerald-800">
          ¡Gracias por tu compra! Referencia: {reference}
        </p>
      </section>
    </main>
  );
}