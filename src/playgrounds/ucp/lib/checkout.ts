// Checkout session state machine, following shopping/checkout/index.md at v2026-08-25: "Checkout Status
// Lifecycle", "Status Values", "Error Handling", "Continue URL", "Accepted completion" and "Operations".
// The business decides the status; the simulator plays the business.
import { CATALOG, DEFAULT_TTL_MS, TAX_BPS, type InstrumentOption } from './fixtures';
import { validateSubmission, type ResolvedHandler } from './payment';
import { type CheckoutStatus, type UcpMessage } from './types';

export interface LineItemInput {
  itemId: string;
  quantity: number;
}

/** What the agent has supplied (Update Checkout is a full replacement of these fields). */
export interface CheckoutData {
  lineItems: LineItemInput[];
  buyerEmail: string;
}

/** Business rules the simulated merchant applies, plus failure injection switches. */
export interface BusinessPolicy {
  /** The business needs a delivery window it cannot collect by API: `requires_buyer_input`. */
  requireDeliveryWindow: boolean;
  /** Orders whose total exceeds this (minor units) need buyer review: `requires_buyer_review`. */
  reviewThreshold: number;
  /** Complete Checkout is accepted for asynchronous processing (`complete_in_progress`). */
  asyncCompletion: boolean;
  /** Failure injection: the business forgets `continue_url` (a spec violation when escalating). */
  omitContinueUrl: boolean;
}

export const DEFAULT_POLICY: BusinessPolicy = {
  requireDeliveryWindow: false,
  reviewThreshold: 50000,
  asyncCompletion: false,
  omitContinueUrl: false,
};

/** Facts from negotiation and payment resolution that change what the business accepts. */
export interface SessionContext {
  splitPayments: boolean;
  /** `dev.ucp.common.payment.ap2_mandate` is in the intersection: the session is security locked. */
  ap2Locked: boolean;
  handlers: ResolvedHandler[];
  businessOrigin: string;
}

export interface Transition {
  at: number;
  event: string;
  from: CheckoutStatus | null;
  to: CheckoutStatus;
  note: string;
}

export interface CheckoutSession {
  id: string;
  status: CheckoutStatus;
  currency: 'USD';
  data: CheckoutData;
  createdAt: number;
  expiresAt: number;
  messages: UcpMessage[];
  continueUrl?: string;
  order?: { id: string; label: string; permalink_url: string };
  submitted?: InstrumentOption[];
  history: Transition[];
}

export type Outcome = 'applied' | 'rejected' | 'unchanged';

export interface StepResult {
  session: CheckoutSession;
  outcome: Outcome;
  note: string;
}

/**
 * Codes the simulator uses where the spec requires an error message but names no code. The UI labels these
 * as a teaching simplification.
 */
export const FIXTURE_CODES: readonly string[] = ['update_not_allowed'];

export const TERMINAL: readonly CheckoutStatus[] = ['completed', 'canceled'];

export function isTerminal(status: CheckoutStatus): boolean {
  return TERMINAL.includes(status);
}

export interface Totals {
  subtotal: number;
  tax: number;
  total: number;
}

export function computeTotals(lineItems: LineItemInput[]): Totals {
  const subtotal = lineItems.reduce((sum, li) => {
    const item = CATALOG.find((c) => c.id === li.itemId);
    return sum + (item ? item.price * li.quantity : 0);
  }, 0);
  const tax = Math.round((subtotal * TAX_BPS) / 10000);
  return { subtotal, tax, total: subtotal + tax };
}

export function formatMoney(minor: number): string {
  return `$${(minor / 100).toFixed(2)}`;
}

/** Messages and status the business derives from the current data. */
export function evaluate(
  data: CheckoutData,
  policy: BusinessPolicy,
): { status: CheckoutStatus; messages: UcpMessage[] } {
  const messages: UcpMessage[] = [];
  if (data.lineItems.length === 0) {
    messages.push({
      type: 'error',
      code: 'field_required',
      severity: 'recoverable',
      path: '$.line_items',
      content: 'Add at least one line item',
    });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.buyerEmail)) {
    messages.push({
      type: 'error',
      code: 'field_required',
      severity: 'recoverable',
      path: '$.buyer.email',
      content: 'A buyer email address is needed',
    });
  }
  if (policy.requireDeliveryWindow) {
    messages.push({
      type: 'error',
      code: 'schedule_delivery',
      severity: 'requires_buyer_input',
      content: 'The buyer picks a delivery window on the store site',
    });
  }
  const { total } = computeTotals(data.lineItems);
  if (total > policy.reviewThreshold) {
    messages.push({
      type: 'error',
      code: 'high_value_order',
      severity: 'requires_buyer_review',
      content: `Orders above ${formatMoney(policy.reviewThreshold)} need buyer review`,
    });
  }
  const escalate = messages.some((m) => m.severity === 'requires_buyer_input' || m.severity === 'requires_buyer_review');
  const recoverable = messages.some((m) => m.severity === 'recoverable');
  const status: CheckoutStatus = escalate ? 'requires_escalation' : recoverable ? 'incomplete' : 'ready_for_complete';
  return { status, messages };
}

