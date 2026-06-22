import { useCallback } from 'react';
import { blink } from '../blink/client';
import type { InboxMessage } from '../components/inbox/inboxData';

const CHANNEL_LABELS: Record<string, string> = {
  website:   'Formulaire web',
  linkedin:  'LinkedIn',
  instagram: 'Instagram',
};

const CHANNEL_EMOJI: Record<string, string> = {
  website:   '🌐',
  linkedin:  '💼',
  instagram: '📸',
};

/**
 * Returns a function that sends an email alert when a new inbox message arrives.
 * @param userEmail  Recipient address — silently skips if null/undefined.
 * @param enabled    Whether the notification type is enabled in user prefs.
 */
export function useInboxNotifications(
  userEmail: string | null | undefined,
  enabled = true
) {
  const notify = useCallback(
    async (message: InboxMessage) => {
      if (!userEmail || !enabled) return;

      const channelLabel = CHANNEL_LABELS[message.channel] ?? message.channel;
      const channelEmoji = CHANNEL_EMOJI[message.channel] ?? '📩';
      const appUrl = window.location.origin;

      try {
        await blink.notifications.email({
          to: userEmail,
          subject: `${channelEmoji} Nouveau message de ${message.senderName} via ${channelLabel}`,
          html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
              <!-- Header -->
              <div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:28px 32px;">
                <h1 style="margin:0;color:#f8fafc;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Kompilot</h1>
                <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Gestionnaire de présence en ligne</p>
              </div>

              <!-- Alert banner -->
              <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:14px 32px;display:flex;align-items:center;gap:10px;">
                <span style="font-size:20px;">${channelEmoji}</span>
                <div>
                  <p style="margin:0;font-size:13px;font-weight:600;color:#15803d;">Nouveau message reçu</p>
                  <p style="margin:2px 0 0;font-size:12px;color:#16a34a;">Via ${channelLabel}</p>
                </div>
              </div>

              <!-- Content -->
              <div style="padding:28px 32px;">
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;width:110px;font-weight:500;">De</td>
                    <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;font-weight:600;">${message.senderName} <span style="color:#64748b;font-weight:400;">(${message.senderHandle})</span></td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;font-weight:500;">Sujet</td>
                    <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;">${message.subject}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:500;">Canal</td>
                    <td style="padding:8px 0;font-size:13px;color:#0f172a;">${channelLabel}</td>
                  </tr>
                </table>

                <!-- Message preview -->
                <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;border:1px solid #e2e8f0;margin-bottom:24px;">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">Aperçu du message</p>
                  <p style="margin:0;font-size:14px;color:#334155;line-height:1.6;white-space:pre-line;">${message.preview}</p>
                </div>

                <!-- CTA -->
                <a href="${appUrl}/inbox" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:-0.2px;">
                  Répondre dans Kompilot →
                </a>
              </div>

              <!-- Footer -->
              <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
                  Vous recevez cet email car les notifications d'inbox sont activées dans Kompilot.<br/>
                  © ${new Date().getFullYear()} Kompilot
                </p>
              </div>
            </div>
          `,
          text: `Nouveau message reçu via ${channelLabel}\n\nDe : ${message.senderName} (${message.senderHandle})\nSujet : ${message.subject}\n\n${message.preview}\n\nRépondez sur : ${appUrl}/inbox`,
        });
      } catch (err) {
        console.warn('[Kompilot] Inbox email notification failed:', err);
      }
    },
    [userEmail, enabled]
  );

  return { notify };
}
