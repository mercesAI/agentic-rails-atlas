/**
 * Flow and state machine JSON to Mermaid source (ARCHITECTURE.md §9,
 * ATLAS_PROMPT.md 12.4). Pure functions, no I/O, safe to import in the browser.
 *
 * Every piece of user text goes through `escapeMermaidText`, which replaces
 * the characters that break Mermaid parsing (semicolon, hash, percent, quotes,
 * braces, angle brackets, newlines) with Mermaid entity codes. Identifiers are
 * replaced by generated safe ids, so actor or state ids with hyphens, spaces or
 * reserved words never reach the parser.
 */
import type { Flow, StateMachine } from '../schemas';

type FlowStep = Flow['steps'][number];

const ENTITY: Record<string, string> = {
  ';': '#59;',
  '#': '#35;',
  '%': '#37;',
  '"': '#quot;',
  "'": '#39;',
  '{': '#123;',
  '}': '#125;',
  '<': '#lt;',
  '>': '#gt;',
  '`': '#96;',
  '|': '#124;',
  '[': '#91;',
  ']': '#93;',
};

/**
 * Escapes free text for use after a colon in Mermaid statements, in
 * alt/else labels and in quoted state labels. Newlines and tabs collapse to
 * spaces. Colons are left alone: Mermaid reads everything after the first
 * colon as text. A leading or trailing colon is still escaped to be safe.
 */
export function escapeMermaidText(text: string, options: { colons?: boolean } = {}): string {
  let out = '';
  // Entity codes are decoded by Mermaid, so the '#' inside our own codes must
  // not be escaped twice: map character by character.
  for (const ch of text.replace(/[\r\n\t]+/g, ' ')) out += ENTITY[ch] ?? ch;
  out = out.replace(/\s{2,}/g, ' ').trim();
  // State diagram notes end their text at a colon, so they escape every colon.
  if (options.colons) out = out.replace(/:/g, '#58;');
  if (out.startsWith(':')) out = `#58;${out.slice(1)}`;
  if (out.endsWith(':')) out = `${out.slice(0, -1)}#58;`;
  // Mermaid treats "end" as a keyword in some positions; a lone "end" label is padded.
  if (/^end$/i.test(out)) out = `${out}\u200b`;
  return out || '#32;';
}

