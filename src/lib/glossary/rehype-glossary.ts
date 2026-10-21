/**
 * Rehype plugin: wraps the first occurrence per section (per h2) of each glossary
 * term or alias in `<button type="button" class="term" data-term="id">`.
 * Reading-mode blocks (<Mode>) are scoped separately: a term annotated inside a
 * hidden ELI5 or spec block does not consume the one annotation the visible
 * practitioner text gets (a term the practitioner text annotated first stays
 * unannotated in a later block). Skips headings, code, links, buttons and existing terms. Reads
 * src/content/glossary/terms.json at build time; a no-op when it is empty.
 * No unist helpers are needed; the walk is a small recursive function.
 *
 * Terms scoped to protocols (for example the Stripe MPP meanings of "session" or
 * "charge") annotate only pages about one of those protocols: a protocol page uses
 * its own slug, a scenario its frontmatter `protocols`, an orbit page the `to` of its
 * frontmatter `relations`; any other page, or a file without a path, gets unscoped
 * terms only. A scoped term flagged `commonWord` (an ordinary word such as "session")
 * is left out on orbit pages, because a relation does not make every use of the word
 * there carry the protocol's meaning. Frontmatter comes from `file.data.astro.frontmatter`, which Astro's MDX
 * pipeline sets on the vfile; when it is missing, the file is read from disk.
 */
import { readFileSync } from 'node:fs';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { buildMatcher, loadGlossaryTerms, type MatchableTerm } from './lookup';

interface VFileLike {
  path?: string;
  history?: string[];
  data?: { astro?: { frontmatter?: Record<string, unknown> } };
}
interface HastText { type: 'text'; value: string }
interface HastParent { type: string; tagName?: string; name?: string | null; properties?: Record<string, unknown>; children?: HastNode[] }
type HastNode = HastText | HastParent;

const SKIP_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'kbd', 'samp', 'a', 'button', 'script', 'style', 'svg', 'math', 'abbr', 'dt', 'figcaption', 'caption', 'th']);
const SKIP_COMPONENTS = /^(Cite|FieldTable|Ste[A-Z]\w*|Callout|MermaidDiagram|FlowPlayer|CodeBlock)$/;
const RESET_TAGS = new Set(['h2', 'section']);

export interface RehypeGlossaryOptions {
  terms?: MatchableTerm[];
  termsPath?: string;
}

function hasTermClass(node: HastParent): boolean {
  const cls = node.properties?.className;
  return Array.isArray(cls) ? cls.includes('term') : cls === 'term';
}

function filePath(file: VFileLike | undefined): string {
  return (file?.path ?? file?.history?.[0] ?? '').replace(/\\/g, '/');
}

