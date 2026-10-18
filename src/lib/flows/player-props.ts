/**
 * Props for <FlowPlayer> (build time). A protocol page renders eight to ten players; each
 * used to carry every step's example payload and the page's whole source-number map. The
 * server renders only the first step, so a player now gets the first step's payload, a
 * content-hashed file with the others (lib/data-file.ts; written by
 * src/pages/data/[file].json.ts for every flow) and the numbers of its own flow's sources.
 */
import type { Flow } from '../schemas';
import { orderSteps } from '../../components/protocol/lib/flow-player';
import { hashedDataFile, type DataFile } from '../data-file';

/** The step the player shows first (index 0 in play order). */
const firstStep = (flow: Flow): number | undefined => orderSteps(flow.steps)[0]?.n;

/** The payloads of every step but the first, keyed by step number; null when there are none. */
export function flowPayloadFile(flow: Flow): DataFile | null {
  const first = firstStep(flow);
  const payloads = Object.fromEntries(flow.steps.filter((s) => s.payload && s.n !== first).map((s) => [String(s.n), s.payload]));
  return Object.keys(payloads).length ? hashedDataFile(`flow-${flow.id}`, payloads) : null;
}

export interface FlowPlayerData {
  flow: Flow;
  /** Steps whose payload is in the payload file instead of `flow`. */
  deferred: number[];
  payloadsUrl: string | null;
  sourceIndex: Record<string, number>;
}

export function flowPlayerProps(flow: Flow, sourceIndex: Record<string, number>): FlowPlayerData {
  const first = firstStep(flow);
  const deferred = flow.steps.filter((s) => s.payload && s.n !== first).map((s) => s.n);
  const steps = flow.steps.map((s) => {
    if (!s.payload || s.n === first) return s;
    const { payload: _deferred, ...rest } = s;
    return rest;
  });
  const numbers = Object.fromEntries(flow.sources.flatMap((id) => (sourceIndex[id] ? [[id, sourceIndex[id]] as const] : [])));
  return { flow: { ...flow, steps }, deferred, payloadsUrl: flowPayloadFile(flow)?.path ?? null, sourceIndex: numbers };
}
