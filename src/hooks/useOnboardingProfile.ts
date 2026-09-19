import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { blink } from '../blink/client';
import type { EstablishmentRecord, OnboardingProfileRecord } from '../lib/onboardingPersistence';

export interface OnboardingProfile {
  sector: string;
  objectives: string[];
  companyName: string;
}

export const PROFILE_CACHE_KEY = (userId: string) => `onboarding_profile_${userId}`;

export function useOnboardingProfile(): OnboardingProfile | null {
  const { user } = useAuth();
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const onboardingProfiles = blink.db.table<OnboardingProfileRecord>('onboarding_profiles');
    const establishments = blink.db.table<EstablishmentRecord>('establishments');
    Promise.all([
      onboardingProfiles.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 1,
      }),
      establishments.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
        limit: 1,
      }),
    ])
      .then(([profiles, establishments]) => {
        if (cancelled || profiles.length === 0) return;
        const row = profiles[0];
        const establishment = establishments[0];
        const parsed: OnboardingProfile = {
          sector: row.sector ?? '',
          objectives: row.objective
            ? row.objective.split(',').map(value => value.trim()).filter(Boolean)
            : [],
          companyName: establishment?.name ?? '',
        };
        setProfile(parsed);
        try {
          localStorage.setItem(PROFILE_CACHE_KEY(user.id), JSON.stringify(parsed));
        } catch { /* cache is non-authoritative */ }
      })
      .catch(error => {
        if (cancelled) return;
        console.error('[onboarding] profile read failed', {
          code: 'ONBOARDING_PROFILE_READ_FAILED',
          error: error instanceof Error ? error.name : 'unknown',
        });
        setProfile(null);
      });

    return () => { cancelled = true; };
  }, [user]);

  return profile;
}

// ── Session memory helpers (used by login/logout) ────────────────────────────

export const SESSION_MEMORY_KEY = 'kompilot_last_session';

export interface SessionMemory {
  email: string;
  displayName?: string;
  planId?: string; // persisted subscription plan
}

export function saveSessionMemory(mem: SessionMemory) {
  try { localStorage.setItem(SESSION_MEMORY_KEY, JSON.stringify(mem)); } catch { /* noop */ }
}

export function readSessionMemory(): SessionMemory | null {
  try {
    const raw = localStorage.getItem(SESSION_MEMORY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearSessionMemory() {
  try { localStorage.removeItem(SESSION_MEMORY_KEY); } catch { /* noop */ }
}
