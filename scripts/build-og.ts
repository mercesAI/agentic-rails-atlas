/**
 * Renders social preview images (1200 by 630 PNG) into public/og/ with the
 * system Chrome through Playwright: one default image and one per protocol.
 * Run once after content changes: `pnpm tsx scripts/build-og.ts`. The PNGs are
 * committed, so the normal build needs no browser.
 */
import { mkdirSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { SITE_URL } from '../src/lib/constants';

const HOST = new URL(SITE_URL).host;

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'public', 'og');
mkdirSync(OUT, { recursive: true });

const tokens = readFileSync(join(ROOT, 'src', 'styles', 'tokens.css'), 'utf8');
const token = (name: string, fallback: string) => new RegExp(`--${name}:\\s*([^;]+);`).exec(tokens)?.[1]?.trim() ?? fallback;
const FAMILY = { 'identity-trust': 'identity', 'authorization-intent': 'authorization', 'checkout-orders': 'checkout', 'payment-execution': 'payment' } as const;

type Fm = Record<string, string | undefined>;
function frontmatter(path: string): Fm {
  const m = /^---\n([\s\S]*?)\n---/.exec(readFileSync(path, 'utf8'));
  const fm: Fm = {};
  for (const line of (m?.[1] ?? '').split('\n')) {
    const kv = /^([a-zA-Z]+):\s*"?(.*?)"?\s*$/.exec(line);
    if (kv?.[1] && kv[2]) fm[kv[1]] = kv[2];
  }
  return fm;
}

function card(opts: { eyebrow: string; title: string; sub: string; mono?: string; hue?: string }): string {
  const bg = token('bg', '#0a0d14');
  const fg = token('fg', '#e7eaf0');
  const muted = token('fg-muted', '#a3acbe');
  const line = token('border-strong', '#35405a');
  const hue = opts.hue ?? token('accent', '#c9d4ff');
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:1200px;height:630px;background:${bg};color:${fg};font-family:'IBM Plex Sans','Helvetica Neue',Arial,sans-serif}
  .c{position:relative;width:1200px;height:630px;padding:72px 80px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden}
  .orbit{position:absolute;right:-180px;top:-120px;width:720px;height:720px;border:1px solid ${line};border-radius:50%;opacity:.7}
  .orbit2{position:absolute;right:-60px;top:40px;width:480px;height:480px;border:1px dashed ${line};border-radius:50%;opacity:.7}
  .dot{position:absolute;right:170px;top:150px;width:150px;height:150px;border-radius:50%;background:${hue};opacity:.9;box-shadow:0 0 0 14px ${bg},0 0 0 16px ${hue}}
  .mono{position:absolute;right:170px;top:150px;width:150px;height:150px;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',Menlo,monospace;font-weight:700;font-size:40px;color:${bg}}
  .eyebrow{font-family:'JetBrains Mono',Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;font-size:20px;color:${muted}}
  h1{font-size:${opts.title.length > 34 ? 56 : 68}px;line-height:1.05;margin:18px 0 0;max-width:760px;letter-spacing:-.02em;font-weight:700}
  .sub{font-size:28px;line-height:1.35;color:${muted};max-width:760px;margin-top:22px}
  .foot{display:flex;justify-content:space-between;align-items:flex-end;font-size:24px;color:${muted}}
  .foot b{color:${fg};font-weight:600}
  </style></head><body><div class="c"><div class="orbit"></div><div class="orbit2"></div><div class="dot"></div>${opts.mono ? `<div class="mono">${esc(opts.mono)}</div>` : ''}
  <div><div class="eyebrow">${esc(opts.eyebrow)}</div><h1>${esc(opts.title)}</h1><div class="sub">${esc(opts.sub)}</div></div>
  <div class="foot"><span><b>Agentic Rails Atlas</b> by merces.ai</span><span>${HOST}</span></div></div></body></html>`;
}

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const jobs: { file: string; html: string }[] = [
  {
    file: 'default.png',
    html: card({
      eyebrow: 'Research atlas',
      title: 'Agent identity, checkout and payment protocols, explained',
      sub: 'ERC-8004, x402, Visa TAP, ACP, UCP, MPP, AP2 and Mastercard Agent Pay. Sourced claims, diagrams, security and controls.',
    }),
  },
];
const protocolsDir = join(ROOT, 'src', 'content', 'protocols');
for (const slug of readdirSync(protocolsDir)) {
  const file = join(protocolsDir, slug, 'index.mdx');
  if (!existsSync(file)) continue;
  const fm = frontmatter(file);
  const fam = FAMILY[fm.family as keyof typeof FAMILY] ?? 'payment';
  jobs.push({
    file: `${slug}.png`,
    html: card({ eyebrow: `Protocol: ${fm.tagline ?? ''}`, title: fm.name ?? slug, sub: (fm.intro ?? '').split(/(?<=\.)\s/).slice(0, 2).join(' '), mono: fm.monogram, hue: token(`family-${fam}-fill`, '#c9d4ff') }),
  });
}
for (const job of jobs) {
  await page.setContent(job.html, { waitUntil: 'load' });
  await page.screenshot({ path: join(OUT, job.file), type: 'png' });
  console.log('wrote public/og/' + job.file);
}
await browser.close();
