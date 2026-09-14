/**
 * usePushNotifications — React hook for FCM push notification management.
 * Handles permission request, FCM token registration with backend,
 * and foreground message display.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  requestNotificationPermission,
  getFCMToken,
  getCachedFCMToken,
  subscribeFCMMessages,
  unsubscribeFCMMessages,
  handleFCMPayload,
  type KompilotNotificationType,
} from '../firebase/messaging';
import { isFirebaseConfigured } from '../firebase/client';
import { blink } from '../blink/client';

const TOKEN_REGISTERED_KEY = 'kompilot_fcm_registered';

interface PushNotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  lastNotificationType: KompilotNotificationType | null;
}

interface UsePushNotificationsReturn extends PushNotificationState {
  requestPermission: () => Promise<boolean>;
  dismissPrompt: () => void;
  shouldShowPrompt: boolean;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [state, setState] = useState<PushNotificationState>({
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
    isSupported: typeof Notification !== 'undefined' && isFirebaseConfigured(),
    isSubscribed: !!getCachedFCMToken(),
    isLoading: false,
    lastNotificationType: null,
  });
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('kompilot_push_dismissed') === 'true'
  );
  const registeredRef = useRef(false);

  // Register FCM token with backend
  const registerTokenWithBackend = useCallback(async (token: string) => {
    try {
      const user = await blink.auth.me();
      if (!user) return;

      // Store token in user_notification_settings or a dedicated table
      await blink.db.table<{ id: string; userId: string; fcmToken: string; platform: string; updatedAt: string }>('user_push_tokens').upsert({
        id: `fcm_${user.id}`,
        userId: user.id,
        fcmToken: token,
        platform: 'web',
        updatedAt: new Date().toISOString(),
      });
      localStorage.setItem(TOKEN_REGISTERED_KEY, 'true');
    } catch (e) {
      console.warn('[Push] Failed to register token with backend:', e);
    }
  }, []);

  // Subscribe to foreground messages
  useEffect(() => {
    if (!state.isSupported || state.permission !== 'granted') return;

    const handler = (payload: Parameters<typeof handleFCMPayload>[0]) => {
      handleFCMPayload(payload);
      const type = payload.data?.type as KompilotNotificationType | undefined;
      if (type) {
        setState(prev => ({ ...prev, lastNotificationType: type }));
      }
    };

    subscribeFCMMessages(handler);
    return () => { unsubscribeFCMMessages(); };
  }, [state.isSupported, state.permission]);

  // Request permission and get FCM token
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        setState(prev => ({ ...prev, permission, isLoading: false }));
        return false;
      }

      const token = await getFCMToken();
      if (token && !registeredRef.current) {
        registeredRef.current = true;
        await registerTokenWithBackend(token);
      }

      setState(prev => ({
        ...prev,
        permission,
        isSubscribed: !!token,
        isLoading: false,
      }));

      localStorage.removeItem('kompilot_push_dismissed');
      return true;
    } catch (e) {
      console.warn('[Push] Permission request failed:', e);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [registerTokenWithBackend]);

  const dismissPrompt = useCallback(() => {
    setDismissed(true);
    localStorage.setItem('kompilot_push_dismissed', 'true');
  }, []);

  // Re-register token on auth if we have a cached one but haven't registered yet
  useEffect(() => {
    if (!state.isSupported || registeredRef.current) return;
    const cached = getCachedFCMToken();
    if (cached && state.permission === 'granted') {
      registeredRef.current = true;
      registerTokenWithBackend(cached);
    }
  }, [state.isSupported, state.permission, registerTokenWithBackend]);

  const shouldShowPrompt =
    state.isSupported &&
    state.permission === 'default' &&
    !dismissed &&
    !state.isSubscribed;

  return {
    ...state,
    requestPermission,
    dismissPrompt,
    shouldShowPrompt,
  };
}
