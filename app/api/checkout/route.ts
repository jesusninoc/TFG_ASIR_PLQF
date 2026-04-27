/**
 * app/api/checkout/route.ts
 * Crea una Stripe Checkout Session y registra el pedido como PENDING en la BD.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { checkoutSessionKey } from "@/lib/stripe-idempotency";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        quantity: z.number().int().positive().max(99),
        product: z.object({
          id: z.string().max(128),
        }),
      }),
    )
    .nonempty()
    .max(50),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = bodySchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    // Use the configured app URL only — never trust the client-supplied origin header
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Resolve prices from the DB — NEVER trust client-supplied prices
    const productIds = parsed.data.items.map((i) => i.product.id);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, stock: { gt: 0 } },
      select: { id: true, name: true, priceCents: true, stock: true },
    });

    if (dbProducts.length !== productIds.length) {
      return NextResponse.json(
        { error: "Uno o más productos no están disponibles" },
        { status: 400 },
      );
    }

    type DbProduct = { id: string; name: string; priceCents: number; stock: number };
    const priceMap = new Map<string, DbProduct>(
      (dbProducts as DbProduct[]).map((p) => [p.id, p]),
    );

    const lineItems = parsed.data.items.map((item) => {
      const dbProduct = priceMap.get(item.product.id)!;
      return { ...item, priceCents: dbProduct.priceCents, name: dbProduct.name };
    });

    const totalCents = lineItems.reduce(
      (sum, item) => sum + item.priceCents * item.quantity,
      0,
    );

    // Generate deterministic idempotency key based on cart contents and shipping
    const idempotencyKey = checkoutSessionKey(
      lineItems.map((item) => ({
        product: { id: item.product.id },
        quantity: item.quantity,
      })),
      0 // shipping not used in current schema
    );

    // Create Stripe session FIRST, only persist the order if Stripe succeeds
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/checkout?cancelled=true`,
        line_items: lineItems.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: "eur",
            product_data: { name: item.name },
            unit_amount: item.priceCents,
          },
        })),
        metadata: { items: JSON.stringify(lineItems) },
      },
      { idempotencyKey } // Pass idempotency key
    );

    // Check for existing order with this session (idempotent response)
    const existingOrder = await prisma.order.findFirst({
      where: { stripeSessionId: session.id },
      include: { items: true },
    });

    if (existingOrder) {
      return NextResponse.json({ url: session.url, orderId: existingOrder.id });
    }

    // Persist order only after Stripe session was created successfully
    const order = await prisma.order.create({
      data: {
        status: "PENDING",
        totalCents,
        currency: "eur",
        stripeSessionId: session.id,
        items: {
          create: lineItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            priceCents: item.priceCents,
          })),
        },
      },
    });

    // Update session metadata with the order id (only on first creation)
    await stripe.checkout.sessions.update(session.id, {
      metadata: { ...session.metadata, orderId: order.id },
    });

    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (err) {
    console.error("[checkout] error:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
