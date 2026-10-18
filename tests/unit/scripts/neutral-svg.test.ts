import { describe, expect, it } from 'vitest';
import { COLOR_RE, colorVariable, colorsCss, neutralizeSvg, pairSlug } from '../../../scripts/lib/neutral-svg';

const ok = (r: ReturnType<typeof neutralizeSvg>): { svg: string; colors: { light: string; dark: string }[] } => {
  if ('error' in r) throw new Error(r.error);
  return r;
};

describe('neutralizeSvg', () => {
  it('keeps colors shared by both themes literal and leaves an identical pair untouched', () => {
    const svg = '<svg id="d"><style>#d .a{fill:#ffffff;stroke:#777777;}</style><rect fill="#ffffff" stroke="#777777"/><text>#abc</text></svg>';
    const r = ok(neutralizeSvg(svg, svg));
    expect(r.svg).toBe(svg);
    expect(r.colors).toEqual([]);
  });

  it('turns differing colors into variables in the style block and style attributes, and attribute colors into zero-specificity rules', () => {
    const light =
      '<svg id="d"><style>#d .a{fill:#ffffff;stroke:#777777;}</style><rect fill="#ffffff" stroke="#777777"/><g style="fill:#ffffff;"/>' +
      '<path style="opacity:1;" stroke="#ffffff"/><circle fill="#ffffff" style="x:1" stroke="#ffffff"/><line style="" stroke="#ffffff"></line></svg>';
    const dark = light.replaceAll('#ffffff', '#151a25');
    const v = colorVariable({ light: '#ffffff', dark: '#151a25' });
    const r = ok(neutralizeSvg(light, dark));
    expect(v).toBe('--dc-ffffff__151a25');
    expect(pairSlug({ light: '#ffffff', dark: '#151a25' })).toBe('ffffff__151a25');
    expect(r.colors).toEqual([{ light: '#ffffff', dark: '#151a25' }]);
    expect(r.svg).toBe(
      `<svg id="d"><style>#d .a{fill:var(${v});stroke:#777777;}` +
        `:where(#d [data-dc-fill="ffffff__151a25"]){fill:var(${v},#ffffff);}` +
        `:where(#d [data-dc-stroke="ffffff__151a25"]){stroke:var(${v},#ffffff);}</style>` +
        '<rect fill="#ffffff" stroke="#777777" data-dc-fill="ffffff__151a25"/>' +
        `<g style="fill:var(${v});"/>` +
        '<path style="opacity:1;" stroke="#ffffff" data-dc-stroke="ffffff__151a25"/>' +
        '<circle fill="#ffffff" style="x:1" stroke="#ffffff" data-dc-fill="ffffff__151a25" data-dc-stroke="ffffff__151a25"/>' +
        '<line style="" stroke="#ffffff" data-dc-stroke="ffffff__151a25"></line></svg>',
    );
  });

  it('keeps an inline declaration of the same property in charge: the style attribute is left as it was', () => {
    const light = '<svg id="d"><style>#d .n{stroke:#b8bcc8;}</style><path class="n" style="stroke:#000000" stroke="#4a5163"/></svg>';
    const dark = '<svg id="d"><style>#d .n{stroke:#35405a;}</style><path class="n" style="stroke:#000000" stroke="#8a93a8"/></svg>';
    const r = ok(neutralizeSvg(light, dark));
    expect(r.svg).toContain('<path class="n" style="stroke:#000000" stroke="#4a5163" data-dc-stroke="4a5163__8a93a8"/>');
    expect(r.svg).toContain('#d .n{stroke:var(--dc-b8bcc8__35405a);}:where(#d [data-dc-stroke="4a5163__8a93a8"]){stroke:var(--dc-4a5163__8a93a8,#4a5163);}');
  });

  it('pairs each occurrence by position, so one light color may map to two dark colors', () => {
    const light = '<svg><style></style><rect fill="#ffffff"/><rect fill="#ffffff"/></svg>';
    const dark = '<svg><style></style><rect fill="#ffffff"/><rect fill="#151a25"/></svg>';
    const r = ok(neutralizeSvg(light, dark));
    expect(r.svg).toBe(
      '<svg><style>:where([data-dc-fill="ffffff__151a25"]){fill:var(--dc-ffffff__151a25,#ffffff);}</style><rect fill="#ffffff"/><rect fill="#ffffff" data-dc-fill="ffffff__151a25"/></svg>',
    );
    expect(r.colors).toEqual([{ light: '#ffffff', dark: '#151a25' }]);
  });

  it('handles rgb() and hsl() literals and slugs them into variable names', () => {
    const light = '<svg><style>.l{background-color:rgba(255, 255, 255, 0.5);color:hsl(0 0% 10%)}</style></svg>';
    const dark = '<svg><style>.l{background-color:rgba(21, 26, 37, 0.5);color:hsl(0 0% 10%)}</style></svg>';
    const r = ok(neutralizeSvg(light, dark));
    expect(r.svg).toContain('background-color:var(--dc-rgba-255-255-255-0-5__rgba-21-26-37-0-5);color:hsl(0 0% 10%)');
    expect(r.colors).toEqual([{ light: 'rgba(255, 255, 255, 0.5)', dark: 'rgba(21, 26, 37, 0.5)' }]);
  });

  it('does not take id references or words for colors', () => {
    expect('url(#abc-1) #fade-in #deadbeef0 #face'.match(COLOR_RE)).toEqual(['#face']);
  });

  it('refuses renders that differ outside their colors', () => {
    const r = neutralizeSvg('<svg><g id="actor2"/></svg>', '<svg><g id="actor5"/></svg>');
    expect(r).toEqual({ error: 'the light and dark renders differ outside their colors' });
  });

  it('refuses a differing color that has nowhere to go', () => {
    expect(neutralizeSvg('<svg><text>#ffffff</text></svg>', '<svg><text>#000000</text></svg>')).toEqual({ error: 'theme color #ffffff in text content' });
    expect(neutralizeSvg('<svg><style></style><g data-c="#ffffff"/></svg>', '<svg><style></style><g data-c="#000000"/></svg>')).toEqual({
      error: 'theme color #ffffff in the data-c attribute has no CSS property',
    });
    expect(neutralizeSvg('<svg><rect fill="#ffffff"/></svg>', '<svg><rect fill="#000000"/></svg>')).toEqual({
      error: 'no <style> block to hold the rules for attribute colors',
    });
    expect(neutralizeSvg('<svg><style></style><rect fill="#ffffff #eeeeee"/></svg>', '<svg><style></style><rect fill="#000000 #111111"/></svg>')).toEqual({
      error: 'two theme colors in one fill attribute',
    });
  });
});

