/**
 * Playwright Chromium launcher shared by the scripts that need a browser
 * (build-og.ts; render-diagrams.ts keeps its own copy for now). Tries, in
 * order: the executable named by PLAYWRIGHT_CHROMIUM_EXECUTABLE, the
 * Playwright-managed Chromium, then the installed Google Chrome.
 */
import { chromium, type Browser } from 'playwright';

export async function launchBrowser(options: { tag?: string } = {}): Promise<Browser> {
  const tag = options.tag ?? 'browser';
  const attempts: { label: string; run: () => Promise<Browser> }[] = [];
  const exe = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (exe) attempts.push({ label: exe, run: () => chromium.launch({ executablePath: exe }) });
  attempts.push({ label: 'Playwright Chromium', run: () => chromium.launch() });
  attempts.push({ label: 'installed Google Chrome', run: () => chromium.launch({ channel: 'chrome' }) });
  const errors: string[] = [];
  for (const a of attempts) {
    try {
      const browser = await a.run();
      console.log(`${tag}: using ${a.label}`);
      return browser;
    } catch (err) {
      errors.push(`${a.label}: ${(err instanceof Error ? err.message : String(err)).split('\n')[0]}`);
    }
  }
  throw new Error(`no Chromium available (run "pnpm exec playwright install chromium").\n  ${errors.join('\n  ')}`);
}
