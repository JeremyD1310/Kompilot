/**
 * useFirebaseMessaging — React hook for FCM push notifications.
 * Handles permission request, token fetch, and foreground message display.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  requestNotificationPermission,
  getFCMToken,
  getCachedFCMToken,
  subscribeFCMMessages,
  handleFCMPayload,
} from '../firebase/messaging';
import { isFirebaseConfigured } from '../firebase/client';

export type FCMPermissionStatus = 'unknown' | 'granted' | 'denied' | 'default';

interface UseFirebaseMessagingReturn {
  permission: FCMPermissionStatus;
  fcmToken: string | null;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
}

export function useFirebaseMessaging(): UseFirebaseMessagingReturn {
  const [permission, setPermission] = useState<FCMPermissionStatus>('unknown');
  const [fcmToken, setFcmToken] = useState<string | null>(getCachedFCMToken());
  const [isLoading, setIsLoading] = useState(false);

  // Initialize: read existing permission state
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    if (!('Notification' in window)) {
      setPermission('denied');
      return;
    }
    setPermission(Notification.permission as FCMPermissionStatus);
  }, []);

  // Subscribe to foreground messages
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    if (permission !== 'granted') return;

    let unsubscribe: (() => void) | null = null;
    subscribeFCMMessages(handleFCMPayload).then(fn => {
      unsubscribe = fn;
    });
    return () => { unsubscribe?.(); };
  }, [permission]);

  const requestPermission = useCallback(async () => {
    if (!isFirebaseConfigured()) return;
    setIsLoading(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result as FCMPermissionStatus);

      if (result === 'granted') {
        const token = await getFCMToken();
        setFcmToken(token);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { permission, fcmToken, isLoading, requestPermission };
}
