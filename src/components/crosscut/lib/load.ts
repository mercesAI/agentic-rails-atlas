/**
 * Build-time loaders for the cross-cutting pages (imports astro:content; never
 * import this from an island). Pages call `registerSources(page, ids)` before
 * rendering so `<Cite>`, island markers, the footer SourceList and the
 * citation drawer share one numbering.
 */
import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import { getProtocols, getPublications, getSourcesMap } from '../../../lib/content';
import { dedupe, setPageSources } from '../../../lib/citations';
import type { Claim, CompareFile, ControlsMapFile, Resource } from '../../../lib/schemas';
import { buildLibrary, type LibraryItem } from './library';
import { buildProtocolInfos, type ProtocolInfo, type SourceNumbers } from './protocols';

export async function safeAll<C extends CollectionKey>(name: C): Promise<CollectionEntry<C>[]> {
  try {
    return (await getCollection(name)) as CollectionEntry<C>[];
  } catch (err) {
    console.warn(`[crosscut] collection "${String(name)}" unavailable:`, (err as Error).message);
    return [];
  }
}

/** Every resource and publication as library entries, in list order (the page and /data/library.json share it). */
export async function loadLibraryItems(): Promise<{ items: LibraryItem[]; resources: Resource[] }> {
  const resources = (await safeAll('resources')).flatMap((e) => e.data.resources as Resource[]);
  return { items: buildLibrary(resources, await getPublications()), resources };
}

export async function loadProtocolInfos(): Promise<ProtocolInfo[]> {
  return buildProtocolInfos(await getProtocols());
}

export async function loadCompare(): Promise<CompareFile> {
  const [entry] = await safeAll('compare');
  const data = entry?.data as CompareFile | undefined;
  return data ?? { dimensions: [], cells: [], radar: [] };
}

export async function loadControlsMap(): Promise<ControlsMapFile | null> {
  const [entry] = await safeAll('controlsMap');
  return (entry?.data as ControlsMapFile | undefined) ?? null;
}

/** All claims grouped by protocol slug (from each claims.json). */
export async function loadClaimsByProtocol(): Promise<Map<string, Claim[]>> {
  const out = new Map<string, Claim[]>();
  for (const e of await safeAll('claims')) out.set(e.data.protocol, e.data.claims);
  return out;
}

/**
 * Sets the page citation order to `ids` (source ids only, de-duplicated) and
 * returns the footer number for each id that exists in the registry.
 */
export async function registerSources(page: string, ids: Iterable<string>): Promise<SourceNumbers> {
  const sources = await getSourcesMap();
  const order = dedupe([...ids].filter((id) => id.startsWith('src-') && sources.has(id)));
  setPageSources(order, { page, sources });
  const numbers: SourceNumbers = {};
  order.forEach((id, i) => {
    numbers[id] = i + 1;
  });
  return numbers;
}
