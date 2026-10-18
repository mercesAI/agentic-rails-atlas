import { useEffect, useMemo, useRef, useState } from 'react';
import './ucp.css';
import { Note } from '@/components/playground/Note';
import { NumberField } from '@/components/playground/NumberField';
import { Segmented } from '@/components/playground/Segmented';
import { TabList } from '@/components/playground/Tabs';
import { Wire as KitWire } from '@/components/playground/Wire';
import { clone, pretty } from '@/lib/playground/util';
import {
  DEFAULT_POLICY,
  FIXTURE_CODES,
  buyerCompletesHandoff,
  cancelCheckout,
  checkIdempotency,
  checkInvariants,
  completeCheckout,
  computeTotals,
  createCheckout,
  expireIfDue,
  finishProcessing,
  formatMoney,
  updateCheckout,
  type BusinessPolicy,
  type CheckoutData,
  type CheckoutSession,
  type SessionContext,
  type StepResult,
} from './lib/checkout';
import {
  BUSINESS_PROFILE,
  CATALOG,
  INSTRUMENT_OPTIONS,
  LEAF_PROFILES,
  PLATFORM_PROFILE,
  PLATFORM_PROFILE_URL,
  type InstrumentOption,
} from './lib/fixtures';
import {
  PRUNE_REASON_TEXT,
  isActive,
  negotiate,
  parseProfile,
  responseCapabilities,
  ucpAgentHeader,
  type NegotiationFailure,
} from './lib/negotiate';
import { handlersForResponse, resolveHandlers, validateSubmission } from './lib/payment';
import {
  OPERATIONS,
  OPERATION_ORDER,
  checkoutResource,
  renderRequest,
  renderResponse,
  type Envelope,
  type Operation,
  type WireContext,
  type WireTransport,
} from './lib/transport';
import { CHECKOUT_STATUSES, EXAMPLE_LABEL, SIMPLIFICATION_LABEL, SPEC_VERSION, type Profile } from './lib/types';

type Tab = 'negotiate' | 'payment' | 'checkout' | 'transport';
const TABS: { id: Tab; label: string }[] = [
  { id: 'negotiate', label: '1. Profile negotiation' },
  { id: 'payment', label: '2. Payment handlers' },
  { id: 'checkout', label: '3. Checkout state machine' },
  { id: 'transport', label: '4. Transport switcher' },
];

const AP2 = 'dev.ucp.common.payment.ap2_mandate';
const AP2_OLD = 'dev.ucp.shopping.ap2_mandate';
const CHECKOUT = 'dev.ucp.shopping.checkout';
const SPLIT = 'dev.ucp.common.payment.split_payments';
const ORIGIN = 'https://juniper.example';
const T0 = Date.UTC(2026, 9, 11, 12, 0, 0);

interface Preset {
  id: string;
  label: string;
  build: () => { business: Profile; platform: Profile };
}

