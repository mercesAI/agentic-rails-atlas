import { describe, expect, it } from 'vitest';
import { base64ToBytes, base64UrlToBytes, bytesToBase64, bytesToBase64Url, randomBase64Url } from '@/lib/playground/bytes';
import { jwkThumbprint } from '@/lib/playground/es256';
import {
  buildSignatureBase,
  componentValue,
  normalizeAuthority,
  paramValue,
  parseDictionary,
  parseItemText,
  parseSignatureHeader,
  parseSignatureInput,
  renderHttp,
  rewriteParam,
  serializeBareItem,
  serializeComponentId,
  serializeDictionary,
  serializeSignatureParams,
  serializeString,
  signatureHeader,
  signatureInputHeader,
  type HttpRequest,
  type SigParams,
} from '@/lib/playground/http-sig';
import { algFromLabel, generateAgentKey, importPrivateJwk, importPublicJwk, signText, supportsEd25519, tapAlgLabel, verifyText } from '@/playgrounds/visa-tap/lib/keys';
import { signRequest } from '@/playgrounds/visa-tap/lib/signature';
import {
  STEP_ORDER,
  isNonceSeen,
  missingMinimumFields,
  pickSignature,
  pruneNonces,
  rememberNonce,
  verifyRequest,
  type KeyDirectory,
} from '@/playgrounds/visa-tap/lib/verifier';
import {
  COMPARISON,
  COMPONENT_CHOICES,
  CONSUMER_FIELDS,
  ILLUSTRATIVE_LABEL,
  PAYMENT_FIELDS,
  SPEC_QUIRKS,
  TAMPERS,
  WINDOW_CHOICES,
  requestFor,
} from '@/playgrounds/visa-tap/lib/fixtures';
import {
  browsingIou,
  checkObject,
  consumerObject,
  decodeJwtPart,
  fixtureIdToken,
  idTokenClaims,
  idTokenHeader,
  objectSigningBase,
  paymentContainer,
  signObject,
  withValue,
} from '@/playgrounds/visa-tap/lib/objects';

// RFC 9421 Appendix B.1.4 test-key-ed25519 and Appendix B.2.6 (signing a request using ed25519).
const RFC_ED25519 = { kty: 'OKP', crv: 'Ed25519', x: 'JrQLj5P_89iXES9-vFgrIy29clF9CC_oPPsw3c5D0bs' };
const RFC_ED25519_D = 'n4Ni-HpISpVObnQMW0wOhCKROaIKqKtW_2ZYb2p9KcU';
const RFC_B26_BASE = [
  '"date": Tue, 20 Apr 2021 02:07:55 GMT',
  '"@method": POST',
  '"@path": /foo',
  '"@authority": example.com',
  '"content-type": application/json',
  '"content-length": 18',
  '"@signature-params": ("date" "@method" "@path" "@authority" "content-type" "content-length");created=1618884473;keyid="test-key-ed25519"',
].join('\n');
const RFC_B26_SIG = 'wqcAqbmYJ2ji2glfAMaRy4gruYYnx2nEFN2HN6jrnDnQCK1u02Gb04v9EDgwUPiu4A0w6vuQv5lIp5WPpBKRCw==';
// RFC 9421 Appendix B.2 test request (POST /foo?param=Value&Pet=dog).
const RFC_REQ: HttpRequest = {
  method: 'POST',
  scheme: 'https',
  authority: 'example.com',
  path: '/foo',
  query: 'param=Value&Pet=dog',
  headers: {
    date: 'Tue, 20 Apr 2021 02:07:55 GMT',
    'content-type': 'application/json',
    'content-digest': 'sha-512=:WZDPaVn/7XgHaAy8pmojAkGWoRx2UFChF41A2svX+TaPm+AbwAgBWnrIiYllu7BNNyealdVLvRwEmTHWXvJwew==:',
    'content-length': '18',
  },
};
const B26_COMPONENTS = ['date', '@method', '@path', '@authority', 'content-type', 'content-length'].map((name) => ({ name }));
const B26_PARAMS: SigParams = [
  ['created', 1618884473],
  ['keyid', 'test-key-ed25519'],
];

