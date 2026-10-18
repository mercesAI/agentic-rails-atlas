/**
 * Content-hashed data files for the islands that load their full data on demand (build time only;
 * imports astro:content through load.ts). The name carries a hash of the content, so a page always
 * asks for the data of its own build: after a deploy, a service worker of the previous build may
 * still answer (it does not skip waiting), and under a fixed name it would serve its own older copy
 * next to the newer page. src/pages/data/[file].json.ts writes the files; the pages link them.
 */
import { createHash } from 'node:crypto';
import { loadCompare, loadLibraryItems } from './load';

export interface DataFile {
  /** File name without the extension, hash included (library.<hash>). */
  file: string;
  /** URL path (/data/library.<hash>.json). */
  path: string;
  text: string;
}

function hashed(name: string, value: unknown): DataFile {
  const text = JSON.stringify(value);
  const file = `${name}.${createHash('sha256').update(text).digest('hex').slice(0, 12)}`;
  return { file, path: `/data/${file}.json`, text };
}

/** Every library entry (LibraryItem[]), for LibraryBrowser's filters, search, "Show more" and exports. */
export async function libraryDataFile(): Promise<DataFile> {
  return hashed('library', (await loadLibraryItems()).items);
}

/** Every compare cell (CompareCell[]), for PickTwoDiff when the reader picks another protocol. */
export async function compareCellsFile(): Promise<DataFile> {
  return hashed('compare-cells', (await loadCompare()).cells);
}

export async function dataFiles(): Promise<DataFile[]> {
  return [await libraryDataFile(), await compareCellsFile()];
}
