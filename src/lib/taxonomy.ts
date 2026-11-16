/**
 * The layer and family vocabularies and their display labels, kept free of Zod so that client
 * islands (the bubble universe) can import them without bundling the schema library. Zod 4
 * probes `Function('')` once to decide whether to compile its validators, and the site's
 * Content Security Policy (no 'unsafe-eval') reports that probe as a violation in the browser
 * console. `src/lib/schemas.ts` builds its enums from these lists and re-exports them.
 */

export const LAYERS = [
  'discovery',
  'identity-trust',
  'intent-authorization',
  'checkout-orders',
  'payment-credential',
  'settlement-rails',
  'post-purchase-disputes',
  'reputation-feedback',
] as const;
type Layer = (typeof LAYERS)[number];

export const FAMILIES = ['identity-trust', 'authorization-intent', 'checkout-orders', 'payment-execution'] as const;
type Family = (typeof FAMILIES)[number];

export const FAMILY_LABELS: Record<Family, string> = {
  'identity-trust': 'Identity and trust',
  'authorization-intent': 'Authorization and intent',
  'checkout-orders': 'Checkout and orders',
  'payment-execution': 'Payment execution and credentials',
};

export const LAYER_LABELS: Record<Layer, string> = {
  discovery: 'Discovery',
  'identity-trust': 'Identity and trust',
  'intent-authorization': 'Intent and authorization',
  'checkout-orders': 'Checkout and orders',
  'payment-credential': 'Payment credential',
  'settlement-rails': 'Settlement rails',
  'post-purchase-disputes': 'Post-purchase and disputes',
  'reputation-feedback': 'Reputation and feedback',
};
