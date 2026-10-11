import { describe, expect, it } from 'vitest';
import { excerpt, noteTitle, searchRows, toRows } from '../../../src/components/hub/lib/notes-hub';
import { exportMarkdown, importMarkdown } from '../../../src/components/protocol/lib/notes';

const store = {
  'x402/b-explanation': { text: 'Facilitator pays gas', updated: '2026-10-10T10:00:00Z' },
  'ap2/flags': { text: 'Check the mandate expiry', updated: '2026-10-11T10:00:00Z' },
  'unknown-scope/misc': { text: 'Loose note', updated: '' },
};
const scopes = { x402: { name: 'x402', href: '/p/x402/' }, ap2: { name: 'AP2', href: '/p/ap2/' } };
const titles = { 'b-explanation': 'Detailed explanation' };

describe('notes hub', () => {
  it('builds rows with readable titles and deep links', () => {
    const rows = toRows(store, scopes, titles);
    const x = rows.find((r) => r.key === 'x402/b-explanation');
    expect(x?.href).toBe('/p/x402/#b-explanation');
    expect(x?.sectionTitle).toBe('Detailed explanation');
    expect(rows.find((r) => r.key === 'ap2/flags')?.sectionTitle).toBe('Flagged issues');
    expect(rows.find((r) => r.key === 'ap2/flags')?.href).toBe('/p/ap2/');
    expect(rows.find((r) => r.scope === 'unknown-scope')?.href).toBe('');
  });

  it('searches every word, filters by scope and sorts', () => {
    const rows = toRows(store, scopes, titles);
    expect(searchRows(rows, '').map((r) => r.key)).toEqual(['ap2/flags', 'x402/b-explanation', 'unknown-scope/misc']);
    expect(searchRows(rows, 'gas facilitator').map((r) => r.key)).toEqual(['x402/b-explanation']);
    expect(searchRows(rows, 'flagged').map((r) => r.key)).toEqual(['ap2/flags']);
    expect(searchRows(rows, '', 'x402')).toHaveLength(1);
    expect(searchRows(rows, '', '', 'scope').map((r) => r.scopeName)).toEqual(['AP2', 'unknown-scope', 'x402']);
  });

  it('round-trips a Markdown export with hub titles', () => {
    const md = exportMarkdown(store, '2026-10-11T00:00:00Z', (k) => noteTitle(k, scopes, titles));
    expect(md).toContain('## x402: Detailed explanation');
    expect(importMarkdown(md)).toEqual(store);
  });

  it('makes excerpts around the first match', () => {
    expect(excerpt('short', 'x')).toBe('short');
    const long = `${'a '.repeat(100)}needle ${'b '.repeat(100)}`;
    const e = excerpt(long, 'needle', 40);
    expect(e).toContain('needle');
    expect(e.startsWith('...')).toBe(true);
  });
});
