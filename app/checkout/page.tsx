"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/compatibility";
import { stripeAppearance } from "@/lib/stripe-appearance";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function StripeCheckoutForm({
  totalCents,
  onPaid,
}: {
  totalCents: number;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
      redirect: "if_required",
    });

    setSubmitting(false);

    if (result.error) {
      setError(result.error.message ?? "No se pudo completar el pago.");
      return;
    }

    if (result.paymentIntent?.status === "succeeded") {
      onPaid();
      router.push(`/checkout/success?pi=${result.paymentIntent.id}`);
      return;
    }

    router.push("/checkout/success");
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <PaymentElement />
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="btn-stripe w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Procesando pago..." : `Pagar ${formatPrice(totalCents)}`}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const { items, totalCents, clearCart } = useStore();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [mode, setMode] = useState<"loading" | "stripe" | "simulated">("loading");
  const [error, setError] = useState<string | null>(null);

  const paymentItems = useMemo(
    () =>
      items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    [items],
  );

  useEffect(() => {
    const bootstrap = async () => {
      if (items.length === 0) {
        setMode("simulated");
        return;
      }

      if (!publishableKey) {
        setMode("simulated");
        return;
      }

      try {
        setMode("loading");
        setError(null);

        const response = await fetch("/api/stripe/payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: paymentItems }),
        });

        const payload = (await response.json()) as {
          mode?: "stripe" | "simulated";
          clientSecret?: string;
          error?: string;
        };

        if (!response.ok || payload.error) {
          throw new Error(payload.error ?? "No se pudo preparar el pago.");
        }

        if (payload.mode === "stripe" && payload.clientSecret) {
          setClientSecret(payload.clientSecret);
          setMode("stripe");
          return;
        }

        setMode("simulated");
      } catch (requestError) {
        setMode("simulated");
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo preparar el checkout.",
        );
      }
    };

    bootstrap();
  }, [items.length, paymentItems]);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-zinc-900">Checkout</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Finaliza tu pedido con Stripe Elements.
          </p>

          <div className="mt-6">
            {mode === "loading" ? (
              <p className="text-sm text-zinc-600">Preparando formulario de pago...</p>
            ) : null}

            {mode === "stripe" && clientSecret && stripePromise ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: stripeAppearance,
                }}
              >
                <StripeCheckoutForm
                  totalCents={totalCents}
                  onPaid={() => {
                    clearCart();
                  }}
                />
              </Elements>
            ) : null}

            {mode === "simulated" ? (
              <div className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  Checkout en modo demo. Añade tus claves `STRIPE_SECRET_KEY` y
                  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` para habilitar pagos reales.
                </p>
                <a
                  href="/checkout/simulated?status=ok&session=demo-elements"
                  className="btn-stripe inline-flex px-5 py-2.5 text-sm"
                  onClick={() => clearCart()}
                >
                  Completar pago simulado
                </a>
              </div>
            ) : null}

            {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}
          </div>
        </section>

        <aside className="h-fit rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
            Resumen del pedido
          </h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.product.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{item.product.name}</p>
                  <p className="text-xs text-zinc-500">{item.quantity} x</p>
                </div>
                <p className="text-sm text-zinc-700">
                  {formatPrice(item.product.priceCents * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-zinc-200 pt-4">
            <div className="flex items-center justify-between text-sm text-zinc-600">
              <span>Subtotal</span>
              <span>{formatPrice(totalCents)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-base font-semibold text-zinc-900">
              <span>Total</span>
              <span>{formatPrice(totalCents)}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
