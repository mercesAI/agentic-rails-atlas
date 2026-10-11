import { describe, expect, it, beforeAll } from 'vitest';
import {
  b64urlDecode,
  b64urlDecodeJson,
  b64urlEncode,
  b64urlEncodeJson,
  canonicalJson,
  ellipsize,
  fromUtf8,
  jsonEqual,
  pretty,
  randomB64url,
  sha256B64url,
  utf8,
} from '@/playgrounds/ap2/lib/encoding';
import { decodeJws, generateEs256Key, importEs256PublicJwk, sameJwk, signJws, verifyJws } from '@/playgrounds/ap2/lib/jws';
import {
  concealArray,
  concealProperty,
  decodeDisclosure,
  makeArrayDisclosure,
  makePropertyDisclosure,
  parseSdJwt,
  resolveDisclosures,
  serializeSdJwt,
} from '@/playgrounds/ap2/lib/sdjwt';
import { buildCheckout, checkoutTotal, formatMinor, itemFor, merchantById, MERCHANTS } from '@/playgrounds/ap2/lib/fixtures';
import {
  constraintOutcome,
  evaluateCheckoutConstraint,
  evaluateCheckoutConstraints,
  evaluateLineItems,
  evaluatePaymentConstraint,
  evaluatePaymentConstraints,
  isKnownConstraintType,
  maxFlow,
  nextAllowedAt,
  type PaymentEvalOptions,
} from '@/playgrounds/ap2/lib/constraints';
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
} from '@/playgrounds/ap2/lib/mandates';
import { unpackMandate, verifyCheckoutChain, verifyPaymentChain } from '@/playgrounds/ap2/lib/verify';
import {
  buildCheckoutConstraints,
  buildPaymentConstraints,
  defaultConfig,
  disputeChecks,
  explainSdJwt,
  generateKeys,
  peekJwt,
  previewConstraints,
  runV02,
  TAMPERS,
  UNKNOWN_CONSTRAINT,
  type Keys,
  type TamperId,
} from '@/playgrounds/ap2/lib/flow';
import {
  buildCartContents,
  buildIntentMandate,
  buildPaymentMandateContents,
  cartHashOf,
  runV01,
  signCartMandate,
  signPaymentMandate,
  transactionDataOf,
  verifyV01,
  V01_TAMPERS,
  type V01Config,
} from '@/playgrounds/ap2/lib/v01';
import { ERROR_CODES, PAYMENT_CONSTRAINT_TYPES, VCT, type PaymentMandate } from '@/playgrounds/ap2/lib/types';

const NOW = Math.floor(Date.parse('2026-10-11T12:00:00Z') / 1000);
const trailhead = merchantById('merchant_trailhead')!;
const lumen = merchantById('merchant_lumen')!;

let keys: Keys;
beforeAll(async () => {
  keys = await generateKeys();
});

describe('spec identifiers', () => {
  it('uses the exact vct const values and error codes', () => {
    expect(VCT).toEqual({ checkout: 'mandate.checkout.1', checkoutOpen: 'mandate.checkout.open.1', payment: 'mandate.payment.1', paymentOpen: 'mandate.payment.open.1' });
    expect([...ERROR_CODES]).toEqual(['invalid_credential', 'unresolved_constraint', 'invalid_mandate', 'mandates_not_supported']);
    expect(PAYMENT_CONSTRAINT_TYPES).toContain('payment.amount_range');
    expect(isKnownConstraintType('checkout.allowed_merchants')).toBe(true);
    expect(isKnownConstraintType('mandate.payment.amount_range')).toBe(false);
  });
});

