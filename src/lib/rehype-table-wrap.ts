/**
 * Rehype plugin: wraps every bare Markdown `<table>` in a focusable, labeled scroll region
 * (`div.table-wrap`), so a wide table scrolls inside its own box instead of widening the page
 * and keyboard users can scroll it (WCAG 2.1.1). Tables already inside `.table-wrap` are left alone.
 */
interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

const hasClass = (n: HastNode, cls: string): boolean => {
  const c = n.properties?.className;
  return Array.isArray(c) ? c.includes(cls) : c === cls;
};

export default function rehypeTableWrap() {
  const walk = (node: HastNode, inWrap: boolean): void => {
    if (!node.children) return;
    node.children = node.children.map((child) => {
      if (child.type !== 'element') {
        // MDX JSX blocks (<Mode>, <Callout>) carry their own children; a table inside them still needs the wrapper.
        walk(child, inWrap);
        return child;
      }
      if (child.tagName === 'table' && !inWrap) {
        return {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-wrap'], role: 'region', ariaLabel: 'Table, scrolls sideways when wide', tabIndex: 0 },
          children: [child],
        };
      }
      walk(child, inWrap || hasClass(child, 'table-wrap'));
      return child;
    });
  };
  return (tree: HastNode): void => walk(tree, false);
}
