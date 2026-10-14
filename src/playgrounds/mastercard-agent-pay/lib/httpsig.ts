/**
 * RFC 9421 style HTTP message signature for the Agent Pay edge check.
 * Header and parameter names follow the Level 1 guide: Signature-Agent, Signature-Input, Signature, with
 * keyid, alg, created, expires, nonce and the Mastercard tag `Agent-pay-auth`.
 * Teaching simplifications: ES256 (`ecdsa-p256-sha256`) instead of the guide's Ed25519 example, only
 * `@authority` and `@path` are covered, and the key set is a local fixture, not a Mastercard directory
 * (its location is not public).
 */
import { b64Decode, b64Encode, randomB64url } from './encoding';
import { jwkThumbprint, signBytes, verifyBytes, importEs256PublicJwk, type Es256Key, type Jwk } from './jws';

export const MASTERCARD_TAG = 'Agent-pay-auth';
export const SIG_ALG = 'ecdsa-p256-sha256';
export const COVERED = ['@authority', '@path'] as const;

export interface SignedRequest {
  authority: string;
  path: string;
  signatureAgent?: string;
  /** Raw `Signature-Input` header value, or undefined when the agent omitted it. */
  signatureInput?: string;
  /** Raw `Signature` header value, or undefined when omitted. */
  signature?: string;
}

export interface SignOptions {
  created: number;
  ttlSeconds?: number;
  nonce?: string;
  tag?: string;
  signatureAgent?: string;
  /** Keep keyid but sign with whatever key is passed; the directory lookup decides. */
  keyid: string;
}

export function paramsLine(p: { created: number; expires: number; keyid: string; alg: string; nonce: string; tag: string }): string {
  const comps = COVERED.map((c) => `"${c}"`).join(' ');
  return `(${comps});created=${p.created};expires=${p.expires};keyid="${p.keyid}";alg="${p.alg}";nonce="${p.nonce}";tag="${p.tag}"`;
}

export function signatureBase(authority: string, path: string, params: string): string {
  return [`"@authority": ${authority}`, `"@path": ${path}`, `"@signature-params": ${params}`].join('\n');
}

export async function signRequest(req: { authority: string; path: string }, key: Es256Key, o: SignOptions): Promise<SignedRequest & { base: string }> {
  const expires = o.created + (o.ttlSeconds ?? 480);
  const params = paramsLine({ created: o.created, expires, keyid: o.keyid, alg: SIG_ALG, nonce: o.nonce ?? randomB64url(32), tag: o.tag ?? MASTERCARD_TAG });
  const base = signatureBase(req.authority, req.path, params);
  const sig = await signBytes(base, key.privateKey);
  return { ...req, signatureAgent: o.signatureAgent, signatureInput: `sig1=${params}`, signature: `sig1=:${b64Encode(sig)}:`, base };
}

export interface ParsedInput {
  components: string[];
  created?: number;
  expires?: number;
  keyid?: string;
  alg?: string;
  nonce?: string;
  tag?: string;
  params: string;
}

export function parseSignatureInput(value: string): ParsedInput | undefined {
  const m = /^sig1=(\(([^)]*)\)(.*))$/.exec(value);
  if (!m) return undefined;
  const rest = m[3] ?? '';
  const str = (k: string) => new RegExp(`;${k}="([^"]*)"`).exec(rest)?.[1];
  const num = (k: string) => {
    const v = new RegExp(`;${k}=(\\d+)`).exec(rest)?.[1];
    return v === undefined ? undefined : Number(v);
  };
  return {
    components: [...(m[2] ?? '').matchAll(/"([^"]+)"/g)].map((x) => x[1] as string),
    created: num('created'),
    expires: num('expires'),
    keyid: str('keyid'),
    alg: str('alg'),
    nonce: str('nonce'),
    tag: str('tag'),
    params: m[1] as string,
  };
}

export type EdgeVerdict = 'trusted-agent' | 'ordinary-bot' | 'blocked';

export interface EdgeStep {
  id: 'scheme-tag' | 'parameters' | 'key-lookup' | 'window' | 'nonce' | 'tag' | 'signature';
  label: string;
  status: 'pass' | 'fail' | 'skipped';
  detail: string;
}

export interface EdgeResult {
  verdict: EdgeVerdict;
  /** Outcome text taken from the Level 1 flow failures list. */
  outcome: string;
  steps: EdgeStep[];
  nonce?: string;
}

