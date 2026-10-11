/**
 * Simulated facilitator: POST /verify and POST /settle over an in-memory ledger.
 *
 * Check order mirrors the TypeScript SDK facilitators (@x402/evm in research/vendor/x402/typescript):
 * - exact, eip3009 (mechanisms/evm/src/exact/facilitator/eip3009.ts): scheme, network, signature,
 *   recipient, validBefore (with a 6 second buffer), validAfter, value, then simulation
 *   (nonce state before balance, as in eip3009-utils.ts).
 * - upto, permit2 (mechanisms/evm/src/upto/facilitator/permit2.ts): scheme, network, spender, recipient,
 *   facilitator, deadline (6 second buffer), validAfter, amount, token, signature, then simulation.
 *
 * Error strings: where spec section 9 (v2) or section 9 (v1) defines a code, `invalidReason` uses it and
 * the SDK constant is shown next to it; where the spec defines none, the SDK constant is used and labeled.
 */
import { getAddress, keccak256, type Hex } from 'viem';
import { FIXTURE_FACILITATOR, FIXTURE_TOKEN, UPTO_PERMIT2_PROXY, type Version } from './fixtures';
import { amountOf, type PaymentPayload, type Requirements, type SettleResponse, type VerifyResponse } from './messages';
import {
  permitWitnessTypedData,
  recoverSigner,
  sameAddress,
  transferWithAuthorizationTypedData,
  type Eip3009Authorization,
  type UptoPermit2Authorization,
} from './typed-data';

export interface ErrorCode {
  /** Code from the spec's error list, or null when the spec lists none for this case. */
  spec: string | null;
  /** Constant the TypeScript SDK returns for the same case. */
  sdk: string;
}

export const EXACT_CODES = {
  scheme: { spec: 'invalid_scheme', sdk: 'invalid_exact_evm_scheme' },
  network: { spec: 'invalid_network', sdk: 'invalid_exact_evm_network_mismatch' },
  signature: { spec: 'invalid_exact_evm_payload_signature', sdk: 'invalid_exact_evm_signature' },
  recipient: { spec: 'invalid_exact_evm_payload_recipient_mismatch', sdk: 'invalid_exact_evm_recipient_mismatch' },
  validBefore: {
    spec: 'invalid_exact_evm_payload_authorization_valid_before',
    sdk: 'invalid_exact_evm_payload_authorization_valid_before',
  },
  validAfter: {
    spec: 'invalid_exact_evm_payload_authorization_valid_after',
    sdk: 'invalid_exact_evm_payload_authorization_valid_after',
  },
  value: {
    spec: 'invalid_exact_evm_payload_authorization_value_mismatch',
    sdk: 'invalid_exact_evm_payload_authorization_value_mismatch',
  },
  nonceUsed: { spec: null, sdk: 'invalid_exact_evm_nonce_already_used' },
  balance: { spec: 'insufficient_funds', sdk: 'invalid_exact_evm_insufficient_balance' },
} as const satisfies Record<string, ErrorCode>;

/** V1 names the amount error differently (spec v1 section 9). */
export const EXACT_VALUE_CODE_V1: ErrorCode = {
  spec: 'invalid_exact_evm_payload_authorization_value',
  sdk: 'invalid_exact_evm_payload_authorization_value_mismatch',
};

export const PERMIT2_CODES = {
  scheme: { spec: 'invalid_scheme', sdk: 'invalid_upto_evm_scheme' },
  network: { spec: 'invalid_network', sdk: 'invalid_upto_evm_network_mismatch' },
  spender: { spec: null, sdk: 'invalid_permit2_spender' },
  recipient: { spec: null, sdk: 'invalid_permit2_recipient_mismatch' },
  facilitator: { spec: null, sdk: 'upto_facilitator_mismatch' },
  deadline: { spec: null, sdk: 'permit2_deadline_expired' },
  validAfter: { spec: null, sdk: 'permit2_not_yet_valid' },
  amount: { spec: null, sdk: 'permit2_amount_mismatch' },
  token: { spec: null, sdk: 'permit2_token_mismatch' },
  signature: { spec: null, sdk: 'invalid_permit2_signature' },
  balance: { spec: 'insufficient_funds', sdk: 'permit2_insufficient_balance' },
  nonceUsed: { spec: null, sdk: 'permit2_simulation_failed' },
  settleExceeds: { spec: null, sdk: 'invalid_upto_evm_payload_settlement_exceeds_amount' },
} as const satisfies Record<string, ErrorCode>;

