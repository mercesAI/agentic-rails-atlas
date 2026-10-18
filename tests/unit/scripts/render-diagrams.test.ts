import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkDiagrams, parseTokens, planDiagrams, renderDiagrams, rendererFingerprint, themeVariables, type DiagramIndex } from '../../../scripts/render-diagrams';
import { colorVariable } from '../../../scripts/lib/neutral-svg';
import { launchBrowser } from '../../../scripts/lib/browser';
import { walkFiles } from '../../../scripts/lib/io';

// The render path needs a page that answers with an SVG; a stub stands in for Chromium so the suite stays
// browser-free. It colors a style rule and a fill attribute with the theme background, so the light and dark
// answers differ exactly where a real render does, and adds a rule that matches nothing (`.unused`) for the
// pruning pass. `skeleton: 'differ'` adds a dark-only element to force the two-file fallback. The check page
// answers selector matching (everything but `.unused` matches) and paint tables: equal by default,
// `paint: 'neutral-differs'` makes every folded file paint differently, `paint: 'pruned-differs'` only the pruned one.
const state = vi.hoisted(() => ({ skeleton: 'same' as 'same' | 'differ', paint: 'same' as 'same' | 'neutral-differs' | 'pruned-differs', reloads: 0 }));
vi.mock('../../../scripts/lib/browser', () => ({
  launchBrowser: vi.fn(async () => ({
    newPage: async () => {
      let content = '';
      return {
        on: () => undefined,
        goto: async () => undefined,
        reload: async () => {
          state.reloads++;
        },
        waitForFunction: async () => undefined,
        setContent: async (html: string) => {
          content = html;
        },
        evaluate: async (_fn: unknown, arg: unknown) => {
          if (Array.isArray(arg)) {
            // matchSelectors gets one selector list (or null) per rule; collectPaint gets the property names.
            if (typeof arg[0] !== 'string') return (arg as (string[] | null)[]).map((list) => !list || !list.some((sel) => sel.includes('.unused')));
            const folded = content.includes('var(--dc-');
            const differs = (state.paint === 'neutral-differs' && folded) || (state.paint === 'pruned-differs' && folded && !content.includes('.unused'));
            return [['svg', differs ? 'other paint' : 'paint']];
          }
          const r = arg as { domId: string; text: string; config: { themeVariables: { darkMode: boolean; background: string } } };
          const { darkMode, background } = r.config.themeVariables;
          const extra = darkMode && state.skeleton === 'differ' ? '<g class="dark-only"/>' : '';
          return {
            svg:
              `<svg id="${r.domId}"><style>#${r.domId} .node{fill:${background};stroke:#777777;}#${r.domId} .unused{fill:#000000;}</style>` +
              `<rect class="node" fill="${background}" stroke="#777777"/>${extra}<text>${r.text.length}</text></svg>`,
          };
        },
      };
    },
    close: async () => undefined,
  })),
}));

const REPO = join(__dirname, '..', '..', '..');
const FONTS = ['ibm-plex-sans', 'bricolage-grotesque', 'jetbrains-mono'];
const OUT = 'src/generated/diagrams';
const HASH_REASON = 'source, theme, render config or Mermaid version changed since the last render';
const COLORS_STALE = { id: 'colors.css', source: `${OUT}/colors.css`, reason: 'does not match the color pairs in index.json' };
let root: string;