/** Accessible title and description lines accept plain text only; keep them single-line and separator-free. */
function accText(text: string): string {
  return text
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[;#%{}<>"`]/g, ' ')
    .replace(/\s+([.,:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Builds stable, collision-free Mermaid identifiers from arbitrary ids. */
export function makeIdFactory(prefix: string): (raw: string) => string {
  const map = new Map<string, string>();
  const used = new Set<string>();
  return (raw: string) => {
    const hit = map.get(raw);
    if (hit) return hit;
    const base = `${prefix}_${raw.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'x'}`;
    let id = base;
    for (let i = 2; used.has(id); i++) id = `${base}_${i}`;
    used.add(id);
    map.set(raw, id);
    return id;
  };
}

const RESPONSE_START = /^(\d{3}\b|return|returns|returned|respond|responds|response|reply|replies)/i;

/**
 * A step is drawn as a response (dashed arrow) when its label starts with a
 * status code or a return or respond verb, or when it answers the previous
 * step: it reverses it (from is the previous step's to, and to is the previous
 * step's from) and the previous step was itself a request.
 */
export function isResponseStep(step: FlowStep, prev?: FlowStep, prevWasResponse = false): boolean {
  if (RESPONSE_START.test(step.label.trim())) return true;
  return !!prev && !prevWasResponse && step.from === prev.to && step.to === prev.from;
}

export interface SequenceOptions {
  /** Emit alt/else blocks for step failures (default true). */
  failures?: boolean;
  /** Emit accTitle and accDescr lines (default true). */
  accessibility?: boolean;
  /** Accessible description; when absent only the title is emitted. */
  description?: string;
}

export function flowToSequenceDiagram(flow: Flow, options: SequenceOptions = {}): string {
  const withFailures = options.failures ?? true;
  const lines: string[] = ['sequenceDiagram'];
  if (options.accessibility ?? true) {
    lines.push(`  accTitle: ${accText(flow.title)}`);
    if (options.description) lines.push(`  accDescr: ${accText(options.description)}`);
  }
  lines.push('  autonumber');
  const pid = makeIdFactory('p');
  const declared = new Set<string>();
  const declare = (actorId: string, label: string): void => {
    if (declared.has(actorId)) return;
    declared.add(actorId);
    lines.push(`  participant ${pid(actorId)} as ${escapeMermaidText(label)}`);
  };
  for (const a of flow.actors) declare(a.id, a.label);
  const steps = [...flow.steps].sort((a, b) => a.n - b.n);
  // Steps may reference an actor that is not declared; declare it with its id as label.
  for (const s of steps) {
    declare(s.from, s.from);
    declare(s.to, s.to);
  }
  let prev: FlowStep | undefined;
  let prevWasResponse = false;
  for (const s of steps) {
    const from = pid(s.from);
    const to = pid(s.to);
    const response = isResponseStep(s, prev, prevWasResponse);
    const arrow = response ? '-->>' : '->>';
    const message = `  ${from}${arrow}${to}: ${escapeMermaidText(s.label)}`;
    const over = from === to ? from : `${from},${to}`;
    const failures = withFailures ? (s.failures ?? []) : [];
    if (failures.length) {
      lines.push('  alt Expected path');
      lines.push(`  ${message}`);
      if (s.crossesTrustBoundary) lines.push(`    Note over ${over}: Crosses a trust boundary`);
      for (const f of failures) {
        lines.push(`  else ${escapeMermaidText(f.condition)}`);
        lines.push(`    Note over ${over}: ${escapeMermaidText(f.outcome)}`);
      }
      lines.push('  end');
    } else {
      lines.push(message);
      if (s.crossesTrustBoundary) lines.push(`  Note over ${over}: Crosses a trust boundary`);
    }
    prev = s;
    prevWasResponse = response;
  }
  return `${lines.join('\n')}\n`;
}

/** Wraps a label at word boundaries once it passes `max` characters; each line is escaped, lines are joined with <br/>. */
export function wrapMermaidLabel(text: string, max = 40, options: { colons?: boolean } = {}): string {
  const words = text.replace(/[\r\n\t]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur && cur.length + 1 + w.length > max) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? `${cur} ${w}` : w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length <= 1) return escapeMermaidText(text, options);
  return lines.map((l) => escapeMermaidText(l, options)).join('<br/>');
}

/** State machines with more states than this read top to bottom, which keeps them narrow. */
export const STATE_TB_THRESHOLD = 6;

export interface StateOptions {
  accessibility?: boolean;
  description?: string;
}

export function stateMachineToStateDiagram(machine: StateMachine, options: StateOptions = {}): string {
  const lines: string[] = ['stateDiagram-v2'];
  if (machine.states.length > STATE_TB_THRESHOLD) lines.push('  direction TB');
  if (options.accessibility ?? true) {
    lines.push(`  accTitle: ${accText(machine.title)}`);
    if (options.description) lines.push(`  accDescr: ${accText(options.description)}`);
  }
  const sid = makeIdFactory('s');
  const known = new Set(machine.states.map((s) => s.id));
  for (const s of machine.states) lines.push(`  state "${wrapMermaidLabel(s.label)}" as ${sid(s.id)}`);
  for (const t of machine.transitions) {
    for (const id of [t.from, t.to]) {
      if (!known.has(id)) {
        known.add(id);
        lines.push(`  state "${escapeMermaidText(id)}" as ${sid(id)}`);
      }
    }
  }
  const initial = machine.states.filter((s) => s.initial);
  const starts = initial.length ? initial : machine.states.slice(0, 1);
  for (const s of starts) lines.push(`  [*] --> ${sid(s.id)}`);
  for (const t of machine.transitions) {
    lines.push(`  ${sid(t.from)} --> ${sid(t.to)} : ${wrapMermaidLabel(t.trigger)}`);
  }
  for (const s of machine.states) if (s.terminal) lines.push(`  ${sid(s.id)} --> [*]`);
  for (const s of machine.states) {
    if (s.note) lines.push(`  note right of ${sid(s.id)} : ${wrapMermaidLabel(s.note, 40, { colons: true })}`);
  }
  return `${lines.join('\n')}\n`;
}
