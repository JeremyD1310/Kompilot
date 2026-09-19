import { BACKEND_URL as KOMPILOT_BACKEND_URL } from '@/lib/backend';
/**
 * useWeeklyAIOReport — Displays a weekly AIO performance summary in the dashboard.
 *
 * This hook fetches the latest weekly report data from the backend
 * and returns a formatted summary to display as a notification or widget.
 *
 * The report includes:
 *   - AIO visibility score trend (up/down vs last week)
 *   - Number of AI citations detected
 *   - Top recommended action for the week
 *   - Comparison with sector average
 *
 * Usage:
 *   const { report, isLoading, hasNewReport } = useWeeklyAIOReport();
 *   if (hasNewReport) <WeeklyAIOBanner report={report} />
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { blink } from '../blink/client';

const BACKEND_URL = KOMPILOT_BACKEND_URL;

export interface WeeklyAIOReport {
  weekOf: string;
  aioScore: number;
  aioScoreDelta: number;
  citationsDetected: number;
  topRecommendation: string;
  sectorAverage: number;
  invisibleKeywords: string[];
  visibleKeywords: string[];
}

async function fetchWeeklyReport(token: string): Promise<WeeklyAIOReport | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/weekly-report/latest`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function useWeeklyAIOReport() {
  const { user } = useAuth();

  const {
    data: report,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['weekly-aio-report', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const token = await blink.auth.getValidToken();
        return await fetchWeeklyReport(token);
      } catch {
        return null;
      }
    },
    enabled: !!user?.id,
    staleTime: 60 * 60 * 1000, // 1 hour — report doesn't change frequently
    retry: 1,
  });

  const hasNewReport = !!report && !isError;

  return {
    report,
    isLoading,
    hasNewReport,
    isError,
  };
}
