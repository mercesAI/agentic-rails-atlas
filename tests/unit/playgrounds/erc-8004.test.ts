import { describe, expect, it } from 'vitest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { zeroAddress, type Address } from 'viem';
import {
  FIXTURE_IDENTITY_REGISTRY,
  ILLUSTRATIVE,
  LISTED_ADDRESSES,
  REGISTRATION_TYPE,
  SIM_CHAIN_ID,
  sampleRegistration,
} from '@/playgrounds/erc-8004/lib/fixtures';
import {
  REGISTRATION_SCHEMA,
  SCHEMA_LABEL,
  classifyAgentUri,
  composeGlobalId,
  fromDataUri,
  parseAgentRegistry,
  toDataUri,
  validateRegistration,
  validateRegistrationText,
  validateSchema,
} from '@/playgrounds/erc-8004/lib/registration';
import {
  DEFAULT_SCENARIO,
  MAX_ABS_VALUE,
  buildScenario,
  fixtureAddress,
  formatFixed,
  getSummary,
  giveFeedback,
  hasMatchingProof,
  lastIndex,
  revokeFeedback,
  weightedSummary,
  type RegistryState,
} from '@/playgrounds/erc-8004/lib/reputation';
import {
  AGENT_WALLET_TYPE_STRING,
  agentWalletDigest,
  agentWalletTypedData,
  checkSetAgentWallet,
} from '@/playgrounds/erc-8004/lib/wallet';

function emptyState(): RegistryState {
  return { agentId: 7, owner: fixtureAddress('owner'), operators: [fixtureAddress('operator')], agentWallet: fixtureAddress('wallet'), entries: [] };
}

function must<T>(r: { ok: true; value: T } | { ok: false; revert: string }): T {
  if (!r.ok) throw new Error(r.revert);
  return r.value;
}

describe('erc-8004 fixtures', () => {
  it('uses the fake chain and the Draft label', () => {
    expect(SIM_CHAIN_ID).toBe(424242);
    expect(ILLUSTRATIVE).toBe('Illustrative example, ERC-8004 (Draft)');
    expect(FIXTURE_IDENTITY_REGISTRY).not.toBe(LISTED_ADDRESSES.mainnetIdentity);
  });
  it('sample registration passes the derived schema', () => {
    const s = sampleRegistration(3);
    expect(s.type).toBe(REGISTRATION_TYPE);
    expect(validateRegistration(s).ok).toBe(true);
  });
});

describe('erc-8004 registration schema', () => {
  it('labels the schema as derived', () => {
    expect(SCHEMA_LABEL).toMatch(/derived from the spec text/i);
    expect(REGISTRATION_SCHEMA.required).toEqual(expect.arrayContaining(['x402Support', 'active', 'registrations']));
  });
  it('validateSchema reports type, const, required and pattern errors', () => {
    const errs = validateSchema(
      { type: 'x', name: '', description: 'd', image: 'i', services: [{ name: 'web' }], x402Support: 'yes', active: true, registrations: [{ agentId: -1, agentRegistry: 'eip155:1' }] },
      REGISTRATION_SCHEMA,
    );
    const paths = errs.map((e) => e.path);
    expect(paths).toEqual(expect.arrayContaining(['$.type', '$.name', '$.services[0].endpoint', '$.x402Support', '$.registrations[0].agentId', '$.registrations[0].agentRegistry']));
  });
  it('validateRegistrationText rejects bad JSON and missing fields', () => {
    expect(validateRegistrationText('{').ok).toBe(false);
    const r = validateRegistrationText(JSON.stringify({ type: REGISTRATION_TYPE }));
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.message.includes('"services"'))).toBe(true);
  });
  it('validateRegistration adds SHOULD warnings and notes', () => {
    const s = { ...sampleRegistration(), registrations: [], supportedTrust: [] };
    const r = validateRegistration(s);
    expect(r.ok).toBe(true);
    expect(r.issues.some((i) => i.level === 'warning' && i.path === '$.registrations')).toBe(true);
    expect(r.issues.some((i) => i.level === 'note' && i.path === '$.supportedTrust')).toBe(true);
    expect(r.issues.some((i) => i.path === '$.services[0].version')).toBe(true);
  });
  it('classifyAgentUri knows the three example schemes', () => {
    expect(classifyAgentUri('ipfs://bafy').scheme).toBe('ipfs');
    expect(classifyAgentUri('https://a.example/x.json').scheme).toBe('https');
    expect(classifyAgentUri('data:application/json;base64,e30=').issue).toBeUndefined();
    expect(classifyAgentUri('data:application/json,{}').issue?.level).toBe('warning');
    expect(classifyAgentUri('http://a.example').scheme).toBe('other');
  });
  it('toDataUri and fromDataUri round-trip UTF-8', () => {
    const file = { ...sampleRegistration(), name: 'Agent café' };
    const uri = toDataUri(file);
    expect(uri.startsWith('data:application/json;base64,')).toBe(true);
    expect(fromDataUri(uri)).toEqual(file);
    expect(() => fromDataUri('https://x')).toThrow();
  });
});

