import { describe, expect, it } from 'vitest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { base64ToUtf8, utf8ToBase64 } from '@/lib/playground/bytes';
import { decodeHeader, encodeHeader, encodeJsonText, toJson } from '@/playgrounds/x402/lib/base64';
import {
  FIXTURE_FACILITATOR,
  FIXTURE_PAY_TO,
  FIXTURE_TOKEN,
  FIXTURE_WRONG_PAY_TO,
  SIM_CHAIN_ID,
  illustrativeLabel,
  networkFor,
  specVersionLabel,
} from '@/playgrounds/x402/lib/fixtures';
import {
  EXACT_CODES,
  PERMIT2_CODES,
  balanceOf,
  createLedger,
  facilitatorTimeoutBody,
  nonceKey,
  reasonOf,
  settlePayment,
  verifyExact,
  verifyPayment,
  verifyUpto,
} from '@/playgrounds/x402/lib/facilitator';
import { FLOW_PHASES, resolveFlow, sdkUnsupportedFlowError } from '@/playgrounds/x402/lib/flows';
import {
  HEADERS,
  amountOf,
  buildFacilitatorRequest,
  buildPaymentPayload,
  buildPaymentRequired,
  buildRequirements,
  missingHeaderError,
  render402,
  renderFacilitatorCall,
  renderHttpRequest,
  renderHttpResponse,
  renderPaidRequest,
  renderSettledResponse,
  type RequirementsV2,
} from '@/playgrounds/x402/lib/messages';
import { FAILURES, runSimulation, type SimOptions } from '@/playgrounds/x402/lib/simulate';
import { checkSpendControls, convertToTokenAmount, formatAtomic, parseMoney } from '@/playgrounds/x402/lib/spend';
import {
  buildEip3009Authorization,
  buildUptoAuthorization,
  digestOf,
  permitWitnessTypedData,
  randomBytes32,
  randomUint256,
  recoverSigner,
  sameAddress,
  tamperAmount,
  transferWithAuthorizationTypedData,
  typedDataForDisplay,
  type TypedDataSigner,
} from '@/playgrounds/x402/lib/typed-data';

const NOW = 1_791_720_000;

function newSigner(): TypedDataSigner {
  const account = privateKeyToAccount(generatePrivateKey());
  return { address: account.address, signTypedData: (td) => account.signTypedData(td as never) };
}

function opts(over: Partial<SimOptions> = {}): SimOptions {
  return {
    version: 2,
    scheme: 'exact',
    flow: 'authorization',
    failure: 'none',
    amount: '10000',
    metered: '4000',
    spendCap: '$1',
    now: NOW,
    ...over,
  };
}

// Spec example from specs/transports-v2/http.md, "Settlement Response Delivery" (success).
const SPEC_PAYMENT_RESPONSE_B64 =
  'eyJzdWNjZXNzIjp0cnVlLCJ0cmFuc2FjdGlvbiI6IjB4MTIzNDU2Nzg5MGFiY2RlZjEyMzQ1Njc4OTBhYmNkZWYxMjM0NTY3ODkwYWJjZGVmMTIzNDU2Nzg5MGFiY2RlZiIsIm5ldHdvcmsiOiJlaXAxNTU6ODQ1MzIiLCJwYXllciI6IjB4ODU3YjA2NTE5RTkxZTNBNTQ1Mzg3OTFiRGJiMEUyMjM3M2UzNmI2NiJ9';
const SPEC_PAYMENT_RESPONSE = {
  success: true,
  transaction: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  network: 'eip155:84532',
  payer: '0x857b06519E91e3A54538791bDbb0E22373e36b66',
};

describe('fixtures', () => {
  it('labels spec versions', () => {
    expect(specVersionLabel(2)).toBe('v2.0');
    expect(specVersionLabel(1)).toBe('v1');
    expect(illustrativeLabel(2)).toBe('Illustrative example, spec version v2.0');
    expect(illustrativeLabel(1)).toBe('Illustrative example, spec version v1');
  });
  it('uses a simulated chain: CAIP-2 for V2, a plain name for V1', () => {
    expect(networkFor(2)).toBe('eip155:402402');
    expect(networkFor(1)).toBe('sim-402402');
    expect(SIM_CHAIN_ID).toBe(402402);
  });
});

