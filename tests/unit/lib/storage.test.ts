import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  __resetMemory,
  getItem,
  getJSON,
  keysWithPrefix,
  removeItem,
  setItem,
  setJSON,
  storageKey,
} from '../../../src/lib/storage';

function fakeStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k: string) => data.get(k) ?? null,
    key: (i: number) => [...data.keys()][i] ?? null,
    removeItem: (k: string) => void data.delete(k),
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  __resetMemory();
});

describe('storage', () => {
  it('prefixes keys with atlas:', () => {
    expect(storageKey('theme')).toBe('atlas:theme');
    expect(storageKey('atlas:theme')).toBe('atlas:theme');
  });

  it('falls back to memory when localStorage is missing', () => {
    setItem('theme', 'dark');
    expect(getItem('atlas:theme')).toBe('dark');
    removeItem('theme');
    expect(getItem('theme')).toBeNull();
  });

  it('uses localStorage when available', () => {
    const ls = fakeStorage();
    vi.stubGlobal('localStorage', ls);
    setItem('reading-mode', 'spec');
    expect(ls.getItem('atlas:reading-mode')).toBe('spec');
    expect(getItem('reading-mode')).toBe('spec');
  });

  it('survives a throwing localStorage', () => {
    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
      key: () => null,
      length: 0,
      clear: () => undefined,
    } as unknown as Storage;
    vi.stubGlobal('localStorage', throwing);
    expect(() => setItem('x', '1')).not.toThrow();
    expect(getItem('x')).toBe('1');
    expect(() => removeItem('x')).not.toThrow();
  });

  it('round-trips JSON and returns the fallback on bad JSON', () => {
    setJSON('read:x402', ['what-it-is', 'how-it-works']);
    expect(getJSON('read:x402', [])).toEqual(['what-it-is', 'how-it-works']);
    setItem('broken', '{not json');
    expect(getJSON('broken', { ok: true })).toEqual({ ok: true });
    expect(getJSON('missing', 42)).toBe(42);
  });

  it('lists keys by prefix', () => {
    vi.stubGlobal('localStorage', fakeStorage());
    setJSON('read:x402', []);
    setJSON('read:ap2', []);
    setItem('theme', 'dark');
    expect(keysWithPrefix('read:')).toEqual(['atlas:read:ap2', 'atlas:read:x402']);
  });
});
