/**
 * Visa TAP playground: an RFC 9421 signature builder and verifier with an ephemeral WebCrypto key (Ed25519, or
 * ECDSA P-256 when the browser lacks Ed25519), a CDN decision-tree walkthrough, the time-window and nonce-replay
 * checks, tampering, viewers for the agenticConsumer and agenticPaymentContainer objects, and a TAP versus Web Bot
 * Auth comparison. Everything runs in this browser; nothing is stored and nothing is sent to a network.
 * PlaygroundFrame wraps this component.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { generateAgentKey, jwkThumbprint, randomNonce, supportsEd25519, tapAlgLabel, type AgentKey } from './lib/keys';
import {
  parseSignatureHeader,
  parseSignatureInput,
  renderHttp,
  rewriteParam,
  signRequest,
  type ComponentId,
  type HttpRequest,
  type SigParams,
  type SignedOutput,
} from './lib/signature';
import { rememberNonce, verifyRequest, type KeyDirectory, type NonceStore, type Step, type VerifyResult } from './lib/verifier';
import {
  AGENT_DIRECTORY_ORIGIN,
  COMPARISON,
  COMPONENT_CHOICES,
  CONSUMER_FIELDS,
  ID_TOKEN_FIELDS,
  ILLUSTRATIVE_LABEL,
  PAYMENT_FIELDS,
  SPEC_QUIRKS,
  TAMPERS,
  TAP_KEYID,
  TAP_LABEL,
  WBA_DIRECTORY_MEDIA_TYPE,
  WBA_DIRECTORY_PATH,
  WBA_LABEL,
  WBA_SIG_LABEL,
  WINDOW_CHOICES,
  requestFor,
  type FieldDoc,
  type TamperId,
  type TapTag,
  type WindowChoice,
} from './lib/fixtures';
import {
  browsingIou,
  checkObject,
  consumerObject,
  decodeJwtPart,
  paymentContainer,
  signObject,
  withValue,
  type JsonObject,
  type ObjectVerdict,
  type PaymentVariant,
} from './lib/objects';
import './visa-tap.css';

type Tab = 'sign' | 'objects' | 'compare';
type ClockSkip = 0 | 300 | 540 | -60;
type ObjectTamper = 'none' | 'zip' | 'nonce' | 'drop-kid';

const CLOCK_CHOICES: Array<{ value: ClockSkip; label: string }> = [
  { value: 0, label: 'Right away' },
  { value: 300, label: '5 minutes later' },
  { value: 540, label: '9 minutes later' },
  { value: -60, label: '1 minute before created (clock skew)' },
];

const OBJECT_TAMPERS: Array<{ value: ObjectTamper; label: string }> = [
  { value: 'none', label: 'Send as signed' },
  { value: 'zip', label: 'Change contextualData.zip after signing' },
  { value: 'nonce', label: 'Use a nonce that differs from the message signature' },
  { value: 'drop-kid', label: 'Drop kid from the payment container' },
];

const STATUS_WORD: Record<Step['status'], string> = { pass: 'Pass', fail: 'Blocked', skip: 'Not reached', note: 'Note' };

const nowSec = () => Math.floor(Date.now() / 1000);

interface Signed extends SignedOutput {
  req: HttpRequest;
  nonce: string;
  created: number;
}

function Note({ kind, children }: { kind: 'quirk' | 'simpl' | 'example'; children: ReactNode }) {
  const tag = kind === 'quirk' ? 'Spec quirk' : kind === 'simpl' ? 'Teaching simplification' : 'Example';
  return (
    <p className={`vt-note${kind === 'quirk' ? ' vt-note--quirk' : kind === 'simpl' ? ' vt-note--simpl' : ''}`}>
      <span className="vt-tag">{tag}</span>
      {children}
    </p>
  );
}

function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="vt-steps">
      {steps.map((s) => (
        <li key={s.id}>
          <span className={`vt-s vt-s--${s.status}`}>
            {STATUS_WORD[s.status]}: {s.title}
          </span>{' '}
          <span className="vt-src">({s.source})</span>
          {s.status !== 'skip' && <div>{s.detail}</div>}
        </li>
      ))}
    </ol>
  );
}

function FieldTable({ caption, rows }: { caption: string; rows: FieldDoc[] }) {
  return (
    <table className="vt-table">
      <caption className="vt-src" style={{ textAlign: 'left' }}>
        {caption}
      </caption>
      <thead>
        <tr>
          <th scope="col">Field</th>
          <th scope="col">Required</th>
          <th scope="col">Meaning</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.field}>
            <td>
              <code>{r.field}</code>
            </td>
            <td>{r.required}</td>
            <td>{r.meaning}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Verdict({ v }: { v: ObjectVerdict | null }) {
  if (!v) return null;
  return (
    <>
      <ul className="vt-steps">
        {v.checks.map((c) => (
          <li key={c.label}>
            <span className={`vt-s vt-s--${c.ok ? 'pass' : 'fail'}`}>
              {c.ok ? 'Pass' : 'Fail'}: {c.label}
            </span>{' '}
            {c.detail}
          </li>
        ))}
      </ul>
      <p>
        <strong>{v.consequence}</strong>
      </p>
    </>
  );
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ');
}

/** Apply a tamper to the request as it leaves the agent. */
function tamperRequest(s: Signed, t: TamperId): { req: HttpRequest; signatureInput: string; signature?: string } {
  const out = { req: { ...s.req, headers: { ...s.req.headers } }, signatureInput: s.signatureInput, signature: s.signature as string | undefined };
  switch (t) {
    case 'path':
      out.req.path = '/admin/refunds';
      break;
    case 'authority':
      out.req.authority = 'other-shop.example';
      break;
    case 'query':
      out.req.query = out.req.query ? `${out.req.query}&size=xl` : 'size=xl';
      break;
    case 'user-agent':
      out.req.headers['user-agent'] = 'SomethingElse/2.0';
      break;
    case 'tag': {
      const tag = parseSignatureInput(s.signatureInput)[0]?.params.find(([k]) => k === 'tag')?.[1];
      out.signatureInput = rewriteParam(s.signatureInput, TAP_LABEL, 'tag', tag === 'agent-payer-auth' ? 'agent-browser-auth' : 'agent-payer-auth');
      break;
    }
    case 'keyid':
      out.signatureInput = rewriteParam(s.signatureInput, TAP_LABEL, 'keyid', 'unknown-key-9');
      break;
    case 'signature': {
      const bytes = new Uint8Array(s.sigBytes);
      bytes[0] = (bytes[0] ?? 0) ^ 1;
      out.signature = `${TAP_LABEL}=:${btoa(String.fromCharCode(...bytes))}:`;
      break;
    }
    case 'drop-signature':
      out.signature = undefined;
      break;
  }
  return out;
}

