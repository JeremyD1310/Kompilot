/**
 * hybridScanData.ts — Realistic lead generation data for the Hybrid Local Scan module.
 *
 * Generates plausible local business names, emails, phones per sector/city
 * for maximum credibility in the scan result dashboard.
 */

import type { Sector } from './sectorData';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface HybridLead {
  id: string;
  name: string;
  sector: Sector;
  rating: number;
  reviews: number;
  email: string;
  phone: string;
  address: string;
  signal: 'hot' | 'warm' | 'new';
  signalLabel: string;
  source: string;
  sourceIcon: string;
}

export interface ScanPhaseMessage {
  range: [number, number];
  text: string;
  icon: string;
}

// ── Sector-specific business name templates ─────────────────────────────────────

const BUSINESS_TEMPLATES: Record<Exclude<Sector, ''>, string[]> = {
  beauty: [
    'Salon {adj} {ville}',
    'Studio Beauté {ville}',
    'L\'Atelier de {ville}',
    'Maison {adj} {ville}',
    'Institut {adj} {ville}',
    'Coiffure & Style {ville}',
    'Espace Bien-être {ville}',
    '{ville} Hair Studio',
    'Studio {ville}',
    'Beauté & Sens {ville}',
  ],
  medical: [
    'Cabinet Dr. {name}',
    'Centre Médical {ville}',
    'Cabinet de {ville}',
    'Clinique {adj} {ville}',
    'Dr. {name} — {specialty}',
    'Centre de Santé {ville}',
    'Cabinet {name} & Associés',
    'Maison de Santé {ville}',
    'Polyclinique {ville}',
    'Dr. {name} — Médecine Générale',
  ],
  restaurant: [
    'Le {adj} {ville}',
    'Chez {name}',
    'Restaurant {ville}',
    'Le Petit {ville}',
    'La Table de {name}',
    '{ville} Gourmand',
    'Bistrot {adj} {ville}',
    'Le Chef de {ville}',
    'La Cuisine de {name}',
    '{name} — Bistro & Bar',
  ],
  hotel: [
    'Hôtel {adj} {ville}',
    'Le {ville} Hôtel',
    'Maison d\'Hôtes {ville}',
    'Résidence {adj} {ville}',
    'Les Jardins de {ville}',
    'Chambres d\'Hôtes {name}',
    'Hôtel & Spa {ville}',
    'Le Domaine de {name}',
    '{ville} Résidence',
    'Villa {name}',
  ],
  auto: [
    'Garage {name}',
    'Auto Service {ville}',
    '{name} Automobiles',
    'Garage du {adj} {ville}',
    'Mécanique {name}',
    'Auto Expert {ville}',
    'Carrosserie {name}',
    'Atelier Auto {ville}',
    '{ville} Auto Center',
    'Garage {adj} — {ville}',
  ],
};

const FIRST_NAMES = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier'];
const ADJECTIVES = ['Authentique', 'Premium', 'Royal', 'Joli', 'Chic', 'Élégant', 'Harmonie', 'Sérénité', 'Or', 'Zen'];
const SPECIALTIES = ['Médecine Générale', 'Dermatologie', 'Kinésithérapie', 'Dentiste', 'Ophtalmologie', 'Gynécologie', 'Cardiologie', 'ORL', 'Pédiatrie', 'Rhumatologie'];

const PARTNER_SOURCES: Record<Exclude<Sector, ''>, { name: string; icon: string }[]> = {
  beauty: [
    { name: 'Planity', icon: '✂️' },
    { name: 'Google Business', icon: '🗺️' },
    { name: 'Treatwell', icon: '💅' },
    { name: 'Instagram', icon: '📸' },
  ],
  medical: [
    { name: 'Doctolib', icon: '🩺' },
    { name: 'Google Business', icon: '🗺️' },
    { name: 'Maiia', icon: '🏥' },
  ],
  restaurant: [
    { name: 'TheFork', icon: '🍴' },
    { name: 'TripAdvisor', icon: '🦉' },
    { name: 'Google Business', icon: '🗺️' },
    { name: 'Deliveroo', icon: '🛵' },
  ],
  hotel: [
    { name: 'Booking.com', icon: '🏨' },
    { name: 'Airbnb', icon: '🏠' },
    { name: 'Google Business', icon: '🗺️' },
    { name: 'TripAdvisor', icon: '🦉' },
  ],
  auto: [
    { name: 'Vroomly', icon: '🔧' },
    { name: 'Google Business', icon: '🗺️' },
    { name: 'iDGarages', icon: '🚗' },
  ],
};

// ── Deterministic pseudo-random from string seed ────────────────────────────────

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0x7fffffff;
  return h;
}

function pick<T>(arr: T[], seed: number, idx: number): T {
  return arr[(seed + idx * 7) % arr.length];
}

function randomPhone(seed: number, idx: number): string {
  const prefixes = ['06', '07', '01', '02', '03', '04', '05', '09'];
  const prefix = pick(prefixes, seed, idx);
  let num = prefix;
  for (let i = 0; i < 8; i++) {
    num += ((seed * (i + 1) * (idx + 3) + i * 17) % 10).toString();
  }
  return num.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
}

function randomEmail(name: string, seed: number, idx: number): string {
  const domains = ['gmail.com', 'outlook.fr', 'yahoo.fr', 'hotmail.fr', 'free.fr', 'orange.fr', 'wanadoo.fr'];
  const domain = pick(domains, seed, idx);
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '');
  const prefix = slug.length > 30 ? slug.slice(0, 30) : slug;
  return `${prefix}@${domain}`;
}

