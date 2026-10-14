/** Regression tests for the 2026-10-14 QA sweep (verification/qa/REPORT.md). */
import { expect, test, type Page } from '@playwright/test';

async function hydrated(page: Page) {
  await page.waitForFunction(() => {
    const el = document.querySelector('astro-island[component-url*="BubbleUniverse"]');
    return Boolean(el && !el.hasAttribute('ssr'));
  });
}

test.describe('QA-001 orbit satellites', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 640, 'desktop canvas only');

  test('every satellite resolves: internal pages exist, others are external', async ({ page, request }) => {
    await page.goto('/');
    await page.locator('.universe').scrollIntoViewIfNeeded();
    await hydrated(page);
    await page.getByRole('button', { name: /orbit/i }).first().click();
    const sats = await page.locator('a.usat').evaluateAll((els) =>
      els.map((e) => ({ href: e.getAttribute('href') ?? '', rel: e.getAttribute('rel') ?? '' })),
    );
    expect(sats.length).toBeGreaterThan(20);
    for (const s of sats) {
      if (s.href.startsWith('/orbit/')) {
        const res = await request.get(s.href);
        expect(res.status(), s.href).toBe(200);
      } else {
        expect(s.href, 'external satellite').toMatch(/^https:\/\//);
        expect(s.rel).toContain('external');
      }
    }
  });
});
