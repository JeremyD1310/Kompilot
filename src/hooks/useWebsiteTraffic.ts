import { useQuery } from '@tanstack/react-query';
import { blink } from '../blink/client';
import { useAuth } from './useAuth';
import { BACKEND_URL } from '../lib/backend';

export interface WebsiteTrafficDaily {
  date: string;
  sessions: number;
  activeUsers: number;
  pageViews: number;
  conversions: number;
  engagementRate: number;
}

export interface WebsiteTrafficSummary {
  totalSessions: number;
  totalActiveUsers: number;
  totalPageViews: number;
  totalConversions: number;
  conversionRate: number;
  avgEngagementRate: number;
  dailyBreakdown: WebsiteTrafficDaily[];
  dateRange: { startDate: string; endDate: string };
  fetchedAt: string;
}

export function useWebsiteTraffic(enabled = true) {
  const { user } = useAuth();
  return useQuery<WebsiteTrafficSummary>({
    queryKey: ['website-traffic', user?.id, 7],
    enabled: enabled && !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const token = await blink.auth.getValidToken();
      const end = new Date();
      const start = new Date(Date.now() - 6 * 86400000);
      const date = (value: Date) => value.toISOString().slice(0, 10);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15_000);
      let response: Response;
      try {
        response = await fetch(`${BACKEND_URL}/api/ga4/site-traffic?startDate=${date(start)}&endDate=${date(end)}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeout);
      }
      const body = await response.json().catch(() => ({})) as { error?: string } & WebsiteTrafficSummary;
      if (!response.ok) throw new Error(body.error || 'Les statistiques GA4 sont indisponibles.');
      return body;
    },
  });
}
