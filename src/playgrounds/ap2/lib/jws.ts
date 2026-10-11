/**
 * ES256 (ECDSA P-256 with SHA-256) keys and compact JWS through WebCrypto.
 * Private keys are created non-extractable and live only in memory for the session.
 * WebCrypto ECDSA output is already the raw r||s form that JWS ES256 requires (RFC 7518 section 3.4).
 */
import { b64urlDecode, b64urlDecodeJson, b64urlEncode, b64urlEncodeJson, utf8 } from './encoding';

/** Public key shape from `code/sdk/schemas/ap2/types/jwk.json` (EC P-256 only). */
export interface Ap2Jwk {
  kty: 'EC';
  crv: 'P-256';
  x: string;
  y: string;
  use?: 'sig' | 'enc';
  alg?: 'ES256';
  kid?: string;
}

export interface Es256Key {
  /** A label for the UI, for example "user_sk" or "agent_sk". */
  label: string;
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicJwk: Ap2Jwk;
}

const ALG: EcKeyGenParams = { name: 'ECDSA', namedCurve: 'P-256' };
const SIGN: EcdsaParams = { name: 'ECDSA', hash: 'SHA-256' };

export async function generateEs256Key(label: string): Promise<Es256Key> {
  const pair = (await crypto.subtle.generateKey(ALG, false, ['sign', 'verify'])) as CryptoKeyPair;
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  return {
    label,
    privateKey: pair.privateKey,
    publicKey: pair.publicKey,
    publicJwk: { kty: 'EC', crv: 'P-256', x: String(jwk.x), y: String(jwk.y) },
  };
}

export async function importEs256PublicJwk(jwk: Ap2Jwk): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y, ext: true }, ALG, true, ['verify']);
}

/** Two JWKs name the same P-256 key when kty, crv, x and y match. */
export function sameJwk(a: Partial<Ap2Jwk> | undefined, b: Partial<Ap2Jwk> | undefined): boolean {
  if (!a || !b) return false;
  return a.kty === b.kty && a.crv === b.crv && a.x === b.x && a.y === b.y;
}

export type JwsHeader = { alg: 'ES256'; typ?: string; kid?: string } & Record<string, unknown>;

export async function signJws(header: JwsHeader, payload: unknown, key: CryptoKey): Promise<string> {
  const signingInput = `${b64urlEncodeJson(header)}.${b64urlEncodeJson(payload)}`;
  const sig = await crypto.subtle.sign(SIGN, key, utf8(signingInput) as BufferSource);
  return `${signingInput}.${b64urlEncode(new Uint8Array(sig))}`;
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
  return {
    header: b64urlDecodeJson<Record<string, unknown>>(h),
    payload: b64urlDecodeJson<P>(p),
    signingInput: `${h}.${p}`,
    signature: s,
  };
}

/** True when the signature over the first two parts verifies with the key and the header says ES256. */
export async function verifyJws(compact: string, key: CryptoKey): Promise<boolean> {
  let decoded: DecodedJws;
  try {
    decoded = decodeJws(compact);
  } catch {
    return false;
  }
  if (decoded.header.alg !== 'ES256') return false;
  let sig: Uint8Array;
  try {
    sig = b64urlDecode(decoded.signature);
  } catch {
    return false;
  }
  if (sig.length !== 64) return false;
  return crypto.subtle.verify(SIGN, key, sig as BufferSource, utf8(decoded.signingInput) as BufferSource);
}
