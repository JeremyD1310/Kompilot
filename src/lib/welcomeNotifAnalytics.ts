/**
 * welcomeNotifAnalytics
 *
 * Tracks open and click-through rates for both B2C and B2B welcome
 * notifications (email + in-app push).
 *
 * Events stored per notification channel + type:
 *   - email_sent      : email dispatched via blink.notifications.email
 *   - notif_pushed    : in-app notification pushed to NotificationsContext
 *   - notif_opened    : user opened the notification bell and saw the item
 *   - notif_clicked   : user clicked the CTA inside the notification item
 *   - toast_shown     : welcome toast appeared on screen
 *   - toast_clicked   : user clicked the CTA inside the toast
 *
 * Rates computed:
 *   - Email open rate    : (notif_opened  / email_sent)   × 100  [approximated via in-app surrogate]
 *   - Notification CTR   : (notif_clicked / notif_pushed) × 100
 *   - Toast CTR          : (toast_clicked / toast_shown)  × 100
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type WelcomeNotifType = 'b2c' | 'b2b';

export type WelcomeNotifEventKind =
  | 'email_sent'
  | 'notif_pushed'
  | 'notif_opened'
  | 'notif_clicked'
  | 'toast_shown'
  | 'toast_clicked';

export interface WelcomeNotifEvent {
  id: string;                      // unique event id
  kind: WelcomeNotifEventKind;
  notifType: WelcomeNotifType;
  planName: string;
  timestamp: string;               // ISO 8601
  userId?: string;
}

export interface WelcomeNotifStats {
  notifType: WelcomeNotifType;
  emailSent: number;
  notifPushed: number;
  notifOpened: number;
  notifClicked: number;
  toastShown: number;
  toastClicked: number;
  /** notif_clicked / notif_pushed (%) */
  notifCTR: number;
  /** toast_clicked / toast_shown (%) */
  toastCTR: number;
  /** notif_opened / email_sent (%) — in-app open as surrogate for email open */
  emailOpenRate: number;
}

// ── Storage ────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'nc_welcome_notif_analytics_v1';
const MAX_EVENTS = 500;

function generateId(): string {
  return `wna_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function loadEvents(): WelcomeNotifEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WelcomeNotifEvent[]) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: WelcomeNotifEvent[]): void {
  try {
    // Keep latest MAX_EVENTS; oldest are trimmed first
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
  } catch {
    // Quota exceeded — silently ignore
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Record a single analytics event for a welcome notification.
 *
 * @param kind       - Event type (e.g. 'email_sent', 'notif_clicked')
 * @param notifType  - 'b2c' or 'b2b'
 * @param planName   - The plan the user just subscribed to
 * @param userId     - Optional authenticated user id
 */
export function recordWelcomeNotifEvent(
  kind: WelcomeNotifEventKind,
  notifType: WelcomeNotifType,
  planName: string,
  userId?: string,
): void {
  const event: WelcomeNotifEvent = {
    id: generateId(),
    kind,
    notifType,
    planName,
    timestamp: new Date().toISOString(),
    ...(userId ? { userId } : {}),
  };
  const events = loadEvents();
  events.unshift(event);
  saveEvents(events);

  // Also forward to GA4 if configured
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', `welcome_notif_${kind}`, {
        notif_type: notifType,
        plan_name: planName,
        ...(userId ? { user_id: userId } : {}),
      });
    }
  } catch {
    // GA4 not configured — skip
  }
}

/**
 * Retrieve all stored welcome notification analytics events.
 */
export function getWelcomeNotifEvents(): WelcomeNotifEvent[] {
  return loadEvents();
}

/**
 * Compute aggregated open/CTR stats for a given notification type.
 * Pass `undefined` for `notifType` to get combined stats across both types.
 */
export function computeWelcomeNotifStats(
  notifType: WelcomeNotifType,
): WelcomeNotifStats {
  const events = loadEvents().filter(e => e.notifType === notifType);

  const count = (kind: WelcomeNotifEventKind) =>
    events.filter(e => e.kind === kind).length;

  const emailSent    = count('email_sent');
  const notifPushed  = count('notif_pushed');
  const notifOpened  = count('notif_opened');
  const notifClicked = count('notif_clicked');
  const toastShown   = count('toast_shown');
  const toastClicked = count('toast_clicked');

  const pct = (num: number, denom: number) =>
    denom === 0 ? 0 : Math.round((num / denom) * 1000) / 10; // 1 decimal

  return {
    notifType,
    emailSent,
    notifPushed,
    notifOpened,
    notifClicked,
    toastShown,
    toastClicked,
    notifCTR:      pct(notifClicked, notifPushed),
    toastCTR:      pct(toastClicked, toastShown),
    emailOpenRate: pct(notifOpened,  emailSent),
  };
}

/**
 * Compute combined stats for both B2C and B2B.
 */
export function computeAllWelcomeNotifStats(): {
  b2c: WelcomeNotifStats;
  b2b: WelcomeNotifStats;
} {
  return {
    b2c: computeWelcomeNotifStats('b2c'),
    b2b: computeWelcomeNotifStats('b2b'),
  };
}

/**
 * Clear all welcome notification analytics events (useful for testing).
 */
export function clearWelcomeNotifAnalytics(): void {
  saveEvents([]);
}

/**
 * Detect whether a notification id belongs to a welcome notification and
 * return its type.  Returns null for non-welcome notifications.
 */
export function getWelcomeNotifTypeFromId(
  notifId: string,
): WelcomeNotifType | null {
  if (notifId.startsWith('welcome-b2c-')) return 'b2c';
  if (notifId.startsWith('welcome-b2b-')) return 'b2b';
  return null;
}
