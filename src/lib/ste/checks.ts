/**
 * STE checks. Each check reads one sentence (or one paragraph) and returns flags.
 *
 * The rule keys are our own. The rules they implement are a paraphrase of the
 * public ASD-STE100 Issue 9 writing rules (research/ste.md Sections 2 and 3).
 */
import nlp from 'compromise';
import technicalNouns from './technical-nouns.json';
import phrasalVerbs from './phrasal-verbs.json';
import { SINGLE_WORD_NOUNS, isPlaceholder, placeholderLexicon, restore, type Segment } from './segment';

export type BlockType = 'description' | 'procedure' | 'caution' | 'note' | 'terms';
export type Severity = 'error' | 'warning' | 'review';

export type RuleKey =
  | 'sentence-length'
  | 'paragraph-length'
  | 'ing-word'
  | 'passive-voice'
  | 'verb-form'
  | 'contraction'
  | 'semicolon'
  | 'em-dash'
  | 'phrasal-verb'
  | 'noun-cluster'
  | 'vague-modal'
  | 'imperative-start'
  | 'latin-abbreviation'
  | 'unapproved-word';

export interface Flag {
  rule: RuleKey;
  severity: Severity;
  /** The sentence (or paragraph excerpt) that caused the flag. */
  text: string;
  blockType: BlockType;
  /** Short explanation for the writer. */
  message: string;
}

export const PROCEDURE_LIMIT = 20;
export const DESCRIPTIVE_LIMIT = 25;
export const PARAGRAPH_LIMIT = 6;

/** Procedure steps and safety commands use the procedural rules. */
export function isProcedural(blockType: BlockType): boolean {
  return blockType === 'procedure' || blockType === 'caution';
}

export function sentenceLimit(blockType: BlockType): number {
  return isProcedural(blockType) ? PROCEDURE_LIMIT : DESCRIPTIVE_LIMIT;
}

interface SentenceContext {
  blockType: BlockType;
  /** True when the sentence is part of a numbered procedure step. */
  isStep: boolean;
  /** The writer marked this sentence: the agent of a passive is unknown. */
  agentUnknown?: boolean;
}

const flag = (
  rule: RuleKey,
  severity: Severity,
  seg: Segment,
  ctx: SentenceContext,
  message: string,
): Flag => ({ rule, severity, text: seg.text, blockType: ctx.blockType, message });

/** Text for the tagger: an all-capitals safety sentence is lowercased first. */
function taggerText(seg: Segment): string {
  const letters = seg.protectedText.replace(/zq[a-w]+x/g, '').replace(/[^A-Za-z]/g, '');
  const upper = letters.replace(/[^A-Z]/g, '').length;
  if (letters.length > 0 && upper / letters.length > 0.7) {
    return seg.protectedText.replace(/\b(?!zq[a-w]+x\b)[A-Za-z]+\b/g, (w) => w.toLowerCase());
  }
  return seg.protectedText;
}

function doc(seg: Segment) {
  const text = taggerText(seg);
  return nlp(text, placeholderLexicon(text));
}

// ---------------------------------------------------------------------------
// Sentence length

export function checkSentenceLength(seg: Segment, ctx: SentenceContext): Flag[] {
  const limit = sentenceLimit(ctx.blockType);
  if (seg.words <= limit) return [];
  return [
    flag(
      'sentence-length',
      'error',
      seg,
      ctx,
      `${seg.words} words. The limit for ${isProcedural(ctx.blockType) ? 'procedural' : 'descriptive'} text is ${limit}.`,
    ),
  ];
}

// ---------------------------------------------------------------------------
// Paragraph length

export function checkParagraphLength(
  sentences: Segment[],
  blockType: BlockType,
): Flag[] {
  if (sentences.length <= PARAGRAPH_LIMIT) return [];
  const first = sentences[0];
  if (!first) return [];
  return [
    {
      rule: 'paragraph-length',
      severity: isProcedural(blockType) ? 'warning' : 'error',
      text: first.text,
      blockType,
      message: `${sentences.length} sentences in one paragraph. The limit is ${PARAGRAPH_LIMIT}.`,
    },
  ];
}

// ---------------------------------------------------------------------------
// -ing words

const ING_EXCEPTIONS: ReadonlySet<string> = new Set(technicalNouns.ingExceptions);

export function checkIngWords(seg: Segment, ctx: SentenceContext): Flag[] {
  const out: Flag[] = [];
  const words = seg.protectedText.match(/\b[A-Za-z][A-Za-z-]{2,}ing\b/g) ?? [];
  for (const word of words) {
    const lower = word.toLowerCase();
    if (isPlaceholder(word)) continue;
    if (ING_EXCEPTIONS.has(lower) || SINGLE_WORD_NOUNS.has(lower)) continue;
    out.push(
      flag(
        'ing-word',
        'error',
        seg,
        ctx,
        `"${word}": use an -ing form only inside a technical noun. Use a simple tense or a noun.`,
      ),
    );
  }
  return out;
}

