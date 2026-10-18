/**
 * Challenge, credential, receipt and problem documents of the "Payment" HTTP authentication scheme
 * (specs/core/draft-httpauth-payment-01.md). The challenge `id` uses the recommended HMAC-SHA256 binding:
 * realm|method|intent|request|expires|digest[|header]|opaque, base64url without padding. The HMAC runs in
 * WebCrypto on a key generated in this browser. Auth-param order follows mppx Challenge.serialize.
 */
import { base64UrlToUtf8, bytesToBase64Url } from '@/lib/playground/bytes';
import { decodeJson, encodeJson } from './codec';
import { PROBLEM_BASE } from './fixtures';

export const PAYMENT_AUTHORIZATION = 'Payment-Authorization';

export interface Challenge {
  id: string;
  realm: string;
  method: string;
  intent: string;
  /** base64url of the JCS request JSON, exactly as on the wire. */
  request: string;
  expires?: string;
  digest?: string;
  description?: string;
  header?: typeof PAYMENT_AUTHORIZATION;
  /** base64url of a JCS flat string map. */
  opaque?: string;
}

export type UnsignedChallenge = Omit<Challenge, 'id'>;

export interface Credential {
  challenge: Challenge;
  source?: string;
  payload: Record<string, unknown>;
}

export interface Receipt {
  status: 'success';
  method: string;
  timestamp: string;
  reference: string;
  [extra: string]: unknown;
}

/** HMAC input string. Absent optional slots are empty strings; the header slot appears only when present. */
export function bindingInput(c: UnsignedChallenge): string {
  const values = [c.realm, c.method, c.intent, c.request, c.expires ?? '', c.digest ?? ''];
  if (c.header !== undefined) values.push(c.header);
  values.push(c.opaque ?? '');
  return values.join('|');
}

/** Import raw bytes as an HMAC-SHA256 key. */
export async function importHmacKey(secret: Uint8Array | string): Promise<CryptoKey> {
  const raw = typeof secret === 'string' ? new TextEncoder().encode(secret) : secret;
  return crypto.subtle.importKey('raw', raw as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

/** A fresh server secret for this session only (32 random bytes, never persisted). */
export async function generateServerKey(): Promise<CryptoKey> {
  return importHmacKey(crypto.getRandomValues(new Uint8Array(32)));
}

export async function computeChallengeId(key: CryptoKey, c: UnsignedChallenge): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(bindingInput(c)));
  return bytesToBase64Url(new Uint8Array(sig));
}

export async function issueChallenge(key: CryptoKey, c: UnsignedChallenge): Promise<Challenge> {
  return { id: await computeChallengeId(key, c), ...c };
}

