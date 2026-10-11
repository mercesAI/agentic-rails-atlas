/**
 * x402 V2 to MPP header translator. The mapping (PAYMENT-REQUIRED to WWW-Authenticate: Payment,
 * PAYMENT-SIGNATURE to Authorization: Payment, PAYMENT-RESPONSE to Payment-Receipt, x402 exact to the MPP
 * charge intent) is the one MPP's comparison page gives. Target fields come from
 * specs/methods/evm/draft-evm-charge-00.md (method "evm", credential type "authorization" for EIP-3009).
 * x402 headers are standard base64 JSON (x402 transports-v2/http.md); MPP uses base64url without padding.
 */
import { base64Decode, encodeCanonical, encodeJson } from './codec';
import { computeChallengeId, serializeChallenge, serializeReceipt, type Challenge, type Credential, type Receipt } from './challenge';
import { FIXTURE_REALM, FIXTURE_RECIPIENT, FIXTURE_TOKEN, PERMIT2_ADDRESS, SIM_CHAIN_ID } from './fixtures';

export interface X402Requirements {
  scheme: string;
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
}

export interface X402PaymentRequired {
  x402Version: number;
  error?: string;
  resource?: { url: string; description?: string; mimeType?: string };
  accepts: X402Requirements[];
}

export interface X402PaymentPayload {
  x402Version: number;
  accepted: X402Requirements;
  payload: { signature?: string; authorization?: Record<string, string> };
}

export interface X402SettleResponse {
  success: boolean;
  transaction: string;
  network: string;
  payer?: string;
}

export interface Translation<T> {
  ok: boolean;
  header?: [string, string];
  decoded?: T;
  notes: string[];
  error?: string;
}

function decodeX402<T>(value: string): T {
  return JSON.parse(base64Decode(value)) as T;
}

/** "eip155:424242" to 424242; anything else is rejected because draft-evm-charge-00 needs an EIP-155 chain id. */
export function chainIdFromCaip2(network: string): number | null {
  const m = /^eip155:(\d+)$/.exec(network);
  return m ? Number(m[1]) : null;
}

/** Build the MPP evm charge request from one x402 exact requirement. */
export function requestFromRequirement(r: X402Requirements): Record<string, unknown> | null {
  const chainId = chainIdFromCaip2(r.network);
  if (chainId === null) return null;
  return {
    amount: r.amount,
    currency: r.asset,
    recipient: r.payTo,
    methodDetails: { chainId, credentialTypes: ['authorization'], permit2Address: PERMIT2_ADDRESS },
  };
}

