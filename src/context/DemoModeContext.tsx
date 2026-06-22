import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// ── Demo data types ────────────────────────────────────────────────────────────

export interface DemoPost {
  id: string;
  title: string;
  status: 'Publié' | 'Planifié' | 'Brouillon';
  date: string;
  platform: string;
  scheduledAt?: Date;
}

export interface DemoKPI {
  reach: number;
  reachChange: number;    // %
  views: number;
  viewsChange: number;    // %
  engagement: number;
  engagementChange: number;
  posts: number;
  postsChange: number;
}

export interface DemoMessage {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  channel: 'instagram' | 'linkedin' | 'website';
  isRead: boolean;
  date: string;
}

export interface DemoReview {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  source: 'google';
  replied: boolean;
}

export interface DemoData {
  kpi: DemoKPI;
  posts: DemoPost[];
  messages: DemoMessage[];
  reviews: DemoReview[];
}

// ── Rich demo dataset ──────────────────────────────────────────────────────────

const DEMO_DATA: DemoData = {
  kpi: {
    reach: 4350,
    reachChange: 24,
    views: 12800,
    viewsChange: 31,
    engagement: 6.8,
    engagementChange: 12,
    posts: 7,
    postsChange: 40,
  },
  posts: [
    {
      id: 'd1',
      title: '🍕 Plat du jour : Tajine d\'agneau confit',
      status: 'Publié',
      date: '22 mai 2026',
      platform: 'Instagram',
    },
    {
      id: 'd2',
      title: '🏡 Nouvelle propriété disponible à Bordeaux',
      status: 'Publié',
      date: '20 mai 2026',
      platform: 'Facebook',
    },
    {
      id: 'd3',
      title: '✨ Soldes printemps — jusqu\'à -40%',
      status: 'Publié',
      date: '18 mai 2026',
      platform: 'LinkedIn',
    },
    {
      id: 'd4',
      title: '🎉 Anniversaire de notre établissement — 5 ans !',
      status: 'Publié',
      date: '15 mai 2026',
      platform: 'Instagram',
    },
    {
      id: 'd5',
      title: '💬 Témoignage client de la semaine',
      status: 'Publié',
      date: '12 mai 2026',
      platform: 'Facebook',
    },
    {
      id: 'd6',
      title: '📅 Atelier découverte ce samedi — Places limitées',
      status: 'Planifié',
      date: '29 mai 2026',
      platform: 'Instagram',
    },
    {
      id: 'd7',
      title: '🌟 Offre partenaire exclusive — Été 2026',
      status: 'Planifié',
      date: '3 juin 2026',
      platform: 'LinkedIn',
    },
  ],
  messages: [
    {
      id: 'm1',
      sender: 'Sophie Marchand',
      subject: 'Demande de collaboration créative',
      preview: 'Bonjour ! Je suis créatrice de contenu et j\'adorerais collaborer avec vous sur un projet...',
      channel: 'instagram',
      isRead: false,
      date: 'Aujourd\'hui, 09:14',
    },
    {
      id: 'm2',
      sender: 'Arnaud Petit',
      subject: 'Informations sur vos offres Pro',
      preview: 'Bonjour, je gère une startup de 5 personnes et nous cherchons à centraliser notre présence...',
      channel: 'website',
      isRead: false,
      date: 'Aujourd\'hui, 11:32',
    },
    {
      id: 'm3',
      sender: 'Marie Lefebvre',
      subject: 'Retour sur votre dernier post LinkedIn',
      preview: 'Votre publication sur les tendances digitales était vraiment très pertinente ! J\'aimerais...',
      channel: 'linkedin',
      isRead: true,
      date: 'Hier, 16:55',
    },
  ],
  reviews: [
    {
      id: 'r1',
      author: 'Thomas R.',
      rating: 5,
      text: 'Service impeccable et équipe très réactive ! Je recommande vivement à toutes les petites entreprises qui veulent booster leur présence en ligne.',
      date: 'Il y a 2 jours',
      source: 'google',
      replied: false,
    },
    {
      id: 'r2',
      author: 'Camille B.',
      rating: 4,
      text: 'Très bon outil dans l\'ensemble. L\'interface est intuitive et les résultats sont au rendez-vous. Quelques petites améliorations à apporter mais rien de bloquant.',
      date: 'Il y a 5 jours',
      source: 'google',
      replied: false,
    },
  ],
};