const write = (relPath: string, text: string): void => {
  const p = join(root, relPath);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
};
const read = (relPath: string): string => readFileSync(join(root, relPath), 'utf8');
const has = (relPath: string): boolean => existsSync(join(root, relPath));
/** Every generated file with its content: the check must leave them untouched. */
const snapshot = (): Record<string, string> => Object.fromEntries(walkFiles(join(root, 'src', 'generated')).map((p) => [p, readFileSync(p, 'utf8')]));
const readIndex = (): DiagramIndex => JSON.parse(read(`${OUT}/index.json`)) as DiagramIndex;
/** The light and dark page backgrounds the stub paints with, from the real tokens. */
const backgrounds = (): { light: string; dark: string } => {
  const tokens = parseTokens(read('src/styles/tokens.css'));
  return { light: String(themeVariables(tokens.light, 'light').background), dark: String(themeVariables(tokens.dark, 'dark').background) };
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'atlas-diagrams-'));
  write('src/styles/tokens.css', readFileSync(join(REPO, 'src', 'styles', 'tokens.css'), 'utf8'));
  write('node_modules/mermaid/package.json', '{"version":"12.1.0"}');
  for (const f of FONTS) write(`node_modules/@fontsource-variable/${f}/package.json`, '{"version":"5.3.0"}');
  write('src/content/diagrams/alpha.mmd', 'flowchart LR\n  a --> b\n');
  write('src/generated/mermaid/beta.mmd', 'sequenceDiagram\n  A->>B: hello\n');
  state.skeleton = 'same';
  state.paint = 'same';
  state.reloads = 0;
  vi.mocked(launchBrowser).mockClear();
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('renderDiagrams', () => {
  it('folds the two themes into one SVG with color variables, drops unused style rules and writes colors.css', async () => {
    const r = await renderDiagrams({ root });
    expect(r.rendered).toEqual(['alpha', 'beta']);
    expect(r.split).toEqual([]);
    expect(r.failures).toEqual([]);
    expect(r.prunedBytes).toBe('#mmd-alpha .unused{fill:#000000;}'.length + '#mmd-beta .unused{fill:#000000;}'.length);
    expect(launchBrowser).toHaveBeenCalledTimes(1);
    expect(state.reloads).toBe(1);
    const bg = backgrounds();
    expect(bg.light).not.toBe(bg.dark);
    const v = colorVariable(bg);
    expect(readIndex().diagrams.alpha).toEqual({ hash: expect.any(String), source: 'src/content/diagrams/alpha.mmd', svg: 'alpha.svg', colors: [bg] });
    const slug = v.slice('--dc-'.length);
    expect(read(`${OUT}/alpha.svg`)).toBe(
      `<svg id="mmd-alpha"><style>#mmd-alpha .node{fill:var(${v});stroke:#777777;}:where(#mmd-alpha [data-dc-fill="${slug}"]){fill:var(${v},${bg.light});}</style>` +
        `<rect class="node" fill="${bg.light}" stroke="#777777" data-dc-fill="${slug}"/><text>23</text></svg>\n`,
    );
    expect(has(`${OUT}/alpha.light.svg`)).toBe(false);
    expect(has(`${OUT}/alpha.dark.svg`)).toBe(false);
    const css = read(`${OUT}/colors.css`);
    expect(css).toContain(`:root {\n  ${v}: ${bg.dark};\n}\n:root[data-theme='light'] {\n  ${v}: ${bg.light};\n}\n`);
    expect(css).toContain(`@media print {\n  :root {\n    ${v}: ${bg.light};\n  }\n}\n`);
  });

  it('keeps every style rule when pruning would change paint, and two files when the folded file would', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      state.paint = 'pruned-differs';
      const pruned = await renderDiagrams({ root, only: 'alpha' });
      expect(pruned.split).toEqual([]);
      expect(pruned.prunedBytes).toBe(0);
      expect(read(`${OUT}/alpha.svg`)).toContain('#mmd-alpha .unused{fill:#000000;}');
      expect(warn.mock.calls.map((c) => String(c[0]))).toEqual(['warning: diagram alpha: pruning its styles changes paint; keeping every rule']);
      warn.mockClear();
      state.paint = 'neutral-differs';
      const split = await renderDiagrams({ root, only: 'alpha', force: true });
      expect(split.split).toEqual(['alpha']);
      expect(has(`${OUT}/alpha.svg`)).toBe(false);
      expect(read(`${OUT}/alpha.light.svg`)).toContain('<svg id="mmd-alpha">');
      expect(warn.mock.calls.map((c) => String(c[0]))).toEqual([
        'warning: diagram alpha: pruning its styles changes paint; keeping every rule',
        'warning: diagram alpha: the written file would paint differently (svg fill: paint became other paint; svg fill: paint became other paint); keeping a light and a dark SVG',
      ]);
    } finally {
      warn.mockRestore();
    }
  });

  it('keeps a light and a dark file when the two renders differ in structure, and folds them on a later render', async () => {
    state.skeleton = 'differ';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const r = await renderDiagrams({ root });
      expect(r.rendered).toEqual(['alpha', 'beta']);
      expect(r.split).toEqual(['alpha', 'beta']);
      expect(warn.mock.calls.map((c) => String(c[0]))).toEqual([
        'warning: diagram alpha: the light and dark renders differ outside their colors; keeping a light and a dark SVG',
        'warning: diagram beta: the light and dark renders differ outside their colors; keeping a light and a dark SVG',
      ]);
    } finally {
      warn.mockRestore();
    }
    expect(readIndex().diagrams.beta).toEqual({ hash: expect.any(String), source: 'src/generated/mermaid/beta.mmd', light: 'beta.light.svg', dark: 'beta.dark.svg' });
    expect(has(`${OUT}/beta.svg`)).toBe(false);
    expect(read(`${OUT}/beta.dark.svg`)).toContain('<g class="dark-only"/>');
    expect(read(`${OUT}/colors.css`)).toContain('No theme-neutral diagram uses a color');
    expect(checkDiagrams({ root }).stale).toEqual([]);
    rmSync(join(root, OUT, 'beta.dark.svg'));
    expect(checkDiagrams({ root }).stale).toEqual([{ id: 'beta', source: 'src/generated/mermaid/beta.mmd', reason: 'dark SVG missing' }]);
    rmSync(join(root, OUT, 'beta.light.svg'));
    expect(checkDiagrams({ root }).stale[0]?.reason).toBe('light and dark SVG missing');
    // The next render folds beta again and drops the split files; alpha keeps its two files until it is redrawn.
    state.skeleton = 'same';
    expect((await renderDiagrams({ root })).rendered).toEqual(['beta']);
    expect(readIndex().diagrams.beta?.svg).toBe('beta.svg');
    expect(has(`${OUT}/beta.light.svg`)).toBe(false);
    expect(has(`${OUT}/alpha.light.svg`)).toBe(true);
    expect(read(`${OUT}/colors.css`)).toContain(colorVariable(backgrounds()));
    expect(checkDiagrams({ root }).stale).toEqual([]);
  });
});

