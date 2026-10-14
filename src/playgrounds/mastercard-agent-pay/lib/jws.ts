/**
 * ES256 (ECDSA P-256 with SHA-256) keys and compact JWS through WebCrypto. Private keys are
 * non-extractable and live only in memory. WebCrypto emits raw r||s, which JWS ES256 and the
 * RFC 9421 ecdsa-p256-sha256 algorithm both use.
 */
import { b64urlDecode, b64urlDecodeJson, b64urlEncode, b64urlEncodeJson, sha256B64url, utf8 } from './encoding';

export interface Jwk {
  kty: 'EC';
  crv: 'P-256';
  x: string;
  y: string;
  kid?: string;
}

export interface Es256Key {
  label: string;
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicJwk: Jwk;
}

const ALG: EcKeyGenParams = { name: 'ECDSA', namedCurve: 'P-256' };
const SIGN: EcdsaParams = { name: 'ECDSA', hash: 'SHA-256' };

export async function generateEs256Key(label: string): Promise<Es256Key> {
  const pair = (await crypto.subtle.generateKey(ALG, false, ['sign', 'verify'])) as CryptoKeyPair;
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  return { label, privateKey: pair.privateKey, publicKey: pair.publicKey, publicJwk: { kty: 'EC', crv: 'P-256', x: String(jwk.x), y: String(jwk.y) } };
}

export async function importEs256PublicJwk(jwk: Jwk): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y, ext: true }, ALG, true, ['verify']);
}

export const sameJwk = (a?: Partial<Jwk>, b?: Partial<Jwk>): boolean => !!a && !!b && a.kty === b.kty && a.crv === b.crv && a.x === b.x && a.y === b.y;

/** RFC 7638 JWK thumbprint of an EC key. Used as the fixture `keyid`. */
export async function jwkThumbprint(jwk: Jwk): Promise<string> {
  return sha256B64url(`{"crv":"${jwk.crv}","kty":"${jwk.kty}","x":"${jwk.x}","y":"${jwk.y}"}`);
}

export async function signBytes(text: string, key: CryptoKey): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.sign(SIGN, key, utf8(text) as BufferSource));
}

export async function verifyBytes(text: string, sig: Uint8Array, key: CryptoKey): Promise<boolean> {
  if (sig.length !== 64) return false;
  return crypto.subtle.verify(SIGN, key, sig as BufferSource, utf8(text) as BufferSource);
}

export async function signJws(header: Record<string, unknown>, payload: unknown, key: CryptoKey): Promise<string> {
  const input = `${b64urlEncodeJson({ alg: 'ES256', ...header })}.${b64urlEncodeJson(payload)}`;
  return `${input}.${b64urlEncode(await signBytes(input, key))}`;
}

export interface DecodedJws {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signingInput: string;
  signature: string;
}

export function decodeJws(jws: string): DecodedJws {
  const parts = jws.split('.');
  if (parts.length !== 3) throw new Error('A compact JWS has three parts');
  return {
    header: b64urlDecodeJson(parts[0] as string),
    payload: b64urlDecodeJson(parts[1] as string),
    signingInput: `${parts[0]}.${parts[1]}`,
    signature: parts[2] as string,
  };
}

export async function verifyJws(jws: string, jwk: Jwk): Promise<boolean> {
  try {
    const d = decodeJws(jws);
    return await verifyBytes(d.signingInput, b64urlDecode(d.signature), await importEs256PublicJwk(jwk));
  } catch {
    return false;
  }
}
