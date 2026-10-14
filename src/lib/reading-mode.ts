/**
 * Reading mode: eli5, practitioner, spec or ste. Stored in `atlas:reading-mode`
 * and applied as data-reading-mode on <html>; tokens.css does the switching.
 */
import type { ReadingMode } from './schemas';
import { getItem, setItem } from './storage';

/** Mirrors READING_MODES in schemas.ts; kept local so client bundles never pull in zod. */
export const READING_MODES = ['eli5', 'practitioner', 'spec', 'ste'] as const satisfies readonly ReadingMode[];

export const READING_MODE_KEY = 'atlas:reading-mode';
export const DEFAULT_READING_MODE: ReadingMode = 'practitioner';
export const READING_MODE_LABELS: Record<ReadingMode, string> = {
  eli5: 'ELI5',
  practitioner: 'Practitioner',
  spec: 'Spec-deep',
  ste: 'STE',
};

export function isReadingMode(v: unknown): v is ReadingMode {
  return typeof v === 'string' && (READING_MODES as readonly string[]).includes(v);
}

export function readReadingMode(): ReadingMode {
  const v = getItem(READING_MODE_KEY);
  return isReadingMode(v) ? v : DEFAULT_READING_MODE;
}

export function applyReadingMode(mode: ReadingMode, root: HTMLElement = document.documentElement): void {
  root.dataset.readingMode = mode;
}

export function saveReadingMode(mode: ReadingMode): void {
  setItem(READING_MODE_KEY, mode);
  applyReadingMode(mode);
  document.dispatchEvent(new CustomEvent('atlas:reading-mode', { detail: mode }));
  // A user-initiated change (not a cross-tab sync): the toast and live region listen to this one.
  document.dispatchEvent(new CustomEvent('atlas:reading-mode-chosen', { detail: mode }));
}

/** One-line banner text shown above section B; `specCount` is the number of spec-only blocks, counted at build time. */
export function modeBannerText(mode: ReadingMode, specCount: number): string {
  switch (mode) {
    case 'eli5':
      return 'plain-language version only';
    case 'practitioner':
      return 'the full explanation';
    case 'spec':
      return `the full explanation plus ${specCount} field ${specCount === 1 ? 'table or wire example' : 'tables and wire examples'}`;
    case 'ste':
      return 'section B is hidden; the Simplified Technical English version (section D) is shown first';
  }
}

/** Where the toast link goes for a mode: section D for STE, section B otherwise. */
export function modeTarget(mode: ReadingMode): { id: string; letter: 'B' | 'D' } {
  return mode === 'ste' ? { id: 'd-ste', letter: 'D' } : { id: 'b-explanation', letter: 'B' };
}

export function modeToastText(mode: ReadingMode): string {
  return `${READING_MODE_LABELS[mode]} applied to section ${modeTarget(mode).letter}`;
}

/** Cross-tab sync: applies a mode written by another tab. Returns the mode applied, or null when the event is unrelated. */
export function syncFromStorageEvent(e: Pick<StorageEvent, 'key' | 'newValue'>, root: HTMLElement = document.documentElement): ReadingMode | null {
  if (e.key !== READING_MODE_KEY || !isReadingMode(e.newValue)) return null;
  applyReadingMode(e.newValue, root);
  return e.newValue;
}
