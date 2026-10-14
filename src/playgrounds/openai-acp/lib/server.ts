// Fixture merchant and PSP. A pure reducer: handle(state, request, now) returns new state and the exchange.
// Spec-defined outcomes use the spec's status codes and error codes. Where the spec names none, the response says
// so in `note` and uses a fixture code.

import {
  CATALOG,
  MERCHANT_ID,
  MERCHANT_ORIGIN,
  SESSION_TTL_MS,
  SHIPPING,
  clone,
} from './fixtures';
import {
  ADDRESS,
  BUYER_FIXTURE,
  CURRENCY,
  computeTotals,
  expireIfDue,
  isTerminal,
  readiness,
  toWire,
  transitionsFor,
  type Session,
} from './checkout';
import { NO_CODE_NOTE, evaluateAllowance, issueToken, validateDelegateRequest, type DelegatePaymentRequest, type TokenRecord, type Violation } from './delegate';
import { checkHandlerChoice } from './handlers';
import { checkIdempotency, markInFlight, recordResponse, type IdemStore } from './idempotency';
import { DELEGATE_PATH, type Req } from './requests';
import { HANDLERS } from './fixtures';
import type { ApiError, Exchange, SpecVersion, Status } from './types';

export type CompleteMode = 'immediate' | 'complete_in_progress' | 'in_progress' | 'pending_approval';

export interface ChargeReport {
  tokenId: string;
  amount: number;
  violations: Violation[];
  outcome: 'accepted' | 'refused';
  note?: string;
}

export interface ServerState {
  version: SpecVersion;
  seq: number;
  sessions: Record<string, Session>;
  tokens: Record<string, TokenRecord>;
  idem: IdemStore;
  completeMode: CompleteMode;
  lastCharge?: ChargeReport;
}

export const IDENTITY = 'agent_fixture';

export function newServer(version: SpecVersion): ServerState {
  return { version, seq: 1, sessions: {}, tokens: {}, idem: {}, completeMode: 'immediate' };
}

interface Out {
  status: number | '4XX';
  body: unknown;
  headers?: Record<string, string>;
  note?: string;
}

const err = (status: number | '4XX', error: ApiError, note?: string): Out => ({ status, body: error, note });

function route(req: Req): { op: string; id?: string } | null {
  const p = req.path;
  if (p === DELEGATE_PATH && req.method === 'POST') return { op: 'delegate' };
  if (p === '/checkout_sessions' && req.method === 'POST') return { op: 'create' };
  const m = /^\/checkout_sessions\/([^/]+)(\/complete|\/cancel)?$/.exec(p);
  if (!m) return null;
  const id = m[1]!;
  if (m[2] === '/complete' && req.method === 'POST') return { op: 'complete', id };
  if (m[2] === '/cancel' && req.method === 'POST') return { op: 'cancel', id };
  if (!m[2] && req.method === 'GET') return { op: 'get', id };
  if (!m[2] && req.method === 'POST') return { op: 'update', id };
  return null;
}

const asObj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

const NOT_FOUND_NOTE = 'The OpenAPI file lists 404 for GET only and gives no error body. The code not_found is a fixture.';
const STATE_NOTE = 'The spec names no error code for a call that does not fit the current status. The code invalid_state is a fixture.';

function parseItems(version: SpecVersion, body: Record<string, unknown>, required: boolean): { items: Session['items'] } | { error: Out } {
  const key = version === '2025-09-29' ? 'items' : 'line_items';
  const raw = body[key];
  if (raw === undefined) {
    return required
      ? { error: err(400, { type: 'invalid_request', code: 'missing', message: `${key} is required`, param: `$.${key}` }, 'Checkout Error.code is implementation-defined; missing is a fixture choice.') }
      : { items: [] };
  }
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: err(400, { type: 'invalid_request', code: 'invalid', message: `${key} must hold at least one item`, param: `$.${key}` }) };
  }
  const items: Session['items'] = [];
  for (const [n, r] of raw.entries()) {
    const o = asObj(r);
    const id = typeof o.id === 'string' ? o.id : '';
    if (!CATALOG.some((c) => c.id === id)) {
      return { error: err(400, { type: 'invalid_request', code: 'invalid', message: `Unknown item id ${id || '(none)'}`, param: `$.${key}[${n}].id` }) };
    }
    const quantity = version === '2025-09-29' ? Number(o.quantity) : 1;
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { error: err(400, { type: 'invalid_request', code: 'invalid', message: 'quantity must be a positive integer', param: `$.${key}[${n}].quantity` }) };
    }
    items.push({ id, quantity });
  }
  return { items };
}

