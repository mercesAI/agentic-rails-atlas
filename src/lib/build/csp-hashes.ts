/**
 * Astro integration: after `astro build`, hashes every inline executable
 * <script> in dist/**.html (island bootstrap, view transitions, theme
 * pre-paint) and writes them into the CSP of dist/_headers in place of the
 * {{INLINE_SCRIPT_HASHES}} token. This keeps `script-src` free of
 * 'unsafe-inline' and 'unsafe-eval' (ARCHITECTURE.md Section 11).
 * It also fails the build when a page has an inline module script: after a client-side
 * navigation into such a page, ClientRouter appends a data: module script to wait for it,
 * which script-src blocks. astro.config.mjs keeps processed scripts in files for that reason.
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

/** Inline module scripts (type="module" without src) in one HTML document. */
export function inlineModuleScripts(html: string): number {
  let count = 0;
  for (const m of html.matchAll(SCRIPT_RE)) {
    const attrs = m[1] ?? '';
    if (/\btype\s*=\s*["']?module\b/i.test(attrs) && !/\bsrc\s*=/.test(attrs) && (m[2] ?? '').trim()) count++;
  }
  return count;
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
        const withInlineModules: string[] = [];
        for (const file of await htmlFiles(root)) {
          const html = await readFile(file, 'utf8');
          for (const h of inlineScriptHashes(html)) hashes.add(h);
          if (inlineModuleScripts(html) > 0) withInlineModules.push(file.slice(root.length));
        }
        if (withInlineModules.length) {
          throw new Error(
            `inline module scripts in ${withInlineModules.slice(0, 5).join(', ')}: after a client-side navigation into such a page, ` +
              'ClientRouter appends a data: module script that script-src blocks (keep scripts in files, astro.config.mjs assetsInlineLimit)',
          );
        }
        const list = [...hashes].sort().join(' ');
        await writeFile(headersPath, headers.split(HASH_TOKEN).join(list));
        logger.info(`wrote ${hashes.size} inline script hashes into _headers`);
      },
    },
  };
}
