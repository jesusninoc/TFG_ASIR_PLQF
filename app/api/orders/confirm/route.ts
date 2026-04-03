/**
 * app/api/orders/confirm/route.ts
 * Consulta el estado de un pedido a partir del session_id o payment_intent id de Stripe.
 * Usada por la página /checkout/success para mostrar el resumen del pedido.
 *
 * Security: Stripe verifies the token belongs to our account. We only return
 * order data when payment_status === "paid" / status === "succeeded", so
 * knowing a session/PI id does NOT grant access to unpaid data.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Basic format guards to avoid pointless Stripe API calls on garbage input
const SESSION_ID_RE   = /^cs_[a-zA-Z0-9_]{10,300}$/;
const PAYMENT_INT_RE  = /^pi_[a-zA-Z0-9]{10,300}$/;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId       = searchParams.get("session_id");
  const paymentIntentId = searchParams.get("payment_intent");

  if (!sessionId && !paymentIntentId) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  try {
    // Flujo Checkout Sessions
    if (sessionId) {
      if (!SESSION_ID_RE.test(sessionId)) {
        return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== "paid") {
        return NextResponse.json({ status: "pending" });
      }

      const order = await prisma.order.findUnique({
        where: { stripeSessionId: sessionId },
        include: {
          items: {
            include: { product: { select: { name: true, image: true } } },
          },
        },
      });

      return NextResponse.json({ status: "paid", order });
    }

    // Flujo Stripe Elements (PaymentIntent)
    if (paymentIntentId) {
      if (!PAYMENT_INT_RE.test(paymentIntentId)) {
        return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
      }

      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (pi.status !== "succeeded") {
        return NextResponse.json({ status: "pending" });
      }

      const order = await prisma.order.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
        include: {
          items: {
            include: { product: { select: { name: true, image: true } } },
          },
        },
      });

      return NextResponse.json({ status: "paid", order });
    }
  } catch (err) {
    console.error("[orders/confirm] error:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
