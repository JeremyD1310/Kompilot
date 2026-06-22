/**
 * notificationEmailTemplates.ts
 * HTML + plain-text email templates for all Kompilot notification types.
 * All styles are inline — no external stylesheets, no images.
 */

// ── Design tokens (match app brand) ──────────────────────────────────────────
const TEAL   = '#0D9488';
const DARK   = '#0F172A';
const LIGHT  = '#F8FAFC';
const BORDER = '#E2E8F0';
const TEXT   = '#1E293B';
const MUTED  = '#64748B';
const YEAR   = new Date().getFullYear();

function emailWrapper(headerColor: string, headerIcon: string, headerTitle: string, headerSub: string, bodyHtml: string, footerNote: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid ${BORDER};overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:${DARK};padding:24px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#F8FAFC;letter-spacing:-0.3px;">Kompilot</p>
            <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;">Gestionnaire de présence en ligne</p>
          </td>
        </tr>
        <!-- Alert banner -->
        <tr>
          <td style="background:${headerColor};padding:14px 32px;">
            <p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;">${headerIcon} ${headerTitle}</p>
            <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.85);">${headerSub}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:28px 32px;">${bodyHtml}</td></tr>
        <!-- Divider -->
        <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid ${BORDER};margin:0;"/></td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:18px 32px;background:${LIGHT};">
            <p style="margin:0;font-size:11px;color:${MUTED};line-height:1.6;text-align:center;">
              ${footerNote}<br/>
              <a href="${window?.location?.origin ?? 'https://kompilot.app'}/account" style="color:${MUTED};">Gérer mes notifications</a>
              &nbsp;·&nbsp;
              <a href="https://kompilot.app/privacy" style="color:${MUTED};">Confidentialité</a>
              <br/>© ${YEAR} Kompilot
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── 1. New inbox / live-chat message ─────────────────────────────────────────

export interface NewMessageEmailParams {
  senderName: string;
  senderChannel: string;
  messagePreview: string;
  dashboardUrl: string;
  businessName?: string;
}

export function getNewMessageEmailSubject(senderName: string, channel: string): string {
  return `💬 Nouveau message de ${senderName} via ${channel}`;
}

export function getNewMessageEmailHtml(p: NewMessageEmailParams): string {
  const appUrl = p.dashboardUrl || `${window?.location?.origin ?? ''}/live-chat`;
  const body = `
    <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:${TEXT};">Vous avez un nouveau message</p>
    <p style="margin:0 0 20px;font-size:14px;color:${TEXT};line-height:1.6;">
      <strong>${p.senderName}</strong> vous a envoyé un message via <strong>${p.senderChannel}</strong>${p.businessName ? ` concernant <em>${p.businessName}</em>` : ''}.
    </p>
    <div style="background:#F8FAFC;border-left:4px solid ${TEAL};border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:${MUTED};margin-bottom:6px;">Aperçu du message</p>
      <p style="margin:0;font-size:14px;color:${TEXT};line-height:1.65;font-style:italic;">"${p.messagePreview.slice(0, 200)}${p.messagePreview.length > 200 ? '…' : ''}"</p>
    </div>
    <p style="margin:0 0 20px;font-size:13px;color:${MUTED};">
      ⏱ Répondez rapidement — les clients qui reçoivent une réponse en moins de 5 minutes ont 3× plus de chances de convertir.
    </p>
    <a href="${appUrl}" style="display:inline-block;background:${TEAL};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Répondre maintenant →
    </a>
  `;
  return emailWrapper(TEAL, '💬', `Nouveau message de ${p.senderName}`, p.senderChannel, body,
    'Vous recevez cet email car les notifications de messages sont activées dans Kompilot.');
}

export function getNewMessageEmailText(p: NewMessageEmailParams): string {
  return `Nouveau message de ${p.senderName} via ${p.senderChannel}\n\nAperçu : "${p.messagePreview.slice(0, 200)}"\n\nRépondez maintenant : ${p.dashboardUrl}\n\n---\nGérer mes notifications : ${window?.location?.origin ?? ''}/account\n© ${YEAR} Kompilot`;
}

// ── 2. Upcoming scheduled post reminder ──────────────────────────────────────

export interface UpcomingPostEmailParams {
  postTitle: string;
  postPreview: string;
  scheduledDate: string;
  scheduledTime: string;
  channels: string[];
  calendarUrl: string;
}

export function getUpcomingPostEmailSubject(date: string, time: string): string {
  return `⏰ Rappel : publication prévue demain ${date} à ${time}`;
}

