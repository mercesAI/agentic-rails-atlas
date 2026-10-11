/**
 * The 11 payment method identifiers with a spec file in research/vendor/mpp-specs/specs/methods/, and the
 * intents each file defines (from each document's IANA Considerations table and its intent="..." examples).
 * `monad` and `redotpay` appear on mpp.dev without a spec file and are left out.
 */
import type { Intent } from './fixtures';

export interface MethodInfo {
  id: string;
  rail: string;
  intents: Intent[];
  files: string[];
}

export const METHODS: MethodInfo[] = [
  { id: 'tempo', rail: 'Tempo TIP-20 tokens', intents: ['charge', 'session', 'subscription'], files: ['draft-tempo-charge-00', 'draft-tempo-session-00', 'draft-tempo-subscription-00'] },
  { id: 'stripe', rail: 'Stripe Shared Payment Tokens', intents: ['charge', 'subscription'], files: ['draft-stripe-charge-00', 'draft-stripe-subscription-00'] },
  { id: 'card', rail: 'Encrypted card network tokens', intents: ['charge'], files: ['draft-card-charge-00'] },
  { id: 'lightning', rail: 'Lightning BOLT11 invoices', intents: ['charge', 'session'], files: ['draft-lightning-charge-00', 'draft-lightning-session-00'] },
  { id: 'evm', rail: 'ERC-20 tokens on EVM chains', intents: ['charge', 'session'], files: ['draft-evm-charge-00', 'draft-evm-session-00'] },
  { id: 'solana', rail: 'SOL and SPL tokens', intents: ['charge', 'session'], files: ['draft-solana-charge-00', 'draft-solana-session-00'] },
  { id: 'stellar', rail: 'Stellar SEP-41 tokens', intents: ['charge'], files: ['draft-stellar-charge-00'] },
  { id: 'hedera', rail: 'Hedera Token Service', intents: ['charge', 'session'], files: ['draft-hedera-charge-00', 'draft-hedera-session-00'] },
  { id: 'usdc', rail: 'Circle USDC across networks', intents: ['charge'], files: ['draft-usdc-charge-00'] },
  { id: 'nearintents', rail: 'NEAR Intents cross-chain swaps', intents: ['charge'], files: ['draft-nearintents-charge-01'] },
  { id: 'xrpl', rail: 'XRP Ledger payments and channels', intents: ['charge', 'session'], files: ['draft-xrpl-charge-00', 'draft-xrpl-session-00'] },
];

export const INTENTS: Intent[] = ['charge', 'subscription', 'session'];

/** Intent-level spec: charge and subscription have intent drafts; session is defined per method. */
export const INTENT_SPEC: Record<Intent, string> = {
  charge: 'draft-payment-intent-charge-00',
  subscription: 'draft-payment-intent-subscription-00',
  session: 'No intent draft: each method defines its own session (for Tempo, draft-tempo-session-00)',
};

export function supports(methodId: string, intent: Intent): boolean {
  return METHODS.some((m) => m.id === methodId && m.intents.includes(intent));
}

export function methodsFor(intent: Intent): string[] {
  return METHODS.filter((m) => m.intents.includes(intent)).map((m) => m.id);
}

/** Method ids are lowercase ASCII letters only (core: payment-method-id = 1*LOWERALPHA). */
export function isValidMethodId(id: string): boolean {
  return /^[a-z]+$/.test(id);
}
