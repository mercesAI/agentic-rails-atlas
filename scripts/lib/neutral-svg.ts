/**
 * neutral-svg.ts. Folds a light and a dark render of one Mermaid diagram into
 * a single theme-neutral SVG whose theme colors are CSS custom properties, so
 * a page inlines each diagram once instead of twice (ARCHITECTURE.md Section 9).
 *
 * The two renders must share a skeleton: the same text once every color
 * literal is masked. Mermaid numbers actors, markers and class ids with
 * counters that only reset with the page, so render-diagrams.ts draws each
 * theme on a fresh page load in the same order. A color that is the same in
 * both renders stays a literal. One that differs becomes
 * `var(--dc-<light>__<dark>)`: directly inside the <style> block and inside
 * style attributes, and for a presentation attribute such as fill="#..."
 * (which cannot hold a variable) through a style declaration added to the
 * element, with the light literal left in the attribute as the fallback.
 * colorsCss() writes the variables with dark values on :root and light values
 * under the selectors tokens.css uses for the light theme and for print.
 */

export interface ColorPair {
  light: string;
  dark: string;
}

/** Hex, rgb() and hsl() literals; the lookahead keeps #abc-like ids out. */
export const COLOR_RE = /#[0-9a-fA-F]{3,8}(?![\w-])|rgba?\([^()]*\)|hsla?\([^()]*\)/g;
const HAS_COLOR = new RegExp(COLOR_RE.source);
const MASK = '\u0000';
/** Attributes whose CSS property has the same name, so a style declaration can take over. */
const PRESENTATION = new Set(['fill', 'stroke', 'color', 'stop-color', 'flood-color', 'lighting-color']);

const slug = (color: string): string => color.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** The custom property for a pair; its name carries both literals, so equal pairs share one variable. */
export function colorVariable(pair: ColorPair): string {
  return `--dc-${slug(pair.light)}__${slug(pair.dark)}`;
}

export type NeutralResult = { svg: string; colors: ColorPair[] } | { error: string };

export function neutralizeSvg(light: string, dark: string): NeutralResult {
  if (light.replace(COLOR_RE, MASK) !== dark.replace(COLOR_RE, MASK)) return { error: 'the light and dark renders differ outside their colors' };
  const darkTokens = dark.match(COLOR_RE) ?? [];
  const pairs: ColorPair[] = (light.match(COLOR_RE) ?? []).map((l, i) => ({ light: l, dark: darkTokens[i] ?? l }));
  const used = new Map<string, ColorPair>();
  const problems: string[] = [];
  let i = 0;
  /** The replacement for the next color in document order: undefined when it stays literal. */
  const next = (): string | undefined => {
    const pair = pairs[i++];
    if (!pair || pair.light === pair.dark) return undefined;
    const name = colorVariable(pair);
    used.set(name, pair);
    return `var(${name})`;
  };

  const rewriteTag = (tag: string): string => {
    const expected = (tag.match(COLOR_RE) ?? []).length;
    if (!expected) return tag;
    let seen = 0;
    let hasStyle = false;
    const extra: string[] = [];
    let out = tag.replace(/(\s)([A-Za-z_:][-\w:.]*)="([^"]*)"/g, (_m, space: string, name: string, value: string) => {
      const isStyle = name === 'style';
      if (isStyle) hasStyle = true;
      if (!HAS_COLOR.test(value)) return `${space}${name}="${value}"`;
      const rewritten = value.replace(COLOR_RE, (literal) => {
        seen++;
        const replacement = next();
        if (!replacement) return literal;
        if (isStyle) return replacement;
        if (PRESENTATION.has(name)) {
          extra.push(`${name}:${replacement}`);
          return literal;
        }
        problems.push(`theme color ${literal} in the ${name} attribute has no CSS property`);
        return literal;
      });
      return `${space}${name}="${rewritten}"`;
    });
    if (seen !== expected) problems.push(`${expected - seen} color(s) outside quoted attributes in ${tag.slice(0, 60)}`);
    if (extra.length) {
      out = hasStyle
        ? out.replace(/(\sstyle=")([^"]*)"/, (_m, pre: string, css: string) => {
            const base = css.replace(/;?\s*$/, '').trim();
            return `${pre}${base ? `${base};` : ''}${extra.join(';')}"`;
          })
        : out.replace(/\s*\/?>$/, (end) => ` style="${extra.join(';')}"${end}`);
    }
    return out;
  };

  const out: string[] = [];
  let pos = 0;
  while (pos < light.length) {
    let seg: string;
    if (/^<style[\s>]/.test(light.slice(pos, pos + 7))) {
      const end = light.indexOf('</style>', pos);
      seg = end < 0 ? light.slice(pos) : light.slice(pos, end + '</style>'.length);
      out.push(seg.replace(COLOR_RE, (literal) => next() ?? literal));
    } else if (light[pos] === '<') {
      const end = light.indexOf('>', pos);
      seg = end < 0 ? light.slice(pos) : light.slice(pos, end + 1);
      out.push(rewriteTag(seg));
    } else {
      const end = light.indexOf('<', pos);
      seg = end < 0 ? light.slice(pos) : light.slice(pos, end);
      // Text content never changes with the theme; a differing literal there has nowhere to go.
      seg.replace(COLOR_RE, (literal) => {
        if (next()) problems.push(`theme color ${literal} in text content`);
        return literal;
      });
      out.push(seg);
    }
    pos += seg.length;
  }
  if (i !== pairs.length) problems.push(`visited ${i} of ${pairs.length} colors`);
  if (problems.length) return { error: problems.slice(0, 3).join('; ') };
  const colors = [...used.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, pair]) => pair);
  return { svg: out.join(''), colors };
}

/**
 * The stylesheet for every pair in use. Dark is the default theme (tokens.css
 * puts the dark palette on :root); light applies under data-theme='light',
 * under the system preference when no theme is stored, and in print.
 */
export function colorsCss(pairs: Iterable<ColorPair>): string {
  const byName = new Map<string, ColorPair>();
  for (const pair of pairs) byName.set(colorVariable(pair), pair);
  const names = [...byName.keys()].sort((a, b) => a.localeCompare(b));
  const header =
    '/* Generated by scripts/render-diagrams.ts from the color pairs in diagrams/index.json; do not edit.\n' +
    '   Each variable holds the dark value by default and the light value where tokens.css applies the light theme. */\n';
  if (!names.length) return `${header}/* No theme-neutral diagram uses a color that differs between the themes. */\n`;
  const block = (mode: 'light' | 'dark', indent: string): string => names.map((n) => `${indent}${n}: ${byName.get(n)![mode]};`).join('\n');
  return (
    `${header}:root {\n${block('dark', '  ')}\n}\n` +
    `:root[data-theme='light'] {\n${block('light', '  ')}\n}\n` +
    `@media (prefers-color-scheme: light) {\n  :root:not([data-theme]) {\n${block('light', '    ')}\n  }\n}\n` +
    `@media print {\n  :root {\n${block('light', '    ')}\n  }\n}\n`
  );
}
