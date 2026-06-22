/**
 * registerServiceWorker — registers /sw.js for offline caching.
 * Called once at app startup (main.tsx).
 * Silently skips if SW not supported or in dev mode.
 */

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  // Skip in dev (Vite HMR doesn't play well with SW)
  if (import.meta.env.DEV) {
    console.info('[SW] Skipping registration in dev mode');
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

      reg.addEventListener('updatefound', () => {
        const next = reg.installing;
        if (!next) return;
        next.addEventListener('statechange', () => {
          if (next.state === 'installed' && navigator.serviceWorker.controller) {
            // New SW waiting — show update prompt
            window.dispatchEvent(new CustomEvent('kompilot:sw:update-available'));
          }
        });
      });

      console.info('[SW] Registered successfully');
    } catch (err) {
      console.warn('[SW] Registration failed:', err);
    }
  });
}