describe('structured fields', () => {
  it('serializes strings, integers, booleans, bytes and tokens', () => {
    expect(serializeString('a"b\\c')).toBe('"a\\"b\\\\c"');
    expect(() => serializeString('é')).toThrow();
    expect(serializeBareItem(42)).toBe('42');
    expect(serializeBareItem(true)).toBe('?1');
    expect(serializeBareItem(new Uint8Array([1, 2, 3]))).toBe(':AQID:');
    expect(serializeBareItem({ token: 'sha-256' })).toBe('sha-256');
    expect(() => serializeBareItem(1.5)).toThrow();
  });
  it('round-trips a dictionary with inner lists and parameters', () => {
    const text = 'sig2=("@authority" "@path");created=1;keyid="k";tag="agent-browser-auth", flag;a=?0';
    const dict = parseDictionary(text);
    expect(dict.map(([k]) => k)).toEqual(['sig2', 'flag']);
    expect(serializeDictionary(dict)).toBe(text);
  });
  it('parses items and rejects junk', () => {
    expect(parseItemText('"x";key="y"').params).toEqual([['key', 'y']]);
    expect(() => parseItemText('"unterminated')).toThrow();
    expect(() => parseDictionary('a=1,')).toThrow();
    expect(() => parseDictionary('a=1 b=2')).toThrow();
  });
  it('converts base64 and base64url', () => {
    const bytes = new Uint8Array([251, 255, 0, 7]);
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
    expect(bytesToBase64Url(bytes)).toBe('-_8ABw');
    expect(base64UrlToBytes('-_8ABw')).toEqual(bytes);
  });
});

describe('RFC 9421 signature base', () => {
  it('rebuilds the Appendix B.2.6 base byte for byte', () => {
    expect(buildSignatureBase(RFC_REQ, B26_COMPONENTS, B26_PARAMS)).toBe(RFC_B26_BASE);
  });
  it('rebuilds the Appendix B.2.1 minimal base (empty covered list)', () => {
    const params: SigParams = [
      ['created', 1618884473],
      ['keyid', 'test-key-rsa-pss'],
      ['nonce', 'b3k2pp5k7z-50gnwp.yemd'],
    ];
    expect(buildSignatureBase(RFC_REQ, [], params)).toBe(
      '"@signature-params": ();created=1618884473;keyid="test-key-rsa-pss";nonce="b3k2pp5k7z-50gnwp.yemd"',
    );
  });
  it('produces the Appendix B.2.6 Ed25519 signature with the RFC test key', async () => {
    if (!(await supportsEd25519())) return;
    const priv = await importPrivateJwk({ ...RFC_ED25519, d: RFC_ED25519_D }, 'ed25519');
    const out = await signRequest(RFC_REQ, { label: 'sig-b26', components: B26_COMPONENTS, params: B26_PARAMS, alg: 'ed25519', privateKey: priv });
    expect(out.signature).toBe(`sig-b26=:${RFC_B26_SIG}:`);
    expect(out.signatureInput).toBe('sig-b26=("date" "@method" "@path" "@authority" "content-type" "content-length");created=1618884473;keyid="test-key-ed25519"');
    const pub = await importPublicJwk(RFC_ED25519, 'ed25519');
    expect(await verifyText('ed25519', pub, RFC_B26_BASE, base64ToBytes(RFC_B26_SIG))).toBe(true);
  });
  it('derives component values', () => {
    expect(componentValue(RFC_REQ, { name: '@query' })).toBe('?param=Value&Pet=dog');
    expect(componentValue(RFC_REQ, { name: '@target-uri' })).toBe('https://example.com/foo?param=Value&Pet=dog');
    expect(componentValue({ ...RFC_REQ, query: '' }, { name: '@query' })).toBe('?');
    expect(componentValue({ ...RFC_REQ, headers: { 'signature-agent': 'sig1="https://agent.example"' } }, { name: 'signature-agent', key: 'sig1' })).toBe('"https://agent.example"');
    expect(() => componentValue(RFC_REQ, { name: 'user-agent' })).toThrow(/not in the request/);
    expect(() => componentValue(RFC_REQ, { name: '@status' })).toThrow();
    expect(normalizeAuthority('Shop.Example:443')).toBe('shop.example');
  });
  it('serializes component ids and signature params', () => {
    expect(serializeComponentId({ name: 'signature-agent', key: 'sig1' })).toBe('"signature-agent";key="sig1"');
    expect(serializeSignatureParams([{ name: '@authority' }, { name: '@path' }], [['created', 1], ['tag', 'agent-browser-auth']])).toBe(
      '("@authority" "@path");created=1;tag="agent-browser-auth"',
    );
    expect(() => buildSignatureBase(RFC_REQ, [{ name: '@path' }, { name: '@path' }], [])).toThrow(/twice/);
  });
  it('parses Signature-Input and Signature headers and rewrites a parameter', () => {
    const input = signatureInputHeader('sig2', [{ name: '@authority' }, { name: '@path' }], [['created', 10], ['nonce', 'n'], ['tag', 'agent-browser-auth']]);
    const [p] = parseSignatureInput(input);
    expect(p?.label).toBe('sig2');
    expect(p?.components.map((c) => c.name)).toEqual(['@authority', '@path']);
    expect(paramValue(p!.params, 'created')).toBe(10);
    expect(rewriteParam(input, 'sig2', 'tag', 'web-bot-auth')).toContain('tag="web-bot-auth"');
    const sig = signatureHeader('sig2', new Uint8Array([1, 2]));
    expect(parseSignatureHeader(sig).get('sig2')).toEqual(new Uint8Array([1, 2]));
    expect(() => parseSignatureHeader('sig2="x"')).toThrow();
    expect(renderHttp(requestFor('agent-browser-auth'), [['Signature', sig]])).toMatch(/^GET \/example-product\?color=blue HTTP\/1.1\nHost: shop.example\nUser-Agent: ExampleAgent\/1.0\nSignature: /);
  });
});

