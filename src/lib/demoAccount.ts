/**
 * demoAccount.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for the demo bypass account.
 *
 * When test@kompilot.com / 123Netcopilot is entered at login:
 *  • No Blink Auth API call is made.
 *  • A synthetic BlinkUser-compatible object is injected into useAuth state.
 *  • activateDemo() + activateSwitcher() are called so both the demo banner
 *    and the Pro/Agency toggle appear immediately.
 *  • The user is redirected to /dashboard (Pro view by default).
 *
 * All demo data in this file is purely local — zero API calls.
 */

// ── Credentials ───────────────────────────────────────────────────────────────
export const DEMO_EMAIL    = 'test@kompilot.com';
export const DEMO_PASSWORD = '123Netcopilot';

/** Returns true when email matches and password matches case-insensitively */
export function isDemoCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === DEMO_EMAIL &&
    password.toLowerCase() === DEMO_PASSWORD.toLowerCase()
  );
}

// ── Storage key ───────────────────────────────────────────────────────────────
export const DEMO_SESSION_KEY = 'kompilot_demo_session_v1';

/** Fake BlinkUser-compatible profile for the demo account */
export const DEMO_USER = {
  id:             'demo-user-kompilot-test',
  email:          DEMO_EMAIL,
  displayName:    'Compte Démo',
  emailVerified:  true,
  role:           'admin',
  metadata: {
    plan:         'expert',
    isDemo:       true,
    agencyMode:   true,
  },
  createdAt:      '2024-01-01T00:00:00.000Z',
  updatedAt:      new Date().toISOString(),
  lastSignIn:     new Date().toISOString(),
};

export type DemoUser = typeof DEMO_USER;

/** Persist + read demo session from localStorage */
export function saveDemoSession(): void {
  try {
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({
      user: DEMO_USER,
      savedAt: Date.now(),
    }));
  } catch { /* noop */ }
}

export function readDemoSession(): DemoUser | null {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { user: DemoUser; savedAt: number };
    // Expire after 12 hours
    if (Date.now() - parsed.savedAt > 12 * 60 * 60 * 1000) {
      clearDemoSession();
      return null;
    }
    return parsed.user;
  } catch { return null; }
}

export function clearDemoSession(): void {
  try { localStorage.removeItem(DEMO_SESSION_KEY); } catch { /* noop */ }
}

// ── Rich demo data ─────────────────────────────────────────────────────────────

export const DEMO_GEO_SCORE = {
  overall: 78,
  trend: +14,
  breakdown: {
    googleFiche: 88,
    citations:   71,
    avis:        82,
    contenu:     65,
  },
};

export const DEMO_KPI = {
  reach:            4_350,
  reachChange:      24,
  views:            12_800,
  viewsChange:      31,
  engagement:       6.8,
  engagementChange: 12,
  posts:            7,
  postsChange:      40,
};

export const DEMO_REVIEWS = [
  {
    id: 'dr1',
    author: 'Thomas R.',
    rating: 5,
    text: 'Service impeccable et équipe très réactive ! Je recommande vivement à toutes les petites entreprises qui veulent booster leur présence en ligne.',
    date: 'Il y a 2 jours',
    source: 'google' as const,
    replied: false,
  },
  {
    id: 'dr2',
    author: 'Camille B.',
    rating: 4,
    text: "Très bon outil dans l'ensemble. L'interface est intuitive et les résultats sont au rendez-vous.",
    date: 'Il y a 5 jours',
    source: 'google' as const,
    replied: false,
  },
  {
    id: 'dr3',
    author: 'Julien M.',
    rating: 5,
    text: 'Grâce à Kompilot, notre fiche Google est passée de 3,8 à 4,6 étoiles en 3 mois. Incroyable !',
    date: 'Il y a 8 jours',
    source: 'google' as const,
    replied: true,
  },
  {
    id: 'dr4',
    author: 'Sophie L.',
    rating: 3,
    text: 'Bon produit mais l\'onboarding pourrait être un peu plus guidé. L\'équipe support a été très réactive.',
    date: 'Il y a 12 jours',
    source: 'google' as const,
    replied: true,
  },
  {
    id: 'dr5',
    author: 'Marc D.',
    rating: 5,
    text: 'Le meilleur investissement de l\'année pour notre restaurant. On gère tout depuis un seul tableau de bord.',
    date: 'Il y a 15 jours',
    source: 'google' as const,
    replied: false,
  },
];

export const DEMO_AGENCY_CLIENTS = [
  { id: 'ac1', name: 'Le Petit Bistro',        type: 'Restaurant',    city: 'La Rochelle', geoScore: 84, trend: +14, reviewsUnread: 3,  status: 'alert' as const, emoji: '🍽️', credits: 28,         plan: 'Pro'    },
  { id: 'ac2', name: 'Studio Beauté Léa',      type: 'Coiffure',      city: 'Bordeaux',    geoScore: 71, trend: +6,  reviewsUnread: 0,  status: 'ok'    as const, emoji: '💇‍♀️', credits: 12,        plan: 'Pro'    },
  { id: 'ac3', name: 'Garage Martin',          type: 'Automobile',    city: 'Nantes',      geoScore: 58, trend: -3,  reviewsUnread: 1,  status: 'alert' as const, emoji: '🔧', credits: 3,          plan: 'Free'   },
  { id: 'ac4', name: 'Pharmacie du Centre',    type: 'Pharmacie',     city: 'Lyon',        geoScore: 92, trend: +8,  reviewsUnread: 0,  status: 'ok'    as const, emoji: '💊', credits: 'illimité', plan: 'Expert' },
  { id: 'ac5', name: 'Cabinet Dentaire Moreau',type: 'Santé',         city: 'Paris 11e',   geoScore: 77, trend: +2,  reviewsUnread: 2,  status: 'alert' as const, emoji: '🦷', credits: 19,         plan: 'Pro'    },
  { id: 'ac6', name: 'Boulangerie Du Soleil',  type: 'Boulangerie',   city: 'Marseille',   geoScore: 89, trend: +19, reviewsUnread: 0,  status: 'ok'    as const, emoji: '🥐', credits: 30,         plan: 'Pro'    },
];

export const DEMO_AUDIENCE_CHART = [
  { month: 'Jan', reach: 2100, engagement: 4.1 },
  { month: 'Fév', reach: 2450, engagement: 4.8 },
  { month: 'Mar', reach: 2900, engagement: 5.2 },
  { month: 'Avr', reach: 3200, engagement: 5.9 },
  { month: 'Mai', reach: 3800, engagement: 6.3 },
  { month: 'Juin', reach: 4350, engagement: 6.8 },
];

export const DEMO_CREDITS = {
  total:     500,
  used:      347,
  remaining: 153,
  plan:      'Expert',
};
