import { describe, expect, it } from 'vitest';
import { clampNumber, numberToText, parseNumberText } from '@/lib/playground/number-input';

describe('number input rules', () => {
  it('parses the text of a number input', () => {
    expect(parseNumberText('')).toBeNull();
    expect(parseNumberText('   ')).toBeNull();
    expect(parseNumberText('3')).toBe(3);
    expect(parseNumberText(' 2.5 ')).toBe(2.5);
    expect(parseNumberText('-1')).toBe(-1);
    expect(parseNumberText('1e3')).toBe(1000);
    expect(parseNumberText('1e')).toBeNull();
    expect(parseNumberText('abc')).toBeNull();
    expect(parseNumberText('Infinity')).toBeNull();
  });

  it('clamps into the optional bounds', () => {
    expect(clampNumber(5)).toBe(5);
    expect(clampNumber(-3, 0)).toBe(0);
    expect(clampNumber(12, 0, 9)).toBe(9);
    expect(clampNumber(4, 1, 5)).toBe(4);
    expect(clampNumber(7, undefined, 5)).toBe(5);
  });

  it('shows numbers as text and empty for nothing', () => {
    expect(numberToText(60)).toBe('60');
    expect(numberToText(0)).toBe('0');
    expect(numberToText(2.5)).toBe('2.5');
    expect(numberToText(null)).toBe('');
    expect(numberToText(undefined)).toBe('');
    expect(numberToText(Number.NaN)).toBe('');
  });
});
