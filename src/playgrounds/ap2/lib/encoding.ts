/**
 * Byte, base64url and JSON helpers for the AP2 playground. Pure functions, no DOM.
 * base64url follows RFC 4648 section 5 without padding, which is what JWS and SD-JWT use.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

export function utf8(text: string): Uint8Array {
  return enc.encode(text);
}

export function fromUtf8(bytes: Uint8Array): string {
  return dec.decode(bytes);
}

export function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i] as number);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new Error('Not base64url');
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function b64urlEncodeJson(value: unknown): string {
  return b64urlEncode(utf8(JSON.stringify(value)));
}

export function b64urlDecodeJson<T = unknown>(text: string): T {
  return JSON.parse(fromUtf8(b64urlDecode(text))) as T;
}

/** JSON with object keys sorted at every level. Used where the spec says "canonical JSON" without naming a scheme. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      out[k] = sortKeys((value as Record<string, unknown>)[k]);
    }
    return out;
  }
  return value;
}

/** Structural equality on JSON values (key order ignored). */
export function jsonEqual(a: unknown, b: unknown): boolean {
  return canonicalJson(a) === canonicalJson(b);
}

/** SHA-256 over the ASCII or UTF-8 bytes of a string, base64url encoded. This is how SD-JWT computes digests and `sd_hash`. */
export async function sha256B64url(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', utf8(text) as BufferSource);
  return b64urlEncode(new Uint8Array(digest));
}

/** Random base64url string, used for SD-JWT salts, nonces and identifiers. */
export function randomB64url(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return b64urlEncode(bytes);
}

/** Pretty JSON for display. */
export function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/** Shorten a long token for display while keeping both ends visible. */
export function ellipsize(text: string, keep = 18): string {
  if (text.length <= keep * 2 + 3) return text;
  return `${text.slice(0, keep)}...${text.slice(-keep)}`;
}
