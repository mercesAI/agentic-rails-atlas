/**
 * RFC 9421 HTTP message signature for the Agent Pay edge check, built on the shared http-sig module.
 * Header and parameter names follow the Level 1 guide: Signature-Agent, Signature-Input, Signature, with
 * keyid, alg, created, expires, nonce and the Mastercard tag `Agent-pay-auth`.
 * The edge check follows the nine steps of the Level 1 guide's verification checklist in order.
 * Teaching simplifications: ES256 (`ecdsa-p256-sha256`) instead of the guide's Ed25519 example, only
 * `@authority` and `@path` are covered, and the key set is a local fixture, not a Mastercard directory
 * (the only host Mastercard shows does not resolve).
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

/** The scheme tags in step 1 of the Level 1 guide's checklist. Matching is exact; the guides do not say whether case matters. */
export const SCHEME_TAGS: readonly string[] = [MASTERCARD_TAG, 'agent-browser-auth', 'agent-payer-auth'];
/** Step 5 of the checklist: expires minus created must be at most 8 minutes. */
export const MAX_WINDOW_SECONDS = 480;
/** Step 6 and 9: nonces are remembered for 8 minutes. */
export const NONCE_TTL_SECONDS = 480;

export interface EdgeStep {
  id: 'scheme-tag' | 'parameters' | 'created' | 'expires' | 'window-cap' | 'nonce' | 'key-lookup' | 'signature' | 'record-nonce';
  label: string;
  status: 'pass' | 'fail' | 'skipped';
  detail: string;
}

export interface EdgeResult {
  verdict: EdgeVerdict;
  /** Outcome text from the "On Failure" column of the Level 1 checklist. */
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

/** The nine steps of the Level 1 guide's verification checklist, in its order. */
const ORDER: EdgeStep['id'][] = ['scheme-tag', 'parameters', 'created', 'expires', 'window-cap', 'nonce', 'key-lookup', 'signature', 'record-nonce'];
const LABELS: Record<EdgeStep['id'], string> = {
  'scheme-tag': 'Signature-Input and Signature present with a scheme tag',
  parameters: 'Required fields present, including @authority and @path',
  created: 'created is in the past',
  expires: 'expires is in the future',
  'window-cap': 'expires minus created is at most 8 minutes',
  nonce: 'Nonce not seen in the last 8 minutes',
  'key-lookup': 'Public key for keyid found in the key set',
  signature: 'Signature base rebuilt and signature verifies',
  'record-nonce': 'Nonce recorded with its expiry',
};

const REQUIRED_COMPONENTS = ['@authority', '@path'] as const;

/**
 * Checks in the order of the Level 1 guide's checklist. `seenNonces` maps a nonce to the time until which it is
 * remembered; a request that passes every check records its nonce (step 9).
 */
export async function verifyAtEdge(req: SignedRequest, dir: FixtureDirectory, now: number, seenNonces: Map<string, number>): Promise<EdgeResult> {
  const steps: EdgeStep[] = [];
  const stop = (id: EdgeStep['id'], detail: string, verdict: EdgeVerdict, outcome: string, nonce?: string): EdgeResult => {
    steps.push({ id, label: LABELS[id], status: 'fail', detail });
    for (const rest of ORDER.slice(ORDER.indexOf(id) + 1)) steps.push({ id: rest, label: LABELS[rest], status: 'skipped', detail: 'Not reached' });
    return { verdict, outcome, steps, nonce };
  };
  const ok = (id: EdgeStep['id'], detail: string) => steps.push({ id, label: LABELS[id], status: 'pass', detail });
  const block = 'Block the request';

  const input = req.signatureInput ? parseSignatureInput(req.signatureInput) : undefined;
  if (!req.signatureInput || !req.signature || !input) {
    return stop('scheme-tag', 'No Signature-Input and Signature headers', 'ordinary-bot', 'Apply the non-agent bot policy');
  }
  if (input.tag === undefined || !SCHEME_TAGS.includes(input.tag)) {
    return stop('scheme-tag', `Tag ${input.tag === undefined ? 'missing' : `"${input.tag}"`} is not one of ${SCHEME_TAGS.join(', ')}`, 'ordinary-bot', 'Apply the non-agent bot policy');
  }
  ok('scheme-tag', `Both headers present; tag "${input.tag}"`);
  const missing: string[] = [
    ...REQUIRED_COMPONENTS.filter((c) => !input.components.includes(c)),
    ...(['created', 'expires', 'keyid', 'alg', 'nonce'] as const).filter((k) => input[k] === undefined),
  ];
  if (missing.length) return stop('parameters', `Missing: ${missing.join(', ')}`, 'blocked', block);
  ok('parameters', '@authority, @path, created, keyid, expires, tag, alg and nonce are all present');
  const created = input.created as number;
  const expires = input.expires as number;
  if (created > now) return stop('created', `created=${created} is after now=${now}`, 'blocked', block);
  ok('created', `created=${created}, now=${now}`);
  if (expires <= now) return stop('expires', `expires=${expires} is not after now=${now}`, 'blocked', block);
  ok('expires', `expires=${expires}, now=${now}`);
  if (expires - created > MAX_WINDOW_SECONDS) {
    return stop('window-cap', `expires - created = ${expires - created} s, more than ${MAX_WINDOW_SECONDS} s`, 'blocked', block);
  }
  ok('window-cap', `expires - created = ${expires - created} s`);
  const nonce = input.nonce as string;
  const until = seenNonces.get(nonce);
  if (until !== undefined && until > now) return stop('nonce', 'This nonce was used by an earlier request in the last 8 minutes', 'blocked', 'Block the request (replay detected)');
  ok('nonce', 'No earlier use of this nonce in the last 8 minutes');
  const jwk = dir.get(input.keyid as string);
  if (!jwk) return stop('key-lookup', 'Key not found in the fixture key set', 'blocked', block, nonce);
  ok('key-lookup', 'Public key found in the local fixture key set');
  let valid = false;
  try {
    const sig = parseSignatureHeader(req.signature).get(LABEL);
    if (sig) valid = await verifyBytes(signatureBase(req.authority, req.path, input.params), sig, await importEs256PublicJwk(jwk));
  } catch {
    valid = false;
  }
  if (!valid) return stop('signature', 'The signature does not match the rebuilt signature base', 'blocked', block, nonce);
  ok('signature', 'Signature verifies against the covered components');
  seenNonces.set(nonce, now + NONCE_TTL_SECONDS);
  ok('record-nonce', `Remembered until ${now + NONCE_TTL_SECONDS}`);
  return { verdict: 'trusted-agent', outcome: 'Forward as a trusted agent', steps, nonce };
}