describe('encoding', () => {
  it('round-trips base64url without padding', () => {
    const bytes = new Uint8Array([251, 255, 0, 1, 2]);
    const enc = b64urlEncode(bytes);
    expect(enc).not.toMatch(/[+/=]/);
    expect([...b64urlDecode(enc)]).toEqual([...bytes]);
    expect(b64urlDecodeJson(b64urlEncodeJson({ a: 1 }))).toEqual({ a: 1 });
    expect(fromUtf8(utf8('é'))).toBe('é');
    expect(() => b64urlDecode('a+b')).toThrow();
  });
  it('canonicalizes, compares and formats JSON', () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
    expect(jsonEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(pretty({ a: 1 })).toContain('\n');
    expect(ellipsize('x'.repeat(100), 4)).toBe('xxxx...xxxx');
    expect(ellipsize('short')).toBe('short');
  });
  it('hashes with SHA-256 and makes random salts', async () => {
    expect(await sha256B64url('abc')).toBe('ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0');
    expect(randomB64url(16)).toHaveLength(22);
    expect(randomB64url()).not.toBe(randomB64url());
  });
});

describe('ES256 JWS', () => {
  it('signs and verifies, and rejects tampering or the wrong key', async () => {
    const k = await generateEs256Key('test');
    const other = await generateEs256Key('other');
    expect(k.publicJwk).toMatchObject({ kty: 'EC', crv: 'P-256' });
    expect(k.publicJwk.x).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const jws = await signJws({ alg: 'ES256', typ: 'JWT' }, { hello: 'world' }, k.privateKey);
    expect(await verifyJws(jws, k.publicKey)).toBe(true);
    expect(await verifyJws(jws, await importEs256PublicJwk(k.publicJwk))).toBe(true);
    expect(await verifyJws(jws, other.publicKey)).toBe(false);
    const [h, , s] = jws.split('.');
    const forged = `${h}.${b64urlEncodeJson({ hello: 'mars' })}.${s}`;
    expect(await verifyJws(forged, k.publicKey)).toBe(false);
    expect(await verifyJws('not.a.jws', k.publicKey)).toBe(false);
    expect(decodeJws(jws).payload).toEqual({ hello: 'world' });
    expect(sameJwk(k.publicJwk, { ...k.publicJwk })).toBe(true);
    expect(sameJwk(k.publicJwk, other.publicJwk)).toBe(false);
    expect(sameJwk(undefined, k.publicJwk)).toBe(false);
  });
  it('produces randomized ECDSA signatures (the spec rejects deterministic schemes for the Checkout JWT)', async () => {
    const a = await signJws({ alg: 'ES256' }, { x: 1 }, keys.merchant.privateKey);
    const b = await signJws({ alg: 'ES256' }, { x: 1 }, keys.merchant.privateKey);
    expect(a).not.toBe(b);
  });
});

describe('SD-JWT core', () => {
  it('builds array and property disclosures with digests over the encoded string', async () => {
    const d = await makeArrayDisclosure({ id: 'm1' }, 'salt');
    expect(decodeDisclosure(d.encoded)).toEqual({ salt: 'salt', value: { id: 'm1' } });
    expect(d.digest).toBe(await sha256B64url(d.encoded));
    const p = await makePropertyDisclosure('checkout_jwt', 'abc', 'salt2');
    expect(decodeDisclosure(p.encoded)).toEqual({ salt: 'salt2', name: 'checkout_jwt', value: 'abc' });
    expect(() => decodeDisclosure(b64urlEncodeJson(['only-one']))).toThrow();
  });
  it('conceals, serializes, parses and resolves', async () => {
    const arr = await concealArray([{ id: 'a' }, { id: 'b' }]);
    const prop = await concealProperty({ vct: 'x', secret: 's' }, 'secret');
    expect(prop.object).toEqual({ _sd: [prop.disclosure.digest], vct: 'x' });
    const payload = { list: arr.placeholders, obj: prop.object, _sd_alg: 'sha-256' };
    const ser = serializeSdJwt('h.p.s', [arr.disclosures[0]!.encoded, prop.disclosure.encoded]);
    expect(ser.endsWith('~')).toBe(true);
    const parsed = parseSdJwt(ser);
    expect(parsed.jwt).toBe('h.p.s');
    expect(parsed.disclosures).toHaveLength(2);
    const r = await resolveDisclosures(payload, parsed.disclosures);
    expect(r.value).toEqual({ list: [{ id: 'a' }], obj: { vct: 'x', secret: 's' } });
    expect(r.undisclosed).toEqual([arr.disclosures[1]!.digest]);
    expect(r.unreferenced).toEqual([]);
    const bad = await resolveDisclosures(payload, [b64urlEncodeJson(['z', { id: 'evil' }]), 'not base64!']);
    expect(bad.unreferenced).toHaveLength(1);
    expect(bad.malformed).toHaveLength(1);
  });
});

