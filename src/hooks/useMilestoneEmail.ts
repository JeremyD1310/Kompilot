/**
 * useMilestoneEmail
 *
 * Sends a congratulatory email when a business crosses a performance milestone.
 * Mirrors the useTransactionalEmail pattern: fetches the current user, sends via
 * blink.notifications.email, and logs the result in localStorage email logs.
 *
 * Usage (in any component or hook that detects a milestone):
 *
 *   const { sendMilestoneEmail } = useMilestoneEmail();
 *
 *   // after milestone is detected:
 *   await sendMilestoneEmail({
 *     milestone: { emoji, title, body, actionLabel, actionHref },
 *   });
 *
 * The hook silently no-ops if the user is unauthenticated or has no email —
 * in-app notifications still fire regardless.
 */

import { useCallback } from 'react';
import { blink } from '../blink/client';
import {
  logEmail,
  markEmailDelivered,
  markEmailBounced,
} from '../lib/emailLogger';
import {
  getMilestoneEmailHtml,
  getMilestoneEmailText,
  getMilestoneEmailSubject,
  EMAIL_REPLY_TO,
} from '../lib/emailTemplates';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MilestonePayload {
  emoji: string;
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
}

interface SendMilestoneParams {
  milestone: MilestonePayload;
  /** Override recipient — defaults to the currently signed-in user's email */
  overrideTo?: string;
  /** Override display name — defaults to the signed-in user's displayName */
  overrideDisplayName?: string;
}

interface SendMilestoneResult {
  success: boolean;
  skipped?: boolean;
  logId?: string;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMilestoneEmail() {
  const sendMilestoneEmail = useCallback(
    async (params: SendMilestoneParams): Promise<SendMilestoneResult> => {
      const { milestone, overrideTo, overrideDisplayName } = params;

      // Resolve recipient — try the signed-in user if no override given
      let recipientEmail = overrideTo;
      let displayName = overrideDisplayName ?? '';

      if (!recipientEmail) {
        try {
          const user = await blink.auth.me();
          recipientEmail = user?.email ?? undefined;
          displayName = overrideDisplayName ?? user?.displayName ?? '';
        } catch {
          // Not authenticated — skip silently (in-app toast already fired)
          return { success: false, skipped: true };
        }
      }

      if (!recipientEmail) {
        return { success: false, skipped: true };
      }

      const dashboardOrigin =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://app.kompilot.com';

      const subject = getMilestoneEmailSubject(milestone.emoji, milestone.title);

      // Log the attempt
      const logEntry = logEmail({
        to: recipientEmail,
        subject,
        type: 'notification',
        status: 'sent',
      });

      try {
        await blink.notifications.email({
          to: recipientEmail,
          replyTo: EMAIL_REPLY_TO,
          subject,
          html: getMilestoneEmailHtml(displayName, milestone, dashboardOrigin),
          text: getMilestoneEmailText(displayName, milestone, dashboardOrigin),
        });

        markEmailDelivered(logEntry.id);
        return { success: true, logId: logEntry.id };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        markEmailBounced(logEntry.id, message);
        console.warn('[Kompilot] Milestone email failed:', milestone.title, err);
        return { success: false, logId: logEntry.id };
      }
    },
    [],
  );

  return { sendMilestoneEmail };
}
