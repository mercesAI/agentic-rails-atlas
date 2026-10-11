/**
 * Build-time helpers that turn content collections into universe props.
 * Pure functions (no astro:content imports) so they are unit-testable.
 */
import type { ProtocolMeta } from '../../../lib/schemas';
import type { PersonaMap, Relevance, UniverseOrbit, UniverseProtocol, UniverseRelation } from './types';
import type { OrbitSeed } from '../data/orbit-items';

export function toUniverseProtocol(m: ProtocolMeta): UniverseProtocol {
  return {
    slug: m.slug,
    order: m.order,
    name: m.name,
    bubbleLabel: m.bubbleLabel,
    monogram: m.monogram,
    tagline: m.tagline,
    intro: m.intro,
    family: m.family,
    layerPrimary: m.layerPrimary,
    layersSecondary: m.layersSecondary,
    rails: m.rails,
    stewards: m.stewards,
    status: m.status,
    ...(m.statusNote ? { statusNote: m.statusNote } : {}),
    firstAnnounced: m.firstAnnounced,
    latestVersion: m.latestVersion,
    composesWith: m.composesWith,
  };
}

/** Keep relations whose ends are both present protocols; drop exact duplicates. */
export function protocolRelations(
  relations: readonly UniverseRelation[],
  present: ReadonlySet<string>,
): UniverseRelation[] {
  const seen = new Set<string>();
  const out: UniverseRelation[] = [];
  for (const r of relations) {
    if (!present.has(r.from) || !present.has(r.to) || r.from === r.to) continue;
    const key = `${r.from}|${r.type}|${r.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ from: r.from, to: r.to, type: r.type, note: r.note });
  }
  return out;
}

export interface PersonaSidecar {
  protocol: string;
  personas: { persona: string }[];
  responsibilities?: { columns: string[] };
}

/**
 * Persona relevance per protocol: high when the protocol page profiles the
 * persona (personas.json) or lists it in frontmatter `personas`; medium when the
 * persona only appears as a responsibilities column; low otherwise.
 */
export function buildPersonaMap(
  protocols: readonly Pick<ProtocolMeta, 'slug' | 'personas'>[],
  sidecars: readonly PersonaSidecar[],
): PersonaMap {
  const map: PersonaMap = {};
  const set = (persona: string, slug: string, rel: Relevance) => {
    const row = (map[persona] ??= {});
    const prev = row[slug];
    if (prev === 'high') return;
    if (prev === 'medium' && rel === 'low') return;
    row[slug] = rel;
  };
  for (const p of protocols) for (const id of p.personas) set(id, p.slug, 'high');
  for (const s of sidecars) {
    for (const pp of s.personas) set(pp.persona, s.protocol, 'high');
    for (const col of s.responsibilities?.columns ?? []) set(col, s.protocol, 'medium');
  }
  return map;
}

export interface DatedEvent {
  date: string;
  lane: string;
  title: string;
  kind?: string;
  /** Protocol slug when the event comes from a protocol timeline. */
  protocol?: string;
}

export function daysBefore(date: string, days: number): string {
  const t = Date.parse(`${date}T00:00:00Z`) - days * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** Events on or after (buildDate minus `days`) and not after buildDate, newest first, de-duplicated. */
export function recentEvents<T extends DatedEvent>(events: readonly T[], buildDate: string, days = 60): T[] {
  const cutoff = daysBefore(buildDate, days);
  const seen = new Set<string>();
  return events
    .filter((e) => e.date >= cutoff && e.date <= buildDate && e.kind !== 'prehistory')
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title))
    .filter((e) => {
      const key = `${e.date}|${e.title.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/** Satellite link: the orbit mini page when it exists, otherwise the first primary link (external). */
export function resolveOrbit(seeds: readonly OrbitSeed[], pages: ReadonlySet<string>): UniverseOrbit[] {
  return seeds.map((s) => {
    const internal = pages.has(s.slug);
    return {
      slug: s.slug,
      name: s.name,
      category: s.category,
      oneLiner: s.oneLiner,
      href: internal ? `/orbit/${s.slug}/` : s.primaryLink,
      external: !internal,
    };
  });
}
