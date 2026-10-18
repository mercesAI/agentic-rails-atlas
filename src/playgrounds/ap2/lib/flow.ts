/**
 * Orchestrates one AP2 v0.2 run, Human Present or Human Not Present, following the step order of
 * `docs/ap2/flows.md`, with optional failure injection. Pure apart from WebCrypto calls.
 */
import { checkoutTotal, buildCheckout, INSTRUMENTS, ISSUERS, merchantById, CATALOG, CURRENCY, type CartLine } from './fixtures';
import { b64urlDecodeJson, b64urlEncodeJson, randomB64url } from './encoding';
import { decodeJws, signJws, type Es256Key, generateEs256Key } from './jws';
import { decodeDisclosure, parseSdJwt } from './sdjwt';
import {
  checkoutHashOf,
  closedCheckoutContent,
  closedPaymentContent,
  closeWithKeyBinding,
  concealCheckoutJwt,
  concealConstraints,
  issueUserSigned,
  newNonce,
  openCheckoutContent,
  openCheckoutDigestOf,
  openPaymentContent,
  present,
  receiptReferenceOf,
  signCheckout,
  type IssuedMandate,
  type TaggedDisclosure,
} from './mandates';
import { verifyCheckoutChain, verifyPaymentChain, type Chain, type VerifyResult } from './verify';
import { evaluateCheckoutConstraints, evaluatePaymentConstraints, type BudgetUnit, type ConstraintResult } from './constraints';
import {
  VCT,
  type AnyConstraint,
  type Ap2ErrorCode,
  type Checkout,
  type CheckoutReceipt,
  type Frequency,
  type PaymentReceipt,
  type ProseMandateReceipt,
} from './types';

export type Mode = 'hp' | 'hnp';

export interface Keys {
  user: Es256Key;
  agent: Es256Key;
  rogueAgent: Es256Key;
  merchant: Es256Key;
  processor: Es256Key;
}

/** Fresh ES256 keys for one session. Private keys are non-extractable and never stored. */
export async function generateKeys(): Promise<Keys> {
  const [user, agent, rogueAgent, merchant, processor] = await Promise.all([
    generateEs256Key('user_sk'),
    generateEs256Key('agent_sk'),
    generateEs256Key('other_agent_sk'),
    generateEs256Key('merchant_sk'),
    generateEs256Key('processor_sk'),
  ]);
  return { user, agent, rogueAgent, merchant, processor };
}

// ------------------------------------------------------------------ failure injection

export type TamperId =
  | 'none'
  | 'outsider_edit_amount'
  | 'outsider_edit_open_constraint'
  | 'agent_swaps_checkout_jwt'
  | 'agent_points_payment_elsewhere'
  | 'other_agent_key'
  | 'wrong_parent_sd_hash'
  | 'payment_reference_other_task'
  | 'expired'
  | 'vct_without_suffix'
  | 'withhold_merchant_disclosure'
  | 'merchant_cart_changed'
  | 'merchant_no_mandates';

export interface TamperInfo {
  id: TamperId;
  label: string;
  who: string;
  modes: Mode[];
  expect: string;
}

