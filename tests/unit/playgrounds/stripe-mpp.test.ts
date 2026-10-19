import { describe, expect, it } from 'vitest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import type { Hex } from 'viem';
import { base64ToUtf8, base64UrlToUtf8, bytesToBase64Url, utf8ToBase64, utf8ToBase64Url } from '@/lib/playground/bytes';
import { canonicalize } from '@/lib/playground/canonical-json';
import { decodeJson, encodeCanonical, encodeJson, isCanonical } from '@/playgrounds/stripe-mpp/lib/codec';
import {
  PAYMENT_AUTHORIZATION,
  bindingInput,
  buildCredential,
  computeChallengeId,
  credentialField,
  expiresIn,
  generateServerKey,
  importHmacKey,
  issueChallenge,
  parseChallenge,
  parseCredential,
  problem,
  serializeAcceptPayment,
  serializeChallenge,
  serializeCredential,
  serializeReceipt,
  verifyCredential,
  type ServerState,
} from '@/playgrounds/stripe-mpp/lib/challenge';
import { FIXTURE_ESCROW, FIXTURE_RECIPIENT, FIXTURE_TOKEN, GRACE_PERIOD_SECONDS, SIM_CHAIN_ID, formatUnits, parseUnits } from '@/playgrounds/stripe-mpp/lib/fixtures';
import { INTENT_SPEC, METHODS, isValidMethodId, methodsFor, supports } from '@/playgrounds/stripe-mpp/lib/methods';
import { buildRequest, buildSimplePayload, didPkh } from '@/playgrounds/stripe-mpp/lib/intents';
import {
  acceptVoucher,
  advanceClock,
  consume,
  cooperativeClose,
  exposure,
  graceRemaining,
  initialChannel,
  openChannel,
  recoverVoucherSigner,
  requestClose,
  sessionReceipt,
  settle,
  signVoucher,
  simulatedChannelId,
  topUp,
  voucherDomain,
  voucherPayload,
  voucherTypedData,
  withdraw,
  type VoucherSigner,
} from '@/playgrounds/stripe-mpp/lib/session';
import {
  chainIdFromCaip2,
  requestFromRequirement,
  sampleX402,
  translatePaymentRequired,
  translatePaymentResponse,
  translatePaymentSignature,
} from '@/playgrounds/stripe-mpp/lib/translate';

const NOW = new Date('2026-10-11T12:00:00Z');

describe('codec', () => {
  it('base64url round-trips without padding', () => {
    const enc = utf8ToBase64Url('{"a":"é?>"}');
    expect(enc).not.toMatch(/[=+/]/);
    expect(base64UrlToUtf8(enc)).toBe('{"a":"é?>"}');
    expect(bytesToBase64Url(new Uint8Array([251, 255]))).toBe('-_8');
  });
  it('rejects non-base64url input', () => {
    expect(() => base64UrlToUtf8('ab+c')).toThrow();
    expect(() => base64UrlToUtf8('abcde')).toThrow();
  });
  it('canonicalizes with sorted keys and no whitespace', () => {
    expect(canonicalize({ b: 1, a: [true, null, 'x'], c: { z: 1, y: undefined } })).toBe('{"a":[true,null,"x"],"b":1,"c":{"z":1}}');
    expect(() => canonicalize(Number.NaN)).toThrow();
  });
  it('matches the core draft test vector encoding', () => {
    expect(encodeCanonical({ amount: '1000000' })).toBe('eyJhbW91bnQiOiIxMDAwMDAwIn0');
    expect(encodeCanonical({ pi: 'pi_123' })).toBe('eyJwaSI6InBpXzEyMyJ9');
  });
  it('decodes JSON and reports errors', () => {
    const d = decodeJson(encodeJson({ x: 1 }));
    expect(d.ok && d.value).toEqual({ x: 1 });
    expect(decodeJson('').ok).toBe(false);
    expect(decodeJson(utf8ToBase64Url('not json')).ok).toBe(false);
  });
  it('detects non-canonical request encodings', () => {
    expect(isCanonical(encodeCanonical({ b: 1, a: 2 }))).toBe(true);
    expect(isCanonical(utf8ToBase64Url('{"b":1,"a":2}'))).toBe(false);
  });
  it('standard base64 round-trips', () => {
    expect(base64ToUtf8(utf8ToBase64('x402 ✓'))).toBe('x402 ✓');
  });
});

