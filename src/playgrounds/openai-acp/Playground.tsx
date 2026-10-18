import { useMemo, useRef, useState } from 'react';
import './acp.css';
import { Note } from '@/components/playground/Note';
import { NumberField } from '@/components/playground/NumberField';
import { Segmented } from '@/components/playground/Segmented';
import { TabList } from '@/components/playground/Tabs';
import { Wire } from '@/components/playground/Wire';
import { bytesToHex } from '@/lib/playground/bytes';
import { pretty } from '@/lib/playground/util';
import { TRANSITIONS, computeTotals, transitionsFor, type Basis, type Session } from './lib/checkout';
import { NO_CODE_NOTE, buildDelegateRequest, type TokenRecord } from './lib/delegate';
import { ADDRESS, CATALOG, DISCOVERY, HANDLERS, MERCHANT_ID, OTHER_MERCHANT_ID, SESSION_TTL_MS, SHIPPING, T0, BUYER } from './lib/fixtures';
import { DISCOVERY_PATH, discoveryFor, selectHandlers, validateDiscovery } from './lib/handlers';
import { RETENTION_MS } from './lib/idempotency';
import {
  DELEGATE_PATH,
  buildRequest,
  cancelBody,
  completeBody,
  createBody,
  updateBody,
  type CartLine,
  type Op,
  type Req,
} from './lib/requests';
import {
  applyEvent,
  handle,
  holdInFlight,
  newServer,
  tick,
  type CompleteMode,
  type ServerState,
} from './lib/server';
import { LATEST, SPEC_VERSIONS, STATUSES, exampleLabel, type Exchange, type SpecVersion } from './lib/types';
import {
  WEBHOOK_PATH,
  TOLERANCE_SECONDS,
  generateSecret,
  orderEvent,
  signWebhook,
  signedPayload,
  verifyWebhook,
  type VerifyResult,
} from './lib/webhook';

type Tab = 'checkout' | 'delegate' | 'webhook' | 'idempotency' | 'handlers';
const TABS: { id: Tab; label: string }[] = [
  { id: 'checkout', label: '1. Checkout session' },
  { id: 'delegate', label: '2. Delegate payment allowance' },
  { id: 'webhook', label: '3. Webhook signature' },
  { id: 'idempotency', label: '4. Idempotency' },
  { id: 'handlers', label: '5. Discovery and handlers' },
];

const BASIS_TEXT: Record<Basis, string> = {
  spec: 'stated in the spec',
  implied: 'implied by the RFC text',
  inferred: 'inferred from the status name or schema, not stated',
};

interface LogEntry {
  n: number;
  version: SpecVersion;
  exchange?: Exchange;
  event?: string;
}

function renderHeaders(h: Record<string, string>): string {
  return Object.entries(h)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
}

function renderRequest(ex: Exchange): string {
  const head = `${ex.method} ${ex.path} HTTP/1.1\n${renderHeaders(ex.requestHeaders)}`;
  return ex.requestBody === undefined ? head : `${head}\n\n${pretty(ex.requestBody)}`;
}

function renderResponse(ex: Exchange): string {
  const status = ex.status === '4XX' ? '4XX (the spec names a status class, not one code)' : String(ex.status);
  const head = `HTTP/1.1 ${status}\n${renderHeaders(ex.responseHeaders)}`;
  return ex.responseBody === undefined || ex.responseBody === null ? head : `${head}\n\n${pretty(ex.responseBody)}`;
}

const fmtTime = (ms: number) => new Date(ms).toISOString().replace('.000Z', 'Z');
const orderIdOf = (s?: Session) => (s?.order?.id as string | undefined) ?? 'none';

