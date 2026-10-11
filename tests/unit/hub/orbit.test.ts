import { describe, expect, it } from 'vitest';
import { groupOrbit, orbitLink, ORBIT_CATEGORY_LABELS } from '../../../src/components/hub/lib/orbit';

const sources = new Map([
  ['src-news', { url: 'https://news.example/a', primary: false }],
  ['src-spec', { url: 'https://spec.example/b', primary: true }],
]);

describe('orbit links', () => {
  it('links starred items to their mini page', () => {
    expect(orbitLink({ slug: 'mcp', name: 'MCP', category: 'agent-communication', starred: true, sources: ['src-news'] }, sources)).toEqual({
      href: '/orbit/mcp/',
      external: false,
    });
  });
  it('links other items to the primary source, else the first source', () => {
    expect(orbitLink({ slug: 'x', name: 'X', category: 'legal-policy', starred: false, sources: ['src-news', 'src-spec'] }, sources)).toEqual({
      href: 'https://spec.example/b',
      external: true,
    });
    expect(orbitLink({ slug: 'y', name: 'Y', category: 'legal-policy', starred: false, sources: ['src-missing', 'src-news'] }, sources)?.href).toBe(
      'https://news.example/a',
    );
    expect(orbitLink({ slug: 'z', name: 'Z', category: 'legal-policy', starred: false, sources: ['src-missing'] }, sources)).toBeNull();
  });
});

describe('orbit grouping', () => {
  it('keeps category order, puts starred first and drops empty groups', () => {
    const groups = groupOrbit([
      { slug: 'b', name: 'B', category: 'machine-payments', starred: false, sources: [] },
      { slug: 'a', name: 'A', category: 'machine-payments', starred: false, sources: [] },
      { slug: 'l', name: 'L402', category: 'machine-payments', starred: true, sources: [] },
      { slug: 'm', name: 'MCP', category: 'agent-communication', starred: true, sources: [] },
    ]);
    expect(groups.map((g) => g.category)).toEqual(['agent-communication', 'machine-payments']);
    expect(groups[1]?.items.map((i) => i.slug)).toEqual(['l', 'a', 'b']);
    expect(groups[0]?.label).toBe(ORBIT_CATEGORY_LABELS['agent-communication']);
  });
});
