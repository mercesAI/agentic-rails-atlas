import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import rehypeGlossary, { pageProtocolsOf } from '../../../src/lib/glossary/rehype-glossary';

const terms = [
  { id: 'facilitator', term: 'facilitator', aliases: ['facilitators'], plain: 'A service that settles payments.' },
  { id: 'eip-712', term: 'EIP-712', aliases: [], plain: 'Typed structured data signing.' },
];

const text = (value: string) => ({ type: 'text', value });
const el = (tagName: string, children: unknown[]) => ({ type: 'element', tagName, properties: {}, children });

describe('rehype-glossary', () => {
  it('wraps the first occurrence per section and skips headings and code', () => {
    const tree = {
      type: 'root',
      children: [
        el('h2', [text('The facilitator role')]),
        el('p', [text('A facilitator signs EIP-712 data. Another facilitator follows.')]),
        el('p', [el('code', [text('facilitator')])]),
        el('h2', [text('Next')]),
        el('p', [text('Facilitators again, and eip-712 in lower case.')]),
      ],
    };
    rehypeGlossary({ terms })(tree as never);
    const json = JSON.stringify(tree);
    const buttons = json.match(/"tagName":"button"/g) ?? [];
    expect(buttons).toHaveLength(3);
    expect(json).toContain('"dataTerm":"facilitator"');
    expect(json).toContain('"dataTerm":"eip-712"');
    expect(JSON.stringify(tree.children[0])).not.toContain('button');
    expect(JSON.stringify(tree.children[2])).not.toContain('button');
  });

  it('is a no-op without terms', () => {
    const tree = { type: 'root', children: [el('p', [text('facilitator')])] };
    const before = JSON.stringify(tree);
    rehypeGlossary({ terms: [] })(tree as never);
    expect(JSON.stringify(tree)).toBe(before);
  });
});

describe('rehype-glossary reading-mode blocks', () => {
  const mode = (children: unknown[]) => ({ type: 'mdxJsxFlowElement', name: 'Mode', attributes: [], children });
  it('lets the visible text keep its annotation when a Mode block used the term first', () => {
    const tree = { type: 'root', children: [mode([el('p', [text('A facilitator helps.')])]), el('p', [text('The facilitator verifies.')])] };
    rehypeGlossary({ terms })(tree as never);
    expect(JSON.stringify(tree.children[0])).toContain('"dataTerm":"facilitator"');
    expect(JSON.stringify(tree.children[1])).toContain('"dataTerm":"facilitator"');
  });
  it('still annotates a term only once inside one Mode block', () => {
    const tree = { type: 'root', children: [mode([el('p', [text('A facilitator and another facilitator.')])])] };
    rehypeGlossary({ terms })(tree as never);
    expect((JSON.stringify(tree).match(/"tagName":"button"/g) ?? []).length).toBe(1);
  });
});

describe('rehype-glossary matching rules', () => {
  const t = [
    { id: 'agent-provider', term: 'Agent Provider', aliases: ['Agent'], plain: 'An approved agent operator.' },
    { id: 'x402', term: 'x402', aliases: [], plain: 'A payment protocol.' },
  ];
  const run = (s: string) => {
    const tree = { type: 'root', children: [el('p', [text(s)])] };
    rehypeGlossary({ terms: t })(tree as never);
    return JSON.stringify(tree);
  };
  it('treats a single capitalized alias as case-sensitive', () => {
    expect(run('an agent that pays')).not.toContain('button');
    expect(run('the Agent that pays')).toContain('"dataTerm":"agent-provider"');
  });
  it('does not split a dotted name', () => {
    expect(run('See x402.org for more')).not.toContain('button');
    expect(run('See x402 for more')).toContain('"dataTerm":"x402"');
  });
});

