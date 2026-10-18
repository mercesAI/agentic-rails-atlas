/**
 * RFC 9421 HTTP message signature for the Agent Pay edge check, built on the shared http-sig module.
 * Header and parameter names follow the Level 1 guide: Signature-Agent, Signature-Input, Signature, with
 * keyid, alg, created, expires, nonce and the Mastercard tag `Agent-pay-auth`.
 * Teaching simplifications: ES256 (`ecdsa-p256-sha256`) instead of the guide's Ed25519 example, only
 * `@authority` and `@path` are covered, and the key set is a local fixture, not a Mastercard directory
 * (its location is not public).
 */
import { randomBase64Url } from '@/lib/playground/bytes';
import { importEs256PublicJwk, jwkThumbprint, signBytes, verifyBytes, type EcJwk as Jwk, type Es256Key } from '@/lib/playground/es256';
import {
  buildSignatureBase,
  parseSignatureHeader,
  parseSignatureInput as parseSignatureInputHeader,
  paramValue,
  serializeSignatureParams,
  signatureHeader,
  signatureInputHeader,
  type ComponentId,
  type HttpRequest,
  type SigParams,
} from '@/lib/playground/http-sig';

export const MASTERCARD_TAG = 'Agent-pay-auth';
export const SIG_ALG = 'ecdsa-p256-sha256';
export const COVERED = ['@authority', '@path'] as const;
const COMPONENTS: ComponentId[] = COVERED.map((name) => ({ name }));
const LABEL = 'sig1';

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

export interface EdgeParams {
  created: number;
  expires: number;
  keyid: string;
  alg: string;
  nonce: string;
  tag: string;
}

/** The signature parameters in the order the Level 1 guide writes them. */
export function sigParams(p: EdgeParams): SigParams {
  return [
    ['created', p.created],
    ['expires', p.expires],
    ['keyid', p.keyid],
    ['alg', p.alg],
    ['nonce', p.nonce],
    ['tag', p.tag],
  ];
}

/** `("@authority" "@path");created=...;expires=...;keyid="...";alg="...";nonce="...";tag="..."` */
export function paramsLine(p: EdgeParams): string {
  return serializeSignatureParams(COMPONENTS, sigParams(p));
}

function toRequest(authority: string, path: string): HttpRequest {
  return { method: 'GET', scheme: 'https', authority, path, query: '', headers: {} };
}

/** The RFC 9421 signature base over `@authority`, `@path` and the parameters. */
export function signatureBase(authority: string, path: string, params: SigParams): string {
  return buildSignatureBase(toRequest(authority, path), COMPONENTS, params);
}

export async function signRequest(req: { authority: string; path: string }, key: Es256Key, o: SignOptions): Promise<SignedRequest & { base: string }> {
  const expires = o.created + (o.ttlSeconds ?? 480);
  const params = sigParams({ created: o.created, expires, keyid: o.keyid, alg: SIG_ALG, nonce: o.nonce ?? randomBase64Url(32), tag: o.tag ?? MASTERCARD_TAG });
  const base = signatureBase(req.authority, req.path, params);
  const sig = await signBytes(base, key.privateKey);
  return { ...req, signatureAgent: o.signatureAgent, signatureInput: signatureInputHeader(LABEL, COMPONENTS, params), signature: signatureHeader(LABEL, sig), base };
}

export interface ParsedInput {
  components: string[];
  created?: number;
  expires?: number;
  keyid?: string;
  alg?: string;
  nonce?: string;
  tag?: string;
  /** The parsed parameters, which rebuild the signature base. */
  params: SigParams;
}

/** The `sig1` member of a Signature-Input header, or undefined when the header does not parse or has no sig1. */
export function parseSignatureInput(value: string): ParsedInput | undefined {
  let sig;
  try {
    sig = parseSignatureInputHeader(value).find((p) => p.label === LABEL);
  } catch {
    return undefined;
  }
  if (!sig) return undefined;
  const str = (k: string) => {
    const v = paramValue(sig.params, k);
    return typeof v === 'string' ? v : undefined;
  };
  const num = (k: string) => {
    const v = paramValue(sig.params, k);
    return typeof v === 'number' ? v : undefined;
  };
  return {
    components: sig.components.map((c) => c.name),
    created: num('created'),
    expires: num('expires'),
    keyid: str('keyid'),
    alg: str('alg'),
    nonce: str('nonce'),
    tag: str('tag'),
    params: sig.params,
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
  let valid = false;
  try {
    const sig = parseSignatureHeader(req.signature).get(LABEL);
    if (sig) valid = await verifyBytes(signatureBase(req.authority, req.path, input.params), sig, await importEs256PublicJwk(jwk));
  } catch {
    valid = false;
  }
  if (!valid) return stop('signature', 'The signature does not match the rebuilt signature base', 'blocked', 'Block the request', input.nonce);
  ok('signature', 'Signature verifies against the covered components');
  seenNonces.add(input.nonce as string);
  return { verdict: 'trusted-agent', outcome: 'Forward as a trusted agent', steps, nonce: input.nonce };
}
