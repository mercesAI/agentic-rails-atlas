/**
 * Lint an `ste.mdx` file. The file has frontmatter and a body made of STE
 * component blocks: <SteDescription>, <SteProcedure title="...">, <SteCaution>,
 * <SteNote> and <SteTerms>. Text outside these blocks is not checked.
 */
import {
  DESCRIPTIVE_LIMIT,
  PROCEDURE_LIMIT,
  checkParagraphLength,
  checkSentence,
  isProcedural,
  type BlockType,
  type Flag,
} from './checks';
import { checkApprovedWords } from './approved-words';
import { segmentParagraph, splitParagraphs, type Segment } from './segment';

export const STE_LABEL =
  'Written to the public ASD-STE100 Issue 9 writing rules. Vocabulary not checked against the official dictionary.';

const COMPONENT_TO_BLOCK: Record<string, BlockType> = {
  SteDescription: 'description',
  SteProcedure: 'procedure',
  SteCaution: 'caution',
  SteNote: 'note',
  SteTerms: 'terms',
};

export interface SteUnit {
  /** Text of one paragraph, list item or step. */
  text: string;
  /** True for a numbered step inside a procedure. */
  isStep: boolean;
  /** Writer marked the passive in this unit as "agent unknown". */
  agentUnknown: boolean;
}

export interface SteBlock {
  type: BlockType;
  title?: string;
  units: SteUnit[];
}

export interface ParsedSte {
  frontmatter: Record<string, string>;
  blocks: SteBlock[];
}

export interface SteReport {
  protocol: string;
  sentences: number;
  maxProcedureWords: number;
  maxDescriptiveWords: number;
  flags: Flag[];
  /** True when no flag has the severity "error". */
  passed: boolean;
  /** True when no sentence is over its length limit (the build gate). */
  lengthPassed: boolean;
  counts: { errors: number; warnings: number; reviews: number };
  label: string;
}

function parseFrontmatter(source: string): { frontmatter: Record<string, string>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!m) return { frontmatter: {}, body: source };
  const frontmatter: Record<string, string> = {};
  for (const line of (m[1] ?? '').split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (kv?.[1]) frontmatter[kv[1]] = (kv[2] ?? '').replace(/^["']|["']$/g, '').trim();
  }
  return { frontmatter, body: source.slice(m[0].length) };
}

const AGENT_UNKNOWN = /(?:<!--\s*ste-agent-unknown\s*-->|\{\/\*\s*ste-agent-unknown\s*\*\/\})/;

/** Remove comments, fenced code, import and export lines, and inline tags. */
function cleanInner(inner: string): string {
  return inner
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    .replace(/<!--[\s\S]*?-->/g, (m) => (AGENT_UNKNOWN.test(m) ? ' ste-agent-unknown-marker ' : ''))
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => (AGENT_UNKNOWN.test(m) ? ' ste-agent-unknown-marker ' : ''))
    .replace(/<\/?[A-Za-z][^>]*>/g, '');
}

function makeUnit(text: string, isStep: boolean): SteUnit | null {
  const agentUnknown = text.includes('ste-agent-unknown-marker');
  const clean = text.replace(/ste-agent-unknown-marker/g, '').replace(/\s+/g, ' ').trim();
  if (!/[A-Za-z0-9]/.test(clean)) return null;
  return { text: clean, isStep, agentUnknown };
}

const LIST_ITEM = /^\s*(?:\d+[.)]|[-*+])\s+/;
const ORDERED_ITEM = /^\s*\d+[.)]\s+/;

/** Split block text into units: list items one by one, other text by paragraph. */
function unitsFromText(inner: string, blockType: BlockType): SteUnit[] {
  const units: SteUnit[] = [];
  for (const para of splitParagraphs(inner)) {
    const lines = para.split(/\r?\n/);
    let current: { text: string; isStep: boolean } | null = null;
    const flush = () => {
      if (current) {
        const u = makeUnit(current.text, current.isStep);
        if (u) units.push(u);
      }
      current = null;
    };
    for (const line of lines) {
      if (/^\s*#{1,6}\s/.test(line)) {
        flush();
        continue;
      }
      if (LIST_ITEM.test(line)) {
        flush();
        const isStep = blockType === 'procedure' && ORDERED_ITEM.test(line);
        let text = line.replace(LIST_ITEM, '');
        if (blockType === 'terms') text = termDefinition(text);
        current = { text, isStep };
      } else if (current) {
        current.text += ` ${line.trim()}`;
      } else {
        current = { text: line.trim(), isStep: false };
      }
    }
    flush();
  }
  return units;
}

