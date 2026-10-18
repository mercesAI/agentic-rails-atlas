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
 * `var(--dc-<light>__<dark>)` where it sits, inside the <style> block or a
 * style attribute, so it keeps its place in the cascade.
 *
 * A presentation attribute such as stroke="#..." cannot hold a variable, and
 * it has the lowest precedence of all: Mermaid's own rules override it (the
 * end-state ring of a state diagram, for example, takes its stroke from a
 * rule, not from its attribute). Moving its color into an inline style would
 * raise it above those rules and change the drawing. Instead the element gets
 * a `data-dc-<property>` attribute and the SVG's style block a rule wrapped in
 * :where(), whose specificity is zero: it beats the attribute, as the
 * attribute's own value did, and loses to every Mermaid rule and inline style,
 * as the attribute did. The attribute keeps the light literal and the rule's
 * var() falls back to it.
 *
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
const ATTR_RE = /(\s)([A-Za-z_:][-\w:.]*)="([^"]*)"/g;
const MASK = '\u0000';
/** Presentation attributes whose CSS property has the same name, so a rule can set it. */
const PRESENTATION = new Set(['fill', 'stroke', 'color', 'stop-color', 'flood-color', 'lighting-color']);

const slug = (color: string): string => color.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Both literals of a pair in one token: the variable name and the data attribute value. */
export function pairSlug(pair: ColorPair): string {
  return `${slug(pair.light)}__${slug(pair.dark)}`;
}

/** The custom property for a pair; its name carries both literals, so equal pairs share one variable. */
export function colorVariable(pair: ColorPair): string {
  return `--dc-${pairSlug(pair)}`;
}

export type NeutralResult = { svg: string; colors: ColorPair[] } | { error: string };

export function neutralizeSvg(light: string, dark: string): NeutralResult {
  if (light.replace(COLOR_RE, MASK) !== dark.replace(COLOR_RE, MASK)) return { error: 'the light and dark renders differ outside their colors' };
  const darkTokens = dark.match(COLOR_RE) ?? [];
  const pairs: ColorPair[] = (light.match(COLOR_RE) ?? []).map((l, i) => ({ light: l, dark: darkTokens[i] ?? l }));
  const used = new Map<string, ColorPair>();
  /** Rules for presentation attributes, keyed by `<property> <pair slug>`. */
  const attrRules = new Map<string, { property: string; pair: ColorPair }>();
  const problems: string[] = [];
  let i = 0;
  /** The next color pair in document order when it differs between the themes (and is then recorded), else undefined. */
  const next = (): ColorPair | undefined => {
    const pair = pairs[i++];
    if (!pair || pair.light === pair.dark) return undefined;
    used.set(colorVariable(pair), pair);
    return pair;
  };

  const rewriteTag = (tag: string): string => {
    const expected = (tag.match(COLOR_RE) ?? []).length;
    if (!expected) return tag;
    let seen = 0;
    const marks = new Map<string, string>();
    const out = tag.replace(ATTR_RE, (_m, space: string, name: string, value: string) => {
      if (!HAS_COLOR.test(value)) return `${space}${name}="${value}"`;
      const rewritten = value.replace(COLOR_RE, (literal) => {
        seen++;
        const pair = next();
        if (!pair) return literal;
        if (name === 'style') return `var(${colorVariable(pair)})`;
        if (!PRESENTATION.has(name)) problems.push(`theme color ${literal} in the ${name} attribute has no CSS property`);
        else if (marks.has(name)) problems.push(`two theme colors in one ${name} attribute`);
        else {
          marks.set(name, pairSlug(pair));
          attrRules.set(`${name} ${pairSlug(pair)}`, { property: name, pair });
        }
        return literal;
      });
      return `${space}${name}="${rewritten}"`;
    });
    if (seen !== expected) problems.push(`${expected - seen} color(s) outside quoted attributes in ${tag.slice(0, 60)}`);
    if (!marks.size) return out;
    const data = [...marks].map(([name, value]) => ` data-dc-${name}="${value}"`).join('');
    return out.replace(/(\s*\/?>)$/, `${data}$1`);
  };

  const out: string[] = [];
  let styleIndex = -1;
  let pos = 0;
  while (pos < light.length) {
    let seg: string;
    if (/^<style[\s>]/.test(light.slice(pos, pos + 7))) {
      const end = light.indexOf('</style>', pos);
      seg = end < 0 ? light.slice(pos) : light.slice(pos, end + '</style>'.length);
      if (styleIndex < 0 && end >= 0) styleIndex = out.length;
      out.push(seg.replace(COLOR_RE, (literal) => {
        const pair = next();
        return pair ? `var(${colorVariable(pair)})` : literal;
      }));
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
  if (attrRules.size) {
    if (styleIndex < 0) problems.push('no <style> block to hold the rules for attribute colors');
    else {
      const id = /^<svg\b[^>]*?\sid="([^"]+)"/.exec(light)?.[1];
      const scope = id ? `#${id} ` : '';
      const rules = [...attrRules.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, { property, pair }]) => `:where(${scope}[data-dc-${property}="${pairSlug(pair)}"]){${property}:var(${colorVariable(pair)},${pair.light});}`)
        .join('');
      out[styleIndex] = out[styleIndex]!.replace(/<\/style>$/, `${rules}</style>`);
    }
  }
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
