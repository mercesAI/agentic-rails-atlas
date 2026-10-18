import { useEffect, useId, useMemo, useState } from 'react';
import './playground.css';
import { Check } from '@/components/playground/Check';
import { Note } from '@/components/playground/Note';
import { NumberField } from '@/components/playground/NumberField';
import { Segmented } from '@/components/playground/Segmented';
import { Select } from '@/components/playground/Select';
import { Wire as KitWire } from '@/components/playground/Wire';
import { nowSec, pretty } from '@/lib/playground/util';
import { CATALOG, CURRENCY, INSTRUMENTS, MERCHANTS, formatMinor, merchantById, type CartLine } from './lib/fixtures';
import {
  TAMPERS,
  defaultConfig,
  disputeChecks,
  explainSdJwt,
  generateKeys,
  peekJwt,
  previewConstraints,
  runV02,
  type DisputeCheck,
  type Keys,
  type Mode,
  type TamperId,
  type V02Config,
  type V02Run,
} from './lib/flow';
import { runV01, V01_TAMPERS, type V01Run, type V01Tamper } from './lib/v01';
import type { ConstraintResult } from './lib/constraints';
import type { VerifyResult } from './lib/verify';
import { FREQUENCIES, type Frequency } from './lib/types';

/** Lets a scrollable <pre> take keyboard focus (axe: scrollable-region-focusable). */
const SCROLL_TAB = 0;

type Version = 'v0.2' | 'v0.1';

const isoDay = (s: number) => new Date(s * 1000).toISOString().slice(0, 10);
const ALL_SKUS = (() => {
  const m = new Map<string, string>();
  for (const items of Object.values(CATALOG)) for (const i of items) if (!m.has(i.id)) m.set(i.id, i.title);
  return [...m.entries()].map(([id, title]) => ({ id, title }));
})();

// ------------------------------------------------------------------ small UI pieces

function ExampleLabel({ version }: { version: Version }) {
  return <Note kind="example">Illustrative example, spec version {version}</Note>;
}

function Res({ ok, okText = 'Pass', failText = 'Fail' }: { ok: boolean; okText?: string; failText?: string }) {
  return (
    <span className="ap2pg__res" data-ok={String(ok)}>
      {ok ? okText : failText}
    </span>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <span>
      <label htmlFor={id}>{label}</label> <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} />
    </span>
  );
}

/** A wire-format artifact with a decode toggle and the spec version it illustrates. */
function Wire({ title, raw, decoded, version }: { title: string; raw: string; decoded: unknown; version: Version }) {
  return <KitWire title={title} text={raw} decoded={decoded} note={<ExampleLabel version={version} />} />;
}

