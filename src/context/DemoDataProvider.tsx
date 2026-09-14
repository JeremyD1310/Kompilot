import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { createDemoRecord, type DemoApprovalItem, type DemoProfile, type DemoRecord, type DemoWorkflowStatus } from '../lib/demoProductData';
import { clearDemoStorage, isDemoRuntime } from '../lib/demoDomain';

export type DemoSector = 'beauty' | 'medical' | 'restaurant' | 'hotel' | 'auto' | 'general';
export type DemoViewRole = 'pro' | 'agency';

interface DemoDataContextValue {
  isDemoActive: boolean;
  profile: DemoProfile;
  data: DemoRecord;
  demoSector: DemoSector;
  demoViewRole: DemoViewRole;
  demoCreditsUsed: number;
  demoCreditTotal: number;
  demoCreditsRemaining: number;
  isDemoCreditsExhausted: boolean;
  lastAction: string | null;
  setProfile: (profile: DemoProfile) => void;
  setDemoSector: (sector: DemoSector) => void;
  setDemoViewRole: (role: DemoViewRole) => void;
  updateApproval: (id: string, status: DemoWorkflowStatus) => void;
  simulateAction: (action: string) => void;
  consumeDemoCredits: (amount: number) => boolean;
  activateDemo: () => void;
  deactivateDemo: () => void;
  resetDemo: () => void;
}

const DemoDataContext = createContext<DemoDataContextValue | null>(null);
const PROFILE_KEY = 'kompilot_demo_profile_v2';
const SECTOR_KEY = 'kompilot_demo_sector';
const VIEW_KEY = 'kompilot_demo_view_role';
const CREDITS_KEY = 'kompilot_demo_credits_v1';
export const DEMO_CREDIT_TOTAL = 50;

const profiles: DemoProfile[] = ['commerce', 'artisan', 'agency', 'network'];
const sectors: DemoSector[] = ['beauty', 'medical', 'restaurant', 'hotel', 'auto', 'general'];

function readValue<T extends string>(key: string, allowed: T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key) as T | null;
    return value && allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function readCredits(): number {
  try {
    const value = Number(localStorage.getItem(CREDITS_KEY) ?? 0);
    return Number.isFinite(value) ? Math.max(0, Math.min(DEMO_CREDIT_TOTAL, value)) : 0;
  } catch {
    return 0;
  }
}

function persist(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* private browsing */ }
}

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<DemoProfile>(() => readValue(PROFILE_KEY, profiles, 'commerce'));
  const [data, setData] = useState<DemoRecord>(() => createDemoRecord(readValue(PROFILE_KEY, profiles, 'commerce')));
  const [demoSector, setDemoSectorState] = useState<DemoSector>(() => readValue(SECTOR_KEY, sectors, 'general'));
  const [demoViewRole, setDemoViewRoleState] = useState<DemoViewRole>(() => readValue(VIEW_KEY, ['pro', 'agency'], 'pro'));
  const [demoCreditsUsed, setDemoCreditsUsed] = useState(readCredits);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const setProfile = useCallback((next: DemoProfile) => {
    setProfileState(next);
    setData(createDemoRecord(next));
    setLastAction(`Profil ${next} chargé localement`);
    persist(PROFILE_KEY, next);
  }, []);

  const setDemoSector = useCallback((next: DemoSector) => {
    setDemoSectorState(next);
    persist(SECTOR_KEY, next);
  }, []);

  const setDemoViewRole = useCallback((next: DemoViewRole) => {
    setDemoViewRoleState(next);
    persist(VIEW_KEY, next);
  }, []);

  const updateApproval = useCallback((id: string, status: DemoWorkflowStatus) => {
    setData(previous => ({
      ...previous,
      approvals: previous.approvals.map(item => item.id === id ? { ...item, status } : item),
    }));
    setLastAction(`Simulation locale : ${status.toLowerCase()}`);
  }, []);

  const simulateAction = useCallback((action: string) => {
    setLastAction(`Simulation locale : ${action}`);
  }, []);

  const consumeDemoCredits = useCallback((amount: number) => {
    if (amount <= 0 || demoCreditsUsed + amount > DEMO_CREDIT_TOTAL) return false;
    const next = demoCreditsUsed + amount;
    setDemoCreditsUsed(next);
    persist(CREDITS_KEY, String(next));
    setLastAction(`Simulation locale : ${amount} crédit${amount > 1 ? 's' : ''} consommé${amount > 1 ? 's' : ''}`);
    return true;
  }, [demoCreditsUsed]);

  const activateDemo = useCallback(() => {
    try { sessionStorage.setItem('kompilot_demo_active_session', 'true'); } catch { /* noop */ }
  }, []);

  const deactivateDemo = useCallback(() => {
    clearDemoStorage();
  }, []);

  const resetDemo = useCallback(() => {
    clearDemoStorage({ keepSession: true });
    setProfileState('commerce');
    setData(createDemoRecord('commerce'));
    setDemoSectorState('general');
    setDemoViewRoleState('pro');
    setDemoCreditsUsed(0);
    setLastAction('Démonstration réinitialisée localement');
  }, []);

  const value = useMemo(() => ({
    isDemoActive: isDemoRuntime(),
    profile,
    data,
    demoSector,
    demoViewRole,
    demoCreditsUsed,
    demoCreditTotal: DEMO_CREDIT_TOTAL,
    demoCreditsRemaining: DEMO_CREDIT_TOTAL - demoCreditsUsed,
    isDemoCreditsExhausted: demoCreditsUsed >= DEMO_CREDIT_TOTAL,
    lastAction,
    setProfile,
    setDemoSector,
    setDemoViewRole,
    updateApproval,
    simulateAction,
    consumeDemoCredits,
    activateDemo,
    deactivateDemo,
    resetDemo,
  }), [profile, data, demoSector, demoViewRole, demoCreditsUsed, lastAction, setProfile, setDemoSector, setDemoViewRole, updateApproval, simulateAction, consumeDemoCredits, activateDemo, deactivateDemo, resetDemo]);

  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
}

export function useDemoData() {
  const value = useContext(DemoDataContext);
  if (!value) throw new Error('useDemoData doit être utilisé dans DemoDataProvider');
  return value;
}

export function isDemoMode(): boolean { return isDemoRuntime(); }
export type { DemoApprovalItem };
