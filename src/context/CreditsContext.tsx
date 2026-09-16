import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { blink } from '../blink/client';
import { useDemoMode, DEMO_CREDIT_TOTAL } from './DemoModeContext';
import { consumeContentQuotaClient, releaseContentQuotaClient } from '../lib/contentQuotaClient';
import { fetchCreditBalance, fetchCreditHistory, type CreditHistoryEntry } from '../lib/billingClient';

export type CreditsValue = number;

interface CreditsContextValue {
  usage: number;
  limit: number;
  canCreate: boolean;
  increment: () => Promise<boolean>;
  deductCredits: (n: number, action?: string) => Promise<boolean>;
  hasEnoughCredits: (n: number) => boolean;
  releaseCredits: (n?: number) => Promise<void>;
  credits: CreditsValue;
  history: CreditHistoryEntry[];
  deductCredit: () => Promise<boolean>;
  addCredits: (n: number) => void;
  isEmpty: boolean;
  refresh: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { isDemoActive, demoCreditsUsed, consumeDemoCredits } = useDemoMode();
  const [balance, setBalance] = useState<number | null>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const [usage, setUsage] = useState<number | null>(null);
  const [history, setHistory] = useState<CreditHistoryEntry[]>([]);

  const refresh = async () => {
    if (isDemoActive || !blink.auth.isAuthenticated()) return;
    try {
      const [current, entries] = await Promise.all([fetchCreditBalance(), fetchCreditHistory()]);
      setBalance(current.balance);
      setLimit(current.monthlyLimit ?? current.monthlyIncluded ?? current.balance);
      setUsage(current.monthlyUsed ?? 0);
      setHistory(entries);
    } catch {
      setBalance(null);
      setLimit(null);
      setUsage(null);
    }
  };

  useEffect(() => { refresh(); }, [isDemoActive]);

  const demoLimit = isDemoActive ? DEMO_CREDIT_TOTAL : 0;
  const effectiveUsage = isDemoActive ? demoCreditsUsed : (usage ?? 0);
  const effectiveLimit = isDemoActive ? demoLimit : (limit ?? 0);
  const effectiveBalance = isDemoActive ? Math.max(0, demoLimit - demoCreditsUsed) : (balance ?? 0);
  const canCreate = isDemoActive ? effectiveBalance > 0 : balance !== null && effectiveBalance > 0;

  const increment = async () => {
    if (isDemoActive) return consumeDemoCredits(1);
    try { await consumeContentQuotaClient('content_generation', 1); await refresh(); return true; } catch { return false; }
  };
  const deductCredits = async (n: number, action = 'content_generation') => {
    if (isDemoActive) return consumeDemoCredits(n);
    try { await consumeContentQuotaClient(action, n); await refresh(); return true; } catch { return false; }
  };
  const releaseCredits = async (n = 1) => { if (!isDemoActive) { await releaseContentQuotaClient(n); await refresh(); } };
  const hasEnoughCredits = (n: number) => isDemoActive ? effectiveBalance >= n : balance !== null && effectiveBalance >= n;
  const addCredits = (_n: number) => { /* backend webhook owns purchases */ };

  return <CreditsContext.Provider value={{
    usage: effectiveUsage,
    limit: effectiveLimit,
    canCreate,
    increment,
    deductCredits,
    hasEnoughCredits,
    releaseCredits,
    credits: effectiveBalance,
    history,
    deductCredit: increment,
    addCredits,
    isEmpty: balance !== null ? effectiveBalance <= 0 : !isDemoActive,
    refresh,
  }}>{children}</CreditsContext.Provider>;
}

export function useCredits() {
  const ctx = useContext(CreditsContext);
  if (!ctx) throw new Error('useCredits must be used within CreditsProvider');
  return ctx;
}