// ---------------------------------------------------------------------------
// Passive voice and verb forms

/** Past participles that usually describe a state, not an action. */
const STATIVE = new Set([
  'installed', 'connected', 'disconnected', 'enabled', 'disabled', 'locked', 'closed', 'open', 'filled',
  'signed', 'unsigned', 'required', 'supported', 'valid', 'expired', 'revoked', 'encrypted', 'loaded',
  'registered', 'complete', 'completed', 'authorized', 'verified', 'settled', 'pending', 'known', 'unknown',
]);

interface VerbJson {
  text: string;
  verb: { root: string; auxiliary: string; grammar: { form: string } };
}

export function checkVerbs(seg: Segment, ctx: SentenceContext): Flag[] {
  const out: Flag[] = [];
  const d = doc(seg);
  const verbs = d.verbs().json() as VerbJson[];
  const lowered = taggerText(seg).toLowerCase();
  for (const v of verbs) {
    const form = v.verb.grammar.form;
    const root = v.verb.root.replace(/[^a-z]/gi, '').toLowerCase();
    if (form.startsWith('passive')) {
      const hasAgent = new RegExp(`\\b${root}\\s+by\\b`).test(lowered);
      if (STATIVE.has(root) && !hasAgent) continue;
      if (!isProcedural(ctx.blockType) && ctx.agentUnknown) continue;
      out.push(
        flag(
          'passive-voice',
          isProcedural(ctx.blockType) ? 'error' : 'warning',
          seg,
          ctx,
          `"${v.text.trim()}" is passive. Use the active voice and name the agent.`,
        ),
      );
      if (/\b(has|have|had) been\b/.test(v.verb.auxiliary)) {
        out.push(flag('verb-form', 'error', seg, ctx, `"${v.text.trim()}" uses a perfect tense. Use a simple tense.`));
      }
      continue;
    }
    if (/perfect|progressive/.test(form)) {
      out.push(
        flag('verb-form', 'error', seg, ctx, `"${v.text.trim()}" uses a ${form.replace(/-/g, ' ')} form. Use a simple tense.`),
      );
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Contractions, semicolons, em dashes, Latin abbreviations (raw-text checks)

const CONTRACTION_RE = /\b[A-Za-z]+['’](?:t|re|ve|ll|d|m)\b/gi;
const S_CONTRACTION_RE = /\b(?:it|that|there|here|what|who|he|she|let|where|how|this)['’]s\b/gi;

export function checkContractions(seg: Segment, ctx: SentenceContext): Flag[] {
  const found = [
    ...(seg.protectedText.match(CONTRACTION_RE) ?? []),
    ...(seg.protectedText.match(S_CONTRACTION_RE) ?? []),
  ];
  return found.map((c) => flag('contraction', 'error', seg, ctx, `"${c}" is a contraction. Write the full words.`));
}

export function checkSemicolons(seg: Segment, ctx: SentenceContext): Flag[] {
  return seg.protectedText.includes(';')
    ? [flag('semicolon', 'error', seg, ctx, 'Do not use a semicolon. Write two sentences.')]
    : [];
}

export function checkEmDash(seg: Segment, ctx: SentenceContext): Flag[] {
  return /—/.test(seg.protectedText)
    ? [flag('em-dash', 'error', seg, ctx, 'Do not use an em dash (house rule). Write two sentences or use a comma.')]
    : [];
}

export function checkLatinAbbreviations(seg: Segment, ctx: SentenceContext): Flag[] {
  const raw = restore(seg.protectedText, seg.map);
  return /\b(?:e\.g\.|i\.e\.|etc\.|vs\.)/i.test(raw)
    ? [flag('latin-abbreviation', 'warning', seg, ctx, 'Use "for example", "that is" or a full list.')]
    : [];
}

// ---------------------------------------------------------------------------
// Phrasal verbs

const PHRASAL = phrasalVerbs.entries.map((e) => ({
  adjacent: new RegExp(`\\b(?:${e.forms.join('|')})\\s+${e.particle}\\b`, 'i'),
  label: `${e.forms[0]} ${e.particle}`,
  use: e.use,
}));

export function checkPhrasalVerbs(seg: Segment, ctx: SentenceContext): Flag[] {
  const text = taggerText(seg);
  const out: Flag[] = [];
  for (const p of PHRASAL) {
    if (p.adjacent.test(text)) {
      out.push(flag('phrasal-verb', 'warning', seg, ctx, `"${p.label}" is a phrasal verb. Use "${p.use}".`));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Noun clusters

interface TermJson {
  text: string;
  post: string;
  pre: string;
  tags: string[];
}

const NOT_CLUSTER = ['Pronoun', 'Possessive', 'Value', 'Determiner', 'Url', 'Verb', 'Adjective', 'Preposition'];

export function checkNounClusters(seg: Segment, ctx: SentenceContext): Flag[] {
  const d = doc(seg);
  const sentences = d.json() as { terms: TermJson[] }[];
  const out: Flag[] = [];
  for (const s of sentences) {
    let run: string[] = [];
    const close = () => {
      if (run.length > 3) {
        out.push(
          flag(
            'noun-cluster',
            'warning',
            seg,
            ctx,
            `"${restore(run.join(' '), seg.map)}" has ${run.length} nouns in a row. Use a preposition or define a shorter technical noun.`,
          ),
        );
      }
      run = [];
    };
    for (const t of s.terms) {
      const isNoun = t.tags.includes('Noun') && !t.tags.some((tag) => NOT_CLUSTER.includes(tag));
      if (isNoun && !/[(]/.test(t.pre)) {
        run.push(t.text);
        if (/[,.;:!?)]/.test(t.post)) close();
      } else {
        close();
      }
    }
    close();
  }
  return out;
}

// ---------------------------------------------------------------------------
// Vague modals

export function checkVagueModals(seg: Segment, ctx: SentenceContext): Flag[] {
  const found = taggerText(seg).match(/\b(?:should|would|may|might|could)\b/gi) ?? [];
  return found.map((m) =>
    flag('vague-modal', 'review', seg, ctx, `"${m}": state the condition or the requirement.`),
  );
}

// ---------------------------------------------------------------------------
// Imperative start for procedure steps

/** Lead verbs that the tagger sometimes misses at the start of a step. */
const LEAD_VERBS = new Set([
  'add', 'accept', 'apply', 'ask', 'attach', 'build', 'calculate', 'call', 'cancel', 'check', 'choose', 'compare',
  'compute', 'configure', 'confirm', 'connect', 'copy', 'create', 'decode', 'decrypt', 'delete', 'disconnect',
  'download', 'encode', 'encrypt', 'examine', 'find', 'get', 'give', 'hash', 'identify', 'include', 'install',
  'keep', 'let', 'load', 'look', 'make', 'measure', 'monitor', 'move', 'open', 'parse', 'put', 'read', 'record',
  'refuse', 'register', 'reject', 'remove', 'replace', 'request', 'retry', 'return', 'revoke', 'rotate', 'run',
  'select', 'send', 'set', 'show', 'sign', 'start', 'stop', 'store', 'submit', 'tell', 'test', 'turn', 'update',
  'use', 'validate', 'verify', 'wait', 'write',
]);

const CONDITION_START = /^(?:if|when|before|after|unless|while|until|as soon as|for each)\b/i;

/** Remove a leading condition clause ("If X, ") from a lowercased sentence. */
function stripCondition(text: string): string {
  let t = text.trim();
  for (let i = 0; i < 2 && CONDITION_START.test(t); i++) {
    const comma = t.indexOf(',');
    if (comma < 0) return t;
    t = t.slice(comma + 1).trim();
  }
  return t;
}

export function startsWithImperative(sentence: string): boolean {
  const rest = stripCondition(sentence).replace(/^["'(*_\s]+/, '');
  if (/^do not\b/i.test(rest) || /^never\b/i.test(rest)) return true;
  const first = rest.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '') ?? '';
  if (!first || isPlaceholder(first)) return false;
  if (LEAD_VERBS.has(first)) return true;
  const d = nlp(rest, placeholderLexicon(rest));
  const term = (d.json() as { terms: TermJson[] }[])[0]?.terms[0];
  if (!term) return false;
  return term.tags.includes('Imperative') || (term.tags.includes('Infinitive') && !term.tags.includes('Modal'));
}

export function checkImperativeStart(seg: Segment, ctx: SentenceContext): Flag[] {
  if (ctx.blockType !== 'procedure' || !ctx.isStep) return [];
  if (startsWithImperative(taggerText(seg))) return [];
  return [
    flag(
      'imperative-start',
      'error',
      seg,
      ctx,
      'Start the instruction with a verb in the imperative. Put a condition first and end it with a comma.',
    ),
  ];
}

// ---------------------------------------------------------------------------

export type SentenceCheck = (seg: Segment, ctx: SentenceContext) => Flag[];

export const SENTENCE_CHECKS: SentenceCheck[] = [
  checkSentenceLength,
  checkIngWords,
  checkVerbs,
  checkContractions,
  checkSemicolons,
  checkEmDash,
  checkLatinAbbreviations,
  checkPhrasalVerbs,
  checkNounClusters,
  checkVagueModals,
  checkImperativeStart,
];

export function checkSentence(seg: Segment, ctx: SentenceContext): Flag[] {
  return SENTENCE_CHECKS.flatMap((check) => check(seg, ctx));
}

export type { SentenceContext };
