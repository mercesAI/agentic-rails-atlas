import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  computeTotals,
  createCheckout,
  DEFAULT_POLICY,
  buyerCompletesHandoff,
  cancelCheckout,
  checkIdempotency,
  checkInvariants,
  completeCheckout,
  continueUrlFor,
  evaluate,
  expireIfDue,
  finishProcessing,
  formatMoney,
  isTerminal,
  updateCheckout,
  type BusinessPolicy,
  type CheckoutData,
  type SessionContext,
} from '@/playgrounds/ucp/lib/checkout';
import {
  BUSINESS_PROFILE,
  DEFAULT_TTL_MS,
  INSTRUMENT_OPTIONS,
  LEAF_PROFILES,
  LEAF_PROFILE_URL,
  PLATFORM_PROFILE,
  PLATFORM_PROFILE_URL,
  type InstrumentOption,
} from '@/playgrounds/ucp/lib/fixtures';
import { clone } from '@/lib/playground/util';
import {
  checkAuthorityBinding,
  filterEntries,
  intersectCapabilities,
  isActive,
  negotiate,
  parseProfile,
  publicKeys,
  responseCapabilities,
  selectProtocolVersion,
  toArray,
  ucpAgentHeader,
  type Negotiation,
} from '@/playgrounds/ucp/lib/negotiate';
import {
  handlersForResponse,
  instrumentEcho,
  instrumentPayload,
  resolveHandlers,
  resolveInstruments,
  validateSubmission,
} from '@/playgrounds/ucp/lib/payment';
import {
  OPERATIONS,
  OPERATION_ORDER,
  checkoutResource,
  fixtureCheckoutMandate,
  fixtureMerchantAuthorization,
  renderRequest,
  renderResponse,
  requestBody,
  type WireContext,
} from '@/playgrounds/ucp/lib/transport';
import { SPEC_VERSION, type Entity, type Profile } from '@/playgrounds/ucp/lib/types';

const J = (p: unknown) => JSON.stringify(p);
const opt = (key: string): InstrumentOption => {
  const o = INSTRUMENT_OPTIONS.find((x) => x.key === key);
  if (!o) throw new Error(key);
  return o;
};
function ok(n: ReturnType<typeof negotiate>): Negotiation {
  if (!n.ok) throw new Error(`negotiation failed: ${n.code} ${n.detail}`);
  return n;
}
const names = (n: Negotiation) => n.active.map((c) => c.name).sort();
const prunedOf = (n: Negotiation, name: string) => n.pruned.find((p) => p.name === name);

describe('parseProfile', () => {
  it('accepts the fixture profiles', () => {
    expect(parseProfile(J(BUSINESS_PROFILE), 'business').ok).toBe(true);
    expect(parseProfile(J(PLATFORM_PROFILE), 'platform').ok).toBe(true);
  });
  it('reports invalid JSON as profile_malformed', () => {
    const r = parseProfile('{ not json', 'business');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('profile_malformed');
  });
  it('requires services and payment_handlers but not capabilities', () => {
    const p = clone(BUSINESS_PROFILE) as unknown as { ucp: Record<string, unknown> };
    delete p.ucp.capabilities;
    expect(parseProfile(J(p), 'business').ok).toBe(true);
    delete p.ucp.payment_handlers;
    const r = parseProfile(J(p), 'business');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.detail).toContain('payment_handlers');
  });
  it('rejects a version that is not YYYY-MM-DD', () => {
    const p = clone(BUSINESS_PROFILE);
    p.ucp.version = 'v1';
    expect(parseProfile(J(p), 'business').ok).toBe(false);
  });
  it('rejects private JWK members in keys[]', () => {
    const p = clone(BUSINESS_PROFILE);
    p.keys = [{ kid: 'k1', kty: 'EC', d: 'secret' }];
    const r = parseProfile(J(p), 'business');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.detail).toContain('d');
  });
  it('ignores supported_versions on a platform profile with a warning', () => {
    const p = clone(PLATFORM_PROFILE);
    p.ucp.supported_versions = { '2026-04-08': 'https://agent.example/old' };
    const r = parseProfile(J(p), 'platform');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.profile.ucp.supported_versions).toBeUndefined();
      expect(r.warnings.join(' ')).toContain('business profiles only');
    }
  });
  it('rejects supported_versions inside a leaf profile', () => {
    expect(parseProfile(J(BUSINESS_PROFILE), 'business', { leaf: true }).ok).toBe(false);
  });
  it('warns when keys sit inside ucp', () => {
    const p = clone(BUSINESS_PROFILE) as unknown as { ucp: Record<string, unknown> };
    p.ucp.keys = [];
    const r = parseProfile(J(p), 'business');
    expect(r.ok && r.warnings.some((w) => w.includes('top level'))).toBe(true);
  });
});