export const TAMPERS: TamperInfo[] = [
  { id: 'none', label: 'No tampering', who: 'Nobody', modes: ['hp', 'hnp'], expect: 'Every binding holds.' },
  { id: 'outsider_edit_amount', label: 'Edit payment_amount after signing', who: 'An outsider without any key', modes: ['hp', 'hnp'], expect: 'The edited disclosure hashes to a digest no signature covers: invalid_credential.' },
  { id: 'outsider_edit_open_constraint', label: 'Raise amount_range max in the open mandate', who: 'An outsider (or the agent) without the user key', modes: ['hnp'], expect: 'The open mandate disclosure no longer matches its signed digest: invalid_credential.' },
  { id: 'agent_swaps_checkout_jwt', label: 'Put a pricier signed checkout into the closed Checkout Mandate', who: 'A misbehaving agent that holds agent_sk', modes: ['hnp'], expect: 'checkout_hash no longer matches checkout_jwt, and the merchant sees a checkout other than the current one: invalid_mandate.' },
  { id: 'agent_points_payment_elsewhere', label: 'Point transaction_id at a different checkout', who: 'A misbehaving agent that holds agent_sk', modes: ['hnp'], expect: 'The processor compares transaction_id with the checkout_jwt hash the merchant sent: invalid_mandate.' },
  { id: 'other_agent_key', label: 'Sign the closed mandates with another agent key', who: 'A different agent that copied the open mandates', modes: ['hnp'], expect: 'The key-binding signature does not verify with the key in cnf: invalid_credential.' },
  { id: 'wrong_parent_sd_hash', label: 'Bind the closed Checkout Mandate to an earlier open mandate', who: 'A misbehaving agent reusing an old task', modes: ['hnp'], expect: 'sd_hash does not match the open mandate presented: invalid_credential.' },
  { id: 'payment_reference_other_task', label: 'Pair the checkout with an open Payment Mandate from another task', who: 'A misbehaving agent mixing tasks', modes: ['hnp'], expect: 'payment.reference does not match the open Checkout Mandate: unresolved_constraint.' },
  { id: 'expired', label: 'Present after exp', who: 'Time', modes: ['hp', 'hnp'], expect: 'The mandate is past exp: invalid_credential.' },
  { id: 'vct_without_suffix', label: 'Use vct "mandate.payment" (as the schema description words it)', who: 'A signer that read the description, not the const', modes: ['hp', 'hnp'], expect: 'The vct must match "mandate.payment.1" exactly: invalid_mandate.' },
  { id: 'withhold_merchant_disclosure', label: 'Reveal no allowed_merchants element', who: 'An agent minimizing disclosure too far', modes: ['hnp'], expect: 'checkout.allowed_merchants has no revealed element and fails: unresolved_constraint.' },
  { id: 'merchant_cart_changed', label: 'Merchant reprices the cart after the mandate', who: 'The merchant', modes: ['hp', 'hnp'], expect: 'The mandate approves a checkout other than the current one: invalid_mandate.' },
  { id: 'merchant_no_mandates', label: 'Merchant does not accept mandates', who: 'The merchant', modes: ['hp', 'hnp'], expect: 'mandates_not_supported, a signal to fall back to a non-agentic flow.' },
];

// ------------------------------------------------------------------ configuration

export interface LineRequirementInput {
  id: string;
  acceptableSkus: string[];
  quantity: number;
}

export interface V02Config {
  mode: Mode;
  /** Unix epoch seconds. */
  now: number;
  // Open mandates (Human Not Present)
  allowedMerchantIds: string[];
  lineRequirements: LineRequirementInput[];
  amountRange: { enabled: boolean; min?: number; max: number };
  budget: { enabled: boolean; max: number; spentMinor: number };
  budgetUnit: BudgetUnit;
  allowedPayeeIds: string[];
  allowedInstrumentIds: string[];
  recurrence: { enabled: boolean; frequency: Frequency; max_occurrences?: number; occurrences: number; lastPresentedAt?: number };
  executionWindow: { enabled: boolean; not_before?: string; not_after?: string };
  /** Adds a constraint whose type no verifier here knows. */
  unknownConstraint: boolean;
  /** Pre-set `payment_instrument` in the open Payment Mandate. */
  presetInstrument: boolean;
  openTtlSeconds: number;
  disclosurePolicy: 'minimal' | 'all';
  // The checkout the agent assembles
  merchantId: string;
  lines: CartLine[];
  instrumentId: string;
  tamper: TamperId;
}

/** An unrecognized constraint, named with a reverse-DNS prefix as the spec recommends for new types. */
export const UNKNOWN_CONSTRAINT: AnyConstraint = { type: 'com.example.loyalty_tier', minimum_tier: 'gold' };

export function defaultConfig(now: number): V02Config {
  return {
    mode: 'hnp',
    now,
    allowedMerchantIds: ['merchant_trailhead', 'merchant_harbor'],
    lineRequirements: [{ id: 'line_shoes', acceptableSkus: ['sku_trail_shoe_red_9', 'sku_trail_shoe_blue_9'], quantity: 1 }],
    amountRange: { enabled: true, min: 0, max: 15000 },
    budget: { enabled: false, max: 50000, spentMinor: 0 },
    budgetUnit: 'minor',
    allowedPayeeIds: ['merchant_trailhead', 'merchant_harbor'],
    allowedInstrumentIds: ['pi_fixture_card_0000'],
    recurrence: { enabled: false, frequency: 'MONTHLY', max_occurrences: 12, occurrences: 0 },
    executionWindow: { enabled: false },
    unknownConstraint: false,
    presetInstrument: false,
    openTtlSeconds: 3600,
    disclosurePolicy: 'minimal',
    merchantId: 'merchant_trailhead',
    lines: [{ sku: 'sku_trail_shoe_red_9', quantity: 1 }],
    instrumentId: 'pi_fixture_card_0000',
    tamper: 'none',
  };
}

