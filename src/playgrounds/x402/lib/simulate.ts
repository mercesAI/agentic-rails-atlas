/**
 * Runs one x402 handshake end to end in memory and returns the timeline the UI renders.
 * Step order follows src/content/flows/x402-v2-exact-authorization.json and the failure flows
 * (x402-failure-*.json); the upfront and escrow orders follow spec v2 section 6.1.
 */
import type { Address, Hex } from 'viem';
import { toJson } from './base64';
import {
  balanceOf,
  createLedger,
  facilitatorTimeoutBody,
  nonceKey,
  settlePayment,
  verifyPayment,
  type Check,
  type ErrorCode,
  type Ledger,
} from './facilitator';
import {
  FACILITATOR_TIMEOUT_MS,
  FIXTURE_FACILITATOR,
  FIXTURE_PATH,
  FIXTURE_PAY_TO,
  FIXTURE_TOKEN,
  FIXTURE_WRONG_PAY_TO,
  MAX_TIMEOUT_SECONDS,
  START_BALANCE,
  illustrativeLabel,
  networkFor,
  type PaymentFlow,
  type Scheme,
  type Version,
} from './fixtures';
import { resolveFlow, type FlowResolution } from './flows';
import {
  HEADERS,
  amountOf,
  buildFacilitatorRequest,
  buildPaymentPayload,
  buildPaymentRequired,
  buildRequirements,
  render402,
  renderFacilitatorCall,
  renderHttpRequest,
  renderHttpResponse,
  renderPaidRequest,
  renderSettledResponse,
  type PaymentPayload,
  type Requirements,
} from './messages';
import { checkSpendControls, formatAtomic, type SpendCap } from './spend';
import {
  buildEip3009Authorization,
  buildUptoAuthorization,
  digestOf,
  permitWitnessTypedData,
  recoverSigner,
  sameAddress,
  transferWithAuthorizationTypedData,
  typedDataForDisplay,
  type TypedData,
  type TypedDataSigner,
} from './typed-data';

export type FailureId = 'none' | 'expired' | 'wrong-payto' | 'replay' | 'insufficient' | 'facilitator-down';

export const FAILURES: { id: FailureId; label: string; hint: string }[] = [
  { id: 'none', label: 'No failure', hint: 'The happy path.' },
  { id: 'expired', label: 'Expired validBefore', hint: 'The payment reaches the facilitator after its window closed.' },
  { id: 'wrong-payto', label: 'Wrong payTo', hint: 'The client signs to an address that is not the server payTo.' },
  { id: 'replay', label: 'Replayed nonce', hint: 'A header that already paid once is sent again.' },
  { id: 'insufficient', label: 'Insufficient balance', hint: 'The payer holds half the amount.' },
  { id: 'facilitator-down', label: 'Facilitator down', hint: 'The first facilitator call times out.' },
];

export type Actor = 'client' | 'server' | 'facilitator' | 'chain';

export const ACTOR_LABEL: Record<Actor, string> = {
  client: 'Client (agent)',
  server: 'Resource server',
  facilitator: 'Facilitator',
  chain: 'Simulated chain',
};

export interface Wire {
  caption: string;
  text: string;
  header?: { name: string; value: string; decoded: unknown };
}

export type StepStatus = 'ok' | 'fail' | 'info';

export interface Step {
  n: number;
  from: Actor;
  to: Actor;
  title: string;
  detail: string;
  status: StepStatus;
  wire?: Wire;
  checks?: Check[];
  code?: ErrorCode;
  simplification?: string;
}

export type OutcomeKind = 'paid' | 'refused' | 'blocked' | 'gateway' | 'unsupported';

export interface Outcome {
  kind: OutcomeKind;
  title: string;
  detail: string;
}

export interface Signing {
  typedData: TypedData;
  display: unknown;
  digest: Hex;
  signature: Hex;
  signer: Address;
  recovered: Address;
  matches: boolean;
}

export interface SimOptions {
  version: Version;
  scheme: Scheme;
  flow: PaymentFlow;
  failure: FailureId;
  /** Price in atomic units (for upto, the signed maximum). */
  amount: string;
  /** upto only: the metered charge in atomic units. */
  metered: string;
  spendCap: SpendCap;
  /** Client clock at signing, unix seconds. */
  now: number;
}

