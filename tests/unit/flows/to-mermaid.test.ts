import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Flow, StateMachine } from '../../../src/lib/schemas';
import {
  escapeMermaidText,
  flowToSequenceDiagram,
  isResponseStep,
  makeIdFactory,
  stateMachineToStateDiagram,
} from '../../../src/lib/flows/to-mermaid';
import { describeFlow, describeFlowSteps, describeStateMachine } from '../../../src/lib/flows/describe';

const fixtures = join(__dirname, '..', '..', 'fixtures');
const flow = Flow.parse(JSON.parse(readFileSync(join(fixtures, 'flows', 'tricky-flow.json'), 'utf8')));
const machine = StateMachine.parse(JSON.parse(readFileSync(join(fixtures, 'states', 'tricky-state.json'), 'utf8')));

describe('escapeMermaidText', () => {
  it('escapes characters that break Mermaid statements', () => {
    expect(escapeMermaidText('a; b')).toBe('a#59; b');
    expect(escapeMermaidText('say "hi"')).toBe('say #quot;hi#quot;');
    expect(escapeMermaidText('{x}')).toBe('#123;x#125;');
    expect(escapeMermaidText('#tag 100%')).toBe('#35;tag 100#37;');
    expect(escapeMermaidText('<a>')).toBe('#lt;a#gt;');
  });
  it('keeps inner colons and escapes edge colons', () => {
    expect(escapeMermaidText('402: Payment Required')).toBe('402: Payment Required');
    expect(escapeMermaidText(':start')).toBe('#58;start');
    expect(escapeMermaidText('end:')).toBe('end#58;');
  });
  it('collapses newlines and never returns empty text', () => {
    expect(escapeMermaidText('a\nb\r\n c')).toBe('a b c');
    expect(escapeMermaidText('   ')).toBe('#32;');
  });
  it('does not double-escape its own entity codes', () => {
    expect(escapeMermaidText('#59;')).toBe('#35;59#59;');
  });
});

describe('makeIdFactory', () => {
  it('creates safe, stable and unique ids', () => {
    const id = makeIdFactory('p');
    expect(id('client-agent')).toBe('p_client_agent');
    expect(id('client agent')).toBe('p_client_agent_2');
    expect(id('client-agent')).toBe('p_client_agent');
    expect(id('end')).toBe('p_end');
    expect(id('---')).toBe('p_x');
  });
});

describe('isResponseStep', () => {
  const step = (n: number, from: string, to: string, label: string) => ({ n, from, to, label, detail: '' });
  it('detects status codes and reply verbs', () => {
    expect(isResponseStep(step(1, 'a', 'b', '402 Payment Required'))).toBe(true);
    expect(isResponseStep(step(1, 'a', 'b', 'Returns the receipt'))).toBe(true);
    expect(isResponseStep(step(1, 'a', 'b', 'Responds with a token'))).toBe(true);
    expect(isResponseStep(step(1, 'a', 'b', 'GET /resource'))).toBe(false);
  });
  it('treats a reversal of the previous step as a response', () => {
    expect(isResponseStep(step(2, 'b', 'a', 'Token'), step(1, 'a', 'b', 'Ask'))).toBe(true);
    expect(isResponseStep(step(2, 'b', 'c', 'Forward'), step(1, 'a', 'b', 'Ask'))).toBe(false);
  });
});

