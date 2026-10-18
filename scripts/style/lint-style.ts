/**
 * lint-style.ts (ARCHITECTURE.md §9, ATLAS_PROMPT.md 14.1).
 *   - Fails on U+2014 (em dash) anywhere under src/content/** and in UI strings
 *     (anything outside code comments) under src/components/**, src/layouts/**,
 *     src/pages/** and src/playgrounds/**.
 *   - Fails on banned phrases from scripts/style/banned-phrases.json under
 *     src/content/** (case-insensitive, whole phrase; URLs are ignored).
 *   - Warns on practitioner sentences over 35 words in protocols/<slug>/index.mdx
 *     (text outside <Mode> blocks).
 * Prints file:line for every finding. Exits 1 on any failure.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, isMain, parseArgs, readJson, rel, walkFiles } from '../lib/io.ts';
import { mdxToPlainText, outsideModeBlocks } from '../lib/content.ts';

const EM_DASH = '\u2014';
const MAX_SENTENCE_WORDS = 35;
const CONTENT_EXT = /\.(mdx?|json|ya?ml|txt|mmd)$/i;
const UI_EXT = /\.(astro|tsx?|jsx?|mdx?|html)$/i;

export interface StyleFinding {
  file: string;
  line: number;
  column: number;
  rule: 'em-dash' | 'banned-phrase' | 'long-sentence';
  severity: 'error' | 'warning';
  message: string;
}

const lineCol = (text: string, index: number): { line: number; column: number } => {
  const before = text.slice(0, index);
  const line = (before.match(/\n/g) ?? []).length + 1;
  return { line, column: index - before.lastIndexOf('\n') };
};

/** Replaces comments with spaces (newlines kept) so offsets and lines stay correct. */
export function blankComments(code: string): string {
  const blank = (m: string): string => m.replace(/[^\n]/g, ' ');
  return code
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, p1: string) => p1 + blank(m.slice(p1.length)));
}

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function phraseRegex(phrase: string): RegExp {
  const body = escapeRe(phrase.trim().toLowerCase())
    .replace(/'/g, "['\u2019]")
    .replace(/\s+/g, '\\s+');
  return new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, 'giu');
}

export function lintStyle(root: string = ROOT): StyleFinding[] {
  const findings: StyleFinding[] = [];
  const banned = (readJson<{ phrases: string[] }>(join(root, 'scripts', 'style', 'banned-phrases.json'))?.phrases ?? []).map((p) => ({
    phrase: p,
    re: phraseRegex(p),
  }));

  const emDashes = (file: string, text: string, scan: string): void => {
    let i = scan.indexOf(EM_DASH);
    while (i !== -1) {
      const { line, column } = lineCol(text, i);
      findings.push({ file: rel(root, file), line, column, rule: 'em-dash', severity: 'error', message: 'em dash (U+2014); use a comma, colon, parentheses or a new sentence' });
      i = scan.indexOf(EM_DASH, i + 1);
    }
  };

  for (const file of walkFiles(join(root, 'src', 'content'), (p) => CONTENT_EXT.test(p))) {
    const text = readFileSync(file, 'utf8');
    emDashes(file, text, text);
    // Mask URLs, and in JSON the values of fields that quote third-party wording
    // verbatim (publication and source titles, BibTeX), so their titles are not
    // judged as our prose. Em dashes are still checked everywhere above.
    const masked = text
      .replace(/https?:\/\/[^\s"')\]>]+/g, (m) => ' '.repeat(m.length))
      .replace(/"(title|bibtex)"\s*:\s*"(?:[^"\\]|\\.)*"/g, (m) => (file.endsWith('.json') ? ' '.repeat(m.length) : m));
    for (const { phrase, re } of banned) {
      re.lastIndex = 0;
      for (const m of masked.matchAll(re)) {
        const { line, column } = lineCol(text, m.index ?? 0);
        findings.push({ file: rel(root, file), line, column, rule: 'banned-phrase', severity: 'error', message: `banned phrase "${phrase}"` });
      }
    }
    if (/\/protocols\/[^/]+\/index\.mdx$/.test(file.split('\\').join('/'))) {
      const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---/, (m) => m.replace(/[^\n]/g, ' '));
      // Table rows are cells, not sentences: blank them before the prose conversion (the line count stays the same).
      const plain = mdxToPlainText(outsideModeBlocks(body).replace(/^[ \t]*\|.*$/gm, ''));
      // Sentences: paragraphs are separated by blank lines; sentences end with
      // terminal punctuation followed by whitespace and a capital, digit, quote or parenthesis.
      for (const para of plain.matchAll(/\S[\s\S]*?(?=\n[ \t]*\n|$(?![\s\S]))/g)) {
        const paraStart = para.index ?? 0;
        for (const sentence of para[0].matchAll(/[\s\S]+?(?:[.!?](?=\s+["(A-Z0-9])|$(?![\s\S]))/g)) {
          const text = sentence[0].trim();
          const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
          if (words <= MAX_SENTENCE_WORDS) continue;
          const at = paraStart + (sentence.index ?? 0) + (sentence[0].length - sentence[0].trimStart().length);
          findings.push({
            file: rel(root, file),
            line: lineCol(plain, at).line,
            column: 1,
            rule: 'long-sentence',
            severity: 'warning',
            message: `practitioner sentence of ${words} words (over ${MAX_SENTENCE_WORDS}): "${text.slice(0, 70)}..."`,
          });
        }
      }
    }
  }

  for (const dir of ['components', 'layouts', 'pages', 'playgrounds']) {
    for (const file of walkFiles(join(root, 'src', dir), (p) => UI_EXT.test(p))) {
      const text = readFileSync(file, 'utf8');
      emDashes(file, text, blankComments(text));
    }
  }
  return findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column);
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const findings = lintStyle(args.values.get('root') ?? ROOT);
  for (const f of findings) {
    const out = `${f.file}:${f.line}:${f.column} ${f.severity} ${f.rule}: ${f.message}`;
    if (f.severity === 'error') console.error(out);
    else console.warn(out);
  }
  const errors = findings.filter((f) => f.severity === 'error').length;
  console.log(`lint-style: ${errors} errors, ${findings.length - errors} warnings`);
  process.exit(errors ? 1 : 0);
}
