/**
 * Constraint evaluation for AP2 v0.2 open mandates, following the "Evaluation" paragraphs in
 * `docs/ap2/checkout_mandate.md` and `docs/ap2/payment_mandate.md`, and the rule in
 * `docs/ap2/agent_authorization.md` that any unknown constraint MUST be treated as failing.
 * Constraints are evaluated on the open mandate after disclosures are resolved, so `allowed`
 * and `acceptable_items` hold only the revealed elements.
 */
import { CURRENCY_EXPONENT, formatMinor } from './fixtures';
import { jsonEqual } from './encoding';
import {
  CHECKOUT_CONSTRAINT_TYPES,
  PAYMENT_CONSTRAINT_TYPES,
  type AnyConstraint,
  type Ap2ErrorCode,
  type Checkout,
  type Frequency,
  type LineItemsConstraint,
  type Merchant,
  type PaymentInstrument,
  type PaymentMandate,
  type Pisp,
} from './types';

export interface ConstraintResult {
  type: string;
  ok: boolean;
  /** False when the verifier does not recognize the constraint type. */
  known: boolean;
  detail: string;
  /** A spec ambiguity that affected this result, shown to the reader. */
  quirk?: string;
}

export interface PaymentHistory {
  /** Sum of amounts from previously closed Payment Mandates under this open mandate, minor units. */
  spentMinor: number;
  /** Number of earlier accepted presentations. */
  occurrences: number;
  /** Unix epoch seconds of the previous presentation, if any. */
  lastPresentedAt?: number;
}

export type BudgetUnit = 'minor' | 'major';

export interface PaymentEvalOptions {
  /** Unix epoch seconds. */
  now: number;
  history: PaymentHistory;
  /** How to read `payment.budget` `max`, which the schema types as a number with no unit. */
  budgetUnit: BudgetUnit;
  /** Digest of the open Checkout Mandate present in the checkout chain, if any. */
  openCheckoutDigest?: string;
}

const isPlaceholder = (v: unknown): boolean => !!v && typeof v === 'object' && '...' in (v as Record<string, unknown>);

function revealed<T>(list: unknown): T[] {
  return Array.isArray(list) ? (list.filter((v) => !isPlaceholder(v)) as T[]) : [];
}

export function isKnownConstraintType(type: string): boolean {
  return (CHECKOUT_CONSTRAINT_TYPES as readonly string[]).includes(type) || (PAYMENT_CONSTRAINT_TYPES as readonly string[]).includes(type);
}

// ------------------------------------------------------------------ max flow for checkout.line_items

/** Edmonds-Karp on a dense capacity matrix. Small graphs only. */
export function maxFlow(capacity: number[][], source: number, sink: number): number {
  const n = capacity.length;
  const residual = capacity.map((row) => [...row]);
  let flow = 0;
  for (;;) {
    const parent = new Array<number>(n).fill(-1);
    parent[source] = source;
    const queue = [source];
    while (queue.length && parent[sink] === -1) {
      const u = queue.shift() as number;
      for (let v = 0; v < n; v++) {
        if (parent[v] === -1 && (residual[u]?.[v] ?? 0) > 0) {
          parent[v] = u;
          queue.push(v);
        }
      }
    }
    if (parent[sink] === -1) return flow;
    let push = Infinity;
    for (let v = sink; v !== source; v = parent[v] as number) {
      const u = parent[v] as number;
      push = Math.min(push, (residual[u] as number[])[v] as number);
    }
    for (let v = sink; v !== source; v = parent[v] as number) {
      const u = parent[v] as number;
      (residual[u] as number[])[v] = ((residual[u] as number[])[v] as number) - push;
      (residual[v] as number[])[u] = ((residual[v] as number[])[u] as number) + push;
    }
    flow += push;
  }
}

