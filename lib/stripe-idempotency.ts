import { createHash } from 'crypto';

/**
 * Deterministically serialize an object for hashing.
 * Arrays are sorted, object keys are sorted.
 */
function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).sort().join(',') + ']';
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj).sort();
    return (
      '{' +
      keys
        .map((k) => JSON.stringify(k) + ':' + stableStringify((obj as Record<string, unknown>)[k]))
        .join(',') +
      '}'
    );
  }
  return String(obj);
}

/**
 * Generate a short hash from a payload to create a deterministic idempotency key.
 */
export function generateDeterministicKey(prefix: string, payload: unknown): string {
  const str = stableStringify(payload);
  const hash = createHash('sha256').update(str).digest('hex').slice(0, 32);
  return `${prefix}-${hash}`;
}

/**
 * Generate an idempotency key for PaymentIntent creation based on cart contents and shipping.
 * Ensures identical requests produce the same key.
 */
export function paymentIntentKey(
  items: Array<{ productId: string; quantity: number }>,
  shippingCents: number
): string {
  return generateDeterministicKey('payment-intent', { items, shippingCents });
}

/**
 * Generate an idempotency key for Checkout Session creation.
 */
export function checkoutSessionKey(
  items: Array<{ product: { id: string }; quantity: number }>,
  shippingCents?: number
): string {
  return generateDeterministicKey('checkout-session', { items, shippingCents });
}
