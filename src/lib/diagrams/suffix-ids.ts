/**
 * Rewrites every id inside an SVG string, plus the url(#id), href="#id", aria id lists and
 * the #id selectors in its <style> block, with a suffix so several inlined Mermaid diagrams
 * (and the light and dark copies of one diagram) never share an id on one page.
 * Pure string work: used at build time (MermaidDiagram.astro) and in the browser for the
 * full-screen copy, which must stay unique next to the inline original.
 */
export function suffixIds(svg: string, suffix: string): string {
  const ids = new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1] as string));
  if (ids.size === 0) return svg;
  const has = (id: string): boolean => ids.has(id);
  return svg
    .replace(/\sid="([^"]+)"/g, (_m, id: string) => ` id="${id}${suffix}"`)
    .replace(/url\(#([^)]+)\)/g, (m, id: string) => (has(id) ? `url(#${id}${suffix})` : m))
    .replace(/(xlink:href|href)="#([^"]+)"/g, (m, attr: string, id: string) => (has(id) ? `${attr}="#${id}${suffix}"` : m))
    .replace(/(aria-labelledby|aria-describedby)="([^"]+)"/g, (_m, attr: string, list: string) =>
      `${attr}="${list.split(/\s+/).map((id) => (has(id) ? `${id}${suffix}` : id)).join(' ')}"`)
    // Mermaid scopes its theme CSS with the root id (#mmd-... .node rect {...}); keep those selectors in step.
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, (block) => block.replace(/#([A-Za-z_][\w-]*)(?![\w-])/g, (m, id: string) => (has(id) ? `#${id}${suffix}` : m)));
}