describe('keys', () => {
  it('labels algorithms and round-trips the label', () => {
    expect(tapAlgLabel('ed25519')).toBe('Ed25519');
    expect(algFromLabel('Ed25519')).toBe('ed25519');
    expect(algFromLabel('ecdsa-p256-sha256')).toBe('ecdsa-p256-sha256');
    expect(algFromLabel('PS256')).toBeNull();
  });
  it('signs and verifies with an ephemeral ECDSA P-256 key (fallback path)', async () => {
    const k = await generateAgentKey('ecdsa-p256-sha256');
    const sig = await signText('ecdsa-p256-sha256', k.privateKey, 'hello');
    expect(sig.length).toBe(64);
    expect(await verifyText('ecdsa-p256-sha256', k.publicKey, 'hello', sig)).toBe(true);
    expect(await verifyText('ecdsa-p256-sha256', k.publicKey, 'hellO', sig)).toBe(false);
  });
  it('computes the RFC 7638 thumbprint example', async () => {
    // RFC 7638 Section 3.1 example RSA key and thumbprint.
    const jwk = {
      kty: 'RSA',
      e: 'AQAB',
      n: '0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw',
    };
    expect(await jwkThumbprint(jwk)).toBe('NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs');
    await expect(jwkThumbprint({ kty: 'oct' })).rejects.toThrow();
  });
  it('makes distinct random nonces', () => {
    const a = randomBase64Url(32);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(randomBase64Url(32)).not.toBe(a);
  });
  it('detects Ed25519 support without throwing', async () => {
    expect(typeof (await supportsEd25519())).toBe('boolean');
  });
});

async function tapSetup(alg: 'ed25519' | 'ecdsa-p256-sha256' = 'ecdsa-p256-sha256') {
  const k = await generateAgentKey(alg);
  const directory: KeyDirectory = new Map([['agent-key-1', { alg, key: k.publicKey }]]);
  const now = 1_800_000_000;
  const req = requestFor('agent-browser-auth');
  const params: SigParams = [
    ['created', now - 10],
    ['keyid', 'agent-key-1'],
    ['alg', tapAlgLabel(alg)],
    ['expires', now - 10 + 480],
    ['nonce', 'nonce-1'],
    ['tag', 'agent-browser-auth'],
  ];
  const signed = await signRequest(req, { label: 'sig2', components: [{ name: '@authority' }, { name: '@path' }], params, alg, privateKey: k.privateKey });
  return { k, directory, now, req, params, signed };
}

