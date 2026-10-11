import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('smoke', () => {
  test('home renders with nav, main and footer', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Atlas' })).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeAttached();
  });

  test('nav reaches the glossary link', async ({ page }) => {
    await page.goto('/');
    const menu = page.getByRole('button', { name: 'Menu' });
    if (await menu.isVisible()) await menu.click();
    const link = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Glossary' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/glossary/');
  });

  test('theme toggle persists across reloads', async ({ page }) => {
    await page.goto('/');
    const menu = page.getByRole('button', { name: 'Menu' });
    if (await menu.isVisible()) await menu.click();
    await page.getByRole('radio', { name: 'Light theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await page.evaluate(() => localStorage.getItem('atlas:theme'))).toBe('light');
  });

  test('command palette opens with the slash key', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('/');
    await expect(page.getByRole('combobox')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('combobox')).toBeHidden();
  });

  for (const theme of ['dark', 'light'] as const) {
    test(`home has no serious or critical axe violations (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('atlas:theme', t), theme);
      await page.goto('/');
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });
  }

  test('404 page renders', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist/');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  });
});
