import { describe, expect, it } from 'vitest';
import { matchableSelector, paintDiff, planStyle, pruneStyle, selectorParts, splitCssRules } from '../../../scripts/lib/svg-style';

describe('splitCssRules', () => {
  it('splits top-level rules, keeps nested at-rule blocks whole and respects quotes', () => {
    const css =
      "#d{font-family:'A {b}',sans-serif;}@keyframes dash{to{stroke-dashoffset:0;}}@media print{#d .n{fill:#000;}}" +
      '@import url("x;y.css");#d .n, #d .m{stroke:red;}';
    expect(splitCssRules(css)).toEqual([
      "#d{font-family:'A {b}',sans-serif;}",
      '@keyframes dash{to{stroke-dashoffset:0;}}',
      '@media print{#d .n{fill:#000;}}',
      '@import url("x;y.css");',
      '#d .n, #d .m{stroke:red;}',
    ]);
  });
});

describe('selectors', () => {
  it('splits a list only outside parentheses and brackets', () => {
    expect(selectorParts('#d .a, :is(#d .b, #d .c) rect,#d [data-x="1,2"]')).toEqual(['#d .a', ':is(#d .b, #d .c) rect', '#d [data-x="1,2"]']);
  });

  it('matches the static drawing: dynamic pseudo-classes and pseudo-elements are ignored, structural ones kept', () => {
    expect(matchableSelector('#d .node:hover rect')).toBe('#d .node rect');
    expect(matchableSelector('#d .label::before')).toBe('#d .label');
    expect(matchableSelector('#d .a:focus-visible')).toBe('#d .a');
    expect(matchableSelector('#d .a:not(.b):first-child')).toBe('#d .a:not(.b):first-child');
    expect(matchableSelector('#d .marker.cross')).toBe('#d .marker.cross');
    expect(matchableSelector('#d > ::after')).toBe('*');
  });
});

describe('pruneStyle', () => {
  const svg =
    '<svg id="d"><style>#d{fill:#111;}@keyframes dash{to{stroke-dashoffset:0;}}@keyframes spin{to{transform:rotate(1turn);}}' +
    '#d .fast{animation:dash 20s linear infinite;}#d .gone{animation-name:spin;}#d .n{stroke:red;}@media print{#d .n{stroke:black;}}</style><g class="n fast"/></svg>';

  it('drops the unmatched rules and the keyframes no kept rule names, and keeps other at-rules', () => {
    const plan = planStyle(svg)!;
    expect(plan.selectors).toEqual([['#d'], null, null, ['#d .fast'], ['#d .gone'], ['#d .n'], null]);
    const out = pruneStyle(svg, plan, [true, true, true, true, false, true, true]);
    expect(out).toBe(
      '<svg id="d"><style>#d{fill:#111;}@keyframes dash{to{stroke-dashoffset:0;}}#d .fast{animation:dash 20s linear infinite;}#d .n{stroke:red;}@media print{#d .n{stroke:black;}}</style><g class="n fast"/></svg>',
    );
  });

  it('keeps everything when every rule matches, and returns null for an SVG without a style block', () => {
    const plan = planStyle(svg)!;
    expect(pruneStyle(svg, plan, plan.rules.map(() => true))).toBe(svg);
    expect(planStyle('<svg><g/></svg>')).toBeNull();
  });
});

describe('paintDiff', () => {
  it('names the element, the property and both values, and reports a different element count', () => {
    const props = ['fill', 'stroke'];
    expect(paintDiff([['path.a', '#fff', '#000']], [['path.a', '#fff', '#000']], props)).toEqual([]);
    expect(paintDiff([['path.a', '#fff', '#000']], [['path.a', '#fff', '#111']], props)).toEqual(['path.a stroke: #000 became #111']);
    expect(paintDiff([['svg']], [['svg'], ['g']], props)).toEqual(['element count 1 vs 2']);
  });
});
