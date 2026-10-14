/**
 * The two TAP body objects: agenticConsumer (consumer recognition) and agenticPaymentContainer (payment).
 * Fixture values only. Teaching simplification: the spec names no canonical form for the object signature
 * base ("all fields in the order received except the signature"), so this simulation signs compact JSON of
 * those fields in insertion order with the same ephemeral key as the message signature.
 */
import { signText, verifyText, type SigAlg } from './keys';
import { base64UrlToBytes, bytesToBase64Url } from './sf';

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
export type JsonObject = { [k: string]: JsonValue };

export const CONSUMER_MIN_FIELDS = ['nonce', 'idToken', 'contextualData', 'kid', 'alg', 'signature'] as const;
export const PAYMENT_MIN_FIELDS = ['nonce', 'kid', 'alg', 'signature'] as const;

const enc = new TextEncoder();
const b64urlJson = (o: JsonObject) => bytesToBase64Url(enc.encode(JSON.stringify(o)));

export function idTokenHeader(): JsonObject {
  return { alg: 'PS256', kid: 'issuer-key-fixture', typ: 'JWT+ext.id_token' };
}

export function idTokenClaims(now: number): JsonObject {
  return {
    iss: 'https://issuer.example',
    sub: 'consumer-fixture-0001',
    aud: ['shop.example'],
    exp: now + 600,
    iat: now,
    auth_time: now - 30,
    amr: ['hwk'],
    email: 'obfuscated-email-fixture',
    email_verified: true,
    email_mask: 'j***@example.com',
    phone_number_mask: '*******1234',
  };
}

/** Fixture ID Token: real header and claims encoding, placeholder signature (Visa signs the real one). */
export function fixtureIdToken(now: number): string {
  return `${b64urlJson(idTokenHeader())}.${b64urlJson(idTokenClaims(now))}.fixture-not-signed`;
}

export function decodeJwtPart(part: string): JsonObject {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(part))) as JsonObject;
}

/** The base for a body object signature: every field except `signature`, in insertion order. */
export function objectSigningBase(obj: JsonObject): string {
  const rest: JsonObject = {};
  for (const [k, v] of Object.entries(obj)) if (k !== 'signature') rest[k] = v;
  return JSON.stringify(rest);
}

export async function signObject(obj: JsonObject, alg: SigAlg, key: CryptoKey): Promise<JsonObject> {
  const unsigned: JsonObject = {};
  for (const [k, v] of Object.entries(obj)) if (k !== 'signature') unsigned[k] = v;
  const sig = await signText(alg, key, objectSigningBase(unsigned));
  return { ...unsigned, signature: bytesToBase64Url(sig) };
}

export interface ObjectParts {
  nonce: string;
  kid: string;
  alg: string;
}

export function consumerObject(p: ObjectParts, now: number): JsonObject {
  return {
    nonce: p.nonce,
    idToken: fixtureIdToken(now),
    contextualData: { countryCode: 'US', zip: '94105', ipAddress: '192.0.2.10', deviceData: {} },
    kid: p.kid,
    alg: p.alg,
  };
}

export type PaymentVariant = 'payload' | 'browsingIOU';

export function paymentContainer(p: ObjectParts, variant: PaymentVariant, iou?: JsonObject): JsonObject {
  const head: JsonObject = { nonce: p.nonce };
  if (variant === 'payload') {
    head.payload = 'encrypted-to-merchant-public-key-fixture';
    head.cardMetadata = { lastFour: '0000', paymentAccountReference: 'par-fixture-0001', shortDescription: 'Example card' };
  } else {
    head.browsingIOU = iou ?? browsingIou(p);
  }
  return { ...head, kid: p.kid, alg: p.alg };
}

export function browsingIou(p: ObjectParts): JsonObject {
  return {
    invoiceId: 'inv-0001',
    amount: '0.25',
    cardAcceptorId: 'caid-fixture',
    acquirerId: 'acquirer-fixture',
    uri: 'https://shop.example/reviews/123',
    sequenceCounter: '1',
    paymentService: 'example-payment-service',
    kid: p.kid,
    alg: p.alg,
  };
}

export type ObjectKind = 'consumer' | 'payment';

export interface ObjectCheck {
  label: string;
  ok: boolean;
  detail: string;
}

export interface ObjectVerdict {
  ok: boolean;
  checks: ObjectCheck[];
  /** The spec's consequence when a check fails. */
  consequence: string;
}

/**
 * Verification steps from the spec (Consumer Recognition and Payment sections): minimum fields, nonce equals the
 * message signature nonce, key located for kid, signature over the other fields.
 */
export async function checkObject(
  kind: ObjectKind,
  obj: JsonObject,
  ctx: { messageNonce: string; lookup: (kid: string) => { alg: SigAlg; key: CryptoKey } | undefined },
): Promise<ObjectVerdict> {
  const checks: ObjectCheck[] = [];
  const need: readonly string[] = kind === 'consumer' ? CONSUMER_MIN_FIELDS : PAYMENT_MIN_FIELDS;
  const missing = need.filter((f) => obj[f] === undefined);
  checks.push({ label: 'Minimum fields', ok: missing.length === 0, detail: missing.length ? `Missing ${missing.join(', ')}.` : `${need.join(', ')} present.` });
  const nonceOk = obj.nonce === ctx.messageNonce;
  checks.push({ label: 'Nonce matches the message signature', ok: nonceOk, detail: nonceOk ? 'Same nonce.' : `Object nonce ${JSON.stringify(obj.nonce)} differs from ${ctx.messageNonce}.` });
  const entry = typeof obj.kid === 'string' ? ctx.lookup(obj.kid) : undefined;
  checks.push({ label: 'Key located for kid', ok: !!entry, detail: entry ? `kid ${String(obj.kid)} found.` : obj.kid === undefined ? 'The object has no kid field, so no key can be located.' : `No key for kid ${JSON.stringify(obj.kid)}.` });
  let sigOk = false;
  if (entry && typeof obj.signature === 'string') {
    try {
      sigOk = await verifyText(entry.alg, entry.key, objectSigningBase(obj), base64UrlToBytes(obj.signature));
    } catch {
      sigOk = false;
    }
  }
  checks.push({ label: 'Signature over the other fields', ok: sigOk, detail: sigOk ? 'Valid.' : 'Does not verify against the fields as received.' });
  const ok = checks.every((c) => c.ok);
  const consequence = ok
    ? kind === 'consumer'
      ? 'The merchant can rely on the object and go on to verify the ID Token with the issuer key.'
      : 'The merchant can process the payment data by type.'
    : kind === 'consumer'
      ? 'Spec outcome: the content may be inaccurate; the merchant decides whether to use it.'
      : 'Spec outcome: the container must not be used for any payment.';
  return { ok, checks, consequence };
}

/** Return a copy with one nested value changed, for tamper demos. Path like "contextualData.zip". */
export function withValue(obj: JsonObject, path: string, value: JsonValue): JsonObject {
  const copy = JSON.parse(JSON.stringify(obj)) as JsonObject;
  const keys = path.split('.');
  let cur: JsonObject = copy;
  for (const k of keys.slice(0, -1)) {
    const next = cur[k];
    if (typeof next !== 'object' || next === null || Array.isArray(next)) throw new Error(`No object at ${k}`);
    cur = next;
  }
  cur[keys[keys.length - 1]!] = value;
  return copy;
}
