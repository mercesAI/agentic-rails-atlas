/** Compare matrix logic: grouping, filtering and the pick-two diff. */
import type {CompareCell, ProtocolSlug} from '../../../lib/schemas';

export interface Dimension {
  id: string;
  label: string;
  group?: string;
}

/** Dimension groups for filtering (compare.json has no groups yet; a `group` field on a dimension wins). */
export const DIMENSION_GROUPS: { id: string; label: string; dims: string[] }[] = [
  {
    id: 'overview',
    label: 'Overview and governance',
    dims: [
      'primary-job',
      'layers-covered',
      'stewards',
      'governance-model',
      'license-spec-and-code',
      'first-announced',
      'latest-version-and-date',
      'maturity',
    ],
  },
  {
    id: 'mechanics',
    label: 'Mechanics',
    dims: [
      'transports',
      'settlement-rails',
      'agent-identity-model',
      'user-authorization-model',
      'human-present-and-human-not-present-support',
      'merchant-of-record',
      'credential-type',
      'cryptography',
      'discovery-mechanism',
    ],
  },
  {
    id: 'controls',
    label: 'Controls and risk',
    dims: [
      'replay-protection',
      'native-spending-controls',
      'revocation',
      'refunds-and-disputes',
      'privacy-exposure',
      'published-security-research',
    ],
  },
  {
    id: 'openness',
    label: 'Openness and ecosystem',
    dims: [
      'permissionless-or-registration-required',
      'decentralization',
      'builds-on-standards',
      'composes-with',
      'reference-implementations-and-sdks',
    ],
  },
  {
    id: 'economics',
    label: 'Economics and adoption',
    dims: ['fees-and-who-pays-them', 'who-pays', 'adoption-evidence', 'observability-score'],
  },
  { id: 'outlook', label: 'Policy and outlook', dims: ['regulatory-touchpoints', 'biggest-open-question'] },
];

export const OTHER_GROUP = { id: 'other', label: 'Other' };

export function groupOf(dim: Dimension): { id: string; label: string } {
  if (dim.group) {
    const known = DIMENSION_GROUPS.find((g) => g.id === dim.group || g.label === dim.group);
    return known ? { id: known.id, label: known.label } : { id: dim.group, label: dim.group };
  }
  const g = DIMENSION_GROUPS.find((x) => x.dims.includes(dim.id));
  return g ? { id: g.id, label: g.label } : OTHER_GROUP;
}

/** Groups present in the dimension list, in display order. */
export function groupsFor(dims: Dimension[]): { id: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const d of dims) {
    const g = groupOf(d);
    if (!seen.has(g.id)) seen.set(g.id, g.label);
  }
  const order = [...DIMENSION_GROUPS.map((g) => g.id), OTHER_GROUP.id];
  return [...seen.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
}

export type CellIndex = Map<string, CompareCell>;

export const cellKey = (protocol: string, dimension: string) => `${protocol}::${dimension}`;

export function indexCells(cells: CompareCell[]): CellIndex {
  const m: CellIndex = new Map();
  for (const c of cells) m.set(cellKey(c.protocol, c.dimension), c);
  return m;
}

/** Protocols that have at least one compare cell. */
export function protocolsWithCells(cells: CompareCell[]): Set<ProtocolSlug> {
  return new Set(cells.map((c) => c.protocol));
}

export interface MatrixFilter {
  groups: Set<string>;
  protocols: Set<string>;
  query: string;
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9%$.]+/g, ' ')
    .trim();
}

/** Dimensions that pass the group filter and, if a query is set, match it in the label or any visible cell. */
export function filterDimensions(dims: Dimension[], cells: CellIndex, f: MatrixFilter): Dimension[] {
  const q = normalize(f.query);
  return dims.filter((d) => {
    if (f.groups.size > 0 && !f.groups.has(groupOf(d).id)) return false;
    if (!q) return true;
    if (normalize(d.label).includes(q)) return true;
    for (const p of f.protocols) {
      const c = cells.get(cellKey(p, d.id));
      if (c && normalize(`${c.value} ${c.detail ?? ''}`).includes(q)) return true;
    }
    return false;
  });
}

export type DiffStatus = 'same' | 'different' | 'missing';

export interface DiffRow {
  dimension: Dimension;
  a: CompareCell | null;
  b: CompareCell | null;
  status: DiffStatus;
}

/** Side-by-side diff of two protocols; a row is "missing" when either side has no cell. */
export function diffProtocols(dims: Dimension[], cells: CellIndex, a: string, b: string): DiffRow[] {
  return dims.map((dimension) => {
    const ca = cells.get(cellKey(a, dimension.id)) ?? null;
    const cb = cells.get(cellKey(b, dimension.id)) ?? null;
    let status: DiffStatus;
    if (!ca || !cb) status = 'missing';
    else status = normalize(ca.value) === normalize(cb.value) ? 'same' : 'different';
    return { dimension, a: ca, b: cb, status };
  });
}

export function diffSummary(rows: DiffRow[]): Record<DiffStatus, number> {
  const out: Record<DiffStatus, number> = { same: 0, different: 0, missing: 0 };
  for (const r of rows) out[r.status] += 1;
  return out;
}
