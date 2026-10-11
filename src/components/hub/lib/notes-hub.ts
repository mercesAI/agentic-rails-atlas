/**
 * Helpers for the global /notes/ page over the shared `atlas:notes` store
 * (format in components/protocol/lib/notes.ts). Pure, unit tested.
 */
import { FLAG_SECTION, splitKey, type NotesStore } from '../../protocol/lib/notes';

export interface ScopeInfo {
  name: string;
  href: string;
}

export interface NoteRow {
  key: string;
  scope: string;
  section: string;
  scopeName: string;
  sectionTitle: string;
  href: string;
  text: string;
  updated: string;
}

export function sectionTitle(section: string, titles: Record<string, string>): string {
  if (section === FLAG_SECTION) return 'Flagged issues';
  return titles[section] ?? section;
}

/** Readable title for a key, used for Markdown export headings. */
export function noteTitle(key: string, scopes: Record<string, ScopeInfo>, titles: Record<string, string>): string {
  const { scope, section } = splitKey(key);
  return `${scopes[scope]?.name ?? scope}: ${sectionTitle(section, titles)}`;
}

export function toRows(store: NotesStore, scopes: Record<string, ScopeInfo>, titles: Record<string, string>): NoteRow[] {
  return Object.entries(store).map(([key, n]) => {
    const { scope, section } = splitKey(key);
    const info = scopes[scope];
    const base = info?.href ?? '';
    return {
      key,
      scope,
      section,
      scopeName: info?.name ?? scope,
      sectionTitle: sectionTitle(section, titles),
      href: base ? (section && section !== FLAG_SECTION ? `${base}#${section}` : base) : '',
      text: n.text,
      updated: n.updated,
    };
  });
}

export type NoteSort = 'updated' | 'scope';

/** Case-insensitive search across scope, section and text; every word must match. */
export function searchRows(rows: NoteRow[], query: string, scope = '', sort: NoteSort = 'updated'): NoteRow[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const out = rows.filter((r) => {
    if (scope && r.scope !== scope) return false;
    const hay = `${r.scopeName} ${r.sectionTitle} ${r.text}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
  return out.sort((a, b) =>
    sort === 'updated'
      ? b.updated.localeCompare(a.updated) || a.key.localeCompare(b.key)
      : a.scopeName.localeCompare(b.scopeName) || a.sectionTitle.localeCompare(b.sectionTitle),
  );
}

/** A short single-line excerpt around the first match (or the start). */
export function excerpt(text: string, query: string, width = 140): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= width) return flat;
  const first = query.toLowerCase().split(/\s+/).find(Boolean);
  const at = first ? flat.toLowerCase().indexOf(first) : -1;
  const start = at > width / 2 ? at - Math.floor(width / 3) : 0;
  const slice = flat.slice(start, start + width);
  return `${start > 0 ? '...' : ''}${slice}${start + width < flat.length ? '...' : ''}`;
}
