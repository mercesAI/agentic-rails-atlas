import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { SECTION_IDS, SECTION_TITLES } from '../../src/lib/schemas';

/** Every protocol that has an index.mdx is built to /p/<slug>/. */
const PROTOCOLS_DIR = join(process.cwd(), 'src', 'content', 'protocols');
const slugs = existsSync(PROTOCOLS_DIR)
  ? readdirSync(PROTOCOLS_DIR).filter((d) => existsSync(join(PROTOCOLS_DIR, d, 'index.mdx')))
  : [];

/** Scrolls through the page so every client:visible island hydrates. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight * 0.8, 400);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
  });
}

test.describe('protocol page template', () => {
  test.skip(slugs.length === 0, 'no protocol content yet');

  for (const slug of slugs) {
    test.describe(slug, () => {
      test('renders all 20 lettered sections in order', async ({ page }) => {
        await page.goto(`/p/${slug}/`);
        const ids = await page.locator('[data-section]').evaluateAll((els) => els.map((e) => e.id));
        expect(ids).toEqual([...SECTION_IDS]);
        for (const id of SECTION_IDS) {
          const section = page.locator(`section#${id}[data-section]`);
          await expect(section).toHaveAttribute('aria-labelledby', `${id}-h`);
          const text = (await page.locator(`#${id}-h`).innerText()).replace(/#\s*$/, '').trim();
          expect(text.startsWith(`${id.charAt(0).toUpperCase()}. ${SECTION_TITLES[id]}`)).toBe(true);
        }
        await expect(page.locator(`[transition\\:name], .proto-header`).first()).toBeVisible();
        await expect(page.locator('#sources')).toBeAttached();
      });

      test('has no console errors after the islands hydrate', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (m) => {
          if (m.type() === 'error') errors.push(m.text());
        });
        page.on('pageerror', (e) => errors.push(e.message));
        await page.goto(`/p/${slug}/`);
        await scrollThrough(page);
        await page.waitForTimeout(500);
        expect(errors).toEqual([]);
      });

      test('shows diagrams, the flow player and the state explorer', async ({ page }) => {
        await page.goto(`/p/${slug}/`);
        const figures = page.locator('#c-diagrams figure[data-diagram]');
        expect(await figures.count()).toBeGreaterThan(0);
        await expect(figures.first().getByText('Text alternative')).toBeVisible();
        await expect(figures.first().getByText(/Source of truth/)).toBeVisible();
        const stage = page.locator('.fp__stage').first();
        if (await stage.count()) {
          await stage.scrollIntoViewIfNeeded();
          await expect(page.locator('.fp__count').first()).toContainText('Step 1 of');
          await stage.focus();
          await page.keyboard.press('ArrowRight');
          await expect(page.locator('.fp__count').first()).toContainText('Step 2 of');
          await page.keyboard.press('ArrowLeft');
          await expect(page.locator('.fp__count').first()).toContainText('Step 1 of');
        }
        const sm = page.locator('.sm').first();
        if (await sm.count()) {
          await sm.scrollIntoViewIfNeeded();
          const second = sm.locator('.sm__tbtn').nth(1);
          if (await second.count()) {
            await second.click();
            await expect(second).toHaveAttribute('aria-pressed', 'true');
            await expect(sm.locator('.sm__detail')).toContainText('Trigger');
          }
        }
      });

      test('reading-mode switch hides B in STE mode and persists', async ({ page }) => {
        await page.goto(`/p/${slug}/`);
        const group = page.getByRole('radiogroup', { name: 'Reading mode' }).first();
        await group.getByRole('radio', { name: 'STE' }).click();
        await expect(page.locator('html')).toHaveAttribute('data-reading-mode', 'ste');
        await expect(page.locator('#b-explanation')).toBeHidden();
        await expect(page.locator('#d-ste')).toBeVisible();
        const order = await page.evaluate(() => {
          const a = document.getElementById('a-tldr')!.getBoundingClientRect().top;
          const c = document.getElementById('c-diagrams')!.getBoundingClientRect().top;
          const d = document.getElementById('d-ste')!.getBoundingClientRect().top;
          return { aBeforeD: a < d, dBeforeC: d < c };
        });
        expect(order).toEqual({ aBeforeD: true, dBeforeC: true });
        await page.reload();
        await expect(page.locator('html')).toHaveAttribute('data-reading-mode', 'ste');
        await page.getByRole('radiogroup', { name: 'Reading mode' }).first().getByRole('radio', { name: 'Practitioner' }).click();
        await expect(page.locator('#b-explanation')).toBeVisible();
      });

      test('flag an issue adds a prefilled note', async ({ page }) => {
        await page.goto(`/p/${slug}/`);
        await page.getByRole('button', { name: 'Flag an issue' }).click();
        const notes = await page.evaluate(() => JSON.parse(localStorage.getItem('atlas:notes') ?? '{}'));
        expect(Object.keys(notes)).toContain(`${slug}/flags`);
      });

      for (const theme of ['dark', 'light'] as const) {
        test(`has no serious or critical axe violations (${theme})`, async ({ page }) => {
          test.setTimeout(120_000);
          await page.addInitScript((t) => localStorage.setItem('atlas:theme', t), theme);
          await page.goto(`/p/${slug}/`);
          await scrollThrough(page);
          const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze();
          const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
          expect(bad.map((v) => `${v.id}: ${v.nodes.length} (${v.nodes[0]?.target.join(' ')})`)).toEqual([]);
        });
      }
    });
  }
});
