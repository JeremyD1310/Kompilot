/**
 * useMentorTriggers — Proactive contextual companion (Mentor Copilote) trigger system.
 *
 * Usage (dispatch from any component):
 *   import { fireMentorTrigger } from '../hooks/useMentorTriggers';
 *   fireMentorTrigger('first_post');
 *   fireMentorTrigger('geo_drop');
 *   fireMentorTrigger('no_show');
 *   fireMentorTrigger('peak_activity');
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export type MentorTriggerType =
  | 'first_post'
  | 'geo_drop'
  | 'no_show'
  | 'peak_activity'
  | 'welcome_back'
  | 'low_engagement'
  | 'streak_3d'
  | 'payment_failed'
  | 'subscription_cancelled';

export interface MentorMessage {
  id: string;
  type: MentorTriggerType;
  emoji: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaQuery?: string; // pre-fills AIChatWidget on click
  ctaHref?: string;
  priority: 'low' | 'medium' | 'high';
  gradient: string;
  createdAt: number;
}

const DISMISSED_IDS_KEY = 'kompilot_mentor_dismissed_ids';
const SESSION_SHOWN_KEY = 'kompilot_mentor_session_shown'; // per session

/** Dispatch a Mentor trigger from anywhere in the app */
export function fireMentorTrigger(type: MentorTriggerType, extra?: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent('mentor_trigger', { detail: { type, ...extra } }));
}

/** Open the AIChatWidget and optionally pre-fill a query */
export function openAIChat(query?: string) {
  window.dispatchEvent(new CustomEvent('open_ai_chat', { detail: { query } }));
}

// ── Message factory ───────────────────────────────────────────────────────────

