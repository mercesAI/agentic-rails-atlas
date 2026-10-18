/**
 * ES256 (ECDSA P-256 with SHA-256) keys, raw signatures and compact JWS through WebCrypto, plus the
 * RFC 7638 JWK thumbprint. Private keys are created non-extractable and live only in memory for the
 * session. WebCrypto ECDSA output is already the raw r||s form that JWS ES256 (RFC 7518 section 3.4)
 * and the RFC 9421 `ecdsa-p256-sha256` algorithm both use.
 */
import { base64UrlDecodeJson, base64UrlEncodeJson, base64UrlToBytes, bytesToBase64Url, sha256Base64Url, utf8 } from './bytes';

/** Public key shape of a P-256 JWK (RFC 7517 and 7518). */
export interface EcJwk {
  kty: 'EC';
  crv: 'P-256';
  x: string;
  y: string;
  kid?: string;
  use?: 'sig' | 'enc';
  alg?: 'ES256';
}

export interface Es256Key {
  /** A label for the UI, for example "user_sk" or "agent_sk". */
  label: string;
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicJwk: EcJwk;
}

const KEY_PARAMS: EcKeyGenParams = { name: 'ECDSA', namedCurve: 'P-256' };
const SIGN_PARAMS: EcdsaParams = { name: 'ECDSA', hash: 'SHA-256' };

export async function generateEs256Key(label: string): Promise<Es256Key> {
  const pair = (await crypto.subtle.generateKey(KEY_PARAMS, false, ['sign', 'verify'])) as CryptoKeyPair;
  // Public keys are always extractable in WebCrypto, so the JWK can be shown and placed in fixtures.
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  return { label, privateKey: pair.privateKey, publicKey: pair.publicKey, publicJwk: { kty: 'EC', crv: 'P-256', x: String(jwk.x), y: String(jwk.y) } };
}

export async function importEs256PublicJwk(jwk: Pick<EcJwk, 'x' | 'y'>): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y, ext: true }, KEY_PARAMS, true, ['verify']);
}

/** Two JWKs name the same P-256 key when kty, crv, x and y match. */
export function sameJwk(a?: Partial<EcJwk>, b?: Partial<EcJwk>): boolean {
  if (!a || !b) return false;
  return a.kty === b.kty && a.crv === b.crv && a.x === b.x && a.y === b.y;
}

/** RFC 7638 JWK thumbprint (SHA-256, base64url): required members in lexicographic order, no whitespace. */
export async function jwkThumbprint(jwk: JsonWebKey): Promise<string> {
  let members: Record<string, string | undefined>;
  if (jwk.kty === 'OKP') members = { crv: jwk.crv, kty: jwk.kty, x: jwk.x };
  else if (jwk.kty === 'EC') members = { crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y };
  else if (jwk.kty === 'RSA') members = { e: jwk.e, kty: jwk.kty, n: jwk.n };
  else throw new Error(`Unsupported key type ${String(jwk.kty)}`);
  for (const [k, v] of Object.entries(members)) if (!v) throw new Error(`JWK is missing ${k}`);
  return sha256Base64Url(JSON.stringify(members));
}

/** ES256 over UTF-8 text or bytes. Output is raw r||s (64 bytes). */
export async function signBytes(data: string | Uint8Array, key: CryptoKey): Promise<Uint8Array> {
  const bytes = typeof data === 'string' ? utf8(data) : data;
  return new Uint8Array(await crypto.subtle.sign(SIGN_PARAMS, key, bytes as BufferSource));
}

/** True when `sig` is a 64-byte r||s signature over the data by the key. Never throws. */
export async function verifyBytes(data: string | Uint8Array, sig: Uint8Array, key: CryptoKey): Promise<boolean> {
  if (sig.length !== 64) return false;
  const bytes = typeof data === 'string' ? utf8(data) : data;
  try {
    return await crypto.subtle.verify(SIGN_PARAMS, key, sig as BufferSource, bytes as BufferSource);
  } catch {
    return false;
  }
}

export type JwsHeader = { alg?: 'ES256'; typ?: string; kid?: string } & Record<string, unknown>;

/** Compact JWS. The protected header always carries `alg: "ES256"` first; other members follow in the given order. */
export async function signJws(header: JwsHeader, payload: unknown, key: CryptoKey): Promise<string> {
  const signingInput = `${base64UrlEncodeJson({ alg: 'ES256', ...header })}.${base64UrlEncodeJson(payload)}`;
  return `${signingInput}.${bytesToBase64Url(await signBytes(signingInput, key))}`;
}

export interface DecodedJws<P = Record<string, unknown>> {
  header: Record<string, unknown>;
  payload: P;
  signingInput: string;
  signature: string;
}

export function decodeJws<P = Record<string, unknown>>(compact: string): DecodedJws<P> {
  const parts = compact.split('.');
  if (parts.length !== 3) throw new Error('A compact JWS has three parts');
  const [h, p, s] = parts as [string, string, string];
  return { header: base64UrlDecodeJson<Record<string, unknown>>(h), payload: base64UrlDecodeJson<P>(p), signingInput: `${h}.${p}`, signature: s };
}

/** True when the header says ES256 and the signature over the first two parts verifies with the key. Never throws. */
export async function verifyJws(compact: string, key: CryptoKey | EcJwk): Promise<boolean> {
  try {
    const decoded = decodeJws(compact);
    if (decoded.header.alg !== 'ES256') return false;
    const sig = base64UrlToBytes(decoded.signature);
    const cryptoKey = key instanceof CryptoKey ? key : await importEs256PublicJwk(key);
    return await verifyBytes(decoded.signingInput, sig, cryptoKey);
  } catch {
    return false;
  }
}
