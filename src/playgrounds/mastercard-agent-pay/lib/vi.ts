/**
 * Verifiable Intent layer builder (spec: research/vendor/verifiable-intent, main, 2026-04-20).
 * L1 (issuer SD-JWT) -> L2 (user KB-SD-JWT, Immediate or Autonomous) -> L3a / L3b (agent KB-SD-JWTs).
 * Each layer binds the previous one with `sd_hash`; key delegation uses `cnf.jwk`; L3a and L3b share
 * `B64U(SHA-256(ASCII(checkout_jwt)))` as `transaction_id` and `checkout_hash`.
 *
 * Teaching simplifications: the `line_items` constraint and item disclosures are not modeled, so the
 * L3b `sd_hash` covers the L2 base JWT plus the checkout disclosure only; `checkout_jwt` is an ES256 JWS
 * from a fixture merchant key (v0.1 leaves its format implementation-defined); `risk_data` is omitted.
 */
import { b64urlDecodeJson, b64urlEncodeJson, randomB64url, sha256B64url } from './encoding';
import { CURRENCY, merchantById, MERCHANTS, type Merchant } from './fixtures';
import { decodeJws, generateEs256Key, signJws, type Es256Key, type Jwk } from './jws';
import { makeDisclosure, makePropertyDisclosure, parseSdJwt, serializeSdJwt, type Disclosure } from './sdjwt';

export type Mode = 'immediate' | 'autonomous';

export const VCT = {
  l1: 'https://credentials.mastercard.com/card',
  checkoutOpen: 'mandate.checkout.open.1',
  checkoutFinal: 'mandate.checkout.1',
  paymentOpen: 'mandate.payment.open.1',
  paymentFinal: 'mandate.payment.1',
} as const;

export const TYP = { l1: 'sd+jwt', l2Immediate: 'kb-sd-jwt', l2Autonomous: 'kb-sd-jwt+kb', l3: 'kb-sd-jwt' } as const;

/** Lifetimes in seconds, from credential-format.md section 7. */
export const LIFETIMES = {
  l1: 365 * 86400,
  l2Immediate: 15 * 60,
  l2AutonomousMin: 24 * 3600,
  l2AutonomousMax: 30 * 86400,
  l3Recommended: 5 * 60,
  l3Max: 3600,
  clockSkew: 300,
} as const;

export const ISSUER = 'https://issuer.example.com';
export const AGENT_AUD = 'https://agent.example.com';
export const NETWORK_AUD = 'https://network.example.com/vi/authorize';

export interface VIKeys {
  issuer: Es256Key;
  user: Es256Key;
  agent: Es256Key;
  /** A second agent key, used by the wrong-key fault. */
  otherAgent: Es256Key;
  merchant: Es256Key;
}

export async function generateViKeys(): Promise<VIKeys> {
  const [issuer, user, agent, otherAgent, merchant] = await Promise.all(['issuer_sk', 'user_sk', 'agent_sk', 'other_agent_sk', 'merchant_sk'].map(generateEs256Key));
  return { issuer: issuer as Es256Key, user: user as Es256Key, agent: agent as Es256Key, otherAgent: otherAgent as Es256Key, merchant: merchant as Es256Key };
}

export type FaultId =
  | 'none'
  | 'tamper-l1'
  | 'tamper-l2'
  | 'tamper-mandate'
  | 'checkout-swap'
  | 'l2-too-long'
  | 'amount-over-max'
  | 'merchant-not-allowed'
  | 'wrong-agent-key'
  | 'l3-lifetime-long'
  | 'cnf-split'
  | 'tamper-l3a';

