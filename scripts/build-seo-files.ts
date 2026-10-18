/**
 * After `astro build`: write dist/sitemap.xml, dist/llms.txt and rewrite the
 * Sitemap line of dist/robots.txt for the configured site origin.
 * Runs before build-sw.ts so the service worker can precache the new files.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILD_DATE, ORG_NAME, ORG_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../src/lib/constants';
import { SECTION_IDS } from '../src/lib/schemas';
import { readJson } from './lib/io';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const CONTENT = join(ROOT, 'src', 'content');

function walkHtml(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walkHtml(p));
    else if (e === 'index.html') out.push(p);
  }
  return out;
}

type Fm = Record<string, string | undefined>;
function frontmatter(path: string): Fm {
  const text = readFileSync(path, 'utf8');
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  const fm: Fm = {};
  if (!m) return fm;
  for (const line of (m[1] ?? '').split('\n')) {
    const kv = /^([a-zA-Z]+):\s*"?(.*?)"?\s*$/.exec(line);
    if (kv?.[1] && kv[2]) fm[kv[1]] = kv[2];
  }
  return fm;
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function lastmodFor(route: string): string {
  const p = /^\/p\/([^/]+)\/$/.exec(route);
  if (p?.[1]) return frontmatter(join(CONTENT, 'protocols', p[1], 'index.mdx')).lastVerified || BUILD_DATE;
  const s = /^\/scenarios\/([^/]+)\/$/.exec(route);
  if (s?.[1]) return frontmatter(join(CONTENT, 'scenarios', `${s[1]}.mdx`)).lastVerified || BUILD_DATE;
  const o = /^\/orbit\/([^/]+)\/$/.exec(route);
  if (o?.[1]) return frontmatter(join(CONTENT, 'orbit', `${o[1]}.mdx`)).lastVerified || BUILD_DATE;
  return BUILD_DATE;
}

function priorityFor(route: string): string {
  if (route === '/') return '1.0';
  if (route.startsWith('/p/')) return '0.9';
  if (/^\/(compare|scenarios|glossary|orbit|controls|stack)\/$/.test(route)) return '0.8';
  if (route.startsWith('/scenarios/') || route.startsWith('/orbit/')) return '0.7';
  return '0.5';
}

const routes = walkHtml(DIST)
  .map((f) => '/' + relative(DIST, f).replace(/index\.html$/, '').split('\\').join('/'))
  .filter((r) => r !== '/404/' && r !== '/notes/')
  .sort();

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes
  .map((r) => `  <url><loc>${escape(SITE_URL + r)}</loc><lastmod>${lastmodFor(r)}</lastmod><priority>${priorityFor(r)}</priority></url>`)
  .join('\n')}\n</urlset>\n`;
writeFileSync(join(DIST, 'sitemap.xml'), sitemap);

// llms.txt: a plain-text map of the site for AI assistants (llmstxt.org convention).
const protocols = readdirSync(join(CONTENT, 'protocols'))
  .filter((d) => existsSync(join(CONTENT, 'protocols', d, 'index.mdx')))
  .map((d): Fm & { slug: string } => ({ ...frontmatter(join(CONTENT, 'protocols', d, 'index.mdx')), slug: d }))
  .sort((a, b) => Number(a.order ?? 99) - Number(b.order ?? 99));
const scenarios = readdirSync(join(CONTENT, 'scenarios'))
  .filter((f) => f.endsWith('.mdx'))
  .map((f): Fm & { slug: string } => ({ ...frontmatter(join(CONTENT, 'scenarios', f)), slug: f.replace(/\.mdx$/, '') }))
  .sort((a, b) => Number(a.order ?? 99) - Number(b.order ?? 99));
const orbit = readdirSync(join(CONTENT, 'orbit'))
  .filter((f) => f.endsWith('.mdx'))
  .map((f): Fm & { slug: string } => ({ ...frontmatter(join(CONTENT, 'orbit', f)), slug: f.replace(/\.mdx$/, '') }))
  .filter((o) => o.starred === 'true')
  .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

// The figures quoted below come from the content files, not from the prose.
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const spell = (n: number): string => NUMBER_WORDS[n] ?? String(n);
const dimensions = readJson<{ dimensions: unknown[] }>(join(CONTENT, 'compare.json'))?.dimensions.length ?? 0;
const controls = (readJson<{ controls: { label: string }[] }>(join(CONTENT, 'controls-map.json'))?.controls ?? []).map((c) =>
  c.label.replace(/^[A-Z](?=[a-z])/, (ch) => ch.toLowerCase()),
);
const terms = (readJson<{ stub?: boolean }[]>(join(CONTENT, 'glossary', 'terms.json')) ?? []).filter((t) => !t.stub).length;
const personas = readdirSync(join(CONTENT, 'personas')).filter((f) => f.endsWith('.json')).length;

const llms = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

Published by ${ORG_NAME} (${ORG_URL}), the controls platform for agentic transactions. Built ${BUILD_DATE}.
Every factual statement on the site is a claim with a source record and a confidence level (verified, reported or unverified); numbers carry an "as of" date. Each protocol page has ${spell(SECTION_IDS.length)} sections: summary and key facts, a detailed explanation in four reading modes (plain language, practitioner, spec-deep and Simplified Technical English), diagrams and an interactive flow player, personas, resources, verified publications, a security threat model, a controls lens, compliance, an observability lens, ecosystem and costs, timeline, code, a browser-only playground simulation, comparison with the other ${spell(protocols.length - 1)} protocols, FAQ, open questions and a self-test.
When citing, link to the page URL and quote the "as of" date shown with any number. Content is not legal, financial or security advice.

## Protocol pages

${protocols.map((p) => `- [${p.name}](${SITE_URL}/p/${p.slug}/): ${p.intro ?? p.tagline ?? ''} (last verified ${p.lastVerified ?? BUILD_DATE})`).join('\n')}

## Cross-cutting pages

- [Compare](${SITE_URL}/compare/): the ${spell(protocols.length)} protocols on ${dimensions} dimensions, each cell with a value, confidence and sources.
- [Stack](${SITE_URL}/stack/): where each protocol sits, from discovery to reputation.
- [Controls](${SITE_URL}/controls/): ${spell(controls.length)} controls (${controls.join(', ')}) and how much each protocol provides natively.
- [Scenarios](${SITE_URL}/scenarios/): ${spell(scenarios.length)} end-to-end walkthroughs across protocols.
- [Timeline](${SITE_URL}/timeline/): every dated event, with lanes for standards, policy, market and prehistory.
- [Glossary](${SITE_URL}/glossary/): ${terms} terms with plain and Simplified Technical English definitions.
- [Library](${SITE_URL}/library/): specifications, SDKs, talks and verified research papers, exportable as BibTeX, RIS and CSV.
- [Orbit](${SITE_URL}/orbit/): related standards and programs.
- [Personas](${SITE_URL}/personas/): each protocol from ${spell(personas)} seats, from the delegating consumer to the agent itself.
- [Methodology](${SITE_URL}/methodology/): sources policy, verification method, claim counts by confidence, known gaps and errata.
- [What's new](${SITE_URL}/whats-new/): spec repository activity and events from the last 90 days.

## Scenarios

${scenarios.map((s) => `- [${s.title}](${SITE_URL}/scenarios/${s.slug}/): ${s.summary ?? ''}`).join('\n')}

## Related standards with their own page

${orbit.map((o) => `- [${o.name}](${SITE_URL}/orbit/${o.slug}/): ${o.oneLiner ?? ''}`).join('\n')}

## Optional

- [Sitemap](${SITE_URL}/sitemap.xml)
- [merces.ai](${ORG_URL})
`;
writeFileSync(join(DIST, 'llms.txt'), llms);

const robotsPath = join(DIST, 'robots.txt');
if (existsSync(robotsPath)) {
  writeFileSync(robotsPath, readFileSync(robotsPath, 'utf8').replace(/^Sitemap: .*$/m, `Sitemap: ${SITE_URL}/sitemap.xml`));
}
console.log(`build-seo-files: sitemap ${routes.length} urls, llms.txt ${protocols.length} protocols, ${scenarios.length} scenarios, ${orbit.length} orbit pages; site ${SITE_URL}`);
