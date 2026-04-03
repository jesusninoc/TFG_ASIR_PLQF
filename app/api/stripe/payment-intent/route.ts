/**
 * app/api/stripe/payment-intent/route.ts
 * Crea un PaymentIntent de Stripe y registra el pedido como PENDING en la BD.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().max(128),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .nonempty()
    .max(50),
  shippingCents: z.number().int().min(0).max(100_000).optional().default(0),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = bodySchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    // Resuelve precios desde la BD (fuente de verdad, no el cliente)
    const productIds = parsed.data.items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, stock: { gt: 0 } },
      select: { id: true, priceCents: true },
    });

    if (dbProducts.length !== productIds.length) {
      return NextResponse.json(
        { error: "Uno o más productos no están disponibles" },
        { status: 400 },
      );
    }

    const priceMap = new Map<string, number>(
      (dbProducts as { id: string; priceCents: number }[]).map((p) => [p.id, p.priceCents]),
    );

    const lineItems = parsed.data.items.map((item) => {
      const priceCents = priceMap.get(item.productId);
      if (priceCents === undefined) {
        throw new Error("Producto no encontrado");
      }
      return { ...item, priceCents };
    });

    const subtotalCents = lineItems.reduce(
      (sum, item) => sum + (item.priceCents as number) * item.quantity,
      0,
    );

    const totalCents = subtotalCents + parsed.data.shippingCents;

    if (totalCents <= 0) {
      return NextResponse.json({ error: "Carrito vacío o inválido" }, { status: 400 });
    }

    // Create PaymentIntent FIRST — if this fails, we have no orphaned DB order
    const intent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
    });

    // Persist order only after Stripe succeeded
    const order = await prisma.order.create({
      data: {
        status: "PENDING",
        totalCents,
        currency: "eur",
        stripePaymentIntentId: intent.id,
        items: {
          create: lineItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceCents: item.priceCents,
          })),
        },
      },
    });

    // Attach orderId to the PaymentIntent metadata so the webhook can find it
    await stripe.paymentIntents.update(intent.id, {
      metadata: { orderId: order.id },
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      orderId: order.id,
    });
  } catch (err) {
    console.error("[payment-intent] error:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
