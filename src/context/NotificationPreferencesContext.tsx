import { createContext, useContext, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'kompilot_notification_prefs';

export interface NotificationPreferences {
  inboxMessages: boolean;       // Email when a new inbox message arrives
  liveChatMessage: boolean;     // Email when a new live-chat message arrives
  scheduledPosts: boolean;      // Email when a post is scheduled
  postReminder: boolean;        // Email 24h before a scheduled post
  reviewAlert: boolean;         // Email when a new Google review is received
  weeklyDigest: boolean;        // Weekly summary email
  approvalRequired: boolean;    // Email when a post needs approval
}

const DEFAULTS: NotificationPreferences = {
  inboxMessages: true,
  liveChatMessage: true,
  scheduledPosts: true,
  postReminder: true,
  reviewAlert: true,
  weeklyDigest: false,
  approvalRequired: true,
};

function loadPrefs(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

interface NotificationPreferencesContextValue {
  prefs: NotificationPreferences;
  setPrefs: (prefs: NotificationPreferences) => void;
  updatePref: (key: keyof NotificationPreferences, value: boolean) => void;
}

const Ctx = createContext<NotificationPreferencesContextValue | null>(null);

export function NotificationPreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<NotificationPreferences>(loadPrefs);

  const setPrefs = (next: NotificationPreferences) => {
    setPrefsState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const updatePref = (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
  };

  return (
    <Ctx.Provider value={{ prefs, setPrefs, updatePref }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNotificationPreferences() {
  const ctx = useContext(Ctx);
  if (!ctx) { console.warn('useNotificationPreferences must be used within NotificationPreferencesProvider' + ' — context missing, returning safe fallback'); return {} as any; }
  return ctx;
}
