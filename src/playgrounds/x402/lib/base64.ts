/**
 * Base64 JSON header codec. x402 V2 carries PAYMENT-REQUIRED, PAYMENT-SIGNATURE and PAYMENT-RESPONSE
 * as base64-encoded JSON (specs/transports-v2/http.md); V1 does the same for X-PAYMENT and
 * X-PAYMENT-RESPONSE (specs/transports-v1/http.md). The encoding mirrors safeBase64Encode in
 * typescript/packages/core/src/utils/index.ts: UTF-8 bytes, standard alphabet, with padding.
 */
import { base64ToUtf8, utf8ToBase64 } from '@/lib/playground/bytes';

/** JSON.stringify with bigint support (bigints become decimal strings). */
export function toJson(value: unknown, indent?: number): string {
  return JSON.stringify(value, (_k, v: unknown) => (typeof v === 'bigint' ? v.toString() : v), indent);
}

/** Encode an object as the header value: compact JSON, then base64. */
export function encodeHeader(value: unknown): string {
  return utf8ToBase64(toJson(value));
}

export type DecodeResult = { ok: true; value: unknown; json: string } | { ok: false; error: string };

/** Decode a header value. Whitespace is ignored; errors are explained in plain words. */
export function decodeHeader(input: string): DecodeResult {
  const cleaned = input.replace(/\s+/g, '');
  if (cleaned === '') return { ok: false, error: 'The header value is empty.' };
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned) || cleaned.length % 4 === 1) {
    return { ok: false, error: 'This is not standard base64 (allowed: A to Z, a to z, 0 to 9, +, / and = padding).' };
  }
  let text: string;
  try {
    text = base64ToUtf8(cleaned);
  } catch {
    return { ok: false, error: 'The bytes are not valid UTF-8 text.' };
  }
  try {
    const value: unknown = JSON.parse(text);
    return { ok: true, value, json: JSON.stringify(value, null, 2) };
  } catch {
    return { ok: false, error: 'The decoded text is not JSON. x402 headers carry base64-encoded JSON.' };
  }
}

/** Encode user-typed JSON text. Returns an error message when the text is not JSON. */
export function encodeJsonText(text: string): { ok: true; value: string } | { ok: false; error: string } {
  try {
    const parsed: unknown = JSON.parse(text);
    return { ok: true, value: encodeHeader(parsed) };
  } catch (e) {
    return { ok: false, error: `The text is not valid JSON: ${e instanceof Error ? e.message : String(e)}` };
  }
}
