/**
 * Theme preference: system, light or dark. `system` removes data-theme so the
 * CSS media query in tokens.css decides. Stored in `atlas:theme`.
 */
import { getItem, setItem } from './storage';

export const THEMES = ['system', 'light', 'dark'] as const;
export type ThemePref = (typeof THEMES)[number];
export const THEME_KEY = 'atlas:theme';

export function isThemePref(v: unknown): v is ThemePref {
  return typeof v === 'string' && (THEMES as readonly string[]).includes(v);
}

export function readTheme(): ThemePref {
  const v = getItem(THEME_KEY);
  return isThemePref(v) ? v : 'system';
}

export function applyTheme(pref: ThemePref, root: HTMLElement = document.documentElement): void {
  if (pref === 'system') delete root.dataset.theme;
  else root.dataset.theme = pref;
}

export function saveTheme(pref: ThemePref): void {
  setItem(THEME_KEY, pref);
  applyTheme(pref);
}
