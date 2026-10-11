/** Nav behavior: menu toggle under 768 px, disclosure dropdowns, search button. Re-run on every page load. */

function setExpanded(btn: HTMLElement, open: boolean): void {
  btn.setAttribute('aria-expanded', String(open));
  const id = btn.getAttribute('aria-controls');
  const panel = id ? document.getElementById(id) : null;
  if (panel && btn.hasAttribute('data-disclosure')) panel.hidden = !open;
  if (panel && btn.hasAttribute('data-menu-toggle')) panel.classList.toggle('is-open', open);
}

function closeDisclosures(except?: Element): void {
  document.querySelectorAll<HTMLElement>('[data-disclosure][aria-expanded="true"]').forEach((b) => {
    if (b !== except) setExpanded(b, false);
  });
}

let globalBound = false;

export function initNav(): void {
  const root = document.querySelector<HTMLElement>('[data-nav]');
  if (!root || root.dataset.bound) return;
  root.dataset.bound = 'true';

  root.querySelectorAll<HTMLElement>('[data-disclosure]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      closeDisclosures(btn);
      setExpanded(btn, open);
    });
  });

  const menu = root.querySelector<HTMLElement>('[data-menu-toggle]');
  menu?.addEventListener('click', () => setExpanded(menu, menu.getAttribute('aria-expanded') !== 'true'));

  if (globalBound) return;
  globalBound = true;

  document.addEventListener('click', (e) => {
    const t = e.target as Element | null;
    const opener = t?.closest?.('[data-open-palette]');
    if (opener) {
      const mode = opener.getAttribute('data-open-palette') || 'search';
      document.dispatchEvent(new CustomEvent('atlas:open-palette', { detail: mode }));
      return;
    }
    if (!t?.closest?.('.site-nav__group')) closeDisclosures();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = document.querySelector<HTMLElement>('[data-disclosure][aria-expanded="true"]');
    if (open) {
      closeDisclosures();
      open.focus();
      return;
    }
    const m = document.querySelector<HTMLElement>('[data-menu-toggle][aria-expanded="true"]');
    if (m) {
      setExpanded(m, false);
      m.focus();
    }
  });
}
