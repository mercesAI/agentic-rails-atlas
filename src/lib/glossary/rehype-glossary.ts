/**
 * Rehype plugin: wraps the first occurrence per section (per h2) of each glossary
 * term or alias in `<button type="button" class="term" data-term="id">`.
 * Skips headings, code, links, buttons and existing terms. Reads
 * src/content/glossary/terms.json at build time; a no-op when it is empty.
 * No unist helpers are needed; the walk is a small recursive function.
 */
import { buildMatcher, loadGlossaryTerms, type MatchableTerm } from './lookup';

interface VFileLike { path?: string; history?: string[] }
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

/** Slug of the protocol page being compiled (`src/content/protocols/<slug>/...`), if any. */
export function protocolSlugOf(file: VFileLike | undefined): string | undefined {
  const path = file?.path ?? file?.history?.[0] ?? '';
  return path.replace(/\\/g, '/').match(/\/content\/protocols\/([^/]+)\//)?.[1];
}

export default function rehypeGlossary(options: RehypeGlossaryOptions = {}) {
  const terms = options.terms ?? loadGlossaryTerms(options.termsPath);
  const matchers = new Map<string, ReturnType<typeof buildMatcher>>();
  // On a protocol page, a term scoped to other protocols (for example the Stripe MPP
  // intent "charge") must not annotate ordinary words, so it is left out of that page's matcher.
  const matcherFor = (slug: string | undefined) => {
    const key = slug ?? '';
    if (!matchers.has(key)) {
      const scoped = slug ? terms.filter((t) => !t.protocols?.length || t.protocols.includes(slug)) : terms;
      matchers.set(key, buildMatcher(scoped));
    }
    return matchers.get(key) ?? null;
  };

  return (tree: HastParent, file?: VFileLike): void => {
    const matcher = matcherFor(protocolSlugOf(file));
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
        if (!skip) walk(el);
        next.push(child);
      }
      node.children = next;
    };

    walk(tree);
  };
}
