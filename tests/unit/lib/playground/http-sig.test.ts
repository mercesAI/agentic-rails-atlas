import { describe, expect, it } from 'vitest';
import { utf8 } from '@/lib/playground/bytes';
import { generateEs256Key, signBytes, verifyBytes } from '@/lib/playground/es256';
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
  signRequest,
  signatureHeader,
  signatureInputHeader,
  type HttpRequest,
  type SigParams,
} from '@/lib/playground/http-sig';

const req: HttpRequest = {
  method: 'get',
  scheme: 'https',
  authority: 'Shop.Example:443',
  path: '/product/42',
  query: 'size=9',
  headers: { 'user-agent': 'AgentBrowser/1.0', 'signature-agent': 'sig1="https://agent.example", sig2=:AQID:' },
};

describe('Structured Fields subset', () => {
  it('serializes bare items', () => {
    expect(serializeString('a "quoted" \\ string')).toBe('"a \\"quoted\\" \\\\ string"');
    expect(() => serializeString('non-ascii é')).toThrow();
    expect(serializeBareItem(42)).toBe('42');
    expect(serializeBareItem(-7)).toBe('-7');
    expect(() => serializeBareItem(1.5)).toThrow();
    expect(serializeBareItem(true)).toBe('?1');
    expect(serializeBareItem(false)).toBe('?0');
    expect(serializeBareItem(new Uint8Array([1, 2, 3]))).toBe(':AQID:');
    expect(serializeBareItem({ token: 'Ed25519' })).toBe('Ed25519');
    expect(() => serializeBareItem({ token: '9bad' })).toThrow();
  });

  it('round-trips dictionaries with inner lists, parameters and every value type', () => {
    const text = 'sig1=("@method" "@path";key="k");created=1618884473;keyid="test-key", flag, bytes=:AQID:;p=?0, tok=token;n=-3';
    const dict = parseDictionary(text);
    expect(serializeDictionary(dict)).toBe(text);
    expect(dict[1]).toEqual(['flag', { value: true, params: [] }]);
    const item = parseItemText(' "x";a=1;b ');
    expect(item).toEqual({ value: 'x', params: [['a', 1], ['b', true]] });
    expect(() => parseItemText('"x" extra')).toThrow();
    expect(() => parseDictionary('a=1,')).toThrow();
    expect(() => parseDictionary('a=("open')).toThrow();
    expect(() => parseDictionary('a="bad \\n escape"')).toThrow();
    expect(() => parseDictionary('a=:not base64!:')).toThrow();
    expect(() => parseDictionary('a=?2')).toThrow();
    expect(() => parseDictionary('=x')).toThrow();
  });

  it('keeps the last value of a repeated key, as RFC 8941 requires', () => {
    expect(parseDictionary('a=1, a=2')).toEqual([['a', { value: 2, params: [] }]]);
    expect(parseItemText('x;p=1;p=2').params).toEqual([['p', 2]]);
  });
});

