import { useQuery } from '@tanstack/react-query';
import { blink } from '../blink/client';
import { useAuth } from './useAuth';

export interface PostEngagementMetric {
  id: string;
  postId: string;
  userId: string;
  platform: string;
  shares: number | string;
  comments: number | string;
  clicks: number | string;
  impressions: number | string;
  reach: number | string;
  engagementRate: number | string;
  ctr: number | string;
  recordedAt: string;
}

export interface PerformancePost {
  postId: string;
  platform: string;
  impressions: number;
  reach: number;
  clicks: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

export interface PerformanceSummary {
  posts: number;
  impressions: number;
  reach: number;
  clicks: number;
  comments: number;
  shares: number;
  engagementRate: number;
  ctr: number;
  byPlatform: Array<{ platform: string; posts: number; engagementRate: number; reach: number }>;
}

const numberValue = (value: number | string | null | undefined) => Number(value ?? 0) || 0;

export function summarizePerformance(rows: PostEngagementMetric[]): PerformanceSummary {
  const byPlatform = new Map<string, { posts: number; engagementRate: number; reach: number }>();
  const totals = rows.reduce((acc, row) => {
    const platform = row.platform || 'Autre';
    const existing = byPlatform.get(platform) ?? { posts: 0, engagementRate: 0, reach: 0 };
    existing.posts += 1;
    existing.engagementRate += numberValue(row.engagementRate);
    existing.reach += numberValue(row.reach);
    byPlatform.set(platform, existing);
    return {
      impressions: acc.impressions + numberValue(row.impressions),
      reach: acc.reach + numberValue(row.reach),
      clicks: acc.clicks + numberValue(row.clicks),
      comments: acc.comments + numberValue(row.comments),
      shares: acc.shares + numberValue(row.shares),
      engagementRate: acc.engagementRate + numberValue(row.engagementRate),
      ctr: acc.ctr + numberValue(row.ctr),
    };
  }, { impressions: 0, reach: 0, clicks: 0, comments: 0, shares: 0, engagementRate: 0, ctr: 0 });

  return {
    posts: rows.length,
    ...totals,
    engagementRate: rows.length ? totals.engagementRate / rows.length : 0,
    ctr: rows.length ? totals.ctr / rows.length : 0,
    byPlatform: [...byPlatform.entries()].map(([platform, value]) => ({
      platform,
      posts: value.posts,
      reach: value.reach,
      engagementRate: value.posts ? value.engagementRate / value.posts : 0,
    })).sort((a, b) => b.engagementRate - a.engagementRate),
  };
}

export function summarizePosts(rows: PostEngagementMetric[]): PerformancePost[] {
  const grouped = new Map<string, PerformancePost>();
  rows.forEach(row => {
    const key = row.postId;
    const existing = grouped.get(key) ?? { postId: key, platform: row.platform || 'Autre', impressions: 0, reach: 0, clicks: 0, comments: 0, shares: 0, engagementRate: 0 };
    existing.impressions += numberValue(row.impressions);
    existing.reach += numberValue(row.reach);
    existing.clicks += numberValue(row.clicks);
    existing.comments += numberValue(row.comments);
    existing.shares += numberValue(row.shares);
    existing.engagementRate = numberValue(row.engagementRate);
    grouped.set(key, existing);
  });
  return [...grouped.values()].sort((a, b) => b.engagementRate - a.engagementRate);
}

export function usePostPerformance() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['post-performance', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as PostEngagementMetric[];
      const rows = await blink.db.table<PostEngagementMetric>('post_engagement_metrics').list({
        where: { userId: user.id },
        orderBy: { recordedAt: 'desc' },
        limit: 200,
      });
      return rows;
    },
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });
}
