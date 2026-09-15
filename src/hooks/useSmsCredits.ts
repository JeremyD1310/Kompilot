/**
 * useSmsCredits — hook to read/write SMS credits for the current user.
 * Grants the welcome pack of 50 SMS on first call if not already done.
 */
import { useState, useEffect, useCallback } from 'react';
import { blink } from '../blink/client';
import { useAuth } from './useAuth';

const API_BASE = 'https://gbrhsehk.backend.blink.new';

export interface SmsCreditsState {
  balance: number;
  totalUsed: number;
  planMonthlyQuota: number;
  loading: boolean;
  validationRequired: boolean;
  /** Consume n credits. Returns true if sufficient balance, false if empty. */
  consume: (n?: number) => Promise<boolean>;
  /** Reload balance from DB */
  refresh: () => Promise<void>;
  /** Grant welcome pack (idempotent) */
  grantWelcomePack: () => Promise<void>;
}

export function useSmsCredits(): SmsCreditsState {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [totalUsed, setTotalUsed] = useState(0);
  const [planMonthlyQuota, setPlanMonthlyQuota] = useState(0);
  const [loading, setLoading] = useState(true);
  const [validationRequired, setValidationRequired] = useState(false);

  const request = useCallback(async (path: string, init?: RequestInit) => {
    const token = await blink.auth.getValidToken().catch(() => null);
    if (!token) return null;
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) } });
    const data = await response.json().catch(() => null);
    if (!response.ok) { setValidationRequired(Boolean(data?.validationRequired)); return null; }
    return data;
  }, []);

  const refresh = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    const data = await request('/api/credits/sms/balance');
    if (data) {
      setBalance(Number(data.balance ?? data.remaining ?? 0));
      setTotalUsed(Number(data.totalUsed ?? data.usedThisMonth ?? 0));
      setPlanMonthlyQuota(Number(data.planMonthlyQuota ?? data.monthlyQuota ?? 0));
      setValidationRequired(Boolean(data.validationRequired));
    }
    setLoading(false);
  }, [request, user?.id]);

  const consume = useCallback(async (n = 1) => {
    if (!user?.id || n <= 0) return false;
    const data = await request('/api/credits/sms/consume', { method: 'POST', body: JSON.stringify({ amount: n }) });
    if (!data) return false;
    await refresh();
    return data.success !== false;
  }, [request, refresh, user?.id]);

  // Kept for existing callers; allocation is performed by billing/webhooks, never here.
  const grantWelcomePack = useCallback(async () => { await refresh(); }, [refresh]);

  useEffect(() => { void refresh(); }, [refresh]);
  return { balance, totalUsed, planMonthlyQuota, loading, validationRequired, consume, refresh, grantWelcomePack };
}
