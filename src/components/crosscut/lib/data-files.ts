/**
 * The content-hashed data files of the cross-cutting islands that load their full data on
 * demand (build time only; imports astro:content through load.ts). See lib/data-file.ts for
 * why the names carry a hash.
 */
import { hashedDataFile, type DataFile } from '../../../lib/data-file';
import { loadCompare, loadLibraryItems } from './load';

/** Every library entry (LibraryItem[]), for LibraryBrowser's filters, search, "Show more" and exports. */
export async function libraryDataFile(): Promise<DataFile> {
  return hashedDataFile('library', (await loadLibraryItems()).items);
}

/** Every compare cell (CompareCell[]), for PickTwoDiff when the reader picks another protocol. */
export async function compareCellsFile(): Promise<DataFile> {
  return hashedDataFile('compare-cells', (await loadCompare()).cells);
}

export async function dataFiles(): Promise<DataFile[]> {
  return [await libraryDataFile(), await compareCellsFile()];
}
