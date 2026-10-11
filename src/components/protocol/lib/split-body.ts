/**
 * Splitting the protocol MDX body between section B and section P.
 *
 * Writers end `index.mdx` with a `## Compare and compose` heading followed by
 * a few paragraphs (docs/briefs/WRITER_BRIEF.md). The layout renders the body
 * once, to an HTML string, and splits it at that heading: everything before it
 * goes to section B, everything after it to section P. The heading itself is
 * dropped because section P carries its own lettered heading.
 *
 * Pure functions: no Astro imports, unit tested in tests/unit/islands/split-body.test.ts.
 */

export const COMPARE_MARKER = 'Compare and compose';

/** A top-level h2 whose text contains the marker (rehype-slug and autolink wrappers allowed). */
const HTML_MARKER_RE = /<h2\b[^>]*>(?:(?!<\/h2>)[\s\S])*?Compare and compose(?:(?!<\/h2>)[\s\S])*?<\/h2>/i;
/** The marker line in the MDX source. */
const SOURCE_MARKER_RE = /^##[ \t]+Compare and compose[ \t]*$/im;

export interface SplitResult {
  before: string;
  after: string;
  /** True when the marker was found at a safe (balanced) position. */
  found: boolean;
}

function countTags(html: string, tag: string): number {
  const open = html.match(new RegExp(`<${tag}\\b`, 'gi'))?.length ?? 0;
  const close = html.match(new RegExp(`</${tag}>`, 'gi'))?.length ?? 0;
  return open - close;
}

/** True when every div, section, details and aside opened in `html` is also closed. */
export function isBalanced(html: string): boolean {
  return ['div', 'section', 'details', 'aside', 'table', 'ul', 'ol'].every((t) => countTags(html, t) === 0);
}

/**
 * Splits rendered body HTML at the Compare and compose heading. When the
 * heading is missing, or sits inside an open element (for example a Mode
 * block), the whole body stays in section B and `after` is empty.
 */
export function splitBodyHtml(html: string): SplitResult {
  const m = HTML_MARKER_RE.exec(html);
  if (!m || m.index === undefined) return { before: html, after: '', found: false };
  const before = html.slice(0, m.index);
  const after = html.slice(m.index + m[0].length);
  if (!isBalanced(before)) return { before: html, after: '', found: false };
  return { before, after: after.trim(), found: true };
}

/** Splits the raw MDX body at the marker line (used to number section sources). */
export function splitBodySource(body: string | undefined): SplitResult {
  const text = body ?? '';
  const m = SOURCE_MARKER_RE.exec(text);
  if (!m || m.index === undefined) return { before: text, after: '', found: false };
  return { before: text.slice(0, m.index), after: text.slice(m.index + m[0].length), found: true };
}

/** Removes `<Mode ...>...</Mode>` blocks (not nested) from MDX source. */
export function stripModeBlocks(body: string): string {
  return body.replace(/<Mode\b[^>]*>[\s\S]*?<\/Mode>/g, '');
}

/** Converts one MDX paragraph to plain text: drops JSX tags and Cite markers, unwraps links and emphasis. */
export function mdxParagraphToText(block: string): string {
  return block
    .replace(/<Cite\b[^>]*\/>/g, '')
    .replace(/<\/?[A-Za-z][^>]*>/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(^|[^*\w])[*_]([^*_\n]+)[*_](?=[^*\w]|$)/g, '$1$2')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

/**
 * The first `max` practitioner paragraphs of the body as plain text (outside
 * Mode blocks, not headings, lists, tables, code or components). Used for the
 * Standard English side of the STE side-by-side view in section D.
 */
export function practitionerParagraphs(body: string | undefined, max = 2): string[] {
  if (!body) return [];
  const source = splitBodySource(body).before;
  const cleaned = stripModeBlocks(source)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^import\s.+$/gm, '')
    .replace(/^export\s.+$/gm, '');
  const out: string[] = [];
  for (const raw of cleaned.split(/\n\s*\n/)) {
    const block = raw.trim();
    if (!block) continue;
    if (/^(#|\||[-*+] |\d+\. |>|<(?!Cite\b)[A-Za-z/])/.test(block)) continue;
    const text = mdxParagraphToText(block);
    if (text.split(/\s+/).length < 8) continue;
    out.push(text);
    if (out.length >= max) break;
  }
  return out;
}

const CITE_RE = /<Cite\s+[^>]*?ids\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["'`]([^"'`]*)["'`]\s*\})/g;

/**
 * Ids in `<Cite ids>` markers of an MDX fragment, in order. Same pattern as
 * `scanCiteIds` in src/lib/content.ts, which cannot be imported outside Astro
 * because it pulls in astro:content.
 */
export function citeIdsIn(body: string | undefined): string[] {
  if (!body) return [];
  const out: string[] = [];
  for (const m of body.matchAll(CITE_RE)) out.push(...(m[1] ?? m[2] ?? m[3] ?? '').split(/[\s,]+/).filter(Boolean));
  return out;
}
