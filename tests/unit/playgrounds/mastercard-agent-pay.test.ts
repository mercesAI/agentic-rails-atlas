import { beforeAll, describe, expect, it } from 'vitest';
import { b64Decode, b64Encode, b64urlDecode, b64urlDecodeJson, b64urlEncode, b64urlEncodeJson, ellipsize, fromUtf8, pretty, randomB64url, sha256B64url, utf8 } from '@/playgrounds/mastercard-agent-pay/lib/encoding';
import { decodeJws, generateEs256Key, importEs256PublicJwk, jwkThumbprint, sameJwk, signBytes, signJws, verifyBytes, verifyJws } from '@/playgrounds/mastercard-agent-pay/lib/jws';
import { decodeDisclosure, makeDisclosure, makePropertyDisclosure, parseSdJwt, resolveRefs, serializeSdJwt } from '@/playgrounds/mastercard-agent-pay/lib/sdjwt';
import { fixtureToken, formatMinor, merchantById, MERCHANTS } from '@/playgrounds/mastercard-agent-pay/lib/fixtures';
import { MASTERCARD_TAG, addToDirectory, paramsLine, parseSignatureInput, signRequest, signatureBase, verifyAtEdge, type FixtureDirectory } from '@/playgrounds/mastercard-agent-pay/lib/httpsig';
import {
  EXTENSIONS,
  NOT_PUBLISHED,
  PUBLISHED,
  STATES,
  authorize,
  consentDigest,
  findTransition,
  isUsable,
  provisionToken,
  revoke,
  signConsent,
  stateAfterAttempt,
  stateLabel,
  type Controls,
} from '@/playgrounds/mastercard-agent-pay/lib/lifecycle';
import { FAULTS, TYP, VCT, buildChain, defaultViConfig, generateViKeys, humanDuration, inspectLayer, lifetimeOf, trustFor, type FaultId, type Mode, type VIKeys } from '@/playgrounds/mastercard-agent-pay/lib/vi';
import { verifyChain } from '@/playgrounds/mastercard-agent-pay/lib/vi-verify';
import states from '@/content/states/mastercard-agent-pay-token-lifecycle.json';

const NOW = 1_791_720_000;

describe('encoding', () => {
  it('round-trips base64url, JSON and standard base64', () => {
    const bytes = new Uint8Array([251, 255, 0, 1, 2]);
    expect(b64urlDecode(b64urlEncode(bytes))).toEqual(bytes);
    expect(b64urlEncode(bytes)).not.toMatch(/[+/=]/);
    expect(b64Decode(b64Encode(bytes))).toEqual(bytes);
    expect(b64urlDecodeJson(b64urlEncodeJson({ a: 1 }))).toEqual({ a: 1 });
    expect(fromUtf8(utf8('x'))).toBe('x');
    expect(() => b64urlDecode('a+b')).toThrow();
  });
  it('hashes, randomizes and formats', async () => {
    expect(await sha256B64url('abc')).toBe('ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0');
    expect(randomB64url()).not.toBe(randomB64url());
    expect(pretty({ a: 1 })).toContain('\n');
    expect(ellipsize('x'.repeat(100), 4)).toBe('xxxx...xxxx');
    expect(ellipsize('short')).toBe('short');
  });
});