/** The string that goes on the wire: the spec code when there is one, otherwise the SDK constant. */
export function reasonOf(code: ErrorCode): string {
  return code.spec ?? code.sdk;
}

export interface Check {
  label: string;
  ok: boolean;
  detail: string;
}

export interface Ledger {
  balances: Map<string, bigint>;
  usedNonces: Set<string>;
}

export function createLedger(entries: [string, bigint][] = []): Ledger {
  return { balances: new Map(entries.map(([a, b]) => [a.toLowerCase(), b])), usedNonces: new Set() };
}

export function balanceOf(ledger: Ledger, address: string): bigint {
  return ledger.balances.get(address.toLowerCase()) ?? 0n;
}

export function nonceKey(from: string, nonce: string): string {
  return `${from.toLowerCase()}:${nonce.toLowerCase()}`;
}

export interface VerifyOutcome {
  response: VerifyResponse;
  checks: Check[];
  code?: ErrorCode;
}

export interface FacilitatorContext {
  version: Version;
  /** Facilitator clock, unix seconds. */
  now: number;
  ledger: Ledger;
  /** Expected network string for this version. */
  network: string;
  /** `settle` makes the upto amount check phase-dependent (scheme_upto.md, property 5). */
  phase?: 'verify' | 'settle';
}

function schemePayloadOf(payload: PaymentPayload): Record<string, unknown> {
  return payload.payload;
}

function schemeOf(payload: PaymentPayload): string {
  return payload.x402Version === 2 ? payload.accepted.scheme : payload.scheme;
}

function networkOfPayload(payload: PaymentPayload): string {
  return payload.x402Version === 2 ? payload.accepted.network : payload.network;
}

function fail(checks: Check[], code: ErrorCode, payer: string | undefined, label: string, detail: string): VerifyOutcome {
  checks.push({ label, ok: false, detail });
  return { response: { isValid: false, invalidReason: reasonOf(code), payer }, checks, code };
}

