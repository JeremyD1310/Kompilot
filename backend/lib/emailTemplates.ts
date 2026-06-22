/**
 * Email HTML templates for Kompilot transactional emails.
 */

// ── Shared constants ─────────────────────────────────────────────────────────

const DASHBOARD_URL = 'https://kompilot.blinkpowered.com/dashboard';
const BASE_URL      = 'https://kompilot.blinkpowered.com';

const LOGO_SVG = `<svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="8" fill="#0D9488"/>
  <path d="M8 16 C8 11 12 8 16 8 C20 8 24 11 24 16" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <circle cx="16" cy="16" r="3" fill="white"/>
  <path d="M13 22 L16 19 L19 22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const EMAIL_FOOTER = `
<div style="background:#F8FAFC;padding:20px 32px;border-top:1px solid #E2E8F0;text-align:center;">
  <p style="margin:0 0 6px;font-size:11px;color:#94A3B8;">
    Kompilot · 123 Rue de la Visibilité, 75001 Paris
  </p>
  <p style="margin:0;font-size:11px;color:#94A3B8;">
    <a href="${BASE_URL}/legal" style="color:#94A3B8;text-decoration:underline;">Mentions légales</a>
    &nbsp;·&nbsp;
    <a href="${BASE_URL}/privacy" style="color:#94A3B8;text-decoration:underline;">Confidentialité</a>
    &nbsp;·&nbsp;
    <a href="${BASE_URL}/subscription" style="color:#94A3B8;text-decoration:underline;">Se désabonner</a>
  </p>
  <p style="margin:8px 0 0;font-size:10px;color:#CBD5E1;">© ${new Date().getFullYear()} Kompilot. Tous droits réservés.</p>
</div>`;

function wrapEmailHtml(headerTitle: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0D9488 0%,#0F766E 100%);padding:28px 32px 24px;">
      <div style="display:flex;align-items:center;gap:12px;">
        ${LOGO_SVG}
        <span style="color:white;font-size:20px;font-weight:800;letter-spacing:-0.3px;">Kompilot</span>
      </div>
    </div>
    <!-- Body -->
    <div style="padding:36px 32px;">
      ${body}
    </div>
    <!-- Footer -->
    ${EMAIL_FOOTER}
  </div>
</body>
</html>`;
}

// ── Sector-specific actions ──────────────────────────────────────────────────

interface SectorAction { emoji: string; title: string; desc: string; }

