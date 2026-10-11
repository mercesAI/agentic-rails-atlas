/** Registers /sw.js (written by scripts/build-sw.ts). Production only; failures are silent. */
export function registerServiceWorker(): void {
  try {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    });
  } catch {
    // ignore
  }
}
