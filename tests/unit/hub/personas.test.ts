import { describe, expect, it } from 'vitest';
import { relevance, relevanceScore, roleSteps, RELEVANCE_LABELS } from '../../../src/components/hub/lib/personas';

const file = {
  personas: [{ persona: 'agent-dev' }],
  responsibilities: {
    columns: ['agent-dev', 'psp', 'consumer', 'issuer'],
    rows: [
      { step: 'Sign', marks: { 'agent-dev': 'owns', psp: '', consumer: 'relies-on' } },
      { step: 'Settle', marks: { psp: 'implements', consumer: 'observes' } },
    ],
  },
};

describe('persona relevance', () => {
  it('maps main personas, active marks and passive marks to levels', () => {
    expect(relevance('agent-dev', file)).toBe('high');
    expect(relevance('psp', file)).toBe('medium');
    expect(relevance('consumer', file)).toBe('low');
    expect(relevance('issuer', file)).toBe('none');
    expect(relevance('issuer', null)).toBe('unknown');
  });

  it('lists the steps where a persona has a mark', () => {
    expect(roleSteps('consumer', file)).toEqual([
      { step: 'Sign', mark: 'relies-on' },
      { step: 'Settle', mark: 'observes' },
    ]);
    expect(roleSteps('psp', null)).toEqual([]);
  });

  it('scores and labels every level in text', () => {
    expect(relevanceScore(['high', 'medium', 'low', 'none', 'unknown'])).toBe(6);
    for (const label of Object.values(RELEVANCE_LABELS)) expect(label.length).toBeGreaterThan(0);
  });
});
