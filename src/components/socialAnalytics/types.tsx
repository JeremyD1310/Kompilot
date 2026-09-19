/**
 * Shared types, constants, format helpers, and motion variants
 * for Social Analytics components.
 */
import { motion } from 'framer-motion';
import type { TiktokVideoMetric, InstagramReelMetric } from '@/hooks/useSocialPublish';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

// ── Platform config ──────────────────────────────────────────────────────────

export const PLATFORMS = {
  facebook:       { label: 'Facebook',       color: '#1877F2', icon: '📘' },
  instagram:      { label: 'Instagram',       color: '#E4405F', icon: '📸' },
  linkedin:       { label: 'LinkedIn',        color: '#0A66C2', icon: '💼' },
  tiktok:         { label: 'TikTok',          color: '#69C9D0', icon: '🎵' },
  google_business:{ label: 'Google Business', color: '#4285F4', icon: '📍' },
  youtube:        { label: 'YouTube',         color: '#FF0000', icon: '📺' },
} as const;

export type PlatformKey = keyof typeof PLATFORMS;

// ── Types ────────────────────────────────────────────────────────────────────

export interface PlatformStats {
  platform: string;
  postCount: number;
  totalImpressions: number;
  totalClicks: number;
  totalShares: number;
  totalComments: number;
  totalReach: number;
  avgEngagementRate: number;
}

export interface DailyTrend {
  date: string;
  posts: number;
  impressions: number;
  clicks: number;
  engagement: number;
}

export interface TopPost {
  id: string;
  textContent: string;
  channels: string;
  impressions: number;
  clicks: number;
  shares: number;
  comments: number;
  engagementRate: number;
  scheduledAt: string;
  status: string;
}

export interface AnalyticsOverview {
  summary: {
    totalPosts: number;
    publishedPosts: number;
    scheduledPosts: number;
    totalImpressions: number;
    totalClicks: number;
    totalShares: number;
    totalComments: number;
    avgEngagementRate: number;
  };
  platformBreakdown: PlatformStats[];
  postsTrend: DailyTrend[];
  topPosts: TopPost[];
}

export interface ComparisonData {
  current: { totalPosts: number; totalImpressions: number; totalClicks: number; totalShares: number; totalComments: number; avgEngagementRate: number };
  previous: { totalPosts: number; totalImpressions: number; totalClicks: number; totalShares: number; totalComments: number; avgEngagementRate: number };
}

export interface UnifiedRow {
  id: string;
  platform: PlatformKey;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  date: Date;
  permalink?: string;
}

// ── Sort / filter types ──────────────────────────────────────────────────────

export type SortKey = 'views' | 'likes' | 'comments' | 'shares' | 'date';
export type PostTypeFilter = 'all' | 'viral' | 'high_engagement' | 'recent';
export type UnifiedSortKey = 'views' | 'likes' | 'comments' | 'engagement' | 'date';

// ── Motion variants ──────────────────────────────────────────────────────────

export const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export const sectionFade = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// ── Format helpers ───────────────────────────────────────────────────────────

export function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('fr-FR');
}

export function fmtPct(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

// ── Trend indicator ──────────────────────────────────────────────────────────

export function TrendBadge({ current, previous, label }: { current: number; previous: number; label?: string }) {
  if (previous === 0 && current === 0) return null;
  const pct = previous === 0 ? 100 : ((current - previous) / previous) * 100;
  const isUp = pct >= 0;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full',
      isUp ? 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/15' : 'text-red-500 bg-red-500/10 dark:text-red-400 dark:bg-red-500/15'
    )}>
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isUp ? '+' : ''}{pct.toFixed(1)}%
      {label && <span className="text-muted-foreground ml-0.5">{label}</span>}
    </span>
  );
}

// ── Unified row builder ──────────────────────────────────────────────────────

export function buildUnifiedRows(
  tiktokData?: { videos: TiktokVideoMetric[]; total: number },
  reelsData?: { reels: InstagramReelMetric[]; total: number },
  topPostsData: TopPost[] = [],
): UnifiedRow[] {
  const rows: UnifiedRow[] = [];

  if (tiktokData?.videos) {
    for (const v of tiktokData.videos) {
      const totalEng = v.likes + v.comments + v.shares;
      rows.push({
        id: `tt-${v.videoId}`,
        platform: 'tiktok',
        title: v.title || 'Vidéo TikTok',
        views: v.views,
        likes: v.likes,
        comments: v.comments,
        shares: v.shares,
        engagementRate: v.views > 0 ? (totalEng / v.views) * 100 : 0,
        date: new Date(v.createTime * 1000),
      });
    }
  }

  if (reelsData?.reels) {
    for (const r of reelsData.reels) {
      const totalEng = r.likes + r.comments;
      rows.push({
        id: `ig-${r.id}`,
        platform: 'instagram',
        title: r.caption || 'Reel Instagram',
        views: r.views,
        likes: r.likes,
        comments: r.comments,
        shares: 0,
        engagementRate: r.views > 0 ? (totalEng / r.views) * 100 : 0,
        date: new Date(r.timestamp),
        permalink: r.permalink,
      });
    }
  }

  for (const p of topPostsData) {
    let channels: string[] = [];
    try { channels = JSON.parse(p.channels || '[]'); } catch { channels = []; }
    const primaryPlatform = channels.find(c => c !== 'website') || 'facebook';
    if (primaryPlatform === 'tiktok' || primaryPlatform === 'instagram') continue;
    rows.push({
      id: `post-${p.id}`,
      platform: primaryPlatform as PlatformKey,
      title: p.textContent || 'Post',
      views: p.impressions,
      likes: 0,
      comments: p.comments,
      shares: p.shares,
      engagementRate: p.engagementRate,
      date: new Date(p.scheduledAt),
    });
  }

  return rows;
}