describe('base64 header codec', () => {
  it('round-trips UTF-8 text', () => {
    const s = 'café ✓';
    expect(base64ToUtf8(utf8ToBase64(s))).toBe(s);
  });
  it('encodes the spec PAYMENT-RESPONSE example byte for byte', () => {
    expect(encodeHeader(SPEC_PAYMENT_RESPONSE)).toBe(SPEC_PAYMENT_RESPONSE_B64);
  });
  it('decodes the spec example and pretty-prints it', () => {
    const r = decodeHeader(SPEC_PAYMENT_RESPONSE_B64);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toEqual(SPEC_PAYMENT_RESPONSE);
      expect(r.json).toContain('\n  "success": true');
    }
  });
  it('explains bad input', () => {
    expect(decodeHeader('')).toEqual({ ok: false, error: 'The header value is empty.' });
    expect(decodeHeader('not base64!').ok).toBe(false);
    const notJson = decodeHeader(utf8ToBase64('hello'));
    expect(notJson.ok).toBe(false);
    if (!notJson.ok) expect(notJson.error).toMatch(/not JSON/);
  });
  it('ignores whitespace and line breaks in pasted headers', () => {
    const half = Math.floor(SPEC_PAYMENT_RESPONSE_B64.length / 2);
    const r = decodeHeader(`${SPEC_PAYMENT_RESPONSE_B64.slice(0, half)}\n  ${SPEC_PAYMENT_RESPONSE_B64.slice(half)}`);
    expect(r.ok).toBe(true);
  });
  it('serializes bigints as strings', () => {
    expect(toJson({ a: 5n })).toBe('{"a":"5"}');
  });
  it('encodes JSON text or reports a parse error', () => {
    const ok = encodeJsonText('{"x402Version":2}');
    expect(ok).toEqual({ ok: true, value: utf8ToBase64('{"x402Version":2}') });
    expect(encodeJsonText('{oops').ok).toBe(false);
  });
});

