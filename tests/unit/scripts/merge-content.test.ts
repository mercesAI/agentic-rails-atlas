import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mergeContent } from '../../../scripts/merge-content';

const REPO = join(__dirname, '..', '..', '..');
let root: string;

const write = (rel: string, value: unknown): void => {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, typeof value === 'string' ? value : JSON.stringify(value, null, 2));
};
const read = <T = unknown>(rel: string): T => JSON.parse(readFileSync(join(root, rel), 'utf8')) as T;

const source = (id: string, url: string, extra: Record<string, unknown> = {}) => ({
  id,
  url,
  title: `Title of ${id}`,
  publisher: 'Publisher',
  type: 'docs',
  primary: true,
  accessed: '2026-10-11',
  ...extra,
});

const publication = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  title: `Paper ${id}`,
  authors: ['Ada Lovelace'],
  year: 2026,
  peerReviewed: false,
  url: 'https://arxiv.org/abs/2601.00001',
  themes: ['security'],
  protocols: ['x402'],
  relation: 'direct',
  summary: 'A summary.',
  whyItMatters: 'It matters.',
  verifiedAt: '2026-10-10',
  verifiedVia: 'arxiv',
  bibtex: '@misc{x, title={y}}',
  ...extra,
});

const term = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  term: id.replace(/-/g, ' '),
  aliases: [],
  plain: 'Plain definition.',
  ste: 'STE definition.',
  protocols: [],
  sources: ['src-r-one'],
  ...extra,
});

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'atlas-merge-'));
  // The fixed parts of the shared files (dimensions, controls) come from the repository.
  const compare = JSON.parse(readFileSync(join(REPO, 'src', 'content', 'compare.json'), 'utf8')) as { dimensions: unknown[] };
  const controls = JSON.parse(readFileSync(join(REPO, 'src', 'content', 'controls-map.json'), 'utf8')) as {
    controls: unknown[];
    independentLayerNotes: unknown[];
  };
  write('src/content/compare.json', { dimensions: compare.dimensions, cells: [], radar: [] });
  write('src/content/controls-map.json', { controls: controls.controls, cells: [], independentLayerNotes: controls.independentLayerNotes });
  write('src/data/manual-metrics.json', { generatedAt: '2026-10-01', metrics: [] });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('merge-content', () => {
  it('succeeds with no research files and no protocol folders, and is idempotent', () => {
    const first = mergeContent({ root });
    expect(first.errors).toEqual([]);
    expect(first.protocolFolders).toEqual([]);
    expect(read('src/content/sources/sources.json')).toEqual([]);
    expect(read('src/content/publications/publications.json')).toEqual([]);
    expect(read('src/content/glossary/terms.json')).toEqual([]);
    expect(read('src/content/relations.json')).toEqual([]);
    expect(read('src/content/timeline-global.json')).toEqual([]);
    const second = mergeContent({ root });
    expect(second.changed).toEqual([]);
  });

  it('works with the real repository layout copied as is', () => {
    cpSync(join(REPO, 'research'), join(root, 'research'), {
      recursive: true,
      filter: (src) => !src.includes(`${join('research', 'vendor')}`),
    });
    const r = mergeContent({ root, dryRun: true });
    expect(r.errors).toEqual([]);
  });

  describe('with research files and writer sidecars', () => {
    beforeEach(() => {
      write('research/ste.sources.json', { generatedAt: '2026-10-10', sources: [source('src-r-one', 'https://example.com/one/')] });
      write('research/protocols/x402.sources.json', [
        source('src-x402-spec', 'https://example.com/spec'),
        source('src-x402-dup', 'https://www.example.com/one'),
        { id: 'bad id', url: 'nope' },
      ]);
      write('research/policy.json', {
        sources: [source('src-policy-a', 'https://example.org/policy')],
        timeline: [
          { date: '2025-06-01', title: 'Rule adopted', kind: 'policy', sources: ['src-policy-a'], confidence: 'verified' },
          { date: '2025-06-01', title: 'Rule adopted', kind: 'policy', sources: ['src-policy-a'], confidence: 'verified' },
        ],
      });
      write('research/market.json', {
        generatedAt: '2026-10-11',
        metrics: [
          { id: 'm-volume', metric: 'Volume', value: 10, unit: 'USD', asOf: '2026-10-01', definition: 'd', sources: ['src-policy-a'] },
          { id: 'm-bad', metric: 'Bad' },
        ],
      });
      write('research/prehistory.json', '{ this is not json');
      write('research/publications.a.json', {
        publications: [
          publication('pub-lovelace-2026-alpha', { arxiv: '2601.00001' }),
          publication('pub-lovelace-2026-unverified', { verifiedAt: undefined }),
          publication('pub-babbage-2026-doi', { doi: '10.1000/XYZ', verifiedVia: 'crossref' }),
        ],
        unverified: [{ id: 'pub-x-2026-y' }],
      });
      write('research/publications.b.json', {
        entries: [
          publication('pub-lovelace-2026-alphadup', { arxiv: 'arXiv:2601.00001v2' }),
          publication('pub-babbage-2026-doidup', { doi: 'https://doi.org/10.1000/xyz' }),
          publication('pub-turing-2026-beta', { protocols: [] }),
        ],
      });
      write('research/glossary.draft.json', {
        terms: [term('facilitator'), term('mandate', { stub: true }), term('broken', { sources: [] }), term('stub-only', { stub: true, plain: '' , sources: [] })],
        sources: [source('src-gl-one', 'https://example.net/g')],
      });

      write('src/content/protocols/x402/sources.json', [source('src-x402-spec', 'https://example.com/spec', { title: 'Sidecar title' })]);
      write('src/content/protocols/x402/publication-tags.json', [
        { id: 'pub-turing-2026-beta', whyItMatters: 'Models the payment handshake.' },
        { id: 'pub-missing-2026-x' },
      ]);
      write('src/content/protocols/x402/glossary-additions.json', [term('facilitator', { protocols: ['x402'] }), term('mandate', { plain: 'Full text.' }), term('payment-payload')]);
      write('src/content/protocols/ap2/glossary-additions.json', [term('facilitator')]);
      write('src/content/protocols/x402/relations.json', [
        { from: 'x402', to: 'ap2', type: 'complements', note: 'n', sources: ['src-x402-spec'] },
        { from: 'x402', to: 'ap2', type: 'complements', note: 'second copy', sources: ['src-x402-spec'] },
      ]);
      write('src/content/protocols/x402/compare-cells.json', {
        cells: [
          { protocol: 'x402', dimension: 'primary-job', value: 'Pay per request over HTTP', sources: ['src-x402-spec'], confidence: 'verified' },
          { protocol: 'x402', dimension: 'stewards', value: 'not published', sources: ['src-x402-spec'], confidence: 'verified' },
          { protocol: 'x402', dimension: 'no-such-dimension', value: 'v', sources: ['src-x402-spec'], confidence: 'verified' },
          { protocol: 'ap2', dimension: 'primary-job', value: 'wrong folder', sources: ['src-x402-spec'], confidence: 'verified' },
        ],
        radar: [{ protocol: 'x402', axis: 'openness', value: 4, justification: 'j', sources: ['src-x402-spec'] }],
        controlsCells: [{ protocol: 'x402', control: 'spending-caps', support: 'partial', note: 'n', sources: ['src-x402-spec'] }],
      });
      write('src/content/protocols/not-a-protocol/sources.json', [source('src-ignored', 'https://ignored.example')]);
    });

    it('merges sources with sidecar precedence and URL aliases', () => {
      const r = mergeContent({ root });
      expect(r.errors).toEqual([]);
      const sources = read<{ id: string; title: string }[]>('src/content/sources/sources.json');
      expect(sources.map((s) => s.id)).toEqual(['src-gl-one', 'src-policy-a', 'src-r-one', 'src-x402-dup', 'src-x402-spec']);
      expect(sources.find((s) => s.id === 'src-x402-spec')?.title).toBe('Sidecar title');
      expect(read('src/generated/source-aliases.json')).toEqual({ 'src-x402-dup': 'src-r-one' });
      expect(r.warnings.some((w) => w.includes('src-x402-spec') && w.includes('overrides'))).toBe(true);
      expect(r.warnings.some((w) => w.includes('not-a-protocol'))).toBe(true);
      expect(r.warnings.some((w) => w.includes('prehistory.json'))).toBe(true);
    });

    it('keeps verified publications only, de-duplicated by id, arXiv id and DOI, and applies tags', () => {
      mergeContent({ root });
      const pubs = read<{ id: string; protocols: string[]; whyItMatters: string }[]>('src/content/publications/publications.json');
      expect(pubs.map((p) => p.id)).toEqual(['pub-babbage-2026-doi', 'pub-lovelace-2026-alpha', 'pub-turing-2026-beta']);
      const beta = pubs.find((p) => p.id === 'pub-turing-2026-beta')!;
      expect(beta.protocols).toEqual(['x402']);
      expect(beta.whyItMatters).toBe('It matters. x402: Models the payment handshake.');
    });

    it('merges glossary terms, keeps stubs flagged and adds protocol slugs', () => {
      const r = mergeContent({ root });
      const terms = read<{ id: string; protocols: string[]; stub?: boolean; plain: string }[]>('src/content/glossary/terms.json');
      expect(terms.map((t) => t.id)).toEqual(['facilitator', 'mandate', 'payment-payload']);
      expect(terms.find((t) => t.id === 'facilitator')?.protocols).toEqual(['x402', 'ap2']);
      const mandate = terms.find((t) => t.id === 'mandate')!;
      expect(mandate.stub).toBeUndefined();
      expect(mandate.plain).toBe('Full text.');
      expect(r.glossaryTerms).toBe(3);
      expect(r.glossaryStubs).toBe(1);
      expect(r.warnings.some((w) => w.includes('term[2]'))).toBe(true);
    });

    it('reports a writer term that disagrees with the research draft, and ignores key order in source conflicts', () => {
      write('src/content/protocols/ap2/glossary-additions.json', [term('facilitator', { plain: 'A different definition.' })]);
      // The same record as research/ste.sources.json with its keys in another order.
      const { id, url, ...rest } = source('src-r-one', 'https://example.com/one/');
      write('src/content/protocols/ap2/sources.json', [{ ...rest, url, id }]);
      const r = mergeContent({ root });
      expect(r.errors).toEqual([]);
      expect(r.warnings.some((w) => w.includes('glossary term facilitator') && w.includes('research/glossary.draft.json'))).toBe(true);
      expect(r.warnings.some((w) => w.includes('src-r-one'))).toBe(false);
      const terms = read<{ id: string; plain: string; protocols: string[] }[]>('src/content/glossary/terms.json');
      expect(terms.find((t) => t.id === 'facilitator')?.plain).toBe('Plain definition.');
      expect(terms.find((t) => t.id === 'facilitator')?.protocols).toEqual(['x402', 'ap2']);
    });

    it('merges relations, timeline, compare cells, controls cells and metrics', () => {
      mergeContent({ root });
      expect(read<unknown[]>('src/content/relations.json')).toHaveLength(1);
      const timeline = read<{ lane: string }[]>('src/content/timeline-global.json');
      expect(timeline).toHaveLength(1);
      expect(timeline[0]?.lane).toBe('Policy');
      const compare = read<{ cells: { protocol: string; dimension: string }[]; radar: unknown[] }>('src/content/compare.json');
      expect(compare.cells.map((c) => `${c.protocol}:${c.dimension}`)).toEqual(['x402:primary-job', 'x402:stewards']);
      expect(compare.radar).toHaveLength(1);
      const controls = read<{ cells: unknown[]; controls: unknown[] }>('src/content/controls-map.json');
      expect(controls.cells).toHaveLength(1);
      expect(controls.controls).toHaveLength(14);
      const metrics = read<{ generatedAt: string; metrics: { id: string; protocol: string }[] }>('src/data/manual-metrics.json');
      expect(metrics.metrics).toEqual([expect.objectContaining({ id: 'm-volume', protocol: 'market' })]);
      expect(metrics.generatedAt).toBe('2026-10-11');
    });

    it('replaces only the rows of the protocol that has a sidecar', () => {
      const compare = read<{ dimensions: unknown[]; cells: unknown[]; radar: unknown[] }>('src/content/compare.json');
      compare.cells = [{ protocol: 'ap2', dimension: 'primary-job', value: 'kept', sources: ['src-x'], confidence: 'verified' }];
      write('src/content/compare.json', compare);
      mergeContent({ root });
      const after = read<{ cells: { protocol: string; value: string }[] }>('src/content/compare.json');
      expect(after.cells.map((c) => c.protocol)).toEqual(['x402', 'x402', 'ap2']);
      expect(after.cells.find((c) => c.protocol === 'ap2')?.value).toBe('kept');
    });

    it('is deterministic and idempotent', () => {
      mergeContent({ root });
      const files = [
        'src/content/sources/sources.json',
        'src/content/publications/publications.json',
        'src/content/glossary/terms.json',
        'src/content/compare.json',
        'src/content/controls-map.json',
        'src/data/manual-metrics.json',
      ];
      const before = files.map((f) => readFileSync(join(root, f), 'utf8'));
      const again = mergeContent({ root });
      expect(again.changed).toEqual([]);
      expect(files.map((f) => readFileSync(join(root, f), 'utf8'))).toEqual(before);
    });

    it('fails in strict mode when inputs produced warnings, and writes nothing', () => {
      const r = mergeContent({ root, strict: true });
      expect(r.errors.some((e) => e.includes('--strict'))).toBe(true);
      expect(r.changed).toEqual([]);
    });

    it('fails loudly when a shared file is invalid', () => {
      write('src/content/compare.json', { dimensions: [], cells: [], radar: [] });
      const r = mergeContent({ root });
      expect(r.errors.some((e) => e.includes('compare.json'))).toBe(true);
    });
  });
});
