/**
 * Tempo session channel (specs/methods/tempo/draft-tempo-session-00.md), protocol v1:
 * EIP-712 domain { name: "Tempo Stream Channel", version: "1", chainId, verifyingContract: escrowContract },
 * type Voucher(bytes32 channelId, uint128 cumulativeAmount). Vouchers are cumulative, not deltas.
 * Server accounting: acceptedCumulative, spent, settledOnChain, deposit, closeRequestedAt; available =
 * acceptedCumulative - spent. Cooperative close captures max(spent, settledOnChain). Forced close:
 * requestClose(), a grace period of at least 15 minutes, then withdraw(). Session is defined by the Tempo
 * method, not by a standardized intent draft.
 */
import { keccak256, recoverTypedDataAddress, toHex, type Hex } from 'viem';
import { FIXTURE_ESCROW, GRACE_PERIOD_SECONDS, PROBLEM_BASE, SIM_CHAIN_ID } from './fixtures';

export const VOUCHER_TYPES = {
  Voucher: [
    { name: 'channelId', type: 'bytes32' },
    { name: 'cumulativeAmount', type: 'uint128' },
  ],
} as const;

export function voucherDomain(chainId: number = SIM_CHAIN_ID, escrow: string = FIXTURE_ESCROW) {
  return { name: 'Tempo Stream Channel', version: '1', chainId, verifyingContract: escrow as Hex } as const;
}

export function voucherTypedData(channelId: Hex, cumulativeAmount: bigint) {
  return {
    domain: voucherDomain(),
    types: VOUCHER_TYPES,
    primaryType: 'Voucher' as const,
    message: { channelId, cumulativeAmount },
  };
}

export type VoucherTypedData = ReturnType<typeof voucherTypedData>;

export interface VoucherSigner {
  address: Hex;
  signTypedData: (td: VoucherTypedData) => Promise<Hex>;
}

export interface SignedVoucher {
  channelId: Hex;
  cumulativeAmount: bigint;
  signature: Hex;
}

export async function signVoucher(signer: VoucherSigner, channelId: Hex, cumulativeAmount: bigint): Promise<SignedVoucher> {
  const signature = await signer.signTypedData(voucherTypedData(channelId, cumulativeAmount));
  return { channelId, cumulativeAmount, signature };
}

export async function recoverVoucherSigner(v: SignedVoucher): Promise<Hex | null> {
  try {
    return await recoverTypedDataAddress({ ...voucherTypedData(v.channelId, v.cumulativeAmount), signature: v.signature });
  } catch {
    return null;
  }
}

/**
 * Teaching simplification: a channel id from keccak256 of payer, payee, token, salt and escrow. The spec
 * derives it inside the escrow contract with its own encoding; this stand-in only needs to be stable.
 */
export function simulatedChannelId(payer: string, payee: string, token: string, salt: Hex): Hex {
  return keccak256(toHex(`${payer.toLowerCase()}|${payee.toLowerCase()}|${token.toLowerCase()}|${salt}|${FIXTURE_ESCROW.toLowerCase()}|${SIM_CHAIN_ID}`));
}

export type Phase = 'idle' | 'open' | 'close-requested' | 'closed';

export interface ChannelState {
  phase: Phase;
  channelId: Hex | null;
  /** Price per unit in base units (the session request's `amount`). */
  pricePerUnit: bigint;
  minVoucherDelta: bigint;
  deposit: bigint;
  acceptedCumulative: bigint;
  spent: bigint;
  settledOnChain: bigint;
  units: number;
  /** Simulated wall clock in seconds (block.timestamp stand-in). */
  clock: number;
  closeRequestedAt: number;
  /** Amount paid to the payee and refunded to the payer when the channel finalizes. */
  paidToPayee: bigint;
  refundedToPayer: bigint;
}

export function initialChannel(pricePerUnit: bigint, minVoucherDelta: bigint = 0n): ChannelState {
  return {
    phase: 'idle',
    channelId: null,
    pricePerUnit,
    minVoucherDelta,
    deposit: 0n,
    acceptedCumulative: 0n,
    spent: 0n,
    settledOnChain: 0n,
    units: 0,
    clock: 0,
    closeRequestedAt: 0,
    paidToPayee: 0n,
    refundedToPayer: 0n,
  };
}

export type SessionProblem =
  | 'invalid-signature'
  | 'signer-mismatch'
  | 'amount-exceeds-deposit'
  | 'delta-too-small'
  | 'channel-not-found'
  | 'channel-finalized'
  | 'challenge-not-found'
  | 'insufficient-balance';