export const FAULTS: { id: FaultId; label: string; modes: Mode[]; expect: string }[] = [
  { id: 'none', label: 'No fault', modes: ['immediate', 'autonomous'], expect: 'Every check passes' },
  { id: 'tamper-l1', label: 'Edit an L1 claim after signing', modes: ['immediate', 'autonomous'], expect: 'L1 signature breaks, and L2 sd_hash no longer matches' },
  { id: 'tamper-l2', label: 'Edit an L2 claim after signing', modes: ['immediate', 'autonomous'], expect: 'L2 signature breaks; in Autonomous mode the L3 sd_hash values break too' },
  { id: 'tamper-mandate', label: 'Edit a mandate disclosure in L2', modes: ['immediate', 'autonomous'], expect: 'The delegate_payload digest has no matching disclosure' },
  { id: 'checkout-swap', label: 'Pair a different checkout with the payment', modes: ['immediate', 'autonomous'], expect: 'checkout_hash and transaction_id differ' },
  { id: 'l2-too-long', label: 'Give L2 a lifetime beyond the recommendation', modes: ['immediate', 'autonomous'], expect: 'Immediate: warning only. Autonomous: L2 outlives L1, which must not happen' },
  { id: 'amount-over-max', label: 'Agent buys above amount_range max', modes: ['autonomous'], expect: 'Signatures verify; the amount constraint is violated' },
  { id: 'merchant-not-allowed', label: 'Agent buys at a merchant outside allowed_merchants', modes: ['autonomous'], expect: 'Signatures verify; the merchant constraint is violated' },
  { id: 'wrong-agent-key', label: 'L3 signed by a key not in cnf', modes: ['autonomous'], expect: 'L3 signatures fail against L2 cnf.jwk' },
  { id: 'l3-lifetime-long', label: 'L3 valid for two hours', modes: ['autonomous'], expect: 'L3 lifetime exceeds the one hour maximum' },
  { id: 'cnf-split', label: 'Different agent keys in the two L2 mandates', modes: ['autonomous'], expect: 'cnf values in the pair are not identical' },
  { id: 'tamper-l3a', label: 'Edit the L3a amount after signing', modes: ['autonomous'], expect: 'L3a delegate_payload digest has no matching disclosure' },
];

export interface VIConfig {
  mode: Mode;
  /** Final purchase amount in minor units. */
  amountMinor: number;
  merchantId: string;
  /** Autonomous constraints. */
  amountMin: number;
  amountMax: number;
  allowedMerchantIds: string[];
  /** Optional budget cap (minor units); `undefined` omits the constraint. */
  budgetMax?: number;
  /** Cumulative spend the network already holds for this mandate pair. */
  spentSoFar: number;
  fault: FaultId;
}

export const defaultViConfig = (mode: Mode = 'autonomous'): VIConfig => ({
  mode,
  amountMinor: 27999,
  merchantId: 'merchant-audioshop',
  amountMin: 10000,
  amountMax: 40000,
  allowedMerchantIds: ['merchant-audioshop', 'merchant-tennis'],
  budgetMax: undefined,
  spentSoFar: 0,
  fault: 'none',
});

export interface ViArtifacts {
  mode: Mode;
  now: number;
  /** Serialized SD-JWT strings: `jwt~disclosure~...~`. */
  l1: string;
  l2: string;
  l3a?: string;
  l3b?: string;
}

export interface ViTrust {
  issuerJwk: Jwk;
  merchantJwk: Jwk;
  now: number;
  spentSoFar: number;
}

const sha = sha256B64url;
const ref = (d: Disclosure) => ({ '...': d.digest });

async function checkoutJwtFor(keys: VIKeys, merchant: Merchant, amountMinor: number, now: number, sku: string): Promise<string> {
  return signJws(
    { typ: 'JWT', kid: 'merchant-key-1' },
    { iss: merchant.website, merchant: { id: merchant.id, name: merchant.name, website: merchant.website }, iat: now, items: [{ sku, name: 'Fixture item', quantity: 1, unit_price: amountMinor, currency: CURRENCY }] },
    keys.merchant.privateKey,
  );
}

/** Re-encode a compact JWS payload without re-signing, so the signature no longer matches. */
function editJwtPayload(jwt: string, edit: (p: Record<string, unknown>) => void): string {
  const [h, p, s] = jwt.split('.') as [string, string, string];
  const payload = b64urlDecodeJson<Record<string, unknown>>(p);
  edit(payload);
  return `${h}.${b64urlEncodeJson(payload)}.${s}`;
}