// ── Context ────────────────────────────────────────────────────────────────────

const DEMO_TRIAL_DAYS = 14;       // How long the demo trial lasts
export const DEMO_CREDIT_TOTAL = 50; // Max AI credits during demo
// Demo active flag uses sessionStorage so it resets each page reload (anonymous visitor gets clean state)
const DEMO_STORAGE_KEY = 'kompilot_demo_active_session'; // session-scoped
const DEMO_START_KEY   = 'kompilot_demo_start_v1';
const DEMO_CREDITS_KEY = 'kompilot_demo_credits_v1';

function readDemoCreditsUsed(): number {
  try {
    const raw = localStorage.getItem(DEMO_CREDITS_KEY);
    return raw ? Math.min(Number(raw), DEMO_CREDIT_TOTAL) : 0;
  } catch { return 0; }
}

function saveDemoCreditsUsed(n: number): void {
  try { localStorage.setItem(DEMO_CREDITS_KEY, String(n)); } catch { /* noop */ }
}

function readOrInitStartDate(): string {
  try {
    const stored = localStorage.getItem(DEMO_START_KEY);
    if (stored) return stored;
    const now = new Date().toISOString();
    localStorage.setItem(DEMO_START_KEY, now);
    return now;
  } catch { return new Date().toISOString(); }
}

export type DemoSector = 'beauty' | 'medical' | 'restaurant' | 'hotel' | 'auto' | 'general';

interface DemoModeContextValue {
  isDemoActive: boolean;
  demoData: DemoData;
  activateDemo: () => void;
  deactivateDemo: () => void;
  // ── Trial countdown ──
  demoTrialDaysRemaining: number;
  demoTrialDaysTotal: number;
  // ── Demo AI credits ──
  demoCreditTotal: number;
  demoCreditsUsed: number;
  demoCreditsRemaining: number;
  isDemoCreditsExhausted: boolean;
  consumeDemoCredits: (n: number) => boolean;
  resetDemoCredits: () => void;
  // ── Demo sector ──
  demoSector: DemoSector;
  setDemoSector: (s: DemoSector) => void;
}

const DemoModeContext = createContext<DemoModeContextValue>({
  isDemoActive: false,
  demoData: DEMO_DATA,
  activateDemo: () => {},
  deactivateDemo: () => {},
  demoTrialDaysRemaining: DEMO_TRIAL_DAYS,
  demoTrialDaysTotal: DEMO_TRIAL_DAYS,
  demoCreditTotal: DEMO_CREDIT_TOTAL,
  demoCreditsUsed: 0,
  demoCreditsRemaining: DEMO_CREDIT_TOTAL,
  isDemoCreditsExhausted: false,
  consumeDemoCredits: () => true,
  resetDemoCredits: () => {},
  demoSector: 'general',
  setDemoSector: () => {},
});

