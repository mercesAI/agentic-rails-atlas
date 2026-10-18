/**
 * AP2 v0.2 mandate builders and signers.
 *
 * Shapes follow `docs/ap2/checkout_mandate.md` and `docs/ap2/payment_mandate.md` examples:
 * - an issuer-signed SD-JWT whose payload carries `delegate_payload: [{"...": digest}]` and
 *   `_sd_alg`, with the Mandate Content in an array-element disclosure;
 * - SD arrays (`allowed`, `acceptable_items`) concealed element by element;
 * - in the closed Checkout Mandate, `checkout_jwt` concealed as an SD property (`_sd`);
 * - for Human Not Present, the closed mandate is a key-binding JWT (`typ` `kb+sd-jwt`) signed with
 *   the agent key from the open mandate's `cnf`, carrying `aud`, `nonce`, `iat`, `sd_hash`.
 * Teaching simplification: the Delegate SD-JWT draft defines how the open and closed parts form one
 * chain; this module keeps them as two serialized strings.
 */
import { randomBase64Url, sha256Base64Url } from '@/lib/playground/bytes';
import { signJws, type Es256Key } from '@/lib/playground/es256';
import { concealArray, concealProperty, makeArrayDisclosure, SD_ALG, serializeSdJwt, type Disclosure } from '@/lib/playground/sd-jwt';
import { ISSUERS } from './fixtures';
import {
  VCT,
  type AnyConstraint,
  type CheckoutMandate,
  type Merchant,
  type OpenCheckoutMandate,
  type OpenPaymentMandate,
  type PaymentInstrument,
  type PaymentMandate,
} from './types';

export type DisclosureTag = 'content' | 'merchant' | 'item' | 'payee' | 'instrument' | 'checkout_jwt';

export interface TaggedDisclosure extends Disclosure {
  tag: DisclosureTag;
}

export interface IssuedMandate {
  /** Issuer-signed JWT (user or agent provider key) or KB-JWT (agent key). */
  jwt: string;
  /** Every disclosure created at issuance. */
  disclosures: TaggedDisclosure[];
  /** The Mandate Content before concealment, for display. */
  content: Record<string, unknown>;
}

const tagAll = (ds: Disclosure[], tag: DisclosureTag): TaggedDisclosure[] => ds.map((d) => ({ ...d, tag }));

/** Conceal the SD arrays the schemas mark with `x-selectively-disclosable-array`. */
export async function concealConstraints(constraints: AnyConstraint[]): Promise<{ constraints: AnyConstraint[]; disclosures: TaggedDisclosure[] }> {
  const out: AnyConstraint[] = [];
  const disclosures: TaggedDisclosure[] = [];
  for (const c of constraints) {
    if (c.type === 'checkout.allowed_merchants' || c.type === 'payment.allowed_payees' || c.type === 'payment.allowed_payment_instruments') {
      const r = await concealArray((c as { allowed: unknown[] }).allowed);
      const tag: DisclosureTag = c.type === 'checkout.allowed_merchants' ? 'merchant' : c.type === 'payment.allowed_payees' ? 'payee' : 'instrument';
      disclosures.push(...tagAll(r.disclosures, tag));
      out.push({ ...c, allowed: r.placeholders } as AnyConstraint);
    } else if (c.type === 'checkout.line_items') {
      const items = [];
      for (const req of (c as { items: { id: string; acceptable_items: unknown[]; quantity: number }[] }).items) {
        const r = await concealArray(req.acceptable_items);
        disclosures.push(...tagAll(r.disclosures, 'item'));
        items.push({ id: req.id, acceptable_items: r.placeholders, quantity: req.quantity });
      }
      out.push({ type: 'checkout.line_items', items } as AnyConstraint);
    } else {
      out.push(c);
    }
  }
  return { constraints: out, disclosures };
}

export interface SignOptions {
  iat: number;
  kid?: string;
}

/** User (or agent provider) signs Mandate Content on the Trusted Surface: an issuer-signed SD-JWT. */
export async function issueUserSigned(content: Record<string, unknown>, extra: TaggedDisclosure[], key: Es256Key, opts: SignOptions): Promise<IssuedMandate> {
  const contentDisclosure = await makeArrayDisclosure(content);
  const payload = { iss: ISSUERS.trustedSurface, iat: opts.iat, _sd_alg: SD_ALG, delegate_payload: [{ '...': contentDisclosure.digest }] };
  const jwt = await signJws({ alg: 'ES256', typ: 'example+sd-jwt', kid: opts.kid ?? 'user-key-1' }, payload, key.privateKey);
  return { jwt, disclosures: [...extra, { ...contentDisclosure, tag: 'content' }], content };
}