/**
 * The graph from `checkout_mandate.md`: source to each requirement (capacity = quantity), each
 * requirement to each checkout item id it accepts (unbounded), each item id to sink (capacity =
 * total quantity of that id). Met when max flow equals both totals.
 */
export function evaluateLineItems(constraint: LineItemsConstraint, checkout: Checkout): { ok: boolean; flow: number; required: number; inCheckout: number } {
  const reqs = Array.isArray(constraint.items) ? constraint.items : [];
  const qtyById = new Map<string, number>();
  for (const line of checkout.line_items) qtyById.set(line.item.id, (qtyById.get(line.item.id) ?? 0) + line.quantity);
  const ids = [...qtyById.keys()];
  const n = 2 + reqs.length + ids.length;
  const source = 0;
  const sink = n - 1;
  const cap = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const BIG = 1e9;
  reqs.forEach((r, i) => {
    (cap[source] as number[])[1 + i] = Math.max(0, Number(r.quantity) || 0);
    const accepted = new Set(revealed<{ id: string }>(r.acceptable_items).map((a) => a.id));
    ids.forEach((id, j) => {
      if (accepted.has(id)) (cap[1 + i] as number[])[1 + reqs.length + j] = BIG;
    });
  });
  ids.forEach((id, j) => {
    (cap[1 + reqs.length + j] as number[])[sink] = qtyById.get(id) ?? 0;
  });
  const flow = maxFlow(cap, source, sink);
  const required = reqs.reduce((s, r) => s + Math.max(0, Number(r.quantity) || 0), 0);
  const inCheckout = [...qtyById.values()].reduce((s, q) => s + q, 0);
  return { ok: reqs.length > 0 && flow === required && flow === inCheckout, flow, required, inCheckout };
}

// ------------------------------------------------------------------ checkout constraints

export function evaluateCheckoutConstraint(c: AnyConstraint, checkout: Checkout): ConstraintResult {
  switch (c.type) {
    case 'checkout.allowed_merchants': {
      const allowed = revealed<Merchant>((c as { allowed?: unknown }).allowed);
      if (allowed.length === 0) {
        return { type: c.type, known: true, ok: false, detail: '`allowed` has no revealed elements, so the constraint is invalid.' };
      }
      const hit = allowed.some((m) => m.id === checkout.merchant.id);
      return {
        type: c.type,
        known: true,
        ok: hit,
        detail: hit
          ? `Merchant ${checkout.merchant.id} is among the ${allowed.length} revealed element(s) of \`allowed\`.`
          : `Merchant ${checkout.merchant.id} is not among the revealed elements of \`allowed\`.`,
      };
    }
    case 'checkout.line_items': {
      const r = evaluateLineItems(c as LineItemsConstraint, checkout);
      return {
        type: c.type,
        known: true,
        ok: r.ok,
        detail: `Max flow ${r.flow}; required quantity ${r.required}; checkout quantity ${r.inCheckout}. ${
          r.ok ? 'Every requirement is met and every checkout item is used once.' : 'A requirement is unmet or the checkout holds an item no requirement accepts.'
        }`,
      };
    }
    default:
      return unknownResult(c);
  }
}

export function evaluateCheckoutConstraints(constraints: AnyConstraint[], checkout: Checkout): ConstraintResult[] {
  return (Array.isArray(constraints) ? constraints : []).map((c) => evaluateCheckoutConstraint(c, checkout));
}

// ------------------------------------------------------------------ payment constraints

/** Earliest time a new presentation is allowed after `last` for a frequency (UTC calendar arithmetic). */
export function nextAllowedAt(last: number, frequency: Frequency): number {
  const d = new Date(last * 1000);
  switch (frequency) {
    case 'ON_DEMAND':
      return last;
    case 'DAILY':
      d.setUTCDate(d.getUTCDate() + 1);
      break;
    case 'WEEKLY':
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case 'BIWEEKLY':
      d.setUTCDate(d.getUTCDate() + 14);
      break;
    case 'MONTHLY':
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
    case 'QUARTERLY':
      d.setUTCMonth(d.getUTCMonth() + 3);
      break;
    case 'ANNUALLY':
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
  }
  return Math.floor(d.getTime() / 1000);
}

