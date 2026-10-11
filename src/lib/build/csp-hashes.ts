/**
 * Astro integration: after `astro build`, hashes every inline executable
 * <script> in dist/**.html (island bootstrap, view transitions, theme
 * pre-paint) and writes them into the CSP of dist/_headers in place of the
 * {{INLINE_SCRIPT_HASHES}} token. This keeps `script-src` free of
 * 'unsafe-inline' and 'unsafe-eval' (ARCHITECTURE.md Section 11).
 */
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

export const HASH_TOKEN = '{{INLINE_SCRIPT_HASHES}}';

const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const NON_EXEC_TYPES = /\btype\s*=\s*["']?(application\/(ld\+)?json|text\/template|text\/plain)/i;

/** sha256 CSP sources for inline executable scripts in one HTML document. */
export function inlineScriptHashes(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(SCRIPT_RE)) {
    const attrs = m[1] ?? '';
    const body = m[2] ?? '';
    if (/\bsrc\s*=/.test(attrs) || NON_EXEC_TYPES.test(attrs) || body.length === 0) continue;
    out.push(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
  }
  return out;
}

async function htmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (e) => {
      const p = join(dir, e.name);
      if (e.isDirectory()) return htmlFiles(p);
      return e.name.endsWith('.html') ? [p] : [];
    }),
  );
  return nested.flat();
}

export default function cspHashes(): AstroIntegration {
  return {
    name: 'atlas-csp-hashes',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const headersPath = join(root, '_headers');
        let headers: string;
        try {
          headers = await readFile(headersPath, 'utf8');
        } catch {
          logger.warn('dist/_headers not found; CSP hashes not written.');
          return;
        }
        const hashes = new Set<string>();
        for (const file of await htmlFiles(root)) {
          for (const h of inlineScriptHashes(await readFile(file, 'utf8'))) hashes.add(h);
        }
        const list = [...hashes].sort().join(' ');
        await writeFile(headersPath, headers.split(HASH_TOKEN).join(list));
        logger.info(`wrote ${hashes.size} inline script hashes into _headers`);
      },
    },
  };
}