const SECTOR_ACTIONS: Record<string, SectorAction[]> = {
  restauration: [
    { emoji: '📍', title: 'Complétez votre fiche Google',      desc: 'Photos, horaires, menu — 80 % des clients lisent la fiche avant de venir.' },
    { emoji: '⭐', title: 'Répondez à vos 3 derniers avis',    desc: 'Une réponse augmente la note perçue de +0,3 point en moyenne.' },
    { emoji: '📅', title: 'Planifiez votre post de la semaine', desc: 'Un post/semaine multiplie votre portée locale par 4.' },
  ],
  beaute: [
    { emoji: '📸', title: 'Ajoutez 5 photos de réalisations',  desc: 'Les visuels sont le premier critère de choix pour 74 % des clientes.' },
    { emoji: '⭐', title: "Activez la collecte d'avis",         desc: 'Envoyez un SMS post-RDV pour doubler vos avis Google en 30 jours.' },
    { emoji: '📣', title: 'Publiez une offre flash',            desc: "Les offres limitées génèrent 3× plus d'interactions." },
  ],
  sante: [
    { emoji: '🕐', title: 'Vérifiez vos horaires en ligne',    desc: 'Les patients consultent Doctolib ET Google — restez synchronisé.' },
    { emoji: '📋', title: 'Complétez votre fiche praticien',   desc: 'Spécialités, langues, équipements — chaque détail compte.' },
    { emoji: '💬', title: 'Répondez à vos derniers avis',      desc: 'La confiance passe avant tout par la réactivité perçue.' },
  ],
  commerce: [
    { emoji: '🏪', title: 'Complétez votre fiche Google',      desc: 'Horaires à jour + photos récentes = +25 % de visites en magasin.' },
    { emoji: '🎯', title: 'Lancez une campagne locale',         desc: 'Ciblez les clients dans un rayon de 5 km depuis votre cockpit.' },
    { emoji: '📲', title: 'Activez les publications auto',      desc: 'Publiez sur Google, Insta et Facebook en un seul clic.' },
  ],
  immobilier: [
    { emoji: '🏠', title: 'Publiez vos dernières annonces',    desc: "Les biens mis en avant sur Google Maps reçoivent 3× plus d'appels." },
    { emoji: '⭐', title: 'Collectez des avis mandataires',    desc: 'Un bon score Google est votre meilleure carte de visite.' },
    { emoji: '📊', title: 'Analysez votre visibilité locale',  desc: 'Identifiez les quartiers où vous êtes sous-représenté.' },
  ],
  artisanat: [
    { emoji: '🔨', title: 'Mettez vos réalisations en avant',  desc: "Avant/après photos = le contenu le plus partagé dans l'artisanat." },
    { emoji: '📍', title: 'Géolocalisez vos chantiers',        desc: 'Chaque chantier terminé est une opportunité de client local.' },
    { emoji: '💬', title: 'Répondez aux avis clients',         desc: 'Un artisan qui répond aux avis obtient 40 % de contacts en plus.' },
  ],
};

const DEFAULT_ACTIONS: SectorAction[] = [
  { emoji: '📍', title: 'Complétez votre profil établissement', desc: 'Un profil complet augmente votre visibilité de 60 %.' },
  { emoji: '📅', title: 'Planifiez votre premier post',         desc: 'La régularité est la clé de la visibilité locale.' },
  { emoji: '⭐', title: 'Activez la gestion des avis',          desc: 'Répondez à vos avis pour renforcer la confiance.' },
];

function getSectorActions(sector: string): SectorAction[] {
  return SECTOR_ACTIONS[sector] ?? DEFAULT_ACTIONS;
}

function renderActions(actions: SectorAction[]): string {
  return actions.map((a, i) => `
    <tr>
      <td style="padding:${i === 0 ? '0' : '16px'} 0 ${i === actions.length - 1 ? '0' : '0'};vertical-align:top;">
        <div style="display:flex;align-items:flex-start;gap:14px;padding:16px;background:#F8FAFC;border-radius:12px;border-left:3px solid #0D9488;margin-bottom:${i < actions.length - 1 ? '12px' : '0'};">
          <span style="font-size:22px;line-height:1;">${a.emoji}</span>
          <div>
            <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#0F172A;">${a.title}</p>
            <p style="margin:0;font-size:13px;color:#64748B;line-height:1.5;">${a.desc}</p>
          </div>
        </div>
      </td>
    </tr>`).join('');
}

// ── Welcome J0 email ─────────────────────────────────────────────────────────

export interface WelcomeEmailParams {
  displayName: string;
  sector: string;
  objective: string;
  dashboardUrl?: string;
}

