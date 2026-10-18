/**
 * check-links.ts (ARCHITECTURE.md §9, ATLAS_PROMPT.md 14.1). Checks every URL in
 * src/content/sources/sources.json, every protocols/<slug>/resources.json and
 * src/content/publications/publications.json.
 *
 * HEAD first, then GET when HEAD is refused or fails; 3 retries with backoff
 * for network errors, 5xx and 429; at most 2 requests in flight per host with
 * 400 ms between requests to the same host.
 *   404 or 410                      -> failure
 *   403 or 429 from a host in scripts/verify/bot-blocking-hosts.json, or a
 *   Cloudflare challenge            -> warning
 *   other 4xx                       -> failure
 *   host not found (ENOTFOUND after the retries) -> failure
 *   5xx, timeouts, other network errors -> warning
 * Writes src/generated/link-report.json. Exits 1 on any failure.
 * Flags: --host <name> (only URLs on that host), --limit <n>, --concurrency <n> (global, default 8).
 */
import { join } from 'node:path';
import { z } from 'zod';
import { Publication, Source } from '../../src/lib/schemas.ts';
import { ROOT, checkedAtFor, isMain, listDir, parseArgs, readJson, rel, writeJsonIfChanged } from '../lib/io.ts';
import { loadJson, loadProtocol } from '../lib/content.ts';
import { type ProbeResult, probe, sleep } from '../lib/net.ts';

const PER_HOST = 2;
const HOST_SPACING_MS = 400;
const RETRIES = 3;
const TIMEOUT_MS = 20_000;
const UA = 'Mozilla/5.0 (compatible; agentic-rails-atlas-link-check; build-time verifier)';

export interface LinkTarget {
  url: string;
  refs: string[];
}

export interface LinkResult {
  url: string;
  host: string;
  status: number;
  method: 'HEAD' | 'GET' | '';
  outcome: 'ok' | 'warn' | 'fail';
  reason?: string;
  finalUrl?: string;
  refs: string[];
}

interface BotConfig {
  hosts: string[];
  /** URLs cited on purpose as evidence that something does not exist (a 404 there is the expected result). */
  expectedMissing?: string[];
  challengeHeaders?: Record<string, string>;
}