/** Edit one disclosure string (decoded, changed, re-encoded) in a serialized SD-JWT. The JWT is left alone. */
function editDisclosure(serialized: string, match: (value: Record<string, unknown>) => boolean, edit: (value: Record<string, unknown>) => void): string {
  const { jwt, disclosures } = parseSdJwt(serialized);
  let changed = false;
  const out = disclosures.map((enc) => {
    if (changed) return enc;
    try {
      const arr = b64urlDecodeJson<unknown[]>(enc);
      const v = arr[arr.length - 1];
      if (arr.length === 2 && v && typeof v === 'object' && match(v as Record<string, unknown>)) {
        edit(v as Record<string, unknown>);
        changed = true;
        return b64urlEncodeJson(arr);
      }
    } catch {
      /* not a mapping disclosure */
    }
    return enc;
  });
  return serializeSdJwt(jwt, out);
}

export async function buildChain(keys: VIKeys, cfg: VIConfig, now: number): Promise<ViArtifacts> {
  const merchantPick = cfg.fault === 'merchant-not-allowed' && cfg.mode === 'autonomous' ? MERCHANTS[2] as Merchant : merchantById(cfg.merchantId);
  const amount = cfg.fault === 'amount-over-max' && cfg.mode === 'autonomous' ? cfg.amountMax + 5000 : cfg.amountMinor;
  const instrument = { type: 'mastercard.srcDigitalCard', id: 'f199c3dd-0000-4000-8000-fixture00001', description: 'Mastercard **** 0000' };

  // ---- L1
  const email = await makePropertyDisclosure('email', 'user@example.com');
  const l1Jwt = await signJws(
    { typ: TYP.l1, kid: 'issuer-key-1' },
    { iss: ISSUER, sub: 'user-fixture-0001', iat: now, exp: now + LIFETIMES.l1, vct: VCT.l1, cnf: { jwk: keys.user.publicJwk }, pan_last_four: '0000', scheme: 'mastercard', card_id: 'card-fixture-0001', _sd_alg: 'sha-256', _sd: [email.digest] },
    keys.issuer.privateKey,
  );
  let l1 = serializeSdJwt(l1Jwt, [email.encoded]);
  const l1Signed = l1; // L2 hashes the L1 the signer received, before any later tampering

  // ---- checkout objects
  const checkoutJwt = await checkoutJwtFor(keys, merchantPick, amount, now, 'SKU-FIXTURE-1');
  const checkoutHash = await sha(checkoutJwt);
  const otherCheckoutJwt = await checkoutJwtFor(keys, merchantPick, amount + 100, now, 'SKU-FIXTURE-2');
  const otherHash = await sha(otherCheckoutJwt);
  const payee = { id: merchantPick.id, name: merchantPick.name, website: merchantPick.website };
  const swap = cfg.fault === 'checkout-swap';

  const kbHeader = (typ: string, kid: string) => ({ typ, kid });
  let l2: string;
  let l3a: string | undefined;
  let l3b: string | undefined;

  if (cfg.mode === 'immediate') {
    const checkoutMandate = { vct: VCT.checkoutFinal, checkout_jwt: swap ? otherCheckoutJwt : checkoutJwt, checkout_hash: swap ? otherHash : checkoutHash };
    const paymentMandate = { vct: VCT.paymentFinal, payment_instrument: instrument, payment_amount: { currency: CURRENCY, amount }, payee, transaction_id: checkoutHash };
    const [cd, pd] = [await makeDisclosure(checkoutMandate), await makeDisclosure(paymentMandate)];
    const exp = now + (cfg.fault === 'l2-too-long' ? 3600 : LIFETIMES.l2Immediate);
    const l2Jwt = await signJws(
      kbHeader(TYP.l2Immediate, 'user-key-1'),
      { nonce: randomB64url(8), aud: NETWORK_AUD, iat: now, exp, sd_hash: await sha(l1Signed), _sd_alg: 'sha-256', _sd: [cd.digest, pd.digest], delegate_payload: [ref(cd), ref(pd)] },
      keys.user.privateKey,
    );
    l2 = serializeSdJwt(l2Jwt, [cd.encoded, pd.encoded]);
  } else {
    const agentJwk = { ...keys.agent.publicJwk, kid: 'agent-key-1' };
    const otherJwk = { ...keys.otherAgent.publicJwk, kid: 'agent-key-1' };
    const allowed = cfg.allowedMerchantIds.map(merchantById);
    const merchantDiscs = await Promise.all(allowed.map((m) => makeDisclosure({ id: m.id, name: m.name, website: m.website })));
    const checkoutOpen = {
      vct: VCT.checkoutOpen,
      cnf: { jwk: agentJwk },
      constraints: [{ type: 'mandate.checkout.allowed_merchants', allowed: merchantDiscs.map(ref) }],
      prompt_summary: 'Illustrative: buy one item within the limits',
    };
    const cd = await makeDisclosure(checkoutOpen);
    const constraints: unknown[] = [{ type: 'mandate.payment.amount_range', currency: CURRENCY, min: cfg.amountMin, max: cfg.amountMax }];
    if (cfg.budgetMax !== undefined) constraints.push({ type: 'mandate.payment.budget', currency: CURRENCY, max: cfg.budgetMax });
    // conditional_transaction_id = B64U(SHA-256(ASCII(checkout disclosure))), the digest of cd.
    constraints.push({ type: 'mandate.payment.reference', conditional_transaction_id: cd.digest });
    const paymentOpen = { vct: VCT.paymentOpen, cnf: { jwk: cfg.fault === 'cnf-split' ? otherJwk : agentJwk }, payment_instrument: instrument, constraints };
    const pd = await makeDisclosure(paymentOpen);
    const l2Exp = cfg.fault === 'l2-too-long' ? now + LIFETIMES.l1 + 86400 : now + LIFETIMES.l2AutonomousMax;
    const l2Jwt = await signJws(
      kbHeader(TYP.l2Autonomous, 'user-key-1'),
      { nonce: randomB64url(8), aud: AGENT_AUD, iat: now, exp: l2Exp, sd_hash: await sha(l1Signed), _sd_alg: 'sha-256', _sd: [cd.digest, pd.digest], delegate_payload: [ref(cd), ref(pd)] },
      keys.user.privateKey,
    );
    l2 = serializeSdJwt(l2Jwt, [cd.encoded, pd.encoded, ...merchantDiscs.map((d) => d.encoded)]);

    // ---- L3a and L3b, signed by the agent
    const signer = cfg.fault === 'wrong-agent-key' ? keys.otherAgent : keys.agent;
    const l3Exp = now + (cfg.fault === 'l3-lifetime-long' ? 7200 : LIFETIMES.l3Recommended);
    const selected = merchantDiscs.find((d) => (d.value as { id: string }).id === merchantPick.id);
    const finalPayment = await makeDisclosure({ vct: VCT.paymentFinal, payment_instrument: instrument, payment_amount: { currency: CURRENCY, amount }, payee, transaction_id: checkoutHash });
    const finalCheckout = await makeDisclosure({
      vct: VCT.checkoutFinal,
      checkout_jwt: swap ? otherCheckoutJwt : checkoutJwt,
      checkout_hash: swap ? otherHash : checkoutHash,
      line_items: [{ sku: swap ? 'SKU-FIXTURE-2' : 'SKU-FIXTURE-1', name: 'Fixture item', quantity: 1, unit_price: swap ? amount + 100 : amount, currency: CURRENCY }],
    });
    const l2Base = parseSdJwt(l2).jwt;
    const viewA = `${l2Base}~${pd.encoded}~${selected ? selected.encoded + '~' : ''}`;
    const viewB = `${l2Base}~${cd.encoded}~`;
    const l3aJwt = await signJws(
      kbHeader(TYP.l3, 'agent-key-1'),
      { nonce: randomB64url(8), aud: NETWORK_AUD, iat: now, exp: l3Exp, sd_hash: await sha(viewA), _sd_alg: 'sha-256', _sd: [finalPayment.digest], delegate_payload: [ref(finalPayment)] },
      signer.privateKey,
    );
    l3a = serializeSdJwt(l3aJwt, [finalPayment.encoded]);
    const l3bJwt = await signJws(
      kbHeader(TYP.l3, 'agent-key-1'),
      { nonce: randomB64url(8), aud: `${merchantPick.website}/checkout`, iat: now, exp: l3Exp, sd_hash: await sha(viewB), _sd_alg: 'sha-256', _sd: [finalCheckout.digest], delegate_payload: [ref(finalCheckout)] },
      signer.privateKey,
    );
    l3b = serializeSdJwt(l3bJwt, [finalCheckout.encoded]);
  }

  // ---- post-signing tampering (signatures are left stale on purpose)
  if (cfg.fault === 'tamper-l1') {
    const { jwt, disclosures } = parseSdJwt(l1);
    l1 = serializeSdJwt(editJwtPayload(jwt, (p) => { p.pan_last_four = '9999'; }), disclosures);
  }
  if (cfg.fault === 'tamper-l2') {
    const { jwt, disclosures } = parseSdJwt(l2);
    l2 = serializeSdJwt(editJwtPayload(jwt, (p) => { p.aud = 'https://attacker.example.com'; }), disclosures);
  }
  if (cfg.fault === 'tamper-mandate') {
    l2 = editDisclosure(
      l2,
      (v) => v.vct === VCT.paymentFinal || v.vct === VCT.paymentOpen,
      (v) => {
        if (v.vct === VCT.paymentFinal) (v.payment_amount as { amount: number }).amount += 50000;
        else {
          const c = (v.constraints as { type: string; max?: number }[]).find((x) => x.type === 'mandate.payment.amount_range');
          if (c) c.max = (c.max ?? 0) + 500000;
        }
      },
    );
  }
  if (cfg.fault === 'tamper-l3a' && l3a) {
    l3a = editDisclosure(l3a, (v) => v.vct === VCT.paymentFinal, (v) => { (v.payment_amount as { amount: number }).amount -= 1; });
  }
  return { mode: cfg.mode, now, l1, l2, l3a, l3b };
}

