import { describe, expect, it } from 'vitest';
import { canonicalize, jsonEqual } from '@/lib/playground/canonical-json';

describe('canonical JSON (RFC 8785)', () => {
  it('matches the RFC 8785 section 3.2.3 example', () => {
    const input = {
      // The RFC writes 333333333.33333329 and 4.50; the nearest doubles are these.
      numbers: [333333333.3333333, 1e30, 4.5, 2e-3, 0.000000000000000000000000001],
      string: '€$\x0f\nA\'B"\\\\"/',
      literals: [null, true, false],
    };
    expect(canonicalize(input)).toBe('{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27],"string":"€$\\u000f\\nA\'B\\"\\\\\\\\\\"/"}');
  });

  it('sorts keys by UTF-16 code units at every level (RFC 8785 section 3.2.3 key order)', () => {
    const input: Record<string, string> = {
      '€': 'Euro Sign',
      '\r': 'Carriage Return',
      '\u000a': 'Newline',
      '1': 'One',
      '\u0080': 'Control\u007f',
      '𝄞': 'Surrogate Example',
      'ö': 'Latin Small Letter O With Diaeresis',
    };
    // Read the keys back from the text: Object.keys would move the integer-like key "1" to the front.
    const keys = [...canonicalize(input).matchAll(/"((?:[^"\\]|\\.)*)":/g)].map((m) => m[1]);
    expect(keys).toEqual(['\\n', '\\r', '1', '\u0080', 'ö', '€', '𝄞']);
    expect(canonicalize({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
    expect(canonicalize({ b: 1, a: [true, null, 'x'], c: { z: 1, y: undefined } })).toBe('{"a":[true,null,"x"],"b":1,"c":{"z":1}}');
  });

  it('serializes scalars like JSON.stringify and refuses non-finite numbers', () => {
    expect(canonicalize('a"b')).toBe('"a\\"b"');
    expect(canonicalize(1.0)).toBe('1');
    expect(canonicalize(-0)).toBe('0');
    expect(canonicalize(true)).toBe('true');
    expect(canonicalize(null)).toBe('null');
    expect(canonicalize(undefined)).toBe('null');
    expect(canonicalize(12345678901234567890n)).toBe('"12345678901234567890"');
    expect(canonicalize([undefined, 1])).toBe('[null,1]');
    expect(() => canonicalize(Number.NaN)).toThrow();
    expect(() => canonicalize({ a: Number.POSITIVE_INFINITY })).toThrow();
  });

  it('compares structurally: key order ignored, array order kept, null differs from absent', () => {
    expect(jsonEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(jsonEqual({ a: [1, 2] }, { a: [2, 1] })).toBe(false);
    expect(jsonEqual({ a: null }, {})).toBe(false);
    expect(jsonEqual({ a: undefined }, {})).toBe(true);
    expect(jsonEqual({ a: 1.0 }, { a: 1 })).toBe(true);
  });
});
