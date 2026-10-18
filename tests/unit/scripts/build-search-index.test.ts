import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STATIC_PAGES } from '../../../scripts/build-search-index';

const PAGES = join(__dirname, '..', '..', '..', 'src', 'pages');

/** Routes served by an index.astro under src/pages, without dynamic folders and the protocol pages under p/. */
function staticRoutes(dir: string = PAGES, prefix = '/'): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name.startsWith('[') || (prefix === '/' && name === 'p')) continue;
      out.push(...staticRoutes(full, `${prefix}${name}/`));
    } else if (name === 'index.astro') out.push(prefix);
  }
  return out;
}

describe('build-search-index STATIC_PAGES', () => {
  it('lists exactly the static routes under src/pages', () => {
    const routes = staticRoutes();
    expect(routes.length).toBeGreaterThan(5);
    expect(STATIC_PAGES.map((p) => p.url).sort()).toEqual(routes.sort());
  });

  it('gives every page a title and a description', () => {
    for (const p of STATIC_PAGES) {
      expect(p.title.trim()).not.toBe('');
      expect(p.text.trim()).not.toBe('');
      expect(p.url.endsWith('/')).toBe(true);
    }
  });
});
