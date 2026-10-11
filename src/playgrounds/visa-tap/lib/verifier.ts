/**
 * Verifier decision tree in the order of Cloudflare's published checks for TAP (2025-10-24 post), with the
 * Visa spec's minimum-field check inserted after "headers present". Stops at the first failure.
 * The same tree runs a Web Bot Auth profile for the side-by-side comparison.
 */
import { algFromLabel, verifyText, type SigAlg } from './keys';
import {
  buildSignatureBase,
  paramValue,
  parseSignatureHeader,
  parseSignatureInput,
  type HttpRequest,
  type ParsedSignature,
} from './signature';

export const TAP_MAX_WINDOW_SECONDS = 8 * 60;
/** The Web Bot Auth draft RECOMMENDS an expiry no more than 24 hours out. */
export const WBA_MAX_WINDOW_SECONDS = 24 * 60 * 60;
export const TAP_TAGS = ['agent-browser-auth', 'agent-payer-auth'] as const;
export const WBA_TAG = 'web-bot-auth';

export type Profile = 'tap' | 'wba';
export type StepId =
  | 'headers-present'
  | 'minimum-fields'
  | 'key-lookup'
  | 'time-window'
  | 'nonce-unused'
  | 'tag-allowed'
  | 'rebuild-base'
  | 'verify-signature';
export type StepStatus = 'pass' | 'fail' | 'skip' | 'note';

export interface Step {
  id: StepId;
  title: string;
  source: string;
  status: StepStatus;
  detail: string;
}

export interface DirectoryKey {
  alg: SigAlg;
  key: CryptoKey;
}
export type KeyDirectory = Map<string, DirectoryKey>;
/** nonce to the UNIX time after which it may be forgotten. */
export type NonceStore = Map<string, number>;

export interface VerifyInput {
  req: HttpRequest;
  signatureInput?: string;
  signature?: string;
}

export interface VerifyContext {
  now: number;
  directory: KeyDirectory;
  seen: NonceStore;
  profile: Profile;
}

export interface VerifyResult {
  ok: boolean;
  steps: Step[];
  /** The rebuilt signature base when the tree got that far. */
  base?: string;
  /** The nonce to remember after a successful verification. */
  nonce?: string;
  /** Short outcome for the live region. */
  outcome: string;
}

export const STEP_TITLES: Record<StepId, { title: string; source: string }> = {
  'headers-present': { title: 'Signature-Input and Signature present', source: 'Cloudflare step 1' },
  'minimum-fields': { title: 'Minimum fields present', source: 'Visa spec, Required Message Signature Fields' },
  'key-lookup': { title: 'Key found by keyid in the directory', source: 'Cloudflare step 2' },
  'time-window': { title: 'Now between created and expires, window within limit', source: 'Cloudflare step 3, Visa spec Timestamps' },
  'nonce-unused': { title: 'Nonce not seen recently', source: 'Cloudflare step 4, Visa spec Nonce' },
  'tag-allowed': { title: 'Tag allowed', source: 'Cloudflare step 5' },
  'rebuild-base': { title: 'Signature base rebuilt from Signature-Input', source: 'Cloudflare step 6, RFC 9421 Section 2.5' },
  'verify-signature': { title: 'Signature verifies with the key', source: 'Cloudflare step 7, RFC 9421 Section 3.2' },
};

export const STEP_ORDER: StepId[] = Object.keys(STEP_TITLES) as StepId[];

export function pruneNonces(store: NonceStore, now: number): NonceStore {
  return new Map([...store].filter(([, until]) => until > now));
}

export function isNonceSeen(store: NonceStore, nonce: string, now: number): boolean {
  const until = store.get(nonce);
  return until !== undefined && until > now;
}

/** Remember a nonce for the TAP replay window (8 minutes from now). */
export function rememberNonce(store: NonceStore, nonce: string, now: number, keepFor = TAP_MAX_WINDOW_SECONDS): NonceStore {
  const next = pruneNonces(store, now);
  next.set(nonce, now + keepFor);
  return next;
}

/** Pick the label to verify: the first one whose tag fits the profile, else the first label. */
export function pickSignature(sigs: ParsedSignature[], profile: Profile): ParsedSignature | undefined {
  const allowed: readonly string[] = profile === 'tap' ? TAP_TAGS : [WBA_TAG];
  return sigs.find((s) => allowed.includes(String(paramValue(s.params, 'tag')))) ?? sigs[0];
}

/** Which minimum fields are missing for the profile. */
export function missingMinimumFields(sig: ParsedSignature, profile: Profile, req: HttpRequest): string[] {
  const names = sig.components.map((c) => c.name);
  const missing: string[] = [];
  const need = profile === 'tap' ? ['created', 'expires', 'keyid', 'alg', 'nonce', 'tag'] : ['created', 'expires', 'keyid', 'tag'];
  for (const p of need) if (paramValue(sig.params, p) === undefined) missing.push(p);
  if (profile === 'tap') {
    for (const c of ['@authority', '@path']) if (!names.includes(c)) missing.push(`covered ${c}`);
  } else {
    if (!names.includes('@authority') && !names.includes('@target-uri')) missing.push('covered @authority or @target-uri');
    if (req.headers['signature-agent'] === undefined) missing.push('Signature-Agent header');
    else if (!names.includes('signature-agent')) missing.push('covered signature-agent');
  }
  return missing;
}

function step(id: StepId, status: StepStatus, detail: string): Step {
  return { id, ...STEP_TITLES[id], status, detail };
}