export interface SimResult {
  resolution: FlowResolution;
  steps: Step[];
  outcome: Outcome;
  signing?: Signing;
  headers: { name: string; value: string }[];
  balances?: { payerBefore: bigint; payerAfter: bigint; payToAfter: bigint };
}

/** Seconds between signing and arrival in the expired-window failure. */
export const LATE_BY_SECONDS = MAX_TIMEOUT_SECONDS + 5;

export async function runSimulation(o: SimOptions, signer: TypedDataSigner): Promise<SimResult> {
  const resolution = resolveFlow(o.version, o.scheme, o.flow);
  if (!resolution.supported) {
    return {
      resolution,
      steps: [],
      headers: [],
      outcome: { kind: 'unsupported', title: 'This combination is not supported', detail: resolution.reason },
    };
  }
  const caption = illustrativeLabel(o.version);
  const v = o.version;
  const sigHeader = HEADERS[v].signature;
  const steps: Step[] = [];
  const headers: { name: string; value: string }[] = [];
  const push = (s: Omit<Step, 'n'>) => {
    steps.push({ ...s, n: steps.length + 1 });
    if (s.wire?.header) headers.push({ name: s.wire.header.name, value: s.wire.header.value });
  };

  const serverReq = buildRequirements({ version: v, scheme: o.scheme, flow: o.flow, amount: o.amount, payTo: FIXTURE_PAY_TO });
  const startBalance = o.failure === 'insufficient' ? BigInt(o.amount) / 2n : START_BALANCE;
  const ledger = createLedger([[signer.address, startBalance]]);
  const payerBefore = startBalance;
  const finish = (outcome: Outcome, signing?: Signing): SimResult => ({
    resolution,
    steps,
    headers,
    outcome,
    signing,
    balances: {
      payerBefore,
      payerAfter: balanceOf(ledger, signer.address),
      payToAfter: balanceOf(ledger, FIXTURE_PAY_TO),
    },
  });

  // 1. Unpaid request
  push({
    from: 'client',
    to: 'server',
    title: `GET ${FIXTURE_PATH} (no payment header)`,
    detail: `The client asks for the resource. It does not know the price yet, so it sends no ${sigHeader} header.`,
    status: 'ok',
    wire: { caption, text: renderHttpRequest({ headers: [['Accept', 'application/json']] }) },
  });

  // 2. 402
  const pr = buildPaymentRequired(serverReq);
  const r402 = render402(pr);
  push({
    from: 'server',
    to: 'client',
    title: v === 2 ? '402 Payment Required with PAYMENT-REQUIRED' : '402 Payment Required with a JSON body',
    detail:
      v === 2
        ? `The PAYMENT-REQUIRED header holds base64 JSON: x402Version 2, resource, and one accepts entry with amount ${o.amount} (${formatAtomic(o.amount)} ${FIXTURE_TOKEN.symbol}) on ${networkFor(2)}.`
        : `V1 sends the requirements in the response body. The entry uses maxAmountRequired ${o.amount} and the network name ${networkFor(1)}.`,
    status: 'ok',
    wire: { caption, text: r402.text, header: r402.header },
    simplification:
      resolution.orderingOnly
        ? 'Teaching simplification: the entry reuses the EVM fixtures; a real escrow entry for upto names a Solana network.'
        : undefined,
  });

  // 3. Spend controls
  const spend = checkSpendControls(amountOf(serverReq), o.spendCap);
  if (!spend.allowed) {
    push({
      from: 'client',
      to: 'client',
      title: 'Spend controls reject the only accepts entry',
      detail: spend.error,
      status: 'fail',
      simplification: 'Teaching simplification: the fixture token counts as a default asset so the USD cap applies.',
    });
    return finish({
      kind: 'blocked',
      title: 'Blocked by the client spend cap',
      detail: 'The SDK throws before signing, so no payment is created and nothing reaches the server.',
    });
  }

  if (resolution.orderingOnly) return escrowOrdering(o, push, finish, spend.note);

  // 3. Sign
  const clientPayTo = o.failure === 'wrong-payto' ? FIXTURE_WRONG_PAY_TO : FIXTURE_PAY_TO;
  let td: TypedData;
  let schemePayload: Record<string, unknown>;
  let nonce: string;
  let signature: Hex;
  if (o.scheme === 'exact') {
    const auth = buildEip3009Authorization({
      from: signer.address,
      to: clientPayTo,
      value: o.amount,
      now: o.now,
      maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
    });
    td = transferWithAuthorizationTypedData(auth);
    signature = await signer.signTypedData(td);
    nonce = auth.nonce;
    schemePayload = { signature, authorization: auth };
  } else {
    const auth = buildUptoAuthorization({
      from: signer.address,
      to: clientPayTo,
      facilitator: FIXTURE_FACILITATOR,
      token: FIXTURE_TOKEN.address,
      amount: o.amount,
      now: o.now,
      maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
    });
    td = permitWitnessTypedData(auth);
    signature = await signer.signTypedData(td);
    nonce = auth.nonce;
    schemePayload = { signature, permit2Authorization: auth };
  }
  const recovered = await recoverSigner(td, signature);
  const signing: Signing = {
    typedData: td,
    display: typedDataForDisplay(td),
    digest: digestOf(td),
    signature,
    signer: signer.address,
    recovered,
    matches: sameAddress(recovered, signer.address),
  };
  push({
    from: 'client',
    to: 'client',
    title: o.scheme === 'exact' ? 'Check spend cap, sign EIP-712 TransferWithAuthorization' : 'Check spend cap, sign EIP-712 PermitWitnessTransferFrom',
    detail:
      `${spend.note} ` +
      (o.scheme === 'exact'
        ? `The client signs from, to, value, validAfter "0", validBefore (now + ${MAX_TIMEOUT_SECONDS} s) and a random 32-byte nonce with an ephemeral key.`
        : `The client signs a Permit2 maximum of ${o.amount} to the upto proxy, with witness.to (payTo) and witness.facilitator.`) +
      (o.failure === 'wrong-payto' ? ` It signs to ${FIXTURE_WRONG_PAY_TO}, taken from altered or stale requirements.` : ''),
    status: o.failure === 'wrong-payto' ? 'info' : 'ok',
    wire: { caption: `${caption}. Key generated in this browser.`, text: toJson(signing.display, 2) },
  });

  // Replay: the same header already paid for an earlier request.
  if (o.failure === 'replay') {
    ledger.usedNonces.add(nonceKey(signer.address, nonce));
    ledger.balances.set(signer.address.toLowerCase(), startBalance - BigInt(o.amount));
    ledger.balances.set(FIXTURE_PAY_TO.toLowerCase(), BigInt(o.amount));
  }

  // 4. Paid retry. accepted echoes the server requirements even when the signed recipient differs.
  const payload = buildPaymentPayload(serverReq, schemePayload);
  const paid = renderPaidRequest(payload);
  push({
    from: 'client',
    to: 'server',
    title: o.failure === 'replay' ? `Replay a ${sigHeader} header that already paid` : `Retry GET ${FIXTURE_PATH} with ${sigHeader}`,
    detail:
      o.failure === 'replay'
        ? 'This exact header settled an earlier request. Someone sends it again, hoping for the resource a second time.'
        : o.failure === 'expired'
          ? `The request reaches the server ${LATE_BY_SECONDS} seconds after signing. validBefore was signing time + ${MAX_TIMEOUT_SECONDS} s.`
          : `The same request again, now with ${sigHeader}: base64 JSON of the PaymentPayload.`,
    status: 'ok',
    wire: { caption, text: paid.text, header: paid.header },
  });

  const ctx = { version: v, now: o.failure === 'expired' ? o.now + LATE_BY_SECONDS : o.now, ledger, network: networkFor(v) };

  if (resolution.phases[0] === 'verify') {
    return authorizationPath(o, serverReq, payload, ctx, push, finish, signing);
  }
  return upfrontPath(o, serverReq, payload, ctx, push, finish, signing);
}

