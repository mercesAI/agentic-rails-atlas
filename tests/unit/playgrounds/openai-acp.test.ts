import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  TRANSITIONS,
  computeTotals,
  expireIfDue,
  hasSoldOut,
  isTerminal,
  messagesFor,
  priceOf,
  readiness,
  toWire,
  transitionsFor,
  type Session,
} from '@/playgrounds/openai-acp/lib/checkout';
import {
  buildDelegateRequest,
  evaluateAllowance,
  issueToken,
  toIso,
  validateDelegateRequest,
} from '@/playgrounds/openai-acp/lib/delegate';
import { bytesToHex, hexToBytes } from '@/lib/playground/bytes';
import { clone, pretty } from '@/lib/playground/util';
import { CATALOG, DISCOVERY, HANDLERS, MERCHANT_ID, OTHER_MERCHANT_ID, SOLD_OUT_ITEM_ID, T0 } from '@/playgrounds/openai-acp/lib/fixtures';
import { checkHandlerChoice, discoveryFor, selectHandlers, validateDiscovery } from '@/playgrounds/openai-acp/lib/handlers';
import {
  RETENTION_MS,
  canonicalJson,
  checkIdempotency,
  markInFlight,
  recordResponse,
  sameBody,
  scopeKey,
  type IdemStore,
} from '@/playgrounds/openai-acp/lib/idempotency';
import {
  DELEGATE_PATH,
  buildRequest,
  cancelBody,
  completeBody,
  createBody,
  headersFor,
  updateBody,
} from '@/playgrounds/openai-acp/lib/requests';
import { applyEvent, handle, holdInFlight, newServer, tick, type ServerState } from '@/playgrounds/openai-acp/lib/server';
import { STATUSES, exampleLabel } from '@/playgrounds/openai-acp/lib/types';
import {
  SIGNATURE_PATTERN,
  TOLERANCE_SECONDS,
  generateSecret,
  orderEvent,
  parseSignatureHeader,
  signWebhook,
  signedPayload,
  verifyWebhook,
} from '@/playgrounds/openai-acp/lib/webhook';
import type { SpecVersion } from '@/playgrounds/openai-acp/lib/types';

const VENDOR = 'research/vendor/acp/spec';
const haveVendor = existsSync(`${VENDOR}/2026-04-17/json-schema/schema.agentic_checkout.json`);

