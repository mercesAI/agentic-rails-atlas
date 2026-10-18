/**
 * Ephemeral signing keys through WebCrypto. Ed25519 when the runtime supports it, ECDSA P-256 otherwise
 * (the P-256 branch is the shared ES256 module). Keys are generated in memory, never exported in private
 * form and never sent anywhere.
 */
import { utf8 } from '@/lib/playground/bytes';
import { signBytes, verifyBytes } from '@/lib/playground/es256';

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

const ED25519: AlgorithmIdentifier = { name: 'Ed25519' };

function keyParams(alg: SigAlg): AlgorithmIdentifier | EcKeyGenParams {
  return alg === 'ed25519' ? ED25519 : ({ name: 'ECDSA', namedCurve: 'P-256' } as EcKeyGenParams);
}

/** True when this runtime can generate and use Ed25519 keys through WebCrypto. */
export async function supportsEd25519(subtle: SubtleCrypto = globalThis.crypto.subtle): Promise<boolean> {
  try {
    const kp = (await subtle.generateKey(ED25519, false, ['sign', 'verify'])) as CryptoKeyPair;
    const sig = await subtle.sign(ED25519, kp.privateKey, new Uint8Array([1]));
    return sig.byteLength === 64;
  } catch {
    return false;
  }
}

export async function generateAgentKey(alg: SigAlg): Promise<AgentKey> {
  const kp = (await crypto.subtle.generateKey(keyParams(alg), false, ['sign', 'verify'])) as CryptoKeyPair;
  // Public keys are always extractable in WebCrypto, so the JWK can be shown in the fixture directory.
  const publicJwk = await crypto.subtle.exportKey('jwk', kp.publicKey);
  return { alg, privateKey: kp.privateKey, publicKey: kp.publicKey, publicJwk };
}

export async function importPublicJwk(jwk: JsonWebKey, alg: SigAlg): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', jwk, keyParams(alg), true, ['verify']);
}

export async function importPrivateJwk(jwk: JsonWebKey, alg: SigAlg): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', jwk, keyParams(alg), false, ['sign']);
}

/** Sign UTF-8 text. ECDSA output is the raw r||s form that RFC 9421 Section 3.3.4 requires. */
export async function signText(alg: SigAlg, key: CryptoKey, text: string): Promise<Uint8Array> {
  if (alg === 'ecdsa-p256-sha256') return signBytes(text, key);
  return new Uint8Array(await crypto.subtle.sign(ED25519, key, utf8(text) as BufferSource));
}

export async function verifyText(alg: SigAlg, key: CryptoKey, text: string, sig: Uint8Array): Promise<boolean> {
  if (alg === 'ecdsa-p256-sha256') return verifyBytes(text, sig, key);
  try {
    return await crypto.subtle.verify(ED25519, key, sig as BufferSource, utf8(text) as BufferSource);
  } catch {
    return false;
  }
}