const PRESETS: Preset[] = [
  { id: 'default', label: 'Fixture defaults', build: () => ({ business: clone(BUSINESS_PROFILE), platform: clone(PLATFORM_PROFILE) }) },
  {
    id: 'ap2',
    label: 'Agent also supports AP2 mandates (security lock)',
    build: () => {
      const platform = clone(PLATFORM_PROFILE);
      const entry = BUSINESS_PROFILE.ucp.capabilities?.[AP2]?.[0];
      if (entry && platform.ucp.capabilities) platform.ucp.capabilities[AP2] = [{ ...entry, config: undefined }];
      return { business: clone(BUSINESS_PROFILE), platform: JSON.parse(JSON.stringify(platform)) as Profile };
    },
  },
  {
    id: 'no-checkout',
    label: 'Agent drops checkout (extensions pruned in two rounds)',
    build: () => {
      const platform = clone(PLATFORM_PROFILE);
      delete platform.ucp.capabilities?.[CHECKOUT];
      return { business: clone(BUSINESS_PROFILE), platform };
    },
  },
  {
    id: 'old',
    label: 'Agent on the older release 2026-04-08 (leaf profile)',
    build: () => {
      const platform = clone(PLATFORM_PROFILE);
      const v = '2026-04-08';
      platform.ucp.version = v;
      platform.ucp.capabilities = {
        [CHECKOUT]: [{ version: v, schema: `https://ucp.dev/${v}/schemas/shopping/checkout.json` }],
        [AP2_OLD]: [{ version: v, schema: `https://ucp.dev/${v}/schemas/shopping/ap2_mandate.json`, extends: CHECKOUT }],
      };
      return { business: clone(BUSINESS_PROFILE), platform };
    },
  },
  {
    id: 'unsupported',
    label: 'Agent on a release the business does not support',
    build: () => {
      const platform = clone(PLATFORM_PROFILE);
      platform.ucp.version = '2026-01-11';
      return { business: clone(BUSINESS_PROFILE), platform };
    },
  },
  {
    id: 'binding',
    label: 'Vendor extension schema on a foreign host',
    build: () => {
      const business = clone(BUSINESS_PROFILE);
      for (const e of business.ucp.capabilities?.['example.juniper.shopping.gift_wrap'] ?? []) {
        e.schema = 'https://cdn.example/ucp/schemas/gift_wrap.json';
      }
      return { business, platform: clone(PLATFORM_PROFILE) };
    },
  },
  {
    id: 'core-skew',
    label: 'Core extension declared on the wrong release',
    build: () => {
      const business = clone(BUSINESS_PROFILE);
      const e = business.ucp.capabilities?.['dev.ucp.shopping.fulfillment']?.[0];
      if (e) e.version = '2026-04-08';
      return { business, platform: clone(PLATFORM_PROFILE) };
    },
  },
  {
    id: 'no-common',
    label: 'Vendor extension with no version in common',
    build: () => {
      const platform = clone(PLATFORM_PROFILE);
      const e = platform.ucp.capabilities?.['example.juniper.shopping.gift_wrap']?.[0];
      if (e) e.version = '2026-03-01';
      return { business: clone(BUSINESS_PROFILE), platform };
    },
  },
  {
    id: 'private-key',
    label: 'Business publishes a private key member',
    build: () => {
      const business = clone(BUSINESS_PROFILE);
      if (business.keys?.[0]) business.keys[0].d = 'fixture-private-scalar';
      return { business, platform: clone(PLATFORM_PROFILE) };
    },
  },
];

function uuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `00000000-0000-4000-8000-${String(Date.now()).padStart(12, '0').slice(-12)}`;
  }
}

/** A wire-format block with the example label, as every UCP message is a fixture. */
function Wire({ title, text }: { title: string; text: string }) {
  // JSON and HTTP text keep their line structure and scroll sideways, as the old .ucp-pre did.
  return <KitWire wrap="none" title={title} text={text} note={<p className="ucp-label">{EXAMPLE_LABEL}</p>} />;
}

