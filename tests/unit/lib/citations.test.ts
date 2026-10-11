import { describe, expect, it } from 'vitest';
import {
  claimIdsToSourceIds,
  dedupe,
  getCitationPayload,
  parseIds,
  resolveCite,
  serializeForScript,
  setPageSources,
} from '../../../src/lib/citations';
import type { Claim, Source } from '../../../src/lib/schemas';

const source = (id: string): Source => ({
  id,
  url: `https://example.org/${id}`,
  title: `Title ${id}`,
  publisher: 'Example',
  type: 'docs',
  primary: true,
  accessed: '2026-10-11',
});
const claim = (id: string, sources: string[], confidence: Claim['confidence'] = 'verified'): Claim => ({
  id,
  text: `Claim ${id}`,
  sources,
  confidence,
});

describe('citations', () => {
  it('parses and de-duplicates ids', () => {
    expect(parseIds(' clm-a-001  src-b clm-a-001,src-c ')).toEqual(['clm-a-001', 'src-b', 'src-c']);
    expect(dedupe(['a', 'b', 'a'])).toEqual(['a', 'b']);
  });

  it('maps claim ids to their sources', () => {
    const claims = new Map([['clm-x-001', claim('clm-x-001', ['src-one', 'src-two'])]]);
    expect(claimIdsToSourceIds(['clm-x-001', 'src-three', 'clm-missing'], claims)).toEqual([
      'src-one',
      'src-two',
      'src-three',
    ]);
  });

  it('numbers cites by page source order', () => {
    const page = '/p/test-numbering/';
    setPageSources(['src-one', 'src-two', 'src-three'], {
      page,
      sources: [source('src-one'), source('src-two'), source('src-three')],
      claims: [claim('clm-x-001', ['src-three', 'src-one'], 'unverified')],
    });
    const [r] = resolveCite('clm-x-001', page);
    expect(r?.kind).toBe('claim');
    expect(r?.numbers).toEqual([3, 1]);
    expect(r?.confidence).toBe('unverified');
    expect(resolveCite('src-two', page)[0]?.numbers).toEqual([2]);
  });

  it('appends unknown source ids and flags unknown claims', () => {
    const page = '/p/test-unknown/';
    setPageSources(['src-one'], { page });
    expect(resolveCite('src-extra', page)[0]?.numbers).toEqual([2]);
    const [missing] = resolveCite('clm-nope-001', page);
    expect(missing?.kind).toBe('unknown');
    expect(missing?.numbers).toEqual([]);
  });

  it('keeps pages isolated', () => {
    setPageSources(['src-a'], { page: '/a/' });
    setPageSources(['src-b', 'src-a'], { page: '/b/' });
    expect(resolveCite('src-a', '/a/')[0]?.numbers).toEqual([1]);
    expect(resolveCite('src-a', '/b/')[0]?.numbers).toEqual([2]);
  });

  it('builds a drawer payload with footer numbers', () => {
    const page = '/p/payload/';
    setPageSources(['src-two', 'src-one'], { page, sources: [source('src-one'), source('src-two')] });
    const payload = getCitationPayload(page);
    expect(payload.sources.map((s) => [s.id, s.n])).toEqual([
      ['src-two', 1],
      ['src-one', 2],
    ]);
    expect(getCitationPayload('/never-set/')).toEqual({ sources: [], claims: [] });
  });

  it('serializes JSON safely for script tags', () => {
    const out = serializeForScript({ t: '</script><b>&' });
    expect(out).not.toContain('</script>');
    expect(JSON.parse(out)).toEqual({ t: '</script><b>&' });
  });
});
