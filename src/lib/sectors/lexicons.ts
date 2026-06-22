/**
 * sectors/lexicons.ts — Dictionnaires de vocabulaire métier par secteur.
 */
import type { LexiconDictionary, GranularSector, MasterProfile } from './types';

export const LEXICON_STANDARD: LexiconDictionary = {
  client: 'Client', clients: 'Clients',
  rendezvous: 'Rendez-vous', vente: 'Vente', ventes: 'Ventes',
  boutique: 'Établissement', equipe: 'Équipe',
  reservation: 'Réservation', no_show: 'No-Show', acompte: 'Acompte',
  service: 'Service', offre: 'Offre', facture: 'Facture',
  chiffre_affaires: 'Chiffre d\'affaires',
  contact_label: 'Contacter', mission_label: 'Gérer votre activité',
};

export const LEXICON_BATIMENT: LexiconDictionary = {
  client: 'Maître d\'ouvrage', clients: 'Maîtres d\'ouvrage',
  rendezvous: 'Visite de chantier', vente: 'Devis signé', ventes: 'Devis signés',
  boutique: 'Zone d\'intervention', equipe: 'Compagnons',
  reservation: 'Planification chantier', no_show: 'Déplacement non honoré',
  acompte: 'Acompte BTP', service: 'Prestation', offre: 'Devis',
  facture: 'Situation de travaux', chiffre_affaires: 'CA travaux',
  contact_label: 'Demander un devis', mission_label: 'Gérer vos chantiers',
};

export const LEXICON_CONCIERGERIE: LexiconDictionary = {
  client: 'Propriétaire / Voyageur', clients: 'Propriétaires / Voyageurs',
  rendezvous: 'Check-in / Check-out', vente: 'Prestation validée', ventes: 'Prestations validées',
  boutique: 'Logement', equipe: 'Prestataires',
  reservation: 'Réservation séjour', no_show: 'No-Show voyageur',
  acompte: 'Caution', service: 'Prestation de conciergerie',
  offre: 'Offre de séjour', facture: 'Facture de séjour',
  chiffre_affaires: 'Revenus locatifs',
  contact_label: 'Contacter le propriétaire', mission_label: 'Gérer vos logements',
};

export const LEXICON_ASSURANCE_CONSEIL: LexiconDictionary = {
  client: 'Assuré / Mandant', clients: 'Assurés / Mandants',
  rendezvous: 'Consultation', vente: 'Contrat clôturé', ventes: 'Contrats clôturés',
  boutique: 'Cabinet', equipe: 'Conseillers',
  reservation: 'Prise en charge', no_show: 'Consultation manquée',
  acompte: 'Provision', service: 'Conseil / Expertise',
  offre: 'Proposition commerciale', facture: 'Honoraires',
  chiffre_affaires: 'Volume de primes / Honoraires',
  contact_label: 'Prendre contact', mission_label: 'Gérer vos mandants',
};

export const LEXICON_IMMOBILIER: LexiconDictionary = {
  client: 'Acquéreur / Vendeur', clients: 'Acquéreurs / Vendeurs',
  rendezvous: 'Visite', vente: 'Compromis signé', ventes: 'Compromis signés',
  boutique: 'Agence', equipe: 'Négociateurs',
  reservation: 'Réservation visite', no_show: 'Visite annulée',
  acompte: 'Séquestre', service: 'Transaction immobilière',
  offre: 'Offre d\'achat', facture: 'Honoraires d\'agence',
  chiffre_affaires: 'Volume de transactions',
  contact_label: 'Contacter l\'agence', mission_label: 'Gérer vos transactions',
};

export const LEXICON_AGENCE: LexiconDictionary = {
  client: 'Client agence', clients: 'Clients agence',
  rendezvous: 'Brief client', vente: 'Contrat signé', ventes: 'Contrats signés',
  boutique: 'Portefeuille client', equipe: 'Account managers',
  reservation: 'Planning agence', no_show: 'Réunion annulée',
  acompte: 'Acompte contrat', service: 'Prestation marketing',
  offre: 'Proposition commerciale', facture: 'Facture agence',
  chiffre_affaires: 'Revenus récurrents (MRR)',
  contact_label: 'Demander une démo', mission_label: 'Gérer votre portefeuille',
};

/** Override lexical par secteur granulaire (si différent du profil maître) */
export const SECTOR_LEXICON_OVERRIDE: Partial<Record<GranularSector, LexiconDictionary>> = {
  batiment: LEXICON_BATIMENT,
  artisan: LEXICON_BATIMENT,
  conciergerie: LEXICON_CONCIERGERIE,
  assurance: LEXICON_ASSURANCE_CONSEIL,
  conseil: LEXICON_ASSURANCE_CONSEIL,
  immobilier: LEXICON_IMMOBILIER,
  agence: LEXICON_AGENCE,
};

/** Lexique par profil maître (fallback) */
export const MASTER_PROFILE_LEXICON: Record<NonNullable<MasterProfile>, LexiconDictionary> = {
  flux: LEXICON_STANDARD,
  chantier: LEXICON_BATIMENT,
  produits: LEXICON_STANDARD,
  services_b2b: LEXICON_ASSURANCE_CONSEIL,
  agence: LEXICON_AGENCE,
};
