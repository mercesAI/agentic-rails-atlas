/**
 * A Verifiable Intent chain verifier. It recomputes every binding from the serialized strings and
 * reports each check, so a tampered layer shows which later checks break with it.
 * Teaching simplification: one verifier sees the full L2 and both L3 credentials. In the real flow the
 * payment network receives L3a with the payment view and the merchant receives L3b.
 * The network state (`spentSoFar`) is typed in; the spec says networks must hold it but defines no API.
 */
import { sha256B64url } from './encoding';
import { decodeJws, sameJwk, verifyJws, type Jwk } from './jws';
import { decodeDisclosure, parseSdJwt, resolveRefs } from './sdjwt';
import { LIFETIMES, TYP, VCT, humanDuration, type ViArtifacts, type ViTrust } from './vi';

export type CheckStatus = 'pass' | 'fail' | 'warn' | 'skipped';
export type LayerId = 'L1' | 'L2' | 'L3a' | 'L3b' | 'Chain';

export interface ViCheck {
  id: string;
  layer: LayerId;
  label: string;
  status: CheckStatus;
  detail: string;
  /** Where the rule lives in the Verifiable Intent spec. */
  spec: string;
}

export interface ViReport {
  checks: ViCheck[];
  firstFailure?: ViCheck;
  failures: ViCheck[];
  ok: boolean;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);

interface Layer {
  jwt: string;
  header: Obj;
  payload: Obj;
  disclosures: string[];
  /** Mandate objects resolved from `delegate_payload`. */
  mandates: { digest: string; value: Obj }[];
  missingRefs: string[];
  parsed: boolean;
}

async function load(serialized: string | undefined): Promise<Layer | undefined> {
  if (!serialized) return undefined;
  try {
    const { jwt, disclosures } = parseSdJwt(serialized);
    const d = decodeJws(jwt);
    const refs = Array.isArray(d.payload.delegate_payload) ? (d.payload.delegate_payload as unknown[]) : [];
    const byDigest = new Map<string, string>();
    for (const enc of disclosures) byDigest.set(await sha256B64url(enc), enc);
    const mandates: Layer['mandates'] = [];
    const missingRefs: string[] = [];
    for (const r of refs) {
      const digest = isObj(r) ? String(r['...']) : '';
      const enc = byDigest.get(digest);
      if (!enc) {
        missingRefs.push(digest);
        continue;
      }
      const v = decodeDisclosure(enc).value;
      if (isObj(v)) mandates.push({ digest, value: v });
    }
    return { jwt, header: d.header, payload: d.payload, disclosures, mandates, missingRefs, parsed: true };
  } catch {
    return undefined;
  }
}