describe('verifier decision tree', () => {
  it('accepts a valid TAP request and walks every step', async () => {
    const { directory, now, req, signed } = await tapSetup();
    const r = await verifyRequest({ req, signatureInput: signed.signatureInput, signature: signed.signature }, { now, directory, seen: new Map(), profile: 'tap' });
    expect(r.ok).toBe(true);
    expect(r.steps.map((s) => s.id)).toEqual(STEP_ORDER);
    expect(r.steps.every((s) => s.status === 'pass')).toBe(true);
    expect(r.base).toBe(signed.base);
    expect(r.nonce).toBe('nonce-1');
  });
  it('blocks each failure at the right step', async () => {
    const { directory, now, req, signed, k } = await tapSetup();
    const base = { now, directory, seen: new Map<string, number>(), profile: 'tap' as const };
    const failAt = async (input: Parameters<typeof verifyRequest>[0], ctx = base) => {
      const r = await verifyRequest(input, ctx);
      expect(r.ok).toBe(false);
      return r.steps.find((s) => s.status === 'fail')?.id;
    };
    const good = { req, signatureInput: signed.signatureInput, signature: signed.signature };
    expect(await failAt({ req, signatureInput: signed.signatureInput })).toBe('headers-present');
    expect(await failAt({ ...good, req: { ...req, path: '/other' } })).toBe('verify-signature');
    expect(await failAt({ ...good, req: { ...req, authority: 'evil.example' } })).toBe('verify-signature');
    expect(await failAt({ ...good, signatureInput: rewriteParam(signed.signatureInput, 'sig2', 'keyid', 'nope') })).toBe('key-lookup');
    expect(await failAt({ ...good, signatureInput: rewriteParam(signed.signatureInput, 'sig2', 'tag', 'web-bot-auth') })).toBe('tag-allowed');
    expect(await failAt({ ...good, signatureInput: rewriteParam(signed.signatureInput, 'sig2', 'tag', 'agent-payer-auth') })).toBe('verify-signature');
    expect(await failAt(good, { ...base, now: now + 600 })).toBe('time-window');
    expect(await failAt(good, { ...base, now: now - 100 })).toBe('time-window');
    expect(await failAt(good, { ...base, seen: rememberNonce(new Map(), 'nonce-1', now) })).toBe('nonce-unused');
    const noPath = await signRequest(req, { label: 'sig2', components: [{ name: '@authority' }], params: signed.base ? parseSignatureInput(signed.signatureInput)[0]!.params : [], alg: 'ecdsa-p256-sha256', privateKey: k.privateKey });
    expect(await failAt({ req, signatureInput: noPath.signatureInput, signature: noPath.signature })).toBe('minimum-fields');
    const withUa = await signRequest(req, { label: 'sig2', components: [{ name: '@authority' }, { name: '@path' }, { name: 'user-agent' }], params: parseSignatureInput(signed.signatureInput)[0]!.params, alg: 'ecdsa-p256-sha256', privateKey: k.privateKey });
    expect(await failAt({ req: { ...req, headers: {} }, signatureInput: withUa.signatureInput, signature: withUa.signature })).toBe('rebuild-base');
  });
  it('blocks a 3,600-second window like the spec example', async () => {
    const { directory, now, req, k, params } = await tapSetup();
    const long: SigParams = params.map(([n, v]) => (n === 'expires' ? [n, now - 10 + 3600] : [n, v]));
    const s = await signRequest(req, { label: 'sig2', components: [{ name: '@authority' }, { name: '@path' }], params: long, alg: 'ecdsa-p256-sha256', privateKey: k.privateKey });
    const r = await verifyRequest({ req, signatureInput: s.signatureInput, signature: s.signature }, { now, directory, seen: new Map(), profile: 'tap' });
    expect(r.steps.find((x) => x.status === 'fail')?.detail).toMatch(/3600 s; the limit is 480 s/);
  });
  it('rejects an alg that does not match the directory key', async () => {
    const { directory, now, req, signed } = await tapSetup();
    const input = rewriteParam(signed.signatureInput, 'sig2', 'alg', 'Ed25519');
    const r = await verifyRequest({ req, signatureInput: input, signature: signed.signature }, { now, directory, seen: new Map(), profile: 'tap' });
    expect(r.steps.find((x) => x.status === 'fail')?.id).toBe('key-lookup');
  });
  it('verifies a Web Bot Auth shaped request with a covered Signature-Agent', async () => {
    const k = await generateAgentKey('ecdsa-p256-sha256');
    const kid = await jwkThumbprint(k.publicJwk);
    const now = 1_800_000_000;
    const req = { ...requestFor('agent-browser-auth'), headers: { 'signature-agent': 'sig1="https://agent.example"' } };
    const comps = [{ name: '@authority' }, { name: 'signature-agent', key: 'sig1' }];
    const params: SigParams = [['created', now], ['expires', now + 300], ['keyid', kid], ['tag', 'web-bot-auth']];
    const s = await signRequest(req, { label: 'sig1', components: comps, params, alg: 'ecdsa-p256-sha256', privateKey: k.privateKey });
    expect(s.base).toContain('"signature-agent";key="sig1": "https://agent.example"');
    const directory: KeyDirectory = new Map([[kid, { alg: 'ecdsa-p256-sha256', key: k.publicKey }]]);
    const r = await verifyRequest({ req, signatureInput: s.signatureInput, signature: s.signature }, { now, directory, seen: new Map(), profile: 'wba' });
    expect(r.ok).toBe(true);
    expect(r.steps.find((x) => x.id === 'nonce-unused')?.status).toBe('note');
    expect(missingMinimumFields(parseSignatureInput(s.signatureInput)[0]!, 'wba', { ...req, headers: {} })).toContain('Signature-Agent header');
  });
  it('manages the nonce seen-set and picks the TAP label', () => {
    let store = rememberNonce(new Map(), 'a', 100);
    expect(isNonceSeen(store, 'a', 200)).toBe(true);
    expect(isNonceSeen(store, 'a', 600)).toBe(false);
    store = pruneNonces(store, 600);
    expect(store.size).toBe(0);
    const sigs = parseSignatureInput('sig1=("@path");tag="web-bot-auth", sig2=("@path");tag="agent-payer-auth"');
    expect(pickSignature(sigs, 'tap')?.label).toBe('sig2');
    expect(pickSignature(sigs, 'wba')?.label).toBe('sig1');
  });
});

