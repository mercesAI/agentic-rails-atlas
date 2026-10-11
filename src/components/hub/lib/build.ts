/**
 * Build-time helpers shared by the hub pages (run in Astro frontmatter only).
 * Turns timeline sidecars and timeline-global.json into HubEvents with
 * footer-numbered source references.
 */
import { getProtocols, getSidecar, getSourcesMap, getTimelineGlobal } from '../../../lib/content';
import { dedupe } from '../../../lib/citations';
import type { Source, TimelineEvent } from '../../../lib/schemas';
import type { HubEvent, Lane } from './timeline';
import { buildLanes } from './timeline';

export interface TimelineData {
  lanes: (Lane & { family?: string })[];
  events: HubEvent[];
  kinds: string[];
  order: string[];
  sources: Map<string, Source>;
  missingLanes: string[];
}

/** All timeline events (protocol lanes use the protocol slug as the lane id). */
export async function loadTimeline(): Promise<TimelineData> {
  const protocols = await getProtocols();
  const raw: TimelineEvent[] = [];
  const missingLanes: string[] = [];
  for (const p of protocols) {
    const file = await getSidecar('timeline', p.slug);
    if (!file) missingLanes.push(p.name);
    for (const e of file?.events ?? []) raw.push({ ...e, lane: p.slug });
  }
  raw.push(...(await getTimelineGlobal()));
  raw.sort((a, b) => a.date.localeCompare(b.date) || a.lane.localeCompare(b.lane));

  const sources = await getSourcesMap();
  const order = dedupe(raw.flatMap((e) => e.sources));
  const num = new Map(order.map((id, i) => [id, i + 1]));
  const events: HubEvent[] = raw.map((e, i) => ({
    id: `ev-${i}`,
    date: e.date,
    lane: e.lane,
    title: e.title,
    detail: e.detail,
    kind: e.kind,
    confidence: e.confidence,
    sources: dedupe(e.sources).map((id) => ({ n: num.get(id) ?? 0, id, title: sources.get(id)?.title ?? id })),
  }));
  const familyOf = new Map<string, string>(protocols.map((p) => [p.slug, p.family]));
  const lanes = buildLanes(protocols, events).map((l) => ({ ...l, family: familyOf.get(l.id) }));
  const kinds = [...new Set(events.map((e) => e.kind))].sort();
  return { lanes, events, kinds, order, sources, missingLanes };
}
