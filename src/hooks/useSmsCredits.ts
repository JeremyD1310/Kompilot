/**
 * useSmsCredits — hook to read/write SMS credits for the current user.
 * Grants the welcome pack of 50 SMS on first call if not already done.
 */
import { useState, useEffect, useCallback } from 'react';
import { blink } from '../blink/client';
import { backendFetch } from '../lib/backend';
import { useAuth } from './useAuth';

export interface SmsCreditsState {
  balance: number;
  totalUsed: number;
  planMonthlyQuota: number;
  loading: boolean;
  /** Consume n credits. Returns true if sufficient balance, false if empty. */
  consume: (n?: number) => Promise<boolean>;
  /** Reload balance from DB */
  refresh: () => Promise<void>;
  history?: Array<{ id: string; amount: number; action: string; createdAt: string }>;
}

export function useSmsCredits(): SmsCreditsState {
  const { user } = useAuth();
  // Never display a fabricated welcome balance while the canonical endpoint loads.
  const [balance, setBalance] = useState(0);
  const [totalUsed, setTotalUsed] = useState(0);
  const [planMonthlyQuota, setPlanMonthlyQuota] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadCredits = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const token = await blink.auth.getValidToken();
      const response = await backendFetch('/api/sms-credits/status', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('SMS credits unavailable');
      const row = await response.json();
      setBalance(Number(row.balance ?? 0));
      setTotalUsed(Number(row.totalUsed ?? 0));
      setPlanMonthlyQuota(Number(row.planMonthlyQuota ?? 0));
    } catch (e) {
      console.warn('[useSmsCredits] load error:', e);
    } finally { setLoading(false); }
  }, [user?.id]);

  const consume = useCallback(async (n = 1): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const token = await blink.auth.getValidToken();
      const response = await backendFetch('/api/sms-credits/consume', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: n }),
      });
      if (!response.ok) return false;
      const row = await response.json();
      setBalance(Number(row.balance ?? 0));
      setTotalUsed(Number(row.totalUsed ?? 0));
      return true;
    } catch (e) {
      console.warn('[useSmsCredits] consume error:', e);
      return false;
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    await loadCredits();
  }, [loadCredits]);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  return { balance, totalUsed, planMonthlyQuota, loading, consume, refresh };
}