describe('fixtures', () => {
  it('formats and parses units', () => {
    expect(formatUnits(1_500_000n)).toBe('1.5');
    expect(formatUnits(25n)).toBe('0.000025');
    expect(parseUnits('0.01')).toBe(10_000n);
    expect(() => parseUnits('1.0000001')).toThrow();
    expect(() => parseUnits('abc')).toThrow();
  });
});

describe('challenge binding (core HMAC-SHA256 test vectors)', () => {
  const base = { realm: 'api.example.com', method: 'tempo', intent: 'charge', request: 'eyJhbW91bnQiOiIxMDAwMDAwIn0' };
  it('builds the slot layout', () => {
    expect(bindingInput(base)).toBe('api.example.com|tempo|charge|eyJhbW91bnQiOiIxMDAwMDAwIn0|||');
    expect(bindingInput({ ...base, header: PAYMENT_AUTHORIZATION })).toBe(
      'api.example.com|tempo|charge|eyJhbW91bnQiOiIxMDAwMDAwIn0|||Payment-Authorization|',
    );
  });
  it('reproduces the three spec ids', async () => {
    const key = await importHmacKey('test-vector-secret');
    expect(await computeChallengeId(key, base)).toBe('X6v1eo7fJ76gAxqY0xN9Jd__4lUyDDYmriryOM-5FO4');
    expect(await computeChallengeId(key, { ...base, header: PAYMENT_AUTHORIZATION })).toBe('S91xi-OFGZPMs-j7GsX0FDpIkmCcZT1P9XyV58WNy_U');
    expect(await computeChallengeId(key, { ...base, header: PAYMENT_AUTHORIZATION, opaque: 'eyJwaSI6InBpXzEyMyJ9' })).toBe(
      'CJ4X1O4aTDmS59hfdhnhBtxIQjWDOf0bcrhsswwMOW8',
    );
  });
  it('ignores description in the binding', async () => {
    const key = await importHmacKey('test-vector-secret');
    expect(await computeChallengeId(key, { ...base, description: 'anything' })).toBe('X6v1eo7fJ76gAxqY0xN9Jd__4lUyDDYmriryOM-5FO4');
  });
});

async function setup(extra: Record<string, string> = {}) {
  const key = await generateServerKey();
  const state: ServerState = { key, realm: 'api.example.com', used: new Set() };
  const ch = await issueChallenge(key, {
    realm: 'api.example.com',
    method: 'tempo',
    intent: 'charge',
    request: encodeCanonical(buildRequest('charge', { amount: 10_000n })),
    expires: expiresIn(NOW, 300),
    ...extra,
  });
  return { key, state, ch };
}