export default function Playground() {
  const [key, setKey] = useState<AgentKey | null>(null);
  const [fallback, setFallback] = useState(false);
  const [thumb, setThumb] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('sign');
  const [announce, setAnnounce] = useState('');

  // Builder settings.
  const [tag, setTag] = useState<TapTag>('agent-browser-auth');
  const [covered, setCovered] = useState<string[]>(['@authority', '@path']);
  const [windowSec, setWindowSec] = useState<WindowChoice>(480);
  const [signed, setSigned] = useState<Signed | null>(null);
  const [signError, setSignError] = useState<string | null>(null);
  const [showParams, setShowParams] = useState(false);

  // Verifier settings.
  const [tamper, setTamper] = useState<TamperId>('none');
  const [skip, setSkip] = useState<ClockSkip>(0);
  const [seen, setSeen] = useState<NonceStore>(new Map());
  const [result, setResult] = useState<VerifyResult | null>(null);

  // Ephemeral key generated at mount; Reset in the frame remounts and replaces it.
  useEffect(() => {
    let alive = true;
    (async () => {
      const ed = await supportsEd25519();
      const k = await generateAgentKey(ed ? 'ed25519' : 'ecdsa-p256-sha256');
      const t = await jwkThumbprint(k.publicJwk);
      if (!alive) return;
      setFallback(!ed);
      setKey(k);
      setThumb(t);
    })().catch((e: unknown) => alive && setKeyError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, []);

  const directory = useMemo<KeyDirectory>(() => {
    const m: KeyDirectory = new Map();
    if (key) {
      m.set(TAP_KEYID, { alg: key.alg, key: key.publicKey });
      if (thumb) m.set(thumb, { alg: key.alg, key: key.publicKey });
    }
    return m;
  }, [key, thumb]);

  const sign = useCallback(async () => {
    if (!key) return;
    const req = requestFor(tag);
    const created = nowSec();
    const nonce = randomNonce();
    const components: ComponentId[] = COMPONENT_CHOICES.filter((c) => covered.includes(c.label)).map((c) => c.id);
    const params: SigParams = [
      ['created', created],
      ['keyid', TAP_KEYID],
      ['alg', tapAlgLabel(key.alg)],
      ['expires', created + windowSec],
      ['nonce', nonce],
      ['tag', tag],
    ];
    try {
      const out = await signRequest(req, { label: TAP_LABEL, components, params, alg: key.alg, privateKey: key.privateKey });
      setSigned({ ...out, req, nonce, created });
      setSignError(null);
      setResult(null);
      setAnnounce(`Signed a new ${req.method} ${req.path} request with tag ${tag} and a fresh nonce.`);
    } catch (e) {
      setSignError(e instanceof Error ? e.message : String(e));
    }
  }, [key, tag, covered, windowSec]);

  useEffect(() => {
    void sign();
  }, [sign]);

  const sent = useMemo(() => (signed ? tamperRequest(signed, tamper) : null), [signed, tamper]);

  const send = async () => {
    if (!signed || !sent) return;
    const now = signed.created + skip;
    const r = await verifyRequest({ req: sent.req, signatureInput: sent.signatureInput, signature: sent.signature }, { now, directory, seen, profile: 'tap' });
    setResult(r);
    if (r.ok && r.nonce) setSeen((s) => rememberNonce(s, r.nonce!, now));
    setAnnounce(r.outcome);
  };

  const toggle = (label: string) => setCovered((c) => (c.includes(label) ? c.filter((x) => x !== label) : [...c, label]));

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'sign', label: 'Sign and verify' },
    { id: 'objects', label: 'Consumer and payment objects' },
    { id: 'compare', label: 'TAP versus Web Bot Auth' },
  ];

  if (keyError) return <p role="alert">The browser could not create a signing key: {keyError}</p>;

  const jwks = key ? { keys: [{ ...key.publicJwk, kid: TAP_KEYID, use: 'sig' }] } : null;

  return (
    <div className="vt">
      <p className="vt-src">
        Ephemeral agent key: {key ? <code>{key.alg}</code> : 'generating'}, created in this browser at mount and never stored. Key directory: a local
        fixture, never Visa&apos;s.
      </p>
      {fallback && (
        <p className="vt-note vt-note--quirk" role="note">
          <span className="vt-tag">Fallback</span>This browser has no WebCrypto Ed25519, so the playground signs with ECDSA P-256 (
          <code>ecdsa-p256-sha256</code>). TAP&apos;s examples use Ed25519; the signature base and checks are the same.
        </p>
      )}

      <p className="vt-live" role="status" aria-live="polite">
        {announce || 'Ready.'}
      </p>

      <div role="tablist" aria-label="Visa TAP playground parts" className="vt-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`vt-tab-${t.id}`}
            aria-controls={`vt-panel-${t.id}`}
            aria-selected={tab === t.id}
            tabIndex={tab === t.id ? 0 : -1}
            className="vt-tab"
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              const i = tabs.findIndex((x) => x.id === tab);
              const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]!;
              setTab(next.id);
              document.getElementById(`vt-tab-${next.id}`)?.focus();
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sign' && (
        <section id="vt-panel-sign" role="tabpanel" aria-labelledby="vt-tab-sign" className="vt">
          <div className="vt-grid">
            <div className="vt-card">
              <h3>1. Build the signature</h3>
              <form className="vt" onSubmit={(e) => e.preventDefault()} aria-label="Signature settings">
                <fieldset>
                  <legend>Tag</legend>
                  {(['agent-browser-auth', 'agent-payer-auth'] as const).map((t) => (
                    <label key={t}>
                      <input type="radio" name="vt-tag" checked={tag === t} onChange={() => setTag(t)} />
                      <code>{t}</code>
                      {t === 'agent-browser-auth' ? ' (GET product page)' : ' (POST checkout)'}
                    </label>
                  ))}
                </fieldset>
                <fieldset>
                  <legend>Covered components</legend>
                  {COMPONENT_CHOICES.map((c) => (
                    <label key={c.label} title={c.hint}>
                      <input type="checkbox" checked={covered.includes(c.label)} onChange={() => toggle(c.label)} />
                      <code>{c.label}</code>
                      {c.required ? ' (TAP minimum)' : ''}
                    </label>
                  ))}
                </fieldset>
                <label>
                  Window (expires minus created)
                  <select value={windowSec} onChange={(e) => setWindowSec(Number(e.target.value) as WindowChoice)}>
                    {WINDOW_CHOICES.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className="btn" onClick={() => void sign()} disabled={!key}>
                  Sign again with a fresh nonce
                </button>
              </form>
              {signError && <p role="alert">Cannot sign: {signError}</p>}
            </div>

            <div className="vt-card">
              <h3>2. Signature base and headers</h3>
              <Note kind="example">{ILLUSTRATIVE_LABEL}. Values are generated now; they are not the spec&apos;s example values.</Note>
              {signed ? (
                <>
                  <h4>Signature base (the exact bytes signed)</h4>
                  <pre className="vt-pre" aria-label="Signature base">
                    {signed.base}
                  </pre>
                  <h4>Headers</h4>
                  <pre className="vt-pre" aria-label="Signature headers">
                    {`Signature-Input: ${signed.signatureInput}\nSignature: ${signed.signature}`}
                  </pre>
                  <label>
                    <input type="checkbox" checked={showParams} onChange={(e) => setShowParams(e.target.checked)} />
                    Decode the headers
                  </label>
                  {showParams && <Decoded signed={signed} />}
                </>
              ) : (
                <p>Generating a key and signing.</p>
              )}
            </div>
          </div>

          <div className="vt-grid">
            <div className="vt-card">
              <h3>3. Send it to the CDN verifier</h3>
              <form className="vt" onSubmit={(e) => e.preventDefault()} aria-label="Verifier settings">
                <label>
                  In transit
                  <select value={tamper} onChange={(e) => setTamper(e.target.value as TamperId)}>
                    {TAMPERS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Verifier clock
                  <select value={skip} onChange={(e) => setSkip(Number(e.target.value) as ClockSkip)}>
                    {CLOCK_CHOICES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="vt-row">
                  <button type="button" className="btn" onClick={() => void send()} disabled={!sent}>
                    Send request
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setSeen(new Map());
                      setAnnounce('Cleared the nonce seen-set.');
                    }}
                  >
                    Clear seen-set ({seen.size})
                  </button>
                </div>
                <p className="vt-src">Send the same signed request twice to see the replay check block it.</p>
              </form>
              {sent && (
                <>
                  <h4>Request as received</h4>
                  <pre className="vt-pre" aria-label="Request as received">
                    {renderHttp(sent.req, [['Signature-Input', sent.signatureInput], ...(sent.signature ? ([['Signature', sent.signature]] as Array<[string, string]>) : [])])}
                  </pre>
                </>
              )}
              <h4>Local fixture key directory (JWKS)</h4>
              <pre className="vt-pre" aria-label="Fixture JWKS">
                {jwks ? JSON.stringify(jwks, null, 2) : 'Generating.'}
              </pre>
              <Note kind="simpl">A real verifier fetches and caches keys from the agent&apos;s published directory; here the directory is an in-memory fixture.</Note>
            </div>

            <div className="vt-card">
              <h3>4. Decision tree</h3>
              <p className="vt-src">Cloudflare&apos;s published steps for TAP, with the Visa spec&apos;s minimum-field check added. The tree stops at the first block.</p>
              {result ? (
                <>
                  <p>
                    <strong className={`vt-s vt-s--${result.ok ? 'pass' : 'fail'}`}>{result.outcome}</strong>
                  </p>
                  <Steps steps={result.steps} />
                  {result.base && result.base !== signed?.base && (
                    <>
                      <h4>Base the verifier rebuilt (differs from what was signed)</h4>
                      <pre className="vt-pre">{result.base}</pre>
                    </>
                  )}
                </>
              ) : (
                <p>Press Send request to run the checks.</p>
              )}
            </div>
          </div>

          <Quirks />
        </section>
      )}

      {tab === 'objects' && (
        <section id="vt-panel-objects" role="tabpanel" aria-labelledby="vt-tab-objects" className="vt">
          {key && signed ? <Objects agentKey={key} signed={signed} directory={directory} onAnnounce={setAnnounce} /> : <p>Generating a key.</p>}
        </section>
      )}

      {tab === 'compare' && (
        <section id="vt-panel-compare" role="tabpanel" aria-labelledby="vt-tab-compare" className="vt">
          {key && thumb ? <Compare agentKey={key} thumb={thumb} directory={directory} onAnnounce={setAnnounce} /> : <p>Generating a key.</p>}
        </section>
      )}
    </div>
  );
}

