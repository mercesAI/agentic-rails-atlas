import { useEffect, useState, type KeyboardEvent } from 'react';
import { THEMES, readTheme, saveTheme, type ThemePref } from '../../lib/theme';

const LABELS: Record<ThemePref, string> = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' };

function Glyph({ theme }: { theme: ThemePref }) {
  const common = { width: 16, height: 16, viewBox: '0 0 16 16', 'aria-hidden': true, focusable: false } as const;
  if (theme === 'light')
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  if (theme === 'dark')
    return (
      <svg {...common}>
        <path d="M12.8 10.2A5.5 5.5 0 0 1 5.8 3.2a5.5 5.5 0 1 0 7 7Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 2.5a5.5 5.5 0 0 1 0 11Z" fill="currentColor" />
    </svg>
  );
}

/** System, light, dark. Sets data-theme on <html> (removed for system) and stores atlas:theme. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePref>('system');

  useEffect(() => {
    setTheme(readTheme());
    const onChange = (e: Event) => setTheme((e as CustomEvent<ThemePref>).detail);
    document.addEventListener('atlas:theme', onChange);
    return () => document.removeEventListener('atlas:theme', onChange);
  }, []);

  const choose = (next: ThemePref) => {
    saveTheme(next);
    setTheme(next);
    document.dispatchEvent(new CustomEvent('atlas:theme', { detail: next }));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = THEMES.indexOf(theme);
    const next = THEMES[(i + (e.key === 'ArrowRight' ? 1 : THEMES.length - 1)) % THEMES.length] ?? 'system';
    choose(next);
    const el = e.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${next}"]`);
    el?.focus();
  };

  return (
    <div className="segmented segmented--icons" role="radiogroup" aria-label="Theme" onKeyDown={onKeyDown}>
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={theme === t}
          tabIndex={theme === t ? 0 : -1}
          data-value={t}
          title={LABELS[t]}
          className="segmented__btn"
          onClick={() => choose(t)}
        >
          <Glyph theme={t} />
          <span className="sr-only">{LABELS[t]}</span>
        </button>
      ))}
    </div>
  );
}
