import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { createDemoData, type DemoData, type DemoPersona } from '../data/demoData';
import { clearDemoStorage, isDemoRuntime } from '../lib/demoDomain';
import { DEMO_ACTION_MESSAGE, protectDemoAction, type DemoActionResult, type DemoExternalService } from '../lib/demoSafety';
import { createDemoRecord, type DemoProfile, type DemoRecord, type DemoWorkflowStatus } from '../lib/demoProductData';

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
const SELECTION_KEY = 'kompilot_demo_selection_v1';
const ACTIVE_KEY = 'kompilot_demo_active_session';
export const DEMO_CREDIT_TOTAL = 50;

interface DemoSelection { clientId: string | null; establishmentId: string | null }

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
  simulateCreatePost: (title?: string, channels?: string[]) => void;
  simulateApprovePost: (id?: string) => void;
  simulateReplyReview: (id?: string, response?: string) => void;
  simulateSendMessage: (recipient?: string, response?: string) => void;
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

function readSelection(): DemoSelection {
  try {
    const value = localStorage.getItem(SELECTION_KEY);
    return value ? JSON.parse(value) as DemoSelection : { clientId: null, establishmentId: null };
  } catch { return { clientId: null, establishmentId: null }; }
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
  const storedSelection = readSelection();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(storedSelection.clientId);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string | null>(storedSelection.establishmentId);
  const [approvalStatuses, setApprovalStatuses] = useState<Record<string, DemoWorkflowStatus>>(readApprovalStatuses);
  const [demoActive, setDemoActive] = useState(() => {
    try { return sessionStorage.getItem(ACTIVE_KEY) === 'true'; } catch { return false; }
  });

  const persistData = useCallback((next: DemoData) => { setDemoData(next); persist(DATA_KEY, JSON.stringify(next)); }, []);
  const persistSelection = useCallback((selection: DemoSelection) => persist(SELECTION_KEY, JSON.stringify(selection)), []);
  const setActivePersona = useCallback((persona: DemoPersona) => {
    setActivePersonaState(persona);
    setSelectedClientId(null);
    setSelectedEstablishmentId(null);
    persist(PROFILE_KEY, PERSONA_TO_PROFILE[persona]);
    persistSelection({ clientId: null, establishmentId: null });
    persistData(createDemoData(persona));
    setLastAction(`Profil ${persona} chargé localement`);
  }, [persistData, persistSelection]);
  const setProfile = useCallback((profile: DemoProfile) => setActivePersona(PROFILE_TO_PERSONA[profile]), [setActivePersona]);
  const simulate = useCallback((message: string, next?: DemoData) => { if (next) persistData(next); setLastAction(`${DEMO_ACTION_MESSAGE} ${message}`); }, [persistData]);

  const simulateCreatePost = useCallback((title = 'Nouvelle publication fictive', channels = ['Instagram', 'Facebook']) => {
    protectDemoAction('publishing', { title, channels });
    const post = { id: `demo-publication-${Date.now()}`, title, channel: (channels[0] || 'Instagram') as 'Instagram' | 'Facebook' | 'LinkedIn', channels, status: 'draft' as const, scheduledAt: '' };
    simulate('brouillon créé localement.', { ...demoData, publications: [post, ...demoData.publications], recentActivity: [`Brouillon « ${title} » créé`, ...demoData.recentActivity] });
  }, [demoData, simulate]);
  const simulateApprovePost = useCallback((id = demoData.validations[0]?.id) => {
    protectDemoAction('publishing', { id });
    if (!id) return;
    simulate('publication approuvée localement.', { ...demoData, validations: demoData.validations.map(item => item.id === id ? { ...item, status: 'approved' as const } : item) });
  }, [demoData, simulate]);
  const simulateReplyReview = useCallback((id = demoData.reviews[0]?.id, response = 'Bonjour, merci pour votre retour. Votre avis nous aide à progresser.') => {
    protectDemoAction('review-reply', { id, response });
    if (!id) return;
    simulate('réponse à un avis enregistrée localement.', { ...demoData, reviews: demoData.reviews.map(item => item.id === id ? { ...item, replied: true, replyText: response } : item), recentActivity: [`Réponse à ${id} enregistrée`, ...demoData.recentActivity] });
  }, [demoData, simulate]);
  const simulateSendMessage = useCallback((recipient = 'contact fictif', response = 'Merci pour votre message. Nous revenons vers vous très bientôt.') => {
    protectDemoAction('social', { recipient, response });
    const messageId = demoData.messages.find(item => item.sender === recipient)?.id ?? demoData.messages[0]?.id;
    if (!messageId) return;
    const message = demoData.messages.find(item => item.id === messageId);
    const label = message?.sender ?? recipient;
    simulate(`réponse destinée à ${label} enregistrée localement.`, { ...demoData, messages: demoData.messages.map(item => item.id === messageId ? { ...item, read: true, responseText: response } : item), recentActivity: [`Réponse au message destiné à ${label} enregistrée`, ...demoData.recentActivity] });
  }, [demoData, simulate]);
  const simulateSchedulePost = useCallback((title = 'Publication planifiée fictive') => {
    protectDemoAction('publishing', { title });
    const post = { id: `demo-publication-${Date.now()}`, title, channel: 'Facebook' as const, channels: ['Facebook'], status: 'scheduled' as const, scheduledAt: '2026-09-25T10:00:00.000Z' };
    simulate('publication planifiée localement.', { ...demoData, publications: [post, ...demoData.publications], calendar: [{ id: `demo-event-${Date.now()}`, title, date: '2026-09-25', channel: 'Facebook' }, ...demoData.calendar], recentActivity: [`${title} planifiée`, ...demoData.recentActivity] });
  }, [demoData, simulate]);
  const simulateSelectClient = useCallback((id: string) => {
    if (!demoData.clients.some(client => client.id === id)) return;
    setSelectedClientId(id);
    persistSelection({ clientId: id, establishmentId: selectedEstablishmentId });
    setLastAction('Client fictif sélectionné localement.');
  }, [demoData.clients, persistSelection, selectedEstablishmentId]);
  const simulateSelectEstablishment = useCallback((id: string) => {
    if (!demoData.establishments.some(establishment => establishment.id === id)) return;
    setSelectedEstablishmentId(id);
    persistSelection({ clientId: selectedClientId, establishmentId: id });
    setLastAction('Établissement fictif sélectionné localement.');
  }, [demoData.establishments, persistSelection, selectedClientId]);
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
  const activateDemo = useCallback(() => { try { sessionStorage.setItem(ACTIVE_KEY, 'true'); } catch { /* noop */ } setDemoActive(true); }, []);
  const deactivateDemo = useCallback(() => { clearDemoStorage(); setDemoActive(false); }, []);
  const resetDemo = useCallback(() => { clearDemoStorage({ keepSession: true }); persist(APPROVALS_KEY, '{}'); persistSelection({ clientId: null, establishmentId: null }); const fresh = createDemoData('merchant'); setActivePersonaState('merchant'); setDemoData(fresh); persist(DATA_KEY, JSON.stringify(fresh)); setApprovalStatuses({}); setDemoCreditsUsed(0); persist(CREDITS_KEY, '0'); setDemoSectorState('general'); persist(SECTOR_KEY, 'general'); setDemoViewRoleState('pro'); persist(VIEW_KEY, 'pro'); setSelectedClientId(null); setSelectedEstablishmentId(null); setLastAction('Démonstration réinitialisée localement.'); }, []);
  const protectAction = useCallback(function protectAction<T>(service: DemoExternalService, simulation?: T) {
    return protectDemoAction(service, simulation);
  }, []);
  const profile = PERSONA_TO_PROFILE[activePersona];
  const selectedEstablishment = demoData.establishments.find(item => item.id === selectedEstablishmentId) ?? demoData.establishments[0];
  const selectedClient = demoData.clients.find(item => item.id === selectedClientId);
  const seeded = createDemoRecord(profile);
  const data = useMemo(() => ({
    ...seeded,
    establishment: selectedEstablishment?.name ?? seeded.establishment,
    city: selectedEstablishment?.city ?? seeded.city,
    reviewsToAnswer: demoData.reviews.filter(item => !item.replied).length,
    localVisibility: Math.min(100, seeded.localVisibility + Math.min(12, demoData.publications.filter(item => item.status !== 'draft').length)),
    leads: seeded.leads + demoData.messages.filter(item => Boolean(item.responseText)).length,
    approvals: [
      ...seeded.approvals.map(item => ({ ...item, status: approvalStatuses[item.id] ?? item.status })),
      ...demoData.publications.filter(item => item.status === 'draft').map(item => ({ id: item.id, kind: 'post' as const, title: item.title, detail: `${(item.channels ?? [item.channel]).join(' · ')} · brouillon local`, status: 'Brouillon' as const })),
    ],
    clients: demoData.clients.map(client => ({
      id: client.id,
      name: client.name,
      city: client.city,
      score: selectedClient?.id === client.id ? selectedClient.score : client.score,
      alert: selectedClient?.id === client.id
        ? `${selectedClient.score >= 80 ? 1 : 3} alerte${selectedClient.score >= 80 ? '' : 's'} à traiter`
        : client.score >= 80 ? 'Suivi régulier' : 'Fiche à surveiller',
    })),
    notifications: [...demoData.recentActivity.slice(0, 5), ...seeded.notifications],
  }), [approvalStatuses, demoData, profile, seeded, selectedClient, selectedEstablishment]);
  const setDemoSector = useCallback((sector: DemoSector) => { setDemoSectorState(sector); persist(SECTOR_KEY, sector); }, []);
  const setDemoViewRole = useCallback((role: DemoViewRole) => { setDemoViewRoleState(role); persist(VIEW_KEY, role); }, []);
  const demoRuntime = isDemoRuntime() || demoActive;
  const value = useMemo(() => ({ isDemoMode: demoRuntime, isDemoActive: demoRuntime, activePersona, setActivePersona, demoData, profile, data, demoSector, demoViewRole, demoCreditsUsed, demoCreditTotal: DEMO_CREDIT_TOTAL, demoCreditsRemaining: DEMO_CREDIT_TOTAL - demoCreditsUsed, isDemoCreditsExhausted: demoCreditsUsed >= DEMO_CREDIT_TOTAL, lastAction, resetDemo, simulateCreatePost, simulateApprovePost, simulateReplyReview, simulateSendMessage, simulateSchedulePost, simulateSelectClient, simulateSelectEstablishment, selectedClientId, selectedEstablishmentId, setProfile, setDemoSector, setDemoViewRole, updateApproval, simulateAction, consumeDemoCredits, activateDemo, deactivateDemo, protectAction }), [activePersona, setActivePersona, demoData, profile, data, demoSector, demoViewRole, demoCreditsUsed, lastAction, resetDemo, simulateCreatePost, simulateApprovePost, simulateReplyReview, simulateSendMessage, simulateSchedulePost, simulateSelectClient, simulateSelectEstablishment, selectedClientId, selectedEstablishmentId, setProfile, setDemoSector, setDemoViewRole, updateApproval, simulateAction, consumeDemoCredits, activateDemo, deactivateDemo, protectAction, demoRuntime]);
  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
}

export function useDemoData(): DemoDataContextValue {
  const context = useContext(DemoDataContext);
  if (!context) throw new Error('useDemoData doit être utilisé dans DemoDataProvider');
  return context;
}

export function isDemoMode(): boolean { return isDemoRuntime(); }
export type { DemoApprovalItem };
