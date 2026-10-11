/**
 * Learning path model for /learn/ (pure, unit tested). Five levels:
 * foundations, the four layer families, each protocol, composition
 * scenarios and frontier research. Checklist state lives in `atlas:learn`;
 * quiz gates read the stored results of each protocol's self-test quiz
 * (`atlas:quiz:<slug>`, written by the Quiz island from quiz.json).
 */
export const LEARN_KEY = 'atlas:learn';
/** Correct answers out of 10 needed to pass a protocol quiz gate. */
export const GATE_PASS = 7;

export interface LearnItem {
  id: string;
  label: string;
  href?: string;
  minutes: number;
  note?: string;
}

export interface LearnGate {
  slug: string;
  name: string;
  pass: number;
  total: number;
}

export interface LearnLevel {
  id: string;
  n: number;
  title: string;
  summary: string;
  items: LearnItem[];
  gates: LearnGate[];
  /** Shown when part of the level is not written yet. */
  pending?: string;
}

export interface LearnProgress {
  checked: string[];
  updated?: string;
}

export function normalizeProgress(raw: unknown): LearnProgress {
  if (!raw || typeof raw !== 'object') return { checked: [] };
  const r = raw as { checked?: unknown; updated?: unknown };
  const checked = Array.isArray(r.checked) ? [...new Set(r.checked.filter((x): x is string => typeof x === 'string'))] : [];
  return { checked, updated: typeof r.updated === 'string' ? r.updated : undefined };
}

export function toggleItem(p: LearnProgress, id: string, now: string): LearnProgress {
  const set = new Set(p.checked);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  return { checked: [...set].sort(), updated: now };
}

/** Best score from a stored quiz record (`best`, else `score` when submitted). */
export function quizBest(raw: unknown): number | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as { best?: unknown; score?: unknown; submitted?: unknown };
  if (typeof r.best === 'number') return r.best;
  if (r.submitted === true && typeof r.score === 'number') return r.score;
  return undefined;
}

export const gatePassed = (gate: LearnGate, best: number | undefined): boolean => typeof best === 'number' && best >= gate.pass;

export const levelMinutes = (level: LearnLevel): number =>
  level.items.reduce((s, i) => s + i.minutes, 0) + level.gates.length * 10;

export interface LevelStatus {
  done: number;
  total: number;
  gatesPassed: number;
  gatesTotal: number;
  complete: boolean;
  percent: number;
}