describe('messages', () => {
  it('names headers per version', () => {
    expect(HEADERS[2]).toEqual({ required: 'PAYMENT-REQUIRED', signature: 'PAYMENT-SIGNATURE', response: 'PAYMENT-RESPONSE' });
    expect(HEADERS[1]).toEqual({ required: null, signature: 'X-PAYMENT', response: 'X-PAYMENT-RESPONSE' });
    expect(missingHeaderError(2)).toBe('PAYMENT-SIGNATURE header is required');
    expect(missingHeaderError(1)).toBe('X-PAYMENT header is required');
  });
  it('builds a V2 requirement with amount and a CAIP-2 network', () => {
    const r = buildRequirements({ version: 2, scheme: 'exact', flow: 'authorization', amount: '10000', payTo: FIXTURE_PAY_TO });
    expect(r).toMatchObject({ scheme: 'exact', network: 'eip155:402402', amount: '10000', maxTimeoutSeconds: 60 });
    expect(r.extra).toEqual({ name: FIXTURE_TOKEN.name, version: FIXTURE_TOKEN.version });
    expect(amountOf(r)).toBe('10000');
  });
  it('adds extra.paymentFlow when the flow is not authorization, and facilitatorAddress for upto', () => {
    const up = buildRequirements({ version: 2, scheme: 'exact', flow: 'upfront', amount: '1', payTo: FIXTURE_PAY_TO });
    expect(up.extra?.paymentFlow).toBe('upfront');
    const upto = buildRequirements({ version: 2, scheme: 'upto', flow: 'authorization', amount: '1', payTo: FIXTURE_PAY_TO });
    expect(upto.extra?.facilitatorAddress).toBe(FIXTURE_FACILITATOR);
    expect(upto.extra?.paymentFlow).toBeUndefined();
  });
  it('builds a V1 requirement with maxAmountRequired and resource fields', () => {
    const r = buildRequirements({ version: 1, scheme: 'exact', flow: 'authorization', amount: '10000', payTo: FIXTURE_PAY_TO });
    expect(r).toMatchObject({ network: 'sim-402402', maxAmountRequired: '10000', outputSchema: null });
    expect('amount' in r).toBe(false);
    expect(amountOf(r)).toBe('10000');
  });
  it('builds PaymentRequired and PaymentPayload for both versions', () => {
    const r2 = buildRequirements({ version: 2, scheme: 'exact', flow: 'authorization', amount: '1', payTo: FIXTURE_PAY_TO });
    const pr2 = buildPaymentRequired(r2);
    expect(pr2).toMatchObject({ x402Version: 2, error: 'PAYMENT-SIGNATURE header is required', accepts: [r2], extensions: {} });
    expect(buildPaymentRequired(r2, 'insufficient_funds').error).toBe('insufficient_funds');
    const p2 = buildPaymentPayload(r2, { signature: '0x' });
    expect(p2).toMatchObject({ x402Version: 2, accepted: r2, payload: { signature: '0x' } });
    const r1 = buildRequirements({ version: 1, scheme: 'exact', flow: 'authorization', amount: '1', payTo: FIXTURE_PAY_TO });
    expect(buildPaymentRequired(r1)).toEqual({ x402Version: 1, error: 'X-PAYMENT header is required', accepts: [r1] });
    expect(buildPaymentPayload(r1, {})).toEqual({ x402Version: 1, scheme: 'exact', network: 'sim-402402', payload: {} });
    expect(buildFacilitatorRequest(p2, r2)).toEqual({ x402Version: 2, paymentPayload: p2, paymentRequirements: r2 });
  });
  it('renders HTTP messages', () => {
    expect(renderHttpRequest({ headers: [['X-PAYMENT', 'abc']] })).toBe('GET /weather HTTP/1.1\nHost: api.example.com\nX-PAYMENT: abc');
    expect(renderHttpResponse({ status: 502, body: { error: 'x' } })).toBe('HTTP/1.1 502 Bad Gateway\n\n{\n  "error": "x"\n}');
    expect(renderFacilitatorCall('/verify', { a: 1 })).toMatch(/^POST \/verify HTTP\/1\.1\n/);
  });
  it('puts V2 PaymentRequired in a base64 header and V1 in the body', () => {
    const r2 = buildRequirements({ version: 2, scheme: 'exact', flow: 'authorization', amount: '1', payTo: FIXTURE_PAY_TO });
    const v2 = render402(buildPaymentRequired(r2));
    expect(v2.header?.name).toBe('PAYMENT-REQUIRED');
    expect(v2.text).toContain(`PAYMENT-REQUIRED: ${v2.header?.value}`);
    const d = decodeHeader(v2.header!.value);
    expect(d.ok && d.value).toEqual(buildPaymentRequired(r2));
    const r1 = buildRequirements({ version: 1, scheme: 'exact', flow: 'authorization', amount: '1', payTo: FIXTURE_PAY_TO });
    const v1 = render402(buildPaymentRequired(r1));
    expect(v1.header).toBeUndefined();
    expect(v1.text).toContain('"maxAmountRequired": "1"');
  });
  it('uses the version header names for the paid request and the settlement response', () => {
    const r1 = buildRequirements({ version: 1, scheme: 'exact', flow: 'authorization', amount: '1', payTo: FIXTURE_PAY_TO });
    expect(renderPaidRequest(buildPaymentPayload(r1, {})).header.name).toBe('X-PAYMENT');
    const s = renderSettledResponse(1, 200, { success: true, transaction: '0x1', network: 'sim-402402' }, {});
    expect(s.header.name).toBe('X-PAYMENT-RESPONSE');
    expect(s.text.startsWith('HTTP/1.1 200 OK')).toBe(true);
    const s2 = renderSettledResponse(2, 402, { success: false, errorReason: 'insufficient_funds', transaction: '', network: 'eip155:402402' }, '{}');
    expect(s2.header.name).toBe('PAYMENT-RESPONSE');
  });
});

