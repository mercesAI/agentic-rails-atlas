import { describe, expect, it } from 'vitest';
import rehypeTableWrap from '../../../src/lib/rehype-table-wrap';

const el = (tagName: string, children: unknown[] = [], properties: Record<string, unknown> = {}) => ({ type: 'element', tagName, properties, children });
const table = () => el('table', [el('tr', [el('td', [{ type: 'text', value: 'x' }])])]);

describe('rehype-table-wrap', () => {
  it('wraps a bare table in a focusable scroll region', () => {
    const tree = { type: 'root', children: [table()] };
    rehypeTableWrap()(tree as never);
    const wrap = tree.children[0] as ReturnType<typeof el>;
    expect(wrap.tagName).toBe('div');
    expect(wrap.properties).toMatchObject({ className: ['table-wrap'], role: 'region', tabIndex: 0 });
    expect((wrap.children[0] as ReturnType<typeof el>).tagName).toBe('table');
  });
  it('leaves a table that already sits in a wrapper alone', () => {
    const tree = { type: 'root', children: [el('div', [table()], { className: ['table-wrap', 'field-table'] })] };
    rehypeTableWrap()(tree as never);
    expect(JSON.stringify(tree).match(/table-wrap/g)).toHaveLength(1);
  });
  it('reaches tables inside MDX JSX blocks such as <Mode spec>', () => {
    const tree = { type: 'root', children: [{ type: 'mdxJsxFlowElement', name: 'Mode', attributes: [], children: [el('p'), table()] }] };
    rehypeTableWrap()(tree as never);
    const block = tree.children[0] as { children: ReturnType<typeof el>[] };
    expect(block.children[1]!.tagName).toBe('div');
    expect(block.children[1]!.properties.className).toEqual(['table-wrap']);
  });
});
