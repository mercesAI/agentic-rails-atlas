import { describe, expect, it } from 'vitest';
import {
  appendFlag,
  exportJSON,
  exportMarkdown,
  flagTemplate,
  importJSON,
  importMarkdown,
  mergeStores,
  normalizeStore,
  noteKey,
  notesForScope,
  setNote,
  splitKey,
  type NotesStore,
} from '../../../src/components/protocol/lib/notes';

const NOW = '2026-10-11T10:00:00.000Z';
const store: NotesStore = {
  'x402/b-explanation': { text: 'Facilitator is optional.\n\nCheck **v2** headers.', updated: NOW },
  'ap2/h-security': { text: 'Mandate replay?', updated: '2026-10-10T09:00:00.000Z' },
};

describe('notes store', () => {
  it('builds and splits keys', () => {
    expect(noteKey('x402', 'b-explanation')).toBe('x402/b-explanation');
    expect(splitKey('x402/b-explanation')).toEqual({ scope: 'x402', section: 'b-explanation' });
  });

  it('sets and removes notes', () => {
    const a = setNote({}, 'x402/a-tldr', 'hello', NOW);
    expect(a['x402/a-tldr']).toEqual({ text: 'hello', updated: NOW });
    expect(setNote(a, 'x402/a-tldr', '   ', NOW)).toEqual({});
  });

  it('normalizes strings, drops bad keys and empty notes', () => {
    const n = normalizeStore({ 'x402/a-tldr': 'plain', 'Bad Key': 'x', 'x402/c-diagrams': { text: '' }, 'x402/q-faq': 3 });
    expect(n).toEqual({ 'x402/a-tldr': { text: 'plain', updated: '' } });
    expect(normalizeStore([1, 2])).toEqual({});
  });

  it('filters by scope', () => {
    expect(Object.keys(notesForScope(store, 'x402'))).toEqual(['x402/b-explanation']);
  });

  it('round-trips through JSON export', () => {
    const json = exportJSON(store, NOW);
    expect(JSON.parse(json)).toMatchObject({ format: 'atlas-notes', version: 1, exportedAt: NOW });
    expect(importJSON(json)).toEqual(store);
    expect(importJSON(JSON.stringify(store))).toEqual(store);
    expect(() => importJSON('{not json')).toThrow();
  });

  it('round-trips through Markdown export', () => {
    const md = exportMarkdown(store, NOW, (k) => `Title for ${k}`);
    expect(md).toContain('# Notes');
    expect(md).toContain('## Title for x402/b-explanation');
    expect(md).not.toContain('—');
    expect(importMarkdown(md)).toEqual(store);
  });

  it('merges by most recent update', () => {
    const older = { 'x402/b-explanation': { text: 'old', updated: '2026-01-01T00:00:00.000Z' } };
    expect(mergeStores(older, store)['x402/b-explanation']?.text).toContain('Facilitator');
    expect(mergeStores(store, older)['x402/b-explanation']?.text).toContain('Facilitator');
    expect(mergeStores({}, { 'x402/a-tldr': { text: 'n', updated: '' } })['x402/a-tldr']?.text).toBe('n');
  });

  it('appends flag notes without losing earlier ones', () => {
    const text = flagTemplate({ slug: 'x402', name: 'x402', url: '/p/x402/', date: '2026-10-11' });
    expect(text).toContain('Issue flagged on 2026-10-11 for x402.');
    const one = appendFlag({}, 'x402', text, NOW);
    const two = appendFlag(one, 'x402', 'second', NOW);
    expect(two['x402/flags']?.text).toContain('Issue flagged');
    expect(two['x402/flags']?.text).toContain('second');
  });
});
