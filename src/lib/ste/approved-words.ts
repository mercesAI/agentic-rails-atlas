/**
 * Optional vocabulary check.
 *
 * The project does not ship the ASD-STE100 dictionary. A writer who owns a copy
 * of the standard can make `ste/approved-words.local.txt` (one word per line,
 * gitignored, never committed). When that file exists, the linter flags words
 * that are not on it and not in the technical-noun list. When it does not exist,
 * the check does nothing. This module never creates the file.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import technicalNouns from './technical-nouns.json';
import { isPlaceholder, type Segment } from './segment';
import type { Flag, SentenceContext } from './checks';

export const APPROVED_WORDS_PATH = join('ste', 'approved-words.local.txt');

export function loadApprovedWords(root: string = process.cwd()): Set<string> | null {
  const file = join(root, APPROVED_WORDS_PATH);
  if (!existsSync(file)) return null;
  const words = readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w && !w.startsWith('#'));
  return new Set(words);
}

const TECHNICAL: ReadonlySet<string> = new Set(
  [...technicalNouns.terms, ...technicalNouns.headers, ...technicalNouns.fields]
    .flatMap((t) => t.split(/\s+/))
    .map((t) => t.toLowerCase()),
);

/** Simple lemma candidates: the word, then the word without a common suffix. */
function candidates(word: string): string[] {
  const out = [word];
  if (word.endsWith('ies')) out.push(`${word.slice(0, -3)}y`);
  if (word.endsWith('es')) out.push(word.slice(0, -2));
  if (word.endsWith('s')) out.push(word.slice(0, -1));
  if (word.endsWith('ed')) out.push(word.slice(0, -2), word.slice(0, -1));
  return out;
}

export function checkApprovedWords(
  seg: Segment,
  ctx: SentenceContext,
  approved: ReadonlySet<string> | null,
): Flag[] {
  if (!approved) return [];
  const out: Flag[] = [];
  const seen = new Set<string>();
  for (const raw of seg.protectedText.split(/\s+/)) {
    const word = raw.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
    if (!word || isPlaceholder(word) || /\d/.test(word)) continue;
    const lower = word.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    if (TECHNICAL.has(lower)) continue;
    if (candidates(lower).some((c) => approved.has(c))) continue;
    out.push({
      rule: 'unapproved-word',
      severity: 'warning',
      text: seg.text,
      blockType: ctx.blockType,
      message: `"${word}" is not in the local approved-word list or the technical-noun list.`,
    });
  }
  return out;
}
