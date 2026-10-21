/**
 * Stripe MPP playground: a challenge and credential builder with HMAC-bound challenge ids, an intent switcher,
 * a Tempo session meter with EIP-712 vouchers, a method switcher and an x402 to MPP header translator.
 * Keys (the server HMAC secret and the payer's secp256k1 key) are generated at mount and held in memory only;
 * nothing is sent to a network. PlaygroundFrame wraps this component.
 */
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { keccak256, toHex, type Hex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { Note } from '@/components/playground/Note';
import { ScrollRegion } from '@/components/playground/ScrollRegion';
import { Tabs } from '@/components/playground/Tabs';
import { Wire as KitWire } from '@/components/playground/Wire';
import { bytesToBase64Url } from '@/lib/playground/bytes';
import { decodeJson, encodeCanonical } from './lib/codec';
import {
  PAYMENT_AUTHORIZATION,
  bindingInput,
  buildCredential,
  expiresIn,
  generateServerKey,
  issueChallenge,
  problem,
  serializeAcceptPayment,
  serializeChallenge,
  serializeCredential,
  serializeReceipt,
  verifyCredential,
  type Challenge,
  type Verdict,
} from './lib/challenge';
import { CORE_SPEC, FIXTURE_HOST, FIXTURE_PATH, FIXTURE_REALM, FIXTURE_RECIPIENT, FIXTURE_TOKEN, GRACE_PERIOD_SECONDS, ILLUSTRATIVE, RECOMMENDED_WAIT_SECONDS, SESSION_SPEC, formatUnits, parseUnits, type Intent } from './lib/fixtures';
import { buildRequest, buildSimplePayload, didPkh, PAYLOAD_NOTE } from './lib/intents';
import { INTENTS, INTENT_SPEC, METHODS, methodsFor } from './lib/methods';
import {
  acceptVoucher,
  advanceClock,
  consume,
  cooperativeClose,
  exposure,
  graceRemaining,
  initialChannel,
  openChannel,
  requestClose,
  sessionReceipt,
  settle,
  signVoucher,
  simulatedChannelId,
  topUp,
  voucherPayload,
  voucherTypedData,
  withdraw,
  type ChannelState,
  type SignedVoucher,
  type StepResult,
  type VoucherSigner,
} from './lib/session';
import { sampleX402, translatePaymentRequired, translatePaymentResponse, translatePaymentSignature, type Translation } from './lib/translate';
import './stripe-mpp.css';

/** Lets a scrollable <pre> take keyboard focus (axe: scrollable-region-focusable). */
const SCROLL_TAB = 0;

type Tab = 'builder' | 'session' | 'methods' | 'translator';
const TABS: [Tab, string][] = [
  ['builder', 'Challenge and credential'],
  ['session', 'Session meter'],
  ['methods', 'Methods'],
  ['translator', 'x402 to MPP'],
];

type Failure = 'none' | 'tamper' | 'replay' | 'expired' | 'wrong-field' | 'malformed' | 'proof' | 'policy';
const FAILURES: [Failure, string][] = [
  ['none', 'None (happy path)'],
  ['tamper', 'Change the amount in the echoed request'],
  ['replay', 'Replay: send the same credential twice'],
  ['expired', 'Send after the challenge expires'],
  ['wrong-field', 'Send in the wrong header field'],
  ['malformed', 'Malformed credential (bad base64url)'],
  ['proof', 'Payment proof does not verify'],
  ['policy', 'Paid, but policy denies access'],
];

const INTENT_LABEL: Record<Intent, string> = {
  charge: 'charge',
  subscription: 'subscription',
  session: 'session (Tempo method, not a standardized intent)',
};

function randomHex(bytes: number): Hex {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** A wire-format block labeled as illustrative; the decoded JSON, when given, opens under it. */
function Wire({ label, value, decoded }: { label: string; value: string; decoded?: string }) {
  return (
    <KitWire
      titleAs="p"
      title={
        <>
          <strong>{label}</strong> <span className="mp-tag">{ILLUSTRATIVE}</span>
        </>
      }
      label={label}
      text={value}
      decoded={decoded}
      stacked
      encodedLabel="Hide decoded JSON"
    />
  );
}

function verdictText(v: Verdict, fresh?: Challenge): string {
  if (v.status === 200) {
    return `HTTP/1.1 200 OK\nCache-Control: private\nPayment-Receipt: ${serializeReceipt(v.receipt)}`;
  }
  if (v.status === 403) {
    return `HTTP/1.1 403 Forbidden\nContent-Type: application/problem+json\n\n(no Payment challenge: the payment was valid)\n${v.detail}`;
  }
  const lines = [`HTTP/1.1 ${v.status} ${v.status === 402 ? 'Payment Required' : 'Error'}`, 'Cache-Control: no-store'];
  if (v.freshChallenge && fresh) lines.push(`WWW-Authenticate: ${serializeChallenge(fresh)}`);
  lines.push('Content-Type: application/problem+json', '', JSON.stringify(v.problem, null, 2));
  return lines.join('\n');
}

export default function Playground() {
  const uid = useId();
  const [account] = useState(() => privateKeyToAccount(generatePrivateKey()));
  const signer = useMemo<VoucherSigner>(() => ({ address: account.address, signTypedData: (td) => account.signTypedData(td) }), [account]);
  const [serverKey, setServerKey] = useState<CryptoKey | null>(null);
  const used = useRef(new Set<string>());
  const [tab, setTab] = useState<Tab>('builder');
  const [announce, setAnnounce] = useState('');

  useEffect(() => {
    let alive = true;
    void generateServerKey().then((k) => alive && setServerKey(k));
    return () => {
      alive = false;
    };
  }, []);

  const panel = (id: Tab): ReactNode => {
    if (!serverKey) return <p>Generating the server key.</p>;
    switch (id) {
      case 'builder':
        return <Builder uid={uid} serverKey={serverKey} used={used.current} payer={account.address} signer={signer} onAnnounce={setAnnounce} />;
      case 'session':
        return <SessionMeter uid={uid} signer={signer} onAnnounce={setAnnounce} />;
      case 'methods':
        return <Methods uid={uid} />;
      case 'translator':
        return <Translator uid={uid} serverKey={serverKey} payer={account.address} onAnnounce={setAnnounce} />;
    }
  };

  return (
    <div className="mp">
      <p className="mp-tag">
        Follows {CORE_SPEC} (core, repository text at commit 50309c8), the charge and subscription intent drafts, and {SESSION_SPEC}. Chain id 402402 is simulated (not assigned in the public chain registry on 2026-10-18); the token
        and addresses are fixtures. Payer key {account.address.slice(0, 10)}... exists in this tab only.
      </p>
      {/* Every panel stays mounted; a hidden panel keeps its channel, challenge and translator state. */}
      <Tabs<Tab> label="Playground sections" idPrefix="mp" value={tab} onChange={setTab} tabs={TABS.map(([id, label]) => ({ id, label, content: panel(id) }))} />
      <p className="mp-sr" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}

/* ---------- Challenge and credential builder ---------- */

interface BuilderProps {
  uid: string;
  serverKey: CryptoKey;
  used: Set<string>;
  payer: Hex;
  signer: VoucherSigner;
  onAnnounce: (s: string) => void;
}

function Builder({ uid, serverKey, used, payer, signer, onAnnounce }: BuilderProps) {
  const [intent, setIntent] = useState<Intent>('charge');
  const [amountText, setAmountText] = useState('0.01');
  const [withExpires, setWithExpires] = useState(true);
  const [withHeader, setWithHeader] = useState(false);
  const [withOpaque, setWithOpaque] = useState(false);
  const [description, setDescription] = useState('Current weather for one city');
  const [failure, setFailure] = useState<Failure>('none');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [fresh, setFresh] = useState<Challenge | null>(null);
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [result, setResult] = useState<{ text: string; tone: 'ok' | 'fail' | 'warn'; summary: string; simplification?: string }[]>([]);
  const [paste, setPaste] = useState('');
  const [issuedAt, setIssuedAt] = useState(() => new Date());
  const [busy, setBusy] = useState(false);

  let amount: bigint | null = null;
  let amountError = '';
  try {
    amount = parseUnits(amountText);
  } catch (e) {
    amountError = e instanceof Error ? e.message : String(e);
  }

  const request = useMemo(
    () =>
      amount === null
        ? null
        : buildRequest(intent, {
            amount,
            ...(intent === 'session' ? { suggestedDeposit: amount * 1000n } : {}),
            ...(intent === 'charge' ? { externalId: 'order-1001' } : {}),
          }),
    [intent, amount],
  );

  useEffect(() => {
    if (!request) return;
    let alive = true;
    const now = new Date();
    void issueChallenge(serverKey, {
      realm: FIXTURE_REALM,
      method: 'tempo',
      intent,
      request: encodeCanonical(request),
      ...(withExpires ? { expires: expiresIn(now, 300) } : {}),
      ...(description ? { description } : {}),
      ...(withHeader ? { header: PAYMENT_AUTHORIZATION } : {}),
      ...(withOpaque ? { opaque: encodeCanonical({ pi: 'pi_sim_0001' }) } : {}),
    }).then(async (c) => {
      if (!alive) return;
      setChallenge(c);
      setIssuedAt(now);
      setResult([]);
      // Build the method payload for this intent.
      if (intent === 'session') {
        const channelId = simulatedChannelId(payer, FIXTURE_RECIPIENT, FIXTURE_TOKEN.address, randomHex(32));
        const v = await signVoucher(signer, channelId, 0n);
        if (!alive) return;
        setPayload({ action: 'open', type: 'transaction', channelId, transaction: `0x76${'00'.repeat(8)}...simulated`, cumulativeAmount: '0', signature: v.signature });
      } else {
        setPayload(buildSimplePayload(intent, keccak256(randomHex(32))));
      }
    });
    return () => {
      alive = false;
    };
  }, [serverKey, intent, request, withExpires, withHeader, withOpaque, description, payer, signer]);

  if (!challenge || !request || !payload) {
    return (
      <section className="mp-panel">
        {BuilderControls()}
        {amountError && <p className="mp-out mp-out--fail">{amountError}</p>}
      </section>
    );
  }

  const credential = buildCredential(challenge, payload, didPkh(payer));
  const [field, credValue] = serializeCredential(credential);
  const accept = serializeAcceptPayment([
    { method: 'tempo', intent },
    { method: 'stripe', intent: 'charge', q: 0.5 },
  ]);

  // One run at a time: a second click while a run is in flight would consume the challenge id twice.
  async function send() {
    if (!challenge || !payload || busy) return;
    setBusy(true);
    try {
      await sendOnce();
    } finally {
      setBusy(false);
    }
  }

  function adoptFresh() {
    if (!fresh) return;
    setChallenge(fresh);
    setIssuedAt(new Date());
    setFresh(null);
    setResult([]);
    onAnnounce(`Using the fresh challenge ${fresh.id}. The credential below is rebuilt for it; send it again.`);
  }

  async function sendOnce() {
    if (!challenge || !payload) return;
    const now = failure === 'expired' && challenge.expires ? new Date(Date.parse(challenge.expires) + 1000) : new Date(Math.max(Date.now(), issuedAt.getTime()));
    let sentChallenge = challenge;
    if (failure === 'tamper') {
      const lowered = { ...request, amount: '1' };
      sentChallenge = { ...challenge, request: encodeCanonical(lowered) };
    }
    const cred = buildCredential(sentChallenge, payload, didPkh(payer));
    let [f, value] = serializeCredential(cred);
    if (failure === 'wrong-field') f = f === 'Authorization' ? PAYMENT_AUTHORIZATION : 'Authorization';
    if (failure === 'malformed') value = 'Payment eyJjaGFsbGVuZ2Ui!!';
    const state = { key: serverKey, realm: FIXTURE_REALM, used };
    const opts = {
      field: f,
      now,
      proofValid: failure !== 'proof',
      policyDenies: failure === 'policy',
      reference: typeof payload.hash === 'string' ? payload.hash : typeof payload.channelId === 'string' ? payload.channelId : keccak256(randomHex(32)),
      ...(intent === 'subscription' ? { receiptExtra: { subscriptionId: bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16))) } } : {}),
    };
    const runs = failure === 'replay' ? 2 : 1;
    const out: { text: string; tone: 'ok' | 'fail' | 'warn'; summary: string; simplification?: string }[] = [];
    let newFresh: Challenge | null = null;
    for (let i = 0; i < runs; i++) {
      const v = await verifyCredential(state, value, opts);
      if (v.status !== 200 && v.status !== 403 && v.freshChallenge) {
        const { id: _old, ...unsigned } = challenge;
        newFresh = await issueChallenge(serverKey, { ...unsigned, ...(unsigned.expires ? { expires: expiresIn(new Date(), 300) } : {}) });
      }
      const summary =
        v.status === 200
          ? `${i === 1 ? 'Second send: ' : ''}200 OK with a Payment-Receipt.`
          : v.status === 403
            ? '403 Forbidden: paid, but denied by policy. No new challenge.'
            : `${i === 1 ? 'Second send: ' : ''}${v.status} with problem type ${v.problem.type.split('/').pop()}${v.freshChallenge ? ' and a fresh challenge' : ''}.`;
      out.push({
        text: verdictText(v, newFresh ?? undefined),
        tone: v.status === 200 ? 'ok' : v.status === 403 ? 'warn' : 'fail',
        summary,
        ...(v.status !== 200 && v.status !== 403 && v.simplification ? { simplification: v.simplification } : {}),
      });
    }
    setFresh(newFresh);
    setResult(out);
    onAnnounce(out.map((o) => o.summary).join(' '));
  }

  function BuilderControls() {
    return (
      <>
        <h3>Challenge and credential builder</h3>
        <div className="mp-row">
          <fieldset>
            <legend>Intent</legend>
            {INTENTS.map((i) => (
              <label key={i}>
                <input type="radio" name={`${uid}-intent`} checked={intent === i} onChange={() => setIntent(i)} />
                <code>{INTENT_LABEL[i]}</code>
              </label>
            ))}
          </fieldset>
          <label className="mp-field" htmlFor={`${uid}-amt`}>
            {intent === 'session' ? 'Price per unit (SIMUSD)' : intent === 'subscription' ? 'Amount per period (SIMUSD)' : 'Amount (SIMUSD)'}
            <input id={`${uid}-amt`} type="text" inputMode="decimal" value={amountText} onChange={(e) => setAmountText(e.target.value)} />
          </label>
          <label className="mp-field" htmlFor={`${uid}-desc`}>
            description (display only, not bound)
            <input id={`${uid}-desc`} type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
        </div>
        <div className="mp-row">
          <label>
            <input
              type="checkbox"
              checked={withExpires}
              onChange={(e) => {
                setWithExpires(e.target.checked);
                if (!e.target.checked && failure === 'expired') setFailure('none');
              }}
            />{' '}
            <code>expires</code> (5 minutes)
          </label>
          <label>
            <input type="checkbox" checked={withHeader} onChange={(e) => setWithHeader(e.target.checked)} /> <code>header=&quot;Payment-Authorization&quot;</code>
          </label>
          <label>
            <input type="checkbox" checked={withOpaque} onChange={(e) => setWithOpaque(e.target.checked)} /> <code>opaque</code>
          </label>
        </div>
        <p className="mp-tag">Spec for this intent: {INTENT_SPEC[intent]}. {PAYLOAD_NOTE[intent]}</p>
      </>
    );
  }

  const decodedPaste = paste.trim() ? decodeJson(paste.trim().replace(/^Payment\s+/, '')) : null;

  return (
    <section className="mp-panel" aria-labelledby={`${uid}-b`}>
      <span id={`${uid}-b`} className="mp-sr">
        Challenge and credential builder
      </span>
      {BuilderControls()}
      {amountError && <p className="mp-out mp-out--fail">{amountError}</p>}
      <Wire
        label="1. Request"
        value={`GET ${FIXTURE_PATH} HTTP/1.1\nHost: ${FIXTURE_HOST}\nAccept-Payment: ${accept}`}
      />
      <Wire
        label="2. 402 response"
        value={`HTTP/1.1 402 Payment Required\nCache-Control: no-store\nWWW-Authenticate: ${serializeChallenge(challenge)}\nContent-Type: application/problem+json\n\n${JSON.stringify(problem('payment-required', 'This resource requires payment.'), null, 2)}`}
        decoded={`request (JCS, then base64url):\n${JSON.stringify(request, null, 2)}${challenge.opaque ? `\n\nopaque:\n${JSON.stringify({ pi: 'pi_sim_0001' })}` : ''}`}
      />
      <div>
        <p>
          <strong>Challenge id binding</strong> (HMAC-SHA256 with a server key made in this tab)
        </p>
        <pre tabIndex={SCROLL_TAB} aria-label="Challenge id binding">{`input = "${bindingInput(challenge)}"\nid    = base64url(HMAC-SHA256(server_secret, input)) = ${challenge.id}`}</pre>
        {challenge.header && (
          <Note kind="quirk">
            The header slot sits before opaque, as in the repository text after mpp-specs PR 362 (2026-09-21) and in mppx. The posted draft-httpauth-payment-01 (2026-09-09) appends it after
            opaque, so the two layouts give different ids for this challenge.
          </Note>
        )}
      </div>
      <Wire label={`3. Retry with the credential in ${field}`} value={`GET ${FIXTURE_PATH} HTTP/1.1\nHost: ${FIXTURE_HOST}\n${field === PAYMENT_AUTHORIZATION ? 'Authorization: Bearer sim-token\n' : ''}${field}: ${credValue}`} decoded={JSON.stringify(credential, null, 2)} />
      <div className="mp-row">
        <label className="mp-field" htmlFor={`${uid}-fail`}>
          Failure to inject
          <select id={`${uid}-fail`} value={failure} onChange={(e) => setFailure(e.target.value as Failure)}>
            {FAILURES.map(([id, label]) => {
              const needsExpires = id === 'expired' && !withExpires;
              return (
                <option key={id} value={id} disabled={needsExpires}>
                  {label}
                  {needsExpires ? ' (tick expires first)' : ''}
                </option>
              );
            })}
          </select>
        </label>
        <button type="button" className="btn" onClick={() => void send()} disabled={busy}>
          {busy ? 'Sending' : 'Send credential'}
        </button>
      </div>
      {result.map((r, i) => (
        <div key={i} className={`mp-out mp-out--${r.tone}`}>
          <p>
            <strong>{r.summary}</strong> <span className="mp-tag">{ILLUSTRATIVE}</span>
          </p>
          <pre tabIndex={SCROLL_TAB} aria-label={`Response ${i + 1}`}>
            {r.text}
          </pre>
          {r.tone === 'ok' && (
            <pre tabIndex={SCROLL_TAB} aria-label={`Decoded receipt ${i + 1}`}>
              {decodedReceipt(r.text)}
            </pre>
          )}
          {r.simplification && <Note kind="simplification">{r.simplification}</Note>}
        </div>
      ))}
      {fresh && (
        <div className="mp-row">
          <p className="mp-tag">The fresh challenge has a new id: {fresh.id}. Each id is single use.</p>
          <button type="button" className="btn" onClick={adoptFresh} disabled={busy}>
            Use the fresh challenge
          </button>
        </div>
      )}
      <Note kind="simplification">the payment proof is not checked on a chain; the failure menu decides it. Each sent credential consumes its id, so press Send again to see a replay rejected.</Note>
      <label className="mp-field" htmlFor={`${uid}-paste`}>
        Decode any base64url value (request, opaque, credential or receipt)
        <textarea id={`${uid}-paste`} rows={3} value={paste} onChange={(e) => setPaste(e.target.value)} />
      </label>
      {decodedPaste &&
        (decodedPaste.ok ? (
          <pre tabIndex={SCROLL_TAB} aria-label="Decoded value">
            {decodedPaste.json}
          </pre>
        ) : (
          <p className="mp-out mp-out--fail">{decodedPaste.error}</p>
        ))}
    </section>
  );
}