export async function verifyRequest(input: VerifyInput, ctx: VerifyContext): Promise<VerifyResult> {
  const steps: Step[] = [];
  const finish = (ok: boolean, outcome: string, extra: Partial<VerifyResult> = {}): VerifyResult => {
    for (const id of STEP_ORDER) if (!steps.some((s) => s.id === id)) steps.push(step(id, 'skip', 'Not reached.'));
    return { ok, steps, outcome, ...extra };
  };
  const block = (id: StepId, detail: string) => {
    steps.push(step(id, 'fail', detail));
    return finish(false, `Blocked at "${STEP_TITLES[id].title}": ${detail}`);
  };

  // 1. Headers present and parseable.
  if (!input.signatureInput || !input.signature) {
    return block('headers-present', 'One or both headers are missing, so the request is treated as an unsigned bot.');
  }
  let sig: ParsedSignature | undefined;
  let sigBytes: Uint8Array | undefined;
  try {
    sig = pickSignature(parseSignatureInput(input.signatureInput), ctx.profile);
    if (!sig) return block('headers-present', 'Signature-Input has no members.');
    sigBytes = parseSignatureHeader(input.signature).get(sig.label);
  } catch (e) {
    return block('headers-present', `A header does not parse as a Structured Field: ${(e as Error).message}.`);
  }
  if (!sigBytes) return block('headers-present', `Signature has no member labeled ${sig.label}.`);
  steps.push(step('headers-present', 'pass', `Both headers present; verifying label ${sig.label}.`));

  // 2. Minimum fields.
  const missing = missingMinimumFields(sig, ctx.profile, input.req);
  if (missing.length) return block('minimum-fields', `Missing: ${missing.join(', ')}.`);
  steps.push(step('minimum-fields', 'pass', ctx.profile === 'tap' ? 'created, expires, keyid, alg, nonce, tag, @authority and @path are all there.' : 'created, expires, keyid, tag, an authority component and a covered Signature-Agent are there.'));

  // 3. Key lookup.
  const keyid = String(paramValue(sig.params, 'keyid'));
  const entry = ctx.directory.get(keyid);
  if (!entry) return block('key-lookup', `No key with keyid "${keyid}" in the local fixture directory.`);
  const algParam = paramValue(sig.params, 'alg');
  if (algParam !== undefined && algFromLabel(String(algParam)) !== entry.alg) {
    return block('key-lookup', `alg "${String(algParam)}" does not match the directory key (${entry.alg}).`);
  }
  steps.push(step('key-lookup', 'pass', `Found keyid "${keyid}" (${entry.alg}).`));

  // 4. Time window.
  const created = Number(paramValue(sig.params, 'created'));
  const expires = Number(paramValue(sig.params, 'expires'));
  const limit = ctx.profile === 'tap' ? TAP_MAX_WINDOW_SECONDS : WBA_MAX_WINDOW_SECONDS;
  if (!Number.isInteger(created) || !Number.isInteger(expires)) return block('time-window', 'created and expires must be integers.');
  if (created > ctx.now) return block('time-window', `created is ${created - ctx.now} s in the future.`);
  if (expires <= ctx.now) return block('time-window', `expired ${ctx.now - expires} s ago.`);
  if (expires - created > limit) {
    return block('time-window', `expires - created is ${expires - created} s; the limit is ${limit} s.`);
  }
  steps.push(step('time-window', 'pass', `created ${ctx.now - created} s ago, expires in ${expires - ctx.now} s, window ${expires - created} s of at most ${limit} s.`));

  // 5. Nonce.
  const nonceParam = paramValue(sig.params, 'nonce');
  const nonce = nonceParam === undefined ? undefined : String(nonceParam);
  if (nonce === undefined) {
    steps.push(step('nonce-unused', 'note', 'No nonce; the Web Bot Auth draft does not require one and leaves replay protection to RFC 9421 Section 7.2.2.'));
  } else if (isNonceSeen(ctx.seen, nonce, ctx.now)) {
    return block('nonce-unused', 'This nonce was already accepted in the last 8 minutes (replay).');
  } else {
    steps.push(step('nonce-unused', 'pass', `Nonce not in the local seen-set (${ctx.seen.size} remembered).`));
  }

  // 6. Tag.
  const tag = String(paramValue(sig.params, 'tag'));
  const allowed: readonly string[] = ctx.profile === 'tap' ? TAP_TAGS : [WBA_TAG];
  if (!allowed.includes(tag)) return block('tag-allowed', `tag "${tag}" is not one of ${allowed.join(', ')}.`);
  steps.push(step('tag-allowed', 'pass', ctx.profile === 'tap' ? (tag === 'agent-payer-auth' ? 'agent-payer-auth: the agent is paying.' : 'agent-browser-auth: the agent is browsing.') : 'web-bot-auth.'));

  // 7. Rebuild the base.
  let base: string;
  try {
    base = buildSignatureBase(input.req, sig.components, sig.params);
  } catch (e) {
    return block('rebuild-base', (e as Error).message);
  }
  steps.push(step('rebuild-base', 'pass', `${base.split('\n').length} lines rebuilt from the request as received.`));

  // 8. Verify.
  const good = await verifyText(entry.alg, entry.key, base, sigBytes);
  if (!good) {
    steps.push(step('verify-signature', 'fail', 'The signature does not match the rebuilt base: a covered value or parameter changed, or a different key signed it.'));
    return finish(false, 'Blocked: the signature does not verify.', { base });
  }
  steps.push(step('verify-signature', 'pass', 'Valid signature.'));
  return finish(true, ctx.profile === 'tap' ? `Accepted as a trusted agent (${tag}).` : 'Accepted as a signed bot (web-bot-auth).', { base, nonce });
}
