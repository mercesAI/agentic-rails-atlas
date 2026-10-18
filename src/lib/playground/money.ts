/**
 * Minor-unit money as bigint: parse a typed decimal into minor units and format minor units back.
 * Shared by the playgrounds that show prices, caps and balances; a playground that formats differently
 * on purpose keeps a local wrapper and says so.
 */

export type MoneyParseReason = 'empty' | 'negative' | 'format' | 'decimals';

export class MoneyParseError extends Error {
  constructor(
    readonly reason: MoneyParseReason,
    message: string,
  ) {
    super(message);
    this.name = 'MoneyParseError';
  }
}

/**
 * "1", "0.50" or "12." with at most `decimals` fraction digits to minor units. Throws a MoneyParseError
 * naming the reason: empty, negative, format (not a plain decimal) or decimals (too many fraction digits).
 */
export function parseDecimalToMinor(text: string, decimals: number): bigint {
  const t = text.trim();
  if (t === '') throw new MoneyParseError('empty', 'Enter an amount.');
  if (t.startsWith('-')) throw new MoneyParseError('negative', 'The amount cannot be negative.');
  const m = /^(\d+)(?:\.(\d*))?$/.exec(t);
  if (!m) throw new MoneyParseError('format', 'Enter a plain decimal number, for example 0.01.');
  const whole = m[1] as string;
  const frac = m[2] ?? '';
  if (frac.length > decimals) throw new MoneyParseError('decimals', `Use at most ${decimals} decimal place${decimals === 1 ? '' : 's'}.`);
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(frac.padEnd(decimals, '0') || '0');
}

export interface FormatMinorOptions {
  /** Drop trailing zeros of the fraction (and the point when nothing is left). */
  trimZeros?: boolean;
  /** With trimZeros, keep at least this many fraction digits. */
  minFractionDigits?: number;
}

function toBigInt(value: bigint | number | string): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw new TypeError(`Minor units must be a safe integer, got ${String(value)}`);
    return BigInt(value);
  }
  return BigInt(value);
}

/**
 * Minor units to a decimal string: 150n with 2 decimals is "1.50", with a symbol "$1.50", negative "-$1.50".
 * The fraction keeps every digit unless trimZeros asks otherwise; zero decimals gives a plain integer.
 */
export function formatMinor(value: bigint | number | string, decimals: number, symbol = '', opts: FormatMinorOptions = {}): string {
  const v = toBigInt(value);
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const base = 10n ** BigInt(decimals);
  const whole = (abs / base).toString();
  let frac = decimals === 0 ? '' : (abs % base).toString().padStart(decimals, '0');
  if (opts.trimZeros) {
    const min = opts.minFractionDigits ?? 0;
    frac = frac.replace(/0+$/, '');
    if (frac.length < min) frac = frac.padEnd(min, '0');
  }
  return `${neg ? '-' : ''}${symbol}${whole}${frac ? `.${frac}` : ''}`;
}
