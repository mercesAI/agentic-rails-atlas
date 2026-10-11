/** Site navigation links (sentence case). Protocol links come from the collection. */
export interface NavLink {
  href: string;
  label: string;
}

export const PRIMARY_LINKS: NavLink[] = [
  { href: '/compare/', label: 'Compare' },
  { href: '/stack/', label: 'Stack' },
  { href: '/controls/', label: 'Controls' },
  { href: '/scenarios/', label: 'Scenarios' },
  { href: '/timeline/', label: 'Timeline' },
  { href: '/glossary/', label: 'Glossary' },
  { href: '/library/', label: 'Library' },
];

export const MORE_LINKS: NavLink[] = [
  { href: '/personas/', label: 'Personas' },
  { href: '/orbit/', label: 'Orbit' },
  { href: '/learn/', label: 'Learn' },
  { href: '/notes/', label: 'Notes' },
  { href: '/whats-new/', label: "What's new" },
  { href: '/methodology/', label: 'Methodology' },
];

export function isCurrent(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href);
}
