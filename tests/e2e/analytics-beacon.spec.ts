import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { startEdgeServer, type EdgeServer } from './support/edge-server';

/**
 * Cloudflare Web Analytics counts a reader only on a page that loads its beacon, which the edge
 * adds to HTML asked for with text/html. These tests run the production build behind a
 * stand-in for the edge (support/edge-server.ts) with the service worker on and follow a
 * returning reader. Request routing would switch off the HTTP cache, and with it the 304 that
 * hid the tag on atlas.merces.ai on 2026-11-15, so nothing here is routed.
 */
const DIST = join(process.cwd(), 'dist');
let edge: EdgeServer;
let workerTimeout = 0;
test.beforeAll(async () => {
  edge = await startEdgeServer(DIST);
  workerTimeout = Number(/const NETWORK_TIMEOUT_MS = (\d+);/.exec(readFileSync(join(DIST, 'sw.js'), 'utf8'))?.[1] ?? 0);
});
test.afterAll(async () => {
  await edge?.close();
});
test.beforeEach(() => {
  test.skip(test.info().project.name !== 'desktop', 'the desktop profile is enough');
  test.setTimeout(120_000);
});
test.afterEach(() => {
  edge?.delay('/timeline/', 0);
  edge?.delay('/library/', 0);
});

async function workerInControl(page: Page): Promise<void> {
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 60_000 }).toBe(true);
}
const beaconTags = (page: Page): Promise<number> => page.locator('script[data-cf-beacon]').count();
const beaconRuns = (page: Page): Promise<number> => page.evaluate(() => (window as unknown as { __beaconRuns?: number }).__beaconRuns ?? 0);
const navLink = (page: Page, href: string) => page.locator(`a[href="${href}"]`).filter({ visible: true }).first();
const requestsFor = (path: string) => edge.requests.filter((r) => r.path === path);
const lastRequest = (path: string) => requestsFor(path).at(-1);

test('a returning reader loads the beacon on pages opened directly, also after the router fetched them without it', async ({ context, page }) => {
  expect(workerTimeout).toBeGreaterThan(0);
  await page.goto(`${edge.url}/`);
  await workerInControl(page);
  expect(await beaconTags(page)).toBe(1);
  await expect.poll(() => beaconRuns(page)).toBe(1);

  // A click: the router fetches the page without text/html in Accept, so the HTTP cache now
  // holds a copy without the tag and with an ETag. The running beacon follows this navigation.
  await navLink(page, '/glossary/').click();
  await page.waitForURL(`${edge.url}/glossary/`);
  await expect(page.locator('h1').first()).toBeVisible();
  expect(lastRequest('/glossary/')?.accept).not.toContain('text/html');
  expect(await beaconRuns(page)).toBe(1);

  // The same page opened later from the address bar: the worker asks the edge without
  // If-None-Match, so the tagless copy cannot come back by 304.
  const again = await context.newPage();
  await again.goto(`${edge.url}/glossary/`);
  expect(await again.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  expect(lastRequest('/glossary/')).toMatchObject({ conditional: false, status: 200 });
  expect(lastRequest('/glossary/')?.accept).toContain('text/html');
  expect(await beaconTags(again)).toBe(1);
  await expect.poll(() => beaconRuns(again)).toBe(1);

  // A page the reader never opened, which the worker precached.
  const other = await context.newPage();
  await other.goto(`${edge.url}/compare/`);
  expect(await beaconTags(other)).toBe(1);
  await expect.poll(() => beaconRuns(other)).toBe(1);

  // The precached copies carry the tag, for a slow or missing network.
  const cachedHasTag = await other.evaluate(async () => (await (await caches.match('/stack/'))?.text())?.includes('data-cf-beacon') ?? false);
  expect(cachedHasTag).toBe(true);

  // A click does not replace the cached copy with the router's tagless answer: when the network
  // is slower than the worker's timeout, the page opened directly comes from the cache, tag
  // included. The edge logs a delayed request only when it answers, so an unchanged count
  // shows that the cache answered.
  await navLink(page, '/timeline/').click();
  await page.waitForURL(`${edge.url}/timeline/`);
  edge.delay('/timeline/', workerTimeout + 6_000);
  const answered = requestsFor('/timeline/').length;
  const slow = await context.newPage();
  await slow.goto(`${edge.url}/timeline/`);
  expect(requestsFor('/timeline/')).toHaveLength(answered);
  expect(await beaconTags(slow)).toBe(1);
  await expect.poll(() => beaconRuns(slow)).toBe(1);

  // On such a network the router gets the worker's copy, tag included. The router does not run
  // a script whose source already ran, so the beacon does not start a second time.
  edge.delay('/library/', workerTimeout + 2_000);
  await page.evaluate(() => {
    (window as unknown as { __swapped?: Promise<unknown> }).__swapped = new Promise((resolve) =>
      document.addEventListener('astro:page-load', resolve, { once: true }),
    );
  });
  await navLink(page, '/library/').click();
  await page.evaluate(() => (window as unknown as { __swapped?: Promise<unknown> }).__swapped);
  expect(await beaconTags(page)).toBe(1);
  expect(await beaconRuns(page)).toBe(1);
});

test('through the worker, a missing trailing slash still redirects and an unknown page still gets the 404 page', async ({ context, page }) => {
  await page.goto(`${edge.url}/`);
  await workerInControl(page);

  const redirected = await context.newPage();
  await redirected.goto(`${edge.url}/library`);
  await expect(redirected).toHaveURL(`${edge.url}/library/`);
  expect(lastRequest('/library')?.status).toBe(307);
  expect(await beaconTags(redirected)).toBe(1);

  const missing = await context.newPage();
  const res = await missing.goto(`${edge.url}/no-such-page/`);
  expect(res?.status()).toBe(404);
  await expect(missing.locator('h1').first()).toBeVisible();
  expect(await beaconTags(missing)).toBe(1);
});