describe('publicKeys', () => {
  it('returns the top-level JWK set', () => {
    expect(publicKeys(BUSINESS_PROFILE).map((k) => k.kid)).toEqual(['juniper_2026']);
    expect(publicKeys({ ucp: BUSINESS_PROFILE.ucp })).toEqual([]);
  });
});

describe('checkAuthorityBinding', () => {
  it('accepts the spec table cases', () => {
    expect(checkAuthorityBinding('dev.ucp.shopping.checkout', 'https://ucp.dev/x.json')).toMatchObject({ ok: true, match: 'prefix' });
    expect(checkAuthorityBinding('dev.ucp.shopping.checkout', 'https://shopping.ucp.dev/x.json').ok).toBe(true);
    expect(checkAuthorityBinding('com.example.pay', 'https://pay.example.com/x.json')).toMatchObject({ ok: true, match: 'exact' });
    expect(checkAuthorityBinding('com.example.pay', 'https://example.com/x.json').ok).toBe(true);
  });
  it('rejects the spec table cases', () => {
    expect(checkAuthorityBinding('com.example.pay', 'https://evil.example/x.json').ok).toBe(false);
    expect(checkAuthorityBinding('com.examplecorp.pay', 'https://example.com/x.json').ok).toBe(false);
    expect(checkAuthorityBinding('com.example.pay', 'https://cdn.example.com/x.json').ok).toBe(false);
  });
  it('parses userinfo tricks, IP hosts, single labels and http', () => {
    expect(checkAuthorityBinding('dev.ucp.shopping.checkout', 'https://ucp.dev@evil.example/x.json').ok).toBe(false);
    expect(checkAuthorityBinding('dev.ucp.a.b', 'https://203.0.113.10/x.json').ok).toBe(false);
    expect(checkAuthorityBinding('localhost.a', 'https://localhost/x.json').ok).toBe(false);
    expect(checkAuthorityBinding('dev.ucp.a.b', 'http://ucp.dev/x.json').ok).toBe(false);
    expect(checkAuthorityBinding('dev.ucp.a.b', 'not a url').ok).toBe(false);
  });
});

describe('selectProtocolVersion', () => {
  it('uses the current profile when versions match', () => {
    const r = selectProtocolVersion(BUSINESS_PROFILE, SPEC_VERSION, LEAF_PROFILES);
    expect(r).toMatchObject({ ok: true, version: SPEC_VERSION, via: 'current' });
  });
  it('uses the leaf profile for a supported older version', () => {
    const r = selectProtocolVersion(BUSINESS_PROFILE, '2026-04-08', LEAF_PROFILES);
    expect(r).toMatchObject({ ok: true, version: '2026-04-08', via: 'supported_versions', leafUri: LEAF_PROFILE_URL });
  });
  it('returns version_unsupported for an unknown version', () => {
    const r = selectProtocolVersion(BUSINESS_PROFILE, '2026-01-11', LEAF_PROFILES);
    expect(r).toMatchObject({ ok: false, code: 'version_unsupported' });
  });
  it('refuses a leaf whose ucp.version differs from the selected key', () => {
    const leaf = clone(LEAF_PROFILES[LEAF_PROFILE_URL] as Profile);
    leaf.ucp.version = '2026-01-23';
    const r = selectProtocolVersion(BUSINESS_PROFILE, '2026-04-08', { [LEAF_PROFILE_URL]: leaf });
    expect(r.ok).toBe(false);
  });
  it('reports a missing leaf as profile_unreachable', () => {
    expect(selectProtocolVersion(BUSINESS_PROFILE, '2026-04-08', {})).toMatchObject({ ok: false, code: 'profile_unreachable' });
  });
});

describe('toArray', () => {
  it('normalizes extends', () => {
    expect(toArray(undefined)).toEqual([]);
    expect(toArray('a')).toEqual(['a']);
    expect(toArray(['a', 'b'])).toEqual(['a', 'b']);
  });
});

describe('filterEntries', () => {
  const ok1: Entity = { version: SPEC_VERSION, schema: 'https://ucp.dev/s.json' };
  it('rejects a dev.ucp entry on another release (core entries carry the release date)', () => {
    const r = filterEntries({ 'dev.ucp.shopping.checkout': [{ ...ok1, version: '2026-04-08' }] }, SPEC_VERSION, 'business');
    expect(r.kept).toEqual({});
    expect(r.pruned[0]?.reason).toBe('core_version_mismatch');
  });
  it('lets third-party extensions version independently', () => {
    const r = filterEntries(
      { 'com.example.shopping.x': [{ version: '2026-06-01', schema: 'https://example.com/x.json' }] },
      SPEC_VERSION,
      'business',
    );
    expect(Object.keys(r.kept)).toEqual(['com.example.shopping.x']);
  });
  it('rejects failed authority binding and missing schema', () => {
    const r = filterEntries(
      {
        'com.example.shopping.x': [{ version: '2026-06-01', schema: 'https://cdn.example.net/x.json' }],
        'com.example.shopping.y': [{ version: '2026-06-01' }],
      },
      SPEC_VERSION,
      'platform',
    );
    expect(r.pruned.map((p) => p.reason).sort()).toEqual(['authority_binding_failed', 'missing_schema']);
  });
});

