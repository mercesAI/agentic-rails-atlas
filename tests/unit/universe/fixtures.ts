import type { UniverseProtocol } from '../../../src/components/universe/lib/types';

const base = {
  monogram: 'X',
  tagline: 'Tagline',
  intro: 'Intro.',
  stewards: ['Steward'],
  latestVersion: { label: 'v1', date: '2026-01-01' },
  composesWith: [],
} as const;

export const PROTOCOLS: UniverseProtocol[] = [
  { ...base, slug: 'erc-8004', order: 1, name: 'ERC-8004', bubbleLabel: 'ERC-8004', family: 'identity-trust', layerPrimary: 'identity-trust', layersSecondary: ['reputation-feedback', 'discovery'], rails: ['crypto', 'rail-agnostic'], status: 'draft', firstAnnounced: '2025-08-13', composesWith: [] },
  { ...base, slug: 'x402', order: 2, name: 'x402', bubbleLabel: 'x402', family: 'payment-execution', layerPrimary: 'settlement-rails', layersSecondary: ['payment-credential', 'discovery', 'post-purchase-disputes'], rails: ['crypto', 'multi-rail'], status: 'live', firstAnnounced: '2025-05-06', composesWith: [] },
  { ...base, slug: 'visa-tap', order: 3, name: 'Visa TAP', bubbleLabel: 'Visa TAP', family: 'identity-trust', layerPrimary: 'identity-trust', layersSecondary: ['payment-credential', 'checkout-orders'], rails: ['card'], status: 'mixed', firstAnnounced: '2025-10-14', composesWith: [] },
  { ...base, slug: 'openai-acp', order: 4, name: 'ACP', bubbleLabel: 'ACP', family: 'checkout-orders', layerPrimary: 'checkout-orders', layersSecondary: ['payment-credential', 'discovery', 'post-purchase-disputes'], rails: ['card', 'rail-agnostic'], status: 'beta', firstAnnounced: '2025-09-29', composesWith: [] },
  { ...base, slug: 'ucp', order: 5, name: 'UCP', bubbleLabel: 'UCP', family: 'checkout-orders', layerPrimary: 'checkout-orders', layersSecondary: ['discovery', 'payment-credential', 'identity-trust', 'intent-authorization'], rails: ['rail-agnostic', 'card'], status: 'live', firstAnnounced: '2026-01-11', composesWith: [] },
  { ...base, slug: 'stripe-mpp', order: 6, name: 'MPP', bubbleLabel: 'MPP', family: 'payment-execution', layerPrimary: 'payment-credential', layersSecondary: ['settlement-rails', 'discovery'], rails: ['multi-rail', 'crypto', 'card'], status: 'mixed', firstAnnounced: '2026-03-18', composesWith: [] },
  { ...base, slug: 'ap2', order: 7, name: 'AP2', bubbleLabel: 'AP2', family: 'authorization-intent', layerPrimary: 'intent-authorization', layersSecondary: ['payment-credential', 'checkout-orders', 'post-purchase-disputes'], rails: ['rail-agnostic'], status: 'draft', firstAnnounced: '2025-09-16', composesWith: [] },
  { ...base, slug: 'mastercard-agent-pay', order: 8, name: 'Agent Pay', bubbleLabel: 'Agent Pay', family: 'payment-execution', layerPrimary: 'payment-credential', layersSecondary: ['identity-trust', 'intent-authorization', 'checkout-orders'], rails: ['card', 'multi-rail'], status: 'pilot', firstAnnounced: '2025-04-29', composesWith: [] },
];
