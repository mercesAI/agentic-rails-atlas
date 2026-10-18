import { describe, expect, it, vi } from 'vitest';
import { SEARCH_INDEX_URL, fetchSearchIndex, normalizeSearchIndex } from '../../../src/lib/search-client';

const response = (body: unknown, init: { ok: boolean; status: number; statusText: string }): Response =>
  ({ ...init, json: async () => body }) as unknown as Response;

describe('fetchSearchIndex', () => {
  it('fetches the static index from the same origin and normalizes it', async () => {
    const index = { version: 1, entries: [{ id: 'page:/', kind: 'page', title: 'Home', url: '/', text: 'Start here' }, { title: 'no url' }] };
    const fetchFn = vi.fn(async () => response(index, { ok: true, status: 200, statusText: 'OK' }));
    const items = await fetchSearchIndex(fetchFn as unknown as typeof fetch);
    expect(SEARCH_INDEX_URL).toBe('/data/search-index.json');
    expect(fetchFn).toHaveBeenCalledWith(SEARCH_INDEX_URL);
    expect(items).toEqual(normalizeSearchIndex(index));
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ title: 'Home', url: '/', kind: 'page', text: 'Start here' });
  });

  it('rejects on a non-ok status and on a network error', async () => {
    const notFound = vi.fn(async () => response(null, { ok: false, status: 404, statusText: 'Not Found' }));
    await expect(fetchSearchIndex(notFound as unknown as typeof fetch)).rejects.toThrow('404 Not Found');
    const offline = vi.fn(async (): Promise<Response> => {
      throw new TypeError('Failed to fetch');
    });
    await expect(fetchSearchIndex(offline as unknown as typeof fetch)).rejects.toThrow('Failed to fetch');
  });
});