function applyBody(s: Session, body: Record<string, unknown>): Session | Out {
  const v = s.version;
  const next = { ...s };
  const parsed = parseItems(v, body, false);
  if ('error' in parsed) return parsed.error;
  if (parsed.items.length) next.items = parsed.items;
  const buyer = asObj(body.buyer);
  if (typeof buyer.email === 'string') {
    next.buyer = {
      first_name: typeof buyer.first_name === 'string' ? buyer.first_name : BUYER_FIXTURE.first_name,
      last_name: typeof buyer.last_name === 'string' ? buyer.last_name : BUYER_FIXTURE.last_name,
      email: buyer.email,
    };
  }
  const addr = v === '2025-09-29' ? body.fulfillment_address : asObj(body.fulfillment_details).address;
  if (addr && typeof addr === 'object') next.address = { ...ADDRESS, ...(addr as object) };
  const optionId = v === '2025-09-29' ? body.fulfillment_option_id : asObj(Array.isArray(body.selected_fulfillment_options) ? body.selected_fulfillment_options[0] : undefined).option_id;
  if (optionId !== undefined) {
    if (optionId !== SHIPPING.id) {
      return err(400, { type: 'invalid_request', code: 'invalid', message: 'Fulfillment option does not match fulfillment_options', param: v === '2025-09-29' ? '$.fulfillment_option_id' : '$.selected_fulfillment_options[0].option_id' });
    }
    next.optionId = optionId as string;
  }
  next.messages = [];
  next.status = readiness(next);
  return next;
}

const isOut = (x: Session | Out): x is Out => 'body' in x && 'status' in x && !('items' in x);

function makeOrder(s: Session, seq: number): Record<string, unknown> {
  const base = { id: `ord_fixture_${seq}`, checkout_session_id: s.id, permalink_url: `${MERCHANT_ORIGIN}/orders/ord_fixture_${seq}` };
  return s.version === '2025-09-29' ? base : { type: 'order', ...base, status: 'created' };
}

function tokenOf(v: SpecVersion, body: Record<string, unknown>): { token?: string; handlerId?: string } {
  const pd = asObj(body.payment_data);
  if (v === '2025-09-29') return { token: typeof pd.token === 'string' ? pd.token : undefined };
  const cred = asObj(asObj(pd.instrument).credential);
  return { token: typeof cred.token === 'string' ? cred.token : undefined, handlerId: typeof pd.handler_id === 'string' ? pd.handler_id : undefined };
}

function declined(s: Session, content: string, param: string): Session {
  return {
    ...s,
    messages: [{ type: 'error', code: 'payment_declined', param, content_type: 'plain', content }],
  };
}

