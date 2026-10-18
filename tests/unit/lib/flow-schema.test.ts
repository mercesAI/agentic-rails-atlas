import { describe, expect, it } from 'vitest';
import { Flow } from '../../../src/lib/schemas';

const step = (n: number) => ({ n, from: 'a', to: 'b', label: `Step ${n}`, detail: 'detail' });
const flow = (steps: ReturnType<typeof step>[]) => ({
  id: 'demo',
  protocol: 'x402',
  title: 'Demo',
  specVersion: 'v2',
  specVersionDate: '2026-10-01',
  actors: [
    { id: 'a', label: 'A', kind: 'agent' },
    { id: 'b', label: 'B', kind: 'server' },
  ],
  steps,
  sources: ['src-a'],
});

describe('Flow schema', () => {
  it('requires step numbers to be unique, since they key the player order and the deferred payloads', () => {
    expect(Flow.safeParse(flow([step(1), step(2)])).success).toBe(true);
    const dup = Flow.safeParse(flow([step(1), step(1)]));
    expect(dup.success).toBe(false);
    expect(dup.error?.issues.map((i) => i.message)).toContain('step numbers must be unique within a flow');
  });
});
