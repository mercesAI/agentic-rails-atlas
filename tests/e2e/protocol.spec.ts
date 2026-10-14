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
        // Every diagram slot is either a figure or an "in progress" placeholder (content still being written).
        const figures = page.locator('#c-diagrams figure[data-diagram]');
        const pending = page.locator('#c-diagrams .in-progress');
        expect((await figures.count()) + (await pending.count())).toBeGreaterThan(0);
        if (await figures.count()) {
          await expect(figures.first().getByText('Text alternative')).toBeVisible();
          await expect(figures.first().getByText(/Source of truth/)).toBeVisible();
          await figures.first().scrollIntoViewIfNeeded();
          await expect(figures.first().locator('svg, pre').first()).toBeAttached();
        }
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

test.describe('reading modes on /p/x402/', () => {
  test.skip(!slugs.includes('x402'), 'x402 content missing');
  const expected = {
    eli5: { eli5: true, practitioner: false, table: false, d: true },
    practitioner: { eli5: false, practitioner: true, table: false, d: true },
    spec: { eli5: false, practitioner: true, table: true, d: true },
    ste: { eli5: false, practitioner: false, table: false, d: true },
  } as const;
  const labels = { eli5: 'ELI5', practitioner: 'Practitioner', spec: 'Spec-deep', ste: 'STE' } as const;

  for (const mode of Object.keys(expected) as (keyof typeof expected)[]) {
    test(`${mode} mode shows the right content and the single switch reflects it`, async ({ page }) => {
      await page.goto('/p/x402/');
      // One switch only, in the reading bar between section A and the explanation; visible in every mode.
      const groups = page.locator('[role="radiogroup"][aria-label="Reading mode"]');
      await expect(groups).toHaveCount(1);
      await page.getByRole('radiogroup', { name: 'Reading mode' }).getByRole('radio', { name: labels[mode] }).click();
      await expect(page.locator('.reading-bar')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-reading-mode', mode);
      const e = expected[mode];
      const body = page.locator('#b-explanation .protocol-body');
      await expect(body.locator('> .mode-block[data-modes~="eli5"] p').first())[e.eli5 ? 'toBeVisible' : 'toBeHidden']();
      await expect(body.locator('> p').first())[e.practitioner ? 'toBeVisible' : 'toBeHidden']();
      await expect(body.locator('.mode-block[data-modes="spec"] table').first())[e.table ? 'toBeVisible' : 'toBeHidden']();
      await expect(page.locator('#d-ste')).toBeVisible();
      await expect(page.locator('.mode-banner__line:visible').first()).toContainText(`${labels[mode]} mode`);
      await expect(groups.locator(`[data-value="${mode}"]`)).toHaveAttribute('aria-checked', 'true');
      await expect(groups.locator('[aria-checked="true"]')).toHaveCount(1);
    });
  }

  test('the switch sits above the explanation, so a change is announced without a toast', async ({ page }) => {
    await page.goto('/p/x402/');
    await page.locator('.reading-bar').scrollIntoViewIfNeeded();
    await page.getByRole('radiogroup', { name: 'Reading mode' }).getByRole('radio', { name: 'ELI5', exact: true }).click();
    await expect(page.locator('#mode-live')).toHaveText('ELI5 applied to section B');
    await expect(page.locator('#mode-toast')).toBeHidden();
    await expect(page.locator('#b-explanation .mode-banner__line:visible').first()).toContainText('ELI5 mode');
  });
});

test.describe('diagrams stay readable', () => {
  test.skip(!slugs.includes('ap2'), 'ap2 content missing');

  async function stateFigure(page: Page) {
    await page.goto('/p/ap2/');
    const figure = page.locator('.diagram-figure').filter({ hasText: 'mandate lifecycle' }).first();
    await figure.scrollIntoViewIfNeeded();
    await expect(figure.locator('svg:visible').first()).toBeVisible();
    return figure;
  }

  test('state machine text renders at 11 px or more and the canvas scrolls', async ({ page }) => {
    const figure = await stateFigure(page);
    const size = await figure.evaluate((f) => {
      const svg = [...f.querySelectorAll('svg')].find((s) => s.getBoundingClientRect().width > 0)!;
      const label = svg.querySelector('.nodeLabel, text')!;
      const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      return parseFloat(getComputedStyle(label).fontSize) * scale;
    });
    expect(size).toBeGreaterThanOrEqual(11);
    const canvas = figure.getByRole('region', { name: /scrollable diagram/ });
    await expect(canvas).toHaveAttribute('tabindex', '0');
    await expect(figure.getByText('Scroll to see the whole diagram')).toBeVisible();
  });

  test('full-screen dialog opens and closes with the keyboard', async ({ page }) => {
    const figure = await stateFigure(page);
    const button = figure.getByRole('button', { name: /View full screen/ });
    await button.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Zoom in' }).click();
    await expect(dialog.locator('.diagram-dialog__level')).toHaveText('125%');
    await dialog.getByRole('button', { name: 'Reset zoom' }).click();
    await expect(dialog.locator('.diagram-dialog__level')).toHaveText('100%');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(button).toBeFocused();
  });
});
