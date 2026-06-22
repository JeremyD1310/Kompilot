/**
 * sectors/types.ts — Tous les types du système de polymorphisme B2B.
 */

/** 4 grands profils maîtres selon le modèle opérationnel */
export type MasterProfile =
  | 'flux'          // Sur Rendez-vous/Flux : Restauration, Beauté, Médical
  | 'chantier'      // Sur Site/Chantiers   : Bâtiment, Artisans, Conciergerie
  | 'produits'      // Produits/Commerce    : Retail, E-commerce local
  | 'services_b2b'  // Contrats/Services B2B: Assurance, Immo, Conseil
  | 'agence'        // Agences & Réseaux
  | null;

/** Secteurs granulaires sélectionnables à l'inscription */
export type GranularSector =
  // Flux / Rendez-vous
  | 'restauration' | 'hotellerie' | 'beaute' | 'bienetre' | 'medical' | 'sport'
  // Commerce / Retail
  | 'retail' | 'commerce' | 'alimentation' | 'ecommerce'
  // Services B2B
  | 'assurance' | 'immobilier' | 'conseil' | 'tech' | 'juridique'
  // Artisanat / Chantier
  | 'batiment' | 'artisan' | 'conciergerie' | 'automobile'
  // Autres
  | 'education' | 'evenementiel'
  // Génériques
  | 'agence' | 'autre';

/** Modules activables dans l'application */
export type AppModule =
  | 'anti_no_show'        // Empreinte bancaire anti no-show Stripe
  | 'caissier'            // Interface validation coupon caisse
  | 'weather_alerts'      // Alertes météo d'affluence
  | 'security_deposit'    // Empreinte déplacement sécurité
  | 'photo_qualification' // Upload photos chantier pour l'IA
  | 'geo_zone_max'        // Gestion zone géographique max
  | 'flash_coupons'       // Coupons flash basés sur surstocks
  | 'product_reviews'     // Analyse avis produits
  | 'inventory_predict'   // Prédictions logistiques inventaire
  | 'lead_qualification'  // Agent IA qualification leads complexes
  | 'contract_reminders'  // Synchronisation calendriers relance contrats
  | 'reputation_corp'     // Simulateur réputation corporate
  | 'white_label'         // Marque blanche (logo + domaine)
  | 'roi_sliders'         // Sliders calcul ROI personnalisables
  | 'geo_authority'       // Score G.E.O. & visibilité IA
  | 'post_calendar'       // Calendrier éditorial
  | 'inbox'               // Boîte de réception unifiée
  | 'reviews_manager'     // Gestion avis Google
  | 'sos_crisis'          // Mode SOS Crise
  | 'local_events';       // Suivi événements locaux

/** Dictionnaire de vocabulaire sectoriel */
export interface LexiconDictionary {
  client: string;
  clients: string;
  rendezvous: string;
  vente: string;
  ventes: string;
  boutique: string;
  equipe: string;
  reservation: string;
  no_show: string;
  acompte: string;
  service: string;
  offre: string;
  facture: string;
  chiffre_affaires: string;
  contact_label: string;
  mission_label: string;
}

/** Étape de guide interactif "clic-par-clic" */
export interface WalkthroughStep {
  anchor: string;
  title: string;
  content: string;
  action?: string;
}

/** Configuration complète d'un profil maître */
export interface MasterProfileConfig {
  id: MasterProfile;
  label: string;
  description: string;
  emoji: string;
  activatedModules: AppModule[];
  disabledModules: AppModule[];
  lexicon: LexiconDictionary;
  mentorMode: 'terrain' | 'chantier' | 'conciergerie' | 'services' | 'agency' | 'default';
  onboardingVideoId: string;
  onboardingVideoTitle: string;
  walkthroughSteps: WalkthroughStep[];
  stripeScriptType: 'standard' | 'btp' | 'conciergerie' | 'conseil' | 'agence';
  roiMetric: string;
}

/** Secteur affiché dans le wizard d'onboarding */
export interface CommerceSectorOption {
  id: GranularSector;
  label: string;
  emoji: string;
  masterProfile: MasterProfile;
  description: string;
}
