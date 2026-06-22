/**
 * Performance Alert Email Templates
 *
 * Two alert types triggered by the AI performance analysis:
 *
 * 🔴 CRITICAL_DROP  — significant negative signal in the KPI data
 *    Triggers when ANY of:
 *      • Reach down ≥ 20%  vs last month
 *      • Engagement down ≥ 15% vs last month
 *      • Fewer than 3 posts published this month
 *
 * 🟢 POSITIVE_TREND — meaningful positive signal in the KPI data
 *    Triggers when ALL of:
 *      • Reach up ≥ 20%  vs last month  OR  engagement up ≥ 15%
 *      • At least 6 posts published this month
 */

const BASE_URL = 'https://kompilot.blinkpowered.com';
const TEAL     = '#0D9488';
const DARK     = '#0F172A';
const BORDER   = '#E2E8F0';
const MUTED    = '#64748B';
const LIGHT_BG = '#F8FAFC';

// ── Alert type ─────────────────────────────────────────────────────────────────

export type AlertType = 'critical_drop' | 'positive_trend';

export interface PerformanceSnapshot {
  reach: number;
  reachChange: number;       // % vs last month (can be negative)
  engagement: number;        // %
  engagementChange: number;  // % vs last month (can be negative)
  posts: number;             // this month
  topPlatform: string;
  bestPostTitle: string;
  estimatedRevenue?: number;
  establishmentName: string;
}

// ── Thresholds ─────────────────────────────────────────────────────────────────

const CRITICAL_REACH_DROP      = -20;  // % — reach fell more than this
const CRITICAL_ENGAGEMENT_DROP = -15;  // % — engagement fell more than this
const CRITICAL_LOW_POSTS       = 3;    // fewer posts than this → alert

const POSITIVE_REACH_GAIN      = 20;   // % — reach rose at least this much
const POSITIVE_ENGAGEMENT_GAIN = 15;   // % — engagement rose at least this much
const POSITIVE_MIN_POSTS       = 6;    // minimum posts to count as positive

/**
 * Analyse the snapshot and return the alert type, or null if nothing notable.
 * Critical drop takes priority over positive trend.
 */
export function classifyAlert(snap: PerformanceSnapshot): AlertType | null {
  const isCritical =
    snap.reachChange      <= CRITICAL_REACH_DROP      ||
    snap.engagementChange <= CRITICAL_ENGAGEMENT_DROP ||
    snap.posts             < CRITICAL_LOW_POSTS;

  if (isCritical) return 'critical_drop';

  const isPositive =
    snap.posts >= POSITIVE_MIN_POSTS &&
    (snap.reachChange >= POSITIVE_REACH_GAIN || snap.engagementChange >= POSITIVE_ENGAGEMENT_GAIN);

  if (isPositive) return 'positive_trend';

  return null;
}

// ── Shared HTML wrapper ────────────────────────────────────────────────────────

