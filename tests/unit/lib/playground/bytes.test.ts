import { describe, expect, it } from 'vitest';
import {
  BASE64URL_CHARSET_ERROR,
  BASE64URL_LENGTH_ERROR,
  base64ToBytes,
  base64ToUtf8,
  base64UrlDecodeJson,
  base64UrlEncodeJson,
  base64UrlToBytes,
  base64UrlToUtf8,
  bytesToBase64,
  bytesToBase64Url,
  bytesToHex,
  fromUtf8,
  hexToBytes,
  randomBase64Url,
  randomBytes,
  sha256,
  sha256Base64Url,
  utf8,
  utf8ToBase64,
  utf8ToBase64Url,
} from '@/lib/playground/bytes';

describe('bytes', () => {
  const bytes = new Uint8Array([251, 255, 0, 7]);

  it('round-trips UTF-8 and rejects invalid sequences', () => {
    expect(fromUtf8(utf8('x402 ✓ €'))).toBe('x402 ✓ €');
    expect([...utf8('é')]).toEqual([0xc3, 0xa9]);
    expect(() => fromUtf8(new Uint8Array([0xff]))).toThrow();
  });

  it('encodes standard base64 with padding and decodes it', () => {
    expect(bytesToBase64(utf8('hello'))).toBe('aGVsbG8=');
    expect(bytesToBase64(bytes)).toBe('+/8ABw==');
    expect(base64ToBytes('+/8ABw==')).toEqual(bytes);
    expect(utf8ToBase64('x402 ✓')).toBe('eDQwMiDinJM=');
    expect(base64ToUtf8('eDQwMiDinJM=')).toBe('x402 ✓');
    expect(() => base64ToBytes('*')).toThrow();
  });

  it('encodes base64url without padding and validates the alphabet and length on decode', () => {
    expect(bytesToBase64Url(bytes)).toBe('-_8ABw');
    expect(bytesToBase64Url(new Uint8Array([251, 255]))).toBe('-_8');
    expect(bytesToBase64Url(bytes)).not.toMatch(/[+/=]/);
    expect(base64UrlToBytes('-_8ABw')).toEqual(bytes);
    expect(base64UrlToBytes('')).toEqual(new Uint8Array(0));
    expect(utf8ToBase64Url('{"a":"é?>"}')).toBe('eyJhIjoiw6k_PiJ9');
    expect(base64UrlToUtf8('eyJhIjoiw6k_PiJ9')).toBe('{"a":"é?>"}');
    expect(() => base64UrlToBytes('ab+c')).toThrow(BASE64URL_CHARSET_ERROR);
    expect(() => base64UrlToBytes('a=')).toThrow(BASE64URL_CHARSET_ERROR);
    expect(() => base64UrlToBytes('abcde')).toThrow(BASE64URL_LENGTH_ERROR);
  });

  it('round-trips JSON over base64url', () => {
    expect(base64UrlEncodeJson({ a: 1 })).toBe('eyJhIjoxfQ');
    expect(base64UrlDecodeJson(base64UrlEncodeJson({ a: [1, 'two', null] }))).toEqual({ a: [1, 'two', null] });
    expect(() => base64UrlDecodeJson(utf8ToBase64Url('not json'))).toThrow();
  });

  it('encodes and decodes hex', () => {
    expect(bytesToHex(new Uint8Array([0, 15, 255]))).toBe('000fff');
    expect(bytesToHex(new Uint8Array([0, 15, 255]).buffer)).toBe('000fff');
    expect(bytesToHex(new Uint8Array([1, 2]), ' ')).toBe('01 02');
    expect(Array.from(hexToBytes('000fff'))).toEqual([0, 15, 255]);
    expect(Array.from(hexToBytes('ABcd'))).toEqual([171, 205]);
    expect(hexToBytes('')).toEqual(new Uint8Array(0));
    expect(() => hexToBytes('abc')).toThrow();
    expect(() => hexToBytes('zz')).toThrow();
  });

  it('draws random bytes of the requested length', () => {
    expect(randomBytes(32)).toHaveLength(32);
    expect(randomBase64Url()).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(randomBase64Url(32)).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(randomBase64Url()).not.toBe(randomBase64Url());
  });

  it('computes SHA-256 digests', async () => {
    expect(bytesToHex(await sha256(utf8('abc')))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(await sha256Base64Url('')).toBe('47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU');
    expect(await sha256Base64Url('abc')).toBe('ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0');
  });
});