export function getUpcomingPostEmailHtml(p: UpcomingPostEmailParams): string {
  const channelChips = p.channels.map(c => {
    const labels: Record<string, string> = { instagram: '📸 Instagram', facebook: '📘 Facebook', google_business: '🔍 Google', website: '🌐 Site web', tiktok: '🎵 TikTok' };
    return `<span style="display:inline-block;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:16px;padding:3px 10px;font-size:12px;font-weight:600;color:#1D4ED8;margin:2px 3px;">${labels[c] ?? c}</span>`;
  }).join('');

  const body = `
    <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:${TEXT};">Publication prévue demain</p>
    <p style="margin:0 0 20px;font-size:14px;color:${TEXT};line-height:1.6;">
      Une de vos publications est planifiée pour demain <strong>${p.scheduledDate} à ${p.scheduledTime}</strong>. Vérifiez qu'elle est prête à être publiée.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:${MUTED};width:110px;font-weight:500;">Date</td>
        <td style="padding:9px 0;border-bottom:1px solid #F1F5F9;font-size:13px;font-weight:600;color:${TEXT};">${p.scheduledDate} à ${p.scheduledTime}</td>
      </tr>
      <tr>
        <td style="padding:9px 0;font-size:13px;color:${MUTED};font-weight:500;vertical-align:top;">Canaux</td>
        <td style="padding:9px 0;font-size:13px;">${channelChips}</td>
      </tr>
    </table>
    <div style="background:#F8FAFC;border-radius:8px;padding:16px;border:1px solid ${BORDER};margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:${MUTED};">Aperçu</p>
      <p style="margin:0;font-size:14px;color:${TEXT};line-height:1.65;white-space:pre-line;">${p.postPreview.slice(0, 300)}${p.postPreview.length > 300 ? '…' : ''}</p>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <a href="${p.calendarUrl}" style="display:inline-block;background:${DARK};color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-size:14px;font-weight:600;">
        Voir le calendrier →
      </a>
      <a href="${p.calendarUrl}" style="display:inline-block;background:#F1F5F9;color:${TEXT};text-decoration:none;padding:11px 20px;border-radius:8px;font-size:14px;font-weight:600;border:1px solid ${BORDER};">
        Modifier la publication
      </a>
    </div>
  `;
  return emailWrapper('#3B82F6', '⏰', 'Rappel de publication', `Planifiée pour ${p.scheduledDate} à ${p.scheduledTime}`, body,
    'Vous recevez cet email car les rappels de publication sont activés dans Kompilot.');
}

export function getUpcomingPostEmailText(p: UpcomingPostEmailParams): string {
  return `Rappel : publication planifiée pour ${p.scheduledDate} à ${p.scheduledTime}\n\nCanaux : ${p.channels.join(', ')}\n\nAperçu :\n${p.postPreview.slice(0, 300)}\n\nVoir le calendrier : ${p.calendarUrl}\n\n© ${YEAR} Kompilot`;
}

// ── 3. New Google review alert ────────────────────────────────────────────────

export interface NewReviewEmailParams {
  reviewerName: string;
  rating: number;
  reviewText: string;
  businessName: string;
  reviewsUrl: string;
}

export function getNewReviewEmailSubject(rating: number, reviewer: string): string {
  const stars = '⭐'.repeat(Math.min(rating, 5));
  return `${stars} Nouvel avis Google de ${reviewer}`;
}

export function getNewReviewEmailHtml(p: NewReviewEmailParams): string {
  const stars = Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < p.rating ? '#F59E0B' : '#E2E8F0'};font-size:18px;">★</span>`
  ).join('');

  const sentimentColor = p.rating >= 4 ? '#10B981' : p.rating === 3 ? '#F59E0B' : '#EF4444';
  const sentimentLabel = p.rating >= 4 ? '😊 Avis positif' : p.rating === 3 ? '😐 Avis neutre' : '😟 Avis négatif — répondez rapidement';

  const body = `
    <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:${TEXT};">Nouvel avis Google Maps</p>
    <p style="margin:0 0 20px;font-size:14px;color:${TEXT};line-height:1.6;">
      <strong>${p.reviewerName}</strong> vient de laisser un avis sur la fiche Google de <strong>${p.businessName}</strong>.
    </p>
    <div style="background:#F8FAFC;border-radius:10px;padding:18px 20px;border:1px solid ${BORDER};margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="width:40px;height:40px;border-radius:50%;background:${sentimentColor};display:flex;align-items:center;justify-content:center;color:#ffffff;font-weight:700;font-size:16px;flex-shrink:0;">${p.reviewerName[0]}</div>
        <div>
          <p style="margin:0;font-size:14px;font-weight:700;color:${TEXT};">${p.reviewerName}</p>
          <div style="margin:4px 0 0;">${stars}</div>
        </div>
        <span style="margin-left:auto;font-size:12px;font-weight:600;color:${sentimentColor};background:${sentimentColor}22;border-radius:20px;padding:3px 10px;">${sentimentLabel}</span>
      </div>
      <p style="margin:0;font-size:14px;color:${TEXT};line-height:1.65;font-style:italic;">"${p.reviewText}"</p>
    </div>
    <p style="margin:0 0 20px;font-size:13px;color:${MUTED};">
      ${p.rating < 4 ? '⚠️ Les avis négatifs sans réponse peuvent réduire votre note moyenne. Répondez dans les 24h pour montrer votre professionnalisme.' : '✅ Pensez à remercier ce client — cela encourage d\'autres avis positifs.'}
    </p>
    <a href="${p.reviewsUrl}" style="display:inline-block;background:${TEAL};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Répondre à l'avis →
    </a>
  `;
  return emailWrapper(p.rating >= 4 ? '#10B981' : '#EF4444', p.rating >= 4 ? '⭐' : '⚠️', `Avis ${p.rating}/5 de ${p.reviewerName}`, p.businessName, body,
    'Vous recevez cet email car les alertes d\'avis sont activées dans Kompilot.');
}

