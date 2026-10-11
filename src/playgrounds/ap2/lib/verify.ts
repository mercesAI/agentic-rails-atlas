/**
 * AP2 v0.2 verifiers. Each runs every check and reports which binding holds or breaks, instead of
 * stopping at the first failure, so the reader can see the whole picture.
 *
 * Rules: `docs/ap2/specification.md` "Verification" (Merchant, Credential Provider and Network,
 * Merchant Payment Processor) and `docs/ap2/agent_authorization.md` "Verification and Processing Rules".
 * The mapping from a failed check to an error code is this simulation's reading of the "Errors" list.
 */
import { evaluateCheckoutConstraints, evaluatePaymentConstraints, type BudgetUnit, type ConstraintResult, type PaymentHistory } from './constraints';
import { jsonEqual, sha256B64url } from './encoding';
import { decodeJws, importEs256PublicJwk, verifyJws, type Ap2Jwk } from './jws';
import { parseSdJwt, resolveDisclosures } from './sdjwt';
import { VCT, type Ap2ErrorCode, type Checkout, type PaymentMandate } from './types';

export type Binding = 'signature' | 'disclosures' | 'cnf' | 'sd_hash' | 'checkout_hash' | 'transaction_id' | 'payment.reference' | 'vct' | 'schema' | 'exp' | 'claims' | 'current_checkout' | 'charge';

export interface Check {
  id: string;
  binding: Binding;
  label: string;
  ok: boolean;
  detail: string;
  /** Error code this check produces when it fails. */
  code: Ap2ErrorCode;
}

export type VerifierRole = 'merchant' | 'credential_provider' | 'merchant_payment_processor';

export interface VerifyResult {
  role: VerifierRole;
  checks: Check[];
  constraints: ConstraintResult[];
  /** Constraint results not evaluated by this role, with the reason. */
  deferred: { type: string; reason: string }[];
  error: Ap2ErrorCode | null;
  errorDescription?: string;
  openContent?: Record<string, unknown>;
  closedContent?: Record<string, unknown>;
}

export interface Chain {
  /** Serialized open mandate SD-JWT (Human Not Present only). */
  open?: string;
  /** Serialized closed mandate SD-JWT. */
  closed: string;
}

export interface VerifierContext {
  /** Trust list entry: the user's or agent provider's public key. */
  trustedSignerJwk: Ap2Jwk;
  /** Unix epoch seconds. */
  now: number;
  supportsMandates: boolean;
}

const SEVERITY: Ap2ErrorCode[] = ['mandates_not_supported', 'invalid_credential', 'invalid_mandate', 'unresolved_constraint'];

function decideError(checks: Check[], constraints: ConstraintResult[]): { error: Ap2ErrorCode | null; description?: string } {
  const failed = checks.filter((c) => !c.ok);
  for (const code of SEVERITY) {
    const first = failed.find((c) => c.code === code);
    if (first) return { error: code, description: first.label };
  }
  const badConstraint = constraints.find((c) => !c.ok);
  if (badConstraint) return { error: 'unresolved_constraint', description: `Constraint ${badConstraint.type} is not satisfied` };
  return { error: null };
}

interface Unpacked {
  ok: boolean;
  header?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  content?: Record<string, unknown>;
  unreferenced: number;
  malformed: number;
  jwt: string;
}

/** Parse an SD-JWT, resolve its disclosures and pull out the single Mandate Content in `delegate_payload`. */
export async function unpackMandate(serialized: string): Promise<Unpacked> {
  const { jwt, disclosures } = parseSdJwt(serialized);
  try {
    const { header, payload } = decodeJws<Record<string, unknown>>(jwt);
    const resolved = await resolveDisclosures(payload, disclosures);
    const value = resolved.value as Record<string, unknown>;
    const list = Array.isArray(value.delegate_payload) ? (value.delegate_payload as Record<string, unknown>[]) : [];
    return { ok: true, header, payload, content: list[0], unreferenced: resolved.unreferenced.length, malformed: resolved.malformed.length, jwt };
  } catch {
    return { ok: false, unreferenced: 0, malformed: 0, jwt };
  }
}

