/**
 * `request` objects and credential payloads for the tempo method, one per intent.
 * charge: draft-payment-intent-charge-00 and draft-tempo-charge-00 (payload type "hash").
 * subscription: draft-payment-intent-subscription-00 and draft-tempo-subscription-00 (payload type "keyAuthorization").
 * session: draft-tempo-session-00 (amount is price per unit; methodDetails.escrowContract required; v1 protocol).
 * Chain id is the simulated 402402; token, recipient, escrow and access key are fixtures.
 */
import { FIXTURE_ACCESS_KEY, FIXTURE_ESCROW, FIXTURE_RECIPIENT, FIXTURE_TOKEN, SIM_CHAIN_ID, type Intent } from './fixtures';

export interface RequestInputs {
  /** Base units: per charge, per period, or per unit for session. */
  amount: bigint;
  description?: string;
  externalId?: string;
  /** Session only. */
  suggestedDeposit?: bigint;
  unitType?: string;
  /** Subscription only. */
  periodUnit?: 'day' | 'week';
  periodCount?: number;
  subscriptionExpires?: string;
}

export function buildRequest(intent: Intent, i: RequestInputs): Record<string, unknown> {
  const common = { amount: i.amount.toString(), currency: FIXTURE_TOKEN.address, recipient: FIXTURE_RECIPIENT };
  if (intent === 'charge') {
    return {
      ...common,
      ...(i.description ? { description: i.description } : {}),
      ...(i.externalId ? { externalId: i.externalId } : {}),
      methodDetails: { chainId: SIM_CHAIN_ID },
    };
  }
  if (intent === 'subscription') {
    return {
      ...common,
      periodUnit: i.periodUnit ?? 'day',
      periodCount: String(i.periodCount ?? 30),
      subscriptionExpires: i.subscriptionExpires ?? '2027-10-11T00:00:00Z',
      ...(i.description ? { description: i.description } : {}),
      methodDetails: { accessKey: { accessKeyAddress: FIXTURE_ACCESS_KEY, keyType: 'p256' }, chainId: SIM_CHAIN_ID },
    };
  }
  return {
    ...common,
    unitType: i.unitType ?? 'llm_token',
    ...(i.suggestedDeposit !== undefined ? { suggestedDeposit: i.suggestedDeposit.toString() } : {}),
    methodDetails: { chainId: SIM_CHAIN_ID, escrowContract: FIXTURE_ESCROW, sessionProtocol: 'v1' },
  };
}

/** Description of what the client proves for each intent. */
export const PAYLOAD_NOTE: Record<Intent, string> = {
  charge: 'Tempo charge accepts type "transaction", "hash" or "proof". This simulation sends type "hash" with a made-up transaction hash.',
  subscription: 'Tempo subscription sends type "keyAuthorization" with a signed access key authorization. The signature here is a placeholder.',
  session: 'Tempo session sends action "open", "topUp", "voucher" or "close". Vouchers carry a real EIP-712 signature from the key generated in this browser.',
};

/** Credential payload for charge and subscription (session payloads come from session.ts). */
export function buildSimplePayload(intent: Exclude<Intent, 'session'>, fakeHash: string): Record<string, unknown> {
  if (intent === 'charge') return { type: 'hash', hash: fakeHash };
  return { type: 'keyAuthorization', signature: `${fakeHash}00` };
}

/** DID payer identifier, as the Tempo examples use (did:pkh:eip155:<chainId>:<address>). */
export function didPkh(address: string): string {
  return `did:pkh:eip155:${SIM_CHAIN_ID}:${address}`;
}
