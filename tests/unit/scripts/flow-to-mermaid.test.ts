import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkMermaid, generateMermaid } from '../../../scripts/flow-to-mermaid';
import { walkFiles } from '../../../scripts/lib/io';

const REPO = join(__dirname, '..', '..', '..');
const FLOW = 'stripe-mpp-failure-policy-denied';
const STATE = 'x402-payment-lifecycle';
const OUT = 'src/generated/mermaid';
let root: string;

const write = (relPath: string, text: string): void => {
  const p = join(root, relPath);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
};
const copy = (relPath: string): void => write(relPath, readFileSync(join(REPO, relPath), 'utf8'));
/** Every generated file with its content: the check must leave them untouched. */
const snapshot = (): Record<string, string> => Object.fromEntries(walkFiles(join(root, 'src', 'generated')).map((p) => [p, readFileSync(p, 'utf8')]));

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'atlas-mermaid-'));
  copy(`src/content/flows/${FLOW}.json`);
  copy(`src/content/states/${STATE}.json`);
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('checkMermaid', () => {
  it('reports every output as missing before the first run, without writing', () => {
    const r = checkMermaid(root);
    expect(r.errors).toEqual([]);
    expect(r.total).toBe(3);
    expect(r.stale).toEqual([
      { path: `${OUT}/${FLOW}.mmd`, source: `src/content/flows/${FLOW}.json`, reason: 'missing' },
      { path: `${OUT}/${STATE}.mmd`, source: `src/content/states/${STATE}.json`, reason: 'missing' },
      { path: `${OUT}/index.json`, source: '', reason: 'missing' },
    ]);
    expect(existsSync(join(root, 'src', 'generated'))).toBe(false);
  });

  it('passes after a run and leaves the files untouched', () => {
    const g = generateMermaid(root);
    expect(g.errors).toEqual([]);
    expect(g.written).toEqual([`${OUT}/${FLOW}.mmd`, `${OUT}/${STATE}.mmd`, `${OUT}/index.json`]);
    const before = snapshot();
    const r = checkMermaid(root);
    expect(r.stale).toEqual([]);
    expect(r.total).toBe(3);
    expect(snapshot()).toEqual(before);
    // The outputs are deterministic: a second run writes nothing either.
    expect(generateMermaid(root).written).toEqual([]);
  });

  it('flags the outputs of an edited flow with its source path and does not rewrite them', () => {
    generateMermaid(root);
    const before = snapshot();
    const path = join(root, 'src', 'content', 'flows', `${FLOW}.json`);
    const flow = JSON.parse(readFileSync(path, 'utf8')) as { title: string };
    flow.title = 'A different title';
    writeFileSync(path, JSON.stringify(flow, null, 2));
    const r = checkMermaid(root);
    expect(r.errors).toEqual([]);
    expect(r.stale).toEqual([
      { path: `${OUT}/${FLOW}.mmd`, source: `src/content/flows/${FLOW}.json`, reason: 'differs from what the JSON produces' },
      { path: `${OUT}/index.json`, source: '', reason: 'differs from what the JSON produces' },
    ]);
    expect(snapshot()).toEqual(before);
    expect(generateMermaid(root).written).toEqual([`${OUT}/${FLOW}.mmd`, `${OUT}/index.json`]);
    expect(checkMermaid(root).stale).toEqual([]);
  });

  it('flags an output that no flow or state produces, and a run removes it', () => {
    generateMermaid(root);
    write(`${OUT}/orphan.mmd`, 'sequenceDiagram\n');
    const r = checkMermaid(root);
    expect(r.stale).toEqual([{ path: `${OUT}/orphan.mmd`, source: '', reason: 'no flow or state JSON produces it' }]);
    expect(existsSync(join(root, OUT, 'orphan.mmd'))).toBe(true);
    expect(generateMermaid(root).removed).toEqual([`${OUT}/orphan.mmd`]);
    expect(checkMermaid(root).stale).toEqual([]);
  });

  it('reports a file that does not parse and then leaves orphans alone', () => {
    generateMermaid(root);
    write(`${OUT}/orphan.mmd`, 'sequenceDiagram\n');
    write('src/content/flows/broken.json', '{ not json');
    const r = checkMermaid(root);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toContain('src/content/flows/broken.json');
    expect(r.stale).toEqual([]);
    expect(existsSync(join(root, OUT, 'orphan.mmd'))).toBe(true);
  });
});