export async function verifyChain(a: ViArtifacts, trust: ViTrust): Promise<ViReport> {
  const checks: ViCheck[] = [];
  const add = (layer: LayerId, id: string, label: string, status: CheckStatus, detail: string, spec: string) => checks.push({ id, layer, label, status, detail, spec });
  const flag = (cond: boolean, soft = false): CheckStatus => (cond ? 'pass' : soft ? 'warn' : 'fail');
  const { now } = trust;
  const skew = LIFETIMES.clockSkew;

  const [l1, l2, l3a, l3b] = await Promise.all([load(a.l1), load(a.l2), load(a.l3a), load(a.l3b)]);
  if (!l1) {
    add('L1', 'l1-parse', 'L1 parses as an SD-JWT', 'fail', 'The L1 string is not a compact JWS followed by disclosures', 'credential-format.md 3');
    return finish(checks);
  }

  // ---------------- L1
  const l1Jwk = (l1.payload.cnf as { jwk?: Jwk } | undefined)?.jwk;
  add('L1', 'l1-sig', 'ES256 signature verifies against the issuer key', flag(await verifyJws(l1.jwt, trust.issuerJwk)), 'Key resolved by kid from the issuer key set (fixture)', 'credential-format.md 3.5');
  add('L1', 'l1-typ', 'typ is sd+jwt and vct is the Mastercard reference profile', flag(l1.header.typ === TYP.l1 && l1.payload.vct === VCT.l1), `typ=${String(l1.header.typ)}, vct=${String(l1.payload.vct)}`, 'credential-format.md 3.2, 3.3');
  add('L1', 'l1-no-sd-hash', 'No sd_hash claim', flag(!('sd_hash' in l1.payload)), 'L1 is the root of the chain', 'credential-format.md 3.5');
  add('L1', 'l1-exp', 'Not expired (300 second skew)', flag(typeof l1.payload.exp === 'number' && l1.payload.exp + skew >= now), `exp=${String(l1.payload.exp)}, now=${now}`, 'credential-format.md 3.5');
  const l1Life = typeof l1.payload.exp === 'number' && typeof l1.payload.iat === 'number' ? l1.payload.exp - l1.payload.iat : undefined;
  add('L1', 'l1-life', 'Lifetime within the one year recommendation', l1Life === undefined ? 'fail' : flag(l1Life <= LIFETIMES.l1, true), l1Life === undefined ? 'iat or exp missing' : `Lifetime ${humanDuration(l1Life)}. A recommendation (SHOULD), not a hard limit`, 'credential-format.md 3.3, 7');
  add('L1', 'l1-cnf', 'cnf.jwk holds the user public key', flag(!!l1Jwk), l1Jwk ? 'User key found' : 'cnf.jwk missing', 'credential-format.md 3.3');

  if (!l2) {
    add('L2', 'l2-parse', 'L2 parses as an SD-JWT', 'fail', 'The L2 string is not a compact JWS followed by disclosures', 'credential-format.md 4');
    return finish(checks);
  }

  // ---------------- L2
  const auto = l2.header.typ === TYP.l2Autonomous;
  const imm = l2.header.typ === TYP.l2Immediate;
  const mandates = l2.mandates;
  const checkoutM = mandates.find((m) => m.value.vct === VCT.checkoutFinal || m.value.vct === VCT.checkoutOpen);
  const paymentM = mandates.find((m) => m.value.vct === VCT.paymentFinal || m.value.vct === VCT.paymentOpen);
  const modeVct = auto ? [VCT.checkoutOpen, VCT.paymentOpen] : [VCT.checkoutFinal, VCT.paymentFinal];

  add('L2', 'l2-sig', 'Signature verifies against the key in L1 cnf.jwk', l1Jwk ? flag(await verifyJws(l2.jwt, l1Jwk)) : 'fail', 'The user key was bound by the issuer in L1', 'credential-format.md 4.7 rule 1');
  add('L2', 'l2-sd-hash', 'sd_hash equals B64U(SHA-256(serialized L1))', flag(l2.payload.sd_hash === (await sha256B64url(a.l1))), 'Recomputed over the L1 string as received, including disclosures', 'credential-format.md 6.1');
  add('L2', 'l2-typ', 'typ matches the mandate vct values', flag((auto || imm) && checkoutM?.value.vct === modeVct[0] && paymentM?.value.vct === modeVct[1]), `typ=${String(l2.header.typ)}; mode is inferred from the vct values`, 'credential-format.md 4.6, 4.7 rule 3');
  const l2Life = typeof l2.payload.exp === 'number' && typeof l2.payload.iat === 'number' ? l2.payload.exp - l2.payload.iat : undefined;
  add('L2', 'l2-exp', 'Not expired, and iat is not in the future (300 second skew)', flag(typeof l2.payload.exp === 'number' && l2.payload.exp + skew >= now && typeof l2.payload.iat === 'number' && l2.payload.iat <= now + skew), `exp=${String(l2.payload.exp)}, iat=${String(l2.payload.iat)}`, 'credential-format.md 4.7 rule 4');
  if (l2Life !== undefined) {
    if (auto) {
      const l1Exp = typeof l1.payload.exp === 'number' ? l1.payload.exp : Infinity;
      add('L2', 'l2-within-l1', 'L2 exp does not exceed L1 exp', flag((l2.payload.exp as number) <= l1Exp), 'Autonomous L2 must not outlive L1', 'credential-format.md 7');
      add('L2', 'l2-life', 'Lifetime in the 24 hour to 30 day recommendation', flag(l2Life >= LIFETIMES.l2AutonomousMin && l2Life <= LIFETIMES.l2AutonomousMax, true), `Lifetime ${humanDuration(l2Life)}. A recommendation, not a hard limit`, 'credential-format.md 4.3, 7');
    } else {
      add('L2', 'l2-life', 'Lifetime within the 15 minute recommendation', flag(l2Life <= LIFETIMES.l2Immediate, true), `Lifetime ${humanDuration(l2Life)}. The spec says SHOULD, so this is a warning`, 'credential-format.md 4.3, 7');
    }
  }
  add('L2', 'l2-refs', 'Every delegate_payload digest has a matching disclosure', flag(l2.missingRefs.length === 0), l2.missingRefs.length ? `No disclosure hashes to: ${l2.missingRefs.map((d) => d.slice(0, 10)).join(', ')}...` : 'All references resolve', 'credential-format.md 9.1');
  add('L2', 'l2-pair', 'Exactly one checkout and one payment mandate', flag(mandates.filter((m) => String(m.value.vct).startsWith('mandate.checkout')).length === 1 && mandates.filter((m) => String(m.value.vct).startsWith('mandate.payment')).length === 1), `${mandates.length} mandate(s) resolved`, 'credential-format.md 4.7 rules 7 and 8');

  const cnfOf = (m?: { value: Obj }) => (m?.value.cnf as { jwk?: Jwk } | undefined)?.jwk;
  const agentJwk = cnfOf(paymentM) ?? cnfOf(checkoutM);
  if (auto) {
    const cj = cnfOf(checkoutM);
    const pj = cnfOf(paymentM);
    add('L2', 'l2-cnf', 'Both mandates carry cnf.jwk with a kid', flag(!!cj?.kid && !!pj?.kid), 'The agent key is bound here, one layer below L1', 'credential-format.md 4.5, 4.6');
    add('L2', 'l2-cnf-same', 'The pair carries identical cnf.jwk values', flag(!!cj && !!pj && sameJwk(cj, pj) && cj.kid === pj.kid), 'Checkout and payment mandates must name the same agent key', 'credential-format.md 4.6');
  } else {
    add('L2', 'l2-no-cnf', 'No cnf in Immediate mandates', flag(!cnfOf(checkoutM) && !cnfOf(paymentM)), 'Immediate mode has no delegation', 'credential-format.md 4.6');
  }

  // ---------------- Immediate: checkout_hash link inside L2
  if (imm) {
    const cj = String(checkoutM?.value.checkout_jwt ?? '');
    const h = await sha256B64url(cj);
    add('Chain', 'imm-checkout-hash', 'checkout_hash equals B64U(SHA-256(checkout_jwt))', flag(checkoutM?.value.checkout_hash === h), 'Recomputed from the checkout_jwt string', 'credential-format.md 6.2');
    add('Chain', 'imm-transaction-id', 'transaction_id equals checkout_hash', flag(paymentM?.value.transaction_id === checkoutM?.value.checkout_hash), 'Links the payment mandate to this checkout', 'credential-format.md 4.4.2, 6.2');
    add('Chain', 'imm-merchant-sig', 'checkout_jwt signature verifies (fixture merchant key)', flag(await verifyJws(cj, trust.merchantJwk), true), 'v0.1 leaves checkout_jwt signing implementation-defined; verifying is SHOULD', 'credential-format.md 6.3');
    add('L3a', 'l3-na', 'No L3 in Immediate mode', 'skipped', 'The user confirmed final values in L2', 'credential-format.md 2');
    return finish(checks);
  }

  if (!auto) return finish(checks);

  // ---------------- Autonomous L3
  if (!l3a || !l3b) {
    add('L3a', 'l3-parse', 'L3a and L3b present', 'fail', 'An L3 string is missing or does not parse', 'credential-format.md 5');
    return finish(checks);
  }
  const l2Base = parseSdJwt(a.l2).jwt;
  const l2Discs = parseSdJwt(a.l2).disclosures;
  const encOf = async (m?: { digest: string }) => {
    for (const e of l2Discs) if ((await sha256B64url(e)) === m?.digest) return e;
    return '';
  };
  const payDisc = await encOf(paymentM);
  const chkDisc = await encOf(checkoutM);

  // allowed merchants resolved from the checkout mandate
  const allowedC = (checkoutM?.value.constraints as Obj[] | undefined)?.find((c) => c.type === 'mandate.checkout.allowed_merchants');
  const resolved = allowedC ? await resolveRefs(allowedC.allowed, l2Discs) : { value: [], undisclosed: [] };
  const allowedMerchants = (Array.isArray(resolved.value) ? resolved.value : []).filter(isObj);

  const finals: Record<'L3a' | 'L3b', Obj | undefined> = { L3a: undefined, L3b: undefined };
  for (const [id, l3] of [['L3a', l3a], ['L3b', l3b]] as const) {
    const want = id === 'L3a' ? VCT.paymentFinal : VCT.checkoutFinal;
    const m = l3.mandates.find((x) => x.value.vct === want);
    finals[id] = m?.value;
    const kidMatches = !!agentJwk && l3.header.kid === agentJwk.kid;
    add(id, `${id}-kid`, 'Header kid matches L2 cnf.jwk.kid', flag(kidMatches), `kid=${String(l3.header.kid)}`, 'credential-format.md 5.2, 5.7 rule 1');
    add(id, `${id}-sig`, 'Signature verifies against L2 cnf.jwk', agentJwk ? flag(await verifyJws(l3.jwt, agentJwk)) : 'fail', 'The agent key came from the user-signed L2, not from the L3 header', 'credential-format.md 5.7 rule 2');
    add(id, `${id}-typ`, 'typ is kb-sd-jwt', flag(l3.header.typ === TYP.l3), `typ=${String(l3.header.typ)}`, 'credential-format.md 5.7 rule 3');
    if (!m) {
      add(id, `${id}-refs`, 'Every delegate_payload digest has a matching disclosure', 'fail', 'A disclosure was edited after signing, so the final mandate cannot be read', 'credential-format.md 9.1');
      for (const [k, label] of [['sd-hash', 'sd_hash equals the hash of the recipient view of L2'], ['no-cnf', 'No cnf in the final mandate (terminal delegation)']] as const) {
        add(id, `${id}-${k}`, label, 'skipped', 'The final mandate is not available', 'credential-format.md 5.4');
      }
      continue;
    }
    let view: string;
    if (id === 'L3a') {
      const payee = m?.value.payee as Obj | undefined;
      let sel = '';
      for (const e of l2Discs) {
        try {
          const v = decodeDisclosure(e).value;
          if (isObj(v) && payee && v.id !== undefined && v.id === payee.id && !('vct' in v)) sel = e;
        } catch {
          /* ignore */
        }
      }
      view = `${l2Base}~${payDisc}~${sel ? sel + '~' : ''}`;
    } else view = `${l2Base}~${chkDisc}~`;
    add(id, `${id}-sd-hash`, 'sd_hash equals the hash of the recipient view of L2', flag(l3.payload.sd_hash === (await sha256B64url(view))), id === 'L3a' ? 'L2 base JWT + payment disclosure + selected merchant disclosure' : 'L2 base JWT + checkout disclosure (teaching simplification: no item disclosures)', 'credential-format.md 5.4, 6.1');
    add(id, `${id}-refs`, 'Every delegate_payload digest has a matching disclosure', flag(l3.missingRefs.length === 0), 'All references resolve', 'credential-format.md 9.1');
    add(id, `${id}-no-cnf`, 'No cnf in the final mandate (terminal delegation)', flag(!('cnf' in m.value) && !('cnf' in l3.payload)), 'No further key binding is allowed', 'credential-format.md 4.6, 5.7 rule 5');
    const life = typeof l3.payload.exp === 'number' && typeof l3.payload.iat === 'number' ? l3.payload.exp - l3.payload.iat : undefined;
    add(id, `${id}-exp`, 'Not expired (300 second skew)', flag(typeof l3.payload.exp === 'number' && l3.payload.exp + skew >= now), `exp=${String(l3.payload.exp)}`, 'credential-format.md 5.7 rule 6');
    if (life !== undefined) {
      add(id, `${id}-max-life`, 'Lifetime does not exceed one hour', flag(life <= LIFETIMES.l3Max), `Lifetime ${humanDuration(life)}. Maximum is one hour`, 'credential-format.md 5.3, 7');
      add(id, `${id}-rec-life`, 'Lifetime within the five minute recommendation', flag(life <= LIFETIMES.l3Recommended, true), `Lifetime ${humanDuration(life)}. A recommendation, not a hard limit`, 'credential-format.md 5.3, 7');
    }
    add(id, `${id}-nonce`, 'Nonce differs from the L2 nonce', flag(l3.payload.nonce !== l2.payload.nonce && typeof l3.payload.nonce === 'string'), 'Each layer carries its own nonce', 'credential-format.md 5.3');
  }

  // ---------------- checkout_hash link
  const co = finals.L3b;
  const pa = finals.L3a;
  const cj = String(co?.checkout_jwt ?? '');
  const recomputed = await sha256B64url(cj);
  add('Chain', 'hash-checkout', 'L3b checkout_hash equals B64U(SHA-256(checkout_jwt))', co ? flag(co.checkout_hash === recomputed) : 'skipped', 'Recomputed from the checkout_jwt string in L3b', 'credential-format.md 6.2');
  add('Chain', 'hash-link', 'L3a transaction_id equals L3b checkout_hash', co && pa ? flag(pa.transaction_id === co.checkout_hash) : 'skipped', pa && co ? `transaction_id ${String(pa.transaction_id).slice(0, 10)}..., checkout_hash ${String(co.checkout_hash).slice(0, 10)}...` : 'A final mandate is missing', 'credential-format.md 5.7 rule 10, 6.2');
  add('Chain', 'merchant-sig', 'checkout_jwt signature verifies (fixture merchant key)', flag(await verifyJws(cj, trust.merchantJwk), true), 'v0.1 leaves checkout_jwt signing implementation-defined; verifying is SHOULD', 'credential-format.md 6.3');
  const ref = (paymentM?.value.constraints as Obj[] | undefined)?.find((c) => c.type === 'mandate.payment.reference');
  add('Chain', 'ref-conditional', 'conditional_transaction_id equals the checkout disclosure hash', flag(!!ref && ref.conditional_transaction_id === checkoutM?.digest), 'The L2 pre-commitment, before any checkout_jwt exists. Not the same value as checkout_hash', 'constraints.md 4.8; credential-format.md 4.5.3');

  // ---------------- constraints
  const payConstraints = (paymentM?.value.constraints as Obj[] | undefined) ?? [];
  const amt = (pa?.payment_amount as { amount?: unknown; currency?: unknown } | undefined) ?? {};
  const amount = typeof amt.amount === 'number' ? amt.amount : NaN;
  const range = payConstraints.find((c) => c.type === 'mandate.payment.amount_range');
  if (range && pa) {
    const max = range.max as number | undefined;
    const min = range.min as number | undefined;
    const ok = Number.isInteger(amount) && (max === undefined || amount <= max) && (min === undefined || amount >= min) && amt.currency === range.currency;
    add('Chain', 'c-amount', 'mandate.payment.amount_range satisfied', flag(ok), `amount ${amount} in ${String(min ?? '-')} to ${String(max ?? '-')} ${String(range.currency)} (minor units)`, 'constraints.md 4.4');
  }
  const budget = payConstraints.find((c) => c.type === 'mandate.payment.budget');
  if (budget) {
    const total = trust.spentSoFar + amount;
    add('Chain', 'c-budget', 'mandate.payment.budget satisfied (network state)', flag(total <= (budget.max as number)), `${trust.spentSoFar} already spent + ${amount} = ${total} against max ${String(budget.max)}. The network must hold this state; no API is defined`, 'constraints.md 4.5');
  }
  if (allowedC) {
    let merchantId: unknown;
    try {
      merchantId = (decodeJws(cj).payload.merchant as Obj | undefined)?.id;
    } catch {
      merchantId = undefined;
    }
    const hit = allowedMerchants.some((m) => m.id === merchantId);
    add('Chain', 'c-merchant', 'mandate.checkout.allowed_merchants satisfied', merchantId === undefined ? 'fail' : flag(hit), merchantId === undefined ? 'checkout_jwt has no merchant id, so the constraint cannot be checked' : `checkout_jwt merchant ${String(merchantId)} against ${allowedMerchants.length} disclosed merchant(s)`, 'constraints.md 4.1');
  }
  return finish(checks);
}

function finish(checks: ViCheck[]): ViReport {
  const failures = checks.filter((c) => c.status === 'fail');
  return { checks, firstFailure: failures[0], failures, ok: failures.length === 0 };
}
