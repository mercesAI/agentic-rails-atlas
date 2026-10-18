/**
 * Pins a Mermaid SVG to its natural size, read from the viewBox, so text keeps the size it was
 * drawn at: Mermaid's own width="100%" and max-width would shrink the drawing to its container.
 * The figure then fits the drawing to the column as a preview or scrolls it sideways at actual
 * size. Pure string work, used at build time (MermaidDiagram.astro) and in the browser for the
 * drawings a figure loads as files.
 */
export function naturalSvg(svg: string): string {
  return svg.replace(/<svg\b[^>]*>/, (tag) => {
    const vb = /viewBox="\s*[-\d.]+[ ,]+[-\d.]+[ ,]+([\d.]+)[ ,]+([\d.]+)\s*"/.exec(tag);
    if (!vb) return tag;
    const w = Math.round(Number(vb[1]));
    const h = Math.round(Number(vb[2]));
    return tag
      .replace(/\swidth="[^"]*"/, '')
      .replace(/\sheight="[^"]*"/, '')
      // Mermaid's max-width would cap the drawing; any other declaration stays.
      .replace(/\sstyle="([^"]*)"/, (_m, css: string) => {
        const rest = css.replace(/max-width:[^;]*;?/g, '').trim();
        return rest ? ` style="${rest}"` : '';
      })
      .replace(/^<svg\b/, `<svg width="${w}" height="${h}" data-natural-width="${w}"`);
  });
}

/** The width and height naturalSvg wrote on the root element, or null for an SVG without them. */
export function naturalSize(svg: string): { w: number; h: number } | null {
  const tag = /<svg\b[^>]*>/.exec(svg)?.[0];
  const w = Number(tag && /\swidth="(\d+)"/.exec(tag)?.[1]);
  const h = Number(tag && /\sheight="(\d+)"/.exec(tag)?.[1]);
  return w > 0 && h > 0 ? { w, h } : null;
}