describe('flowToSequenceDiagram', () => {
  const out = flowToSequenceDiagram(flow, { description: describeFlow(flow) });
  const lines = out.trimEnd().split('\n');

  it('starts with the header, accessibility lines and autonumber', () => {
    expect(lines[0]).toBe('sequenceDiagram');
    expect(lines[1]).toMatch(/^ {2}accTitle: /);
    expect(lines[2]).toMatch(/^ {2}accDescr: /);
    expect(lines).toContain('  autonumber');
  });
  it('declares participants with safe ids and escaped labels', () => {
    expect(out).toContain('participant p_client_agent as Agent: client#59; v2');
    expect(out).toContain('participant p_end as Resource server #123;api#125;');
    expect(out).toContain('participant p_facilitator as Facilitator #quot;#35;1#quot;');
  });
  it('uses solid arrows for requests and dashed arrows for responses', () => {
    expect(out).toContain('p_client_agent->>p_end: GET /weather?city=Paris');
    expect(out).toContain('p_end-->>p_client_agent: 402 Payment Required: #123;accepts: #91;...#93;#125;');
    expect(out).toContain('p_facilitator-->>p_end: Settlement result #lt;txHash#gt;');
    expect(out).toContain('p_end-->>p_client_agent: 200 OK');
  });
  it('adds a note for trust-boundary crossings', () => {
    expect(out).toContain('Note over p_end,p_client_agent: Crosses a trust boundary');
  });
  it('wraps failures in alt and else blocks', () => {
    const alt = lines.findIndex((l) => l.trim() === 'alt Expected path');
    expect(alt).toBeGreaterThan(0);
    expect(lines[alt + 1]).toContain('Retry with PAYMENT-SIGNATURE header#59; 100#37; of price');
    expect(out).toContain('else signature invalid: #quot;bad sig#quot;');
    expect(out).toContain('Note over p_client_agent,p_end: Server responds 402 again#59; no funds move');
    expect(out).toContain('else end​');
    const end = lines.findIndex((l, i) => i > alt && l.trim() === 'end');
    expect(end).toBeGreaterThan(alt);
  });
  it('never leaks raw separators into statements', () => {
    for (const l of lines.slice(3)) {
      expect(l).not.toMatch(/;(?<!#\d+;|#[a-z]+;)/);
      expect(l).not.toMatch(/"/);
      expect(l).not.toMatch(/[{}]/);
    }
  });
  it('is deterministic', () => {
    expect(flowToSequenceDiagram(flow, { description: describeFlow(flow) })).toBe(out);
  });
  it('can omit failures and accessibility lines', () => {
    const plain = flowToSequenceDiagram(flow, { failures: false, accessibility: false });
    expect(plain).not.toContain('alt ');
    expect(plain).not.toContain('accTitle');
  });
});

describe('stateMachineToStateDiagram', () => {
  const out = stateMachineToStateDiagram(machine, { description: describeStateMachine(machine) });
  it('emits states, initial and terminal markers and labeled transitions', () => {
    expect(out.startsWith('stateDiagram-v2\n')).toBe(true);
    expect(out).toContain('state "ready #quot;for#quot; payment #123;x#125;" as s_ready');
    expect(out).toContain('[*] --> s_not_ready');
    expect(out).toContain('s_not_ready --> s_ready : POST /checkout_sessions/#123;id#125;: buyer details added');
    expect(out).toContain('s_ready --> s_completed : complete#59; payment token accepted');
    expect(out).toContain('s_completed --> [*]');
    expect(out).toContain('s_canceled --> [*]');
    expect(out).toContain('note right of s_completed : Order created: id returned#59; done');
  });
  it('uses the first state when none is marked initial', () => {
    const m = { ...machine, states: machine.states.map((s) => ({ ...s, initial: false })) };
    expect(stateMachineToStateDiagram(m)).toContain('[*] --> s_not_ready');
  });
});

describe('describe', () => {
  it('describes every flow step in order with failures and boundaries', () => {
    const steps = describeFlowSteps(flow);
    expect(steps).toHaveLength(6);
    expect(steps[0]).toBe('Step 1: Agent: client; v2 to Resource server {api}: GET /weather?city=Paris.');
    expect(steps[1]).toContain('crosses a trust boundary');
    expect(steps[2]).toContain('If signature invalid: "bad sig": Server responds 402 again; no funds move.');
    const text = describeFlow(flow);
    expect(text).toContain('3 participants');
    expect(text).toContain('6 steps, 1 crossing a trust boundary, 2 failure branches');
  });
  it('describes a state machine', () => {
    const text = describeStateMachine(machine);
    expect(text).toContain('4 states');
    expect(text).toContain('Starts in not_ready_for_payment.');
    expect(text).toContain('Ends in completed and canceled.');
    expect(text).toContain('(POST /checkout_sessions/{id})');
  });
  it('contains no em dash', () => {
    expect(describeFlow(flow) + describeStateMachine(machine)).not.toContain('—');
  });
});
