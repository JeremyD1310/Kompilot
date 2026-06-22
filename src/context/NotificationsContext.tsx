/**
 * NotificationsContext — central real-time notification system.
 *
 * Features:
 * - 5 categories: post, review, message, ai, sms
 * - Event queue with deduplication (same id = replace, not append)
 * - Toast trigger: push() fires a toast via onToast callback
 * - Persistence: read/dismissed state in localStorage
 * - Simulated real-time: new events arrive every 25–60s after mount
 */
import {
  createContext, useContext, useState, useEffect, useCallback,
  useRef, type ReactNode,
} from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

export type NotifCategory = 'post' | 'review' | 'message' | 'ai' | 'sms';

export interface AppNotification {
  id: string;
  category: NotifCategory;
  emoji: string;
  title: string;
  body: string;
  time: Date;
  read: boolean;
  actionLabel?: string;
  actionHref?: string;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  push: (n: Omit<AppNotification, 'time' | 'read'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  /** Latest notification to show as a toast (cleared after ~4s by context) */
  latestToast: AppNotification | null;
  clearToast: () => void;
}

// ── Simulated real-time events ─────────────────────────────────────────────────

const SIMULATED_EVENTS: Omit<AppNotification, 'id' | 'time' | 'read'>[] = [
  {
    category: 'post',
    emoji: '✅',
    title: 'Post publié',
    body: 'Votre publication Instagram "Brunch du dimanche" est en ligne.',
    actionLabel: 'Voir le post',
    actionHref: '/calendar',
  },
  {
    category: 'review',
    emoji: '⭐',
    title: 'Nouvel avis Google',
    body: 'Marie D. vous a laissé 5 étoiles : "Excellent accueil, je reviendrai !"',
    actionLabel: 'Répondre',
    actionHref: '/performance',
  },
  {
    category: 'message',
    emoji: '💬',
    title: 'Nouveau message client',
    body: 'Thomas B. via Instagram : "Bonjour, vous êtes ouverts le lundi ?"',
    actionLabel: 'Répondre',
    actionHref: '/inbox',
  },
  {
    category: 'ai',
    emoji: '🤖',
    title: 'Suggestion IA disponible',
    body: 'Le Cockpit IA a généré 3 nouvelles idées de posts pour cette semaine.',
    actionLabel: 'Voir les idées',
    actionHref: '/cockpit',
  },
  {
    category: 'sms',
    emoji: '📲',
    title: 'Campagne SMS terminée',
    body: 'Campagne FLASH20 · 247 SMS envoyés · Taux d\'ouverture : 96%',
    actionLabel: 'Voir les stats',
    actionHref: '/dashboard',
  },
  {
    category: 'review',
    emoji: '🔔',
    title: 'Réponse requise',
    body: 'Un avis 2 étoiles attend votre réponse depuis 48h. Répondez vite.',
    actionLabel: 'Répondre maintenant',
    actionHref: '/performance',
  },
  {
    category: 'post',
    emoji: '📅',
    title: 'Post planifié dans 1h',
    body: 'Rappel : "Offre spéciale lundi" sera publié à 18h00 sur Instagram + Facebook.',
    actionLabel: 'Modifier',
    actionHref: '/calendar',
  },
  {
    category: 'ai',
    emoji: '✨',
    title: 'Crédits IA rechargés',
    body: 'Votre forfait mensuel a été renouvelé : 20 crédits disponibles.',
    actionLabel: 'Utiliser',
    actionHref: '/cockpit',
  },
  {
    category: 'message',
    emoji: '📩',
    title: '3 messages non lus',
    body: 'Julie M., Marc L. et 1 autre vous ont contacté via votre formulaire.',
    actionLabel: 'Voir les messages',
    actionHref: '/inbox',
  },
  {
    category: 'sms',
    emoji: '💰',
    title: 'ROI SMS · 1 284€ générés',
    body: 'Votre dernière campagne VIP a généré un CA estimé de 1 284€ ce week-end.',
    actionLabel: 'Voir l\'analyse',
    actionHref: '/dashboard',
  },
];

// ── Context ────────────────────────────────────────────────────────────────────

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const STORAGE_KEY = 'nc_notifications_v1';
const MAX_STORED   = 30;

function loadFromStorage(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppNotification[];
    return parsed.map(n => ({ ...n, time: new Date(n.time) })).slice(0, MAX_STORED);
  } catch {
    return [];
  }
}

function saveToStorage(notifications: AppNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_STORED)));
  } catch { /* quota */ }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(loadFromStorage);
  const [latestToast, setLatestToast] = useState<AppNotification | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventIndexRef = useRef(0);

  // Persist on change
  useEffect(() => {
    saveToStorage(notifications);
  }, [notifications]);

  const push = useCallback((data: Omit<AppNotification, 'time' | 'read'>) => {
    const notif: AppNotification = { ...data, time: new Date(), read: false };
    setNotifications(prev => {
      // Replace if same id, otherwise prepend
      const exists = prev.findIndex(n => n.id === notif.id);
      if (exists >= 0) {
        const next = [...prev];
        next[exists] = notif;
        return next;
      }
      return [notif, ...prev].slice(0, MAX_STORED);
    });

    // Show toast — debounce: clear previous timer
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setLatestToast(notif);
    toastTimerRef.current = setTimeout(() => setLatestToast(null), 5500);
  }, []);

  const clearToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setLatestToast(null);
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // ── Real-time simulation ─────────────────────────────────────────────────────
  useEffect(() => {
    // Seed with initial notifications if store is empty
    if (notifications.length === 0) {
      const seeds = SIMULATED_EVENTS.slice(0, 3).map((e, i) => ({
        ...e,
        id: `seed-${i}`,
        time: new Date(Date.now() - (i + 1) * 12 * 60000),
        read: false,
      }));
      setNotifications(seeds);
    }

    const schedule = () => {
      // Next event in 25–60 seconds
      const delay = 25000 + Math.random() * 35000;
      simTimerRef.current = setTimeout(() => {
        const events = SIMULATED_EVENTS;
        const idx = eventIndexRef.current % events.length;
        eventIndexRef.current++;
        const event = events[idx];
        push({ ...event, id: `rt-${Date.now()}-${idx}` });
        schedule();
      }, delay);
    };

    // First event after 12s (so user sees something quickly in demo)
    simTimerRef.current = setTimeout(() => {
      const event = SIMULATED_EVENTS[eventIndexRef.current % SIMULATED_EVENTS.length];
      eventIndexRef.current++;
      push({ ...event, id: `rt-${Date.now()}-first` });
      schedule();
    }, 12000);

    return () => {
      if (simTimerRef.current) clearTimeout(simTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider value={{
      notifications, unreadCount, push,
      markAllRead, markRead, dismiss, clearAll,
      latestToast, clearToast,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) { console.warn('useNotifications must be used within NotificationsProvider' + ' — context missing, returning safe fallback'); return {} as any; }
  return ctx;
}
