/**
 * Segmentation for the STE linter.
 *
 * The protection pass replaces inline code, URLs, header names, field names,
 * identifiers and multi-word technical nouns with opaque placeholder words.
 * A placeholder contains only lowercase letters, so the tokenizer of
 * `compromise` keeps it as one term, and the word counter counts it as one word.
 */
import technicalNouns from './technical-nouns.json';

export interface ProtectedText {
  /** Text with placeholders in place of protected spans. */
  text: string;
  /** Placeholder to original text. */
  map: Map<string, string>;
}

const PLACEHOLDER_PREFIX = 'zq';
const PLACEHOLDER_SUFFIX = 'x';
const PLACEHOLDER_RE = /\bzq[a-w]+x\b/g;

function indexToLetters(index: number): string {
  // Letters a to w only, so the suffix "x" stays unambiguous.
  let n = index;
  let out = '';
  do {
    out = String.fromCharCode(97 + (n % 23)) + out;
    n = Math.floor(n / 23);
  } while (n > 0);
  return out;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Terms that must stay one token: multi-word nouns and identifiers. */
function protectedTerms(): { term: string; caseSensitive: boolean }[] {
  const all = new Set<string>([
    ...technicalNouns.terms,
    ...technicalNouns.headers,
    ...technicalNouns.fields,
  ]);
  const out: { term: string; caseSensitive: boolean }[] = [];
  for (const term of all) {
    const isMultiWord = /\s/.test(term);
    const isIdentifier = /[A-Z0-9\-_.]/.test(term.slice(1)) || /\d/.test(term);
    if (!isMultiWord && !isIdentifier) continue;
    out.push({ term, caseSensitive: /[A-Z]/.test(term) });
  }
  // Longest match first.
  return out.sort((a, b) => b.term.length - a.term.length);
}

const TERMS = protectedTerms();

/** Lowercase single-word technical nouns (used by the -ing allowlist). */
export const SINGLE_WORD_NOUNS: ReadonlySet<string> = new Set(
  technicalNouns.terms.filter((t) => !/\s/.test(t)).map((t) => t.toLowerCase()),
);

/** Ordered protection patterns. Each match becomes one placeholder word. */
const PATTERNS: RegExp[] = [
  // Inline code spans.
  /`[^`\n]+`/g,
  // URLs and emails.
  /\bhttps?:\/\/[^\s<>()]+[^\s<>().,;:!?'"]/g,
  /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g,
  // Latin abbreviations, so the sentence splitter does not break on their periods.
  /\b(?:e\.g\.|i\.e\.|etc\.|vs\.)/gi,
];

/** Identifier patterns applied after the technical-noun list. */
const IDENTIFIER_PATTERNS: RegExp[] = [
  // Dotted identifiers such as payment_requirements.maxAmountRequired or ste.mdx.
  /\b[A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)+\b/g,
  // Header names and hyphenated identifiers: every part starts with a capital or a digit.
  /\b[A-Z0-9][A-Za-z0-9]*(?:-[A-Z0-9][A-Za-z0-9]*)+\b/g,
  // snake_case field names.
  /\b[A-Za-z0-9]+(?:_[A-Za-z0-9]+)+\b/g,
  // camelCase field names (payTo, agentWallet).
  /\b[a-z]+[A-Z][A-Za-z0-9]*\b/g,
  // PascalCase with an inner capital (IntentMandate).
  /\b[A-Z][a-z]+[A-Z][A-Za-z0-9]*\b/g,
  // Mixed letters and digits (x402, Permit2, A2A).
  /\b(?=[A-Za-z0-9]*[A-Za-z])(?=[A-Za-z0-9]*\d)[A-Za-z0-9]+\b/g,
];

/**
 * Replace protected spans with placeholders. Markdown links keep their label.
 * Emphasis markers are removed.
 */
export function protect(input: string): ProtectedText {
  const map = new Map<string, string>();
  let counter = 0;
  const make = (original: string): string => {
    const key = `${PLACEHOLDER_PREFIX}${indexToLetters(counter++)}${PLACEHOLDER_SUFFIX}`;
    map.set(key, original);
    return key;
  };

  let text = input;
  // Inline code first, so that nothing inside a code span is touched.
  text = text.replace(PATTERNS[0]!, (m) => make(m));
  // Markdown links: keep the label, drop the target.
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  for (const re of PATTERNS.slice(1)) text = text.replace(re, (m) => make(m));
  // Emphasis markers.
  text = text.replace(/\*\*|__|(?<![\w])\*(?=\S)|(?<=\S)\*(?![\w])/g, '');

  for (const { term, caseSensitive } of TERMS) {
    const re = new RegExp(
      `(?<![\\w-])${escapeRegExp(term)}(?![\\w-]|\\.[A-Za-z])`,
      caseSensitive ? 'g' : 'gi',
    );
    text = text.replace(re, (m) => make(m));
  }
  for (const re of IDENTIFIER_PATTERNS) {
    text = text.replace(re, (m) => (isPlaceholder(m) ? m : make(m)));
  }
  return { text, map };
}

export function isPlaceholder(word: string): boolean {
  return /^zq[a-w]+x$/.test(word);
}

/** Put the original text back in place of placeholders. */
export function restore(text: string, map: Map<string, string>): string {
  return text.replace(PLACEHOLDER_RE, (m) => map.get(m) ?? m);
}

/** Placeholders found in a text, for the compromise lexicon. */
export function placeholderLexicon(text: string): Record<string, string> {
  const lexicon: Record<string, string> = {};
  for (const m of text.match(PLACEHOLDER_RE) ?? []) lexicon[m] = 'Noun';
  return lexicon;
}

/**
 * Split protected text into sentences. A trailing colon in a list counts as a
 * full stop (reported counting rule 8.4) when `colonEnds` is true.
 */
export function splitSentences(text: string, colonEnds = false): string[] {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (!flat) return [];
  const boundary = colonEnds
    ? /(?<=[.!?:])["')\]]*\s+(?=[A-Z0-9"'(*_]|zq)/
    : /(?<=[.!?])["')\]]*\s+(?=[A-Z0-9"'(*_]|zq)/;
  return flat
    .split(boundary)
    .map((s) => s.trim())
    .filter((s) => /[A-Za-z0-9]/.test(s));
}

const UNITS =
  /\b(\d+(?:[.,]\d+)?)\s+(ms|s|sec|seconds?|minutes?|min|hours?|h|days?|%|percent|bps|KB|MB|GB|bytes?|cents?|USD|EUR|USDC)\b/g;

/**
 * Count words in one protected sentence. A placeholder, a hyphenated word,
 * a parenthetical and a number with a unit each count as one word.
 */
export function countWords(sentence: string): number {
  let s = sentence;
  // A parenthetical counts as one word (reported counting rule 8.5).
  for (let i = 0; i < 3; i++) s = s.replace(/\([^()]*\)/g, 'zqparenx');
  s = s.replace(UNITS, '$1unit');
  return s
    .split(/\s+/)
    .filter((t) => /[A-Za-z0-9]/.test(t)).length;
}

/** Split a block of text into paragraphs (blank-line separated). */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export interface Segment {
  /** Original sentence text (placeholders restored). */
  text: string;
  /** Protected sentence text. */
  protectedText: string;
  words: number;
  map: Map<string, string>;
}

/** Protect a paragraph, then split it into counted sentences. */
export function segmentParagraph(paragraph: string, colonEnds = false): Segment[] {
  const { text, map } = protect(paragraph);
  return splitSentences(text, colonEnds).map((s) => ({
    text: restore(s, map),
    protectedText: s,
    words: countWords(s),
    map,
  }));
}
