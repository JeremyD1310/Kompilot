import { useQuery } from '@tanstack/react-query';
import { blink } from '../blink/client';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

interface EngagementKPI {
  value: number;
  change: number;
}

export interface EngagementData {
  kpis: {
    totalShares: EngagementKPI;
    totalComments: EngagementKPI;
    totalClicks: EngagementKPI;
    totalImpressions: EngagementKPI;
    totalReach: EngagementKPI;
    avgEngagementRate: EngagementKPI;
    avgCtr: EngagementKPI;
  };
  trend: Array<{
    date: string;
    shares: number;
    comments: number;
    clicks: number;
    impressions: number;
    reach: number;
    engagementRate: number;
    ctr: number;
  }>;
  platformBreakdown: Array<{
    platform: string;
    shares: number;
    comments: number;
    clicks: number;
    impressions: number;
    reach: number;
    engagementRate: number;
    ctr: number;
  }>;
  campaigns: Array<{
    campaign: string;
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    totalPosts: number;
    totalImpressions: number;
    totalReach: number;
    totalClicks: number;
    totalShares: number;
    totalComments: number;
    avgEngagementRate: number;
    avgCtr: number;
  }>;
  weeklyComparison: {
    current: { shares: number; comments: number; clicks: number; impressions: number; reach: number };
    previous: { shares: number; comments: number; clicks: number; impressions: number; reach: number };
    changes: { shares: number; comments: number; clicks: number; impressions: number; reach: number };
  };
  monthlyComparison: {
    current: { shares: number; comments: number; clicks: number; impressions: number; reach: number };
    previous: { shares: number; comments: number; clicks: number; impressions: number; reach: number };
    changes: { shares: number; comments: number; clicks: number; impressions: number; reach: number };
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function mkKPI(v = 0, c = 0): EngagementKPI { return { value: v, change: c }; }
const EMPTY_SNAPSHOT = { shares: 0, comments: 0, clicks: 0, impressions: 0, reach: 0 };

function emptyEngagementData(): EngagementData {
  return {
    kpis: {
      totalShares: mkKPI(),
      totalComments: mkKPI(),
      totalClicks: mkKPI(),
      totalImpressions: mkKPI(),
      totalReach: mkKPI(),
      avgEngagementRate: mkKPI(),
      avgCtr: mkKPI(),
    },
    trend: [],
    platformBreakdown: [],
    campaigns: [],
    weeklyComparison: { current: EMPTY_SNAPSHOT, previous: EMPTY_SNAPSHOT, changes: EMPTY_SNAPSHOT },
    monthlyComparison: { current: EMPTY_SNAPSHOT, previous: EMPTY_SNAPSHOT, changes: EMPTY_SNAPSHOT },
  };
}

export function useEngagementData(days = 30) {
  return useQuery({
    queryKey: ['engagement-data', days],
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async (): Promise<EngagementData> => {
      const token = await blink.auth.getValidToken().catch(() => null);
      if (!token) return emptyEngagementData();

      const res = await fetch(`${BACKEND_URL}/api/analytics/dashboard?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return emptyEngagementData();

      const json = await res.json();
      const engagement = json?.engagement ?? json?.data?.engagement;

      if (!engagement) return emptyEngagementData();

      // Ensure all nested structures exist with safe defaults
      return {
        kpis: {
          totalShares: engagement.kpis?.totalShares ?? mkKPI(),
          totalComments: engagement.kpis?.totalComments ?? mkKPI(),
          totalClicks: engagement.kpis?.totalClicks ?? mkKPI(),
          totalImpressions: engagement.kpis?.totalImpressions ?? mkKPI(),
          totalReach: engagement.kpis?.totalReach ?? mkKPI(),
          avgEngagementRate: engagement.kpis?.avgEngagementRate ?? mkKPI(),
          avgCtr: engagement.kpis?.avgCtr ?? mkKPI(),
        },
        trend: Array.isArray(engagement.trend) ? engagement.trend : [],
        platformBreakdown: Array.isArray(engagement.platformBreakdown) ? engagement.platformBreakdown : [],
        campaigns: Array.isArray(engagement.campaigns) ? engagement.campaigns : [],
        weeklyComparison: engagement.weeklyComparison ?? emptyEngagementData().weeklyComparison,
        monthlyComparison: engagement.monthlyComparison ?? emptyEngagementData().monthlyComparison,
      };
    },
  });
}