export function buildWelcomeEmail(params: WelcomeEmailParams): { subject: string; html: string; text: string } {
  const { displayName, sector, objective } = params;
  const dashboardUrl = params.dashboardUrl ?? DASHBOARD_URL;
  const firstName    = displayName.split(' ')[0] || 'là';
  const actions      = getSectorActions(sector);

  const sectorLabel: Record<string, string> = {
    restauration: 'restauration', beaute: 'beauté & bien-être', sante: 'santé',
    commerce: 'commerce', immobilier: 'immobilier', artisanat: 'artisanat',
    sport: 'sport & fitness', education: 'éducation', tech: 'tech & SaaS',
    conseil: 'conseil & services', tourisme: 'tourisme & hôtellerie',
  };
  const sectorDisplay = sectorLabel[sector] ?? sector;

  const subject = `Bienvenue ${firstName} 🚀 — Votre moteur de visibilité locale est prêt`;

  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0F172A;line-height:1.25;">
      Bonjour ${firstName} ! 👋
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748B;line-height:1.6;">
      Votre espace <strong style="color:#0D9488;">${sectorDisplay}</strong> est configuré et prêt à décoller.
    </p>

    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      Vos futurs clients vous cherchent déjà sur <strong>Google</strong> et <strong>ChatGPT</strong>.
      Voici vos <strong>3 premières actions recommandées</strong> pour booster votre visibilité dès aujourd'hui&nbsp;:
    </p>

    <!-- Actions contextuelles -->
    <table style="width:100%;border-collapse:collapse;margin:0 0 28px;">
      <tbody>
        ${renderActions(actions)}
      </tbody>
    </table>

    <!-- CTA button -->
    <div style="text-align:center;margin:0 0 28px;">
      <a href="${dashboardUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#0D9488,#0F766E);color:white;font-size:15px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:10px;box-shadow:0 4px 12px rgba(13,148,136,0.3);">
        Accéder à mon tableau de bord →
      </a>
    </div>

    <!-- Tip box -->
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px 20px;margin:0 0 8px;">
      <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
        💡 <strong>Astuce IA :</strong> Dans votre cockpit, demandez à l'IA de générer votre premier post en 10 secondes —
        juste en décrivant votre activité en une phrase.
      </p>
    </div>`;

  const text = `Bienvenue ${firstName} 🚀 — Votre moteur de visibilité locale est prêt

Bonjour ${firstName},

Votre espace ${sectorDisplay} est configuré. Voici vos 3 premières actions recommandées :

${actions.map((a, i) => `${i + 1}. ${a.title} — ${a.desc}`).join('\n')}

→ Accéder à mon tableau de bord : ${dashboardUrl}

💡 Astuce : Dans votre cockpit, demandez à l'IA de générer votre premier post en 10 secondes.

—
Kompilot · support@kompilot.com
${BASE_URL}/legal | ${BASE_URL}/privacy`;

  return { subject, html: wrapEmailHtml('Bienvenue sur Kompilot', body), text };
}

// ── Welcome J3 reminder email ────────────────────────────────────────────────

export interface WelcomeJ3EmailParams {
  displayName: string;
  sector: string;
  dashboardUrl?: string;
}

export function buildWelcomeJ3Email(params: WelcomeJ3EmailParams): { subject: string; html: string; text: string } {
  const { displayName, sector } = params;
  const dashboardUrl = params.dashboardUrl ?? DASHBOARD_URL;
  const firstName    = displayName.split(' ')[0] || 'là';
  const actions      = getSectorActions(sector);

  const subject = `${firstName}, avez-vous publié votre premier post ? 📅`;

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0F172A;line-height:1.25;">
      Votre cockpit vous attend, ${firstName} 🎯
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748B;line-height:1.6;">
      Vous avez créé votre espace il y a 3 jours — c'est le bon moment pour franchir le cap !
    </p>

    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      Les commerces qui publient leur <strong>premier post dans les 3 jours</strong> après l'inscription
      gagnent en moyenne <strong>+34 % de visibilité locale</strong> dès la première semaine.
    </p>

    <!-- Reminder actions -->
    <table style="width:100%;border-collapse:collapse;margin:0 0 28px;">
      <tbody>
        ${renderActions([actions[0], actions[2] ?? actions[1]])}
      </tbody>
    </table>

    <!-- AI tip callout -->
    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:20px;margin:0 0 28px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1E40AF;text-transform:uppercase;letter-spacing:0.5px;">
        🤖 Tip IA — Générez 1 mois de posts en 2 minutes
      </p>
      <p style="margin:0;font-size:14px;color:#1E3A8A;line-height:1.6;">
        Dans la section <strong>Calendrier éditorial</strong>, cliquez sur <em>"Générer avec l'IA"</em> et
        décrivez votre activité. L'IA crée automatiquement des publications adaptées à votre secteur,
        prêtes à planifier sur Google, Instagram et Facebook.
      </p>
    </div>

    <!-- CTA button -->
    <div style="text-align:center;margin:0 0 8px;">
      <a href="${dashboardUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#0D9488,#0F766E);color:white;font-size:15px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:10px;box-shadow:0 4px 12px rgba(13,148,136,0.3);">
        Publier mon premier post →
      </a>
    </div>`;

  const text = `${firstName}, avez-vous publié votre premier post ? 📅

Bonjour ${firstName},

Vous avez créé votre espace il y a 3 jours. C'est le moment idéal pour publier votre premier post !

Les commerces qui publient dans les 3 premiers jours gagnent +34 % de visibilité locale.

Actions recommandées :
1. ${actions[0].title} — ${actions[0].desc}
2. ${(actions[2] ?? actions[1]).title} — ${(actions[2] ?? actions[1]).desc}

💡 Tip IA : Dans la section Calendrier éditorial, cliquez sur "Générer avec l'IA" pour créer 1 mois de posts en 2 minutes.

→ Publier mon premier post : ${dashboardUrl}

—
Kompilot · support@kompilot.com
${BASE_URL}/legal | ${BASE_URL}/privacy`;

  return { subject, html: wrapEmailHtml('Votre cockpit vous attend', body), text };
}

