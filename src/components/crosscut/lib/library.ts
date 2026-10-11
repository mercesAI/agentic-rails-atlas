/**
 * Library logic: one item type for resources and publications, filtering,
 * search and the client-side exports (BibTeX, RIS, CSV).
 */
import type { Publication, Resource } from '../../../lib/schemas';

export type LibraryKind = 'resource' | 'publication';

export interface LibraryItem {
  id: string;
  kind: LibraryKind;
  title: string;
  url: string;
  authors: string[];
  publisher: string;
  year: number | null;
  date: string | null;
  /** Resource type, or for publications "peer-reviewed", "preprint" or "grey-literature". */
  type: string;
  badge: string;
  protocols: string[];
  themes: string[];
  grey: boolean;
  note: string;
  venue: string | null;
  doi: string | null;
  arxiv: string | null;
  relation: string | null;
  bibtex: string | null;
}

export const TYPE_LABELS: Record<string, string> = {
  spec: 'Specification',
  repo: 'Repository',
  sdk: 'SDK',
  docs: 'Documentation',
  announcement: 'Announcement',
  standard: 'Standard',
  analysis: 'Analysis',
  talk: 'Talk',
  podcast: 'Podcast',
  tutorial: 'Tutorial',
  tool: 'Tool',
  dataset: 'Dataset',
  community: 'Community',
  'peer-reviewed': 'Peer-reviewed paper',
  preprint: 'Preprint',
  'grey-literature': 'Grey literature',
};

export const BADGE_LABELS: Record<string, string> = {
  official: 'Official',
  partner: 'Partner',
  community: 'Community',
  academic: 'Academic',
};

export function publicationType(p: Pick<Publication, 'relation' | 'peerReviewed'>): string {
  if (p.relation === 'grey') return 'grey-literature';
  return p.peerReviewed ? 'peer-reviewed' : 'preprint';
}

/** Resources de-duplicated by id (protocol lists are unioned), then publications. */
export function buildLibrary(resources: Resource[], publications: Publication[]): LibraryItem[] {
  const byId = new Map<string, LibraryItem>();
  for (const r of resources) {
    const prev = byId.get(r.id);
    if (prev) {
      prev.protocols = [...new Set([...prev.protocols, ...r.protocols])];
      continue;
    }
    byId.set(r.id, {
      id: r.id,
      kind: 'resource',
      title: r.title,
      url: r.url,
      authors: [],
      publisher: r.publisher,
      year: r.date ? Number(r.date.slice(0, 4)) : null,
      date: r.date ?? null,
      type: r.type,
      badge: r.badge,
      protocols: [...r.protocols],
      themes: [],
      grey: false,
      note: r.note,
      venue: null,
      doi: null,
      arxiv: null,
      relation: null,
      bibtex: null,
    });
  }
  const items = [...byId.values()];
  for (const p of publications) {
    items.push({
      id: p.id,
      kind: 'publication',
      title: p.title,
      url: p.url,
      authors: p.authors,
      publisher: p.venue ?? '',
      year: p.year,
      date: null,
      type: publicationType(p),
      badge: 'academic',
      protocols: p.protocols,
      themes: p.themes,
      grey: p.relation === 'grey',
      note: p.summary,
      venue: p.venue ?? null,
      doi: p.doi ?? null,
      arxiv: p.arxiv ?? null,
      relation: p.relation,
      bibtex: p.bibtex,
    });
  }
  return items.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title));
}

export interface LibraryFilter {
  query: string;
  protocol: string;
  type: string;
  theme: string;
  year: string;
  badge: string;
  kind: string;
}

export const EMPTY_FILTER: LibraryFilter = { query: '', protocol: '', type: '', theme: '', year: '', badge: '', kind: '' };