/** Server-state backed handoff URL, the format the spec recommends. */
export function continueUrlFor(origin: string, id: string): string {
  return `${origin}/checkout-sessions/${id}`;
}

function withStatus(
  session: CheckoutSession,
  to: CheckoutStatus,
  event: string,
  note: string,
  now: number,
  policy: BusinessPolicy,
  ctx: SessionContext,
  messages: UcpMessage[],
): CheckoutSession {
  const terminal = isTerminal(to);
  const next: CheckoutSession = {
    ...session,
    status: to,
    messages,
    history: [...session.history, { at: now, event, from: session.status, to, note }],
  };
  // continue_url: MUST for requires_escalation, SHOULD for other non-terminal states, SHOULD be omitted when terminal.
  if (terminal || policy.omitContinueUrl) delete next.continueUrl;
  else next.continueUrl = continueUrlFor(ctx.businessOrigin, session.id);
  return next;
}

/** Create Checkout. TTL defaults to 6 hours from creation. */
export function createCheckout(
  id: string,
  data: CheckoutData,
  policy: BusinessPolicy,
  ctx: SessionContext,
  now: number,
): StepResult {
  const { status, messages } = evaluate(data, policy);
  const seed: CheckoutSession = {
    id,
    status,
    currency: 'USD',
    data,
    createdAt: now,
    expiresAt: now + DEFAULT_TTL_MS,
    messages: [],
    history: [],
  };
  const created = withStatus(seed, status, 'create_checkout', 'Session created', now, policy, ctx, messages);
  created.history = [{ at: now, event: 'create_checkout', from: null, to: status, note: 'Session created' }];
  return { session: created, outcome: 'applied', note: `Created with status ${status}` };
}

/** Expire the session when the clock passes `expires_at`. Returns the same object when nothing changes. */
export function expireIfDue(session: CheckoutSession, now: number, policy: BusinessPolicy, ctx: SessionContext): StepResult {
  if (isTerminal(session.status) || now < session.expiresAt) {
    return { session, outcome: 'unchanged', note: 'Not expired' };
  }
  return {
    session: withStatus(session, 'canceled', 'expired', 'expires_at passed; the session is invalid', now, policy, ctx, []),
    outcome: 'applied',
    note: 'The session expired and is now canceled',
  };
}

/** Update Checkout: a full replacement of the agent-supplied data. */
export function updateCheckout(
  session: CheckoutSession,
  data: CheckoutData,
  policy: BusinessPolicy,
  ctx: SessionContext,
  now: number,
): StepResult {
  const due = expireIfDue(session, now, policy, ctx);
  if (due.outcome === 'applied') return { ...due, outcome: 'rejected' };
  if (isTerminal(session.status)) {
    return { session, outcome: 'rejected', note: `A ${session.status} session cannot be updated` };
  }
  if (session.status === 'complete_in_progress') {
    const msg: UcpMessage = {
      type: 'error',
      code: 'update_not_allowed',
      severity: 'recoverable',
      content: 'Completion is in progress; the checkout was left unchanged',
    };
    return {
      session: { ...session, messages: [...session.messages.filter((m) => m.code !== msg.code), msg] },
      outcome: 'unchanged',
      note: 'Update Checkout is not permitted during complete_in_progress; the business returns the current checkout with a recoverable error',
    };
  }
  const { status, messages } = evaluate(data, policy);
  const next = withStatus({ ...session, data }, status, 'update_checkout', 'Full replacement applied', now, policy, ctx, messages);
  return { session: next, outcome: 'applied', note: `Updated; status is ${status}` };
}

export interface CompleteInput {
  instruments: InstrumentOption[];
  /** Whether the request carries `ap2.checkout_mandate`. */
  checkoutMandate: boolean;
}

