import { describe, expect, it } from 'vitest';
import { inlineModuleScripts, inlineScriptHashes } from '../../../../src/lib/build/csp-hashes';

describe('csp-hashes', () => {
  it('hashes inline executable scripts and skips external, data and empty ones', () => {
    const html =
      '<script>a()</script><script type="module">b()</script><script src="/x.js"></script>' +
      '<script type="application/json">{}</script><script type="application/ld+json">{}</script><script></script>';
    expect(inlineScriptHashes(html)).toHaveLength(2);
    expect(inlineScriptHashes(html)[0]).toMatch(/^'sha256-[A-Za-z0-9+/]+=*'$/);
  });

  it('counts inline module scripts, after which the router would append a data: module script', () => {
    expect(inlineModuleScripts('<script type="module">b()</script><script type=module>c()</script>')).toBe(2);
    expect(inlineModuleScripts('<script type="module" src="/_astro/x.js"></script>')).toBe(0);
    expect(inlineModuleScripts('<script>classic()</script><script type="module"> </script>')).toBe(0);
  });
});
