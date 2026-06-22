/**
 * analyticsApi — typed client for the Kompilot analytics backend.
 * Fetches real Meta Insights + GMB data, falls back to mock on error/unconfigured.
 */
import { generateMockPerformance, type PostPerformanceMetrics } from '../components/dashboard/PostPerformanceData';

const BACKEND = 'https://gbrhsehk.backend.blink.new';

export interface MetaInsightDay {
  date: string;
  reach: number;
  impressions: number;
  engagement: number;
  clicks: number;
}

export interface MetaResponse {
  source: 'meta';
  connected: boolean;
  message?: string;
  since?: string;
  until?: string;
  data: MetaInsightDay[];
}

export interface GmbSummary {
  QUERIES_DIRECT?: number;
  QUERIES_INDIRECT?: number;
  VIEWS_MAPS?: number;
  VIEWS_SEARCH?: number;
  ACTIONS_WEBSITE?: number;
  ACTIONS_PHONE?: number;
  ACTIONS_DRIVING_DIRECTIONS?: number;
}

export interface GmbResponse {
  source: 'gmb';
  connected: boolean;
  message?: string;
  since?: string;
  until?: string;
  data: GmbSummary;
  locations?: any[];
}

export interface CombinedAnalytics {
  since: string;
  until: string;
  meta: MetaResponse;
  gmb: GmbResponse;
  /** Normalised unified list for charts / tables */
  posts: PostPerformanceMetrics[];
  dataSource: 'live' | 'mock';
}

// ── Convert Meta daily data into PostPerformanceMetrics entries ───────────────
function metaToPostMetrics(meta: MetaResponse): PostPerformanceMetrics[] {
  if (!meta.connected || !meta.data?.length) return [];
  return meta.data.map((day, i) => {
    const engagement = day.engagement;
    const reach = day.reach || 1;
    const impressions = day.impressions || reach;
    const likes = Math.round(engagement * 0.7);
    const comments = Math.round(engagement * 0.2);
    const shares = Math.round(engagement * 0.1);
    return {
      id: `meta_${i}`,
      postId: `meta_day_${day.date}`,
      title: `Activité Facebook/Instagram — ${day.date}`,
      channel: 'facebook' as const,
      publishedAt: `${day.date}T12:00:00Z`,
      status: 'published' as const,
      reach,
      impressions,
      engagement,
      clicks: day.clicks,
      saves: 0,
      shares,
      comments,
      likes,
      engagementRate: parseFloat(((engagement / reach) * 100).toFixed(2)),
      ctr: impressions > 0 ? parseFloat(((day.clicks / impressions) * 100).toFixed(2)) : 0,
    };
  });
}

// ── Convert GMB summary into a single PostPerformanceMetrics entry ────────────
function gmbToPostMetrics(gmb: GmbResponse): PostPerformanceMetrics[] {
  if (!gmb.connected || !gmb.data) return [];
  const d = gmb.data;
  const reach = (d.VIEWS_MAPS ?? 0) + (d.VIEWS_SEARCH ?? 0);
  const clicks = (d.ACTIONS_WEBSITE ?? 0) + (d.ACTIONS_PHONE ?? 0) + (d.ACTIONS_DRIVING_DIRECTIONS ?? 0);
  const engagement = (d.QUERIES_DIRECT ?? 0) + (d.QUERIES_INDIRECT ?? 0);
  if (!reach && !clicks && !engagement) return [];
  return [{
    id: 'gmb_summary',
    postId: 'gmb_period',
    title: `Fiche Google My Business — ${gmb.since ?? ''} → ${gmb.until ?? ''}`,
    channel: 'google_business' as const,
    publishedAt: `${gmb.since ?? new Date().toISOString().slice(0, 10)}T12:00:00Z`,
    status: 'published' as const,
    reach: reach || 1,
    impressions: reach,
    engagement,
    clicks,
    saves: 0,
    shares: 0,
    comments: 0,
    likes: 0,
    engagementRate: reach > 0 ? parseFloat(((engagement / reach) * 100).toFixed(2)) : 0,
    ctr: reach > 0 ? parseFloat(((clicks / reach) * 100).toFixed(2)) : 0,
  }];
}

// ── Main fetch function ───────────────────────────────────────────────────────
export async function fetchCombinedAnalytics(
  since?: string,
  until?: string,
  token?: string,
): Promise<CombinedAnalytics> {
  const params = new URLSearchParams();
  if (since) params.set('since', since);
  if (until) params.set('until', until);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let combined: any;
  try {
    const res = await fetch(`${BACKEND}/api/analytics/combined?${params}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    combined = await res.json();
  } catch {
    // Backend unreachable or secrets not configured — fall back to mock
    const mock = generateMockPerformance();
    return {
      since: since ?? '',
      until: until ?? '',
      meta: { source: 'meta', connected: false, data: [] },
      gmb:  { source: 'gmb',  connected: false, data: {} },
      posts: mock,
      dataSource: 'mock',
    };
  }

  const meta: MetaResponse = combined.meta ?? { source: 'meta', connected: false, data: [] };
  const gmb:  GmbResponse  = combined.gmb  ?? { source: 'gmb',  connected: false, data: {} };

  // Build normalised post metrics from live data
  const livePosts = [
    ...metaToPostMetrics(meta),
    ...gmbToPostMetrics(gmb),
  ];

  // If neither platform is connected, return mock data
  const isLive = meta.connected || gmb.connected;
  const posts = isLive && livePosts.length > 0 ? livePosts : generateMockPerformance();

  return {
    since: combined.since ?? since ?? '',
    until: combined.until ?? until ?? '',
    meta,
    gmb,
    posts,
    dataSource: isLive && livePosts.length > 0 ? 'live' : 'mock',
  };
}

// ── Notify approval → auto-schedule posts ────────────────────────────────────
export async function notifyApproval(
  tokenId: string,
  authToken?: string,
): Promise<{ promoted: number; total: number; errors: string[] }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${BACKEND}/api/analytics/approval/notify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tokenId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<{ promoted: number; total: number; errors: string[] }>;
}
