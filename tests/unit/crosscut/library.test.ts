import { describe, expect, it } from 'vitest';
import type { Publication, Resource } from '../../../src/lib/schemas';
import {
  buildLibrary,
  csvField,
  EMPTY_FILTER,
  facetsOf,
  filterLibrary,
  toBibTeX,
  toCSV,
  toRIS,
} from '../../../src/components/crosscut/lib/library';

const resources: Resource[] = [
  {
    id: 'res-x402-repo',
    protocols: ['x402'],
    title: 'x402 repository',
    url: 'https://example.org/x402',
    publisher: 'x402 Foundation',
    type: 'repo',
    badge: 'official',
    date: '2026-05-01',
    note: 'Specs, SDKs & contracts, "canonical"',
  },
  {
    id: 'res-x402-repo',
    protocols: ['stripe-mpp'],
    title: 'x402 repository',
    url: 'https://example.org/x402',
    publisher: 'x402 Foundation',
    type: 'repo',
    badge: 'official',
    note: 'dup',
  },
];
const publications: Publication[] = [
  {
    id: 'pub-doe-2025-agents',
    title: 'Agents that pay',
    authors: ['Jane Doe', 'Ann Lee'],
    year: 2025,
    venue: 'Proceedings of AIES 2025',
    peerReviewed: true,
    doi: '10.1000/xyz',
    url: 'https://doi.org/10.1000/xyz',
    themes: ['payments', 'delegation'],
    protocols: ['ap2'],
    relation: 'related',
    summary: 'A study.',
    whyItMatters: 'It matters.',
    verifiedAt: '2026-10-10',
    verifiedVia: 'crossref',
    bibtex: '@inproceedings{doe2025,\n  title = {Agents that pay}\n}',
  },
  {
    id: 'pub-acme-2026-report',
    title: 'Industry report',
    authors: ['Acme Research'],
    year: 2026,
    peerReviewed: false,
    url: 'https://example.org/report',
    themes: ['markets'],
    protocols: ['x402'],
    relation: 'grey',
    summary: 'Grey.',
    whyItMatters: 'Context.',
    verifiedAt: '2026-10-10',
    verifiedVia: 'publisher',
    bibtex: '',
  },
];
const items = buildLibrary(resources, publications);

describe('buildLibrary', () => {
  it('de-duplicates resources and unions protocols', () => {
    const r = items.filter((i) => i.id === 'res-x402-repo');
    expect(r).toHaveLength(1);
    expect(r[0]?.protocols).toEqual(['x402', 'stripe-mpp']);
  });
  it('types publications and marks grey literature', () => {
    expect(items.find((i) => i.id === 'pub-doe-2025-agents')?.type).toBe('peer-reviewed');
    const grey = items.find((i) => i.id === 'pub-acme-2026-report');
    expect(grey?.grey).toBe(true);
    expect(grey?.type).toBe('grey-literature');
  });
});

describe('filterLibrary', () => {
  it('filters by facet and query', () => {
    expect(filterLibrary(items, { ...EMPTY_FILTER, protocol: 'stripe-mpp' }).map((i) => i.id)).toEqual(['res-x402-repo']);
    expect(filterLibrary(items, { ...EMPTY_FILTER, theme: 'payments' }).map((i) => i.id)).toEqual(['pub-doe-2025-agents']);
    expect(filterLibrary(items, { ...EMPTY_FILTER, year: '2026' })).toHaveLength(2);
    expect(filterLibrary(items, { ...EMPTY_FILTER, badge: 'official' })).toHaveLength(1);
    expect(filterLibrary(items, { ...EMPTY_FILTER, query: 'jane pay' }).map((i) => i.id)).toEqual(['pub-doe-2025-agents']);
    expect(filterLibrary(items, { ...EMPTY_FILTER, kind: 'publication' })).toHaveLength(2);
  });
  it('collects facets', () => {
    const f = facetsOf(items);
    expect(f.years).toEqual(['2026', '2025']);
    expect(f.badges).toEqual(['academic', 'official']);
    expect(f.protocols).toEqual(['ap2', 'stripe-mpp', 'x402']);
  });
});

describe('exports', () => {
  it('BibTeX keeps verified entries and builds @misc with escaping', () => {
    const bib = toBibTeX(items, '2026-10-11');
    expect(bib).toContain('@inproceedings{doe2025,');
    expect(bib).toContain('@misc{x402-repo,');
    expect(bib).toContain('Specs, SDKs \\& contracts');
    expect(bib).toContain('urldate = {2026-10-11}');
    expect(bib).toContain('@misc{acme-2026-report,');
    expect(bib).toContain('author = {Acme Research}');
  });
  it('RIS has one record per item with authors and ER', () => {
    const ris = toRIS(items);
    expect(ris.match(/^TY {2}- /gm)).toHaveLength(3);
    expect(ris.match(/^ER {2}- $/gm)).toHaveLength(3);
    expect(ris).toContain('TY  - CPAPER');
    expect(ris).toContain('AU  - Jane Doe\r\nAU  - Ann Lee');
    expect(ris).toContain('DO  - 10.1000/xyz');
    expect(ris).toContain('TY  - RPRT');
    expect(ris).toContain('N1  - Grey literature');
    expect(ris).toContain('TY  - COMP');
  });
  it('CSV quotes per RFC 4180 and guards formulas', () => {
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField('=SUM(A1)')).toBe("'=SUM(A1)");
    const csv = toCSV(items);
    const lines = csv.trimEnd().split('\r\n');
    expect(lines[0]).toBe('id,kind,title,authors,publisher,year,date,type,badge,grey,protocols,themes,venue,doi,arxiv,url');
    expect(lines).toHaveLength(4);
    expect(csv).toContain('Jane Doe; Ann Lee');
    expect(csv).toContain('x402; stripe-mpp');
  });
});
