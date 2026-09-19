import { BACKEND_URL as KOMPILOT_BACKEND_URL } from '@/lib/backend';
/**
 * useCampaignHealth — React Query hook for the Campaign Health KPI widget.
 *
 * Fetches per-platform reconciliation data (Meta + TikTok) from the
 * /api/campaign-health backend endpoint. Uses existing OAuth status hooks
 * to determine connection state before fetching health data.
 */
import { useQuery } from '@tanstack/react-query';
import { blink } from '@/blink/client';
import { useMetaStatus, useTiktokStatus } from './useSocialPublish';

const BACKEND_URL = KOMPILOT_BACKEND_URL;

export interface PlatformHealth {
  connected: boolean;
  matchRate: number | null;      // 0–1
  spend: number;                 // EUR
  attributedRevenue: number;     // EUR
  conversionCount: number;
  matchedConversions: number;
  lastSync: string | null;
  alertGap: number | null;
  alertSeverity: 'ok' | 'warning' | 'critical';
}

export interface CampaignHealthData {
  meta: PlatformHealth;
  tiktok: PlatformHealth;
  overallMatchRate: number | null;
}

async function fetchCampaignHealth(): Promise<CampaignHealthData> {
  const token = await blink.auth.getValidToken();
  const res = await fetch(`${BACKEND_URL}/api/campaign-health`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err.error || 'Failed to fetch campaign health');
  }
  return res.json();
}

export function useCampaignHealth() {
  // Check connection status for both platforms
  const { data: metaStatus, isLoading: metaLoading } = useMetaStatus(true);
  const { data: tiktokStatus, isLoading: tiktokLoading } = useTiktokStatus(true);

  const isMetaConnected = metaStatus?.connected ?? false;
  const isTiktokConnected = tiktokStatus?.connected ?? false;
  const anyConnected = isMetaConnected || isTiktokConnected;
  const connectionLoading = metaLoading || tiktokLoading;

  // Only fetch health data if at least one platform is connected
  const healthQuery = useQuery<CampaignHealthData>({
    queryKey: ['campaign-health'],
    queryFn: fetchCampaignHealth,
    enabled: anyConnected && !connectionLoading,
    staleTime: 60_000,          // 1 min cache
    refetchInterval: 300_000,   // refresh every 5 min
    retry: 1,
  });

  return {
    // Connection state
    isMetaConnected,
    isTiktokConnected,
    anyConnected,
    connectionLoading,

    // Health data
    healthData: healthQuery.data ?? null,
    healthLoading: healthQuery.isLoading,
    healthError: healthQuery.error instanceof Error ? healthQuery.error.message : null,

    // Derived
    hasData: anyConnected && !!healthQuery.data,
    isSyncing: anyConnected && healthQuery.isFetching && !healthQuery.data,
  };
}