/** In a terms list, only the definition after "term:" is checked. */
function termDefinition(item: string): string {
  const m = /^\s*(?:\*\*[^*]+\*\*|`[^`]+`|[^:]+?)\s*:\s+(.*)$/.exec(item);
  return m?.[1] ?? item;
}

function stripSignalWord(text: string): string {
  return text.replace(/^\s*(?:\*\*)?(?:CAUTION|NOTE|WARNING)(?:\*\*)?\s*:\s*(?:\*\*)?\s*/, '');
}

export function parseSteMdx(source: string): ParsedSte {
  const { frontmatter, body } = parseFrontmatter(source);
  const blocks: SteBlock[] = [];
  const re = /<(SteDescription|SteProcedure|SteCaution|SteNote|SteTerms)\b([^>]*)>([\s\S]*?)<\/\1>/g;
  for (const m of body.matchAll(re)) {
    const type = COMPONENT_TO_BLOCK[m[1] ?? ''];
    if (!type) continue;
    const attrs = m[2] ?? '';
    const title = /\btitle\s*=\s*"([^"]*)"/.exec(attrs)?.[1] ?? /\btitle\s*=\s*'([^']*)'/.exec(attrs)?.[1];
    let inner = cleanInner(m[3] ?? '');
    if (type === 'caution' || type === 'note') inner = stripSignalWord(inner);
    blocks.push({ type, ...(title !== undefined ? { title } : {}), units: unitsFromText(inner, type) });
  }
  return { frontmatter, blocks };
}

export interface LintOptions {
  /** Approved-word set from `loadApprovedWords()`, or null to skip the check. */
  approved?: ReadonlySet<string> | null;
}

export interface SentenceRecord {
  blockType: BlockType;
  segment: Segment;
}

export function lintParsed(parsed: ParsedSte, protocol: string, options: LintOptions = {}): SteReport {
  const flags: Flag[] = [];
  let sentences = 0;
  let maxProcedureWords = 0;
  let maxDescriptiveWords = 0;
  let lengthPassed = true;

  for (const block of parsed.blocks) {
    for (const unit of block.units) {
      const segs = segmentParagraph(unit.text, !unit.isStep && block.type !== 'procedure');
      flags.push(...checkParagraphLength(segs, block.type));
      for (const seg of segs) {
        sentences++;
        const ctx = { blockType: block.type, isStep: unit.isStep, agentUnknown: unit.agentUnknown };
        if (isProcedural(block.type)) {
          maxProcedureWords = Math.max(maxProcedureWords, seg.words);
          if (seg.words > PROCEDURE_LIMIT) lengthPassed = false;
        } else {
          maxDescriptiveWords = Math.max(maxDescriptiveWords, seg.words);
          if (seg.words > DESCRIPTIVE_LIMIT) lengthPassed = false;
        }
        flags.push(...checkSentence(seg, ctx));
        flags.push(...checkApprovedWords(seg, ctx, options.approved ?? null));
      }
    }
  }

  const counts = {
    errors: flags.filter((f) => f.severity === 'error').length,
    warnings: flags.filter((f) => f.severity === 'warning').length,
    reviews: flags.filter((f) => f.severity === 'review').length,
  };
  return {
    protocol,
    sentences,
    maxProcedureWords,
    maxDescriptiveWords,
    flags,
    passed: counts.errors === 0,
    lengthPassed,
    counts,
    label: STE_LABEL,
  };
}

export function lintSteSource(source: string, protocol: string, options: LintOptions = {}): SteReport {
  return lintParsed(parseSteMdx(source), protocol, options);
}
