/**
 * PostPerformanceData — mock data and types for post performance tracking.
 * In production, replace with real API calls to platform analytics endpoints.
 */

export interface PostPerformanceMetrics {
  id: string;
  postId: string;
  title: string;
  channel: 'instagram' | 'facebook' | 'linkedin' | 'google_business' | 'tiktok' | 'website';
  publishedAt: string;
  status: 'published' | 'scheduled' | 'draft';
  // Core metrics
  reach: number;
  impressions: number;
  engagement: number;      // likes + comments + shares
  clicks: number;
  saves: number;
  shares: number;
  comments: number;
  likes: number;
  // Computed
  engagementRate: number;  // engagement / reach * 100
  ctr: number;             // clicks / impressions * 100
  thumbnail?: string;
}

export interface ChannelSummary {
  channel: string;
  totalReach: number;
  totalEngagement: number;
  totalClicks: number;
  avgEngagementRate: number;
  postCount: number;
}

export interface WeeklyTrend {
  week: string;
  reach: number;
  engagement: number;
  clicks: number;
}

// ── Mock data generator ───────────────────────────────────────────────────────
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const CHANNELS: PostPerformanceMetrics['channel'][] = [
  'instagram', 'facebook', 'linkedin', 'google_business', 'tiktok',
];

const POST_TITLES = [
  '🌸 Lancement offre Printemps — -30% sur toute la gamme',
  '5 astuces pour booster votre visibilité locale 💡',
  'Nos clients parlent de nous ⭐⭐⭐⭐⭐',
  '🗺️ Optimiser votre fiche Google My Business',
  'Derrière les coulisses de notre atelier 📸',
  '🎓 Webinaire GRATUIT : Digitaliser votre TPE',
  'Votre présence en ligne mérite mieux 🚀',
  'Recette du jour : fidéliser vos clients locaux 🤝',
  '✨ Nouvelle fonctionnalité — gestion multi-établissements',
  'Les 3 erreurs fatales sur les réseaux sociaux ❌',
  '🎁 Flash-promo ce weekend uniquement !',
  '🎙️ Podcast — Restaurant qui a doublé ses réservations',
  '💬 Notre service phare du mois',
  '📈 +42% de portée LinkedIn ce mois-ci',
  '🙏 Retour sur notre événement local',
];

const EMOJIS = ['📸', '🍽️', '💇‍♀️', '🔧', '🦷', '🥐', '🏆', '🎯', '🌟', '💼'];

export function generateMockPerformance(seed = 42): PostPerformanceMetrics[] {
  // Use a deterministic-ish approach so numbers look stable
  const posts: PostPerformanceMetrics[] = [];
  const now = Date.now();
  const DAY = 86400000;

  for (let i = 0; i < 15; i++) {
    const channel = CHANNELS[i % CHANNELS.length];
    const daysAgo = i * 2 + 1;
    const publishedAt = new Date(now - daysAgo * DAY).toISOString();

    // Channel-specific reach multipliers
    const multiplier =
      channel === 'instagram' ? 1.4 :
      channel === 'facebook' ? 1.1 :
      channel === 'linkedin' ? 0.8 :
      channel === 'tiktok' ? 2.2 : 0.6;

    const reach = Math.floor(rand(800, 4200) * multiplier);
    const impressions = Math.floor(reach * rand(12, 22) / 10);
    const likes = Math.floor(reach * rand(4, 12) / 100);
    const comments = Math.floor(likes * rand(5, 20) / 100);
    const shares = Math.floor(likes * rand(8, 18) / 100);
    const saves = channel === 'instagram' ? Math.floor(likes * rand(15, 30) / 100) : 0;
    const engagement = likes + comments + shares + saves;
    const clicks = Math.floor(impressions * rand(2, 8) / 100);
    const engagementRate = parseFloat(((engagement / reach) * 100).toFixed(2));
    const ctr = parseFloat(((clicks / impressions) * 100).toFixed(2));

    posts.push({
      id: `perf_${i}`,
      postId: `post_${i}`,
      title: POST_TITLES[i % POST_TITLES.length],
      channel,
      publishedAt,
      status: i < 12 ? 'published' : i < 14 ? 'scheduled' : 'draft',
      reach, impressions, engagement, clicks, saves, shares, comments, likes,
      engagementRate, ctr,
      thumbnail: `https://images.unsplash.com/photo-${1400000000000 + i * 11111111}?w=80&q=60`,
    });
  }
  return posts;
}

export function getChannelSummaries(posts: PostPerformanceMetrics[]): ChannelSummary[] {
  const map = new Map<string, ChannelSummary>();
  for (const p of posts.filter(p => p.status === 'published')) {
    if (!map.has(p.channel)) {
      map.set(p.channel, { channel: p.channel, totalReach: 0, totalEngagement: 0, totalClicks: 0, avgEngagementRate: 0, postCount: 0 });
    }
    const s = map.get(p.channel)!;
    s.totalReach += p.reach;
    s.totalEngagement += p.engagement;
    s.totalClicks += p.clicks;
    s.postCount += 1;
  }
  return Array.from(map.values()).map(s => ({
    ...s,
    avgEngagementRate: parseFloat(((s.totalEngagement / s.totalReach) * 100).toFixed(2)),
  })).sort((a, b) => b.totalReach - a.totalReach);
}

export function getWeeklyTrends(posts: PostPerformanceMetrics[]): WeeklyTrend[] {
  const weeks: WeeklyTrend[] = [];
  const now = Date.now();
  const DAY = 86400000;
  const WEEK = DAY * 7;

  for (let w = 5; w >= 0; w--) {
    const weekStart = now - (w + 1) * WEEK;
    const weekEnd = now - w * WEEK;
    const weekPosts = posts.filter(p => {
      const t = new Date(p.publishedAt).getTime();
      return t >= weekStart && t < weekEnd && p.status === 'published';
    });
    const date = new Date(weekEnd);
    weeks.push({
      week: `S${6 - w} (${date.getDate()}/${date.getMonth() + 1})`,
      reach: weekPosts.reduce((s, p) => s + p.reach, 0),
      engagement: weekPosts.reduce((s, p) => s + p.engagement, 0),
      clicks: weekPosts.reduce((s, p) => s + p.clicks, 0),
    });
  }
  return weeks;
}

export const CHANNEL_META: Record<string, { label: string; color: string; bg: string }> = {
  instagram: { label: 'Instagram', color: '#E1306C', bg: 'rgba(225,48,108,.12)' },
  facebook:  { label: 'Facebook',  color: '#1877F2', bg: 'rgba(24,119,242,.12)' },
  linkedin:  { label: 'LinkedIn',  color: '#0A66C2', bg: 'rgba(10,102,194,.12)' },
  google_business: { label: 'Google', color: '#EA4335', bg: 'rgba(234,67,53,.12)' },
  tiktok:    { label: 'TikTok',    color: '#111',    bg: 'rgba(0,0,0,.08)' },
  website:   { label: 'Site web',  color: '#0D9488', bg: 'rgba(13,148,136,.12)' },
};

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
