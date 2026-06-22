/**
 * EstablishmentContext
 *
 * Source of truth for the active establishment.
 * Data priority: DB rows → localStorage snapshot → DEFAULT demo data.
 * Switching establishments instantly refreshes all widgets consuming
 * activeEstablishment (KPIs, GeoGrid, inbox stats…).
 */
import React, {
  createContext, useContext, useState, useEffect, useCallback, useMemo,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSubscription } from './SubscriptionContext';
import { useAuth } from '../hooks/useAuth';
import { useDemoMode } from './DemoModeContext';
import { blink } from '../blink/client';

// ── Establishment interface ────────────────────────────────────────────────────

export interface Establishment {
  id: string;
  name: string;
  shortName: string;
  address: string;
  category: string;
  avatar: string;          // 2-letter initials
  color: string;           // Tailwind gradient class
  bookingUrl?: string;
  siret?: string;
  tvaIntra?: string;
  billingAddress?: string;
  kpi: {
    reach: number; reachChange: number;
    views: number; viewsChange: number;
    engagement: number; engagementChange: number;
    posts: number;
  };
  pendingReviews: number;
  pendingMessages: number;
  isLocked?: boolean;
}

interface EstablishmentContextType {
  establishments: Establishment[];
  activeEstablishment: Establishment;
  setActiveEstablishment: (id: string) => void;
  isSwitching: boolean;
  addEstablishment: (e: Establishment) => void;
  updateEstablishment: (id: string, patch: Partial<Establishment>) => void;
  isUnlocked: (id: string) => boolean;
  isLoadingFromDB: boolean;
}

// ── Demo fallback (shown when DB has no establishments yet) ────────────────────

const DEFAULT_ESTABLISHMENTS: Establishment[] = [
  {
    id: 'est-1',
    name: 'La Mie Dorée - Centre-Ville',
    shortName: 'Centre-Ville',
    address: '12 rue du Commerce, 33000 Bordeaux',
    category: 'Restauration',
    avatar: 'LM',
    color: 'from-orange-500 to-amber-400',
    bookingUrl: 'https://planity.com/la-mie-doree',
    kpi: { reach: 4350, reachChange: 24, views: 12800, viewsChange: 31, engagement: 6.8, engagementChange: 12, posts: 7 },
    pendingReviews: 2,
    pendingMessages: 3,
  },
  {
    id: 'est-2',
    name: 'La Mie Dorée - Gare',
    shortName: 'Gare',
    address: '5 Place de la Gare, 33000 Bordeaux',
    category: 'Restauration',
    avatar: 'LG',
    color: 'from-rose-500 to-pink-400',
    kpi: { reach: 1820, reachChange: 8, views: 5400, viewsChange: 15, engagement: 4.2, engagementChange: -3, posts: 3 },
    pendingReviews: 5,
    pendingMessages: 1,
    isLocked: true,
  },
];

// ── Gradient palette ────────────────────────────────────────────────────────────

const GRADIENT_COLORS = [
  'from-primary to-teal-400',
  'from-rose-500 to-pink-400',
  'from-violet-500 to-purple-400',
  'from-blue-500 to-cyan-400',
  'from-orange-500 to-amber-400',
  'from-emerald-500 to-green-400',
  'from-indigo-500 to-blue-400',
  'from-yellow-500 to-orange-400',
];

// ── Deterministic hash → stable KPI values per establishment ID ────────────────

function stableHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

// ── Map DB row → context Establishment ────────────────────────────────────────

function mapDbRow(row: any, index: number): Establishment {
  const h = stableHash(row.id || row.name || String(index));
  const rawName = String(row.name || 'Établissement');
  const words = rawName.trim().split(/\s+/).filter(Boolean);
  const initials = words.length >= 2
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : (words[0]?.substring(0, 2) ?? 'ET').toUpperCase();
  const shortName = rawName.length <= 18
    ? rawName
    : (words[0]?.substring(0, 16) ?? rawName.substring(0, 16));

  return {
    id: row.id,
    name: rawName,
    shortName,
    address: String(row.city || ''),
    category: String(row.activity || 'Commerce'),
    avatar: initials,
    color: GRADIENT_COLORS[index % GRADIENT_COLORS.length],
    bookingUrl: row.bookingUrl ?? row.booking_url ?? undefined,
    siret: row.siret ?? undefined,
    kpi: {
      reach:          1000 + (h % 5000),
      reachChange:    ((h >> 3) % 40) - 5,
      views:          3000 + ((h >> 1) % 15000),
      viewsChange:    ((h >> 5) % 35) - 3,
      engagement:     parseFloat((((h >> 7) % 50) / 10 + 2).toFixed(1)),
      engagementChange: ((h >> 9) % 25) - 5,
      posts:          3 + (h % 12),
    },
    pendingReviews:  (h >> 11) % 5,
    pendingMessages: (h >> 13) % 4,
  };
}

