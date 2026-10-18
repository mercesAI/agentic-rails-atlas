/**
 * Every playground, in its first view and on every tab, has no serious or critical axe violation at
 * both viewports. Guards what rounds 4 and 5 fixed by hand: wide tables must stay keyboard-scrollable
 * on phones (scrollable-region-focusable), controls labeled, contrast sufficient. Each scan must see
 * the playground itself, not its loading note: the body has to be ready and hold controls, and a
 * playground built with the kit tabs has to show them.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PROTOCOLS_DIR = join('src', 'content', 'protocols');
const slugs = existsSync(PROTOCOLS_DIR) ? readdirSync(PROTOCOLS_DIR).filter((d) => existsSync(join(PROTOCOLS_DIR, d, 'index.mdx'))) : [];
const usesTabs = (slug: string): boolean => {
  const file = join('src', 'playgrounds', slug, 'Playground.tsx');
  return existsSync(file) && readFileSync(file, 'utf8').includes("components/playground/Tabs'");
};

test.describe('playground accessibility', () => {
  test.skip(slugs.length === 0, 'no protocol content yet');

  for (const slug of slugs) {
    test(`${slug}: every playground view has no serious or critical axe violations`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.goto(`/p/${slug}/`);
      const section = page.locator('#o-playground');
      await section.scrollIntoViewIfNeeded();
      const body = section.locator('.pg__body');
      test.skip((await body.count()) === 0, 'no playground on this page yet');
      // The frame hydrates when visible, then loads the playground module; until then the body is busy.
      await expect(body).toHaveAttribute('aria-busy', 'false', { timeout: 20_000 });
      await expect(section.locator('.pg__status')).toHaveCount(0);
      expect(await body.locator('button, input, select, textarea').count()).toBeGreaterThan(0);
      const tabs = section.getByRole('tab');
      if (usesTabs(slug)) expect(await tabs.count()).toBeGreaterThan(1);
      const views = [null, ...(await tabs.all())];
      const problems: string[] = [];
      for (const [i, tab] of views.entries()) {
        if (tab) {
          await tab.click();
          await expect(tab).toHaveAttribute('aria-selected', 'true');
        }
        const results = await new AxeBuilder({ page }).include('#o-playground').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
        for (const v of results.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical')) {
          problems.push(`${i === 0 ? 'first view' : `tab ${i}`}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target.join(' ')}`);
        }
      }
      expect(problems).toEqual([]);
    });
  }
});
