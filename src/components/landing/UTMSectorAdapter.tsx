/**
 * UTMSectorAdapter — Adapte dynamiquement la Landing Page selon utm_sector
 *
 * Mappage UTM → contenu contextuel :
 *   beaute     → Planity, Instagram, Google
 *   resto      → TheFork, TripAdvisor, Google
 *   medecin    → Doctolib, Google
 *   coiffeur   → Planity, Instagram
 *   sport      → Mindbody, Instagram
 *   hotel      → Booking.com, TripAdvisor
 *   commerce   → Google, Instagram (générique)
 */

export interface SectorConfig {
  sector: string;
  label: string;
  headline: string;
  subline: string;
  badge: string;
  platforms: Array<{ name: string; logo: string; color: string }>;
  ctaText: string;
  scanPlaceholder: string;
  socialProof: string;
}

export const SECTOR_CONFIGS: Record<string, SectorConfig> = {
  beaute: {
    sector: 'beaute',
    label: 'Beauté & Bien-être',
    headline: 'Gérez Planity, Instagram et Google',
    subline: 'depuis un seul cockpit IA — sans changer d\'outil.',
    badge: '✦ Spécial Beauté — Synchronisé avec Planity & Instagram',
    platforms: [
      { name: 'Planity', logo: '💅', color: '#E91E8C' },
      { name: 'Instagram', logo: '📸', color: '#E1306C' },
      { name: 'Google', logo: '🔍', color: '#4285F4' },
      { name: 'Facebook', logo: '📘', color: '#1877F2' },
    ],
    ctaText: 'Scanner mon salon gratuitement',
    scanPlaceholder: 'Ex: Institut beauté Paris 11...',
    socialProof: '340+ salons de beauté utilisent Kompilot',
  },
  resto: {
    sector: 'resto',
    label: 'Restauration',
    headline: 'Dominez TheFork, TripAdvisor et Google',
    subline: 'Répondez aux avis, planifiez vos posts, remplissez vos salles.',
    badge: '✦ Spécial Restauration — Connecté à TheFork & TripAdvisor',
    platforms: [
      { name: 'TheFork', logo: '🍴', color: '#00A550' },
      { name: 'TripAdvisor', logo: '🦉', color: '#34E0A1' },
      { name: 'Google', logo: '🔍', color: '#4285F4' },
      { name: 'Instagram', logo: '📸', color: '#E1306C' },
    ],
    ctaText: 'Scanner mon restaurant gratuitement',
    scanPlaceholder: 'Ex: Brasserie Le Marché Lyon...',
    socialProof: '620+ restaurants utilisent Kompilot',
  },
  medecin: {
    sector: 'medecin',
    label: 'Santé & Médical',
    headline: 'Gérez Doctolib, Google et votre réputation',
    subline: 'Automatisez vos réponses aux avis, protégez votre e-réputation médicale.',
    badge: '✦ Spécial Santé — RGPD & déontologie médicale',
    platforms: [
      { name: 'Doctolib', logo: '🏥', color: '#3182F6' },
      { name: 'Google', logo: '🔍', color: '#4285F4' },
      { name: 'Pagesjaunes', logo: '📒', color: '#F5C212' },
    ],
    ctaText: 'Scanner mon cabinet gratuitement',
    scanPlaceholder: 'Ex: Cabinet Dr. Dupont Paris...',
    socialProof: '180+ professionnels de santé font confiance à Kompilot',
  },
  coiffeur: {
    sector: 'coiffeur',
    label: 'Coiffure',
    headline: 'Remplissez votre agenda avec Planity & Instagram',
    subline: 'Automatisez vos posts, répondez à chaque avis, gagnez des nouveaux clients.',
    badge: '✦ Spécial Coiffure — Connecté à Planity',
    platforms: [
      { name: 'Planity', logo: '✂️', color: '#E91E8C' },
      { name: 'Instagram', logo: '📸', color: '#E1306C' },
      { name: 'Google', logo: '🔍', color: '#4285F4' },
    ],
    ctaText: 'Scanner mon salon gratuitement',
    scanPlaceholder: 'Ex: Salon coiffure Marseille...',
    socialProof: '290+ coiffeurs font confiance à Kompilot',
  },
  sport: {
    sector: 'sport',
    label: 'Sport & Fitness',
    headline: 'Attirez plus d\'adhérents avec votre présence digitale',
    subline: 'Posts automatisés, avis Google, Instagram — tout géré depuis un seul tableau de bord.',
    badge: '✦ Spécial Sport — Connecté à Mindbody & Google',
    platforms: [
      { name: 'Mindbody', logo: '🏋️', color: '#0B68E1' },
      { name: 'Instagram', logo: '📸', color: '#E1306C' },
      { name: 'Google', logo: '🔍', color: '#4285F4' },
      { name: 'Facebook', logo: '📘', color: '#1877F2' },
    ],
    ctaText: 'Scanner ma salle gratuitement',
    scanPlaceholder: 'Ex: CrossFit Box Paris 15...',
    socialProof: '150+ salles de sport utilisent Kompilot',
  },
  hotel: {
    sector: 'hotel',
    label: 'Hôtellerie',
    headline: 'Maximisez vos réservations sur Booking et TripAdvisor',
    subline: 'Gérez vos avis, planifiez vos contenus et boostez votre taux d\'occupation.',
    badge: '✦ Spécial Hôtellerie — Connecté à Booking.com & TripAdvisor',
    platforms: [
      { name: 'Booking.com', logo: '🏨', color: '#003580' },
      { name: 'TripAdvisor', logo: '🦉', color: '#34E0A1' },
      { name: 'Google', logo: '🔍', color: '#4285F4' },
      { name: 'Airbnb', logo: '🏡', color: '#FF5A5F' },
    ],
    ctaText: 'Scanner mon hôtel gratuitement',
    scanPlaceholder: 'Ex: Hôtel Le Moderne Nice...',
    socialProof: '95+ hôtels font confiance à Kompilot',
  },
};

/** Secteur par défaut (générique / commerce local) */
export const DEFAULT_SECTOR_CONFIG: SectorConfig = {
  sector: 'commerce',
  label: 'Commerce local',
  headline: 'Boostez votre visibilité locale avec l\'IA',
  subline: 'Planifiez vos posts, répondez à vos avis Google et pilotez votre inbox — depuis un seul cockpit.',
  badge: '✦ Nouveau — Réponse IA aux avis Google en 1 clic',
  platforms: [
    { name: 'Google', logo: '🔍', color: '#4285F4' },
    { name: 'Instagram', logo: '📸', color: '#E1306C' },
    { name: 'Facebook', logo: '📘', color: '#1877F2' },
    { name: 'TripAdvisor', logo: '🦉', color: '#34E0A1' },
  ],
  ctaText: 'Scanner mon établissement gratuitement',
  scanPlaceholder: 'Ex: Boulangerie Martin Paris 10...',
  socialProof: '1 200+ établissements actifs sur Kompilot',
};

/** Retourne la config du secteur détecté depuis utm_sector */
export function getSectorConfig(utmSector?: string | null): SectorConfig {
  if (!utmSector) return DEFAULT_SECTOR_CONFIG;
  return SECTOR_CONFIGS[utmSector.toLowerCase()] ?? DEFAULT_SECTOR_CONFIG;
}