/** Maps onboarding sector string to DemoSector for the LLM widget */
function resolveDemoSectorFromOnboarding(): DemoSector {
  try {
    // Try to read the stored onboarding profile from localStorage
    const keys = Object.keys(localStorage).filter(k => k.startsWith('onboarding_profile_'));
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const profile = JSON.parse(raw) as { sector?: string };
      const s = profile?.sector?.toLowerCase() ?? '';
      if (['beaute', 'beauty', 'coiffure'].includes(s)) return 'beauty';
      if (['medical', 'medecin', 'kine', 'sante'].includes(s)) return 'medical';
      if (['restauration', 'restaurant', 'food'].includes(s)) return 'restaurant';
      if (['hotellerie', 'hotel', 'airbnb', 'conciergerie', 'tourisme'].includes(s)) return 'hotel';
      if (['automobile', 'auto', 'artisan', 'batiment', 'artisanat'].includes(s)) return 'auto';
    }
  } catch { /* noop */ }
  return 'general';
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [demoSector, setDemoSector] = useState<DemoSector>(() => resolveDemoSectorFromOnboarding());

  // Demo active flag — sessionStorage so anonymous visitors always start clean on each page load
  const [isDemoActive, setIsDemoActive] = useState<boolean>(() => {
    try {
      // Use sessionStorage: resets automatically when the tab/session closes
      const stored = sessionStorage.getItem(DEMO_STORAGE_KEY);
      return stored === 'true';
    } catch { return false; }
  });

  // Trial start date (set once on first activation)
  const [startDate] = useState<string>(() => readOrInitStartDate());

  // Demo credits pool
  const [demoCreditsUsed, setDemoCreditsUsed] = useState<number>(() => readDemoCreditsUsed());

  // Compute days remaining
  const [demoTrialDaysRemaining, setDemoTrialDaysRemaining] = useState<number>(() => {
    try {
      const start = new Date(startDate);
      const now = new Date();
      const elapsedDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(0, DEMO_TRIAL_DAYS - elapsedDays);
    } catch { return DEMO_TRIAL_DAYS; }
  });

  // Refresh days remaining daily
  useEffect(() => {
    const tick = () => {
      const start = new Date(startDate);
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      setDemoTrialDaysRemaining(Math.max(0, DEMO_TRIAL_DAYS - elapsed));
    };
    tick();
    const id = setInterval(tick, 60 * 60 * 1000); // re-check hourly
    return () => clearInterval(id);
  }, [startDate]);

  const activateDemo = useCallback(() => {
    setIsDemoActive(true);
    try { sessionStorage.setItem(DEMO_STORAGE_KEY, 'true'); } catch { /* noop */ }
    // Reset credits on re-activation
    setDemoCreditsUsed(0);
    saveDemoCreditsUsed(0);
  }, []);

  const deactivateDemo = useCallback(() => {
    setIsDemoActive(false);
    try { sessionStorage.removeItem(DEMO_STORAGE_KEY); } catch { /* noop */ }
  }, []);

  const consumeDemoCredits = useCallback((n: number): boolean => {
    setDemoCreditsUsed(prev => {
      const remaining = DEMO_CREDIT_TOTAL - prev;
      if (remaining < n) return prev; // not enough — no deduction
      const next = prev + n;
      saveDemoCreditsUsed(next);
      return next;
    });
    // Return whether there were enough credits before deduction
    return (DEMO_CREDIT_TOTAL - demoCreditsUsed) >= n;
  }, [demoCreditsUsed]);

  const resetDemoCredits = useCallback(() => {
    setDemoCreditsUsed(0);
    saveDemoCreditsUsed(0);
  }, []);

  const demoCreditsRemaining = Math.max(0, DEMO_CREDIT_TOTAL - demoCreditsUsed);
  const isDemoCreditsExhausted = isDemoActive && demoCreditsUsed >= DEMO_CREDIT_TOTAL;

  return (
    <DemoModeContext.Provider value={{
      isDemoActive,
      demoData: DEMO_DATA,
      activateDemo,
      deactivateDemo,
      demoTrialDaysRemaining,
      demoTrialDaysTotal: DEMO_TRIAL_DAYS,
      demoCreditTotal: DEMO_CREDIT_TOTAL,
      demoCreditsUsed,
      demoCreditsRemaining,
      isDemoCreditsExhausted,
      consumeDemoCredits,
      resetDemoCredits,
      demoSector,
      setDemoSector,
    }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export const useDemoMode = () => useContext(DemoModeContext);