// ---- inspection (used by the UI and by tests)

export interface Inspected {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  disclosures: { encoded: string; digest: string; decoded: unknown }[];
}

export async function inspectLayer(serialized: string): Promise<Inspected> {
  const { jwt, disclosures } = parseSdJwt(serialized);
  const d = decodeJws(jwt);
  const list = [];
  for (const encoded of disclosures) {
    let decoded: unknown;
    try {
      decoded = b64urlDecodeJson(encoded);
    } catch {
      decoded = 'Malformed disclosure';
    }
    list.push({ encoded, digest: await sha(encoded), decoded });
  }
  return { header: d.header, payload: d.payload, signature: d.signature, disclosures: list };
}

export function lifetimeOf(payload: Record<string, unknown>): number | undefined {
  return typeof payload.iat === 'number' && typeof payload.exp === 'number' ? payload.exp - payload.iat : undefined;
}

export function humanDuration(sec: number): string {
  if (sec % 86400 === 0) return `${sec / 86400} day${sec === 86400 ? '' : 's'}`;
  if (sec % 3600 === 0) return `${sec / 3600} hour${sec === 3600 ? '' : 's'}`;
  if (sec % 60 === 0) return `${sec / 60} minutes`;
  return `${sec} seconds`;
}

export function trustFor(keys: VIKeys, now: number, spentSoFar = 0): ViTrust {
  return { issuerJwk: keys.issuer.publicJwk, merchantJwk: keys.merchant.publicJwk, now, spentSoFar };
}
