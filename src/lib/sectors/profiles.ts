/**
 * sectors/profiles.ts — Configurations des 4 profils maîtres + secteurs d'onboarding.
 */
import type { MasterProfileConfig, CommerceSectorOption } from './types';
import {
  LEXICON_STANDARD, LEXICON_BATIMENT, LEXICON_ASSURANCE_CONSEIL, LEXICON_AGENCE,
} from './lexicons';

export const MASTER_PROFILES: Record<string, MasterProfileConfig> = {
  flux: {
    id: 'flux',
    label: 'Sur Rendez-vous / Flux',
    description: 'Restauration, Beauté, Médical',
    emoji: '📅',
    activatedModules: ['anti_no_show', 'caissier', 'weather_alerts', 'geo_authority', 'post_calendar', 'inbox', 'reviews_manager', 'sos_crisis', 'local_events'],
    disabledModules: ['security_deposit', 'photo_qualification', 'geo_zone_max', 'lead_qualification', 'contract_reminders', 'reputation_corp'],
    lexicon: LEXICON_STANDARD,
    mentorMode: 'terrain',
    onboardingVideoId: 'flux_anti_no_show',
    onboardingVideoTitle: 'Activer l\'anti-no show Stripe et suivre la météo d\'affluence',
    walkthroughSteps: [
      { anchor: 'data-tour="stripe-connect"', title: 'Connecter Stripe', content: 'Reliez votre compte Stripe pour activer l\'empreinte bancaire anti-no show.', action: 'Paramètres → Stripe' },
      { anchor: 'data-tour="no-show-toggle"', title: 'Activer l\'Anti-No Show', content: 'Paramétrez le montant d\'empreinte (ex: 20€) et la durée d\'autorisation.', action: 'Configurer l\'empreinte' },
      { anchor: 'data-tour="calendar-events"', title: 'Calendrier Événementiel', content: 'Le Copilote suit matchs, festivals et jours fériés pour adapter vos prévisions d\'affluence.', action: 'Voir le calendrier' },
      { anchor: 'data-tour="sos-button"', title: 'Bouton SOS Crise', content: 'En cas d\'imprévu, libérez les empreintes et informez vos clients en 1 clic.', action: 'Tester le mode SOS' },
    ],
    stripeScriptType: 'standard',
    roiMetric: 'Taux de tables / RDV honorés',
  },

  chantier: {
    id: 'chantier',
    label: 'Sur Site / Chantiers',
    description: 'Bâtiment, Artisans, Conciergerie',
    emoji: '🏗️',
    activatedModules: ['security_deposit', 'photo_qualification', 'geo_zone_max', 'geo_authority', 'post_calendar', 'inbox', 'reviews_manager', 'sos_crisis', 'local_events'],
    disabledModules: ['anti_no_show', 'caissier', 'weather_alerts', 'flash_coupons', 'inventory_predict', 'lead_qualification', 'contract_reminders'],
    lexicon: LEXICON_BATIMENT,
    mentorMode: 'chantier',
    onboardingVideoId: 'chantier_security_deposit',
    onboardingVideoTitle: 'Sécuriser vos frais de déplacement et qualifier vos chantiers avec l\'IA',
    walkthroughSteps: [
      { anchor: 'data-tour="geo-zone"', title: 'Zone d\'intervention', content: 'Définissez votre rayon maximum pour filtrer les prospects non rentables.', action: 'Configurer la zone' },
      { anchor: 'data-tour="security-deposit"', title: 'Empreinte Déplacement', content: 'Paramétrez le montant de sécurité pour chaque visite de chantier (ex: 50€).', action: 'Activer l\'empreinte' },
      { anchor: 'data-tour="photo-upload"', title: 'Photos de chantier IA', content: 'Téléversez des photos : l\'IA qualifie le projet et génère un devis type.', action: 'Tester l\'upload' },
    ],
    stripeScriptType: 'btp',
    roiMetric: 'Taux de conversion de devis',
  },

  produits: {
    id: 'produits',
    label: 'Produits / Commerce',
    description: 'Retail, E-commerce local',
    emoji: '🛍️',
    activatedModules: ['flash_coupons', 'product_reviews', 'inventory_predict', 'geo_authority', 'post_calendar', 'inbox', 'reviews_manager', 'sos_crisis', 'local_events'],
    disabledModules: ['anti_no_show', 'security_deposit', 'photo_qualification', 'geo_zone_max', 'lead_qualification', 'contract_reminders', 'reputation_corp'],
    lexicon: LEXICON_STANDARD,
    mentorMode: 'default',
    onboardingVideoId: 'produits_flash_coupons',
    onboardingVideoTitle: 'Générer des coupons flash IA et analyser vos avis produits',
    walkthroughSteps: [
      { anchor: 'data-tour="inventory-alert"', title: 'Alertes Surstock', content: 'Signalez un surstock : le Copilote génère un coupon flash et le post qui va avec.', action: 'Créer une alerte' },
      { anchor: 'data-tour="product-reviews"', title: 'Analyse Avis Produits', content: 'L\'IA identifie vos produits les mieux notés pour les mettre en avant automatiquement.', action: 'Voir les analyses' },
      { anchor: 'data-tour="weather-posts"', title: 'Posts Météo Opportunistes', content: 'Par mauvais temps, l\'IA suggère de vider les stocks avec des offres ciblées.', action: 'Activer les suggestions' },
    ],
    stripeScriptType: 'standard',
    roiMetric: 'Panier moyen & rotation des stocks',
  },

  services_b2b: {
    id: 'services_b2b',
    label: 'Contrats / Services B2B',
    description: 'Assurance, Immobilier, Conseil',
    emoji: '💼',
    activatedModules: ['lead_qualification', 'contract_reminders', 'reputation_corp', 'geo_authority', 'post_calendar', 'inbox', 'reviews_manager', 'sos_crisis'],
    disabledModules: ['anti_no_show', 'caissier', 'weather_alerts', 'security_deposit', 'photo_qualification', 'flash_coupons', 'inventory_predict'],
    lexicon: LEXICON_ASSURANCE_CONSEIL,
    mentorMode: 'services',
    onboardingVideoId: 'services_b2b_lead_qualification',
    onboardingVideoTitle: 'Automatiser vos relances de contrats et formulaires IA',
    walkthroughSteps: [
      { anchor: 'data-tour="lead-form"', title: 'Formulaire IA de Qualification', content: 'Configurez un formulaire intelligent qui qualifie vos leads avant la première consultation.', action: 'Créer un formulaire' },
      { anchor: 'data-tour="contract-reminders"', title: 'Relances Contrats Auto', content: 'Synchronisez votre calendrier de renouvellements : l\'IA envoie les relances au bon moment.', action: 'Configurer les relances' },
      { anchor: 'data-tour="reputation-corp"', title: 'Réputation Corporate', content: 'Simulez l\'impact de vos avis sur votre score de confiance professionnel.', action: 'Voir le simulateur' },
    ],
    stripeScriptType: 'conseil',
    roiMetric: 'Valeur Vie Client (LTV)',
  },

  agence: {
    id: 'agence',
    label: 'Agences & Réseaux',
    description: 'Agences marketing, franchises',
    emoji: '🏢',
    activatedModules: ['white_label', 'roi_sliders', 'geo_authority', 'post_calendar', 'inbox', 'reviews_manager', 'sos_crisis', 'local_events'],
    disabledModules: ['anti_no_show', 'caissier', 'weather_alerts', 'security_deposit', 'photo_qualification', 'flash_coupons', 'inventory_predict'],
    lexicon: LEXICON_AGENCE,
    mentorMode: 'agency',
    onboardingVideoId: 'agence_white_label',
    onboardingVideoTitle: 'Configurer votre Marque Blanche et générer des rapports ROI pour vos clients',
    walkthroughSteps: [
      { anchor: 'data-tour="logo-upload"', title: 'Téléverser votre Logo', content: 'Uploadez votre logo : il remplacera celui de Kompilot dans toute l\'interface et les rapports PDF.', action: 'Paramètres → Marque Blanche' },
      { anchor: 'data-tour="roi-sliders"', title: 'Sliders de ROI', content: 'Ajustez les pondérations (panier moyen, fréquence) pour calculer le ROI de chaque client.', action: 'Ouvrir les sliders' },
      { anchor: 'data-tour="geo-report"', title: 'Rapport Part de Voix G.E.O.', content: 'Générez un rapport PDF comparatif de présence IA pour démontrer votre valeur.', action: 'Générer un rapport' },
    ],
    stripeScriptType: 'agence',
    roiMetric: 'MRR & rétention clients agence',
  },
};

