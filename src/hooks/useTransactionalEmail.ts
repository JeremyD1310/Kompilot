/**
 * useTransactionalEmail — sends welcome emails via Blink SDK notifications.
 *
 * Integration points:
 * ──────────────────────────────────────────────────────────────────────────
 * After a successful SIGNUP (not login), call sendWelcomeEmail. Example:
 *
 *   import { useTransactionalEmail } from '../hooks/useTransactionalEmail';
 *
 *   function LoginPage() {
 *     const { sendWelcomeEmail } = useTransactionalEmail();
 *
 *     const handleSignup = async () => {
 *       // ... create account with blink.auth ...
 *       await sendWelcomeEmail({
 *         to: user.email,
 *         displayName: user.displayName ?? '',
 *         dashboardUrl: `${window.location.origin}/dashboard`,
 *       });
 *     };
 *   }
 *
 * NOTE: `blink` must be initialised with `auth: { mode: 'managed' }` (already
 * the case in src/blink/client.ts) — the notifications module requires auth.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { blink } from '../blink/client';
import {
  logEmail,
  markEmailDelivered,
  markEmailBounced,
} from '../lib/emailLogger';
import {
  getWelcomeEmailHtml,
  getWelcomeEmailText,
  WELCOME_EMAIL_SUBJECT,
  EMAIL_REPLY_TO,
} from '../lib/emailTemplates';

interface SendWelcomeParams {
  to: string;
  displayName: string;
  dashboardUrl?: string;
}

interface SendWelcomeResult {
  success: boolean;
  logId: string;
}

export function useTransactionalEmail() {
  const sendWelcomeEmail = async (
    params: SendWelcomeParams
  ): Promise<SendWelcomeResult> => {
    const { to, displayName, dashboardUrl } = params;
    const resolvedUrl = dashboardUrl ?? `${window.location.origin}/dashboard`;

    // 1. Create a log entry with initial status 'sent'
    const logEntry = logEmail({
      to,
      subject: WELCOME_EMAIL_SUBJECT,
      type: 'welcome',
      status: 'sent',
    });

    try {
      // 2. Send via Blink SDK notifications
      await blink.notifications.email({
        to,
        replyTo: EMAIL_REPLY_TO,
        subject: WELCOME_EMAIL_SUBJECT,
        html: getWelcomeEmailHtml(displayName, resolvedUrl),
        text: getWelcomeEmailText(displayName, resolvedUrl),
      });

      // 3. On success — mark as delivered
      markEmailDelivered(logEntry.id);
      return { success: true, logId: logEntry.id };
    } catch (err) {
      // 4. On error — mark as bounced and log
      const message = err instanceof Error ? err.message : String(err);
      markEmailBounced(logEntry.id, message);
      console.error('[Kompilot] Welcome email failed:', err);
      return { success: false, logId: logEntry.id };
    }
  };

  return { sendWelcomeEmail };
}
