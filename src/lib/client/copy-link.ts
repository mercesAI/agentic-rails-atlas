/** Adds a copy-link button to every h2[id] and h3[id] inside <main>. */

/** The live region is rendered statically in Base.astro (a region created at announcement time is often not read out); this is the fallback. */
function liveRegion(): HTMLElement {
  let live = document.getElementById('copy-link-live');
  if (!live) {
    live = document.createElement('div');
    live.id = 'copy-link-live';
    live.className = 'sr-only';
    live.setAttribute('aria-live', 'polite');
    document.body.append(live);
  }
  return live;
}

function announce(text: string): void {
  liveRegion().textContent = text;
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function initCopyLinks(root: ParentNode = document): void {
  liveRegion();
  const headings = root.querySelectorAll<HTMLHeadingElement>('main h2[id], main h3[id]');
  headings.forEach((h) => {
    if (h.querySelector('.copy-link') || h.closest('[data-no-copy-link]')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-link no-print';
    const name = (h.textContent ?? '').trim();
    btn.setAttribute('aria-label', `Copy link to ${name}`);
    btn.title = 'Copy link to this section';
    btn.textContent = '#';
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = `${location.origin}${location.pathname}#${h.id}`;
      const ok = await copy(url);
      // Keep the ClientRouter's state object: a null state makes the router ignore Back for this entry.
      if (!ok) history.replaceState(history.state, '', `#${h.id}`);
      btn.dataset.copied = 'true';
      announce(ok ? 'Link copied.' : 'Link added to the address bar.');
      window.setTimeout(() => delete btn.dataset.copied, 1600);
    });
    h.append(btn);
  });
}
