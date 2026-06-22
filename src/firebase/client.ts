/**
 * src/firebase/client.ts
 * Firebase initialization for Kompilot.
 * Services: Analytics, FCM (Push Notifications), Firestore (real-time sync).
 *
 * Config is read from VITE_ env vars.
 * Falls back to graceful no-ops when env vars are missing (dev without Firebase).
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as analyticsSupported, type Analytics } from 'firebase/analytics';
import {
  getFirestore,
  enableIndexedDbPersistence,
  type Firestore,
} from 'firebase/firestore';
import { getMessaging, isSupported as messagingSupported, type Messaging } from 'firebase/messaging';

// ── Config from env vars ─────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || '',
};

export const FIREBASE_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

// ── Is Firebase configured? ──────────────────────────────────────────────────

export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

// ── Singleton app ────────────────────────────────────────────────────────────

let _app: FirebaseApp | null = null;
let _analytics: Analytics | null = null;
let _firestore: Firestore | null = null;
let _messaging: Messaging | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }
  _app = initializeApp(firebaseConfig);
  return _app;
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (_analytics) return _analytics;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    const supported = await analyticsSupported();
    if (!supported) return null;
    _analytics = getAnalytics(app);
    return _analytics;
  } catch (e) {
    console.warn('[Firebase] Analytics not available:', e);
    return null;
  }
}

let _persistenceEnabled = false;

export function getFirebaseFirestore(): Firestore | null {
  if (_firestore) return _firestore;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    _firestore = getFirestore(app);

    // ── Offline persistence (IndexedDB) ───────────────────────────────────────
    // Allows the app to serve cached data instantly on subsequent visits,
    // even before the network response arrives (reduces perceived load time).
    // enableIndexedDbPersistence must be called BEFORE any other Firestore ops.
    if (!_persistenceEnabled && typeof indexedDB !== 'undefined') {
      _persistenceEnabled = true;
      enableIndexedDbPersistence(_firestore).catch((err: { code: string }) => {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open — only one tab can have persistence at a time.
          // This is acceptable; the other tab still uses memory cache.
          console.warn('[Firestore] Persistence unavailable: multiple tabs open.');
        } else if (err.code === 'unimplemented') {
          // Browser doesn't support IndexedDB persistence (e.g. Safari private mode)
          console.warn('[Firestore] Persistence not supported in this browser.');
        }
      });
    }

    return _firestore;
  } catch (e) {
    console.warn('[Firebase] Firestore not available:', e);
    return null;
  }
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (_messaging) return _messaging;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    const supported = await messagingSupported();
    if (!supported) return null;
    _messaging = getMessaging(app);
    return _messaging;
  } catch (e) {
    console.warn('[Firebase] Messaging not available:', e);
    return null;
  }
}