/**
 * Returns the dunning email HTML for a failed Stripe payment.
 * @param firstName  - User's first name (fallback: "là")
 * @param amount     - Formatted amount string e.g. "29€" (empty string = omit)
 * @param resumeUrl  - URL to the billing page where the user updates their card
 */
export function getDunningEmailHtml(
  firstName: string,
  amount: string,
  resumeUrl: string,
): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Paiement en échec — Kompilot</title></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Arial,sans-serif">
<div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0">
  <div style="background:#0F172A;padding:28px 32px;text-align:center">
    <span style="font-size:28px">⚠️</span>
    <h1 style="color:#ffffff;font-size:18px;margin:12px 0 4px;font-weight:800">Votre tableau de bord est en pause</h1>
    <p style="color:#94A3B8;font-size:13px;margin:0">1 action en 2 minutes pour reprendre</p>
  </div>
  <div style="padding:28px 32px">
    <p style="color:#1E293B;font-size:14px;margin:0 0 16px">Bonjour <strong>${firstName}</strong>,</p>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px">
      Le paiement${amount ? ` de <strong>${amount}</strong>` : ''} de votre abonnement Kompilot n'a pas pu être prélevé.
      Votre accès reste actif <strong>pendant encore 3 jours</strong>, le temps de régulariser.
    </p>
    <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:12px;padding:16px;margin:0 0 24px">
      <p style="color:#92400E;font-size:13px;margin:0;font-weight:600">
        💳 Après ce délai, vos automatisations, vos données CRM et votre historique de posts seront en pause.
      </p>
    </div>
    <div style="text-align:center;margin:0 0 24px">
      <a href="${resumeUrl}" style="display:inline-block;background:#0D9488;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px">
        Mettre à jour mon moyen de paiement →
      </a>
    </div>
    <p style="color:#94A3B8;font-size:12px;text-align:center;margin:0">
      Une question ? Répondez directement à cet email — nous répondons sous 4h.
    </p>
  </div>
  <div style="background:#F8FAFC;padding:16px 32px;text-align:center;border-top:1px solid #E2E8F0">
    <p style="color:#94A3B8;font-size:11px;margin:0">© ${new Date().getFullYear()} Kompilot · <a href="https://kompilot.blinkpowered.com/cgv" style="color:#94A3B8">CGV</a></p>
  </div>
</div>
</body></html>`;
}