describe('typed data and signatures', () => {
  it('makes random 32-byte values', () => {
    expect(randomBytes32()).toMatch(/^0x[0-9a-f]{64}$/);
    expect(randomBytes32()).not.toBe(randomBytes32());
    expect(randomUint256()).toMatch(/^\d+$/);
  });
  it('builds the EIP-3009 authorization like the SDK (validAfter 0, validBefore now + timeout)', () => {
    const a = buildEip3009Authorization({ from: FIXTURE_PAY_TO, to: FIXTURE_PAY_TO, value: '5', now: 100, maxTimeoutSeconds: 60 });
    expect(a.validAfter).toBe('0');
    expect(a.validBefore).toBe('160');
    expect(a.nonce).toMatch(/^0x[0-9a-f]{64}$/);
  });
  it('builds TransferWithAuthorization typed data on the simulated chain with the fixture token', () => {
    const a = buildEip3009Authorization({ from: FIXTURE_PAY_TO, to: FIXTURE_PAY_TO, value: '5', now: 100, maxTimeoutSeconds: 60 });
    const td = transferWithAuthorizationTypedData(a);
    expect(td.primaryType).toBe('TransferWithAuthorization');
    expect(td.domain).toEqual({ name: 'Sim USD', version: '2', chainId: 402402, verifyingContract: FIXTURE_TOKEN.address });
    expect(td.types.TransferWithAuthorization.map((f) => f.name)).toEqual(['from', 'to', 'value', 'validAfter', 'validBefore', 'nonce']);
    expect(td.message.value).toBe(5n);
  });
  it('builds the upto Permit2 witness typed data', () => {
    const a = buildUptoAuthorization({
      from: FIXTURE_PAY_TO,
      to: FIXTURE_PAY_TO,
      facilitator: FIXTURE_FACILITATOR,
      token: FIXTURE_TOKEN.address,
      amount: '9',
      now: 100,
      maxTimeoutSeconds: 60,
    });
    expect(a.deadline).toBe('160');
    expect(a.witness.validAfter).toBe('0');
    const td = permitWitnessTypedData(a);
    expect(td.primaryType).toBe('PermitWitnessTransferFrom');
    expect(td.domain.name).toBe('Permit2');
    expect(td.types.Witness.map((f) => f.name)).toEqual(['to', 'facilitator', 'validAfter']);
  });
  it('signs with an ephemeral key and recovers the same address; a changed value recovers another', async () => {
    const signer = newSigner();
    const a = buildEip3009Authorization({ from: signer.address, to: FIXTURE_PAY_TO, value: '10000', now: NOW, maxTimeoutSeconds: 60 });
    const td = transferWithAuthorizationTypedData(a);
    const sig = await signer.signTypedData(td);
    expect(sig).toMatch(/^0x[0-9a-f]{130}$/);
    expect(sameAddress(await recoverSigner(td, sig), signer.address)).toBe(true);
    const tampered = transferWithAuthorizationTypedData({ ...a, value: '10001' });
    expect(sameAddress(await recoverSigner(tampered, sig), signer.address)).toBe(false);
    expect(digestOf(td)).not.toBe(digestOf(tampered));
  });
  it('tampers the signed amount by one unit for both payload types', async () => {
    const signer = newSigner();
    const a = buildEip3009Authorization({ from: signer.address, to: FIXTURE_PAY_TO, value: '7', now: NOW, maxTimeoutSeconds: 60 });
    const td = transferWithAuthorizationTypedData(a);
    const t = tamperAmount(td);
    expect(t.primaryType === 'TransferWithAuthorization' && t.message.value).toBe(8n);
    const sig = await signer.signTypedData(td);
    expect(sameAddress(await recoverSigner(t, sig), signer.address)).toBe(false);
    const u = permitWitnessTypedData(
      buildUptoAuthorization({ from: signer.address, to: FIXTURE_PAY_TO, facilitator: FIXTURE_FACILITATOR, token: FIXTURE_TOKEN.address, amount: '9', now: NOW, maxTimeoutSeconds: 60 }),
    );
    const tu = tamperAmount(u);
    expect(tu.primaryType === 'PermitWitnessTransferFrom' && tu.message.permitted.amount).toBe(10n);
  });
  it('compares addresses without case and renders bigints for display', () => {
    expect(sameAddress('0xAB', '0xab')).toBe(true);
    const a = buildEip3009Authorization({ from: FIXTURE_PAY_TO, to: FIXTURE_PAY_TO, value: '5', now: 1, maxTimeoutSeconds: 1 });
    const shown = typedDataForDisplay(transferWithAuthorizationTypedData(a)) as { message: { value: unknown } };
    expect(shown.message.value).toBe('5');
  });
});

