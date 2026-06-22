/**
 * useWelcomeEmailSequence — fires the welcome email sequence after onboarding.
 *
 * - J0: called once right after onboarding completion (localStorage guard).
 * - J3: called on every app open; backend checks if 3+ days have elapsed.
 *
 * Errors are swallowed silently — never surfaces toasts or blocks the user.
 */
import { useCallback, useEffect } from 'react';
import { blink } from '../blink/client';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

// ── localStorage keys ────────────────────────────────────────────────────────

const j0SentKey  = (userId: string) => `welcome_email_sent_${userId}`;
const j3SentKey  = (userId: string) => `welcome_j3_sent_${userId}`;
const j3CheckKey = (userId: string) => `welcome_j3_last_check_${userId}`;

// ── Shared fetch helper ──────────────────────────────────────────────────────

async function callOnboardingEndpoint(
  path: string,
  token: string,
  body?: Record<string, string>,
): Promise<void> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    await fetch(`${BACKEND_URL}${path}`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body:   body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

// ── Main hook ────────────────────────────────────────────────────────────────

export interface WelcomeEmailTriggerParams {
  userId: string;
  sector: string;
  objective: string;
  displayName: string;
  email: string;
}

export function useWelcomeEmailSequence() {
  /**
   * triggerJ0 — call once after onboarding completion.
   * Idempotent: localStorage guard prevents double sends.
   */
  const triggerJ0 = useCallback(async (params: WelcomeEmailTriggerParams): Promise<void> => {
    const { userId } = params;

    // Guard: already sent this session or in a previous session
    if (localStorage.getItem(j0SentKey(userId))) return;

    try {
      const token = await blink.auth.getValidToken().catch(() => null);
      if (!token) return;

      await callOnboardingEndpoint('/api/onboarding/welcome-email', token, {
        userId:      params.userId,
        sector:      params.sector,
        objective:   params.objective,
        displayName: params.displayName,
        email:       params.email,
      });

      // Mark as sent locally so we never retry even on refresh
      localStorage.setItem(j0SentKey(userId), new Date().toISOString());
    } catch {
      // Silent — never surfaces error to user
    }
  }, []);

  /**
   * triggerJ3Check — call on app open to trigger the J3 reminder if eligible.
   * Throttled to once per 12h via localStorage to avoid hammering the backend.
   */
  const triggerJ3Check = useCallback(async (userId: string): Promise<void> => {
    // Skip if J3 already confirmed sent
    if (localStorage.getItem(j3SentKey(userId))) return;

    // Throttle: don't call the backend more than once every 12h
    const lastCheck = localStorage.getItem(j3CheckKey(userId));
    if (lastCheck) {
      const elapsed = Date.now() - new Date(lastCheck).getTime();
      if (elapsed < 12 * 60 * 60 * 1000) return;
    }

    try {
      const token = await blink.auth.getValidToken().catch(() => null);
      if (!token) return;

      localStorage.setItem(j3CheckKey(userId), new Date().toISOString());

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10_000);
      const res = await fetch(`${BACKEND_URL}/api/onboarding/j3-reminder`, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        signal:  ctrl.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json() as { success?: boolean; skipped?: boolean; reason?: string };
        if (data.success) {
          // J3 was sent — mark locally so we never check again
          localStorage.setItem(j3SentKey(userId), new Date().toISOString());
        }
      }
    } catch {
      // Silent — never surfaces error to user
    }
  }, []);

  return { triggerJ0, triggerJ3Check };
}

// ── Auto J3 check on mount (for app-level usage) ─────────────────────────────

/**
 * useJ3ReminderCheck — drop this in the root app layout.
 * Fires the J3 check automatically when a user opens the app,
 * if they've previously completed onboarding.
 */
export function useJ3ReminderCheck(userId: string | null | undefined) {
  const { triggerJ3Check } = useWelcomeEmailSequence();

  useEffect(() => {
    if (!userId) return;
    // Only check if J0 was sent (user completed onboarding)
    if (!localStorage.getItem(j0SentKey(userId))) return;

    triggerJ3Check(userId);
  }, [userId, triggerJ3Check]);
}