function wrap(subject: string, body: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;
                    border:1px solid ${BORDER};overflow:hidden;">

        <!-- Logo header -->
        <tr>
          <td style="background:${DARK};padding:24px 36px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#F8FAFC;letter-spacing:-0.3px;">
              🤖 Kompilot
            </p>
            <p style="margin:3px 0 0;font-size:12px;color:#94A3B8;">
              Alerte de performance · Rapport IA
            </p>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:32px 36px 24px;">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 36px 24px;border-top:1px solid ${BORDER};">
            <p style="margin:0;font-size:11px;color:#94A3B8;line-height:1.6;">
              Vous recevez cet e-mail car vous avez activé les alertes de performance Kompilot.<br/>
              <a href="${BASE_URL}/settings" style="color:${TEAL};text-decoration:none;">
                Gérer mes préférences de notification
              </a>
              &nbsp;·&nbsp;
              <a href="${BASE_URL}/performance" style="color:${TEAL};text-decoration:none;">
                Voir mes statistiques complètes
              </a>
            </p>
            <p style="margin:10px 0 0;font-size:11px;color:#cbd5e1;">
              © ${year} Kompilot. Tous droits réservés.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Stat pill helper ───────────────────────────────────────────────────────────

function statPill(label: string, value: string, color: string): string {
  return `
    <td style="padding:0 6px 0 0;">
      <div style="background:${color}15;border:1px solid ${color}30;border-radius:8px;
                  padding:10px 14px;text-align:center;min-width:100px;">
        <p style="margin:0;font-size:18px;font-weight:800;color:${color};">${value}</p>
        <p style="margin:3px 0 0;font-size:11px;color:${MUTED};">${label}</p>
      </div>
    </td>`;
}

// ── 🔴 Critical drop template ──────────────────────────────────────────────────

export interface AlertEmailParams {
  firstName: string;
  email: string;
  snap: PerformanceSnapshot;
  aiSummary: string;        // Key section from AI analysis (≤ 200 chars)
}

export function buildCriticalDropEmail(p: AlertEmailParams): {
  subject: string; html: string; text: string;
} {
  const { firstName, snap, aiSummary } = p;
  const subject = `⚠️ Alerte performance — baisse détectée sur ${snap.establishmentName}`;

  // Build the specific warnings
  const warnings: string[] = [];
  if (snap.reachChange <= CRITICAL_REACH_DROP)
    warnings.push(`Portée en baisse de <strong>${Math.abs(snap.reachChange)}%</strong> vs le mois dernier`);
  if (snap.engagementChange <= CRITICAL_ENGAGEMENT_DROP)
    warnings.push(`Engagement en baisse de <strong>${Math.abs(snap.engagementChange)}%</strong> vs le mois dernier`);
  if (snap.posts < CRITICAL_LOW_POSTS)
    warnings.push(`Seulement <strong>${snap.posts} publication${snap.posts > 1 ? 's' : ''}</strong> ce mois (minimum recommandé : 8)`);

  const body = `
    <p style="margin:0 0 4px;font-size:22px;">⚠️</p>
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:800;color:${DARK};line-height:1.2;">
      Baisse de performance détectée
    </h1>
    <p style="margin:0 0 22px;font-size:14px;color:${MUTED};">
      Établissement : <strong style="color:${DARK};">${snap.establishmentName}</strong>
      &nbsp;·&nbsp; ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
    </p>

    <p style="margin:0 0 16px;font-size:15px;color:${DARK};line-height:1.6;">
      Bonjour <strong>${firstName}</strong>,<br/>
      Notre IA a détecté des signaux préoccupants dans vos statistiques ce mois-ci.
      Une action rapide peut inverser la tendance.
    </p>

    <!-- Warning list -->
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;
                padding:16px 20px;margin:0 0 22px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#991b1b;">
        🔴 Signaux identifiés par l'IA :
      </p>
      ${warnings.map(w => `
        <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">
          <span style="color:#dc2626;font-size:16px;line-height:1;flex-shrink:0;">•</span>
          <p style="margin:0;font-size:13px;color:#7f1d1d;line-height:1.5;">${w}</p>
        </div>`).join('')}
    </div>

    <!-- KPI pills -->
    <table role="presentation" cellpadding="0" cellspacing="0"
           style="margin:0 0 22px;border-collapse:separate;">
      <tr>
        ${statPill('Portée', `${snap.reach.toLocaleString('fr-FR')}`, '#ef4444')}
        ${statPill('Engagement', `${snap.engagement}%`, '#f97316')}
        ${statPill('Publications', `${snap.posts}/12`, snap.posts < 6 ? '#ef4444' : '#f97316')}
      </tr>
    </table>

    <!-- AI summary -->
    ${aiSummary ? `
    <div style="background:${LIGHT_BG};border:1px solid ${BORDER};border-radius:10px;
                padding:14px 18px;margin:0 0 24px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${MUTED};
                text-transform:uppercase;letter-spacing:0.5px;">
        💡 Analyse de votre Copilote IA
      </p>
      <p style="margin:0;font-size:13px;color:${DARK};line-height:1.6;">${aiSummary}</p>
    </div>` : ''}

    <!-- Actions -->
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${DARK};">
      Actions recommandées maintenant :
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td style="padding:0 8px 0 0;">
          <a href="${BASE_URL}/calendar"
             style="display:inline-block;background:${TEAL};color:#fff;font-size:13px;
                    font-weight:700;text-decoration:none;padding:11px 20px;border-radius:8px;">
            📅 Publier maintenant
          </a>
        </td>
        <td>
          <a href="${BASE_URL}/performance"
             style="display:inline-block;background:#fff;color:${TEAL};font-size:13px;
                    font-weight:700;text-decoration:none;padding:10px 20px;border-radius:8px;
                    border:1.5px solid ${TEAL};">
            📊 Voir les stats complètes
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.6;">
      Publiez <strong>2–3 fois cette semaine</strong> pour signaler à l'algorithme que votre compte
      est actif. Même un post simple vaut mieux qu'un silence prolongé. 💪
    </p>`;

  const text = `⚠️ Baisse de performance détectée — ${snap.establishmentName}

Bonjour ${firstName},

Notre IA a détecté des signaux préoccupants ce mois-ci :
${warnings.map(w => `• ${w.replace(/<[^>]*>/g, '')}`).join('\n')}

KPIs actuels :
• Portée : ${snap.reach.toLocaleString('fr-FR')}
• Engagement : ${snap.engagement}%
• Publications : ${snap.posts}/12

${aiSummary ? `Analyse IA :\n${aiSummary}\n\n` : ''}Actions recommandées :
→ Publier un post maintenant : ${BASE_URL}/calendar
→ Voir les stats complètes : ${BASE_URL}/performance

Publiez 2–3 fois cette semaine pour inverser la tendance.

—
Kompilot · support@kompilot.fr`;

  return { subject, html: wrap(subject, body), text };
}

// ── 🟢 Positive trend template ─────────────────────────────────────────────────

export function buildPositiveTrendEmail(p: AlertEmailParams): {
  subject: string; html: string; text: string;
} {
  const { firstName, snap, aiSummary } = p;
  const subject = `🚀 Excellentes performances ce mois-ci — ${snap.establishmentName} progresse !`;

  const wins: string[] = [];
  if (snap.reachChange >= POSITIVE_REACH_GAIN)
    wins.push(`Portée en hausse de <strong>+${snap.reachChange}%</strong> vs le mois dernier 🎉`);
  if (snap.engagementChange >= POSITIVE_ENGAGEMENT_GAIN)
    wins.push(`Engagement en hausse de <strong>+${snap.engagementChange}%</strong> vs le mois dernier ❤️`);
  if (snap.posts >= 10)
    wins.push(`<strong>${snap.posts} publications</strong> ce mois — excellente fréquence ! 📅`);
  if (snap.estimatedRevenue && snap.estimatedRevenue > 0)
    wins.push(`CA estimé généré : <strong>${snap.estimatedRevenue.toLocaleString('fr-FR')} €</strong> 💶`);

  const body = `
    <p style="margin:0 0 4px;font-size:28px;">🚀</p>
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:800;color:${DARK};line-height:1.2;">
      Excellentes performances ce mois-ci !
    </h1>
    <p style="margin:0 0 22px;font-size:14px;color:${MUTED};">
      Établissement : <strong style="color:${DARK};">${snap.establishmentName}</strong>
      &nbsp;·&nbsp; ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
    </p>

    <p style="margin:0 0 16px;font-size:15px;color:${DARK};line-height:1.6;">
      Bonjour <strong>${firstName}</strong> ! 🎉<br/>
      Votre Copilote IA a identifié des <strong>tendances très positives</strong> dans vos
      statistiques ce mois-ci. Vous êtes sur la bonne voie — continuez comme ça !
    </p>

    <!-- Win list -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;
                padding:16px 20px;margin:0 0 22px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#166534;">
        🟢 Points forts identifiés par l'IA :
      </p>
      ${wins.map(w => `
        <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">
          <span style="color:#16a34a;font-size:16px;line-height:1;flex-shrink:0;">✓</span>
          <p style="margin:0;font-size:13px;color:#14532d;line-height:1.5;">${w}</p>
        </div>`).join('')}
    </div>

    <!-- KPI pills -->
    <table role="presentation" cellpadding="0" cellspacing="0"
           style="margin:0 0 22px;border-collapse:separate;">
      <tr>
        ${statPill('Portée', `${snap.reach.toLocaleString('fr-FR')}`, '#16a34a')}
        ${statPill('Engagement', `${snap.engagement}%`, '#0d9488')}
        ${statPill('Publications', `${snap.posts}/12`, '#7c3aed')}
      </tr>
    </table>

    <!-- AI summary -->
    ${aiSummary ? `
    <div style="background:${LIGHT_BG};border:1px solid ${BORDER};border-radius:10px;
                padding:14px 18px;margin:0 0 24px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${MUTED};
                text-transform:uppercase;letter-spacing:0.5px;">
        💡 Analyse de votre Copilote IA
      </p>
      <p style="margin:0;font-size:13px;color:${DARK};line-height:1.6;">${aiSummary}</p>
    </div>` : ''}

    <!-- Amplify CTA -->
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${DARK};">
      Profitez de cette dynamique pour aller encore plus loin :
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="padding:0 8px 0 0;">
          <a href="${BASE_URL}/cockpit"
             style="display:inline-block;background:linear-gradient(135deg,${TEAL},#7c3aed);
                    color:#fff;font-size:13px;font-weight:700;text-decoration:none;
                    padding:11px 20px;border-radius:8px;">
            ⚡ Générer un post viral maintenant
          </a>
        </td>
        <td>
          <a href="${BASE_URL}/performance"
             style="display:inline-block;background:#fff;color:${TEAL};font-size:13px;
                    font-weight:700;text-decoration:none;padding:10px 20px;border-radius:8px;
                    border:1.5px solid ${TEAL};">
            📊 Voir l'analyse complète
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.6;">
      C'est le bon moment pour <strong>amplifier ce qui fonctionne</strong> :
      boostez votre meilleur post (<em>${snap.bestPostTitle}</em>) sur ${snap.topPlatform}
      et maintenez cette cadence de publication. 💪
    </p>`;

  const text = `🚀 Excellentes performances — ${snap.establishmentName}

Bonjour ${firstName} ! 🎉

Votre Copilote IA a identifié des tendances très positives ce mois-ci :
${wins.map(w => `✓ ${w.replace(/<[^>]*>/g, '')}`).join('\n')}

KPIs actuels :
• Portée : ${snap.reach.toLocaleString('fr-FR')}
• Engagement : ${snap.engagement}%
• Publications : ${snap.posts}/12

${aiSummary ? `Analyse IA :\n${aiSummary}\n\n` : ''}Profitez de cette dynamique :
→ Générer un post viral : ${BASE_URL}/cockpit
→ Voir l'analyse complète : ${BASE_URL}/performance

—
Kompilot · support@kompilot.fr`;

  return { subject, html: wrap(subject, body), text };
}
