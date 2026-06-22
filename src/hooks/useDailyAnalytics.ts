/**
 * useDailyAnalytics — suivi quotidien des métriques d'établissement
 *
 * - Lit les snapshots quotidiens depuis la DB (30 derniers jours par défaut)
 * - Expose delta Before/After vs scan initial
 * - Mutation pour upsert du snapshot du jour via le backend
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '../blink/client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://gbrhsehk.backend.blink.new';

export interface DailySnapshot {
  id: string;
  establishmentId: string;
  userId: string;
  snapshotDate: string;
  geoScore: number;
  unhandledReviews: number;
  postsPublished: number;
  reviewsHandled: number;
  smsSent: number;
  localVisibility: number;
  missingKeywords: string[];
  noshowRevenueCents: number;
  extendedData: Record<string, unknown>;
}

export interface DailyAnalyticsSummary {
  snapshots: DailySnapshot[];
  latest: DailySnapshot | null;
  totals: {
    smsSent: number;
    reviewsHandled: number;
    postsPublished: number;
    noshowRevenueEur: number;
  };
  trend: {
    geoScoreDelta7d: number | null;
    geoScoreDelta30d: number | null;
  };
}

interface SnapshotPayload {
  establishment_id: string;
  snapshot_date?: string;
  geo_score?: number;
  unhandled_reviews?: number;
  posts_published?: number;
  reviews_handled?: number;
  sms_sent?: number;
  local_visibility?: number;
  missing_keywords?: string[];
  noshow_revenue_cents?: number;
  extended_data?: Record<string, unknown>;
}

// ── Read: liste les snapshots d'un établissement ──────────────────────────────
export function useDailyAnalytics(establishmentId: string | undefined, days = 30) {
  return useQuery({
    queryKey: ['daily-analytics', establishmentId, days],
    enabled: !!establishmentId,
    staleTime: 5 * 60 * 1000, // 5 min
    queryFn: async (): Promise<DailyAnalyticsSummary> => {
      if (!establishmentId) return emptyResult();

      const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

      const rows = await blink.db.dailyAnalytics.list({
        where: { establishmentId },
        orderBy: { snapshotDate: 'desc' },
        limit: days + 5, // petit buffer
      });

      const filtered = (rows as any[])
        .filter((r) => r.snapshotDate >= since)
        .map(parseRow);

      const latest = filtered[0] ?? null;

      // Totaux cumulés sur la période
      const totals = filtered.reduce(
        (acc, r) => ({
          smsSent: acc.smsSent + r.smsSent,
          reviewsHandled: acc.reviewsHandled + r.reviewsHandled,
          postsPublished: acc.postsPublished + r.postsPublished,
          noshowRevenueEur: acc.noshowRevenueEur + r.noshowRevenueCents / 100,
        }),
        { smsSent: 0, reviewsHandled: 0, postsPublished: 0, noshowRevenueEur: 0 }
      );

      // Tendances GEO : delta 7j et 30j
      const score7dAgo = filtered.find((r) => r.snapshotDate <= getDateOffset(7))?.geoScore ?? null;
      const score30dAgo = filtered.find((r) => r.snapshotDate <= getDateOffset(30))?.geoScore ?? null;
      const currentScore = latest?.geoScore ?? null;

      return {
        snapshots: filtered,
        latest,
        totals: {
          ...totals,
          noshowRevenueEur: Math.round(totals.noshowRevenueEur * 100) / 100,
        },
        trend: {
          geoScoreDelta7d: currentScore !== null && score7dAgo !== null ? currentScore - score7dAgo : null,
          geoScoreDelta30d: currentScore !== null && score30dAgo !== null ? currentScore - score30dAgo : null,
        },
      };
    },
  });
}

// ── Write: upsert du snapshot quotidien ──────────────────────────────────────
export function useRecordDailySnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SnapshotPayload) => {
      const token = await blink.auth.getValidToken().catch(() => null);
      if (!token) throw new Error('SESSION_EXPIRED');
      const res = await fetch(`${BACKEND_URL}/api/analytics/daily-snapshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Daily snapshot failed: ${res.status}`);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['daily-analytics', variables.establishment_id],
      });
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseRow(r: any): DailySnapshot {
  return {
    id: r.id,
    establishmentId: r.establishmentId,
    userId: r.userId,
    snapshotDate: r.snapshotDate,
    geoScore: Number(r.geoScore),
    unhandledReviews: Number(r.unhandledReviews),
    postsPublished: Number(r.postsPublished),
    reviewsHandled: Number(r.reviewsHandled),
    smsSent: Number(r.smsSent),
    localVisibility: Number(r.localVisibility),
    missingKeywords: JSON.parse(r.missingKeywords || '[]'),
    noshowRevenueCents: Number(r.noshowRevenueCents),
    extendedData: JSON.parse(r.extendedData || '{}'),
  };
}

function getDateOffset(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

function emptyResult(): DailyAnalyticsSummary {
  return {
    snapshots: [],
    latest: null,
    totals: { smsSent: 0, reviewsHandled: 0, postsPublished: 0, noshowRevenueEur: 0 },
    trend: { geoScoreDelta7d: null, geoScoreDelta30d: null },
  };
}