describe('spend controls', () => {
  it('parses money like the SDK', () => {
    expect(parseMoney('$1')).toBe('1');
    expect(parseMoney(' $0.10 ')).toBe('0.10');
    expect(() => parseMoney('one dollar')).toThrow('Invalid money format');
  });
  it('converts to atomic units and back', () => {
    expect(convertToTokenAmount('1', 6)).toBe('1000000');
    expect(convertToTokenAmount('0.0123456789', 6)).toBe('12345');
    expect(convertToTokenAmount('0', 6)).toBe('0');
    expect(formatAtomic('10000')).toBe('0.01');
    expect(formatAtomic(1_500_000n)).toBe('1.50');
    expect(formatAtomic('1234567')).toBe('1.234567');
  });
  it('allows up to the default $1 cap and rejects above it with the SDK message', () => {
    expect(checkSpendControls('1000000', '$1').allowed).toBe(true);
    const r = checkSpendControls('1000001', '$1');
    expect(r.allowed).toBe(false);
    if (!r.allowed) {
      expect(r.capAtomic).toBe('1000000');
      expect(r.error).toMatch(/^All payment requirements were rejected by spendControls\.maxAmountPerPayment \(\$1, including SIMUSD\)\./);
    }
  });
  it('skips the cap when maxAmountPerPayment is false', () => {
    expect(checkSpendControls('999999999', false)).toMatchObject({ allowed: true, capAtomic: null });
  });
});

describe('payment flow resolution', () => {
  it('maps flows to the spec orderings', () => {
    expect(FLOW_PHASES.authorization).toEqual(['verify', 'resource', 'settle-after']);
    expect(FLOW_PHASES.upfront).toEqual(['settle-before', 'resource']);
    expect(FLOW_PHASES.escrow).toEqual(['settle-before', 'resource', 'settle-after']);
  });
  it('supports exact with authorization and upfront, rejects exact with escrow', () => {
    expect(resolveFlow(2, 'exact', 'authorization').supported).toBe(true);
    expect(resolveFlow(2, 'exact', 'upfront')).toMatchObject({ supported: true, phases: ['settle-before', 'resource'] });
    const e = resolveFlow(2, 'exact', 'escrow');
    expect(e.supported).toBe(false);
    if (!e.supported) expect(e.sdkError).toContain('does not support paymentFlow "escrow"');
  });
  it('supports upto with authorization, rejects upfront, shows escrow as ordering only', () => {
    expect(resolveFlow(2, 'upto', 'authorization')).toMatchObject({ supported: true, assetTransferMethod: 'permit2' });
    expect(resolveFlow(2, 'upto', 'upfront').supported).toBe(false);
    expect(resolveFlow(2, 'upto', 'escrow')).toMatchObject({ supported: true, orderingOnly: true });
  });
  it('limits V1 to exact with authorization', () => {
    expect(resolveFlow(1, 'exact', 'authorization').supported).toBe(true);
    expect(resolveFlow(1, 'upto', 'authorization').supported).toBe(false);
    expect(resolveFlow(1, 'exact', 'upfront').supported).toBe(false);
  });
  it('formats the SDK resolvePaymentFlow error', () => {
    expect(sdkUnsupportedFlowError('upto', 'permit2', 'upfront', ['authorization'], 'authorization')).toBe(
      '[x402] Scheme "upto" assetTransferMethod "permit2" does not support paymentFlow "upfront". Supported: authorization (default: authorization).',
    );
  });
});