// ── Main generator ──────────────────────────────────────────────────────────────

export function generateHybridLeads(sector: Exclude<Sector, ''>, city: string, count = 4): HybridLead[] {
  if (!sector || !city) return [];
  const seed = hashSeed(`${sector}-${city.toLowerCase()}`);
  const templates = BUSINESS_TEMPLATES[sector];
  const sources = PARTNER_SOURCES[sector];

  return Array.from({ length: count }, (_, i) => {
    const template = pick(templates, seed, i);
    const name = template
      .replace('{ville}', city.charAt(0).toUpperCase() + city.slice(1).toLowerCase())
      .replace('{name}', pick(FIRST_NAMES, seed, i + 3))
      .replace('{adj}', pick(ADJECTIVES, seed, i + 5))
      .replace('{specialty}', pick(SPECIALTIES, seed, i + 7));

    const rating = 3.8 + (((seed + i * 13) % 12) / 10); // 3.8 - 4.9
    const reviews = 12 + ((seed + i * 23) % 180);
    const source = pick(sources, seed, i + 2);

    const signals: HybridLead['signal'][] = ['hot', 'warm', 'new'];
    const signal = pick(signals, seed, i + 1);
    const signalLabels = { hot: 'Lead chaud', warm: 'Signal faible', new: 'Nouveau' };

    const streets = ['Rue de la République', 'Avenue Jean Jaurès', 'Boulevard Victor Hugo', 'Place du Marché', 'Rue du Général de Gaulle', 'Allée des Tilleuls', 'Impasse des Lilas', 'Rue Pasteur', 'Avenue de la Gare', 'Rue de la Mairie'];
    const street = pick(streets, seed, i + 10);
    const num = 1 + ((seed + i * 7) % 120);

    return {
      id: `lead-${seed}-${i}`,
      name,
      sector,
      rating: Math.round(rating * 10) / 10,
      reviews,
      email: randomEmail(name, seed, i),
      phone: randomPhone(seed, i),
      address: `${num} ${street}, ${city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()}`,
      signal,
      signalLabel: signalLabels[signal],
      source: source.name,
      sourceIcon: source.icon,
    };
  });
}

// ── Scan phase messages (synchronized with 35s progress) ────────────────────────

export const SCAN_PHASE_MESSAGES: ScanPhaseMessage[] = [
  {
    range: [0, 15],
    text: 'Connexion aux API de cartographie et géolocalisation sur {city}...',
    icon: '🌐',
  },
  {
    range: [16, 40],
    text: 'Analyse des citations locales et intentions d\'achat ChatGPT / Perplexity...',
    icon: '🤖',
  },
  {
    range: [41, 65],
    text: 'Scannage des signaux faibles et avis Google Business...',
    icon: '📡',
  },
  {
    range: [66, 85],
    text: 'Calcul du scoring IA et détection des parts de voix...',
    icon: '📊',
  },
  {
    range: [86, 100],
    text: 'Filtrage et sécurisation des fiches prospects...',
    icon: '🔒',
  },
];

// ── Sector-specific partner integrations (for Step 1 preview) ────────────────────

export const SECTOR_PARTNERS: Record<Exclude<Sector, ''>, { name: string; icon: string; color: string; desc: string }[]> = {
  beauty: [
    { name: 'Planity', icon: '✂️', color: '#7C3AED', desc: 'Réservations en ligne' },
    { name: 'Treatwell', icon: '💅', color: '#EC4899', desc: 'Gestion des avis' },
    { name: 'Google Business', icon: '🗺️', color: '#4285F4', desc: 'Fiche Maps & avis' },
    { name: 'Instagram', icon: '📸', color: '#E1306C', desc: 'Contenus & stories' },
  ],
  medical: [
    { name: 'Doctolib', icon: '🩺', color: '#0EA5E9', desc: 'Agenda & RDV' },
    { name: 'Google Business', icon: '🗺️', color: '#4285F4', desc: 'Fiche Maps' },
    { name: 'Maiia', icon: '🏥', color: '#10B981', desc: 'Dossiers patients' },
  ],
  restaurant: [
    { name: 'TheFork', icon: '🍴', color: '#00AF87', desc: 'Réservations' },
    { name: 'TripAdvisor', icon: '🦉', color: '#34D399', desc: 'Évaluations' },
    { name: 'Google Business', icon: '🗺️', color: '#4285F4', desc: 'Fiche Maps & avis' },
    { name: 'Deliveroo', icon: '🛵', color: '#00CCBC', desc: 'Commandes en ligne' },
  ],
  hotel: [
    { name: 'Booking.com', icon: '🏨', color: '#003580', desc: 'Réservations' },
    { name: 'Airbnb', icon: '🏠', color: '#FF5A5F', desc: 'Annonces & éval.' },
    { name: 'Google Business', icon: '🗺️', color: '#4285F4', desc: 'Fiche Maps' },
    { name: 'TripAdvisor', icon: '🦉', color: '#34D399', desc: 'Notes & classement' },
  ],
  auto: [
    { name: 'Vroomly', icon: '🔧', color: '#F97316', desc: 'Devis & interventions' },
    { name: 'iDGarages', icon: '🚗', color: '#DC2626', desc: 'Avis & réputation' },
    { name: 'Google Business', icon: '🗺️', color: '#4285F4', desc: 'Fiche Maps' },
  ],
};
