/**
 * AP2 v0.1 model (tag v0.1.0, `src/ap2/types/mandate.py`): IntentMandate, CartMandate with a
 * merchant-signed `merchant_authorization` JWT carrying `cart_hash`, and PaymentMandate with a
 * `user_authorization` that signs hashes of the CartMandate and PaymentMandateContents.
 *
 * Teaching simplifications (also labeled in the UI):
 * - v0.1 describes `user_authorization` as a verifiable presentation, for example an SD-JWT VC with a
 *   key-binding JWT whose `transaction_data` holds the two hashes. Here it is one ES256 JWT carrying
 *   `aud`, `nonce`, `iat` and `transaction_data`.
 * - v0.1 says `cart_hash` is computed over "the canonical JSON representation" without naming a
 *   scheme; here that is JSON with sorted keys.
 * - v0.1 defines no machine-checkable constraint language and no error codes; the intent checks
 *   below are this simulation's reading of the IntentMandate field descriptions.
 */
import { randomBase64Url, sha256Base64Url } from '@/lib/playground/bytes';
import { canonicalize } from '@/lib/playground/canonical-json';
import { decodeJws, importEs256PublicJwk, signJws, verifyJws, type EcJwk as Ap2Jwk, type Es256Key } from '@/lib/playground/es256';
import { CURRENCY_EXPONENT, itemFor, type CartLine } from './fixtures';
import type {
  CartContentsV01,
  CartMandateV01,
  IntentMandateV01,
  Merchant,
  PaymentInstrument,
  PaymentItemV01,
  PaymentMandateContentsV01,
  PaymentMandateV01,
} from './types';

export interface IntentInput {
  description: string;
  merchants: string[] | null;
  skus: string[] | null;
  requiresRefundability: boolean;
  userCartConfirmationRequired: boolean;
  expiry: string;
}

export function buildIntentMandate(i: IntentInput): IntentMandateV01 {
  return {
    user_cart_confirmation_required: i.userCartConfirmationRequired,
    natural_language_description: i.description,
    merchants: i.merchants,
    skus: i.skus,
    requires_refundability: i.requiresRefundability,
    intent_expiry: i.expiry,
  };
}

const toMajor = (minor: number) => Number((minor / 10 ** CURRENCY_EXPONENT).toFixed(CURRENCY_EXPONENT));

export function buildCartContents(merchant: Merchant, lines: CartLine[], opts: { id: string; expiry: string; refundPeriodDays: number; confirmationRequired: boolean; currency: string }): CartContentsV01 {
  const display: PaymentItemV01[] = [];
  let totalMinor = 0;
  for (const line of lines) {
    const item = itemFor(merchant.id, line.sku);
    if (!item || line.quantity <= 0) continue;
    const minor = item.price * line.quantity;
    totalMinor += minor;
    display.push({ label: line.quantity > 1 ? `${item.title} x${line.quantity}` : item.title, amount: { currency: opts.currency, value: toMajor(minor) }, refund_period: opts.refundPeriodDays });
  }
  return {
    id: opts.id,
    user_cart_confirmation_required: opts.confirmationRequired,
    payment_request: {
      method_data: [{ supported_methods: 'CARD', data: {} }],
      details: { id: `order_${opts.id}`, display_items: display, total: { label: 'Total', amount: { currency: opts.currency, value: toMajor(totalMinor) }, refund_period: opts.refundPeriodDays } },
    },
    cart_expiry: opts.expiry,
    merchant_name: merchant.name,
  };
}

export async function cartHashOf(contents: CartContentsV01): Promise<string> {
  return sha256Base64Url(canonicalize(contents));
}

/** Merchant signs the cart: a JWT with iss, sub, aud, iat, exp, jti and cart_hash. */
export async function signCartMandate(contents: CartContentsV01, merchantKey: Es256Key, merchant: Merchant, now: number): Promise<CartMandateV01> {
  const payload = { iss: merchant.website ?? merchant.id, sub: merchant.id, aud: 'payment-processor', iat: now, exp: now + 600, jti: randomBase64Url(8), cart_hash: await cartHashOf(contents) };
  return { contents, merchant_authorization: await signJws({ alg: 'ES256', typ: 'JWT', kid: 'merchant-key-1' }, payload, merchantKey.privateKey) };
}

export function buildPaymentMandateContents(cart: CartMandateV01, instrument: PaymentInstrument, merchantAgent: string, timestamp: string): PaymentMandateContentsV01 {
  return {
    payment_mandate_id: `pm_${randomBase64Url(6)}`,
    payment_details_id: cart.contents.payment_request.details.id,
    payment_details_total: cart.contents.payment_request.details.total,
    payment_response: { request_id: cart.contents.payment_request.details.id, method_name: 'CARD', details: { token: `tok_fixture_${instrument.id}` } },
    merchant_agent: merchantAgent,
    timestamp,
  };
}

