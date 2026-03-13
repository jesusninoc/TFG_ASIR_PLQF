import Stripe from "stripe";
import { NextResponse } from "next/server";
import { z } from "zod";
import { findProductById } from "@/lib/catalog";

const bodySchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    }),
  ),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = bodySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const amount = parsed.data.items.reduce((sum, item) => {
    const product = findProductById(item.productId);
    if (!product) return sum;
    return sum + product.priceCents * item.quantity;
  }, 0);

  if (amount <= 0) {
    return NextResponse.json(
      { error: "Carrito vacío o inválido" },
      { status: 400 },
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ mode: "simulated" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const intent = await stripe.paymentIntents.create({
    amount,
    currency: "eur",
    automatic_payment_methods: { enabled: true },
    metadata: {
      itemCount: String(parsed.data.items.length),
    },
  });

  return NextResponse.json({ mode: "stripe", clientSecret: intent.client_secret });
}
