import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  isBalanced,
  mdxParagraphToText,
  practitionerParagraphs,
  splitBodyHtml,
  splitBodySource,
  citeIdsIn,
} from '../../../src/components/protocol/lib/split-body';


const fixture = (name: string) => readFileSync(new URL(`../../fixtures/protocol/${name}`, import.meta.url), 'utf8');

describe('B and P body split', () => {
  it('splits rendered HTML at the Compare and compose heading and drops the heading', () => {
    const r = splitBodyHtml(fixture('body.html'));
    expect(r.found).toBe(true);
    expect(r.before).toContain('Problem and design goals');
    expect(r.before).not.toContain('composes with');
    expect(r.after).toBe('<p>The fixture composes with other fixtures.</p>');
  });

  it('keeps everything in B when the marker is missing', () => {
    const r = splitBodyHtml('<p>Only B.</p>');
    expect(r).toEqual({ before: '<p>Only B.</p>', after: '', found: false });
  });

  it('refuses to split inside an open element', () => {
    const html = '<div class="mode-block"><h2 id="compare-and-compose">Compare and compose</h2><p>x</p></div>';
    expect(splitBodyHtml(html).found).toBe(false);
    expect(isBalanced('<div><p>x</p>')).toBe(false);
  });

  it('splits the MDX source so section cites can be numbered', () => {
    const r = splitBodySource(fixture('body.mdx'));
    expect(r.found).toBe(true);
    expect(citeIdsIn(r.before)).toEqual(['clm-x402-001', 'clm-x402-002', 'src-fixture-two']);
    expect(citeIdsIn(r.after)).toEqual(['clm-x402-003']);
  });

  it('extracts practitioner paragraphs outside Mode blocks as plain text', () => {
    const paras = practitionerParagraphs(fixture('body.mdx'), 2);
    expect(paras).toHaveLength(2);
    expect(paras[0]).toMatch(/^The fixture protocol lets a client pay/);
    expect(paras[0]).not.toContain('Cite');
    expect(paras[1]).toContain('server answers with a challenge first and settles after the retry arrives.');
    expect(paras.join(' ')).not.toContain('vending');
  });

  it('cleans one paragraph', () => {
    expect(mdxParagraphToText('See [the spec](https://x.y) and `field_name`. <Cite ids="clm-a-1" />')).toBe(
      'See the spec and `field_name`.',
    );
  });
});
