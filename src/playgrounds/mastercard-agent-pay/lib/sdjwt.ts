/**
 * A small SD-JWT core for the Verifiable Intent builder. Disclosures are array elements,
 * `base64url(JSON [salt, value])`, referenced as `{"...": digest}`. Verifiable Intent v0.1 wraps each
 * mandate in such a disclosure and lists the digests in `delegate_payload`.
 * Teaching simplification: decoy digests and other hash algorithms are not modeled.
 */
import { b64urlDecodeJson, b64urlEncodeJson, randomB64url, sha256B64url } from './encoding';

export interface Disclosure {
  encoded: string;
  digest: string;
  value: unknown;
}

export async function makeDisclosure(value: unknown, salt = randomB64url()): Promise<Disclosure> {
  const encoded = b64urlEncodeJson([salt, value]);
  return { encoded, digest: await sha256B64url(encoded), value };
}

/** Object-property disclosure `[salt, name, value]`, used for the optional `email` claim in L1. */
export async function makePropertyDisclosure(name: string, value: unknown, salt = randomB64url()): Promise<Disclosure & { name: string }> {
  const encoded = b64urlEncodeJson([salt, name, value]);
  return { encoded, digest: await sha256B64url(encoded), value, name };
}

export function decodeDisclosure(encoded: string): { salt: string; name?: string; value: unknown } {
  const arr = b64urlDecodeJson<unknown[]>(encoded);
  if (!Array.isArray(arr) || arr.length < 2 || arr.length > 3 || typeof arr[0] !== 'string') throw new Error('A disclosure is a JSON array [salt, value] or [salt, name, value]');
  return arr.length === 3 ? { salt: arr[0], name: String(arr[1]), value: arr[2] } : { salt: arr[0], value: arr[1] };
}

/** `<jwt>~<disclosure>~...~` */
export const serializeSdJwt = (jwt: string, disclosures: string[]): string => [jwt, ...disclosures].join('~') + '~';

export function parseSdJwt(serialized: string): { jwt: string; disclosures: string[] } {
  const parts = serialized.split('~');
  return { jwt: parts[0] ?? '', disclosures: parts.slice(1).filter((p, i, all) => !(p === '' && i === all.length - 1)) };
}

const isRef = (el: unknown): el is { '...': string } => !!el && typeof el === 'object' && !Array.isArray(el) && Object.keys(el).length === 1 && '...' in (el as object);

/** Replace `{"...": digest}` references with disclosed values, recursively. Unmatched references stay undisclosed. */
export async function resolveRefs(node: unknown, disclosures: string[]): Promise<{ value: unknown; undisclosed: string[] }> {
  const byDigest = new Map<string, unknown>();
  for (const enc of disclosures) {
    try {
      const d = decodeDisclosure(enc);
      if (d.name === undefined) byDigest.set(await sha256B64url(enc), d.value);
    } catch {
      /* malformed disclosures are reported by the verifier */
    }
  }
  const undisclosed: string[] = [];
  const walk = (n: unknown): unknown => {
    if (Array.isArray(n)) {
      const out: unknown[] = [];
      for (const el of n) {
        if (isRef(el)) {
          if (byDigest.has(el['...'])) out.push(walk(byDigest.get(el['...'])));
          else undisclosed.push(el['...']);
        } else out.push(walk(el));
      }
      return out;
    }
    if (n && typeof n === 'object') return Object.fromEntries(Object.entries(n as Record<string, unknown>).map(([k, v]) => [k, walk(v)]));
    return n;
  };
  return { value: walk(node), undisclosed };
}