function Decoded({ signed }: { signed: Signed }) {
  const p = parseSignatureInput(signed.signatureInput)[0];
  const bytes = parseSignatureHeader(signed.signature).get(TAP_LABEL);
  if (!p) return null;
  return (
    <table className="vt-table">
      <tbody>
        <tr>
          <th scope="row">Label</th>
          <td>
            <code>{p.label}</code>
          </td>
        </tr>
        <tr>
          <th scope="row">Covered</th>
          <td>
            <code>{p.components.map((c) => c.name).join(', ') || '(none)'}</code>
          </td>
        </tr>
        {p.params.map(([k, v]) => (
          <tr key={k}>
            <th scope="row">
              <code>{k}</code>
            </th>
            <td>
              <code>{String(v)}</code>
              {k === 'created' || k === 'expires' ? ` (${new Date(Number(v) * 1000).toISOString()})` : ''}
            </td>
          </tr>
        ))}
        {bytes && (
          <tr>
            <th scope="row">Signature bytes</th>
            <td>
              <code>
                {bytes.length} bytes: {hex(bytes)}
              </code>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function Quirks() {
  return (
    <div className="vt-card">
      <h3>Spec quirks</h3>
      {SPEC_QUIRKS.map((q) => (
        <Note key={q} kind="quirk">
          {q}
        </Note>
      ))}
    </div>
  );
}

function Objects({ agentKey, signed, directory, onAnnounce }: { agentKey: AgentKey; signed: Signed; directory: KeyDirectory; onAnnounce: (s: string) => void }) {
  const [variant, setVariant] = useState<PaymentVariant>('payload');
  const [tamper, setTamper] = useState<ObjectTamper>('none');
  const [showToken, setShowToken] = useState(false);
  const [state, setState] = useState<{ consumer: JsonObject; payment: JsonObject; cv: ObjectVerdict; pv: ObjectVerdict } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const parts = { nonce: tamper === 'nonce' ? randomNonce() : signed.nonce, kid: TAP_KEYID, alg: tapAlgLabel(agentKey.alg) };
      const alg = agentKey.alg;
      let consumer = await signObject(consumerObject(parts, signed.created), alg, agentKey.privateKey);
      const iou = variant === 'browsingIOU' ? await signObject(browsingIou(parts), alg, agentKey.privateKey) : undefined;
      let payment = await signObject(paymentContainer(parts, variant, iou), alg, agentKey.privateKey);
      if (tamper === 'zip') consumer = withValue(consumer, 'contextualData.zip', '10001');
      if (tamper === 'drop-kid') {
        const { kid: _kid, ...rest } = payment;
        payment = rest;
      }
      const lookup = (kid: string) => directory.get(kid);
      const cv = await checkObject('consumer', consumer, { messageNonce: signed.nonce, lookup });
      const pv = await checkObject('payment', payment, { messageNonce: signed.nonce, lookup });
      if (!alive) return;
      setState({ consumer, payment, cv, pv });
      onAnnounce(`Consumer object ${cv.ok ? 'verified' : 'failed'}; payment container ${pv.ok ? 'verified' : 'failed'}.`);
    })().catch((e: unknown) => alive && onAnnounce(`Could not build the objects: ${e instanceof Error ? e.message : String(e)}`));
    return () => {
      alive = false;
    };
  }, [agentKey, signed, directory, variant, tamper, onAnnounce]);

  const token = typeof state?.consumer.idToken === 'string' ? state.consumer.idToken.split('.') : [];

  return (
    <>
      <Note kind="example">{ILLUSTRATIVE_LABEL}. Fixture values; the nonce and kid come from the request signed on the first tab.</Note>
      <Note kind="simpl">
        The spec signs each object over &quot;all fields in the order received except the signature&quot; but names no canonical form, and its examples use PS256. Here each
        object is signed as compact JSON of those fields with the same ephemeral key as the message signature. The ID Token has a real header and claims encoding but a
        placeholder signature; in production Visa signs it.
      </Note>
      <form className="vt-row" onSubmit={(e) => e.preventDefault()} aria-label="Object settings">
        <label>
          Payment path
          <select value={variant} onChange={(e) => setVariant(e.target.value as PaymentVariant)}>
            <option value="payload">Merchant processes by API (encrypted payload)</option>
            <option value="browsingIOU">After an HTTP 402 (browsingIOU)</option>
          </select>
        </label>
        <label>
          Tamper
          <select value={tamper} onChange={(e) => setTamper(e.target.value as ObjectTamper)}>
            {OBJECT_TAMPERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </form>
      <div className="vt-grid">
        <div className="vt-card">
          <h3>
            <code>agenticConsumer</code>
          </h3>
          <pre className="vt-pre">{state ? JSON.stringify(state.consumer, null, 2) : 'Signing.'}</pre>
          <label>
            <input type="checkbox" checked={showToken} onChange={(e) => setShowToken(e.target.checked)} />
            Decode the ID Token
          </label>
          {showToken && token.length === 3 && (
            <pre className="vt-pre" aria-label="Decoded ID Token">
              {`header: ${JSON.stringify(decodeJwtPart(token[0]!), null, 2)}\nclaims: ${JSON.stringify(decodeJwtPart(token[1]!), null, 2)}\nsignature: ${token[2]!}`}
            </pre>
          )}
          <h4>Merchant checks</h4>
          <Verdict v={state?.cv ?? null} />
          <FieldTable caption="Consumer recognition fields (spec tables, paraphrased)" rows={CONSUMER_FIELDS} />
          {showToken && <FieldTable caption="ID Token fields" rows={ID_TOKEN_FIELDS} />}
        </div>
        <div className="vt-card">
          <h3>
            <code>agenticPaymentContainer</code>
          </h3>
          <pre className="vt-pre">{state ? JSON.stringify(state.payment, null, 2) : 'Signing.'}</pre>
          <h4>Merchant checks</h4>
          <Verdict v={state?.pv ?? null} />
          <FieldTable caption="Payment container fields (spec tables, paraphrased)" rows={PAYMENT_FIELDS} />
        </div>
      </div>
      <Note kind="quirk">
        The message signature covers only the components listed in Signature-Input, not the body, so these objects carry their own signatures and repeat the
        nonce to bind them to the request. The spec does not say how the objects travel on a GET request.
      </Note>
    </>
  );
}

interface CompareSide {
  label: string;
  http: string;
  base: string;
  own: VerifyResult;
  cross: VerifyResult;
}

function Compare({ agentKey, thumb, directory, onAnnounce }: { agentKey: AgentKey; thumb: string; directory: KeyDirectory; onAnnounce: (s: string) => void }) {
  const [sides, setSides] = useState<{ tap: CompareSide; wba: CompareSide } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const now = nowSec();
      const tapReq = requestFor('agent-browser-auth');
      const tapParams: SigParams = [
        ['created', now],
        ['keyid', TAP_KEYID],
        ['alg', tapAlgLabel(agentKey.alg)],
        ['expires', now + 480],
        ['nonce', randomNonce()],
        ['tag', 'agent-browser-auth'],
      ];
      const tap = await signRequest(tapReq, { label: TAP_LABEL, components: [{ name: '@authority' }, { name: '@path' }], params: tapParams, alg: agentKey.alg, privateKey: agentKey.privateKey });
      const wbaReq: HttpRequest = { ...tapReq, headers: { ...tapReq.headers, 'signature-agent': `${WBA_SIG_LABEL}="${AGENT_DIRECTORY_ORIGIN}"` } };
      const wbaParams: SigParams = [
        ['created', now],
        ['expires', now + 300],
        ['keyid', thumb],
        ['tag', 'web-bot-auth'],
      ];
      const wba = await signRequest(wbaReq, {
        label: WBA_SIG_LABEL,
        components: [{ name: '@authority' }, { name: '@path' }, { name: 'signature-agent', key: WBA_SIG_LABEL }],
        params: wbaParams,
        alg: agentKey.alg,
        privateKey: agentKey.privateKey,
      });
      const ctx = { now, directory, seen: new Map<string, number>() };
      const tapIn = { req: tapReq, signatureInput: tap.signatureInput, signature: tap.signature };
      const wbaIn = { req: wbaReq, signatureInput: wba.signatureInput, signature: wba.signature };
      const result = {
        tap: {
          label: ILLUSTRATIVE_LABEL,
          http: renderHttp(tapReq, [['Signature-Input', tap.signatureInput], ['Signature', tap.signature]]),
          base: tap.base,
          own: await verifyRequest(tapIn, { ...ctx, profile: 'tap' }),
          cross: await verifyRequest(tapIn, { ...ctx, profile: 'wba' }),
        },
        wba: {
          label: WBA_LABEL,
          http: renderHttp(wbaReq, [['Signature-Input', wba.signatureInput], ['Signature', wba.signature]]),
          base: wba.base,
          own: await verifyRequest(wbaIn, { ...ctx, profile: 'wba' }),
          cross: await verifyRequest(wbaIn, { ...ctx, profile: 'tap' }),
        },
      };
      if (!alive) return;
      setSides(result);
      onAnnounce('Signed the same GET request both ways with the same key.');
    })().catch((e: unknown) => alive && onAnnounce(`Could not build the comparison: ${e instanceof Error ? e.message : String(e)}`));
    return () => {
      alive = false;
    };
  }, [agentKey, thumb, directory, onAnnounce]);

  if (!sides) return <p>Signing both requests.</p>;
  const col = (title: string, s: CompareSide, crossName: string) => (
    <div className="vt-card">
      <h3>{title}</h3>
      <Note kind="example">{s.label}</Note>
      <pre className="vt-pre">{s.http}</pre>
      <h4>Signature base</h4>
      <pre className="vt-pre">{s.base}</pre>
      <p>
        <span className={`vt-s vt-s--${s.own.ok ? 'pass' : 'fail'}`}>Own verifier: {s.own.outcome}</span>
      </p>
      <p>
        <span className={`vt-s vt-s--${s.cross.ok ? 'pass' : 'fail'}`}>
          {crossName} verifier: {s.cross.outcome}
        </span>
      </p>
    </div>
  );
  return (
    <>
      <div className="vt-grid">
        {col('Visa TAP', sides.tap, 'Web Bot Auth')}
        {col('Web Bot Auth draft', sides.wba, 'TAP')}
      </div>
      <p className="vt-src">
        Web Bot Auth keyid is the JWK thumbprint <code>{thumb}</code>; its keys live at <code>{WBA_DIRECTORY_PATH}</code> on the Signature-Agent host, served as{' '}
        <code>{WBA_DIRECTORY_MEDIA_TYPE}</code>. Neither directory is contacted here.
      </p>
      <table className="vt-table">
        <thead>
          <tr>
            <th scope="col">Aspect</th>
            <th scope="col">Visa TAP</th>
            <th scope="col">Web Bot Auth draft -00</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map((r) => (
            <tr key={r.aspect}>
              <th scope="row">{r.aspect}</th>
              <td>{r.tap}</td>
              <td>{r.wba}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Note kind="simpl">
        Both requests use one ephemeral key so the only differences are in the message shape. The cross-checks show why a TAP verifier blocks a Web Bot Auth
        request (no nonce, no alg) and a Web Bot Auth verifier blocks a TAP request (no Signature-Agent).
      </Note>
    </>
  );
}