export function getNewReviewEmailText(p: NewReviewEmailParams): string {
  const stars = '★'.repeat(p.rating) + '☆'.repeat(5 - p.rating);
  return `Nouvel avis Google de ${p.reviewerName} — ${stars}\n\n"${p.reviewText}"\n\nRépondre : ${p.reviewsUrl}\n\n© ${YEAR} Kompilot`;
}

// ── 4. Weekly digest ─────────────────────────────────────────────────────────

export interface WeeklyDigestEmailParams {
  displayName: string;
  weekLabel: string;  // e.g. "2–8 juin 2025"
  stats: {
    postsPublished: number;
    messagesReceived: number;
    avgRating: number;
    reach: number;
    reachChange: number;
  };
  topPost?: { title: string; reach: number };
  dashboardUrl: string;
}

export function getWeeklyDigestEmailSubject(weekLabel: string): string {
  return `📊 Votre bilan Kompilot — semaine du ${weekLabel}`;
}

export function getWeeklyDigestEmailHtml(p: WeeklyDigestEmailParams): string {
  const { stats } = p;
  const reachSign = stats.reachChange >= 0 ? '+' : '';
  const reachColor = stats.reachChange >= 0 ? '#10B981' : '#EF4444';

  const kpiRow = (label: string, value: string, sub: string, color: string) =>
    `<td style="padding:16px;text-align:center;border-right:1px solid ${BORDER};">
      <p style="margin:0;font-size:22px;font-weight:800;color:${color};">${value}</p>
      <p style="margin:4px 0 0;font-size:12px;font-weight:600;color:${TEXT};">${label}</p>
      <p style="margin:2px 0 0;font-size:11px;color:${MUTED};">${sub}</p>
    </td>`;

  const body = `
    <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:${TEXT};">Bonjour ${p.displayName || ''} 👋</p>
    <p style="margin:0 0 24px;font-size:14px;color:${MUTED};">Voici votre bilan de la semaine du <strong style="color:${TEXT};">${p.weekLabel}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid ${BORDER};margin-bottom:24px;">
      <tr style="background:#F8FAFC;">
        ${kpiRow('Publications', stats.postsPublished.toString(), 'cette semaine', TEAL)}
        ${kpiRow('Messages reçus', stats.messagesReceived.toString(), 'toutes plateformes', '#3B82F6')}
        ${kpiRow('Note moyenne', `${stats.avgRating.toFixed(1)}/5`, 'avis Google', '#F59E0B')}
        <td style="padding:16px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:800;color:${reachColor};">${stats.reach.toLocaleString('fr-FR')}</p>
          <p style="margin:4px 0 0;font-size:12px;font-weight:600;color:${TEXT};">Portée totale</p>
          <p style="margin:2px 0 0;font-size:11px;color:${reachColor};">${reachSign}${stats.reachChange}% vs. semaine dernière</p>
        </td>
      </tr>
    </table>
    ${p.topPost ? `
    <div style="background:#EFF6FF;border-radius:8px;padding:14px 18px;border:1px solid #BFDBFE;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#1D4ED8;text-transform:uppercase;letter-spacing:0.5px;">🏆 Meilleure publication de la semaine</p>
      <p style="margin:0;font-size:14px;color:${TEXT};font-weight:600;">${p.topPost.title}</p>
      <p style="margin:2px 0 0;font-size:12px;color:${MUTED};">${p.topPost.reach.toLocaleString('fr-FR')} personnes atteintes</p>
    </div>` : ''}
    <a href="${p.dashboardUrl}" style="display:inline-block;background:${DARK};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Voir mon tableau de bord →
    </a>
  `;
  return emailWrapper('#7C3AED', '📊', `Bilan — semaine du ${p.weekLabel}`, 'Votre activité Kompilot résumée', body,
    'Vous recevez ce rapport car le résumé hebdomadaire est activé dans Kompilot.');
}

export function getWeeklyDigestEmailText(p: WeeklyDigestEmailParams): string {
  const { stats } = p;
  return `Bilan Kompilot — semaine du ${p.weekLabel}\n\nPublications : ${stats.postsPublished}\nMessages reçus : ${stats.messagesReceived}\nNote Google : ${stats.avgRating.toFixed(1)}/5\nPortée : ${stats.reach.toLocaleString('fr-FR')}\n\nTableau de bord : ${p.dashboardUrl}\n\n© ${YEAR} Kompilot`;
}
