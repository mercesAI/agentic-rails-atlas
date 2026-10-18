import { describe, expect, it } from 'vitest';
import { hashedDataFile } from '../../../src/lib/data-file';
import { flowPayloadFile, flowPlayerProps } from '../../../src/lib/flows/player-props';
import type { Flow } from '../../../src/lib/schemas';

const payload = (content: string) => ({ format: 'json' as const, content, illustrative: true as const });
const flow = {
  id: 'demo-flow',
  protocol: 'x402',
  title: 'Demo',
  specVersion: 'v2',
  specVersionDate: '2026-10-01',
  actors: [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
  ],
  sources: ['src-a', 'src-b'],
  // Out of order on purpose: the player shows the lowest n first.
  steps: [
    { n: 3, from: 'a', to: 'b', label: 'Three', detail: 'third', payload: payload('{"c":3}') },
    { n: 1, from: 'a', to: 'b', label: 'One', detail: 'first', payload: payload('{"a":1}') },
    { n: 2, from: 'b', to: 'a', label: 'Two', detail: 'second' },
  ],
} as unknown as Flow;

describe('flowPlayerProps', () => {
  it('keeps the first step payload, defers the others to a hashed file and keeps only the flow source numbers', () => {
    const p = flowPlayerProps(flow, { 'src-a': 4, 'src-b': 9, 'src-other': 1 });
    const byN = new Map(p.flow.steps.map((s) => [s.n, s]));
    expect(byN.get(1)?.payload).toEqual(payload('{"a":1}'));
    expect(byN.get(3)).not.toHaveProperty('payload');
    expect(byN.get(2)).not.toHaveProperty('payload');
    expect(p.deferred).toEqual([3]);
    expect(p.sourceIndex).toEqual({ 'src-a': 4, 'src-b': 9 });
    const file = flowPayloadFile(flow)!;
    expect(p.payloadsUrl).toBe(file.path);
    expect(file.path).toMatch(/^\/data\/flow-demo-flow\.[0-9a-f]{12}\.json$/);
    expect(JSON.parse(file.text)).toEqual({ 3: payload('{"c":3}') });
    // The input flow is left as it was.
    expect(flow.steps[0]).toHaveProperty('payload');
  });

  it('has no payload file when only the first step has a payload', () => {
    const single = { ...flow, steps: flow.steps.filter((s) => s.n !== 3) } as Flow;
    expect(flowPayloadFile(single)).toBeNull();
    expect(flowPlayerProps(single, {})).toMatchObject({ deferred: [], payloadsUrl: null, sourceIndex: {} });
  });
});

describe('hashedDataFile', () => {
  it('names the file after its content', () => {
    const a = hashedDataFile('library', [1, 2]);
    expect(a).toEqual({ file: expect.stringMatching(/^library\.[0-9a-f]{12}$/), path: `/data/${a.file}.json`, text: '[1,2]' });
    expect(hashedDataFile('library', [1, 2]).file).toBe(a.file);
    expect(hashedDataFile('library', [1, 3]).file).not.toBe(a.file);
  });
});
