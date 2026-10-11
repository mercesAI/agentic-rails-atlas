/**
 * flow-to-mermaid.ts (ARCHITECTURE.md §9). For every flow in
 * src/content/flows/*.json emits a sequenceDiagram, and for every state machine
 * in src/content/states/*.json a stateDiagram-v2, to src/generated/mermaid/<id>.mmd.
 * Also writes src/generated/mermaid/index.json with ids, kinds, titles and the
 * accessible descriptions. Removes .mmd files whose source is gone.
 * Exits 1 when a flow or state file does not parse.
 */
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { Flow, StateMachine } from '../src/lib/schemas.ts';
import { flowToSequenceDiagram, stateMachineToStateDiagram } from '../src/lib/flows/to-mermaid.ts';
import { describeFlow, describeFlowSteps, describeStateMachine, describeStateTransitions } from '../src/lib/flows/describe.ts';
import { ROOT, isMain, listDir, parseArgs, rel, writeJsonIfChanged, writeTextIfChanged } from './lib/io.ts';
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

export function generateMermaid(root: string = ROOT): { entries: MermaidIndexEntry[]; errors: string[]; written: string[]; removed: string[] } {
  const content = join(root, 'src', 'content');
  const outDir = join(root, 'src', 'generated', 'mermaid');
  const errors: string[] = [];
  const written: string[] = [];
  const removed: string[] = [];
  const entries: MermaidIndexEntry[] = [];

  const emit = (id: string, text: string): void => {
    const path = join(outDir, `${id}.mmd`);
    if (writeTextIfChanged(path, text)) written.push(rel(root, path));
  };

  for (const f of listDir(join(content, 'flows')).filter((f) => f.endsWith('.json'))) {
    const l = loadJson(join(content, 'flows', f), Flow);
    if (!l.data) {
      errors.push(`${rel(root, l.path)}: ${l.error ?? 'unreadable'}`);
      continue;
    }
    const flow = l.data;
    const description = describeFlow(flow);
    emit(flow.id, flowToSequenceDiagram(flow, { description }));
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
    emit(m.id, stateMachineToStateDiagram(m, { description }));
    entries.push({ id: m.id, kind: 'state', protocol: m.protocol, title: m.title, description, lines: describeStateTransitions(m), source: rel(root, l.path) });
  }

  const ids = new Map<string, number>();
  for (const e of entries) ids.set(e.id, (ids.get(e.id) ?? 0) + 1);
  for (const [id, n] of ids) if (n > 1) errors.push(`duplicate diagram id ${id} across flows and states`);

  // Stale outputs: only remove when every input parsed, so a typo never deletes a good diagram.
  if (!errors.length) {
    for (const f of listDir(outDir).filter((f) => f.endsWith('.mmd'))) {
      if (!ids.has(f.replace(/\.mmd$/, ''))) {
        rmSync(join(outDir, f));
        removed.push(rel(root, join(outDir, f)));
      }
    }
  }
  entries.sort((a, b) => a.id.localeCompare(b.id));
  const indexPath = join(outDir, 'index.json');
  if (writeJsonIfChanged(indexPath, { diagrams: entries })) written.push(rel(root, indexPath));
  return { entries, errors, written, removed };
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const r = generateMermaid(args.values.get('root') ?? ROOT);
  for (const e of r.errors) console.error(`error: ${e}`);
  const flows = r.entries.filter((e) => e.kind === 'flow').length;
  console.log(
    `flow-to-mermaid: ${flows} flows, ${r.entries.length - flows} state machines; ${r.written.length} files written, ${r.removed.length} stale files removed`,
  );
  process.exit(r.errors.length ? 1 : 0);
}
