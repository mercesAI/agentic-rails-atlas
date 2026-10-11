/**
 * Ephemeral signing keys through WebCrypto. Ed25519 when the runtime supports it, ECDSA P-256 otherwise.
 * Keys are generated in memory, never exported in private form and never sent anywhere.
 */
import { bytesToBase64Url } from './sf';

/** Algorithm ids from the IANA HTTP Signature Algorithms registry (RFC 9421 Section 6.2.2). */
export type SigAlg = 'ed25519' | 'ecdsa-p256-sha256';

export interface AgentKey {
  alg: SigAlg;
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicJwk: JsonWebKey;
}

/** The `alg` parameter value written into Signature-Input. TAP examples spell Ed25519 with a capital E. */
export function tapAlgLabel(alg: SigAlg): string {
  return alg === 'ed25519' ? 'Ed25519' : 'ecdsa-p256-sha256';
}

/** Map a written `alg` parameter back to the algorithm, case-insensitively for Ed25519. */
export function algFromLabel(label: string): SigAlg | null {
  const l = label.toLowerCase();
  if (l === 'ed25519') return 'ed25519';
  if (l === 'ecdsa-p256-sha256') return 'ecdsa-p256-sha256';
  return null;
}

function webCryptoParams(alg: SigAlg): { gen: AlgorithmIdentifier | EcKeyGenParams; sign: AlgorithmIdentifier | EcdsaParams; imp: AlgorithmIdentifier | EcKeyImportParams } {
  return alg === 'ed25519'
    ? { gen: { name: 'Ed25519' }, sign: { name: 'Ed25519' }, imp: { name: 'Ed25519' } }
    : {
        gen: { name: 'ECDSA', namedCurve: 'P-256' } as EcKeyGenParams,
        sign: { name: 'ECDSA', hash: 'SHA-256' } as EcdsaParams,
        imp: { name: 'ECDSA', namedCurve: 'P-256' } as EcKeyImportParams,
      };
}

/** True when this runtime can generate and use Ed25519 keys through WebCrypto. */
export async function supportsEd25519(subtle: SubtleCrypto = globalThis.crypto.subtle): Promise<boolean> {
  try {
    const kp = (await subtle.generateKey({ name: 'Ed25519' }, false, ['sign', 'verify'])) as CryptoKeyPair;
    const sig = await subtle.sign({ name: 'Ed25519' }, kp.privateKey, new Uint8Array([1]));
    return sig.byteLength === 64;
  } catch {
    return false;
  }
}

export async function generateAgentKey(alg: SigAlg): Promise<AgentKey> {
  const p = webCryptoParams(alg);
  const kp = (await crypto.subtle.generateKey(p.gen, false, ['sign', 'verify'])) as CryptoKeyPair;
  // Public keys are always extractable in WebCrypto, so the JWK can be shown in the fixture directory.
  const publicJwk = await crypto.subtle.exportKey('jwk', kp.publicKey);
  return { alg, privateKey: kp.privateKey, publicKey: kp.publicKey, publicJwk };
}

export async function importPublicJwk(jwk: JsonWebKey, alg: SigAlg): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', jwk, webCryptoParams(alg).imp, true, ['verify']);
}

export async function importPrivateJwk(jwk: JsonWebKey, alg: SigAlg): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', jwk, webCryptoParams(alg).imp, false, ['sign']);
}

const enc = new TextEncoder();

/** Sign UTF-8 text. ECDSA output is the raw r||s form that RFC 9421 Section 3.3.4 requires. */
export async function signText(alg: SigAlg, key: CryptoKey, text: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.sign(webCryptoParams(alg).sign, key, enc.encode(text)));
}

export async function verifyText(alg: SigAlg, key: CryptoKey, text: string, sig: Uint8Array): Promise<boolean> {
  try {
    return await crypto.subtle.verify(webCryptoParams(alg).sign, key, sig as BufferSource, enc.encode(text));
  } catch {
    return false;
  }
}

/** RFC 7638 JWK thumbprint (SHA-256, base64url), the keyid form the Web Bot Auth draft requires. */
export async function jwkThumbprint(jwk: JsonWebKey): Promise<string> {
  let members: Record<string, string | undefined>;
  if (jwk.kty === 'OKP') members = { crv: jwk.crv, kty: jwk.kty, x: jwk.x };
  else if (jwk.kty === 'EC') members = { crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y };
  else if (jwk.kty === 'RSA') members = { e: jwk.e, kty: jwk.kty, n: jwk.n };
  else throw new Error(`Unsupported key type ${String(jwk.kty)}`);
  for (const [k, v] of Object.entries(members)) if (!v) throw new Error(`JWK is missing ${k}`);
  // Required members in lexicographic order, no whitespace (RFC 7638 Section 3).
  const json = JSON.stringify(members);
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(json))));
}

/** Random base64url nonce from the browser's CSPRNG. */
export function randomNonce(bytes = 32): string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}
