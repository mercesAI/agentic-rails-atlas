import { describe, expect, it } from 'vitest';
import { naturalSize, naturalSvg } from '../../../src/lib/diagrams/natural';

describe('naturalSvg', () => {
  it('replaces Mermaid width, height and max-width with the rounded viewBox size and keeps other styles', () => {
    const svg = '<svg id="m" width="100%" style="max-width: 1610.2px; --x: 1;" viewBox="0 0 1610.20703125 536.79998779"><g/></svg>';
    const out = naturalSvg(svg);
    expect(out).toBe('<svg width="1610" height="537" data-natural-width="1610" id="m" style="--x: 1;" viewBox="0 0 1610.20703125 536.79998779"><g/></svg>');
    expect(naturalSize(out)).toEqual({ w: 1610, h: 537 });
  });

  it('drops a style attribute that held only max-width and leaves an SVG without a viewBox alone', () => {
    expect(naturalSvg('<svg style="max-width: 10px;" viewBox="0 0 10 20"></svg>')).toBe('<svg width="10" height="20" data-natural-width="10" viewBox="0 0 10 20"></svg>');
    expect(naturalSvg('<svg width="100%"></svg>')).toBe('<svg width="100%"></svg>');
    expect(naturalSize('<svg width="100%"></svg>')).toBeNull();
  });
});