describe('fixtures', () => {
  it('builds a checkout with integer minor-unit totals', () => {
    const c = buildCheckout(trailhead, [{ sku: 'sku_trail_shoe_red_9', quantity: 2 }, { sku: 'missing', quantity: 1 }], 'chk_1');
    expect(c.line_items).toHaveLength(1);
    expect(checkoutTotal(c)).toBe(25800);
    expect(itemFor('merchant_trailhead', 'sku_wool_socks')?.price).toBe(1800);
    expect(MERCHANTS.every((m) => m.website?.endsWith('.example'))).toBe(true);
    expect(formatMinor(12900)).toBe('USD 129.00');
    expect(formatMinor(-5)).toBe('USD -0.05');
    expect(formatMinor(Number.NaN)).toBe('USD ?');
  });
});

describe('constraint evaluator', () => {
  const checkout = buildCheckout(trailhead, [{ sku: 'sku_trail_shoe_red_9', quantity: 1 }, { sku: 'sku_wool_socks', quantity: 1 }], 'c');
  const shoesAndSocks = {
    type: 'checkout.line_items' as const,
    items: [
      { id: 'shoes', acceptable_items: [{ id: 'sku_trail_shoe_red_9', title: 'Red' }, { id: 'sku_trail_shoe_blue_9', title: 'Blue' }], quantity: 1 },
      { id: 'socks', acceptable_items: [{ id: 'sku_wool_socks', title: 'Socks' }], quantity: 1 },
    ],
  };
  it('computes max flow', () => {
    expect(maxFlow([[0, 2, 0], [0, 0, 1], [0, 0, 0]], 0, 2)).toBe(1);
  });
  it('matches line items as in the checkout_mandate.md example', () => {
    expect(evaluateLineItems(shoesAndSocks, checkout).ok).toBe(true);
    const twoShoes = buildCheckout(trailhead, [{ sku: 'sku_trail_shoe_red_9', quantity: 1 }, { sku: 'sku_trail_shoe_blue_9', quantity: 1 }], 'c2');
    expect(evaluateLineItems(shoesAndSocks, twoShoes).ok).toBe(false);
    const onlySocks = buildCheckout(trailhead, [{ sku: 'sku_wool_socks', quantity: 1 }], 'c3');
    expect(evaluateLineItems(shoesAndSocks, onlySocks).ok).toBe(false);
    const placeholderOnly = { type: 'checkout.line_items' as const, items: [{ id: 'x', acceptable_items: [{ '...': 'digest' }], quantity: 1 }] };
    expect(evaluateLineItems(placeholderOnly, onlySocks).ok).toBe(false);
  });
  it('evaluates allowed_merchants on revealed elements only', () => {
    expect(evaluateCheckoutConstraint({ type: 'checkout.allowed_merchants', allowed: [trailhead] }, checkout).ok).toBe(true);
    const lumenCheckout = buildCheckout(lumen, [{ sku: 'sku_headphones', quantity: 1 }], 'l');
    expect(evaluateCheckoutConstraint({ type: 'checkout.allowed_merchants', allowed: [trailhead] }, lumenCheckout).ok).toBe(false);
    const none = evaluateCheckoutConstraint({ type: 'checkout.allowed_merchants', allowed: [{ '...': 'hidden' }] }, checkout);
    expect(none.ok).toBe(false);
    expect(none.detail).toMatch(/no revealed elements/);
    expect(evaluateCheckoutConstraints([shoesAndSocks, { type: 'checkout.allowed_merchants', allowed: [trailhead] }], checkout).every((r) => r.ok)).toBe(true);
  });
  it('fails any unknown constraint, as the spec requires', () => {
    const r = evaluateCheckoutConstraint(UNKNOWN_CONSTRAINT, checkout);
    expect(r).toMatchObject({ ok: false, known: false });
    expect(constraintOutcome([r])).toBe('unresolved_constraint');
    expect(constraintOutcome([])).toBeNull();
  });

  const mandate: PaymentMandate = {
    vct: VCT.payment,
    transaction_id: 't',
    payee: trailhead,
    payment_amount: { amount: 12900, currency: 'USD' },
    payment_instrument: { id: 'pi_fixture_card_0000', type: 'card' },
  };
  const opts: PaymentEvalOptions = { now: NOW, history: { spentMinor: 0, occurrences: 0 }, budgetUnit: 'minor', openCheckoutDigest: 'digest' };

  it('checks payment.amount_range in integer minor units and flags the decimal example', () => {
    expect(evaluatePaymentConstraint({ type: 'payment.amount_range', currency: 'USD', max: 15000, min: 0 }, mandate, opts).ok).toBe(true);
    expect(evaluatePaymentConstraint({ type: 'payment.amount_range', currency: 'USD', max: 10000 }, mandate, opts).ok).toBe(false);
    expect(evaluatePaymentConstraint({ type: 'payment.amount_range', currency: 'EUR', max: 15000 }, mandate, opts).ok).toBe(false);
    const doc = evaluatePaymentConstraint({ type: 'payment.amount_range', currency: 'USD', max: 100.5, min: 10 }, mandate, opts);
    expect(doc.ok).toBe(false);
    expect(doc.quirk).toMatch(/100\.50/);
  });
  it('shows both readings of the unit-less payment.budget max', () => {
    const c = { type: 'payment.budget', max: 1000, currency: 'USD' } as const;
    const minor = evaluatePaymentConstraint(c, mandate, opts);
    const major = evaluatePaymentConstraint(c, mandate, { ...opts, budgetUnit: 'major' });
    expect(minor.ok).toBe(false);
    expect(major.ok).toBe(true);
    expect(minor.quirk).toMatch(/minor units the result is fail; read as major units it is pass/);
    expect(evaluatePaymentConstraint(c, mandate, { ...opts, budgetUnit: 'major', history: { spentMinor: 90000, occurrences: 0 } }).ok).toBe(false);
  });
  it('checks payees, instruments, PISPs, execution date and reference', () => {
    expect(evaluatePaymentConstraint({ type: 'payment.allowed_payees', allowed: [trailhead] }, mandate, opts).ok).toBe(true);
    expect(evaluatePaymentConstraint({ type: 'payment.allowed_payees', allowed: [lumen] }, mandate, opts).ok).toBe(false);
    expect(evaluatePaymentConstraint({ type: 'payment.allowed_payment_instruments', allowed: [{ id: 'pi_fixture_card_0000', type: 'card' }] }, mandate, opts).ok).toBe(true);
    expect(evaluatePaymentConstraint({ type: 'payment.allowed_payment_instruments', allowed: [{ id: 'pi_fixture_card_0000', type: 'UPI' }] }, mandate, opts).ok).toBe(false);
    const pisp = { legal_name: 'L', brand_name: 'B', domain_name: 'd.example' };
    expect(evaluatePaymentConstraint({ type: 'payment.allowed_pisps', allowed: [pisp] }, mandate, opts).ok).toBe(false);
    expect(evaluatePaymentConstraint({ type: 'payment.allowed_pisps', allowed: [pisp] }, { ...mandate, pisp }, opts).ok).toBe(true);
    expect(evaluatePaymentConstraint({ type: 'payment.execution_date', not_before: '2026-10-01T00:00:00Z', not_after: '2026-10-31T23:59:59Z' }, mandate, opts).ok).toBe(true);
    expect(evaluatePaymentConstraint({ type: 'payment.execution_date', not_after: '2026-10-01T00:00:00Z' }, mandate, opts).ok).toBe(false);
    expect(evaluatePaymentConstraint({ type: 'payment.reference', conditional_transaction_id: 'digest' }, mandate, opts).ok).toBe(true);
    expect(evaluatePaymentConstraint({ type: 'payment.reference', conditional_transaction_id: 'other' }, mandate, opts).ok).toBe(false);
    expect(evaluatePaymentConstraint({ type: 'payment.reference', conditional_transaction_id: 'digest' }, mandate, { ...opts, openCheckoutDigest: undefined }).ok).toBe(false);
  });
  it('tracks payment.agent_recurrence count and spacing', () => {
    const c = { type: 'payment.agent_recurrence', frequency: 'MONTHLY', max_occurrences: 2 } as const;
    expect(evaluatePaymentConstraint(c, mandate, opts).ok).toBe(true);
    expect(evaluatePaymentConstraint(c, mandate, { ...opts, history: { spentMinor: 0, occurrences: 2 } }).ok).toBe(false);
    expect(evaluatePaymentConstraint(c, mandate, { ...opts, history: { spentMinor: 0, occurrences: 1, lastPresentedAt: NOW - 86400 } }).ok).toBe(false);
    expect(evaluatePaymentConstraint(c, mandate, { ...opts, history: { spentMinor: 0, occurrences: 1, lastPresentedAt: NOW - 40 * 86400 } }).ok).toBe(true);
    expect(nextAllowedAt(0, 'DAILY')).toBe(86400);
    expect(nextAllowedAt(0, 'ON_DEMAND')).toBe(0);
    expect(new Date(nextAllowedAt(0, 'QUARTERLY') * 1000).toISOString()).toBe('1970-04-01T00:00:00.000Z');
    expect(evaluatePaymentConstraints([c, UNKNOWN_CONSTRAINT], mandate, opts).map((r) => r.ok)).toEqual([true, false]);
  });
});

