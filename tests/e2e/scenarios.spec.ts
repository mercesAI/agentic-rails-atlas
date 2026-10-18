/**
 * Scenario pages: each renders and hydrates its flow player without a console or page error. The
 * player's step title is an h3 there, and a copy-link button added to it before hydration made React
 * discard the server render (error #418) on three of the eight pages; the protocol-page checks never saw it.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const DIR = join('dist', 'scenarios');
const slugs = existsSync(DIR) ? readdirSync(DIR).filter((d) => existsSync(join(DIR, d, 'index.html'))) : [];

test.describe('scenario pages', () => {
  test.skip(slugs.length === 0, 'no built scenario pages');

  for (const slug of slugs) {
    test(`${slug}: hydrates the flow player without console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`/scenarios/${slug}/`);
      const player = page.locator('.fp').first();
      if (await player.count()) {
        await player.scrollIntoViewIfNeeded();
        await page.locator('astro-island[component-url*="FlowPlayer"]:not([ssr])').first().waitFor({ state: 'attached' });
        await expect(player.locator('.fp__count')).toContainText('Step 1 of');
      }
      await page.waitForLoadState('networkidle');
      expect(errors).toEqual([]);
    });
  }
});
