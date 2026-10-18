import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './playground.css';
import { Check } from '@/components/playground/Check';
import { ScrollRegion } from '@/components/playground/ScrollRegion';
import { Note } from '@/components/playground/Note';
import { NumberField } from '@/components/playground/NumberField';
import { Select } from '@/components/playground/Select';
import { Tabs } from '@/components/playground/Tabs';
import { Wire as KitWire } from '@/components/playground/Wire';
import { base64UrlDecodeJson } from '@/lib/playground/bytes';
import { generateEs256Key, jwkThumbprint, type Es256Key } from '@/lib/playground/es256';
import { ellipsize, nowSec, pretty } from '@/lib/playground/util';
import { AGENT_KEY_HOST, MERCHANTS, PROGRAM_LABEL, SHOP_AUTHORITY, SHOP_PATH, SPEC_LABEL, formatMinor, merchantById } from './lib/fixtures';
import { MASTERCARD_TAG, addToDirectory, signRequest, verifyAtEdge, type EdgeResult, type FixtureDirectory, type SignedRequest } from './lib/httpsig';
import {
  NOT_PUBLISHED,
  REASON_TEXT,
  STATES,
  authorize,
  isUsable,
  provisionToken,
  revoke,
  signConsent,
  stateAfterAttempt,
  stateLabel,
  type AgenticToken,
  type AuthResult,
  type Consent,
  type Controls,
  type TokenState,
  type Transition,
} from './lib/lifecycle';
import { FAULTS, defaultViConfig, buildChain, generateViKeys, humanDuration, inspectLayer, lifetimeOf, trustFor, type FaultId, type Inspected, type Mode, type VIConfig, type VIKeys, type ViArtifacts } from './lib/vi';
import { verifyChain, type CheckStatus, type ViReport } from './lib/vi-verify';

const SCROLL_TAB = 0;

// ------------------------------------------------------------------ small UI pieces

function Example({ label }: { label: string }) {
  return <Note kind="example">{label}</Note>;
}

const STATUS_TEXT: Record<CheckStatus, string> = { pass: 'Pass', fail: 'Fail', warn: 'Warning', skipped: 'Skipped' };

function Status({ status }: { status: CheckStatus }) {
  return (
    <span className="mcpg__res" data-status={status} data-ok={String(status !== 'fail')}>
      {STATUS_TEXT[status]}
    </span>
  );
}

/** A wire-format artifact with a decode toggle and the example label it illustrates. */
function Wire({ title, raw, decoded, example }: { title: string; raw: string; decoded: unknown; example: string }) {
  return <KitWire title={title} text={raw} decoded={decoded} note={<Example label={example} />} />;
}

// ------------------------------------------------------------------ token lifecycle

type Injection = 'none' | 'no-signature' | 'unregistered-key' | 'expired-window' | 'replayed-nonce' | 'wrong-tag' | 'tampered-path';

const INJECTIONS: { value: Injection; label: string }[] = [
  { value: 'none', label: 'Valid signed request' },
  { value: 'no-signature', label: 'Missing signature headers' },
  { value: 'unregistered-key', label: 'Key not in the key set' },
  { value: 'expired-window', label: 'Expired signature window' },
  { value: 'replayed-nonce', label: 'Replayed nonce' },
  { value: 'wrong-tag', label: 'Wrong tag (agent-browser-auth)' },
  { value: 'tampered-path', label: 'Path changed after signing' },
];

interface LogEntry {
  id: number;
  text: string;
}

