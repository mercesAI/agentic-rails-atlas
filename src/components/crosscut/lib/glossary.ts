/** Glossary page logic: full terms versus stubs, sorting, filtering and letter index. */
import type { GlossaryTerm } from '../../../lib/schemas';

export interface GlossaryStub {
  id: string;
  term: string;
  aliases: string[];
  protocols: string[];
}

/** A term is full when it has a plain definition, an STE definition and at least one source. */
export function isFullTerm(t: Partial<GlossaryTerm>): t is GlossaryTerm {
  return Boolean(t.plain?.trim() && t.ste?.trim() && t.sources && t.sources.length > 0);
}

export function sortTerms<T extends { term: string }>(terms: T[]): T[] {
  return [...terms].sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base', numeric: true }));
}

/** Stubs that are not already written as full terms (by id or by term name). */
export function openStubs(stubs: GlossaryStub[], full: GlossaryTerm[]): GlossaryStub[] {
  const ids = new Set(full.map((t) => t.id));
  const names = new Set(full.map((t) => t.term.toLowerCase()));
  return sortTerms(stubs.filter((s) => !ids.has(s.id) && !names.has(s.term.toLowerCase())));
}

/** First letter bucket: A to Z, or "#" for digits and symbols. */
export function letterOf(term: string): string {
  const c = term.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : '#';
}

export function termMatches(t: Pick<GlossaryTerm, 'term' | 'aliases' | 'plain' | 'protocols'>, query: string, protocol: string): boolean {
  if (protocol && !t.protocols.includes(protocol)) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [t.term, ...t.aliases, t.plain].some((s) => s.toLowerCase().includes(q));
}

/** Text the client-side filter searches (lowercased, stored in a data attribute). */
export function searchText(t: Pick<GlossaryTerm, 'term' | 'aliases' | 'plain'>): string {
  return [t.term, ...t.aliases, t.plain].join(' ').toLowerCase();
}
