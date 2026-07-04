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

// ── J1 — Inactive 24h (personal text-only from Jérémy) ──────────────────────

export interface J1InactiveEmailParams {
  firstName: string;
  dashboardUrl?: string;
}

export function buildJ1InactiveEmail(params: J1InactiveEmailParams): { subject: string; html: string; text: string } {
  const { firstName } = params;
  const dashboardUrl = params.dashboardUrl ?? DASHBOARD_URL;

  const subject = `${firstName}, un souci technique ?`;

  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      Bonjour ${firstName},
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      Je suis Jérémy, fondateur de Kompilot. J'ai remarqué que vous n'avez pas encore connecté votre premier compte
      après votre inscription d'hier.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      Est-ce qu'un souci technique vous a bloqué ? Ou peut-être le manque de temps ?
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      <strong>Je me rends disponible 5 minutes</strong> pour vous aider à démarrer — sans engagement.
      Répondez simplement à cet email ou réservez un créneau :
    </p>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="https://calendly.com/jeremy-kompilot/5min"
         style="display:inline-block;background:#0D9488;color:white;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;">
        Réserver 5 min avec Jérémy →
      </a>
    </div>
    <p style="margin:0 0 8px;font-size:14px;color:#64748B;line-height:1.6;">
      Ou connectez-vous directement pour lancer votre premier diagnostic :
    </p>
    <div style="text-align:center;margin:0 0 8px;">
      <a href="${dashboardUrl}"
         style="display:inline-block;background:rgba(13,148,136,.1);color:#0D9488;font-size:13px;font-weight:700;text-decoration:none;padding:10px 24px;border-radius:8px;border:1px solid rgba(13,148,136,.25);">
        Accéder à mon cockpit →
      </a>
    </div>
    <p style="margin:20px 0 0;font-size:13px;color:#94A3B8;">
      — Jérémy<br/>Fondateur, Kompilot
    </p>`;

  const text = `${firstName}, un souci technique ?

Bonjour ${firstName},

Je suis Jérémy, fondateur de Kompilot. J'ai remarqué que vous n'avez pas encore connecté votre premier compte.

Un souci technique ? Le manque de temps ? Je me rends disponible 5 minutes pour vous aider.

Répondez à cet email ou réservez : https://calendly.com/jeremy-kompilot/5min

Ou connectez-vous : ${dashboardUrl}

— Jérémy, Fondateur`;

  return { subject, html: wrapEmailHtml('Un souci technique ?', body), text };
}

// ── J2 — Aha Moment (first success celebration) ────────────────────────────

export interface J2AhaMomentEmailParams {
  firstName: string;
  successAction: string; // e.g. "Votre fiche Google Business est maintenant connectée"
  nextFeature: 'creative_studio' | 'aio_sync' | 'calendar';
  dashboardUrl?: string;
}

export function buildJ2AhaMomentEmail(params: J2AhaMomentEmailParams): { subject: string; html: string; text: string } {
  const { firstName, successAction } = params;
  const dashboardUrl = params.dashboardUrl ?? DASHBOARD_URL;

  const nextFeatures: Record<string, { emoji: string; title: string; desc: string; cta: string; ctaUrl: string }> = {
    creative_studio: {
      emoji: '🎬',
      title: 'Creative Studio — Générez du contenu en 10 secondes',
      desc: 'Décrivez votre activité en une phrase, et l\'IA crée des posts, visuels et vidéos prêtes à publier sur Google, Instagram et Facebook.',
      cta: 'Ouvrir le Creative Studio',
      ctaUrl: `${dashboardUrl}?tab=cockpit`,
    },
    aio_sync: {
      emoji: '🤖',
      title: 'AIO Sync — Vérifiez votre visibilité IA',
      desc: 'Découvrez si ChatGPT, Gemini et Perplexity recommandent votre commerce quand on cherche vos services dans votre ville.',
      cta: 'Lancer un audit AIO',
      ctaUrl: `${dashboardUrl}?tab=aio`,
    },
    calendar: {
      emoji: '📅',
      title: 'Campaign Calendar — Planifiez 1 mois en 2 minutes',
      desc: 'Générez automatiquement un calendrier éditorial complet adapté à votre secteur et planifiez-le sur tous vos canaux en 1 clic.',
      cta: 'Ouvrir le calendrier',
      ctaUrl: `${dashboardUrl}?tab=calendar`,
    },
  };

  const next = nextFeatures[params.nextFeature] ?? nextFeatures.creative_studio;

  const subject = `🎉 ${firstName}, votre première action est en ligne !`;

  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0F172A;line-height:1.25;">
      Bravo ${firstName} ! 🚀
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748B;line-height:1.6;">
      Votre premier pas est franchi :
    </p>

    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;font-size:15px;color:#166534;font-weight:700;">
        ✅ ${successAction}
      </p>
    </div>

    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      Les commerces qui connectent un 2ᵉ outil dans les 48h <strong>augmentent leur visibilité locale de +67 %</strong>.
      Voici la prochaine étape recommandée :
    </p>

    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin:0 0 28px;">
      <div style="display:flex;align-items:flex-start;gap:14px;">
        <span style="font-size:28px;line-height:1;">${next.emoji}</span>
        <div>
          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0F172A;">${next.title}</p>
          <p style="margin:0;font-size:13px;color:#64748B;line-height:1.6;">${next.desc}</p>
        </div>
      </div>
    </div>

    <div style="text-align:center;margin:0 0 8px;">
      <a href="${next.ctaUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#0D9488,#0F766E);color:white;font-size:15px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:10px;box-shadow:0 4px 12px rgba(13,148,136,0.3);">
        ${next.cta} →
      </a>
    </div>`;

  const text = `🎉 ${firstName}, votre première action est en ligne !

Bravo ${firstName} !
✅ ${successAction}

Prochaine étape : ${next.title}
${next.desc}

${next.cta} : ${next.ctaUrl}`;

  return { subject, html: wrapEmailHtml('Bravo, première action !', body), text };
}

