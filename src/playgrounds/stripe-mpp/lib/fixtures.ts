/**
 * Fixture data for the Stripe MPP playground. Nothing here names a real chain, wallet or token deployment.
 * Spec references (research/vendor/mpp-specs): specs/core/draft-httpauth-payment-01.md,
 * specs/intents/draft-payment-intent-charge-00.md, specs/intents/draft-payment-intent-subscription-00.md,
 * specs/methods/tempo/draft-tempo-charge-00.md, draft-tempo-session-00.md, draft-tempo-subscription-00.md.
 */
import { MoneyParseError, formatMinor, parseDecimalToMinor } from '@/lib/playground/money';
import { getAddress } from 'viem';

export const CORE_SPEC = 'draft-httpauth-payment-01';
export const SESSION_SPEC = 'draft-tempo-session-00';

/** Label shown on every wire example. */
export const ILLUSTRATIVE = `Illustrative example, ${CORE_SPEC}`;

/** Fake chain id. Tempo's real chain ids (4217, 42431) are never used here. */
export const SIM_CHAIN_ID = 424242;

/** Same host and resource as the x402 playground, so the translator lines up with it. */
export const FIXTURE_HOST = 'api.example.com';
export const FIXTURE_PATH = '/weather';
export const FIXTURE_REALM = FIXTURE_HOST;

/** Fixture 6-decimal token, same address as the x402 playground fixture. */
export const FIXTURE_TOKEN = {
  address: getAddress('0x7e57000000000000000000000000000000007e57'),
  symbol: 'SIMUSD',
  decimals: 6,
} as const;

/** Fixture payee and escrow addresses. */
export const FIXTURE_RECIPIENT = getAddress('0xb0b0000000000000000000000000000000000b0b');
export const FIXTURE_ESCROW = getAddress('0xe5c0000000000000000000000000000000000e5c');
/** Fixture access key for the subscription intent (methodDetails.accessKey). */
export const FIXTURE_ACCESS_KEY = getAddress('0xacce000000000000000000000000000000000acc');

/** Canonical Permit2 address (methodDetails.permit2Address default in draft-evm-charge-00); never called here. */
export const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

/**
 * Forced close grace period: "at least 15 minutes" (draft-tempo-session-00, requestClose and Forced Close);
 * clients SHOULD wait at least 16 minutes before withdraw() to allow for block time variance.
 */
export const GRACE_PERIOD_SECONDS = 15 * 60;
export const RECOMMENDED_WAIT_SECONDS = 16 * 60;

/** Problem type base URI (core, Error Handling). */
export const PROBLEM_BASE = 'https://paymentauth.org/problems/';

export type Intent = 'charge' | 'subscription' | 'session';

/** Format base units as a decimal token amount. */
export function formatUnits(value: bigint, decimals: number = FIXTURE_TOKEN.decimals): string {
  return formatMinor(value, decimals, '', { trimZeros: true });
}

/** Parse a decimal token amount to base units. Throws on bad input, with the messages the UI shows. */
export function parseUnits(text: string, decimals: number = FIXTURE_TOKEN.decimals): bigint {
  const t = text.trim();
  // The accepted shape is checked here so the message stays the same (a trailing point is not accepted).
  if (!/^\d+(\.\d+)?$/.test(t)) throw new Error('Enter a positive decimal number, for example 0.01.');
  try {
    return parseDecimalToMinor(t, decimals);
  } catch (e) {
    if (e instanceof MoneyParseError && e.reason === 'decimals') throw new Error(`Use at most ${decimals} decimal places.`, { cause: e });
    throw e;
  }
}
