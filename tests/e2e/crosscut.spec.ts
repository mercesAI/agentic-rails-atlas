/**
 * Cross-cutting pages: compare, stack, controls, glossary, library, methodology.
 * Each page renders, logs no console errors and has no serious or critical axe
 * violations in both themes; the main interactions work.
 * Run on a non-default port, for example:
 *   PLAYWRIGHT_CHANNEL=chrome pnpm exec playwright test tests/e2e/crosscut.spec.ts
 * (the default config previews on 4321; a scratch config may point baseURL elsewhere).
 */
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  { path: '/compare/', h1: 'Compare' },
  { path: '/stack/', h1: 'Stack' },
  { path: '/controls/', h1: 'Controls' },
  { path: '/glossary/', h1: 'Glossary' },
  { path: '/library/', h1: 'Library' },
  { path: '/methodology/', h1: 'Methodology' },
];

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  // Scroll through so client:visible islands hydrate.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 800) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
}

for (const { path, h1 } of PAGES) {
  test.describe(path, () => {
    test('renders without console errors', async ({ page }) => {
      const errors = trackErrors(page);
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: h1 })).toBeVisible();
      await settle(page);
      expect(errors).toEqual([]);
    });

    for (const theme of ['dark', 'light'] as const) {
      test(`has no serious or critical axe violations (${theme})`, async ({ page }) => {
        await page.addInitScript((t) => localStorage.setItem('atlas:theme', t), theme);
        await page.goto(path);
        await settle(page);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        expect(bad.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
      });
    }
  });
}

test('compare: filters, citation markers and pick two', async ({ page }) => {
  await page.goto('/compare/');
  await settle(page);
  const matrix = page.locator('.cc-compare');
  await expect(matrix.locator('tbody th[scope="row"]').first()).toBeVisible();
  const before = await matrix.locator('tbody th[scope="row"]').count();
  await matrix.getByLabel('Search cells').fill('who pays (short)');
  await expect(matrix.locator('tbody th[scope="row"]')).toHaveCount(1);
  await expect(matrix.locator('tbody th[scope="row"]')).toHaveText('Who pays (short)');
  await matrix.getByLabel('Search cells').fill('');
  await expect(matrix.locator('tbody th[scope="row"]')).toHaveCount(before);
  // Citation markers point at numbered footer entries that exist on the page.
  const href = await matrix.locator('[data-cite]').first().getAttribute('href');
  expect(href).toMatch(/^#src-\d+$/);
  await expect(page.locator(href ?? '#none')).toHaveCount(1);
  // The drawer opening is covered by the CitationDrawer owner's tests: at the time of writing the
  // ClientRouter marks same-page hash clicks as defaultPrevented, which the drawer ignores.
  const diffIsland = page.locator('astro-island:has(.cc-diff-table)');
  await diffIsland.scrollIntoViewIfNeeded();
  await expect(diffIsland).not.toHaveAttribute('ssr', /.*/);
  await page.getByLabel('Only show differences').check();
  await expect(page.locator('.cc-diff-row[data-status="same"]')).toHaveCount(0);
  const statuses = await page.locator('.cc-diff-row').evaluateAll((rows) => rows.map((r) => r.getAttribute('data-status')));
  expect(statuses.every((s) => s === 'different')).toBe(true);
});

test('controls: selecting a cell shows its note', async ({ page }) => {
  await page.goto('/controls/');
  await settle(page);
  const btn = page.locator('.cc-ctrl-btn').first();
  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.cc-detail h3')).toBeVisible();
});

test('glossary: anchors exist and the filter narrows the list', async ({ page }) => {
  await page.goto('/glossary/');
  await settle(page);
  const firstId = await page.locator('.cc-gl-term').first().getAttribute('id');
  expect(firstId).toBeTruthy();
  const total = await page.locator('.cc-gl-term').count();
  await page.getByLabel('Search terms').fill('mandate');
  const visible = await page.locator('.cc-gl-term:not([hidden])').count();
  expect(visible).toBeGreaterThan(0);
  expect(visible).toBeLessThan(total);
});

test('library: export downloads a BibTeX file', async ({ page }) => {
  await page.goto('/library/');
  await settle(page);
  await page.getByLabel('Search', { exact: true }).fill('x402');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export BibTeX' }).click()]);
  expect(download.suggestedFilename()).toMatch(/\.bib$/);
});

test('stack: map renders blocks that link to protocol pages', async ({ page }) => {
  await page.goto('/stack/');
  await expect(page.locator('.cc-stack-block[href^="/p/"]').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('table')).toBeVisible();
});
