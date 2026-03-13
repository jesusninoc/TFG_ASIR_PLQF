import Stripe from "stripe";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  items: z.array(
    z.object({
      quantity: z.number().int().positive(),
      product: z.object({
        id: z.string(),
        name: z.string(),
        priceCents: z.number().int().positive(),
      }),
    }),
  ),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? "http://localhost:3000";

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({
      url: `${origin}/checkout/simulated?status=ok&session=demo`,
      mode: "simulated",
    });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/simulated?status=cancel`,
    line_items: parsed.data.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "eur",
        product_data: {
          name: item.product.name,
        },
        unit_amount: item.product.priceCents,
      },
    })),
  });

  return NextResponse.json({ url: session.url, mode: "stripe" });
}