describe('intersectCapabilities', () => {
  const e = (version: string, ext?: string | string[]): Entity => ({ version, ...(ext ? { extends: ext } : {}) });
  it('selects the highest common version and drops capabilities without one', () => {
    const r = intersectCapabilities(
      { a: [e('2026-01-01'), e('2026-06-01'), e('2026-09-01')], b: [e('2026-01-01')] },
      { a: [e('2026-01-01'), e('2026-06-01')], b: [e('2026-02-01')] },
    );
    expect(r.active).toEqual([{ name: 'a', version: '2026-06-01' }]);
    expect(r.pruned.find((p) => p.name === 'b')?.reason).toBe('no_common_version');
  });
  it('prunes orphaned extensions transitively, recording the round', () => {
    const r = intersectCapabilities(
      { root: [e('1')], ext: [e('1', 'root')], ext2: [e('1', 'ext')] },
      { ext: [e('1', 'root')], ext2: [e('1', 'ext')] },
    );
    expect(r.active).toEqual([]);
    expect(r.pruned.find((p) => p.name === 'ext')).toMatchObject({ reason: 'orphaned_extension', round: 1 });
    expect(r.pruned.find((p) => p.name === 'ext2')).toMatchObject({ reason: 'orphaned_extension', round: 2 });
  });
  it('keeps a multi-parent extension when at least one parent survives', () => {
    const r = intersectCapabilities(
      { checkout: [e('1')], cart: [e('1')], discount: [e('1', ['checkout', 'cart'])] },
      { checkout: [e('1')], discount: [e('1', ['checkout', 'cart'])] },
    );
    expect(r.active.map((c) => c.name)).toEqual(['checkout', 'discount']);
  });
  it('lists platform-only capabilities as not offered by the business', () => {
    const r = intersectCapabilities({}, { x: [e('1')] });
    expect(r.pruned[0]).toMatchObject({ name: 'x', reason: 'not_offered_by_business' });
  });
});

describe('negotiate', () => {
  it('produces the default active set with reasons for every prune', () => {
    const n = ok(negotiate(J(BUSINESS_PROFILE), J(PLATFORM_PROFILE), LEAF_PROFILES));
    expect(n.protocolVersion).toBe(SPEC_VERSION);
    expect(names(n)).toEqual([
      'dev.ucp.common.payment.split_payments',
      'dev.ucp.shopping.checkout',
      'dev.ucp.shopping.discount',
      'dev.ucp.shopping.fulfillment',
      'dev.ucp.shopping.order',
      'example.juniper.shopping.gift_wrap',
    ]);
    expect(n.active.find((c) => c.name === 'example.juniper.shopping.gift_wrap')?.version).toBe('2026-06-01');
    expect(prunedOf(n, 'dev.ucp.shopping.cart')?.reason).toBe('not_offered_by_platform');
    expect(prunedOf(n, 'dev.ucp.common.payment.ap2_mandate')?.reason).toBe('not_offered_by_platform');
    expect(n.incompatible).toBe(false);
  });
  it('prunes extensions when the agent drops checkout', () => {
    const p = clone(PLATFORM_PROFILE);
    delete p.ucp.capabilities?.['dev.ucp.shopping.checkout'];
    const n = ok(negotiate(J(BUSINESS_PROFILE), J(p), LEAF_PROFILES));
    expect(names(n)).toEqual(['dev.ucp.shopping.order']);
    expect(prunedOf(n, 'dev.ucp.shopping.fulfillment')).toMatchObject({ reason: 'orphaned_extension', round: 1 });
    expect(prunedOf(n, 'example.juniper.shopping.gift_wrap')).toMatchObject({ reason: 'orphaned_extension', round: 2 });
  });
  it('negotiates on the leaf profile for an older agent', () => {
    const p = clone(PLATFORM_PROFILE);
    p.ucp.version = '2026-04-08';
    p.ucp.capabilities = {
      'dev.ucp.shopping.checkout': [{ version: '2026-04-08', schema: 'https://ucp.dev/2026-04-08/schemas/shopping/checkout.json' }],
      'dev.ucp.shopping.ap2_mandate': [
        { version: '2026-04-08', schema: 'https://ucp.dev/2026-04-08/schemas/shopping/ap2_mandate.json', extends: 'dev.ucp.shopping.checkout' },
      ],
    };
    const n = ok(negotiate(J(BUSINESS_PROFILE), J(p), LEAF_PROFILES));
    expect(n.via).toBe('supported_versions');
    expect(names(n)).toEqual(['dev.ucp.shopping.ap2_mandate', 'dev.ucp.shopping.checkout']);
  });
  it('fails with version_unsupported (422, MCP -32001)', () => {
    const p = clone(PLATFORM_PROFILE);
    p.ucp.version = '2026-01-11';
    const n = negotiate(J(BUSINESS_PROFILE), J(p), LEAF_PROFILES);
    expect(n).toMatchObject({ ok: false, code: 'version_unsupported', httpStatus: 422, mcpCode: -32001 });
  });
  it('fails with profile_malformed for a broken agent profile', () => {
    expect(negotiate(J(BUSINESS_PROFILE), '[]', LEAF_PROFILES)).toMatchObject({ ok: false, code: 'profile_malformed', side: 'platform' });
  });
  it('marks an empty intersection as capabilities_incompatible', () => {
    const p = clone(PLATFORM_PROFILE);
    p.ucp.capabilities = {};
    const n = ok(negotiate(J(BUSINESS_PROFILE), J(p), LEAF_PROFILES));
    expect(n.incompatible).toBe(true);
  });
});