export function buildCheckoutConstraints(cfg: V02Config): AnyConstraint[] {
  const titles = new Map<string, string>();
  for (const items of Object.values(CATALOG)) for (const i of items) if (!titles.has(i.id)) titles.set(i.id, i.title);
  return [
    {
      type: 'checkout.line_items',
      items: cfg.lineRequirements.map((r) => ({ id: r.id, acceptable_items: r.acceptableSkus.map((id) => ({ id, title: titles.get(id) ?? id })), quantity: r.quantity })),
    },
    { type: 'checkout.allowed_merchants', allowed: cfg.allowedMerchantIds.map((id) => merchantById(id)).filter((m) => !!m) },
  ] as AnyConstraint[];
}

export function buildPaymentConstraints(cfg: V02Config, conditionalTransactionId: string): AnyConstraint[] {
  const out: AnyConstraint[] = [];
  if (cfg.amountRange.enabled) {
    out.push({ type: 'payment.amount_range', currency: CURRENCY, max: cfg.amountRange.max, ...(cfg.amountRange.min === undefined ? {} : { min: cfg.amountRange.min }) });
  }
  if (cfg.budget.enabled) out.push({ type: 'payment.budget', max: cfg.budget.max, currency: CURRENCY });
  if (cfg.recurrence.enabled) {
    out.push({ type: 'payment.agent_recurrence', frequency: cfg.recurrence.frequency, ...(cfg.recurrence.max_occurrences ? { max_occurrences: cfg.recurrence.max_occurrences } : {}) });
  }
  out.push({ type: 'payment.allowed_payees', allowed: cfg.allowedPayeeIds.map((id) => merchantById(id)).filter((m) => !!m) } as AnyConstraint);
  out.push({ type: 'payment.allowed_payment_instruments', allowed: INSTRUMENTS.filter((i) => cfg.allowedInstrumentIds.includes(i.id)) } as AnyConstraint);
  if (cfg.executionWindow.enabled) {
    out.push({ type: 'payment.execution_date', ...(cfg.executionWindow.not_before ? { not_before: cfg.executionWindow.not_before } : {}), ...(cfg.executionWindow.not_after ? { not_after: cfg.executionWindow.not_after } : {}) });
  }
  out.push({ type: 'payment.reference', conditional_transaction_id: conditionalTransactionId });
  if (cfg.unknownConstraint) out.push(UNKNOWN_CONSTRAINT);
  return out;
}

// ------------------------------------------------------------------ run

export interface FlowStep {
  id: string;
  actor: string;
  text: string;
  status: 'done' | 'failed' | 'skipped';
  ref: string;
}

export interface SignedReceipt<R> {
  receipt: R;
  prose: ProseMandateReceipt;
  jwt: string;
  issuer: string;
}

export interface V02Run {
  config: V02Config;
  checkout: Checkout;
  checkoutJwt: string;
  checkoutHash: string;
  open?: { checkout: IssuedMandate; payment: IssuedMandate; checkoutPresentation: string; paymentPresentation: string; openCheckoutDigest: string };
  closed: { checkout: IssuedMandate; payment: IssuedMandate; checkoutPresentation: string; paymentPresentation: string };
  checkoutChain: Chain;
  paymentChain: Chain;
  results: { credentialProvider: VerifyResult; merchant?: VerifyResult; processor?: VerifyResult };
  receipts: { checkout?: SignedReceipt<CheckoutReceipt>; payment: SignedReceipt<PaymentReceipt> };
  steps: FlowStep[];
  outcome: { ok: boolean; code: Ap2ErrorCode | null; stoppedAt?: string };
}

function selectDisclosures(all: TaggedDisclosure[], cfg: V02Config, checkout: Checkout, tamper: TamperId): TaggedDisclosure[] {
  const skus = new Set(checkout.line_items.map((l) => l.item.id));
  return all.filter((d) => {
    if (d.tag === 'content') return true;
    if (d.tag === 'merchant' && tamper === 'withhold_merchant_disclosure') return false;
    if (cfg.disclosurePolicy === 'all') return true;
    const v = d.value as { id?: string; type?: string };
    if (d.tag === 'merchant' || d.tag === 'payee') return v.id === checkout.merchant.id;
    if (d.tag === 'item') return !!v.id && skus.has(v.id);
    if (d.tag === 'instrument') return v.id === cfg.instrumentId;
    return true;
  });
}

/** Re-encode one disclosure with an edited value but keep the original signatures and digests. */
function editDisclosure(serialized: string, pick: (value: unknown) => boolean, edit: (value: unknown) => unknown): string {
  const { jwt, disclosures } = parseSdJwt(serialized);
  const out = disclosures.map((enc) => {
    const d = decodeDisclosure(enc);
    if (!pick(d.value)) return enc;
    const arr = d.name === undefined ? [d.salt, edit(d.value)] : [d.salt, d.name, edit(d.value)];
    return b64urlEncodeJson(arr);
  });
  return [jwt, ...out].join('~') + '~';
}