describe('erc-8004 global id', () => {
  it('composeGlobalId builds agentRegistry and the registrations entry', () => {
    const g = composeGlobalId({ namespace: 'eip155', chainId: '424242', identityRegistry: FIXTURE_IDENTITY_REGISTRY, agentId: '12' });
    expect(g.ok).toBe(true);
    expect(g.agentRegistry).toBe(`eip155:424242:${FIXTURE_IDENTITY_REGISTRY}`);
    expect(g.registrationEntry).toEqual({ agentId: 12, agentRegistry: g.agentRegistry });
  });
  it('composeGlobalId reports each bad part', () => {
    const g = composeGlobalId({ namespace: 'solana', chainId: '0', identityRegistry: '0x12', agentId: '-1' });
    expect(g.ok).toBe(false);
    expect(g.errors).toHaveLength(4);
  });
  it('parseAgentRegistry splits the three parts', () => {
    expect(parseAgentRegistry(`eip155:424242:${FIXTURE_IDENTITY_REGISTRY}`)).toEqual({ namespace: 'eip155', chainId: '424242', identityRegistry: FIXTURE_IDENTITY_REGISTRY });
    expect(parseAgentRegistry('eip155:1')).toBeNull();
  });
});

describe('erc-8004 reputation registry', () => {
  const client: Address = fixtureAddress('honest', 1);
  it('giveFeedback stores a 1-indexed entry per client', () => {
    let s = must(giveFeedback(emptyState(), { sender: client, value: 87n, valueDecimals: 0, tag1: 'starred' }));
    s = must(giveFeedback(s, { sender: client, value: 90n, valueDecimals: 0 }));
    expect(s.entries.map((e) => e.feedbackIndex)).toEqual([1, 2]);
    expect(lastIndex(s, client)).toBe(2);
  });
  it('giveFeedback reverts like the contract', () => {
    const s = emptyState();
    expect(giveFeedback(s, { sender: client, value: 1n, valueDecimals: 19 })).toEqual({ ok: false, revert: 'too many decimals' });
    expect(giveFeedback(s, { sender: client, value: MAX_ABS_VALUE + 1n, valueDecimals: 0 })).toEqual({ ok: false, revert: 'value too large' });
    expect(giveFeedback(s, { sender: s.owner, value: 100n, valueDecimals: 0 })).toEqual({ ok: false, revert: 'Self-feedback not allowed' });
    expect(giveFeedback(s, { sender: s.operators[0]!, value: 100n, valueDecimals: 0 })).toEqual({ ok: false, revert: 'Self-feedback not allowed' });
  });
  it('giveFeedback builds the off-chain file with the required fields', () => {
    const s = must(giveFeedback(emptyState(), { sender: client, value: 5n, valueDecimals: 0, file: { createdAt: '2026-10-01T12:00:00Z' } }));
    const f = s.entries[0]!.file!;
    expect(Object.keys(f)).toEqual(expect.arrayContaining(['agentRegistry', 'agentId', 'clientAddress', 'createdAt', 'value', 'valueDecimals']));
    expect(f.clientAddress).toBe(`eip155:424242:${client}`);
  });
  it('revokeFeedback follows the contract checks', () => {
    let s = must(giveFeedback(emptyState(), { sender: client, value: 10n, valueDecimals: 0 }));
    expect(revokeFeedback(s, client, 0)).toEqual({ ok: false, revert: 'index must be > 0' });
    expect(revokeFeedback(s, client, 2)).toEqual({ ok: false, revert: 'index out of bounds' });
    expect(revokeFeedback(s, fixtureAddress('honest', 2), 1)).toEqual({ ok: false, revert: 'index out of bounds' });
    s = must(revokeFeedback(s, client, 1));
    expect(s.entries[0]!.isRevoked).toBe(true);
    expect(revokeFeedback(s, client, 1)).toEqual({ ok: false, revert: 'Already revoked' });
  });
  it('getSummary needs a client list', () => {
    expect(getSummary(emptyState(), [])).toEqual({ ok: false, revert: 'clientAddresses required' });
    expect(must(getSummary(emptyState(), [client]))).toEqual({ count: 0n, summaryValue: 0n, summaryValueDecimals: 0 });
  });
  it('getSummary normalizes, truncates and rescales to the mode decimals', () => {
    const a = fixtureAddress('honest', 1);
    const b = fixtureAddress('honest', 2);
    let s = must(giveFeedback(emptyState(), { sender: a, value: 9977n, valueDecimals: 2, tag1: 'uptime' }));
    s = must(giveFeedback(s, { sender: b, value: 99n, valueDecimals: 0, tag1: 'uptime' }));
    s = must(giveFeedback(s, { sender: b, value: 98n, valueDecimals: 0, tag1: 'uptime' }));
    // (99.77 + 99 + 98) / 3 = 98.9233..., mode decimals 0, truncated to 98
    expect(must(getSummary(s, [a, b], 'uptime'))).toEqual({ count: 3n, summaryValue: 98n, summaryValueDecimals: 0 });
    // only a: 99.77 with decimals 2
    expect(must(getSummary(s, [a]))).toEqual({ count: 1n, summaryValue: 9977n, summaryValueDecimals: 2 });
  });
  it('getSummary breaks a decimals tie toward the lowest and truncates negatives toward zero', () => {
    const a = fixtureAddress('honest', 1);
    const b = fixtureAddress('honest', 2);
    let s = must(giveFeedback(emptyState(), { sender: a, value: -32n, valueDecimals: 1 }));
    s = must(giveFeedback(s, { sender: b, value: -4n, valueDecimals: 0 }));
    // (-3.2 + -4) / 2 = -3.6, tie between 0 and 1 decimals picks 0, truncation toward zero gives -3
    expect(must(getSummary(s, [a, b]))).toEqual({ count: 2n, summaryValue: -3n, summaryValueDecimals: 0 });
  });
  it('getSummary skips revoked entries, filters tags and counts a duplicate client twice', () => {
    const { state, reviewers } = buildScenario({ ...DEFAULT_SCENARIO, sybils: 0, watchtower: true });
    const honest = reviewers.filter((r) => r.kind === 'honest').map((r) => r.address);
    const all = reviewers.map((r) => r.address);
    expect(must(getSummary(state, all)).count).toBe(5n);
    expect(must(getSummary(state, all, 'starred')).count).toBe(4n);
    const revoked = must(revokeFeedback(state, honest[0]!, 1));
    expect(must(getSummary(revoked, honest, 'starred')).count).toBe(3n);
    expect(must(getSummary(state, [honest[0]!, honest[0]!])).count).toBe(2n);
  });
  it('a Sybil boost moves the unfiltered average but not the trusted one', () => {
    const { state, reviewers } = buildScenario(DEFAULT_SCENARIO);
    const all = reviewers.map((r) => r.address);
    const honest = reviewers.filter((r) => r.kind === 'honest').map((r) => r.address);
    const everyone = must(getSummary(state, all, 'starred'));
    const trusted = must(getSummary(state, honest, 'starred'));
    expect(everyone.count).toBe(10n);
    expect(trusted.count).toBe(4n);
    // honest: 72, 80, 64.5, 88 -> mean 76.125, mode decimals 0 -> 76
    expect(trusted).toEqual({ count: 4n, summaryValue: 76n, summaryValueDecimals: 0 });
    expect(everyone.summaryValue > trusted.summaryValue).toBe(true);
  });
  it('formatFixed renders fixed-point values', () => {
    expect(formatFixed(9977n, 2)).toBe('99.77');
    expect(formatFixed(-32n, 1)).toBe('-3.2');
    expect(formatFixed(5n, 3)).toBe('0.005');
    expect(formatFixed(87n, 0)).toBe('87');
  });
  it('hasMatchingProof requires client to agent wallet', () => {
    const { state } = buildScenario({ ...DEFAULT_SCENARIO, sybilFakeProof: true });
    const honest = state.entries.find((e) => e.tag1 === 'starred' && e.value !== 100n)!;
    const sybil = state.entries.find((e) => e.value === 100n)!;
    expect(hasMatchingProof(honest, state.agentWallet)).toBe(true);
    expect(sybil.file?.proofOfPayment).toBeDefined();
    expect(hasMatchingProof(sybil, state.agentWallet)).toBe(false);
  });
  it('weightedSummary discounts feedback without a proof of payment', () => {
    const { state } = buildScenario(DEFAULT_SCENARIO);
    const flat = weightedSummary(state, null, 'starred', { paid: 1, unpaid: 1 });
    const paidOnly = weightedSummary(state, null, 'starred', { paid: 1, unpaid: 0 });
    expect(flat.count).toBe(10);
    expect(paidOnly.count).toBe(4);
    expect(paidOnly.mean).toBeCloseTo(76.125, 6);
    expect(flat.mean!).toBeGreaterThan(paidOnly.mean!);
    expect(weightedSummary(state, [], 'starred', { paid: 1, unpaid: 1 }).mean).toBeNull();
  });
  it('buildScenario smear mode posts zeros', () => {
    const { state } = buildScenario({ ...DEFAULT_SCENARIO, sybilMode: 'smear', watchtower: false });
    expect(state.entries.filter((e) => e.value === 0n)).toHaveLength(6);
  });
  it('fixtureAddress is deterministic and distinct per kind', () => {
    expect(fixtureAddress('honest', 1)).toBe(fixtureAddress('honest', 1));
    expect(fixtureAddress('honest', 1)).not.toBe(fixtureAddress('sybil', 1));
  });
});