describe('body objects', () => {
  it('builds, signs and verifies both objects and reports spec outcomes on tamper', async () => {
    const k = await generateAgentKey('ecdsa-p256-sha256');
    const now = 1_800_000_000;
    const parts = { nonce: 'n-1', kid: 'agent-key-1', alg: 'ecdsa-p256-sha256' };
    const lookup = (kid: string) => (kid === 'agent-key-1' ? { alg: 'ecdsa-p256-sha256' as const, key: k.publicKey } : undefined);
    const consumer = await signObject(consumerObject(parts, now), 'ecdsa-p256-sha256', k.privateKey);
    expect(Object.keys(consumer)).toEqual(['nonce', 'idToken', 'contextualData', 'kid', 'alg', 'signature']);
    expect((await checkObject('consumer', consumer, { messageNonce: 'n-1', lookup })).ok).toBe(true);
    const zip = await checkObject('consumer', withValue(consumer, 'contextualData.zip', '10001'), { messageNonce: 'n-1', lookup });
    expect(zip.ok).toBe(false);
    expect(zip.consequence).toMatch(/may be inaccurate/);
    const pay = await signObject(paymentContainer(parts, 'payload'), 'ecdsa-p256-sha256', k.privateKey);
    const wrongNonce = await checkObject('payment', pay, { messageNonce: 'other', lookup });
    expect(wrongNonce.checks.find((c) => c.label.startsWith('Nonce'))?.ok).toBe(false);
    expect(wrongNonce.consequence).toMatch(/should not be used/);
    const iou = await signObject(browsingIou(parts), 'ecdsa-p256-sha256', k.privateKey);
    const withIou = await signObject(paymentContainer(parts, 'browsingIOU', iou), 'ecdsa-p256-sha256', k.privateKey);
    expect(Object.keys(withIou.browsingIOU as object)).toContain('sequenceCounter');
    expect((await checkObject('payment', withIou, { messageNonce: 'n-1', lookup })).ok).toBe(true);
    const { kid: _drop, ...noKid } = withIou;
    const missing = await checkObject('payment', noKid, { messageNonce: 'n-1', lookup });
    expect(missing.checks[0]?.detail).toMatch(/kid/);
    expect(missing.checks.find((c) => c.label.startsWith('Key located'))?.detail).not.toMatch(/undefined/);
    expect(() => withValue(consumer, 'nonce.x', 1)).toThrow();
  });
  it('encodes the fixture ID token and its signing base', () => {
    const tok = fixtureIdToken(1000);
    const [h, p, s] = tok.split('.');
    expect(decodeJwtPart(h!)).toEqual(idTokenHeader());
    expect(decodeJwtPart(p!)).toEqual(idTokenClaims(1000));
    expect(s).toBe('fixture-not-signed');
    expect(objectSigningBase({ b: 1, signature: 'x', a: 2 })).toBe('{"b":1,"a":2}');
  });
});

describe('fixtures', () => {
  it('carries the labels, quirks and field tables', () => {
    expect(ILLUSTRATIVE_LABEL).toBe('Illustrative example, Visa TAP specification (undated, read 2026-10-11)');
    expect(SPEC_QUIRKS.join(' ')).toMatch(/3,600 seconds/);
    expect(COMPONENT_CHOICES.filter((c) => c.required).map((c) => c.label)).toEqual(['@authority', '@path']);
    expect(CONSUMER_FIELDS.map((f) => f.field)).toContain('idToken');
    expect(PAYMENT_FIELDS.map((f) => f.field)).toContain('browsingIOU');
    expect(COMPARISON.length).toBeGreaterThan(5);
    expect(TAMPERS[0]?.value).toBe('none');
    expect(WINDOW_CHOICES.map((w) => w.value)).toContain(3600);
    expect(requestFor('agent-payer-auth').method).toBe('POST');
    for (const t of [...SPEC_QUIRKS, ...COMPARISON.flatMap((r) => [r.tap, r.wba])]) expect(t).not.toMatch(/—/);
  });
});
