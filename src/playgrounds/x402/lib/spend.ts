/**
 * Spend cap check that mirrors the TypeScript SDK client's spendControls
 * (typescript/packages/core/src/client/x402Client.ts, @x402/core 2.28.0):
 * DEFAULT_MAX_AMOUNT_PER_PAYMENT is "$1", applied to default assets before any policy runs,
 * and `false` disables the cap. Money parsing and conversion mirror parseMoney and
 * convertToTokenAmount in typescript/packages/core/src/utils/index.ts.
 *
 * Teaching simplification: the SDK caps only assets that findDefaultAsset recognizes and rejects
 * other assets unless allowedAssets lists them. The playground treats its fixture token as a
 * recognized default asset so the USD cap applies.
 */
import { formatMinor, parseDecimalToMinor } from '@/lib/playground/money';
import { FIXTURE_TOKEN } from './fixtures';

export const DEFAULT_MAX_AMOUNT_PER_PAYMENT = '$1';

export type SpendCap = string | false;

/** "$1", "1.50", "$0.10" to a decimal string. Throws on anything else, like the SDK. */
export function parseMoney(money: string): string {
  const match = money.trim().match(/^\$?\s*(\d+(?:\.\d+)?)$/);
  if (!match || match[1] === undefined) throw new Error(`Invalid money format: ${money}`);
  return match[1];
}

/** Decimal string to atomic units (extra decimals are cut, as in the SDK). */
export function convertToTokenAmount(decimalAmount: string, decimals: number): string {
  if (!/^\d+\.?\d*$/.test(decimalAmount)) throw new Error(`Invalid amount: ${decimalAmount}`);
  // The SDK cuts extra decimals instead of rejecting them, so they are cut before the shared parser runs.
  const [intPart = '0', decPart = ''] = decimalAmount.split('.');
  return parseDecimalToMinor(`${intPart}.${decPart.slice(0, decimals)}`, decimals).toString();
}

/** Prices above this many whole units are refused before any value reaches viem, which throws outside the uint256 range. */
export const MAX_WHOLE_UNITS = 10n ** 12n;

export type AmountParse = { ok: true; atomic: string } | { ok: false; reason: 'format' | 'range' };

/** parseMoney plus convertToTokenAmount with the range check above. Never throws. */
export function parseUsdAmount(usd: string, decimals: number = FIXTURE_TOKEN.decimals): AmountParse {
  let atomic: string;
  try {
    atomic = convertToTokenAmount(parseMoney(usd), decimals);
  } catch {
    return { ok: false, reason: 'format' };
  }
  if (BigInt(atomic) > MAX_WHOLE_UNITS * 10n ** BigInt(decimals)) return { ok: false, reason: 'range' };
  return { ok: true, atomic };
}

/** Atomic units to a decimal string with trailing zeros trimmed (at least two decimals). */
export function formatAtomic(atomic: string | bigint, decimals: number = FIXTURE_TOKEN.decimals): string {
  return formatMinor(atomic, decimals, '', { trimZeros: true, minFractionDigits: 2 });
}

export type SpendCheck =
  | { allowed: true; capAtomic: string | null; note: string }
  | { allowed: false; capAtomic: string; error: string };

/**
 * Run the per-payment cap against one requirement amount (atomic units). `amount` is the V2
 * `amount` or the V1 `maxAmountRequired`; for upto it is the signed maximum.
 */
export function checkSpendControls(amountAtomic: string, cap: SpendCap): SpendCheck {
  if (cap === false) {
    return { allowed: true, capAtomic: null, note: 'maxAmountPerPayment is false, so no cap applies.' };
  }
  const capAtomic = convertToTokenAmount(parseMoney(cap), FIXTURE_TOKEN.decimals);
  if (BigInt(amountAtomic) <= BigInt(capAtomic)) {
    return {
      allowed: true,
      capAtomic,
      note: `${amountAtomic} is at or below the cap of ${capAtomic} atomic units (${cap}).`,
    };
  }
  return {
    allowed: false,
    capAtomic,
    // Message text copied from x402Client.applySpendControls.
    error:
      `All payment requirements were rejected by spendControls.maxAmountPerPayment ` +
      `(${cap}, including ${FIXTURE_TOKEN.symbol}). ` +
      `Raise maxAmountPerPayment, set it to false to disable, ` +
      `set allowedAssets[].maxAmountPerPayment for a per-asset atomic cap, ` +
      `or set spendControls: false to disable all spend controls.`,
  };
}
