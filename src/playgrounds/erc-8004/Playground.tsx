/**
 * ERC-8004 playground: a registration file builder with a local schema derived from the spec text, a global id
 * composer, a reputation aggregator that mirrors the contract's getSummary math, and an EIP-712 setAgentWallet
 * preview with the deadline checks. The new wallet key is generated at mount and held in memory only; no RPC,
 * no wallet connection. PlaygroundFrame wraps this component.
 */
import { useId, useMemo, useState, type ReactNode } from 'react';
import type { Address, Hex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import {
  FIXTURE_IDENTITY_REGISTRY,
  ILLUSTRATIVE,
  LISTED_ADDRESSES,
  MAX_DEADLINE_DELAY_SECONDS,
  REGISTRATION_TYPE,
  SIM_CHAIN_ID,
  SIM_NAMESPACE,
  SIMPLIFICATION,
  TRUST_EXAMPLES,
} from './lib/fixtures';
import {
  REGISTRATION_SCHEMA,
  SCHEMA_LABEL,
  classifyAgentUri,
  composeGlobalId,
  fromDataUri,
  toDataUri,
  validateRegistrationText,
  type Issue,
} from './lib/registration';
import {
  DEFAULT_SCENARIO,
  buildScenario,
  fixtureAddress,
  formatFixed,
  getSummary,
  giveFeedback,
  hasMatchingProof,
  revokeFeedback,
  weightedSummary,
  type RegistryState,
  type Reviewer,
  type ScenarioOptions,
} from './lib/reputation';
import { AGENT_WALLET_TYPE_STRING, agentWalletTypedData, checkSetAgentWallet, type SetWalletResult } from './lib/wallet';
import './erc-8004.css';

type Tab = 'registration' | 'reputation' | 'wallet';
const TABS: [Tab, string][] = [
  ['registration', 'Registration file and global id'],
  ['reputation', 'Reputation aggregator'],
  ['wallet', 'Agent wallet signature'],
];

interface Service {
  name: string;
  endpoint: string;
  version: string;
}

interface RegForm {
  name: string;
  description: string;
  image: string;
  x402Support: boolean;
  active: boolean;
  services: Service[];
  trust: string[];
}

const REG_DEFAULTS: RegForm = {
  name: 'Sim Weather Agent',
  description: 'Answers weather questions for a fixed price per call. Fixture agent for this simulation.',
  image: 'https://agent.example/sim-weather.png',
  x402Support: true,
  active: true,
  services: [
    { name: 'web', endpoint: 'https://agent.example/', version: '' },
    { name: 'A2A', endpoint: 'https://agent.example/.well-known/agent-card.json', version: '0.3.0' },
    { name: 'MCP', endpoint: 'https://mcp.agent.example/', version: '2025-06-18' },
  ],
  trust: ['reputation'],
};

type Breakage = 'none' | 'type' | 'x402' | 'registry' | 'endpoint';
const BREAKAGES: [Breakage, string][] = [
  ['none', 'No change'],
  ['type', 'Wrong type value'],
  ['x402', 'x402Support as a string'],
  ['registry', 'agentRegistry without the address'],
  ['endpoint', 'Service without an endpoint'],
];

function buildFile(f: RegForm, entry: { agentId: number; agentRegistry: string } | null, breakage: Breakage): Record<string, unknown> {
  const services = f.services.map((s, i) => {
    const out: Record<string, string> = { name: s.name };
    if (!(breakage === 'endpoint' && i === 0)) out.endpoint = s.endpoint;
    if (s.version) out.version = s.version;
    return out;
  });
  const registrations = entry
    ? [{ agentId: entry.agentId, agentRegistry: breakage === 'registry' ? `${SIM_NAMESPACE}:${SIM_CHAIN_ID}` : entry.agentRegistry }]
    : [];
  return {
    type: breakage === 'type' ? 'registration-v1' : REGISTRATION_TYPE,
    name: f.name,
    description: f.description,
    image: f.image,
    services,
    x402Support: breakage === 'x402' ? String(f.x402Support) : f.x402Support,
    active: f.active,
    registrations,
    ...(f.trust.length ? { supportedTrust: f.trust } : {}),
  };
}

function Field({ label, children, note }: { label: string; children: (id: string) => ReactNode; note?: string }) {
  const id = useId();
  return (
    <div className="e8-field">
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {note && <span className="e8-tag">{note}</span>}
    </div>
  );
}

function Issues({ issues }: { issues: Issue[] }) {
  if (!issues.length) return <p className="e8-out e8-out--ok">Valid against the derived schema. No warnings.</p>;
  return (
    <ul className="e8-issues">
      {issues.map((i, n) => (
        <li key={n} className={`e8-out e8-out--${i.level === 'error' ? 'fail' : 'warn'}`}>
          <strong>{i.level === 'error' ? 'Error' : i.level === 'warning' ? 'Warning' : 'Note'}</strong> <code>{i.path}</code>: {i.message}
        </li>
      ))}
    </ul>
  );
}

function RegistrationPanel({ say }: { say: (s: string) => void }) {
  const [form, setForm] = useState<RegForm>(REG_DEFAULTS);
  const [gid, setGid] = useState({ namespace: SIM_NAMESPACE, chainId: String(SIM_CHAIN_ID), identityRegistry: FIXTURE_IDENTITY_REGISTRY as string, agentId: '7' });
  const [breakage, setBreakage] = useState<Breakage>('none');
  const [override, setOverride] = useState<string | null>(null);
  const [scheme, setScheme] = useState<'data' | 'ipfs' | 'https'>('data');
  const [decoded, setDecoded] = useState(false);

  const global = composeGlobalId(gid);
  const file = useMemo(() => buildFile(form, global.registrationEntry, breakage), [form, global.registrationEntry, breakage]);
  const generated = JSON.stringify(file, null, 2);
  const text = override ?? generated;
  const validation = validateRegistrationText(text);
  const errors = validation.issues.filter((i) => i.level === 'error').length;

  const parsedForUri = ((): unknown => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  })();
  const agentUri =
    scheme === 'data'
      ? parsedForUri === null
        ? ''
        : toDataUri(parsedForUri)
      : scheme === 'ipfs'
        ? 'ipfs://bafy-sim-registration-file'
        : 'https://agent.example/agent-registration.json';
  const uriCheck = agentUri ? classifyAgentUri(agentUri) : null;

  const set = <K extends keyof RegForm>(k: K, v: RegForm[K]) => {
    setOverride(null);
    setForm((f) => ({ ...f, [k]: v }));
  };
  const setService = (i: number, k: keyof Service, v: string) =>
    set(
      'services',
      form.services.map((s, n) => (n === i ? { ...s, [k]: v } : s)),
    );

  return (
    <div className="e8-panel">
      <h3>Global id composer</h3>
      <p>
        An agent is identified by its registry string <code>{'{namespace}:{chainId}:{identityRegistry}'}</code> plus its <code>agentId</code>, the
        ERC-721 tokenId. The registry hands out ids in order, so you cannot pick one on a real chain.
      </p>
      <div className="e8-row">
        <Field label="Namespace">{(id) => <input id={id} type="text" value={gid.namespace} onChange={(e) => setGid({ ...gid, namespace: e.target.value })} size={8} />}</Field>
        <Field label="Chain id" note="Fake chain">{(id) => <input id={id} type="text" value={gid.chainId} onChange={(e) => setGid({ ...gid, chainId: e.target.value })} size={8} />}</Field>
        <Field label="Identity Registry address" note="Fixture address">
          {(id) => <input id={id} type="text" value={gid.identityRegistry} onChange={(e) => setGid({ ...gid, identityRegistry: e.target.value })} size={44} />}
        </Field>
        <Field label="agentId">{(id) => <input id={id} type="text" value={gid.agentId} onChange={(e) => setGid({ ...gid, agentId: e.target.value })} size={6} />}</Field>
      </div>
      {global.ok ? (
        <p className="e8-out e8-out--ok">
          agentRegistry <code>{global.agentRegistry}</code>, agentId <code>{global.agentId}</code>
        </p>
      ) : (
        <ul className="e8-issues">
          {global.errors.map((e) => (
            <li key={e} className="e8-out e8-out--fail">
              {e}
            </li>
          ))}
        </ul>
      )}
      <details>
        <summary>Listed deployment addresses (text only, never called)</summary>
        <p>
          From the contracts README as of {LISTED_ADDRESSES.asOf}: every listed mainnet uses Identity <code>{LISTED_ADDRESSES.mainnetIdentity}</code> and
          Reputation <code>{LISTED_ADDRESSES.mainnetReputation}</code>; testnets use Identity <code>{LISTED_ADDRESSES.testnetIdentity}</code> and Reputation{' '}
          <code>{LISTED_ADDRESSES.testnetReputation}</code>. This simulation never sends anything to them.
        </p>
      </details>

      <h3>Registration file builder</h3>
      <div className="e8-row">
        <Field label="name">{(id) => <input id={id} type="text" value={form.name} onChange={(e) => set('name', e.target.value)} />}</Field>
        <Field label="image">{(id) => <input id={id} type="text" value={form.image} onChange={(e) => set('image', e.target.value)} size={36} />}</Field>
        <label>
          <input type="checkbox" checked={form.x402Support} onChange={(e) => set('x402Support', e.target.checked)} /> x402Support
        </label>
        <label>
          <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> active
        </label>
      </div>
      <Field label="description">{(id) => <textarea id={id} rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />}</Field>
      <fieldset>
        <legend>services</legend>
        {form.services.map((s, i) => (
          <div className="e8-row" key={i}>
            <Field label={`Service ${i + 1} name`}>{(id) => <input id={id} type="text" value={s.name} onChange={(e) => setService(i, 'name', e.target.value)} size={8} />}</Field>
            <Field label="endpoint">{(id) => <input id={id} type="text" value={s.endpoint} onChange={(e) => setService(i, 'endpoint', e.target.value)} size={36} />}</Field>
            <Field label="version (optional)">{(id) => <input id={id} type="text" value={s.version} onChange={(e) => setService(i, 'version', e.target.value)} size={10} />}</Field>
            <button type="button" className="btn" onClick={() => set('services', form.services.filter((_, n) => n !== i))}>
              Remove service {i + 1}
            </button>
          </div>
        ))}
        <button type="button" className="btn" onClick={() => set('services', [...form.services, { name: 'email', endpoint: 'agent@agent.example', version: '' }])}>
          Add a service
        </button>
      </fieldset>
      <fieldset>
        <legend>supportedTrust (optional)</legend>
        {TRUST_EXAMPLES.map((t) => (
          <label key={t}>
            <input
              type="checkbox"
              checked={form.trust.includes(t)}
              onChange={(e) => set('trust', e.target.checked ? [...form.trust, t] : form.trust.filter((x) => x !== t))}
            />{' '}
            {t}
          </label>
        ))}
      </fieldset>
      <Field label="Break the file on purpose">
        {(id) => (
          <select
            id={id}
            value={breakage}
            onChange={(e) => {
              setOverride(null);
              setBreakage(e.target.value as Breakage);
              say(`File changed: ${e.target.selectedOptions[0]?.text ?? ''}.`);
            }}
          >
            {BREAKAGES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Registration file JSON (you can edit it)" note={ILLUSTRATIVE}>
        {(id) => <textarea id={id} rows={14} value={text} spellCheck={false} onChange={(e) => setOverride(e.target.value)} />}
      </Field>
      {override !== null && (
        <button type="button" className="btn" onClick={() => setOverride(null)}>
          Discard edits and rebuild from the form
        </button>
      )}
      <p aria-live="polite">
        <strong>{validation.ok ? 'Valid' : `${errors} error${errors === 1 ? '' : 's'}`}</strong> against a schema {SCHEMA_LABEL.toLowerCase()}.
      </p>
      <Issues issues={validation.issues} />
      <p className="e8-tag">
        {SIMPLIFICATION}: the text gives the structure as an example. This page treats x402Support and active as required, as the protocol page
        does; the best-practices guide treats active as optional.
      </p>
      <details>
        <summary>Show the derived JSON Schema</summary>
        <pre>{JSON.stringify(REGISTRATION_SCHEMA, null, 2)}</pre>
      </details>

      <h3>agentURI</h3>
      <fieldset>
        <legend>Where the file lives</legend>
        {(
          [
            ['data', 'Fully on-chain base64 data URI'],
            ['ipfs', 'IPFS'],
            ['https', 'HTTPS'],
          ] as const
        ).map(([v, l]) => (
          <label key={v}>
            <input type="radio" name="e8-scheme" checked={scheme === v} onChange={() => setScheme(v)} /> {l}
          </label>
        ))}
      </fieldset>
      {agentUri ? (
        <>
          <p className="e8-tag">{ILLUSTRATIVE}</p>
          <pre>{scheme === 'data' && decoded ? JSON.stringify(fromDataUri(agentUri), null, 2) : agentUri}</pre>
          {scheme === 'data' && (
            <button type="button" className="btn" aria-pressed={decoded} onClick={() => setDecoded((d) => !d)}>
              {decoded ? 'Show the encoded URI' : 'Decode the data URI'}
            </button>
          )}
          {uriCheck?.issue && <Issues issues={[uriCheck.issue]} />}
          {scheme !== 'data' && (
            <p className="e8-tag">
              {SIMPLIFICATION}: the IPFS and HTTPS URIs are placeholders; nothing is uploaded or fetched. With HTTPS, a service domain can be
              proven by serving a matching registrations entry at /.well-known/agent-registration.json.
            </p>
          )}
        </>
      ) : (
        <p className="e8-out e8-out--fail">Fix the JSON to build a data URI.</p>
      )}
    </div>
  );
}

type Trust = 'all' | 'honest' | 'custom' | 'none';

function proofLabel(state: RegistryState, e: RegistryState['entries'][number]): string {
  if (!e.file?.proofOfPayment) return 'None';
  return hasMatchingProof(e, state.agentWallet) ? 'Paid the agent wallet' : 'Paid another address';
}

function ReputationPanel({ say }: { say: (s: string) => void }) {
  const [opt, setOptRaw] = useState<ScenarioOptions>(DEFAULT_SCENARIO);
  const [scenario, setScenario] = useState(() => buildScenario(DEFAULT_SCENARIO));
  const [current, setState] = useState<RegistryState>(scenario.state);
  const [trust, setTrust] = useState<Trust>('honest');
  const [custom, setCustom] = useState<Address[]>([]);
  const [tag1, setTag1] = useState('starred');
  const [unpaidWeight, setUnpaidWeight] = useState(0.2);
  const [log, setLog] = useState<string[]>([]);

  // A new scenario rebuilds the registry from scratch.
  const setOpt = (o: ScenarioOptions) => {
    const next = buildScenario(o);
    setOptRaw(o);
    setScenario(next);
    setState(next.state);
    setCustom([]);
  };
  const reviewers: Reviewer[] = scenario.reviewers;
  const byAddr = new Map(reviewers.map((r) => [r.address, r]));
  const all = reviewers.map((r) => r.address);
  const list: Address[] =
    trust === 'all' ? all : trust === 'honest' ? reviewers.filter((r) => r.kind === 'honest').map((r) => r.address) : trust === 'custom' ? custom : [];

  const trusted = getSummary(current, list, tag1);
  const everyone = getSummary(current, all, tag1);
  const weighted = weightedSummary(current, trust === 'none' ? null : list, tag1, { paid: 1, unpaid: unpaidWeight });

  const note = (s: string) => {
    setLog((l) => [s, ...l].slice(0, 6));
    say(s);
  };
  const revoke = (client: Address, idx: number) => {
    const r = revokeFeedback(current, client, idx);
    if (r.ok) setState(r.value);
    note(r.ok ? `${byAddr.get(client)?.label ?? client} revoked feedback ${idx}.` : `revokeFeedback reverted: "${r.revert}".`);
  };
  const selfFeedback = (who: 'owner' | 'operator') => {
    const sender = who === 'owner' ? current.owner : current.operators[0]!;
    const r = giveFeedback(current, { sender, value: 100n, valueDecimals: 0, tag1: 'starred' });
    note(r.ok ? 'Feedback stored.' : `giveFeedback from the ${who} reverted: "${r.revert}".`);
  };
  const fmt = (r: ReturnType<typeof getSummary>) =>
    r.ok ? (
      <>
        count <code>{r.value.count.toString()}</code>, summaryValue <code>{r.value.summaryValue.toString()}</code>, summaryValueDecimals{' '}
        <code>{r.value.summaryValueDecimals}</code> (reads as {formatFixed(r.value.summaryValue, r.value.summaryValueDecimals)})
      </>
    ) : (
      <>
        reverted with <code>&quot;{r.revert}&quot;</code>
      </>
    );

  return (
    <div className="e8-panel">
      <p>
        Agent {current.agentId} on the fake chain collects feedback. Honest clients paid the agent wallet and attach a proofOfPayment to their
        feedback file. Sybil reviewers are free addresses run by one person. Pick whose feedback <code>getSummary</code> may count.
      </p>
      <div className="e8-row">
        <Field label={`Honest clients: ${opt.honest}`}>
          {(id) => <input id={id} type="range" min={0} max={8} value={opt.honest} onChange={(e) => setOpt({ ...opt, honest: Number(e.target.value) })} />}
        </Field>
        <Field label={`Sybil reviewers: ${opt.sybils}`}>
          {(id) => <input id={id} type="range" min={0} max={20} value={opt.sybils} onChange={(e) => setOpt({ ...opt, sybils: Number(e.target.value) })} />}
        </Field>
        <Field label="Sybil goal">
          {(id) => (
            <select id={id} value={opt.sybilMode} onChange={(e) => setOpt({ ...opt, sybilMode: e.target.value as ScenarioOptions['sybilMode'] })}>
              <option value="boost">Boost: post 100</option>
              <option value="smear">Smear: post 0</option>
            </select>
          )}
        </Field>
        <label>
          <input type="checkbox" checked={opt.sybilFakeProof} onChange={(e) => setOpt({ ...opt, sybilFakeProof: e.target.checked })} /> Sybils attach a
          proof of payment to their own address
        </label>
        <label>
          <input type="checkbox" checked={opt.watchtower} onChange={(e) => setOpt({ ...opt, watchtower: e.target.checked })} /> Add a watchtower
          reachable ping
        </label>
      </div>
      <div className="e8-row">
        <Field label="clientAddresses passed to getSummary">
          {(id) => (
            <select id={id} value={trust} onChange={(e) => setTrust(e.target.value as Trust)}>
              <option value="honest">Trusted clients only (the honest ones)</option>
              <option value="all">Every client from getClients</option>
              <option value="custom">Custom (tick rows below)</option>
              <option value="none">Empty list</option>
            </select>
          )}
        </Field>
        <Field label="tag1 filter">
          {(id) => (
            <select id={id} value={tag1} onChange={(e) => setTag1(e.target.value)}>
              <option value="starred">starred</option>
              <option value="reachable">reachable</option>
              <option value="">No filter (empty string)</option>
            </select>
          )}
        </Field>
        <Field label={`Off-chain weight of feedback without a matching proof: ${unpaidWeight}`}>
          {(id) => <input id={id} type="range" min={0} max={1} step={0.1} value={unpaidWeight} onChange={(e) => setUnpaidWeight(Number(e.target.value))} />}
        </Field>
      </div>

      <div className="e8-results" aria-live="polite">
        <p className={`e8-out e8-out--${trusted.ok ? 'ok' : 'fail'}`}>
          <strong>getSummary with your list:</strong> {fmt(trusted)}
        </p>
        <p className="e8-out e8-out--warn">
          <strong>getSummary with every client:</strong> {fmt(everyone)}
        </p>
        <p className="e8-out">
          <strong>Off-chain weighted mean:</strong>{' '}
          {weighted.mean === null ? 'no entries count' : `${weighted.mean.toFixed(2)} over ${weighted.count} entries (weight total ${weighted.weightTotal.toFixed(1)})`}
          {trust === 'none' ? ', over every client' : ', over your list'}
        </p>
        <p className="e8-tag">
          {SIMPLIFICATION}: the weighting runs off chain. The registry stores only value, valueDecimals, tag1, tag2 and the revoked flag; the
          proofOfPayment lives in the feedback file and nothing checks it. A real indexer would look the transaction up on the chain.
        </p>
      </div>
      {!tag1 && opt.watchtower && (
        <p className="e8-out e8-out--warn">
          With no tag filter, a reachable ping of 1 is averaged together with 0 to 100 star ratings. Tags carry the meaning of a value.
        </p>
      )}

      <div className="e8-scroll">
        <table>
          <caption className="e8-tag">Feedback entries ({ILLUSTRATIVE})</caption>
          <thead>
            <tr>
              {trust === 'custom' && <th scope="col">In list</th>}
              <th scope="col">Client</th>
              <th scope="col">feedbackIndex</th>
              <th scope="col">value</th>
              <th scope="col">valueDecimals</th>
              <th scope="col">tag1</th>
              <th scope="col">Revoked</th>
              <th scope="col">proofOfPayment (off chain)</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {current.entries.map((e) => {
              const r = byAddr.get(e.client);
              const label = r?.label ?? e.client;
              return (
                <tr key={`${e.client}-${e.feedbackIndex}`}>
                  {trust === 'custom' && (
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Include ${label}`}
                        checked={custom.includes(e.client)}
                        onChange={(ev) => setCustom((c) => (ev.target.checked ? [...c, e.client] : c.filter((x) => x !== e.client)))}
                      />
                    </td>
                  )}
                  <td>
                    {label} <code title={e.client}>{e.client.slice(0, 6)}..{e.client.slice(-4)}</code>
                  </td>
                  <td>{e.feedbackIndex}</td>
                  <td>{e.value.toString()}</td>
                  <td>{e.valueDecimals}</td>
                  <td>{e.tag1 || '(empty)'}</td>
                  <td>{e.isRevoked ? 'Yes' : 'No'}</td>
                  <td>{proofLabel(current, e)}</td>
                  <td>
                    <button type="button" className="btn" onClick={() => revoke(e.client, e.feedbackIndex)}>
                      Revoke as {label}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="e8-row">
        <button type="button" className="btn" onClick={() => selfFeedback('owner')}>
          Try feedback from the agent owner
        </button>
        <button type="button" className="btn" onClick={() => selfFeedback('operator')}>
          Try feedback from an operator
        </button>
      </div>
      {log.length > 0 && (
        <ul className="e8-log">
          {log.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      )}
      <details>
        <summary>How getSummary computes the numbers</summary>
        <p>
          The contract loops over your client list in order (a repeated address is counted twice), skips revoked entries and entries whose tag
          differs from a non-empty filter, scales each value to 18 decimals, divides the sum by the count (dropping the remainder toward zero)
          and scales the result to the valueDecimals used most often, the lowest on a tie. An empty list reverts.
        </p>
      </details>
    </div>
  );
}

type Caller = 'owner' | 'operator' | 'stranger';

function WalletPanel({ say }: { say: (s: string) => void }) {
  // Ephemeral key for the new agent wallet: created once per mount, held only in memory.
  const [wallet] = useState(() => privateKeyToAccount(generatePrivateKey()));
  const owner = fixtureAddress('owner');
  const [deadlineIn, setDeadlineIn] = useState(120);
  const [delay, setDelay] = useState(10);
  const [caller, setCaller] = useState<Caller>('owner');
  const [transferred, setTransferred] = useState(false);
  const [signed, setSigned] = useState<{ signature: Hex; deadline: bigint; signedAt: bigint } | null>(null);
  const [result, setResult] = useState<SetWalletResult | null>(null);
  const [showDecoded, setShowDecoded] = useState(true);

  const sign = async () => {
    const signedAt = BigInt(Math.floor(Date.now() / 1000));
    const deadline = signedAt + BigInt(deadlineIn);
    const signature = await wallet.signTypedData(agentWalletTypedData({ agentId: 7n, newWallet: wallet.address, owner, deadline }));
    setSigned({ signature, deadline, signedAt });
    setResult(null);
    say('Signed AgentWalletSet with the new wallet key.');
  };
  const submit = async () => {
    if (!signed) return;
    const currentOwner = transferred ? fixtureAddress('owner', 2) : owner;
    const sender = caller === 'owner' ? currentOwner : caller === 'operator' ? fixtureAddress('operator') : fixtureAddress('honest', 9);
    const r = await checkSetAgentWallet({
      sender,
      owner: currentOwner,
      operators: [fixtureAddress('operator')],
      agentId: 7n,
      newWallet: wallet.address,
      deadline: signed.deadline,
      signature: signed.signature,
      now: signed.signedAt + BigInt(delay),
    });
    setResult(r);
    say(r.ok ? 'setAgentWallet succeeded.' : `setAgentWallet reverted: "${r.revert}".`);
  };
  const td = signed ? agentWalletTypedData({ agentId: 7n, newWallet: wallet.address, owner, deadline: signed.deadline }) : null;

  return (
    <div className="e8-panel">
      <p>
        At registration, agentWallet is the owner&apos;s address. To point it at another wallet, that wallet signs EIP-712 typed data{' '}
        <code>{AGENT_WALLET_TYPE_STRING}</code> under the domain ERC8004IdentityRegistry version 1, and the owner or an operator submits the
        signature with a deadline at most {MAX_DEADLINE_DELAY_SECONDS / 60} minutes ahead.
      </p>
      <p>
        New wallet (key generated in this browser): <code>{wallet.address}</code>. Owner (fixture): <code>{owner}</code>.
      </p>
      <div className="e8-row">
        <Field label="Deadline, seconds after signing">
          {(id) => (
            <select id={id} value={deadlineIn} onChange={(e) => setDeadlineIn(Number(e.target.value))}>
              <option value={120}>120 (within the limit)</option>
              <option value={300}>300 (the limit)</option>
              <option value={900}>900 (too far)</option>
            </select>
          )}
        </Field>
        <button type="button" className="btn" onClick={() => void sign()}>
          Sign with the new wallet
        </button>
      </div>
      {td && signed && (
        <>
          <p className="e8-tag">{ILLUSTRATIVE}</p>
          <pre>{showDecoded ? JSON.stringify(td, (_k, v: unknown) => (typeof v === 'bigint' ? v.toString() : v), 2) : signed.signature}</pre>
          <button type="button" className="btn" aria-pressed={!showDecoded} onClick={() => setShowDecoded((d) => !d)}>
            {showDecoded ? 'Show the signature bytes' : 'Show the typed data'}
          </button>
          <div className="e8-row">
            <Field label={`Seconds until the transaction is mined: ${delay}`}>
              {(id) => <input id={id} type="range" min={0} max={1200} step={10} value={delay} onChange={(e) => setDelay(Number(e.target.value))} />}
            </Field>
            <Field label="Who calls setAgentWallet">
              {(id) => (
                <select id={id} value={caller} onChange={(e) => setCaller(e.target.value as Caller)}>
                  <option value="owner">The owner</option>
                  <option value="operator">An approved operator</option>
                  <option value="stranger">Someone else</option>
                </select>
              )}
            </Field>
            <label>
              <input type="checkbox" checked={transferred} onChange={(e) => setTransferred(e.target.checked)} /> Transfer the agent to a new owner
              before submitting
            </label>
            <button type="button" className="btn" onClick={() => void submit()}>
              Submit setAgentWallet
            </button>
          </div>
        </>
      )}
      {result && (
        <div aria-live="polite">
          <p className={`e8-out e8-out--${result.ok ? 'ok' : 'fail'}`}>
            {result.ok ? (
              <>Accepted. agentWallet is now {wallet.address}.</>
            ) : (
              <>
                Reverted with <code>&quot;{result.revert}&quot;</code>.
              </>
            )}
            {result.recovered && (
              <>
                {' '}
                Recovered signer <code>{result.recovered}</code>.
              </>
            )}
          </p>
          {transferred && !result.ok && result.revert === 'invalid wallet sig' && (
            <p className="e8-tag">The digest includes the current owner, so a signature made for the old owner no longer matches. A transfer also clears agentWallet.</p>
          )}
        </div>
      )}
      <p className="e8-tag">
        {SIMPLIFICATION}: the clock is simulated from your device time plus the delay above. There is no smart contract wallet, so the ERC-1271
        fallback is skipped and a failed recovery ends in &quot;invalid wallet sig&quot;. Nothing is broadcast.
      </p>
    </div>
  );
}

export default function Playground() {
  const [tab, setTab] = useState<Tab>('registration');
  const [announce, setAnnounce] = useState('');
  return (
    <div className="e8">
      <div className="e8-tabs" role="group" aria-label="Simulator">
        {TABS.map(([t, label]) => (
          <button key={t} type="button" className="btn" aria-pressed={tab === t} onClick={() => setTab(t)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'registration' && <RegistrationPanel say={setAnnounce} />}
      {tab === 'reputation' && <ReputationPanel say={setAnnounce} />}
      {tab === 'wallet' && <WalletPanel say={setAnnounce} />}
      <p className="e8-sr" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
