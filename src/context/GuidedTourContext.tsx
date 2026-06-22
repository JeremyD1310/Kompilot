import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { blink } from '../blink/client';

const TOUR_STORAGE_KEY = 'kompilot_tour_completed';
export const TOUR_PENDING_KEY = 'kompilot_welcome_tour_pending';
const TOUR_PROGRESS_KEY = 'kompilot_tour_progress_v1';

export type TourStep = {
  id: string;
  target: string;
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: string;
  nextLabel?: string;
  route?: string;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome-cockpit',
    target: 'center',
    title: 'Voici votre espace de commandement.',
    description: 'Pas de tableaux complexes, pas de métriques inutiles. Juste l\'essentiel pour piloter votre rentabilité : le chiffre d\'affaires sécurisé, les alertes financières actives, et les actions qui génèrent des euros réels. Votre moteur de croissance est prêt.',
    placement: 'center',
    icon: '💰',
    nextLabel: 'Découvrir le radar G.E.O. →',
    route: '/dashboard',
  },
  {
    id: 'geo-radar-maps',
    target: '[data-tour="nav-google-maps"]',
    title: 'Étape 1 — Où dort votre argent actuellement ?',
    description: 'Liez votre fiche Google Business Profile. L\'IA scanne votre visibilité sur ChatGPT, Gemini et Perplexity et mesure la part de votre clientèle locale capturée par vos concurrents en ce moment même. Cette étape révèle votre perte de CA estimée.',
    placement: 'right',
    icon: '🎯',
    nextLabel: 'Mesurer mes pertes actuelles →',
    route: '/google-maps',
  },
  {
    id: 'cockpit-vocal',
    target: '[data-tour="cockpit-creation"]',
    title: 'Étape 2 — Vos abonnés achètent-ils chez vous ?',
    description: 'Testez le Cockpit IA. Cliquez sur le micro, dites "offre spéciale ce week-end" et regardez l\'IA transformer votre idée en post optimisé, calibré pour déclencher une visite — pas seulement un like.',
    placement: 'left',
    icon: '🎙️',
    nextLabel: 'Déclencher une conversation lucrative →',
    route: '/cockpit',
  },
  {
    id: 'inbox-whatsapp',
    target: '[data-tour="nav-messages"]',
    title: 'Étape 3 — Centralisez chaque euro de chiffre d\'affaires',
    description: 'Activez l\'Inbox Unique. Recevez et répondez à tous vos clients (Google, Meta, WhatsApp) depuis un seul écran. L\'IA rédige les réponses et insère votre lien de réservation automatiquement. Aucune coordonnée ne se perd.',
    placement: 'right',
    icon: '💬',
    nextLabel: 'Activer mon circuit de conversion →',
    route: '/inbox',
  },
  {
    id: 'calendar-editorial',
    target: '[data-tour="nav-calendar"]',
    title: 'Étape 4 — Programmez votre présence sans y penser',
    description: 'Planifiez le post de l\'étape 2 dans votre calendrier. Kompilot le publie au meilleur moment selon vos données sectorielles — et votre communauté interagit pendant que vous travaillez.',
    placement: 'right',
    icon: '📅',
    nextLabel: 'Activer la publication automatique →',
    route: '/calendar',
  },
  {
    id: 'team-collaboration',
    target: '[data-tour="nav-team"]',
    title: 'Étape 5 — Gérez votre équipe depuis un seul endroit',
    description: 'Invitez vos collaborateurs, attribuez des rôles (admin, éditeur, membre) et coordonnez-vous dans le chat d\'équipe intégré. Toutes les actions sont tracées dans le fil d\'activité commun.',
    placement: 'right',
    icon: '👥',
    nextLabel: 'Configurer mon équipe →',
    route: '/team',
  },
  {
    id: 'ai-agents-cowork',
    target: '[data-tour="nav-cowork"]',
    title: 'Étape 6 — Vos agents IA travaillent pendant que vous dormez',
    description: 'Claude Cowork orchestre 3 agents autonomes : Content Factory (sprints éditoriaux), Ad Spy (veille concurrentielle), Auto-Reporter (rapports PDF clients). Disponibles dès votre abonnement actif, avec un système de quota Fair Use transparent.',
    placement: 'right',
    icon: '🤖',
    nextLabel: 'Activer mes agents IA →',
    route: '/agence/cowork',
  },
  {
    id: 'academy-final',
    target: '[data-tour="nav-academy"]',
    title: 'Votre moteur de croissance est déployé. 🚀',
    description: 'Accédez à l\'Academy pour maîtriser les leviers avancés : Google Ads local, campagnes Meta, optimisation de prix. Chaque module est conçu pour augmenter votre CA, pas votre courbe d\'apprentissage.',
    placement: 'right',
    icon: '🎓',
    nextLabel: 'Déployer mon moteur de croissance 🚀',
    route: '/academy',
  },
];