export async function transactionDataOf(cart: CartMandateV01, contents: PaymentMandateContentsV01): Promise<[string, string]> {
  return [await sha256Base64Url(canonicalize(cart)), await sha256Base64Url(canonicalize(contents))];
}

/** User signs hashes of the CartMandate and PaymentMandateContents (teaching simplification, see file header). */
export async function signPaymentMandate(cart: CartMandateV01, contents: PaymentMandateContentsV01, userKey: Es256Key, now: number): Promise<PaymentMandateV01> {
  const payload = { aud: 'credentials-provider', nonce: randomBase64Url(12), iat: now, transaction_data: await transactionDataOf(cart, contents) };
  return { payment_mandate_contents: contents, user_authorization: await signJws({ alg: 'ES256', typ: 'JWT' }, payload, userKey.privateKey) };
}

export interface V01Check {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
}

export interface V01Verify {
  checks: V01Check[];
  intent: V01Check[];
  ok: boolean;
}

export interface V01VerifyContext {
  merchantJwk: Ap2Jwk;
  userJwk: Ap2Jwk;
  now: number;
  humanPresent: boolean;
  /** SKUs in the cart; v0.1 PaymentItem carries only a `label`, so the verifier would not see these. */
  cartSkus: string[];
}

async function sig(jwt: string | null | undefined, jwk: Ap2Jwk): Promise<boolean> {
  if (!jwt) return false;
  try {
    return await verifyJws(jwt, await importEs256PublicJwk(jwk));
  } catch {
    return false;
  }
}

export async function verifyV01(intent: IntentMandateV01, cart: CartMandateV01, payment: PaymentMandateV01, ctx: V01VerifyContext): Promise<V01Verify> {
  const checks: V01Check[] = [];
  const merchantSigOk = await sig(cart.merchant_authorization, ctx.merchantJwk);
  checks.push({ id: 'merchant-sig', label: 'Merchant signature on merchant_authorization', ok: merchantSigOk, detail: merchantSigOk ? 'ES256 verifies.' : 'Signature missing or invalid.' });
  let claimedCartHash: unknown;
  try {
    claimedCartHash = cart.merchant_authorization ? decodeJws(cart.merchant_authorization).payload.cart_hash : undefined;
  } catch {
    claimedCartHash = undefined;
  }
  const cartHash = await cartHashOf(cart.contents);
  checks.push({ id: 'cart_hash', label: 'cart_hash equals the hash of CartContents', ok: claimedCartHash === cartHash, detail: `Recomputed ${cartHash}; JWT says ${String(claimedCartHash)}.` });
  const cartExpiryOk = Date.parse(cart.contents.cart_expiry) > ctx.now * 1000;
  checks.push({ id: 'cart_expiry', label: 'Cart not expired (cart_expiry)', ok: cartExpiryOk, detail: cart.contents.cart_expiry });
  const userSigOk = await sig(payment.user_authorization, ctx.userJwk);
  checks.push({ id: 'user-sig', label: 'User signature on user_authorization', ok: userSigOk, detail: userSigOk ? 'ES256 verifies.' : 'Signature missing or invalid.' });
  let td: unknown;
  try {
    td = payment.user_authorization ? decodeJws(payment.user_authorization).payload.transaction_data : undefined;
  } catch {
    td = undefined;
  }
  const [cartMandateHash, contentsHash] = await transactionDataOf(cart, payment.payment_mandate_contents);
  const tdArr = Array.isArray(td) ? td : [];
  checks.push({ id: 'td-cart', label: 'transaction_data[0] equals the hash of CartMandate', ok: tdArr[0] === cartMandateHash, detail: `Recomputed ${cartMandateHash}.` });
  checks.push({ id: 'td-payment', label: 'transaction_data[1] equals the hash of PaymentMandateContents', ok: tdArr[1] === contentsHash, detail: `Recomputed ${contentsHash}.` });
  const totalsMatch = payment.payment_mandate_contents.payment_details_total.amount.value === cart.contents.payment_request.details.total.amount.value;
  checks.push({ id: 'total', label: 'payment_details_total equals the cart total', ok: totalsMatch, detail: `${payment.payment_mandate_contents.payment_details_total.amount.value} against ${cart.contents.payment_request.details.total.amount.value}.` });

  const ic: V01Check[] = [];
  const merchantOk = !intent.merchants || intent.merchants.length === 0 || intent.merchants.includes(cart.contents.merchant_name);
  ic.push({ id: 'merchants', label: 'Merchant is in merchants (or merchants is unset)', ok: merchantOk, detail: `${cart.contents.merchant_name}.` });
  const skusOk = !intent.skus || intent.skus.length === 0 || ctx.cartSkus.every((s) => intent.skus?.includes(s));
  ic.push({ id: 'skus', label: 'Every cart SKU is in skus (or skus is unset)', ok: skusOk, detail: 'v0.1 PaymentItem carries only a label, so a verifier holding only the CartMandate cannot see SKUs; the simulation reads them from the fixture cart.' });
  const refundOk = !intent.requires_refundability || cart.contents.payment_request.details.display_items.every((i) => i.refund_period > 0);
  ic.push({ id: 'refund', label: 'Items refundable when requires_refundability is true', ok: refundOk, detail: `refund_period ${cart.contents.payment_request.details.display_items.map((i) => i.refund_period).join(', ') || 'none'} days.` });
  const intentLive = Date.parse(intent.intent_expiry) > ctx.now * 1000;
  ic.push({ id: 'intent_expiry', label: 'Intent not expired (intent_expiry)', ok: intentLive, detail: intent.intent_expiry });
  const confirmOk = ctx.humanPresent || !intent.user_cart_confirmation_required;
  ic.push({
    id: 'confirmation',
    label: 'Human not present requires user_cart_confirmation_required false',
    ok: confirmOk,
    detail: ctx.humanPresent ? 'The user is present and confirms the cart.' : intent.user_cart_confirmation_required ? 'The intent still requires the user to confirm the cart, so the agent cannot buy alone.' : 'The user allowed the agent to buy once the conditions are met.',
  });

  const ok = checks.every((c) => c.ok) && (ctx.humanPresent ? true : ic.every((c) => c.ok));
  return { checks, intent: ic, ok };
}