function authParam(name: string, value: string): string {
  if (/[\r\n]/.test(value)) throw new Error('Invalid quoted-string value.');
  return `${name}="${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** The WWW-Authenticate field value. */
export function serializeChallenge(c: Challenge): string {
  const parts = [
    authParam('id', c.id),
    authParam('realm', c.realm),
    authParam('method', c.method),
    authParam('intent', c.intent),
    authParam('request', c.request),
  ];
  if (c.description !== undefined) parts.push(authParam('description', c.description));
  if (c.digest !== undefined) parts.push(authParam('digest', c.digest));
  if (c.expires !== undefined) parts.push(authParam('expires', c.expires));
  if (c.header !== undefined) parts.push(authParam('header', c.header));
  if (c.opaque !== undefined) parts.push(authParam('opaque', c.opaque));
  return `Payment ${parts.join(', ')}`;
}

/** Parse a single Payment challenge (auth-params with token or quoted-string values). */
export function parseChallenge(value: string): Challenge {
  const m = /^\s*Payment\s+(.*)$/s.exec(value);
  if (!m) throw new Error('The value does not start with the Payment scheme.');
  const params: Record<string, string> = {};
  const re = /\s*([A-Za-z0-9_-]+)\s*=\s*(?:"((?:[^"\\]|\\.)*)"|([^\s,]+))\s*(?:,|$)/gy;
  const rest = (m[1] ?? '').trim();
  let pos = 0;
  while (pos < rest.length) {
    re.lastIndex = pos;
    const match = re.exec(rest);
    if (!match) throw new Error('The auth-params could not be parsed.');
    const name = (match[1] ?? '').toLowerCase();
    params[name] = match[2] !== undefined ? match[2].replace(/\\(.)/g, '$1') : (match[3] ?? '');
    pos = re.lastIndex;
  }
  for (const req of ['id', 'realm', 'method', 'intent', 'request'] as const) {
    if (!params[req]) throw new Error(`The required parameter "${req}" is missing or empty.`);
  }
  if (params.header !== undefined && params.header !== PAYMENT_AUTHORIZATION) {
    throw new Error('The header parameter may only be Payment-Authorization.');
  }
  const get = (k: string): string => params[k] ?? '';
  const c: Challenge = { id: get('id'), realm: get('realm'), method: get('method'), intent: get('intent'), request: get('request') };
  for (const opt of ['expires', 'digest', 'description', 'opaque'] as const) {
    const v = params[opt];
    if (v !== undefined) c[opt] = v;
  }
  if (params.header !== undefined) c.header = PAYMENT_AUTHORIZATION;
  return c;
}

/** Echo every challenge parameter the server sent. `header` is echoed only when the challenge had it. */
export function buildCredential(c: Challenge, payload: Record<string, unknown>, source?: string): Credential {
  const challenge: Challenge = { ...c };
  return source ? { challenge, source, payload } : { challenge, payload };
}

/** The HTTP field the challenge selects for the credential. */
export function credentialField(c: Challenge): 'Authorization' | typeof PAYMENT_AUTHORIZATION {
  return c.header === PAYMENT_AUTHORIZATION ? PAYMENT_AUTHORIZATION : 'Authorization';
}

/** [field name, field value] of the credential header. */
export function serializeCredential(cred: Credential): [string, string] {
  return [credentialField(cred.challenge), `Payment ${encodeJson(cred)}`];
}

export function parseCredential(value: string): Credential {
  const m = /^\s*Payment\s+([A-Za-z0-9_-]+)\s*$/.exec(value);
  if (!m) throw new Error('The value is not "Payment" followed by one base64url token.');
  const d = decodeJson(m[1] ?? '');
  if (!d.ok) throw new Error(d.error);
  const v = d.value as Partial<Credential> | null;
  if (!v || typeof v !== 'object' || typeof v.challenge !== 'object' || typeof v.payload !== 'object') {
    throw new Error('The credential needs "challenge" and "payload" objects.');
  }
  return v as Credential;
}

export function serializeReceipt(r: Receipt): string {
  return encodeJson(r);
}

export type ProblemCode =
  | 'payment-required'
  | 'payment-insufficient'
  | 'payment-expired'
  | 'verification-failed'
  | 'method-unsupported'
  | 'malformed-credential'
  | 'invalid-challenge'
  | 'bad-request'
  | 'invalid-payload'
  | 'internal-payment-error'
  | 'payment-action-required';

export const PROBLEM_STATUS: Record<ProblemCode, number> = {
  'payment-required': 402,
  'payment-insufficient': 402,
  'payment-expired': 402,
  'verification-failed': 402,
  'method-unsupported': 400,
  'malformed-credential': 402,
  'invalid-challenge': 402,
  'bad-request': 400,
  'invalid-payload': 402,
  'internal-payment-error': 500,
  'payment-action-required': 402,
};

const TITLES: Record<ProblemCode, string> = {
  'payment-required': 'Payment Required',
  'payment-insufficient': 'Payment Insufficient',
  'payment-expired': 'Payment Expired',
  'verification-failed': 'Verification Failed',
  'method-unsupported': 'Method Unsupported',
  'malformed-credential': 'Malformed Credential',
  'invalid-challenge': 'Invalid Challenge',
  'bad-request': 'Bad Request',
  'invalid-payload': 'Invalid Payload',
  'internal-payment-error': 'Internal Payment Error',
  'payment-action-required': 'Payment Action Required',
};

export interface Problem {
  type: string;
  title: string;
  status: number;
  detail: string;
}

/** RFC 9457 problem document with the core draft's problem type URI. */
export function problem(code: ProblemCode, detail: string): Problem {
  return { type: `${PROBLEM_BASE}${code}`, title: TITLES[code], status: PROBLEM_STATUS[code], detail };
}

/** Server-side state for verification: the HMAC key and the ids already consumed (single use). */
export interface ServerState {
  key: CryptoKey;
  realm: string;
  used: Set<string>;
}

export type Verdict =
  | { status: 200; receipt: Receipt }
  | { status: 403; detail: string }
  | { status: 400 | 402 | 500; problem: Problem; freshChallenge: boolean };

export interface VerifyOptions {
  /** The header field the credential arrived in. */
  field: string;
  now: Date;
  /** Simulated payment proof check result (method-specific, not modeled in the core). */
  proofValid?: boolean;
  /** Server policy after a valid payment, for the 403 case. */
  policyDenies?: boolean;
  /** Receipt reference, for example a simulated transaction hash. */
  reference: string;
  receiptExtra?: Record<string, unknown>;
}

/**
 * Verify a credential the way the core draft's status table describes: malformed, unknown or reused id,
 * binding mismatch, expiry, proof, then policy. Consumes the id on success and on a paid 403.
 */
export async function verifyCredential(state: ServerState, raw: string, o: VerifyOptions): Promise<Verdict> {
  let cred: Credential;
  try {
    cred = parseCredential(raw);
  } catch (e) {
    return { status: 402, problem: problem('malformed-credential', e instanceof Error ? e.message : String(e)), freshChallenge: true };
  }
  const c = cred.challenge;
  if (o.field !== credentialField(c)) {
    return {
      status: 402,
      problem: problem('invalid-challenge', `The credential arrived in ${o.field}, but the challenge selected ${credentialField(c)}.`),
      freshChallenge: true,
    };
  }
  if (!c.id || state.used.has(c.id)) {
    return { status: 402, problem: problem('invalid-challenge', 'This challenge id was already used.'), freshChallenge: true };
  }
  const { id, ...rest } = c;
  const expected = await computeChallengeId(state.key, rest);
  if (expected !== id || c.realm !== state.realm) {
    return {
      status: 402,
      problem: problem('invalid-challenge', 'The echoed parameters do not match the challenge id binding.'),
      freshChallenge: true,
    };
  }
  if (c.expires !== undefined && Date.parse(c.expires) <= o.now.getTime()) {
    return { status: 402, problem: problem('payment-expired', `The challenge expired at ${c.expires}.`), freshChallenge: true };
  }
  try {
    base64UrlToUtf8(c.request);
  } catch {
    return { status: 402, problem: problem('malformed-credential', 'The echoed request is not base64url.'), freshChallenge: true };
  }
  if (o.proofValid === false) {
    return { status: 402, problem: problem('verification-failed', 'The payment proof did not verify.'), freshChallenge: true };
  }
  state.used.add(id);
  if (o.policyDenies) {
    return { status: 403, detail: 'Payment verified, but policy denies access. No new challenge is sent.' };
  }
  return {
    status: 200,
    receipt: { status: 'success', method: c.method, timestamp: o.now.toISOString().replace(/\.\d{3}Z$/, 'Z'), reference: o.reference, ...o.receiptExtra },
  };
}

/** RFC 3339 timestamp `seconds` after `now`, without milliseconds. */
export function expiresIn(now: Date, seconds: number): string {
  return new Date(now.getTime() + seconds * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Accept-Payment request header value, for example "tempo/charge, stripe/charge;q=0.5". */
export function serializeAcceptPayment(entries: { method: string; intent: string; q?: number }[]): string {
  return entries.map((e) => `${e.method}/${e.intent}${e.q !== undefined && e.q !== 1 ? `;q=${e.q}` : ''}`).join(', ');
}
