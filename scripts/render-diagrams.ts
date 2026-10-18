/**
 * render-diagrams.ts (ARCHITECTURE.md §9, ATLAS_PROMPT.md 12.4). Renders every
 * Mermaid source in src/content/diagrams/*.mmd and src/generated/mermaid/*.mmd
 * to src/generated/diagrams/<id>.light.svg and <id>.dark.svg with Playwright
 * Chromium and the local Mermaid ESM build from node_modules (served by a tiny
 * local HTTP server; no network). Theme variables come from src/styles/tokens.css.
 *
 * Flags:
 *   --only <id>   render one diagram
 *   --force       ignore the content-hash cache
 *   --dir <path>  read .mmd inputs from this folder instead (fixtures, tests)
 *   --out <path>  write SVGs and index.json to this folder instead
 *
 * Skips unchanged inputs: src/generated/diagrams/index.json stores a hash of
 * the source, the theme variables and the Mermaid version. On a Mermaid syntax
 * error it prints the failing diagram id and exits 1 (the site build is not
 * affected: MermaidDiagram falls back to the source text).
 */
import { createServer, type Server } from 'node:http';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Browser } from 'playwright';
import { launchBrowser } from './lib/browser.ts';
import { ROOT, isMain, listDir, parseArgs, readJson, rel, sha256, writeJsonIfChanged, writeTextIfChanged } from './lib/io.ts';

// ---------------------------------------------------------------------------
// Tokens to Mermaid theme variables
// ---------------------------------------------------------------------------

export type TokenMap = Record<string, string>;

function declarations(block: string): TokenMap {
  const out: TokenMap = {};
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    if (m[1] && m[2]) out[m[1]] = m[2].trim();
  }
  return out;
}

/** Finds the body of the first top-level rule whose selector matches exactly. */
function ruleBody(css: string, selector: RegExp): string {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0;
  let start = 0;
  for (let i = 0; i < noComments.length; i++) {
    const ch = noComments[i];
    if (ch === '{') {
      if (depth === 0) {
        const sel = noComments.slice(start, i).trim();
        if (selector.test(sel)) {
          const close = noComments.indexOf('}', i);
          return noComments.slice(i + 1, close);
        }
      }
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) start = i + 1;
    } else if (ch === ';' && depth === 0) start = i + 1;
  }
  return '';
}

