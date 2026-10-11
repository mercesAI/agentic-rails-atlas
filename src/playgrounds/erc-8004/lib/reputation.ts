/**
 * In-memory model of the Reputation Registry, mirroring ReputationRegistryUpgradeable.sol (version 2.0.0):
 * giveFeedback, revokeFeedback and getSummary, with the contract's revert strings and its summary math
 * (normalize to 18 decimals, average with truncating division, rescale to the most frequent valueDecimals).
 * The off-chain feedback file (with proofOfPayment) sits next to each entry; the registry never reads it.
 */
import { getAddress, type Address } from 'viem';
import { FIXTURE_IDENTITY_REGISTRY, SIM_CHAIN_ID, SIM_NAMESPACE } from './fixtures';

/** `MAX_ABS_VALUE = 1e38` in the contract. */
export const MAX_ABS_VALUE = 10n ** 38n;

export interface ProofOfPayment {
  fromAddress: string;
  toAddress: string;
  chainId: string;
  txHash: string;
}

/** Off-chain feedback file (Draft text, "Off-Chain Feedback File Structure"). Only the fields the simulation uses. */
export interface FeedbackFile {
  agentRegistry: string;
  agentId: number;
  clientAddress: string;
  createdAt: string;
  value: number;
  valueDecimals: number;
  tag1?: string;
  tag2?: string;
  proofOfPayment?: ProofOfPayment;
}

/** What the contract stores per entry, plus the client, index and the off-chain file for the simulation. */
export interface FeedbackEntry {
  client: Address;
  feedbackIndex: number;
  value: bigint;
  valueDecimals: number;
  tag1: string;
  tag2: string;
  isRevoked: boolean;
  file?: FeedbackFile;
}

export type ReviewerKind = 'honest' | 'sybil' | 'watchtower';

export interface RegistryState {
  agentId: number;
  owner: Address;
  operators: Address[];
  agentWallet: Address;
  entries: FeedbackEntry[];
}

export type Revert =
  | 'too many decimals'
  | 'value too large'
  | 'Self-feedback not allowed'
  | 'index must be > 0'
  | 'index out of bounds'
  | 'Already revoked'
  | 'clientAddresses required';

export type Result<T> = { ok: true; value: T } | { ok: false; revert: Revert };

export function lastIndex(state: RegistryState, client: Address): number {
  return state.entries.filter((e) => e.client === client).reduce((m, e) => Math.max(m, e.feedbackIndex), 0);
}

export interface GiveFeedbackInput {
  sender: Address;
  value: bigint;
  valueDecimals: number;
  tag1?: string;
  tag2?: string;
  file?: Omit<FeedbackFile, 'agentRegistry' | 'agentId' | 'clientAddress' | 'value' | 'valueDecimals'>;
}

/** Mirrors giveFeedback: decimals bound, value bound, then the self-feedback check, then a 1-indexed counter. */
export function giveFeedback(state: RegistryState, input: GiveFeedbackInput): Result<RegistryState> {
  if (input.valueDecimals > 18 || input.valueDecimals < 0) return { ok: false, revert: 'too many decimals' };
  if (input.value < -MAX_ABS_VALUE || input.value > MAX_ABS_VALUE) return { ok: false, revert: 'value too large' };
  if (input.sender === state.owner || state.operators.includes(input.sender)) return { ok: false, revert: 'Self-feedback not allowed' };
  const feedbackIndex = lastIndex(state, input.sender) + 1;
  const tag1 = input.tag1 ?? '';
  const tag2 = input.tag2 ?? '';
  const entry: FeedbackEntry = {
    client: input.sender,
    feedbackIndex,
    value: input.value,
    valueDecimals: input.valueDecimals,
    tag1,
    tag2,
    isRevoked: false,
    file: input.file
      ? {
          agentRegistry: `${SIM_NAMESPACE}:${SIM_CHAIN_ID}:${FIXTURE_IDENTITY_REGISTRY}`,
          agentId: state.agentId,
          clientAddress: `${SIM_NAMESPACE}:${SIM_CHAIN_ID}:${input.sender}`,
          value: Number(input.value),
          valueDecimals: input.valueDecimals,
          ...(tag1 ? { tag1 } : {}),
          ...(tag2 ? { tag2 } : {}),
          ...input.file,
        }
      : undefined,
  };
  return { ok: true, value: { ...state, entries: [...state.entries, entry] } };
}

