/**
 * Orbit helpers (pure, unit tested). ATLAS_FOLLOWUP.md 2.3.5: an orbit item
 * links to /orbit/<slug>/ only when it has a mini page (starred); otherwise
 * it links to its primary external source with an external-link marker.
 */
import { ORBIT_CATEGORIES, ORBIT_CATEGORY_LABELS, type OrbitCategoryId } from '../../../lib/labels';

export { ORBIT_CATEGORIES, ORBIT_CATEGORY_LABELS, RELATION_LABELS, type OrbitCategoryId } from '../../../lib/labels';

export interface OrbitLike {
  slug: string;
  name: string;
  category: string;
  starred: boolean;
  sources: string[];
}

export interface OrbitLink {
  href: string;
  external: boolean;
}

/**
 * Mini page for starred items; else the first primary source in the item's
 * list, else its first source with a URL. Null when nothing resolves.
 */
export function orbitLink(
  item: OrbitLike,
  sources: Map<string, { url: string; primary: boolean }>,
): OrbitLink | null {
  if (item.starred) return { href: `/orbit/${item.slug}/`, external: false };
  const resolved = item.sources.map((id) => sources.get(id)).filter((s): s is { url: string; primary: boolean } => Boolean(s));
  const pick = resolved.find((s) => s.primary) ?? resolved[0];
  return pick ? { href: pick.url, external: true } : null;
}

/** Items grouped by category in the canonical order; starred first, then by name. Empty groups are dropped. */
export function groupOrbit<T extends OrbitLike>(items: T[]): { category: OrbitCategoryId; label: string; items: T[] }[] {
  return ORBIT_CATEGORIES.map((category) => ({
    category,
    label: ORBIT_CATEGORY_LABELS[category],
    items: items
      .filter((i) => i.category === category)
      .sort((a, b) => Number(b.starred) - Number(a.starred) || a.name.localeCompare(b.name)),
  })).filter((g) => g.items.length > 0);
}