/** Verify an exact EIP-3009 payload. */
export async function verifyExact(payload: PaymentPayload, req: Requirements, ctx: FacilitatorContext): Promise<VerifyOutcome> {
  const checks: Check[] = [];
  const sp = schemePayloadOf(payload);
  const auth = sp.authorization as Eip3009Authorization;
  const signature = sp.signature as Hex;
  const payer = auth.from;
  const valueCode = ctx.version === 1 ? EXACT_VALUE_CODE_V1 : EXACT_CODES.value;

  if (schemeOf(payload) !== 'exact' || req.scheme !== 'exact') {
    return fail(checks, EXACT_CODES.scheme, payer, 'Scheme is exact', `Got ${schemeOf(payload)}.`);
  }
  checks.push({ label: 'Scheme is exact', ok: true, detail: 'Payload and requirements both name exact.' });

  if (networkOfPayload(payload) !== req.network || req.network !== ctx.network) {
    return fail(checks, EXACT_CODES.network, payer, 'Network matches', `Payload names ${networkOfPayload(payload)}.`);
  }
  checks.push({ label: 'Network matches', ok: true, detail: `${req.network} on both sides.` });

  const td = transferWithAuthorizationTypedData(auth);
  let recovered: string;
  try {
    recovered = await recoverSigner(td, signature);
  } catch {
    return fail(checks, EXACT_CODES.signature, payer, 'Signature recovers to from', 'The signature could not be parsed.');
  }
  if (!sameAddress(recovered, auth.from)) {
    return fail(checks, EXACT_CODES.signature, payer, 'Signature recovers to from', `Recovered ${recovered}, expected ${auth.from}.`);
  }
  checks.push({ label: 'Signature recovers to from', ok: true, detail: `ecrecover over the EIP-712 digest gives ${recovered}.` });

  if (!sameAddress(auth.to, req.payTo)) {
    return fail(checks, EXACT_CODES.recipient, payer, 'authorization.to equals payTo', `Signed to ${auth.to}, server expects ${req.payTo}.`);
  }
  checks.push({ label: 'authorization.to equals payTo', ok: true, detail: `${auth.to}.` });

  if (BigInt(auth.validBefore) < BigInt(ctx.now + 6)) {
    return fail(
      checks,
      EXACT_CODES.validBefore,
      payer,
      'validBefore is in the future',
      `validBefore ${auth.validBefore} is before now + 6 s (${ctx.now + 6}).`,
    );
  }
  checks.push({ label: 'validBefore is in the future', ok: true, detail: `${auth.validBefore} >= ${ctx.now + 6} (now + 6 s buffer).` });

  if (BigInt(auth.validAfter) > BigInt(ctx.now)) {
    return fail(checks, EXACT_CODES.validAfter, payer, 'validAfter has passed', `validAfter ${auth.validAfter} is after now (${ctx.now}).`);
  }
  checks.push({ label: 'validAfter has passed', ok: true, detail: `${auth.validAfter} <= ${ctx.now}.` });

  if (BigInt(auth.value) !== BigInt(amountOf(req))) {
    return fail(checks, valueCode, payer, 'value equals the required amount', `Signed ${auth.value}, required ${amountOf(req)}.`);
  }
  checks.push({ label: 'value equals the required amount', ok: true, detail: `${auth.value} atomic units.` });

  if (ctx.ledger.usedNonces.has(nonceKey(auth.from, auth.nonce))) {
    return fail(
      checks,
      EXACT_CODES.nonceUsed,
      payer,
      'Nonce is unused (authorizationState)',
      'The token contract reports this nonce as already used by this payer.',
    );
  }
  checks.push({ label: 'Nonce is unused (authorizationState)', ok: true, detail: 'authorizationState(from, nonce) is false.' });

  const balance = balanceOf(ctx.ledger, auth.from);
  if (balance < BigInt(auth.value)) {
    return fail(checks, EXACT_CODES.balance, payer, 'Balance covers value', `Balance ${balance} is below ${auth.value}.`);
  }
  checks.push({ label: 'Balance covers value', ok: true, detail: `Balance ${balance} >= ${auth.value}.` });
  checks.push({ label: 'Simulate transferWithAuthorization', ok: true, detail: 'The simulated call succeeds. Nothing is written.' });

  return { response: { isValid: true, payer }, checks };
}