describe('isActive and responseCapabilities', () => {
  const n = ok(negotiate(J(BUSINESS_PROFILE), J(PLATFORM_PROFILE), LEAF_PROFILES));
  it('answers membership', () => {
    expect(isActive(n, 'dev.ucp.shopping.checkout')).toBe(true);
    expect(isActive(n, 'dev.ucp.shopping.cart')).toBe(false);
    expect(isActive(null, 'dev.ucp.shopping.checkout')).toBe(false);
  });
  it('declares the root and its direct extensions only', () => {
    const caps = responseCapabilities(n, 'dev.ucp.shopping.checkout');
    expect(Object.keys(caps).sort()).toEqual([
      'dev.ucp.common.payment.split_payments',
      'dev.ucp.shopping.checkout',
      'dev.ucp.shopping.discount',
      'dev.ucp.shopping.fulfillment',
    ]);
    expect(caps['dev.ucp.shopping.checkout']).toEqual([{ version: SPEC_VERSION }]);
  });
});

describe('ucpAgentHeader', () => {
  it('uses RFC 8941 dictionary syntax', () => {
    expect(ucpAgentHeader(PLATFORM_PROFILE_URL)).toBe('profile="https://agent.example/.well-known/ucp"');
    expect(ucpAgentHeader('a"b')).toBe('profile="a\\"b"');
  });
});

describe('payment handlers', () => {
  it('intersects instrument types and brand constraints', () => {
    const r = resolveInstruments(
      [{ type: 'card', constraints: { properties: { brand: { enum: ['visa', 'mastercard', 'amex'] } } } }],
      [{ type: 'card', constraints: { properties: { brand: { enum: ['visa', 'mastercard', 'amex', 'discover'] } } } }],
    );
    expect(r).toEqual([{ type: 'card', constraints: { properties: { brand: { enum: ['visa', 'mastercard', 'amex'] } } } }]);
    expect(resolveInstruments(undefined, undefined)).toBeUndefined();
    expect(resolveInstruments([{ type: 'card' }], undefined)).toEqual([{ type: 'card' }]);
    expect(resolveInstruments([{ type: 'card' }], [{ type: 'gift_card' }])).toBeNull();
    expect(
      resolveInstruments(
        [{ type: 'card', constraints: { properties: { brand: { enum: ['visa'] } } } }],
        [{ type: 'card', constraints: { properties: { brand: { enum: ['amex'] } } } }],
      ),
    ).toBeNull();
  });
  it('filters handlers by agent support and cart context', () => {
    const base = resolveHandlers(BUSINESS_PROFILE.ucp.payment_handlers, PLATFORM_PROFILE.ucp.payment_handlers, { hasSubscription: false });
    expect(base.active.map((h) => h.id)).toEqual(['processor_tokenizer', 'wallet_1', 'installments_1', 'gift_card_1']);
    const sub = resolveHandlers(BUSINESS_PROFILE.ucp.payment_handlers, PLATFORM_PROFILE.ucp.payment_handlers, { hasSubscription: true });
    expect(sub.excluded).toEqual([expect.objectContaining({ id: 'installments_1', reason: 'filtered_by_cart_context' })]);
    const narrow = resolveHandlers(
      BUSINESS_PROFILE.ucp.payment_handlers,
      { 'com.example.wallet': PLATFORM_PROFILE.ucp.payment_handlers['com.example.wallet'] as Entity[] },
      { hasSubscription: false },
    );
    expect(narrow.active.map((h) => h.id)).toEqual(['wallet_1']);
    expect(narrow.excluded.every((x) => x.reason === 'platform_cannot_execute' && x.simplification)).toBe(true);
  });
  it('excludes a handler whose schema host does not own its name', () => {
    const r = resolveHandlers(
      { 'com.example.pay': [{ id: 'p', version: '2026-01-01', schema: 'https://evil.example/s.json' }] },
      { 'com.example.pay': [{ id: 'p', version: '2026-01-01' }] },
      { hasSubscription: false },
    );
    expect(r.excluded[0]?.reason).toBe('authority_binding_failed');
  });
  it('renders the response registry', () => {
    const { active } = resolveHandlers(BUSINESS_PROFILE.ucp.payment_handlers, PLATFORM_PROFILE.ucp.payment_handlers, { hasSubscription: false });
    const out = handlersForResponse(active);
    expect(out['com.example.processor_tokenizer']?.[0]).toMatchObject({ id: 'processor_tokenizer', version: '2026-07-01' });
  });
  it('enforces exactly one instrument without split payments, and constraints', () => {
    const { active } = resolveHandlers(BUSINESS_PROFILE.ucp.payment_handlers, PLATFORM_PROFILE.ucp.payment_handlers, { hasSubscription: false });
    expect(validateSubmission([opt('visa')], active, false)).toEqual([]);
    expect(validateSubmission([opt('visa'), opt('gift_card')], active, false)[0]?.code).toBe('payment_failed');
    expect(validateSubmission([opt('visa'), opt('gift_card')], active, true)).toEqual([]);
    expect(validateSubmission([], active, true)[0]?.code).toBe('payment_failed');
    const discover = validateSubmission([opt('discover')], active, false);
    expect(discover[0]).toMatchObject({ code: 'payment_failed', path: '$.payment.instruments[0]' });
    expect(validateSubmission([opt('wallet')], [], false)[0]?.content).toContain('not offered');
  });
  it('never echoes the credential back', () => {
    expect(instrumentPayload(opt('visa'), 0)).toHaveProperty('credential.token');
    expect(instrumentEcho(opt('visa'), 0)).not.toHaveProperty('credential');
    expect(instrumentEcho(opt('visa'), 0)).toMatchObject({ handler_id: 'processor_tokenizer', type: 'card' });
  });
});