describe('jws', () => {
  it('signs and verifies, rejects tampering and other keys', async () => {
    const k = await generateEs256Key('a');
    const other = await generateEs256Key('b');
    const jws = await signJws({ typ: 'JWT' }, { n: 1 }, k.privateKey);
    expect(decodeJws(jws).header.alg).toBe('ES256');
    expect(await verifyJws(jws, k.publicJwk)).toBe(true);
    expect(await verifyJws(jws, other.publicJwk)).toBe(false);
    const [h, , s] = jws.split('.');
    expect(await verifyJws(`${h}.${b64urlEncodeJson({ n: 2 })}.${s}`, k.publicJwk)).toBe(false);
    expect(await verifyJws('nonsense', k.publicJwk)).toBe(false);
    expect(() => decodeJws('a.b')).toThrow();
  });
  it('signs raw bytes, imports keys, compares JWKs and thumbprints', async () => {
    const k = await generateEs256Key('a');
    const sig = await signBytes('m', k.privateKey);
    expect(sig.length).toBe(64);
    expect(await verifyBytes('m', sig, await importEs256PublicJwk(k.publicJwk))).toBe(true);
    expect(await verifyBytes('m', sig.slice(0, 10), k.publicKey)).toBe(false);
    expect(sameJwk(k.publicJwk, { ...k.publicJwk })).toBe(true);
    expect(sameJwk(k.publicJwk, undefined)).toBe(false);
    expect(await jwkThumbprint(k.publicJwk)).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});

describe('sdjwt', () => {
  it('makes, decodes and serializes disclosures', async () => {
    const d = await makeDisclosure({ a: 1 }, 'salt');
    expect(decodeDisclosure(d.encoded)).toEqual({ salt: 'salt', value: { a: 1 } });
    expect(d.digest).toBe(await sha256B64url(d.encoded));
    const p = await makePropertyDisclosure('email', 'x@example.com', 's');
    expect(decodeDisclosure(p.encoded)).toEqual({ salt: 's', name: 'email', value: 'x@example.com' });
    expect(() => decodeDisclosure(b64urlEncodeJson([1]))).toThrow();
    const s = serializeSdJwt('a.b.c', [d.encoded, p.encoded]);
    expect(s.endsWith('~')).toBe(true);
    expect(parseSdJwt(s)).toEqual({ jwt: 'a.b.c', disclosures: [d.encoded, p.encoded] });
    expect(parseSdJwt('a.b.c~')).toEqual({ jwt: 'a.b.c', disclosures: [] });
  });
  it('resolves references and leaves missing ones undisclosed', async () => {
    const m = await makeDisclosure({ name: 'M' });
    const res = await resolveRefs([{ '...': m.digest }, { '...': 'nope' }, 'plain'], [m.encoded, 'garbage']);
    expect(res.value).toEqual([{ name: 'M' }, 'plain']);
    expect(res.undisclosed).toEqual(['nope']);
  });
});

describe('fixtures', () => {
  it('has fixture merchants, tokens and money formatting', () => {
    expect(MERCHANTS.every((m) => m.website.endsWith('.example.com'))).toBe(true);
    expect(merchantById('merchant-tennis').name).toBe('Court Supply');
    expect(merchantById('missing').id).toBe(MERCHANTS[0]?.id);
    expect(formatMinor(27999)).toBe('279.99 USD');
    expect(fixtureToken('abcdefghijk')).toBe('FIXTURE-AGENTIC-TOKEN-ABCDEFGH');
    expect(fixtureToken('abc')).not.toMatch(/^\d{12,19}$/);
  });
});

describe('httpsig edge verification', () => {
  let dir: FixtureDirectory;
  let key: Awaited<ReturnType<typeof generateEs256Key>>;
  let keyid: string;
  const req = { authority: 'shop.example.com', path: '/product/42' };
  beforeAll(async () => {
    dir = new Map();
    key = await generateEs256Key('agent');
    keyid = await addToDirectory(dir, key);
  });

  it('builds the parameter line and signature base', () => {
    const line = paramsLine({ created: 1, expires: 2, keyid: 'k', alg: 'ecdsa-p256-sha256', nonce: 'n', tag: MASTERCARD_TAG });
    expect(line).toBe('("@authority" "@path");created=1;expires=2;keyid="k";alg="ecdsa-p256-sha256";nonce="n";tag="Agent-pay-auth"');
    expect(signatureBase('a', '/p', line).split('\n')).toHaveLength(3);
    const parsed = parseSignatureInput(`sig1=${line}`);
    expect(parsed).toMatchObject({ components: ['@authority', '@path'], created: 1, expires: 2, keyid: 'k', tag: 'Agent-pay-auth' });
    expect(parseSignatureInput('nonsense')).toBeUndefined();
  });

  it('passes a good request as a trusted agent', async () => {
    const signed = await signRequest(req, key, { created: NOW, keyid });
    const r = await verifyAtEdge(signed, dir, NOW + 5, new Set());
    expect(r.verdict).toBe('trusted-agent');
    expect(r.steps.every((s) => s.status === 'pass')).toBe(true);
    expect(signed.signatureInput).toContain('tag="Agent-pay-auth"');
  });

  it('treats a missing signature as an ordinary bot', async () => {
    const r = await verifyAtEdge({ ...req }, dir, NOW, new Set());
    expect(r.verdict).toBe('ordinary-bot');
    expect(r.steps[0]?.status).toBe('fail');
    expect(r.steps.slice(1).every((s) => s.status === 'skipped')).toBe(true);
  });

  it('blocks a missing parameter, unknown key, expired window, replayed nonce, wrong tag and tampered path', async () => {
    const good = await signRequest(req, key, { created: NOW, keyid });
    const noNonce = { ...good, signatureInput: good.signatureInput?.replace(/;nonce="[^"]*"/, '') };
    expect((await verifyAtEdge(noNonce, dir, NOW, new Set())).steps.find((s) => s.status === 'fail')?.id).toBe('parameters');

    const stranger = await generateEs256Key('stranger');
    const unknown = await signRequest(req, stranger, { created: NOW, keyid: 'unregistered-keyid' });
    const u = await verifyAtEdge(unknown, dir, NOW, new Set());
    expect(u).toMatchObject({ verdict: 'blocked', outcome: 'Block the request' });
    expect(u.steps.find((s) => s.status === 'fail')?.id).toBe('key-lookup');

    expect((await verifyAtEdge(good, dir, NOW + 10_000, new Set())).steps.find((s) => s.status === 'fail')?.id).toBe('window');
    expect((await verifyAtEdge(good, dir, NOW - 100, new Set())).steps.find((s) => s.status === 'fail')?.id).toBe('window');

    const seen = new Set<string>();
    expect((await verifyAtEdge(good, dir, NOW + 1, seen)).verdict).toBe('trusted-agent');
    expect(seen.size).toBe(1);
    const replay = await verifyAtEdge(good, dir, NOW + 2, seen);
    expect(replay.steps.find((s) => s.status === 'fail')?.id).toBe('nonce');

    const visaTag = await signRequest(req, key, { created: NOW, keyid, tag: 'agent-browser-auth' });
    expect((await verifyAtEdge(visaTag, dir, NOW, new Set())).steps.find((s) => s.status === 'fail')?.id).toBe('tag');

    const moved = { ...good, path: '/product/43' };
    const t = await verifyAtEdge(moved, dir, NOW, new Set());
    expect(t.steps.find((s) => s.status === 'fail')?.id).toBe('signature');
    const badSig = { ...good, signature: 'sig1=:AAAA:' };
    expect((await verifyAtEdge(badSig, dir, NOW, new Set())).verdict).toBe('blocked');
    expect((await verifyAtEdge({ ...good, signature: 'garbage' }, dir, NOW, new Set())).verdict).toBe('blocked');
  });
});

describe('lifecycle', () => {
  const controls: Controls = { limitMinor: 10000, merchantIds: ['merchant-audioshop'], expiresAt: NOW + 3600, singleUse: false };

  it('matches the state machine JSON on the page', () => {
    expect(STATES.map((s) => s.id).sort()).toEqual(states.states.map((s) => s.id).sort());
    for (const t of states.transitions) expect(findTransition(t.from as never, t.to as never)).toBeDefined();
    expect(PUBLISHED).toHaveLength(states.transitions.length);
    expect(EXTENSIONS.every((e) => !e.published)).toBe(true);
    expect(stateLabel('authorized')).toBe('Authorized');
    expect(findTransition('declined', 'presented')).toBeUndefined();
    expect(findTransition('declined', 'presented', true)).toBeDefined();
  });

  it('authorizes inside the controls', () => {
    const t = provisionToken(controls, NOW);
    expect(t.value).toMatch(/^FIXTURE-AGENTIC-TOKEN-/);
    const r = authorize(t, { amountMinor: 5000, merchantId: 'merchant-audioshop', now: NOW + 1 });
    expect(r).toEqual({ approved: true, reasons: [], responseCode: NOT_PUBLISHED });
  });

  it('declines above the limit, out of scope, expired, revoked and reused', () => {
    const t = provisionToken({ ...controls, singleUse: true }, NOW);
    expect(authorize(t, { amountMinor: 10001, merchantId: 'merchant-audioshop', now: NOW }).reasons).toEqual(['amount-over-limit']);
    expect(authorize(t, { amountMinor: 1, merchantId: 'merchant-other', now: NOW }).reasons).toEqual(['merchant-out-of-scope']);
    expect(authorize(t, { amountMinor: 1, merchantId: 'merchant-audioshop', now: NOW + 7200 }).reasons).toEqual(['token-expired']);
    expect(authorize({ ...t, uses: 1 }, { amountMinor: 1, merchantId: 'merchant-audioshop', now: NOW }).reasons).toEqual(['single-use-consumed']);
    const revoked = { ...t, revoked: true };
    const r = authorize(revoked, { amountMinor: 1, merchantId: 'merchant-audioshop', now: NOW });
    expect(r.approved).toBe(false);
    expect(r.reasons).toContain('token-revoked');
    expect(r.responseCode).toBe('not published');
    expect(isUsable(t, NOW)).toBe(true);
    expect(isUsable(revoked, NOW)).toBe(false);
    expect(isUsable(t, NOW + 7200)).toBe(false);
  });

  it('walks states for approved, declined, unusable and revoked paths', () => {
    const ok = stateAfterAttempt('token-provisioned', true, true);
    expect(ok.state).toBe('authorized');
    expect(ok.path.map((p) => p.to)).toEqual(['presented', 'authorized']);
    expect(ok.path.every((p) => p.published)).toBe(true);
    const again = stateAfterAttempt('authorized', true, false);
    expect(again.state).toBe('declined');
    expect(again.path[0]?.published).toBe(false);
    const dead = stateAfterAttempt('token-provisioned', false, false);
    expect(dead.state).toBe('expired-or-revoked');
    expect(dead.path[0]?.published).toBe(true);
    const revokedPath = stateAfterAttempt('token-provisioned', false, false, true);
    expect(revokedPath.path[0]?.published).toBe(false);
    expect(stateAfterAttempt('expired-or-revoked', false, false).path).toEqual([]);
    expect(revoke('authorized')?.published).toBe(false);
    expect(revoke('agent-registered')).toBeUndefined();
  });

  it('signs a passkey consent challenge and passes its own self-check', async () => {
    const pk = await generateEs256Key('passkey');
    const c = await signConsent(pk, 'keyid-1', controls);
    expect(c.selfCheck).toBe(true);
    expect(b64urlDecodeJson<{ agent: string }>(c.challenge).agent).toBe('keyid-1');
    expect(await consentDigest(c)).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});

describe('Verifiable Intent builder and verifier', () => {
  let keys: VIKeys;
  beforeAll(async () => {
    keys = await generateViKeys();
  });
  const run = async (mode: Mode, fault: FaultId, extra: Partial<ReturnType<typeof defaultViConfig>> = {}) => {
    const cfg = { ...defaultViConfig(mode), fault, ...extra };
    const art = await buildChain(keys, cfg, NOW);
    return { art, report: await verifyChain(art, trustFor(keys, NOW, cfg.spentSoFar)) };
  };
  const failedIds = (r: Awaited<ReturnType<typeof run>>) => r.report.failures.map((c) => c.id);

  it('builds an Autonomous chain with the documented headers, vct values and bindings', async () => {
    const { art, report } = await run('autonomous', 'none');
    expect(report.ok).toBe(true);
    expect(report.checks.filter((c) => c.status === 'warn')).toHaveLength(0);
    const l1 = await inspectLayer(art.l1);
    const l2 = await inspectLayer(art.l2);
    const l3a = await inspectLayer(art.l3a as string);
    const l3b = await inspectLayer(art.l3b as string);
    expect(l1.header).toMatchObject({ alg: 'ES256', typ: TYP.l1 });
    expect(l1.payload).toMatchObject({ vct: VCT.l1, scheme: 'mastercard', _sd_alg: 'sha-256' });
    expect(l1.payload.sd_hash).toBeUndefined();
    expect(l2.header.typ).toBe('kb-sd-jwt+kb');
    expect(l2.payload.sd_hash).toBe(await sha256B64url(art.l1));
    const vcts = l2.disclosures.map((d) => (d.decoded as [string, { vct?: string }])[1]?.vct).filter(Boolean);
    expect(vcts).toEqual([VCT.checkoutOpen, VCT.paymentOpen]);
    expect(l3a.header).toMatchObject({ typ: 'kb-sd-jwt', kid: 'agent-key-1' });
    expect(l3a.payload.cnf).toBeUndefined();
    expect(lifetimeOf(l3a.payload)).toBe(300);
    expect(lifetimeOf(l2.payload)).toBe(30 * 86400);
    const pay = (l3a.disclosures[0]?.decoded as [string, Record<string, unknown>])[1];
    const chk = (l3b.disclosures[0]?.decoded as [string, Record<string, unknown>])[1];
    expect(pay.transaction_id).toBe(chk.checkout_hash);
    expect(chk.checkout_hash).toBe(await sha256B64url(String(chk.checkout_jwt)));
  });

  it('builds and verifies Immediate mode with no cnf and no L3', async () => {
    const { art, report } = await run('immediate', 'none');
    expect(report.ok).toBe(true);
    expect(art.l3a).toBeUndefined();
    const l2 = await inspectLayer(art.l2);
    expect(l2.header.typ).toBe('kb-sd-jwt');
    expect(lifetimeOf(l2.payload)).toBe(900);
    expect(report.checks.find((c) => c.id === 'l2-no-cnf')?.status).toBe('pass');
    expect(report.checks.find((c) => c.id === 'imm-transaction-id')?.status).toBe('pass');
  });

  it('breaks L1 signature and the L2 sd_hash when an L1 claim is edited', async () => {
    for (const mode of ['immediate', 'autonomous'] as const) {
      const r = await run(mode, 'tamper-l1');
      expect(failedIds(r)).toEqual(['l1-sig', 'l2-sd-hash']);
      expect(r.report.firstFailure?.layer).toBe('L1');
    }
  });

  it('breaks the L2 signature, and the L3 sd_hash values, when an L2 claim is edited', async () => {
    expect(failedIds(await run('immediate', 'tamper-l2'))).toEqual(['l2-sig']);
    expect(failedIds(await run('autonomous', 'tamper-l2'))).toEqual(['l2-sig', 'L3a-sd-hash', 'L3b-sd-hash']);
  });

  it('breaks the delegate_payload reference when a mandate disclosure is edited', async () => {
    const imm = await run('immediate', 'tamper-mandate');
    expect(failedIds(imm)).toContain('l2-refs');
    const auto = await run('autonomous', 'tamper-mandate');
    expect(failedIds(auto)).toEqual(expect.arrayContaining(['l2-refs', 'L3a-sd-hash']));
  });

  it('detects a different checkout paired with the payment', async () => {
    expect(failedIds(await run('immediate', 'checkout-swap'))).toEqual(['imm-transaction-id']);
    const auto = await run('autonomous', 'checkout-swap');
    expect(failedIds(auto)).toEqual(['hash-link']);
    expect(auto.report.checks.find((c) => c.id === 'hash-checkout')?.status).toBe('pass');
  });

  it('treats lifetimes as recommendations except where the spec says must not', async () => {
    const imm = await run('immediate', 'l2-too-long');
    expect(imm.report.ok).toBe(true);
    expect(imm.report.checks.find((c) => c.id === 'l2-life')?.status).toBe('warn');
    const auto = await run('autonomous', 'l2-too-long');
    expect(failedIds(auto)).toEqual(['l2-within-l1']);
    const l3 = await run('autonomous', 'l3-lifetime-long');
    expect(failedIds(l3)).toEqual(['L3a-max-life', 'L3b-max-life']);
    expect(l3.report.checks.find((c) => c.id === 'L3a-rec-life')?.status).toBe('warn');
  });

  it('keeps signatures valid but fails constraints when the agent oversteps', async () => {
    const over = await run('autonomous', 'amount-over-max');
    expect(failedIds(over)).toEqual(['c-amount']);
    expect(over.report.checks.find((c) => c.id === 'L3a-sig')?.status).toBe('pass');
    const merch = await run('autonomous', 'merchant-not-allowed');
    expect(failedIds(merch)).toEqual(['c-merchant']);
  });

  it('fails L3 signatures for a key outside cnf and rejects a split cnf', async () => {
    expect(failedIds(await run('autonomous', 'wrong-agent-key'))).toEqual(['L3a-sig', 'L3b-sig']);
    const split = await run('autonomous', 'cnf-split');
    expect(failedIds(split)).toEqual(expect.arrayContaining(['l2-cnf-same']));
  });

  it('breaks the L3a reference when its amount is edited after signing', async () => {
    const r = await run('autonomous', 'tamper-l3a');
    expect(failedIds(r)).toEqual(['L3a-refs']);
    expect(r.report.checks.find((c) => c.id === 'hash-link')?.status).toBe('skipped');
  });

  it('enforces a budget from network state and the optional constraint', async () => {
    expect((await run('autonomous', 'none', { budgetMax: 50000, spentSoFar: 0 })).report.ok).toBe(true);
    const over = await run('autonomous', 'none', { budgetMax: 50000, spentSoFar: 30000 });
    expect(failedIds(over)).toEqual(['c-budget']);
    expect((await run('autonomous', 'none')).report.checks.find((c) => c.id === 'c-budget')).toBeUndefined();
  });

  it('rejects an amount below the minimum and an empty L2', async () => {
    expect(failedIds(await run('autonomous', 'none', { amountMinor: 5000 }))).toEqual(['c-amount']);
    const art = await buildChain(keys, defaultViConfig('autonomous'), NOW);
    const bad = await verifyChain({ ...art, l2: 'garbage' }, trustFor(keys, NOW));
    expect(bad.failures.at(-1)?.id).toBe('l2-parse');
    expect((await verifyChain({ ...art, l1: 'garbage' }, trustFor(keys, NOW))).firstFailure?.id).toBe('l1-parse');
    expect((await verifyChain({ ...art, l3b: undefined }, trustFor(keys, NOW))).firstFailure?.id).toBe('l3-parse');
  });

  it('rejects expired credentials past the clock skew', async () => {
    const art = await buildChain(keys, defaultViConfig('autonomous'), NOW);
    const late = await verifyChain(art, trustFor(keys, NOW + 3600));
    expect(late.failures.map((f) => f.id)).toEqual(['L3a-exp', 'L3b-exp']);
    const within = await verifyChain(art, trustFor(keys, NOW + 300 + 300));
    expect(within.ok).toBe(true);
  });

  it('lists a fault entry for every id, scoped to modes, and formats durations', () => {
    expect(new Set(FAULTS.map((f) => f.id)).size).toBe(FAULTS.length);
    expect(FAULTS.filter((f) => f.modes.includes('immediate')).length).toBeGreaterThan(4);
    expect(humanDuration(86400)).toBe('1 day');
    expect(humanDuration(30 * 86400)).toBe('30 days');
    expect(humanDuration(3600)).toBe('1 hour');
    expect(humanDuration(300)).toBe('5 minutes');
    expect(humanDuration(45)).toBe('45 seconds');
    expect(lifetimeOf({})).toBeUndefined();
  });
});