function LifecyclePanel({ announce }: { announce: (s: string) => void }) {
  const [agentKey, setAgentKey] = useState<Es256Key | null>(null);
  const [passkey, setPasskey] = useState<Es256Key | null>(null);
  const directory = useRef<FixtureDirectory>(new Map());
  const seen = useRef<Set<string>>(new Set());
  const [keyid, setKeyid] = useState('');
  const [clock, setClock] = useState(nowSec);
  const [state, setState] = useState<TokenState | null>(null);
  const [limit, setLimit] = useState<number | undefined>(100);
  const [scope, setScope] = useState<string[]>(['merchant-audioshop']);
  const [hours, setHours] = useState<number | undefined>(1);
  const [singleUse, setSingleUse] = useState(false);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [token, setToken] = useState<AgenticToken | null>(null);
  const [merchantId, setMerchantId] = useState('merchant-audioshop');
  const [amount, setAmount] = useState<number | undefined>(60);
  const [injection, setInjection] = useState<Injection>('none');
  const [request, setRequest] = useState<SignedRequest | null>(null);
  const [edge, setEdge] = useState<EdgeResult[]>([]);
  const [auth, setAuth] = useState<AuthResult | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const logId = useRef(0);

  useEffect(() => {
    let alive = true;
    Promise.all([generateEs256Key('agent_sk'), generateEs256Key('passkey_sim')]).then(([a, p]) => {
      if (alive) {
        setAgentKey(a);
        setPasskey(p);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const say = useCallback(
    (text: string) => {
      setLog((l) => [...l, { id: ++logId.current, text }]);
      announce(text);
    },
    [announce],
  );
  const fmt = (t: Transition) => `${stateLabel(t.from)} to ${stateLabel(t.to)}${t.published ? '' : ' (simulator step, not in the page state machine)'}`;

  const controls: Controls = useMemo(
    () => ({ limitMinor: Math.round((limit ?? 0) * 100), merchantIds: scope, expiresAt: clock + Math.round((hours ?? 0) * 3600), singleUse }),
    [limit, scope, hours, singleUse, clock],
  );
  const locked = state !== null && state !== 'agent-registered' && state !== 'agent-certified';

  const register = async () => {
    if (!agentKey) return;
    const id = await addToDirectory(directory.current, agentKey);
    setKeyid(id);
    setState('agent-registered');
    say(`Agent registered: public key added to the local fixture key set under keyid ${ellipsize(id, 6)}. The real directory location is unknown.`);
  };
  const certify = () => {
    setState('agent-certified');
    say('Agent certified (simulated security review). Mastercard publishes no certification API.');
  };
  const consentNow = async () => {
    if (!passkey) return;
    const c = await signConsent(passkey, keyid, controls);
    setConsent(c);
    setState('consumer-authorized');
    say(`Consumer authorized: passkey signature self-check ${c.selfCheck ? 'passed' : 'failed'} (same key signs and checks) over limit ${formatMinor(controls.limitMinor)}, ${scope.length} merchant(s), ${hours ?? 0} hour(s).`);
  };
  const provision = () => {
    const t = provisionToken(controls, clock);
    setToken(t);
    setState('token-provisioned');
    say(`Token provisioned: ${t.value}. The provisioning call is ${NOT_PUBLISHED}.`);
  };
  const doRevoke = () => {
    if (!token || !state) return;
    const t = revoke(state);
    if (!t) return;
    setToken({ ...token, revoked: true });
    setState('expired-or-revoked');
    say(`Revoked: ${fmt(t)}. Mastercard publishes no revocation API, so this step is a simulator action.`);
  };

  const purchase = async () => {
    if (!agentKey || !token || !state) return;
    const m = merchantById(merchantId);
    const amountMinor = Math.round((amount ?? 0) * 100);
    const created = injection === 'expired-window' ? clock - 3600 : clock;
    const base = { authority: SHOP_AUTHORITY, path: SHOP_PATH };
    let signed: SignedRequest;
    const results: EdgeResult[] = [];
    if (injection === 'unregistered-key') {
      const stranger = await generateEs256Key('stranger');
      signed = await signRequest(base, stranger, { created, keyid: await jwkThumbprint(stranger.publicJwk), signatureAgent: AGENT_KEY_HOST });
    } else if (injection === 'no-signature') {
      signed = { ...base };
    } else {
      signed = await signRequest(base, agentKey, { created, keyid, tag: injection === 'wrong-tag' ? 'agent-browser-auth' : MASTERCARD_TAG, signatureAgent: AGENT_KEY_HOST });
      if (injection === 'tampered-path') signed = { ...signed, path: '/product/43' };
      if (injection === 'replayed-nonce') results.push(await verifyAtEdge(signed, directory.current, clock, seen.current));
    }
    results.push(await verifyAtEdge(signed, directory.current, clock, seen.current));
    const last = results[results.length - 1] as EdgeResult;
    setRequest(signed);
    setEdge(results);
    if (last.verdict !== 'trusted-agent') {
      setAuth(null);
      say(`Edge: ${last.outcome}. The request never reached the network, so the token state stays "${stateLabel(state)}".`);
      return;
    }
    const usable = isUsable(token, clock);
    const result = authorize(token, { amountMinor, merchantId: m.id, now: clock });
    const next = stateAfterAttempt(state, usable, result.approved, token.revoked);
    setAuth(result);
    setState(next.state);
    if (result.approved) setToken({ ...token, uses: token.uses + 1 });
    say(
      result.approved
        ? `Authorization: approved ${formatMinor(amountMinor)} at ${m.name}. Path: ${next.path.map(fmt).join('; ')}.`
        : `Authorization: declined (${result.reasons.map((r) => REASON_TEXT[r]).join('; ')}). Response code ${NOT_PUBLISHED}. Path: ${next.path.length ? next.path.map(fmt).join('; ') : 'no state change'}.`,
    );
  };

  if (!agentKey || !passkey) return <p className="mcpg__note">Generating ephemeral P-256 keys.</p>;
  const canPurchase = state === 'token-provisioned' || state === 'authorized' || state === 'declined' || state === 'expired-or-revoked';
  const canRevoke = !!token && !token.revoked && !!state && !!revoke(state);

  return (
    <div className="mcpg__section">
      <Example label={PROGRAM_LABEL} />
      <p className="mcpg__note">
        State names follow the page state machine, which describes the developer guides and is not a published Mastercard state model. A one-time DTVC is a different object, issued with a Mastercard Virtual Card Token, and is not part of this flow.
      </p>
      <ol className="mcpg__states" aria-label="Token lifecycle states">
        {STATES.map((s) => (
          <li key={s.id} className="mcpg__state" aria-current={state === s.id ? 'step' : undefined}>
            {s.label}
            {state === s.id ? ' (current)' : ''}
          </li>
        ))}
      </ol>

      <fieldset>
        <legend>Consumer controls</legend>
        <div className="mcpg__row">
          <NumberField label="Limit per purchase (USD)" value={limit} min={0} step={1} disabled={locked} onChange={(v) => setLimit(v ?? undefined)} />
          <NumberField label="Expiry (hours from now)" value={hours} min={0} step="any" disabled={locked} onChange={(v) => setHours(v ?? undefined)} />
          <Check label="Single use" checked={singleUse} disabled={locked} onChange={setSingleUse} />
        </div>
        <div className="mcpg__row" role="group" aria-label="Merchant scope">
          {MERCHANTS.map((m) => (
            <Check key={m.id} label={m.name} checked={scope.includes(m.id)} disabled={locked} onChange={(on) => setScope((s) => (on ? [...new Set([...s, m.id])] : s.filter((x) => x !== m.id)))} />
          ))}
        </div>
        <Note kind="simplification">
          The passkey is a fresh WebCrypto P-256 key that signs a challenge naming the agent keyid and the controls. A real passkey is a WebAuthn credential bound to a relying party. Mastercard publishes no schema for the controls or the provisioning request.
        </Note>
      </fieldset>

      <div className="mcpg__row" role="group" aria-label="Lifecycle steps">
        <button type="button" className="btn" disabled={state !== null} onClick={register}>
          1. Register agent
        </button>
        <button type="button" className="btn" disabled={state !== 'agent-registered'} onClick={certify}>
          2. Certify agent
        </button>
        <button type="button" className="btn" disabled={state !== 'agent-certified' || !scope.length} onClick={consentNow}>
          3. Consent with passkey
        </button>
        <button type="button" className="btn" disabled={state !== 'consumer-authorized'} onClick={provision}>
          4. Provision token
        </button>
        <button type="button" className="btn" disabled={!canRevoke} onClick={doRevoke}>
          Revoke (mechanism {NOT_PUBLISHED})
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => { setClock((c) => c + 3600); announce('Simulated clock advanced one hour.'); }}>
          Advance clock one hour
        </button>
      </div>
      <p className="mcpg__note">Simulated time: {new Date(clock * 1000).toISOString().replace('.000Z', 'Z')}</p>
      {consent && (
        <Wire title="Passkey consent challenge (simulated)" raw={consent.challenge} decoded={base64UrlDecodeJson(consent.challenge)} example="Illustrative example, not a Mastercard format" />
      )}
      {token && (
        <p className="mcpg__note">
          Token <code>{token.value}</code> (fixture, not a card number). Uses: {token.uses}. Expires {new Date(token.controls.expiresAt * 1000).toISOString().slice(0, 19)}Z.{token.revoked ? ' Revoked in the simulator.' : ''}
        </p>
      )}

      <fieldset disabled={!canPurchase}>
        <legend>5. Purchase through the edge</legend>
        <div className="mcpg__row">
          <Select label="Merchant" value={merchantId} options={MERCHANTS.map((m) => ({ value: m.id, label: m.name }))} onChange={setMerchantId} />
          <NumberField label="Amount (USD)" value={amount} min={0} step="any" onChange={(v) => setAmount(v ?? undefined)} />
          <Select<Injection> label="Failure to inject" value={injection} options={INJECTIONS} onChange={setInjection} />
          <button type="button" className="btn" onClick={purchase}>
            Sign, verify at edge, authorize
          </button>
        </div>
        <Note kind="simplification">
          Signing uses ECDSA P-256 (<code>ecdsa-p256-sha256</code>) and covers only <code>@authority</code> and <code>@path</code>; the guide example uses Ed25519. The key set is a local fixture, because the Mastercard directory location is not public and Mastercard publishes no URL for it.
        </Note>
      </fieldset>

      {request && (
        <Wire
          title="Signed request headers"
          raw={`GET ${request.path} HTTP/1.1\nHost: ${request.authority}\n${request.signatureAgent ? `Signature-Agent: "${request.signatureAgent}"\n` : ''}${request.signatureInput ? `Signature-Input: ${request.signatureInput}\n` : ''}${request.signature ? `Signature: ${request.signature}` : '(no signature headers sent)'}`}
          decoded={{ note: 'Signature-Input parameters', tag: MASTERCARD_TAG, covered: ['@authority', '@path'], keyid }}
          example={PROGRAM_LABEL}
        />
      )}
      {edge.map((e, i) => (
        <div key={i} className="mcpg__section">
          <h4>
            Edge check{edge.length > 1 ? ` ${i + 1} of ${edge.length}` : ''}: {e.verdict === 'trusted-agent' ? 'forward as a trusted agent' : e.outcome}
          </h4>
          <ol className="mcpg__steps">
            {e.steps.map((s) => (
              <li key={s.id} data-status={s.status === 'fail' ? 'failed' : s.status}>
                <Status status={s.status} /> {s.label}. <span className="mcpg__note">{s.detail}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
      {auth && (
        <div className="mcpg__outcome" data-ok={String(auth.approved)}>
          {auth.approved ? 'Authorized' : 'Declined'}
          {auth.approved ? '' : `: ${auth.reasons.map((r) => REASON_TEXT[r]).join('; ')}`}. Response code: {auth.responseCode}. Mastercard publishes no response codes or reason names for agentic token declines.
        </div>
      )}
      <div className="mcpg__section">
        <h4>Event log</h4>
        <ol className="mcpg__log" tabIndex={SCROLL_TAB} aria-label="Event log">
          {log.length ? log.map((l) => <li key={l.id}>{l.text}</li>) : <li>No events yet. Start with step 1.</li>}
        </ol>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Verifiable Intent

interface ViView {
  art: ViArtifacts;
  report: ViReport;
  layers: { id: 'L1' | 'L2' | 'L3a' | 'L3b'; raw: string; ins: Inspected }[];
  cfg: VIConfig;
}

const LAYER_META: Record<string, { signer: string; recommended: string }> = {
  L1: { signer: 'Issuer', recommended: '1 year' },
  'L2-immediate': { signer: 'User key from L1 cnf', recommended: '15 minutes' },
  'L2-autonomous': { signer: 'User key from L1 cnf', recommended: '24 hours to 30 days, never beyond L1' },
  L3a: { signer: 'Agent key from L2 cnf', recommended: '5 minutes, 1 hour at most' },
  L3b: { signer: 'Agent key from L2 cnf', recommended: '5 minutes, 1 hour at most' },
};

function bindingOf(id: string, ins: Inspected): string {
  const p = ins.payload;
  if (id === 'L1') return `cnf.jwk binds user key ${ellipsize(String((p.cnf as { jwk?: { x?: string } } | undefined)?.jwk?.x ?? ''), 6)}`;
  const sd = `sd_hash ${ellipsize(String(p.sd_hash ?? ''), 6)}`;
  if (id === 'L2') {
    const m = ins.disclosures.map((d) => (d.decoded as [string, { cnf?: { jwk?: { kid?: string } } }])[1]).find((v) => v?.cnf);
    return m?.cnf?.jwk ? `${sd}; mandates bind agent key ${m.cnf.jwk.kid ?? ''} in cnf.jwk` : `${sd}; no cnf in Immediate mandates`;
  }
  return `${sd}; header kid ${String(ins.header.kid)}; no cnf`;
}

function VIPanel({ announce }: { announce: (s: string) => void }) {
  const [keys, setKeys] = useState<VIKeys | null>(null);
  const [cfg, setCfg] = useState<VIConfig>(() => defaultViConfig('autonomous'));
  const [budgetOn, setBudgetOn] = useState(false);
  const [budgetUsd, setBudgetUsd] = useState<number | undefined>(500);
  const [view, setView] = useState<ViView | null>(null);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<VIConfig>) => {
    setCfg((c) => ({ ...c, ...patch }));
    setStale(true);
  };

  useEffect(() => {
    let alive = true;
    generateViKeys().then((k) => alive && setKeys(k));
    return () => {
      alive = false;
    };
  }, []);

  const faults = FAULTS.filter((f) => f.modes.includes(cfg.mode));
  const fault = faults.find((f) => f.id === cfg.fault) ?? (faults[0] as (typeof FAULTS)[number]);

  const run = useCallback(
    async (c: VIConfig) => {
      if (!keys) return;
      setBusy(true);
      try {
        const eff = { ...c, budgetMax: budgetOn ? Math.round((budgetUsd ?? 0) * 100) : undefined };
        const now = nowSec();
        const art = await buildChain(keys, eff, now);
        const report = await verifyChain(art, trustFor(keys, now, eff.spentSoFar));
        const ids = [['L1', art.l1], ['L2', art.l2], ...(art.l3a ? [['L3a', art.l3a]] : []), ...(art.l3b ? [['L3b', art.l3b]] : [])] as ['L1' | 'L2' | 'L3a' | 'L3b', string][];
        const layers = await Promise.all(ids.map(async ([id, raw]) => ({ id, raw, ins: await inspectLayer(raw) })));
        setView({ art, report, layers, cfg: eff });
        setStale(false);
        announce(report.ok ? 'Chain built. Every verifier check passes or warns.' : `Chain built. ${report.failures.length} check(s) fail; the first is ${report.firstFailure?.label}.`);
      } finally {
        setBusy(false);
      }
    },
    [keys, budgetOn, budgetUsd, announce],
  );

  useEffect(() => {
    if (keys && !view) void run(cfg);
  }, [keys, view, run, cfg]);

  if (!keys) return <p className="mcpg__note">Generating ephemeral ES256 keys.</p>;
  const mode = cfg.mode;
  const toggleMerchant = (id: string, on: boolean) => set({ allowedMerchantIds: on ? [...new Set([...cfg.allowedMerchantIds, id])] : cfg.allowedMerchantIds.filter((x) => x !== id) });

  return (
    <div className="mcpg__section">
      <Example label={SPEC_LABEL} />
      <p className="mcpg__note">
        Four ES256 keys (issuer, user, agent, merchant) plus a spare agent key were generated in this browser. Private keys are non-extractable and never stored. Card data is a fixture (<code>Mastercard **** 0000</code>).
      </p>
      <fieldset>
        <legend>Build</legend>
        <div className="mcpg__row">
          <Select<Mode>
            label="L2 mode"
            value={mode}
            options={[
              { value: 'autonomous', label: 'Autonomous (L1, L2, L3a, L3b)' },
              { value: 'immediate', label: 'Immediate (L1, L2)' },
            ]}
            onChange={(m) => set({ mode: m, fault: 'none' })}
          />
          <Select<string> label="Merchant" value={cfg.merchantId} options={MERCHANTS.map((m) => ({ value: m.id, label: m.name }))} onChange={(v) => set({ merchantId: v })} />
          <NumberField label="Purchase amount (USD)" value={cfg.amountMinor / 100} min={0} step="any" onChange={(v) => set({ amountMinor: Math.round((v ?? 0) * 100) })} />
        </div>
        {mode === 'autonomous' && (
          <>
            <div className="mcpg__row">
              <NumberField label="mandate.payment.amount_range min (USD)" value={cfg.amountMin / 100} min={0} step="any" onChange={(v) => set({ amountMin: Math.round((v ?? 0) * 100) })} />
              <NumberField label="max (USD)" value={cfg.amountMax / 100} min={0} step="any" onChange={(v) => set({ amountMax: Math.round((v ?? 0) * 100) })} />
            </div>
            <div className="mcpg__row" role="group" aria-label="mandate.checkout.allowed_merchants">
              <span className="mcpg__grouplabel">mandate.checkout.allowed_merchants</span>
              {MERCHANTS.map((m) => (
                <Check key={m.id} label={m.name} checked={cfg.allowedMerchantIds.includes(m.id)} onChange={(on) => toggleMerchant(m.id, on)} />
              ))}
            </div>
            <div className="mcpg__row">
              <Check label="Add mandate.payment.budget" checked={budgetOn} onChange={(v) => { setBudgetOn(v); setStale(true); }} />
              <NumberField label="Budget max (USD)" value={budgetUsd} min={0} step="any" disabled={!budgetOn} onChange={(v) => { setBudgetUsd(v ?? undefined); setStale(true); }} />
              <NumberField label="Already spent under this mandate (USD, network state)" value={cfg.spentSoFar / 100} min={0} step="any" disabled={!budgetOn} onChange={(v) => set({ spentSoFar: Math.round((v ?? 0) * 100) })} />
            </div>
          </>
        )}
        <div className="mcpg__row">
          <Select<FaultId> label="Break something" value={fault.id} options={faults.map((f) => ({ value: f.id, label: f.label }))} onChange={(v) => set({ fault: v })} />
          <button type="button" className="btn" disabled={busy} onClick={() => void run(cfg)}>
            Build and verify
          </button>
        </div>
        <p className="mcpg__note">Expected: {fault.expect}.</p>
        {stale && <p className="mcpg__note">Inputs changed. Build again to update the layers and the verifier.</p>}
        <Note kind="simplification">
          The <code>line_items</code> constraint and item disclosures are not modeled, so L3b <code>sd_hash</code> covers the L2 base JWT plus the checkout disclosure only. <code>checkout_jwt</code> is an ES256 JWS from a fixture merchant key; v0.1 leaves its format implementation-defined. One verifier sees the full L2 and both L3 credentials. Network state (budget spend) is typed in; the spec defines no API for it.
        </Note>
      </fieldset>

      {view && <ViResult view={view} />}
    </div>
  );
}

function ViResult({ view }: { view: ViView }) {
  const { report, layers, art } = view;
  const l3a = layers.find((l) => l.id === 'L3a');
  const l3b = layers.find((l) => l.id === 'L3b');
  const mandate = (l: typeof l3a) => (l?.ins.disclosures[0]?.decoded as [string, Record<string, unknown>] | undefined)?.[1];
  const hashA = mandate(l3a)?.transaction_id;
  const hashB = mandate(l3b)?.checkout_hash;
  const l2 = layers.find((l) => l.id === 'L2');
  const constraints = (l2?.ins.disclosures ?? []).flatMap((d) => {
    const v = (d.decoded as [string, { constraints?: { type: string }[] }])[1];
    return v?.constraints ?? [];
  });
  return (
    <div className="mcpg__section">
      <div className="mcpg__outcome" data-ok={String(report.ok)}>
        {report.ok ? 'Verifier accepts the chain.' : `Verifier rejects the chain. First break: ${report.firstFailure?.layer} / ${report.firstFailure?.label}. ${report.failures.length - 1 ? `${report.failures.length - 1} more check(s) break with it.` : 'No other check breaks.'}`}
      </div>

      <ScrollRegion label="Layers, signers, lifetimes and bindings table">
        <table>
          <caption className="mcpg__note" style={{ textAlign: 'left' }}>
            Layers, signers, lifetimes and bindings (lifetimes are recommendations unless noted)
          </caption>
          <thead>
            <tr>
              <th scope="col">Layer</th>
              <th scope="col">typ</th>
              <th scope="col">Signed by</th>
              <th scope="col">Lifetime (recommended)</th>
              <th scope="col">Binding</th>
            </tr>
          </thead>
          <tbody>
            {layers.map((l) => {
              const meta = LAYER_META[l.id === 'L2' ? `L2-${art.mode}` : l.id] as { signer: string; recommended: string };
              const life = lifetimeOf(l.ins.payload);
              return (
                <tr key={l.id}>
                  <th scope="row">{l.id}</th>
                  <td>
                    <code>{String(l.ins.header.typ)}</code>
                  </td>
                  <td>{meta.signer}</td>
                  <td>
                    {life === undefined ? '-' : humanDuration(life)} ({meta.recommended})
                  </td>
                  <td>{bindingOf(l.id, l.ins)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollRegion>

      {constraints.length > 0 && (
        <details open>
          <summary>L2 constraints</summary>
          <ul>
            {constraints.map((c, i) => (
              <li key={i}>
                <code>{c.type}</code>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="mcpg__section">
        <h4>checkout_hash link</h4>
        {art.mode === 'autonomous' ? (
          <p className="mcpg__note">
            L3a <code>transaction_id</code>: <code>{ellipsize(String(hashA ?? ''), 10)}</code>. L3b <code>checkout_hash</code>: <code>{ellipsize(String(hashB ?? ''), 10)}</code>. {hashA && hashA === hashB ? 'Equal.' : 'Not equal or not readable.'}
          </p>
        ) : (
          <p className="mcpg__note">In Immediate mode the same pair of values sits inside L2: the payment mandate <code>transaction_id</code> must equal the checkout mandate <code>checkout_hash</code>.</p>
        )}
      </div>

      <ScrollRegion label="Verifier checks table">
        <table>
          <caption className="mcpg__note" style={{ textAlign: 'left' }}>
            Verifier checks, recomputed from the serialized strings
          </caption>
          <thead>
            <tr>
              <th scope="col">Layer</th>
              <th scope="col">Check</th>
              <th scope="col">Result</th>
              <th scope="col">Detail</th>
              <th scope="col">Spec</th>
            </tr>
          </thead>
          <tbody>
            {report.checks.map((c) => (
              <tr key={c.id}>
                <td>{c.layer}</td>
                <td>{c.label}</td>
                <td>
                  <Status status={c.status} />
                </td>
                <td style={{ wordBreak: 'break-word' }}>{c.detail}</td>
                <td>
                  <code>{c.spec}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>

      {layers.map((l) => (
        <Wire
          key={l.id}
          title={`${l.id} SD-JWT`}
          raw={l.raw}
          decoded={pretty({ header: l.ins.header, payload: l.ins.payload, disclosures: l.ins.disclosures.map((d) => d.decoded) })}
          example={SPEC_LABEL}
        />
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ root

type Tab = 'lifecycle' | 'vi';

export default function Playground() {
  const [tab, setTab] = useState<Tab>('lifecycle');
  const [message, setMessage] = useState('');
  const [cryptoOk] = useState(() => typeof crypto !== 'undefined' && !!crypto.subtle);
  // Both panels stay mounted so keys, logs and built chains survive a tab switch. Only the visible panel
  // may write the shared status line; a hidden panel (the VI chain builds at mount) stays quiet.
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const announceLifecycle = useCallback((s: string) => {
    if (tabRef.current === 'lifecycle') setMessage(s);
  }, []);
  const announceVi = useCallback((s: string) => {
    if (tabRef.current === 'vi') setMessage(s);
  }, []);
  if (!cryptoOk) return <p role="alert">This browser does not offer WebCrypto here, so the simulation cannot run.</p>;
  return (
    <div className="mcpg">
      <p aria-live="polite" role="status" className="mcpg__note">
        {message}
      </p>
      <Tabs<Tab>
        label="Simulator"
        idPrefix="mcpg"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'lifecycle', label: 'Agentic token lifecycle', content: <LifecyclePanel announce={announceLifecycle} /> },
          { id: 'vi', label: 'Verifiable Intent layers', content: <VIPanel announce={announceVi} /> },
        ]}
      />
    </div>
  );
}