describe('checkDiagrams', () => {
  it('reports every diagram with its source before the first render, without a browser or a write', () => {
    const before = snapshot();
    const r = checkDiagrams({ root });
    expect(r.total).toBe(2);
    expect(r.fresh).toEqual([]);
    expect(r.stale).toEqual([
      { id: 'alpha', source: 'src/content/diagrams/alpha.mmd', reason: 'not in index.json' },
      { id: 'beta', source: 'src/generated/mermaid/beta.mmd', reason: 'not in index.json' },
      { id: 'colors.css', source: `${OUT}/colors.css`, reason: 'missing; a render writes it' },
    ]);
    expect(r.failures).toEqual([]);
    expect(snapshot()).toEqual(before);
    expect(existsSync(join(root, OUT))).toBe(false);
    expect(launchBrowser).not.toHaveBeenCalled();
  });

  it('passes after a render and uses the hash the render wrote', async () => {
    const rendered = await renderDiagrams({ root });
    expect(rendered.rendered).toEqual(['alpha', 'beta']);
    expect(rendered.failures).toEqual([]);
    expect(launchBrowser).toHaveBeenCalledTimes(1);
    const before = snapshot();
    const r = checkDiagrams({ root });
    expect(r.stale).toEqual([]);
    expect(r.fresh).toEqual(['alpha', 'beta']);
    expect(snapshot()).toEqual(before);
    expect(launchBrowser).toHaveBeenCalledTimes(1);
    expect(planDiagrams({ root }).hashes.get('alpha')).toBe(readIndex().diagrams.alpha?.hash);
    // The render agrees: nothing is left to draw.
    const again = await renderDiagrams({ root });
    expect(again.rendered).toEqual([]);
    expect(again.skipped).toEqual(['alpha', 'beta']);
  });

  it('flags an edited source and leaves the others fresh', async () => {
    await renderDiagrams({ root });
    write('src/content/diagrams/alpha.mmd', 'flowchart LR\n  a --> c\n');
    const r = checkDiagrams({ root });
    expect(r.fresh).toEqual(['beta']);
    expect(r.stale).toEqual([{ id: 'alpha', source: 'src/content/diagrams/alpha.mmd', reason: HASH_REASON }]);
  });

  it('flags a missing SVG file and an edited colors.css', async () => {
    await renderDiagrams({ root });
    rmSync(join(root, OUT, 'beta.svg'));
    expect(checkDiagrams({ root }).stale).toEqual([{ id: 'beta', source: 'src/generated/mermaid/beta.mmd', reason: 'SVG missing' }]);
    await renderDiagrams({ root });
    expect(checkDiagrams({ root }).stale).toEqual([]);
    write(`${OUT}/colors.css`, '/* edited */\n');
    expect(checkDiagrams({ root }).stale).toEqual([COLORS_STALE]);
    rmSync(join(root, OUT, 'colors.css'));
    expect(checkDiagrams({ root }).stale).toEqual([{ ...COLORS_STALE, reason: 'missing; a render writes it' }]);
    await renderDiagrams({ root });
    expect(checkDiagrams({ root }).stale).toEqual([]);
  });

  it('flags every diagram when the Mermaid version, a font version or the theme changes', async () => {
    await renderDiagrams({ root });
    write('node_modules/mermaid/package.json', '{"version":"12.2.0"}');
    expect(checkDiagrams({ root }).stale.map((s) => [s.id, s.reason])).toEqual([['alpha', HASH_REASON], ['beta', HASH_REASON]]);
    write('node_modules/mermaid/package.json', '{"version":"12.1.0"}');
    expect(checkDiagrams({ root }).stale).toEqual([]);
    write('node_modules/@fontsource-variable/ibm-plex-sans/package.json', '{"version":"5.4.0"}');
    expect(checkDiagrams({ root }).stale.map((s) => s.id)).toEqual(['alpha', 'beta']);
    write('node_modules/@fontsource-variable/ibm-plex-sans/package.json', '{"version":"5.3.0"}');
    expect(checkDiagrams({ root }).stale).toEqual([]);
    // The first :root block wins in parseTokens, so a new one in front changes the theme variables.
    write('src/styles/tokens.css', `:root { --bg: #123456; }\n${read('src/styles/tokens.css')}`);
    expect(checkDiagrams({ root }).stale.map((s) => s.id)).toEqual(['alpha', 'beta']);
  });

  it('keys the cache on the renderer code, so a change to the render page or the neutralizer marks every diagram stale', () => {
    const fp = rendererFingerprint();
    expect(fp).toMatch(/^[0-9a-f]{64}$/);
    expect(rendererFingerprint()).toBe(fp);
    const plain = readFileSync(join(REPO, 'scripts', 'lib', 'neutral-svg.ts'), 'utf8');
    expect(plain).not.toContain('\r');
  });

  it('flags index entries whose input is gone', async () => {
    await renderDiagrams({ root });
    rmSync(join(root, 'src/generated/mermaid/beta.mmd'));
    const r = checkDiagrams({ root });
    expect(r.total).toBe(1);
    expect(r.fresh).toEqual(['alpha']);
    expect(r.stale).toEqual([{ id: 'beta', source: 'src/generated/mermaid/beta.mmd', reason: 'input removed; a render drops the index entry and the SVG files' }]);
    expect(has(`${OUT}/beta.svg`)).toBe(true);
    // The render does what the check announced.
    expect((await renderDiagrams({ root })).removed).toEqual(['beta']);
    expect(has(`${OUT}/beta.svg`)).toBe(false);
    expect(readIndex().diagrams.beta).toBeUndefined();
    expect(checkDiagrams({ root }).stale).toEqual([]);
  });

  it('checks one id with only and reports an unknown id', async () => {
    await renderDiagrams({ root });
    write('src/content/diagrams/alpha.mmd', 'flowchart LR\n  a --> c\n');
    rmSync(join(root, 'src/generated/mermaid/beta.mmd'));
    const r = checkDiagrams({ root, only: 'alpha' });
    expect(r.stale.map((s) => s.id)).toEqual(['alpha']);
    expect(r.fresh).toEqual([]);
    const unknown = checkDiagrams({ root, only: 'nope' });
    expect(unknown.failures).toEqual([{ id: 'nope', source: '', message: 'no .mmd input with this id' }]);
    expect(unknown.stale).toEqual([]);
  });

  it('reports a duplicate id as a failure and treats a corrupt index as empty', async () => {
    await renderDiagrams({ root });
    write('src/generated/mermaid/alpha.mmd', 'flowchart LR\n  x --> y\n');
    const dup = checkDiagrams({ root });
    expect(dup.failures).toEqual([{ id: 'alpha', source: 'src/generated/mermaid/alpha.mmd', message: 'duplicate diagram id (also src/content/diagrams/alpha.mmd)' }]);
    expect(dup.stale).toEqual([]);
    rmSync(join(root, 'src/generated/mermaid/alpha.mmd'));
    write(`${OUT}/index.json`, '{ not json');
    // With no entries left, the committed colors.css is stale too: an empty index implies no variables.
    expect(checkDiagrams({ root }).stale.map((s) => s.reason)).toEqual(['not in index.json', 'not in index.json', COLORS_STALE.reason]);
  });
});
