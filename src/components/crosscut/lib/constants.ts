/**
 * Client-safe copies of schema constants. Islands import from here so the
 * Zod schemas never ship to the browser; tests/unit/crosscut/constants.test.ts
 * asserts these stay equal to src/lib/schemas.ts.
 */
export const C_PROTOCOL_SLUGS = [
  'erc-8004',
  'x402',
  'visa-tap',
  'openai-acp',
  'ucp',
  'stripe-mpp',
  'ap2',
  'mastercard-agent-pay',
] as const;

export const C_LAYERS = [
  'discovery',
  'identity-trust',
  'intent-authorization',
  'checkout-orders',
  'payment-credential',
  'settlement-rails',
  'post-purchase-disputes',
  'reputation-feedback',
] as const;

export const C_LAYER_LABELS: Record<(typeof C_LAYERS)[number], string> = {
  discovery: 'Discovery',
  'identity-trust': 'Identity and trust',
  'intent-authorization': 'Intent and authorization',
  'checkout-orders': 'Checkout and orders',
  'payment-credential': 'Payment credential',
  'settlement-rails': 'Settlement rails',
  'post-purchase-disputes': 'Post-purchase and disputes',
  'reputation-feedback': 'Reputation and feedback',
};

export const C_RADAR_AXES = [
  'openness',
  'decentralization',
  'maturity',
  'adoption-evidence',
  'human-not-present',
  'dispute-support',
] as const;

export const C_FAMILY_LABELS: Record<string, string> = {
  'identity-trust': 'Identity and trust',
  'authorization-intent': 'Authorization and intent',
  'checkout-orders': 'Checkout and orders',
  'payment-execution': 'Payment execution and credentials',
};
