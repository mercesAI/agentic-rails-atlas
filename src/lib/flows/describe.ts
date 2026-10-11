/**
 * Accessible text descriptions generated from flow and state machine data
 * (ATLAS_PROMPT.md 12.4: every diagram gets a text description from its data).
 * Pure functions, safe in the browser and in build scripts.
 */
import type { Flow, StateMachine } from '../schemas';

type FlowStep = Flow['steps'][number];

const sentence = (s: string): string => {
  const t = s.replace(/\s+/g, ' ').trim();
  if (!t) return t;
  return /[.!?]$/.test(t) ? t : `${t}.`;
};

const listJoin = (items: string[]): string => {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
};

/** One line per step, in order, for an ordered list. */
export function describeFlowSteps(flow: Flow): string[] {
  const label = new Map(flow.actors.map((a) => [a.id, a.label]));
  const name = (id: string): string => label.get(id) ?? id;
  return [...flow.steps]
    .sort((a, b) => a.n - b.n)
    .map((s: FlowStep) => {
      const parts = [`Step ${s.n}: ${name(s.from)} to ${name(s.to)}: ${sentence(s.label)}`];
      if (s.crossesTrustBoundary) parts.push('This step crosses a trust boundary.');
      for (const f of s.failures ?? []) parts.push(`If ${f.condition.replace(/\.$/, '')}: ${sentence(f.outcome)}`);
      return parts.join(' ');
    });
}

/** A paragraph-length description of a sequence flow. */
export function describeFlow(flow: Flow): string {
  const actors = flow.actors.map((a) => a.label);
  const steps = describeFlowSteps(flow);
  const failures = flow.steps.reduce((n, s) => n + (s.failures?.length ?? 0), 0);
  const boundaries = flow.steps.filter((s) => s.crossesTrustBoundary).length;
  const head = [
    `Sequence diagram: ${sentence(flow.title)}`,
    `${actors.length} participants: ${listJoin(actors)}.`,
    `${flow.steps.length} steps${boundaries ? `, ${boundaries} crossing a trust boundary` : ''}${failures ? `, ${failures} failure branch${failures === 1 ? '' : 'es'}` : ''}.`,
    `Based on ${flow.protocol === 'multi' ? 'several protocols' : flow.protocol} ${flow.specVersion} (${flow.specVersionDate}).`,
  ];
  return [...head, ...steps].join(' ');
}

/** One line per transition. */
export function describeStateTransitions(machine: StateMachine): string[] {
  const label = new Map(machine.states.map((s) => [s.id, s.label]));
  const name = (id: string): string => label.get(id) ?? id;
  return machine.transitions.map((t) => {
    const call = t.apiCall ? ` (${t.apiCall})` : '';
    return `From ${name(t.from)} to ${name(t.to)} when ${t.trigger.replace(/\.$/, '')}${call}.`;
  });
}

export function describeStateMachine(machine: StateMachine): string {
  const initial = machine.states.filter((s) => s.initial).map((s) => s.label);
  const terminal = machine.states.filter((s) => s.terminal).map((s) => s.label);
  const head = [
    `State diagram: ${sentence(machine.title)}`,
    `${machine.states.length} states: ${listJoin(machine.states.map((s) => s.label))}.`,
    initial.length ? `Starts in ${listJoin(initial)}.` : '',
    terminal.length ? `Ends in ${listJoin(terminal)}.` : '',
    `${machine.transitions.length} transitions.`,
  ].filter(Boolean);
  return [...head, ...describeStateTransitions(machine)].join(' ');
}