function decodedReceipt(text: string): string {
  const m = /Payment-Receipt: ([A-Za-z0-9_-]+)/.exec(text);
  if (!m?.[1]) return '';
  const d = decodeJson(m[1]);
  return d.ok ? `Decoded receipt:\n${d.json}` : '';
}

/* ---------- Session meter ---------- */

function SessionMeter({ uid, signer, onAnnounce }: { uid: string; signer: VoucherSigner; onAnnounce: (s: string) => void }) {
  const [priceText, setPriceText] = useState('0.001');
  const [depositText, setDepositText] = useState('1');
  const [deltaText, setDeltaText] = useState('0.001');
  const [units, setUnits] = useState('50');
  const [voucherUnits, setVoucherUnits] = useState('100');
  const [ch, setCh] = useState<ChannelState>(() => initialChannel(1000n, 1000n));
  const [last, setLast] = useState<StepResult | null>(null);
  const [lastVoucher, setLastVoucher] = useState<{ v: SignedVoucher; action: 'voucher' | 'close' } | null>(null);
  const [badSigner] = useState(() => privateKeyToAccount(generatePrivateKey()));
  // One channel action at a time: a second click while a voucher is being signed would start from the same base state.
  const [busy, setBusy] = useState(false);

  let parsed: { price: bigint; deposit: bigint; delta: bigint } | null = null;
  let err = '';
  try {
    parsed = { price: parseUnits(priceText), deposit: parseUnits(depositText), delta: parseUnits(deltaText) };
  } catch (e) {
    err = e instanceof Error ? e.message : String(e);
  }

  function apply(r: StepResult) {
    setCh(r.state);
    setLast(r);
    onAnnounce(`${r.ok ? 'OK' : `Rejected, status ${r.status}`}. ${r.message}`);
  }

  function open() {
    if (!parsed) return;
    const base = initialChannel(parsed.price, parsed.delta);
    const id = simulatedChannelId(signer.address, FIXTURE_RECIPIENT, FIXTURE_TOKEN.address, randomHex(32));
    setLastVoucher(null);
    apply(openChannel(base, id, parsed.deposit));
  }

  async function voucher(kind: 'next' | 'lower' | 'wrong-key' | 'over-deposit') {
    if (!ch.channelId || busy) return;
    setBusy(true);
    try {
      const n = BigInt(Math.max(0, Number.parseInt(voucherUnits, 10) || 0));
      let amount = ch.acceptedCumulative + ch.pricePerUnit * n;
      if (kind === 'lower') amount = ch.acceptedCumulative > 0n ? ch.acceptedCumulative - 1n : 0n;
      if (kind === 'over-deposit') amount = ch.deposit + ch.pricePerUnit;
      const s: VoucherSigner = kind === 'wrong-key' ? { address: badSigner.address, signTypedData: (td) => badSigner.signTypedData(td) } : signer;
      const v = await signVoucher(s, ch.channelId, amount);
      setLastVoucher({ v, action: 'voucher' });
      apply(await acceptVoucher(ch, v, signer.address));
    } finally {
      setBusy(false);
    }
  }

  async function closeCoop() {
    if (busy) return;
    setBusy(true);
    try {
      if (ch.channelId && ch.phase === 'open') {
        const v = await signVoucher(signer, ch.channelId, ch.acceptedCumulative);
        setLastVoucher({ v, action: 'close' });
      }
      apply(cooperativeClose(ch));
    } finally {
      setBusy(false);
    }
  }

  const exp = exposure(ch);
  const pct = (x: bigint) => (ch.deposit > 0n ? Number((x * 1000n) / ch.deposit) / 10 : 0);
  const left = graceRemaining(ch);
  const receipt = ch.channelId && ch.phase !== 'idle' ? sessionReceipt(ch, 'sim-challenge-id', new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')) : null;

  return (
    <section className="mp-panel" aria-labelledby={`${uid}-s`}>
      <h3 id={`${uid}-s`}>Session meter (Tempo method, {SESSION_SPEC})</h3>
      <p className="mp-tag">
        Session is defined by each payment method, not by a standardized intent. This follows Tempo session protocol v1: EIP-712 domain
        &quot;Tempo Stream Channel&quot;, type Voucher(bytes32 channelId, uint128 cumulativeAmount), chain id 402402.
      </p>
      <div className="mp-row">
        <label className="mp-field" htmlFor={`${uid}-price`}>
          Price per unit (SIMUSD)
          <input id={`${uid}-price`} type="text" value={priceText} onChange={(e) => setPriceText(e.target.value)} disabled={ch.phase !== 'idle'} />
        </label>
        <label className="mp-field" htmlFor={`${uid}-dep`}>
          Deposit (SIMUSD)
          <input id={`${uid}-dep`} type="text" value={depositText} onChange={(e) => setDepositText(e.target.value)} disabled={ch.phase !== 'idle'} />
        </label>
        <label className="mp-field" htmlFor={`${uid}-delta`}>
          minVoucherDelta (SIMUSD)
          <input id={`${uid}-delta`} type="text" value={deltaText} onChange={(e) => setDeltaText(e.target.value)} disabled={ch.phase !== 'idle'} />
        </label>
        <button type="button" className="btn" onClick={open} disabled={!parsed || ch.phase === 'open' || ch.phase === 'close-requested'}>
          {ch.phase === 'closed' ? 'Open a new channel' : 'Open channel (action open)'}
        </button>
      </div>
      {err && <p className="mp-out mp-out--fail">{err}</p>}
      <div className="mp-meter" aria-label="Channel balances">
        <div className="mp-bar" aria-hidden="true">
          <span style={{ width: `${pct(ch.acceptedCumulative)}%` }} />
          <span style={{ width: `${pct(ch.spent)}%` }} />
        </div>
        <p>
          Phase: <strong>{ch.phase}</strong>. Deposit {formatUnits(ch.deposit)}, vouchers signed up to (acceptedCumulative) {formatUnits(ch.acceptedCumulative)}, spent{' '}
          {formatUnits(ch.spent)} for {ch.units} units, settled on-chain {formatUnits(ch.settledOnChain)}. Simulated clock: {ch.clock} s.
        </p>
        <p>
          Authorized but not yet served: <strong>{formatUnits(exp.unserved)}</strong>. Worst-case loss: <strong>{formatUnits(exp.worstCase)}</strong> (the deposit,
          because no voucher can exceed it and the escrow pays any signed voucher).
        </p>
        {ch.phase === 'closed' && (
          <p>
            Final: payee received {formatUnits(ch.paidToPayee)}, payer got back {formatUnits(ch.refundedToPayer)}.
          </p>
        )}
      </div>
      <div className="mp-row">
        <label className="mp-field" htmlFor={`${uid}-vu`}>
          Voucher covers this many more units
          <input id={`${uid}-vu`} type="text" inputMode="numeric" value={voucherUnits} onChange={(e) => setVoucherUnits(e.target.value)} />
        </label>
        <button type="button" className="btn" onClick={() => void voucher('next')} disabled={ch.phase === 'idle' || busy}>
          Sign voucher (action voucher)
        </button>
        <label className="mp-field" htmlFor={`${uid}-units`}>
          Units to consume
          <input id={`${uid}-units`} type="text" inputMode="numeric" value={units} onChange={(e) => setUnits(e.target.value)} />
        </label>
        <button type="button" className="btn" onClick={() => apply(consume(ch, Math.max(0, Number.parseInt(units, 10) || 0)))} disabled={ch.phase === 'idle' || busy}>
          Consume
        </button>
        <button type="button" className="btn" onClick={() => parsed && apply(topUp(ch, parsed.deposit))} disabled={ch.phase === 'idle' || busy}>
          Top up by the deposit amount (action topUp)
        </button>
        <button type="button" className="btn" onClick={() => apply(settle(ch))} disabled={ch.phase === 'idle' || busy}>
          Server settles
        </button>
      </div>
      <div className="mp-row">
        <button type="button" className="btn" onClick={() => void closeCoop()} disabled={ch.phase !== 'open' || busy}>
          Cooperative close (action close)
        </button>
        <button type="button" className="btn" onClick={() => apply(requestClose(ch))} disabled={ch.phase !== 'open' || busy}>
          Forced close: requestClose()
        </button>
        <button type="button" className="btn" onClick={() => setCh(advanceClock(ch, 300))} disabled={ch.phase === 'idle' || ch.phase === 'closed' || busy}>
          Advance clock 5 minutes
        </button>
        <button type="button" className="btn" onClick={() => apply(withdraw(ch))} disabled={ch.phase !== 'close-requested' || busy}>
          withdraw()
        </button>
      </div>
      {ch.phase === 'close-requested' && (
        <p className="mp-out mp-out--warn">
          Grace period: {left} s left of {GRACE_PERIOD_SECONDS} s (at least 15 minutes in the spec; clients should wait {RECOMMENDED_WAIT_SECONDS / 60} minutes). The server
          can still settle; new vouchers are rejected.
        </p>
      )}
      <fieldset>
        <legend>Failure injection</legend>
        <div className="mp-row">
          <button type="button" className="btn" onClick={() => void voucher('lower')} disabled={ch.phase === 'idle' || busy}>
            Voucher lower than accepted
          </button>
          <button type="button" className="btn" onClick={() => void voucher('wrong-key')} disabled={ch.phase === 'idle' || busy}>
            Voucher from another key
          </button>
          <button type="button" className="btn" onClick={() => void voucher('over-deposit')} disabled={ch.phase === 'idle' || busy}>
            Voucher above the deposit
          </button>
        </div>
      </fieldset>
      {last && (
        <div className={`mp-out mp-out--${last.ok ? 'ok' : 'fail'}`}>
          <p>
            <strong>{last.ok ? `${last.status} OK` : `Rejected with status ${last.status}`}</strong>: {last.message}
          </p>
          {last.problemType && (
            <pre tabIndex={SCROLL_TAB} aria-label="Problem details">
              {JSON.stringify(
                {
                  type: last.problemType,
                  status: last.status,
                  detail: last.message,
                  ...(ch.channelId ? { channelId: ch.channelId } : {}),
                  ...(last.requiredTopUp !== undefined ? { requiredTopUp: last.requiredTopUp.toString() } : {}),
                },
                null,
                2,
              )}
            </pre>
          )}
          {last.simplification && <Note kind="simplification">{last.simplification}</Note>}
        </div>
      )}
      {lastVoucher && (
        <>
          <Wire
            label={`Last voucher payload (action ${lastVoucher.action})`}
            value={JSON.stringify(voucherPayload(lastVoucher.action, lastVoucher.v), null, 2)}
            decoded={`EIP-712 typed data that was signed:\n${JSON.stringify(voucherTypedData(lastVoucher.v.channelId, lastVoucher.v.cumulativeAmount), (_k, x: unknown) => (typeof x === 'bigint' ? x.toString() : x), 2)}`}
          />
        </>
      )}
      {receipt && <Wire label="Payment-Receipt for the current state" value={`Payment-Receipt: ${serializeReceipt(receipt)}`} decoded={JSON.stringify(receipt, null, 2)} />}
      <Note kind="simplification">
        the open and top-up transactions, settlement and the channel id derivation are in-memory stand-ins; the clock is simulated; cooperative close captures
        max(spent, settledOnChain) as in v2 accounting.
      </Note>
    </section>
  );
}

/* ---------- Method switcher ---------- */

function Methods({ uid }: { uid: string }) {
  const [method, setMethod] = useState('tempo');
  const info = METHODS.find((m) => m.id === method) ?? (METHODS[0] as (typeof METHODS)[number]);
  return (
    <section className="mp-panel" aria-labelledby={`${uid}-m`}>
      <h3 id={`${uid}-m`}>Methods and the intents they define</h3>
      <p className="mp-tag">The 11 method ids with a spec file in the MPP spec repository. A method id is lowercase ASCII letters only.</p>
      <label className="mp-field" htmlFor={`${uid}-msel`}>
        Method
        <select id={`${uid}-msel`} value={method} onChange={(e) => setMethod(e.target.value)}>
          {METHODS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id}
            </option>
          ))}
        </select>
      </label>
      <p>
        <code>{info.id}</code>: {info.rail}. Intents: {info.intents.join(', ')}. Spec files: {info.files.join(', ')}.
      </p>
      <Wire
        label="Accept-Payment for this method"
        value={`Accept-Payment: ${serializeAcceptPayment(info.intents.map((i) => ({ method: info.id, intent: i })))}`}
      />
      <ScrollRegion label="Methods and intents table">
        <table>
          <caption className="mp-sr">Which methods define which intents</caption>
          <thead>
            <tr>
              <th scope="col">Method id</th>
              {INTENTS.map((i) => (
                <th key={i} scope="col">
                  {i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METHODS.map((m) => (
              <tr key={m.id} aria-current={m.id === method ? 'true' : undefined}>
                <th scope="row">
                  <code>{m.id}</code>
                </th>
                {INTENTS.map((i) => (
                  <td key={i}>{m.intents.includes(i) ? 'Yes' : 'No'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
      <p>
        Session is defined by {methodsFor('session').length} methods ({methodsFor('session').join(', ')}), each in its own document. Subscription:{' '}
        {methodsFor('subscription').join(', ')}.
      </p>
    </section>
  );
}

/* ---------- x402 to MPP translator ---------- */

function Translator({ uid, serverKey, payer, onAnnounce }: { uid: string; serverKey: CryptoKey; payer: Hex; onAnnounce: (s: string) => void }) {
  const sample = useMemo(() => sampleX402(new Date(), payer), [payer]);
  const [req, setReq] = useState(sample.required);
  const [sig, setSig] = useState(sample.signature);
  const [resp, setResp] = useState(sample.response);
  const [out, setOut] = useState<{ a: Translation<Challenge>; b: Translation<unknown> | null; c: Translation<unknown> } | null>(null);

  async function run() {
    const now = new Date();
    const a = await translatePaymentRequired(req.trim(), serverKey, now);
    const b = a.ok && a.decoded ? translatePaymentSignature(sig.trim(), a.decoded, didPkh(payer)) : null;
    const c = translatePaymentResponse(resp.trim(), now);
    setOut({ a, b, c });
    onAnnounce(`Translated: challenge ${a.ok ? 'ok' : 'failed'}, credential ${b?.ok ? 'ok' : 'failed'}, receipt ${c.ok ? 'ok' : 'failed'}.`);
  }

  const block = (title: string, t: Translation<unknown> | null) =>
    t && (
      <div className={`mp-out mp-out--${t.ok ? 'ok' : 'fail'}`}>
        <p>
          <strong>{title}</strong>
        </p>
        {t.ok && t.header ? <Wire label={t.header[0]} value={`${t.header[0]}: ${t.header[1]}`} decoded={JSON.stringify(t.decoded, null, 2)} /> : <p>{t.error}</p>}
        <ul>
          {t.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
    );

  return (
    <section className="mp-panel" aria-labelledby={`${uid}-t`}>
      <h3 id={`${uid}-t`}>x402 to MPP header translator</h3>
      <p className="mp-tag">
        Mapping from MPP&apos;s comparison page: PAYMENT-REQUIRED to WWW-Authenticate: Payment, PAYMENT-SIGNATURE to Authorization: Payment, PAYMENT-RESPONSE to
        Payment-Receipt, x402 exact to the charge intent (method evm). The samples use the x402 playground fixtures. x402 uses standard base64; MPP uses base64url
        without padding.
      </p>
      <label className="mp-field" htmlFor={`${uid}-x1`}>
        PAYMENT-REQUIRED (x402 V2)
        <textarea id={`${uid}-x1`} rows={3} value={req} onChange={(e) => setReq(e.target.value)} />
      </label>
      <label className="mp-field" htmlFor={`${uid}-x2`}>
        PAYMENT-SIGNATURE
        <textarea id={`${uid}-x2`} rows={3} value={sig} onChange={(e) => setSig(e.target.value)} />
      </label>
      <label className="mp-field" htmlFor={`${uid}-x3`}>
        PAYMENT-RESPONSE
        <textarea id={`${uid}-x3`} rows={2} value={resp} onChange={(e) => setResp(e.target.value)} />
      </label>
      <div className="mp-row">
        <button type="button" className="btn" onClick={() => void run()}>
          Translate
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setReq(sample.required);
            setSig(sample.signature);
            setResp(sample.response);
          }}
        >
          Restore samples
        </button>
      </div>
      {out && (
        <>
          {block('PAYMENT-REQUIRED to WWW-Authenticate: Payment', out.a)}
          {block('PAYMENT-SIGNATURE to Authorization: Payment', out.b ?? { ok: false, notes: [], error: 'Needs a translated challenge first.' })}
          {block('PAYMENT-RESPONSE to Payment-Receipt', out.c)}
        </>
      )}
      <Note kind="simplification">the sample x402 signature is a placeholder, and one accepts[] entry is translated. A real dual-protocol server, such as one built with mppx, issues both challenges itself.</Note>
    </section>
  );
}
