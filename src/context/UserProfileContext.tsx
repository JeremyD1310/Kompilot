/**
 * UserProfileContext — Gère le profil utilisateur + polymorphisme B2B.
 * Expose masterProfile, granularSector, activatedModules et lexicon dérivés.
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { SECTOR_TO_MASTER_PROFILE, getActivatedModules } from '../lib/sectorProfiles';
import type { MasterProfile, GranularSector, AppModule } from '../lib/sectorProfiles';

// ── Legacy types (rétro-compatibilité) ──────────────────────────────────────
export type ProfileType = 'b2c' | 'b2b' | null;
export type SmartProfileType = 'commerce' | 'agency' | null;
export type CommerceSector = 'restauration' | 'beaute' | 'retail' | 'autre' | null;
export type PrimaryObjective = 'geo' | 'no_show' | 'resell' | null;

// Re-exports for convenience
export type { MasterProfile, GranularSector, AppModule };

// ── Internal state ───────────────────────────────────────────────────────────
interface UserProfileData {
  profileType: ProfileType;
  siret: string | null;
  smartProfileType: SmartProfileType;
  sector: CommerceSector;          // legacy
  granularSector: GranularSector | null; // nouveau champ granulaire
  clientCount: number | null;
  objective: PrimaryObjective;
  followLocalEvents: boolean;
  onboardingCompleted: boolean;
}

// ── Context shape ────────────────────────────────────────────────────────────
interface UserProfileContextValue extends UserProfileData {
  // Dérivés automatiques
  isB2C: boolean;
  isB2B: boolean;
  isCommerce: boolean;
  isAgency: boolean;
  isRestauBeau: boolean;
  isRetail: boolean;
  masterProfile: MasterProfile;
  activatedModules: AppModule[];
  // Setters
  setProfile: (type: ProfileType, siret?: string) => void;
  setSmartProfile: (data: {
    smartProfileType: SmartProfileType;
    sector?: CommerceSector;
    granularSector?: GranularSector | null;
    clientCount?: number | null;
    objective: PrimaryObjective;
    followLocalEvents: boolean;
  }) => void;
  markOnboardingCompleted: () => void;
  clearProfile: () => void;
}

// Key scoped per user ID to prevent cross-session data leakage on shared browsers
const STORAGE_KEY = (userId?: string) =>
  userId ? `kompilot_user_profile_${userId}` : 'kompilot_user_profile_type';

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────
export function UserProfileProvider({ children, userId }: { children: ReactNode; userId?: string }) {
  const storageKey = STORAGE_KEY(userId);

  const [data, setData] = useState<UserProfileData>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const p = JSON.parse(raw);
        return {
          profileType: p.profileType ?? null,
          siret: p.siret ?? null,
          smartProfileType: p.smartProfileType ?? null,
          sector: p.sector ?? null,
          granularSector: p.granularSector ?? null,
          clientCount: p.clientCount ?? null,
          objective: p.objective ?? null,
          followLocalEvents: p.followLocalEvents ?? true,
          onboardingCompleted: p.onboardingCompleted ?? false,
        };
      }
    } catch { /* noop */ }
    return {
      profileType: null, siret: null, smartProfileType: null,
      sector: null, granularSector: null, clientCount: null,
      objective: null, followLocalEvents: true, onboardingCompleted: false,
    };
  });

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* noop */ }
  }, [data, storageKey]);

  // ── Dériver le masterProfile ──────────────────────────────────────────────
  const masterProfile: MasterProfile = (() => {
    if (data.smartProfileType === 'agency') return 'agence';
    if (data.granularSector && SECTOR_TO_MASTER_PROFILE[data.granularSector]) {
      return SECTOR_TO_MASTER_PROFILE[data.granularSector] as MasterProfile;
    }
    // Rétro-compatibilité avec l'ancien champ sector
    if (data.sector && SECTOR_TO_MASTER_PROFILE[data.sector]) {
      return SECTOR_TO_MASTER_PROFILE[data.sector] as MasterProfile;
    }
    return null;
  })();

  const activatedModules = getActivatedModules(masterProfile);

  // ── Setters ───────────────────────────────────────────────────────────────
  const setProfile = (type: ProfileType, siret?: string) => {
    setData(prev => ({ ...prev, profileType: type, siret: siret ?? null }));
  };

  const setSmartProfile = (newData: {
    smartProfileType: SmartProfileType;
    sector?: CommerceSector;
    granularSector?: GranularSector | null;
    clientCount?: number | null;
    objective: PrimaryObjective;
    followLocalEvents: boolean;
  }) => {
    setData(prev => ({
      ...prev,
      smartProfileType: newData.smartProfileType,
      sector: newData.sector ?? null,
      granularSector: newData.granularSector ?? null,
      clientCount: newData.clientCount ?? null,
      objective: newData.objective,
      followLocalEvents: newData.followLocalEvents,
    }));
  };

  const markOnboardingCompleted = () => {
    setData(prev => ({ ...prev, onboardingCompleted: true }));
  };

  const clearProfile = () => {
    setData({
      profileType: null, siret: null, smartProfileType: null,
      sector: null, granularSector: null, clientCount: null,
      objective: null, followLocalEvents: true, onboardingCompleted: false,
    });
    try {
      localStorage.removeItem(storageKey);
      // Also clear legacy unsoped key for backward compat cleanup
      localStorage.removeItem('kompilot_user_profile_type');
    } catch { /* noop */ }
  };

  return (
    <UserProfileContext.Provider value={{
      ...data,
      isB2C: data.profileType === 'b2c',
      isB2B: data.profileType === 'b2b',
      isCommerce: data.smartProfileType === 'commerce',
      isAgency: data.smartProfileType === 'agency',
      isRestauBeau: data.sector === 'restauration' || data.sector === 'beaute',
      isRetail: data.sector === 'retail',
      masterProfile,
      activatedModules,
      setProfile,
      setSmartProfile,
      markOnboardingCompleted,
      clearProfile,
    }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) { console.warn('useUserProfile must be used within UserProfileProvider' + ' — context missing, returning safe fallback'); return {} as any; }
  return ctx;
}
