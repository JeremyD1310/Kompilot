/**
 * useEmailNotifications — central hook for all Kompilot email notification types.
 *
 * Notification types:
 *   sendNewMessageAlert   — new inbox / live-chat message
 *   sendUpcomingPostAlert — 24h reminder before a scheduled post
 *   sendReviewAlert       — new Google review received
 *   sendWeeklyDigest      — weekly performance summary
 *
 * All functions:
 *  - Check user preferences before sending
 *  - Silently catch errors (notification failure ≠ UX failure)
 *  - Log to email history (localStorage) for the Notifications Center
 */

import { useCallback } from 'react';
import { blink } from '../blink/client';
import { useNotificationPreferences } from '../context/NotificationPreferencesContext';
import { useAuth } from './useAuth';
import {
  getNewMessageEmailSubject, getNewMessageEmailHtml, getNewMessageEmailText,
  getUpcomingPostEmailSubject, getUpcomingPostEmailHtml, getUpcomingPostEmailText,
  getNewReviewEmailSubject, getNewReviewEmailHtml, getNewReviewEmailText,
  getWeeklyDigestEmailSubject, getWeeklyDigestEmailHtml, getWeeklyDigestEmailText,
  type NewMessageEmailParams,
  type UpcomingPostEmailParams,
  type NewReviewEmailParams,
  type WeeklyDigestEmailParams,
} from '../lib/notificationEmailTemplates';

// ── In-app notification log (localStorage) ───────────────────────────────────

export type NotifType = 'message' | 'post_reminder' | 'review' | 'weekly_digest';

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  emailSent: boolean;
  meta?: Record<string, string | number>;
}

const NOTIF_LOG_KEY = 'kompilot_notification_log';
const MAX_LOG = 50;