// ── DB progress persistence ───────────────────────────────────────────────────

async function saveTourProgress(userId: string, step: number): Promise<void> {
  try {
    localStorage.setItem(`${TOUR_PROGRESS_KEY}_${userId}`, String(step));
    // Also persist to DB so it survives across devices / browsers
    await blink.db.onboardingProfiles.upsert({
      id: `tour_progress_${userId}`,
      userId,
      sector: `__tour_step__${step}`,
      objective: '__tour_progress__',
    });
  } catch { /* noop */ }
}

async function loadTourProgress(userId: string): Promise<number | null> {
  try {
    const localKey = `${TOUR_PROGRESS_KEY}_${userId}`;
    const local = localStorage.getItem(localKey);
    if (local !== null) return parseInt(local, 10);
    // Fallback to DB
    const rows = await blink.db.onboardingProfiles.list({
      where: { userId, objective: '__tour_progress__' },
      limit: 1,
    });
    const row = rows[0];
    if (!row?.sector?.startsWith('__tour_step__')) return null;
    return parseInt(row.sector.replace('__tour_step__', ''), 10);
  } catch {
    return null;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

type GuidedTourContextType = {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: () => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
};

const GuidedTourContext = createContext<GuidedTourContextType | null>(null);

export function GuidedTourProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Auto-start: new user (pending flag) OR resume in-progress tour
  useEffect(() => {
    if (!user) return;
    const completedKey = `${TOUR_STORAGE_KEY}_${user.id}`;
    const pendingKey = `${TOUR_PENDING_KEY}_${user.id}`;
    const completed = localStorage.getItem(completedKey);
    const pending = localStorage.getItem(pendingKey);

    if (completed) return; // already finished

    if (pending === '1') {
      localStorage.removeItem(pendingKey);
      const timer = setTimeout(() => setIsActive(true), 1500);
      return () => clearTimeout(timer);
    }

    // Resume in-progress tour from last saved step
    loadTourProgress(user.id).then(savedStep => {
      if (savedStep !== null && savedStep > 0 && savedStep < TOUR_STEPS.length) {
        setCurrentStep(savedStep);
        const timer = setTimeout(() => setIsActive(true), 1200);
        // Note: can't return cleanup from .then(), handled by component unmount
      }
    });
  }, [user]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    if (user) saveTourProgress(user.id, 0);
  }, [user]);

  const stopTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    if (user) {
      localStorage.setItem(`${TOUR_STORAGE_KEY}_${user.id}`, '1');
      // Clear in-progress progress since tour is done
      localStorage.removeItem(`${TOUR_PROGRESS_KEY}_${user.id}`);
    }
  }, [user]);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = prev + 1;
      if (next >= TOUR_STEPS.length) {
        setIsActive(false);
        if (user) {
          localStorage.setItem(`${TOUR_STORAGE_KEY}_${user.id}`, '1');
          localStorage.removeItem(`${TOUR_PROGRESS_KEY}_${user.id}`);
        }
        return prev;
      }
      if (user) saveTourProgress(user.id, next);
      return next;
    });
  }, [user]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      const p = Math.max(0, prev - 1);
      if (user) saveTourProgress(user.id, p);
      return p;
    });
  }, [user]);

  const goToStep = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, TOUR_STEPS.length - 1));
    setCurrentStep(clamped);
    if (user) saveTourProgress(user.id, clamped);
  }, [user]);

  return (
    <GuidedTourContext.Provider value={{
      isActive,
      currentStep,
      steps: TOUR_STEPS,
      startTour,
      stopTour,
      nextStep,
      prevStep,
      goToStep,
    }}>
      {children}
    </GuidedTourContext.Provider>
  );
}

export function useGuidedTour() {
  const ctx = useContext(GuidedTourContext);
  if (!ctx) { console.warn('useGuidedTour must be used within GuidedTourProvider' + ' — context missing, returning safe fallback'); return {} as any; }
  return ctx;
}