function fold(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

export function matchesQuery(item: LibraryItem, query: string): boolean {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const hay = fold(
    [item.title, item.authors.join(' '), item.publisher, item.note, item.themes.join(' '), item.venue ?? '', item.doi ?? '', item.arxiv ?? '']
      .join(' '),
  );
  return terms.every((t) => hay.includes(t));
}

export function filterLibrary(items: LibraryItem[], f: LibraryFilter): LibraryItem[] {
  return items.filter(
    (i) =>
      (!f.kind || i.kind === f.kind) &&
      (!f.protocol || i.protocols.includes(f.protocol)) &&
      (!f.type || i.type === f.type) &&
      (!f.theme || i.themes.includes(f.theme)) &&
      (!f.year || String(i.year ?? '') === f.year) &&
      (!f.badge || i.badge === f.badge) &&
      matchesQuery(i, f.query),
  );
}

export interface Facets {
  protocols: string[];
  types: string[];
  themes: string[];
  years: string[];
  badges: string[];
}

export function facetsOf(items: LibraryItem[]): Facets {
  const set = (fn: (i: LibraryItem) => string[]) => [...new Set(items.flatMap(fn))].filter(Boolean);
  return {
    protocols: set((i) => i.protocols).sort(),
    types: set((i) => [i.type]).sort((a, b) => (TYPE_LABELS[a] ?? a).localeCompare(TYPE_LABELS[b] ?? b)),
    themes: set((i) => i.themes).sort(),
    years: set((i) => (i.year ? [String(i.year)] : [])).sort((a, b) => Number(b) - Number(a)),
    badges: set((i) => [i.badge]).sort(),
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

function bibEscape(s: string): string {
  return s.replace(/\\/g, '\\textbackslash{}').replace(/([{}%&#_$])/g, '\\$1');
}

function bibKey(id: string): string {
  return id.replace(/^(res|pub)-/, '').replace(/[^A-Za-z0-9:-]/g, '');
}

/** BibTeX: publications use their verified entry as stored; resources become @misc records. */
export function toBibTeX(items: LibraryItem[], accessed?: string): string {
  return items
    .map((i) => {
      if (i.bibtex && i.bibtex.trim()) return i.bibtex.trim();
      const fields: [string, string][] = [['title', `{${bibEscape(i.title)}}`]];
      if (i.authors.length) fields.push(['author', bibEscape(i.authors.join(' and '))]);
      else if (i.publisher) fields.push(['author', `{${bibEscape(i.publisher)}}`]);
      if (i.publisher) fields.push(['organization', bibEscape(i.publisher)]);
      if (i.year) fields.push(['year', String(i.year)]);
      if (i.doi) fields.push(['doi', i.doi]);
      fields.push(['howpublished', `\\url{${i.url}}`]);
      fields.push(['url', i.url]);
      if (accessed) fields.push(['urldate', accessed]);
      if (i.note) fields.push(['note', bibEscape(i.note)]);
      const body = fields.map(([k, v]) => `  ${k} = {${v}}`).join(',\n');
      return `@misc{${bibKey(i.id)},\n${body}\n}`;
    })
    .join('\n\n')
    .concat(items.length ? '\n' : '');
}

function risType(i: LibraryItem): string {
  if (i.kind === 'publication') {
    if (i.type === 'grey-literature') return 'RPRT';
    if (i.venue && /conference|proceedings|symposium|workshop|\bccs\b|neurips|icml|iclr|aies|www\d?/i.test(i.venue)) return 'CPAPER';
    if (i.venue) return 'JOUR';
    return 'UNPB';
  }
  if (i.type === 'dataset') return 'DATA';
  if (i.type === 'standard' || i.type === 'spec') return 'STAND';
  if (i.type === 'talk' || i.type === 'podcast') return 'MULTI';
  if (i.type === 'repo' || i.type === 'sdk' || i.type === 'tool') return 'COMP';
  return 'ELEC';
}

/** RIS: one record per item, tags in the order Zotero and EndNote expect; records end with "ER  - ". */
export function toRIS(items: LibraryItem[], accessed?: string): string {
  const clean = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();
  return items
    .map((i) => {
      const lines: string[] = [`TY  - ${risType(i)}`];
      for (const a of i.authors) lines.push(`AU  - ${clean(a)}`);
      lines.push(`TI  - ${clean(i.title)}`);
      if (i.year) lines.push(`PY  - ${i.year}`);
      if (i.date) lines.push(`DA  - ${i.date.replace(/-/g, '/')}`);
      if (i.venue) lines.push(`T2  - ${clean(i.venue)}`);
      if (i.publisher && i.kind === 'resource') lines.push(`PB  - ${clean(i.publisher)}`);
      if (i.doi) lines.push(`DO  - ${i.doi}`);
      lines.push(`UR  - ${i.url}`);
      if (accessed) lines.push(`Y2  - ${accessed.replace(/-/g, '/')}`);
      for (const t of i.themes) lines.push(`KW  - ${clean(t)}`);
      for (const p of i.protocols) lines.push(`KW  - ${clean(p)}`);
      if (i.note) lines.push(`AB  - ${clean(i.note)}`);
      if (i.grey) lines.push('N1  - Grey literature');
      lines.push(`ID  - ${i.id}`);
      lines.push('ER  - ');
      return lines.join('\r\n');
    })
    .join('\r\n\r\n')
    .concat(items.length ? '\r\n' : '');
}

export const CSV_COLUMNS = [
  'id',
  'kind',
  'title',
  'authors',
  'publisher',
  'year',
  'date',
  'type',
  'badge',
  'grey',
  'protocols',
  'themes',
  'venue',
  'doi',
  'arxiv',
  'url',
] as const;

/** RFC 4180 field; also neutralizes spreadsheet formula prefixes. */
export function csvField(value: string): string {
  let v = value;
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function toCSV(items: LibraryItem[]): string {
  const rows = items.map((i) =>
    [
      i.id,
      i.kind,
      i.title,
      i.authors.join('; '),
      i.publisher,
      i.year ? String(i.year) : '',
      i.date ?? '',
      i.type,
      i.badge,
      i.grey ? 'yes' : 'no',
      i.protocols.join('; '),
      i.themes.join('; '),
      i.venue ?? '',
      i.doi ?? '',
      i.arxiv ?? '',
      i.url,
    ]
      .map(csvField)
      .join(','),
  );
  return [CSV_COLUMNS.join(','), ...rows].join('\r\n') + '\r\n';
}
