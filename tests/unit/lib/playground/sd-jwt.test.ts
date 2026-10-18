import { describe, expect, it } from 'vitest';
import { base64UrlEncodeJson, sha256Base64Url } from '@/lib/playground/bytes';
import {
  SD_ALG,
  concealArray,
  concealProperty,
  decodeDisclosure,
  makeArrayDisclosure,
  makePropertyDisclosure,
  parseSdJwt,
  resolveDisclosures,
  serializeSdJwt,
} from '@/lib/playground/sd-jwt';

describe('SD-JWT core', () => {
  it('builds array and property disclosures with digests over the encoded string', async () => {
    expect(SD_ALG).toBe('sha-256');
    const d = await makeArrayDisclosure({ id: 'm1' }, 'salt');
    expect(d.encoded).toBe(base64UrlEncodeJson(['salt', { id: 'm1' }]));
    expect(decodeDisclosure(d.encoded)).toEqual({ salt: 'salt', value: { id: 'm1' } });
    expect(d.digest).toBe(await sha256Base64Url(d.encoded));
    expect(d.salt).toBe('salt');
    const p = await makePropertyDisclosure('checkout_jwt', 'abc', 'salt2');
    expect(p.name).toBe('checkout_jwt');
    expect(decodeDisclosure(p.encoded)).toEqual({ salt: 'salt2', name: 'checkout_jwt', value: 'abc' });
    const random = await makeArrayDisclosure(1);
    expect(random.salt).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  it('rejects malformed disclosures', () => {
    expect(() => decodeDisclosure(base64UrlEncodeJson(['only-one']))).toThrow();
    expect(() => decodeDisclosure(base64UrlEncodeJson([1, 'x']))).toThrow();
    expect(() => decodeDisclosure(base64UrlEncodeJson(['s', 2, 'v']))).toThrow();
    expect(() => decodeDisclosure(base64UrlEncodeJson({ salt: 's' }))).toThrow();
    expect(() => decodeDisclosure('not base64!')).toThrow();
  });

  it('serializes and parses the tilde form', async () => {
    const d = await makeArrayDisclosure({ a: 1 }, 's');
    const s = serializeSdJwt('a.b.c', [d.encoded, 'x']);
    expect(s).toBe(`a.b.c~${d.encoded}~x~`);
    expect(parseSdJwt(s)).toEqual({ jwt: 'a.b.c', disclosures: [d.encoded, 'x'] });
    expect(parseSdJwt('a.b.c~')).toEqual({ jwt: 'a.b.c', disclosures: [] });
    expect(parseSdJwt('a.b.c')).toEqual({ jwt: 'a.b.c', disclosures: [] });
    expect(parseSdJwt('')).toEqual({ jwt: '', disclosures: [] });
  });

  it('conceals, resolves and reports undisclosed, unreferenced and malformed disclosures', async () => {
    const arr = await concealArray([{ id: 'a' }, { id: 'b' }]);
    expect(arr.placeholders).toEqual(arr.disclosures.map((d) => ({ '...': d.digest })));
    const prop = await concealProperty({ vct: 'x', secret: 's' }, 'secret');
    expect(prop.object).toEqual({ _sd: [prop.disclosure.digest], vct: 'x' });
    const twice = await concealProperty({ ...prop.object, other: 1 } as Record<string, unknown>, 'other');
    expect((twice.object._sd as string[]).length).toBe(2);
    const payload = { list: arr.placeholders, obj: prop.object, _sd_alg: 'sha-256' };
    const parsed = parseSdJwt(serializeSdJwt('h.p.s', [arr.disclosures[0]!.encoded, prop.disclosure.encoded]));
    const r = await resolveDisclosures(payload, parsed.disclosures);
    expect(r.value).toEqual({ list: [{ id: 'a' }], obj: { vct: 'x', secret: 's' } });
    expect(r.undisclosed).toEqual([arr.disclosures[1]!.digest]);
    expect(r.unreferenced).toEqual([]);
    expect(r.malformed).toEqual([]);
    const bad = await resolveDisclosures(payload, [base64UrlEncodeJson(['z', { id: 'evil' }]), 'not base64!']);
    expect(bad.unreferenced).toHaveLength(1);
    expect(bad.malformed).toEqual(['not base64!']);
  });

  it('resolves array references in place and leaves missing ones undisclosed', async () => {
    const m = await makeArrayDisclosure({ name: 'M' });
    const res = await resolveDisclosures([{ '...': m.digest }, { '...': 'nope' }, 'plain'], [m.encoded, 'garbage']);
    expect(res.value).toEqual([{ name: 'M' }, 'plain']);
    expect(res.undisclosed).toEqual(['nope']);
    expect(res.malformed).toEqual(['garbage']);
    // A property disclosure never satisfies an array placeholder.
    const p = await makePropertyDisclosure('k', 'v');
    const mixed = await resolveDisclosures([{ '...': p.digest }], [p.encoded]);
    expect(mixed.value).toEqual([]);
    expect(mixed.undisclosed).toEqual([p.digest]);
    expect(mixed.unreferenced).toEqual([p.encoded]);
  });
});
