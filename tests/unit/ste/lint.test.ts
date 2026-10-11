import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STE_LABEL, lintSteSource, parseSteMdx } from '../../../src/lib/ste/lint';
import { checkApprovedWords, loadApprovedWords } from '../../../src/lib/ste/approved-words';
import { segmentParagraph } from '../../../src/lib/ste/segment';
import technicalNouns from '../../../src/lib/ste/technical-nouns.json';

const fixture = (name: string) => readFileSync(join(import.meta.dirname, '../../fixtures/ste', name), 'utf8');

describe('parseSteMdx', () => {
  it('reads frontmatter and the STE blocks', () => {
    const parsed = parseSteMdx(fixture('x402-exemplar.mdx'));
    expect(parsed.frontmatter.protocol).toBe('x402');
    expect(parsed.blocks.map((b) => b.type)).toEqual(['procedure', 'caution']);
    expect(parsed.blocks[0]?.title).toBe('Pay for a resource with x402 (client)');
    expect(parsed.blocks[0]?.units).toHaveLength(7);
    expect(parsed.blocks[0]?.units.every((u) => u.isStep)).toBe(true);
  });

  it('removes the signal word from a safety block', () => {
    const parsed = parseSteMdx('<SteNote>\nNOTE: The server keeps no state.\n</SteNote>');
    expect(parsed.blocks[0]?.units[0]?.text).toBe('The server keeps no state.');
  });

  it('checks only the definition in a terms list', () => {
    const parsed = parseSteMdx('<SteTerms>\n- **facilitator**: The service that settles a payment.\n</SteTerms>');
    expect(parsed.blocks[0]?.units[0]?.text).toBe('The service that settles a payment.');
  });

  it('ignores fenced code and comments', () => {
    const parsed = parseSteMdx('<SteDescription>\n```js\nconst x = 1; // doesn\'t\n```\n{/* draft */}\nThe server sends status 402.\n</SteDescription>');
    expect(parsed.blocks[0]?.units.map((u) => u.text)).toEqual(['The server sends status 402.']);
  });
});

describe('x402 STE exemplar (ATLAS_FOLLOWUP.md 3.1)', () => {
  const report = lintSteSource(fixture('x402-exemplar.mdx'), 'x402');
  it('lints with zero flags', () => {
    expect(report.flags).toEqual([]);
    expect(report.passed).toBe(true);
    expect(report.lengthPassed).toBe(true);
  });
  it('reports the sentence count, lengths and label', () => {
    expect(report.sentences).toBe(12);
    expect(report.maxProcedureWords).toBe(16);
    expect(report.maxDescriptiveWords).toBe(0);
    expect(report.label).toBe(STE_LABEL);
  });
});

describe('violations fixture', () => {
  const report = lintSteSource(fixture('violations.mdx'), 'fixture');
  const has = (rule: string, severity: string, blockType: string, text: string) =>
    report.flags.some((f) => f.rule === rule && f.severity === severity && f.blockType === blockType && f.text.startsWith(text));

  it('fails the length gate', () => {
    expect(report.lengthPassed).toBe(false);
    expect(report.passed).toBe(false);
    expect(report.maxProcedureWords).toBe(21);
    expect(report.maxDescriptiveWords).toBe(28);
  });

  it.each([
    ['contraction', 'error', 'description', 'The server doesn'],
    ['semicolon', 'error', 'description', 'The facilitator checks the signature;'],
    ['vague-modal', 'review', 'description', 'The server may return'],
    ['noun-cluster', 'warning', 'description', 'The client reads the payment channel'],
    ['ing-word', 'error', 'description', 'The facilitator is sending'],
    ['verb-form', 'error', 'description', 'The facilitator is sending'],
    ['passive-voice', 'warning', 'description', 'The payment is settled'],
    ['sentence-length', 'error', 'description', 'The client sends one request'],
    ['paragraph-length', 'error', 'description', 'One.'],
    ['imperative-start', 'error', 'procedure', 'The client sends the request'],
    ['passive-voice', 'error', 'procedure', 'The header is read'],
    ['ing-word', 'error', 'procedure', 'Start signing'],
    ['phrasal-verb', 'warning', 'procedure', 'Set up the wallet'],
    ['sentence-length', 'error', 'procedure', 'Send the request to the server and then'],
  ])('flags %s (%s) in the %s block', (rule, severity, blockType, text) => {
    expect(has(rule, severity, blockType, text)).toBe(true);
  });

  it('does not flag the clean note and the clean term definition', () => {
    expect(report.flags.filter((f) => f.blockType === 'note' || f.blockType === 'terms')).toEqual([]);
  });
});

describe('technical-noun list', () => {
  it('contains the x402 header names and payTo', () => {
    const all = [...technicalNouns.terms, ...technicalNouns.headers, ...technicalNouns.fields];
    for (const t of ['PAYMENT-REQUIRED', 'PAYMENT-SIGNATURE', 'PAYMENT-RESPONSE', 'payTo']) expect(all).toContain(t);
  });
});

describe('approved words (optional)', () => {
  it('returns null when the local file does not exist', () => {
    expect(loadApprovedWords(join(import.meta.dirname, 'no-such-root'))).toBeNull();
  });
  it('does nothing without a list', () => {
    const s = segmentParagraph('Send the request.')[0]!;
    expect(checkApprovedWords(s, { blockType: 'procedure', isStep: true }, null)).toEqual([]);
  });
  it('flags words that are not on a supplied list and skips technical nouns', () => {
    const s = segmentParagraph('Send the request to the facilitator quickly.')[0]!;
    const flags = checkApprovedWords(s, { blockType: 'procedure', isStep: true }, new Set(['send', 'the', 'request', 'to']));
    expect(flags.map((f) => f.message)).toEqual(['"quickly" is not in the local approved-word list or the technical-noun list.']);
  });
});
