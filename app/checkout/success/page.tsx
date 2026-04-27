/**
 * app/checkout/success/page.tsx
 * Página de confirmación de pago.
 * Consulta el estado real del pedido desde la API para mostrarlo.
 */

import Link from "next/link";
import { formatPrice } from "@/lib/compatibility";

interface OrderItem {
  id: string;
  quantity: number;
  priceCents: number;
  product: { name: string; image: string };
}

interface Order {
  id: string;
  totalCents: number;
  currency: string;
  customerEmail: string | null;
  items: OrderItem[];
}

interface ConfirmResponse {
  status: "paid" | "pending";
  order?: Order;
}

async function fetchOrder(sessionId?: string, paymentIntentId?: string): Promise<ConfirmResponse | null> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const param = sessionId
    ? `session_id=${sessionId}`
    : paymentIntentId
      ? `payment_intent=${paymentIntentId}`
      : null;

  if (!param) return null;

  try {
    const res = await fetch(`${appUrl}/api/orders/confirm?${param}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<ConfirmResponse>;
  } catch {
    return null;
  }
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; payment_intent?: string; pi?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;
  const paymentIntentId = params.pi ?? params.payment_intent;

  const data = await fetchOrder(sessionId, paymentIntentId);
  const order = data?.order;

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center px-6 py-16">
      <section className="w-full rounded-3xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm">
        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-emerald-900">¡Pago completado!</h1>
            <p className="text-sm text-emerald-700">Tu pedido ha sido procesado correctamente.</p>
          </div>
        </div>

        {/* Detalles del pedido */}
        {order ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-3">
                Resumen del pedido
              </p>
              <ul className="space-y-2">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 text-sm text-zinc-700">
                    <span>
                      {item.product.name}
                      <span className="ml-2 text-xs text-zinc-400">×{item.quantity}</span>
                    </span>
                    <span className="font-medium">{formatPrice(item.priceCents * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t border-emerald-100 pt-3 flex items-center justify-between text-sm font-semibold text-zinc-900">
                <span>Total</span>
                <span>{formatPrice(order.totalCents)}</span>
              </div>
            </div>

            <div className="text-xs text-emerald-700 space-y-1">
              {order.customerEmail && (
                <p>Confirmación enviada a <strong>{order.customerEmail}</strong></p>
              )}
              <p>Referencia del pedido: <code className="font-mono">{order.id}</code></p>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-emerald-800">
            <p>Referencia: <code className="font-mono">{sessionId ?? paymentIntentId ?? "N/A"}</code></p>
          </div>
        )}

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Volver a la tienda
          </Link>
        </div>
      </section>
    </main>
  );
}