async function sigCheck(
  id: string,
  label: string,
  jwt: string,
  jwk: Ap2Jwk | undefined,
  binding: Binding = 'signature',
  code: Ap2ErrorCode = 'invalid_credential',
): Promise<Check> {
  let ok = false;
  if (jwk) {
    try {
      ok = await verifyJws(jwt, await importEs256PublicJwk(jwk));
    } catch {
      ok = false;
    }
  }
  return { id, binding, label, ok, code, detail: ok ? 'ES256 signature verifies.' : jwk ? 'ES256 signature does not verify with this key.' : 'No key to verify with.' };
}

function disclosureCheck(id: string, label: string, u: Unpacked): Check {
  const ok = u.ok && !!u.content && u.unreferenced === 0 && u.malformed === 0;
  return {
    id,
    binding: 'disclosures',
    label,
    ok,
    code: 'invalid_credential',
    detail: ok
      ? 'Every disclosure hashes to a digest the signed payload references.'
      : `${u.unreferenced} disclosure(s) match no signed digest; ${u.malformed} malformed. A changed disclosure gets a new digest.`,
  };
}

function expCheck(id: string, label: string, content: Record<string, unknown> | undefined, now: number): Check {
  const exp = content?.exp;
  const ok = exp === undefined || (typeof exp === 'number' && exp > now);
  return { id, binding: 'exp', label, ok, code: 'invalid_credential', detail: exp === undefined ? 'No `exp`.' : `exp ${String(exp)} against now ${now}.` };
}

function vctCheck(id: string, content: Record<string, unknown> | undefined, expected: string): Check {
  const got = content?.vct;
  const ok = got === expected;
  return {
    id,
    binding: 'vct',
    label: `vct is exactly ${expected}`,
    ok,
    code: 'invalid_mandate',
    detail: ok ? 'Exact string match, including the version suffix.' : `Got ${JSON.stringify(got)}. Implementations MUST match the exact vct string, including the suffix.`,
  };
}

function requiredCheck(id: string, content: Record<string, unknown> | undefined, required: string[], extra?: { ok: boolean; why: string }): Check {
  const missing = required.filter((k) => content?.[k] === undefined);
  const ok = missing.length === 0 && (extra?.ok ?? true);
  return {
    id,
    binding: 'schema',
    label: 'Required fields present',
    ok,
    code: 'invalid_mandate',
    detail: missing.length ? `Missing: ${missing.join(', ')}.` : extra && !extra.ok ? extra.why : `Has ${required.join(', ')}.`,
  };
}

/** Open claims other than vct, constraints, cnf, iat and exp must reappear unchanged in the closed mandate. */
function claimsUnchangedCheck(open: Record<string, unknown> | undefined, closed: Record<string, unknown> | undefined): Check {
  const skip = new Set(['vct', 'constraints', 'cnf', 'iat', 'exp']);
  const changed = Object.keys(open ?? {}).filter((k) => !skip.has(k) && !jsonEqual(open?.[k], closed?.[k]));
  return {
    id: 'claims-unchanged',
    binding: 'claims',
    label: 'Claims set in the open mandate are unchanged',
    ok: changed.length === 0,
    code: 'invalid_mandate',
    detail: changed.length ? `Changed: ${changed.join(', ')}.` : 'No preset claim differs.',
  };
}

