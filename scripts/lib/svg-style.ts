/**
 * svg-style.ts. Helpers for two render-time passes over a Mermaid SVG that
 * render-diagrams.ts runs in the browser before it writes a file:
 *
 * - Style pruning. Mermaid writes the whole stylesheet of a diagram type into
 *   every SVG (about 6 KB, 55 to 75 rules), most of which match nothing in a
 *   given drawing. Each inlined SVG adds its block to the page, so every rule
 *   costs style recalculation on reveal. A rule is kept when any selector in
 *   its list matches an element of the rendered SVG (dynamic pseudo-classes
 *   such as :hover are stripped before matching, and a selector the browser
 *   cannot parse is kept); @keyframes are kept when a kept rule names them;
 *   other at-rules are kept.
 * - Paint comparison. The computed style of every element of the written file,
 *   as a page shows it (natural size, ids suffixed, each theme with the color
 *   variables), must equal the computed style of the same element in Mermaid's
 *   own light and dark renders, for the properties in PAINT_PROPS. Anything else is a fold or pruning defect, and
 *   the renderer falls back to a safer output instead of shipping it.
 *
 * The functions passed to page.evaluate (matchSelectors, collectPaint) run in
 * the browser and use nothing from this module's scope.
 */

/** Top-level rules and statements of a CSS text, in order; quotes and nested blocks are respected. */
export function splitCssRules(css: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  let quote: string | null = null;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        out.push(css.slice(start, i + 1));
        start = i + 1;
      }
    } else if (ch === ';' && depth === 0) {
      out.push(css.slice(start, i + 1));
      start = i + 1;
    }
  }
  if (css.slice(start).trim()) out.push(css.slice(start));
  return out.filter((r) => r.trim());
}

/** The selectors of a comma-separated list, splitting only outside parentheses and brackets. */
export function selectorParts(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    const ch = list[i];
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    else if (ch === ',' && depth === 0) {
      out.push(list.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(list.slice(start).trim());
  return out.filter(Boolean);
}

/** Pseudo-classes and pseudo-elements that depend on interaction or generate boxes; matching ignores them. */
const DYNAMIC_PSEUDO = /::?(?:hover|focus-visible|focus-within|focus|active|visited|link|target|checked|before|after|first-line|first-letter|selection|placeholder|marker)\b/g;

/** The selector as matched against the static drawing: dynamic pseudo-classes removed. */
export function matchableSelector(selector: string): string {
  const s = selector.replace(DYNAMIC_PSEUDO, '').trim();
  return s === '' || /[>+~]$/.test(s) ? '*' : s;
}

export interface StylePlan {
  /** Offsets of the first <style> block's content in the SVG text. */
  start: number;
  end: number;
  rules: string[];
  /** For each rule, the selectors the browser must try (any match keeps it); null for at-rules. */
  selectors: (string[] | null)[];
}

/** The rules of the SVG's first <style> block, or null when it has none. */
export function planStyle(svg: string): StylePlan | null {
  const m = /<style\b[^>]*>([\s\S]*?)<\/style>/.exec(svg);
  if (!m) return null;
  const start = m.index + m[0].indexOf('>') + 1;
  const end = start + (m[1] ?? '').length;
  const rules = splitCssRules(m[1] ?? '');
  const selectors = rules.map((r) => {
    const head = r.slice(0, r.indexOf('{') < 0 ? r.length : r.indexOf('{')).trim();
    return head.startsWith('@') ? null : selectorParts(head).map(matchableSelector);
  });
  return { start, end, rules, selectors };
}

/**
 * The SVG with the plan's unmatched rules removed. `matched[i]` is the browser's answer for
 * rule i (ignored for at-rules). Keyframes stay when a kept rule's declarations name them.
 */
export function pruneStyle(svg: string, plan: StylePlan, matched: boolean[]): string {
  const keptPlain = plan.rules.filter((_r, i) => plan.selectors[i] !== null && matched[i] !== false);
  const declarations = keptPlain.map((r) => r.slice(r.indexOf('{'))).join('');
  const kept = plan.rules.filter((r, i) => {
    if (plan.selectors[i] !== null) return matched[i] !== false;
    const name = /^@(?:-webkit-)?keyframes\s+([^\s{]+)/.exec(r.trim())?.[1];
    return name ? new RegExp(`(?:^|[\\s:,])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`).test(declarations) : true;
  });
  return svg.slice(0, plan.start) + kept.join('') + svg.slice(plan.end);
}

/** Browser side: for each rule, whether any of its selectors matches something in the document. */
export function matchSelectors(selectors: (string[] | null)[]): boolean[] {
  return selectors.map((list) => {
    if (!list) return true;
    return list.some((sel) => {
      try {
        return document.querySelector(sel) !== null;
      } catch {
        return true;
      }
    });
  });
}

/** Computed properties compared between Mermaid's renders and the written file. */
export const PAINT_PROPS = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stop-color',
  'flood-color',
  'lighting-color',
  'opacity',
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'text-anchor',
  'dominant-baseline',
  'display',
  'visibility',
  'marker-start',
  'marker-mid',
  'marker-end',
  'filter',
  'paint-order',
  'text-decoration-line',
  'animation-name',
  'cursor',
] as const;

/** Browser side: for the root SVG and each element in it, a label and the computed values of `props`. */
export function collectPaint(props: readonly string[]): string[][] {
  const root = document.querySelector('body > svg');
  if (!root) return [];
  return [root, ...root.querySelectorAll('*')].map((el) => {
    const cs = getComputedStyle(el);
    const cls = el.getAttribute('class');
    return [`${el.tagName}${cls ? `.${cls.trim().split(/\s+/).join('.')}` : ''}`, ...props.map((p) => cs.getPropertyValue(p))];
  });
}

/** Differences between two paint tables (from collectPaint), described for a log line; at most `limit`. */
export function paintDiff(expected: string[][], actual: string[][], props: readonly string[] = PAINT_PROPS, limit = 3): string[] {
  if (expected.length !== actual.length) return [`element count ${expected.length} vs ${actual.length}`];
  const out: string[] = [];
  for (let i = 0; i < expected.length && out.length < limit; i++) {
    const a = expected[i] ?? [];
    const b = actual[i] ?? [];
    for (let p = 0; p < props.length && out.length < limit; p++) {
      if (a[p + 1] !== b[p + 1]) out.push(`${a[0]} ${props[p]}: ${a[p + 1]} became ${b[p + 1]}`);
    }
  }
  return out;
}
