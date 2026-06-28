/**
 * IntegrationStatusContext — Centralized real-time health state for all API integrations.
 *
 * Tracks connection status, latency, last successful call, and error state for each
 * integration (Meta, TikTok, SerpApi, OpenAI, Luma, Stripe, etc.).
 *
 * Used by:
 *  - SandboxToggle (switch to demo when APIs are down)
 *  - ApiStatusFallback (show skeleton/error states in Creative Studio)
 *  - AccountHealthBanner (48h incomplete account detection)
 *  - useTelemetry (fire api_connection_failed events)
 */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type IntegrationId =
  | 'meta'
  | 'tiktok'
  | 'serpapi'
  | 'openai'
  | 'luma'
  | 'stripe'
  | 'google_business'
  | 'claude'
  | 'sendgrid'
  | 'whatsapp';

export type IntegrationState = 'connected' | 'disconnected' | 'degraded' | 'checking' | 'unknown';

export interface IntegrationHealth {
  id: IntegrationId;
  label: string;
  state: IntegrationState;
  latencyMs: number | null;
  lastSuccess: string | null;   // ISO timestamp
  lastError: string | null;
  errorCount: number;           // consecutive failures
  checkedAt: string | null;
}

interface IntegrationStatusContextValue {
  /** Full health map for all tracked integrations */
  integrations: Record<IntegrationId, IntegrationHealth>;
  /** Update a single integration's state (call after API response) */
  reportStatus: (id: IntegrationId, state: IntegrationState, latencyMs?: number, errorMsg?: string) => void;
  /** Get a single integration's health */
  getHealth: (id: IntegrationId) => IntegrationHealth;
  /** Number of integrations in 'connected' state */
  connectedCount: number;
  /** Number of integrations in 'disconnected' or 'degraded' state */
  problemCount: number;
  /** True if any critical integration is down (meta, google_business, openai) */
  hasCriticalFailure: boolean;
  /** True if the account is < 48h old AND has 0 connected integrations */
  isAccountIncomplete: boolean;
  /** Timestamp of the user's account creation (for 48h check) */
  setAccountCreatedAt: (iso: string) => void;
  /** Mark the incomplete account banner as dismissed */
  dismissIncompleteBanner: () => void;
  incompleteBannerDismissed: boolean;
}

// ── Default health for each integration ───────────────────────────────────────

const INTEGRATION_LABELS: Record<IntegrationId, string> = {
  meta: 'Meta / Facebook',
  tiktok: 'TikTok',
  serpapi: 'SerpApi (SEO)',
  openai: 'OpenAI',
  luma: 'Luma AI (Vidéo)',
  stripe: 'Stripe',
  google_business: 'Google Business',
  claude: 'Claude (Anthropic)',
  sendgrid: 'SendGrid (Email)',
  whatsapp: 'WhatsApp Business',
};

const CRITICAL_INTEGRATIONS: IntegrationId[] = ['meta', 'google_business', 'openai'];

function createDefaultHealth(id: IntegrationId): IntegrationHealth {
  return {
    id,
    label: INTEGRATION_LABELS[id],
    state: 'unknown',
    latencyMs: null,
    lastSuccess: null,
    lastError: null,
    errorCount: 0,
    checkedAt: null,
  };
}

function createAllDefaults(): Record<IntegrationId, IntegrationHealth> {
  return Object.fromEntries(
    (Object.keys(INTEGRATION_LABELS) as IntegrationId[]).map(id => [id, createDefaultHealth(id)])
  ) as Record<IntegrationId, IntegrationHealth>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const IntegrationStatusContext = createContext<IntegrationStatusContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function IntegrationStatusProvider({ children }: { children: ReactNode }) {
  const [integrations, setIntegrations] = useState<Record<IntegrationId, IntegrationHealth>>(createAllDefaults);
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null);
  const [incompleteBannerDismissed, setIncompleteBannerDismissed] = useState(() => {
    try { return localStorage.getItem('kompilot_incomplete_banner_dismissed') === 'true'; }
    catch { return false; }
  });

  const reportStatus = useCallback((
    id: IntegrationId,
    state: IntegrationState,
    latencyMs?: number,
    errorMsg?: string,
  ) => {
    setIntegrations(prev => {
      const prevHealth = prev[id];
      const now = new Date().toISOString();
      return {
        ...prev,
        [id]: {
          ...prevHealth,
          state,
          latencyMs: latencyMs ?? prevHealth.latencyMs,
          lastSuccess: state === 'connected' ? now : prevHealth.lastSuccess,
          lastError: errorMsg ?? (state === 'disconnected' ? prevHealth.lastError : null),
          errorCount: state === 'connected' ? 0 : prevHealth.errorCount + (state === 'disconnected' ? 1 : 0),
          checkedAt: now,
        },
      };
    });
  }, []);

  const getHealth = useCallback((id: IntegrationId) => integrations[id], [integrations]);

  const connectedCount = (Object.values(integrations) as IntegrationHealth[]).filter(i => i.state === 'connected').length;
  const problemCount = (Object.values(integrations) as IntegrationHealth[]).filter(i => i.state === 'disconnected' || i.state === 'degraded').length;
  const hasCriticalFailure = CRITICAL_INTEGRATIONS.some(id => integrations[id].state === 'disconnected');

  // Account incomplete: < 48h old AND 0 connected integrations
  const isAccountIncomplete = (() => {
    if (!accountCreatedAt) return false;
    if (incompleteBannerDismissed) return false;
    const ageMs = Date.now() - new Date(accountCreatedAt).getTime();
    const isUnder48h = ageMs < 48 * 60 * 60 * 1000;
    return isUnder48h && connectedCount === 0;
  })();

  const dismissIncompleteBanner = useCallback(() => {
    setIncompleteBannerDismissed(true);
    try { localStorage.setItem('kompilot_incomplete_banner_dismissed', 'true'); }
    catch { /* noop */ }
  }, []);

  return (
    <IntegrationStatusContext.Provider value={{
      integrations,
      reportStatus,
      getHealth,
      connectedCount,
      problemCount,
      hasCriticalFailure,
      isAccountIncomplete,
      setAccountCreatedAt,
      dismissIncompleteBanner,
      incompleteBannerDismissed,
    }}>
      {children}
    </IntegrationStatusContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useIntegrationStatus() {
  const ctx = useContext(IntegrationStatusContext);
  if (!ctx) throw new Error('useIntegrationStatus must be used within IntegrationStatusProvider');
  return ctx;
}

/**
 * Lightweight hook to report a single API call's outcome.
 * Usage: const report = useApiCallReport('openai');
 *        report('connected', 340);
 *        report('disconnected', undefined, 'Rate limit exceeded');
 */
export function useApiCallReport(integrationId: IntegrationId) {
  const { reportStatus } = useIntegrationStatus();
  return useCallback(
    (state: IntegrationState, latencyMs?: number, errorMsg?: string) => {
      reportStatus(integrationId, state, latencyMs, errorMsg);
    },
    [integrationId, reportStatus],
  );
}