async function openChainChecks(chain: Chain, ctx: VerifierContext, openVct: string): Promise<{ checks: Check[]; open?: Unpacked; closed: Unpacked }> {
  const checks: Check[] = [];
  const closed = await unpackMandate(chain.closed);
  if (!chain.open) {
    // Human Present: the closed mandate is signed directly by the user (or agent provider).
    checks.push(await sigCheck('closed-signature', 'User signature on the closed mandate', closed.jwt, ctx.trustedSignerJwk));
    checks.push(disclosureCheck('closed-disclosures', 'Closed mandate disclosures match signed digests', closed));
    return { checks, closed };
  }
  const open = await unpackMandate(chain.open);
  checks.push(await sigCheck('open-signature', 'User signature on the open mandate', open.jwt, ctx.trustedSignerJwk));
  checks.push(disclosureCheck('open-disclosures', 'Open mandate disclosures match signed digests', open));
  checks.push(vctCheck('open-vct', open.content, openVct));
  const constraintsOk = Array.isArray(open.content?.constraints);
  const containsRequired = constraintsOk && (open.content?.constraints as { type?: string }[]).some((c) => c.type === (openVct === VCT.checkoutOpen ? 'checkout.line_items' : 'payment.reference'));
  checks.push(
    requiredCheck('open-schema', open.content, ['vct', 'constraints', 'cnf'], {
      ok: containsRequired,
      why: openVct === VCT.checkoutOpen ? '`constraints` must contain a checkout.line_items entry.' : '`constraints` must contain a payment.reference entry.',
    }),
  );
  checks.push(expCheck('open-exp', 'Open mandate not expired', open.content, ctx.now));
  const cnfJwk = (open.content?.cnf as { jwk?: Ap2Jwk } | undefined)?.jwk;
  const kb = await sigCheck('cnf', 'Closed mandate signed with the key in the open mandate cnf', closed.jwt, cnfJwk, 'cnf');
  checks.push(kb);
  const typ = closed.header?.typ;
  checks.push({ id: 'kb-typ', binding: 'cnf', label: 'Closed mandate is a key-binding JWT', ok: typ === 'kb+sd-jwt', code: 'invalid_credential', detail: `typ ${JSON.stringify(typ)}.` });
  const expectedSdHash = await sha256B64url(chain.open);
  const gotSdHash = closed.payload?.sd_hash;
  checks.push({
    id: 'sd_hash',
    binding: 'sd_hash',
    label: 'sd_hash links the closed mandate to this open mandate',
    ok: gotSdHash === expectedSdHash,
    code: 'invalid_credential',
    detail: gotSdHash === expectedSdHash ? `Recomputed ${expectedSdHash}.` : `Recomputed ${expectedSdHash}, mandate says ${String(gotSdHash)}.`,
  });
  checks.push(disclosureCheck('closed-disclosures', 'Closed mandate disclosures match signed digests', closed));
  return { checks, open, closed };
}

// ------------------------------------------------------------------ merchant

export interface MerchantContext extends VerifierContext {
  merchantJwk: Ap2Jwk;
  /** The latest checkout_jwt this merchant created for the session. */
  currentCheckoutJwt: string;
}

export async function verifyCheckoutChain(chain: Chain, ctx: MerchantContext): Promise<VerifyResult> {
  if (!ctx.supportsMandates) {
    return {
      role: 'merchant',
      checks: [{ id: 'support', binding: 'schema', label: 'Merchant accepts mandates for this action', ok: false, code: 'mandates_not_supported', detail: 'This verifier does not use mandates; the agent may fall back to a non-agentic flow.' }],
      constraints: [],
      deferred: [],
      error: 'mandates_not_supported',
      errorDescription: 'This merchant does not support mandates for checkout',
    };
  }
  const { checks, open, closed } = await openChainChecks(chain, ctx, VCT.checkoutOpen);
  const c = closed.content;
  checks.push(vctCheck('closed-vct', c, VCT.checkout));
  checks.push(requiredCheck('closed-schema', c, ['vct', 'checkout_jwt', 'checkout_hash']));
  checks.push(expCheck('closed-exp', 'Closed mandate not expired', c, ctx.now));
  const checkoutJwt = typeof c?.checkout_jwt === 'string' ? c.checkout_jwt : '';
  checks.push(await sigCheck('checkout-jwt-signature', 'Merchant signature on checkout_jwt', checkoutJwt, ctx.merchantJwk, 'signature', 'invalid_mandate'));
  const recomputed = checkoutJwt ? await sha256B64url(checkoutJwt) : '';
  checks.push({
    id: 'checkout_hash',
    binding: 'checkout_hash',
    label: 'checkout_hash equals the hash of checkout_jwt',
    ok: !!recomputed && c?.checkout_hash === recomputed,
    code: 'invalid_mandate',
    detail: `Recomputed ${recomputed || 'nothing'}; mandate says ${String(c?.checkout_hash)}.`,
  });
  checks.push({
    id: 'current-checkout',
    binding: 'current_checkout',
    label: 'checkout_jwt is the latest checkout this merchant created',
    ok: !!checkoutJwt && checkoutJwt === ctx.currentCheckoutJwt,
    code: 'invalid_mandate',
    detail: checkoutJwt === ctx.currentCheckoutJwt ? 'Same signed checkout.' : 'The mandate approves a different checkout than the current cart.',
  });
  if (open) checks.push(claimsUnchangedCheck(open.content, c));
  let constraints: ConstraintResult[] = [];
  if (open?.content && checkoutJwt) {
    try {
      const checkout = decodeJws<Checkout>(checkoutJwt).payload;
      constraints = evaluateCheckoutConstraints((open.content.constraints as never) ?? [], checkout);
    } catch {
      constraints = [];
    }
  }
  const { error, description } = decideError(checks, constraints);
  return { role: 'merchant', checks, constraints, deferred: [], error, errorDescription: description, openContent: open?.content, closedContent: c };
}

