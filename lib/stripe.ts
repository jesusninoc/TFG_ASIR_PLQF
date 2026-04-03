/**
 * lib/stripe.ts
 * Cliente Stripe singleton para el servidor (Node.js SDK).
 *
 * En producción (Vercel) los webhooks llegan directamente desde los
 * servidores de Stripe — no se necesita Stripe CLI.
 * El CLI sigue siendo útil solo en desarrollo local para reenviar
 * eventos al servidor local.
 */

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY no está definida en las variables de entorno.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Fija la versión de la API para evitar cambios inesperados al actualizar el paquete
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

/**
 * Verifica la firma de un webhook entrante con el SDK de Node.js
 * y devuelve el evento Stripe tipado.
 *
 * Stripe firma cada request con STRIPE_WEBHOOK_SECRET.
 * Esta verificación es lo que reemplaza al Stripe CLI en producción —
 * el CLI era solo un proxy de reenvío local; en Vercel, Stripe llama
 * directamente al endpoint y esta función valida la autenticidad.
 *
 * @param rawBody  Body crudo (string) sin parsear — DEBE venir de req.text()
 * @param signature  Valor de la cabecera "stripe-signature"
 */
export function constructStripeEvent(
  rawBody: string,
  signature: string,
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET no está definida en las variables de entorno.");
  }
  // constructEventAsync no existe en todas las versiones; constructEvent es sync y suficiente
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}
