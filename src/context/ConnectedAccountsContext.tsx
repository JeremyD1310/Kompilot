import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type NetworkId = 'linkedin' | 'instagram' | 'facebook' | 'tiktok' | 'google';

export interface ConnectedAccount {
  id: NetworkId;
  connectedAt: string; // ISO timestamp
}

interface ConnectedAccountsContextValue {
  connected: Set<NetworkId>;
  connectAccount: (id: NetworkId) => void;
  disconnectAccount: (id: NetworkId) => void;
  isConnected: (id: NetworkId) => boolean;
  hasAny: boolean;
}

// ── Persistence ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'kompilot_connected_accounts';

function loadFromStorage(): Set<NetworkId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as NetworkId[];
    return new Set(arr);
  } catch { return new Set(); }
}

function saveToStorage(set: Set<NetworkId>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch { /* noop */ }
}

// ── Context ───────────────────────────────────────────────────────────────────

const ConnectedAccountsContext = createContext<ConnectedAccountsContextValue | null>(null);

export function ConnectedAccountsProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState<Set<NetworkId>>(loadFromStorage);

  // Sync to localStorage whenever state changes
  useEffect(() => {
    saveToStorage(connected);
  }, [connected]);

  const connectAccount = (id: NetworkId) => {
    setConnected(prev => new Set([...prev, id]));
  };

  const disconnectAccount = (id: NetworkId) => {
    setConnected(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const isConnected = (id: NetworkId) => connected.has(id);
  const hasAny = connected.size > 0;

  return (
    <ConnectedAccountsContext.Provider value={{
      connected, connectAccount, disconnectAccount, isConnected, hasAny,
    }}>
      {children}
    </ConnectedAccountsContext.Provider>
  );
}

export function useConnectedAccounts() {
  const ctx = useContext(ConnectedAccountsContext);
  if (!ctx) { console.warn('useConnectedAccounts must be used within ConnectedAccountsProvider' + ' — context missing, returning safe fallback'); return {} as any; }
  return ctx;
}

// ── Per-network KPI data (shown after connection) ─────────────────────────────

export interface NetworkKPI {
  value: string;
  subValue: string;
  delta: number;
  deltaLabel: string;
  trend: 'up' | 'down' | 'flat';
  sparkline: number[];
}

export const NETWORK_KPI_DATA: Record<NetworkId, NetworkKPI> = {
  linkedin: {
    value: '1 240',
    subValue: 'vues LinkedIn cette semaine',
    delta: 12,
    deltaLabel: 'vs semaine dernière',
    trend: 'up',
    sparkline: [480, 620, 590, 780, 870, 1050, 1240],
  },
  instagram: {
    value: '3 450',
    subValue: 'abonnés Instagram actifs',
    delta: 5.8,
    deltaLabel: 'taux d\'engagement',
    trend: 'up',
    sparkline: [2800, 2950, 3050, 3150, 3220, 3380, 3450],
  },
  google: {
    value: '4,7 ★',
    subValue: 'note Google Business',
    delta: 3,
    deltaLabel: 'avis en attente de réponse',
    trend: 'up',
    sparkline: [4.2, 4.3, 4.4, 4.5, 4.5, 4.6, 4.7],
  },
  facebook: {
    value: '2 180',
    subValue: 'abonnés Facebook',
    delta: 8,
    deltaLabel: 'vs semaine dernière',
    trend: 'up',
    sparkline: [1800, 1900, 1960, 2020, 2080, 2130, 2180],
  },
  tiktok: {
    value: '8 920',
    subValue: 'vues vidéos TikTok',
    delta: 34.2,
    deltaLabel: 'vs semaine dernière',
    trend: 'up',
    sparkline: [1200, 2100, 3400, 4800, 6100, 7500, 8920],
  },
};