/** Mirrors revokeFeedback: only the client that gave the feedback can revoke it, once. */
export function revokeFeedback(state: RegistryState, sender: Address, feedbackIndex: number): Result<RegistryState> {
  if (feedbackIndex <= 0) return { ok: false, revert: 'index must be > 0' };
  if (feedbackIndex > lastIndex(state, sender)) return { ok: false, revert: 'index out of bounds' };
  const target = state.entries.find((e) => e.client === sender && e.feedbackIndex === feedbackIndex)!;
  if (target.isRevoked) return { ok: false, revert: 'Already revoked' };
  return { ok: true, value: { ...state, entries: state.entries.map((e) => (e === target ? { ...e, isRevoked: true } : e)) } };
}

export interface Summary {
  count: bigint;
  summaryValue: bigint;
  summaryValueDecimals: number;
}

/**
 * Mirrors getSummary(agentId, clientAddresses, tag1, tag2). Loops over the given clients in order (a duplicate
 * address is counted twice, as in the contract), skips revoked entries and entries whose tags differ from a
 * non-empty filter, sums values normalized to 18 decimals, divides by count (truncating toward zero) and
 * rescales to the most frequent valueDecimals (lowest wins a tie).
 */
export function getSummary(state: RegistryState, clientAddresses: readonly Address[], tag1 = '', tag2 = ''): Result<Summary> {
  if (clientAddresses.length === 0) return { ok: false, revert: 'clientAddresses required' };
  let sum = 0n;
  let count = 0n;
  const decimalCounts = new Array<number>(19).fill(0);
  for (const client of clientAddresses) {
    const own = state.entries.filter((e) => e.client === client).sort((a, b) => a.feedbackIndex - b.feedbackIndex);
    for (const fb of own) {
      if (fb.isRevoked) continue;
      if (tag1 !== '' && tag1 !== fb.tag1) continue;
      if (tag2 !== '' && tag2 !== fb.tag2) continue;
      sum += fb.value * 10n ** BigInt(18 - fb.valueDecimals);
      decimalCounts[fb.valueDecimals] = (decimalCounts[fb.valueDecimals] ?? 0) + 1;
      count++;
    }
  }
  if (count === 0n) return { ok: true, value: { count: 0n, summaryValue: 0n, summaryValueDecimals: 0 } };
  let modeDecimals = 0;
  let maxCount = 0;
  for (let d = 0; d <= 18; d++) {
    if (decimalCounts[d]! > maxCount) {
      maxCount = decimalCounts[d]!;
      modeDecimals = d;
    }
  }
  const avgWad = sum / count; // BigInt division truncates toward zero, like Solidity int256 division
  return { ok: true, value: { count, summaryValue: avgWad / 10n ** BigInt(18 - modeDecimals), summaryValueDecimals: modeDecimals } };
}

/** Formats a fixed-point value for display, for example (9977n, 2) to "99.77". */
export function formatFixed(value: bigint, decimals: number): string {
  if (decimals === 0) return value.toString();
  const neg = value < 0n;
  const abs = neg ? -value : value;
  const s = abs.toString().padStart(decimals + 1, '0');
  return `${neg ? '-' : ''}${s.slice(0, -decimals)}.${s.slice(-decimals)}`;
}

/** True when the off-chain file carries a proofOfPayment from the client to the agent wallet. */
export function hasMatchingProof(entry: FeedbackEntry, agentWallet: Address): boolean {
  const p = entry.file?.proofOfPayment;
  if (!p) return false;
  return p.toAddress.toLowerCase() === agentWallet.toLowerCase() && p.fromAddress.toLowerCase() === entry.client.toLowerCase();
}

export interface WeightedSummary {
  count: number;
  weightTotal: number;
  /** Weighted mean in human units, or null when no entry matched. */
  mean: number | null;
}

/**
 * Teaching simplification: an off-chain aggregator that weights each entry by whether its feedback file carries a
 * proof of payment to the agent wallet. A real indexer would also look the transaction up on the chain.
 */
export function weightedSummary(
  state: RegistryState,
  clientAddresses: readonly Address[] | null,
  tag1: string,
  weights: { paid: number; unpaid: number },
): WeightedSummary {
  const allow = clientAddresses ? new Set(clientAddresses) : null;
  let total = 0;
  let wsum = 0;
  let count = 0;
  for (const e of state.entries) {
    if (e.isRevoked) continue;
    if (allow && !allow.has(e.client)) continue;
    if (tag1 !== '' && e.tag1 !== tag1) continue;
    const w = hasMatchingProof(e, state.agentWallet) ? weights.paid : weights.unpaid;
    if (w <= 0) continue;
    total += w * (Number(e.value) / 10 ** e.valueDecimals);
    wsum += w;
    count++;
  }
  return { count, weightTotal: wsum, mean: wsum > 0 ? total / wsum : null };
}