// ── J4 — ROI / Agence (mid-trial, concrete use case) ──────────────────────

export interface J4ROIEmailParams {
  firstName: string;
  isAgency: boolean;
  dashboardUrl?: string;
}

export function buildJ4ROIEmail(params: J4ROIEmailParams): { subject: string; html: string; text: string } {
  const { firstName, isAgency } = params;
  const dashboardUrl = params.dashboardUrl ?? DASHBOARD_URL;

  const subject = isAgency
    ? `${firstName}, comment une agence gagne 12h/semaine avec Kompilot`
    : `${firstName}, le calcul qui change tout pour votre visibilité`;

  const body = isAgency ? `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0F172A;line-height:1.25;">
      12h/semaine récupérées — voici comment, ${firstName}
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748B;line-height:1.6;">
      Cas réel : une agence digitale de 4 personnes à Lyon
    </p>

    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
      <tr>
        <td style="padding:12px 16px;background:#FEF2F2;border-radius:8px 8px 0 0;">
          <p style="margin:0;font-size:12px;color:#991B1B;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">AVANT KOMPILOT</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px;background:#FEF2F2;border-radius:0 0 8px 8px;border-bottom:2px solid #FCA5A5;">
          <p style="margin:0 0 8px;font-size:14px;color:#7F1D1D;">⏱ 3h/client/semaine sur les réseaux + avis</p>
          <p style="margin:0 0 8px;font-size:14px;color:#7F1D1D;">📝 Posts manuels un par un sur chaque plateforme</p>
          <p style="margin:0;font-size:14px;color:#7F1D1D;">😬 Avis Google sans réponse depuis 5 jours</p>
        </td>
      </tr>
    </table>

    <table style="width:100%;border-collapse:collapse;margin:0 0 28px;">
      <tr>
        <td style="padding:12px 16px;background:#F0FDF4;border-radius:8px 8px 0 0;">
          <p style="margin:0;font-size:12px;color:#166534;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">AVEC KOMPILOT</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px;background:#F0FDF4;border-radius:0 0 8px 8px;border-bottom:2px solid #86EFAC;">
          <p style="margin:0 0 8px;font-size:14px;color:#14532D;">⚡ 20 min de planification le lundi matin pour toute la semaine</p>
          <p style="margin:0 0 8px;font-size:14px;color:#14532D;">🤖 IA génère les posts adaptés à chaque plateforme automatiquement</p>
          <p style="margin:0;font-size:14px;color:#14532D;">✅ Avis répondus en 1 clic avec l'IA — réponses personnalisées</p>
        </td>
      </tr>
    </table>

    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;font-size:15px;color:#1E3A8A;font-weight:700;">
        📊 Résultat : 12h/semaine × 8 clients = 96h/mois récupérées pour la stratégie et le développement commercial.
      </p>
    </div>
  ` : `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0F172A;line-height:1.25;">
      Le calcul qui change tout, ${firstName}
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748B;line-height:1.6;">
      Temps moyen investi par un commerçant sur les réseaux et la visibilité locale :
    </p>

    <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:12px;padding:20px;margin:0 0 16px;">
      <p style="margin:0;font-size:32px;font-weight:900;color:#DC2626;">4,5 h / semaine</p>
      <p style="margin:6px 0 0;font-size:13px;color:#991B1B;">Publication, réponses aux avis, veille concurrentielle</p>
    </div>

    <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:12px;padding:20px;margin:0 0 24px;">
      <p style="margin:0;font-size:32px;font-weight:900;color:#059669;">20 min / semaine</p>
      <p style="margin:6px 0 0;font-size:13px;color:#166534;">Avec Kompilot — planification IA + réponses automatiques</p>
    </div>

    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;font-size:15px;color:#1E3A8A;font-weight:700;">
        💰 Temps gagné : 17h/mois × votre taux horaire = ROI immédiat de votre abonnement.
      </p>
    </div>
  `;

  const ctaSection = `
    <div style="text-align:center;margin:0 0 8px;">
      <a href="${dashboardUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#0D9488,#0F766E);color:white;font-size:15px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:10px;box-shadow:0 4px 12px rgba(13,148,136,0.3);">
        Découvrir mon cockpit complet →
      </a>
    </div>`;

  const fullBody = body + ctaSection;
  const text = isAgency
    ? `${firstName}, comment une agence gagne 12h/semaine avec Kompilot\n\n12h/semaine récupérées. Voyez le cas concret : ${dashboardUrl}`
    : `${firstName}, le calcul qui change tout\n\n4,5h → 20min/semaine. Voyez comment : ${dashboardUrl}`;

  return { subject, html: wrapEmailHtml('ROI concret', fullBody), text };
}

