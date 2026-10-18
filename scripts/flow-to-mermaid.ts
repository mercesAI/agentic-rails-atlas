/**
 * flow-to-mermaid.ts (ARCHITECTURE.md §9). For every flow in
 * src/content/flows/*.json emits a sequenceDiagram, and for every state machine
 * in src/content/states/*.json a stateDiagram-v2, to src/generated/mermaid/<id>.mmd.
 * Also writes src/generated/mermaid/index.json with ids, kinds, titles and the
 * accessible descriptions. Removes .mmd files whose source is gone.
 * Exits 1 when a flow or state file does not parse.
 *
 * Flags:
 *   --root <path>  project root (default: this repository)
 *   --check        generate every output in memory and compare it with the
 *                  committed file; exit 1 when a file is missing, differs or
 *                  has no source, without writing. `pnpm check` runs it before
 *                  the render check, since `pnpm diagrams` is not part of
 *                  `pnpm build`.
 */
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Flow, StateMachine } from '../src/lib/schemas.ts';
import { flowToSequenceDiagram, stateMachineToStateDiagram } from '../src/lib/flows/to-mermaid.ts';
import { describeFlow, describeFlowSteps, describeStateMachine, describeStateTransitions } from '../src/lib/flows/describe.ts';
import { ROOT, isMain, listDir, parseArgs, rel, stableJson, writeTextIfChanged } from './lib/io.ts';
import { loadJson } from './lib/content.ts';

export interface MermaidIndexEntry {
  id: string;
  kind: 'flow' | 'state';
  protocol: string;
  title: string;
  description: string;
  lines: string[];
  source: string;
}

/** What a run writes: every output path (absolute) with its text, in write order, plus the index entries and parse errors. */
export interface MermaidPlan {
  outDir: string;
  entries: MermaidIndexEntry[];
  errors: string[];
  files: Map<string, string>;
}

export function planMermaid(root: string = ROOT): MermaidPlan {
  const content = join(root, 'src', 'content');
  const outDir = join(root, 'src', 'generated', 'mermaid');
  const errors: string[] = [];
  const entries: MermaidIndexEntry[] = [];
  const files = new Map<string, string>();

  for (const f of listDir(join(content, 'flows')).filter((f) => f.endsWith('.json'))) {
    const l = loadJson(join(content, 'flows', f), Flow);
    if (!l.data) {
      errors.push(`${rel(root, l.path)}: ${l.error ?? 'unreadable'}`);
      continue;
    }
    const flow = l.data;
    const description = describeFlow(flow);
    files.set(join(outDir, `${flow.id}.mmd`), flowToSequenceDiagram(flow, { description }));
    entries.push({ id: flow.id, kind: 'flow', protocol: flow.protocol, title: flow.title, description, lines: describeFlowSteps(flow), source: rel(root, l.path) });
  }
  for (const f of listDir(join(content, 'states')).filter((f) => f.endsWith('.json'))) {
    const l = loadJson(join(content, 'states', f), StateMachine);
    if (!l.data) {
      errors.push(`${rel(root, l.path)}: ${l.error ?? 'unreadable'}`);
      continue;
    }
    const m = l.data;
    const description = describeStateMachine(m);
    files.set(join(outDir, `${m.id}.mmd`), stateMachineToStateDiagram(m, { description }));
    entries.push({ id: m.id, kind: 'state', protocol: m.protocol, title: m.title, description, lines: describeStateTransitions(m), source: rel(root, l.path) });
  }

  const ids = new Map<string, number>();
  for (const e of entries) ids.set(e.id, (ids.get(e.id) ?? 0) + 1);
  for (const [id, n] of ids) if (n > 1) errors.push(`duplicate diagram id ${id} across flows and states`);

  entries.sort((a, b) => a.id.localeCompare(b.id));
  files.set(join(outDir, 'index.json'), stableJson({ diagrams: entries }));
  return { outDir, entries, errors, files };
}

/** Committed .mmd files that no flow or state produces (absolute paths). */
function orphanOutputs(plan: MermaidPlan): string[] {
  return listDir(plan.outDir)
    .filter((f) => f.endsWith('.mmd'))
    .map((f) => join(plan.outDir, f))
    .filter((p) => !plan.files.has(p));
}

export function generateMermaid(root: string = ROOT): { entries: MermaidIndexEntry[]; errors: string[]; written: string[]; removed: string[] } {
  const plan = planMermaid(root);
  const written: string[] = [];
  const removed: string[] = [];
  for (const [path, text] of plan.files) if (writeTextIfChanged(path, text)) written.push(rel(root, path));
  // Stale outputs: only remove when every input parsed, so a typo never deletes a good diagram.
  if (!plan.errors.length) {
    for (const path of orphanOutputs(plan)) {
      rmSync(path);
      removed.push(rel(root, path));
    }
  }
  return { entries: plan.entries, errors: plan.errors, written, removed };
}

export interface StaleMermaid {
  /** Output path relative to the root. */
  path: string;
  /** The flow or state JSON it comes from; empty for index.json and for a file without a source. */
  source: string;
  reason: string;
}

/**
 * Staleness check for the committed outputs (`--check`): generates every file
 * in memory and compares it with the file on disk. Never writes.
 */
export function checkMermaid(root: string = ROOT): { entries: MermaidIndexEntry[]; errors: string[]; stale: StaleMermaid[]; total: number } {
  const plan = planMermaid(root);
  const sourceOf = new Map(plan.entries.map((e) => [join(plan.outDir, `${e.id}.mmd`), e.source]));
  const stale: StaleMermaid[] = [];
  for (const [path, text] of plan.files) {
    const source = sourceOf.get(path) ?? '';
    if (!existsSync(path)) stale.push({ path: rel(root, path), source, reason: 'missing' });
    else if (readFileSync(path, 'utf8') !== text) stale.push({ path: rel(root, path), source, reason: 'differs from what the JSON produces' });
  }
  // Orphans are only known when every input parsed (a write run removes them under the same condition).
  if (!plan.errors.length) {
    for (const path of orphanOutputs(plan)) stale.push({ path: rel(root, path), source: '', reason: 'no flow or state JSON produces it' });
  }
  return { entries: plan.entries, errors: plan.errors, stale, total: plan.files.size };
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const root = args.values.get('root') ?? ROOT;
  if (args.flags.has('check')) {
    const r = checkMermaid(root);
    for (const e of r.errors) console.error(`error: ${e}`);
    for (const s of r.stale) console.error(`stale: ${s.path}${s.source ? ` (from ${s.source})` : ''}: ${s.reason}`);
    const bad = r.errors.length + r.stale.length;
    console.log(
      `flow-to-mermaid --check: ${r.total} generated files; ${r.stale.length} stale, ${r.errors.length} errors` +
        (bad ? '. Run pnpm diagrams and commit src/generated.' : ''),
    );
    process.exit(bad ? 1 : 0);
  }
  const r = generateMermaid(root);
  for (const e of r.errors) console.error(`error: ${e}`);
  const flows = r.entries.filter((e) => e.kind === 'flow').length;
  console.log(
    `flow-to-mermaid: ${flows} flows, ${r.entries.length - flows} state machines; ${r.written.length} files written, ${r.removed.length} stale files removed`,
  );
  process.exit(r.errors.length ? 1 : 0);
}