const isMandateContent = (vct: string) => (v: unknown) => !!v && typeof v === 'object' && (v as { vct?: string }).vct === vct;

async function signReceipt<R extends CheckoutReceipt | PaymentReceipt>(receipt: R, key: Es256Key): Promise<SignedReceipt<R>> {
  const prose: ProseMandateReceipt = {
    iss: receipt.iss,
    result: receipt.status === 'Success' ? 'success' : 'error',
    reference: receipt.reference,
    ...(receipt.error ? { error: receipt.error, error_description: receipt.error_description } : {}),
  };
  const jwt = await signJws({ alg: 'ES256', typ: 'JWT', kid: `${key.label}-1` }, receipt, key.privateKey);
  return { receipt, prose, jwt, issuer: receipt.iss };
}

export async function runV02(cfg: V02Config, keys: Keys): Promise<V02Run> {
  const now = cfg.now;
  const hnp = cfg.mode === 'hnp';
  const tamper = TAMPERS.find((t) => t.id === cfg.tamper && t.modes.includes(cfg.mode))?.id ?? 'none';
  const merchant = merchantById(cfg.merchantId) ?? merchantById('merchant_trailhead')!;
  const instrument = INSTRUMENTS.find((i) => i.id === cfg.instrumentId) ?? INSTRUMENTS[0]!;
  const steps: FlowStep[] = [];
  const step = (id: string, actor: string, text: string, ref: string, status: FlowStep['status'] = 'done') => steps.push({ id, actor, text, ref, status });

  const expiredShift = tamper === 'expired' ? -7200 : 0;
  const iat = now - 60 + expiredShift;
  // The lifetime counts from signing (now), as the UI label says, so the one minute minimum still verifies (exp > now).
  const openExp = now + expiredShift + Math.max(60, cfg.openTtlSeconds);
  const closedExp = iat + 900;

  // ---- Phase 1a (HNP): open mandates signed on the Trusted Surface
  let open: V02Run['open'];
  let openCheckoutIssued: IssuedMandate | undefined;
  let openPaymentIssued: IssuedMandate | undefined;
  let openCheckoutDigest = '';
  let otherOpenCheckout: IssuedMandate | undefined;
  if (hnp) {
    step('1a.1', 'User to Shopping Agent', 'Sets a shopping task.', 'flows.md Human Not Present, Phase 1a step 1');
    const cc = await concealConstraints(buildCheckoutConstraints(cfg));
    const openCheckout = openCheckoutContent(cc.constraints, keys.agent, iat, openExp);
    openCheckoutIssued = await issueUserSigned(openCheckout as unknown as Record<string, unknown>, cc.disclosures, keys.user, { iat });
    openCheckoutIssued.content = openCheckoutContent(buildCheckoutConstraints(cfg), keys.agent, iat, openExp) as unknown as Record<string, unknown>;
    openCheckoutDigest = await openCheckoutDigestOf(openCheckoutIssued.jwt);

    let referenceTarget = openCheckoutDigest;
    if (tamper === 'payment_reference_other_task' || tamper === 'wrong_parent_sd_hash') {
      const other = await concealConstraints(buildCheckoutConstraints({ ...cfg, lineRequirements: [{ id: 'line_books', acceptableSkus: ['sku_atlas_book'], quantity: 1 }] }));
      otherOpenCheckout = await issueUserSigned(openCheckoutContent(other.constraints, keys.agent, iat - 86400, openExp) as unknown as Record<string, unknown>, other.disclosures, keys.user, { iat: iat - 86400 });
      if (tamper === 'payment_reference_other_task') referenceTarget = await openCheckoutDigestOf(otherOpenCheckout.jwt);
    }
    const plainPaymentConstraints = buildPaymentConstraints(cfg, referenceTarget);
    const pc = await concealConstraints(plainPaymentConstraints);
    const preset = cfg.presetInstrument ? { payment_instrument: instrument } : {};
    openPaymentIssued = await issueUserSigned(openPaymentContent(pc.constraints, keys.agent, iat, openExp, preset) as unknown as Record<string, unknown>, pc.disclosures, keys.user, { iat });
    openPaymentIssued.content = openPaymentContent(plainPaymentConstraints, keys.agent, iat, openExp, preset) as unknown as Record<string, unknown>;
    step('1a.2', 'Shopping Agent to Trusted Surface', 'Assembles open Checkout and Payment Mandate Content (mandate.checkout.open.1, mandate.payment.open.1) with constraints and agent_pk in cnf.', 'flows.md Phase 1a step 2');
    step('1a.3', 'Trusted Surface and User', 'Shows the content; the user authenticates and consents.', 'flows.md Phase 1a step 3');
    step('1a.4', 'Trusted Surface', 'Signs both open mandates with user_sk; the open Checkout Mandate digest goes into payment.reference.', 'flows.md Phase 1a step 4');
  } else {
    step('1.1', 'User to Shopping Agent', 'Starts shopping.', 'flows.md Human Present, Phase 1 step 1');
  }

  // ---- Shopping: merchant signs the checkout
  const checkout = buildCheckout(merchant, cfg.lines, `chk_${randomB64url(6)}`);
  const checkoutJwt = await signCheckout(checkout, keys.merchant);
  const checkoutHash = await checkoutHashOf(checkoutJwt);
  step(hnp ? '1b.1' : '1.2', 'Shopping Agent and Merchant', `Assembles a cart at ${merchant.name}.`, hnp ? 'flows.md Phase 1b step 1' : 'flows.md Phase 1 step 2');
  step(hnp ? '1b.2' : '1.3', 'Merchant to Shopping Agent', 'Signs the Checkout (checkout_jwt, ES256) and asks for a mandate.', hnp ? 'flows.md Phase 1b step 2' : 'flows.md Phase 1 step 3');
  if (!hnp) step('1.4', 'Shopping Agent and Credential Provider', 'Picks a payment instrument.', 'flows.md Phase 1 step 4');

  // Alternative checkout for tampering
  let pricier: { jwt: string; hash: string } | undefined;
  if (tamper === 'agent_swaps_checkout_jwt' || tamper === 'agent_points_payment_elsewhere' || tamper === 'merchant_cart_changed') {
    const alt = buildCheckout(merchant, cfg.lines.map((l) => ({ ...l, quantity: l.quantity + 1 })), `chk_${randomB64url(6)}`);
    const jwt = await signCheckout(alt, keys.merchant);
    pricier = { jwt, hash: await checkoutHashOf(jwt) };
  }

  // ---- Closed mandates
  const amount = checkoutTotal(checkout);
  const closedCheckoutJwt = tamper === 'agent_swaps_checkout_jwt' && pricier ? pricier.jwt : checkoutJwt;
  const closedCheckout = closedCheckoutContent(closedCheckoutJwt, checkoutHash, iat, closedExp);
  const transactionId = tamper === 'agent_points_payment_elsewhere' && pricier ? pricier.hash : checkoutHash;
  const closedPayment = closedPaymentContent(
    { transaction_id: transactionId, payee: { ...merchant }, payment_amount: { amount, currency: checkout.currency }, payment_instrument: { ...instrument } },
    iat,
    closedExp,
    tamper === 'vct_without_suffix' ? 'mandate.payment' : VCT.payment,
  );
  const concealedCheckout = await concealCheckoutJwt(closedCheckout);

  let closedCheckoutIssued: IssuedMandate;
  let closedPaymentIssued: IssuedMandate;
  let checkoutChain: Chain;
  let paymentChain: Chain;
  if (hnp && openCheckoutIssued && openPaymentIssued) {
    step('2.1', 'Shopping Agent', 'Selects the open mandates whose constraints fit this checkout.', 'flows.md Human Not Present, Phase 2 step 1');
    const openCheckoutPresentation = present(openCheckoutIssued, selectDisclosures(openCheckoutIssued.disclosures, cfg, checkout, tamper));
    const openPaymentPresentation = present(openPaymentIssued, selectDisclosures(openPaymentIssued.disclosures, cfg, checkout, tamper));
    const signer = tamper === 'other_agent_key' ? keys.rogueAgent : keys.agent;
    const checkoutParent = tamper === 'wrong_parent_sd_hash' && otherOpenCheckout ? present(otherOpenCheckout, otherOpenCheckout.disclosures) : openCheckoutPresentation;
    closedCheckoutIssued = await closeWithKeyBinding(concealedCheckout.content, concealedCheckout.disclosures, signer, { iat: now, aud: 'merchant', nonce: newNonce(), parentPresentation: checkoutParent });
    closedCheckoutIssued.content = closedCheckout as unknown as Record<string, unknown>;
    closedPaymentIssued = await closeWithKeyBinding(closedPayment as unknown as Record<string, unknown>, [], signer, { iat: now, aud: 'credential-provider', nonce: newNonce(), parentPresentation: openPaymentPresentation });
    step('2.2', 'Shopping Agent', 'Signs closed mandate.checkout.1 and mandate.payment.1 as key-binding JWTs with agent_sk; checkout_jwt hash links them; sd_hash binds each to its open parent.', 'flows.md Phase 2 step 2');
    checkoutChain = { open: openCheckoutPresentation, closed: present(closedCheckoutIssued, closedCheckoutIssued.disclosures) };
    paymentChain = { open: openPaymentPresentation, closed: present(closedPaymentIssued, closedPaymentIssued.disclosures) };
    open = { checkout: openCheckoutIssued, payment: openPaymentIssued, checkoutPresentation: openCheckoutPresentation, paymentPresentation: openPaymentPresentation, openCheckoutDigest };
  } else {
    step('2.1', 'Shopping Agent to Trusted Surface', 'Builds closed Checkout and Payment Mandate Content and asks for approval.', 'flows.md Human Present, Phase 2 step 1');
    step('2.2', 'Trusted Surface and User', 'Shows the content; the user authenticates and consents.', 'flows.md Phase 2 step 2');
    closedCheckoutIssued = await issueUserSigned(concealedCheckout.content, concealedCheckout.disclosures, keys.user, { iat });
    closedCheckoutIssued.content = closedCheckout as unknown as Record<string, unknown>;
    closedPaymentIssued = await issueUserSigned(closedPayment as unknown as Record<string, unknown>, [], keys.user, { iat });
    step('2.3', 'Trusted Surface', 'Signs closed mandate.checkout.1 and mandate.payment.1 with user_sk; the checkout_jwt hash links them.', 'flows.md Phase 2 step 3');
    step('2.4', 'Trusted Surface to Shopping Agent', 'Returns the mandates.', 'flows.md Phase 2 step 4');
    checkoutChain = { closed: present(closedCheckoutIssued, closedCheckoutIssued.disclosures) };
    paymentChain = { closed: present(closedPaymentIssued, closedPaymentIssued.disclosures) };
  }

  // ---- Outsider tampering on the wire
  if (tamper === 'outsider_edit_amount') {
    paymentChain = { ...paymentChain, closed: editDisclosure(paymentChain.closed, isMandateContent(closedPayment.vct), (v) => ({ ...(v as object), payment_amount: { amount: 1, currency: checkout.currency } })) };
  }
  if (tamper === 'outsider_edit_open_constraint' && paymentChain.open) {
    paymentChain = {
      ...paymentChain,
      open: editDisclosure(paymentChain.open, isMandateContent(VCT.paymentOpen), (v) => {
        const m = v as { constraints: AnyConstraint[] };
        return { ...m, constraints: m.constraints.map((c) => (c.type === 'payment.amount_range' ? { ...c, max: 9999999 } : c)) };
      }),
    };
  }

  const currentCheckoutJwt = tamper === 'merchant_cart_changed' && pricier ? pricier.jwt : checkoutJwt;
  const history = { spentMinor: cfg.budget.spentMinor, occurrences: cfg.recurrence.occurrences, lastPresentedAt: cfg.recurrence.lastPresentedAt };
  const base = { trustedSignerJwk: keys.user.publicJwk, now };

  // ---- Credential Provider verifies the Payment Mandate
  const cp = await verifyPaymentChain(paymentChain, { ...base, role: 'credential_provider', supportsMandates: true, history, budgetUnit: cfg.budgetUnit });
  step(hnp ? '2.3' : '2.5', 'Shopping Agent to Credential Provider', cp.error ? `Credential Provider rejects the Payment Mandate: ${cp.error}.` : 'Credential Provider verifies the Payment Mandate and returns a payment token scoped to it.', hnp ? 'flows.md Phase 2 step 3' : 'flows.md Phase 2 step 5', cp.error ? 'failed' : 'done');

  const paymentReference = await receiptReferenceOf(paymentChain.closed);
  const checkoutReference = await receiptReferenceOf(checkoutChain.closed);
  const results: V02Run['results'] = { credentialProvider: cp };
  let checkoutReceipt: SignedReceipt<CheckoutReceipt> | undefined;
  let paymentReceipt: SignedReceipt<PaymentReceipt>;
  let outcome: V02Run['outcome'];

  if (cp.error) {
    paymentReceipt = await signReceipt<PaymentReceipt>(
      { status: 'Error', iss: ISSUERS.credentialProvider, iat: now, reference: paymentReference, payment_id: `pay_${randomB64url(6)}`, error: cp.error, error_description: cp.errorDescription ?? 'Verification failed' },
      keys.processor,
    );
    outcome = { ok: false, code: cp.error, stoppedAt: 'Credential Provider' };
    for (const s of hnp ? ['2.4', '2.5', '2.6', '2.7'] : ['2.6', '2.7', '2.8', '2.9']) step(s, '', 'Not reached.', '', 'skipped');
  } else {
    // ---- Merchant verifies the Checkout Mandate
    const merchantResult = await verifyCheckoutChain(checkoutChain, { ...base, supportsMandates: tamper !== 'merchant_no_mandates', merchantJwk: keys.merchant.publicJwk, currentCheckoutJwt });
    results.merchant = merchantResult;
    step(hnp ? '2.4' : '2.6', 'Shopping Agent to Merchant', 'Sends the payment token and the Checkout Mandate.', hnp ? 'flows.md Phase 2 step 4' : 'flows.md Phase 2 step 6');
    step(hnp ? '2.5' : '2.7', 'Merchant', merchantResult.error ? `Merchant rejects the Checkout Mandate: ${merchantResult.error}.` : 'Merchant verifies the Checkout Mandate against the current cart and checkout_hash, then initiates payment.', hnp ? 'flows.md Phase 2 step 5' : 'flows.md Phase 2 step 7', merchantResult.error ? 'failed' : 'done');
    if (merchantResult.error) {
      checkoutReceipt = await signReceipt<CheckoutReceipt>(
        { status: 'Error', iss: merchant.website ?? merchant.id, iat: now, reference: checkoutReference, error: merchantResult.error, error_description: merchantResult.errorDescription ?? 'Verification failed' },
        keys.merchant,
      );
      paymentReceipt = await signReceipt<PaymentReceipt>(
        { status: 'Error', iss: ISSUERS.merchantPaymentProcessor, iat: now, reference: paymentReference, payment_id: `pay_${randomB64url(6)}`, error: merchantResult.error, error_description: 'Checkout was not completed' },
        keys.processor,
      );
      outcome = { ok: false, code: merchantResult.error, stoppedAt: 'Merchant' };
      for (const s of hnp ? ['2.6', '2.7'] : ['2.8', '2.9']) step(s, '', 'Not reached.', '', 'skipped');
    } else {
      // ---- Merchant Payment Processor
      const processor = await verifyPaymentChain(paymentChain, {
        ...base,
        role: 'merchant_payment_processor',
        supportsMandates: true,
        history,
        budgetUnit: cfg.budgetUnit,
        checkoutHash,
        openCheckoutDigest: hnp ? openCheckoutDigest : undefined,
        chargeAmount: amount,
      });
      results.processor = processor;
      step(hnp ? '2.6' : '2.8', 'Merchant Payment Processor', processor.error ? `Processor rejects the payment: ${processor.error}.` : 'Verifies the Payment Mandate in the token and its binding to the checkout_jwt hash.', hnp ? 'flows.md Phase 2 step 6' : 'flows.md Phase 2 step 8', processor.error ? 'failed' : 'done');
      const ok = !processor.error;
      paymentReceipt = await signReceipt<PaymentReceipt>(
        ok
          ? { status: 'Success', iss: ISSUERS.merchantPaymentProcessor, iat: now, reference: paymentReference, payment_id: `pay_${randomB64url(6)}`, psp_confirmation_id: `psp_${randomB64url(6)}`, network_confirmation_id: `net_${randomB64url(6)}` }
          : { status: 'Error', iss: ISSUERS.merchantPaymentProcessor, iat: now, reference: paymentReference, payment_id: `pay_${randomB64url(6)}`, error: processor.error ?? 'invalid_mandate', error_description: processor.errorDescription ?? 'Verification failed' },
        keys.processor,
      );
      checkoutReceipt = await signReceipt<CheckoutReceipt>(
        ok
          ? { status: 'Success', iss: merchant.website ?? merchant.id, iat: now, reference: checkoutReference, order_id: `order_${randomB64url(6)}` }
          : { status: 'Error', iss: merchant.website ?? merchant.id, iat: now, reference: checkoutReference, error: processor.error ?? 'invalid_mandate', error_description: 'Payment was not completed' },
        keys.merchant,
      );
      step(hnp ? '2.7' : '2.9', 'Processor and Merchant to Shopping Agent', ok ? 'Signed Payment Receipt and Checkout Receipt with status Success.' : 'Signed receipts with status Error.', hnp ? 'flows.md Phase 2 step 7' : 'flows.md Phase 2 step 9', ok ? 'done' : 'failed');
      outcome = ok ? { ok: true, code: null } : { ok: false, code: processor.error, stoppedAt: 'Merchant Payment Processor' };
    }
  }

  return {
    config: cfg,
    checkout,
    checkoutJwt,
    checkoutHash,
    open,
    closed: { checkout: closedCheckoutIssued, payment: closedPaymentIssued, checkoutPresentation: checkoutChain.closed, paymentPresentation: paymentChain.closed },
    checkoutChain,
    paymentChain,
    results,
    receipts: { checkout: checkoutReceipt, payment: paymentReceipt },
    steps,
    outcome,
  };
}

