/**
 * sectors/connectors.ts — Plate-formes API tierces par secteur métier.
 * Utilisé dans l'onboarding, l'inbox unifiée et le moteur IA sémantique.
 */

export type SectorKey = 'beaute' | 'medical' | 'restauration' | 'hotellerie' | 'automobile' | 'autre';

export interface PlatformConnector {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** URL de redirection OAuth ou page de configuration */
  connectUrl: string;
  /** Slug du webhook pour centralisation inbox */
  webhookSlug: string;
  /** Couleur de badge Tailwind (border + text + bg) */
  badgeColor: string;
  /** Vrai si la connexion est critique pour le secteur */
  primary: boolean;
}

export interface SectorConnectorConfig {
  sectorKey: SectorKey;
  label: string;
  emoji: string;
  platforms: PlatformConnector[];
  /** Ton et consigne système pour l'IA */
  aiSystemPromptSuffix: string;
}

// ── Définition des connecteurs ────────────────────────────────────────────────

export const SECTOR_CONNECTORS: Record<SectorKey, SectorConnectorConfig> = {
  beaute: {
    sectorKey: 'beaute',
    label: 'Beauté / Coiffure',
    emoji: '💇',
    platforms: [
      {
        id: 'planity',
        name: 'Planity',
        emoji: '📅',
        description: 'Avis et rendez-vous Planity centralisés dans votre inbox',
        connectUrl: 'https://planity.com/pro',
        webhookSlug: 'planity',
        badgeColor: 'border-violet-300/60 text-violet-700 bg-violet-50 dark:bg-violet-950/30 dark:text-violet-300',
        primary: true,
      },
      {
        id: 'treatwell',
        name: 'Treatwell',
        emoji: '🌿',
        description: 'Évaluations Treatwell dans votre tableau de bord',
        connectUrl: 'https://pro.treatwell.fr',
        webhookSlug: 'treatwell',
        badgeColor: 'border-pink-300/60 text-pink-700 bg-pink-50 dark:bg-pink-950/30 dark:text-pink-300',
        primary: true,
      },
      {
        id: 'fresha',
        name: 'Fresha',
        emoji: '✂️',
        description: 'Synchronisez vos réservations Fresha',
        connectUrl: 'https://partners.fresha.com',
        webhookSlug: 'fresha',
        badgeColor: 'border-emerald-300/60 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-300',
        primary: false,
      },
      {
        id: 'salonkee',
        name: 'Salonkee',
        emoji: '💎',
        description: 'Avis et RDV Salonkee dans Kompilot',
        connectUrl: 'https://salonkee.fr/pro',
        webhookSlug: 'salonkee',
        badgeColor: 'border-amber-300/60 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300',
        primary: false,
      },
    ],
    aiSystemPromptSuffix: `
Tu es l'IA d'un professionnel de la beauté (coiffeur, esthéticien, barbier, spa).
Adapte tes réponses aux tendances beauté actuelles, cite les techniques de coloration et de soin par leur nom exact (balayage, kératine, BB glow…).
Mets en avant le praticien par son prénom, valorise la personnalisation du service.
Propose des publications engageantes avec des avant/après, des conseils produits et des promotions flash.
Ton : enthousiaste, warm, inspirant. Évite le jargon médical.`,
  },

  medical: {
    sectorKey: 'medical',
    label: 'Médical / Bien-être',
    emoji: '🩺',
    platforms: [
      {
        id: 'doctolib',
        name: 'Doctolib',
        emoji: '📋',
        description: 'Avis patients et agenda Doctolib dans votre inbox unifiée',
        connectUrl: 'https://pro.doctolib.fr',
        webhookSlug: 'doctolib',
        badgeColor: 'border-sky-300/60 text-sky-700 bg-sky-50 dark:bg-sky-950/30 dark:text-sky-300',
        primary: true,
      },
      {
        id: 'ameli',
        name: 'Ameli Pro',
        emoji: '🏥',
        description: 'Informations conventionnement et profil Ameli',
        connectUrl: 'https://espacepro.ameli.fr',
        webhookSlug: 'ameli',
        badgeColor: 'border-blue-300/60 text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300',
        primary: false,
      },
      {
        id: 'livi',
        name: 'Livi / Qare',
        emoji: '💊',
        description: 'Téléconsultations et avis patients en ligne',
        connectUrl: 'https://pro.livi.fr',
        webhookSlug: 'livi',
        badgeColor: 'border-indigo-300/60 text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-300',
        primary: false,
      },
    ],
    aiSystemPromptSuffix: `
Tu es l'IA d'un professionnel de santé (médecin, kinésithérapeute, ostéopathe, dentiste).
Adopte un ton NEUTRE, BIENVEILLANT et professionnel. 
RÈGLE ABSOLUE : Ne jamais donner de diagnostic médical ni de conseil thérapeutique précis. 
Respecte le secret médical : n'inclus jamais de données patient identifiables dans les publications.
Focus sur la communication institutionnelle, les rappels de prévention, les nouvelles horaires, et le bien-être général.
Évite les superlatifs commerciaux (meilleur, top…). Préfère des formulations sobres et rassurantes.`,
  },

  restauration: {
    sectorKey: 'restauration',
    label: 'Restauration',
    emoji: '🍽️',
    platforms: [
      {
        id: 'thefork',
        name: 'TheFork',
        emoji: '🍴',
        description: 'Avis et réservations TheFork dans votre inbox',
        connectUrl: 'https://manager.thefork.com',
        webhookSlug: 'thefork',
        badgeColor: 'border-green-300/60 text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-300',
        primary: true,
      },
      {
        id: 'ubereats',
        name: 'Uber Eats',
        emoji: '🛵',
        description: 'Notes et retours Uber Eats centralisés',
        connectUrl: 'https://restaurant.uber.com',
        webhookSlug: 'ubereats',
        badgeColor: 'border-black/20 text-foreground bg-muted dark:bg-muted/30',
        primary: true,
      },
      {
        id: 'deliveroo',
        name: 'Deliveroo',
        emoji: '🚴',
        description: 'Évaluations Deliveroo dans votre tableau de bord',
        connectUrl: 'https://restaurant-hub.deliveroo.com',
        webhookSlug: 'deliveroo',
        badgeColor: 'border-teal-300/60 text-teal-700 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-300',
        primary: false,
      },
      {
        id: 'tripadvisor_resto',
        name: 'TripAdvisor',
        emoji: '🦉',
        description: 'Avis voyageurs TripAdvisor centralisés',
        connectUrl: 'https://www.tripadvisor.fr/Owners',
        webhookSlug: 'tripadvisor',
        badgeColor: 'border-emerald-300/60 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-300',
        primary: false,
      },
    ],
    aiSystemPromptSuffix: `
Tu es l'IA d'un restaurateur (restaurant, brasserie, food truck, café).
Ton : chaleureux, gourmand, authentique. Décris les plats avec sensorialité (saveurs, textures, origines des produits).
Valorise le chef par son prénom, mets en avant les spécialités maison et les produits locaux.
Propose des posts autour des menus du jour, des événements (soirées thématiques, privatisations), et des stories recettes.
Utilise des emojis alimentaires avec parcimonie pour humaniser sans dégrader.`,
  },

  hotellerie: {
    sectorKey: 'hotellerie',
    label: 'Hôtellerie / Conciergerie',
    emoji: '🏨',
    platforms: [
      {
        id: 'booking',
        name: 'Booking.com',
        emoji: '🔵',
        description: 'Avis voyageurs Booking.com dans votre inbox Kompilot',
        connectUrl: 'https://partner.booking.com',
        webhookSlug: 'booking',
        badgeColor: 'border-blue-300/60 text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300',
        primary: true,
      },
      {
        id: 'airbnb',
        name: 'Airbnb',
        emoji: '🏠',
        description: 'Évaluations Airbnb et messages hôte centralisés',
        connectUrl: 'https://www.airbnb.fr/multicalendar',
        webhookSlug: 'airbnb',
        badgeColor: 'border-rose-300/60 text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-300',
        primary: true,
      },
      {
        id: 'tripadvisor_hotel',
        name: 'TripAdvisor',
        emoji: '🦉',
        description: 'Avis et classement TripAdvisor de votre établissement',
        connectUrl: 'https://www.tripadvisor.fr/Owners',
        webhookSlug: 'tripadvisor',
        badgeColor: 'border-emerald-300/60 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-300',
        primary: false,
      },
    ],
    aiSystemPromptSuffix: `
Tu es l'IA d'un hébergeur (hôtel, chambre d'hôtes, appartement Airbnb, conciergerie).
Ton : accueillant, élégant, attentionné. Utilise le champ lexical du voyage et du bien-être.
Valorise l'expérience locale, les services personnalisés, la vue, l'ambiance.
Propose des publications axées sur les saisons, les événements locaux et les packages de séjour.
Pour les réponses aux avis, adopte toujours un ton poli, reconnaissant et constructif même face aux critiques.`,
  },

  automobile: {
    sectorKey: 'automobile',
    label: 'Artisanat / Automobile',
    emoji: '🔧',
    platforms: [
      {
        id: 'vroomly',
        name: 'Vroomly',
        emoji: '🚗',
        description: 'Avis et réservations Vroomly dans votre inbox Kompilot',
        connectUrl: 'https://pro.vroomly.com',
        webhookSlug: 'vroomly',
        badgeColor: 'border-orange-300/60 text-orange-700 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-300',
        primary: true,
      },
      {
        id: 'idgarages',
        name: 'iDGarages',
        emoji: '🏁',
        description: 'Évaluations iDGarages et leads centralisés',
        connectUrl: 'https://pro.idgarages.com',
        webhookSlug: 'idgarages',
        badgeColor: 'border-red-300/60 text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-300',
        primary: true,
      },
      {
        id: 'automobilescom',
        name: 'Automobiles.com',
        emoji: '🏎️',
        description: 'Annonces et retours clients Automobiles.com',
        connectUrl: 'https://pro.automobiles.com',
        webhookSlug: 'automobiles',
        badgeColor: 'border-slate-300/60 text-slate-700 bg-slate-50 dark:bg-slate-950/30 dark:text-slate-300',
        primary: false,
      },
    ],
    aiSystemPromptSuffix: `
Tu es l'IA d'un artisan ou d'un professionnel de l'automobile (garagiste, carrossier, mécanicien, menuisier, plombier).
Ton : professionnel, transparent, de confiance. Mets en avant l'expertise technique, la réactivité et la proximité.
Pour les pros auto : utilise le vocabulaire mécanique précis (vidange, distribution, freinage, diagnostic OBD).
Pour les artisans : valorise les réalisations avec photos avant/après, les délais tenus et les garanties.
Évite les promesses excessives. Mets en avant la réputation locale et les recommandations de bouche-à-oreille.`,
  },

  autre: {
    sectorKey: 'autre',
    label: 'Autre secteur',
    emoji: '⚙️',
    platforms: [
      {
        id: 'google_business',
        name: 'Google Business',
        emoji: '🌐',
        description: 'Fiche Google My Business et avis centralisés',
        connectUrl: 'https://business.google.com',
        webhookSlug: 'google_business',
        badgeColor: 'border-teal-300/60 text-teal-700 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-300',
        primary: true,
      },
    ],
    aiSystemPromptSuffix: `
Tu es l'IA d'un professionnel local. Adopte un ton professionnel et adapté au contexte de son activité.
Génère des publications pertinentes pour son secteur en mettant en avant ses points forts et son expertise.`,
  },
};

