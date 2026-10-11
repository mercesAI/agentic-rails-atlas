/**
 * Persona by protocol relevance (pure, unit tested). The level comes from
 * each protocol's personas.json: a main persona card is "high"; a column in
 * the responsibility table with an owns, implements or verifies mark is
 * "medium"; only relies-on or observes marks is "low"; otherwise "none".
 * A protocol without a personas.json yields "unknown". Levels carry text
 * labels so the heatmap never relies on color alone.
 */
export type Relevance = 'high' | 'medium' | 'low' | 'none' | 'unknown';

export const RELEVANCE_LABELS: Record<Relevance, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'None',
  unknown: 'No data yet',
};

export const RELEVANCE_HELP: Record<Relevance, string> = {
  high: 'A main persona on the protocol page',
  medium: 'Owns, implements or verifies a step',
  low: 'Relies on or observes a step',
  none: 'No role found in the protocol page',
  unknown: 'The protocol persona file is not written yet',
};

export interface PersonasLike {
  personas: { persona: string }[];
  responsibilities: { columns: string[]; rows: { step: string; marks: Record<string, string> }[] };
}

const ACTIVE = new Set(['owns', 'implements', 'verifies']);
const PASSIVE = new Set(['relies-on', 'observes']);

export function relevance(personaId: string, file: PersonasLike | null | undefined): Relevance {
  if (!file) return 'unknown';
  if (file.personas.some((p) => p.persona === personaId)) return 'high';
  let passive = false;
  for (const row of file.responsibilities.rows) {
    const mark = row.marks[personaId];
    if (mark && ACTIVE.has(mark)) return 'medium';
    if (mark && PASSIVE.has(mark)) passive = true;
  }
  return passive ? 'low' : 'none';
}

export interface RoleStep {
  step: string;
  mark: string;
}

/** The responsibility rows where this persona has a mark, in table order. */
export function roleSteps(personaId: string, file: PersonasLike | null | undefined): RoleStep[] {
  if (!file) return [];
  return file.responsibilities.rows
    .map((r) => ({ step: r.step, mark: r.marks[personaId] ?? '' }))
    .filter((r) => r.mark !== '');
}

const SCORE: Record<Relevance, number> = { high: 3, medium: 2, low: 1, none: 0, unknown: 0 };

/** Sum of relevance scores across protocols; used to order the heatmap rows and persona cards. */
export function relevanceScore(levels: Relevance[]): number {
  return levels.reduce((s, l) => s + SCORE[l], 0);
}
