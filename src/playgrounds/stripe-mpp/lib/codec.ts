/**
 * Wire codecs of the Stripe MPP drafts on top of the shared base64url and JCS modules.
 * Core draft: `request` and `opaque` are base64url (RFC 4648 section 5, no "=" padding) of JCS JSON;
 * credentials and receipts are base64url-nopad JSON. mppx serializes `request` with Json.canonicalize and
 * credentials and receipts with JSON.stringify (src/PaymentRequest.ts, src/Credential.ts, src/Receipt.ts).
 */
import { base64UrlToUtf8, utf8ToBase64Url } from '@/lib/playground/bytes';
import { canonicalize } from '@/lib/playground/canonical-json';

/** base64url(JCS(value)), the wire form of `request` and `opaque`. */
export function encodeCanonical(value: unknown): string {
  return utf8ToBase64Url(canonicalize(value));
}

/** base64url(JSON.stringify(value)), the wire form of credentials and receipts. */
export function encodeJson(value: unknown): string {
  return utf8ToBase64Url(JSON.stringify(value));
}

export type Decoded = { ok: true; value: unknown; json: string } | { ok: false; error: string };

/** Decode a base64url JSON value with plain-language errors. */
export function decodeJson(data: string): Decoded {
  const cleaned = data.replace(/\s+/g, '');
  if (cleaned === '') return { ok: false, error: 'The value is empty.' };
  let text: string;
  try {
    text = base64UrlToUtf8(cleaned);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  try {
    const value: unknown = JSON.parse(text);
    return { ok: true, value, json: JSON.stringify(value, null, 2) };
  } catch {
    return { ok: false, error: 'The decoded text is not JSON.' };
  }
}

/** True when a base64url `request` value is the JCS form of its own JSON (what the core draft requires). */
export function isCanonical(data: string): boolean {
  const d = decodeJson(data);
  return d.ok && encodeCanonical(d.value) === data;
}