export default function UcpPlayground() {
  const [tab, setTab] = useState<Tab>('negotiate');
  const [presetId, setPresetId] = useState('default');
  const [businessText, setBusinessText] = useState(() => pretty(BUSINESS_PROFILE));
  const [platformText, setPlatformText] = useState(() => pretty(PLATFORM_PROFILE));
  const [announce, setAnnounce] = useState('Simulation ready. Start with profile negotiation.');

  const [quantities, setQuantities] = useState<Record<string, number>>({ sku_trail_mug: 2 });
  const [buyerEmail, setBuyerEmail] = useState('buyer@shopper.example');
  const [policy, setPolicy] = useState<BusinessPolicy>(DEFAULT_POLICY);
  const [selected, setSelected] = useState<string[]>(['visa']);
  const [checkoutMandate, setCheckoutMandate] = useState(true);
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [now, setNow] = useState(T0);
  const [lastOp, setLastOp] = useState<Operation>('create');
  const [conflict, setConflict] = useState<string | null>(null);
  const idem = useRef(new Map<string, string>());
  const lastKey = useRef<{ key: string; body: string } | null>(null);
  const seq = useRef(1);

  const [wireOp, setWireOp] = useState<Operation>('create');
  const [transport, setTransport] = useState<WireTransport>('rest');

  const negotiation = useMemo(() => negotiate(businessText, platformText, LEAF_PROFILES), [businessText, platformText]);
  const nOk = negotiation.ok ? negotiation : null;
  // The failure block is a polite status region whose content settles 500 ms after typing stops,
  // so it is announced once per pause instead of on every keystroke.
  const [shownFailure, setShownFailure] = useState<NegotiationFailure | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setShownFailure(negotiation.ok ? null : negotiation), 500);
    return () => clearTimeout(t);
  }, [negotiation]);

  const data: CheckoutData = useMemo(
    () => ({
      lineItems: CATALOG.filter((c) => (quantities[c.id] ?? 0) > 0).map((c) => ({ itemId: c.id, quantity: quantities[c.id] ?? 0 })),
      buyerEmail,
    }),
    [quantities, buyerEmail],
  );
  const hasSubscription = data.lineItems.some((li) => CATALOG.find((c) => c.id === li.itemId)?.subscription);

  const handlerResult = useMemo(() => {
    const b = parseProfile(businessText, 'business');
    const p = parseProfile(platformText, 'platform');
    if (!b.ok || !p.ok) return null;
    return resolveHandlers(b.profile.ucp.payment_handlers, p.profile.ucp.payment_handlers, { hasSubscription });
  }, [businessText, platformText, hasSubscription]);

  const splitPayments = isActive(negotiation, SPLIT);
  const ap2Locked = isActive(negotiation, AP2) || isActive(negotiation, AP2_OLD);
  const checkoutActive = isActive(negotiation, CHECKOUT);
  const instruments: InstrumentOption[] = INSTRUMENT_OPTIONS.filter((o) => selected.includes(o.key));
  const ctx: SessionContext = {
    splitPayments,
    ap2Locked,
    handlers: handlerResult?.active ?? [],
    businessOrigin: ORIGIN,
  };

  const envelope: Envelope = {
    version: nOk?.protocolVersion ?? SPEC_VERSION,
    capabilities: nOk ? responseCapabilities(nOk, CHECKOUT) : {},
    payment_handlers: handlersForResponse(handlerResult?.active ?? []),
  };

  function applyPreset(id: string) {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const { business, platform } = preset.build();
    setBusinessText(pretty(business));
    setPlatformText(pretty(platform));
    setSession(null);
    // The retry key, the idempotency cache and the clock belonged to the cleared session.
    lastKey.current = null;
    idem.current = new Map();
    setConflict(null);
    setLastOp('create');
    setNow(T0);
    setAnnounce(`Loaded scenario: ${preset.label}. The checkout session was cleared.`);
  }

  function record(op: Operation, result: StepResult, body?: unknown) {
    setSession(result.session);
    setLastOp(op);
    setWireOp(op);
    setConflict(null);
    if (body !== undefined) {
      const key = uuid();
      const text = JSON.stringify(body);
      checkIdempotency(idem.current, key, text);
      lastKey.current = { key, body: text };
    }
    setAnnounce(`${OPERATIONS[op].label}: ${result.outcome}. ${result.note}. Status is ${result.session.status}.`);
  }

  const nextOrderId = () => `ord_${1000 + seq.current++}`;

  function run(op: Operation) {
    if (op === 'create') {
      const id = `chk_${Math.random().toString(36).slice(2, 10)}`;
      record(op, createCheckout(id, data, policy, ctx, now), data);
      return;
    }
    if (!session) return;
    if (op === 'get') record(op, expireIfDue(session, now, policy, ctx));
    if (op === 'update') record(op, updateCheckout(session, data, policy, ctx, now), data);
    if (op === 'complete') {
      record(op, completeCheckout(session, { instruments, checkoutMandate }, policy, ctx, now, nextOrderId()), {
        instruments: selected,
        checkoutMandate,
      });
    }
    if (op === 'cancel') record(op, cancelCheckout(session, policy, ctx, now), {});
  }

  function retrySameKey(changed: boolean) {
    const last = lastKey.current;
    if (!last) return;
    const body = changed ? `${last.body.slice(0, -1)},"changed":true}` : last.body;
    const verdict = checkIdempotency(idem.current, last.key, body);
    if (verdict === 'conflict') {
      setConflict(
        `HTTP/1.1 409 Conflict\n\nIdempotency-Key ${last.key} was reused with a different payload. MCP signals this with JSON-RPC error code -32000.`,
      );
      setAnnounce('Retry rejected with 409 Conflict: the idempotency key was reused with a different payload.');
    } else {
      setConflict(null);
      setAnnounce('Retry with the same key and the same body: the business returns the cached result, nothing runs twice.');
    }
  }

  function advance(hours: number) {
    const t = now + hours * 3600_000;
    setNow(t);
    if (session) {
      const r = expireIfDue(session, t, policy, ctx);
      setSession(r.session);
      setAnnounce(
        r.outcome === 'applied'
          ? `Clock moved ${hours} hours. expires_at passed, so the session is canceled.`
          : `Clock moved ${hours} hours. The session has not expired.`,
      );
    } else setAnnounce(`Clock moved ${hours} hours.`);
  }

  // Wire rendering for the transport switcher.
  const previewSession = session ?? createCheckout('chk_preview', data, policy, ctx, now).session;
  const wctx: WireContext = {
    session: previewSession,
    data,
    instruments,
    ap2Locked,
    checkoutMandate,
    envelope,
    platformProfileUrl: PLATFORM_PROFILE_URL,
    idempotencyKey: lastKey.current?.key ?? '3b241101-e2bb-4255-8caf-4136c566a962',
    requestId: '6f1c2c8e-5a0b-4d3a-9e57-2f5d1f9b7c10',
    rpcId: 1 + OPERATION_ORDER.indexOf(wireOp),
    contextId: 'ctx-fixture-0001',
    messageId: `msg-fixture-${wireOp}`,
  };
  const wireReq = renderRequest(wireOp, transport, wctx);
  const wireRes = renderResponse(wireOp, transport, wctx, checkoutResource(previewSession, envelope, ap2Locked));

  const violations = session ? checkInvariants(session) : [];
  const preview = validateSubmission(instruments, ctx.handlers, splitPayments);
  const totals = computeTotals(data.lineItems);
  const terminal = session ? session.status === 'completed' || session.status === 'canceled' : true;

  return (
    <div className="ucp">
      <p className="ucp-live" role="status" aria-live="polite">
        {announce}
      </p>

      <TabList label="UCP playground parts" idPrefix="ucp" tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'negotiate' && (
        <section id="ucp-panel-negotiate" role="tabpanel" aria-labelledby="ucp-tab-negotiate" className="ucp">
          <p>
            Edit the business profile (served at <code>/.well-known/ucp</code>) or the agent profile (sent as{' '}
            <code>UCP-Agent: {ucpAgentHeader(PLATFORM_PROFILE_URL)}</code>). The business validates the agent version,
            intersects capabilities, picks the highest common version and prunes extensions whose parent is missing.
          </p>
          <div className="ucp-row">
            <label className="ucp-field">
              Scenario
              <select value={presetId} onChange={(e) => setPresetId(e.target.value)}>
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn" onClick={() => applyPreset(presetId)}>
              Load scenario
            </button>
          </div>
          <div className="ucp-grid">
            <label className="ucp-field">
              Business profile JSON ({EXAMPLE_LABEL})
              <textarea spellCheck={false} value={businessText} onChange={(e) => setBusinessText(e.target.value)} />
            </label>
            <label className="ucp-field">
              Agent (platform) profile JSON
              <textarea spellCheck={false} value={platformText} onChange={(e) => setPlatformText(e.target.value)} />
            </label>
          </div>

          {!negotiation.ok ? (
            shownFailure && (
              <div className="ucp-error" role="status">
                <p className="ucp-bad">
                  <code>{shownFailure.code}</code> (REST {shownFailure.httpStatus}, MCP {shownFailure.mcpCode})
                  {shownFailure.side ? `, in the ${shownFailure.side} profile` : ''}
                </p>
                <p>{shownFailure.detail}</p>
                <p className="ucp-label">
                  Discovery and version failures are transport errors and may carry a <code>continue_url</code> back to
                  the store.
                </p>
              </div>
            )
          ) : (
            <div className="ucp-grid">
              <div className="ucp-card">
                <h3>Negotiated result</h3>
                <p>
                  Protocol version <code>{negotiation.protocolVersion}</code>{' '}
                  {negotiation.via === 'current'
                    ? '(matches the business ucp.version)'
                    : `(a supported_versions key; the leaf profile at ${negotiation.leafUri} is used)`}
                </p>
                {negotiation.incompatible && (
                  <p className="ucp-bad" role="alert">
                    Empty intersection: <code>capabilities_incompatible</code>, returned as HTTP 200 with{' '}
                    <code>ucp.status: &quot;error&quot;</code>.
                  </p>
                )}
                {ap2Locked && (
                  <p className="ucp-warn">AP2 mandates are in the intersection: the session is security locked.</p>
                )}
                <table className="ucp-table">
                  <caption className="ucp-label">Active capabilities ({negotiation.active.length})</caption>
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Version</th>
                      <th scope="col">Extends</th>
                    </tr>
                  </thead>
                  <tbody>
                    {negotiation.active.map((c) => (
                      <tr key={c.name}>
                        <td className="ucp-ok">
                          <code>{c.name}</code>
                        </td>
                        <td>
                          <code>{c.version}</code>
                        </td>
                        <td>{c.extends ? <code>{c.extends.join(', ')}</code> : 'root'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {negotiation.warnings.map((w) => (
                  <p key={w} className="ucp-warn">
                    {w}
                  </p>
                ))}
              </div>
              <div className="ucp-card">
                <h3>Pruned and rejected ({negotiation.pruned.length})</h3>
                <ul className="ucp-list">
                  {negotiation.pruned.map((p) => (
                    <li key={`${p.name}-${p.reason}-${p.side ?? ''}`}>
                      <span className="ucp-bad">
                        <code>{p.name}</code>
                      </span>
                      : {PRUNE_REASON_TEXT[p.reason]}
                      {p.round ? ` (round ${p.round})` : ''}
                      {p.side ? ` [${p.side} entry]` : ''}. {p.detail}.
                    </li>
                  ))}
                </ul>
                <p className="ucp-label">
                  Core <code>dev.ucp.*</code> entries carry the release date as their version; only third-party
                  extensions version independently.
                </p>
              </div>
              <div className="ucp-card">
                <Wire
                  title="Response ucp envelope for a checkout operation"
                  text={pretty({ ucp: { version: envelope.version, capabilities: envelope.capabilities } })}
                />
                <p className="ucp-label">Only checkout and the extensions that extend it are declared on a checkout response.</p>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'payment' && (
        <section id="ucp-panel-payment" role="tabpanel" aria-labelledby="ucp-tab-payment" className="ucp">
          <p>
            The business advertises handlers, filters them by cart context and resolves each handler&apos;s{' '}
            <code>available_instruments</code> against the agent&apos;s declaration. The agent acquires a credential with
            the credential provider and submits it in <code>payment.instruments[]</code>; credentials flow one way.
          </p>
          <label>
            <input
              type="checkbox"
              checked={(quantities.sku_coffee_club ?? 0) > 0}
              onChange={(e) => setQuantities((q) => ({ ...q, sku_coffee_club: e.target.checked ? 1 : 0 }))}
            />
            Cart holds a subscription item (the business then filters out installments)
          </label>
          {!handlerResult ? (
            <p className="ucp-bad">A profile does not parse; fix it in the negotiation tab.</p>
          ) : (
            <div className="ucp-grid">
              <div className="ucp-card">
                <h3>Handlers offered for this checkout</h3>
                <ul className="ucp-list">
                  {handlerResult.active.map((h) => (
                    <li key={h.id} className="ucp-ok">
                      <code>{h.name}</code> (id <code>{h.id}</code>, version <code>{h.version}</code>):{' '}
                      {h.available_instruments
                        ? h.available_instruments
                            .map((ai) => `${ai.type}${ai.constraints?.properties?.brand?.enum ? ` [${ai.constraints.properties.brand.enum.join(', ')}]` : ''}`)
                            .join('; ')
                        : 'any instrument'}
                    </li>
                  ))}
                </ul>
                {handlerResult.excluded.length > 0 && <h4>Excluded</h4>}
                <ul className="ucp-list">
                  {handlerResult.excluded.map((h) => (
                    <li key={h.id} className="ucp-bad">
                      <code>{h.name}</code>: {h.detail}
                      {h.simplification ? ` (${SIMPLIFICATION_LABEL})` : ''}
                    </li>
                  ))}
                </ul>
                <Note kind="simplification">
                  a handler counts as usable only when the agent profile declares it too, and constraints are merged
                  only for <code>properties.&lt;name&gt;.enum</code>.
                </Note>
              </div>
              <div className="ucp-card">
                <fieldset>
                  <legend>Instruments the agent submits on Complete Checkout</legend>
                  {INSTRUMENT_OPTIONS.map((o) => (
                    <label key={o.key}>
                      <input
                        type="checkbox"
                        checked={selected.includes(o.key)}
                        onChange={(e) =>
                          setSelected((s) => (e.target.checked ? [...s, o.key] : s.filter((k) => k !== o.key)))
                        }
                      />
                      {o.label}
                    </label>
                  ))}
                </fieldset>
                <p>
                  Split payments <code>{SPLIT}</code> is {splitPayments ? 'active: several instruments are allowed' : 'not active: exactly one instrument'}.
                </p>
                {preview.length === 0 ? (
                  <p className="ucp-ok">This submission passes the business checks.</p>
                ) : (
                  <ul className="ucp-list">
                    {preview.map((m) => (
                      <li key={`${m.path}-${m.content}`} className="ucp-bad">
                        <code>{m.code}</code> at <code>{m.path}</code>: {m.content}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="ucp-card">
                <Wire title="ucp.payment_handlers in the checkout response" text={pretty(envelope.payment_handlers)} />
                <Note kind="simplification">handler names, ids, versions, configs and credential types are fixtures, not real providers.</Note>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'checkout' && (
        <section id="ucp-panel-checkout" role="tabpanel" aria-labelledby="ucp-tab-checkout" className="ucp">
          {!checkoutActive && (
            <p className="ucp-bad" role="alert">
              <code>{CHECKOUT}</code> is not in the negotiated set, so checkout operations would get{' '}
              <code>capabilities_incompatible</code>. Load the fixture defaults in the negotiation tab.
            </p>
          )}
          <div className="ucp-grid">
            <div className="ucp-card">
              <h3>Agent data (Update Checkout replaces all of it)</h3>
              <fieldset>
                <legend>Line items</legend>
                {CATALOG.map((c) => (
                  <NumberField
                    key={c.id}
                    labelAfter
                    label={`${c.title}, ${formatMoney(c.price)}`}
                    min={0}
                    max={9}
                    value={quantities[c.id] ?? 0}
                    onChange={(v) => setQuantities((q) => ({ ...q, [c.id]: Math.max(0, Math.min(9, Math.floor(v ?? 0))) }))}
                  />
                ))}
              </fieldset>
              <label className="ucp-field">
                Buyer email
                <input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
              </label>
              <p>
                Subtotal {formatMoney(totals.subtotal)}, fixture tax {formatMoney(totals.tax)}, total {formatMoney(totals.total)}
              </p>
            </div>
            <div className="ucp-card">
              <h3>Business rules and failure injection</h3>
              <fieldset>
                <legend>Business behavior</legend>
                <label>
                  <input
                    type="checkbox"
                    checked={policy.requireDeliveryWindow}
                    onChange={(e) => setPolicy((p) => ({ ...p, requireDeliveryWindow: e.target.checked }))}
                  />
                  Needs a delivery window it cannot collect by API (<code>requires_buyer_input</code>)
                </label>
                <label className="ucp-field">
                  Buyer review above (<code>requires_buyer_review</code>)
                  <select
                    value={policy.reviewThreshold}
                    onChange={(e) => setPolicy((p) => ({ ...p, reviewThreshold: Number(e.target.value) }))}
                  >
                    <option value={50000}>$500.00</option>
                    <option value={10000}>$100.00</option>
                    <option value={Number.MAX_SAFE_INTEGER}>Never</option>
                  </select>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={policy.asyncCompletion}
                    onChange={(e) => setPolicy((p) => ({ ...p, asyncCompletion: e.target.checked }))}
                  />
                  Processes Complete Checkout asynchronously (<code>complete_in_progress</code>)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={policy.omitContinueUrl}
                    onChange={(e) => setPolicy((p) => ({ ...p, omitContinueUrl: e.target.checked }))}
                  />
                  Fault: business omits <code>continue_url</code>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={checkoutMandate}
                    disabled={!ap2Locked}
                    onChange={(e) => setCheckoutMandate(e.target.checked)}
                  />
                  Agent attaches <code>ap2.checkout_mandate</code> {ap2Locked ? '(security locked)' : '(AP2 not negotiated)'}
                </label>
              </fieldset>
              <p className="ucp-label">Rule changes apply on the next Create or Update call.</p>
            </div>
            <div className="ucp-card">
              <h3>Operations</h3>
              <div className="ucp-row">
                <button type="button" className="btn" onClick={() => run('create')} disabled={!checkoutActive}>
                  Create
                </button>
                <button type="button" className="btn" onClick={() => run('get')} disabled={!session}>
                  Get
                </button>
                <button type="button" className="btn" onClick={() => run('update')} disabled={!session}>
                  Update
                </button>
                <button type="button" className="btn" onClick={() => run('complete')} disabled={!session}>
                  Complete
                </button>
                <button type="button" className="btn" onClick={() => run('cancel')} disabled={!session}>
                  Cancel
                </button>
              </div>
              <div className="ucp-row">
                <button
                  type="button"
                  className="btn"
                  disabled={session?.status !== 'requires_escalation'}
                  onClick={() => {
                    if (!session) return;
                    const r = buyerCompletesHandoff(session, policy, ctx, now, nextOrderId());
                    setSession(r.session);
                    setAnnounce(`Buyer handoff: ${r.outcome}. ${r.note}.`);
                  }}
                >
                  Buyer finishes on continue_url
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={session?.status !== 'complete_in_progress'}
                  onClick={() => {
                    if (!session) return;
                    const r = finishProcessing(session, policy, ctx, now, nextOrderId());
                    setSession(r.session);
                    setAnnounce(`Business processing: ${r.note}. Observed with Get Checkout.`);
                  }}
                >
                  Business finishes processing
                </button>
              </div>
              <div className="ucp-row">
                <button type="button" className="btn" onClick={() => advance(1)}>
                  Clock +1 hour
                </button>
                <button type="button" className="btn" onClick={() => advance(6)}>
                  Clock +6 hours
                </button>
              </div>
              <div className="ucp-row">
                <button type="button" className="btn" disabled={!lastKey.current} onClick={() => retrySameKey(false)}>
                  Retry last call, same key and body
                </button>
                <button type="button" className="btn" disabled={!lastKey.current} onClick={() => retrySameKey(true)}>
                  Fault: reuse key with a changed body
                </button>
              </div>
              <p className="ucp-label">
                Simulated clock {new Date(now).toISOString()}. Last operation: {OPERATIONS[lastOp].label}.
              </p>
            </div>
          </div>

          <div className="ucp-card">
            <h3>Session state</h3>
            <ol className="ucp-states" aria-label="Checkout statuses">
              {CHECKOUT_STATUSES.map((s) => (
                <li key={s} className="ucp-state" aria-current={session?.status === s ? 'step' : undefined}>
                  {s}
                  {session?.status === s ? ' (current)' : ''}
                </li>
              ))}
            </ol>
            {!session ? (
              <p>No session yet. Press Create.</p>
            ) : (
              <>
                <p>
                  <code>{session.id}</code> is <strong>{session.status}</strong>
                  {terminal ? ' (terminal)' : ''}. <code>expires_at</code> {new Date(session.expiresAt).toISOString()}{' '}
                  (6 hours after creation by default).
                </p>
                <p>
                  <code>continue_url</code>: {session.continueUrl ? <code>{session.continueUrl}</code> : 'absent'}
                </p>
                {session.order && (
                  <p className="ucp-ok">
                    Order <code>{session.order.id}</code> at <code>{session.order.permalink_url}</code>
                  </p>
                )}
                {violations.length > 0 && (
                  <div className="ucp-error" role="alert">
                    <p className="ucp-bad">Spec violation in this response</p>
                    <ul className="ucp-list">
                      {violations.map((v) => (
                        <li key={v}>{v}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {session.messages.length > 0 && (
                  <table className="ucp-table">
                    <caption className="ucp-label">messages[]</caption>
                    <thead>
                      <tr>
                        <th scope="col">Code</th>
                        <th scope="col">Severity</th>
                        <th scope="col">Path</th>
                        <th scope="col">Content</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.messages.map((m) => (
                        <tr key={`${m.code}-${m.path ?? ''}-${m.content}`}>
                          <td>
                            <code>{m.code}</code>
                            {FIXTURE_CODES.includes(m.code) ? ` (${SIMPLIFICATION_LABEL}: the spec names no code)` : ''}
                          </td>
                          <td>{m.severity ?? m.type}</td>
                          <td>{m.path ? <code>{m.path}</code> : ''}</td>
                          <td>{m.content}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {conflict && <Wire title="Idempotency conflict" text={conflict} />}
                <h4>Transitions</h4>
                <ol className="ucp-list">
                  {session.history.map((h, i) => (
                    <li key={i}>
                      <code>{h.event}</code>: {h.from ?? 'new'} to <strong>{h.to}</strong>. {h.note}.
                    </li>
                  ))}
                </ol>
              </>
            )}
            <Note kind="simplification">
              the business is played by the simulator with fixture rules, a fixture 8 percent tax and no fulfillment
              options. Rejected calls that the spec answers with an unnamed error are shown as notes, not wire codes.
            </Note>
          </div>
        </section>
      )}

      {tab === 'transport' && (
        <section id="ucp-panel-transport" role="tabpanel" aria-labelledby="ucp-tab-transport" className="ucp">
          <p>
            The same operation over each binding. REST paths are appended to the service <code>endpoint</code>, MCP tools
            map one to one to operations, and A2A carries the checkout in a <code>DataPart</code> keyed{' '}
            <code>a2a.ucp.checkout</code>. {session ? 'Messages reflect the current session.' : 'No session yet, so a preview session is shown.'}
          </p>
          <div className="ucp-row">
            <Segmented
              label="Operation"
              value={wireOp}
              onChange={setWireOp}
              options={OPERATION_ORDER.map((o) => ({ value: o, label: OPERATIONS[o].label }))}
            />
            <Segmented
              label="Transport"
              value={transport}
              onChange={setTransport}
              options={[
                { value: 'rest', label: 'REST' },
                { value: 'mcp', label: 'MCP' },
                { value: 'a2a', label: 'A2A' },
              ]}
            />
          </div>
          <p>
            REST <code>{OPERATIONS[wireOp].rest.method} {OPERATIONS[wireOp].rest.path}</code>, MCP tool{' '}
            <code>{OPERATIONS[wireOp].mcpTool}</code>, A2A{' '}
            {OPERATIONS[wireOp].a2aAction ? (
              <>
                action <code>{OPERATIONS[wireOp].a2aAction}</code>
              </>
            ) : (
              'natural-language turn'
            )}
            . Target: <code>{wireReq.target}</code>
          </p>
          <div className="ucp-grid">
            <Wire title="Request" text={wireReq.text} />
            <Wire title="Response" text={wireRes.text} />
          </div>
          {[...wireReq.simplifications, ...wireRes.simplifications].map((s) => (
            <Note kind="simplification" key={s}>{s}.</Note>
          ))}
          {ap2Locked && (
            <Note kind="simplification">
              <code>ap2.merchant_authorization</code> and <code>ap2.checkout_mandate</code> are shaped fixtures; nothing is
              signed here. The AP2 playground shows real signing.
            </Note>
          )}
        </section>
      )}
    </div>
  );
}
