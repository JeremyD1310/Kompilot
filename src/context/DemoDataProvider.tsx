import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { createDemoData, type DemoData, type DemoPersona } from '../data/demoData';
import { clearDemoStorage, isDemoRuntime } from '../lib/demoDomain';
import { DEMO_ACTION_MESSAGE, protectDemoAction, type DemoActionResult, type DemoExternalService } from '../lib/demoSafety';
import { createDemoRecord, type DemoApprovalItem, type DemoProfile, type DemoRecord, type DemoWorkflowStatus } from '../lib/demoProductData';

export type DemoSector = 'beauty' | 'medical' | 'restaurant' | 'hotel' | 'auto' | 'general';
export type DemoViewRole = 'pro' | 'agency';
const PERSONA_TO_PROFILE: Record<DemoPersona, DemoProfile> = { merchant: 'commerce', artisan: 'artisan', agency: 'agency', multi_location: 'network' };
const PROFILE_TO_PERSONA: Record<DemoProfile, DemoPersona> = { commerce: 'merchant', artisan: 'artisan', agency: 'agency', network: 'multi_location' };
const PROFILE_KEY = 'kompilot_demo_profile_v2';
const DATA_KEY = 'kompilot_demo_data_v1';
const SECTOR_KEY = 'kompilot_demo_sector';
const VIEW_KEY = 'kompilot_demo_view_role';
const CREDITS_KEY = 'kompilot_demo_credits_v1';
const APPROVALS_KEY = 'kompilot_demo_approval_statuses_v1';
export const DEMO_CREDIT_TOTAL = 50;

interface DemoDataContextValue {
  isDemoMode: boolean;
  isDemoActive: boolean;
  activePersona: DemoPersona;
  setActivePersona: (persona: DemoPersona) => void;
  demoData: DemoData;
  profile: DemoProfile;
  data: DemoRecord;
  demoSector: DemoSector;
  demoViewRole: DemoViewRole;
  demoCreditsUsed: number;
  demoCreditTotal: number;
  demoCreditsRemaining: number;
  isDemoCreditsExhausted: boolean;
  lastAction: string | null;
  resetDemo: () => void;
  simulateCreatePost: (title?: string) => void;
  simulateApprovePost: (id?: string) => void;
  simulateReplyReview: (id?: string) => void;
  simulateSendMessage: (recipient?: string) => void;
  simulateSchedulePost: (title?: string) => void;
  simulateSelectClient: (id: string) => void;
  simulateSelectEstablishment: (id: string) => void;
  selectedClientId: string | null;
  selectedEstablishmentId: string | null;
  setProfile: (profile: DemoProfile) => void;
  setDemoSector: (sector: DemoSector) => void;
  setDemoViewRole: (role: DemoViewRole) => void;
  updateApproval: (id: string, status: DemoWorkflowStatus) => void;
  simulateAction: (action: string) => void;
  consumeDemoCredits: (amount: number) => boolean;
  activateDemo: () => void;
  deactivateDemo: () => void;
  protectAction: (service: DemoExternalService, simulation?: unknown) => DemoActionResult<unknown>;
}

const DemoDataContext = createContext<DemoDataContextValue | null>(null);
const profiles: DemoProfile[] = ['commerce', 'artisan', 'agency', 'network'];
const sectors: DemoSector[] = ['beauty', 'medical', 'restaurant', 'hotel', 'auto', 'general'];

function readString<T extends string>(key: string, allowed: T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key) as T | null;
    return value && allowed.includes(value) ? value : fallback;
  } catch { return fallback; }
}

function readNumber(key: string): number {
  try { return Math.max(0, Math.min(DEMO_CREDIT_TOTAL, Number(localStorage.getItem(key) ?? 0) || 0)); } catch { return 0; }
}

function readApprovalStatuses(): Record<string, DemoWorkflowStatus> {
  try {
    const value = localStorage.getItem(APPROVALS_KEY);
    return value ? JSON.parse(value) as Record<string, DemoWorkflowStatus> : {};
  } catch { return {}; }
}