describe('facilitator', () => {
  it('keeps a ledger keyed by lowercase address', () => {
    const l = createLedger([['0xABC', 7n]]);
    expect(balanceOf(l, '0xabc')).toBe(7n);
    expect(balanceOf(l, '0xdef')).toBe(0n);
    expect(nonceKey('0xAB', '0xCD')).toBe('0xab:0xcd');
  });
  it('prefers the spec code and falls back to the SDK code', () => {
    expect(reasonOf(EXACT_CODES.recipient)).toBe('invalid_exact_evm_payload_recipient_mismatch');
    expect(reasonOf(EXACT_CODES.nonceUsed)).toBe('invalid_exact_evm_nonce_already_used');
    expect(reasonOf(PERMIT2_CODES.balance)).toBe('insufficient_funds');
    expect(reasonOf(PERMIT2_CODES.deadline)).toBe('permit2_deadline_expired');
  });
  it('verifies, then settles, then refuses the same nonce', async () => {
    const signer = newSigner();
    const req = buildRequirements({ version: 2, scheme: 'exact', flow: 'authorization', amount: '10000', payTo: FIXTURE_PAY_TO }) as RequirementsV2;
    const auth = buildEip3009Authorization({ from: signer.address, to: FIXTURE_PAY_TO, value: '10000', now: NOW, maxTimeoutSeconds: 60 });
    const signature = await signer.signTypedData(transferWithAuthorizationTypedData(auth));
    const payload = buildPaymentPayload(req, { signature, authorization: auth });
    const ledger = createLedger([[signer.address, 50_000n]]);
    const ctx = { version: 2 as const, now: NOW, ledger, network: 'eip155:402402' };
    const v = await verifyExact(payload, req, ctx);
    expect(v.response).toEqual({ isValid: true, payer: signer.address });
    expect(balanceOf(ledger, signer.address)).toBe(50_000n);
    const s = await settlePayment(payload, req, ctx);
    expect(s.response).toMatchObject({ success: true, network: 'eip155:402402', payer: signer.address });
    expect(s.response.transaction).toMatch(/^0x[0-9a-f]{64}$/);
    expect(balanceOf(ledger, signer.address)).toBe(40_000n);
    expect(balanceOf(ledger, FIXTURE_PAY_TO)).toBe(10_000n);
    const again = await verifyPayment(payload, req, ctx);
    expect(again.response.invalidReason).toBe('invalid_exact_evm_nonce_already_used');
  });
  it('rejects a signature from another key', async () => {
    const signer = newSigner();
    const other = newSigner();
    const req = buildRequirements({ version: 2, scheme: 'exact', flow: 'authorization', amount: '10000', payTo: FIXTURE_PAY_TO });
    const auth = buildEip3009Authorization({ from: signer.address, to: FIXTURE_PAY_TO, value: '10000', now: NOW, maxTimeoutSeconds: 60 });
    const signature = await other.signTypedData(transferWithAuthorizationTypedData(auth));
    const v = await verifyExact(buildPaymentPayload(req, { signature, authorization: auth }), req, {
      version: 2,
      now: NOW,
      ledger: createLedger([[signer.address, 50_000n]]),
      network: 'eip155:402402',
    });
    expect(v.response.invalidReason).toBe('invalid_exact_evm_payload_signature');
    expect(v.code?.sdk).toBe('invalid_exact_evm_signature');
  });
  it('checks upto: equal maximum at verify, charge at most the maximum at settle', async () => {
    const signer = newSigner();
    const req = buildRequirements({ version: 2, scheme: 'upto', flow: 'authorization', amount: '20000', payTo: FIXTURE_PAY_TO }) as RequirementsV2;
    const auth = buildUptoAuthorization({
      from: signer.address,
      to: FIXTURE_PAY_TO,
      facilitator: FIXTURE_FACILITATOR,
      token: FIXTURE_TOKEN.address,
      amount: '20000',
      now: NOW,
      maxTimeoutSeconds: 60,
    });
    const signature = await signer.signTypedData(permitWitnessTypedData(auth));
    const payload = buildPaymentPayload(req, { signature, permit2Authorization: auth });
    const ledger = createLedger([[signer.address, 50_000n]]);
    const ctx = { version: 2 as const, now: NOW, ledger, network: 'eip155:402402' };
    expect((await verifyUpto(payload, req, ctx)).response.isValid).toBe(true);
    const over = await settlePayment(payload, { ...req, amount: '20001' }, ctx);
    expect(over.response.errorReason).toBe('invalid_upto_evm_payload_settlement_exceeds_amount');
    const s = await settlePayment(payload, { ...req, amount: '1858' }, ctx);
    expect(s.response).toMatchObject({ success: true, amount: '1858' });
    expect(balanceOf(ledger, signer.address)).toBe(50_000n - 1858n);
  });
  it('builds the @x402/express timeout body', () => {
    expect(facilitatorTimeoutBody('verify', 90_000)).toEqual({ error: 'Facilitator verify request timed out after 90000ms' });
  });
});

