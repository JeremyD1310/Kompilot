/**
 * src/firebase/swInit.ts
 * Sends Firebase config to the service worker (needed since SW can't access env vars).
 * Call this once on app boot when Firebase is configured.
 */
import { firebaseConfig, isFirebaseConfigured } from './client';

export async function initFirebaseServiceWorker(): Promise<void> {
  if (!isFirebaseConfigured()) return;
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    // Send config to SW
    const sw = registration.active || registration.installing || registration.waiting;
    if (sw) {
      sw.postMessage({ type: 'FIREBASE_CONFIG', config: firebaseConfig });
    }

    // Also send to existing SW via broadcast
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'FIREBASE_CONFIG',
        config: firebaseConfig,
      });
    }
  } catch (e) {
    console.warn('[Firebase SW] Registration failed:', e);
  }
}
