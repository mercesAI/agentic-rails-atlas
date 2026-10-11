import { describe, expect, it } from 'vitest';
import rehypeGlossary from '../../../src/lib/glossary/rehype-glossary';

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