/** Deterministic fixture address: a kind marker in the first bytes and a counter at the end. */
export function fixtureAddress(kind: 'owner' | 'operator' | 'wallet' | ReviewerKind | 'sybilsink', i = 0): Address {
  const marks = { owner: '0a', operator: '0b', wallet: '0c', honest: 'a1', sybil: '5b', watchtower: 'f7', sybilsink: '5c' } as const;
  return getAddress(`0x${marks[kind]}${'0'.repeat(34)}${i.toString(16).padStart(4, '0')}`);
}

export interface ScenarioOptions {
  honest: number;
  sybils: number;
  /** boost: Sybils post top scores; smear: Sybils post zero to hurt the agent. */
  sybilMode: 'boost' | 'smear';
  /** Sybils attach a proofOfPayment, but to an address they control, not the agent wallet. */
  sybilFakeProof: boolean;
  /** Add a watchtower that posts a reachable=1 ping (a different tag on the same agent). */
  watchtower: boolean;
}

export const DEFAULT_SCENARIO: ScenarioOptions = { honest: 4, sybils: 6, sybilMode: 'boost', sybilFakeProof: false, watchtower: true };

/** Honest scores on the 0 to 100 starred scale; one is given with one decimal place. */
const HONEST_SCORES: [bigint, number][] = [
  [72n, 0],
  [80n, 0],
  [645n, 1],
  [88n, 0],
  [60n, 0],
  [91n, 0],
  [77n, 0],
  [69n, 0],
];

function fakeTxHash(seed: number): string {
  return `0x${seed.toString(16).padStart(8, '0').repeat(8)}`;
}

export interface Reviewer {
  address: Address;
  kind: ReviewerKind;
  label: string;
}

/** Builds a registry with honest, Sybil and watchtower feedback. Every value is a fixture. */
export function buildScenario(opt: ScenarioOptions, agentId = 7): { state: RegistryState; reviewers: Reviewer[] } {
  let state: RegistryState = {
    agentId,
    owner: fixtureAddress('owner'),
    operators: [fixtureAddress('operator')],
    agentWallet: fixtureAddress('wallet'),
    entries: [],
  };
  const reviewers: Reviewer[] = [];
  const at = (n: number) => `2026-10-${String(1 + (n % 9)).padStart(2, '0')}T12:00:00Z`;
  for (let i = 0; i < opt.honest; i++) {
    const address = fixtureAddress('honest', i + 1);
    const [value, valueDecimals] = HONEST_SCORES[i % HONEST_SCORES.length]!;
    reviewers.push({ address, kind: 'honest', label: `Honest client ${i + 1}` });
    const r = giveFeedback(state, {
      sender: address,
      value,
      valueDecimals,
      tag1: 'starred',
      file: {
        createdAt: at(i),
        proofOfPayment: { fromAddress: address, toAddress: state.agentWallet, chainId: String(SIM_CHAIN_ID), txHash: fakeTxHash(0xa100 + i) },
      },
    });
    if (r.ok) state = r.value;
  }
  for (let i = 0; i < opt.sybils; i++) {
    const address = fixtureAddress('sybil', i + 1);
    reviewers.push({ address, kind: 'sybil', label: `Sybil ${i + 1}` });
    const sink = fixtureAddress('sybilsink', i + 1);
    const r = giveFeedback(state, {
      sender: address,
      value: opt.sybilMode === 'boost' ? 100n : 0n,
      valueDecimals: 0,
      tag1: 'starred',
      file: {
        createdAt: at(i + 3),
        ...(opt.sybilFakeProof
          ? { proofOfPayment: { fromAddress: address, toAddress: sink, chainId: String(SIM_CHAIN_ID), txHash: fakeTxHash(0x5b00 + i) } }
          : {}),
      },
    });
    if (r.ok) state = r.value;
  }
  if (opt.watchtower) {
    const address = fixtureAddress('watchtower', 1);
    reviewers.push({ address, kind: 'watchtower', label: 'Watchtower' });
    const r = giveFeedback(state, { sender: address, value: 1n, valueDecimals: 0, tag1: 'reachable', file: { createdAt: at(8) } });
    if (r.ok) state = r.value;
  }
  return { state, reviewers };
}