/** Complete Checkout: places the order from `ready_for_complete`. */
export function completeCheckout(
  session: CheckoutSession,
  input: CompleteInput,
  policy: BusinessPolicy,
  ctx: SessionContext,
  now: number,
  orderId: string,
): StepResult {
  const due = expireIfDue(session, now, policy, ctx);
  if (due.outcome === 'applied') return { ...due, outcome: 'rejected' };
  if (session.status === 'complete_in_progress') {
    return {
      session,
      outcome: 'rejected',
      note: 'A new Complete Checkout must not start during complete_in_progress; use Get Checkout instead',
    };
  }
  if (session.status !== 'ready_for_complete') {
    return {
      session,
      outcome: 'rejected',
      note: `Complete Checkout places the order only from ready_for_complete (status is ${session.status})`,
    };
  }
  const failures: UcpMessage[] = [];
  if (ctx.ap2Locked && !input.checkoutMandate) {
    failures.push({
      type: 'error',
      code: 'mandate_required',
      severity: 'recoverable',
      path: '$.ap2.checkout_mandate',
      content: 'AP2 was negotiated, so the request needs ap2.checkout_mandate',
    });
  }
  failures.push(...validateSubmission(input.instruments, ctx.handlers, ctx.splitPayments));
  if (failures.length > 0) {
    return {
      session: { ...session, messages: failures },
      outcome: 'unchanged',
      note: `Rejected with ${[...new Set(failures.map((f) => f.code))].join(', ')}; the status stays ready_for_complete`,
    };
  }
  const submitted = input.instruments;
  if (policy.asyncCompletion) {
    const next = withStatus(
      { ...session, submitted },
      'complete_in_progress',
      'complete_checkout',
      'Accepted for asynchronous processing; no order yet',
      now,
      policy,
      ctx,
      [],
    );
    return { session: next, outcome: 'applied', note: 'Accepted; status is complete_in_progress' };
  }
  return placeOrder({ ...session, submitted }, 'complete_checkout', policy, ctx, now, orderId);
}

function placeOrder(
  session: CheckoutSession,
  event: string,
  policy: BusinessPolicy,
  ctx: SessionContext,
  now: number,
  orderId: string,
): StepResult {
  const next = withStatus(session, 'completed', event, 'Order placed; the session is now immutable', now, policy, ctx, []);
  next.order = { id: orderId, label: `#${orderId.replace(/\D/g, '').slice(-4) || '1001'}`, permalink_url: `${ctx.businessOrigin}/orders/${orderId}` };
  return { session: next, outcome: 'applied', note: `Completed; order ${orderId} created` };
}

/** The business finishes asynchronous processing (observed by the agent through Get Checkout). */
export function finishProcessing(
  session: CheckoutSession,
  policy: BusinessPolicy,
  ctx: SessionContext,
  now: number,
  orderId: string,
): StepResult {
  if (session.status !== 'complete_in_progress') {
    return { session, outcome: 'rejected', note: 'Only a complete_in_progress session has processing to finish' };
  }
  return placeOrder(session, 'business_processing_done', policy, ctx, now, orderId);
}

/** The buyer opens `continue_url` and places the order on the business UI. */
export function buyerCompletesHandoff(
  session: CheckoutSession,
  policy: BusinessPolicy,
  ctx: SessionContext,
  now: number,
  orderId: string,
): StepResult {
  if (session.status !== 'requires_escalation') {
    return { session, outcome: 'rejected', note: 'Handoff applies to a requires_escalation session' };
  }
  if (!session.continueUrl) {
    return {
      session,
      outcome: 'rejected',
      note: 'Spec violation: requires_escalation without continue_url leaves the agent no way to hand off',
    };
  }
  return placeOrder(session, 'buyer_finished_on_continue_url', policy, ctx, now, orderId);
}

/** Cancel Checkout: any session not `completed` or `canceled` should be cancelable. */
export function cancelCheckout(session: CheckoutSession, policy: BusinessPolicy, ctx: SessionContext, now: number): StepResult {
  if (isTerminal(session.status)) {
    return {
      session,
      outcome: 'rejected',
      note: `A ${session.status} session cannot be canceled; the business should return an error`,
    };
  }
  const note =
    session.status === 'complete_in_progress'
      ? 'Canceled while in progress (only after fallback and handoff are exhausted; cancellation can race completion)'
      : 'Canceled by the agent';
  return { session: withStatus(session, 'canceled', 'cancel_checkout', note, now, policy, ctx, []), outcome: 'applied', note };
}

/** Spec rules a response must satisfy; used to flag injected faults. */
export function checkInvariants(session: CheckoutSession): string[] {
  const problems: string[] = [];
  if (session.status === 'requires_escalation') {
    if (!session.continueUrl) problems.push('requires_escalation must carry continue_url');
    if (!session.messages.some((m) => m.severity === 'requires_buyer_input' || m.severity === 'requires_buyer_review')) {
      problems.push('requires_escalation needs a message with requires_buyer_input or requires_buyer_review severity');
    }
  }
  if (session.continueUrl && !session.continueUrl.startsWith('https://')) problems.push('continue_url must be absolute HTTPS');
  if (session.status === 'completed' && !session.order) problems.push('completed must include order');
  if (session.status === 'complete_in_progress' && session.order) problems.push('complete_in_progress must not include order');
  return problems;
}

/** Idempotency: same key and body replays the cached result; same key with a different body is 409 Conflict. */
export type IdempotencyVerdict = 'first' | 'replay' | 'conflict';

export function checkIdempotency(store: Map<string, string>, key: string, body: string): IdempotencyVerdict {
  const seen = store.get(key);
  if (seen === undefined) {
    store.set(key, body);
    return 'first';
  }
  return seen === body ? 'replay' : 'conflict';
}
