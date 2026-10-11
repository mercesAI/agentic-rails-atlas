/**
 * x402 playground: a 402 handshake simulator (V1 and V2), scheme and payment-flow switchers, a facilitator
 * verify and settle timeline, failure injection, an EIP-712 preview with signature recovery, a spend cap demo
 * and a base64 header codec. Everything runs in this browser with a key generated at mount; nothing is stored
 * and nothing is sent to a network. PlaygroundFrame wraps this component.
 */
import { useEffect, useId, useMemo, useState } from 'react';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { decodeHeader, encodeJsonText, toJson } from './lib/base64';
import { FIXTURE_PAY_TO, FIXTURE_TOKEN, SIM_NETWORK_V2, illustrativeLabel, networkFor, type PaymentFlow, type Scheme, type Version } from './lib/fixtures';
import { reasonOf, type Check, type ErrorCode } from './lib/facilitator';
import { FLOW_ORDER_TEXT, resolveFlow } from './lib/flows';
import { ACTOR_LABEL, FAILURES, runSimulation, type Actor, type FailureId, type SimResult, type Signing, type Step, type Wire } from './lib/simulate';
import { DEFAULT_MAX_AMOUNT_PER_PAYMENT, checkSpendControls, convertToTokenAmount, formatAtomic, parseMoney, type SpendCap } from './lib/spend';
import { recoverSigner, sameAddress, tamperAmount, type TypedDataSigner } from './lib/typed-data';
import './x402.css';

type CapChoice = '$1' | '$0.10' | '$5' | 'off';

interface Options {
  version: Version;
  scheme: Scheme;
  flow: PaymentFlow;
  failure: FailureId;
  price: string;
  metered: string;
  cap: CapChoice;
}

const DEFAULTS: Options = {
  version: 2,
  scheme: 'exact',
  flow: 'authorization',
  failure: 'none',
  price: '0.01',
  metered: '0.004',
  cap: '$1',
};

const ACTORS: Actor[] = ['client', 'server', 'facilitator', 'chain'];

function toAtomic(usd: string): string | null {
  try {
    return convertToTokenAmount(parseMoney(usd), FIXTURE_TOKEN.decimals);
  } catch {
    return null;
  }
}

function capValue(c: CapChoice): SpendCap {
  return c === 'off' ? false : c;
}

const STATUS_TEXT: Record<Step['status'], string> = { ok: 'OK', fail: 'Failed', info: 'Note' };