function doComplete(st: ServerState, s: Session, body: Record<string, unknown>, now: number): { out: Out; session: Session } {
  const v = st.version;
  if (body.payment_data === undefined) {
    return { session: s, out: err(400, { type: 'invalid_request', code: 'missing', message: 'payment_data is required', param: '$.payment_data' }, 'Checkout Error.code is implementation-defined; missing is a fixture choice.') };
  }
  if (s.status === 'authentication_required') {
    const ar = asObj(body.authentication_result);
    if (ar.outcome === undefined) {
      return {
        session: s,
        out: err('4XX', { type: 'invalid_request', code: 'requires_3ds', message: 'authentication_result is required while the session is authentication_required', param: '$.authentication_result' }, 'Spec-defined: RFC 4.4 names type invalid_request, code requires_3ds, param $.authentication_result. It says 4XX without one exact status.'),
      };
    }
  } else if (s.status !== 'ready_for_payment') {
    return { session: s, out: err('4XX', { type: 'invalid_request', code: 'invalid_state', message: `Cannot complete a session whose status is ${s.status}` }, STATE_NOTE) };
  }
  const ar = asObj(body.authentication_result);
  if (s.status === 'authentication_required' && ar.outcome !== 'authenticated' && ar.outcome !== 'attempt_acknowledged') {
    st.lastCharge = { tokenId: '', amount: 0, violations: [], outcome: 'refused', note: `authentication_result.outcome was ${String(ar.outcome)}.` };
    return { session: declined({ ...s, status: 'authentication_required' }, 'Authentication did not succeed.', '$.authentication_result.outcome'), out: { status: 200, body: null, note: 'The spec says what to send in authentication_result but not what a failed outcome does to the session. The payment_declined message is a teaching choice.' } };
  }
  const { token, handlerId } = tokenOf(v, body);
  let handlerNeedsToken = true;
  if (v === '2026-04-17') {
    const chk = checkHandlerChoice(HANDLERS, handlerId);
    if (!chk.ok) return { session: s, out: err(400, { type: 'invalid_request', code: chk.code, message: chk.message, param: chk.param }, 'Checkout Error.code is implementation-defined; invalid is a fixture choice.') };
    handlerNeedsToken = chk.needsDelegateToken;
  }
  if (!token) return { session: s, out: err(400, { type: 'invalid_request', code: 'missing', message: 'A payment token is required', param: v === '2025-09-29' ? '$.payment_data.token' : '$.payment_data.instrument.credential.token' }) };
  const amount = computeTotals(s).total;
  if (handlerNeedsToken) {
    const rec = st.tokens[token];
    if (!rec) {
      st.lastCharge = { tokenId: token, amount, violations: [], outcome: 'refused', note: 'No delegated token with this id exists.' };
      return { session: declined(s, 'The payment token is unknown.', '$.payment_data'), out: { status: 200, body: null, note: NO_CODE_NOTE } };
    }
    const violations = evaluateAllowance(rec, { amount, currency: s.currency, merchantId: MERCHANT_ID, checkoutSessionId: s.id }, now);
    if (violations.length) {
      st.lastCharge = { tokenId: token, amount, violations, outcome: 'refused' };
      return {
        session: declined(s, `The delegated token cannot be used: ${violations.map((x) => x.field).join(', ')}.`, '$.payment_data'),
        out: { status: 200, body: null, note: NO_CODE_NOTE },
      };
    }
    st.tokens[token] = { ...rec, used: true };
  }
  st.lastCharge = { tokenId: token, amount, violations: [], outcome: 'accepted', note: handlerNeedsToken ? undefined : 'This handler does not use delegate_payment, so no allowance applies here.' };
  const mode = st.completeMode;
  let to: Status = 'completed';
  if (mode !== 'immediate' && v === '2026-04-17' && mode !== 'in_progress') to = mode;
  if (mode === 'in_progress') to = 'in_progress';
  if (v === '2025-09-29' && mode !== 'immediate') to = 'in_progress';
  const next: Session = { ...s, status: to, messages: [] };
  if (to === 'completed') next.order = makeOrder(next, st.seq++);
  return { session: next, out: { status: 200, body: null } };
}

function execute(st: ServerState, op: string, id: string | undefined, req: Req, now: number): Out {
  const body = asObj(req.body);
  const v = st.version;
  if (op === 'delegate') {
    const bad = validateDelegateRequest(req.body);
    if (bad) return err(bad.status, bad.error);
    const r = req.body as DelegatePaymentRequest;
    const { record, response } = issueToken(r, `vt_fixture_${st.seq++}`, now, req.headers['Idempotency-Key']);
    st.tokens[record.id] = record;
    return { status: 201, body: response };
  }
  if (op === 'create') {
    const p = parseItems(v, body, true);
    if ('error' in p) return p.error;
    if (v === '2026-04-17') {
      for (const k of ['currency', 'capabilities'] as const) {
        if (body[k] === undefined) return err(400, { type: 'invalid_request', code: 'missing', message: `${k} is required`, param: `$.${k}` }, 'Checkout Error.code is implementation-defined; missing is a fixture choice.');
      }
    }
    let s: Session = { id: `cs_fixture_${st.seq++}`, version: v, status: 'not_ready_for_payment', currency: CURRENCY, items: p.items, createdAt: now, messages: [], expiresAt: v === '2026-04-17' ? now + SESSION_TTL_MS : undefined };
    const applied = applyBody(s, body);
    if (isOut(applied)) return applied;
    s = applied;
    st.sessions[s.id] = s;
    return { status: 201, body: toWire(s) };
  }
  const found = id ? st.sessions[id] : undefined;
  if (!found || !id) return err(404, { type: 'invalid_request', code: 'not_found', message: 'No such checkout session' }, NOT_FOUND_NOTE);
  const cur = expireIfDue(found, now);
  st.sessions[id] = cur;
  if (op === 'get') return { status: 200, body: toWire(cur) };
  if (op === 'cancel') {
    if (isTerminal(cur.status)) {
      return err(405, { type: 'invalid_request', code: 'not_cancelable', message: `Session is ${cur.status}` }, 'Spec-defined: 405 when already completed or canceled. The code not_cancelable is a fixture, and the spec does not say how expired is treated.');
    }
    const s: Session = { ...cur, status: 'canceled' };
    st.sessions[id] = s;
    return { status: 200, body: toWire(s) };
  }
  if (op === 'update') {
    if (!['not_ready_for_payment', 'ready_for_payment', 'incomplete'].includes(cur.status)) {
      return err('4XX', { type: 'invalid_request', code: 'invalid_state', message: `Cannot update a session whose status is ${cur.status}` }, STATE_NOTE);
    }
    const applied = applyBody(cur, body);
    if (isOut(applied)) return applied;
    st.sessions[id] = applied;
    return { status: 200, body: toWire(applied) };
  }
  const { out, session } = doComplete(st, cur, body, now);
  if (out.status === 200) {
    st.sessions[id] = session;
    return { ...out, body: toWire(session) };
  }
  return out;
}