describe('runSimulation', () => {
  it('lists the five failure modes plus none', () => {
    expect(FAILURES.map((f) => f.id)).toEqual(['none', 'expired', 'wrong-payto', 'replay', 'insufficient', 'facilitator-down']);
  });

  it('runs the V2 exact authorization happy path in the flow file order', async () => {
    const r = await runSimulation(opts(), newSigner());
    expect(r.outcome.kind).toBe('paid');
    expect(r.steps.map((s) => s.title)).toEqual([
      'GET /weather (no payment header)',
      '402 Payment Required with PAYMENT-REQUIRED',
      'Check spend cap, sign EIP-712 TransferWithAuthorization',
      'Retry GET /weather with PAYMENT-SIGNATURE',
      'POST /verify',
      'VerifyResponse isValid true',
      'Run the handler',
      'POST /settle',
      'Broadcast the transfer',
      'Return the receipt',
      'SettleResponse success true',
      '200 OK with PAYMENT-RESPONSE',
    ]);
    expect(r.headers.map((h) => h.name)).toEqual(['PAYMENT-REQUIRED', 'PAYMENT-SIGNATURE', 'PAYMENT-RESPONSE']);
    expect(r.signing?.matches).toBe(true);
    expect(r.balances?.payToAfter).toBe(10_000n);
    expect(r.steps.every((s) => !s.wire || s.wire.caption.startsWith('Illustrative example, spec version v2.0'))).toBe(true);
  });

  it('runs V1 with X-PAYMENT and X-PAYMENT-RESPONSE', async () => {
    const r = await runSimulation(opts({ version: 1 }), newSigner());
    expect(r.outcome.kind).toBe('paid');
    expect(r.headers.map((h) => h.name)).toEqual(['X-PAYMENT', 'X-PAYMENT-RESPONSE']);
    expect(r.steps[1]?.wire?.text).toContain('"maxAmountRequired": "10000"');
    expect(r.steps[1]?.wire?.caption).toBe('Illustrative example, spec version v1');
  });

  const cases: [SimOptions['failure'], string, string | null][] = [
    ['expired', 'invalid_exact_evm_payload_authorization_valid_before', 'invalid_exact_evm_payload_authorization_valid_before'],
    ['wrong-payto', 'invalid_exact_evm_payload_recipient_mismatch', 'invalid_exact_evm_recipient_mismatch'],
    ['replay', 'invalid_exact_evm_nonce_already_used', null],
    ['insufficient', 'insufficient_funds', 'invalid_exact_evm_insufficient_balance'],
  ];
  it.each(cases)('exact %s fails verify with %s', async (failure, reason, sdk) => {
    const r = await runSimulation(opts({ failure }), newSigner());
    expect(r.outcome.kind).toBe('refused');
    const verify = r.steps.find((s) => s.title.startsWith('VerifyResponse'));
    expect(verify?.status).toBe('fail');
    expect(verify?.wire?.text).toContain(`"invalidReason": "${reason}"`);
    if (sdk) expect(verify?.code?.sdk).toBe(sdk);
    const last = r.steps.at(-1);
    expect(last?.title).toBe('402 with a fresh PAYMENT-REQUIRED');
    const decoded = decodeHeader(last!.wire!.header!.value);
    expect(decoded.ok && (decoded.value as { error: string }).error).toBe(reason);
    expect(r.steps.some((s) => s.title === 'Run the handler')).toBe(false);
  });

  it('answers 502 when the facilitator is down', async () => {
    const r = await runSimulation(opts({ failure: 'facilitator-down' }), newSigner());
    expect(r.outcome.kind).toBe('gateway');
    expect(r.steps.at(-1)?.wire?.text).toContain('Facilitator verify request timed out after 90000ms');
    expect(r.balances?.payToAfter).toBe(0n);
  });

  it('uses the Permit2 codes for upto failures', async () => {
    const expired = await runSimulation(opts({ scheme: 'upto', failure: 'expired' }), newSigner());
    expect(expired.outcome.title).toBe('Refused: permit2_deadline_expired');
    const wrong = await runSimulation(opts({ scheme: 'upto', failure: 'wrong-payto' }), newSigner());
    expect(wrong.outcome.title).toBe('Refused: invalid_permit2_recipient_mismatch');
    const replay = await runSimulation(opts({ scheme: 'upto', failure: 'replay' }), newSigner());
    expect(replay.outcome.title).toBe('Refused: permit2_simulation_failed');
    const low = await runSimulation(opts({ scheme: 'upto', failure: 'insufficient' }), newSigner());
    expect(low.outcome.title).toBe('Refused: insufficient_funds');
  });

  it('settles the metered upto charge', async () => {
    const r = await runSimulation(opts({ scheme: 'upto', amount: '20000', metered: '1858' }), newSigner());
    expect(r.outcome.kind).toBe('paid');
    expect(r.balances?.payToAfter).toBe(1858n);
    const settle = r.steps.find((s) => s.title === 'POST /settle');
    expect(settle?.wire?.text).toContain('"amount": "1858"');
  });

  it('runs upfront without /verify and serves after settle', async () => {
    const r = await runSimulation(opts({ flow: 'upfront' }), newSigner());
    const titles = r.steps.map((s) => s.title);
    expect(titles).not.toContain('POST /verify');
    expect(titles.indexOf('POST /settle (no /verify)')).toBeLessThan(titles.indexOf('Run the handler'));
    expect(r.outcome.kind).toBe('paid');
    const fail = await runSimulation(opts({ flow: 'upfront', failure: 'wrong-payto' }), newSigner());
    expect(fail.outcome.title).toBe('Refused: invalid_exact_evm_payload_recipient_mismatch');
    expect(fail.steps.at(-1)?.title).toBe('402 with PAYMENT-RESPONSE success false');
  });

  it('shows escrow as deposit, resource, claim', async () => {
    const r = await runSimulation(opts({ scheme: 'upto', flow: 'escrow' }), newSigner());
    const titles = r.steps.map((s) => s.title);
    expect(titles.indexOf('POST /settle, payload.type "deposit"')).toBeLessThan(titles.indexOf('Run the handler and meter usage'));
    expect(titles.indexOf('Run the handler and meter usage')).toBeLessThan(titles.indexOf('POST /settle, payload.type "claim"'));
    expect(r.signing).toBeUndefined();
  });

  it('stops before signing when the spend cap rejects the amount', async () => {
    const r = await runSimulation(opts({ amount: '2000000' }), newSigner());
    expect(r.outcome.kind).toBe('blocked');
    expect(r.steps).toHaveLength(3);
    expect(r.signing).toBeUndefined();
    const free = await runSimulation(opts({ amount: '2000000', spendCap: false }), newSigner());
    expect(free.outcome.kind).toBe('paid');
  });

  it('reports unsupported combinations without steps', async () => {
    const r = await runSimulation(opts({ flow: 'escrow' }), newSigner());
    expect(r.outcome.kind).toBe('unsupported');
    expect(r.steps).toHaveLength(0);
  });

  it('signs only on the simulated chain', async () => {
    const r = await runSimulation(opts({ failure: 'wrong-payto' }), newSigner());
    expect(r.signing?.typedData.domain.chainId).toBe(402402);
    const msg = r.signing?.typedData.message as { to: string };
    expect(sameAddress(msg.to, FIXTURE_WRONG_PAY_TO)).toBe(true);
  });
});