describe('challenge serialization and verification', () => {
  it('serializes and parses WWW-Authenticate', async () => {
    const { ch } = await setup({ description: 'Say "hi"' });
    const value = serializeChallenge(ch);
    expect(value.startsWith('Payment id="')).toBe(true);
    expect(parseChallenge(value)).toEqual(ch);
    expect(() => parseChallenge('Bearer x')).toThrow();
    expect(() => parseChallenge('Payment id="", realm="a", method="b", intent="c", request="d"')).toThrow();
    expect(() => parseChallenge('Payment id="a", realm="a", method="b", intent="c", request="d", header="X-Pay"')).toThrow();
  });
  it('selects the credential field from header', async () => {
    const { ch } = await setup();
    expect(credentialField(ch)).toBe('Authorization');
    expect(credentialField({ ...ch, header: PAYMENT_AUTHORIZATION })).toBe('Payment-Authorization');
  });
  it('builds, serializes and parses a credential', async () => {
    const { ch } = await setup();
    const cred = buildCredential(ch, buildSimplePayload('charge', '0xabc'), didPkh('0x1'));
    const [field, value] = serializeCredential(cred);
    expect(field).toBe('Authorization');
    expect(parseCredential(value)).toEqual(cred);
    expect(() => parseCredential('Payment !!')).toThrow();
    expect(buildSimplePayload('subscription', '0xab')).toEqual({ type: 'keyAuthorization', signature: '0xab00' });
  });
  it('accepts once, then detects replay', async () => {
    const { state, ch } = await setup();
    const [field, value] = serializeCredential(buildCredential(ch, { type: 'hash', hash: '0x1' }));
    const first = await verifyCredential(state, value, { field, now: NOW, reference: '0x1' });
    expect(first.status).toBe(200);
    if (first.status === 200) {
      expect(first.receipt).toMatchObject({ status: 'success', method: 'tempo', reference: '0x1', timestamp: '2026-10-11T12:00:00Z' });
      expect(decodeJson(serializeReceipt(first.receipt)).ok).toBe(true);
    }
    const again = await verifyCredential(state, value, { field, now: NOW, reference: '0x1' });
    expect(again.status === 402 && again.problem.type).toBe('https://paymentauth.org/problems/invalid-challenge');
  });
  it('detects a changed parameter', async () => {
    const { state, ch } = await setup();
    const tampered = { ...ch, request: encodeCanonical(buildRequest('charge', { amount: 1n })) };
    const [field, value] = serializeCredential(buildCredential(tampered, {}));
    const v = await verifyCredential(state, value, { field, now: NOW, reference: 'r' });
    expect(v.status === 402 && v.problem.type.endsWith('invalid-challenge')).toBe(true);
  });
  it('reports expiry, malformed, proof failure, wrong field and policy denial', async () => {
    const { state, ch } = await setup();
    const [field, value] = serializeCredential(buildCredential(ch, {}));
    const late = await verifyCredential(state, value, { field, now: new Date(NOW.getTime() + 301_000), reference: 'r' });
    expect(late.status === 402 && late.problem.type.endsWith('payment-expired')).toBe(true);
    const bad = await verifyCredential(state, 'Payment @@', { field, now: NOW, reference: 'r' });
    expect(bad.status === 402 && bad.problem.type.endsWith('malformed-credential')).toBe(true);
    const wrongField = await verifyCredential(state, value, { field: 'Payment-Authorization', now: NOW, reference: 'r' });
    expect(wrongField.status).toBe(402);
    const proof = await verifyCredential(state, value, { field, now: NOW, proofValid: false, reference: 'r' });
    expect(proof.status === 402 && proof.problem.type.endsWith('verification-failed')).toBe(true);
    const denied = await verifyCredential(state, value, { field, now: NOW, policyDenies: true, reference: 'r' });
    expect(denied.status).toBe(403);
  });
  it('builds problem documents and Accept-Payment', () => {
    expect(problem('method-unsupported', 'x')).toEqual({
      type: 'https://paymentauth.org/problems/method-unsupported',
      title: 'Method Unsupported',
      status: 400,
      detail: 'x',
    });
    expect(serializeAcceptPayment([{ method: 'tempo', intent: 'charge' }, { method: 'stripe', intent: 'charge', q: 0.5 }])).toBe(
      'tempo/charge, stripe/charge;q=0.5',
    );
    expect(expiresIn(NOW, 60)).toBe('2026-10-11T12:01:00Z');
  });
});

describe('intents and methods', () => {
  it('builds tempo requests per intent on the simulated chain', () => {
    const charge = buildRequest('charge', { amount: 5n, description: 'd', externalId: 'e' });
    expect(charge).toMatchObject({ amount: '5', currency: FIXTURE_TOKEN.address, recipient: FIXTURE_RECIPIENT, methodDetails: { chainId: SIM_CHAIN_ID } });
    const sub = buildRequest('subscription', { amount: 5n, periodUnit: 'week', periodCount: 1 });
    expect(sub).toMatchObject({ periodUnit: 'week', periodCount: '1', methodDetails: { accessKey: { keyType: 'p256' } } });
    const sess = buildRequest('session', { amount: 25n, suggestedDeposit: 1000n });
    expect(sess).toMatchObject({ unitType: 'llm_token', suggestedDeposit: '1000', methodDetails: { escrowContract: FIXTURE_ESCROW, sessionProtocol: 'v1' } });
    expect(sess).not.toHaveProperty('expires');
    expect(didPkh('0xA')).toBe('did:pkh:eip155:402402:0xA');
  });
  it('lists the 11 method ids and their intents', () => {
    expect(METHODS).toHaveLength(11);
    expect(METHODS.every((m) => isValidMethodId(m.id))).toBe(true);
    expect(isValidMethodId('Tempo')).toBe(false);
    expect(supports('tempo', 'session')).toBe(true);
    expect(supports('card', 'session')).toBe(false);
    expect(methodsFor('subscription')).toEqual(['tempo', 'stripe']);
    expect(INTENT_SPEC.session).toMatch(/per method|each method/i);
  });
});

