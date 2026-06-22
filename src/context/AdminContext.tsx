import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FakeClient {
  id: string;
  name: string;
  sector: string;
  plan: 'Free' | 'Pro' | 'Expert';
  credits: number | 'illimité';
  email: string;
  phone: string;
  since: string;
  publications: number;
  lastActive: string;
  avatar: string;
  /** Daily credit spend for last 7 days (Mon→Sun) — for admin sparkline chart */
  weeklyCreditsHistory?: number[];
  /** Top action type consuming the most credits */
  topCreditAction?: string;
}

export interface TesterFeedback {
  id: string;
  rating: number;       // 0 = no rating
  comment: string;
  date: string;         // human-readable
  submittedAt: string;  // ISO
}

interface AdminContextValue {
  isAdminMode: boolean;
  enterAdminMode: () => void;
  exitAdminMode: () => void;
  impersonatedClient: FakeClient | null;
  impersonate: (client: FakeClient) => void;
  stopImpersonating: () => void;
  clients: FakeClient[];
  updateClient: (id: string, patch: Partial<FakeClient>) => void;
  feedbacks: TesterFeedback[];
  addFeedback: (fb: TesterFeedback) => void;
  deleteFeedback: (id: string) => void;
}

// ── Fake clients catalogue ────────────────────────────────────────────────────

const INITIAL_CLIENTS: FakeClient[] = [
  {
    id: 'c1', name: 'La Mie Dorée', sector: 'Restauration', plan: 'Pro',
    credits: 28, email: 'contact@lamiedoree.fr', phone: '+33 6 12 34 56 78',
    since: 'Jan 2024', publications: 47, lastActive: 'Il y a 2h',
    avatar: 'LM',
    weeklyCreditsHistory: [12, 25, 8, 30, 15, 22, 18],
    topCreditAction: 'Calendrier en masse (30j)',
  },
  {
    id: 'c2', name: 'Garage du Centre', sector: 'Artisanat', plan: 'Free',
    credits: 3, email: 'garage.centre@gmail.com', phone: '+33 7 23 45 67 89',
    since: 'Fév 2024', publications: 8, lastActive: 'Il y a 6 jours',
    avatar: 'GC',
    weeklyCreditsHistory: [0, 1, 0, 2, 0, 0, 1],
    topCreditAction: 'Génération de post',
  },
  {
    id: 'c3', name: 'ImmoRochelle', sector: 'Immobilier', plan: 'Expert',
    credits: 'illimité' as const, email: 'direction@immorochelle.fr', phone: '+33 5 56 78 90 12',
    since: 'Nov 2023', publications: 134, lastActive: 'Il y a 1h',
    avatar: 'IR',
    weeklyCreditsHistory: [45, 60, 30, 90, 75, 50, 80],
    topCreditAction: 'Scan Radar GEO & GEA',
  },
  {
    id: 'c4', name: 'Beauté Zen Spa', sector: 'Beauté', plan: 'Pro',
    credits: 12, email: 'contact@beautezen.fr', phone: '+33 6 45 67 89 01',
    since: 'Mar 2024', publications: 29, lastActive: 'Hier',
    avatar: 'BZ',
    weeklyCreditsHistory: [5, 10, 8, 12, 6, 15, 9],
    topCreditAction: 'Réponse IA Inbox',
  },
  {
    id: 'c5', name: 'Fit Studio Lyon', sector: 'Sport', plan: 'Free',
    credits: 1, email: 'hello@fitstudio.fr', phone: '+33 7 56 78 90 23',
    since: 'Avr 2024', publications: 5, lastActive: 'Il y a 3 jours',
    avatar: 'FS',
    weeklyCreditsHistory: [0, 0, 1, 0, 0, 1, 0],
    topCreditAction: 'Génération de post',
  },
  {
    id: 'c6', name: 'Cabinet Morin Avocats', sector: 'Conseil', plan: 'Pro',
    credits: 30, email: 'accueil@morin-avocats.fr', phone: '+33 5 67 89 01 34',
    since: 'Déc 2023', publications: 61, lastActive: 'Il y a 4h',
    avatar: 'CM',
    weeklyCreditsHistory: [20, 35, 10, 45, 30, 25, 40],
    topCreditAction: 'Contre-attaque sémantique',
  },
  {
    id: 'c7', name: 'Pizzeria Bella Roma', sector: 'Restauration', plan: 'Free',
    credits: 0, email: 'bellaroma@hotmail.fr', phone: '+33 6 78 90 12 45',
    since: 'Mai 2024', publications: 2, lastActive: 'Il y a 8 jours',
    avatar: 'BR',
  },
  {
    id: 'c8', name: 'Ostéo Bordeaux', sector: 'Santé', plan: 'Pro',
    credits: 19, email: 'rdv@osteo-bordeaux.fr', phone: '+33 5 89 01 23 56',
    since: 'Fév 2024', publications: 38, lastActive: 'Il y a 5h',
    avatar: 'OB',
  },
];

const CLIENTS_KEY    = 'kompilot_admin_clients';
const ADMIN_KEY      = 'kompilot_admin_mode';
const IMPERSONATE_KEY = 'kompilot_impersonating';
const FEEDBACKS_KEY  = 'kompilot_tester_feedbacks';

function loadClients(): FakeClient[] {
  try {
    const raw = localStorage.getItem(CLIENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return INITIAL_CLIENTS;
}

function loadFeedbacks(): TesterFeedback[] {
  try {
    const raw = localStorage.getItem(FEEDBACKS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return [];
}

// ── Context ───────────────────────────────────────────────────────────────────

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdminMode, setIsAdminMode]               = useState(() => localStorage.getItem(ADMIN_KEY) === 'true');
  const [impersonatedClient, setImpersonatedClient] = useState<FakeClient | null>(() => {
    try {
      const raw = localStorage.getItem(IMPERSONATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [clients, setClients]     = useState<FakeClient[]>(loadClients);
  const [feedbacks, setFeedbacks] = useState<TesterFeedback[]>(loadFeedbacks);

  useEffect(() => { localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem(ADMIN_KEY, String(isAdminMode)); }, [isAdminMode]);
  useEffect(() => { localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(feedbacks)); }, [feedbacks]);
  useEffect(() => {
    if (impersonatedClient) localStorage.setItem(IMPERSONATE_KEY, JSON.stringify(impersonatedClient));
    else localStorage.removeItem(IMPERSONATE_KEY);
  }, [impersonatedClient]);

  const enterAdminMode    = () => setIsAdminMode(true);
  const exitAdminMode     = () => { setIsAdminMode(false); setImpersonatedClient(null); };
  const impersonate       = (c: FakeClient) => setImpersonatedClient(c);
  const stopImpersonating = () => setImpersonatedClient(null);

  const updateClient = (id: string, patch: Partial<FakeClient>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    if (impersonatedClient?.id === id) {
      setImpersonatedClient(prev => prev ? { ...prev, ...patch } : null);
    }
  };

  const addFeedback    = (fb: TesterFeedback) => setFeedbacks(prev => [fb, ...prev]);
  const deleteFeedback = (id: string) => setFeedbacks(prev => prev.filter(f => f.id !== id));

  return (
    <AdminContext.Provider value={{
      isAdminMode, enterAdminMode, exitAdminMode,
      impersonatedClient, impersonate, stopImpersonating,
      clients, updateClient,
      feedbacks, addFeedback, deleteFeedback,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) { console.warn('useAdmin must be used within AdminProvider' + ' — context missing, returning safe fallback'); return {} as any; }
  return ctx;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const ADMIN_EMAIL = 'admin@kompilot.com';
