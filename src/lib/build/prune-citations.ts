/**
 * Astro integration: after `astro build`, drops from each page's citation
 * payload (`script#atlas-citations`, read by CitationDrawer) every claim whose
 * id appears nowhere else in that page.
 *
 * Pages hand `setPageSources` the full claims map so that any `<Cite>` can
 * resolve a claim to its sources, and Base.astro serializes the payload before
 * the page body renders, so the payload cannot know which claims the body
 * cites. Without this step every scenario and orbit page carried all 1,857
 * claims (about 440 KB each) while citing a handful or none. The built HTML
 * does know: the drawer resolves only the ids of a clicked `[data-cite]`
 * marker, and markers are either in the HTML or rendered by islands from props
 * that are in the HTML, so a claim id absent from the rest of the page can
 * never be asked for. Sources are left alone: their order gives the footer
 * numbers. JSON data blocks are not executable, so the CSP hashes
 * (csp-hashes.ts) do not cover this block.
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { serializeForScript, type CitationPayload } from '../citations';

const BLOCK_RE = /(<script type="application\/json" id="atlas-citations">)([\s\S]*?)(<\/script>)/;
/** Claim ids as the schema defines them (`^clm-[a-z0-9-]+$`), wherever they sit in the page. */
const CLAIM_ID_RE = /\bclm-[a-z0-9-]+/g;

export interface PruneResult {
  html: string;
  /** Claims in the payload before and after pruning. */
  claimsBefore: number;
  claimsAfter: number;
  /** Length of the JSON inside the block before and after pruning. */
  bytesBefore: number;
  bytesAfter: number;
}

/** The page with unreferenced claims removed from its citation payload; null when it has no payload. */
export function pruneCitationPayload(html: string): PruneResult | null {
  const m = BLOCK_RE.exec(html);
  if (!m) return null;
  const [block, open, json, close] = m as unknown as [string, string, string, string];
  const payload = JSON.parse(json) as CitationPayload;
  const rest = html.slice(0, m.index) + html.slice(m.index + block.length);
  const mentioned = new Set(rest.match(CLAIM_ID_RE) ?? []);
  const claims = payload.claims.filter((c) => mentioned.has(c.id));
  const next = claims.length === payload.claims.length ? json : serializeForScript({ ...payload, claims });
  return {
    html: next === json ? html : html.slice(0, m.index) + open + next + close + html.slice(m.index + block.length),
    claimsBefore: payload.claims.length,
    claimsAfter: claims.length,
    bytesBefore: json.length,
    bytesAfter: next.length,
  };
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

export default function pruneCitations(): AstroIntegration {
  return {
    name: 'atlas-prune-citations',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        let pages = 0;
        let before = 0;
        let after = 0;
        let dropped = 0;
        for (const file of await htmlFiles(fileURLToPath(dir))) {
          const html = await readFile(file, 'utf8');
          let r: PruneResult | null;
          try {
            r = pruneCitationPayload(html);
          } catch (err) {
            logger.warn(`${file}: citation payload left as is (${err instanceof Error ? err.message : String(err)})`);
            continue;
          }
          if (!r) continue;
          pages++;
          before += r.bytesBefore;
          after += r.bytesAfter;
          dropped += r.claimsBefore - r.claimsAfter;
          if (r.html !== html) await writeFile(file, r.html);
        }
        const mb = (n: number) => (n / 1024 / 1024).toFixed(2);
        logger.info(`dropped ${dropped} unreferenced claims from the citation payloads of ${pages} pages (${mb(before)} MB to ${mb(after)} MB)`);
      },
    },
  };
}