type Push = (s: Omit<Step, 'n'>) => void;
type Finish = (outcome: Outcome, signing?: Signing) => SimResult;
interface Ctx {
  version: Version;
  now: number;
  ledger: Ledger;
  network: string;
}

const RESOURCE_BODY = { city: 'Example City', forecast: 'sunny', note: 'fixture data' };

function chainSteps(push: Push, call: string, tx: string) {
  push({
    from: 'facilitator',
    to: 'chain',
    title: 'Broadcast the transfer',
    detail: `${call}. The facilitator pays gas and cannot change the amount or the recipient.`,
    status: 'ok',
  });
  push({
    from: 'chain',
    to: 'facilitator',
    title: 'Return the receipt',
    detail: `The simulated ledger moves the funds. Stand-in transaction hash ${tx.slice(0, 18)}... (keccak256 of the signature).`,
    status: 'ok',
  });
}

function refusal402(o: SimOptions, serverReq: Requirements, push: Push, reason: string) {
  const fresh = render402(buildPaymentRequired(serverReq, reason));
  push({
    from: 'server',
    to: 'client',
    title: '402 with a fresh PAYMENT-REQUIRED',
    detail:
      o.version === 2
        ? `The handler does not run and nothing moves. The SDK puts the reason (${reason}) in the error field of a new PaymentRequired so the client can sign again.`
        : `The handler does not run. V1 answers 402 with the requirements in the body again; error carries ${reason}.`,
    status: 'fail',
    wire: { caption: illustrativeLabel(o.version), text: fresh.text, header: fresh.header },
  });
}

