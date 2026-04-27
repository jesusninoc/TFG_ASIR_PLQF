/**
 * app/api/stripe/webhook/route.ts
 *
 * Endpoint que recibe eventos de Stripe y actualiza pedidos en la BD.
 *
 * ── Producción (Vercel) ───────────────────────────────────────────────────
 * Stripe llama directamente a https://tu-dominio.com/api/stripe/webhook.
 * No se necesita Stripe CLI. El SDK verifica la firma con STRIPE_WEBHOOK_SECRET,
 * que se obtiene del Dashboard de Stripe > Webhooks > tu endpoint > Signing secret.
 *
 * ── Desarrollo local ─────────────────────────────────────────────────────
 * Stripe CLI reenvía eventos locales:
 *   stripe listen --forward-to localhost:3000/api/stripe/webhook
 * El CLI imprime un whsec_... que debes poner en .env.local como
 * STRIPE_WEBHOOK_SECRET (es diferente al de producción).
 *
 * ── Importante para Next.js App Router ───────────────────────────────────
 * Next.js 13+ parsea el body automáticamente. Para webhooks de Stripe
 * DEBEMOS leer el body crudo con req.text() ANTES de cualquier otro parse,
 * de lo contrario la verificación de firma fallará siempre.
 * "export const runtime = 'nodejs'" garantiza que se usa el runtime de Node
 * y no Edge, donde el comportamiento del body puede diferir.
 *
 * Eventos gestionados:
 *  - payment_intent.succeeded       → Order → PAID
 *  - payment_intent.payment_failed  → Order → FAILED
 *  - checkout.session.completed     → Order creado/actualizado → PAID
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { constructStripeEvent, stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { WebhookEventSchema } from "@/lib/validation";

// Forzar runtime Node.js — necesario para leer el body crudo correctamente
export const runtime = "nodejs";

// Desactivar el body parsing automático de Next.js para esta ruta
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 1. Leer body crudo — DEBE ser req.text(), nunca req.json()
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  if (!signature) {
    return NextResponse.json({ error: "Falta cabecera stripe-signature" }, { status: 400 });
  }

  // 2. Verificar firma con el SDK (esto es lo que hace el CLI en local)
  let event: Stripe.Event;
  try {
    event = constructStripeEvent(rawBody, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Firma inválida";
    console.error("[webhook] Verificación de firma fallida:", message);
    return NextResponse.json({ error: `Firma inválida: ${message}` }, { status: 400 });
  }

  const validatedEvent = WebhookEventSchema.safeParse(event);
  if (!validatedEvent.success) {
    return NextResponse.json({ error: "Evento de Stripe inválido" }, { status: 400 });
  }

  // 3. Procesar el evento
  try {
    switch (event.type) {

      // ── PaymentIntent completado (flujo Stripe Elements) ────────────────
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await prisma.order.upsert({
          where: { stripePaymentIntentId: pi.id },
          update: { status: "PAID" },
          create: {
            stripePaymentIntentId: pi.id,
            status: "PAID",
            totalCents: pi.amount,
            currency: pi.currency,
            customerEmail: pi.receipt_email ?? null,
          },
        });
        console.info(`[webhook] PaymentIntent ${pi.id} → PAID`);
        break;
      }

      // ── PaymentIntent fallido ────────────────────────────────────────────
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await prisma.order.updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { status: "FAILED" },
        });
        console.info(`[webhook] PaymentIntent ${pi.id} → FAILED`);
        break;
      }

      // ── Checkout Session completada (flujo redirect) ─────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Recuperar los line items para asociar OrderItems
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ["data.price.product"],
        });

        // Collect all product names in one pass, then batch-lookup in DB
        const productNames: string[] = [];
        for (const item of lineItems.data) {
          if (!item.price || !item.quantity) continue;
          const productName =
            typeof item.price.product === "object" &&
            item.price.product !== null &&
            "name" in item.price.product
              ? (item.price.product as Stripe.Product).name
              : null;
          if (productName) productNames.push(productName);
        }

        // Single batched query instead of N individual queries
        const dbProducts = productNames.length > 0
          ? await prisma.product.findMany({
              where: { name: { in: productNames } },
              select: { id: true, name: true, priceCents: true },
            })
          : [];
        const dbProductMap = new Map(dbProducts.map((p) => [p.name, p]));

        const orderItemsData: { productId: string; quantity: number; priceCents: number }[] = [];

        for (const item of lineItems.data) {
          if (!item.price || !item.quantity) continue;

          const productName =
            typeof item.price.product === "object" &&
            item.price.product !== null &&
            "name" in item.price.product
              ? (item.price.product as Stripe.Product).name
              : null;

          if (productName) {
            const dbProduct = dbProductMap.get(productName);
            if (dbProduct) {
              orderItemsData.push({
                productId: dbProduct.id,
                quantity: item.quantity,
                priceCents: item.price.unit_amount ?? dbProduct.priceCents,
              });
            } else {
              console.warn(`[webhook] Producto no encontrado en BD: "${productName}"`);
            }
          }
        }

        // Try to find the existing PENDING order by session id (created by our PI flow)
        const existingOrder = await prisma.order.findUnique({
          where: { stripeSessionId: session.id },
        });

        if (existingOrder) {
          await prisma.order.update({
            where: { id: existingOrder.id },
            data: {
              status: "PAID",
              customerEmail: session.customer_details?.email ?? existingOrder.customerEmail,
            },
          });
        } else {
          await prisma.order.create({
            data: {
              stripeSessionId: session.id,
              stripePaymentIntentId:
                typeof session.payment_intent === "string" ? session.payment_intent : null,
              status: "PAID",
              totalCents: session.amount_total ?? 0,
              currency: session.currency ?? "eur",
              customerEmail: session.customer_details?.email ?? null,
              items: { create: orderItemsData },
            },
          });
        }

        break;
      }

      default:
        // Evento no gestionado — responder 200 para que Stripe no reintente
        break;
    }
  } catch (err) {
    console.error(`[webhook] Error procesando ${event.type}:`, err);
    // Devolver 500 hace que Stripe reintente el evento más tarde
    return NextResponse.json({ error: "Error interno al procesar el evento" }, { status: 500 });
  }

  // Stripe espera un 200 para confirmar la recepción
  return NextResponse.json({ received: true });
}
