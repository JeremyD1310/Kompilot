import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { createDemoRecord, type DemoApprovalItem, type DemoProfile, type DemoRecord, type DemoWorkflowStatus } from '../lib/demoProductData';

interface DemoDataContextValue {
  profile: DemoProfile;
  data: DemoRecord;
  setProfile: (profile: DemoProfile) => void;
  updateApproval: (id: string, status: DemoWorkflowStatus) => void;
  simulateAction: (action: string) => void;
  resetDemo: () => void;
  lastAction: string | null;
}

const DemoDataContext = createContext<DemoDataContextValue | null>(null);
const PROFILE_KEY = 'kompilot_demo_profile_v2';

function readProfile(): DemoProfile {
  try {
    const value = localStorage.getItem(PROFILE_KEY);
    if (value === 'commerce' || value === 'artisan' || value === 'agency' || value === 'network') return value;
  } catch { /* private browsing */ }
  return 'commerce';
}

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<DemoProfile>(readProfile);
  const [data, setData] = useState<DemoRecord>(() => createDemoRecord(readProfile()));
  const [lastAction, setLastAction] = useState<string | null>(null);

  const setProfile = useCallback((next: DemoProfile) => {
    setProfileState(next);
    setData(createDemoRecord(next));
    setLastAction(null);
    try { localStorage.setItem(PROFILE_KEY, next); } catch { /* local-only */ }
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

  const resetDemo = useCallback(() => {
    setData(createDemoRecord(profile));
    setLastAction('Démonstration réinitialisée');
  }, [profile]);

  const value = useMemo(() => ({ profile, data, setProfile, updateApproval, simulateAction, resetDemo, lastAction }), [profile, data, setProfile, updateApproval, simulateAction, resetDemo, lastAction]);
  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
}

export function useDemoData() {
  const value = useContext(DemoDataContext);
  if (!value) throw new Error('useDemoData doit être utilisé dans DemoDataProvider');
  return value;
}

export function isDemoMode(): true { return true; }
export type { DemoApprovalItem };