describe('mandate builders and signers', () => {
  it('builds open and closed contents with the schema vct values and cnf', () => {
    const oc = openCheckoutContent([], keys.agent, 1, 2);
    expect(oc).toMatchObject({ vct: 'mandate.checkout.open.1', cnf: { jwk: keys.agent.publicJwk } });
    expect(openPaymentContent([], keys.agent, 1, 2).vct).toBe('mandate.payment.open.1');
    expect(closedCheckoutContent('j', 'h', 1, 2).vct).toBe('mandate.checkout.1');
    expect(closedPaymentContent({ transaction_id: 't', payee: trailhead, payment_amount: { amount: 1, currency: 'USD' }, payment_instrument: { id: 'i', type: 'card' } }, 1, 2).vct).toBe('mandate.payment.1');
    expect(newNonce()).toHaveLength(22);
  });
  it('conceals SD arrays and the checkout_jwt property', async () => {
    const { constraints, disclosures } = await concealConstraints([
      { type: 'checkout.allowed_merchants', allowed: [trailhead, lumen] },
      { type: 'checkout.line_items', items: [{ id: 'l', acceptable_items: [{ id: 'a', title: 'A' }], quantity: 1 }] },
      { type: 'payment.amount_range', currency: 'USD', max: 1 },
    ]);
    expect(disclosures.map((d) => d.tag)).toEqual(['merchant', 'merchant', 'item']);
    expect(JSON.stringify(constraints)).not.toContain('Trailhead');
    const cj = await concealCheckoutJwt(closedCheckoutContent('jwt-value', 'h', 1, 2));
    expect(cj.content).not.toHaveProperty('checkout_jwt');
    expect(cj.disclosures[0]?.tag).toBe('checkout_jwt');
  });
  it('signs a checkout and binds hashes, digests and sd_hash', async () => {
    const checkout = buildCheckout(trailhead, [{ sku: 'sku_wool_socks', quantity: 1 }], 'c');
    const jwt = await signCheckout(checkout, keys.merchant);
    expect(await verifyJws(jwt, keys.merchant.publicKey)).toBe(true);
    expect(await checkoutHashOf(jwt)).toBe(await sha256B64url(jwt));
    const open = await issueUserSigned(openCheckoutContent([], keys.agent, 1, 2) as never, [], keys.user, { iat: 1 });
    expect(decodeJws(open.jwt).header).toMatchObject({ alg: 'ES256', typ: 'example+sd-jwt' });
    expect(await openCheckoutDigestOf(open.jwt)).toBe(await sha256B64url(open.jwt));
    const openPres = present(open, open.disclosures);
    const closed = await closeWithKeyBinding({ vct: VCT.checkout }, [], keys.agent, { iat: 1, aud: 'merchant', nonce: 'n', parentPresentation: openPres });
    const kb = decodeJws(closed.jwt);
    expect(kb.header).toMatchObject({ typ: 'kb+sd-jwt' });
    expect(kb.payload).toMatchObject({ aud: 'merchant', nonce: 'n', sd_hash: await sha256B64url(openPres), _sd_alg: 'sha-256' });
    expect(await receiptReferenceOf('x~')).toBe(await sha256B64url('x~'));
    const unpacked = await unpackMandate(present(closed, closed.disclosures));
    expect(unpacked.content).toEqual({ vct: VCT.checkout });
  });
});