/** Options secteurs pour l'étape 2 du wizard d'onboarding (profil commerce) */
export const COMMERCE_SECTORS: CommerceSectorOption[] = [
  // ── Flux / Rendez-vous ──────────────────────────────────────────────────
  { id: 'restauration', label: 'Restauration',          emoji: '🍽️', masterProfile: 'flux',        description: 'Restaurant, brasserie, food truck, café' },
  { id: 'hotellerie',   label: 'Hôtellerie',            emoji: '🏨', masterProfile: 'flux',        description: 'Hôtel, gîte, chambre d\'hôtes, résidence' },
  { id: 'beaute',       label: 'Beauté',                emoji: '💇', masterProfile: 'flux',        description: 'Salon de coiffure, barbier, onglerie' },
  { id: 'bienetre',     label: 'Bien-être & Spa',       emoji: '🧘', masterProfile: 'flux',        description: 'Spa, massage, institut de beauté, yoga' },
  { id: 'medical',      label: 'Médical / Paramédical', emoji: '🩺', masterProfile: 'flux',        description: 'Médecin, kiné, ostéo, dentiste, pharmacie' },
  { id: 'sport',        label: 'Sport & Fitness',       emoji: '🏋️', masterProfile: 'flux',        description: 'Salle de sport, coach, studio fitness' },
  // ── Commerce / Retail ───────────────────────────────────────────────────
  { id: 'retail',       label: 'Retail / Boutique',     emoji: '🛍️', masterProfile: 'produits',    description: 'Mode, chaussures, accessoires, maison' },
  { id: 'commerce',     label: 'Commerce de proximité', emoji: '🏪', masterProfile: 'produits',    description: 'Épicerie, tabac-presse, librairie, fleuriste' },
  { id: 'alimentation', label: 'Alimentation / Épicerie',emoji: '🛒', masterProfile: 'produits',   description: 'Boucherie, boulangerie, fromagerie, épicerie fine' },
  { id: 'ecommerce',    label: 'E-commerce local',      emoji: '📦', masterProfile: 'produits',    description: 'Vente en ligne avec retrait en boutique' },
  // ── B2B / Services ──────────────────────────────────────────────────────
  { id: 'assurance',    label: 'Assurance / Finance',   emoji: '🛡️', masterProfile: 'services_b2b', description: 'Courtier assurance, conseiller financier, banque' },
  { id: 'immobilier',   label: 'Immobilier',            emoji: '🏠', masterProfile: 'services_b2b', description: 'Agence immobilière, mandataire, promoteur' },
  { id: 'conseil',      label: 'Conseil & Coaching',    emoji: '💼', masterProfile: 'services_b2b', description: 'Consultant, coach, formateur, RH' },
  { id: 'tech',         label: 'Tech & SaaS',           emoji: '💻', masterProfile: 'services_b2b', description: 'Startup, éditeur logiciel, freelance IT' },
  { id: 'juridique',    label: 'Juridique / Notariat',  emoji: '⚖️', masterProfile: 'services_b2b', description: 'Avocat, notaire, expert-comptable' },
  // ── Artisanat / Chantier ────────────────────────────────────────────────
  { id: 'batiment',     label: 'Bâtiment / BTP',        emoji: '🏗️', masterProfile: 'chantier',    description: 'Maçon, électricien, plombier, couvreur' },
  { id: 'artisan',      label: 'Artisan / Menuisier',   emoji: '🔨', masterProfile: 'chantier',    description: 'Menuisier, ébéniste, peintre, carreleur' },
  { id: 'conciergerie', label: 'Conciergerie / Airbnb', emoji: '🏡', masterProfile: 'chantier',    description: 'Gestion locative, conciergerie courte durée' },
  { id: 'automobile',   label: 'Automobile / Garage',   emoji: '🚗', masterProfile: 'chantier',    description: 'Garage, carrosserie, concessionnaire, auto-école' },
  // ── Autres ──────────────────────────────────────────────────────────────
  { id: 'education',    label: 'Éducation / Formation', emoji: '📚', masterProfile: 'flux',        description: 'École, université, centre de formation, cours particuliers' },
  { id: 'evenementiel', label: 'Événementiel',          emoji: '🎉', masterProfile: 'flux',        description: 'Traiteur événementiel, organisateur, DJ, photographe' },
  { id: 'autre',        label: 'Autre secteur',         emoji: '⚙️', masterProfile: 'produits',    description: 'Mon secteur n\'est pas dans la liste' },
];

/** Mapping secteur granulaire → profil maître */
export const SECTOR_TO_MASTER_PROFILE: Record<string, NonNullable<import('./types').MasterProfile>> = {
  // Flux / Rendez-vous
  restauration: 'flux', hotellerie: 'flux', beaute: 'flux', bienetre: 'flux',
  medical: 'flux', sante: 'flux', sport: 'flux', education: 'flux', evenementiel: 'flux',
  // Chantier / Artisanat
  batiment: 'chantier', artisan: 'chantier', conciergerie: 'chantier', automobile: 'chantier',
  // Produits / Commerce
  retail: 'produits', commerce: 'produits', alimentation: 'produits', ecommerce: 'produits', autre: 'produits',
  // Services B2B
  assurance: 'services_b2b', conseil: 'services_b2b', immobilier: 'services_b2b',
  tech: 'services_b2b', juridique: 'services_b2b',
  // Agence
  agence: 'agence',
};
