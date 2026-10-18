import { describe, expect, it } from 'vitest';
import { MoneyParseError, formatMinor, parseDecimalToMinor } from '@/lib/playground/money';

const reason = (text: string, decimals: number): string => {
  try {
    parseDecimalToMinor(text, decimals);
    return 'ok';
  } catch (e) {
    return e instanceof MoneyParseError ? e.reason : 'other';
  }
};

describe('money', () => {
  it('parses decimals to minor units', () => {
    expect(parseDecimalToMinor('0.01', 6)).toBe(10_000n);
    expect(parseDecimalToMinor('1', 2)).toBe(100n);
    expect(parseDecimalToMinor('12.', 2)).toBe(1200n);
    expect(parseDecimalToMinor(' 0.5 ', 6)).toBe(500_000n);
    expect(parseDecimalToMinor('007.50', 2)).toBe(750n);
    expect(parseDecimalToMinor('0', 0)).toBe(0n);
    expect(parseDecimalToMinor('42', 0)).toBe(42n);
    expect(parseDecimalToMinor('123456789012345678901234567890.123456', 6)).toBe(123456789012345678901234567890123456n);
  });

  it('names the reason when it refuses input', () => {
    expect(reason('', 2)).toBe('empty');
    expect(reason('   ', 2)).toBe('empty');
    expect(reason('-1', 2)).toBe('negative');
    expect(reason('abc', 2)).toBe('format');
    expect(reason('1,5', 2)).toBe('format');
    expect(reason('$1', 2)).toBe('format');
    expect(reason('.5', 2)).toBe('format');
    expect(reason('1.234', 2)).toBe('decimals');
    expect(reason('1.0000001', 6)).toBe('decimals');
    expect(reason('1.5', 0)).toBe('decimals');
    expect(() => parseDecimalToMinor('1.234', 2)).toThrow('Use at most 2 decimal places.');
    expect(() => parseDecimalToMinor('1.55', 1)).toThrow('Use at most 1 decimal place.');
  });

  it('formats minor units with every fraction digit by default', () => {
    expect(formatMinor(150n, 2)).toBe('1.50');
    expect(formatMinor(9977n, 2)).toBe('99.77');
    expect(formatMinor(-32n, 1)).toBe('-3.2');
    expect(formatMinor(5n, 3)).toBe('0.005');
    expect(formatMinor(87n, 0)).toBe('87');
    expect(formatMinor(0n, 2)).toBe('0.00');
    expect(formatMinor(3888, 2, '$')).toBe('$38.88');
    expect(formatMinor(-150, 2, '$')).toBe('-$1.50');
    expect(formatMinor('1000000', 6)).toBe('1.000000');
    expect(formatMinor(123456789012345678901234567890n, 2)).toBe('1234567890123456789012345678.90');
  });

  it('trims trailing zeros when asked, keeping a minimum number of fraction digits', () => {
    expect(formatMinor(1_500_000n, 6, '', { trimZeros: true })).toBe('1.5');
    expect(formatMinor(25n, 6, '', { trimZeros: true })).toBe('0.000025');
    expect(formatMinor(1_000_000n, 6, '', { trimZeros: true })).toBe('1');
    expect(formatMinor(-25n, 6, '', { trimZeros: true })).toBe('-0.000025');
    expect(formatMinor(10_000n, 6, '', { trimZeros: true, minFractionDigits: 2 })).toBe('0.01');
    expect(formatMinor(1_500_000n, 6, '', { trimZeros: true, minFractionDigits: 2 })).toBe('1.50');
    expect(formatMinor(1_234_567n, 6, '', { trimZeros: true, minFractionDigits: 2 })).toBe('1.234567');
    expect(formatMinor(1_000_000n, 6, '', { trimZeros: true, minFractionDigits: 2 })).toBe('1.00');
  });

  it('refuses numbers that are not safe integers', () => {
    expect(() => formatMinor(1.5, 2)).toThrow(TypeError);
    expect(() => formatMinor(Number.NaN, 2)).toThrow(TypeError);
    expect(() => formatMinor(2 ** 53, 2)).toThrow(TypeError);
  });
});