// ── Context setup ──────────────────────────────────────────────────────────────

const EstablishmentContext = createContext<EstablishmentContextType | undefined>(undefined);

export const EstablishmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentPlan } = useSubscription();
  const { user } = useAuth();
  const { isDemoActive } = useDemoMode();
  const queryClient = useQueryClient();

  // ── 1. Load real establishments from DB ──────────────────────────────────

  const { data: dbRows = [], isLoading: isLoadingFromDB } = useQuery({
    queryKey: ['establishments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const rows = await (blink.db as any).establishments.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      });
      return rows as any[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const dbEstablishments = useMemo<Establishment[]>(() => {
    if (!dbRows || dbRows.length === 0) return [];
    return dbRows.map((row: any, i: number) => mapDbRow(row, i));
  }, [dbRows]);

  // ── 2. Local/fallback establishments ─────────────────────────────────────

  const [localEstablishments, setLocalEstablishments] = useState<Establishment[]>(() => {
    try {
      const raw = localStorage.getItem('kompilot_establishments');
      return raw ? JSON.parse(raw) : DEFAULT_ESTABLISHMENTS;
    } catch {
      return DEFAULT_ESTABLISHMENTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kompilot_establishments', JSON.stringify(localEstablishments));
    } catch { /* noop */ }
  }, [localEstablishments]);

  // ── 3. Merged list: DB takes priority ────────────────────────────────────

  const establishments: Establishment[] =
    dbEstablishments.length > 0 ? dbEstablishments : localEstablishments;

  // ── 4. Active ID ─────────────────────────────────────────────────────────

  const [activeId, setActiveId] = useState<string>(() => {
    return localStorage.getItem('kompilot_active_establishment') || DEFAULT_ESTABLISHMENTS[0].id;
  });

  const [isSwitching, setIsSwitching] = useState(false);

  // Reset when list changes and stored ID no longer exists
  useEffect(() => {
    if (establishments.length > 0 && !establishments.find(e => e.id === activeId)) {
      setActiveId(establishments[0].id);
    }
  }, [establishments]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      localStorage.setItem('kompilot_active_establishment', activeId);
    } catch { /* noop */ }
  }, [activeId]);

  const activeEstablishment: Establishment =
    establishments.find(e => e.id === activeId) ?? establishments[0] ?? DEFAULT_ESTABLISHMENTS[0];

  // ── 5. Actions ────────────────────────────────────────────────────────────

  const isUnlocked = useCallback((id: string) => {
    const est = establishments.find(e => e.id === id);
    if (!est) return false;
    // Demo mode unlocks all establishments for full presentation access
    if (isDemoActive) return true;
    if (est.isLocked && currentPlan.id !== 'expert') return false;
    return true;
  }, [establishments, currentPlan, isDemoActive]);

  const switchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const setActiveEstablishment = useCallback((id: string) => {
    if (id === activeId) return;
    // Cancel any in-flight switch before starting a new one
    if (switchTimeoutRef.current !== null) {
      clearTimeout(switchTimeoutRef.current);
      switchTimeoutRef.current = null;
    }
    setIsSwitching(true);
    switchTimeoutRef.current = setTimeout(() => {
      setActiveId(id);
      setIsSwitching(false);
      switchTimeoutRef.current = null;
    }, 400);
  }, [activeId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current !== null) {
        clearTimeout(switchTimeoutRef.current);
      }
    };
  }, []);

  const addEstablishment = useCallback((e: Establishment) => {
    setLocalEstablishments(prev => [...prev, e]);
    if (user?.id) {
      (blink.db as any).establishments.create({
        id: e.id,
        userId: user.id,
        name: e.name,
        activity: e.category,
        city: e.address,
        bookingUrl: e.bookingUrl ?? null,
        siret: e.siret ?? null,
        aiCreditsUsed: 0,
        aiCreditsLimit: 50,
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['establishments', user.id] });
      }).catch(() => { /* graceful */ });
    }
  }, [user, queryClient]);

  const updateEstablishment = useCallback((id: string, patch: Partial<Establishment>) => {
    setLocalEstablishments(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['establishments', user.id] });
    }
  }, [user, queryClient]);

  const contextValue = useMemo(() => ({
    establishments,
    activeEstablishment,
    setActiveEstablishment,
    isSwitching,
    addEstablishment,
    updateEstablishment,
    isUnlocked,
    isLoadingFromDB,
  }), [establishments, activeEstablishment, setActiveEstablishment, isSwitching, addEstablishment, updateEstablishment, isUnlocked, isLoadingFromDB]);

  return (
    <EstablishmentContext.Provider value={contextValue}>
      {children}
    </EstablishmentContext.Provider>
  );
};

export const useEstablishment = () => {
  const context = useContext(EstablishmentContext);
  if (context === undefined) {
    console.warn('useEstablishment must be used within an EstablishmentProvider — returning safe fallback');
    return {} as any;
  }
  return context;
};