function ConstraintTable({ results, caption }: { results: ConstraintResult[]; caption: string }) {
  if (!results.length) return null;
  return (
    <div className="ap2pg__tablewrap">
      <table>
        <caption className="ap2pg__note" style={{ textAlign: 'left' }}>
          {caption}
        </caption>
        <thead>
          <tr>
            <th scope="col">Constraint type</th>
            <th scope="col">Result</th>
            <th scope="col">Why</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={`${r.type}-${i}`}>
              <td>
                <code>{r.type}</code>
                {!r.known && <div className="ap2pg__note">Unrecognized</div>}
              </td>
              <td>
                <Res ok={r.ok} />
              </td>
              <td>
                {r.detail}
                {r.quirk && <Note kind="quirk">{r.quirk}</Note>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ROLE_NAME: Record<VerifyResult['role'], string> = {
  credential_provider: 'Credential Provider',
  merchant: 'Merchant',
  merchant_payment_processor: 'Merchant Payment Processor',
};

function VerifierCard({ result }: { result: VerifyResult }) {
  return (
    <div className="ap2pg__section">
      <h4>
        {ROLE_NAME[result.role]}: {result.error ? <code>{result.error}</code> : 'accepted'}
      </h4>
      <div className="ap2pg__tablewrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Check</th>
              <th scope="col">Binding</th>
              <th scope="col">Result</th>
              <th scope="col">Code if it fails</th>
              <th scope="col">Detail</th>
            </tr>
          </thead>
          <tbody>
            {result.checks.map((c) => (
              <tr key={c.id}>
                <td>{c.label}</td>
                <td>
                  <code>{c.binding}</code>
                </td>
                <td>
                  <Res ok={c.ok} />
                </td>
                <td>
                  <code>{c.code}</code>
                </td>
                <td style={{ wordBreak: 'break-all' }}>{c.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConstraintTable results={result.constraints} caption={`Constraints evaluated by the ${ROLE_NAME[result.role]}`} />
      {result.deferred.map((d) => (
        <Note kind="quirk" key={d.type}>
          <code>{d.type}</code> deferred: {d.reason}
        </Note>
      ))}
    </div>
  );
}

function CartEditor({ merchantId, lines, onMerchant, onLines }: { merchantId: string; lines: CartLine[]; onMerchant: (id: string) => void; onLines: (l: CartLine[]) => void }) {
  const items = CATALOG[merchantId] ?? [];
  const qty = (sku: string) => lines.find((l) => l.sku === sku)?.quantity ?? 0;
  const setQty = (sku: string, q: number | null) => {
    const rest = lines.filter((l) => l.sku !== sku);
    onLines(q && q > 0 ? [...rest, { sku, quantity: Math.floor(q) }] : rest);
  };
  return (
    <>
      <Select label="Merchant" value={merchantId} options={MERCHANTS.map((m) => ({ value: m.id, label: `${m.name} (${m.id})` }))} onChange={onMerchant} />
      <div className="ap2pg__group">
        {items.map((i) => (
          <NumberField key={i.id} label={`${i.title}, ${formatMinor(i.price)}, quantity`} value={qty(i.id)} min={0} onChange={(v) => setQty(i.id, v)} />
        ))}
      </div>
    </>
  );
}

const toggle = (list: string[], id: string, on: boolean) => (on ? [...new Set([...list, id])] : list.filter((x) => x !== id));

// ------------------------------------------------------------------ v0.2

function V02Panel({ keys, announce }: { keys: Keys; announce: (s: string) => void }) {
  const [cfg, setCfg] = useState<V02Config>(() => {
    const n = nowSec();
    const d = defaultConfig(n);
    return { ...d, executionWindow: { enabled: false, not_before: `${isoDay(n)}T00:00:00Z`, not_after: `${isoDay(n + 30 * 86400)}T23:59:59Z` } };
  });
  const [daysSinceLast, setDaysSinceLast] = useState<number | undefined>(undefined);
  const [run, setRun] = useState<V02Run | null>(null);
  const [dispute, setDispute] = useState<DisputeCheck[]>([]);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<V02Config>) => {
    setCfg((c) => ({ ...c, ...patch }));
    setStale(true);
  };
  const hnp = cfg.mode === 'hnp';
  const preview = useMemo(() => previewConstraints(cfg), [cfg]);
  const tampers = TAMPERS.filter((t) => t.modes.includes(cfg.mode));
  const tamper = tampers.find((t) => t.id === cfg.tamper) ?? tampers[0]!;

  const execute = async () => {
    setBusy(true);
    try {
      const now = nowSec();
      const lastPresentedAt = daysSinceLast === undefined ? undefined : now - Math.round(daysSinceLast * 86400);
      const r = await runV02({ ...cfg, now, recurrence: { ...cfg.recurrence, lastPresentedAt } }, keys);
      setRun(r);
      setDispute(await disputeChecks(r));
      setStale(false);
      announce(r.outcome.ok ? 'Run complete: every verifier accepted and both receipts say Success.' : `Run stopped at the ${r.outcome.stoppedAt} with error ${r.outcome.code}.`);
    } catch (e) {
      announce(`The run stopped with an error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const preset = (p: 'within' | 'over' | 'merchant' | 'item') => {
    if (p === 'within') set({ merchantId: 'merchant_trailhead', lines: [{ sku: 'sku_trail_shoe_red_9', quantity: 1 }] });
    if (p === 'over') set({ merchantId: 'merchant_trailhead', lines: [{ sku: 'sku_trail_shoe_blue_9', quantity: 2 }] });
    if (p === 'merchant') set({ merchantId: 'merchant_lumen', lines: [{ sku: 'sku_trail_shoe_red_9', quantity: 1 }] });
    if (p === 'item') set({ merchantId: 'merchant_trailhead', lines: [{ sku: 'sku_trail_shoe_red_9', quantity: 1 }, { sku: 'sku_wool_socks', quantity: 1 }] });
  };

  const req = cfg.lineRequirements[0]!;
  const setReq = (patch: Partial<typeof req>) => set({ lineRequirements: [{ ...req, ...patch }] });

  return (
    <div className="ap2pg">
      <Segmented<Mode>
        showLabel
        label="Path"
        value={cfg.mode}
        options={[
          { value: 'hnp', label: 'Human not present' },
          { value: 'hp', label: 'Human present' },
        ]}
        onChange={(mode) => set({ mode, tamper: 'none' })}
      />
      <p className="ap2pg__note">
        {hnp
          ? 'The user signs open mandates (mandate.checkout.open.1, mandate.payment.open.1) with constraints and the agent key in cnf, then leaves. The agent later signs closed mandates (mandate.checkout.1, mandate.payment.1) as key-binding JWTs.'
          : 'The user sees the exact checkout and signs closed mandates (mandate.checkout.1, mandate.payment.1) directly on the Trusted Surface. No constraints and no cnf are needed.'}
      </p>

      <div className="ap2pg__grid">
        {hnp && (
          <fieldset>
            <legend>1. Open Checkout Mandate constraints</legend>
            <div className="ap2pg__group">
              <span className="ap2pg__grouplabel">checkout.allowed_merchants</span>
              {MERCHANTS.map((m) => (
                <Check key={m.id} label={m.name} checked={cfg.allowedMerchantIds.includes(m.id)} onChange={(on) => set({ allowedMerchantIds: toggle(cfg.allowedMerchantIds, m.id, on) })} />
              ))}
            </div>
            <div className="ap2pg__group">
              <span className="ap2pg__grouplabel">checkout.line_items: acceptable_items for requirement {req.id}</span>
              {ALL_SKUS.map((s) => (
                <Check key={s.id} label={<code>{s.id}</code>} checked={req.acceptableSkus.includes(s.id)} onChange={(on) => setReq({ acceptableSkus: toggle(req.acceptableSkus, s.id, on) })} />
              ))}
              <NumberField label="quantity" value={req.quantity} min={1} onChange={(v) => setReq({ quantity: v ?? 1 })} />
            </div>
          </fieldset>
        )}
        {hnp && (
          <fieldset>
            <legend>2. Open Payment Mandate constraints</legend>
            <div className="ap2pg__group">
              <Check label={<code>payment.amount_range</code>} checked={cfg.amountRange.enabled} onChange={(enabled) => set({ amountRange: { ...cfg.amountRange, enabled } })} />
              <div className="ap2pg__row">
                <NumberField label="min (minor units)" step="any" value={cfg.amountRange.min} onChange={(min) => set({ amountRange: { ...cfg.amountRange, min: min ?? undefined } })} />
                <NumberField label="max (minor units)" step="any" value={cfg.amountRange.max} onChange={(max) => set({ amountRange: { ...cfg.amountRange, max: max ?? 0 } })} />
              </div>
              <button type="button" className="btn btn--ghost" onClick={() => set({ amountRange: { enabled: true, min: 10.0, max: 100.5 } })}>
                Load the doc example (max 100.50, min 10.00)
              </button>
            </div>
            <div className="ap2pg__group">
              <Check label={<code>payment.budget</code>} checked={cfg.budget.enabled} onChange={(enabled) => set({ budget: { ...cfg.budget, enabled } })} />
              <div className="ap2pg__row">
                <NumberField label="max" step="any" value={cfg.budget.max} onChange={(max) => set({ budget: { ...cfg.budget, max: max ?? 0 } })} />
                <NumberField label="spent before (minor units)" value={cfg.budget.spentMinor} min={0} onChange={(v) => set({ budget: { ...cfg.budget, spentMinor: v ?? 0 } })} />
              </div>
              <Select
                label="Read max as"
                value={cfg.budgetUnit}
                options={[
                  { value: 'minor', label: 'minor units (cents)' },
                  { value: 'major', label: 'major units (dollars)' },
                ]}
                onChange={(budgetUnit) => set({ budgetUnit })}
              />
            </div>
            <div className="ap2pg__group">
              <Check label={<code>payment.agent_recurrence</code>} checked={cfg.recurrence.enabled} onChange={(enabled) => set({ recurrence: { ...cfg.recurrence, enabled } })} />
              <div className="ap2pg__row">
                <Select<Frequency> label="frequency" value={cfg.recurrence.frequency} options={FREQUENCIES.map((f) => ({ value: f, label: f }))} onChange={(frequency) => set({ recurrence: { ...cfg.recurrence, frequency } })} />
                <NumberField label="max_occurrences" value={cfg.recurrence.max_occurrences} min={1} onChange={(v) => set({ recurrence: { ...cfg.recurrence, max_occurrences: v ?? undefined } })} />
                <NumberField label="earlier occurrences" value={cfg.recurrence.occurrences} min={0} onChange={(v) => set({ recurrence: { ...cfg.recurrence, occurrences: v ?? 0 } })} />
                <NumberField
                  label="days since the last one (blank for none)"
                  value={daysSinceLast}
                  min={0}
                  step="any"
                  onChange={(v) => {
                    setDaysSinceLast(v ?? undefined);
                    setStale(true);
                  }}
                />
              </div>
            </div>
            <div className="ap2pg__group">
              <Check label={<code>payment.execution_date</code>} checked={cfg.executionWindow.enabled} onChange={(enabled) => set({ executionWindow: { ...cfg.executionWindow, enabled } })} />
              <div className="ap2pg__row">
                <TextField label="not_before" value={cfg.executionWindow.not_before ?? ''} onChange={(v) => set({ executionWindow: { ...cfg.executionWindow, not_before: v || undefined } })} />
                <TextField label="not_after" value={cfg.executionWindow.not_after ?? ''} onChange={(v) => set({ executionWindow: { ...cfg.executionWindow, not_after: v || undefined } })} />
              </div>
            </div>
            <div className="ap2pg__group">
              <span className="ap2pg__grouplabel">payment.allowed_payees</span>
              {MERCHANTS.map((m) => (
                <Check key={m.id} label={m.name} checked={cfg.allowedPayeeIds.includes(m.id)} onChange={(on) => set({ allowedPayeeIds: toggle(cfg.allowedPayeeIds, m.id, on) })} />
              ))}
              <span className="ap2pg__grouplabel">payment.allowed_payment_instruments</span>
              {INSTRUMENTS.map((i) => (
                <Check key={i.id} label={`${i.description} (${i.type})`} checked={cfg.allowedInstrumentIds.includes(i.id)} onChange={(on) => set({ allowedInstrumentIds: toggle(cfg.allowedInstrumentIds, i.id, on) })} />
              ))}
            </div>
            <Check label="Pre-set payment_instrument in the open mandate" checked={cfg.presetInstrument} onChange={(presetInstrument) => set({ presetInstrument })} />
            <Check label={<>Add an unrecognized constraint (<code>com.example.loyalty_tier</code>)</>} checked={cfg.unknownConstraint} onChange={(unknownConstraint) => set({ unknownConstraint })} />
            <p className="ap2pg__note">
              <code>payment.reference</code> is always added: its <code>conditional_transaction_id</code> is the digest of the open Checkout Mandate.
            </p>
            <NumberField label="Open mandate lifetime, minutes (exp)" value={Math.round(cfg.openTtlSeconds / 60)} min={1} onChange={(v) => set({ openTtlSeconds: (v ?? 60) * 60 })} />
            <Select
              label="Disclosures the agent presents"
              value={cfg.disclosurePolicy}
              options={[
                { value: 'minimal', label: 'Only what this checkout needs (spec rule)' },
                { value: 'all', label: 'Every element' },
              ]}
              onChange={(disclosurePolicy) => set({ disclosurePolicy })}
            />
          </fieldset>
        )}
        <fieldset>
          <legend>{hnp ? '3.' : '1.'} Checkout the agent assembles</legend>
          <div className="ap2pg__row">
            <button type="button" className="btn" onClick={() => preset('within')}>
              Within constraints
            </button>
            <button type="button" className="btn" onClick={() => preset('over')}>
              Breaks amount_range
            </button>
            <button type="button" className="btn" onClick={() => preset('merchant')}>
              Breaks allowed_merchants
            </button>
            <button type="button" className="btn" onClick={() => preset('item')}>
              Extra item (breaks line_items)
            </button>
          </div>
          <CartEditor merchantId={cfg.merchantId} lines={cfg.lines} onMerchant={(merchantId) => set({ merchantId, lines: [{ sku: CATALOG[merchantId]?.[0]?.id ?? '', quantity: 1 }] })} onLines={(lines) => set({ lines })} />
          <Select label="Payment instrument" value={cfg.instrumentId} options={INSTRUMENTS.map((i) => ({ value: i.id, label: `${i.description} (${i.type})` }))} onChange={(instrumentId) => set({ instrumentId })} />
          <p className="ap2pg__note">
            Checkout total: {formatMinor(preview.amount, CURRENCY)} ({preview.amount} minor units) at {merchantById(cfg.merchantId)?.name}.
          </p>
        </fieldset>
      </div>

      {hnp && (
        <details open>
          <summary>Constraint evaluator (live, before signing)</summary>
          <p className="ap2pg__note">Every element revealed. The signed run below applies the same rules to the disclosed open mandates.</p>
          <ConstraintTable results={preview.checkoutResults} caption="Open Checkout Mandate constraints against this checkout" />
          <ConstraintTable results={preview.paymentResults} caption="Open Payment Mandate constraints against this payment" />
        </details>
      )}

      <fieldset>
        <legend>{hnp ? '4.' : '2.'} Failure injection</legend>
        <Select<TamperId> label="Tamper" value={tamper.id} options={tampers.map((t) => ({ value: t.id, label: t.label }))} onChange={(t) => set({ tamper: t })} />
        <p className="ap2pg__note">
          Who: {tamper.who}. Expected: {tamper.expect}
        </p>
      </fieldset>

      <div className="ap2pg__row">
        <button type="button" className="btn" onClick={execute} disabled={busy}>
          {busy ? 'Signing and verifying' : 'Sign and verify'}
        </button>
        {stale && run && <span className="ap2pg__note">Settings changed since the last run.</span>}
      </div>

      <Note kind="simplification">
        One ephemeral key stands for the user or agent provider (the Trusted Agent Provider model). No user credential, OpenID4VP request or Digital Credentials API call is made.
      </Note>
      {hnp && (
        <Note kind="simplification">
          The Delegate SD-JWT draft defines how the open and closed mandates form one chain. Here they travel as two serialized SD-JWT strings, and <code>conditional_transaction_id</code> hashes the
          issuer-signed JWT of the open Checkout Mandate, because the spec does not fix which bytes are hashed.
        </Note>
      )}

      {run && <V02Results run={run} dispute={dispute} />}
    </div>
  );
}

function V02Results({ run, dispute }: { run: V02Run; dispute: DisputeCheck[] }) {
  const v: Version = 'v0.2';
  const r = run.results;
  return (
    <div className="ap2pg__section">
      <p className="ap2pg__outcome" data-ok={String(run.outcome.ok)}>
        {run.outcome.ok ? 'Accepted: every binding holds and both receipts say Success.' : `Rejected at the ${run.outcome.stoppedAt}: `}
        {!run.outcome.ok && <code>{run.outcome.code}</code>}
      </p>
      <h3>Flow ({run.config.mode === 'hnp' ? 'human not present' : 'human present'})</h3>
      <ol className="ap2pg__steps">
        {run.steps.map((s, i) => (
          <li key={`${s.id}-${i}`} data-status={s.status}>
            <span className="ap2pg__stepid">{s.id}</span>
            {s.status === 'failed' ? 'Failed: ' : s.status === 'skipped' ? 'Not reached: ' : ''}
            {s.actor && <strong>{s.actor}. </strong>}
            {s.status !== 'skipped' && s.text}
            {s.ref && <span className="ap2pg__note"> ({s.ref})</span>}
          </li>
        ))}
      </ol>

      <h3>Binding verifier</h3>
      <p className="ap2pg__note">Each verifier recomputes the hashes and signatures itself. Which error code a failed check maps to is this simulation&apos;s reading of the spec&apos;s error list.</p>
      <VerifierCard result={r.credentialProvider} />
      {r.merchant && <VerifierCard result={r.merchant} />}
      {r.processor && <VerifierCard result={r.processor} />}

      <h4>Dispute view (recomputed hashes)</h4>
      <ul>
        {dispute.map((d) => (
          <li key={d.label}>
            <Res ok={d.ok} /> {d.label} <code style={{ wordBreak: 'break-all' }}>{d.detail}</code>
          </li>
        ))}
      </ul>

      <h3>Wire format</h3>
      {run.open && (
        <>
          <Wire title="Open Checkout Mandate (user-signed SD-JWT, as presented)" raw={run.open.checkoutPresentation} decoded={explainSdJwt(run.open.checkoutPresentation)} version={v} />
          <Wire title="Open Payment Mandate (user-signed SD-JWT, as presented)" raw={run.open.paymentPresentation} decoded={explainSdJwt(run.open.paymentPresentation)} version={v} />
        </>
      )}
      <Wire title="Closed Checkout Mandate" raw={run.checkoutChain.closed} decoded={explainSdJwt(run.checkoutChain.closed)} version={v} />
      <Wire title="Closed Payment Mandate" raw={run.paymentChain.closed} decoded={explainSdJwt(run.paymentChain.closed)} version={v} />
      <Wire title="checkout_jwt (merchant-signed Checkout)" raw={run.checkoutJwt} decoded={{ ...peekJwt(run.checkoutJwt), checkout_hash: run.checkoutHash }} version={v} />
      <p className="ap2pg__note">AP2 leaves the Checkout payload to the commerce protocol (a UCP Checkout object with UCP). This shape follows the decoded example in checkout_mandate.md.</p>

      <h3>Receipts</h3>
      {run.receipts.checkout && <Wire title="Checkout Receipt (schema form, merchant-signed JWT)" raw={run.receipts.checkout.jwt} decoded={run.receipts.checkout.receipt} version={v} />}
      <Wire title="Payment Receipt (schema form, signed JWT)" raw={run.receipts.payment.jwt} decoded={run.receipts.payment.receipt} version={v} />
      <details>
        <summary>The same Payment Receipt as the agent_authorization.md prose describes it</summary>
        <pre tabIndex={SCROLL_TAB} aria-label="Mandate Receipt, prose form">
          {pretty(run.receipts.payment.prose)}
        </pre>
      </details>
      <Note kind="quirk">
        The JSON Schemas name the field <code>status</code> with values <code>Success</code> and <code>Error</code>; the Mandate Receipt prose in agent_authorization.md names it <code>result</code> with{' '}
        <code>success</code> and <code>error</code> (issue #374). Both forms are shown; neither is chosen as correct.
      </Note>
    </div>
  );
}

// ------------------------------------------------------------------ v0.1

function V01Panel({ keys, announce }: { keys: Keys; announce: (s: string) => void }) {
  const [humanPresent, setHumanPresent] = useState(false);
  const [description, setDescription] = useState('Red or blue trail runners, size 9');
  const [merchantNames, setMerchantNames] = useState<string[]>(['Trailhead Outfitters']);
  const [skus, setSkus] = useState<string[]>(['sku_trail_shoe_red_9', 'sku_trail_shoe_blue_9']);
  const [refundable, setRefundable] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [expiryHours, setExpiryHours] = useState<number | undefined>(24);
  const [merchantId, setMerchantId] = useState('merchant_trailhead');
  const [lines, setLines] = useState<CartLine[]>([{ sku: 'sku_trail_shoe_red_9', quantity: 1 }]);
  const [tamper, setTamper] = useState<V01Tamper>('none');
  const [run, setRun] = useState<V01Run | null>(null);
  const [busy, setBusy] = useState(false);

  const execute = async () => {
    setBusy(true);
    try {
      const now = nowSec();
      // Clamp to one hour and one year so the ISO date stays in range.
      const requested = expiryHours ?? 24;
      const hours = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 24 * 365) : 24;
      const r = await runV01(
        {
          humanPresent,
          intent: {
            description,
            merchants: merchantNames.length ? merchantNames : null,
            skus: skus.length ? skus : null,
            requiresRefundability: refundable,
            userCartConfirmationRequired: confirm,
            expiry: new Date((now + hours * 3600) * 1000).toISOString(),
          },
          merchantId,
          merchant: merchantById(merchantId)!,
          lines,
          instrument: INSTRUMENTS[0]!,
          currency: CURRENCY,
          tamper,
          now,
        },
        keys,
      );
      setRun(r);
      announce(r.verify.ok ? 'v0.1 run accepted.' : 'v0.1 run rejected. v0.1 defines no error codes.');
    } catch (e) {
      announce(`The v0.1 run stopped with an error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };
  const t = V01_TAMPERS.find((x) => x.id === tamper)!;
  const v: Version = 'v0.1';

  return (
    <div className="ap2pg">
      <p className="ap2pg__note">
        v0.1 (2025-09-16) had three mandates: IntentMandate, CartMandate (merchant-signed through <code>merchant_authorization</code>, which carries <code>cart_hash</code>) and PaymentMandate (user-signed
        through <code>user_authorization</code>). v0.2 replaced them with Checkout and Payment Mandates, each open or closed.
      </p>
      <Segmented
        showLabel
        label="Path"
        value={humanPresent ? 'hp' : 'hnp'}
        options={[
          { value: 'hnp', label: 'Human not present' },
          { value: 'hp', label: 'Human present' },
        ]}
        onChange={(x) => setHumanPresent(x === 'hp')}
      />
      <div className="ap2pg__grid">
        <fieldset>
          <legend>IntentMandate</legend>
          <TextField label="natural_language_description" value={description} onChange={setDescription} />
          <div className="ap2pg__group">
            <span className="ap2pg__grouplabel">merchants (none checked means any)</span>
            {MERCHANTS.map((m) => (
              <Check key={m.id} label={m.name} checked={merchantNames.includes(m.name)} onChange={(on) => setMerchantNames(toggle(merchantNames, m.name, on))} />
            ))}
          </div>
          <div className="ap2pg__group">
            <span className="ap2pg__grouplabel">skus (none checked means any)</span>
            {ALL_SKUS.map((s) => (
              <Check key={s.id} label={<code>{s.id}</code>} checked={skus.includes(s.id)} onChange={(on) => setSkus(toggle(skus, s.id, on))} />
            ))}
          </div>
          <Check label="requires_refundability" checked={refundable} onChange={setRefundable} />
          <Check label="user_cart_confirmation_required" checked={confirm} onChange={setConfirm} />
          <NumberField label="intent_expiry, hours from now" value={expiryHours} min={1} onChange={(v) => setExpiryHours(v ?? undefined)} />
        </fieldset>
        <fieldset>
          <legend>Cart</legend>
          <CartEditor
            merchantId={merchantId}
            lines={lines}
            onMerchant={(id) => {
              setMerchantId(id);
              setLines([{ sku: CATALOG[id]?.[0]?.id ?? '', quantity: 1 }]);
            }}
            onLines={setLines}
          />
          <Select<V01Tamper> label="Tamper" value={tamper} options={V01_TAMPERS.map((x) => ({ value: x.id, label: x.label }))} onChange={setTamper} />
          <p className="ap2pg__note">Expected: {t.expect}</p>
        </fieldset>
      </div>
      <div className="ap2pg__row">
        <button type="button" className="btn" onClick={execute} disabled={busy}>
          {busy ? 'Signing and verifying' : 'Sign and verify (v0.1)'}
        </button>
      </div>
      <Note kind="simplification">
        v0.1 describes <code>user_authorization</code> as a verifiable presentation, for example an SD-JWT VC with a key-binding JWT whose <code>transaction_data</code> holds the two hashes. Here it is
        one ES256 JWT with <code>aud</code>, <code>nonce</code>, <code>iat</code> and <code>transaction_data</code>. &quot;Canonical JSON&quot; for <code>cart_hash</code> is read as JSON with sorted keys.
      </Note>
      <Note kind="quirk">
        v0.1 amounts are W3C Payment Request floats in major units (<code>value</code>), while v0.2 uses integer minor units. v0.1 defines no machine-checkable constraints and no error codes, so the intent
        checks below are this simulation&apos;s reading of the field descriptions.
      </Note>
      {run && (
        <div className="ap2pg__section">
          <p className="ap2pg__outcome" data-ok={String(run.verify.ok)}>
            {run.verify.ok ? 'Accepted.' : 'Rejected (v0.1 defines no error code for this).'}
          </p>
          <div className="ap2pg__tablewrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Check</th>
                  <th scope="col">Result</th>
                  <th scope="col">Detail</th>
                </tr>
              </thead>
              <tbody>
                {[...run.verify.checks, ...run.verify.intent].map((c) => (
                  <tr key={c.id}>
                    <td>{c.label}</td>
                    <td>
                      <Res ok={c.ok} />
                    </td>
                    <td style={{ wordBreak: 'break-all' }}>{c.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {humanPresent && <p className="ap2pg__note">Human present: the user confirms the cart, so intent checks are shown but do not decide the outcome.</p>}
          <Wire title="IntentMandate (ap2.mandates.IntentMandate)" raw={pretty(run.intent)} decoded={run.intent} version={v} />
          <Wire title="CartMandate merchant_authorization (JWT)" raw={run.cart.merchant_authorization ?? ''} decoded={peekJwt(run.cart.merchant_authorization ?? '')} version={v} />
          <Wire title="CartMandate (ap2.mandates.CartMandate)" raw={pretty(run.cart)} decoded={run.cart} version={v} />
          <Wire title="PaymentMandate user_authorization (JWT)" raw={run.payment.user_authorization ?? ''} decoded={peekJwt(run.payment.user_authorization ?? '')} version={v} />
          <Wire title="PaymentMandate (ap2.mandates.PaymentMandate)" raw={pretty(run.payment)} decoded={run.payment} version={v} />
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ root

export default function Playground() {
  const [keys, setKeys] = useState<Keys | null>(null);
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState<Version>('v0.2');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let alive = true;
    generateKeys()
      .then((k) => alive && setKeys(k))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  if (failed) return <p role="alert">This browser could not create ES256 keys with WebCrypto, so the simulation cannot run.</p>;
  if (!keys) return <p className="ap2pg__note">Generating ephemeral ES256 keys.</p>;

  return (
    <div className="ap2pg">
      <div className="ap2pg__row">
        <Segmented<Version>
          showLabel
          label="Spec version"
          value={version}
          options={[
            { value: 'v0.2', label: 'v0.2 (2026-04-28)' },
            { value: 'v0.1', label: 'v0.1 (2025-09-16)' },
          ]}
          onChange={(v) => {
            setVersion(v);
            setMessage(`Showing spec version ${v}.`);
          }}
        />
      </div>
      <p className="ap2pg__note">
        Five ES256 (P-256) keys were generated in this browser for this session: user_sk, agent_sk, other_agent_sk, merchant_sk and processor_sk. Private keys are non-extractable and never stored.
        Merchants, items and instruments are fixtures on <code>.example</code> domains. Agent public key x: <code>{keys.agent.publicJwk.x.slice(0, 12)}</code>
      </p>
      <p aria-live="polite" role="status" className="ap2pg__note">
        {message}
      </p>
      {version === 'v0.2' ? <V02Panel keys={keys} announce={setMessage} /> : <V01Panel keys={keys} announce={setMessage} />}
    </div>
  );
}