/** Slug of the protocol page being compiled (`src/content/protocols/<slug>/...`), if any. */
export function protocolSlugOf(file: VFileLike | undefined): string | undefined {
  return filePath(file).match(/\/content\/protocols\/([^/]+)\//)?.[1];
}

/** Frontmatter of the file: Astro's copy on the vfile, else parsed from disk; {} when neither works. */
function frontmatterOf(file: VFileLike | undefined): Record<string, unknown> {
  const fm = file?.data?.astro?.frontmatter;
  if (fm && typeof fm === 'object') return fm;
  const path = filePath(file).replace(/[?#].*$/, '');
  if (!path) return {};
  try {
    const parsed = parseFrontmatter(readFileSync(path, 'utf8'), { frontmatter: 'empty-with-lines' });
    return parsed.frontmatter && typeof parsed.frontmatter === 'object' ? (parsed.frontmatter as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/**
 * Protocols whose scoped glossary terms may annotate this page: the slug of a
 * protocol page, a scenario's frontmatter `protocols`, the `to` of each orbit
 * relation, and none for any other page.
 */
export function pageProtocolsOf(file: VFileLike | undefined): string[] {
  return pageScopeOf(file).protocols;
}

/** True for an orbit page, whose protocols come from relations rather than from what the page is about. */
function isOrbitPage(file: VFileLike | undefined): boolean {
  return /\/content\/orbit\/[^/]+\.mdx?(?:[?#]|$)/.test(filePath(file));
}

/** The page's protocols, and whether scoped terms flagged `commonWord` may annotate it. */
export function pageScopeOf(file: VFileLike | undefined): { protocols: string[]; commonWords: boolean } {
  const slug = protocolSlugOf(file);
  if (slug) return { protocols: [slug], commonWords: true };
  const path = filePath(file);
  if (/\/content\/scenarios\/[^/]+\.mdx?(?:[?#]|$)/.test(path)) return { protocols: strings(frontmatterOf(file).protocols), commonWords: true };
  if (isOrbitPage(file)) {
    const relations = frontmatterOf(file).relations;
    const protocols = Array.isArray(relations)
      ? relations.flatMap((r) => (r && typeof r === 'object' && typeof (r as { to?: unknown }).to === 'string' ? [(r as { to: string }).to] : []))
      : [];
    return { protocols, commonWords: false };
  }
  return { protocols: [], commonWords: true };
}

export default function rehypeGlossary(options: RehypeGlossaryOptions = {}) {
  const terms = options.terms ?? loadGlossaryTerms(options.termsPath);
  const matchers = new Map<string, ReturnType<typeof buildMatcher>>();
  // A term scoped to other protocols (for example the Stripe MPP intent "charge") must not
  // annotate ordinary words or another protocol's meaning, so it is left out of the matcher
  // of every page that is not about one of its protocols.
  const matcherFor = ({ protocols, commonWords }: { protocols: string[]; commonWords: boolean }) => {
    const allowed = [...new Set(protocols)].sort();
    const key = `${commonWords ? 'c' : 'n'}:${allowed.join(' ')}`;
    if (!matchers.has(key)) {
      const scoped = terms.filter(
        (t) => !t.protocols?.length || (t.protocols.some((p) => allowed.includes(p)) && (commonWords || !t.commonWord)),
      );
      matchers.set(key, buildMatcher(scoped));
    }
    return matchers.get(key) ?? null;
  };

  return (tree: HastParent, file?: VFileLike): void => {
    const matcher = matcherFor(pageScopeOf(file));
    if (!matcher) return;
    let seen = new Set<string>();

    const splitText = (value: string): HastNode[] | null => {
      const out: HastNode[] = [];
      let last = 0;
      matcher.regex.lastIndex = 0;
      for (const m of value.matchAll(matcher.regex)) {
        const text = m[0];
        const id = matcher.idFor(text);
        const start = m.index ?? 0;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        if (start > last) out.push({ type: 'text', value: value.slice(last, start) });
        out.push({
          type: 'element',
          tagName: 'button',
          properties: { type: 'button', className: ['term'], dataTerm: id },
          children: [{ type: 'text', value: text }],
        });
        last = start + text.length;
      }
      if (out.length === 0) return null;
      if (last < value.length) out.push({ type: 'text', value: value.slice(last) });
      return out;
    };

    const walk = (node: HastParent): void => {
      if (!node.children) return;
      const next: HastNode[] = [];
      for (const child of node.children) {
        if (child.type === 'text') {
          const parts = splitText((child as HastText).value);
          if (parts) next.push(...parts);
          else next.push(child);
          continue;
        }
        const el = child as HastParent;
        if (el.type === 'element' && el.tagName && RESET_TAGS.has(el.tagName)) seen = new Set();
        const skip =
          (el.type === 'element' && el.tagName && (SKIP_TAGS.has(el.tagName) || hasTermClass(el))) ||
          ((el.type === 'mdxJsxFlowElement' || el.type === 'mdxJsxTextElement') && el.name && SKIP_COMPONENTS.test(el.name));
        const isModeBlock = el.type === 'mdxJsxFlowElement' && el.name === 'Mode';
        if (!skip && isModeBlock) {
          const outer = seen;
          seen = new Set(outer);
          walk(el);
          seen = outer;
        } else if (!skip) {
          walk(el);
        }
        next.push(child);
      }
      node.children = next;
    };

    walk(tree);
  };
}
