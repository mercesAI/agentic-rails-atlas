/**
 * Content-hashed JSON data files, served under /data/ by src/pages/data/[file].json.ts.
 * The name carries a hash of the content, so a page always asks for the data of its own
 * build: after a deploy, a service worker of the previous build may still answer (it does
 * not skip waiting), and under a fixed name it would serve its own older copy next to the
 * newer page. Build time only (node:crypto).
 */
import { createHash } from 'node:crypto';

export interface DataFile {
  /** File name without the extension, hash included (library.<hash>). */
  file: string;
  /** URL path (/data/library.<hash>.json). */
  path: string;
  text: string;
}

export function hashedDataFile(name: string, value: unknown): DataFile {
  const text = JSON.stringify(value);
  const file = `${name}.${createHash('sha256').update(text).digest('hex').slice(0, 12)}`;
  return { file, path: `/data/${file}.json`, text };
}