const T0 = Date.UTC(2026, 9, 11, 12, 0, 0);
const goodData: CheckoutData = { lineItems: [{ itemId: 'sku_trail_mug', quantity: 2 }], buyerEmail: 'buyer@shopper.example' };
const handlers = resolveHandlers(BUSINESS_PROFILE.ucp.payment_handlers, PLATFORM_PROFILE.ucp.payment_handlers, {
  hasSubscription: false,
}).active;
const ctx: SessionContext = { splitPayments: false, ap2Locked: false, handlers, businessOrigin: 'https://juniper.example' };
const policy = (p: Partial<BusinessPolicy> = {}): BusinessPolicy => ({ ...DEFAULT_POLICY, ...p });

describe('checkout helpers', () => {
  it('computes totals with the fixture tax rate', () => {
    expect(computeTotals(goodData.lineItems)).toEqual({ subtotal: 3600, tax: 288, total: 3888 });
    expect(formatMoney(3888)).toBe('$38.88');
  });
  it('knows terminal states', () => {
    expect(isTerminal('completed')).toBe(true);
    expect(isTerminal('canceled')).toBe(true);
    expect(isTerminal('ready_for_complete')).toBe(false);
  });
  it('builds the server-state continue_url', () => {
    expect(continueUrlFor('https://juniper.example', 'chk_1')).toBe('https://juniper.example/checkout-sessions/chk_1');
  });
  it('derives the status from messages', () => {
    expect(evaluate(goodData, policy()).status).toBe('ready_for_complete');
    expect(evaluate({ ...goodData, buyerEmail: '' }, policy()).status).toBe('incomplete');
    const esc = evaluate({ ...goodData, buyerEmail: '' }, policy({ requireDeliveryWindow: true }));
    expect(esc.status).toBe('requires_escalation');
    expect(esc.messages.map((m) => m.severity)).toEqual(['recoverable', 'requires_buyer_input']);
    const review = evaluate({ ...goodData, lineItems: [{ itemId: 'sku_camp_stove', quantity: 2 }] }, policy());
    expect(review.messages[0]).toMatchObject({ code: 'high_value_order', severity: 'requires_buyer_review' });
  });
});