/** Verify an upto Permit2 payload. At settle, `req.amount` is the actual charge and may be below the signed maximum. */
export async function verifyUpto(payload: PaymentPayload, req: Requirements, ctx: FacilitatorContext): Promise<VerifyOutcome> {
  const checks: Check[] = [];
  const sp = schemePayloadOf(payload);
  const auth = sp.permit2Authorization as UptoPermit2Authorization;
  const signature = sp.signature as Hex;
  const payer = auth.from;
  const phase = ctx.phase ?? 'verify';

  if (schemeOf(payload) !== 'upto' || req.scheme !== 'upto') {
    return fail(checks, PERMIT2_CODES.scheme, payer, 'Scheme is upto', `Got ${schemeOf(payload)}.`);
  }
  checks.push({ label: 'Scheme is upto', ok: true, detail: 'Payload and requirements both name upto.' });

  if (networkOfPayload(payload) !== req.network || req.network !== ctx.network) {
    return fail(checks, PERMIT2_CODES.network, payer, 'Network matches', `Payload names ${networkOfPayload(payload)}.`);
  }
  checks.push({ label: 'Network matches', ok: true, detail: `${req.network} on both sides.` });

  if (!sameAddress(auth.spender, UPTO_PERMIT2_PROXY)) {
    return fail(checks, PERMIT2_CODES.spender, payer, 'Spender is the upto proxy', `Spender ${auth.spender}.`);
  }
  checks.push({ label: 'Spender is the upto proxy', ok: true, detail: `${auth.spender}.` });

  if (!sameAddress(auth.witness.to, req.payTo)) {
    return fail(checks, PERMIT2_CODES.recipient, payer, 'witness.to equals payTo', `Signed to ${auth.witness.to}, server expects ${req.payTo}.`);
  }
  checks.push({ label: 'witness.to equals payTo', ok: true, detail: `${auth.witness.to}.` });

  if (!sameAddress(auth.witness.facilitator, FIXTURE_FACILITATOR)) {
    return fail(checks, PERMIT2_CODES.facilitator, payer, 'witness.facilitator is this facilitator', `Got ${auth.witness.facilitator}.`);
  }
  checks.push({ label: 'witness.facilitator is this facilitator', ok: true, detail: `${auth.witness.facilitator}.` });

  if (BigInt(auth.deadline) < BigInt(ctx.now + 6)) {
    return fail(checks, PERMIT2_CODES.deadline, payer, 'deadline is in the future', `deadline ${auth.deadline} is before now + 6 s (${ctx.now + 6}).`);
  }
  checks.push({ label: 'deadline is in the future', ok: true, detail: `${auth.deadline} >= ${ctx.now + 6}.` });

  if (BigInt(auth.witness.validAfter) > BigInt(ctx.now)) {
    return fail(checks, PERMIT2_CODES.validAfter, payer, 'witness.validAfter has passed', `validAfter ${auth.witness.validAfter}.`);
  }
  checks.push({ label: 'witness.validAfter has passed', ok: true, detail: `${auth.witness.validAfter} <= ${ctx.now}.` });

  const permitted = BigInt(auth.permitted.amount);
  const requested = BigInt(amountOf(req));
  if (phase === 'verify') {
    if (permitted !== requested) {
      return fail(checks, PERMIT2_CODES.amount, payer, 'permitted.amount equals amount', `Signed ${permitted}, required ${requested}.`);
    }
    checks.push({ label: 'permitted.amount equals amount', ok: true, detail: `${permitted} (the maximum).` });
  } else {
    if (requested > permitted) {
      return fail(checks, PERMIT2_CODES.settleExceeds, payer, 'Charge is at most the signed maximum', `Charge ${requested} exceeds ${permitted}.`);
    }
    checks.push({ label: 'Charge is at most the signed maximum', ok: true, detail: `${requested} <= ${permitted}.` });
  }

  if (!sameAddress(auth.permitted.token, req.asset)) {
    return fail(checks, PERMIT2_CODES.token, payer, 'permitted.token equals asset', `Token ${auth.permitted.token}.`);
  }
  checks.push({ label: 'permitted.token equals asset', ok: true, detail: `${getAddress(auth.permitted.token)}.` });

  const td = permitWitnessTypedData(auth);
  let recovered: string;
  try {
    recovered = await recoverSigner(td, signature);
  } catch {
    return fail(checks, PERMIT2_CODES.signature, payer, 'Signature recovers to from', 'The signature could not be parsed.');
  }
  if (!sameAddress(recovered, auth.from)) {
    return fail(checks, PERMIT2_CODES.signature, payer, 'Signature recovers to from', `Recovered ${recovered}, expected ${auth.from}.`);
  }
  checks.push({
    label: 'Signature recovers to from',
    ok: true,
    detail: `Checked against permitted.amount (${permitted}), not the charge. Recovered ${recovered}.`,
  });

  const balance = balanceOf(ctx.ledger, auth.from);
  const needed = phase === 'verify' ? permitted : requested;
  if (balance < needed) {
    return fail(checks, PERMIT2_CODES.balance, payer, 'Balance covers the amount', `Balance ${balance} is below ${needed}.`);
  }
  if (ctx.ledger.usedNonces.has(nonceKey(auth.from, auth.nonce))) {
    return fail(
      checks,
      PERMIT2_CODES.nonceUsed,
      payer,
      'Simulate the proxy settle',
      'Simulation reverts because Permit2 already used this nonce; balance and allowance look fine, so the reason is generic.',
    );
  }
  checks.push({ label: 'Balance covers the amount', ok: true, detail: `Balance ${balance} >= ${needed}.` });
  checks.push({ label: 'Simulate the proxy settle', ok: true, detail: 'The simulated call succeeds. Nothing is written.' });
  return { response: { isValid: true, payer }, checks };
}

