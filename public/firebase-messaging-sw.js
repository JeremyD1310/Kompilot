/**
 * Firebase Cloud Messaging Service Worker for Kompilot.
 * Handles background push notifications.
 * This file MUST be served from the root path (public/).
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Firebase config hardcoded here — SW cannot access Vite env vars
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAi7xQWO-N0741VFtw4j8CaW4PJwhnPMfM",
  authDomain: "projet-app-c16a4.firebaseapp.com",
  projectId: "projet-app-c16a4",
  storageBucket: "projet-app-c16a4.firebasestorage.app",
  messagingSenderId: "405177240978",
  appId: "1:405177240978:web:1b39e0a8cf0f048afd054b",
  measurementId: "G-58L48L66DD",
};

// Initialize Firebase immediately (no need to wait for postMessage)
if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const { notification, data } = payload;
  const title = notification?.title || 'Kompilot';
  const options = {
    body: notification?.body || '',
    icon: notification?.icon || '/favicon.svg',
    badge: '/favicon.svg',
    data: data || {},
    tag: data?.type || 'kompilot',
    renotify: true,
  };
  self.registration.showNotification(title, options);
});

// Legacy: also accept config via postMessage for compatibility
let firebaseConfig = null;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    if (firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
      const messaging = firebase.messaging();

      // Handle background messages
      messaging.onBackgroundMessage((payload) => {
        const { notification, data } = payload;
        const title = notification?.title || 'Kompilot';
        const options = {
          body: notification?.body || '',
          icon: notification?.icon || '/favicon.svg',
          badge: '/favicon.svg',
          data: data || {},
          tag: data?.type || 'kompilot',
          renotify: true,
        };
        self.registration.showNotification(title, options);
      });
    }
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