async function authorizationPath(
  o: SimOptions,
  serverReq: Requirements,
  payload: PaymentPayload,
  ctx: Ctx,
  push: Push,
  finish: Finish,
  signing: Signing,
): Promise<SimResult> {
  const caption = illustrativeLabel(o.version);
  const verifyBody = buildFacilitatorRequest(payload, serverReq);
  if (o.failure === 'facilitator-down') {
    push({
      from: 'server',
      to: 'facilitator',
      title: 'POST /verify (no answer)',
      detail: `The facilitator does not answer. HTTPFacilitatorClient gives up after ${FACILITATOR_TIMEOUT_MS / 1000} seconds by default.`,
      status: 'fail',
      wire: { caption, text: renderFacilitatorCall('/verify', verifyBody) },
    });
    push({
      from: 'server',
      to: 'client',
      title: '502 Bad Gateway',
      detail:
        'The @x402/express middleware turns a facilitator failure into HTTP 502. The handler does not run and nothing moves. The signature stays usable until validBefore, so the client can retry later.',
      status: 'fail',
      wire: { caption: `${caption}. Body text from @x402/express.`, text: renderHttpResponse({ status: 502, headers: [['Content-Type', 'application/json']], body: facilitatorTimeoutBody('verify', FACILITATOR_TIMEOUT_MS) }) },
    });
    return finish({ kind: 'gateway', title: '502 Bad Gateway', detail: 'The facilitator was unreachable, so the server refused before running the handler.' }, signing);
  }

  push({
    from: 'server',
    to: 'facilitator',
    title: 'POST /verify',
    detail: 'The server sends the payload with its own copy of the requirements. Verify is read-only.',
    status: 'ok',
    wire: { caption, text: renderFacilitatorCall('/verify', verifyBody) },
  });
  const ver = await verifyPayment(payload, serverReq, ctx);
  push({
    from: 'facilitator',
    to: 'server',
    title: ver.response.isValid ? 'VerifyResponse isValid true' : `VerifyResponse isValid false (${ver.response.invalidReason})`,
    detail: ver.response.isValid
      ? 'Every check passed. Nothing was written to the ledger.'
      : 'The facilitator stops at the first failed check and names it in invalidReason.',
    status: ver.response.isValid ? 'ok' : 'fail',
    wire: { caption, text: toJson(ver.response, 2) },
    checks: ver.checks,
    code: ver.code,
  });
  if (!ver.response.isValid) {
    refusal402(o, serverReq, push, ver.response.invalidReason ?? 'invalid_payload');
    return finish({ kind: 'refused', title: `Refused: ${ver.response.invalidReason}`, detail: 'Verify failed, the handler did not run and no funds moved.' }, signing);
  }

  const settleReq: Requirements =
    o.scheme === 'upto' && !('maxAmountRequired' in serverReq) ? { ...serverReq, amount: o.metered } : serverReq;
  push({
    from: 'server',
    to: 'server',
    title: o.scheme === 'upto' ? 'Run the handler and meter usage' : 'Run the handler',
    detail:
      o.scheme === 'upto'
        ? `Funds have not moved yet. The work costs ${o.metered} atomic units (${formatAtomic(o.metered)} ${FIXTURE_TOKEN.symbol}) of the ${o.amount} maximum.`
        : 'Funds have not moved yet. If the handler failed now, the server would not settle and the client would not pay.',
    status: 'ok',
  });

  push({
    from: 'server',
    to: 'facilitator',
    title: 'POST /settle',
    detail:
      o.scheme === 'upto'
        ? `Same body as verify, but paymentRequirements.amount now carries the actual charge (${o.metered}).`
        : 'Same body as verify. Settle commits payment state by broadcasting a transaction.',
    status: 'ok',
    wire: { caption, text: renderFacilitatorCall('/settle', buildFacilitatorRequest(payload, settleReq)) },
  });
  const st = await settlePayment(payload, settleReq, ctx);
  if (st.chainCall) chainSteps(push, st.chainCall, st.response.transaction);
  push({
    from: 'facilitator',
    to: 'server',
    title: st.response.success ? 'SettleResponse success true' : `SettleResponse success false (${st.response.errorReason})`,
    detail: st.response.success
      ? st.response.transaction === ''
        ? 'Zero charge: success with an empty transaction.'
        : 'The response names the transaction hash, the network and the payer.'
      : 'Settlement failed after the handler ran; under authorization the seller carries this risk.',
    status: st.response.success ? 'ok' : 'fail',
    wire: { caption, text: toJson(st.response, 2) },
    checks: st.checks,
    code: st.code,
  });
  const final = renderSettledResponse(o.version, st.response.success ? 200 : 402, st.response, st.response.success ? RESOURCE_BODY : '{}');
  push({
    from: 'server',
    to: 'client',
    title: st.response.success ? `200 OK with ${HEADERS[o.version].response}` : `402 with ${HEADERS[o.version].response} success false`,
    detail: st.response.success
      ? `The resource plus base64 JSON of the SettleResponse; the client keeps the transaction hash as its receipt.`
      : 'The server withholds the resource and returns the failed SettleResponse.',
    status: st.response.success ? 'ok' : 'fail',
    wire: { caption, text: final.text, header: final.header },
  });
  return finish(
    st.response.success
      ? { kind: 'paid', title: '200 OK, paid', detail: 'Verified, served and settled.' }
      : { kind: 'refused', title: `Settlement failed: ${st.response.errorReason}`, detail: 'The handler ran but the payment did not settle.' },
    signing,
  );
}

