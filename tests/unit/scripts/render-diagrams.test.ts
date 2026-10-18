import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkDiagrams, parseTokens, planDiagrams, renderDiagrams, themeVariables, type DiagramIndex } from '../../../scripts/render-diagrams';
import { colorVariable } from '../../../scripts/lib/neutral-svg';
import { launchBrowser } from '../../../scripts/lib/browser';
import { walkFiles } from '../../../scripts/lib/io';

// The render path needs a page that answers with an SVG; a stub stands in for Chromium so the suite stays
// browser-free. It colors a style rule and a fill attribute with the theme background, so the light and dark
// answers differ exactly where a real render does; `skeleton: 'differ'` adds a dark-only element to force the
// two-file fallback.
const state = vi.hoisted(() => ({ skeleton: 'same' as 'same' | 'differ', reloads: 0 }));
vi.mock('../../../scripts/lib/browser', () => ({
  launchBrowser: vi.fn(async () => ({
    newPage: async () => ({
      on: () => undefined,
      goto: async () => undefined,
      reload: async () => {
        state.reloads++;
      },
      waitForFunction: async () => undefined,
      evaluate: async (_fn: unknown, arg: { domId: string; text: string; config: { themeVariables: { darkMode: boolean; background: string } } }) => {
        const { darkMode, background } = arg.config.themeVariables;
        const extra = darkMode && state.skeleton === 'differ' ? '<g class="dark-only"/>' : '';
        return {
          svg: `<svg id="${arg.domId}"><style>#${arg.domId} .node{fill:${background};stroke:#777777;}</style><rect fill="${background}" stroke="#777777"/>${extra}<text>${arg.text.length}</text></svg>`,
        };
      },
    }),
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
  state.reloads = 0;
  vi.mocked(launchBrowser).mockClear();
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('renderDiagrams', () => {
  it('folds the two themes into one SVG with color variables and writes colors.css', async () => {
    const r = await renderDiagrams({ root });
    expect(r.rendered).toEqual(['alpha', 'beta']);
    expect(r.split).toEqual([]);
    expect(r.failures).toEqual([]);
    expect(launchBrowser).toHaveBeenCalledTimes(1);
    expect(state.reloads).toBe(1);
    const bg = backgrounds();
    expect(bg.light).not.toBe(bg.dark);
    const v = colorVariable(bg);
    expect(readIndex().diagrams.alpha).toEqual({ hash: expect.any(String), source: 'src/content/diagrams/alpha.mmd', svg: 'alpha.svg', colors: [bg] });
    expect(read(`${OUT}/alpha.svg`)).toBe(
      `<svg id="mmd-alpha"><style>#mmd-alpha .node{fill:var(${v});stroke:#777777;}</style><rect fill="${bg.light}" stroke="#777777" style="fill:var(${v})"/><text>23</text></svg>\n`,
    );
    expect(has(`${OUT}/alpha.light.svg`)).toBe(false);
    expect(has(`${OUT}/alpha.dark.svg`)).toBe(false);
    const css = read(`${OUT}/colors.css`);
    expect(css).toContain(`:root {\n  ${v}: ${bg.dark};\n}\n:root[data-theme='light'] {\n  ${v}: ${bg.light};\n}\n`);
    expect(css).toContain(`@media print {\n  :root {\n    ${v}: ${bg.light};\n  }\n}\n`);
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
