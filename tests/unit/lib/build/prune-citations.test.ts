import { describe, expect, it } from 'vitest';
import { pruneCitationPayload } from '../../../../src/lib/build/prune-citations';
import { serializeForScript, type CitationPayload } from '../../../../src/lib/citations';

const claim = (id: string, text = `Claim ${id}`): CitationPayload['claims'][number] => ({ id, text, confidence: 'verified', sources: ['src-a'], asOf: '2026-10-01' });
const source = { n: 1, id: 'src-a', url: 'https://example.org/a', title: 'A', publisher: 'Example', type: 'spec' as const, primary: true, accessed: '2026-10-01' };
const page = (body: string, claims: CitationPayload['claims']): string =>
  `<!doctype html><html><body>${body}<script type="application/json" id="atlas-citations">${serializeForScript({ sources: [source], claims })}</script></body></html>`;
const payloadOf = (html: string): CitationPayload =>
  JSON.parse(/id="atlas-citations">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '{}') as CitationPayload;

describe('pruneCitationPayload', () => {
  it('keeps the claims a marker or an island prop mentions and drops the rest, sources untouched', () => {
    const html = page(
      '<p>Text<sup class="cite"><a href="#src-a" data-cite="clm-x402-001 src-a">[1]</a></sup></p>' +
        '<astro-island props="{&quot;steps&quot;:[0,[{&quot;cite&quot;:[0,&quot;clm-ucp-007&quot;]}]]}"></astro-island>',
      [claim('clm-x402-001'), claim('clm-x402-002'), claim('clm-ucp-007'), claim('clm-ap2-100')],
    );
    const r = pruneCitationPayload(html)!;
    expect(payloadOf(r.html).claims.map((c) => c.id)).toEqual(['clm-x402-001', 'clm-ucp-007']);
    expect(payloadOf(r.html).sources).toEqual([source]);
    expect([r.claimsBefore, r.claimsAfter]).toEqual([4, 2]);
    expect(r.bytesAfter).toBeLessThan(r.bytesBefore);
    expect(r.html.replace(/id="atlas-citations">[\s\S]*?<\/script>/, '')).toBe(html.replace(/id="atlas-citations">[\s\S]*?<\/script>/, ''));
  });

  it('does not let a claim keep itself alive and matches whole ids only', () => {
    const r = pruneCitationPayload(page('<a data-cite="clm-x402-10">[2]</a>', [claim('clm-x402-1'), claim('clm-x402-10'), claim('clm-x402-100')]))!;
    expect(payloadOf(r.html).claims.map((c) => c.id)).toEqual(['clm-x402-10']);
  });

  it('keeps the script-safe escaping and returns the page unchanged when every claim is used', () => {
    const tricky = claim('clm-x402-001', 'Amounts < 1 and </script> & more');
    const html = page('<a data-cite="clm-x402-001">[1]</a>', [tricky, claim('clm-x402-002')]);
    const r = pruneCitationPayload(html)!;
    expect(r.html).not.toContain('</script> & more');
    expect(r.html).toContain('\\u003c/script\\u003e \\u0026 more');
    expect(payloadOf(r.html).claims).toEqual([tricky]);
    const again = pruneCitationPayload(r.html)!;
    expect(again.html).toBe(r.html);
    expect([again.claimsBefore, again.claimsAfter, again.bytesBefore]).toEqual([1, 1, again.bytesAfter]);
  });

  it('empties the claims of a page that cites only sources, and ignores a page without a payload', () => {
    const r = pruneCitationPayload(page('<a data-cite="src-a">[1]</a>', [claim('clm-x402-001')]))!;
    expect(payloadOf(r.html)).toEqual({ sources: [source], claims: [] });
    expect(pruneCitationPayload('<!doctype html><p>No drawer here</p>')).toBeNull();
  });

  it('throws on a payload that is not JSON, so the build leaves that page as it is', () => {
    expect(() => pruneCitationPayload('<script type="application/json" id="atlas-citations">{ nope</script>')).toThrow();
  });
});