export function levelStatus(level: LearnLevel, progress: LearnProgress, best: Record<string, number | undefined>): LevelStatus {
  const checked = new Set(progress.checked);
  const done = level.items.filter((i) => checked.has(i.id)).length;
  const gatesPassed = level.gates.filter((g) => gatePassed(g, best[g.slug])).length;
  const total = level.items.length;
  const gatesTotal = level.gates.length;
  const units = total + gatesTotal;
  const percent = units === 0 ? 0 : Math.round(((done + gatesPassed) / units) * 100);
  return { done, total, gatesPassed, gatesTotal, complete: units > 0 && done === total && gatesPassed === gatesTotal, percent };
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// ---------------------------------------------------------------------------
// Builder (runs at build time in pages/learn/index.astro)
// ---------------------------------------------------------------------------

export interface LearnInput {
  protocols: { slug: string; name: string; family: string }[];
  families: { id: string; label: string }[];
  quizSlugs: Set<string>;
  openQuestions: { slug: string; count: number; first?: string }[];
  scenarios: { slug: string; title: string }[];
  glossaryIds: Set<string>;
}

export function buildLevels(input: LearnInput): LearnLevel[] {
  const g = (id: string) => (input.glossaryIds.has(id) ? `/glossary/#${id}` : '/glossary/');

  const foundations: LearnLevel = {
    id: 'foundations',
    n: 1,
    title: 'Foundations',
    summary: 'The building blocks every protocol reuses: the HTTP 402 status code, payment tokens, signed requests and mandates.',
    items: [
      { id: 'f-http-402', label: 'HTTP 402 Payment Required and why it sat unused for decades', href: g('http-402'), minutes: 10 },
      { id: 'f-prehistory', label: 'Walk the Prehistory lane of the timeline, from micropayment schemes to Lightning', href: '/timeline/#lane-Prehistory', minutes: 10 },
      { id: 'f-tokens', label: 'Network tokens, vault tokens and cryptograms', href: g('network-token'), minutes: 10 },
      { id: 'f-signatures', label: 'Signed requests and signed data: RFC 9421 and EIP-712', href: g('rfc-9421'), minutes: 15 },
      { id: 'f-mandates', label: 'Mandates, intents and delegated authority', href: g('mandate'), minutes: 10 },
      { id: 'f-hnp', label: 'Human present and human not present', href: g('human-not-present'), minutes: 5 },
    ],
    gates: [],
  };

  const familyItems: LearnItem[] = input.families.map((f) => {
    const members = input.protocols.filter((p) => p.family === f.id).map((p) => p.name);
    return {
      id: `fam-${f.id}`,
      label: `${f.label}${members.length ? `: ${members.join(', ')}` : ''}`,
      href: '/stack/',
      minutes: 15,
    };
  });
  const families: LearnLevel = {
    id: 'families',
    n: 2,
    title: 'The four layer families',
    summary: 'Identity and trust, authorization and intent, checkout and orders, payment execution: what each family does and which protocols sit in it.',
    items: [
      ...familyItems,
      { id: 'fam-compare', label: 'Read the comparison matrix across all eight protocols', href: '/compare/', minutes: 20 },
      { id: 'fam-controls', label: 'See which controls each protocol provides natively', href: '/controls/', minutes: 15 },
    ],
    gates: [],
  };

  const protocolItems: LearnItem[] = [];
  const gates: LearnGate[] = [];
  for (const p of input.protocols) {
    protocolItems.push(
      { id: `p-${p.slug}-read`, label: `${p.name}: read the TL;DR and the detailed explanation`, href: `/p/${p.slug}/#a-tldr`, minutes: 25 },
      { id: `p-${p.slug}-flow`, label: `${p.name}: step through one flow in the diagrams`, href: `/p/${p.slug}/#c-diagrams`, minutes: 10 },
    );
    if (input.quizSlugs.has(p.slug)) gates.push({ slug: p.slug, name: p.name, pass: GATE_PASS, total: 10 });
  }
  const missingQuiz = input.protocols.filter((p) => !input.quizSlugs.has(p.slug)).map((p) => p.name);
  const each: LearnLevel = {
    id: 'protocols',
    n: 3,
    title: 'Each protocol',
    summary: `One stop per protocol. Each gate is the protocol's own ten-question self-test; ${GATE_PASS} of 10 passes.`,
    items: protocolItems,
    gates,
    pending: missingQuiz.length ? `Quiz gates are not written yet for ${missingQuiz.join(', ')}.` : undefined,
  };

  const scenarioItems: LearnItem[] = input.scenarios.map((s) => ({
    id: `s-${s.slug}`,
    label: s.title,
    href: `/scenarios/${s.slug}/`,
    minutes: 20,
  }));
  const composition: LearnLevel = {
    id: 'composition',
    n: 4,
    title: 'Composition scenarios',
    summary: 'End-to-end walkthroughs where several protocols work together, with a legend of which protocol does what.',
    items: [
      ...(scenarioItems.length
        ? scenarioItems
        : [{ id: 's-hub', label: 'Open the scenarios hub and follow one walkthrough end to end', href: '/scenarios/', minutes: 30 }]),
      { id: 's-pick-two', label: 'Pick two protocols on the compare page and read the side-by-side diff', href: '/compare/', minutes: 15 },
    ],
    gates: [],
    pending: scenarioItems.length ? undefined : 'Scenario walkthroughs are being written; the hub lists them as they land.',
  };

  const frontier: LearnLevel = {
    id: 'frontier',
    n: 5,
    title: 'Frontier research',
    summary: 'Open questions from every protocol page and the peer-reviewed and preprint literature.',
    items: [
      ...input.openQuestions
        .filter((o) => o.count > 0)
        .map((o) => {
          const name = input.protocols.find((p) => p.slug === o.slug)?.name ?? o.slug;
          return {
            id: `r-${o.slug}`,
            label: `${name}: ${o.count} open questions`,
            href: `/p/${o.slug}/#r-open-questions`,
            minutes: 10,
            note: o.first,
          };
        }),
      { id: 'r-library', label: 'Browse the publications library by theme', href: '/library/', minutes: 20 },
    ],
    gates: [],
  };

  return [foundations, families, each, composition, frontier];
}
