/**
 * Every content-hashed data file (lib/data-file.ts): the glossary definitions and the palette
 * index that every page links, the library and compare data the cross-cutting islands load on
 * demand, and the deferred example payloads of each flow.
 *
 * Plus, for one transition, the two files under the fixed names the previous builds used
 * (/data/glossary.json, /data/search-index.json): a page of such a build that no service worker
 * controls keeps its tooltips and palette index after the deploy. The worker leaves them out
 * (scripts/build-sw.ts, LEGACY_DATA). Remove them once that build is no longer served.
 */
import { getCollection } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';
import { dataFiles } from '../../components/crosscut/lib/data-files';
import { siteDataFiles } from '../../lib/site-data-files';
import { flowPayloadFile } from '../../lib/flows/player-props';
import type { DataFile } from '../../lib/data-file';

export const prerender = true;

export const getStaticPaths = (async () => {
  const site = await siteDataFiles();
  const flows = (await getCollection('flows')).map((e) => flowPayloadFile(e.data)).filter((f): f is DataFile => f !== null);
  const files = [site.glossary, site.searchIndex, ...(await dataFiles()), ...flows];
  const legacy = [
    { file: 'glossary', text: site.glossary.text },
    { file: 'search-index', text: site.searchIndex.text },
  ];
  return [...files, ...legacy].map((f) => ({ params: { file: f.file }, props: { text: f.text } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response((props as { text: string }).text, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
