import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Hub pages: timeline, personas, orbit, learn, notes, what's new.
 * Each page renders, logs no console errors and has no serious or critical
 * axe violations; a few interactions are checked on top.
 */
const PAGES = [
  { path: '/timeline/', h1: 'Timeline' },
  { path: '/personas/', h1: 'Personas' },
  { path: '/personas/consumer/', h1: 'Delegating consumer' },
  { path: '/orbit/', h1: 'Orbit' },
  { path: '/orbit/erc-3643/', h1: 'ERC-3643' },
  { path: '/learn/', h1: 'Learn' },
  { path: '/notes/', h1: 'My notes' },
  { path: '/whats-new/', h1: "What's new" },
];

for (const p of PAGES) {
  test.describe(p.path, () => {
    test('renders without console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(p.path);
      await expect(page.locator('h1')).toContainText(p.h1);
      await page.waitForLoadState('networkidle');
      expect(errors).toEqual([]);
    });

    test('has no serious or critical axe violations', async ({ page }) => {
      await page.goto(p.path);
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    });
  });
}

test('timeline switches to the list view and filters by search', async ({ page }) => {
  await page.goto('/timeline/');
  await expect(page.locator('.tl-marker').first()).toBeVisible();
  await page.getByRole('button', { name: 'List', exact: true }).click();
  await expect(page.locator('.tl-list .tl-event').first()).toBeVisible();
  await page.getByRole('button', { name: 'All years' }).click();
  await page.getByLabel('Search events').fill('zzzz-no-match');
  await expect(page.getByText('No events match these filters.')).toBeVisible();
});

test('persona heatmap uses text values', async ({ page }) => {
  await page.goto('/personas/');
  const cells = page.locator('.heatmap tbody td');
  expect(await cells.count()).toBeGreaterThan(19 * 4);
  const texts = await cells.allInnerTexts();
  for (const t of texts) expect(['High', 'Medium', 'Low', 'None', 'No data yet']).toContain(t.trim());
});

test('orbit cards link to mini pages or external primary sources', async ({ page }) => {
  await page.goto('/orbit/');
  await expect(page.locator('.orbit-card__link a[href="/orbit/erc-3643/"]')).toHaveCount(1);
  const external = page.locator('.orbit-card__link a.ext');
  expect(await external.count()).toBeGreaterThan(0);
  await expect(external.first()).toHaveAttribute('rel', /external/);
  await page.goto('/orbit/erc-3643/');
  await expect(page.locator('table').first()).toContainText('ERC-8004');
  await expect(page.getByRole('heading', { name: /come from T-REX/i })).toBeVisible();
});

test('learn checklist progress survives a reload', async ({ page }) => {
  await page.goto('/learn/');
  const box = page.locator('#learn-f-http-402');
  await box.check();
  await page.reload();
  await expect(page.locator('#learn-f-http-402')).toBeChecked();
  await expect(page.locator('#level-3')).toBeVisible();
});

test('notes page lists, searches and deletes stored notes', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem(
      'atlas:notes',
      JSON.stringify({
        'x402/b-explanation': { text: 'Facilitator pays gas', updated: '2026-10-10T10:00:00Z' },
        'ap2/flags': { text: 'Check mandate expiry', updated: '2026-10-11T10:00:00Z' },
      }),
    );
  });
  await page.goto('/notes/');
  await expect(page.locator('.note-row')).toHaveCount(2);
  await page.getByLabel('Search notes').fill('gas');
  await expect(page.locator('.note-row')).toHaveCount(1);
  await page.getByRole('button', { name: /Delete/ }).click();
  await page.getByRole('button', { name: 'Confirm delete' }).click();
  await page.getByLabel('Search notes').fill('');
  await expect(page.locator('.note-row')).toHaveCount(1);
});
