/**
 * src/firebase/index.ts
 * Public API surface for Firebase integration in Kompilot.
 */
export { isFirebaseConfigured, getFirebaseApp, getFirebaseAnalytics, getFirebaseFirestore, getFirebaseMessaging } from './client';
export * from './analytics';
export * from './messaging';
export * from './firestore';
