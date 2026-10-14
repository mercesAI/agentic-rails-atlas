// Order webhook signing and verification (openapi.agentic_checkout_webhook.yaml, 2026-04-17):
// Merchant-Signature: t=<unix_seconds>,v1=<64_hex>, v1 = HMAC-SHA256(secret, t + "." + raw_body),
// reject with 401 if missing, malformed, outside the window (recommended 300 seconds) or not verified.
// The 2025-09-29 file only says "HMAC signature over the raw request body" with no header format or window.

import type { ApiError } from './types';

export const WEBHOOK_PATH = '/agentic_checkout/webhooks/order_events';
export const TOLERANCE_SECONDS = 300;
export const SIGNATURE_PATTERN = /^t=\d+,v1=[a-fA-F0-9]{64}$/;

const enc = new TextEncoder();

export function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

export function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** A fresh 32-byte shared secret, kept in memory only. */
export function generateSecret(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

async function hmacKey(secret: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', secret as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export function signedPayload(t: number, rawBody: string): string {
  return `${t}.${rawBody}`;
}

/** Returns the Merchant-Signature header value for a raw body at Unix time t. */
export async function signWebhook(secret: Uint8Array, rawBody: string, t: number): Promise<string> {
  const key = await hmacKey(secret);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(signedPayload(t, rawBody)));
  return `t=${t},v1=${toHex(mac)}`;
}

export function parseSignatureHeader(header: string | undefined): { t: number; v1: string } | null {
  if (!header || !SIGNATURE_PATTERN.test(header)) return null;
  const [tPart, vPart] = header.split(',');
  return { t: Number(tPart!.slice(2)), v1: vPart!.slice(3) };
}

export type VerifyReason = 'ok' | 'missing' | 'malformed' | 'timestamp' | 'mismatch';

export interface VerifyResult {
  ok: boolean;
  reason: VerifyReason;
  status: 200 | 401;
  body: { received: true; request_id?: string } | ApiError;
}

const MESSAGES: Record<Exclude<VerifyReason, 'ok'>, string> = {
  // Messages are the examples in the 2026-04-17 webhook OpenAPI file.
  missing: 'Missing Merchant-Signature header.',
  malformed: 'Merchant-Signature must be t=<timestamp>,v1=<64_hex>.',
  timestamp: 'Timestamp outside allowed window.',
  mismatch: 'Webhook signature verification failed.',
};

function fail(reason: Exclude<VerifyReason, 'ok'>): VerifyResult {
  return { ok: false, reason, status: 401, body: { type: 'invalid_request', code: 'invalid_signature', message: MESSAGES[reason] } };
}

/**
 * Receiver-side check. `nowSeconds` is the receiver clock. HMAC comparison uses crypto.subtle.verify,
 * which compares in constant time.
 */
export async function verifyWebhook(opts: {
  header: string | undefined;
  rawBody: string;
  secret: Uint8Array;
  nowSeconds: number;
  toleranceSeconds?: number;
  requestId?: string;
}): Promise<VerifyResult> {
  const { header, rawBody, secret, nowSeconds, requestId } = opts;
  const tolerance = opts.toleranceSeconds ?? TOLERANCE_SECONDS;
  if (!header) return fail('missing');
  const parsed = parseSignatureHeader(header);
  if (!parsed) return fail('malformed');
  if (Math.abs(nowSeconds - parsed.t) > tolerance) return fail('timestamp');
  const key = await hmacKey(secret);
  const good = await crypto.subtle.verify('HMAC', key, fromHex(parsed.v1) as BufferSource, enc.encode(signedPayload(parsed.t, rawBody)));
  if (!good) return fail('mismatch');
  return { ok: true, reason: 'ok', status: 200, body: requestId ? { received: true, request_id: requestId } : { received: true } };
}

/** A WebhookEvent body (2026-04-17: data is the full Order with type "order"). */
export function orderEvent(kind: 'order_create' | 'order_update', checkoutSessionId: string, status: string): {
  type: string;
  data: Record<string, unknown>;
} {
  return {
    type: kind,
    data: {
      type: 'order',
      id: 'ord_fixture_001',
      checkout_session_id: checkoutSessionId,
      permalink_url: 'https://juniper-goods.example/orders/ord_fixture_001',
      status,
    },
  };
}