export function verifyPayment(payload: PaymentPayload, req: Requirements, ctx: FacilitatorContext): Promise<VerifyOutcome> {
  return req.scheme === 'upto' ? verifyUpto(payload, req, ctx) : verifyExact(payload, req, ctx);
}

export interface SettleOutcome {
  response: SettleResponse;
  checks: Check[];
  code?: ErrorCode;
  /** Description of the simulated on-chain call, when one is made. */
  chainCall?: string;
}

/**
 * Settle: re-verify (the SDK settle path calls verify first), then write to the ledger.
 * The transaction hash is keccak256 of the signature: a stand-in, not a real hash.
 */
export async function settlePayment(payload: PaymentPayload, req: Requirements, ctx: FacilitatorContext): Promise<SettleOutcome> {
  const v = await verifyPayment(payload, req, { ...ctx, phase: 'settle' });
  const sp = schemePayloadOf(payload);
  if (!v.response.isValid) {
    return {
      response: {
        success: false,
        errorReason: v.response.invalidReason,
        payer: v.response.payer,
        transaction: '',
        network: req.network,
      },
      checks: v.checks,
      code: v.code,
    };
  }
  const signature = sp.signature as Hex;
  const tx = keccak256(signature);
  if (req.scheme === 'upto') {
    const auth = sp.permit2Authorization as UptoPermit2Authorization;
    const charge = BigInt(amountOf(req));
    ctx.ledger.usedNonces.add(nonceKey(auth.from, auth.nonce));
    if (charge === 0n) {
      return {
        response: { success: true, payer: auth.from, transaction: '', network: req.network, amount: '0' },
        checks: [...v.checks, { label: 'Zero charge', ok: true, detail: 'No transaction is needed; the authorization expires unused.' }],
      };
    }
    move(ctx.ledger, auth.from, req.payTo, charge);
    return {
      response: { success: true, payer: auth.from, transaction: tx, network: req.network, amount: charge.toString() },
      checks: v.checks,
      chainCall: `x402UptoPermit2Proxy.settle(permit, ${charge}, owner, witness, signature) moves ${charge} of ${FIXTURE_TOKEN.symbol} to payTo`,
    };
  }
  const auth = sp.authorization as Eip3009Authorization;
  ctx.ledger.usedNonces.add(nonceKey(auth.from, auth.nonce));
  move(ctx.ledger, auth.from, auth.to, BigInt(auth.value));
  return {
    response: { success: true, payer: auth.from, transaction: tx, network: req.network },
    checks: v.checks,
    chainCall: `transferWithAuthorization(from, to, ${auth.value}, validAfter, validBefore, nonce, signature) on the ${FIXTURE_TOKEN.symbol} fixture`,
  };
}

function move(ledger: Ledger, from: string, to: string, amount: bigint) {
  ledger.balances.set(from.toLowerCase(), balanceOf(ledger, from) - amount);
  ledger.balances.set(to.toLowerCase(), balanceOf(ledger, to) + amount);
}

/** Error body that @x402/express sends with HTTP 502 when the facilitator times out (FacilitatorTimeoutError). */
export function facilitatorTimeoutBody(operation: 'verify' | 'settle', timeoutMs: number): { error: string } {
  return { error: `Facilitator ${operation} request timed out after ${timeoutMs}ms` };
}
