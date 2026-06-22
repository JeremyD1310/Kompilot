/**
 * usePerformanceAlertEmail
 *
 * Classifies the current performance snapshot and sends an alert email
 * (critical drop or positive trend) via blink.notifications.email.
 *
 * Deduplication: one alert per type per 24 h, stored in localStorage so
 * the user is never spammed if they run the AI analysis multiple times.
 */
import { useCallback, useState } from 'react';
import { blink } from '../blink/client';
import {
  classifyAlert,
  buildCriticalDropEmail,
  buildPositiveTrendEmail,
  type AlertType,
  type AlertEmailParams,
  type PerformanceSnapshot,
} from '../lib/performanceAlertTemplates';

// ── Dedup storage key ────────────────────────────────────────────────────────

const DEDUP_KEY = 'kompilot_perf_alert_sent';

interface DedupRecord {
  [alertType: string]: number; // timestamp of last send
}

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 h

function getSentRecord(): DedupRecord {
  try {
    return JSON.parse(localStorage.getItem(DEDUP_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function markSent(alertType: AlertType): void {
  const record = getSentRecord();
  record[alertType] = Date.now();
  localStorage.setItem(DEDUP_KEY, JSON.stringify(record));
}

function wasRecentlySent(alertType: AlertType): boolean {
  const record = getSentRecord();
  const last = record[alertType];
  if (!last) return false;
  return Date.now() - last < COOLDOWN_MS;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export type AlertSendStatus = 'idle' | 'sending' | 'sent' | 'skipped' | 'error';

interface UsePerformanceAlertEmailReturn {
  alertStatus: AlertSendStatus;
  alertType: AlertType | null;
  /** Call this after AI analysis completes, passing the snapshot and the AI summary text */
  sendAlertIfNeeded: (snap: PerformanceSnapshot, aiSummary: string) => Promise<void>;
  /** Reset state back to idle (e.g. when user triggers a fresh analysis) */
  reset: () => void;
}

export function usePerformanceAlertEmail(): UsePerformanceAlertEmailReturn {
  const [alertStatus, setAlertStatus] = useState<AlertSendStatus>('idle');
  const [alertType, setAlertType] = useState<AlertType | null>(null);

  const reset = useCallback(() => {
    setAlertStatus('idle');
    setAlertType(null);
  }, []);

  const sendAlertIfNeeded = useCallback(
    async (snap: PerformanceSnapshot, aiSummary: string) => {
      const type = classifyAlert(snap);
      if (!type) return; // nothing notable — no email

      setAlertType(type);

      // Dedup check
      if (wasRecentlySent(type)) {
        setAlertStatus('skipped');
        return;
      }

      // Get current user
      let user: Awaited<ReturnType<typeof blink.auth.me>> | null = null;
      try {
        user = await blink.auth.me();
      } catch {
        // Not authenticated — silently skip
        setAlertStatus('skipped');
        return;
      }

      if (!user?.email) {
        setAlertStatus('skipped');
        return;
      }

      const firstName = user.displayName?.split(' ')[0] ?? 'vous';

      const params: AlertEmailParams = {
        firstName,
        email: user.email,
        snap,
        // Keep the AI summary concise for the email (first 200 chars of plain text)
        aiSummary: aiSummary
          .replace(/#{1,3}\s/g, '')
          .replace(/\*\*/g, '')
          .replace(/\n+/g, ' ')
          .trim()
          .slice(0, 200),
      };

      const { subject, html, text } =
        type === 'critical_drop'
          ? buildCriticalDropEmail(params)
          : buildPositiveTrendEmail(params);

      setAlertStatus('sending');

      try {
        await blink.notifications.email({
          to: user.email,
          subject,
          html,
          text,
          replyTo: 'support@kompilot.fr',
        });

        markSent(type);
        setAlertStatus('sent');
      } catch (err) {
        console.error('[PerformanceAlert] Email send failed:', err);
        setAlertStatus('error');
      }
    },
    [],
  );

  return { alertStatus, alertType, sendAlertIfNeeded, reset };
}
