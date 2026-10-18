/**
 * RFC 9421 signing with the TAP agent key. The shared http-sig module builds the signature base and the
 * Signature-Input and Signature headers; this wrapper only supplies the Ed25519 or ECDSA P-256 signer.
 */
import { signRequest as signHttpRequest, type ComponentId, type HttpRequest, type SigParams, type SignedOutput } from '@/lib/playground/http-sig';
import { signText, type SigAlg } from './keys';

export async function signRequest(
  req: HttpRequest,
  opts: { label: string; components: ComponentId[]; params: SigParams; alg: SigAlg; privateKey: CryptoKey },
): Promise<SignedOutput> {
  return signHttpRequest(req, { label: opts.label, components: opts.components, params: opts.params, sign: (base) => signText(opts.alg, opts.privateKey, base) });
}
