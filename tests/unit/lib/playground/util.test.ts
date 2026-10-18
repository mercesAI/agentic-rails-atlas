import { describe, expect, it } from 'vitest';
import { clone, ellipsize, nowSec, pretty } from '@/lib/playground/util';

describe('util', () => {
  it('clones plain data deeply', () => {
    const src = { a: [1, { b: 2 }], c: 'x' };
    const copy = clone(src);
    expect(copy).toEqual(src);
    expect(copy).not.toBe(src);
    expect(copy.a).not.toBe(src.a);
    (copy.a[1] as { b: number }).b = 3;
    expect((src.a[1] as { b: number }).b).toBe(2);
  });

  it('pretty-prints JSON with two spaces', () => {
    expect(pretty({ a: 1 })).toBe('{\n  "a": 1\n}');
  });

  it('gives Unix seconds', () => {
    const before = Math.floor(Date.now() / 1000);
    const now = nowSec();
    expect(Number.isInteger(now)).toBe(true);
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
  });

  it('ellipsizes long strings and leaves short ones alone', () => {
    expect(ellipsize('x'.repeat(100), 4)).toBe('xxxx...xxxx');
    expect(ellipsize('short')).toBe('short');
    expect(ellipsize('a'.repeat(39))).toBe('a'.repeat(39));
    expect(ellipsize('a'.repeat(40))).toBe(`${'a'.repeat(18)}...${'a'.repeat(18)}`);
  });
});