export type V01Tamper = 'none' | 'edit_cart_after_merchant' | 'edit_payment_after_user' | 'expired_intent' | 'merchant_outside_intent';

export const V01_TAMPERS: { id: V01Tamper; label: string; expect: string }[] = [
  { id: 'none', label: 'No tampering', expect: 'Every hash and signature holds.' },
  { id: 'edit_cart_after_merchant', label: 'Lower a cart price after the merchant signed', expect: 'cart_hash no longer matches, and transaction_data[0] no longer matches.' },
  { id: 'edit_payment_after_user', label: 'Change payment_details_total after the user signed', expect: 'transaction_data[1] no longer matches and the totals disagree.' },
  { id: 'expired_intent', label: 'Use an intent past intent_expiry', expect: 'The intent check fails (human not present).' },
  { id: 'merchant_outside_intent', label: 'Buy from a merchant the intent does not list', expect: 'The merchants check fails (human not present).' },
];

export interface V01Config {
  humanPresent: boolean;
  intent: IntentInput;
  merchantId: string;
  lines: CartLine[];
  instrument: PaymentInstrument;
  merchant: Merchant;
  currency: string;
  tamper: V01Tamper;
  /** Unix epoch seconds. */
  now: number;
}

export interface V01Run {
  intent: IntentMandateV01;
  cart: CartMandateV01;
  payment: PaymentMandateV01;
  verify: V01Verify;
}

export async function runV01(cfg: V01Config, keys: { user: Es256Key; merchant: Es256Key }): Promise<V01Run> {
  const iso = (s: number) => new Date(s * 1000).toISOString();
  const intentInput: IntentInput = {
    ...cfg.intent,
    expiry: cfg.tamper === 'expired_intent' ? iso(cfg.now - 3600) : cfg.intent.expiry,
    merchants: cfg.tamper === 'merchant_outside_intent' ? ['A merchant the user named'] : cfg.intent.merchants,
  };
  const intent = buildIntentMandate(intentInput);
  const contents = buildCartContents(cfg.merchant, cfg.lines, {
    id: `cart_${randomBase64Url(6)}`,
    expiry: iso(cfg.now + 900),
    refundPeriodDays: 30,
    confirmationRequired: cfg.humanPresent,
    currency: cfg.currency,
  });
  let cart = await signCartMandate(contents, keys.merchant, cfg.merchant, cfg.now);
  const pmc = buildPaymentMandateContents(cart, cfg.instrument, cfg.merchant.name, iso(cfg.now));
  let payment = await signPaymentMandate(cart, pmc, keys.user, cfg.now);
  if (cfg.tamper === 'edit_cart_after_merchant') {
    const c = structuredClone(cart);
    c.contents.payment_request.details.total.amount.value = Number((c.contents.payment_request.details.total.amount.value / 2).toFixed(2));
    cart = c;
  }
  if (cfg.tamper === 'edit_payment_after_user') {
    const p = structuredClone(payment);
    p.payment_mandate_contents.payment_details_total.amount.value = Number((p.payment_mandate_contents.payment_details_total.amount.value + 100).toFixed(2));
    payment = p;
  }
  const verify = await verifyV01(intent, cart, payment, {
    merchantJwk: keys.merchant.publicJwk,
    userJwk: keys.user.publicJwk,
    now: cfg.now,
    humanPresent: cfg.humanPresent,
    cartSkus: cfg.lines.filter((l) => l.quantity > 0).map((l) => l.sku),
  });
  return { intent, cart, payment, verify };
}
