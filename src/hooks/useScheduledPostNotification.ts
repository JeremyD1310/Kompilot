import { useCallback } from 'react';
import { blink } from '../blink/client';
import type { ScheduledPost } from '../components/calendar/CreatePostModal';

const CHANNEL_LABELS: Record<string, string> = {
  website:         'Blog / Site web',
  linkedin:        'LinkedIn',
  instagram:       'Instagram',
  tiktok:          'TikTok',
  facebook:        'Facebook',
  google_business: 'Google Business',
};

const CHANNEL_EMOJI: Record<string, string> = {
  website:         '🌐',
  linkedin:        '💼',
  instagram:       '📸',
  tiktok:          '🎵',
  facebook:        '📘',
  google_business: '🔍',
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function buildChannelChips(channels: string[]): string {
  return channels
    .map(c => {
      const emoji = CHANNEL_EMOJI[c] ?? '📣';
      const label = CHANNEL_LABELS[c] ?? c;
      return `<span style="display:inline-block;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600;color:#334155;margin:2px 3px;">${emoji} ${label}</span>`;
    })
    .join('');
}

/**
 * Returns a function that sends a confirmation email when a post is scheduled.
 * Silently swallows errors — notification failure never blocks UX.
 */
export function useScheduledPostNotification(
  userEmail: string | null | undefined,
  enabled: boolean
) {
  const notifyScheduled = useCallback(
    async (post: ScheduledPost) => {
      if (!userEmail || !enabled) return;

      const dateFormatted = formatDate(post.date);
      const channelList = post.channels.map(c => CHANNEL_LABELS[c] ?? c).join(', ');
      const channelChips = buildChannelChips(post.channels);
      const appUrl = window.location.origin;

      const statusLabel =
        post.status === 'approved' ? '✅ Approuvée' :
        post.status === 'pending'  ? '⏳ En attente de validation' :
        '📝 Brouillon';

      try {
        await blink.notifications.email({
          to: userEmail,
          subject: `📅 Publication planifiée pour le ${post.date} à ${post.time}`,
          html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
              <!-- Header -->
              <div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:28px 32px;">
                <h1 style="margin:0;color:#f8fafc;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Kompilot</h1>
                <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Gestionnaire de présence en ligne</p>
              </div>

              <!-- Alert banner -->
              <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:14px 32px;display:flex;align-items:center;gap:10px;">
                <span style="font-size:22px;">📅</span>
                <div>
                  <p style="margin:0;font-size:13px;font-weight:600;color:#1d4ed8;">Publication planifiée avec succès</p>
                  <p style="margin:2px 0 0;font-size:12px;color:#3b82f6;">${dateFormatted} à ${post.time}</p>
                </div>
              </div>

              <!-- Content -->
              <div style="padding:28px 32px;">
                <!-- Metadata table -->
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                  <tr>
                    <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;width:120px;font-weight:500;vertical-align:top;">Date</td>
                    <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;font-weight:600;">${dateFormatted} à ${post.time}</td>
                  </tr>
                  <tr>
                    <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;font-weight:500;vertical-align:top;">Statut</td>
                    <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;">${statusLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding:9px 0;font-size:13px;color:#64748b;font-weight:500;vertical-align:top;">Canaux</td>
                    <td style="padding:9px 0;font-size:13px;">${channelChips}</td>
                  </tr>
                </table>

                <!-- Post preview -->
                <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;border:1px solid #e2e8f0;margin-bottom:24px;">
                  <p style="margin:0 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">Aperçu de la publication</p>
                  <p style="margin:0;font-size:14px;color:#334155;line-height:1.65;white-space:pre-line;">${post.text.length > 300 ? post.text.slice(0, 300) + '…' : post.text}</p>
                </div>

                ${post.status === 'pending' ? `
                <!-- Approval notice -->
                <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin-bottom:24px;display:flex;align-items:flex-start;gap:10px;">
                  <span style="font-size:18px;line-height:1;">⚠️</span>
                  <div>
                    <p style="margin:0;font-size:13px;font-weight:600;color:#92400e;">Validation requise</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#a16207;line-height:1.5;">Cette publication est en attente de validation avant d'être publiée. Connectez-vous pour l'approuver.</p>
                  </div>
                </div>` : ''}

                <!-- CTA -->
                <a href="${appUrl}/calendar" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:-0.2px;">
                  Voir le calendrier →
                </a>
              </div>

              <!-- Footer -->
              <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
                  Vous recevez cet email car les notifications de planification sont activées dans Kompilot.<br/>
                  © ${new Date().getFullYear()} Kompilot
                </p>
              </div>
            </div>
          `,
          text: `Publication planifiée !\n\nDate : ${dateFormatted} à ${post.time}\nStatut : ${statusLabel}\nCanaux : ${channelList}\n\nAperçu :\n${post.text.slice(0, 300)}${post.text.length > 300 ? '…' : ''}\n\nVoir le calendrier : ${appUrl}/calendar`,
        });
      } catch (err) {
        console.warn('[Kompilot] Scheduled post email notification failed:', err);
      }
    },
    [userEmail, enabled]
  );

  return { notifyScheduled };
}