export function collectLinks(root: string): LinkTarget[] {
  const content = join(root, 'src', 'content');
  const map = new Map<string, Set<string>>();
  const add = (url: string | undefined, ref: string): void => {
    if (!url || !/^https?:\/\//.test(url)) return;
    if (!map.has(url)) map.set(url, new Set());
    map.get(url)!.add(ref);
  };
  for (const s of loadJson(join(content, 'sources', 'sources.json'), z.array(Source)).data ?? []) {
    add(s.url, s.id);
    add(s.archiveUrl, `${s.id} (archive)`);
  }
  for (const slug of listDir(join(content, 'protocols'))) {
    for (const r of loadProtocol(content, slug).sidecars.resources.data?.resources ?? []) add(r.url, r.id);
  }
  for (const p of loadJson(join(content, 'publications', 'publications.json'), z.array(Publication)).data ?? []) add(p.url, p.id);
  return [...map.entries()].map(([url, refs]) => ({ url, refs: [...refs].sort() })).sort((a, b) => a.url.localeCompare(b.url));
}

export function isBotBlockingHost(host: string, hosts: string[]): boolean {
  const h = host.toLowerCase().replace(/^www\./, '');
  return hosts.some((b) => h === b || h.endsWith(`.${b}`));
}

function request(url: string, method: 'HEAD' | 'GET'): Promise<ProbeResult> {
  return probe(url, {
    method,
    timeoutMs: TIMEOUT_MS,
    headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8' },
  });
}

/** Per-host limiter: at most PER_HOST in flight and HOST_SPACING_MS between starts. */
class HostGate {
  private inFlight = new Map<string, number>();
  private lastStart = new Map<string, number>();
  async run<T>(host: string, fn: () => Promise<T>): Promise<T> {
    for (;;) {
      const n = this.inFlight.get(host) ?? 0;
      const wait = (this.lastStart.get(host) ?? 0) + HOST_SPACING_MS - Date.now();
      if (n < PER_HOST && wait <= 0) break;
      await sleep(Math.max(wait, 50));
    }
    this.inFlight.set(host, (this.inFlight.get(host) ?? 0) + 1);
    this.lastStart.set(host, Date.now());
    try {
      return await fn();
    } finally {
      this.inFlight.set(host, (this.inFlight.get(host) ?? 1) - 1);
    }
  }
}

/** `code` is the system error code behind status 0 (ENOTFOUND, ECONNRESET, ...), when known. */
export function classify(status: number, host: string, headers: Headers, bot: BotConfig, code?: string): { outcome: LinkResult['outcome']; reason?: string } {
  if (status >= 200 && status < 400) return { outcome: 'ok' };
  const challenge = Object.entries(bot.challengeHeaders ?? {}).some(([k, v]) => headers.get(k)?.toLowerCase() === v.toLowerCase());
  if (status === 404 || status === 410) return { outcome: 'fail', reason: `HTTP ${status}` };
  if (status === 403 || status === 429) {
    if (challenge) return { outcome: 'warn', reason: `HTTP ${status} (Cloudflare challenge)` };
    if (isBotBlockingHost(host, bot.hosts)) return { outcome: 'warn', reason: `HTTP ${status} from a known bot-blocking host` };
    return { outcome: 'fail', reason: `HTTP ${status}` };
  }
  if (status === 0) {
    // A host that does not resolve after every retry is gone; resets, refusals and timeouts come and go.
    if (code === 'ENOTFOUND') return { outcome: 'fail', reason: 'host not found (ENOTFOUND)' };
    return { outcome: 'warn', reason: 'network error or timeout' };
  }
  if (status >= 500) return { outcome: 'warn', reason: `HTTP ${status} (server error)` };
  return { outcome: 'fail', reason: `HTTP ${status}` };
}

async function checkOne(t: LinkTarget, gate: HostGate, bot: BotConfig): Promise<LinkResult> {
  let host = '';
  try {
    host = new URL(t.url).hostname.toLowerCase();
  } catch {
    return { url: t.url, host, status: 0, method: '', outcome: 'fail', reason: 'invalid URL', refs: t.refs };
  }
  let last: ProbeResult & { method: 'HEAD' | 'GET' } = {
    status: 0,
    headers: new Headers(),
    finalUrl: t.url,
    method: 'HEAD',
  };
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt > 0) await sleep(1000 * 2 ** (attempt - 1));
    const head = await gate.run(host, () => request(t.url, 'HEAD'));
    last = { ...head, method: 'HEAD' };
    if (head.status >= 200 && head.status < 400) break;
    // Many servers refuse or mishandle HEAD: confirm with GET.
    const get = await gate.run(host, () => request(t.url, 'GET'));
    last = { ...get, method: 'GET' };
    const retryable = get.status === 0 || get.status === 429 || get.status >= 500;
    if (!retryable) break;
  }
  const c =
    (last.status === 404 || last.status === 410) && (bot.expectedMissing ?? []).includes(t.url)
      ? { outcome: 'ok' as const, reason: `HTTP ${last.status} (expected: cited as evidence of absence)` }
      : classify(last.status, host, last.headers, bot, last.code);
  return {
    url: t.url,
    host,
    status: last.status,
    method: last.method,
    outcome: c.outcome,
    ...(c.reason ? { reason: last.error ? `${c.reason}: ${last.error}` : c.reason } : {}),
    ...(last.finalUrl && last.finalUrl !== t.url ? { finalUrl: last.finalUrl } : {}),
    refs: t.refs,
  };
}

export async function checkLinks(options: { root?: string; host?: string; limit?: number; concurrency?: number } = {}): Promise<LinkResult[]> {
  const root = options.root ?? ROOT;
  const bot = readJson<BotConfig>(join(root, 'scripts', 'verify', 'bot-blocking-hosts.json')) ?? { hosts: [] };
  let targets = collectLinks(root);
  if (options.host) targets = targets.filter((t) => isBotBlockingHost(new URL(t.url).hostname, [options.host!.toLowerCase()]));
  if (options.limit) targets = targets.slice(0, options.limit);
  const gate = new HostGate();
  const results: LinkResult[] = [];
  let next = 0;
  const workers = Array.from({ length: Math.max(1, options.concurrency ?? 8) }, async () => {
    while (next < targets.length) {
      const t = targets[next++]!;
      results.push(await checkOne(t, gate, bot));
    }
  });
  await Promise.all(workers);
  return results.sort((a, b) => a.url.localeCompare(b.url));
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const root = args.values.get('root') ?? ROOT;
  const limit = args.values.get('limit');
  const conc = args.values.get('concurrency');
  checkLinks({ root, host: args.values.get('host'), limit: limit ? Number(limit) : undefined, concurrency: conc ? Number(conc) : undefined })
    .then((results) => {
      for (const r of results) {
        if (r.outcome === 'ok') continue;
        const line = `${r.url} [${r.refs.join(', ')}]: ${r.reason ?? r.status}`;
        if (r.outcome === 'fail') console.error(`fail: ${line}`);
        else console.warn(`warn: ${line}`);
      }
      const out = join(root, 'src', 'generated', 'link-report.json');
      writeJsonIfChanged(out, { checkedAt: checkedAtFor(out, results), results });
      const n = (o: LinkResult['outcome']): number => results.filter((r) => r.outcome === o).length;
      console.log(`check-links: ${results.length} URLs; ${n('ok')} ok, ${n('warn')} warnings, ${n('fail')} failures; report ${rel(root, out)}`);
      process.exit(n('fail') ? 1 : 0);
    })
    .catch((err: unknown) => {
      console.error(`check-links failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    });
}
