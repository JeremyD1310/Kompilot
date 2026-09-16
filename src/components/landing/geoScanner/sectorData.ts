/**
 * sectorData.ts — Sector type definitions and all static data constants
 * for the ScanOnboarding flow.
 *
 * Covers:
 *  - Sector type + SECTORS list
 *  - SECTOR_CONNECTORS: sector-specific API platform buttons (Step 2)
 *  - SECTOR_WEBHOOK_INBOX: what gets auto-imported into the unified inbox
 *  - SECTOR_AI_SYSTEM_PROMPT: system prompt instructions per sector
 *  - SECTOR_AI_TONE: short preview for Step 3 UX
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type Sector = 'beauty' | 'medical' | 'restaurant' | 'hotel' | 'auto' | '';

// ── Sector config ─────────────────────────────────────────────────────────────

export const SECTORS: { id: Sector; label: string; emoji: string }[] = [
  { id: 'beauty',     label: 'Beauté / Coiffure',         emoji: '💇' },
  { id: 'medical',    label: 'Médical / Bien-être',        emoji: '🏥' },
  { id: 'restaurant', label: 'Restauration',               emoji: '🍽️' },
  { id: 'hotel',      label: 'Hôtellerie / Location',      emoji: '🏨' },
  { id: 'auto',       label: 'Artisanat / Automobile',     emoji: '🔧' },
];

// Sector → API connector buttons shown in Step 2
export const SECTOR_CONNECTORS: Record<Sector, { id: string; icon: string; name: string; desc: string; color: string }[]> = {
  beauty: [
    { id: 'planity',    icon: '✂️', name: 'Planity',    desc: 'Réservations & agenda',     color: '#7C3AED' },
    { id: 'treatwell',  icon: '💅', name: 'Treatwell',  desc: 'Avis & disponibilités',     color: '#EC4899' },
    { id: 'fresha',     icon: '🌿', name: 'Fresha',     desc: 'Clients & paiements',       color: '#0EA5E9' },
    { id: 'salonkee',   icon: '💈', name: 'Salonkee',   desc: 'Marketing & fidélisation',  color: '#F59E0B' },
  ],
  medical: [
    { id: 'doctolib',   icon: '🩺', name: 'Doctolib',   desc: 'Agenda & téléconsultation', color: '#0EA5E9' },
    { id: 'maiia',      icon: '🏥', name: 'Maiia',       desc: 'Dossiers & rendez-vous',   color: '#10B981' },
    { id: 'mondocteur', icon: '👨‍⚕️', name: 'MonDocteur', desc: 'Avis patients',            color: '#6366F1' },
  ],
  restaurant: [
    { id: 'thefork',    icon: '🍴', name: 'TheFork',    desc: 'Réservations & avis',       color: '#00AF87' },
    { id: 'tripadvisor',icon: '🦉', name: 'TripAdvisor', desc: 'Évaluations voyageurs',    color: '#34D399' },
    { id: 'deliveroo',  icon: '🛵', name: 'Deliveroo',  desc: 'Commandes & stats',         color: '#00CCBC' },
    { id: 'ubereats',   icon: '📦', name: 'Uber Eats',  desc: 'Menu & promotions',         color: '#000' },
  ],
  hotel: [
    { id: 'booking',    icon: '🏨', name: 'Booking.com', desc: 'Avis & disponibilités',    color: '#003580' },
    { id: 'airbnb',     icon: '🏠', name: 'Airbnb',      desc: 'Annonces & évaluations',   color: '#FF5A5F' },
    { id: 'tripadvisor',icon: '🦉', name: 'TripAdvisor', desc: 'Notes & commentaires',     color: '#34D399' },
    { id: 'expedia',    icon: '✈️', name: 'Expedia',     desc: 'Tarifs & disponibilités',  color: '#FFD700' },
  ],
  auto: [
    { id: 'vroomly',    icon: '🔧', name: 'Vroomly',    desc: 'Devis & interventions',     color: '#F97316' },
    { id: 'idgarages',  icon: '🚗', name: 'iDGarages',  desc: 'Avis & réputation',         color: '#DC2626' },
    { id: 'oscaro',     icon: '⚙️', name: 'Oscaro Pro', desc: 'Pièces & stock',            color: '#1D4ED8' },
  ],
  '': [],
};

// Sector-specific AI tone preview
export const SECTOR_AI_TONE: Record<Sector, { tone: string; example: string; color: string }> = {
  beauty: {
    tone: 'Tendances & Expertise',
    example: '« Notre coloriste Sophie vous propose les dernières techniques ombré — réservez votre bilan couleur personnalisé ! »',
    color: '#EC4899',
  },
  medical: {
    tone: 'Neutre & Confidentiel',
    example: '« En accord avec le respect de votre vie privée, nous vous informons que le Dr. Martin est disponible pour un suivi cette semaine. »',
    color: '#0EA5E9',
  },
  restaurant: {
    tone: 'Convivial & Appétissant',
    example: '« Ce soir, notre chef vous prépare un risotto aux truffes de saison — table pour 2 encore disponible à 20h ! »',
    color: '#F97316',
  },
  hotel: {
    tone: 'Prestige & Expérience',
    example: '« Profitez d\'une expérience unique ce weekend — surclassement offert pour tout séjour réservé avant vendredi. »',
    color: '#FBBF24',
  },
  auto: {
    tone: 'Technique & Fiable',
    example: '« Votre contrôle technique arrive à échéance dans 30 jours — prenez rendez-vous en ligne et bénéficiez du diagnostic gratuit. »',
    color: '#F97316',
  },
  '': {
    tone: 'Adaptatif',
    example: '— Sélectionnez votre secteur pour voir un exemple personnalisé —',
    color: '#64748B',
  },
};

export const STEPS = [
  { id: 'identity', emoji: '🏢', title: 'Identifiez votre établissement', subtitle: 'Ces données ont déjà été pré-remplies par notre scan — vérifiez et choisissez votre secteur.' },
  { id: 'networks', emoji: '🔗', title: 'Connectez vos plateformes sectorielles', subtitle: 'Liez vos comptes pour centraliser avis et réservations dans Kompilot.' },
  { id: 'activate', emoji: '🚀', title: 'Activez votre espace gratuitement', subtitle: '14 jours d\'essai offerts. Sans carte bancaire. Résiliable en 1 clic.' },
];

export const UNIVERSAL_NETWORKS = [
  { id: 'google',    name: 'Google Business', icon: '🗺️', color: '#4285F4', desc: 'Avis & fiche Maps' },
  { id: 'instagram', name: 'Instagram',       icon: '📸', color: '#E1306C', desc: 'Posts & stories'   },
  { id: 'facebook',  name: 'Facebook',        icon: '👍', color: '#1877F2', desc: 'Page & commentaires' },
];

// ── Unified Inbox Webhook feed per sector ──────────────────────────────────────
// Describes what gets auto-imported into the inbox once platforms are connected.

export interface WebhookSource {
  platform: string;
  icon: string;
  color: string;
  events: string[]; // types of events auto-pushed to inbox
}

export const SECTOR_WEBHOOK_INBOX: Record<Sector, WebhookSource[]> = {
  beauty: [
    { platform: 'Planity',    icon: '✂️', color: '#7C3AED', events: ['Nouveaux avis', 'Rendez-vous annulés', 'Commentaires clients'] },
    { platform: 'Treatwell',  icon: '💅', color: '#EC4899', events: ['Évaluations post-prestation', 'Messages clients'] },
    { platform: 'Google',     icon: '🗺️', color: '#4285F4', events: ['Avis Google', 'Questions & Réponses'] },
    { platform: 'Instagram',  icon: '📸', color: '#E1306C', events: ['Mentions & tags', 'DMs non lus'] },
  ],
  medical: [
    { platform: 'Doctolib',   icon: '🩺', color: '#0EA5E9', events: ['Avis patients', 'Rendez-vous manqués', 'Messages sécurisés'] },
    { platform: 'Google',     icon: '🗺️', color: '#4285F4', events: ['Avis & questions (RGPD-aware)'] },
    { platform: 'Ameli',      icon: '🏥', color: '#1D4ED8', events: ['Notifications conventionnées'] },
  ],
  restaurant: [
    { platform: 'TheFork',    icon: '🍴', color: '#00AF87', events: ['Avis post-repas', 'Réservations annulées', 'No-shows'] },
    { platform: 'TripAdvisor',icon: '🦉', color: '#34D399', events: ['Évaluations voyageurs', 'Réponses publiques'] },
    { platform: 'Deliveroo',  icon: '🛵', color: '#00CCBC', events: ['Notes commandes', 'Réclamations livraison'] },
    { platform: 'Google',     icon: '🗺️', color: '#4285F4', events: ['Avis Google', 'Heures d\'affluence'] },
  ],
  hotel: [
    { platform: 'Booking.com',icon: '🏨', color: '#003580', events: ['Avis séjour', 'Commentaires négatifs', 'Demandes spéciales'] },
    { platform: 'Airbnb',     icon: '🏠', color: '#FF5A5F', events: ['Évaluations hôte', 'Messages voyageurs'] },
    { platform: 'TripAdvisor',icon: '🦉', color: '#34D399', events: ['Notes & classement', 'Réponses concurrents'] },
    { platform: 'Google',     icon: '🗺️', color: '#4285F4', events: ['Avis Google Maps', 'Photos clients'] },
  ],
  auto: [
    { platform: 'Vroomly',    icon: '🔧', color: '#F97316', events: ['Avis post-intervention', 'Devis refusés', 'Rappels clients'] },
    { platform: 'iDGarages',  icon: '🚗', color: '#DC2626', events: ['Évaluations mécaniciens', 'Avis négatifs'] },
    { platform: 'Google',     icon: '🗺️', color: '#4285F4', events: ['Avis Google', 'Questions techniques'] },
  ],
  '': [],
};

// ── AI System Prompts per sector ───────────────────────────────────────────────
// These are injected as the AI "system" instruction when generating content
// or responding to reviews, ensuring sector-appropriate tone & compliance.

export const SECTOR_AI_SYSTEM_PROMPT: Record<Sector, string> = {
  beauty: `Tu es l'assistant marketing d'un salon de beauté/coiffure professionnel.
TON : Chaleureux, tendance, expert beauté. Valorise les praticiens par leur prénom.
FOCUS : Tendances coloration, techniques de soin, nouveautés esthétiques, offres saisonnières.
EXEMPLES : Mentionne des techniques spécifiques (balayage, kératine, ombré, etc.).
ÉVITE : Langage trop formel, termes médicaux, promesses de résultats non garantis.
APPEL À L'ACTION : Invite systématiquement à réserver en ligne ou via Planity/Treatwell.`,

  medical: `Tu es l'assistant communication d'un professionnel de santé réglementé.
TON : Neutre, bienveillant, rassurant. Respect absolu du secret médical et du RGPD.
FOCUS : Disponibilité du praticien, suivi patient, informations de santé publique validées.
IMPORTANT : N'émets jamais de diagnostic, n'utilise pas de données patients identifiables.
CONFORMITÉ : Respecte le code de déontologie médicale — pas de publicité comparative.
APPEL À L'ACTION : Orienter vers prise de rendez-vous Doctolib ou contact cabinet.`,

  restaurant: `Tu es l'assistant marketing d'un restaurant ou établissement de restauration.
TON : Convivial, appétissant, généreux. Évoque les saveurs, la chaleur, le partage.
FOCUS : Plats du moment, événements, chef, terroir, ambiance, expérience client.
EXEMPLES : Décris les plats avec des termes sensoriels (croustillant, fondant, parfumé…).
SAISONNALITÉ : Adapte systématiquement les contenus aux saisons et occasions (fêtes, été…).
APPEL À L'ACTION : Réservation en ligne TheFork, commande Deliveroo, ou appel direct.`,

  hotel: `Tu es l'assistant communication d'un hôtel ou établissement d'hébergement.
TON : Prestige, expérience, hospitalité. Donne envie de séjourner et de revenir.
FOCUS : Expériences uniques, surclassements, services exclusifs, cadre, destination locale.
EXEMPLES : Évoque les vues, les équipements (spa, piscine), les services personnalisés.
GESTION RÉPUTATION : Réponses aux avis négatives : empathie d'abord, solution concrète ensuite.
APPEL À L'ACTION : Réservation directe (meilleur tarif), ou via Booking.com/Airbnb.`,

  auto: `Tu es l'assistant communication d'un garage ou artisan automobile.
TON : Technique, fiable, transparent. Inspire confiance et expertise professionnelle.
FOCUS : Transparence des devis, expertise technique, rapidité d'intervention, garanties.
EXEMPLES : Mentionne les marques de pièces, les certifications (Vroomly Certifié, etc.).
CONFORMITÉ : Pas de promesses non tenues sur les délais ou prix sans diagnostic préalable.
APPEL À L'ACTION : Devis en ligne Vroomly, prise de RDV iDGarages, ou appel direct.`,

  '': `Tu es l'assistant marketing d'un commerce local.
TON : Professionnel, accessible, engageant. Adapte-toi au secteur de l'établissement.
FOCUS : Valoriser l'expertise locale, fidéliser la clientèle, améliorer la visibilité en ligne.
APPEL À L'ACTION : Contact direct, prise de rendez-vous, ou visite en boutique.`,
};