/** Local fixture key set, keyed by keyid. */
export type FixtureDirectory = Map<string, Jwk>;

export async function addToDirectory(dir: FixtureDirectory, key: Es256Key): Promise<string> {
  const keyid = await jwkThumbprint(key.publicJwk);
  dir.set(keyid, key.publicJwk);
  return keyid;
}

const ORDER: EdgeStep['id'][] = ['scheme-tag', 'parameters', 'key-lookup', 'window', 'nonce', 'tag', 'signature'];
const LABELS: Record<EdgeStep['id'], string> = {
  'scheme-tag': 'Signature-Input and Signature present',
  parameters: 'Required parameters present',
  'key-lookup': 'keyid found in the key set',
  window: 'created and expires bracket the current time',
  nonce: 'Nonce not seen before',
  tag: 'Tag is valid for Agent Pay',
  signature: 'Signature base rebuilt and signature verifies',
};

/** Checks in the order of the Level 1 flow. `seenNonces` is mutated when a request passes the nonce check. */
export async function verifyAtEdge(req: SignedRequest, dir: FixtureDirectory, now: number, seenNonces: Set<string>): Promise<EdgeResult> {
  const steps: EdgeStep[] = [];
  const stop = (id: EdgeStep['id'], detail: string, verdict: EdgeVerdict, outcome: string, nonce?: string): EdgeResult => {
    steps.push({ id, label: LABELS[id], status: 'fail', detail });
    for (const rest of ORDER.slice(ORDER.indexOf(id) + 1)) steps.push({ id: rest, label: LABELS[rest], status: 'skipped', detail: 'Not reached' });
    return { verdict, outcome, steps, nonce };
  };
  const ok = (id: EdgeStep['id'], detail: string) => steps.push({ id, label: LABELS[id], status: 'pass', detail });

  const input = req.signatureInput ? parseSignatureInput(req.signatureInput) : undefined;
  if (!req.signatureInput || !req.signature || !input) {
    return stop('scheme-tag', 'No Signature-Input with a scheme tag', 'ordinary-bot', 'Treat as an ordinary bot and apply the non-agent bot policy');
  }
  ok('scheme-tag', 'Both headers present');
  const missing = (['created', 'expires', 'keyid', 'alg', 'nonce', 'tag'] as const).filter((k) => input[k] === undefined);
  if (missing.length) return stop('parameters', `Missing: ${missing.join(', ')}`, 'blocked', 'Block the request');
  ok('parameters', 'created, expires, keyid, alg, nonce and tag are all present');
  const jwk = dir.get(input.keyid as string);
  if (!jwk) return stop('key-lookup', 'Key not found in the fixture key set', 'blocked', 'Block the request');
  ok('key-lookup', 'Public key found in the local fixture key set');
  if ((input.created as number) > now + 1 || (input.expires as number) <= now) {
    return stop('window', `created=${input.created}, expires=${input.expires}, now=${now}`, 'blocked', 'Block the request');
  }
  ok('window', `created=${input.created}, expires=${input.expires}, now=${now}`);
  if (seenNonces.has(input.nonce as string)) return stop('nonce', 'This nonce was used by an earlier request', 'blocked', 'Block the request');
  ok('nonce', 'First use of this nonce');
  if (input.tag !== MASTERCARD_TAG) return stop('tag', `Tag is "${input.tag}", expected "${MASTERCARD_TAG}"`, 'blocked', 'Block the request', input.nonce);
  ok('tag', `Tag is "${MASTERCARD_TAG}"`);
  const sigMatch = /^sig1=:([A-Za-z0-9+/=]+):$/.exec(req.signature);
  let valid = false;
  if (sigMatch) {
    try {
      valid = await verifyBytes(signatureBase(req.authority, req.path, input.params), b64Decode(sigMatch[1] as string), await importEs256PublicJwk(jwk));
    } catch {
      valid = false;
    }
  }
  if (!valid) return stop('signature', 'The signature does not match the rebuilt signature base', 'blocked', 'Block the request', input.nonce);
  ok('signature', 'Signature verifies against the covered components');
  seenNonces.add(input.nonce as string);
  return { verdict: 'trusted-agent', outcome: 'Forward as a trusted agent', steps, nonce: input.nonce };
}
