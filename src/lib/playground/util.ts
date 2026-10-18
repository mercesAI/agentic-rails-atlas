/** Small helpers every playground shell needs. Pure functions, no DOM. */

/** Deep copy of plain JSON data (fixtures), so an edit never reaches the shared fixture object. */
export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Pretty JSON for display. */
export function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/** Current Unix time in whole seconds. */
export function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

/** Shorten a long token for display while keeping both ends visible. */
export function ellipsize(text: string, keep = 18): string {
  if (text.length <= keep * 2 + 3) return text;
  return `${text.slice(0, keep)}...${text.slice(-keep)}`;
}