describe('RFC 9421 signature base', () => {
  const components = [{ name: '@method' }, { name: '@authority' }, { name: '@path' }, { name: '@query' }, { name: '@target-uri' }, { name: 'user-agent' }, { name: 'signature-agent', key: 'sig1' }];
  const params: SigParams = [
    ['created', 1618884473],
    ['keyid', 'test-key'],
    ['tag', 'web-bot-auth'],
  ];

  it('derives component values', () => {
    expect(normalizeAuthority('Shop.Example:443')).toBe('shop.example');
    expect(componentValue(req, { name: '@method' })).toBe('GET');
    expect(componentValue(req, { name: '@authority' })).toBe('shop.example');
    expect(componentValue({ ...req, path: '' }, { name: '@path' })).toBe('/');
    expect(componentValue(req, { name: '@query' })).toBe('?size=9');
    expect(componentValue(req, { name: '@target-uri' })).toBe('https://shop.example/product/42?size=9');
    expect(componentValue(req, { name: 'user-agent' })).toBe('AgentBrowser/1.0');
    expect(componentValue(req, { name: 'signature-agent', key: 'sig1' })).toBe('"https://agent.example"');
    expect(componentValue(req, { name: 'signature-agent', key: 'sig2' })).toBe(':AQID:');
    expect(() => componentValue(req, { name: 'signature-agent', key: 'nope' })).toThrow();
    expect(() => componentValue(req, { name: '@status' })).toThrow();
    expect(() => componentValue(req, { name: 'User-Agent' })).toThrow();
    expect(() => componentValue(req, { name: 'missing' })).toThrow();
  });

  it('builds the base one line per component, then @signature-params, with no trailing newline', () => {
    expect(serializeComponentId({ name: 'signature-agent', key: 'sig1' })).toBe('"signature-agent";key="sig1"');
    expect(serializeSignatureParams(components.slice(0, 2), params)).toBe('("@method" "@authority");created=1618884473;keyid="test-key";tag="web-bot-auth"');
    const base = buildSignatureBase(req, components, params);
    expect(base).toBe(
      [
        '"@method": GET',
        '"@authority": shop.example',
        '"@path": /product/42',
        '"@query": ?size=9',
        '"@target-uri": https://shop.example/product/42?size=9',
        '"user-agent": AgentBrowser/1.0',
        '"signature-agent";key="sig1": "https://agent.example"',
        '"@signature-params": ("@method" "@authority" "@path" "@query" "@target-uri" "user-agent" "signature-agent";key="sig1");created=1618884473;keyid="test-key";tag="web-bot-auth"',
      ].join('\n'),
    );
    expect(() => buildSignatureBase(req, [{ name: '@path' }, { name: '@path' }], params)).toThrow();
    expect(() => buildSignatureBase({ ...req, headers: { 'x-bad': 'a\nb' } }, [{ name: 'x-bad' }], params)).toThrow();
  });

  it('writes and parses the Signature-Input and Signature headers', () => {
    const input = signatureInputHeader('sig1', components.slice(0, 3), params);
    expect(input).toBe('sig1=("@method" "@authority" "@path");created=1618884473;keyid="test-key";tag="web-bot-auth"');
    const [p] = parseSignatureInput(input);
    expect(p).toEqual({ label: 'sig1', components: components.slice(0, 3), params });
    expect(paramValue(p!.params, 'keyid')).toBe('test-key');
    expect(paramValue(p!.params, 'nonce')).toBeUndefined();
    expect(parseSignatureInput('sig1=("@path");tag="a", sig2=("@path" "signature-agent";key="x");tag="b"').map((s) => s.label)).toEqual(['sig1', 'sig2']);
    expect(() => parseSignatureInput('sig1="not a list"')).toThrow();
    expect(() => parseSignatureInput('sig1=(1)')).toThrow();
    expect(() => parseSignatureInput('sig1=("@path";req)')).toThrow();
    expect(() => parseSignatureInput('sig1=("@path");flag')).toThrow();
    const sig = signatureHeader('sig1', new Uint8Array([1, 2, 3]));
    expect(sig).toBe('sig1=:AQID:');
    expect(parseSignatureHeader(sig).get('sig1')).toEqual(new Uint8Array([1, 2, 3]));
    expect(() => parseSignatureHeader('sig1="text"')).toThrow();
    expect(rewriteParam(input, 'sig1', 'created', 1)).toBe('sig1=("@method" "@authority" "@path");created=1;keyid="test-key";tag="web-bot-auth"');
    expect(rewriteParam(input, 'other', 'created', 1)).toBe(input);
  });

  it('signs with the caller-provided signer and verifies against the rebuilt base', async () => {
    const key = await generateEs256Key('agent');
    const signed = await signRequest(req, { label: 'sig1', components: components.slice(0, 3), params, sign: (base) => signBytes(base, key.privateKey) });
    expect(signed.base).toBe(buildSignatureBase(req, components.slice(0, 3), params));
    expect(signed.signatureInput.startsWith('sig1=(')).toBe(true);
    expect(parseSignatureHeader(signed.signature).get('sig1')).toEqual(signed.sigBytes);
    expect(await verifyBytes(signed.base, signed.sigBytes, key.publicKey)).toBe(true);
    const [parsed] = parseSignatureInput(signed.signatureInput);
    const rebuilt = buildSignatureBase({ ...req, path: '/product/43' }, parsed!.components, parsed!.params);
    expect(await verifyBytes(rebuilt, signed.sigBytes, key.publicKey)).toBe(false);
    const fake = await signRequest(req, { label: 'sig1', components: [], params: [], sign: async (base) => utf8(base).slice(0, 4) });
    expect(fake.sigBytes).toHaveLength(4);
  });

  it('renders a request as HTTP/1.1 text', () => {
    expect(renderHttp({ ...req, headers: { 'user-agent': 'A/1' } }, [['Signature', 'sig1=:AQID:']])).toBe('GET /product/42?size=9 HTTP/1.1\nHost: Shop.Example:443\nUser-Agent: A/1\nSignature: sig1=:AQID:');
  });
});