export interface KeyBindingOptions {
  iat: number;
  aud: string;
  nonce: string;
  /** The open mandate presentation the closed one extends (hashed into `sd_hash`). */
  parentPresentation: string;
}

/** Agent closes an open mandate: a KB-JWT signed with the key in the parent's `cnf`. */
export async function closeWithKeyBinding(content: Record<string, unknown>, extra: TaggedDisclosure[], agentKey: Es256Key, opts: KeyBindingOptions): Promise<IssuedMandate & { sdHash: string }> {
  const contentDisclosure = await makeArrayDisclosure(content);
  const sdHash = await sha256Base64Url(opts.parentPresentation);
  const payload = { delegate_payload: [{ '...': contentDisclosure.digest }], iat: opts.iat, aud: opts.aud, nonce: opts.nonce, sd_hash: sdHash, _sd_alg: SD_ALG };
  const jwt = await signJws({ alg: 'ES256', typ: 'kb+sd-jwt' }, payload, agentKey.privateKey);
  return { jwt, disclosures: [...extra, { ...contentDisclosure, tag: 'content' }], content, sdHash };
}

/** Serialize with the chosen disclosures. */
export function present(issued: Pick<IssuedMandate, 'jwt'>, disclosures: TaggedDisclosure[]): string {
  return serializeSdJwt(issued.jwt, disclosures.map((d) => d.encoded));
}

// ------------------------------------------------------------------ content builders

export function openCheckoutContent(constraints: AnyConstraint[], agentKey: Es256Key, iat: number, exp: number): OpenCheckoutMandate {
  return { vct: VCT.checkoutOpen, constraints, cnf: { jwk: agentKey.publicJwk }, iat, exp };
}

export function openPaymentContent(
  constraints: AnyConstraint[],
  agentKey: Es256Key,
  iat: number,
  exp: number,
  preset: { payment_instrument?: PaymentInstrument; payee?: Merchant } = {},
): OpenPaymentMandate {
  return { vct: VCT.paymentOpen, constraints, cnf: { jwk: agentKey.publicJwk }, ...preset, iat, exp };
}

export function closedCheckoutContent(checkoutJwt: string, checkoutHash: string, iat: number, exp: number, vct: string = VCT.checkout): CheckoutMandate {
  return { vct, checkout_jwt: checkoutJwt, checkout_hash: checkoutHash, iat, exp };
}

export function closedPaymentContent(
  p: Omit<PaymentMandate, 'vct' | 'iat' | 'exp'>,
  iat: number,
  exp: number,
  vct: string = VCT.payment,
): PaymentMandate {
  return { vct, ...p, iat, exp };
}

/** Conceal `checkout_jwt` as an SD property, as in the closed Checkout Mandate example. */
export async function concealCheckoutJwt(content: CheckoutMandate): Promise<{ content: Record<string, unknown>; disclosures: TaggedDisclosure[] }> {
  const r = await concealProperty(content as unknown as Record<string, unknown>, 'checkout_jwt');
  return { content: r.object, disclosures: [{ ...r.disclosure, tag: 'checkout_jwt' }] };
}

/** Merchant signs the Checkout. ECDSA is randomized, which the spec requires for the Checkout JWT. */
export async function signCheckout(checkout: unknown, merchantKey: Es256Key): Promise<string> {
  return signJws({ alg: 'ES256', typ: 'JWT', kid: 'merchant-key-1' }, checkout, merchantKey.privateKey);
}

/** `checkout_hash` and `transaction_id`: base64url SHA-256 of the `checkout_jwt` string. */
export async function checkoutHashOf(checkoutJwt: string): Promise<string> {
  return sha256Base64Url(checkoutJwt);
}

/**
 * `conditional_transaction_id` in `payment.reference` is the "digest of the associated Open Checkout
 * Mandate". Teaching simplification: the spec does not fix which bytes are hashed; this simulation
 * hashes the issuer-signed JWT of the open Checkout Mandate, which does not change with the disclosures chosen.
 */
export async function openCheckoutDigestOf(openCheckoutJwt: string): Promise<string> {
  return sha256Base64Url(openCheckoutJwt);
}

/** Receipt `reference`: hash of the final SD-JWT in the chain, computed like `sd_hash`. */
export async function receiptReferenceOf(closedPresentation: string): Promise<string> {
  return sha256Base64Url(closedPresentation);
}

export const newNonce = (): string => randomBase64Url(16);
