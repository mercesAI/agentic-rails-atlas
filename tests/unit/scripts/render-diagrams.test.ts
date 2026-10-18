import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkDiagrams, planDiagrams, renderDiagrams, type DiagramIndex } from '../../../scripts/render-diagrams';
import { launchBrowser } from '../../../scripts/lib/browser';
import { walkFiles } from '../../../scripts/lib/io';

// The render path needs a page that answers with an SVG; a stub stands in for Chromium so the suite stays browser-free.
vi.mock('../../../scripts/lib/browser', () => ({
  launchBrowser: vi.fn(async () => ({
    newPage: async () => ({
      on: () => undefined,
      goto: async () => undefined,
      waitForFunction: async () => undefined,
      evaluate: async (_fn: unknown, arg: { domId: string; text: string }) => ({ svg: `<svg data-id="${arg.domId}">${arg.text.length}</svg>` }),
    }),
    close: async () => undefined,
  })),
}));

const REPO = join(__dirname, '..', '..', '..');
const FONTS = ['ibm-plex-sans', 'bricolage-grotesque', 'jetbrains-mono'];
const OUT = 'src/generated/diagrams';
const HASH_REASON = 'source, theme, render config or Mermaid version changed since the last render';
let root: string;

const write = (relPath: string, text: string): void => {
  const p = join(root, relPath);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
};
/** Every generated file with its content: the check must leave them untouched. */
const snapshot = (): Record<string, string> => Object.fromEntries(walkFiles(join(root, 'src', 'generated')).map((p) => [p, readFileSync(p, 'utf8')]));
const readIndex = (): DiagramIndex => JSON.parse(readFileSync(join(root, OUT, 'index.json'), 'utf8')) as DiagramIndex;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'atlas-diagrams-'));
  write('src/styles/tokens.css', readFileSync(join(REPO, 'src', 'styles', 'tokens.css'), 'utf8'));
  write('node_modules/mermaid/package.json', '{"version":"12.1.0"}');
  for (const f of FONTS) write(`node_modules/@fontsource-variable/${f}/package.json`, '{"version":"5.3.0"}');
  write('src/content/diagrams/alpha.mmd', 'flowchart LR\n  a --> b\n');
  write('src/generated/mermaid/beta.mmd', 'sequenceDiagram\n  A->>B: hello\n');
  vi.mocked(launchBrowser).mockClear();
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('checkDiagrams', () => {
  it('reports every diagram with its source before the first render, without a browser or a write', () => {
    const before = snapshot();
    const r = checkDiagrams({ root });
    expect(r.total).toBe(2);
    expect(r.fresh).toEqual([]);
    expect(r.stale).toEqual([
      { id: 'alpha', source: 'src/content/diagrams/alpha.mmd', reason: 'not in index.json' },
      { id: 'beta', source: 'src/generated/mermaid/beta.mmd', reason: 'not in index.json' },
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

  it('flags a missing SVG file', async () => {
    await renderDiagrams({ root });
    rmSync(join(root, OUT, 'beta.dark.svg'));
    expect(checkDiagrams({ root }).stale).toEqual([{ id: 'beta', source: 'src/generated/mermaid/beta.mmd', reason: 'dark SVG missing' }]);
    rmSync(join(root, OUT, 'beta.light.svg'));
    expect(checkDiagrams({ root }).stale[0]?.reason).toBe('light and dark SVG missing');
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
    write('src/styles/tokens.css', `:root { --bg: #123456; }\n${readFileSync(join(root, 'src/styles/tokens.css'), 'utf8')}`);
    expect(checkDiagrams({ root }).stale.map((s) => s.id)).toEqual(['alpha', 'beta']);
  });

  it('flags index entries whose input is gone', async () => {
    await renderDiagrams({ root });
    rmSync(join(root, 'src/generated/mermaid/beta.mmd'));
    const r = checkDiagrams({ root });
    expect(r.total).toBe(1);
    expect(r.fresh).toEqual(['alpha']);
    expect(r.stale).toEqual([{ id: 'beta', source: 'src/generated/mermaid/beta.mmd', reason: 'input removed; a render drops the index entry and the SVG files' }]);
    expect(existsSync(join(root, OUT, 'beta.light.svg'))).toBe(true);
    // The render does what the check announced.
    expect((await renderDiagrams({ root })).removed).toEqual(['beta']);
    expect(existsSync(join(root, OUT, 'beta.light.svg'))).toBe(false);
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
    expect(checkDiagrams({ root }).stale.map((s) => s.reason)).toEqual(['not in index.json', 'not in index.json']);
  });
});