function unknownResult(c: AnyConstraint): ConstraintResult {
  return {
    type: String(c.type),
    known: false,
    ok: false,
    detail: `Unknown constraint type "${String(c.type)}". The spec says any unknown constraint MUST be treated as failing evaluation.`,
  };
}

export function evaluatePaymentConstraint(c: AnyConstraint, m: PaymentMandate, opts: PaymentEvalOptions): ConstraintResult {
  const t = c.type;
  switch (t) {
    case 'payment.amount_range': {
      const { currency, max, min } = c as { currency?: string; max?: unknown; min?: unknown };
      const nonInteger = [max, min].filter((v) => v !== undefined && !Number.isInteger(v));
      if (nonInteger.length) {
        return {
          type: t,
          known: true,
          ok: false,
          detail: `\`min\` or \`max\` is not an integer (${nonInteger.join(', ')}). The verifier cannot tell which amount the user approved.`,
          quirk:
            'The schema types `min` and `max` as integers in minor units, but the example in payment_mandate.md writes 100.50 and 10.00. The spec does not say how to read a decimal; this simulation refuses to guess.',
        };
      }
      if (m.payment_amount?.currency !== currency) {
        return { type: t, known: true, ok: false, detail: `Currency ${String(m.payment_amount?.currency)} does not match ${String(currency)}.` };
      }
      const amt = m.payment_amount.amount;
      const okMin = min === undefined || amt >= (min as number);
      const okMax = typeof max === 'number' && amt <= max;
      return {
        type: t,
        known: true,
        ok: okMin && okMax,
        detail: `payment_amount ${amt} (${formatMinor(amt, m.payment_amount.currency)}) against min ${min === undefined ? 'none' : String(min)} and max ${String(max)} (minor units).`,
      };
    }
    case 'payment.budget': {
      const { currency, max } = c as { currency?: string; max?: unknown };
      if (m.payment_amount?.currency !== currency) {
        return { type: t, known: true, ok: false, detail: `Currency ${String(m.payment_amount?.currency)} does not match ${String(currency)}.` };
      }
      if (typeof max !== 'number' || !Number.isFinite(max)) {
        return { type: t, known: true, ok: false, detail: '`max` is not a number.' };
      }
      const asMinor = max;
      const asMajor = Math.round(max * 10 ** CURRENCY_EXPONENT);
      const total = opts.history.spentMinor + m.payment_amount.amount;
      const okMinor = total <= asMinor;
      const okMajor = total <= asMajor;
      const limit = opts.budgetUnit === 'minor' ? asMinor : asMajor;
      const ok = opts.budgetUnit === 'minor' ? okMinor : okMajor;
      return {
        type: t,
        known: true,
        ok,
        detail: `Spent before ${opts.history.spentMinor} + this payment ${m.payment_amount.amount} = ${total} minor units, limit ${limit} (reading \`max\` ${max} as ${opts.budgetUnit} units).`,
        quirk:
          okMinor === okMajor
            ? 'The schema types `max` as a number without a unit (doc example 1000.00). Both readings give the same result here.'
            : `The schema types \`max\` as a number without a unit (doc example 1000.00). Read as minor units the result is ${okMinor ? 'pass' : 'fail'}; read as major units it is ${okMajor ? 'pass' : 'fail'}.`,
      };
    }
    case 'payment.allowed_payees': {
      const allowed = revealed<Merchant>((c as { allowed?: unknown }).allowed);
      const ok = allowed.some((p) => p.id === m.payee?.id);
      return {
        type: t,
        known: true,
        ok,
        detail: allowed.length === 0 ? '`allowed` has no revealed elements.' : ok ? `Payee ${m.payee.id} is in \`allowed\`.` : `Payee ${String(m.payee?.id)} is not in the revealed \`allowed\` list.`,
      };
    }
    case 'payment.allowed_payment_instruments': {
      const allowed = revealed<PaymentInstrument>((c as { allowed?: unknown }).allowed);
      const ok = allowed.some((p) => p.id === m.payment_instrument?.id && p.type === m.payment_instrument?.type);
      return {
        type: t,
        known: true,
        ok,
        detail: ok ? `Instrument ${m.payment_instrument.id} is in \`allowed\`.` : `Instrument ${String(m.payment_instrument?.id)} is not in the revealed \`allowed\` list.`,
      };
    }
    case 'payment.allowed_pisps': {
      const allowed = revealed<Pisp>((c as { allowed?: unknown }).allowed);
      const ok = !!m.pisp && allowed.some((p) => jsonEqual(p, m.pisp));
      return { type: t, known: true, ok, detail: m.pisp ? (ok ? `PISP ${m.pisp.domain_name} is in \`allowed\`.` : `PISP ${m.pisp.domain_name} is not in \`allowed\`.`) : 'The closed mandate names no `pisp`.' };
    }
    case 'payment.execution_date': {
      const { not_before, not_after } = c as { not_before?: string; not_after?: string };
      const when = m.execution_date ? Date.parse(m.execution_date) : opts.now * 1000;
      const label = m.execution_date ?? 'absent (immediate execution)';
      const okBefore = !not_before || when >= Date.parse(not_before);
      const okAfter = !not_after || when <= Date.parse(not_after);
      return { type: t, known: true, ok: okBefore && okAfter && Number.isFinite(when), detail: `execution_date ${label} against window ${not_before ?? 'open'} to ${not_after ?? 'open'}.` };
    }
    case 'payment.agent_recurrence': {
      const { frequency, max_occurrences } = c as { frequency?: Frequency; max_occurrences?: number };
      const current = opts.history.occurrences + 1;
      const okCount = max_occurrences === undefined || current <= max_occurrences;
      const last = opts.history.lastPresentedAt;
      const next = last === undefined || !frequency ? undefined : nextAllowedAt(last, frequency);
      const okGap = next === undefined || opts.now >= next;
      return {
        type: t,
        known: true,
        ok: okCount && okGap,
        detail: `Occurrence ${current} of ${max_occurrences ?? 'unlimited'}; ${
          next === undefined ? 'no earlier presentation.' : okGap ? `far enough from the previous presentation for ${frequency}.` : `too soon after the previous presentation for ${frequency}.`
        }`,
        quirk: 'The spec does not define how to measure a frequency period or who stores the history. This simulation uses UTC calendar steps and history you enter.',
      };
    }
    case 'payment.reference': {
      const id = (c as { conditional_transaction_id?: string }).conditional_transaction_id;
      const ok = !!opts.openCheckoutDigest && id === opts.openCheckoutDigest;
      return {
        type: t,
        known: true,
        ok,
        detail: opts.openCheckoutDigest
          ? ok
            ? '`conditional_transaction_id` matches the open Checkout Mandate in the checkout chain.'
            : '`conditional_transaction_id` does not match the open Checkout Mandate in the checkout chain.'
          : 'No open Checkout Mandate is in the checkout chain to compare with.',
      };
    }
    default:
      return unknownResult(c);
  }
}

export function evaluatePaymentConstraints(constraints: AnyConstraint[], m: PaymentMandate, opts: PaymentEvalOptions): ConstraintResult[] {
  return (Array.isArray(constraints) ? constraints : []).map((c) => evaluatePaymentConstraint(c, m, opts));
}

/** A failed or unknown constraint yields `unresolved_constraint` (agent_authorization.md, "Errors"). */
export function constraintOutcome(results: ConstraintResult[]): Ap2ErrorCode | null {
  return results.some((r) => !r.ok) ? 'unresolved_constraint' : null;
}
