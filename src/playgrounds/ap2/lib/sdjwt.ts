/**
 * A small SD-JWT core (RFC 9901 shapes) for the AP2 playground.
 * - Array element disclosure: base64url(JSON [salt, value]), placeholder `{"...": digest}`.
 * - Object property disclosure: base64url(JSON [salt, name, value]), digest listed in `_sd`.
 * - digest = base64url(SHA-256(ASCII of the encoded disclosure)); `_sd_alg` is "sha-256".
 * - Serialization: `<jwt>~<disclosure>~...~` and, for a key-binding presentation, the KB-JWT is
 *   itself the leading JWT of the next element in the AP2 chain (see mandates.ts).
 * Teaching simplification: decoy digests, other hash algorithms and the full Delegate SD-JWT
 * chain processing rules are not modeled.
 */
import { b64urlDecodeJson, b64urlEncodeJson, randomB64url, sha256B64url } from './encoding';

export const SD_ALG = 'sha-256';

export interface Disclosure {
  encoded: string;
  digest: string;
  salt: string;
  /** Present for object property disclosures. */
  name?: string;
  value: unknown;
}

export async function makeArrayDisclosure(value: unknown, salt = randomB64url()): Promise<Disclosure> {
  const encoded = b64urlEncodeJson([salt, value]);
  return { encoded, digest: await sha256B64url(encoded), salt, value };
}

export async function makePropertyDisclosure(name: string, value: unknown, salt = randomB64url()): Promise<Disclosure> {
  const encoded = b64urlEncodeJson([salt, name, value]);
  return { encoded, digest: await sha256B64url(encoded), salt, name, value };
}

export function decodeDisclosure(encoded: string): { salt: string; name?: string; value: unknown } {
  const arr = b64urlDecodeJson<unknown[]>(encoded);
  if (!Array.isArray(arr) || (arr.length !== 2 && arr.length !== 3) || typeof arr[0] !== 'string') {
    throw new Error('A disclosure is a JSON array of two or three elements');
  }
  if (arr.length === 3) {
    if (typeof arr[1] !== 'string') throw new Error('A property disclosure names the claim');
    return { salt: arr[0], name: arr[1], value: arr[2] };
  }
  return { salt: arr[0], value: arr[1] };
}

/** Replace array values with `{"...": digest}` placeholders and return the disclosures. */
export async function concealArray(values: unknown[]): Promise<{ placeholders: { '...': string }[]; disclosures: Disclosure[] }> {
  const disclosures = await Promise.all(values.map((v) => makeArrayDisclosure(v)));
  return { placeholders: disclosures.map((d) => ({ '...': d.digest })), disclosures };
}

/** Move one property of an object behind a digest in `_sd`. */
export async function concealProperty<T extends Record<string, unknown>>(
  obj: T,
  name: keyof T & string,
): Promise<{ object: Record<string, unknown>; disclosure: Disclosure }> {
  const disclosure = await makePropertyDisclosure(name, obj[name]);
  const rest: Record<string, unknown> = { ...obj };
  delete rest[name];
  const sd = Array.isArray(rest._sd) ? [...(rest._sd as string[])] : [];
  sd.push(disclosure.digest);
  return { object: { _sd: sd, ...rest }, disclosure };
}

export function serializeSdJwt(jwt: string, disclosures: string[]): string {
  return [jwt, ...disclosures].join('~') + '~';
}

export function parseSdJwt(serialized: string): { jwt: string; disclosures: string[] } {
  const parts = serialized.split('~');
  const jwt = parts[0] ?? '';
  // The trailing "~" leaves one empty element at the end.
  const disclosures = parts.slice(1).filter((p, i, all) => !(p === '' && i === all.length - 1));
  return { jwt, disclosures };
}

export interface ResolveResult {
  /** The payload with every provided disclosure substituted and SD machinery removed. */
  value: unknown;
  /** Digests that appear in the payload but have no provided disclosure (left undisclosed). */
  undisclosed: string[];
  /** Provided disclosures whose digest is not referenced anywhere (a tamper signal). */
  unreferenced: string[];
  /** Provided disclosures that do not decode. */
  malformed: string[];
}

/** Substitute disclosures into a payload, recursively, the way an SD-JWT verifier does. */
export async function resolveDisclosures(payload: unknown, disclosures: string[]): Promise<ResolveResult> {
  const byDigest = new Map<string, { encoded: string; salt: string; name?: string; value: unknown }>();
  const malformed: string[] = [];
  for (const encoded of disclosures) {
    try {
      const d = decodeDisclosure(encoded);
      byDigest.set(await sha256B64url(encoded), { encoded, ...d });
    } catch {
      malformed.push(encoded);
    }
  }
  const used = new Set<string>();
  const undisclosed: string[] = [];

  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) {
      const out: unknown[] = [];
      for (const el of node) {
        if (el && typeof el === 'object' && !Array.isArray(el) && Object.keys(el).length === 1 && '...' in el) {
          const digest = String((el as Record<string, unknown>)['...']);
          const d = byDigest.get(digest);
          if (d && d.name === undefined) {
            used.add(digest);
            out.push(walk(d.value));
          } else {
            undisclosed.push(digest);
          }
        } else {
          out.push(walk(el));
        }
      }
      return out;
    }
    if (node && typeof node === 'object') {
      const src = node as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(src)) {
        if (k === '_sd' || k === '_sd_alg') continue;
        out[k] = walk(v);
      }
      if (Array.isArray(src._sd)) {
        for (const digest of src._sd as unknown[]) {
          const d = byDigest.get(String(digest));
          if (d && d.name !== undefined) {
            used.add(String(digest));
            out[d.name] = walk(d.value);
          } else {
            undisclosed.push(String(digest));
          }
        }
      }
      return out;
    }
    return node;
  };

  const value = walk(payload);
  const unreferenced = [...byDigest.entries()].filter(([digest]) => !used.has(digest)).map(([, d]) => d.encoded);
  return { value, undisclosed, unreferenced, malformed };
}