// ------------------------------------------------------------------ dispute view

export interface DisputeCheck {
  label: string;
  ok: boolean;
  detail: string;
}

/** The "Verification: Dispute" hash checks from specification.md, recomputed from the run's artifacts. */
export async function disputeChecks(run: V02Run): Promise<DisputeCheck[]> {
  const out: DisputeCheck[] = [];
  const closedCheckout = run.results.merchant?.closedContent;
  const jwt = typeof closedCheckout?.checkout_jwt === 'string' ? closedCheckout.checkout_jwt : undefined;
  if (jwt) {
    const h = await checkoutHashOf(jwt);
    out.push({ label: 'Recomputed checkout_jwt hash equals checkout_hash', ok: h === closedCheckout?.checkout_hash, detail: h });
  }
  if (run.receipts.checkout) {
    const ref = await receiptReferenceOf(run.checkoutChain.closed);
    out.push({ label: 'Checkout Receipt reference equals hash of the closed Checkout Mandate', ok: ref === run.receipts.checkout.receipt.reference, detail: ref });
  }
  const pref = await receiptReferenceOf(run.paymentChain.closed);
  out.push({ label: 'Payment Receipt reference equals hash of the closed Payment Mandate', ok: pref === run.receipts.payment.receipt.reference, detail: pref });
  const closedPayment = run.results.processor?.closedContent ?? run.results.credentialProvider.closedContent;
  if (closedPayment && closedCheckout) {
    out.push({ label: 'Payment Mandate transaction_id equals checkout_hash', ok: closedPayment.transaction_id === closedCheckout.checkout_hash, detail: String(closedPayment.transaction_id) });
  }
  return out;
}