describe('checkout state machine', () => {
  it('creates with a 6 hour default expiry and a continue_url', () => {
    const { session } = createCheckout('chk_1', goodData, policy(), ctx, T0);
    expect(session.status).toBe('ready_for_complete');
    expect(session.expiresAt - session.createdAt).toBe(DEFAULT_TTL_MS);
    expect(session.continueUrl).toBe('https://juniper.example/checkout-sessions/chk_1');
    expect(checkInvariants(session)).toEqual([]);
  });
  it('escalates with continue_url and resolves back to incomplete through update', () => {
    const big = { ...goodData, buyerEmail: '', lineItems: [{ itemId: 'sku_camp_stove', quantity: 2 }] };
    const { session } = createCheckout('chk_2', big, policy(), ctx, T0);
    expect(session.status).toBe('requires_escalation');
    expect(session.continueUrl).toBeDefined();
    const back = updateCheckout(session, { ...big, lineItems: [{ itemId: 'sku_trail_mug', quantity: 1 }] }, policy(), ctx, T0 + 1000);
    expect(back.session.status).toBe('incomplete');
  });
  it('flags a missing continue_url on escalation as a spec violation', () => {
    const { session } = createCheckout('chk_3', goodData, policy({ requireDeliveryWindow: true, omitContinueUrl: true }), ctx, T0);
    expect(session.status).toBe('requires_escalation');
    expect(checkInvariants(session)).toContain('requires_escalation must carry continue_url');
    expect(buyerCompletesHandoff(session, policy(), ctx, T0, 'ord_1').outcome).toBe('rejected');
  });
  it('completes through the continue_url handoff', () => {
    const { session } = createCheckout('chk_4', goodData, policy({ requireDeliveryWindow: true }), ctx, T0);
    const done = buyerCompletesHandoff(session, policy(), ctx, T0 + 5, 'ord_4');
    expect(done.session.status).toBe('completed');
    expect(done.session.order?.permalink_url).toBe('https://juniper.example/orders/ord_4');
    expect(done.session.continueUrl).toBeUndefined();
    expect(buyerCompletesHandoff(done.session, policy(), ctx, T0, 'x').outcome).toBe('rejected');
  });
  it('completes synchronously with one valid instrument', () => {
    const { session } = createCheckout('chk_5', goodData, policy(), ctx, T0);
    const r = completeCheckout(session, { instruments: [opt('visa')], checkoutMandate: false }, policy(), ctx, T0 + 1, 'ord_5');
    expect(r.session.status).toBe('completed');
    expect(r.session.order?.id).toBe('ord_5');
    expect(checkInvariants(r.session)).toEqual([]);
    expect(updateCheckout(r.session, goodData, policy(), ctx, T0 + 2).outcome).toBe('rejected');
  });
  it('rejects a second instrument without split payments, with payment_failed', () => {
    const { session } = createCheckout('chk_6', goodData, policy(), ctx, T0);
    const r = completeCheckout(session, { instruments: [opt('visa'), opt('gift_card')], checkoutMandate: false }, policy(), ctx, T0, 'o');
    expect(r.outcome).toBe('unchanged');
    expect(r.session.status).toBe('ready_for_complete');
    expect(r.session.messages[0]?.code).toBe('payment_failed');
    const split = completeCheckout(session, { instruments: [opt('visa'), opt('gift_card')], checkoutMandate: false }, policy(), { ...ctx, splitPayments: true }, T0, 'o');
    expect(split.session.status).toBe('completed');
  });
  it('requires ap2.checkout_mandate when the session is security locked', () => {
    const locked = { ...ctx, ap2Locked: true };
    const { session } = createCheckout('chk_7', goodData, policy(), locked, T0);
    const r = completeCheckout(session, { instruments: [opt('visa')], checkoutMandate: false }, policy(), locked, T0, 'o');
    expect(r.session.messages[0]?.code).toBe('mandate_required');
    const ok2 = completeCheckout(session, { instruments: [opt('visa')], checkoutMandate: true }, policy(), locked, T0, 'o');
    expect(ok2.session.status).toBe('completed');
  });
  it('refuses Complete Checkout outside ready_for_complete', () => {
    const { session } = createCheckout('chk_8', { ...goodData, buyerEmail: '' }, policy(), ctx, T0);
    expect(completeCheckout(session, { instruments: [opt('visa')], checkoutMandate: false }, policy(), ctx, T0, 'o').outcome).toBe('rejected');
  });
  it('handles asynchronous completion and freezes updates', () => {
    const p = policy({ asyncCompletion: true });
    const { session } = createCheckout('chk_9', goodData, p, ctx, T0);
    const inProgress = completeCheckout(session, { instruments: [opt('visa')], checkoutMandate: false }, p, ctx, T0, 'o9').session;
    expect(inProgress.status).toBe('complete_in_progress');
    expect(inProgress.order).toBeUndefined();
    const upd = updateCheckout(inProgress, goodData, p, ctx, T0);
    expect(upd.outcome).toBe('unchanged');
    expect(upd.session.status).toBe('complete_in_progress');
    expect(upd.session.messages.at(-1)?.severity).toBe('recoverable');
    expect(completeCheckout(inProgress, { instruments: [opt('visa')], checkoutMandate: false }, p, ctx, T0, 'o').outcome).toBe('rejected');
    const done = finishProcessing(inProgress, p, ctx, T0 + 10, 'o9');
    expect(done.session.status).toBe('completed');
    expect(finishProcessing(done.session, p, ctx, T0, 'o9').outcome).toBe('rejected');
  });
  it('cancels from any non-terminal state and refuses terminal ones', () => {
    for (const p of [policy(), policy({ requireDeliveryWindow: true })]) {
      const { session } = createCheckout('chk_c', goodData, p, ctx, T0);
      const c = cancelCheckout(session, p, ctx, T0);
      expect(c.session.status).toBe('canceled');
      expect(c.session.continueUrl).toBeUndefined();
      expect(cancelCheckout(c.session, p, ctx, T0).outcome).toBe('rejected');
    }
  });
  it('expires after 6 hours and then refuses updates', () => {
    const { session } = createCheckout('chk_e', goodData, policy(), ctx, T0);
    expect(expireIfDue(session, T0 + DEFAULT_TTL_MS - 1, policy(), ctx).outcome).toBe('unchanged');
    const exp = expireIfDue(session, T0 + DEFAULT_TTL_MS, policy(), ctx);
    expect(exp.session.status).toBe('canceled');
    const late = updateCheckout(session, goodData, policy(), ctx, T0 + DEFAULT_TTL_MS + 1);
    expect(late.outcome).toBe('rejected');
    expect(late.session.status).toBe('canceled');
    const lateComplete = completeCheckout(session, { instruments: [opt('visa')], checkoutMandate: false }, policy(), ctx, T0 + DEFAULT_TTL_MS, 'o');
    expect(lateComplete.session.status).toBe('canceled');
  });
  it('records every transition', () => {
    const { session } = createCheckout('chk_h', goodData, policy(), ctx, T0);
    const c = cancelCheckout(session, policy(), ctx, T0 + 1).session;
    expect(c.history.map((h) => [h.from, h.to])).toEqual([
      [null, 'ready_for_complete'],
      ['ready_for_complete', 'canceled'],
    ]);
  });
});

