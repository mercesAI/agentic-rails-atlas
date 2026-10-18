/**
 * Notes store (`atlas:notes`): one JSON object keyed by `<slug>/<sectionId>`
 * (ARCHITECTURE.md Section 6). Values are `{ text, updated }`; plain strings
 * from older or hand-made stores are accepted on read. Export and import in
 * JSON and Markdown. Pure functions, unit tested.
 */

export const NOTES_KEY = 'atlas:notes';
/** DOM event fired after the store changes (detail: { key }). */
export const NOTES_EVENT = 'atlas:notes';
/** Section key used for "flag an issue" notes. */
export const FLAG_SECTION = 'flags';
/** Storage key of the read-progress array for one protocol page. */
export const readKey = (slug: string): string => `atlas:read:${slug}`;

export interface Note {
  text: string;
  /** ISO timestamp of the last edit. */
  updated: string;
}
export type NotesStore = Record<string, Note>;

export const noteKey = (scope: string, section: string): string => `${scope}/${section}`;

export function splitKey(key: string): { scope: string; section: string } {
  const i = key.indexOf('/');
  return i === -1 ? { scope: key, section: '' } : { scope: key.slice(0, i), section: key.slice(i + 1) };
}

const KEY_RE = /^[a-z0-9-]+\/[a-z0-9-]+$/;

/** Accepts `{key: {text, updated}}` or `{key: "text"}`; drops anything else and empty notes. */
export function normalizeStore(raw: unknown): NotesStore {
  const out: NotesStore = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!KEY_RE.test(k)) continue;
    if (typeof v === 'string') {
      if (v.trim()) out[k] = { text: v, updated: '' };
    } else if (v && typeof v === 'object' && typeof (v as Note).text === 'string') {
      const n = v as Note;
      if (n.text.trim()) out[k] = { text: n.text, updated: typeof n.updated === 'string' ? n.updated : '' };
    }
  }
  return out;
}

/** Returns a new store with the note set, or removed when the text is blank. */
export function setNote(store: NotesStore, key: string, text: string, now: string): NotesStore {
  const next = { ...store };
  if (text.trim()) next[key] = { text, updated: now };
  else delete next[key];
  return next;
}

export function notesForScope(store: NotesStore, scope: string): NotesStore {
  return Object.fromEntries(Object.entries(store).filter(([k]) => splitKey(k).scope === scope));
}

/** Later `updated` wins; an incoming note with no timestamp only fills gaps. */
export function mergeStores(base: NotesStore, incoming: NotesStore): NotesStore {
  const out = { ...base };
  for (const [k, v] of Object.entries(incoming)) {
    const cur = out[k];
    if (!cur || (v.updated && (!cur.updated || v.updated >= cur.updated))) out[k] = v;
  }
  return out;
}

export interface NotesExport {
  format: 'atlas-notes';
  version: 1;
  exportedAt: string;
  notes: NotesStore;
}

export function exportJSON(store: NotesStore, now: string): string {
  const payload: NotesExport = { format: 'atlas-notes', version: 1, exportedAt: now, notes: store };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

/** Accepts our export envelope or a bare store object. Throws on invalid JSON. */
export function importJSON(text: string): NotesStore {
  const parsed: unknown = JSON.parse(text);
  if (parsed && typeof parsed === 'object' && 'notes' in parsed) return normalizeStore((parsed as NotesExport).notes);
  return normalizeStore(parsed);
}

/**
 * Markdown export. Each note is a level-2 heading with a readable title, an
 * HTML comment carrying the exact key and timestamp (so import round-trips),
 * and the note body.
 */
export function exportMarkdown(store: NotesStore, now: string, titleFor: (key: string) => string = (k) => k): string {
  const keys = Object.keys(store).sort();
  const parts = [`# Notes`, '', `Exported ${now.slice(0, 10)} from the Agentic Rails Atlas.`, ''];
  for (const k of keys) {
    const n = store[k];
    if (!n) continue;
    parts.push(`## ${titleFor(k)}`, '', `<!-- atlas-note key="${k}" updated="${n.updated}" -->`, '', n.text.trim(), '');
  }
  return parts.join('\n');
}

const MD_NOTE_RE = /<!--\s*atlas-note\s+key="([^"]+)"(?:\s+updated="([^"]*)")?\s*-->/g;

/** Parses a Markdown export. Text between one marker and the next level-2 heading (or marker) is the note. */
export function importMarkdown(text: string): NotesStore {
  const out: NotesStore = {};
  const matches = [...text.matchAll(MD_NOTE_RE)];
  matches.forEach((m, i) => {
    const key = m[1] ?? '';
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? (matches[i + 1]?.index ?? text.length) : text.length;
    let body = text.slice(start, end);
    const nextHeading = body.search(/^## /m);
    if (nextHeading !== -1) body = body.slice(0, nextHeading);
    const note = body.trim();
    if (KEY_RE.test(key) && note) out[key] = { text: note, updated: m[2] ?? '' };
  });
  return out;
}

/** Prefilled text for the footer "flag an issue" button. */
export function flagTemplate(opts: { slug: string; name: string; url: string; section?: string; date: string }): string {
  return [
    `Issue flagged on ${opts.date} for ${opts.name}${opts.section ? ` (section ${opts.section})` : ''}.`,
    `Page: ${opts.url}`,
    '',
    'What looks wrong:',
    '',
    'Source or evidence:',
  ].join('\n');
}

/** Appends a flag note under `<slug>/flags`, keeping earlier flags. */
export function appendFlag(store: NotesStore, slug: string, text: string, now: string): NotesStore {
  const key = noteKey(slug, FLAG_SECTION);
  const prev = store[key]?.text.trim();
  return setNote(store, key, prev ? `${prev}\n\n---\n\n${text}` : text, now);
}