/** Decode a compact JWS for display without verifying it. */
export function peekJwt(jwt: string): { header: unknown; payload: unknown } | null {
  try {
    const d = decodeJws(jwt);
    return { header: d.header, payload: d.payload };
  } catch {
    return null;
  }
}

/** Decode every part of a serialized SD-JWT for display. */
export function explainSdJwt(serialized: string): { jwt: { header: unknown; payload: unknown } | null; disclosures: { encoded: string; decoded: unknown }[] } {
  const { jwt, disclosures } = parseSdJwt(serialized);
  return {
    jwt: peekJwt(jwt),
    disclosures: disclosures.map((encoded) => {
      try {
        return { encoded, decoded: b64urlDecodeJson(encoded) };
      } catch {
        return { encoded, decoded: '(not decodable)' };
      }
    }),
  };
}

// ------------------------------------------------------------------ live constraint preview

export interface ConstraintPreview {
  checkout: Checkout;
  amount: number;
  checkoutResults: ConstraintResult[];
  paymentResults: ConstraintResult[];
}

/**
 * Evaluate the open-mandate constraints against the current cart without signing anything, with every
 * element revealed. `payment.reference` needs the signed open Checkout Mandate, so it is checked in the run.
 */
export function previewConstraints(cfg: V02Config): ConstraintPreview {
  const merchant = merchantById(cfg.merchantId) ?? merchantById('merchant_trailhead')!;
  const instrument = INSTRUMENTS.find((i) => i.id === cfg.instrumentId) ?? INSTRUMENTS[0]!;
  const checkout = buildCheckout(merchant, cfg.lines, 'preview');
  const amount = checkoutTotal(checkout);
  const checkoutResults = evaluateCheckoutConstraints(buildCheckoutConstraints(cfg), checkout);
  const pending = 'pending-signature';
  const mandate = { vct: VCT.payment, transaction_id: pending, payee: merchant, payment_amount: { amount, currency: checkout.currency }, payment_instrument: instrument };
  const paymentResults = evaluatePaymentConstraints(buildPaymentConstraints(cfg, pending), mandate, {
    now: cfg.now,
    history: { spentMinor: cfg.budget.spentMinor, occurrences: cfg.recurrence.occurrences, lastPresentedAt: cfg.recurrence.lastPresentedAt },
    budgetUnit: cfg.budgetUnit,
    openCheckoutDigest: pending,
  }).map((r) => (r.type === 'payment.reference' ? { ...r, detail: 'Checked in the signed run: it needs the digest of the signed open Checkout Mandate.' } : r));
  return { checkout, amount, checkoutResults, paymentResults };
}