describe('verifiers', () => {
  it('reports mandates_not_supported when the verifier does not use mandates', async () => {
    const base = { trustedSignerJwk: keys.user.publicJwk, now: NOW, supportsMandates: false };
    const m = await verifyCheckoutChain({ closed: 'x~' }, { ...base, merchantJwk: keys.merchant.publicJwk, currentCheckoutJwt: '' });
    expect(m.error).toBe('mandates_not_supported');
    const p = await verifyPaymentChain({ closed: 'x~' }, { ...base, role: 'credential_provider', history: { spentMinor: 0, occurrences: 0 }, budgetUnit: 'minor' });
    expect(p.error).toBe('mandates_not_supported');
  });
});

describe('end-to-end v0.2 runs', () => {
  it('builds constraints with payment.reference and the unknown constraint when asked', () => {
    const cfg = { ...defaultConfig(NOW), unknownConstraint: true };
    expect(buildCheckoutConstraints(cfg).map((c) => c.type)).toEqual(['checkout.line_items', 'checkout.allowed_merchants']);
    const types = buildPaymentConstraints(cfg, 'd').map((c) => c.type);
    expect(types).toContain('payment.reference');
    expect(types).toContain('com.example.loyalty_tier');
  });

  it('previews constraints on the cart without signing', () => {
    const ok = previewConstraints(defaultConfig(NOW));
    expect(ok.amount).toBe(12900);
    expect([...ok.checkoutResults, ...ok.paymentResults].every((r) => r.ok)).toBe(true);
    const bad = previewConstraints({ ...defaultConfig(NOW), merchantId: 'merchant_lumen', lines: [{ sku: 'sku_trail_shoe_red_9', quantity: 1 }] });
    expect(bad.checkoutResults.find((r) => r.type === 'checkout.allowed_merchants')?.ok).toBe(false);
    expect(bad.paymentResults.find((r) => r.type === 'payment.allowed_payees')?.ok).toBe(false);
  });

  it('human not present happy path passes every check and returns Success receipts', async () => {
    const run = await runV02(defaultConfig(NOW), keys);
    expect(run.outcome).toEqual({ ok: true, code: null });
    expect(run.receipts.payment.receipt.status).toBe('Success');
    expect(run.receipts.payment.prose.result).toBe('success');
    expect(run.receipts.checkout?.receipt.order_id).toMatch(/^order_/);
    expect(run.results.credentialProvider.deferred[0]?.type).toBe('payment.reference');
    expect(run.results.processor?.constraints.find((c) => c.type === 'payment.reference')?.ok).toBe(true);
    expect((await disputeChecks(run)).every((c) => c.ok)).toBe(true);
    // Minimal disclosure reveals only the merchant actually used.
    const revealed = explainSdJwt(run.checkoutChain.open!).disclosures.map((d) => JSON.stringify(d.decoded));
    expect(revealed.some((d) => d.includes('merchant_harbor'))).toBe(false);
    expect(peekJwt(run.checkoutJwt)?.header).toMatchObject({ alg: 'ES256' });
    expect(peekJwt('nope')).toBeNull();
  });

  it('human present happy path uses user-signed closed mandates without cnf', async () => {
    const run = await runV02({ ...defaultConfig(NOW), mode: 'hp' }, keys);
    expect(run.outcome.ok).toBe(true);
    expect(run.open).toBeUndefined();
    expect(run.checkoutChain.open).toBeUndefined();
    expect(run.steps.map((s) => s.id)).toContain('1.4');
  });

  it('a cart over amount_range fails with unresolved_constraint at the Credential Provider', async () => {
    const run = await runV02({ ...defaultConfig(NOW), lines: [{ sku: 'sku_trail_shoe_red_9', quantity: 2 }], lineRequirements: [{ id: 'l', acceptableSkus: ['sku_trail_shoe_red_9'], quantity: 2 }] }, keys);
    expect(run.outcome).toMatchObject({ ok: false, code: 'unresolved_constraint', stoppedAt: 'Credential Provider' });
    expect(run.receipts.payment.receipt).toMatchObject({ status: 'Error', error: 'unresolved_constraint' });
  });

  it('a merchant outside allowed_merchants fails at the merchant', async () => {
    const cfg = { ...defaultConfig(NOW), merchantId: 'merchant_lumen', allowedPayeeIds: ['merchant_trailhead', 'merchant_harbor', 'merchant_lumen'] };
    const run = await runV02(cfg, keys);
    expect(run.outcome).toMatchObject({ code: 'unresolved_constraint', stoppedAt: 'Merchant' });
    expect(run.results.merchant?.constraints.find((c) => c.type === 'checkout.allowed_merchants')?.ok).toBe(false);
    expect(run.receipts.checkout?.receipt.status).toBe('Error');
  });

  it('an unknown constraint fails with unresolved_constraint', async () => {
    const run = await runV02({ ...defaultConfig(NOW), unknownConstraint: true }, keys);
    expect(run.outcome.code).toBe('unresolved_constraint');
    expect(run.results.credentialProvider.constraints.find((c) => !c.known)?.type).toBe('com.example.loyalty_tier');
  });

  const expectations: [TamperId, string, string, string][] = [
    ['outsider_edit_amount', 'invalid_credential', 'Credential Provider', 'closed-disclosures'],
    ['outsider_edit_open_constraint', 'invalid_credential', 'Credential Provider', 'open-disclosures'],
    ['agent_swaps_checkout_jwt', 'invalid_mandate', 'Merchant', 'checkout_hash'],
    ['agent_points_payment_elsewhere', 'invalid_mandate', 'Merchant Payment Processor', 'transaction_id'],
    ['other_agent_key', 'invalid_credential', 'Credential Provider', 'cnf'],
    ['wrong_parent_sd_hash', 'invalid_credential', 'Merchant', 'sd_hash'],
    ['expired', 'invalid_credential', 'Credential Provider', 'open-exp'],
    ['vct_without_suffix', 'invalid_mandate', 'Credential Provider', 'closed-vct'],
    ['merchant_cart_changed', 'invalid_mandate', 'Merchant', 'current-checkout'],
    ['merchant_no_mandates', 'mandates_not_supported', 'Merchant', 'support'],
  ];
  it.each(expectations)('tamper %s yields %s at %s and breaks %s', async (tamper, code, stoppedAt, checkId) => {
    const run = await runV02({ ...defaultConfig(NOW), tamper }, keys);
    expect(run.outcome).toMatchObject({ ok: false, code, stoppedAt });
    const result = stoppedAt === 'Credential Provider' ? run.results.credentialProvider : stoppedAt === 'Merchant' ? run.results.merchant : run.results.processor;
    expect(result?.checks.find((c) => c.id === checkId)?.ok).toBe(false);
  });

  it('payment.reference to another task fails at the processor; withholding merchant disclosures fails at the merchant', async () => {
    const a = await runV02({ ...defaultConfig(NOW), tamper: 'payment_reference_other_task' }, keys);
    expect(a.outcome).toMatchObject({ code: 'unresolved_constraint', stoppedAt: 'Merchant Payment Processor' });
    const b = await runV02({ ...defaultConfig(NOW), tamper: 'withhold_merchant_disclosure' }, keys);
    expect(b.outcome).toMatchObject({ code: 'unresolved_constraint', stoppedAt: 'Merchant' });
  });

  it('human present tampering breaks the user signature binding', async () => {
    const run = await runV02({ ...defaultConfig(NOW), mode: 'hp', tamper: 'outsider_edit_amount' }, keys);
    expect(run.outcome.code).toBe('invalid_credential');
    // HNP-only tampers are ignored in human present mode.
    const ignored = await runV02({ ...defaultConfig(NOW), mode: 'hp', tamper: 'other_agent_key' }, keys);
    expect(ignored.outcome.ok).toBe(true);
    expect(TAMPERS.find((t) => t.id === 'other_agent_key')?.modes).toEqual(['hnp']);
  });

  it('a preset instrument must stay unchanged in the closed mandate', async () => {
    const run = await runV02({ ...defaultConfig(NOW), presetInstrument: true }, keys);
    expect(run.outcome.ok).toBe(true);
    expect(run.results.credentialProvider.checks.find((c) => c.id === 'claims-unchanged')?.ok).toBe(true);
  });
});

