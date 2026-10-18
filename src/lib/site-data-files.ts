/**
 * The data files every page links (build time): the glossary definitions the tooltip script
 * loads and the command palette's index. Content-hashed (lib/data-file.ts) and computed once
 * per build, since Base.astro asks for them on every page.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { hashedDataFile, type DataFile } from './data-file';
import { loadGlossaryTerms, toTooltipTerms } from './glossary/lookup';

/** Written by scripts/build-search-index.ts before astro build; a missing file (astro dev on a fresh checkout) gives an empty index. */
const SEARCH_INDEX_PATH = resolve(process.cwd(), 'src/generated/search-index.json');
const EMPTY_INDEX = { version: 1, counts: {}, entries: [] };

let cached: Promise<{ glossary: DataFile; searchIndex: DataFile }> | null = null;

function compute(): { glossary: DataFile; searchIndex: DataFile } {
  // Re-serialized compactly: the committed index is indented for readable diffs. A corrupt file fails the build.
  const index: unknown = existsSync(SEARCH_INDEX_PATH) ? JSON.parse(readFileSync(SEARCH_INDEX_PATH, 'utf8')) : EMPTY_INDEX;
  return {
    glossary: hashedDataFile('glossary', toTooltipTerms(loadGlossaryTerms())),
    searchIndex: hashedDataFile('search-index', index),
  };
}

export function siteDataFiles(): Promise<{ glossary: DataFile; searchIndex: DataFile }> {
  // Cached for a build only: under astro dev an edited glossary must reach the tooltips without a restart.
  if (!import.meta.env.PROD) return Promise.resolve(compute());
  cached ??= Promise.resolve().then(compute);
  return cached;
}
