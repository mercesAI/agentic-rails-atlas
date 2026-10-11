/**
 * Fixture data for the x402 playground. Nothing here names a real chain, wallet or token deployment.
 * Spec references: research/vendor/x402/specs/x402-specification-v2.md (v2.0, 2025-12-09) and
 * x402-specification-v1.md; SDK references: research/vendor/x402/typescript (@x402/core 2.28.0).
 */
import { getAddress, type Address } from 'viem';

export type Version = 1 | 2;
export type Scheme = 'exact' | 'upto';
export type PaymentFlow = 'authorization' | 'upfront' | 'escrow';

/** Label shown on every wire example. */
export function specVersionLabel(version: Version): string {
  return version === 2 ? 'v2.0' : 'v1';
}

export function illustrativeLabel(version: Version): string {
  return `Illustrative example, spec version ${specVersionLabel(version)}`;
}

/** Fake chain. 424242 is not a public chain id used by x402. */
export const SIM_CHAIN_ID = 424242;
/** V2 networks are CAIP-2 strings (spec v2 section 11.1). */
export const SIM_NETWORK_V2 = `eip155:${SIM_CHAIN_ID}`;
/**
 * V1 networks are plain names from a fixed list (spec v1 section 11.1, for example `base-sepolia`).
 * Teaching simplification: the simulation uses a made-up name so that no real network is named.
 */
export const SIM_NETWORK_V1 = 'sim-424242';

export function networkFor(version: Version): string {
  return version === 2 ? SIM_NETWORK_V2 : SIM_NETWORK_V1;
}

/** Fixture token: a 6-decimal stand-in for a USD stablecoin that supports EIP-3009. */
export const FIXTURE_TOKEN = {
  address: getAddress('0x7e57000000000000000000000000000000007e57'),
  /** EIP-712 domain name and version, carried in `extra.name` and `extra.version`. */
  name: 'Sim USD',
  version: '2',
  symbol: 'SIMUSD',
  decimals: 6,
} as const;

/** The resource server's payTo address (fixture). */
export const FIXTURE_PAY_TO: Address = getAddress('0xb0b0000000000000000000000000000000000b0b');
/** A different address, used by the wrong-payTo failure (fixture). */
export const FIXTURE_WRONG_PAY_TO: Address = getAddress('0xe7e0000000000000000000000000000000000e7e');
/** The facilitator signer address for the upto witness (fixture). */
export const FIXTURE_FACILITATOR: Address = getAddress('0xfac1000000000000000000000000000000000fac');

/**
 * Canonical Permit2 and x402 upto proxy addresses from the SDK constants
 * (typescript/packages/mechanisms/evm/src/constants.ts). They are deployed with CREATE2 at the
 * same address on every chain; here they only feed the EIP-712 domain and are never called.
 */
export const PERMIT2_ADDRESS: Address = getAddress('0x000000000022D473030F116dDEE9F6B43aC78BA3');
export const UPTO_PERMIT2_PROXY: Address = getAddress('0x4020A4f3b7b90ccA423B9fabCc0CE57C6C240002');

export const FIXTURE_RESOURCE = {
  url: 'https://api.example.com/weather',
  description: 'Current weather for one city',
  mimeType: 'application/json',
} as const;

export const FIXTURE_HOST = 'api.example.com';
export const FIXTURE_PATH = '/weather';

/** maxTimeoutSeconds in the requirements (spec examples use 60). */
export const MAX_TIMEOUT_SECONDS = 60;

/** HTTPFacilitatorClient default timeout (typescript/packages/core/src/http/httpFacilitatorClient.ts). */
export const FACILITATOR_TIMEOUT_MS = 90_000;

/** Payer balance at the start of a run, in atomic units (5.00 SIMUSD). */
export const START_BALANCE = 5_000_000n;
/** Payer balance for the insufficient-balance failure (0.005 SIMUSD). */
export const LOW_BALANCE = 5_000n;
