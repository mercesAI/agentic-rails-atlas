/** Fixture data only. No real merchants, cards, tokens or key directories. */
import { formatMinor as formatSharedMinor } from '@/lib/playground/money';

export const CURRENCY = 'USD';
export const SPEC_LABEL = 'Illustrative example, Verifiable Intent main (2026-04-20)';
export const PROGRAM_LABEL = 'Illustrative example, Agent Pay developer guides as read 2026-10-11';

export interface Merchant {
  id: string;
  name: string;
  website: string;
}

/** `.example` hosts never resolve. */
export const MERCHANTS: Merchant[] = [
  { id: 'merchant-audioshop', name: 'AudioShop Inc.', website: 'https://audioshop.example.com' },
  { id: 'merchant-tennis', name: 'Court Supply', website: 'https://courtsupply.example.com' },
  { id: 'merchant-other', name: 'Unlisted Store', website: 'https://unlisted.example.com' },
];

export const merchantById = (id: string): Merchant => MERCHANTS.find((m) => m.id === id) ?? (MERCHANTS[0] as Merchant);

/**
 * Minor units with the currency code after the amount, for example 27999 as "279.99 USD".
 * A typed amount can leave the safe-integer range (1e20 dollars); those keep the plain
 * fixed-point rendering instead of throwing inside a click handler.
 */
export function formatMinor(minor: number, currency = CURRENCY): string {
  if (!Number.isSafeInteger(minor)) return `${(minor / 100).toFixed(2)} ${currency}`;
  return `${formatSharedMinor(minor, 2)} ${currency}`;
}

/** A fixture agent token string. It is deliberately not card-number shaped. */
export function fixtureToken(suffix: string): string {
  return `FIXTURE-AGENTIC-TOKEN-${suffix.toUpperCase().slice(0, 8)}`;
}

/** Placeholder hosts for the signed-request example. The guide's own example host does not resolve. */
export const AGENT_KEY_HOST = 'https://agent-keys.example.com/';
export const SHOP_AUTHORITY = 'shop.example.com';
export const SHOP_PATH = '/product/42';