describe('checkIdempotency', () => {
  it('replays the same body and conflicts on a different one (409)', () => {
    const store = new Map<string, string>();
    expect(checkIdempotency(store, 'k', '{"a":1}')).toBe('first');
    expect(checkIdempotency(store, 'k', '{"a":1}')).toBe('replay');
    expect(checkIdempotency(store, 'k', '{"a":2}')).toBe('conflict');
  });
});

describe('transport bindings', () => {
  const n = ok(negotiate(J(BUSINESS_PROFILE), J(PLATFORM_PROFILE), LEAF_PROFILES));
  const { session } = createCheckout('chk_w', goodData, policy(), ctx, T0);
  const wctx: WireContext = {
    session,
    data: goodData,
    instruments: [opt('visa')],
    ap2Locked: false,
    checkoutMandate: false,
    envelope: {
      version: n.protocolVersion,
      capabilities: responseCapabilities(n, 'dev.ucp.shopping.checkout'),
      payment_handlers: handlersForResponse(handlers),
    },
    platformProfileUrl: PLATFORM_PROFILE_URL,
    idempotencyKey: '00000000-0000-4000-8000-000000000001',
    requestId: '00000000-0000-4000-8000-000000000002',
    rpcId: 7,
    contextId: 'ctx-1',
    messageId: 'msg-1',
  };
  it('maps every operation to its REST path and MCP tool', () => {
    expect(OPERATION_ORDER.map((o) => `${OPERATIONS[o].rest.method} ${OPERATIONS[o].rest.path}`)).toEqual([
      'POST /checkout-sessions',
      'GET /checkout-sessions/{id}',
      'PUT /checkout-sessions/{id}',
      'POST /checkout-sessions/{id}/complete',
      'POST /checkout-sessions/{id}/cancel',
    ]);
    expect(OPERATION_ORDER.map((o) => OPERATIONS[o].mcpTool)).toEqual([
      'create_checkout',
      'get_checkout',
      'update_checkout',
      'complete_checkout',
      'cancel_checkout',
    ]);
  });
  it('builds request bodies without response-only fields', () => {
    expect(requestBody('create', wctx)).toEqual({ line_items: [{ item: { id: 'sku_trail_mug' }, quantity: 2 }], buyer: { email: 'buyer@shopper.example' } });
    expect(requestBody('update', wctx)?.line_items).toEqual([{ id: 'li_1', item: { id: 'sku_trail_mug' }, quantity: 2 }]);
    expect(requestBody('get', wctx)).toBeNull();
    expect(requestBody('cancel', wctx)).toEqual({});
    const complete = requestBody('complete', { ...wctx, ap2Locked: true, checkoutMandate: true });
    expect(complete).toHaveProperty('payment.instruments');
    expect(complete).toHaveProperty('ap2.checkout_mandate');
  });
  it('renders REST with the required headers on the endpoint path', () => {
    const req = renderRequest('complete', 'rest', wctx).text;
    expect(req).toContain('POST /ucp/v1/checkout-sessions/chk_w/complete HTTP/1.1');
    expect(req).toContain('UCP-Agent: profile="https://agent.example/.well-known/ucp"');
    expect(req).toContain('Idempotency-Key: 00000000-0000-4000-8000-000000000001');
    expect(req).toContain('Request-Id: ');
    const get = renderRequest('get', 'rest', wctx).text;
    expect(get).not.toContain('Idempotency-Key');
    expect(get).not.toContain('Content-Type');
  });
  it('renders MCP tools/call with meta and id rules', () => {
    const create = JSON.parse(renderRequest('create', 'mcp', wctx).text);
    expect(create.params.name).toBe('create_checkout');
    expect(create.params.arguments.meta['ucp-agent'].profile).toBe(PLATFORM_PROFILE_URL);
    expect(create.params.arguments.id).toBeUndefined();
    expect(create.params.arguments.meta['idempotency-key']).toBeUndefined();
    const cancel = JSON.parse(renderRequest('cancel', 'mcp', wctx).text);
    expect(cancel.params.arguments).toMatchObject({ id: 'chk_w', meta: { 'idempotency-key': wctx.idempotencyKey } });
    expect(cancel.params.arguments.checkout).toBeUndefined();
    const update = JSON.parse(renderRequest('update', 'mcp', wctx).text);
    expect(update.params.arguments.checkout.id).toBeUndefined();
  });
  it('renders A2A message/send with the UCP extension header and DataPart keys', () => {
    const req = renderRequest('complete', 'a2a', wctx).text;
    expect(req).toContain('X-A2A-Extensions: https://ucp.dev/2026-08-25/specification/reference');
    const json = JSON.parse(req.slice(req.indexOf('{')));
    expect(json.method).toBe('message/send');
    expect(json.params.message.parts[0].data.action).toBe('complete_checkout');
    expect(json.params.message.parts[1].data).toHaveProperty(['a2a.ucp.checkout.payment']);
    expect(json.params.message.parts[1].data).toHaveProperty(['a2a.ucp.checkout.signals']);
    const create = JSON.parse(renderRequest('create', 'a2a', wctx).text.split('\n\n')[1] ?? '');
    expect(create.params.message.parts[0].data).toEqual({ action: 'add_to_checkout', product_id: 'sku_trail_mug', quantity: 2 });
    expect(renderRequest('get', 'a2a', wctx).simplifications.length).toBeGreaterThan(1);
  });
  it('wraps the same checkout resource per transport', () => {
    const resource = checkoutResource(session, wctx.envelope, false);
    expect(resource).toMatchObject({ id: 'chk_w', status: 'ready_for_complete', currency: 'USD' });
    expect(resource.totals).toEqual([
      { type: 'subtotal', amount: 3600 },
      { type: 'tax', amount: 288 },
      { type: 'total', amount: 3888 },
    ]);
    expect(resource.expires_at).toBe('2026-10-11T18:00:00.000Z');
    expect(renderResponse('create', 'rest', wctx, resource).text.startsWith('HTTP/1.1 201 Created')).toBe(true);
    expect(JSON.parse(renderResponse('get', 'mcp', wctx, resource).text).result.structuredContent.id).toBe('chk_w');
    const a2a = JSON.parse(renderResponse('get', 'a2a', wctx, resource).text);
    expect(a2a.result.parts[0].data['a2a.ucp.checkout'].id).toBe('chk_w');
  });
  it('adds ap2.merchant_authorization as a detached JWS when locked', () => {
    const resource = checkoutResource(session, wctx.envelope, true) as { ap2: { merchant_authorization: string } };
    expect(resource.ap2.merchant_authorization).toMatch(/^[A-Za-z0-9_-]+\.\.[A-Za-z0-9_-]+$/);
    const header = JSON.parse(Buffer.from(fixtureMerchantAuthorization('k').split('.')[0] ?? '', 'base64url').toString());
    expect(header).toEqual({ alg: 'ES256', kid: 'k' });
    expect(fixtureCheckoutMandate().split('~')).toHaveLength(3);
  });
});

describe('clone', () => {
  it('deep copies fixtures', () => {
    const c = clone(BUSINESS_PROFILE);
    c.ucp.version = 'x';
    expect(BUSINESS_PROFILE.ucp.version).toBe(SPEC_VERSION);
  });
});

// Cross-check names against the vendored spec when it is present (research/vendor is not committed).
const VENDOR = 'research/vendor/ucp/source/services/shopping';
describe.skipIf(!existsSync(`${VENDOR}/rest.openapi.json`))('vendored spec cross-check', () => {
  it('uses real REST paths and MCP tool names', () => {
    const rest = JSON.parse(readFileSync(`${VENDOR}/rest.openapi.json`, 'utf8')) as { paths: Record<string, Record<string, unknown>> };
    const mcp = JSON.parse(readFileSync(`${VENDOR}/mcp.openrpc.json`, 'utf8')) as { methods: { name: string }[] };
    for (const op of OPERATION_ORDER) {
      const { method, path } = OPERATIONS[op].rest;
      expect(rest.paths[path]?.[method.toLowerCase()]).toBeDefined();
      expect(mcp.methods.map((m) => m.name)).toContain(OPERATIONS[op].mcpTool);
    }
  });
});
