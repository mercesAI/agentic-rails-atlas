/**
 * Glossary lookup shared by the rehype plugin (build time) and the tooltip
 * endpoint. Reads src/content/glossary/terms.json directly so it also works
 * outside astro:content (MDX compile, scripts). Missing or empty file gives [].
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface TooltipTerm {
  id: string;
  term: string;
  plain: string;
}

export interface MatchableTerm extends TooltipTerm {
  aliases: string[];
}

export const TERMS_PATH = 'src/content/glossary/terms.json';

export function loadGlossaryTerms(path: string = resolve(process.cwd(), TERMS_PATH)): MatchableTerm[] {
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((t): MatchableTerm[] => {
      if (!t || typeof t !== 'object') return [];
      const r = t as Record<string, unknown>;
      if (typeof r.id !== 'string' || typeof r.term !== 'string') return [];
      return [
        {
          id: r.id,
          term: r.term,
          plain: typeof r.plain === 'string' ? r.plain : '',
          aliases: Array.isArray(r.aliases) ? r.aliases.filter((a): a is string => typeof a === 'string') : [],
        },
      ];
    });
  } catch {
    return [];
  }
}

export function toTooltipTerms(terms: MatchableTerm[]): TooltipTerm[] {
  return terms.map(({ id, term, plain }) => ({ id, term, plain }));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface Matcher {
  regex: RegExp;
  idFor: (matched: string) => string | undefined;
}

/**
 * One case-insensitive regex over every term and alias, longest first, with
 * word boundaries that also respect hyphens and dots inside names.
 */
export function buildMatcher(terms: MatchableTerm[]): Matcher | null {
  const byPhrase = new Map<string, { id: string; original: string; strict: boolean }>();
  for (const t of terms) {
    for (const phrase of [t.term, ...t.aliases]) {
      const p = phrase.trim();
      const key = p.toLowerCase();
      // Acronyms and mixed-case names (two or more capitals) match case-sensitively.
      const strict = (p.match(/[A-Z]/g) ?? []).length >= 2;
      if (p.length >= 2 && !byPhrase.has(key)) byPhrase.set(key, { id: t.id, original: p, strict });
    }
  }
  if (byPhrase.size === 0) return null;
  const phrases = [...byPhrase.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp);
  const regex = new RegExp(`(?<![\\w-])(${phrases.join('|')})(?![\\w-])`, 'gi');
  return {
    regex,
    idFor: (m) => {
      const hit = byPhrase.get(m.toLowerCase());
      if (!hit) return undefined;
      return hit.strict && hit.original !== m ? undefined : hit.id;
    },
  };
}