export default function OpenAiAcpPlayground() {
  const [tab, setTab] = useState<Tab>('checkout');
  const [version, setVersion] = useState<SpecVersion>(LATEST);
  const [server, setServer] = useState<ServerState>(() => newServer(LATEST));
  const [now, setNow] = useState(T0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('Simulation ready. Create a checkout session to start.');
  const seq = useRef(1);

  const [cart, setCart] = useState<Record<string, number>>({ item_trail_mug: 1 });
  const [mode, setMode] = useState<CompleteMode>('immediate');
  const [handlerId, setHandlerId] = useState('card_tokenized');
  const [withAuth, setWithAuth] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [agentNames, setAgentNames] = useState<string[]>(['dev.acp.tokenized.card', 'dev.acp.seller_backed.saved_card']);
  const [discoveryText, setDiscoveryText] = useState(() => pretty(DISCOVERY));

  const [dMax, setDMax] = useState<number | null>(null);
  const [dMerchant, setDMerchant] = useState<'self' | 'other'>('self');
  const [dSession, setDSession] = useState<'current' | 'other'>('current');
  const [dLife, setDLife] = useState(15);

  const [secret] = useState(() => generateSecret());
  const [wKind, setWKind] = useState<'order_create' | 'order_update'>('order_create');
  const [wStatus, setWStatus] = useState('created');
  const [wInject, setWInject] = useState<'none' | 'tamper' | 'wrong_secret' | 'no_header' | 'malformed'>('none');
  const [wDelay, setWDelay] = useState(0);
  const [wResult, setWResult] = useState<{
    header?: string;
    sent: string;
    received: string;
    t: number;
    receiverNow: number;
    result: VerifyResult;
  } | null>(null);

  const [iKey, setIKey] = useState('idem_demo_001');
  const [iRuns, setIRuns] = useState<{ label: string; status: string; code: string; replayed: boolean }[]>([]);

  const session: Session | undefined = currentId ? server.sessions[currentId] : undefined;
  const total = session ? computeTotals(session).total : 2484;
  const newer = version === '2026-04-17';
  const token: TokenRecord | undefined = tokenId ? server.tokens[tokenId] : undefined;
  const selection = useMemo(() => selectHandlers(agentNames), [agentNames]);
  const discoveryCheck = useMemo(() => {
    try {
      return validateDiscovery(JSON.parse(discoveryText));
    } catch {
      return ['The text is not valid JSON.'];
    }
  }, [discoveryText]);

  const cartLines = (): CartLine[] =>
    CATALOG.filter((c) => (cart[c.id] ?? 0) > 0).map((c) => ({ id: c.id, quantity: newer ? 1 : (cart[c.id] ?? 1) }));
  const otherItems = (): CartLine[] => {
    const only = cartLines();
    const socksOnly = only.length === 1 && only[0]!.id === 'item_wool_socks';
    return [{ id: socksOnly ? 'item_trail_mug' : 'item_wool_socks', quantity: 1 }];
  };
  const nextKey = () => `idem_${String(seq.current++).padStart(3, '0')}`;
  const reqId = () => `req_${String(seq.current).padStart(3, '0')}`;

  /** Run several requests in order against local state, then commit once. */
  function run(steps: (Req | ((st: ServerState) => Req | null))[], summary?: (last: Exchange, st: ServerState) => string) {
    let st = server;
    const entries: LogEntry[] = [];
    let last: Exchange | undefined;
    let id = currentId;
    let tok = tokenId;
    for (const step of steps) {
      const req = typeof step === 'function' ? step(st) : step;
      if (!req) continue;
      const r = handle(st, req, now);
      st = r.state;
      last = r.exchange;
      entries.push({ n: 0, version, exchange: r.exchange });
      const body = r.exchange.responseBody as { id?: string } | undefined;
      if (r.exchange.status === 201 && body?.id) {
        if (req.path === DELEGATE_PATH) tok = body.id;
        else if (req.path === '/checkout_sessions') id = body.id;
      }
    }
    commit(st, entries, last ? (summary ? summary(last, st) : describe(last)) : '', id, tok);
    return { st, last };
  }

  function commit(st: ServerState, entries: LogEntry[], msg: string, id = currentId, tok = tokenId) {
    setServer(st);
    setCurrentId(id);
    setTokenId(tok);
    setLog((l) => {
      let n = l.length ? l[0]!.n : 0;
      const added = entries.map((e) => ({ ...e, n: ++n })).reverse();
      return [...added, ...l].slice(0, 40);
    });
    if (msg) setAnnounce(msg);
  }

  function describe(ex: Exchange): string {
    const body = ex.responseBody as { status?: string; code?: string } | undefined;
    const tail = body?.status ? ` Session status ${body.status}.` : body?.code ? ` Error code ${body.code}.` : '';
    return `${ex.method} ${ex.path} returned ${ex.status}.${tail}`;
  }

  function event(text: string) {
    setLog((l) => [{ n: (l[0]?.n ?? 0) + 1, version, event: text }, ...l].slice(0, 40));
    setAnnounce(text);
  }

  function switchVersion(v: SpecVersion) {
    setVersion(v);
    setServer(newServer(v));
    setCurrentId(null);
    setTokenId(null);
    setLog([]);
    setIRuns([]);
    setMode('immediate');
    setWResult(null);
    setNow(T0);
    setAnnounce(`Switched to spec version ${v}. The merchant, log and clock were reset.`);
  }

  function advance(ms: number, label: string) {
    const to = now + ms;
    setNow(to);
    const r = tick(server, to);
    setServer(r.state);
    const text = `Clock moved ${label}. ${r.expired.length ? `Session ${r.expired.join(', ')} expired (inferred transition, no API call).` : 'No session expired.'}`;
    event(text);
  }

  // Operations.
  const op = (o: Op, body?: unknown, key = true) =>
    buildRequest(version, o, { sessionId: currentId ?? undefined, key: key && o !== 'get' ? nextKey() : undefined, requestId: reqId(), body });
  const completeReq = (tok: string | null) =>
    op('complete', completeBody(version, { token: tok ?? 'vt_fixture_missing', handlerId, authOutcome: withAuth && newer ? 'authenticated' : undefined }));
  const delegateReq = (over?: { maxAmount?: number; merchantId?: string; sessionId?: string; lifeMin?: number }) =>
    op(
      'delegate',
      buildDelegateRequest({
        maxAmount: over?.maxAmount ?? dMax ?? total,
        currency: 'usd',
        checkoutSessionId: over?.sessionId ?? (dSession === 'current' ? (currentId ?? 'cs_fixture_none') : 'cs_fixture_other'),
        merchantId: over?.merchantId ?? (dMerchant === 'self' ? MERCHANT_ID : OTHER_MERCHANT_ID),
        expiresAtMs: now + (over?.lifeMin ?? dLife) * 60_000,
      }),
    );
  const addDetails = () =>
    op('update', updateBody(version, { buyer: { first_name: BUYER.first_name, last_name: BUYER.last_name, email: BUYER.email }, address: ADDRESS, optionId: SHIPPING.id }));

  function setMode_(m: CompleteMode) {
    setMode(m);
    setServer((s) => ({ ...s, completeMode: m }));
  }

  async function sendWebhook() {
    const sessionId = currentId ?? 'cs_fixture_demo';
    const sent = JSON.stringify(orderEvent(wKind, sessionId, wStatus));
    const t = Math.floor(now / 1000);
    let header: string | undefined = await signWebhook(secret, sent, t);
    let received = sent;
    let key = secret;
    if (wInject === 'tamper') received = sent.replace(`"status":"${wStatus}"`, `"status":"${wStatus === 'canceled' ? 'completed' : 'canceled'}"`);
    if (wInject === 'wrong_secret') key = generateSecret();
    if (wInject === 'no_header') header = undefined;
    if (wInject === 'malformed') header = `v1=${header?.split('v1=')[1] ?? ''}`;
    const receiverNow = t + wDelay;
    const result = await verifyWebhook({ header, rawBody: received, secret: key, nowSeconds: receiverNow, requestId: 'req_wh_001' });
    setWResult({ header, sent, received, t, receiverNow, result });
    setAnnounce(result.ok ? 'Receiver accepted the webhook with 200.' : `Receiver rejected the webhook with 401, reason ${result.reason}.`);
  }

  function idemSend(label: string, o: { key?: string; items?: CartLine[]; hold?: boolean; later?: number }) {
    const items = o.items ?? cartLines();
    const req = buildRequest(version, 'create', { key: o.key, requestId: reqId(), body: createBody(version, items) });
    let st = server;
    const at = now + (o.later ?? 0);
    if (o.later) setNow(at);
    if (o.hold) st = holdInFlight(st, req, at);
    const r = handle(st, req, at);
    const body = r.exchange.responseBody as { id?: string; code?: string } | undefined;
    const id = r.exchange.status === 201 && body?.id ? body.id : currentId;
    commit(r.state, [{ n: 0, version, exchange: r.exchange }], describe(r.exchange), id);
    setIRuns((x) => [...x, { label, status: String(r.exchange.status), code: body?.code ?? (r.exchange.responseHeaders['Idempotent-Replayed'] ? 'replayed response' : 'new request'), replayed: r.exchange.responseHeaders['Idempotent-Replayed'] === 'true' }]);
  }

  const status = session?.status;
  const outgoing = status ? transitionsFor(version, status) : [];
  const usableHandlers = selection.usable;

  return (
    <div className="acp">
      <p className="acp-live" role="status" aria-live="polite">
        {announce}
      </p>

      <div className="acp-row">
        <Segmented
          label="Spec version"
          value={version}
          onChange={switchVersion}
          options={SPEC_VERSIONS.map((v) => ({ value: v, label: `${v} (${STATUSES[v].length} statuses)` }))}
        />
        <span>
          Simulated clock: <code>{fmtTime(now)}</code>
        </span>
        <button type="button" className="btn" onClick={() => advance(5 * 60_000, 'forward 5 minutes')}>
          Clock +5 min
        </button>
        <button type="button" className="btn" onClick={() => advance(20 * 60_000, 'forward 20 minutes')}>
          Clock +20 min
        </button>
        <button type="button" className="btn" onClick={() => advance(RETENTION_MS, 'forward 24 hours')}>
          Clock +24 h
        </button>
      </div>
      <p className="acp-label">{exampleLabel(version)}. Merchant fixture: Juniper Goods at <code>juniper-goods.example</code>. No network calls.</p>

      <TabList label="OpenAI ACP playground parts" idPrefix="acp" tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'checkout' && (
        <section id="acp-panel-checkout" role="tabpanel" aria-labelledby="acp-tab-checkout" className="acp">
          <p>
            Statuses in <code>{version}</code>: {STATUSES[version].length}. {newer ? 'The newer statuses (incomplete, requires_escalation, authentication_required, pending_approval, complete_in_progress, expired) exist only in this version.' : 'Statuses added after 2025-09-29 are not available in this version.'}
          </p>
          <ol className="acp-states" aria-label="Checkout session statuses">
            {STATUSES[version].map((s) => (
              <li key={s} className="acp-state" aria-current={s === status ? 'step' : undefined}>
                {s}
                {s === status ? ' (current)' : ''}
              </li>
            ))}
          </ol>
          <div className="acp-grid">
            <fieldset>
              <legend>Cart</legend>
              {CATALOG.map((c) => (
                <div key={c.id} className="acp-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={(cart[c.id] ?? 0) > 0}
                      onChange={(e) => setCart({ ...cart, [c.id]: e.target.checked ? 1 : 0 })}
                    />
                    {c.name} ({(c.unit_amount / 100).toFixed(2)} usd)
                  </label>
                  {!newer && (cart[c.id] ?? 0) > 0 && (
                    <NumberField label="Quantity" min={1} max={5} value={cart[c.id]} onChange={(v) => setCart({ ...cart, [c.id]: Math.max(1, v ?? 1) })} />
                  )}
                </div>
              ))}
              {newer && <Note kind="simplification">In 2026-04-17 the create request holds Item objects, and the schema Item has no quantity property. The fixture merchant uses quantity 1.</Note>}
            </fieldset>
            <fieldset>
              <legend>Merchant behavior</legend>
              <label className="acp-field">
                When complete succeeds, the merchant answers with
                <select value={mode} onChange={(e) => setMode_(e.target.value as CompleteMode)}>
                  <option value="immediate">completed with an order</option>
                  {newer && <option value="complete_in_progress">complete_in_progress (inferred)</option>}
                  {newer && <option value="pending_approval">pending_approval (inferred)</option>}
                  <option value="in_progress">in_progress (inferred)</option>
                </select>
              </label>
              {newer && (
                <label className="acp-field">
                  Payment handler (handler_id)
                  <select value={handlerId} onChange={(e) => setHandlerId(e.target.value)}>
                    {HANDLERS.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.id}
                        {usableHandlers.some((u) => u.id === h.id) ? '' : ' (agent did not declare it)'}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {newer && (
                <label>
                  <input type="checkbox" checked={withAuth} onChange={(e) => setWithAuth(e.target.checked)} />
                  Send authentication_result (authenticated) on complete
                </label>
              )}
              {newer && (
                <label className="acp-field">
                  Cancel reason (intent_trace.reason_code)
                  <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
                    <option value="">none</option>
                    <option value="price_sensitivity">price_sensitivity</option>
                    <option value="shipping_cost">shipping_cost</option>
                    <option value="other">other</option>
                  </select>
                </label>
              )}
            </fieldset>
          </div>
          <div className="acp-row">
            <button type="button" className="btn" onClick={() => run([op('create', createBody(version, cartLines()))])}>
              Create session
            </button>
            <button type="button" className="btn" disabled={!session} onClick={() => run([addDetails()])}>
              Update: buyer, address, shipping
            </button>
            <button type="button" className="btn" disabled={!session} onClick={() => run([op('update', updateBody(version, { items: cartLines() }))])}>
              Update: use the cart items
            </button>
            <button type="button" className="btn" disabled={!session} onClick={() => run([op('get')])}>
              Get session
            </button>
            <button
              type="button"
              className="btn"
              disabled={!session}
              onClick={() => run([delegateReq({ maxAmount: total, merchantId: MERCHANT_ID, sessionId: currentId ?? undefined, lifeMin: 15 })])}
            >
              Delegate payment (valid allowance)
            </button>
            <button type="button" className="btn" disabled={!session} onClick={() => run([completeReq(tokenId)])}>
              Complete with the last token
            </button>
            <button type="button" className="btn" disabled={!session} onClick={() => run([op('cancel', cancelBody(version, cancelReason || undefined))])}>
              Cancel
            </button>
          </div>
          {session ? (
            <p>
              Session <code>{session.id}</code>, status <strong>{session.status}</strong>, total {(total / 100).toFixed(2)} usd, order {orderIdOf(session)}. Token: <code>{tokenId ?? 'none yet'}</code>.
            </p>
          ) : (
            <p>No session yet.</p>
          )}
          <h3>Transitions out of {status ?? 'no session'}</h3>
          {!session && <p>Create a session to see its transitions.</p>}
          {session && outgoing.length === 0 && <p>No transition leaves {status} in this spec version (terminal or not listed).</p>}
          {outgoing.length > 0 && (
            <div className="pg-scroll">
              <table className="acp-table">
                <caption className="acp-label">Edges from the status state file. Inferred edges are labeled, not hidden.</caption>
                <thead>
                  <tr>
                    <th scope="col">To</th>
                    <th scope="col">Trigger</th>
                    <th scope="col">Call</th>
                    <th scope="col">Basis</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {outgoing.map((t) => (
                    <tr key={`${t.from}-${t.to}`}>
                      <td><code>{t.to}</code></td>
                      <td>{t.trigger}</td>
                      <td>{t.api}</td>
                      <td className={t.basis === 'inferred' ? 'acp-warn' : 'acp-ok'}>{t.basis === 'inferred' ? 'Inferred' : t.basis === 'implied' ? 'Implied' : 'Spec'}: {BASIS_TEXT[t.basis]}</td>
                      <td>
                        {t.kind === 'event' && (
                          <button
                            type="button"
                            className="btn"
                            onClick={() => {
                              const r = applyEvent(server, session!.id, t.to);
                              if ('error' in r) return setAnnounce(r.error);
                              setServer(r.state);
                              event(r.text);
                            }}
                          >
                            Merchant event: {t.to}
                          </button>
                        )}
                        {t.kind === 'clock' && (
                          <button type="button" className="btn" onClick={() => advance(SESSION_TTL_MS + 60_000, 'forward 31 minutes')}>
                            Clock +31 min
                          </button>
                        )}
                        {(t.kind === 'update' || t.kind === 'complete' || t.kind === 'cancel') && `Use the ${t.kind} button`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Note kind="simplification">
            The state file marks {TRANSITIONS.filter((t) => t.basis === 'inferred').length} of {TRANSITIONS.length} edges as inferred. The spec lists the status values but gives no transition rules for them, so
            the table above is the Atlas reading, not the spec.
          </Note>
          <Note kind="simplification">
            The spec names no error code for a call that does not fit the current status (for example update after cancel), so the fixture uses <code>invalid_state</code> and the log says so. Spec-defined outcomes keep their codes: 405 on cancel of a finished session, <code>requires_3ds</code> without <code>authentication_result</code>, and the idempotency codes.
          </Note>
        </section>
      )}

      {tab === 'delegate' && (
        <section id="acp-panel-delegate" role="tabpanel" aria-labelledby="acp-tab-delegate" className="acp">
          <p>
            <code>POST {DELEGATE_PATH}</code> returns a vault token tied to an <code>allowance</code>. The spec says the token must only work within the allowance and must become invalid at or after <code>expires_at</code>. The card here is a fixture string, never a card number.
          </p>
          <div className="acp-grid">
            <fieldset>
              <legend>Allowance to request</legend>
              <p className="acp-label">
                <code>reason</code> is always <code>one_time</code>, the only value the schema allows. <code>currency</code> is <code>usd</code>.
              </p>
              <NumberField className="acp-field" label={`max_amount (minor units${session ? `; session total is ${total}` : ''})`} min={0} value={dMax ?? total} onChange={setDMax} />
              <label className="acp-field">
                merchant_id
                <select value={dMerchant} onChange={(e) => setDMerchant(e.target.value as 'self' | 'other')}>
                  <option value="self">{MERCHANT_ID} (this merchant)</option>
                  <option value="other">{OTHER_MERCHANT_ID} (a different merchant)</option>
                </select>
              </label>
              <label className="acp-field">
                checkout_session_id
                <select value={dSession} onChange={(e) => setDSession(e.target.value as 'current' | 'other')}>
                  <option value="current">the current session</option>
                  <option value="other">cs_fixture_other (a different session)</option>
                </select>
              </label>
              <NumberField className="acp-field" label="Lifetime in minutes (sets expires_at)" min={1} value={dLife} onChange={(v) => setDLife(Math.max(1, v ?? 1))} />
              <div className="acp-row">
                <button type="button" className="btn" onClick={() => { setDMax(Math.max(0, total - 1)); setDMerchant('self'); setDSession('current'); setDLife(15); }}>
                  Preset: exceed max_amount
                </button>
                <button type="button" className="btn" onClick={() => { setDMax(null); setDMerchant('other'); setDSession('current'); setDLife(15); }}>
                  Preset: wrong merchant
                </button>
                <button type="button" className="btn" onClick={() => { setDMax(null); setDMerchant('self'); setDSession('other'); setDLife(15); }}>
                  Preset: wrong session
                </button>
                <button type="button" className="btn" onClick={() => { setDMax(null); setDMerchant('self'); setDSession('current'); setDLife(5); }}>
                  Preset: short life (then move the clock +20 min)
                </button>
                <button type="button" className="btn" onClick={() => { setDMax(null); setDMerchant('self'); setDSession('current'); setDLife(15); }}>
                  Preset: valid allowance
                </button>
              </div>
            </fieldset>
            <fieldset>
              <legend>Steps</legend>
              <div className="acp-row">
                <button type="button" className="btn" onClick={() => run([delegateReq()])}>
                  1. Create the delegated token
                </button>
                <button type="button" className="btn" disabled={!session || !tokenId} onClick={() => run([completeReq(tokenId)])}>
                  2. Present it at complete
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={!tokenId}
                  onClick={() =>
                    run([
                      op('create', createBody(version, cartLines())),
                      (st) => {
                        const ids = Object.keys(st.sessions);
                        const id = ids[ids.length - 1];
                        return id ? buildRequest(version, 'update', { sessionId: id, key: nextKey(), body: updateBody(version, { buyer: BUYER, address: ADDRESS, optionId: SHIPPING.id }) }) : null;
                      },
                      (st) => {
                        const ids = Object.keys(st.sessions);
                        const id = ids[ids.length - 1];
                        return id ? buildRequest(version, 'complete', { sessionId: id, key: nextKey(), body: completeBody(version, { token: tokenId ?? '', handlerId, authOutcome: withAuth && newer ? 'authenticated' : undefined }) }) : null;
                      },
                    ])
                  }
                >
                  3. Present it again on a new session
                </button>
              </div>
              <p className="acp-label">Step 3 shows reuse of a one_time token. It is also a different session, so both rules can fire.</p>
              {token ? (
                <>
                  <p>
                    Token <code>{token.id}</code> {token.used ? 'was used' : 'is unused'}; allowance {Date.parse(token.allowance.expires_at) <= now ? 'has expired' : 'is still open'} at the simulated clock.
                  </p>
                  <Wire wrap="none" title="Allowance on the token" text={pretty(token.allowance)} />
                </>
              ) : (
                <p>No token yet.</p>
              )}
            </fieldset>
          </div>
          <h3>Outcome of the last charge</h3>
          {!server.lastCharge && <p>No charge attempted yet.</p>}
          {server.lastCharge && (
            <div className={server.lastCharge.outcome === 'accepted' ? 'acp-card' : 'acp-card acp-error'}>
              <p className={server.lastCharge.outcome === 'accepted' ? 'acp-ok' : 'acp-bad'}>
                {server.lastCharge.outcome === 'accepted' ? 'Charge accepted' : 'Charge refused'} for {server.lastCharge.amount} minor units.
              </p>
              {server.lastCharge.note && <p>{server.lastCharge.note}</p>}
              {server.lastCharge.violations.length > 0 && (
                <>
                  <ul className="acp-list">
                    {server.lastCharge.violations.map((v) => (
                      <li key={v.kind}>
                        <code>{v.field}</code>: {v.rule} Spec error code for this case: none defined.
                      </li>
                    ))}
                  </ul>
                  <Note kind="simplification">{NO_CODE_NOTE}</Note>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {tab === 'webhook' && (
        <section id="acp-panel-webhook" role="tabpanel" aria-labelledby="acp-tab-webhook" className="acp">
          <p>
            The merchant signs each order event with HMAC-SHA256 and sends it to <code>{WEBHOOK_PATH}</code> in the <code>Merchant-Signature</code> header, as <code>t=&lt;unix_seconds&gt;,v1=&lt;64_hex&gt;</code>. The signed string is the timestamp, a dot and the raw body. The receiver answers 401 if the header is missing, malformed, outside the window (300 seconds recommended) or does not verify.
          </p>
          {!newer && (
            <Note kind="simplification">
              The 2025-09-29 webhook file says only that requests carry an HMAC signature over the raw body in <code>Merchant-Signature</code>. It defines no header format and no time window. This tab shows the 2026-04-17 scheme in both versions.
            </Note>
          )}
          <p className="acp-label">Ephemeral shared secret, kept in memory only: <code>{bytesToHex(secret)}</code></p>
          <div className="acp-grid">
            <fieldset>
              <legend>Event to sign</legend>
              <label className="acp-field">
                type
                <select value={wKind} onChange={(e) => { const k = e.target.value as 'order_create' | 'order_update'; setWKind(k); setWStatus(k === 'order_create' ? 'created' : 'shipped'); }}>
                  <option value="order_create">order_create</option>
                  <option value="order_update">order_update</option>
                </select>
              </label>
              <label className="acp-field">
                data.status
                <select value={wStatus} onChange={(e) => setWStatus(e.target.value)}>
                  {['created', 'confirmed', 'manual_review', 'processing', 'shipped', 'completed', 'canceled'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            </fieldset>
            <fieldset>
              <legend>Failure injection</legend>
              <label className="acp-field">
                What goes wrong
                <select value={wInject} onChange={(e) => setWInject(e.target.value as typeof wInject)}>
                  <option value="none">Nothing, send it as signed</option>
                  <option value="tamper">Tamper with the body after signing</option>
                  <option value="wrong_secret">Receiver holds a different secret</option>
                  <option value="no_header">Leave out Merchant-Signature</option>
                  <option value="malformed">Send a malformed header</option>
                </select>
              </label>
              <NumberField className="acp-field" label={`Receiver clock is this many seconds after t (window is ${TOLERANCE_SECONDS})`} value={wDelay} onChange={(v) => setWDelay(v ?? 0)} />
              <div className="acp-row">
                <button type="button" className="btn" onClick={() => setWDelay(5)}>Fresh, 5 s</button>
                <button type="button" className="btn" onClick={() => setWDelay(TOLERANCE_SECONDS + 1)}>Replay, 301 s</button>
              </div>
            </fieldset>
          </div>
          <button type="button" className="btn" onClick={() => void sendWebhook()}>
            Sign, send and verify
          </button>
          {wResult && (
            <div className="acp-grid">
              <div>
                <h4>Sender</h4>
                <p className="acp-label">{exampleLabel(version)}</p>
                <Wire wrap="none" title="Merchant request" text={`POST ${WEBHOOK_PATH}\nMerchant-Signature: ${wResult.header ?? '(header left out)'}\nRequest-Id: req_wh_001\n\n${wResult.received}`} />
                <Wire wrap="none" title="String that was signed" text={signedPayload(wResult.t, wResult.sent)} />
              </div>
              <div>
                <h4>Receiver</h4>
                <p className={wResult.result.ok ? 'acp-ok' : 'acp-bad'}>
                  {wResult.result.ok ? 'Verified, 200' : `Rejected, 401, reason: ${wResult.result.reason}`}. Receiver clock t+{wResult.receiverNow - wResult.t} s.
                </p>
                <Wire wrap="none" title="Receiver response" text={`HTTP/1.1 ${wResult.result.status}\n\n${pretty(wResult.result.body)}`} />
                {wResult.sent !== wResult.received && <p className="acp-warn">The body changed after signing, so the HMAC no longer matches.</p>}
              </div>
            </div>
          )}
          <Note kind="simplification">HMAC runs with WebCrypto in your browser and the comparison uses <code>crypto.subtle.verify</code>. The spec&apos;s window check is a timestamp test only; it describes no store of seen events, so the same signed request inside the window also verifies.</Note>
        </section>
      )}

      {tab === 'idempotency' && (
        <section id="acp-panel-idempotency" role="tabpanel" aria-labelledby="acp-tab-idempotency" className="acp">
          <p>
            {newer
              ? 'In 2026-04-17 every POST needs an Idempotency-Key. The same key with the same body replays the first response; the same key with a different body is 422 idempotency_conflict; a duplicate while the first request runs is 409 idempotency_in_flight with Retry-After.'
              : 'In 2025-09-29 the Idempotency-Key header is optional and the OpenAPI file defines no idempotency errors.'}
          </p>
          {!newer && <Note kind="simplification">The replay and conflict behavior below follows the RFC section 6 text for 2026-04-17. The 2025-09-29 files define neither.</Note>}
          <label className="acp-field">
            Idempotency-Key
            <input type="text" value={iKey} onChange={(e) => setIKey(e.target.value)} />
          </label>
          <div className="acp-row">
            <button type="button" className="btn" onClick={() => idemSend('First send', { key: iKey })}>1. Send create</button>
            <button type="button" className="btn" onClick={() => idemSend('Same key, same body', { key: iKey })}>2. Resend same body</button>
            <button type="button" className="btn" onClick={() => idemSend('Same key, different body', { key: iKey, items: otherItems() })}>3. Resend with a different body</button>
            <button type="button" className="btn" onClick={() => idemSend('Duplicate while running', { key: `${iKey}_running`, hold: true })}>4. Duplicate while first is running</button>
            <button type="button" className="btn" onClick={() => idemSend('No key', {})}>5. Send without a key</button>
            <button type="button" className="btn" onClick={() => idemSend('Same key after 24 hours', { key: iKey, later: RETENTION_MS })}>6. Resend after 24 hours</button>
          </div>
          <p className="acp-label">Step 3 swaps the cart for a different item. Keys are kept at least 24 hours, so step 6 is treated as a new request.</p>
          {iRuns.length > 0 && (
            <div className="pg-scroll">
              <table className="acp-table">
                <caption className="acp-label">Attempts in this tab</caption>
                <thead><tr><th scope="col">Attempt</th><th scope="col">HTTP status</th><th scope="col">Result</th></tr></thead>
                <tbody>
                  {iRuns.map((r, i) => (
                    <tr key={i}><td>{r.label}</td><td>{r.status}</td><td>{r.code}{r.replayed ? ' (Idempotent-Replayed: true)' : ''}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Note kind="simplification">Body equality is semantic JSON equality of the body only: key order does not matter, array order does, and null differs from absent. Keys are scoped to the fixture identity plus the endpoint path.</Note>
        </section>
      )}

      {tab === 'handlers' && (
        <section id="acp-panel-handlers" role="tabpanel" aria-labelledby="acp-tab-handlers" className="acp">
          {!newer ? (
            <>
              <p>
                2025-09-29 has no discovery document and no payment handlers. A session carries <code>payment_provider</code> and the complete request carries <code>payment_data.token</code> and <code>payment_data.provider</code>, where the only provider value is <code>stripe</code>.
              </p>
              <Wire wrap="none" title="payment_provider in a 2025-09-29 session" text={pretty({ provider: 'stripe', supported_payment_methods: ['card'] })} />
              <p>Switch to 2026-04-17 to explore discovery and handler selection.</p>
            </>
          ) : (
            <>
              <p>
                A seller publishes <code>GET {DISCOVERY_PATH}</code> with stable facts. Payment handlers are not in that file: they are negotiated per session in <code>capabilities.payment.handlers</code> on <code>POST /checkout_sessions</code>.
              </p>
              <div className="acp-grid">
                <div>
                  <label className="acp-field">
                    Discovery document (editable)
                    <textarea value={discoveryText} onChange={(e) => setDiscoveryText(e.target.value)} />
                  </label>
                  {discoveryCheck.length === 0 ? <p className="acp-ok">All required keys present.</p> : <ul className="acp-list acp-error">{discoveryCheck.map((p) => <li key={p} className="acp-bad">{p}</li>)}</ul>}
                  <button type="button" className="btn" onClick={() => setDiscoveryText(pretty(discoveryFor(version)))}>Reset document</button>
                </div>
                <fieldset>
                  <legend>Handlers the agent supports</legend>
                  {HANDLERS.map((h) => (
                    <label key={h.id}>
                      <input
                        type="checkbox"
                        checked={agentNames.includes(h.name)}
                        onChange={(e) => setAgentNames(e.target.checked ? [...agentNames, h.name] : agentNames.filter((n) => n !== h.name))}
                      />
                      <code>{h.name}</code>
                    </label>
                  ))}
                </fieldset>
              </div>
              <div className="pg-scroll">
                <table className="acp-table">
                  <caption className="acp-label">Seller handlers on the session, in display_order</caption>
                  <thead><tr><th scope="col">id</th><th scope="col">Usable</th><th scope="col">requires_delegate_payment</th><th scope="col">requires_pci_compliance</th><th scope="col">psp</th></tr></thead>
                  <tbody>
                    {selection.offered.map((h) => {
                      const skip = selection.skipped.find((s) => s.handler.id === h.id);
                      return (
                        <tr key={h.id}>
                          <td><code>{h.id}</code></td>
                          <td className={skip ? 'acp-bad' : 'acp-ok'}>{skip ? `No: ${skip.reason}` : 'Yes'}</td>
                          <td>{String(h.requires_delegate_payment)}</td>
                          <td>{String(h.requires_pci_compliance)}</td>
                          <td>{h.psp}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p>
                In the checkout tab, pick a <code>handler_id</code> and complete. A handler with <code>requires_delegate_payment: true</code> needs a token from step 2; the bank transfer fixture does not, so no allowance applies to it.
              </p>
              <Note kind="simplification">The spec states no algorithm for matching agent and seller handlers. This match compares the reverse-DNS <code>name</code> only. Handler names other than <code>dev.acp.*</code> and all <code>psp</code> values are fixtures.</Note>
            </>
          )}
        </section>
      )}

      <section aria-labelledby="acp-log-title">
        <h3 id="acp-log-title">Request and response log</h3>
        <p className="acp-label">{exampleLabel(version)}. Newest first. Only the newest entry is open.</p>
        {log.length === 0 && <p>No requests yet.</p>}
        <ul className="acp-log">
          {log.map((e, i) => (
            <li key={e.n}>
              {e.exchange ? (
                <details open={i === 0}>
                  <summary>
                    {e.n}. {e.exchange.method} {e.exchange.path} returned {String(e.exchange.status)}
                  </summary>
                  <div className="acp-grid">
                    <Wire wrap="none" title={`Request ${e.n}`} text={renderRequest(e.exchange)} />
                    <Wire wrap="none" title={`Response ${e.n}`} text={renderResponse(e.exchange)} />
                  </div>
                  {e.exchange.note && <p className="acp-simpl">{e.exchange.note}</p>}
                </details>
              ) : (
                <p>{e.n}. {e.event}</p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
