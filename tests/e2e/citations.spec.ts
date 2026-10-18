/**
 * Citation markers and the drawer payload. The build drops every claim a page never mentions from
 * its payload (src/lib/build/prune-citations.ts); these tests guard that no marker loses its data.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, test } from '@playwright/test';

interface Payload {
  sources: { id: string }[];
  claims: { id: string; sources: string[] }[];
}

function builtPages(dir = 'dist'): { url: string; html: string }[] {
  const out: { url: string; html: string }[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name !== 'pagefind' && name !== '_astro') out.push(...builtPages(full));
    } else if (name.endsWith('.html')) {
      out.push({ url: `/${relative('dist', full)}`, html: readFileSync(full, 'utf8') });
    }
  }
  return out;
}

test.describe('citation payload', () => {
  test('every marker on every built page resolves to its claim, the claim sources and its sources in that page payload', () => {
    test.skip(test.info().project.name !== 'desktop', 'reads dist/ once; the viewport does not matter');
    const problems: string[] = [];
    let markers = 0;
    for (const { url, html } of builtPages()) {
      const ids = new Set([...html.matchAll(/data-cite="([^"]*)"/g)].flatMap((m) => (m[1] ?? '').split(/[\s,]+/).filter(Boolean)));
      if (!ids.size) continue;
      markers += ids.size;
      const block = /<script type="application\/json" id="atlas-citations">([\s\S]*?)<\/script>/.exec(html);
      if (!block) {
        problems.push(`${url}: markers but no payload`);
        continue;
      }
      const payload = JSON.parse(block[1] ?? '{}') as Payload;
      const claims = new Map(payload.claims.map((c) => [c.id, c]));
      const sources = new Set(payload.sources.map((s) => s.id));
      for (const id of ids) {
        if (id.startsWith('clm-')) {
          const claim = claims.get(id);
          if (!claim) problems.push(`${url}: claim ${id} not in the payload`);
          else for (const s of claim.sources) if (!sources.has(s)) problems.push(`${url}: source ${s} of ${id} not in the payload`);
        } else if (!sources.has(id)) problems.push(`${url}: source ${id} not in the payload`);
      }
    }
    expect(markers).toBeGreaterThan(1000);
    expect(problems).toEqual([]);
  });

  test('a claim marker on a scenario page opens the drawer with the claim text and its sources', async ({ page }) => {
    await page.goto('/scenarios/metered-inference/');
    await page.locator('astro-island[component-url*="CitationDrawer"]:not([ssr])').waitFor({ state: 'attached' });
    // Markers inside reading-mode blocks the current mode hides are in the DOM but not reachable.
    const marker = page.locator('[data-cite^="clm-"]:visible').first();
    // Keyboard activation: a pointer click from Playwright aims at the first box of the link, which is
    // its clipped screen-reader label, and lands on the paragraph instead.
    await marker.focus();
    await page.keyboard.press('Enter');
    const drawer = page.getByRole('dialog', { name: 'Source details' });
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('.drawer__claim-text').first()).not.toBeEmpty();
    await expect(drawer.locator('.drawer__sources li').first()).toBeVisible();
    await expect(drawer.locator('.drawer__missing')).toHaveCount(0);
  });
});
