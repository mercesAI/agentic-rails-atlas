/**
 * Regenerates tests/fixtures/diagrams/*.mmd from the flow and state fixtures.
 * Used to exercise render-diagrams.ts without touching src/content.
 * Run: pnpm exec tsx scripts/lib/write-fixture-diagrams.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Flow, StateMachine } from '../../src/lib/schemas.ts';
import { flowToSequenceDiagram, stateMachineToStateDiagram } from '../../src/lib/flows/to-mermaid.ts';
import { describeFlow, describeStateMachine } from '../../src/lib/flows/describe.ts';
import { ROOT, writeTextIfChanged } from './io.ts';

const fx = join(ROOT, 'tests', 'fixtures');
const flow = Flow.parse(JSON.parse(readFileSync(join(fx, 'flows', 'tricky-flow.json'), 'utf8')));
const machine = StateMachine.parse(JSON.parse(readFileSync(join(fx, 'states', 'tricky-state.json'), 'utf8')));
writeTextIfChanged(join(fx, 'diagrams', 'fixture-sequence.mmd'), flowToSequenceDiagram(flow, { description: describeFlow(flow) }));
writeTextIfChanged(join(fx, 'diagrams', 'fixture-state.mmd'), stateMachineToStateDiagram(machine, { description: describeStateMachine(machine) }));
console.log('fixture diagrams written');
