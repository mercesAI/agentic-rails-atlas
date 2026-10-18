/**
 * Display labels shared by the protocol pages, the home universe, the hub pages and the
 * cross-cutting pages. One table per enum, typed against the Zod enums in schemas.ts
 * through type-only imports (so client bundles never pull in zod): a new enum value
 * fails the build until it has a label here.
 */
import type { Confidence, ControlCell, OrbitCategory, Rail, RelationType, Status } from './schemas';

type Support = ControlCell['support'];
type OrbitCategoryValue = ReturnType<(typeof OrbitCategory)['parse']>;

export const RAIL_LABELS: Record<Rail, string> = {
  crypto: 'Crypto-native',
  card: 'Card network',
  bank: 'Bank rails',
  'rail-agnostic': 'Rail-agnostic',
  'multi-rail': 'Multi-rail',
};

export const STATUS_LABELS: Record<Status, string> = {
  draft: 'Draft',
  beta: 'Beta',
  pilot: 'Pilot',
  live: 'Live',
  mixed: 'Mixed',
};

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  verified: 'Verified',
  reported: 'Reported',
  unverified: 'Unverified',
};

/** Directed relations read "from <label> to": "UCP embeds AP2". */
export const RELATION_LABELS: Record<RelationType, string> = {
  embeds: 'Embeds',
  'uses-as-rail': 'Uses as a rail',
  complements: 'Complements',
  'competes-with': 'Competes with',
  'compatible-with': 'Compatible with',
  'same-steward': 'Same steward',
  lineage: 'Lineage',
};

export const SUPPORT_LABELS: Record<Support, string> = {
  native: 'Native',
  partial: 'Partial',
  external: 'External',
  none: 'None',
};

export const ORBIT_CATEGORIES = [
  'agent-communication',
  'agent-identity',
  'wallet-permissions',
  'machine-payments',
  'card-wallet-commerce',
  'legal-policy',
] as const satisfies readonly OrbitCategoryValue[];
export type OrbitCategoryId = (typeof ORBIT_CATEGORIES)[number];

/** Full category names: headings on /orbit/ and accessible names everywhere. */
export const ORBIT_CATEGORY_LABELS: Record<OrbitCategoryValue, string> = {
  'agent-communication': 'Agent communication and tooling',
  'agent-identity': 'Agent identity and verification',
  'wallet-permissions': 'Wallet permissions and on-chain agent commerce',
  'machine-payments': 'Machine payments and money',
  'card-wallet-commerce': 'Card, wallet and commerce programs',
  'legal-policy': 'Legal and policy events',
};

/** Short names for the arcs and bands of the home universe, where the full names do not fit. */
export const ORBIT_CATEGORY_SHORT_LABELS: Record<OrbitCategoryValue, string> = {
  'agent-communication': 'Agent communication',
  'agent-identity': 'Agent identity',
  'wallet-permissions': 'Wallet permissions',
  'machine-payments': 'Machine payments',
  'card-wallet-commerce': 'Card and wallet commerce',
  'legal-policy': 'Legal and policy',
};