// ── J6 — Urgence + Magic Link (24h before expiry) ─────────────────────────

export interface J6UrgencyEmailParams {
  firstName: string;
  planName: string; // 'Agency' or 'Starter'
  magicLinkUrl: string; // unique extension URL
  trialEndDate: string; // formatted date
  dashboardUrl?: string;
  subscriptionUrl?: string;
}

export function buildJ6UrgencyEmail(params: J6UrgencyEmailParams): { subject: string; html: string; text: string } {
  const { firstName, magicLinkUrl, trialEndDate } = params;
  const subscriptionUrl = params.subscriptionUrl ?? `${BASE_URL}/subscription`;

  const subject = `⏰ ${firstName}, votre essai Kompilot expire demain`;

  const body = `
    <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;font-size:15px;color:#92400E;font-weight:700;">
        ⏰ Votre essai gratuit se termine le ${trialEndDate}
      </p>
      <p style="margin:6px 0 0;font-size:13px;color:#92400E;">
        Encore 24h pour décider — et vous avez deux options :
      </p>
    </div>

    <!-- Option A: Subscribe -->
    <div style="background:#F0FDF4;border:2px solid #0D9488;border-radius:12px;padding:20px;margin:0 0 16px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span style="font-size:20px;">🚀</span>
        <p style="margin:0;font-size:16px;font-weight:800;color:#0F172A;">Option 1 — Activer maintenant</p>
      </div>
      <p style="margin:0 0 14px;font-size:14px;color:#475569;line-height:1.6;">
        Conservez l'accès complet à ${params.planName === 'Agency' ? 'toutes les fonctionnalités Agency (149€/mois)' : 'votre plan Starter (69€/mois)'}.
        Sans engagement, résiliable en 1 clic.
      </p>
      <div style="text-align:center;">
        <a href="${subscriptionUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#0D9488,#0F766E);color:white;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;box-shadow:0 4px 12px rgba(13,148,136,0.3);">
          Activer mon abonnement →
        </a>
      </div>
    </div>

    <!-- Option B: Magic Link Extension -->
    <div style="background:#EFF6FF;border:2px solid #3B82F6;border-radius:12px;padding:20px;margin:0 0 24px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span style="font-size:20px;">🔗</span>
        <p style="margin:0;font-size:16px;font-weight:800;color:#0F172A;">Option 2 — Prolonger de 7 jours (offert)</p>
      </div>
      <p style="margin:0 0 14px;font-size:14px;color:#475569;line-height:1.6;">
        Besoin de plus de temps pour évaluer ? Ce lien unique prolonge votre essai de <strong>7 jours supplémentaires</strong>,
        sans carte bancaire.
      </p>
      <div style="text-align:center;">
        <a href="${magicLinkUrl}"
           style="display:inline-block;background:#3B82F6;color:white;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;">
          Prolonger mon essai de 7 jours →
        </a>
      </div>
      <p style="margin:10px 0 0;font-size:11px;color:#94A3B8;text-align:center;">
        Ce lien est unique et expire dans 48h.
      </p>
    </div>

    <p style="margin:0;font-size:13px;color:#94A3B8;text-align:center;">
      Une question sur les plans ? Répondez à cet email — nous répondons sous 4h.
    </p>`;

  const text = `⏰ ${firstName}, votre essai Kompilot expire demain

Option 1 — Activer maintenant : ${subscriptionUrl}
Option 2 — Prolonger de 7 jours (offert) : ${magicLinkUrl}

Ce lien est unique et expire dans 48h.`;

  return { subject, html: wrapEmailHtml('Essai expire demain', body), text };
}

