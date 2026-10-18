/** The content-hashed data files of src/components/crosscut/lib/data-files.ts (/data/library.<hash>.json, /data/compare-cells.<hash>.json). */
import type { APIRoute, GetStaticPaths } from 'astro';
import { dataFiles } from '../../components/crosscut/lib/data-files';

export const prerender = true;

export const getStaticPaths = (async () => (await dataFiles()).map((f) => ({ params: { file: f.file }, props: { text: f.text } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response((props as { text: string }).text, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