function makeSigner(): VoucherSigner {
  const account = privateKeyToAccount(generatePrivateKey());
  return { address: account.address, signTypedData: (td) => account.signTypedData(td) };
}

describe('Tempo session', () => {
  const salt = `0x${'aa'.repeat(32)}` as Hex;
  it('builds v1 voucher typed data', () => {
    expect(voucherDomain()).toEqual({ name: 'Tempo Stream Channel', version: '1', chainId: 402402, verifyingContract: FIXTURE_ESCROW });
    const td = voucherTypedData(salt, 5n);
    expect(td.types.Voucher[1]).toEqual({ name: 'cumulativeAmount', type: 'uint128' });
  });
  it('signs and recovers vouchers', async () => {
    const signer = makeSigner();
    const id = simulatedChannelId(signer.address, FIXTURE_RECIPIENT, FIXTURE_TOKEN.address, salt);
    expect(id).toMatch(/^0x[0-9a-f]{64}$/);
    const v = await signVoucher(signer, id, 100n);
    expect(await recoverVoucherSigner(v)).toBe(signer.address);
    expect(await recoverVoucherSigner({ ...v, signature: '0x1234' })).toBeNull();
    expect(voucherPayload('voucher', v)).toEqual({ action: 'voucher', channelId: id, cumulativeAmount: '100', signature: v.signature });
  });
  it('runs a metered session with cooperative close', async () => {
    const signer = makeSigner();
    const id = simulatedChannelId(signer.address, FIXTURE_RECIPIENT, FIXTURE_TOKEN.address, salt);
    let s = initialChannel(25n, 10n);
    expect(consume(s, 1).status).toBe(410);
    s = openChannel(s, id, 1000n).state;
    expect(openChannel(s, id, 1n).ok).toBe(false);
    const short = consume(s, 4);
    expect(short.problemType).toBe('https://paymentauth.org/problems/session/insufficient-balance');
    expect(short.requiredTopUp).toBe(100n);
    let r = await acceptVoucher(s, await signVoucher(signer, id, 100n), signer.address);
    expect(r.ok).toBe(true);
    s = r.state;
    expect((await acceptVoucher(s, await signVoucher(signer, id, 100n), signer.address)).message).toMatch(/idempotent/);
    expect((await acceptVoucher(s, await signVoucher(signer, id, 50n), signer.address)).ok).toBe(false);
    expect((await acceptVoucher(s, await signVoucher(signer, id, 105n), signer.address)).problemType).toMatch(/delta-too-small$/);
    expect((await acceptVoucher(s, await signVoucher(signer, id, 2000n), signer.address)).problemType).toMatch(/amount-exceeds-deposit$/);
    expect((await acceptVoucher(s, await signVoucher(makeSigner(), id, 200n), signer.address)).problemType).toMatch(/signer-mismatch$/);
    expect((await acceptVoucher(s, { channelId: id, cumulativeAmount: 200n, signature: '0x00' }, signer.address)).problemType).toMatch(/invalid-signature$/);
    expect((await acceptVoucher(s, await signVoucher(signer, salt, 200n), signer.address)).status).toBe(410);
    s = consume(s, 4).state;
    expect(s.spent).toBe(100n);
    expect(exposure(s)).toEqual({ unserved: 0n, worstCase: 1000n });
    s = topUp(s, 500n).state;
    expect(s.deposit).toBe(1500n);
    expect(topUp(s, 0n).ok).toBe(false);
    r = await acceptVoucher(s, await signVoucher(signer, id, 300n), signer.address);
    s = r.state;
    s = consume(s, 2).state;
    expect(exposure(s).unserved).toBe(150n);
    expect(sessionReceipt(s, 'cid', '2026-10-11T12:00:00Z', 2)).toMatchObject({ reference: id, acceptedCumulative: '300', spent: '150', units: 2 });
    const closed = cooperativeClose(s);
    expect(closed.state).toMatchObject({ phase: 'closed', paidToPayee: 150n, refundedToPayer: 1350n });
    expect(consume(closed.state, 1).problemType).toMatch(/channel-finalized$/);
    expect(topUp(closed.state, 1n).status).toBe(410);
    expect(cooperativeClose(closed.state).ok).toBe(false);
  });
  it('enforces the forced close grace period', async () => {
    const signer = makeSigner();
    const id = simulatedChannelId(signer.address, FIXTURE_RECIPIENT, FIXTURE_TOKEN.address, salt);
    let s = openChannel(initialChannel(10n), id, 1000n).state;
    s = (await acceptVoucher(s, await signVoucher(signer, id, 400n), signer.address)).state;
    s = consume(s, 10).state;
    expect(withdraw(s).ok).toBe(false);
    s = requestClose(s).state;
    expect(requestClose(s).ok).toBe(false);
    expect(graceRemaining(s)).toBe(GRACE_PERIOD_SECONDS);
    expect((await acceptVoucher(s, await signVoucher(signer, id, 500n), signer.address)).simplification).toBeDefined();
    s = advanceClock(s, 600);
    expect(withdraw(s).ok).toBe(false);
    s = settle(s).state;
    expect(s.settledOnChain).toBe(400n);
    s = advanceClock(s, GRACE_PERIOD_SECONDS);
    expect(graceRemaining(s)).toBe(0);
    const w = withdraw(s);
    expect(w.state).toMatchObject({ phase: 'closed', paidToPayee: 400n, refundedToPayer: 600n });
    expect(settle(w.state).ok).toBe(false);
    expect(settle(initialChannel(1n)).status).toBe(410);
  });
});