export async function translatePaymentRequired(value: string, key: CryptoKey, now: Date): Promise<Translation<Challenge>> {
  let pr: X402PaymentRequired;
  try {
    pr = decodeX402<X402PaymentRequired>(value);
  } catch {
    return { ok: false, notes: [], error: 'PAYMENT-REQUIRED is not base64 JSON.' };
  }
  const r = pr.accepts?.[0];
  if (!r) return { ok: false, notes: [], error: 'accepts[] is empty.' };
  if (r.scheme !== 'exact') {
    return {
      ok: false,
      notes: ['MPP documentation pairs x402 upto with usage-based session methods, not with charge.'],
      error: `Scheme "${r.scheme}" has no charge equivalent; only exact maps to charge.`,
    };
  }
  const request = requestFromRequirement(r);
  if (!request) return { ok: false, notes: [], error: `Network "${r.network}" is not an eip155 CAIP-2 id.` };
  const expires = new Date(now.getTime() + r.maxTimeoutSeconds * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const unsigned = {
    realm: FIXTURE_REALM,
    method: 'evm',
    intent: 'charge',
    request: encodeCanonical(request),
    expires,
    ...(pr.resource?.description ? { description: pr.resource.description } : {}),
  };
  const challenge: Challenge = { id: await computeChallengeId(key, unsigned), ...unsigned };
  return {
    ok: true,
    header: ['WWW-Authenticate', serializeChallenge(challenge)],
    decoded: challenge,
    notes: [
      'scheme "exact" becomes intent "charge"; network eip155:<id> becomes methodDetails.chainId.',
      'asset becomes currency, payTo becomes recipient, amount stays in base units.',
      'maxTimeoutSeconds has no MPP field; the simulation sets expires to now plus that many seconds (teaching simplification).',
      'The token name and version in extra are not carried: draft-evm-charge-00 has no field for them.',
    ],
  };
}

export function translatePaymentSignature(value: string, challenge: Challenge, source?: string): Translation<Credential> {
  let pp: X402PaymentPayload;
  try {
    pp = decodeX402<X402PaymentPayload>(value);
  } catch {
    return { ok: false, notes: [], error: 'PAYMENT-SIGNATURE is not base64 JSON.' };
  }
  const auth = pp.payload?.authorization;
  if (!auth || !pp.payload.signature) return { ok: false, notes: [], error: 'Only the EIP-3009 authorization payload of exact is translated.' };
  const cred: Credential = {
    challenge,
    payload: {
      type: 'authorization',
      from: auth.from,
      to: auth.to,
      value: auth.value,
      validAfter: auth.validAfter,
      validBefore: auth.validBefore,
      nonce: auth.nonce,
      signature: pp.payload.signature,
    },
    ...(source ? { source } : {}),
  };
  return {
    ok: true,
    header: ['Authorization', `Payment ${encodeJson(cred)}`],
    decoded: cred,
    notes: [
      'payload.authorization fields move up into an evm "authorization" payload next to the signature.',
      'Not a drop-in: draft-evm-charge-00 requires nonce = keccak256(challenge.id, challenge.realm), while x402 uses a random nonce, so a real x402 signature would fail MPP verification. The client must sign again.',
    ],
  };
}

export function translatePaymentResponse(value: string, now: Date): Translation<Receipt> {
  let sr: X402SettleResponse;
  try {
    sr = decodeX402<X402SettleResponse>(value);
  } catch {
    return { ok: false, notes: [], error: 'PAYMENT-RESPONSE is not base64 JSON.' };
  }
  if (!sr.success) {
    return { ok: false, notes: ['Payment-Receipt is only sent on success; failures are 402 with a problem document.'], error: 'success is false.' };
  }
  const receipt: Receipt = {
    status: 'success',
    method: 'evm',
    timestamp: now.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    reference: sr.transaction,
  };
  return {
    ok: true,
    header: ['Payment-Receipt', serializeReceipt(receipt)],
    decoded: receipt,
    notes: ['transaction becomes reference; network and payer have no core receipt field.', 'timestamp is the simulated settlement time.'],
  };
}

/** Sample x402 V2 headers that match the x402 playground fixtures, for preloading the translator. */
export function sampleX402(now: Date, payer: string): { required: string; signature: string; response: string } {
  const req: X402Requirements = {
    scheme: 'exact',
    network: `eip155:${SIM_CHAIN_ID}`,
    amount: '10000',
    asset: FIXTURE_TOKEN.address,
    payTo: FIXTURE_RECIPIENT,
    maxTimeoutSeconds: 60,
    extra: { name: 'Sim USD', version: '2' },
  };
  const b64 = (v: unknown) => btoa(JSON.stringify(v));
  const validBefore = String(Math.floor(now.getTime() / 1000) + 60);
  return {
    required: b64({
      x402Version: 2,
      error: 'PAYMENT-SIGNATURE header is required',
      resource: { url: 'https://api.example.com/weather', description: 'Current weather for one city', mimeType: 'application/json' },
      accepts: [req],
      extensions: {},
    }),
    signature: b64({
      x402Version: 2,
      accepted: req,
      payload: {
        signature: `0x${'ab'.repeat(65)}`,
        authorization: { from: payer, to: req.payTo, value: req.amount, validAfter: '0', validBefore, nonce: `0x${'11'.repeat(32)}` },
      },
    }),
    response: b64({ success: true, transaction: `0x${'cd'.repeat(32)}`, network: req.network, payer }),
  };
}
