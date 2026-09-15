/**
 * useTrialGate — Checks user trial period and blocks access when expired.
 *
 * - Fetches trial_start / trial_end from the users table via Blink DB
 * - Returns trial status: 'active' | 'expired' | 'subscribed' | 'admin'
 * - Admin emails (TEAM_EMAILS) bypass the trial gate entirely
 * - Used by DashboardLayout to show paywall when trial ends
 */

import { useState, useEffect } from 'react';
import { blink } from '../blink/client';
import { isKompilotTeam } from '../context/AdminContext';
import { IS_DEMO_DOMAIN, isDemoRuntime } from '../lib/demoDomain';

export type TrialStatus = 'loading' | 'active' | 'expired' | 'subscribed' | 'admin' | 'error';

interface TrialGateState {
  status: TrialStatus;
  trialEnd: string | null;
  daysRemaining: number;
}

const TRIAL_DURATION_DAYS = 7;

export function useTrialGate(
  userId?: string | null,
  subscriptionStatus?: string,
  currentPlanId?: string,
  options?: { skip?: boolean },
): TrialGateState {
  const demoRuntime = isDemoRuntime();
  const skip = options?.skip ?? false;
  const [state, setState] = useState<TrialGateState>({
    status: demoRuntime ? 'subscribed' : 'loading',
    trialEnd: null,
    daysRemaining: demoRuntime ? 999 : 0,
  });

  // Demo routes are local-only: always subscribed and never query users.
  useEffect(() => {
    if (skip) {
      setState({ status: 'subscribed', trialEnd: null, daysRemaining: Infinity });
      return;
    }
    if (isDemoRuntime()) {
      setState({ status: 'subscribed', trialEnd: null, daysRemaining: 999 });
      return;
    }
    if (!userId) {
      setState({ status: 'loading', trialEnd: null, daysRemaining: 0 });
      return;
    }

    let cancelled = false;

    async function checkTrial() {
      try {
        const rows = await blink.db.table<{ id: string; email: string; role: string; trialStart: string | null; trialEnd: string | null; isBlocked: string }>('users').list({
          where: { id: userId! },
          limit: 1,
        });

        if (cancelled) return;

        const user = rows[0];
        if (!user) {
          // User not in DB yet — initialize trial
          const now = new Date();
          const trialEnd = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
          await blink.db.table('users').upsert({
            id: userId!,
            trialStart: now.toISOString(),
            trialEnd: trialEnd.toISOString(),
          });
          setState({
            status: 'active',
            trialEnd: trialEnd.toISOString(),
            daysRemaining: TRIAL_DURATION_DAYS,
          });
          return;
        }

        // Admin bypass
        if (user.role === 'admin' || isKompilotTeam(user.email)) {
          setState({ status: 'admin', trialEnd: null, daysRemaining: Infinity });
          return;
        }

        // Active subscription bypass
        if (
          subscriptionStatus === 'active' ||
          currentPlanId === 'starter' ||
          currentPlanId === 'agency' ||
          currentPlanId === 'pro' ||
          currentPlanId === 'expert'
        ) {
          setState({ status: 'subscribed', trialEnd: null, daysRemaining: Infinity });
          return;
        }

        // Blocked user
        if (Number(user.isBlocked) > 0) {
          setState({ status: 'expired', trialEnd: user.trialEnd, daysRemaining: 0 });
          return;
        }

        // Check trial dates
        if (!user.trialStart || !user.trialEnd) {
          const now = new Date();
          const trialEnd = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
          await blink.db.table('users').update(userId!, {
            trialStart: now.toISOString(),
            trialEnd: trialEnd.toISOString(),
          });
          setState({
            status: 'active',
            trialEnd: trialEnd.toISOString(),
            daysRemaining: TRIAL_DURATION_DAYS,
          });
          return;
        }

        const now = new Date();
        const endDate = new Date(user.trialEnd);
        const diffMs = endDate.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));

        if (diffMs <= 0) {
          setState({
            status: 'expired',
            trialEnd: user.trialEnd,
            daysRemaining: 0,
          });
        } else {
          setState({
            status: 'active',
            trialEnd: user.trialEnd,
            daysRemaining,
          });
        }
      } catch (err) {
        console.warn('[useTrialGate] Check failed:', err);
        if (!cancelled) {
          setState({ status: 'error', trialEnd: null, daysRemaining: 0 });
        }
      }
    }

    checkTrial();
    return () => { cancelled = true; };
  }, [userId, subscriptionStatus, currentPlanId, skip]);

  return state;
}
