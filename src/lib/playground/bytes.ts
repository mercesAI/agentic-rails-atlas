/**
 * Byte and text codecs shared by the playgrounds: UTF-8, standard base64 (RFC 4648 section 4, with
 * padding), base64url (section 5, no padding), hex, JSON over base64url, random bytes and SHA-256.
 * Pure functions; the only globals are TextEncoder, TextDecoder, atob, btoa and crypto.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

export function utf8(text: string): Uint8Array {
  return encoder.encode(text);
}

/** Bytes to text. Invalid UTF-8 throws rather than turning into U+FFFD, so a bad token is reported, not shown. */
export function fromUtf8(bytes: Uint8Array): string {
  return decoder.decode(bytes);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i] as number);
  return btoa(bin);
}

/** Standard base64 to bytes. atob ignores ASCII whitespace and throws on anything else that is not base64. */
export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const BASE64URL_CHARSET_ERROR = 'Not base64url: allowed characters are A to Z, a to z, 0 to 9, "-" and "_", with no padding.';
export const BASE64URL_LENGTH_ERROR = 'Not base64url: the length is not valid.';

/** base64url (no padding) to bytes, with plain-language errors for a bad alphabet or length. */
export function base64UrlToBytes(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new Error(BASE64URL_CHARSET_ERROR);
  if (text.length % 4 === 1) throw new Error(BASE64URL_LENGTH_ERROR);
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  return base64ToBytes(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
}

export function utf8ToBase64(text: string): string {
  return bytesToBase64(utf8(text));
}

export function base64ToUtf8(b64: string): string {
  return fromUtf8(base64ToBytes(b64));
}

export function utf8ToBase64Url(text: string): string {
  return bytesToBase64Url(utf8(text));
}

export function base64UrlToUtf8(text: string): string {
  return fromUtf8(base64UrlToBytes(text));
}

/** Lowercase hex, two digits per byte, optionally separated (for example by a space in a display view). */
export function bytesToHex(bytes: Uint8Array | ArrayBuffer, separator = ''): string {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join(separator);
}

export function hexToBytes(hex: string): Uint8Array {
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(hex)) throw new Error('Not hex: expected an even number of hex digits.');
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** base64url(UTF-8(JSON.stringify(value))), the encoding of JWS parts and SD-JWT disclosures. */
export function base64UrlEncodeJson(value: unknown): string {
  return utf8ToBase64Url(JSON.stringify(value));
}

export function base64UrlDecodeJson<T = unknown>(text: string): T {
  return JSON.parse(base64UrlToUtf8(text)) as T;
}

export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/** Random base64url string from the CSPRNG, used for SD-JWT salts, nonces and identifiers. */
export function randomBase64Url(byteLength = 16): string {
  return bytesToBase64Url(randomBytes(byteLength));
}

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data as BufferSource));
}

/** base64url(SHA-256(UTF-8(text))): the digest form of SD-JWT disclosures, `sd_hash` and JWK thumbprints. */
export async function sha256Base64Url(text: string): Promise<string> {
  return bytesToBase64Url(await sha256(utf8(text)));
}