async function upfrontPath(
  o: SimOptions,
  serverReq: Requirements,
  payload: PaymentPayload,
  ctx: Ctx,
  push: Push,
  finish: Finish,
  signing: Signing,
): Promise<SimResult> {
  const caption = illustrativeLabel(o.version);
  const body = buildFacilitatorRequest(payload, serverReq);
  if (o.failure === 'facilitator-down') {
    push({
      from: 'server',
      to: 'facilitator',
      title: 'POST /settle (times out)',
      detail: `Upfront has no /verify, so settle is the first call. The client gives up after ${FACILITATOR_TIMEOUT_MS / 1000} seconds.`,
      status: 'fail',
      wire: { caption, text: renderFacilitatorCall('/settle', body) },
    });
    push({
      from: 'server',
      to: 'client',
      title: '502 Bad Gateway',
      detail:
        'A settle timeout is indeterminate: the facilitator may still have broadcast the transfer. The server must reconcile on chain before it retries or refuses.',
      status: 'fail',
      wire: { caption: `${caption}. Body text from @x402/express.`, text: renderHttpResponse({ status: 502, headers: [['Content-Type', 'application/json']], body: facilitatorTimeoutBody('settle', FACILITATOR_TIMEOUT_MS) }) },
    });
    return finish({ kind: 'gateway', title: '502 Bad Gateway, outcome unknown', detail: 'The settle call timed out. The payment may or may not have landed.' }, signing);
  }
  push({
    from: 'server',
    to: 'facilitator',
    title: 'POST /settle (no /verify)',
    detail: 'Upfront ordering is settle, resource, respond. Settle checks the payload itself before it broadcasts.',
    status: 'ok',
    wire: { caption, text: renderFacilitatorCall('/settle', body) },
  });
  const st = await settlePayment(payload, serverReq, ctx);
  if (!st.response.success) {
    push({
      from: 'facilitator',
      to: 'server',
      title: `SettleResponse success false (${st.response.errorReason})`,
      detail: 'Nothing was broadcast, so transaction is an empty string.',
      status: 'fail',
      wire: { caption, text: toJson(st.response, 2) },
      checks: st.checks,
      code: st.code,
    });
    const final = renderSettledResponse(o.version, 402, st.response, '{}');
    push({
      from: 'server',
      to: 'client',
      title: `402 with ${HEADERS[o.version].response} success false`,
      detail: 'The handler does not run.',
      status: 'fail',
      wire: { caption, text: final.text, header: final.header },
    });
    return finish({ kind: 'refused', title: `Refused: ${st.response.errorReason}`, detail: 'Settle failed before the handler, so nothing was served or charged.' }, signing);
  }
  if (st.chainCall) chainSteps(push, st.chainCall, st.response.transaction);
  push({
    from: 'facilitator',
    to: 'server',
    title: 'SettleResponse success true',
    detail: 'The payment is final before the handler runs.',
    status: 'ok',
    wire: { caption, text: toJson(st.response, 2) },
    checks: st.checks,
  });
  push({
    from: 'server',
    to: 'server',
    title: 'Run the handler',
    detail: 'The client has already paid. If the handler failed now, the spec defines no refund.',
    status: 'ok',
  });
  const final = renderSettledResponse(o.version, 200, st.response, RESOURCE_BODY);
  push({
    from: 'server',
    to: 'client',
    title: `200 OK with ${HEADERS[o.version].response}`,
    detail: 'The resource and the settlement result.',
    status: 'ok',
    wire: { caption, text: final.text, header: final.header },
  });
  return finish({ kind: 'paid', title: '200 OK, paid upfront', detail: 'Settled, then served.' }, signing);
}

