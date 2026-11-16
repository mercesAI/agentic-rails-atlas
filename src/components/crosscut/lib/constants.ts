/**
 * Client-safe schema constants. Islands import from here so the Zod schemas
 * never ship to the browser. The layer and family lists come from
 * src/lib/taxonomy.ts, which schemas.ts builds its enums from; the others are
 * copies, and tests/unit/crosscut/constants.test.ts asserts that all of them
 * stay equal to src/lib/schemas.ts.
 */
import { FAMILY_LABELS, LAYERS, LAYER_LABELS } from '../../../lib/taxonomy';

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

export const C_LAYERS = LAYERS;

export const C_LAYER_LABELS: Record<(typeof C_LAYERS)[number], string> = LAYER_LABELS;

export const C_RADAR_AXES = [
  'openness',
  'decentralization',
  'maturity',
  'adoption-evidence',
  'human-not-present',
  'dispute-support',
] as const;

export const C_FAMILY_LABELS: Record<string, string> = FAMILY_LABELS;