export default function Playground() {
  // Ephemeral key: created once per mount, held only in memory. Reset in the frame remounts and replaces it.
  const [account] = useState(() => privateKeyToAccount(generatePrivateKey()));
  const signer = useMemo<TypedDataSigner>(
    () => ({ address: account.address, signTypedData: (td) => account.signTypedData(td as Parameters<typeof account.signTypedData>[0]) }),
    [account],
  );
  const [opt, setOpt] = useState<Options>(DEFAULTS);
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<SimResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState('');

  const amount = toAtomic(opt.price);
  const metered = toAtomic(opt.metered);
  const inputError =
    amount === null
      ? 'Enter the price as a dollar amount, for example 0.01.'
      : opt.scheme === 'upto' && metered === null
        ? 'Enter the metered charge as a dollar amount, for example 0.004.'
        : null;

  useEffect(() => {
    if (amount === null || metered === null) return;
    let alive = true;
    setBusy(true);
    runSimulation(
      {
        version: opt.version,
        scheme: opt.scheme,
        flow: opt.flow,
        failure: opt.failure,
        amount,
        metered,
        spendCap: capValue(opt.cap),
        now: Math.floor(Date.now() / 1000),
      },
      signer,
    )
      .then((r) => {
        if (!alive) return;
        setResult(r);
        setAnnounce(`${r.outcome.title}. ${r.outcome.detail}`);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setResult(null);
        setAnnounce(`The simulation stopped: ${e instanceof Error ? e.message : String(e)}`);
      })
      .finally(() => alive && setBusy(false));
    return () => {
      alive = false;
    };
  }, [opt.version, opt.scheme, opt.flow, opt.failure, opt.cap, amount, metered, signer, runId]);

  const set = <K extends keyof Options>(k: K, v: Options[K]) => setOpt((o) => ({ ...o, [k]: v }));
  const setVersion = (v: Version) =>
    setOpt((o) => (v === 1 ? { ...o, version: 1, scheme: 'exact', flow: 'authorization' } : { ...o, version: 2 }));

  const resolution = resolveFlow(opt.version, opt.scheme, opt.flow);
  const label = illustrativeLabel(opt.version);

  return (
    <div className="x4">
      <p className="x4-meta">
        <span>
          Ephemeral payer <code>{account.address}</code>
        </span>
        <span>
          Network <code>{networkFor(opt.version)}</code> (fake chain)
        </span>
        <span>
          Token <code>{FIXTURE_TOKEN.symbol}</code> fixture, {FIXTURE_TOKEN.decimals} decimals
        </span>
      </p>

      <form className="x4-controls" onSubmit={(e) => e.preventDefault()} aria-label="Simulation settings">
        <Radios
          legend="Protocol version"
          name="version"
          value={String(opt.version)}
          options={[
            { value: '2', label: 'V2', hint: 'PAYMENT-REQUIRED, PAYMENT-SIGNATURE, PAYMENT-RESPONSE' },
            { value: '1', label: 'V1', hint: 'JSON body, X-PAYMENT, X-PAYMENT-RESPONSE' },
          ]}
          onChange={(v) => setVersion(v === '1' ? 1 : 2)}
        />
        <Radios
          legend="Scheme"
          name="scheme"
          value={opt.scheme}
          options={[
            { value: 'exact', label: 'exact', hint: 'EIP-3009 transfer of one fixed amount' },
            { value: 'upto', label: 'upto', hint: 'Permit2 maximum, metered charge', disabled: opt.version === 1 },
          ]}
          onChange={(v) => set('scheme', v as Scheme)}
        />
        <Radios
          legend="Payment flow"
          name="flow"
          value={opt.flow}
          options={[
            { value: 'authorization', label: 'authorization', hint: 'verify, resource, settle' },
            { value: 'upfront', label: 'upfront', hint: 'settle, resource', disabled: opt.version === 1 },
            { value: 'escrow', label: 'escrow', hint: 'settle, resource, settle', disabled: opt.version === 1 },
          ]}
          onChange={(v) => set('flow', v as PaymentFlow)}
        />
        <Radios
          legend="Failure injection"
          name="failure"
          value={opt.failure}
          options={FAILURES.map((f) => ({ value: f.id, label: f.label, hint: f.hint }))}
          onChange={(v) => set('failure', v as FailureId)}
        />
        {opt.version === 1 && <p className="x4-hint">V1 defines only the exact scheme and has no paymentFlow key.</p>}
        <div className="x4-amounts">
          <TextField
            label={opt.scheme === 'upto' ? 'Maximum price (USD)' : 'Price (USD)'}
            value={opt.price}
            onChange={(v) => set('price', v)}
            note={amount !== null ? `${amount} atomic units` : undefined}
          />
          {opt.scheme === 'upto' && (
            <TextField
              label="Metered charge (USD)"
              value={opt.metered}
              onChange={(v) => set('metered', v)}
              note={metered !== null ? `${metered} atomic units` : undefined}
            />
          )}
          <SelectField
            label="Spend cap (spendControls.maxAmountPerPayment)"
            value={opt.cap}
            onChange={(v) => set('cap', v as CapChoice)}
            options={[
              { value: '$1', label: `${DEFAULT_MAX_AMOUNT_PER_PAYMENT} (SDK default)` },
              { value: '$0.10', label: '$0.10' },
              { value: '$5', label: '$5' },
              { value: 'off', label: 'false (no cap)' },
            ]}
          />
          <button type="button" className="btn" onClick={() => setRunId((n) => n + 1)} disabled={busy || inputError !== null}>
            Sign again with a new nonce
          </button>
        </div>
        {inputError && (
          <p className="x4-error" role="alert">
            {inputError}
          </p>
        )}
      </form>

      <div className={`x4-outcome x4-outcome--${result?.outcome.kind ?? 'none'}`} role="status" aria-live="polite" aria-atomic="true">
        {busy && !result ? 'Running the handshake.' : announce || 'Change a setting to run the handshake.'}
      </div>

      <section className="x4-panel" aria-labelledby="x4-flow-h">
        <h3 id="x4-flow-h">Handshake timeline</h3>
        {resolution.supported ? (
          <>
            <p className="x4-order">
              Order for {opt.flow}: {FLOW_ORDER_TEXT[opt.flow]}.
            </p>
            <ul className="x4-notes">
              {resolution.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
              {resolution.simplifications.map((n) => (
                <li key={n}>
                  <strong>Teaching simplification:</strong> {n}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="x4-unsupported">
            <p>{resolution.reason}</p>
            {resolution.sdkError && (
              <p>
                The TypeScript SDK throws when a route is configured this way: <code>{resolution.sdkError}</code>
              </p>
            )}
          </div>
        )}
        {result && result.steps.length > 0 && (
          <>
            <LaneHeader />
            <ol className="x4-steps" key={`${runId}-${result.steps.length}-${result.outcome.title}`}>
              {result.steps.map((s) => (
                <StepItem key={s.n} step={s} />
              ))}
            </ol>
          </>
        )}
        {result?.balances && result.signing && (
          <p className="x4-balances">
            Payer balance {formatAtomic(result.balances.payerBefore)} to {formatAtomic(result.balances.payerAfter)} {FIXTURE_TOKEN.symbol}; payTo{' '}
            <code>{FIXTURE_PAY_TO}</code> holds {formatAtomic(result.balances.payToAfter)} {FIXTURE_TOKEN.symbol}.
          </p>
        )}
      </section>

      <SpendPanel price={opt.price} amount={amount} cap={opt.cap} onPrice={(p) => set('price', p)} />

      <Eip712Panel signing={result?.signing} label={label} />

      <CodecPanel headers={result?.headers ?? []} />
    </div>
  );
}

function Radios(props: {
  legend: string;
  name: string;
  value: string;
  options: { value: string; label: string; hint?: string; disabled?: boolean }[];
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <fieldset className="x4-radios">
      <legend>{props.legend}</legend>
      {props.options.map((o) => (
        <label key={o.value} className={`x4-radio${o.disabled ? ' is-disabled' : ''}`}>
          <input
            type="radio"
            name={`${id}-${props.name}`}
            value={o.value}
            checked={props.value === o.value}
            disabled={o.disabled}
            onChange={() => props.onChange(o.value)}
          />
          <span className="x4-radio__label">{o.label}</span>
          {o.hint && <span className="x4-radio__hint">{o.hint}</span>}
        </label>
      ))}
    </fieldset>
  );
}

function TextField(props: { label: string; value: string; onChange: (v: string) => void; note?: string }) {
  const id = useId();
  return (
    <div className="x4-field">
      <label htmlFor={id}>{props.label}</label>
      <input id={id} type="text" inputMode="decimal" value={props.value} onChange={(e) => props.onChange(e.target.value)} aria-describedby={props.note ? `${id}-n` : undefined} />
      {props.note && (
        <span id={`${id}-n`} className="x4-field__note">
          {props.note}
        </span>
      )}
    </div>
  );
}

function SelectField(props: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const id = useId();
  return (
    <div className="x4-field">
      <label htmlFor={id}>{props.label}</label>
      <select id={id} value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function LaneHeader() {
  return (
    <div className="x4-lanes x4-lanes--head" aria-hidden="true">
      {ACTORS.map((a) => (
        <span key={a}>{ACTOR_LABEL[a]}</span>
      ))}
    </div>
  );
}

function Lanes({ from, to }: { from: Actor; to: Actor }) {
  const a = ACTORS.indexOf(from);
  const b = ACTORS.indexOf(to);
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return (
    <div className="x4-lanes" aria-hidden="true">
      {ACTORS.map((actor, i) => {
        let mark = '';
        if (a === b && i === a) mark = 'self';
        else if (i === a) mark = 'from';
        else if (i === b) mark = b > a ? 'to-right' : 'to-left';
        else if (i > lo && i < hi) mark = 'pass';
        return <span key={actor} className={`x4-lane x4-lane--${mark || 'none'}`} />;
      })}
    </div>
  );
}

function StepItem({ step }: { step: Step }) {
  const hasMore = Boolean(step.wire || step.checks?.length || step.code);
  return (
    <li className={`x4-step x4-step--${step.status}`}>
      <Lanes from={step.from} to={step.to} />
      <div className="x4-step__body">
        <p className="x4-step__title">
          <span className="x4-step__n">{step.n}.</span> <span className={`x4-tag x4-tag--${step.status}`}>{STATUS_TEXT[step.status]}</span>{' '}
          <strong>{step.title}</strong>
        </p>
        <p className="x4-step__route">
          {ACTOR_LABEL[step.from]}
          {step.from === step.to ? ' (local step)' : ` to ${ACTOR_LABEL[step.to]}`}
        </p>
        <p className="x4-step__detail">{step.detail}</p>
        {step.simplification && <p className="x4-simpl">{step.simplification}</p>}
        {step.code && <CodeNote code={step.code} />}
        {hasMore && (
          <details className="x4-more" open={step.status === 'fail'}>
            <summary>{step.wire ? 'Message and checks' : 'Checks'}</summary>
            {step.checks && step.checks.length > 0 && <CheckList checks={step.checks} />}
            {step.wire && <WireView wire={step.wire} />}
          </details>
        )}
      </div>
    </li>
  );
}

function CodeNote({ code }: { code: ErrorCode }) {
  const wire = reasonOf(code);
  return (
    <div className="x4-code">
      <p>
        Error string on the wire: <code>{wire}</code>
      </p>
      {code.spec ? (
        <p>
          Spec error list: <code>{code.spec}</code>
          {code.sdk !== code.spec && (
            <>
              . The TypeScript SDK returns <code>{code.sdk}</code> for the same case.
            </>
          )}
        </p>
      ) : (
        <p>The spec error list has no code for this case; this is the TypeScript SDK constant.</p>
      )}
    </div>
  );
}

function CheckList({ checks }: { checks: Check[] }) {
  return (
    <ul className="x4-checks" aria-label="Facilitator checks in order">
      {checks.map((c, i) => (
        <li key={`${c.label}-${i}`} className={c.ok ? 'is-ok' : 'is-fail'}>
          <span className="x4-checks__mark">{c.ok ? 'Pass' : 'Fail'}</span> {c.label}: {c.detail}
        </li>
      ))}
    </ul>
  );
}

function WireView({ wire }: { wire: Wire }) {
  const [decoded, setDecoded] = useState(false);
  const h = wire.header;
  return (
    <figure className="x4-wire">
      <figcaption>
        {wire.caption}
        {h && (
          <button type="button" className="btn btn--ghost x4-wire__toggle" aria-pressed={decoded} onClick={() => setDecoded((d) => !d)}>
            {decoded ? 'Show the raw message' : `Decode ${h.name}`}
          </button>
        )}
      </figcaption>
      <pre className="x4-pre">{decoded && h ? `${h.name} decoded from base64:\n${toJson(h.decoded, 2)}` : wire.text}</pre>
    </figure>
  );
}

function SpendPanel({ price, amount, cap, onPrice }: { price: string; amount: string | null; cap: CapChoice; onPrice: (p: string) => void }) {
  const check = amount === null ? null : checkSpendControls(amount, capValue(cap));
  return (
    <section className="x4-panel" aria-labelledby="x4-spend-h">
      <h3 id="x4-spend-h">Spend cap demo</h3>
      <p>
        The TypeScript SDK client applies <code>spendControls</code> before it signs. By default it allows only assets it recognizes and caps each
        payment at <code>{DEFAULT_MAX_AMOUNT_PER_PAYMENT}</code> (<code>DEFAULT_MAX_AMOUNT_PER_PAYMENT</code> in <code>x402Client.ts</code>). Setting
        the cap to <code>false</code> removes it.
      </p>
      <p className="x4-simpl">Teaching simplification: the fixture token counts as a recognized default asset, so the USD cap applies to it.</p>
      <p>
        Price {price} USD is {amount ?? 'not a valid amount'}
        {amount !== null && ' atomic units'}.{' '}
        {check &&
          (check.allowed ? (
            <span className="x4-tag x4-tag--ok">Allowed</span>
          ) : (
            <span className="x4-tag x4-tag--fail">Rejected</span>
          ))}{' '}
        {check && (check.allowed ? check.note : `Cap ${check.capAtomic} atomic units.`)}
      </p>
      {check && !check.allowed && <pre className="x4-pre">{check.error}</pre>}
      <div className="x4-row">
        <button type="button" className="btn" onClick={() => onPrice('2.50')}>
          Try a price of $2.50
        </button>
        <button type="button" className="btn" onClick={() => onPrice('0.01')}>
          Back to $0.01
        </button>
      </div>
    </section>
  );
}

function Eip712Panel({ signing, label }: { signing?: Signing; label: string }) {
  const [tamper, setTamper] = useState<{ sig: string; recovered: string } | null>(null);
  const [pending, setPending] = useState(false);
  const shownTamper = tamper && signing && tamper.sig === signing.signature ? tamper : null;

  const runTamper = () => {
    if (!signing) return;
    setPending(true);
    recoverSigner(tamperAmount(signing.typedData), signing.signature)
      .then((recovered) => setTamper({ sig: signing.signature, recovered }))
      .finally(() => setPending(false));
  };

  return (
    <section className="x4-panel" aria-labelledby="x4-712-h">
      <h3 id="x4-712-h">EIP-712 typed data and recovery</h3>
      {!signing ? (
        <p>No signature in this run. Choose a supported scheme and flow, and keep the price under the spend cap.</p>
      ) : (
        <>
          <p>
            The client signs <code>{signing.typedData.primaryType}</code> with a key generated when this playground loaded, on chain id{' '}
            <code>{signing.typedData.domain.chainId}</code> ({SIM_NETWORK_V2}). The facilitator runs ecrecover over the same digest and compares the
            result with the payer address.
          </p>
          <figure className="x4-wire">
            <figcaption>{label}. Key and signature are ephemeral.</figcaption>
            <pre className="x4-pre">{toJson(signing.display, 2)}</pre>
          </figure>
          <dl className="x4-dl">
            <dt>EIP-712 digest</dt>
            <dd>
              <code>{signing.digest}</code>
            </dd>
            <dt>Signature (65 bytes)</dt>
            <dd>
              <code>{signing.signature}</code>
            </dd>
            <dt>Signer</dt>
            <dd>
              <code>{signing.signer}</code>
            </dd>
            <dt>Recovered</dt>
            <dd>
              <code>{signing.recovered}</code>{' '}
              <span className={`x4-tag x4-tag--${signing.matches ? 'ok' : 'fail'}`}>{signing.matches ? 'Match' : 'No match'}</span>
            </dd>
          </dl>
          <div className="x4-row">
            <button type="button" className="btn" onClick={runTamper} disabled={pending}>
              Recover after adding 1 to the amount
            </button>
          </div>
          {shownTamper && (
            <p aria-live="polite">
              With the amount changed by one unit the same signature recovers <code>{shownTamper.recovered}</code>{' '}
              <span className={`x4-tag x4-tag--${sameAddress(shownTamper.recovered, signing.signer) ? 'ok' : 'fail'}`}>
                {sameAddress(shownTamper.recovered, signing.signer) ? 'Match' : 'No match'}
              </span>
              . The facilitator would report an invalid signature, so nobody can edit a signed payment.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function CodecPanel({ headers }: { headers: { name: string; value: string }[] }) {
  const inputId = useId();
  const loadId = useId();
  const [text, setText] = useState('');
  const [out, setOut] = useState<{ ok: boolean; text: string } | null>(null);

  const decode = () => {
    const r = decodeHeader(text);
    setOut(r.ok ? { ok: true, text: r.json } : { ok: false, text: r.error });
  };
  const encode = () => {
    const r = encodeJsonText(text);
    setOut(r.ok ? { ok: true, text: r.value } : { ok: false, text: r.error });
  };

  return (
    <section className="x4-panel" aria-labelledby="x4-codec-h">
      <h3 id="x4-codec-h">Base64 header encoder and decoder</h3>
      <p>
        x402 headers carry JSON encoded as standard base64 (UTF-8 bytes, with padding). Paste a header value to decode it, or paste JSON to encode
        it.
      </p>
      {headers.length > 0 && (
        <div className="x4-field">
          <label htmlFor={loadId}>Load a header from this run</label>
          <select
            id={loadId}
            value=""
            onChange={(e) => {
              const h = headers[Number(e.target.value)];
              if (h) {
                setText(h.value);
                setOut(null);
              }
            }}
          >
            <option value="">Choose a header</option>
            {headers.map((h, i) => (
              <option key={`${h.name}-${i}`} value={i}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="x4-field">
        <label htmlFor={inputId}>Header value or JSON</label>
        <textarea id={inputId} rows={5} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      </div>
      <div className="x4-row">
        <button type="button" className="btn" onClick={decode} disabled={text.trim() === ''}>
          Decode base64 to JSON
        </button>
        <button type="button" className="btn" onClick={encode} disabled={text.trim() === ''}>
          Encode JSON to base64
        </button>
      </div>
      <div aria-live="polite">
        {out && (out.ok ? <pre className="x4-pre">{out.text}</pre> : <p className="x4-error">{out.text}</p>)}
      </div>
    </section>
  );
}