// ------------------------------------------------------------------ credential provider and merchant payment processor

export interface PaymentContext extends VerifierContext {
  role: 'credential_provider' | 'merchant_payment_processor';
  history: PaymentHistory;
  budgetUnit: BudgetUnit;
  /** MPP only: the checkout_jwt hash the merchant sent with the payment initiation. */
  checkoutHash?: string;
  /** MPP only: the open Checkout Mandate digest the merchant sent (Human Not Present). */
  openCheckoutDigest?: string;
  /** MPP only: the amount the merchant asks to charge, minor units. */
  chargeAmount?: number;
}

export async function verifyPaymentChain(chain: Chain, ctx: PaymentContext): Promise<VerifyResult> {
  const role = ctx.role;
  if (!ctx.supportsMandates) {
    return {
      role,
      checks: [{ id: 'support', binding: 'schema', label: 'Verifier accepts mandates for this action', ok: false, code: 'mandates_not_supported', detail: 'This verifier does not use mandates.' }],
      constraints: [],
      deferred: [],
      error: 'mandates_not_supported',
      errorDescription: 'This verifier does not support mandates for payment',
    };
  }
  const { checks, open, closed } = await openChainChecks(chain, ctx, VCT.paymentOpen);
  const c = closed.content;
  checks.push(vctCheck('closed-vct', c, VCT.payment));
  checks.push(requiredCheck('closed-schema', c, ['vct', 'transaction_id', 'payee', 'payment_amount', 'payment_instrument']));
  checks.push(expCheck('closed-exp', 'Closed mandate not expired', c, ctx.now));
  if (open) checks.push(claimsUnchangedCheck(open.content, c));
  if (role === 'merchant_payment_processor') {
    const tid = c?.transaction_id;
    checks.push({
      id: 'transaction_id',
      binding: 'transaction_id',
      label: 'transaction_id equals the checkout_jwt hash the merchant sent',
      ok: !!ctx.checkoutHash && tid === ctx.checkoutHash,
      code: 'invalid_mandate',
      detail: `Merchant sent ${String(ctx.checkoutHash)}; mandate says ${String(tid)}.`,
    });
    const amt = (c?.payment_amount as { amount?: number } | undefined)?.amount;
    checks.push({
      id: 'charge',
      binding: 'charge',
      label: 'payment_amount equals the amount charged',
      ok: amt === ctx.chargeAmount,
      code: 'invalid_mandate',
      detail: `Charge ${String(ctx.chargeAmount)}; mandate says ${String(amt)} (minor units).`,
    });
  }
  let constraints: ConstraintResult[] = [];
  const deferred: { type: string; reason: string }[] = [];
  if (open?.content && c) {
    const all = (Array.isArray(open.content.constraints) ? open.content.constraints : []) as { type: string }[];
    const own = role === 'credential_provider' ? all.filter((x) => x.type !== 'payment.reference') : all;
    if (role === 'credential_provider' && own.length !== all.length) {
      deferred.push({
        type: 'payment.reference',
        reason:
          'The Credential Provider receives only the Payment Mandates (flows.md, Human Not Present, Phase 2 step 3), so it cannot see the open Checkout Mandate. The merchant passes that hash to the processor at step 5, so this simulation evaluates payment.reference there.',
      });
    }
    constraints = evaluatePaymentConstraints(own as never, c as unknown as PaymentMandate, {
      now: ctx.now,
      history: ctx.history,
      budgetUnit: ctx.budgetUnit,
      openCheckoutDigest: ctx.openCheckoutDigest,
    });
  }
  const { error, description } = decideError(checks, constraints);
  return { role, checks, constraints, deferred, error, errorDescription: description, openContent: open?.content, closedContent: c };
}