export function parseTokens(css: string): { dark: TokenMap; light: TokenMap; theme: TokenMap } {
  const theme = declarations(ruleBody(css, /^@theme$/));
  const dark = { ...theme, ...declarations(ruleBody(css, /^:root$/)) };
  const light = { ...dark, ...declarations(ruleBody(css, /^:root\[data-theme=['"]?light['"]?\]$/)) };
  return { dark, light, theme };
}

/** Resolves var(--x) references and keeps only colors Mermaid's color library can read. */
function resolveToken(tokens: TokenMap, name: string, fallback: string): string {
  let v = tokens[name];
  for (let i = 0; v && v.startsWith('var(') && i < 5; i++) {
    const ref = /var\((--[\w-]+)(?:\s*,\s*([^)]+))?\)/.exec(v);
    v = ref?.[1] ? (tokens[ref[1]] ?? ref[2]) : undefined;
  }
  return v && v !== 'transparent' ? v : fallback;
}

export function themeVariables(tokens: TokenMap, mode: 'light' | 'dark'): Record<string, string | boolean> {
  const t = (name: string, fallback: string): string => resolveToken(tokens, name, fallback);
  const bg = t('--bg', mode === 'dark' ? '#0a0d14' : '#f7f7f5');
  const node = t('--diagram-node-bg', t('--surface', bg));
  const border = t('--diagram-node-border', t('--border-strong', '#888888'));
  const text = t('--diagram-text', t('--fg', mode === 'dark' ? '#ffffff' : '#000000'));
  const line = t('--diagram-line', t('--fg-muted', '#888888'));
  const note = t('--diagram-note-bg', t('--surface-hover', node));
  const boundary = t('--diagram-boundary', t('--focus', '#c08a3e'));
  const muted = t('--fg-muted', line);
  const font = t('--font-body', "'IBM Plex Sans Variable', ui-sans-serif, system-ui, sans-serif");
  return {
    darkMode: mode === 'dark',
    background: bg,
    fontFamily: font,
    fontSize: '16px',
    primaryColor: node,
    primaryTextColor: text,
    primaryBorderColor: border,
    secondaryColor: t('--bg-elevated', node),
    secondaryTextColor: text,
    secondaryBorderColor: border,
    tertiaryColor: t('--bg-sunken', bg),
    tertiaryTextColor: text,
    tertiaryBorderColor: border,
    lineColor: line,
    textColor: text,
    mainBkg: node,
    nodeBorder: border,
    clusterBkg: t('--bg-elevated', node),
    clusterBorder: border,
    titleColor: text,
    edgeLabelBackground: node,
    noteBkgColor: note,
    noteTextColor: text,
    noteBorderColor: boundary,
    actorBkg: node,
    actorBorder: border,
    actorTextColor: text,
    actorLineColor: line,
    signalColor: text,
    signalTextColor: text,
    labelBoxBkgColor: note,
    labelBoxBorderColor: border,
    labelTextColor: text,
    loopTextColor: muted,
    activationBkgColor: note,
    activationBorderColor: border,
    sequenceNumberColor: t('--fg-inverse', bg),
    altBackground: note,
    stateLabelColor: text,
    stateBkg: node,
    compositeBackground: t('--bg-elevated', node),
    compositeTitleBackground: note,
    transitionColor: line,
    transitionLabelColor: text,
    specialStateColor: text,
    innerEndBackground: text,
  };
}

// ---------------------------------------------------------------------------
// Local server for Mermaid and fonts
// ---------------------------------------------------------------------------

const MIME: Record<string, string> = {
  '.mjs': 'text/javascript',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.html': 'text/html',
  '.map': 'application/json',
};

const FONT_PACKAGES = ['ibm-plex-sans', 'bricolage-grotesque', 'jetbrains-mono'];

function pageHtml(): string {
  const fontCss = FONT_PACKAGES.map((p) => `<link rel="stylesheet" href="/fonts/${p}/index.css">`).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8">${fontCss}</head><body><div id="work"></div>
<script type="module">
import mermaid from '/mermaid/mermaid.esm.min.mjs';
window.__renderMermaid = async (id, text, config) => {
  try {
    await document.fonts.ready;
    mermaid.initialize(config);
    await mermaid.parse(text);
    const { svg } = await mermaid.render(id, text, document.getElementById('work'));
    return { svg };
  } catch (err) {
    document.getElementById('work').innerHTML = '';
    const stray = document.getElementById('d' + id);
    if (stray) stray.remove();
    return { error: String((err && err.message) || err) };
  }
};
window.__ready = true;
</script></body></html>`;
}

function startServer(root: string): Promise<{ server: Server; origin: string }> {
  const mermaidDir = join(root, 'node_modules', 'mermaid', 'dist');
  const fontsDir = join(root, 'node_modules', '@fontsource-variable');
  const safeJoin = (base: string, sub: string): string | undefined => {
    const p = normalize(join(base, decodeURIComponent(sub)));
    return p.startsWith(base + sep) ? p : undefined;
  };
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let file: string | undefined;
    if (url.pathname === '/') {
      res.writeHead(200, { 'content-type': 'text/html' }).end(pageHtml());
      return;
    }
    if (url.pathname.startsWith('/mermaid/')) file = safeJoin(mermaidDir, url.pathname.slice('/mermaid/'.length));
    else if (url.pathname.startsWith('/fonts/')) file = safeJoin(fontsDir, url.pathname.slice('/fonts/'.length));
    if (!file || !existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
  });
  return new Promise((resolvePromise) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolvePromise({ server, origin: `http://127.0.0.1:${port}` });
    });
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Mermaid layout options shared by both themes (part of the cache key).
 * Diagrams are shown at natural size and opened full screen, so the settings
 * favor wide and readable over compact. Sequence messages are pre-wrapped by
 * src/lib/flows/to-mermaid.ts and Mermaid is told not to wrap again (it widens
 * the actor gap to fit the longest line instead). Flowchart labels wrap at
 * 300 px rather than Mermaid's 120 px default. State diagrams keep a 200 px
 * wrap (wider labels pushed self-loop labels into their neighbors) and get
 * more room between nodes and ranks, chosen by counting label overlaps over
 * the nine machines. The layout engine is dagre for every graph diagram: this
 * Mermaid build defaults to ELK, which ignores the spacing options and
 * stacked edge labels in the context diagrams.
 */
const RENDER_CONFIG = {
  layout: 'dagre',
  sequence: {
    useMaxWidth: true,
    mirrorActors: true,
    wrap: false,
    width: 180,
    actorMargin: 60,
    messageMargin: 40,
    boxMargin: 12,
    boxTextMargin: 6,
    noteMargin: 12,
    wrapPadding: 12,
    actorFontSize: 16,
    noteFontSize: 15,
    messageFontSize: 16,
    diagramMarginX: 24,
    diagramMarginY: 16,
  },
  flowchart: { useMaxWidth: true, htmlLabels: false, wrappingWidth: 300, nodeSpacing: 50, rankSpacing: 90, padding: 16 },
  state: { useMaxWidth: true, wrappingWidth: 200, nodeSpacing: 90, rankSpacing: 80 },
  class: { useMaxWidth: true },
};

export interface DiagramIndexEntry {
  hash: string;
  source: string;
  light: string;
  dark: string;
}
export interface DiagramIndex {
  mermaidVersion: string;
  diagrams: Record<string, DiagramIndexEntry>;
}

export interface RenderOptions {
  root?: string;
  only?: string;
  force?: boolean;
  inputDirs?: string[];
  outDir?: string;
}

export interface RenderResult {
  rendered: string[];
  skipped: string[];
  removed: string[];
  failures: { id: string; source: string; message: string }[];
  total: number;
}

export async function renderDiagrams(options: RenderOptions = {}): Promise<RenderResult> {
  const root = options.root ?? ROOT;
  const outDir = options.outDir ?? join(root, 'src', 'generated', 'diagrams');
  const inputDirs = options.inputDirs ?? [join(root, 'src', 'content', 'diagrams'), join(root, 'src', 'generated', 'mermaid')];
  const inputs = new Map<string, { path: string; text: string }>();
  const failures: RenderResult['failures'] = [];
  // Custom inputs with the default output folder would treat every committed diagram as stale and delete it.
  if (options.inputDirs && !options.outDir) {
    failures.push({ id: '', source: options.inputDirs.join(', '), message: '--dir needs --out: refusing to write fixture renders into src/generated/diagrams' });
    return { rendered: [], skipped: [], removed: [], failures, total: 0 };
  }
  for (const dir of inputDirs) {
    for (const f of listDir(dir).filter((f) => f.endsWith('.mmd'))) {
      const id = f.replace(/\.mmd$/, '');
      const path = join(dir, f);
      if (inputs.has(id)) {
        failures.push({ id, source: rel(root, path), message: `duplicate diagram id (also ${rel(root, inputs.get(id)!.path)})` });
        continue;
      }
      inputs.set(id, { path, text: readFileSync(path, 'utf8') });
    }
  }
  if (options.only && !inputs.has(options.only)) {
    failures.push({ id: options.only, source: '', message: 'no .mmd input with this id' });
    return { rendered: [], skipped: [], removed: [], failures, total: inputs.size };
  }

  const tokensCss = readFileSync(join(root, 'src', 'styles', 'tokens.css'), 'utf8');
  const tokens = parseTokens(tokensCss);
  const vars = { light: themeVariables(tokens.light, 'light'), dark: themeVariables(tokens.dark, 'dark') };
  const mermaidVersion = (readJson<{ version: string }>(join(root, 'node_modules', 'mermaid', 'package.json')) ?? { version: 'unknown' }).version;
  // Text metrics come from the self-hosted fonts, so a font update invalidates the cache too.
  const fontVersions = FONT_PACKAGES.map((p) => (readJson<{ version: string }>(join(root, 'node_modules', '@fontsource-variable', p, 'package.json')) ?? { version: 'unknown' }).version);
  const indexPath = join(outDir, 'index.json');
  let prev: DiagramIndex | undefined;
  try {
    prev = readJson<DiagramIndex>(indexPath);
  } catch {
    prev = undefined; // a corrupt index (merge conflict) is an empty cache, not a crash
  }
  const diagrams: Record<string, DiagramIndexEntry> = { ...(prev?.diagrams ?? {}) };
  const themeHash = sha256(JSON.stringify(vars) + JSON.stringify(RENDER_CONFIG) + mermaidVersion + fontVersions.join(','));

  const todo: string[] = [];
  const skipped: string[] = [];
  const hashes = new Map<string, string>();
  for (const [id, input] of [...inputs.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (options.only && id !== options.only) continue;
    const hash = sha256(input.text + themeHash);
    hashes.set(id, hash);
    const entry = diagrams[id];
    const fresh =
      !options.force && entry?.hash === hash && existsSync(join(outDir, `${id}.light.svg`)) && existsSync(join(outDir, `${id}.dark.svg`));
    if (fresh) skipped.push(id);
    else todo.push(id);
  }

  const rendered: string[] = [];
  if (todo.length) {
    const { server, origin } = await startServer(root);
    let browser: Browser | undefined;
    try {
      browser = await launchBrowser({ tag: 'render-diagrams' });
      const page = await browser.newPage();
      const consoleErrors: string[] = [];
      page.on('pageerror', (e) => consoleErrors.push(e.message));
      await page.goto(origin, { waitUntil: 'load' });
      await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true, null, { timeout: 30_000 });
      for (const id of todo) {
        const input = inputs.get(id)!;
        const svgs: Partial<Record<'light' | 'dark', string>> = {};
        let failed = false;
        for (const mode of ['light', 'dark'] as const) {
          const config = {
            startOnLoad: false,
            securityLevel: 'strict',
            theme: 'base',
            fontFamily: vars[mode].fontFamily,
            themeVariables: vars[mode],
            ...RENDER_CONFIG,
          };
          const domId = `mmd-${id}-${mode}`;
          const r = await page.evaluate(
            async ({ domId, text, config }) =>
              (window as unknown as { __renderMermaid: (i: string, t: string, c: unknown) => Promise<{ svg?: string; error?: string }> }).__renderMermaid(
                domId,
                text,
                config,
              ),
            { domId, text: input.text, config },
          );
          if (r.error || !r.svg) {
            failures.push({ id, source: rel(root, input.path), message: (r.error ?? 'empty SVG').split('\n').slice(0, 4).join(' | ') });
            failed = true;
            break;
          }
          svgs[mode] = r.svg;
        }
        if (failed) continue;
        writeTextIfChanged(join(outDir, `${id}.light.svg`), `${svgs.light}\n`);
        writeTextIfChanged(join(outDir, `${id}.dark.svg`), `${svgs.dark}\n`);
        diagrams[id] = {
          hash: hashes.get(id)!,
          source: rel(root, input.path),
          light: `${id}.light.svg`,
          dark: `${id}.dark.svg`,
        };
        rendered.push(id);
      }
      if (consoleErrors.length) console.warn(`warning: page errors: ${consoleErrors.join(' | ')}`);
    } finally {
      await browser?.close();
      server.close();
    }
  }

  // Remove outputs whose inputs are gone (full runs only).
  const removed: string[] = [];
  if (!options.only) {
    for (const id of Object.keys(diagrams)) {
      if (inputs.has(id)) continue;
      delete diagrams[id];
      for (const v of ['light', 'dark']) {
        const p = join(outDir, `${id}.${v}.svg`);
        if (existsSync(p)) rmSync(p);
      }
      removed.push(id);
    }
  }
  const sorted = Object.fromEntries(Object.entries(diagrams).sort(([a], [b]) => a.localeCompare(b)));
  writeJsonIfChanged(indexPath, { mermaidVersion, diagrams: sorted } satisfies DiagramIndex);
  return { rendered, skipped, removed, failures, total: inputs.size };
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const root = args.values.get('root') ?? ROOT;
  const dir = args.values.get('dir');
  const out = args.values.get('out');
  renderDiagrams({
    root,
    only: args.values.get('only'),
    force: args.flags.has('force'),
    inputDirs: dir ? [resolve(dir)] : undefined,
    outDir: out ? resolve(out) : undefined,
  })
    .then((r) => {
      for (const f of r.failures) console.error(`error: diagram ${f.id}${f.source ? ` (${f.source})` : ''}: ${f.message}`);
      console.log(
        `render-diagrams: ${r.total} inputs; ${r.rendered.length} rendered, ${r.skipped.length} unchanged, ${r.removed.length} removed, ${r.failures.length} failed`,
      );
      process.exit(r.failures.length ? 1 : 0);
    })
    .catch((err: unknown) => {
      console.error(`render-diagrams failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    });
}
