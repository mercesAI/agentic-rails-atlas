/**
 * base64url and JSON Canonicalization Scheme (RFC 8785) helpers.
 * Core draft: `request` and `opaque` are base64url (RFC 4648 section 5, no "=" padding) of JCS JSON;
 * credentials and receipts are base64url-nopad JSON. mppx serializes `request` with Json.canonicalize and
 * credentials and receipts with JSON.stringify (src/PaymentRequest.ts, src/Credential.ts, src/Receipt.ts).
 */

export function base64urlEncode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return bytesToBase64url(bytes);
}

export function bytesToBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64urlDecode(data: string): string {
  if (!/^[A-Za-z0-9_-]*$/.test(data)) throw new Error('Not base64url: allowed characters are A to Z, a to z, 0 to 9, "-" and "_", with no padding.');
  if (data.length % 4 === 1) throw new Error('Not base64url: the length is not valid.');
  const std = data.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(std + '='.repeat((4 - (std.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/**
 * RFC 8785 canonical JSON: object keys sorted by UTF-16 code units, no whitespace, ECMAScript number and
 * string serialization. Undefined members are dropped, as JSON.stringify does.
 */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('JCS does not allow NaN or Infinity.');
    if (typeof value === 'bigint') return JSON.stringify(value.toString());
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((v) => (v === undefined ? 'null' : canonicalize(v))).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
}

/** base64url(JCS(value)), the wire form of `request` and `opaque`. */
export function encodeCanonical(value: unknown): string {
  return base64urlEncode(canonicalize(value));
}

/** base64url(JSON.stringify(value)), the wire form of credentials and receipts. */
export function encodeJson(value: unknown): string {
  return base64urlEncode(JSON.stringify(value));
}

export type Decoded = { ok: true; value: unknown; json: string } | { ok: false; error: string };

/** Decode a base64url JSON value with plain-language errors. */
export function decodeJson(data: string): Decoded {
  const cleaned = data.replace(/\s+/g, '');
  if (cleaned === '') return { ok: false, error: 'The value is empty.' };
  let text: string;
  try {
    text = base64urlDecode(cleaned);
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

/** Standard base64 with padding (x402 headers), for the translator. */
export function base64Encode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function base64Decode(data: string): string {
  const binary = atob(data.replace(/\s+/g, ''));
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}