export function loadNotificationLog(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIF_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNotificationLog(log: AppNotification[]): void {
  try {
    localStorage.setItem(NOTIF_LOG_KEY, JSON.stringify(log.slice(0, MAX_LOG)));
  } catch { /* ignore */ }
}

function pushNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
  const entry: AppNotification = {
    ...notif,
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    read: false,
  };
  const log = loadNotificationLog();
  saveNotificationLog([entry, ...log]);
  // Dispatch a storage event so other tabs / components can react
  window.dispatchEvent(new StorageEvent('storage', { key: NOTIF_LOG_KEY }));
  return entry;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useEmailNotifications() {
  const { prefs } = useNotificationPreferences();
  const { user } = useAuth();

  // ── New message (inbox / live chat) ────────────────────────────────────────
  const sendNewMessageAlert = useCallback(async (params: Omit<NewMessageEmailParams, 'dashboardUrl'>) => {
    // Always log in-app
    pushNotification({
      type: 'message',
      title: `Nouveau message de ${params.senderName}`,
      body: `Via ${params.senderChannel} : "${params.messagePreview.slice(0, 80)}${params.messagePreview.length > 80 ? '…' : ''}"`,
      emailSent: false,
      meta: { sender: params.senderName, channel: params.senderChannel },
    });

    if (!prefs.inboxMessages || !user?.email) return;

    const fullParams: NewMessageEmailParams = {
      ...params,
      dashboardUrl: `${window.location.origin}/live-chat`,
    };

    try {
      await blink.notifications.email({
        to: user.email,
        subject: getNewMessageEmailSubject(params.senderName, params.senderChannel),
        html: getNewMessageEmailHtml(fullParams),
        text: getNewMessageEmailText(fullParams),
      });
      // Update log entry to mark emailSent
      const log = loadNotificationLog();
      if (log[0]) { log[0].emailSent = true; saveNotificationLog(log); }
    } catch (err) {
      console.warn('[Kompilot] New message email failed:', err);
    }
  }, [prefs.inboxMessages, user?.email]);

  // ── Upcoming post reminder ─────────────────────────────────────────────────
  const sendUpcomingPostAlert = useCallback(async (params: Omit<UpcomingPostEmailParams, 'calendarUrl'>) => {
    pushNotification({
      type: 'post_reminder',
      title: `Publication prévue demain ${params.scheduledDate} à ${params.scheduledTime}`,
      body: params.postPreview.slice(0, 100) + (params.postPreview.length > 100 ? '…' : ''),
      emailSent: false,
      meta: { date: params.scheduledDate, time: params.scheduledTime },
    });

    if (!prefs.scheduledPosts || !user?.email) return;

    const fullParams: UpcomingPostEmailParams = {
      ...params,
      calendarUrl: `${window.location.origin}/calendar`,
    };

    try {
      await blink.notifications.email({
        to: user.email,
        subject: getUpcomingPostEmailSubject(params.scheduledDate, params.scheduledTime),
        html: getUpcomingPostEmailHtml(fullParams),
        text: getUpcomingPostEmailText(fullParams),
      });
      const log = loadNotificationLog();
      if (log[0]) { log[0].emailSent = true; saveNotificationLog(log); }
    } catch (err) {
      console.warn('[Kompilot] Upcoming post email failed:', err);
    }
  }, [prefs.scheduledPosts, user?.email]);

  // ── New Google review ──────────────────────────────────────────────────────
  const sendReviewAlert = useCallback(async (params: Omit<NewReviewEmailParams, 'reviewsUrl'>) => {
    const stars = '★'.repeat(params.rating) + '☆'.repeat(5 - params.rating);
    pushNotification({
      type: 'review',
      title: `Nouvel avis ${stars} de ${params.reviewerName}`,
      body: `"${params.reviewText.slice(0, 100)}${params.reviewText.length > 100 ? '…' : ''}"`,
      emailSent: false,
      meta: { rating: params.rating, reviewer: params.reviewerName },
    });

    if (!prefs.reviewAlert || !user?.email) return;

    const fullParams: NewReviewEmailParams = {
      ...params,
      reviewsUrl: `${window.location.origin}/google-maps`,
    };

    try {
      await blink.notifications.email({
        to: user.email,
        subject: getNewReviewEmailSubject(params.rating, params.reviewerName),
        html: getNewReviewEmailHtml(fullParams),
        text: getNewReviewEmailText(fullParams),
      });
      const log = loadNotificationLog();
      if (log[0]) { log[0].emailSent = true; saveNotificationLog(log); }
    } catch (err) {
      console.warn('[Kompilot] Review alert email failed:', err);
    }
  }, [prefs.reviewAlert, user?.email]);

  // ── Weekly digest ──────────────────────────────────────────────────────────
  const sendWeeklyDigest = useCallback(async (params: Omit<WeeklyDigestEmailParams, 'dashboardUrl' | 'displayName'>) => {
    pushNotification({
      type: 'weekly_digest',
      title: `Bilan hebdomadaire — semaine du ${params.weekLabel}`,
      body: `${params.stats.postsPublished} publications · ${params.stats.messagesReceived} messages · ${params.stats.avgRating.toFixed(1)}/5 ⭐`,
      emailSent: false,
    });

    if (!prefs.weeklyDigest || !user?.email) return;

    const fullParams: WeeklyDigestEmailParams = {
      ...params,
      displayName: user.displayName ?? '',
      dashboardUrl: `${window.location.origin}/dashboard`,
    };

    try {
      await blink.notifications.email({
        to: user.email,
        subject: getWeeklyDigestEmailSubject(params.weekLabel),
        html: getWeeklyDigestEmailHtml(fullParams),
        text: getWeeklyDigestEmailText(fullParams),
      });
      const log = loadNotificationLog();
      if (log[0]) { log[0].emailSent = true; saveNotificationLog(log); }
    } catch (err) {
      console.warn('[Kompilot] Weekly digest email failed:', err);
    }
  }, [prefs.weeklyDigest, user?.email, user?.displayName]);

  // ── Test send (for Settings UI) ────────────────────────────────────────────
  const sendTestEmail = useCallback(async (type: NotifType): Promise<boolean> => {
    if (!user?.email) return false;
    const origin = window.location.origin;

    try {
      switch (type) {
        case 'message':
          await blink.notifications.email({
            to: user.email,
            subject: getNewMessageEmailSubject('Test Client', 'Site web'),
            html: getNewMessageEmailHtml({ senderName: 'Test Client', senderChannel: 'Site web', messagePreview: 'Bonjour, j\'aimerais obtenir plus d\'informations sur vos services. Merci !', dashboardUrl: `${origin}/live-chat`, businessName: 'Votre établissement' }),
            text: getNewMessageEmailText({ senderName: 'Test Client', senderChannel: 'Site web', messagePreview: 'Bonjour, j\'aimerais obtenir plus d\'informations.', dashboardUrl: `${origin}/live-chat` }),
          });
          break;
        case 'post_reminder':
          await blink.notifications.email({
            to: user.email,
            subject: getUpcomingPostEmailSubject('demain', '14:00'),
            html: getUpcomingPostEmailHtml({ postTitle: 'Publication test', postPreview: 'Découvrez nos nouvelles offres du printemps ! 🌸 Réservez dès maintenant et bénéficiez de -20% sur toutes nos prestations.', scheduledDate: 'demain', scheduledTime: '14:00', channels: ['instagram', 'facebook'], calendarUrl: `${origin}/calendar` }),
            text: getUpcomingPostEmailText({ postTitle: 'Test', postPreview: 'Contenu test', scheduledDate: 'demain', scheduledTime: '14:00', channels: ['instagram'], calendarUrl: `${origin}/calendar` }),
          });
          break;
        case 'review':
          await blink.notifications.email({
            to: user.email,
            subject: getNewReviewEmailSubject(5, 'Marie Dupont'),
            html: getNewReviewEmailHtml({ reviewerName: 'Marie Dupont', rating: 5, reviewText: 'Excellent service, équipe très professionnelle et à l\'écoute. Je recommande vivement !', businessName: 'Mon établissement', reviewsUrl: `${origin}/google-maps` }),
            text: getNewReviewEmailText({ reviewerName: 'Marie Dupont', rating: 5, reviewText: 'Excellent service !', businessName: 'Mon établissement', reviewsUrl: `${origin}/google-maps` }),
          });
          break;
        case 'weekly_digest': {
          const now = new Date();
          const weekLabel = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
          await blink.notifications.email({
            to: user.email,
            subject: getWeeklyDigestEmailSubject(weekLabel),
            html: getWeeklyDigestEmailHtml({ displayName: user.displayName ?? 'là', weekLabel, stats: { postsPublished: 7, messagesReceived: 12, avgRating: 4.6, reach: 3840, reachChange: 18 }, topPost: { title: 'Nos offres de printemps 🌸', reach: 1240 }, dashboardUrl: `${origin}/dashboard` }),
            text: getWeeklyDigestEmailText({ displayName: user.displayName ?? '', weekLabel, stats: { postsPublished: 7, messagesReceived: 12, avgRating: 4.6, reach: 3840, reachChange: 18 }, dashboardUrl: `${origin}/dashboard` }),
          });
          break;
        }
      }
      return true;
    } catch (err) {
      console.warn('[Kompilot] Test email failed:', err);
      return false;
    }
  }, [user?.email, user?.displayName]);

  return {
    sendNewMessageAlert,
    sendUpcomingPostAlert,
    sendReviewAlert,
    sendWeeklyDigest,
    sendTestEmail,
  };
}
