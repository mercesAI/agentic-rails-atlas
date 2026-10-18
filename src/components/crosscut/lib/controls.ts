/** Controls map logic: grid lookup and per-control and per-protocol summaries. */
import type { ControlCell } from '../../../lib/schemas';

export type Support = ControlCell['support'];
export const SUPPORT_ORDER: Support[] = ['native', 'partial', 'external', 'none'];

export { SUPPORT_LABELS as SUPPORT_TEXT } from '../../../lib/labels';

export const SUPPORT_HELP: Record<Support, string> = {
  native: 'The protocol specifies the control itself.',
  partial: 'The protocol covers part of the control or makes it optional.',
  external: 'The protocol relies on another layer (a network, PSP, wallet or standard) for the control.',
  none: 'Nothing in the protocol or its named dependencies provides the control.',
};

export const controlKey = (protocol: string, control: string) => `${protocol}::${control}`;

export function indexControlCells(cells: ControlCell[]): Map<string, ControlCell> {
  return new Map(cells.map((c) => [controlKey(c.protocol, c.control), c]));
}

export function supportCounts(cells: ControlCell[]): Record<Support, number> {
  const out: Record<Support, number> = { native: 0, partial: 0, external: 0, none: 0 };
  for (const c of cells) out[c.support] += 1;
  return out;
}

/** Controls where no covered protocol is native: the clearest openings for an independent controls layer. */
export function controlsWithoutNative(cells: ControlCell[], controls: string[]): string[] {
  return controls.filter((id) => {
    const row = cells.filter((c) => c.control === id);
    return row.length > 0 && row.every((c) => c.support !== 'native');
  });
}

export function cellVisible(cell: ControlCell | undefined, supports: Set<Support>): boolean {
  if (supports.size === 0) return true;
  return Boolean(cell && supports.has(cell.support));
}
