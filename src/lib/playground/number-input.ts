/** Parsing and clamping for the shared NumberField, kept pure so the rules are testable without a DOM. */

/** The text of a number input as a number, or null when it is empty or not a finite number. */
export function parseNumberText(raw: string): number | null {
  const text = raw.trim();
  if (text === '') return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

/** Clamp into [min, max]; either bound may be absent. */
export function clampNumber(n: number, min?: number, max?: number): number {
  let out = n;
  if (min !== undefined && out < min) out = min;
  if (max !== undefined && out > max) out = max;
  return out;
}

/** The text shown for a number value; empty for null or undefined. */
export function numberToText(value: number | null | undefined): string {
  return value === null || value === undefined || !Number.isFinite(value) ? '' : String(value);
}
