/**
 * src/firebase/messaging.ts
 * Firebase Cloud Messaging (FCM) — push notifications for Kompilot.
 * Handles permission request, token registration and incoming messages.
 */
import { getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { getFirebaseMessaging, FIREBASE_VAPID_KEY } from './client';

const FCM_TOKEN_KEY = 'kompilot_fcm_token';

// ── Permission request ───────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

// ── FCM Token ────────────────────────────────────────────────────────────────

export async function getFCMToken(): Promise<string | null> {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    // Ensure service worker is registered
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }

    const token = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY || undefined,
    });

    if (token) {
      localStorage.setItem(FCM_TOKEN_KEY, token);
      return token;
    }
    return null;
  } catch (e) {
    console.warn('[FCM] Failed to get token:', e);
    return null;
  }
}

export function getCachedFCMToken(): string | null {
  return localStorage.getItem(FCM_TOKEN_KEY);
}

export function clearFCMToken(): void {
  localStorage.removeItem(FCM_TOKEN_KEY);
}

// ── Foreground message listener ──────────────────────────────────────────────

export type FCMMessageHandler = (payload: MessagePayload) => void;

let _unsubscribeFCM: (() => void) | null = null;

export async function subscribeFCMMessages(handler: FCMMessageHandler): Promise<() => void> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return () => {};

  if (_unsubscribeFCM) _unsubscribeFCM();

  _unsubscribeFCM = onMessage(messaging, handler);
  return _unsubscribeFCM;
}

export function unsubscribeFCMMessages(): void {
  if (_unsubscribeFCM) {
    _unsubscribeFCM();
    _unsubscribeFCM = null;
  }
}

// ── Show browser notification ────────────────────────────────────────────────

export function showBrowserNotification(title: string, body: string, icon?: string): void {
  if (Notification.permission !== 'granted') return;
  const notification = new Notification(title, {
    body,
    icon: icon || '/favicon.svg',
    badge: '/favicon.svg',
  });
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

// ── Kompilot notification types ────────────────────────────────────────────

export type KompilotNotificationType =
  | 'new_review'
  | 'review_raid'
  | 'post_published'
  | 'geo_score_drop'
  | 'sms_reply'
  | 'inbox_message'
  | 'agency_alert';

export function handleFCMPayload(payload: MessagePayload): void {
  const { notification, data } = payload;
  if (!notification) return;

  const title = notification.title || 'Kompilot';
  const body = notification.body || '';
  const icon = notification.icon;

  showBrowserNotification(title, body, icon);

  // Dispatch custom event so React components can react
  window.dispatchEvent(new CustomEvent('kompilot:push-notification', {
    detail: { title, body, data, type: data?.type as KompilotNotificationType },
  }));
}
