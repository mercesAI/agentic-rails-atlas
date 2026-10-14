/** Regression tests for the 2026-10-14 QA sweep (verification/qa/REPORT.md). */
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
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

function builtPages(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        if (name !== 'pagefind' && name !== '_astro') walk(full);
      } else if (name === 'index.html') {
        out.push(dir === 'dist' ? '/' : `/${relative('dist', dir)}/`);
      }
    }
  };
  walk('dist');
  return out.sort();
}

test.describe('QA-002 to QA-004, QA-012: no sideways page scroll', () => {
  test.describe.configure({ timeout: 240_000 });
  for (const width of [360, 375, 768, 1440]) {
    test(`no page scrolls horizontally at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      const failures: string[] = [];
      for (const url of builtPages()) {
        await page.goto(url, { waitUntil: 'load' });
        const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
        if (sw > iw) failures.push(`${url}: scrollWidth ${sw} > ${iw}`);
      }
      expect(failures).toEqual([]);
    });
  }

  test('flow player stays inside its column at desktop width', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, 'desktop only');
    for (const slug of ['mastercard-agent-pay', 'visa-tap']) {
      await page.goto(`/p/${slug}/`);
      const fp = page.locator('.fp').first();
      await fp.scrollIntoViewIfNeeded();
      const box = await fp.boundingBox();
      const col = await page.locator('.psec').first().boundingBox();
      expect(box!.x + box!.width, slug).toBeLessThanOrEqual(col!.x + col!.width + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });
});

test.describe('QA-006 j and k move through sections', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, 'desktop only');

  test('j steps forward one section at a time, k steps back', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/p/x402/');
    await page.locator('main').click({ position: { x: 5, y: 5 } }).catch(() => undefined);
    const ids = await page.locator('[data-section]').evaluateAll((els) => els.map((e) => e.id));
    expect(ids.length).toBeGreaterThan(6);
    const topOf = (id: string) => page.evaluate((i) => document.getElementById(i)!.getBoundingClientRect().top, id);
    const offset = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop));
    const seen: number[] = [];
    for (let n = 0; n < 5; n++) {
      await page.keyboard.press('j');
      await expect.poll(async () => Math.abs((await topOf(ids[n]!)) - offset), { timeout: 3000 }).toBeLessThan(3);
      seen.push(await page.evaluate(() => window.scrollY));
    }
    expect([...seen].sort((a, b) => a - b)).toEqual(seen);
    expect(new Set(seen).size).toBe(seen.length);
    for (let n = 3; n >= 0; n--) {
      await page.keyboard.press('k');
      await expect.poll(async () => Math.abs((await topOf(ids[n]!)) - offset), { timeout: 3000 }).toBeLessThan(3);
    }
  });
});

test.describe('QA-005 offline support', () => {
  test('visited and unvisited pages load with the network off; manifest exists', async ({ page, context, request }) => {
    const manifest = await request.get('/manifest.webmanifest');
    expect(manifest.status()).toBe(200);
    const m = await manifest.json();
    expect(m).toMatchObject({ display: 'standalone', start_url: '/' });
    expect(m.name && m.short_name && m.theme_color && m.background_color && m.icons?.length).toBeTruthy();

    await page.goto('/');
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    await page.goto('/p/x402/');
    await expect
      .poll(
        () =>
          page.evaluate(async () => {
            const keys = (await caches.keys()).filter((k) => k.startsWith('atlas-'));
            if (keys.length !== 1) return 0;
            return (await (await caches.open(keys[0]!)).keys()).length;
          }),
        { timeout: 60_000 },
      )
      .toBeGreaterThan(150);
    // Reload once so the page is controlled by the worker.
    await page.reload();
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));

    await context.setOffline(true);
    try {
      await page.reload();
      await expect(page.locator('h1').first()).toContainText(/x402/i);
      await page.goto('/p/ap2/');
      await expect(page.locator('h1').first()).toContainText(/AP2|Agent Payments/i);
      await page.goto('/glossary/');
      await expect(page.locator('h1').first()).toBeVisible();
      await page.goto('/');
      await expect(page.locator('h1').first()).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });
});
