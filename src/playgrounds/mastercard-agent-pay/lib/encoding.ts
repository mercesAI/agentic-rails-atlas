/** Byte, base64url and JSON helpers for the Mastercard Agent Pay playground. Pure functions, no DOM. */

const enc = new TextEncoder();
const dec = new TextDecoder();

export const utf8 = (text: string): Uint8Array => enc.encode(text);
export const fromUtf8 = (bytes: Uint8Array): string => dec.decode(bytes);

export function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i] as number);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new Error('Not base64url');
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Standard base64 with padding, which RFC 9421 uses inside `Signature: sig1=:...:`. */
export function b64Encode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i] as number);
  return btoa(bin);
}

export function b64Decode(text: string): Uint8Array {
  const bin = atob(text);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const b64urlEncodeJson = (value: unknown): string => b64urlEncode(utf8(JSON.stringify(value)));
export const b64urlDecodeJson = <T = unknown>(text: string): T => JSON.parse(fromUtf8(b64urlDecode(text))) as T;

/** B64U(SHA-256(ASCII(text))), the digest form VI uses for `sd_hash`, `checkout_hash` and disclosure hashes. */
export async function sha256B64url(text: string): Promise<string> {
  return b64urlEncode(new Uint8Array(await crypto.subtle.digest('SHA-256', utf8(text) as BufferSource)));
}

export function randomB64url(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return b64urlEncode(bytes);
}

export const pretty = (value: unknown): string => JSON.stringify(value, null, 2);

export function ellipsize(text: string, keep = 18): string {
  return text.length <= keep * 2 + 3 ? text : `${text.slice(0, keep)}...${text.slice(-keep)}`;
}
