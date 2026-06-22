/**
 * bookingPlatforms.ts
 * Unified booking platform catalogue for Kompilot.
 *
 * Used by:
 * - EstablishmentModal    → sector picker pills + baseUrl placeholder
 * - AuditFlashModal       → platform-name alerts in findings
 * - promptBuilders        → smart CTA injection + bio CTA hints
 * - BookingPlatformClicksWidget → click tracking per platform
 */

export interface BookingPlatform {
  id: string;
  name: string;
  /** Regex to detect this platform from a URL */
  urlPattern: RegExp;
  /** Base URL used as placeholder when the merchant selects this platform */
  baseUrl: string;
  /** Emoji for display */
  emoji: string;
  /** Smart CTA template — {name} replaced by business name */
  ctaTemplate: string;
  /** Short bio-link CTA (for Instagram bio context) */
  bioCtaTemplate: string;
  /** Alert message when link is missing in audit results */
  missingLinkAlert: string;
  /** URL patterns as plain strings for substring matching */
  patterns: string[];
}

export interface SectorPlatforms {
  sectorKey: string;
  sectorLabel: string;
  platforms: BookingPlatform[];
}

// ── Platform catalogue ────────────────────────────────────────────────────────

export const BOOKING_PLATFORMS_BY_SECTOR: SectorPlatforms[] = [
  {
    sectorKey: 'beaute',
    sectorLabel: 'Beauté / Bien-être / Santé',
    platforms: [
      {
        id: 'planity',
        name: 'Planity',
        urlPattern: /planity\.com/i,
        baseUrl: 'https://www.planity.com/',
        emoji: '💅',
        ctaTemplate: '📅 Prêt(e) pour un nouveau look ? Réservez votre créneau chez {name} en 2 clics sur Planity 👉',
        bioCtaTemplate: '📅 Réservez via Planity 👇',
        missingLinkAlert: "⚠️ Votre lien Planity n'est pas configuré sur Instagram. Vous passez à côté de 68% de réservations directes.",
        patterns: ['planity.com'],
      },
      {
        id: 'fresha',
        name: 'Fresha',
        urlPattern: /fresha\.com/i,
        baseUrl: 'https://www.fresha.com/',
        emoji: '✂️',
        ctaTemplate: '📅 Envie de changer de tête ? Réservez votre créneau en 2 clics sur Fresha via le lien dans notre bio !',
        bioCtaTemplate: '📅 Réservez sur Fresha 👇',
        missingLinkAlert: "⚠️ Votre lien Fresha n'est pas sur Instagram. Vous passez à côté de 68% de réservations directes.",
        patterns: ['fresha.com'],
      },
      {
        id: 'treatwell',
        name: 'Treatwell',
        urlPattern: /treatwell\.fr|treatwell\.com|wahanda\.com/i,
        baseUrl: 'https://www.treatwell.fr/',
        emoji: '🌿',
        ctaTemplate: '✨ Offrez-vous une parenthèse bien-être ! Réservez votre soin chez {name} directement sur Treatwell 🌿',
        bioCtaTemplate: '🌿 Réservez sur Treatwell 👇',
        missingLinkAlert: "⚠️ Votre lien Treatwell n'est pas sur Instagram ou Facebook. Vous perdez des réservations directes.",
        patterns: ['treatwell.fr', 'treatwell.com', 'wahanda.com'],
      },
      {
        id: 'doctolib',
        name: 'Doctolib',
        urlPattern: /doctolib\.fr|doctolib\.com/i,
        baseUrl: 'https://www.doctolib.fr/',
        emoji: '🏥',
        ctaTemplate: '📅 Consultez {name} sans attendre ! Prenez rendez-vous en ligne sur Doctolib — disponible 24h/24 7j/7.',
        bioCtaTemplate: '📅 RDV sur Doctolib 👇',
        missingLinkAlert: "⚠️ Votre lien Doctolib n'est pas sur Instagram. Vos patients ne peuvent pas réserver directement.",
        patterns: ['doctolib.fr', 'doctolib.com'],
      },
      {
        id: 'booksy',
        name: 'Booksy',
        urlPattern: /booksy\.com/i,
        baseUrl: 'https://booksy.com/',
        emoji: '💇',
        ctaTemplate: '📅 Prenez soin de vous ! Réservez votre séance chez {name} sur Booksy — simple et rapide 💇',
        bioCtaTemplate: '📅 Réservez sur Booksy 👇',
        missingLinkAlert: "⚠️ Votre lien Booksy n'est pas intégré à Instagram. Vos followers passent à côté.",
        patterns: ['booksy.com'],
      },
    ],
  },
  {
    sectorKey: 'restauration',
    sectorLabel: 'Restauration',
    platforms: [
      {
        id: 'thefork',
        name: 'TheFork (LaFourchette)',
        urlPattern: /thefork\.fr|thefork\.com|lafourchette\.com/i,
        baseUrl: 'https://www.thefork.fr/',
        emoji: '🍴',
        ctaTemplate: '✨ Les tables partent vite pour ce week-end ! Pensez à réserver votre moment directement sur TheFork 👇',
        bioCtaTemplate: '🍴 Réservez sur TheFork 👇',
        missingLinkAlert: "⚠️ Votre lien TheFork n'est pas sur Instagram. Vous perdez 71% de réservations directes.",
        patterns: ['thefork.fr', 'thefork.com', 'lafourchette.com'],
      },
      {
        id: 'zenchef',
        name: 'Zenchef',
        urlPattern: /zenchef\.com/i,
        baseUrl: 'https://www.zenchef.com/',
        emoji: '🧑‍🍳',
        ctaTemplate: '📅 Une envie de bonne cuisine ? Réservez votre table chez {name} en quelques secondes via Zenchef 🍽️',
        bioCtaTemplate: '📅 Réservez via Zenchef 👇',
        missingLinkAlert: "⚠️ Votre lien Zenchef absent de votre bio Instagram. Vous perdez des réservations directes chaque jour.",
        patterns: ['zenchef.com'],
      },
      {
        id: 'guestonline',
        name: 'Guestonline',
        urlPattern: /guestonline\.io|guestonline\.fr/i,
        baseUrl: 'https://www.guestonline.io/',
        emoji: '🪑',
        ctaTemplate: '📅 Vivez une expérience unique chez {name} ! Réservez votre table sur Guestonline 🥂',
        bioCtaTemplate: '🪑 Réservez sur Guestonline 👇',
        missingLinkAlert: "⚠️ Votre lien Guestonline n'est pas visible sur Instagram ou Facebook.",
        patterns: ['guestonline.io', 'guestonline.fr'],
      },
      {
        id: 'resy',
        name: 'Resy',
        urlPattern: /resy\.com/i,
        baseUrl: 'https://resy.com/',
        emoji: '🥂',
        ctaTemplate: '🍽️ Réservez votre table chez {name} sur Resy',
        bioCtaTemplate: '🍽️ Réservez sur Resy 👇',
        missingLinkAlert: "⚠️ Votre lien Resy n'est pas configuré sur Instagram.",
        patterns: ['resy.com'],
      },
    ],
  },
  {
    sectorKey: 'sport',
    sectorLabel: 'Sport / Loisirs',
    platforms: [
      {
        id: 'mindbody',
        name: 'Mindbody',
        urlPattern: /mindbody\.io|mindbodyonline\.com/i,
        baseUrl: 'https://www.mindbodyonline.com/',
        emoji: '🧘',
        ctaTemplate: '💪 Prêt(e) à dépasser vos limites ? Inscrivez-vous au prochain cours chez {name} sur Mindbody 🧘',
        bioCtaTemplate: '🧘 Inscrivez-vous sur Mindbody 👇',
        missingLinkAlert: "⚠️ Votre lien Mindbody n'est pas dans votre bio Instagram. Vos abonnés ne peuvent pas s'inscrire directement.",
        patterns: ['mindbody.io', 'mindbodyonline.com'],
      },
      {
        id: 'gymlib',
        name: 'Gymlib',
        urlPattern: /gymlib\.com/i,
        baseUrl: 'https://www.gymlib.com/',
        emoji: '💪',
        ctaTemplate: '💪 Réservez votre séance chez {name} sur Gymlib',
        bioCtaTemplate: '💪 Réservez sur Gymlib 👇',
        missingLinkAlert: "⚠️ Votre lien Gymlib n'est pas sur Instagram.",
        patterns: ['gymlib.com'],
      },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Get all platforms as a flat list */
export function getAllPlatforms(): BookingPlatform[] {
  return BOOKING_PLATFORMS_BY_SECTOR.flatMap(s => s.platforms);
}

/**
 * Detect which booking platform is used from a URL.
 * Returns null if no match.
 */
export function detectPlatformFromUrl(url: string): BookingPlatform | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  return getAllPlatforms().find(p =>
    p.patterns.some(pattern => lower.includes(pattern))
  ) ?? null;
}

/**
 * Get platforms relevant for a given sector/activity.
 */
export function getPlatformsForSector(activity: string): SectorPlatforms | null {
  const a = activity.toLowerCase();
  if (/beaute|beauté|coiff|esth|spa|bien.?etre|bien.?être|sante|santé|médecin|medecin|pharmac|dentiste|opticien|kiné|kine/.test(a)) {
    return BOOKING_PLATFORMS_BY_SECTOR.find(s => s.sectorKey === 'beaute') ?? null;
  }
  if (/restau|brasserie|bistro|café|cafe|pizza|sushi|burger|traiteur|boulang|pâtiss|patiss/.test(a)) {
    return BOOKING_PLATFORMS_BY_SECTOR.find(s => s.sectorKey === 'restauration') ?? null;
  }
  if (/sport|salle|fitness|yoga|pilates|crossfit|musculation|loisir/.test(a)) {
    return BOOKING_PLATFORMS_BY_SECTOR.find(s => s.sectorKey === 'sport') ?? null;
  }
  return null;
}

/**
 * Build a smart CTA string for a platform, replacing {name} with business name.
 */
export function getSmartCTA(platform: BookingPlatform, businessName: string): string {
  return platform.ctaTemplate.replace('{name}', businessName);
}