describe('rehype-glossary scoping', () => {
  const scoped = [
    ...terms,
    { id: 'charge', term: 'Charge', aliases: [], plain: 'The MPP intent.', protocols: ['stripe-mpp'] },
  ];
  type FileArg = { path?: string; data?: { astro?: { frontmatter?: Record<string, unknown> } } };
  const run = (file?: FileArg, words = 'We charge a fee.') => {
    const tree = { type: 'root', children: [el('p', [text(words)])] };
    rehypeGlossary({ terms: scoped })(tree as never, file as never);
    return JSON.stringify(tree);
  };
  const withFm = (path: string, frontmatter: Record<string, unknown>): FileArg => ({ path, data: { astro: { frontmatter } } });

  it('skips terms scoped to other protocols on a protocol page', () => {
    expect(run({ path: '/x/src/content/protocols/x402/index.mdx' })).not.toContain('button');
    expect(run({ path: '/x/src/content/protocols/stripe-mpp/index.mdx' })).toContain('"dataTerm":"charge"');
    expect(run({ path: '/x/src/content/protocols/stripe-mpp/ste.mdx' })).toContain('"dataTerm":"charge"');
  });

  it('scopes a scenario to its frontmatter protocols', () => {
    expect(run(withFm('/x/src/content/scenarios/a.mdx', { protocols: ['stripe-mpp', 'x402'] }))).toContain('"dataTerm":"charge"');
    expect(run(withFm('/x/src/content/scenarios/b.mdx', { protocols: ['openai-acp', 'ucp'] }))).not.toContain('button');
    expect(run(withFm('/x/src/content/scenarios/c.mdx', {}))).not.toContain('button');
  });

  it('scopes an orbit page to the protocols its relations point to', () => {
    const tempo = withFm('/x/src/content/orbit/tempo.mdx', { relations: [{ to: 'stripe-mpp', type: 'same-steward', note: 'n' }] });
    const l402 = withFm('/x/src/content/orbit/l402.mdx', { relations: [{ to: 'x402', type: 'lineage', note: 'n' }] });
    expect(run(tempo)).toContain('"dataTerm":"charge"');
    expect(run(l402)).not.toContain('button');
  });

  it('keeps common-word terms off orbit pages but on protocol pages and scenarios', () => {
    const common = [
      ...terms,
      { id: 'challenge', term: 'Challenge', aliases: [], plain: 'The MPP challenge.', protocols: ['stripe-mpp'], commonWord: true },
      { id: 'tempo', term: 'Tempo', aliases: [], plain: 'A chain.', protocols: ['stripe-mpp'] },
    ];
    const go = (file: FileArg, words: string) => {
      const tree = { type: 'root', children: [el('p', [text(words)])] };
      rehypeGlossary({ terms: common })(tree as never, file as never);
      return JSON.stringify(tree);
    };
    const words = 'The L402 challenge carries a macaroon; Tempo is unrelated.';
    const l402 = withFm('/x/src/content/orbit/l402.mdx', { relations: [{ to: 'x402', type: 'lineage', note: 'n' }, { to: 'stripe-mpp', type: 'complements', note: 'n' }] });
    expect(go(l402, words)).not.toContain('"dataTerm":"challenge"');
    expect(go(l402, words)).toContain('"dataTerm":"tempo"');
    expect(go({ path: '/x/src/content/protocols/stripe-mpp/index.mdx' }, words)).toContain('"dataTerm":"challenge"');
    expect(go(withFm('/x/src/content/scenarios/a.mdx', { protocols: ['stripe-mpp'] }), words)).toContain('"dataTerm":"challenge"');
    expect(go(withFm('/x/src/content/scenarios/b.mdx', { protocols: ['x402'] }), words)).not.toContain('"dataTerm":"challenge"');
  });

  it('gives other pages, and calls without a file, unscoped terms only', () => {
    expect(run({ path: '/x/src/pages/methodology/index.mdx' })).not.toContain('"dataTerm":"charge"');
    expect(run(undefined)).not.toContain('"dataTerm":"charge"');
    expect(run(undefined, 'A facilitator settles.')).toContain('"dataTerm":"facilitator"');
    expect(run(withFm('/x/src/content/scenarios/b.mdx', { protocols: ['ucp'] }), 'A facilitator settles.')).toContain('"dataTerm":"facilitator"');
  });

  it('reads the frontmatter from disk when the vfile does not carry it', () => {
    const path = fileURLToPath(new URL('./fixtures/glossary/content/scenarios/disk-only.mdx', import.meta.url));
    expect(pageProtocolsOf({ path })).toEqual(['stripe-mpp']);
    expect(run({ path })).toContain('"dataTerm":"charge"');
    expect(pageProtocolsOf({ path: '/x/src/content/scenarios/missing.mdx' })).toEqual([]);
  });

  it('prefers the frontmatter Astro attaches to the vfile', () => {
    const path = fileURLToPath(new URL('./fixtures/glossary/content/scenarios/disk-only.mdx', import.meta.url));
    expect(pageProtocolsOf({ path, data: { astro: { frontmatter: { protocols: ['ap2'] } } } })).toEqual(['ap2']);
  });
});