// ── J7 — Expiration (account paused + pricing grid) ────────────────────────

export interface J7ExpirationEmailParams {
  firstName: string;
  dashboardUrl?: string;
  subscriptionUrl?: string;
}

export function buildJ7ExpirationEmail(params: J7ExpirationEmailParams): { subject: string; html: string; text: string } {
  const { firstName } = params;
  const subscriptionUrl = params.subscriptionUrl ?? `${BASE_URL}/subscription`;

  const subject = `🔒 ${firstName}, votre espace Kompilot est en pause`;

  const body = `
    <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;font-size:15px;color:#991B1B;font-weight:700;">
        🔒 Votre essai gratuit est terminé — votre espace est temporairement en pause
      </p>
    </div>

    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      Bonjour ${firstName},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      Vos données, vos pixels connectés et votre historique de publications sont <strong>sauvegardés et sécurisés</strong>.
      Vous pouvez réactiver votre espace à tout moment.
    </p>

    <!-- Pricing grid -->
    <table style="width:100%;border-collapse:collapse;margin:0 0 28px;">
      <tr>
        <!-- Starter -->
        <td style="width:48%;vertical-align:top;padding:20px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;">
          <p style="margin:0 0 4px;font-size:11px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">STARTER</p>
          <p style="margin:0 0 12px;font-size:28px;font-weight:900;color:#0F172A;">69€<span style="font-size:14px;color:#64748B;font-weight:400;">/mois HT</span></p>
          <ul style="margin:0 0 16px;padding:0 0 0 18px;font-size:13px;color:#475569;line-height:2;">
            <li>1 compte publicitaire Meta</li>
            <li>20 générations IA / mois</li>
            <li>Calendrier éditorial standard</li>
            <li>AIO Sync — 5 mots-clés</li>
            <li>Support email standard</li>
          </ul>
          <a href="${subscriptionUrl}?plan=starter"
             style="display:block;text-align:center;background:#0F172A;color:white;font-size:13px;font-weight:700;text-decoration:none;padding:10px 16px;border-radius:8px;">
            Choisir Starter →
          </a>
        </td>
        <td style="width:4%;"></td>
        <!-- Agency -->
        <td style="width:48%;vertical-align:top;padding:20px;background:linear-gradient(160deg,#F0FDFA,#F8FAFC);border:2px solid #0D9488;border-radius:12px;">
          <div style="display:inline-block;background:#0D9488;color:white;font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;margin-bottom:8px;">
            ⭐ RECOMMANDÉ
          </div>
          <p style="margin:0 0 4px;font-size:11px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">AGENCY</p>
          <p style="margin:0 0 12px;font-size:28px;font-weight:900;color:#0F172A;">149€<span style="font-size:14px;color:#64748B;font-weight:400;">/mois HT</span></p>
          <ul style="margin:0 0 16px;padding:0 0 0 18px;font-size:13px;color:#475569;line-height:2;">
            <li>IA illimitée (GPT-4o + Claude)</li>
            <li>Marque blanche totale</li>
            <li>Jusqu'à 30 fiches clients</li>
            <li>Prospection IA + audits PDF</li>
            <li>Support prioritaire 24/7</li>
          </ul>
          <a href="${subscriptionUrl}?plan=agency"
             style="display:block;text-align:center;background:linear-gradient(135deg,#0D9488,#0F766E);color:white;font-size:13px;font-weight:700;text-decoration:none;padding:10px 16px;border-radius:8px;box-shadow:0 4px 12px rgba(13,148,136,0.3);">
            Choisir Agency →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#94A3B8;text-align:center;">
      Sans engagement · Résiliable en 1 clic · Données conservées 90 jours
    </p>`;

  const text = `🔒 ${firstName}, votre espace Kompilot est en pause

Vos données sont sauvegardées et sécurisées. Réactivez à tout moment.

Starter : 69€/mois → ${subscriptionUrl}?plan=starter
Agency : 149€/mois → ${subscriptionUrl}?plan=agency

Sans engagement · Résiliable en 1 clic · Données conservées 90 jours`;

  return { subject, html: wrapEmailHtml('Espace en pause', body), text };
}