function persist(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* private browsing */ }
}

function initialPersona(): DemoPersona {
  const profile = readString(PROFILE_KEY, profiles, 'commerce');
  return PROFILE_TO_PERSONA[profile];
}

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [activePersona, setActivePersonaState] = useState<DemoPersona>(initialPersona);
  const [demoData, setDemoData] = useState<DemoData>(() => {
    try {
      const stored = localStorage.getItem(DATA_KEY);
      if (stored) return JSON.parse(stored) as DemoData;
    } catch { /* use seed */ }
    return createDemoData(initialPersona());
  });
  const [demoCreditsUsed, setDemoCreditsUsed] = useState(readNumber);
  const [demoSector, setDemoSectorState] = useState<DemoSector>(() => readString(SECTOR_KEY, sectors, 'general'));
  const [demoViewRole, setDemoViewRoleState] = useState<DemoViewRole>(() => readString(VIEW_KEY, ['pro', 'agency'], 'pro'));
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string | null>(null);
  const [approvalStatuses, setApprovalStatuses] = useState<Record<string, DemoWorkflowStatus>>(readApprovalStatuses);

  const persistData = useCallback((next: DemoData) => { setDemoData(next); persist(DATA_KEY, JSON.stringify(next)); }, []);
  const setActivePersona = useCallback((persona: DemoPersona) => {
    setActivePersonaState(persona);
    setSelectedClientId(null);
    setSelectedEstablishmentId(null);
    persist(PROFILE_KEY, PERSONA_TO_PROFILE[persona]);
    persistData(createDemoData(persona));
    setLastAction(`Profil ${persona} chargé localement`);
  }, [persistData]);
  const setProfile = useCallback((profile: DemoProfile) => setActivePersona(PROFILE_TO_PERSONA[profile]), [setActivePersona]);
  const simulate = useCallback((message: string, next?: DemoData) => { if (next) persistData(next); setLastAction(`${DEMO_ACTION_MESSAGE} ${message}`); }, [persistData]);

  const simulateCreatePost = useCallback((title = 'Nouvelle publication fictive') => {
    const post = { id: `demo-publication-${Date.now()}`, title, channel: 'Instagram' as const, status: 'draft' as const, scheduledAt: '' };
    simulate('publication créée localement.', { ...demoData, publications: [post, ...demoData.publications] });
  }, [demoData, simulate]);
  const simulateApprovePost = useCallback((id = demoData.validations[0]?.id) => {
    if (!id) return;
    simulate('publication approuvée localement.', { ...demoData, validations: demoData.validations.map(item => item.id === id ? { ...item, status: 'approved' as const } : item) });
  }, [demoData, simulate]);
  const simulateReplyReview = useCallback((id = demoData.reviews[0]?.id) => {
    if (!id) return;
    simulate('réponse à un avis préparée localement.', { ...demoData, reviews: demoData.reviews.map(item => item.id === id ? { ...item, replied: true } : item) });
  }, [demoData, simulate]);
  const simulateSendMessage = useCallback((recipient = 'contact fictif') => simulate(`message destiné à ${recipient} simulé, aucun envoi effectué.`), [simulate]);
  const simulateSchedulePost = useCallback((title = 'Publication planifiée fictive') => {
    const post = { id: `demo-publication-${Date.now()}`, title, channel: 'Facebook' as const, status: 'scheduled' as const, scheduledAt: '2026-09-25T10:00:00.000Z' };
    simulate('publication planifiée localement.', { ...demoData, publications: [post, ...demoData.publications], calendar: [{ id: `demo-event-${Date.now()}`, title, date: '2026-09-25', channel: 'Facebook' }, ...demoData.calendar] });
  }, [demoData, simulate]);
  const simulateSelectClient = useCallback((id: string) => { setSelectedClientId(id); setLastAction('Client fictif sélectionné localement.'); }, []);
  const simulateSelectEstablishment = useCallback((id: string) => { setSelectedEstablishmentId(id); setLastAction('Établissement fictif sélectionné localement.'); }, []);
  const updateApproval = useCallback((id: string, status: DemoWorkflowStatus) => {
    setApprovalStatuses(previous => {
      const next = { ...previous, [id]: status };
      persist(APPROVALS_KEY, JSON.stringify(next));
      return next;
    });
    setLastAction(`Simulation locale : ${status.toLowerCase()} (${id})`);
  }, []);
  const simulateAction = useCallback((action: string) => setLastAction(`Simulation locale : ${action}`), []);
  const consumeDemoCredits = useCallback((amount: number) => { if (amount <= 0 || demoCreditsUsed + amount > DEMO_CREDIT_TOTAL) return false; const next = demoCreditsUsed + amount; setDemoCreditsUsed(next); persist(CREDITS_KEY, String(next)); setLastAction(`${DEMO_ACTION_MESSAGE} ${amount} crédit(s) consommé(s).`); return true; }, [demoCreditsUsed]);
  const activateDemo = useCallback(() => { try { sessionStorage.setItem('kompilot_demo_active_session', 'true'); } catch { /* noop */ } }, []);
  const deactivateDemo = useCallback(() => clearDemoStorage(), []);
  const resetDemo = useCallback(() => { clearDemoStorage({ keepSession: true }); persist(APPROVALS_KEY, '{}'); const fresh = createDemoData('merchant'); setActivePersonaState('merchant'); setDemoData(fresh); setApprovalStatuses({}); setDemoCreditsUsed(0); setDemoSectorState('general'); setDemoViewRoleState('pro'); setSelectedClientId(null); setSelectedEstablishmentId(null); setLastAction('Démonstration réinitialisée localement.'); }, []);
  const protectAction = useCallback(function protectAction<T>(service: DemoExternalService, simulation?: T) {
    return protectDemoAction(service, simulation);
  }, []);
  const profile = PERSONA_TO_PROFILE[activePersona];
  const data = useMemo(() => {
    const record = createDemoRecord(profile);
    return { ...record, approvals: record.approvals.map(item => ({ ...item, status: approvalStatuses[item.id] ?? item.status })) };
  }, [profile, approvalStatuses]);
  const setDemoSector = useCallback((sector: DemoSector) => { setDemoSectorState(sector); persist(SECTOR_KEY, sector); }, []);
  const setDemoViewRole = useCallback((role: DemoViewRole) => { setDemoViewRoleState(role); persist(VIEW_KEY, role); }, []);
  const value = useMemo(() => ({ isDemoMode: isDemoRuntime(), isDemoActive: isDemoRuntime(), activePersona, setActivePersona, demoData, profile, data, demoSector, demoViewRole, demoCreditsUsed, demoCreditTotal: DEMO_CREDIT_TOTAL, demoCreditsRemaining: DEMO_CREDIT_TOTAL - demoCreditsUsed, isDemoCreditsExhausted: demoCreditsUsed >= DEMO_CREDIT_TOTAL, lastAction, resetDemo, simulateCreatePost, simulateApprovePost, simulateReplyReview, simulateSendMessage, simulateSchedulePost, simulateSelectClient, simulateSelectEstablishment, selectedClientId, selectedEstablishmentId, setProfile, setDemoSector, setDemoViewRole, updateApproval, simulateAction, consumeDemoCredits, activateDemo, deactivateDemo, protectAction }), [activePersona, setActivePersona, demoData, profile, data, demoSector, demoViewRole, demoCreditsUsed, lastAction, resetDemo, simulateCreatePost, simulateApprovePost, simulateReplyReview, simulateSendMessage, simulateSchedulePost, simulateSelectClient, simulateSelectEstablishment, setProfile, setDemoSector, setDemoViewRole, updateApproval, simulateAction, consumeDemoCredits, activateDemo, deactivateDemo, protectAction]);
  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
}

export function useDemoData() {
  return useContext(DemoDataContext) as DemoDataContextValue;
}

export function isDemoMode(): boolean { return isDemoRuntime(); }
export type { DemoApprovalItem };