function buildMessages(
  firstName: string,
): Record<MentorTriggerType, Omit<MentorMessage, 'id' | 'createdAt'>> {
  const name = firstName || 'Commerçant';
  return {
    first_post: {
      type: 'first_post',
      emoji: '🎉',
      title: `Bravo ${name} !`,
      body: `Votre premier post optimisé pour l'IA est en ligne. C'est le premier pas pour devancer vos concurrents sur ChatGPT cette semaine. Continuez comme ça !`,
      ctaLabel: 'Voir mes performances',
      ctaHref: '/performance',
      priority: 'high',
      gradient: 'from-emerald-500 to-teal-600',
    },
    geo_drop: {
      type: 'geo_drop',
      emoji: '💡',
      title: 'Baisse de visibilité détectée',
      body: `J'ai remarqué une petite baisse de visibilité dans votre quartier sur Perplexity. Pas d'inquiétude — j'ai analysé la cause et préparé une mise à jour textuelle pour corriger le tir instantanément.`,
      ctaLabel: 'Voir le diagnostic',
      ctaQuery: "Explique-moi comment améliorer ma visibilité locale rapidement",
      ctaHref: '/geo-authority',
      priority: 'high',
      gradient: 'from-amber-500 to-orange-600',
    },
    no_show: {
      type: 'no_show',
      emoji: '🤝',
      title: 'Rendez-vous manqué détecté',
      body: `Je sais que les rendez-vous manqués sont frustrants pour votre équipe. Je suis là pour vous protéger : j'ai déjà préparé les options de médiation diplomatique pour ce client.`,
      ctaLabel: 'Voir les options',
      ctaQuery: "Comment gérer diplomatiquement un rendez-vous manqué avec un client ?",
      priority: 'high',
      gradient: 'from-rose-500 to-pink-600',
    },
    peak_activity: {
      type: 'peak_activity',
      emoji: '🚀',
      title: `Pic d'activité prévu !`,
      body: `Quel succès ! Le cockpit prévoit un pic d'activité de +25%. Pensez à féliciter vos équipes ce soir, et prenez une minute pour ajuster vos stocks si besoin.`,
      ctaLabel: 'Gérer les préparations',
      ctaQuery: "Donne-moi des conseils pratiques pour gérer un pic d'activité aujourd'hui",
      priority: 'medium',
      gradient: 'from-violet-500 to-indigo-600',
    },
    welcome_back: {
      type: 'welcome_back',
      emoji: '👋',
      title: `Content de vous revoir ${name} !`,
      body: `Votre score de visibilité a progressé de +3 points depuis votre dernière connexion. Voici ce que j'ai préparé pour vous aujourd'hui.`,
      ctaLabel: 'Voir le résumé',
      ctaHref: '/dashboard',
      priority: 'low',
      gradient: 'from-teal-500 to-cyan-600',
    },
    low_engagement: {
      type: 'low_engagement',
      emoji: '📉',
      title: 'Engagement en baisse ce mois',
      body: `J'ai analysé vos statistiques : le taux d'engagement a baissé de 12% cette semaine. Un format Reel ou Stories pourrait relancer l'attention de votre audience.`,
      ctaLabel: 'Générer un Reel',
      ctaQuery: "Génère une idée de Reel courte et engageante pour mon établissement",
      priority: 'medium',
      gradient: 'from-blue-500 to-indigo-600',
    },
    streak_3d: {
      type: 'streak_3d',
      emoji: '🔥',
      title: `3 jours de publication consécutifs !`,
      body: `${name}, vous êtes en feu ! 3 jours de publication d'affilée, c'est exactement ce que l'algorithme adore. Continuez cette série pour décupler votre portée !`,
      ctaLabel: 'Programmer la suite',
      ctaHref: '/calendar',
      priority: 'medium',
      gradient: 'from-orange-500 to-rose-500',
    },

    // ── Billing / dunning ───────────────────────────────────────────────────

    payment_failed: {
      type: 'payment_failed',
      emoji: '⚠️',
      title: `Bonjour ${name}, votre paiement a échoué`,
      body: `Votre banque a refusé le renouvellement de votre abonnement. Pas d'inquiétude — vos agents IA continuent de surveiller vos arrières pendant 3 jours gratuits. Prenez une minute pour mettre à jour votre carte afin d'éviter toute coupure de service.`,
      ctaLabel: 'Mettre à jour ma carte',
      ctaHref: '/account',
      priority: 'high',
      gradient: 'from-amber-500 to-orange-600',
    },

    subscription_cancelled: {
      type: 'subscription_cancelled',
      emoji: '😔',
      title: 'Votre abonnement a été annulé',
      body: `${name}, votre abonnement est maintenant annulé. Les agents IA et les scans automatiques sont mis en pause pour éviter des frais supplémentaires. Repassez à un plan payant pour tout réactiver en un clic.`,
      ctaLabel: 'Réactiver mon abonnement',
      ctaHref: '/account',
      priority: 'high',
      gradient: 'from-slate-600 to-slate-800',
    },
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMentorTriggers(firstName: string) {
  const [queue, setQueue] = useState<MentorMessage[]>([]);
  const [current, setCurrent] = useState<MentorMessage | null>(null);
  const sessionShownRef = useRef<Set<MentorTriggerType>>(new Set());

  // Load session history
  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(SESSION_SHOWN_KEY) || '[]');
      sessionShownRef.current = new Set(stored);
    } catch { /* noop */ }
  }, []);

  const enqueue = useCallback((type: MentorTriggerType) => {
    // Only show each trigger type once per session
    if (sessionShownRef.current.has(type)) return;
    sessionShownRef.current.add(type);
    try {
      const arr: string[] = JSON.parse(sessionStorage.getItem(SESSION_SHOWN_KEY) || '[]');
      sessionStorage.setItem(SESSION_SHOWN_KEY, JSON.stringify([...new Set([...arr, type])]));
    } catch { /* noop */ }

    const templates = buildMessages(firstName);
    const tpl = templates[type];
    if (!tpl) return;

    const msg: MentorMessage = {
      ...tpl,
      id: `${type}_${Date.now()}`,
      createdAt: Date.now(),
    };

    setQueue(prev => {
      // High-priority bumps to front
      if (msg.priority === 'high') return [msg, ...prev];
      return [...prev, msg];
    });
  }, [firstName]);

  // Advance queue → current (when slot is free)
  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
    }
  }, [current, queue]);

  const dismiss = useCallback(() => {
    setCurrent(null);
  }, []);

  // Listen to custom `mentor_trigger` events from anywhere
  useEffect(() => {
    const handler = (e: Event) => {
      const { type } = (e as CustomEvent<{ type: MentorTriggerType }>).detail;
      if (type) enqueue(type);
    };
    window.addEventListener('mentor_trigger', handler);
    return () => window.removeEventListener('mentor_trigger', handler);
  }, [enqueue]);

  // ── Automatic ambient triggers ──────────────────────────────────────────────

  useEffect(() => {
    // Peak-activity window: 11:30–13:30 and 18:30–20:30
    const checkPeak = () => {
      const h = new Date().getHours(), m = new Date().getMinutes();
      const isPeak =
        (h === 11 && m >= 30) || h === 12 || (h === 13 && m <= 30) ||
        (h === 18 && m >= 30) || h === 19 || (h === 20 && m <= 30);
      if (isPeak && !sessionStorage.getItem('mentor_peak_fired')) {
        sessionStorage.setItem('mentor_peak_fired', '1');
        setTimeout(() => enqueue('peak_activity'), 9000);
      }
    };

    // 3-day streak check via localStorage
    const checkStreak = () => {
      try {
        const raw = localStorage.getItem('kompilot_post_streak_days');
        if (raw && parseInt(raw, 10) >= 3) enqueue('streak_3d');
      } catch { /* noop */ }
    };

    // GEO drop simulation: fire once per day if score was previously above threshold
    const checkGeoDrop = () => {
      try {
        const lastDropShown = localStorage.getItem('mentor_geo_drop_date');
        const today = new Date().toDateString();
        if (lastDropShown === today) return;
        const lastRefresh = localStorage.getItem('geo_last_refresh');
        // Only show if user has refreshed GEO at least once (engaged with the feature)
        if (!lastRefresh) return;
        const age = Date.now() - parseInt(lastRefresh, 10);
        // If last refresh was > 48h ago, simulate a "drop detected" scenario
        if (age > 48 * 60 * 60 * 1000) {
          localStorage.setItem('mentor_geo_drop_date', today);
          setTimeout(() => enqueue('geo_drop'), 15000);
        }
      } catch { /* noop */ }
    };

    const t1 = setTimeout(checkPeak, 4000);
    const t2 = setTimeout(checkStreak, 6000);
    const t3 = setTimeout(checkGeoDrop, 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [enqueue]);

  const unreadCount = queue.length + (current ? 1 : 0);

  return { current, dismiss, unreadCount };
}
