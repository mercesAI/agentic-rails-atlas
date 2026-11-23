import { existsSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { startEdgeServer, type EdgeServer } from './support/edge-server';

/**
 * The production Content Security Policy from dist/_headers, applied by a stand-in for the edge
 * (support/edge-server.ts): no page may report a violation, on a full load or after a
 * client-side navigation, and full-text search must work. `astro preview` does not apply
 * _headers, so the other tests cannot see a violation. On 2026-11-15 the live site reported a
 * data: font (a font subset Vite had inlined) on every page, Zod's eval probe on the home page,
 * and a data: module script that the router appends after a navigation into a page whose last
 * new module script is inline (the glossary). The beacon here is a same-origin stub, so only
 * a live check on atlas.merces.ai after a deploy shows that the policy lets the real beacon
 * load.
 */
const DIST = join(process.cwd(), 'dist');
const PAGES = existsSync(DIST)
  ? readdirSync(DIST, { recursive: true })
      .map(String)
      .filter((file) => file === 'index.html' || file.endsWith(`${sep}index.html`))
      .map((file) => `/${file.slice(0, -'index.html'.length).split(sep).join('/')}`)
      .sort()
  : [];

let edge: EdgeServer;
test.beforeAll(async () => {
  edge = await startEdgeServer(DIST);
});
test.afterAll(async () => {
  await edge?.close();
});
// Reduced motion cuts transitions and animations to almost nothing (tokens.css), so islands
// settle sooner; the scroll loop below jumps with behavior 'instant' despite smooth scrolling.
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(() => {
  test.skip(test.info().project.name !== 'desktop', 'the policy does not depend on the viewport');
});

async function watchViolations(page: Page): Promise<string[]> {
  const violations: string[] = [];
  await page.exposeBinding('__cspViolation', (_source, text: string) => {
    violations.push(text);
  });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      const report = (window as unknown as { __cspViolation: (text: string) => void }).__cspViolation;
      report(`${location.pathname}: ${e.effectiveDirective} blocked ${String(e.blockedURI).slice(0, 60)} (${e.sourceFile}:${e.lineNumber})`);
    });
  });
  return violations;
}

/** True once no request has been in flight for 500 ms; start it before the page loads. */
function quietNetwork(page: Page): () => boolean {
  const inflight = new Set<object>();
  let changed = Date.now();
  page.on('request', (request) => {
    inflight.add(request);
    changed = Date.now();
  });
  const done = (request: object) => {
    inflight.delete(request);
    changed = Date.now();
  };
  page.on('requestfinished', done);
  page.on('requestfailed', done);
  return () => inflight.size === 0 && Date.now() - changed >= 500;
}

/** Waits until the network is quiet and the number of islands that have not started stops changing. */
async function settle(page: Page, quiet: () => boolean): Promise<void> {
  let last = -1;
  await expect
    .poll(
      async () => {
        const pending = await page.locator('astro-island[ssr]').count();
        const settled = pending === last && quiet();
        last = pending;
        return settled;
      },
      { intervals: [250], timeout: 15_000 },
    )
    .toBe(true);
}

test('the page list covers the build', () => {
  expect(PAGES.length).toBeGreaterThan(50);
  expect(PAGES).toContain('/');
  expect(PAGES).toContain('/glossary/');
});

for (const path of [...PAGES, '/no-such-page/']) {
  test(`no Content Security Policy violation on a full load of ${path}`, async ({ page }) => {
    const violations = await watchViolations(page);
    const quiet = quietNetwork(page);
    const res = await page.goto(`${edge.url}${path}`);
    expect(res?.headers()['content-security-policy']).toContain("default-src 'self'");
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    });
    await settle(page, quiet);
    expect(violations).toEqual([]);
  });
}

test('no Content Security Policy violation after a client-side navigation into each page', async ({ page }) => {
  test.setTimeout(240_000);
  const violations = await watchViolations(page);
  await page.goto(`${edge.url}/`);
  // Set once; a full page load in between would drop it.
  await page.evaluate(() => {
    (window as unknown as { __routed?: boolean }).__routed = true;
  });
  for (const path of [...PAGES.filter((p) => p !== '/'), '/']) {
    await page.evaluate(async (href) => {
      const loaded = new Promise((resolve) => document.addEventListener('astro:page-load', resolve, { once: true }));
      const link = document.createElement('a');
      link.href = href;
      document.body.append(link);
      link.click();
      await loaded;
    }, path);
    await page.waitForURL(`${edge.url}${path}`);
    expect(await page.evaluate(() => (window as unknown as { __routed?: boolean }).__routed), `${path} was a full load`).toBe(true);
  }
  await page.waitForTimeout(300);
  expect(violations).toEqual([]);
});

test('full-text search works under the policy', async ({ page }) => {
  const violations = await watchViolations(page);
  await page.goto(`${edge.url}/`);
  // Pagefind compiles its wasm in its own worker, where a block is reported to the worker and
  // not to this page, so the result count is the signal.
  const hits = await page.evaluate(async () => {
    const url = '/pagefind/pagefind.js';
    const pagefind = (await import(url)) as { search: (query: string) => Promise<{ results: unknown[] }> };
    return (await pagefind.search('x402')).results.length;
  });
  expect(hits).toBeGreaterThan(0);
  expect(violations).toEqual([]);
});