describe('x402 translator', () => {
  it('maps CAIP-2 networks and requirements', () => {
    expect(chainIdFromCaip2('eip155:402402')).toBe(402402);
    expect(chainIdFromCaip2('solana:abc')).toBeNull();
    expect(requestFromRequirement({ scheme: 'exact', network: 'x', amount: '1', asset: 'a', payTo: 'b', maxTimeoutSeconds: 1 })).toBeNull();
  });
  it('translates the three headers', async () => {
    const key = await generateServerKey();
    const sample = sampleX402(NOW, '0x1111111111111111111111111111111111111111');
    const req = await translatePaymentRequired(sample.required, key, NOW);
    expect(req.ok).toBe(true);
    expect(req.header?.[0]).toBe('WWW-Authenticate');
    const ch = parseChallenge(req.header![1]);
    expect(ch).toMatchObject({ method: 'evm', intent: 'charge', expires: '2026-10-11T12:01:00Z' });
    const reqJson = decodeJson(ch.request);
    expect(reqJson.ok && reqJson.value).toMatchObject({ amount: '10000', methodDetails: { chainId: 402402, credentialTypes: ['authorization'] } });
    const sig = translatePaymentSignature(sample.signature, ch);
    expect(sig.header?.[0]).toBe('Authorization');
    expect(parseCredential(sig.header![1]).payload).toMatchObject({ type: 'authorization', value: '10000' });
    const resp = translatePaymentResponse(sample.response, NOW);
    expect(resp.header?.[0]).toBe('Payment-Receipt');
    expect(resp.decoded).toMatchObject({ status: 'success', method: 'evm', reference: `0x${'cd'.repeat(32)}` });
  });
  it('refuses upto, bad base64 and failed settlements', async () => {
    const key = await generateServerKey();
    const upto = btoa(JSON.stringify({ x402Version: 2, accepts: [{ scheme: 'upto', network: 'eip155:1', amount: '1', asset: 'a', payTo: 'b', maxTimeoutSeconds: 1 }] }));
    expect((await translatePaymentRequired(upto, key, NOW)).ok).toBe(false);
    expect((await translatePaymentRequired('%%', key, NOW)).ok).toBe(false);
    expect((await translatePaymentRequired(btoa('{"accepts":[]}'), key, NOW)).ok).toBe(false);
    expect(translatePaymentSignature('%%', {} as never).ok).toBe(false);
    expect(translatePaymentSignature(btoa('{"payload":{}}'), {} as never).ok).toBe(false);
    expect(translatePaymentResponse(btoa('{"success":false}'), NOW).ok).toBe(false);
    expect(translatePaymentResponse('%%', NOW).ok).toBe(false);
  });
});
