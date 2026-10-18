import { describe, expect, it } from 'vitest';
import { suffixIds } from '../../../src/lib/diagrams/suffix-ids';

describe('suffixIds', () => {
  const svg = '<svg id="mmd-a" aria-labelledby="t1 d1"><style>#mmd-a .node rect{fill:red}#other{x:1}</style><defs><marker id="arrow"/></defs><path marker-end="url(#arrow)"/><use href="#arrow"/><title id="t1"/><desc id="d1"/><a href="#elsewhere"/></svg>';
  it('rewrites ids, references, aria lists and scoped selectors with one suffix', () => {
    const out = suffixIds(svg, '-x');
    expect(out).toContain('id="mmd-a-x"');
    expect(out).toContain('#mmd-a-x .node rect');
    expect(out).toContain('#other{x:1}');
    expect(out).toContain('url(#arrow-x)');
    expect(out).toContain('href="#arrow-x"');
    expect(out).toContain('aria-labelledby="t1-x d1-x"');
    expect(out).toContain('href="#elsewhere"');
  });
  it('leaves an svg without ids untouched', () => {
    expect(suffixIds('<svg><rect/></svg>', '-x')).toBe('<svg><rect/></svg>');
  });
  it('keeps the id-ending and exact-id attribute selectors Mermaid uses for markers in step', () => {
    const svg =
      '<svg id="m"><style>[id$="-arrowhead"] path{fill:red;}[id=\'m-dot\']{fill:blue;}[id^="m-"]{opacity:1;}[id="other"]{fill:green;}</style>' +
      '<marker id="m-arrowhead"><path/></marker><marker id="m-dot"/></svg>';
    expect(suffixIds(svg, '-x')).toBe(
      '<svg id="m-x"><style>[id$="-arrowhead-x"] path{fill:red;}[id=\'m-dot-x\']{fill:blue;}[id^="m-"]{opacity:1;}[id="other"]{fill:green;}</style>' +
        '<marker id="m-arrowhead-x"><path/></marker><marker id="m-dot-x"/></svg>',
    );
  });
});
