/**
 * Local storage wrapper (ARCHITECTURE.md Section 10).
 * Every call is wrapped in try/catch with an in-memory Map fallback, so private
 * windows, blocked storage and SSR never throw. Keys are prefixed `atlas:`.
 * Nothing ever leaves the browser.
 */

export const STORAGE_PREFIX = 'atlas:';

const memory = new Map<string, string>();

/** Ensures a key carries the `atlas:` prefix. */
export function storageKey(key: string): string {
  return key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
}

function backend(): Storage | null {
  try {
    if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) return null;
    const ls = globalThis.localStorage;
    return ls ?? null;
  } catch {
    return null;
  }
}

export function getItem(key: string): string | null {
  const k = storageKey(key);
  try {
    const ls = backend();
    if (ls) {
      const value = ls.getItem(k);
      if (value !== null) return value;
    }
  } catch {
    // fall through to memory
  }
  return memory.has(k) ? (memory.get(k) as string) : null;
}

export function setItem(key: string, value: string): void {
  const k = storageKey(key);
  memory.set(k, value);
  try {
    backend()?.setItem(k, value);
  } catch {
    // memory copy stays authoritative for this session
  }
}

export function removeItem(key: string): void {
  const k = storageKey(key);
  memory.delete(k);
  try {
    backend()?.removeItem(k);
  } catch {
    // ignore
  }
}

export function getJSON<T>(key: string, fallback: T): T {
  const raw = getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setJSON(key: string, value: unknown): void {
  try {
    setItem(key, JSON.stringify(value));
  } catch {
    // value not serializable; ignore
  }
}

/** Lists every stored key (with prefix) that starts with the given prefix. */
export function keysWithPrefix(prefix: string): string[] {
  const p = storageKey(prefix);
  const out = new Set<string>();
  for (const k of memory.keys()) if (k.startsWith(p)) out.add(k);
  try {
    const ls = backend();
    if (ls) {
      for (let i = 0; i < ls.length; i += 1) {
        const k = ls.key(i);
        if (k && k.startsWith(p)) out.add(k);
      }
    }
  } catch {
    // ignore
  }
  return [...out].sort();
}

/** Test helper: clears the in-memory fallback. */
export function __resetMemory(): void {
  memory.clear();
}