/** Mappe le secteur de l'onboarding (OnboardingPage) vers la clé de connecteur */
export function mapOnboardingSectorToConnectorKey(onboardingSector: string): SectorKey {
  const mapping: Record<string, SectorKey> = {
    // Beauté / Bien-être
    beaute: 'beaute',
    bienetre: 'beaute',
    // Médical
    sante: 'medical',
    medical: 'medical',
    // Restauration
    restauration: 'restauration',
    alimentation: 'restauration',
    // Hôtellerie
    tourisme: 'hotellerie',
    hotellerie: 'hotellerie',
    conciergerie: 'hotellerie',
    // Automobile / Artisanat / BTP
    artisanat: 'automobile',
    automobile: 'automobile',
    batiment: 'automobile',
    artisan: 'automobile',
    // Autres → fallback
    retail: 'autre',
    ecommerce: 'autre',
    commerce: 'autre',
    immobilier: 'autre',
    assurance: 'autre',
    juridique: 'autre',
    tech: 'autre',
    conseil: 'autre',
    education: 'autre',
    sport: 'autre',
    evenementiel: 'autre',
    autre: 'autre',
  };
  return mapping[onboardingSector] ?? 'autre';
}

/** Secteurs disponibles dans le sélecteur onboarding dynamique */
export const ONBOARDING_SECTOR_OPTIONS = [
  { key: 'beaute' as SectorKey,      label: 'Beauté / Coiffure',           emoji: '💇' },
  { key: 'medical' as SectorKey,     label: 'Médical / Bien-être',          emoji: '🩺' },
  { key: 'restauration' as SectorKey,label: 'Restauration',                 emoji: '🍽️' },
  { key: 'hotellerie' as SectorKey,  label: 'Hôtellerie / Conciergerie',   emoji: '🏨' },
  { key: 'automobile' as SectorKey,  label: 'Artisanat / Automobile',       emoji: '🔧' },
  { key: 'autre' as SectorKey,       label: 'Autre secteur',                emoji: '⚙️' },
];
