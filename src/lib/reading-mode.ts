/**
 * Reading mode: eli5, practitioner, spec or ste. Stored in `atlas:reading-mode`
 * and applied as data-reading-mode on <html>; tokens.css does the switching.
 */
import { READING_MODES, type ReadingMode } from './schemas';
import { getItem, setItem } from './storage';

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
}