describe('erc-8004 setAgentWallet', () => {
  const owner = fixtureAddress('owner');
  const now = 1_800_000_000n;
  it('typed data matches the contract type string and domain', () => {
    const td = agentWalletTypedData({ agentId: 7n, newWallet: owner, owner, deadline: now });
    expect(AGENT_WALLET_TYPE_STRING).toBe(`AgentWalletSet(${td.types.AgentWalletSet.map((f) => `${f.type} ${f.name}`).join(',')})`);
    expect(td.domain).toEqual({ name: 'ERC8004IdentityRegistry', version: '1', chainId: 424242, verifyingContract: FIXTURE_IDENTITY_REGISTRY });
    expect(agentWalletDigest({ agentId: 7n, newWallet: owner, owner, deadline: now })).toMatch(/^0x[0-9a-f]{64}$/);
  });
  it('accepts a signature from the new wallet and rejects the failure cases', async () => {
    const wallet = privateKeyToAccount(generatePrivateKey());
    const deadline = now + 120n;
    const message = { agentId: 7n, newWallet: wallet.address, owner, deadline };
    const signature = await wallet.signTypedData(agentWalletTypedData(message));
    const base = { sender: owner, owner, operators: [], agentId: 7n, newWallet: wallet.address, deadline, signature, now };
    const ok = await checkSetAgentWallet(base);
    expect(ok.ok).toBe(true);
    expect(ok.recovered).toBe(wallet.address);
    expect((await checkSetAgentWallet({ ...base, sender: fixtureAddress('honest', 1) })).revert).toBe('Not authorized');
    expect((await checkSetAgentWallet({ ...base, newWallet: zeroAddress })).revert).toBe('bad wallet');
    expect((await checkSetAgentWallet({ ...base, now: deadline + 1n })).revert).toBe('expired');
    expect((await checkSetAgentWallet({ ...base, deadline: now + 301n })).revert).toBe('deadline too far');
    expect((await checkSetAgentWallet({ ...base, owner: fixtureAddress('owner', 2), sender: fixtureAddress('owner', 2) })).revert).toBe('invalid wallet sig');
    expect((await checkSetAgentWallet({ ...base, signature: '0x1234' })).revert).toBe('invalid wallet sig');
  });
});