// ── J+14 — Win-back (product novelty) ──────────────────────────────────────

export interface J14WinBackEmailParams {
  firstName: string;
  noveltyTitle: string; // e.g. "Le Creative Studio peut maintenant générer des vidéos Reels"
  noveltyDesc: string;
  noveltyUrl?: string;
  dashboardUrl?: string;
}

export function buildJ14WinBackEmail(params: J14WinBackEmailParams): { subject: string; html: string; text: string } {
  const { firstName, noveltyTitle, noveltyDesc } = params;
  const noveltyUrl = params.noveltyUrl ?? (params.dashboardUrl ?? DASHBOARD_URL);
  const dashboardUrl = params.dashboardUrl ?? DASHBOARD_URL;

  const subject = `${firstName}, on a amélioré Kompilot depuis votre essai`;

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0F172A;line-height:1.25;">
      Quoi de neuf, ${firstName} ? 👋
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748B;line-height:1.6;">
      Depuis votre essai, notre équipe a travaillé dur. Voici ce qui a changé :
    </p>

    <div style="background:linear-gradient(135deg,rgba(13,148,136,.08),rgba(13,148,136,.02));border:1px solid rgba(13,148,136,.2);border-radius:12px;padding:20px;margin:0 0 24px;">
      <div style="display:flex;align-items:flex-start;gap:14px;">
        <span style="font-size:28px;line-height:1;">✨</span>
        <div>
          <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;">${noveltyTitle}</p>
          <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">${noveltyDesc}</p>
        </div>
      </div>
    </div>

    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      Vos données, configurations et historiques sont toujours en sécurité — reconnectez-vous en 1 clic pour explorer les nouveautés.
    </p>

    <div style="text-align:center;margin:0 0 24px;">
      <a href="${noveltyUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#0D9488,#0F766E);color:white;font-size:15px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:10px;box-shadow:0 4px 12px rgba(13,148,136,0.3);">
        Découvrir la nouveauté →
      </a>
    </div>

    <p style="margin:0;font-size:13px;color:#94A3B8;text-align:center;">
      Envie de redémarrer ? <a href="${dashboardUrl}" style="color:#0D9488;text-decoration:underline;">Connectez-vous ici</a>
    </p>`;

  const text = `${firstName}, on a amélioré Kompilot depuis votre essai

✨ ${noveltyTitle}
${noveltyDesc}

Découvrez : ${noveltyUrl}`;

  return { subject, html: wrapEmailHtml('Quoi de neuf sur Kompilot', body), text };
}

// ── J+30 — Seconde Chance (flash reactivation offer) ───────────────────────

export interface J30SecondChanceEmailParams {
  firstName: string;
  offerType: 'reactivation_3days' | 'promo_20percent';
  promoCode?: string;
  subscriptionUrl?: string;
}

export function buildJ30SecondChanceEmail(params: J30SecondChanceEmailParams): { subject: string; html: string; text: string } {
  const { firstName, offerType, promoCode } = params;
  const subscriptionUrl = params.subscriptionUrl ?? `${BASE_URL}/subscription`;

  const isReactivation = offerType === 'reactivation_3days';
  const subject = `${firstName}, ${isReactivation ? 'un accès exceptionnel de 3 jours vous attend' : '-20 % sur votre retour Kompilot'}`;

  const body = isReactivation ? `
    <div style="background:linear-gradient(135deg,#0D9488,#0F766E);border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 8px;font-size:32px;">🔓</p>
      <h2 style="margin:0 0 8px;font-size:20px;color:white;font-weight:800;">Accès exceptionnel — 3 jours offerts</h2>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,.8);">
        Retrouvez votre cockpit complet pendant 3 jours, sans carte bancaire.
      </p>
    </div>

    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      Bonjour ${firstName},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      Cela fait un mois que votre essai s'est terminé. On vous propose un <strong>accès complet de 3 jours</strong>
      pour redécouvrir Kompilot — et constater par vous-même les améliorations récentes.
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      Aucune carte bancaire requise. Aucun engagement.
    </p>

    <div style="text-align:center;margin:0 0 24px;">
      <a href="${subscriptionUrl}?offer=reactivation_3d"
         style="display:inline-block;background:linear-gradient(135deg,#0D9488,#0F766E);color:white;font-size:15px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:10px;box-shadow:0 4px 12px rgba(13,148,136,0.3);">
        Réactiver mon accès 3 jours →
      </a>
    </div>
  ` : `
    <div style="background:linear-gradient(135deg,#7C3AED,#6D28D9);border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 8px;font-size:32px;">🎁</p>
      <h2 style="margin:0 0 8px;font-size:20px;color:white;font-weight:800;">Offre de retour : -20 % pendant 3 mois</h2>
      ${promoCode ? `<p style="margin:0;font-size:13px;color:rgba(255,255,255,.7);">Code : <strong style="color:white;">${promoCode}</strong></p>` : ''}
    </div>

    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      Bonjour ${firstName},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      Nous avons préparé une offre exclusive pour vous permettre de reprendre là où vous en étiez :
      <strong>-20 % sur votre plan pendant 3 mois</strong>, sans engagement.
    </p>

    <div style="text-align:center;margin:0 0 24px;">
      <a href="${subscriptionUrl}${promoCode ? `?promo=${promoCode}` : ''}"
         style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:white;font-size:15px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:10px;box-shadow:0 4px 12px rgba(124,58,237,0.3);">
        Profiter de l'offre -20 % →
      </a>
    </div>
    <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center;">
      Offre valable 72h · ${promoCode ? `Code : ${promoCode} · ` : ''}Sans engagement
    </p>
  `;

  const text = isReactivation
    ? `${firstName}, accès exceptionnel de 3 jours offerts\n\nRéactivez : ${subscriptionUrl}?offer=reactivation_3d\nAucune carte requise, aucun engagement.`
    : `${firstName}, -20% sur votre retour Kompilot pendant 3 mois\n${promoCode ? `Code : ${promoCode}\n` : ''}Profiter : ${subscriptionUrl}`;

  return { subject, html: wrapEmailHtml(isReactivation ? 'Accès 3 jours offerts' : 'Offre -20 %', body), text };
}

// ── Trial Extension Confirmation ────────────────────────────────────────────

export interface TrialExtensionConfirmEmailParams {
  firstName: string;
  newEndDate: string;
  dashboardUrl?: string;
}

export function buildTrialExtensionConfirmEmail(params: TrialExtensionConfirmEmailParams): { subject: string; html: string; text: string } {
  const { firstName, newEndDate } = params;
  const dashboardUrl = params.dashboardUrl ?? DASHBOARD_URL;

  const subject = `✅ ${firstName}, votre essai est prolongé de 7 jours`;

  const body = `
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 8px;font-size:32px;">🎉</p>
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#166534;">Essai prolongé avec succès !</h2>
      <p style="margin:0;font-size:14px;color:#166534;">
        Votre accès complet est maintenant étendu jusqu'au <strong>${newEndDate}</strong>.
      </p>
    </div>

    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      Bonjour ${firstName},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      Votre prolongation est active. Vous avez <strong>7 jours supplémentaires</strong> pour explorer
      toutes les fonctionnalités de votre plan.
    </p>

    <div style="text-align:center;margin:0 0 8px;">
      <a href="${dashboardUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#0D9488,#0F766E);color:white;font-size:15px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:10px;box-shadow:0 4px 12px rgba(13,148,136,0.3);">
        Accéder à mon cockpit →
      </a>
    </div>`;

  const text = `✅ Essai prolongé de 7 jours !