describe('v0.1 model', () => {
  const instrument = { id: 'pi_fixture_card_0000', type: 'card' };
  const intentInput = {
    description: 'Red trail runners, size 9',
    merchants: ['Trailhead Outfitters'],
    skus: ['sku_trail_shoe_red_9'],
    requiresRefundability: true,
    userCartConfirmationRequired: false,
    expiry: '2026-10-12T12:00:00Z',
  };
  it('builds and verifies Intent, Cart and Payment mandates', async () => {
    const intent = buildIntentMandate(intentInput);
    expect(intent).toMatchObject({ natural_language_description: 'Red trail runners, size 9', intent_expiry: '2026-10-12T12:00:00Z' });
    const contents = buildCartContents(trailhead, [{ sku: 'sku_trail_shoe_red_9', quantity: 1 }], { id: 'c1', expiry: '2026-10-11T12:15:00Z', refundPeriodDays: 30, confirmationRequired: false, currency: 'USD' });
    expect(contents.payment_request.details.total.amount.value).toBe(129);
    const cart = await signCartMandate(contents, keys.merchant, trailhead, NOW);
    expect(decodeJws(cart.merchant_authorization!).payload).toMatchObject({ cart_hash: await cartHashOf(contents) });
    const pmc = buildPaymentMandateContents(cart, instrument, trailhead.name, '2026-10-11T12:00:00Z');
    const payment = await signPaymentMandate(cart, pmc, keys.user, NOW);
    expect(decodeJws(payment.user_authorization!).payload.transaction_data).toEqual(await transactionDataOf(cart, pmc));
    const v = await verifyV01(intent, cart, payment, { merchantJwk: keys.merchant.publicJwk, userJwk: keys.user.publicJwk, now: NOW, humanPresent: false, cartSkus: ['sku_trail_shoe_red_9'] });
    expect(v.ok).toBe(true);
  });
  const cfg = (tamper: V01Config['tamper']): V01Config => ({
    humanPresent: false,
    intent: intentInput,
    merchantId: 'merchant_trailhead',
    merchant: trailhead,
    lines: [{ sku: 'sku_trail_shoe_red_9', quantity: 1 }],
    instrument,
    currency: 'USD',
    tamper,
    now: NOW,
  });
  it.each(V01_TAMPERS.map((t) => t.id))('runV01 with %s', async (tamper) => {
    const run = await runV01(cfg(tamper), keys);
    expect(run.verify.ok).toBe(tamper === 'none');
    if (tamper === 'edit_cart_after_merchant') expect(run.verify.checks.find((c) => c.id === 'cart_hash')?.ok).toBe(false);
    if (tamper === 'edit_payment_after_user') expect(run.verify.checks.find((c) => c.id === 'td-payment')?.ok).toBe(false);
    if (tamper === 'expired_intent') expect(run.verify.intent.find((c) => c.id === 'intent_expiry')?.ok).toBe(false);
    if (tamper === 'merchant_outside_intent') expect(run.verify.intent.find((c) => c.id === 'merchants')?.ok).toBe(false);
  });
  it('human not present needs user_cart_confirmation_required false', async () => {
    const run = await runV01({ ...cfg('none'), intent: { ...intentInput, userCartConfirmationRequired: true } }, keys);
    expect(run.verify.ok).toBe(false);
    const present = await runV01({ ...cfg('none'), humanPresent: true, intent: { ...intentInput, userCartConfirmationRequired: true } }, keys);
    expect(present.verify.ok).toBe(true);
  });
});
