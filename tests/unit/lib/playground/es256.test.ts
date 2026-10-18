import { describe, expect, it } from 'vitest';
import { base64UrlEncodeJson, base64UrlToBytes, bytesToBase64Url, utf8 } from '@/lib/playground/bytes';
import {
  decodeJws,
  generateEs256Key,
  importEs256PublicJwk,
  jwkThumbprint,
  sameJwk,
  signBytes,
  signJws,
  verifyBytes,
  verifyJws,
  type Es256Key,
} from '@/lib/playground/es256';

describe('ES256 keys and raw signatures', () => {
  let key: Es256Key;
  let other: Es256Key;
  it('generates a non-extractable P-256 key with a public JWK', async () => {
    key = await generateEs256Key('user_sk');
    other = await generateEs256Key('other');
    expect(key.label).toBe('user_sk');
    expect(key.privateKey.extractable).toBe(false);
    expect(key.publicJwk).toEqual({ kty: 'EC', crv: 'P-256', x: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/) as string, y: expect.any(String) as string });
    expect(sameJwk(key.publicJwk, { ...key.publicJwk, kid: 'k1' })).toBe(true);
    expect(sameJwk(key.publicJwk, other.publicJwk)).toBe(false);
    expect(sameJwk(undefined, key.publicJwk)).toBe(false);
  });

  it('signs raw r||s and verifies with the CryptoKey or an imported JWK', async () => {
    const sig = await signBytes('hello', key.privateKey);
    expect(sig).toHaveLength(64);
    expect(await verifyBytes('hello', sig, key.publicKey)).toBe(true);
    expect(await verifyBytes(utf8('hello'), sig, key.publicKey)).toBe(true);
    expect(await verifyBytes('hellO', sig, key.publicKey)).toBe(false);
    expect(await verifyBytes('hello', sig, other.publicKey)).toBe(false);
    expect(await verifyBytes('hello', sig.slice(1), key.publicKey)).toBe(false);
    expect(await verifyBytes('hello', sig, await importEs256PublicJwk(key.publicJwk))).toBe(true);
    const bytesSig = await signBytes(utf8('hello'), key.privateKey);
    expect(await verifyBytes('hello', bytesSig, key.publicKey)).toBe(true);
  });

  it('computes the RFC 7638 thumbprint example and refuses unknown key types', async () => {
    // RFC 7638 Section 3.1 example RSA key and thumbprint.
    const jwk = {
      kty: 'RSA',
      e: 'AQAB',
      n: '0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw',
    };
    expect(await jwkThumbprint(jwk)).toBe('NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs');
    const ec = await jwkThumbprint(key.publicJwk);
    expect(ec).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await jwkThumbprint({ ...key.publicJwk, kid: 'ignored', alg: 'ES256' } as JsonWebKey)).toBe(ec);
    // RFC 8037 Appendix A.3 Ed25519 example.
    expect(await jwkThumbprint({ kty: 'OKP', crv: 'Ed25519', x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo' })).toBe('kPrK_qmxVWaYVA9wwBF6Iuo3vVzz7TxHCTwXBygrS4k');
    await expect(jwkThumbprint({ kty: 'oct' })).rejects.toThrow();
    await expect(jwkThumbprint({ kty: 'EC', crv: 'P-256', x: 'only-x' })).rejects.toThrow();
  });
});

describe('compact JWS', () => {
  it('signs with alg ES256 first in the header, decodes and verifies', async () => {
    const key = await generateEs256Key('k');
    const jws = await signJws({ typ: 'JWT', kid: 'k-1' }, { hello: 'world' }, key.privateKey);
    const [h, p, s] = jws.split('.') as [string, string, string];
    expect(h).toBe(base64UrlEncodeJson({ alg: 'ES256', typ: 'JWT', kid: 'k-1' }));
    expect(p).toBe(base64UrlEncodeJson({ hello: 'world' }));
    expect(base64UrlToBytes(s)).toHaveLength(64);
    const decoded = decodeJws<{ hello: string }>(jws);
    expect(decoded.header).toEqual({ alg: 'ES256', typ: 'JWT', kid: 'k-1' });
    expect(decoded.payload.hello).toBe('world');
    expect(decoded.signingInput).toBe(`${h}.${p}`);
    expect(decoded.signature).toBe(s);
    expect(await verifyJws(jws, key.publicKey)).toBe(true);
    expect(await verifyJws(jws, key.publicJwk)).toBe(true);
    const explicit = await signJws({ alg: 'ES256', typ: 'JWT' }, { n: 1 }, key.privateKey);
    expect(decodeJws(explicit).header).toEqual({ alg: 'ES256', typ: 'JWT' });
    // ECDSA signatures are randomized, so two signatures over the same input differ.
    expect(await signJws({ typ: 'JWT' }, { n: 1 }, key.privateKey)).not.toBe(await signJws({ typ: 'JWT' }, { n: 1 }, key.privateKey));
  });

  it('rejects forged, foreign, malformed and non-ES256 tokens without throwing', async () => {
    const key = await generateEs256Key('k');
    const other = await generateEs256Key('o');
    const jws = await signJws({ typ: 'JWT' }, { hello: 'world' }, key.privateKey);
    const [h, , s] = jws.split('.') as [string, string, string];
    expect(await verifyJws(`${h}.${base64UrlEncodeJson({ hello: 'mars' })}.${s}`, key.publicKey)).toBe(false);
    expect(await verifyJws(jws, other.publicKey)).toBe(false);
    expect(await verifyJws(jws, other.publicJwk)).toBe(false);
    expect(await verifyJws('a.b', key.publicKey)).toBe(false);
    expect(await verifyJws('not.base64!.x', key.publicKey)).toBe(false);
    expect(await verifyJws(`${h}.${base64UrlEncodeJson({})}.${bytesToBase64Url(new Uint8Array(10))}`, key.publicKey)).toBe(false);
    const none = `${base64UrlEncodeJson({ alg: 'none' })}.${base64UrlEncodeJson({ hello: 'world' })}.${s}`;
    expect(await verifyJws(none, key.publicKey)).toBe(false);
    expect(() => decodeJws('one.two')).toThrow();
  });
});