Votre accès complet est étendu jusqu'au ${newEndDate}.
Accédez à votre cockpit : ${dashboardUrl}`;

  return { subject, html: wrapEmailHtml('Essai prolongé', body), text };
}

// ── Original Dunning Email (first payment failure — used by webhook) ────────

export function getDunningEmailHtml(
  firstName: string,
  amount: string,
  resumeUrl: string,
): string {
  return getDunningFollowUpHtml(firstName, amount, resumeUrl, 1);
}

// ── Progressive Dunning (J+1 after payment failure) ─────────────────────────

export function getDunningFollowUpHtml(
  firstName: string,
  amount: string,
  resumeUrl: string,
  attemptNumber: number, // 2 or 3
): string {
  const isFinal = attemptNumber >= 3;
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${isFinal ? 'Dernière relance' : 'Rappel paiement'} — Kompilot</title></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Arial,sans-serif">
<div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0">
  <div style="background:${isFinal ? '#991B1B' : '#0F172A'};padding:28px 32px;text-align:center">
    <span style="font-size:28px">${isFinal ? '🚨' : '⚠️'}</span>
    <h1 style="color:#ffffff;font-size:18px;margin:12px 0 4px;font-weight:800">${isFinal ? 'Suspension imminente de votre espace' : 'Rappel : votre paiement est en attente'}</h1>
    <p style="color:rgba(255,255,255,.7);font-size:13px;margin:0">Relance ${attemptNumber}/3</p>
  </div>
  <div style="padding:28px 32px">
    <p style="color:#1E293B;font-size:14px;margin:0 0 16px">Bonjour <strong>${firstName}</strong>,</p>
    ${isFinal ? `
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px">
      Votre paiement${amount ? ` de <strong>${amount}</strong>` : ''} n'a toujours pas pu être prélevé.
      <strong>Votre espace sera suspendu dans les 24 prochaines heures</strong> si aucune action n'est effectuée.
    </p>
    <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:12px;padding:16px;margin:0 0 24px">
      <p style="color:#991B1B;font-size:13px;margin:0;font-weight:600">
        🔒 Après suspension : vos automatisations seront mises en pause et vos publications programmées seront suspendues.
        Vos données restent sauvegardées 90 jours.
      </p>
    </div>
    ` : `
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px">
      Nous n'avons pas pu prélever${amount ? ` <strong>${amount}</strong>` : ''} sur votre carte.
      Mettez à jour votre moyen de paiement pour éviter toute interruption de service.
    </p>
    `}
    <div style="text-align:center;margin:0 0 24px">
      <a href="${resumeUrl}" style="display:inline-block;background:${isFinal ? '#991B1B' : '#0D9488'};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px">
        Mettre à jour mon paiement →
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