const SESSION_STATUS: Record<SessionProblem, number> = {
  'invalid-signature': 402,
  'signer-mismatch': 402,
  'amount-exceeds-deposit': 402,
  'delta-too-small': 402,
  'channel-not-found': 410,
  'channel-finalized': 410,
  'challenge-not-found': 402,
  'insufficient-balance': 402,
};

export interface StepResult {
  state: ChannelState;
  ok: boolean;
  status: number;
  /** Problem type URI when rejected. */
  problemType?: string;
  message: string;
  /** Set when the spec names no problem type and the simulation picks one. */
  simplification?: string;
  requiredTopUp?: bigint;
}

function reject(state: ChannelState, code: SessionProblem, message: string, extra: Partial<StepResult> = {}): StepResult {
  return { state, ok: false, status: SESSION_STATUS[code], problemType: `${PROBLEM_BASE}session/${code}`, message, ...extra };
}

export function openChannel(s: ChannelState, channelId: Hex, deposit: bigint): StepResult {
  if (s.phase !== 'idle') return { state: s, ok: false, status: 400, message: 'A channel is already open in this simulation.' };
  if (deposit <= 0n) return { state: s, ok: false, status: 400, message: 'The deposit must be more than zero.' };
  return {
    state: { ...s, phase: 'open', channelId, deposit },
    ok: true,
    status: 200,
    message: `Channel opened with a deposit of ${deposit} base units in escrow.`,
  };
}

export function topUp(s: ChannelState, additional: bigint): StepResult {
  if (s.phase === 'closed') return reject(s, 'channel-finalized', 'The channel is closed.');
  if (s.phase === 'idle') return reject(s, 'channel-not-found', 'No channel is open.');
  if (additional <= 0n) return { state: s, ok: false, status: 400, message: 'additionalDeposit must be more than zero.' };
  return { state: { ...s, deposit: s.deposit + additional }, ok: true, status: 200, message: `Deposit raised by ${additional} base units.` };
}

/**
 * Voucher verification in the spec's order: signature, signer, no pending close, monotonicity (equal is an
 * idempotent retry), minVoucherDelta, and cumulativeAmount <= deposit.
 */
export async function acceptVoucher(s: ChannelState, v: SignedVoucher, expectedSigner: string): Promise<StepResult> {
  if (s.phase === 'idle' || !s.channelId || v.channelId.toLowerCase() !== s.channelId.toLowerCase()) {
    return reject(s, 'channel-not-found', 'No channel with this id exists.');
  }
  if (s.phase === 'closed') return reject(s, 'channel-finalized', 'The channel has been closed.');
  const signer = await recoverVoucherSigner(v);
  if (!signer) return reject(s, 'invalid-signature', 'The voucher signature could not be verified.');
  if (signer.toLowerCase() !== expectedSigner.toLowerCase()) {
    return reject(s, 'signer-mismatch', `The voucher was signed by ${signer}, not the channel signer.`);
  }
  if (s.phase === 'close-requested') {
    return {
      state: s,
      ok: false,
      status: 402,
      problemType: `${PROBLEM_BASE}verification-failed`,
      message: 'A forced close is pending, so the server must reject new vouchers.',
      simplification: 'The spec requires rejection here but names no problem type; the simulation shows verification-failed.',
    };
  }
  if (v.cumulativeAmount < s.acceptedCumulative) {
    return {
      state: s,
      ok: false,
      status: 402,
      problemType: `${PROBLEM_BASE}verification-failed`,
      message: `The voucher amount ${v.cumulativeAmount} is lower than the highest accepted ${s.acceptedCumulative}.`,
      simplification: 'The spec requires rejection here but names no problem type; the simulation shows verification-failed.',
    };
  }
  if (v.cumulativeAmount === s.acceptedCumulative) {
    return { state: s, ok: true, status: 200, message: 'Same amount as the highest voucher: treated as an idempotent retry.' };
  }
  if (v.cumulativeAmount - s.acceptedCumulative < s.minVoucherDelta) {
    return reject(s, 'delta-too-small', `The increase is below minVoucherDelta (${s.minVoucherDelta}).`);
  }
  if (v.cumulativeAmount > s.deposit) {
    return reject(s, 'amount-exceeds-deposit', `The voucher amount ${v.cumulativeAmount} is more than the deposit ${s.deposit}.`);
  }
  return {
    state: { ...s, acceptedCumulative: v.cumulativeAmount },
    ok: true,
    status: 200,
    message: `Voucher accepted: acceptedCumulative is now ${v.cumulativeAmount}.`,
  };
}

