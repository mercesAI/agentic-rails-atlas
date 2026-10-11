import { describe, expect, it } from 'vitest';
import { countWords, protect, restore, segmentParagraph, splitSentences } from '../../../src/lib/ste/segment';

describe('protect', () => {
  it('keeps an inline code span as one placeholder', () => {
    const { text, map } = protect('Set `payment_requirements.maxAmountRequired` to the price.');
    expect(text.split(/\s+/)).toHaveLength(5);
    expect(restore(text, map)).toBe('Set `payment_requirements.maxAmountRequired` to the price.');
  });

  it('keeps a URL as one word and does not split a sentence on its dots', () => {
    const segs = segmentParagraph('Send the request to https://api.example.com/v1/pay. Read the response.');
    expect(segs).toHaveLength(2);
    expect(segs[0]?.words).toBe(5);
    expect(segs[0]?.text).toContain('https://api.example.com/v1/pay');
  });

  it('keeps header names as single words', () => {
    for (const header of ['PAYMENT-REQUIRED', 'PAYMENT-SIGNATURE', 'PAYMENT-RESPONSE', 'WWW-Authenticate', 'Signature-Input']) {
      const segs = segmentParagraph(`Read the ${header} header.`);
      expect(segs[0]?.words).toBe(4);
      expect(segs[0]?.text).toBe(`Read the ${header} header.`);
    }
  });

  it('keeps field names such as payTo and agentWallet as single words', () => {
    const { text, map } = protect('Compare payTo with agentWallet and check line_items.');
    expect(text).not.toMatch(/payTo|agentWallet|line_items/);
    expect(map.size).toBe(3);
  });

  it('keeps identifiers with digits and hyphens whole (ERC-8004, EIP-712, x402)', () => {
    const segs = segmentParagraph('An ERC-8004 registry uses EIP-712 signatures with x402.');
    expect(segs[0]?.words).toBe(8);
  });

  it('keeps a multi-word technical noun as one word', () => {
    expect(segmentParagraph('The Agentic Commerce Protocol defines a checkout session.')[0]?.words).toBe(5);
  });

  it('keeps a link label and drops the target', () => {
    const { text, map } = protect('Read the [x402 guide](https://example.com/guide) first.');
    expect(restore(text, map)).toBe('Read the x402 guide first.');
  });
});

describe('countWords', () => {
  it('counts a hyphenated word as one word', () => {
    expect(countWords('Use a condition-first sentence.')).toBe(4);
    expect(countWords('Use a well-known, one-time key.')).toBe(5);
  });

  it('counts a parenthetical as one word', () => {
    expect(countWords('The agent (the client software) sends the request.')).toBe(6);
  });

  it('counts a number with a unit as one word', () => {
    expect(countWords('Wait 30 seconds.')).toBe(2);
  });
});

describe('splitSentences', () => {
  it('splits on full stops followed by a capital letter', () => {
    expect(splitSentences('Decode the header. Find the option.')).toEqual(['Decode the header.', 'Find the option.']);
  });

  it('does not split after e.g. once it is protected', () => {
    expect(segmentParagraph('Use a stablecoin, e.g. USDC, for the payment.')).toHaveLength(1);
  });

  it('treats a trailing colon as a sentence end in list mode only', () => {
    expect(splitSentences('Do these steps: Read the header.', true)).toHaveLength(2);
    expect(splitSentences('Do these steps: Read the header.', false)).toHaveLength(1);
  });
});
