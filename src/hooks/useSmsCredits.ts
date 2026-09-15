/**
 * useSmsCredits — hook to read/write SMS credits for the current user.
 * Grants the welcome pack of 50 SMS on first call if not already done.
 */
import { useState, useEffect, useCallback } from 'react';
import { blink } from '../blink/client';
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
  /** Grant welcome pack (idempotent) */
  grantWelcomePack: () => Promise<void>;
}

const WELCOME_CREDITS = 50;

export function useSmsCredits(): SmsCreditsState {
  const { user } = useAuth();
  const [balance, setBalance] = useState(WELCOME_CREDITS);
  const [totalUsed, setTotalUsed] = useState(0);
  const [planMonthlyQuota, setPlanMonthlyQuota] = useState(WELCOME_CREDITS);
  const [loading, setLoading] = useState(true);

  const loadCredits = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const rows = await blink.db.smsCredits.list({ where: { userId: user.id }, limit: 1 } as any);
      if (rows && (rows as any[]).length > 0) {
        const row = (rows as any[])[0];
        setBalance(Number(row.balance ?? WELCOME_CREDITS));
        setTotalUsed(Number(row.totalUsed ?? 0));
        setPlanMonthlyQuota(Number(row.planMonthlyQuota ?? WELCOME_CREDITS));
      } else {
        // No row yet — will be created by grantWelcomePack
        setBalance(WELCOME_CREDITS);
        setTotalUsed(0);
        setPlanMonthlyQuota(WELCOME_CREDITS);
      }
    } catch (e) {
      console.warn('[useSmsCredits] load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const grantWelcomePack = useCallback(async () => {
    if (!user?.id) return;
    try {
      const rows = await blink.db.smsCredits.list({ where: { userId: user.id }, limit: 1 } as any);
      if (rows && (rows as any[]).length > 0) {
        const existing = (rows as any[])[0];
        // Already granted
        if (Number(existing.welcomePackGranted) > 0) return;
        // Mark as granted (idempotent)
        await blink.db.smsCredits.update(existing.id, {
          welcomePackGranted: 1,
          balance: WELCOME_CREDITS,
          totalGiven: WELCOME_CREDITS,
          updatedAt: new Date().toISOString(),
        } as any);
        setBalance(WELCOME_CREDITS);
      } else {
        // First time — create row
        const id = `sms_${user.id.slice(0, 8)}_${Date.now()}`;
        await blink.db.smsCredits.create({
          id,
          userId: user.id,
          balance: WELCOME_CREDITS,
          totalUsed: 0,
          totalGiven: WELCOME_CREDITS,
          planMonthlyQuota: WELCOME_CREDITS,
          welcomePackGranted: 1,
          lastRechargeAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any);
        setBalance(WELCOME_CREDITS);
        setTotalUsed(0);
        setPlanMonthlyQuota(WELCOME_CREDITS);
      }
    } catch (e) {
      console.warn('[useSmsCredits] grantWelcomePack error:', e);
    }
  }, [user?.id]);

  const consume = useCallback(async (n = 1): Promise<boolean> => {
    if (!user?.id) return false;
    if (balance <= 0) return false;
    try {
      const rows = await blink.db.smsCredits.list({ where: { userId: user.id }, limit: 1 } as any);
      if (!rows || (rows as any[]).length === 0) return false;
      const row = (rows as any[])[0];
      const current = Number(row.balance ?? 0);
      if (current < n) return false;
      const newBalance = current - n;
      const newUsed = Number(row.totalUsed ?? 0) + n;
      await blink.db.smsCredits.update(row.id, {
        balance: newBalance,
        totalUsed: newUsed,
        updatedAt: new Date().toISOString(),
      } as any);
      setBalance(newBalance);
      setTotalUsed(newUsed);
      return true;
    } catch (e) {
      console.warn('[useSmsCredits] consume error:', e);
      return false;
    }
  }, [user?.id, balance]);

  const refresh = useCallback(async () => {
    await loadCredits();
  }, [loadCredits]);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  return { balance, totalUsed, planMonthlyQuota, loading, consume, refresh, grantWelcomePack };
}