/** Serve `units` of metered service if the authorized balance covers it; otherwise ask for a top-up or voucher. */
export function consume(s: ChannelState, units: number): StepResult {
  if (s.phase === 'idle') return reject(s, 'channel-not-found', 'No channel is open.');
  if (s.phase === 'closed') return reject(s, 'channel-finalized', 'The channel has been closed.');
  const cost = s.pricePerUnit * BigInt(units);
  const available = s.acceptedCumulative - s.spent;
  if (available < cost) {
    return reject(s, 'insufficient-balance', `The request costs ${cost} but only ${available} is authorized.`, { requiredTopUp: cost - available });
  }
  return {
    state: { ...s, spent: s.spent + cost, units: s.units + units },
    ok: true,
    status: 200,
    message: `Served ${units} units for ${cost} base units.`,
  };
}

/** Server settles the highest voucher on-chain (allowed at any time, also during the grace period). */
export function settle(s: ChannelState): StepResult {
  if (s.phase === 'idle') return reject(s, 'channel-not-found', 'No channel is open.');
  if (s.phase === 'closed') return reject(s, 'channel-finalized', 'The channel has been closed.');
  return { state: { ...s, settledOnChain: s.acceptedCumulative }, ok: true, status: 200, message: `Settled ${s.acceptedCumulative} on-chain.` };
}

/** Cooperative close: capture max(spent, settledOnChain), refund the rest of the deposit. */
export function cooperativeClose(s: ChannelState): StepResult {
  if (s.phase === 'idle') return reject(s, 'channel-not-found', 'No channel is open.');
  if (s.phase === 'closed') return reject(s, 'channel-finalized', 'The channel has been closed.');
  const capture = s.spent > s.settledOnChain ? s.spent : s.settledOnChain;
  return {
    state: { ...s, phase: 'closed', settledOnChain: capture, paidToPayee: capture, refundedToPayer: s.deposit - capture },
    ok: true,
    status: 200,
    message: `Closed: payee receives ${capture}, payer gets ${s.deposit - capture} back.`,
  };
}

/** Payer calls requestClose(channelId) on-chain; the grace period starts at the current clock. */
export function requestClose(s: ChannelState): StepResult {
  if (s.phase !== 'open') return { state: s, ok: false, status: 400, message: 'requestClose needs an open channel.' };
  return {
    state: { ...s, phase: 'close-requested', closeRequestedAt: s.clock },
    ok: true,
    status: 200,
    message: `Close requested. The payer can withdraw after ${GRACE_PERIOD_SECONDS / 60} minutes.`,
  };
}

export function advanceClock(s: ChannelState, seconds: number): ChannelState {
  return { ...s, clock: s.clock + seconds };
}

export function graceRemaining(s: ChannelState): number {
  if (s.phase !== 'close-requested') return 0;
  return Math.max(0, s.closeRequestedAt + GRACE_PERIOD_SECONDS - s.clock);
}

/** withdraw(channelId): only after closeRequestedAt + CLOSE_GRACE_PERIOD; payer gets deposit - settled. */
export function withdraw(s: ChannelState): StepResult {
  if (s.phase !== 'close-requested') return { state: s, ok: false, status: 400, message: 'withdraw needs a pending close request.' };
  const left = graceRemaining(s);
  if (left > 0) return { state: s, ok: false, status: 400, message: `The grace period has ${left} seconds left; the contract would revert.` };
  return {
    state: { ...s, phase: 'closed', paidToPayee: s.settledOnChain, refundedToPayer: s.deposit - s.settledOnChain },
    ok: true,
    status: 200,
    message: `Withdrawn: payer gets ${s.deposit - s.settledOnChain} back; payee keeps ${s.settledOnChain} settled.`,
  };
}

/**
 * Payer exposure. Vouchers authorize up to acceptedCumulative, and the escrow pays out any signed voucher,
 * so value authorized but not yet served is at risk; the bound is the deposit, because no voucher can exceed it.
 */
export function exposure(s: ChannelState): { unserved: bigint; worstCase: bigint } {
  const unserved = s.acceptedCumulative > s.spent ? s.acceptedCumulative - s.spent : 0n;
  return { unserved, worstCase: s.deposit };
}

/** Session receipt fields (draft-tempo-session-00, Receipt Generation). */
export function sessionReceipt(s: ChannelState, challengeId: string, timestamp: string, units?: number) {
  return {
    method: 'tempo',
    intent: 'session',
    status: 'success' as const,
    timestamp,
    reference: s.channelId ?? '',
    challengeId,
    channelId: s.channelId ?? '',
    acceptedCumulative: s.acceptedCumulative.toString(),
    spent: s.spent.toString(),
    ...(units !== undefined ? { units } : {}),
  };
}

/** Voucher credential payload (action "voucher" or "close"; v1 has no descriptor). */
export function voucherPayload(action: 'voucher' | 'close', v: SignedVoucher) {
  return { action, channelId: v.channelId, cumulativeAmount: v.cumulativeAmount.toString(), signature: v.signature };
}
