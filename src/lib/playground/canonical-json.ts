/**
 * JSON Canonicalization Scheme (RFC 8785): object keys sorted by UTF-16 code units at every level, no
 * whitespace, ECMAScript number and string serialization. Undefined members are dropped and undefined
 * array elements become null, as JSON.stringify does. Used where a spec hashes or compares JSON.
 */

export function canonicalize(value: unknown): string {
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') return 'null';
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('JCS does not allow NaN or Infinity.');
    if (typeof value === 'bigint') return JSON.stringify(value.toString());
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((v) => (v === undefined ? 'null' : canonicalize(v))).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
}

/** Structural equality on JSON values: key order is ignored, array order and null versus absent are not. */
export function jsonEqual(a: unknown, b: unknown): boolean {
  return canonicalize(a) === canonicalize(b);
}
