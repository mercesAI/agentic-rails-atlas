import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../../../../scripts/lib/io';

/**
 * public/_headers is copied to dist/ and applied by Cloudflare's assets host. These checks pin
 * three choices: the Web Analytics beacon host is allowed as a bare host (the edge loads
 * /beacon.min.js/<version> and a manual snippet would load /beacon.min.js; a host source
 * covers both), the beacon reports to this origin so connect-src stays 'self', and the
 * referrer policy in the header and in the page's meta tag agree. They also pin what keeps the
 * console free of policy errors: fonts and scripts come from files (astro.config.mjs), nothing
 * needs eval (client islands import no Zod) and Pagefind's wasm compiles under
 * 'wasm-unsafe-eval'.
 */
const headers = readFileSync(join(ROOT, 'public', '_headers'), 'utf8');
const base = readFileSync(join(ROOT, 'src', 'layouts', 'Base.astro'), 'utf8');

function headerValue(name: string): string {
  const line = headers.split('\n').find((l) => l.trim().toLowerCase().startsWith(`${name.toLowerCase()}:`));
  if (!line) throw new Error(`${name} not found in public/_headers`);
  return line.slice(line.indexOf(':') + 1).trim();
}

function directive(csp: string, name: string): string[] {
  const found = csp
    .split(';')
    .map((d) => d.trim().split(/\s+/))
    .find((parts) => parts[0] === name);
  if (!found) throw new Error(`${name} missing from the CSP`);
  return found.slice(1);
}

describe('public/_headers', () => {
  const csp = headerValue('Content-Security-Policy');

  it('allows the Cloudflare Web Analytics beacon host in script-src, as a bare host', () => {
    const sources = directive(csp, 'script-src');
    expect(sources).toContain('https://static.cloudflareinsights.com');
    expect(sources.filter((s) => s.includes('cloudflareinsights'))).toEqual(['https://static.cloudflareinsights.com']);
    expect(sources).toContain('{{INLINE_SCRIPT_HASHES}}');
  });

  it('keeps connect-src to this origin only', () => {
    expect(directive(csp, 'connect-src')).toEqual(["'self'"]);
  });

  it('keeps fonts and scripts to files: no data:, no unsafe-inline, no unsafe-eval', () => {
    expect(directive(csp, 'font-src')).toEqual(["'self'"]);
    const script = directive(csp, 'script-src');
    expect(script).not.toContain('data:');
    expect(script).not.toContain("'unsafe-inline'");
    expect(script).not.toContain("'unsafe-eval'");
    expect(headerValue('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  });

  it("lets Pagefind compile its wasm and start its worker, without 'unsafe-eval'", () => {
    expect(directive(csp, 'script-src')).toContain("'wasm-unsafe-eval'");
    expect(directive(csp, 'worker-src')).toEqual(["'self'"]);
  });

  it('uses the same referrer policy in the header and in the meta tag of Base.astro', () => {
    const header = headerValue('Referrer-Policy');
    const meta = /<meta name="referrer" content="([^"]+)"/.exec(base)?.[1];
    expect(header).toBe('same-origin');
    expect(meta).toBe(header);
  });
});

describe('public/robots.txt', () => {
  const robots = readFileSync(join(ROOT, 'public', 'robots.txt'), 'utf8');
  /** The rule lines of the group that names `agent` (RFC 9309: a crawler follows only its own group). */
  function rulesFor(agent: string): string[] {
    const groups = robots.split(/\n\s*\n/).map((g) => g.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')));
    const group = groups.find((g) => g.some((l) => l.toLowerCase() === `user-agent: ${agent.toLowerCase()}`));
    if (!group) throw new Error(`no group names ${agent}`);
    return group.filter((l) => !l.toLowerCase().startsWith('user-agent:'));
  }

  it('keeps /notes/ out for every named AI crawler, with Disallow first', () => {
    for (const agent of ['*', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'CCBot']) {
      expect(rulesFor(agent), agent).toEqual(['Disallow: /notes/', 'Allow: /']);
    }
  });

  it('lets Bingbot fetch /notes/ so it reads the noindex there', () => {
    expect(rulesFor('Bingbot')).toEqual(['Allow: /']);
  });
});