function escrowOrdering(o: SimOptions, push: Push, finish: Finish, spendNote: string): SimResult {
  const simp = 'Teaching simplification: call order only, no payload is built.';
  push({
    from: 'client',
    to: 'server',
    title: `Retry with ${HEADERS[2].signature} (deposit authorization)`,
    detail: `${spendNote} The client authorizes a deposit up to ${o.amount} atomic units.`,
    status: 'ok',
    simplification: simp,
  });
  if (o.failure === 'facilitator-down') {
    push({ from: 'server', to: 'facilitator', title: 'POST /settle, payload.type "deposit" (times out)', detail: 'The first settle gets no answer.', status: 'fail', simplification: simp });
    push({
      from: 'server',
      to: 'client',
      title: '502 Bad Gateway',
      detail: 'The handler does not run. The server must find out whether the deposit landed before it retries.',
      status: 'fail',
      wire: { caption: illustrativeLabel(2), text: renderHttpResponse({ status: 502, headers: [['Content-Type', 'application/json']], body: facilitatorTimeoutBody('settle', FACILITATOR_TIMEOUT_MS) }) },
    });
    return finish({ kind: 'gateway', title: '502 Bad Gateway', detail: 'The deposit settle timed out.' });
  }
  if (o.failure !== 'none') {
    push({
      from: 'client',
      to: 'client',
      title: 'Failure not modeled for escrow',
      detail: 'The error codes for this flow are scheme specific (Solana channel checks). Switch to authorization to see the EVM codes.',
      status: 'info',
    });
  }
  push({ from: 'server', to: 'facilitator', title: 'POST /settle, payload.type "deposit"', detail: 'The first settle is the pre-resource check. There is no /verify.', status: 'ok', simplification: simp });
  push({ from: 'facilitator', to: 'chain', title: 'Open the channel and lock the deposit', detail: 'Funds are committed before the handler runs.', status: 'ok', simplification: simp });
  push({ from: 'facilitator', to: 'server', title: 'SettleResponse success true (deposit)', detail: 'The server may now run the handler.', status: 'ok' });
  push({ from: 'server', to: 'server', title: 'Run the handler and meter usage', detail: `The work costs ${o.metered} of the ${o.amount} maximum.`, status: 'ok' });
  push({ from: 'server', to: 'facilitator', title: 'POST /settle, payload.type "claim"', detail: `The second settle records the final charge (${o.metered}).`, status: 'ok', simplification: simp });
  push({ from: 'facilitator', to: 'chain', title: 'Claim the metered amount', detail: 'The rest of the deposit stays with the payer.', status: 'ok', simplification: simp });
  push({ from: 'facilitator', to: 'server', title: 'SettleResponse success true (claim)', detail: 'The final settlement result.', status: 'ok' });
  push({ from: 'server', to: 'client', title: `200 OK with ${HEADERS[2].response}`, detail: 'The resource and the settlement result.', status: 'ok' });
  return finish({ kind: 'paid', title: 'Paid through escrow', detail: 'Deposit, serve, claim.' });
}
