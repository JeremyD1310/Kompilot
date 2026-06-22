import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { blink } from '../blink/client';

export interface OnboardingProfile {
  sector: string;
  objectives: string[];
  companyName: string; // added in v2
}

export const PROFILE_CACHE_KEY = (userId: string) => `onboarding_profile_${userId}`;

export function useOnboardingProfile(): OnboardingProfile | null {
  const { user } = useAuth();
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);

  useEffect(() => {
    if (!user) return;

    // Instant cache hit
    try {
      const raw = localStorage.getItem(PROFILE_CACHE_KEY(user.id));
      if (raw) {
        setProfile(JSON.parse(raw));
        return;
      }
    } catch { /* ignore */ }

    // DB fallback
    blink.db.onboardingProfiles
      .list({ where: { userId: user.id } })
      .then(rows => {
        if (rows.length === 0) return;
        const row = rows[0] as any;
        const parsed: OnboardingProfile = {
          sector: row.sector ?? '',
          objectives: row.objective
            ? row.objective.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
          // company name stored in sector field with a prefix before v2,
          // or falls back to empty (will use display name on dashboard)
          companyName: row.companyName ?? '',
        };
        setProfile(parsed);
        localStorage.setItem(PROFILE_CACHE_KEY(user.id), JSON.stringify(parsed));
      })
      .catch(() => { /* degrade gracefully */ });
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