// Minimal JSON Schema walker: required keys, unknown keys under additionalProperties:false, enums, $ref and allOf.
type Schema = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
function propNames(defs: Schema, schema: Schema): string[] {
  if (schema.$ref) return propNames(defs, defs[String(schema.$ref).split('/').pop()!]);
  return [...Object.keys(schema.properties ?? {}), ...(schema.allOf ?? []).flatMap((s: Schema) => propNames(defs, s))];
}
function check(defs: Schema, schema: Schema, value: unknown, path: string, errors: string[], known: Set<string> = new Set()): void {
  if (schema.$ref) return check(defs, defs[String(schema.$ref).split('/').pop()!], value, path, errors, known);
  if (schema.allOf) {
    const union = new Set([...known, ...propNames(defs, schema)]);
    for (const s of schema.allOf) check(defs, s, value, path, errors, union);
  }
  if (schema.oneOf) {
    const results = schema.oneOf.map((s: Schema) => {
      const e: string[] = [];
      check(defs, s, value, path, e);
      return e;
    });
    if (!results.some((e: string[]) => e.length === 0)) errors.push(`${path}: no oneOf branch matched`);
    return;
  }
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path}: ${String(value)} not in enum`);
  if (schema.const !== undefined && schema.const !== value) errors.push(`${path}: const mismatch`);
  if (Array.isArray(value) && schema.items) value.forEach((v, i) => check(defs, schema.items, v, `${path}[${i}]`, errors));
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    for (const k of schema.required ?? []) if (o[k] === undefined) errors.push(`${path}: missing ${k}`);
    if (schema.properties) {
      for (const [k, v] of Object.entries(o)) {
        if (!schema.properties[k]) {
          if (schema.additionalProperties === false && !known.has(k)) errors.push(`${path}: unknown property ${k}`);
        } else check(defs, schema.properties[k], v, `${path}.${k}`, errors);
      }
    }
  }
}
function validate(version: SpecVersion, file: string, def: string, value: unknown): string[] {
  const defs = (JSON.parse(readFileSync(`${VENDOR}/${version}/json-schema/${file}`, 'utf8')) as Schema).$defs as Schema;
  const errors: string[] = [];
  check(defs, defs[def], value, def, errors);
  return errors;
}

const V25: SpecVersion = '2025-09-29';
const V26: SpecVersion = '2026-04-17';

describe('types', () => {
  it('labels examples with the spec version', () => {
    expect(exampleLabel(V26)).toBe('Illustrative example, spec version 2026-04-17');
    expect(pretty({ a: 1 })).toBe('{\n  "a": 1\n}');
  });
  it('has five statuses in 2025-09-29 and eleven in 2026-04-17', () => {
    expect(STATUSES[V25]).toHaveLength(5);
    expect(STATUSES[V26]).toHaveLength(11);
  });
});

describe('webhook', () => {
  const body = JSON.stringify(orderEvent('order_create', 'cs_1', 'created'));
  const secret = generateSecret();
  const t = Math.floor(T0 / 1000);
  it('round trips hex and builds the signed payload', () => {
    const b = new Uint8Array([0, 15, 255]);
    expect(bytesToHex(b)).toBe('000fff');
    expect(Array.from(hexToBytes('000fff'))).toEqual([0, 15, 255]);
    expect(signedPayload(5, 'x')).toBe('5.x');
    expect(generateSecret()).toHaveLength(32);
    expect(generateSecret()).not.toEqual(generateSecret());
  });
  it('signs in the t=...,v1=<64 hex> format', async () => {
    const h = await signWebhook(secret, body, t);
    expect(h).toMatch(SIGNATURE_PATTERN);
    expect(parseSignatureHeader(h)).toEqual({ t, v1: h.split('v1=')[1] });
    expect(parseSignatureHeader('t=1')).toBeNull();
    expect(parseSignatureHeader(undefined)).toBeNull();
  });
  it('matches an independent HMAC over timestamp.body', async () => {
    const { createHmac } = await import('node:crypto');
    const h = await signWebhook(secret, body, t);
    expect(h).toBe(`t=${t},v1=${createHmac('sha256', Buffer.from(secret)).update(`${t}.${body}`).digest('hex')}`);
  });
  it('accepts a good signature', async () => {
    const header = await signWebhook(secret, body, t);
    const r = await verifyWebhook({ header, rawBody: body, secret, nowSeconds: t + 5, requestId: 'req_1' });
    expect(r).toMatchObject({ ok: true, status: 200, body: { received: true, request_id: 'req_1' } });
  });
  it('rejects missing, malformed, tampered, wrong-secret and stale signatures with 401 invalid_signature', async () => {
    const header = await signWebhook(secret, body, t);
    const base = { rawBody: body, secret, nowSeconds: t };
    expect((await verifyWebhook({ ...base, header: undefined })).reason).toBe('missing');
    expect((await verifyWebhook({ ...base, header: 'nope' })).reason).toBe('malformed');
    const tampered = await verifyWebhook({ ...base, header, rawBody: body.replace('created', 'shipped') });
    expect(tampered).toMatchObject({ ok: false, reason: 'mismatch', status: 401, body: { type: 'invalid_request', code: 'invalid_signature' } });
    expect((await verifyWebhook({ ...base, header, secret: generateSecret() })).reason).toBe('mismatch');
    const stale = await verifyWebhook({ ...base, header, nowSeconds: t + TOLERANCE_SECONDS + 1 });
    expect(stale).toMatchObject({ reason: 'timestamp', status: 401 });
    expect((await verifyWebhook({ ...base, header, nowSeconds: t + TOLERANCE_SECONDS })).ok).toBe(true);
    expect((await verifyWebhook({ ...base, header, nowSeconds: t - TOLERANCE_SECONDS - 1 })).reason).toBe('timestamp');
  });
  it('builds order_create and order_update events with the Order discriminator', () => {
    const e = orderEvent('order_update', 'cs_9', 'shipped');
    expect(e.type).toBe('order_update');
    expect(e.data).toMatchObject({ type: 'order', checkout_session_id: 'cs_9', status: 'shipped' });
  });
});

describe('idempotency', () => {
  const input = (key: string | undefined, body: unknown, now = T0) => ({
    identity: 'a',
    endpoint: '/checkout_sessions',
    key,
    body,
    now,
    version: V26,
    keyRequired: true,
  });
  const resp = { status: 201, headers: {}, body: { id: 'cs_1' } };
  it('canonicalizes: key order ignored, arrays ordered, null differs from absent', () => {
    expect(canonicalJson({ b: 1, a: [1, 2] })).toBe('{"a":[1,2],"b":1}');
    expect(sameBody({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(sameBody({ a: [1, 2] }, { a: [2, 1] })).toBe(false);
    expect(sameBody({ a: null }, {})).toBe(false);
    expect(sameBody({ a: 1.0 }, { a: 1 })).toBe(true);
  });
  it('scopes the key by identity and endpoint', () => {
    expect(scopeKey('a', '/p', 'k')).toBe('a|/p|k');
  });
  it('rejects a missing key with 400 when required and passes when optional', () => {
    const o = checkIdempotency({}, input(undefined, {}));
    expect(o).toMatchObject({ kind: 'error', status: 400, error: { code: 'idempotency_key_required' } });
    expect(checkIdempotency({}, { ...input(undefined, {}), keyRequired: false })).toEqual({ kind: 'unkeyed' });
  });
  it('treats a first use as new and replays the same body', () => {
    expect(checkIdempotency({}, input('k', { a: 1 }))).toEqual({ kind: 'new' });
    const store = recordResponse({}, input('k', { a: 1 }), resp);
    expect(checkIdempotency(store, input('k', { a: 1 }))).toEqual({ kind: 'replay', response: resp });
    expect(checkIdempotency(store, input('k', { a: 1 }, T0 + 1000)).kind).toBe('replay');
  });
  it('returns 422 idempotency_conflict for a changed body', () => {
    const store = recordResponse({}, input('k', { a: 1 }), resp);
    expect(checkIdempotency(store, input('k', { a: 2 }))).toMatchObject({ kind: 'error', status: 422, error: { type: 'invalid_request', code: 'idempotency_conflict' } });
  });
  it('returns 409 idempotency_in_flight with Retry-After while running', () => {
    const store = markInFlight({}, input('k', { a: 1 }));
    expect(checkIdempotency(store, input('k', { a: 1 }))).toMatchObject({ kind: 'error', status: 409, headers: { 'Retry-After': '2' }, error: { code: 'idempotency_in_flight' } });
  });
  it('does not cache 5xx responses and forgets keys after 24 hours', () => {
    expect(recordResponse({}, input('k', {}), { ...resp, status: 503 })).toEqual({});
    expect(recordResponse({}, input(undefined, {}), resp)).toEqual({});
    const store: IdemStore = recordResponse({}, input('k', { a: 1 }), resp);
    expect(checkIdempotency(store, input('k', { a: 2 }, T0 + RETENTION_MS)).kind).toBe('new');
    expect(markInFlight({}, input(undefined, {}))).toEqual({});
  });
});

describe('delegate payment', () => {
  const req = () => buildDelegateRequest({ maxAmount: 3000, currency: 'usd', checkoutSessionId: 'cs_1', merchantId: MERCHANT_ID, expiresAtMs: T0 + 900_000 });
  const token = () => issueToken(req(), 'vt_1', T0, 'idem_1').record;
  const charge = { amount: 3000, currency: 'usd', merchantId: MERCHANT_ID, checkoutSessionId: 'cs_1' };
  it('formats timestamps without milliseconds', () => {
    expect(toIso(T0)).toBe('2026-10-11T12:00:00Z');
  });
  it('builds a request with the required allowance fields and no card number', () => {
    const r = req();
    expect(Object.keys(r.allowance).sort()).toEqual(['checkout_session_id', 'currency', 'expires_at', 'max_amount', 'merchant_id', 'reason']);
    expect(r.allowance.reason).toBe('one_time');
    expect(r.payment_method.card_number_type).toBe('network_token');
    expect(r.payment_method.number).not.toMatch(/^\d{12,19}$/);
    expect(validateDelegateRequest(r)).toBeNull();
  });
  it('validates required fields (400) and semantics (422)', () => {
    expect(validateDelegateRequest(null)?.status).toBe(400);
    const missing = clone(req()) as unknown as Record<string, unknown>;
    delete missing.risk_signals;
    expect(validateDelegateRequest(missing)).toMatchObject({ status: 400, error: { type: 'invalid_request', code: 'invalid_card', param: '$.risk_signals' } });
    const noAllow = clone(req());
    delete (noAllow.allowance as unknown as Record<string, unknown>).merchant_id;
    expect(validateDelegateRequest(noAllow)?.error.param).toBe('$.allowance.merchant_id');
    const noPm = clone(req());
    delete (noPm.payment_method as unknown as Record<string, unknown>).number;
    expect(validateDelegateRequest(noPm)?.error.param).toBe('$.payment_method.number');
    const bad = (mut: (a: Record<string, unknown>) => void) => {
      const r = clone(req());
      mut(r.allowance as unknown as Record<string, unknown>);
      return validateDelegateRequest(r);
    };
    expect(bad((a) => (a.currency = 'USD'))).toMatchObject({ status: 422 });
    expect(bad((a) => (a.reason = 'many_times'))?.error.param).toBe('$.allowance.reason');
    expect(bad((a) => (a.max_amount = 10.5))?.error.param).toBe('$.allowance.max_amount');
    expect(bad((a) => (a.expires_at = 'tomorrow'))?.error.param).toBe('$.allowance.expires_at');
    expect(bad((a) => (a.merchant_id = 'x'.repeat(257)))?.error.param).toBe('$.allowance.merchant_id');
  });
  it('issues a vault token that echoes metadata', () => {
    const { record, response } = issueToken(req(), 'vt_1', T0, 'idem_1');
    expect(response).toEqual({ id: 'vt_1', created: '2026-10-11T12:00:00Z', metadata: { source: 'agent_checkout', merchant_id: MERCHANT_ID, idempotency_key: 'idem_1' } });
    expect(record.used).toBe(false);
    expect(issueToken(req(), 'vt_2', T0, undefined).response.metadata.idempotency_key).toBeUndefined();
  });
  it('allows a charge inside the allowance', () => {
    expect(evaluateAllowance(token(), charge, T0)).toEqual([]);
    expect(evaluateAllowance(token(), { ...charge, amount: 3000 }, T0 + 899_999)).toEqual([]);
  });
  it('flags each way of breaking the allowance and never names a spec code', () => {
    const kinds = (c: typeof charge, now = T0, used = false) => evaluateAllowance({ ...token(), used }, c, now).map((v) => v.kind);
    expect(kinds({ ...charge, amount: 3001 })).toEqual(['max_amount']);
    expect(kinds(charge, T0 + 900_000)).toEqual(['expired']);
    expect(kinds({ ...charge, merchantId: OTHER_MERCHANT_ID })).toEqual(['merchant']);
    expect(kinds({ ...charge, checkoutSessionId: 'cs_2' })).toEqual(['session']);
    expect(kinds({ ...charge, currency: 'eur' })).toEqual(['currency']);
    expect(kinds(charge, T0, true)).toEqual(['reused']);
    const all = evaluateAllowance({ ...token(), used: true }, { amount: 9999, currency: 'eur', merchantId: 'm', checkoutSessionId: 's' }, T0 + 1e7);
    expect(all.map((v) => v.kind)).toEqual(['expired', 'merchant', 'session', 'currency', 'max_amount', 'reused']);
    expect(all.every((v) => v.specDefinesCode === false)).toBe(true);
  });
});

describe('handlers and discovery', () => {
  it('serves discovery only in 2026-04-17', () => {
    expect(discoveryFor(V25)).toBeNull();
    expect(discoveryFor(V26)).toEqual(DISCOVERY);
    expect(discoveryFor(V26)).not.toBe(DISCOVERY);
  });
  it('validates required discovery keys', () => {
    expect(validateDiscovery(DISCOVERY)).toEqual([]);
    expect(validateDiscovery(null)).toEqual(['Document must be a JSON object.']);
    const bad = clone(DISCOVERY) as unknown as Record<string, unknown>;
    delete bad.transports;
    delete (bad.protocol as Record<string, unknown>).version;
    delete (bad.capabilities as Record<string, unknown>).services;
    expect(validateDiscovery(bad)).toEqual([
      'Missing required key transports.',
      'Missing required key protocol.version.',
      'Missing required key capabilities.services.',
    ]);
  });
  it('selects handlers by name and orders by display_order', () => {
    const sel = selectHandlers(['dev.acp.tokenized.card', 'dev.acp.seller_backed.saved_card']);
    expect(sel.offered.map((h) => h.id)).toEqual(['seller_saved_card', 'card_tokenized', 'bank_fixture']);
    expect(sel.usable.map((h) => h.id)).toEqual(['seller_saved_card', 'card_tokenized']);
    expect(sel.skipped.map((s) => s.handler.id)).toEqual(['bank_fixture']);
    expect(selectHandlers([]).usable).toEqual([]);
  });
  it('checks handler_id against the session handlers', () => {
    expect(checkHandlerChoice(HANDLERS, 'card_tokenized')).toMatchObject({ ok: true, needsDelegateToken: true });
    expect(checkHandlerChoice(HANDLERS, 'bank_fixture')).toMatchObject({ ok: true, needsDelegateToken: false });
    expect(checkHandlerChoice(HANDLERS, 'nope')).toMatchObject({ ok: false, code: 'invalid', param: '$.payment_data.handler_id' });
  });
  it('gives every fixture handler the required PaymentHandler keys', () => {
    for (const h of HANDLERS) {
      for (const k of ['id', 'name', 'version', 'spec', 'requires_delegate_payment', 'requires_pci_compliance', 'psp', 'config_schema', 'instrument_schemas', 'config']) {
        expect(h).toHaveProperty(k);
      }
    }
  });
});

describe('checkout model', () => {
  const base = (over: Partial<Session> = {}): Session => ({
    id: 'cs_1',
    version: V26,
    status: 'not_ready_for_payment',
    currency: 'usd',
    items: [{ id: 'item_trail_mug', quantity: 1 }],
    createdAt: T0,
    expiresAt: T0 + 1000,
    messages: [],
    ...over,
  });
  const ready = (over: Partial<Session> = {}) =>
    base({ buyer: { first_name: 'S', last_name: 'R', email: 's@x.example' }, address: { name: 'S R', line_one: '1 A', city: 'C', state: 'CA', country: 'US', postal_code: '9' }, optionId: 'ship_standard', ...over });
  it('prices items and totals', () => {
    expect(priceOf('item_trail_mug')).toBe(1800);
    expect(priceOf('missing')).toBe(0);
    expect(computeTotals(base({ optionId: 'ship_standard' }))).toEqual({ subtotal: 1800, fulfillment: 500, tax: 184, total: 2484 });
    expect(computeTotals(base()).fulfillment).toBe(0);
  });
  it('is ready only with buyer, address, option and stock', () => {
    expect(readiness(base())).toBe('not_ready_for_payment');
    expect(readiness(ready())).toBe('ready_for_payment');
    expect(readiness(ready({ items: [{ id: SOLD_OUT_ITEM_ID, quantity: 1 }] }))).toBe('not_ready_for_payment');
    expect(hasSoldOut(ready({ items: [{ id: SOLD_OUT_ITEM_ID, quantity: 1 }] }))).toBe(true);
  });
  it('adds error and info messages', () => {
    expect(messagesFor(base({ items: [{ id: SOLD_OUT_ITEM_ID, quantity: 1 }] }))[0]).toMatchObject({ type: 'error', code: 'out_of_stock' });
    expect(messagesFor(base({ status: 'requires_escalation' }))[0]).toMatchObject({ type: 'info', resolution: 'requires_buyer_input' });
    expect(messagesFor(base())).toEqual([]);
  });
  it('knows terminal statuses', () => {
    expect(['completed', 'canceled', 'expired'].every((s) => isTerminal(s as never))).toBe(true);
    expect(isTerminal('ready_for_payment')).toBe(false);
  });
  it('expires 2026 sessions only', () => {
    expect(expireIfDue(base(), T0 + 1000).status).toBe('expired');
    expect(expireIfDue(base(), T0 + 999).status).toBe('not_ready_for_payment');
    expect(expireIfDue(base({ status: 'completed' }), T0 + 5000).status).toBe('completed');
    expect(expireIfDue(base({ version: V25, expiresAt: undefined }), T0 + 5000).status).toBe('not_ready_for_payment');
  });
  it('renders wire sessions that match the JSON Schema field names', () => {
    if (!haveVendor) return;
    const s26 = toWire(ready({ status: 'ready_for_payment', expiresAt: T0 + 1800_000 }));
    expect(validate(V26, 'schema.agentic_checkout.json', 'CheckoutSession', s26)).toEqual([]);
    const done = toWire(ready({ status: 'completed', order: { type: 'order', id: 'o', checkout_session_id: 'cs_1', permalink_url: 'https://x.example/o', status: 'created' } }));
    expect(validate(V26, 'schema.agentic_checkout.json', 'CheckoutSessionWithOrder', done)).toEqual([]);
    const auth = toWire(ready({ status: 'authentication_required' }));
    expect(auth.authentication_metadata).toBeDefined();
    expect(validate(V26, 'schema.agentic_checkout.json', 'CheckoutSession', auth)).toEqual([]);
    const esc = toWire(ready({ status: 'requires_escalation' }));
    expect(esc.continue_url).toContain('/continue/');
    const s25 = toWire(ready({ version: V25, status: 'ready_for_payment', expiresAt: undefined }));
    expect(validate(V25, 'schema.agentic_checkout.json', 'CheckoutSession', s25)).toEqual([]);
    expect(s25).toHaveProperty('payment_provider');
    expect(s25).not.toHaveProperty('capabilities');
    expect(s26).not.toHaveProperty('payment_provider');
  });
  it('uses only statuses from the version enum when listing transitions', () => {
    const t25 = transitionsFor(V25, 'ready_for_payment').map((t) => t.to);
    expect(t25).toEqual(expect.arrayContaining(['not_ready_for_payment', 'completed', 'canceled', 'in_progress']));
    expect(t25).not.toContain('authentication_required');
    expect(t25).not.toContain('expired');
    expect(transitionsFor(V26, 'ready_for_payment').map((t) => t.to)).toEqual(expect.arrayContaining(['authentication_required', 'expired', 'pending_approval']));
    for (const v of [V25, V26] as const) {
      for (const t of TRANSITIONS) {
        if (transitionsFor(v, t.from).includes(t)) expect(STATUSES[v]).toContain(t.to);
      }
    }
  });
  it('matches the state file in src/content/states', () => {
    const file = JSON.parse(readFileSync('src/content/states/openai-acp-checkout-session.json', 'utf8')) as {
      states: { id: string }[];
      transitions: { from: string; to: string; trigger: string; specRef: string }[];
    };
    expect(file.states.map((s) => s.id).sort()).toEqual([...STATUSES[V26]].sort());
    expect(file.transitions).toHaveLength(TRANSITIONS.length);
    for (const ft of file.transitions) {
      const mine = TRANSITIONS.find((t) => t.from === ft.from && t.to === ft.to);
      expect(mine, `${ft.from} to ${ft.to}`).toBeDefined();
      const fileInferred = /inferred/i.test(ft.trigger) || ft.specRef === 'schema only';
      if (fileInferred) expect(mine!.basis).toBe('inferred');
    }
    // The verification report asks for ready_for_payment to in_progress to be labeled inferred.
    expect(TRANSITIONS.find((t) => t.from === 'ready_for_payment' && t.to === 'in_progress')!.basis).toBe('inferred');
  });
});

describe('request builders', () => {
  it('builds headers from the OpenAPI parameter names', () => {
    const h = headersFor(V26, { method: 'POST', key: 'k', requestId: 'r' });
    expect(Object.keys(h)).toEqual(['Authorization', 'Content-Type', 'User-Agent', 'API-Version', 'Idempotency-Key', 'Request-Id']);
    expect(h['API-Version']).toBe(V26);
    expect(headersFor(V26, { method: 'GET' })).not.toHaveProperty('Content-Type');
  });
  it('builds create bodies per version', () => {
    const items = [{ id: 'item_trail_mug', quantity: 2 }];
    expect(createBody(V25, items)).toEqual({ items: [{ id: 'item_trail_mug', quantity: 2 }] });
    expect(createBody(V26, items)).toMatchObject({ currency: 'usd', line_items: [{ id: 'item_trail_mug' }], capabilities: { interventions: { supported: ['3ds'] } } });
    const addr = { name: 'N', line_one: 'L', city: 'C', state: 'CA', country: 'US', postal_code: '9' };
    expect(createBody(V25, items, { buyer: { email: 'a@b.example' }, address: addr })).toMatchObject({ fulfillment_address: addr });
    expect(createBody(V26, items, { buyer: { email: 'a@b.example' }, address: addr })).toMatchObject({ fulfillment_details: { address: addr } });
    if (haveVendor) {
      expect(validate(V26, 'schema.agentic_checkout.json', 'CheckoutSessionCreateRequest', createBody(V26, items, { address: addr }))).toEqual([]);
      expect(validate(V25, 'schema.agentic_checkout.json', 'CheckoutSessionCreateRequest', createBody(V25, items, { address: addr }))).toEqual([]);
    }
  });
  it('builds update, complete and cancel bodies per version', () => {
    const addr = { name: 'N', line_one: 'L', city: 'C', state: 'CA', country: 'US', postal_code: '9' };
    const patch = { buyer: { first_name: 'A', last_name: 'B', email: 'a@b.example' }, address: addr, optionId: 'ship_standard', items: [{ id: 'item_wool_socks', quantity: 1 }] };
    const u25 = updateBody(V25, patch);
    const u26 = updateBody(V26, patch);
    expect(u25).toMatchObject({ fulfillment_option_id: 'ship_standard', fulfillment_address: addr, items: [{ id: 'item_wool_socks', quantity: 1 }] });
    expect(u26).toMatchObject({ selected_fulfillment_options: [{ type: 'shipping', option_id: 'ship_standard', item_ids: ['li_1'] }], line_items: [{ id: 'item_wool_socks' }] });
    expect(completeBody(V25, { token: 'vt' })).toEqual({ payment_data: { token: 'vt', provider: 'stripe' } });
    expect(completeBody(V26, { token: 'vt', authOutcome: 'authenticated' })).toMatchObject({
      payment_data: { handler_id: 'card_tokenized', instrument: { type: 'card', credential: { type: 'spt', token: 'vt' } } },
      authentication_result: { outcome: 'authenticated' },
    });
    expect(cancelBody(V25, 'other')).toBeUndefined();
    expect(cancelBody(V26)).toBeUndefined();
    expect(cancelBody(V26, 'price_sensitivity')).toEqual({ intent_trace: { reason_code: 'price_sensitivity' } });
    if (haveVendor) {
      expect(validate(V26, 'schema.agentic_checkout.json', 'CheckoutSessionUpdateRequest', u26)).toEqual([]);
      expect(validate(V25, 'schema.agentic_checkout.json', 'CheckoutSessionUpdateRequest', u25)).toEqual([]);
      expect(validate(V26, 'schema.agentic_checkout.json', 'CheckoutSessionCompleteRequest', completeBody(V26, { token: 'vt', authOutcome: 'authenticated' }))).toEqual([]);
      expect(validate(V25, 'schema.agentic_checkout.json', 'CheckoutSessionCompleteRequest', completeBody(V25, { token: 'vt' }))).toEqual([]);
      expect(validate(V26, 'schema.agentic_checkout.json', 'CancelSessionRequest', cancelBody(V26, 'other'))).toEqual([]);
      const dp = buildDelegateRequest({ maxAmount: 1, currency: 'usd', checkoutSessionId: 'cs', merchantId: 'm', expiresAtMs: T0 });
      expect(validate(V26, 'schema.delegate_payment.json', 'DelegatePaymentRequest', dp)).toEqual([]);
      expect(validate(V25, 'schema.delegate_payment.json', 'DelegatePaymentRequest', dp)).toEqual([]);
    }
  });
  it('maps operations to the spec paths and methods', () => {
    const pick = (op: Parameters<typeof buildRequest>[1]) => {
      const r = buildRequest(V26, op, { sessionId: 'cs_1', key: 'k' });
      return `${r.method} ${r.path}`;
    };
    expect(pick('create')).toBe('POST /checkout_sessions');
    expect(pick('update')).toBe('POST /checkout_sessions/cs_1');
    expect(pick('get')).toBe('GET /checkout_sessions/cs_1');
    expect(pick('complete')).toBe('POST /checkout_sessions/cs_1/complete');
    expect(pick('cancel')).toBe('POST /checkout_sessions/cs_1/cancel');
    expect(pick('delegate')).toBe(`POST ${DELEGATE_PATH}`);
    expect(buildRequest(V26, 'get', { sessionId: 'x', key: 'k' }).headers).not.toHaveProperty('Idempotency-Key');
  });
  it('matches the vendored OpenAPI paths', () => {
    if (!haveVendor) return;
    const yaml = readFileSync(`${VENDOR}/2026-04-17/openapi/openapi.agentic_checkout.yaml`, 'utf8');
    for (const p of ['/checkout_sessions:', '/checkout_sessions/{checkout_session_id}:', '/checkout_sessions/{checkout_session_id}/complete:', '/checkout_sessions/{checkout_session_id}/cancel:']) expect(yaml).toContain(`  ${p}`);
    expect(readFileSync(`${VENDOR}/2026-04-17/openapi/openapi.delegate_payment.yaml`, 'utf8')).toContain(DELEGATE_PATH);
  });
});

describe('fixture merchant', () => {
  const NOW = T0;
  let n = 0;
  const key = () => `idem_${++n}`;
  const addr = { name: 'Sam Rivera', line_one: '1 Example Way', city: 'Springfield', state: 'CA', country: 'US', postal_code: '90000' };
  const buyer = { first_name: 'Sam', last_name: 'Rivera', email: 'sam@buyer.example' };
  const items = [{ id: 'item_trail_mug', quantity: 1 }];

  function send(st: ServerState, op: Parameters<typeof buildRequest>[1], opts: { sessionId?: string; body?: unknown; key?: string | null; now?: number }) {
    const k = opts.key === null ? undefined : (opts.key ?? key());
    return handle(st, buildRequest(st.version, op, { sessionId: opts.sessionId, key: k, body: opts.body, requestId: 'req_1' }), opts.now ?? NOW);
  }
  function readySession(version: SpecVersion) {
    let st = newServer(version);
    let r = send(st, 'create', { body: createBody(version, items) });
    st = r.state;
    const id = (r.exchange.responseBody as { id: string }).id;
    r = send(st, 'update', { sessionId: id, body: updateBody(version, { buyer, address: addr, optionId: 'ship_standard' }) });
    return { st: r.state, id };
  }
  function delegate(st: ServerState, id: string, over: Partial<Parameters<typeof buildDelegateRequest>[0]> = {}, now = NOW) {
    const body = buildDelegateRequest({ maxAmount: 2484, currency: 'usd', checkoutSessionId: id, merchantId: MERCHANT_ID, expiresAtMs: NOW + 900_000, ...over });
    const r = send(st, 'delegate', { body, now });
    return { st: r.state, ex: r.exchange, tokenId: (r.exchange.responseBody as { id: string }).id };
  }

  it('creates a session with 201 in both versions and validates against the schema', () => {
    for (const v of [V25, V26]) {
      const r = send(newServer(v), 'create', { body: createBody(v, items) });
      expect(r.exchange.status).toBe(201);
      expect((r.exchange.responseBody as { status: string }).status).toBe('not_ready_for_payment');
      if (haveVendor) expect(validate(v, 'schema.agentic_checkout.json', 'CheckoutSession', r.exchange.responseBody)).toEqual([]);
    }
  });
  it('answers missing fields and unknown items with 400', () => {
    expect(send(newServer(V26), 'create', { body: { currency: 'usd' } }).exchange).toMatchObject({ status: 400, responseBody: { param: '$.line_items' } });
    expect(send(newServer(V26), 'create', { body: { line_items: [{ id: 'item_trail_mug' }] } }).exchange).toMatchObject({ status: 400, responseBody: { param: '$.currency' } });
    expect(send(newServer(V26), 'create', { body: { line_items: [{ id: 'item_trail_mug' }], currency: 'usd' } }).exchange).toMatchObject({ status: 400, responseBody: { param: '$.capabilities' } });
    expect(send(newServer(V26), 'create', { body: { ...createBody(V26, items), line_items: [{ id: 'nope' }] } }).exchange.responseBody).toMatchObject({ param: '$.line_items[0].id' });
    expect(send(newServer(V25), 'create', { body: { items: [{ id: 'item_trail_mug', quantity: 0 }] } }).exchange.responseBody).toMatchObject({ param: '$.items[0].quantity' });
    expect(send(newServer(V26), 'create', { body: { ...createBody(V26, items), line_items: [] } }).exchange.status).toBe(400);
  });
  it('requires Idempotency-Key on POST in 2026-04-17 only', () => {
    const r26 = send(newServer(V26), 'create', { body: createBody(V26, items), key: null });
    expect(r26.exchange).toMatchObject({ status: 400, responseBody: { type: 'invalid_request', code: 'idempotency_key_required' } });
    const r25 = send(newServer(V25), 'create', { body: createBody(V25, items), key: null });
    expect(r25.exchange.status).toBe(201);
    expect(send(newServer(V25), 'delegate', { body: {}, key: null }).exchange.status).toBe(400);
  });
  it('moves not_ready to ready on update and back when the address is removed from the cart', () => {
    for (const v of [V25, V26]) {
      const { st, id } = readySession(v);
      expect(st.sessions[id]!.status).toBe('ready_for_payment');
      const r = send(st, 'update', { sessionId: id, body: updateBody(v, { items: [{ id: 'item_sold_out_print', quantity: 1 }] }) });
      expect((r.exchange.responseBody as { status: string; messages: { code: string }[] }).status).toBe('not_ready_for_payment');
      expect((r.exchange.responseBody as { messages: { code: string }[] }).messages[0]!.code).toBe('out_of_stock');
    }
  });
  it('rejects a bad fulfillment option and unknown sessions', () => {
    const { st, id } = readySession(V26);
    expect(send(st, 'update', { sessionId: id, body: updateBody(V26, { optionId: 'ship_fast' }) }).exchange.status).toBe(400);
    const old = readySession(V25);
    expect(send(old.st, 'update', { sessionId: old.id, body: updateBody(V25, { optionId: 'ship_fast' }) }).exchange.responseBody).toMatchObject({ param: '$.fulfillment_option_id' });
    expect(send(st, 'get', { sessionId: 'cs_none' }).exchange.status).toBe(404);
    expect(handle(st, { method: 'GET', path: '/nope', headers: {} }, NOW).exchange.status).toBe(404);
  });
  it('gets a session', () => {
    const { st, id } = readySession(V26);
    expect(send(st, 'get', { sessionId: id }).exchange).toMatchObject({ status: 200, responseBody: { id } });
  });
  it('cancels with 200 and answers 405 for a second cancel', () => {
    const { st, id } = readySession(V26);
    const c = send(st, 'cancel', { sessionId: id, body: cancelBody(V26, 'other') });
    expect(c.exchange.status).toBe(200);
    expect((c.exchange.responseBody as { status: string }).status).toBe('canceled');
    expect(send(c.state, 'cancel', { sessionId: id }).exchange.status).toBe(405);
    expect(send(c.state, 'update', { sessionId: id, body: {} }).exchange.status).toBe('4XX');
  });
  it('completes with a valid delegated token and returns an order', () => {
    for (const v of [V25, V26]) {
      const { st, id } = readySession(v);
      const d = delegate(st, id);
      expect(d.ex.status).toBe(201);
      const r = send(d.st, 'complete', { sessionId: id, body: completeBody(v, { token: d.tokenId }) });
      expect(r.exchange.status).toBe(200);
      const body = r.exchange.responseBody as { status: string; order: { checkout_session_id: string } };
      expect(body.status).toBe('completed');
      expect(body.order.checkout_session_id).toBe(id);
      expect(r.state.lastCharge).toMatchObject({ outcome: 'accepted', amount: 2484 });
      expect(r.state.tokens[d.tokenId]!.used).toBe(true);
      if (haveVendor) expect(validate(v, 'schema.agentic_checkout.json', 'CheckoutSessionWithOrder', body)).toEqual([]);
    }
  });
  it('refuses allowance violations with payment_declined and an unnamed spec code', () => {
    const cases: [string, Partial<Parameters<typeof buildDelegateRequest>[0]>, string][] = [
      ['max_amount', { maxAmount: 1000 }, 'max_amount'],
      ['merchant', { merchantId: OTHER_MERCHANT_ID }, 'merchant'],
      ['session', { checkoutSessionId: 'cs_other' }, 'session'],
    ];
    for (const [, over, kind] of cases) {
      const { st, id } = readySession(V26);
      const d = delegate(st, id, over);
      const r = send(d.st, 'complete', { sessionId: id, body: completeBody(V26, { token: d.tokenId }) });
      expect(r.exchange.status).toBe(200);
      const body = r.exchange.responseBody as { status: string; messages: { code: string }[] };
      expect(body.status).toBe('ready_for_payment');
      expect(body.messages[0]!.code).toBe('payment_declined');
      expect(r.state.lastCharge!.violations.map((x) => x.kind)).toEqual([kind]);
      expect(r.exchange.note).toContain('names no error code');
      expect(r.state.tokens[d.tokenId]!.used).toBe(false);
    }
  });
  it('refuses an expired token once the clock passes expires_at', () => {
    const { st, id } = readySession(V26);
    const d = delegate(st, id, { expiresAtMs: NOW + 60_000 });
    const r = send(d.st, 'complete', { sessionId: id, body: completeBody(V26, { token: d.tokenId }), now: NOW + 60_000 });
    expect(r.state.lastCharge!.violations.map((x) => x.kind)).toEqual(['expired']);
  });
  it('refuses reuse of a one_time token on a second session', () => {
    const rs = readySession(V26);
    const id = rs.id;
    const d = delegate(rs.st, id);
    const st = send(d.st, 'complete', { sessionId: id, body: completeBody(V26, { token: d.tokenId }) }).state;
    const second = send(st, 'create', { body: createBody(V26, items, { buyer, address: addr }) });
    const id2 = (second.exchange.responseBody as { id: string }).id;
    const u = send(second.state, 'update', { sessionId: id2, body: updateBody(V26, { optionId: 'ship_standard' }) });
    const r = send(u.state, 'complete', { sessionId: id2, body: completeBody(V26, { token: d.tokenId }) });
    expect(r.state.lastCharge!.violations.map((x) => x.kind)).toEqual(['session', 'reused']);
  });
  it('declines an unknown token and validates handler ids and missing payment data', () => {
    const { st, id } = readySession(V26);
    const unknown = send(st, 'complete', { sessionId: id, body: completeBody(V26, { token: 'vt_nope' }) });
    expect(unknown.state.lastCharge).toMatchObject({ outcome: 'refused', note: 'No delegated token with this id exists.' });
    expect(send(st, 'complete', { sessionId: id, body: {} }).exchange.status).toBe(400);
    expect(send(st, 'complete', { sessionId: id, body: completeBody(V26, { token: 'x', handlerId: 'nope' }) }).exchange.responseBody).toMatchObject({ param: '$.payment_data.handler_id' });
    expect(send(st, 'complete', { sessionId: id, body: { payment_data: { handler_id: 'card_tokenized' } } }).exchange.status).toBe(400);
  });
  it('accepts a handler that does not use delegate_payment without an allowance check', () => {
    const { st, id } = readySession(V26);
    const r = send(st, 'complete', { sessionId: id, body: completeBody(V26, { token: 'bank_ref_1', handlerId: 'bank_fixture' }) });
    expect((r.exchange.responseBody as { status: string }).status).toBe('completed');
    expect(r.state.lastCharge!.note).toContain('no allowance');
  });
  it('rejects completing a session that is not ready', () => {
    const r = send(newServer(V26), 'create', { body: createBody(V26, items) });
    const id = (r.exchange.responseBody as { id: string }).id;
    const c = send(r.state, 'complete', { sessionId: id, body: completeBody(V26, { token: 'x' }) });
    expect(c.exchange).toMatchObject({ status: '4XX', responseBody: { code: 'invalid_state' } });
    expect(c.exchange.note).toContain('names no error code');
  });
  it('supports authentication_required with the spec error requires_3ds', () => {
    const { st, id } = readySession(V26);
    const ev = applyEvent(st, id, 'authentication_required');
    if ('error' in ev) throw new Error(ev.error);
    const d = delegate(ev.state, id);
    const no = send(d.st, 'complete', { sessionId: id, body: completeBody(V26, { token: d.tokenId }) });
    expect(no.exchange).toMatchObject({ status: '4XX', responseBody: { type: 'invalid_request', code: 'requires_3ds', param: '$.authentication_result' } });
    const bad = send(no.state, 'complete', { sessionId: id, body: completeBody(V26, { token: d.tokenId, authOutcome: 'denied' }) });
    expect((bad.exchange.responseBody as { status: string }).status).toBe('authentication_required');
    const ok = send(bad.state, 'complete', { sessionId: id, body: completeBody(V26, { token: d.tokenId, authOutcome: 'authenticated' }) });
    expect((ok.exchange.responseBody as { status: string }).status).toBe('completed');
  });
  it('honors the complete mode and settles with a merchant event', () => {
    const { st, id } = readySession(V26);
    const d = delegate({ ...st, completeMode: 'complete_in_progress' }, id);
    const r = send(d.st, 'complete', { sessionId: id, body: completeBody(V26, { token: d.tokenId }) });
    expect((r.exchange.responseBody as { status: string; order?: unknown }).status).toBe('complete_in_progress');
    expect(r.exchange.responseBody).not.toHaveProperty('order');
    const ev = applyEvent(r.state, id, 'completed');
    if ('error' in ev) throw new Error(ev.error);
    expect(ev.text).toContain('inferred');
    expect(ev.state.sessions[id]!.order).toBeDefined();
    const a = readySession(V26);
    const approval = send(delegate({ ...a.st, completeMode: 'pending_approval' }, a.id).st, 'complete', { sessionId: a.id, body: completeBody(V26, { token: 'vt_fixture_3' }) });
    expect(approval.state.sessions[a.id]!.status).toBeDefined();
    const old = readySession(V25);
    const od = delegate({ ...old.st, completeMode: 'in_progress' }, old.id);
    const or = send(od.st, 'complete', { sessionId: old.id, body: completeBody(V25, { token: od.tokenId }) });
    expect((or.exchange.responseBody as { status: string }).status).toBe('in_progress');
    const settled = applyEvent(or.state, old.id, 'completed');
    expect('error' in settled).toBe(false);
  });
  it('rejects events that are not in the table for the version', () => {
    const { st, id } = readySession(V25);
    expect(applyEvent(st, id, 'authentication_required')).toHaveProperty('error');
    expect(applyEvent(st, 'cs_none', 'completed')).toEqual({ error: 'No such session.' });
    const s26 = readySession(V26);
    expect(applyEvent(s26.st, s26.id, 'canceled')).toHaveProperty('error');
    const esc = applyEvent(s26.st, s26.id, 'requires_escalation');
    expect('state' in esc && esc.state.sessions[s26.id]!.status).toBe('requires_escalation');
  });
  it('expires sessions on tick in 2026-04-17 only', () => {
    const a = readySession(V26);
    const { state, expired } = tick(a.st, NOW + 31 * 60_000);
    expect(expired).toEqual([a.id]);
    expect(state.sessions[a.id]!.status).toBe('expired');
    expect(send(state, 'get', { sessionId: a.id, now: NOW + 31 * 60_000 }).exchange.responseBody).toMatchObject({ status: 'expired' });
    expect(tick(state, NOW + 32 * 60_000).expired).toEqual([]);
    const b = readySession(V25);
    expect(tick(b.st, NOW + 99 * 60_000).expired).toEqual([]);
    const lazy = send(a.st, 'get', { sessionId: a.id, now: NOW + 31 * 60_000 });
    expect((lazy.exchange.responseBody as { status: string }).status).toBe('expired');
  });
  it('replays the same key and body, and rejects a changed body with 422', () => {
    const st = newServer(V26);
    const body = createBody(V26, items);
    const first = send(st, 'create', { body, key: 'idem_x' });
    const again = send(first.state, 'create', { body: { ...body }, key: 'idem_x' });
    expect(again.exchange.status).toBe(201);
    expect(again.exchange.responseHeaders['Idempotent-Replayed']).toBe('true');
    expect(again.exchange.responseBody).toEqual(first.exchange.responseBody);
    expect(Object.keys(again.state.sessions)).toHaveLength(1);
    const changed = send(first.state, 'create', { body: createBody(V26, [{ id: 'item_wool_socks', quantity: 1 }]), key: 'idem_x' });
    expect(changed.exchange).toMatchObject({ status: 422, responseBody: { code: 'idempotency_conflict' } });
    expect(first.exchange.responseHeaders['Idempotency-Key']).toBe('idem_x');
    expect(first.exchange.responseHeaders['Request-Id']).toBe('req_1');
  });
  it('replays in 2025-09-29 without the replay header', () => {
    const body = createBody(V25, items);
    const first = send(newServer(V25), 'create', { body, key: 'idem_y' });
    const again = send(first.state, 'create', { body, key: 'idem_y' });
    expect(again.exchange.status).toBe(201);
    expect(again.exchange.responseHeaders).not.toHaveProperty('Idempotent-Replayed');
    expect(again.exchange.note).toContain('2025-09-29');
  });
  it('answers 409 with Retry-After for a duplicate while the first request runs', () => {
    const st = newServer(V26);
    const req = buildRequest(V26, 'create', { key: 'idem_z', body: createBody(V26, items) });
    const held = holdInFlight(st, req, NOW);
    const r = handle(held, req, NOW);
    expect(r.exchange).toMatchObject({ status: 409, responseHeaders: { 'Retry-After': '2' }, responseBody: { code: 'idempotency_in_flight' } });
    expect(Object.keys(r.state.sessions)).toHaveLength(0);
    expect(holdInFlight(st, { ...req, headers: { ...req.headers, 'Idempotency-Key': '' } }, NOW).idem).toEqual({});
  });
  it('treats a key as new after 24 hours', () => {
    const body = createBody(V26, items);
    const first = send(newServer(V26), 'create', { body, key: 'idem_w' });
    const later = send(first.state, 'create', { body: createBody(V26, [{ id: 'item_wool_socks', quantity: 1 }]), key: 'idem_w', now: NOW + RETENTION_MS });
    expect(later.exchange.status).toBe(201);
  });
  it('scopes keys by endpoint', () => {
    const { st, id } = readySession(V26);
    const k = 'shared_key';
    const a = send(st, 'update', { sessionId: id, body: {}, key: k });
    const b = send(a.state, 'cancel', { sessionId: id, key: k });
    expect(b.exchange.status).toBe(200);
  });
  it('reports delegate validation errors from the server', () => {
    const r = send(newServer(V26), 'delegate', { body: { payment_method: {} } });
    expect(r.exchange).toMatchObject({ status: 400, responseBody: { type: 'invalid_request', code: 'invalid_card' } });
  });
  it('uses catalog items that exist', () => {
    expect(CATALOG.map((c) => c.id)).toContain(SOLD_OUT_ITEM_ID);
  });
});