describe('colorsCss', () => {
  it('writes dark defaults on :root and light values for the light theme, the system preference and print, sorted and deduplicated', () => {
    const css = colorsCss([
      { light: '#ffffff', dark: '#151a25' },
      { light: '#b8bcc8', dark: '#35405a' },
      { light: '#ffffff', dark: '#151a25' },
    ]);
    expect(css).toBe(
      '/* Generated by scripts/render-diagrams.ts from the color pairs in diagrams/index.json; do not edit.\n' +
        '   Each variable holds the dark value by default and the light value where tokens.css applies the light theme. */\n' +
        ':root {\n  --dc-b8bcc8__35405a: #35405a;\n  --dc-ffffff__151a25: #151a25;\n}\n' +
        ":root[data-theme='light'] {\n  --dc-b8bcc8__35405a: #b8bcc8;\n  --dc-ffffff__151a25: #ffffff;\n}\n" +
        '@media (prefers-color-scheme: light) {\n  :root:not([data-theme]) {\n    --dc-b8bcc8__35405a: #b8bcc8;\n    --dc-ffffff__151a25: #ffffff;\n  }\n}\n' +
        '@media print {\n  :root {\n    --dc-b8bcc8__35405a: #b8bcc8;\n    --dc-ffffff__151a25: #ffffff;\n  }\n}\n',
    );
  });

  it('writes a comment only when no pair is in use', () => {
    expect(colorsCss([])).toMatch(/^\/\* Generated[\s\S]*\n\/\* No theme-neutral diagram uses a color that differs between the themes\. \*\/\n$/);
  });
});
