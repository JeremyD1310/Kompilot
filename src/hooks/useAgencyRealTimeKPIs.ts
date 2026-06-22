/**
 * useAgencyRealTimeKPIs — Aggregated real-time KPIs for all agency sub-accounts.
 * Reads daily_analytics for the last 7 days across every managed establishment.
 * Refreshes every 60 seconds.
 */
import { useQuery } from '@tanstack/react-query';
import { blink } from '../blink/client';

export interface AgencyRealTimeKPIs {
  avgGeoScore: number;
  totalUnhandledReviews: number;
  totalPostsPublished: number;
  totalSmsSent: number;
  /** Number of client_user_ids whose latest geo_score > their earliest in the window */
  clientsImproved: number;
  /** 7-point array for sparklines: daily avg geo_score (oldest → newest) */
  weekTrend: number[];
  /** Per-client snapshot for alerts */
  clientSnapshots: ClientSnapshot[];
  isLoading: boolean;
  isError: boolean;
}

export interface ClientSnapshot {
  userId: string;
  latestGeoScore: number;
  totalUnhandledReviews: number;
  daysSinceLastActivity: number;
}

/** ISO date string for N days ago */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function useAgencyRealTimeKPIs(userId: string | undefined, subAccountUserIds: string[]): AgencyRealTimeKPIs {
  const since = daysAgo(7);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['agency-realtime-kpis', userId, subAccountUserIds.join(',')],
    enabled: !!userId && subAccountUserIds.length > 0,
    staleTime: 60_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      // Fetch analytics for all sub-account users in the last 7 days
      const allRows: Array<{
        userId: string;
        snapshotDate: string;
        geoScore: number;
        unhandledReviews: number;
        postsPublished: number;
        smsSent: number;
        reviewsHandled: number;
      }> = [];

      // Batch queries per user (blink.db doesn't support OR across different userId values in a single list)
      await Promise.all(
        subAccountUserIds.map(async (uid) => {
          try {
            const rows = await blink.db.dailyAnalytics.list({
              where: { userId: uid },
              orderBy: { snapshotDate: 'desc' },
              limit: 7,
            });
            for (const row of rows as typeof allRows) {
              if (row.snapshotDate >= since) {
                allRows.push({
                  userId: row.userId,
                  snapshotDate: row.snapshotDate,
                  geoScore: Number(row.geoScore) || 0,
                  unhandledReviews: Number(row.unhandledReviews) || 0,
                  postsPublished: Number(row.postsPublished) || 0,
                  smsSent: Number(row.smsSent) || 0,
                  reviewsHandled: Number(row.reviewsHandled) || 0,
                });
              }
            }
          } catch {
            // Skip failed user — non-fatal
          }
        })
      );

      return allRows;
    },
  });

  if (!data || data.length === 0) {
    return {
      avgGeoScore: 0,
      totalUnhandledReviews: 0,
      totalPostsPublished: 0,
      totalSmsSent: 0,
      clientsImproved: 0,
      weekTrend: [],
      clientSnapshots: [],
      isLoading,
      isError,
    };
  }

  // ── Aggregate totals ────────────────────────────────────────────────────────
  const totalUnhandledReviews = data.reduce((s, r) => s + r.unhandledReviews, 0);
  const totalPostsPublished = data.reduce((s, r) => s + r.postsPublished, 0);
  const totalSmsSent = data.reduce((s, r) => s + r.smsSent, 0);

  // avgGeoScore: mean of the most-recent row per user
  const latestPerUser = new Map<string, (typeof data)[0]>();
  for (const row of data) {
    const existing = latestPerUser.get(row.userId);
    if (!existing || row.snapshotDate > existing.snapshotDate) {
      latestPerUser.set(row.userId, row);
    }
  }
  const latestScores = Array.from(latestPerUser.values()).map(r => r.geoScore);
  const avgGeoScore = latestScores.length > 0
    ? Math.round(latestScores.reduce((a, b) => a + b, 0) / latestScores.length)
    : 0;

  // clientsImproved: users where latest score > earliest score
  const earliestPerUser = new Map<string, (typeof data)[0]>();
  for (const row of data) {
    const existing = earliestPerUser.get(row.userId);
    if (!existing || row.snapshotDate < existing.snapshotDate) {
      earliestPerUser.set(row.userId, row);
    }
  }
  let clientsImproved = 0;
  for (const [uid, latest] of latestPerUser) {
    const earliest = earliestPerUser.get(uid);
    if (earliest && latest.geoScore > earliest.geoScore) clientsImproved++;
  }

  // ── 7-day sparkline: average geo_score per day ─────────────────────────────
  const byDay = new Map<string, number[]>();
  for (let i = 6; i >= 0; i--) {
    byDay.set(daysAgo(i), []);
  }
  for (const row of data) {
    const bucket = byDay.get(row.snapshotDate);
    if (bucket) bucket.push(row.geoScore);
  }
  const weekTrend = Array.from(byDay.values()).map(scores =>
    scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  );

  // ── Per-client snapshots for alerts ────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const clientSnapshots: ClientSnapshot[] = Array.from(latestPerUser.entries()).map(([uid, latest]) => {
    const lastDate = latest.snapshotDate;
    const diffMs = new Date(today).getTime() - new Date(lastDate).getTime();
    const daysSinceLastActivity = Math.floor(diffMs / 86_400_000);
    return {
      userId: uid,
      latestGeoScore: latest.geoScore,
      totalUnhandledReviews: latest.unhandledReviews,
      daysSinceLastActivity,
    };
  });

  return {
    avgGeoScore,
    totalUnhandledReviews,
    totalPostsPublished,
    totalSmsSent,
    clientsImproved,
    weekTrend,
    clientSnapshots,
    isLoading,
    isError,
  };
}
