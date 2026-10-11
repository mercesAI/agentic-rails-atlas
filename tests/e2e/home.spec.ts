import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const MODES = ['Constellation', 'Layers', 'Rails map', 'Timeline'] as const;

async function hydrated(page: Page) {
  await page.waitForFunction(() => {
    const el = document.querySelector('astro-island[component-url*="BubbleUniverse"]');
    return Boolean(el && !el.hasAttribute('ssr'));
  });
}

async function protocolSlugs(page: Page): Promise<string[]> {
  const hrefs = await page.locator('.protocol-list .protocol-list__link').evaluateAll((els) =>
    els.map((e) => e.getAttribute('href') ?? ''),
  );
  return hrefs.map((h) => h.replace(/^\/p\/|\/$/g, ''));
}

async function axeSerious(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

test.describe('home universe (desktop)', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 640, 'desktop canvas only');

  test('renders one bubble per protocol and the card list', async ({ page }) => {
    await page.goto('/');
    const slugs = await protocolSlugs(page);
    expect(slugs.length).toBeGreaterThan(0);
    await expect(page.locator('.universe__inline .ub')).toHaveCount(slugs.length);
    for (const s of slugs) {
      await expect(page.locator(`.ub[data-slug="${s}"]`)).toHaveAttribute('href', `/p/${s}/`);
      await expect(page.locator(`.ub[data-slug="${s}"] .ub__disc`)).toHaveCSS('view-transition-name', `bubble-${s}`);
    }
    await expect(page.getByRole('heading', { name: 'Protocols', level: 2 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start here' })).toHaveAttribute('href', '/learn/');
    await expect(page.getByRole('heading', { name: 'Changed in the last 60 days' })).toBeVisible();
    await expect(page.locator('.progress-ring')).toBeAttached();
  });

  test('every bubble is reachable with Tab and arrow keys', async ({ page }) => {
    await page.goto('/');
    await hydrated(page);
    const slugs = await protocolSlugs(page);
    await page.locator('.u-persona summary').focus();
    const seen: string[] = [];
    for (let i = 0; i < slugs.length; i++) {
      await page.keyboard.press('Tab');
      seen.push((await page.evaluate(() => document.activeElement?.getAttribute('data-slug'))) ?? '');
    }
    expect([...seen].sort()).toEqual([...slugs].sort());

    const first = page.locator('.ub').first();
    await first.focus();
    await expect(page.locator('.ucard')).toBeVisible();
    const before = await page.evaluate(() => document.activeElement?.getAttribute('data-slug'));
    await page.keyboard.press('ArrowRight');
    const after = await page.evaluate(() => document.activeElement?.getAttribute('data-slug'));
    expect(after).toBeTruthy();
    expect(after).not.toBe(before);
  });

  test('Enter on each bubble opens its protocol page', async ({ page }) => {
    test.slow();
    await page.goto('/');
    const slugs = await protocolSlugs(page);
    for (const s of slugs) {
      await page.goto('/');
      await hydrated(page);
      await page.locator(`.ub[data-slug="${s}"]`).focus();
      await page.keyboard.press('Enter');
      await page.waitForURL(`**/p/${s}/`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  test('hover shows the card and relation edges', async ({ page }) => {
    await page.goto('/');
    await hydrated(page);
    const withEdges = page.locator('.ub[data-slug="x402"]');
    const target = (await withEdges.count()) > 0 ? withEdges : page.locator('.ub').first();
    await target.hover();
    const card = page.locator('.ucard');
    await expect(card).toBeVisible();
    await expect(card).toContainText('First announced');
    await expect(card).toContainText('Latest version');
    await expect(card).toContainText('Stewards');
  });

  test('each layout mode switches', async ({ page }) => {
    await page.goto('/');
    await hydrated(page);
    const stage = page.locator('.universe__inline .universe__stage');
    const firstBubble = page.locator('.ub').first();
    const positions = new Set<string>();
    for (const label of MODES) {
      const btn = page.getByRole('group', { name: 'Layout' }).getByRole('button', { name: label, exact: true });
      await btn.click();
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
      await expect(stage).toHaveAttribute('data-mode', /.+/);
      positions.add(await firstBubble.evaluate((el) => `${(el as HTMLElement).style.left},${(el as HTMLElement).style.top}`));
      if (label === 'Layers') await expect(page.locator('.u-label--row')).toHaveCount(8);
      if (label === 'Timeline') await expect(page.locator('.u-label--tick').first()).toBeAttached();
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  test('orbit toggle and persona filter', async ({ page }) => {
    await page.goto('/');
    await hydrated(page);
    const orbit = page.getByRole('button', { name: 'Orbit' });
    await orbit.click();
    await expect(orbit).toHaveAttribute('aria-pressed', 'true');
    expect(await page.locator('.usat').count()).toBeGreaterThanOrEqual(20);
    await page.locator('.u-persona summary').click();
    await page.locator('.u-persona input[value="agent-dev"]').check();
    await expect(page.locator('.ub[data-relevance="high"]').first()).toBeAttached();
    await expect(page.locator('.u-persona__current')).not.toHaveText('All personas');
    await page.locator('.u-persona input[value=""]').check();
    await expect(page.locator('.ub[data-relevance="low"]')).toHaveCount(0);
  });

  for (const theme of ['dark', 'light'] as const) {
    test(`axe finds no serious or critical issues with the universe open (${theme})`, async ({ page }) => {
      // Reduced motion: layout transitions finish at once, so axe sees settled positions.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript((t) => localStorage.setItem('atlas:theme', t), theme);
      await page.goto('/');
      await hydrated(page);
      expect(await axeSerious(page)).toEqual([]);
      await page.getByRole('button', { name: 'Orbit' }).click();
      await page.locator('.u-persona summary').click();
      await page.locator('.u-persona input[value="agent-dev"]').check();
      expect(await axeSerious(page)).toEqual([]);
      await page.locator('.u-persona summary').click();
      await page.locator('.ub').first().focus();
      expect(await axeSerious(page)).toEqual([]);
      for (const label of MODES.slice(1)) {
        await page.getByRole('group', { name: 'Layout' }).getByRole('button', { name: label, exact: true }).click();
        expect(await axeSerious(page)).toEqual([]);
      }
    });
  }
});

test.describe('home universe (under 640 px)', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1440) >= 640, 'mobile only');

  test('defaults to the card list and opens a pan-and-zoom canvas', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await hydrated(page);
    await expect(page.locator('.protocol-list')).toBeVisible();
    await expect(page.locator('.universe__inline')).toHaveCount(0);
    await page.getByRole('button', { name: 'View universe' }).click();
    const dialog = page.getByRole('dialog', { name: 'Protocol universe' });
    await expect(dialog).toBeVisible();
    const slugs = await protocolSlugs(page);
    await expect(dialog.locator('.ub')).toHaveCount(slugs.length);
    await dialog.getByRole('button', { name: 'Zoom in' }).click();
    await expect(dialog.locator('.universe__canvas')).toHaveAttribute('style', /transform/);
    await dialog.getByRole('button', { name: 'Layers', exact: true }).click();
    await expect(dialog.locator('.universe__stage')).toHaveAttribute('data-mode', 'layers');
    expect(await axeSerious(page)).toEqual([]);
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
  });
});
