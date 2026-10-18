/**
 * Registers /sw.js (written by scripts/build-sw.ts). Production only; failures are silent.
 * The worker does not skip waiting (a new build takes over once every open page is
 * closed), and the ClientRouter makes no hard navigations after the first one, so an
 * update check runs on astro:page-load at most once per UPDATE_INTERVAL_MS.
 */
const UPDATE_INTERVAL_MS = 10 * 60 * 1000;

export function registerServiceWorker(): void {
  try {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          let lastCheck = Date.now();
          document.addEventListener('astro:page-load', () => {
            if (Date.now() - lastCheck < UPDATE_INTERVAL_MS) return;
            lastCheck = Date.now();
            reg.update().catch(() => undefined);
          });
        })
        .catch(() => undefined);
    });
  } catch {
    // ignore
  }
}