export interface Result {
  state: ServerState;
  exchange: Exchange;
}

function toExchange(req: Req, out: Out, extra: Record<string, string>): Exchange {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra, ...(out.headers ?? {}) };
  if (req.headers['Request-Id']) headers['Request-Id'] = req.headers['Request-Id'];
  return {
    method: req.method,
    path: req.path,
    requestHeaders: req.headers,
    requestBody: req.body,
    status: out.status,
    responseHeaders: headers,
    responseBody: out.body,
    note: out.note,
  };
}

/** Handle one request at simulated time `now` (ms). */
export function handle(state0: ServerState, req: Req, now: number): Result {
  const state = clone(state0);
  const r = route(req);
  if (!r) {
    return { state, exchange: toExchange(req, err(404, { type: 'invalid_request', code: 'not_found', message: 'No such route' }, NOT_FOUND_NOTE), {}) };
  }
  const key = req.headers['Idempotency-Key'];
  const newer = state.version === '2026-04-17';
  const extra: Record<string, string> = newer && key ? { 'Idempotency-Key': key } : {};
  if (req.method === 'POST') {
    const idemInput = { identity: IDENTITY, endpoint: req.path, key, body: req.body ?? {}, now };
    const o = checkIdempotency(state.idem, { ...idemInput, version: state.version, keyRequired: newer || r.op === 'delegate' });
    if (o.kind === 'error') {
      return { state, exchange: toExchange(req, { status: o.status, body: o.error, headers: o.headers, note: 'Spec-defined idempotency error (RFC section 6.4).' }, extra) };
    }
    if (o.kind === 'replay') {
      const replay: Out = { status: o.response.status, body: o.response.body, headers: { ...o.response.headers, ...(newer ? { 'Idempotent-Replayed': 'true' } : {}) }, note: newer ? 'Replay: the original status and body, no side effects run again.' : 'Replay of the stored response. The 2025-09-29 files define no Idempotent-Replayed header, so none is sent (teaching simplification: RFC section 6 behavior applied).' };
      return { state, exchange: toExchange(req, replay, extra) };
    }
    const out = execute(state, r.op, r.id, req, now);
    state.idem = recordResponse(state.idem, idemInput, { status: out.status, headers: { 'Content-Type': 'application/json' }, body: out.body });
    return { state, exchange: toExchange(req, out, extra) };
  }
  const out = execute(state, r.op, r.id, req, now);
  return { state, exchange: toExchange(req, out, extra) };
}

/** Mark a request's key as still running, so a duplicate gets 409 idempotency_in_flight. */
export function holdInFlight(state0: ServerState, req: Req, now: number): ServerState {
  const state = clone(state0);
  state.idem = markInFlight(state.idem, { identity: IDENTITY, endpoint: req.path, key: req.headers['Idempotency-Key'], body: req.body ?? {}, now });
  return state;
}

/** Expire any session whose expires_at has passed (2026-04-17). The transition is inferred; no API call causes it. */
export function tick(state0: ServerState, now: number): { state: ServerState; expired: string[] } {
  const state = clone(state0);
  const expired: string[] = [];
  for (const [id, s] of Object.entries(state.sessions)) {
    const n = expireIfDue(s, now);
    if (n.status !== s.status) {
      state.sessions[id] = n;
      expired.push(id);
    }
  }
  return { state, expired };
}

/** Merchant-side events that move a session without an agent call. Only edges in the transition table with kind "event". */
export function applyEvent(state0: ServerState, sessionId: string, to: Status): { state: ServerState; text: string } | { error: string } {
  const state = clone(state0);
  const s = state.sessions[sessionId];
  if (!s) return { error: 'No such session.' };
  const t = transitionsFor(state.version, s.status).find((x) => x.to === to && x.kind === 'event');
  if (!t) return { error: `No event moves ${s.status} to ${to} in spec version ${state.version}.` };
  const next: Session = { ...s, status: to };
  if (to === 'completed') next.order = makeOrder(next, state.seq++);
  state.sessions[sessionId] = next;
  return { state, text: `Merchant event: ${s.status} to ${to} (${t.basis}).` };
}

