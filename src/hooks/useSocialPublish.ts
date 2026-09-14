/**
 * useSocialPublish — Unified React Query hooks for all social platform connections.
 *
 * Provides hooks for:
 *   Meta (Facebook + Instagram): useMetaOAuthConnect, useMetaStatus, useMetaDisconnect
 *   Google Business Profile:     useGbpOAuthConnect, useGbpStatus, useGbpDisconnect
 *   Instagram:                   useInstagramOAuthConnect, useInstagramStatus, useInstagramDisconnect
 *   TikTok:                      useTiktokOAuthConnect, useTiktokStatus, useTiktokDisconnect
 *   TikTok Metrics:              useTiktokMetrics
 *   Instagram Reels Metrics:     useInstagramReelsMetrics
 *   Facebook (standalone):       useFacebookOAuthConnect, useFacebookStatus, useFacebookDisconnect
 *   YouTube:                     useYouTubeOAuthConnect, useYouTubeStatus, useYouTubeDisconnect
 *   Publishing:                  usePublishNow, useSchedulePost, useRetryPost, usePostStatus
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '@/blink/client';

import { BACKEND_URL } from '@/lib/backend';

// ── Helper: authenticated fetch ──────────────────────────────────────────────

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await blink.auth.getValidToken();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      signal: options.signal ?? controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({})) as { error?: string; code?: string; message?: string };
      const error = new Error(errBody.error || errBody.message || `API error: ${res.status}`) as Error & { code?: string };
      error.code = errBody.code;
      throw error;
    }
    return res.json() as Promise<T>;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error(`La requête vers ${path} a dépassé 30 secondes.`, { cause: error });
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface MetaPage { id: string; name: string; category: string; instagram: { id: string; name: string; username: string } | null; }
export interface MetaOAuthStatus {
  connected: boolean;
  status?: string;
  reason?: string;
  expiresAt?: string;
  scopes?: string[];
  pages: MetaPage[];
  accounts?: Array<{
    id: string;
    network: 'facebook' | 'instagram';
    externalId: string;
    name: string;
    username: string;
    profilePictureUrl: string;
    parentPageName: string;
    selected: boolean;
    status: string;
    lastError: string;
  }>;
}
export interface GBPLocation { name: string; title: string; locationName: string; websiteUri: string; accountName?: string; address?: { addressLines?: string[]; locality?: string; }; profile?: { description?: string }; }
export interface GBPOAuthStatus { connected: boolean; reason?: string; expiresAt?: string; accounts: { name: string; accountName: string; type: string }[]; locations: GBPLocation[]; }
export interface GBPReview { name: string; reviewId: string; reviewer?: { displayName?: string }; starRating: string; comment?: string; updateTime: string; reviewReply?: { comment: string }; }
export interface InstagramAccount { pageId: string; pageName: string; igAccountId: string; igUsername: string; igName: string; }
export interface InstagramOAuthStatus { connected: boolean; reason?: string; expiresAt?: string; accounts: InstagramAccount[]; primaryAccount: InstagramAccount | null; }
export interface TiktokUser { openId: string; displayName: string; avatarUrl?: string; }
export interface TiktokOAuthStatus { connected: boolean; reason?: string; expiresAt?: string; user?: TiktokUser; creator?: TiktokUser; }
export interface FacebookPage { id: string; name: string; category: string; }
export interface FacebookOAuthStatus { connected: boolean; reason?: string; expiresAt?: string; pages: FacebookPage[]; }
export interface YouTubeChannel { channelId: string; title: string; thumbnailUrl?: string; subscriberCount?: string; videoCount?: string; }
export interface YouTubeOAuthStatus { connected: boolean; reason?: string; expiresAt?: string; channel?: YouTubeChannel; }
export interface LinkedInOAuthStatus { connected: boolean; reason?: string; profile?: { name?: string; vanityName?: string; id?: string }; }
export interface TiktokVideoMetric { videoId: string; title: string; likes: number; comments: number; shares: number; views: number; createTime: number; }
export interface TiktokConversation {
  id: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  isRead?: boolean;
  messages?: Array<{ id: string; text: string; timestamp?: string; fromMe?: boolean }>;
}

export function useTiktokConversations(enabled = true) {
  return useQuery<{ conversations: TiktokConversation[] }>({
    queryKey: ['tiktok-conversations'],
    queryFn: () => apiFetch('/api/tiktok/messages/conversations'),
    enabled,
    staleTime: 30_000,
    retry: false,
  });
}

export function useTiktokConversation(id: string | null) {
  return useQuery<{ messages: TiktokConversation['messages']; conversationId: string }>({
    queryKey: ['tiktok-conversation', id],
    queryFn: () => apiFetch(`/api/tiktok/messages/${encodeURIComponent(id ?? '')}`),
    enabled: !!id,
    retry: false,
  });
}

export function useSendTiktokMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ toOpenId, messageText, messageId }: { toOpenId: string; messageText: string; messageId?: string }) =>
      apiFetch<{ success: boolean; messageId: string }>('/api/tiktok/messages/send', {
        method: 'POST',
        body: JSON.stringify({ toOpenId, messageText, messageId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tiktok-conversations'] });
      qc.invalidateQueries({ queryKey: ['inbox-messages'] });
      qc.invalidateQueries({ queryKey: ['inbox-replies'] });
    },
  });
}
export interface InstagramReelMetric { id: string; caption: string; likes: number; comments: number; views: number; timestamp: string; permalink: string; thumbnailUrl: string; }
export interface PublishResult { success: boolean; platform: string; postId?: string; postUrl?: string; error?: string; }
export interface PublishResponse { success: boolean; results: PublishResult[]; }
export interface AIInsights { insight: string; detail?: string; recommendations: string[]; generatedAt?: string; }
export function useAIInsights(enabled = true) {
  return useQuery<AIInsights>({
    queryKey: ['ai-insights'],
    queryFn: () => apiFetch<AIInsights>('/api/analytics/ai-insights'),
    enabled,
    staleTime: 300_000,
    retry: false,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// META (Facebook + Instagram)
// ═══════════════════════════════════════════════════════════════════════════════

export function useMetaOAuthConnect() {
  return useMutation({
    mutationFn: () => apiFetch<{ url: string }>('/api/meta/oauth/connect'),
    onSuccess: (data) => { window.location.href = data.url; },
  });
}

export type AdConnectionStatus = {
  connected: boolean;
  status: string;
  expiresAt?: string;
  lastSyncAt?: string | null;
  lastError?: string;
};
export type AdAccount = { id: string; provider: 'meta' | 'google_ads'; externalId: string; name: string; currency: string; status: string; selected: boolean };
export type AdAccountsStatus = { organizationId: string; providers: { meta: AdConnectionStatus; google_ads: AdConnectionStatus }; accounts: AdAccount[] };

export function useAdAccountsStatus(enabled = true) {
  return useQuery<AdAccountsStatus>({ queryKey: ['ad-accounts-status'], queryFn: () => apiFetch('/api/auth/ad-accounts/status'), enabled, staleTime: 30_000, retry: false });
}
export function useAdAccountConnect() {
  return useMutation({ mutationFn: (provider: 'meta' | 'google_ads') => apiFetch<{ url: string }>(`/api/auth/${provider}/connect?returnTo=${encodeURIComponent('/settings?tab=connexions')}`), onSuccess: (data) => { window.location.href = data.url; } });
}
export function useAdAccountDisconnect() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (provider: 'meta' | 'google_ads') => apiFetch<{ success: boolean }>(`/api/auth/ad-accounts/disconnect/${provider}`, { method: 'POST' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['ad-accounts-status'] }) });
}

export function useMetaStatus(enabled = true) {
  return useQuery<MetaOAuthStatus>({
    queryKey: ['meta-status'],
    queryFn: () => apiFetch<MetaOAuthStatus>('/api/meta/oauth/status'),
    enabled, staleTime: 30_000, retry: false,
  });
}

export function useMetaDisconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ success: boolean }>('/api/meta/oauth/disconnect', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meta-status'] }),
  });
}

export function useMetaSelectAccounts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountIds: string[]) =>
      apiFetch<{ success: boolean; accounts: MetaOAuthStatus['accounts'] }>('/api/meta/accounts/select', {
        method: 'POST',
        body: JSON.stringify({ accountIds }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meta-status'] }),
  });
}

export function useMetaDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      apiFetch<{ success: boolean }>(`/api/meta/accounts/${accountId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meta-status'] }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE BUSINESS PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

export function useGbpOAuthConnect() {
  return useMutation({
    mutationFn: () => apiFetch<{ url: string }>('/api/gbp/oauth/connect'),
    onSuccess: (data) => { window.location.href = data.url; },
  });
}

export function useGbpStatus(enabled = true) {
  return useQuery<GBPOAuthStatus>({
    queryKey: ['gbp-status'],
    queryFn: async () => {
      const status = await apiFetch<{ connected: boolean; reason?: string; expiresAt?: string; accounts: { name: string; accountName: string; type: string }[] }>('/api/gbp/oauth/status');
      if (!status.connected) return { ...status, accounts: status.accounts ?? [], locations: [] };
      try {
        const locData = await apiFetch<{ locations: GBPLocation[] }>('/api/gbp/locations');
        return { ...status, locations: locData.locations || [] };
      } catch { return { ...status, locations: [] }; }
    },
    enabled, staleTime: 30_000, retry: false,
  });
}

export function useGbpDisconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ success: boolean }>('/api/gbp/oauth/disconnect', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gbp-status'] }),
  });
}

export function useGbpReviews(locationId: string | null) {
  return useQuery<{ reviews: GBPReview[] }>({
    queryKey: ['gbp-reviews', locationId],
    queryFn: () => apiFetch<{ reviews: GBPReview[] }>(`/api/gbp/reviews/${locationId}`),
    enabled: !!locationId, staleTime: 60_000,
  });
}

export function useGbpReplyToReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ locationId, reviewId, replyText }: { locationId: string; reviewId: string; replyText: string }) =>
      apiFetch<{ success: boolean }>(`/api/gbp/reviews/${locationId}/${reviewId}/reply`, { method: 'POST', body: JSON.stringify({ replyText }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gbp-reviews'] }),
  });
}

export function useGbpCreatePost() {
  return useMutation({
    mutationFn: ({ locationId, summary, imageUrl, callToAction }: { locationId: string; summary: string; imageUrl?: string; callToAction?: { actionType: string; url: string } }) =>
      apiFetch<{ success: boolean; post: unknown }>(`/api/gbp/posts/${locationId}`, { method: 'POST', body: JSON.stringify({ summary, imageUrl, callToAction }) }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTAGRAM (standalone)
// ═══════════════════════════════════════════════════════════════════════════════

export function useInstagramOAuthConnect() {
  return useMutation({
    mutationFn: () => apiFetch<{ url: string }>('/api/instagram/oauth/connect'),
    onSuccess: (data) => { window.location.href = data.url; },
  });
}

export function useInstagramStatus(enabled = true) {
  return useQuery<InstagramOAuthStatus>({
    queryKey: ['instagram-status'],
    queryFn: () => apiFetch<InstagramOAuthStatus>('/api/instagram/oauth/status'),
    enabled, staleTime: 30_000, retry: false,
  });
}

export function useInstagramDisconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ success: boolean }>('/api/instagram/oauth/disconnect', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instagram-status'] }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIKTOK (standalone)
// ═══════════════════════════════════════════════════════════════════════════════

export function useTiktokOAuthConnect() {
  return useMutation({
    mutationFn: () => apiFetch<{ url: string }>('/api/tiktok/oauth/connect'),
    onSuccess: (data) => { window.location.href = data.url; },
  });
}

export function useTiktokStatus(enabled = true) {
  return useQuery<TiktokOAuthStatus>({
    queryKey: ['tiktok-status'],
    queryFn: async () => {
      const status = await apiFetch<TiktokOAuthStatus>('/api/tiktok/oauth/status');
      return status.user || !status.creator ? status : { ...status, user: status.creator };
    },
    enabled, staleTime: 30_000, retry: false,
  });
}

export function useTiktokDisconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ success: boolean }>('/api/tiktok/oauth/disconnect', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tiktok-status'] }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACEBOOK (standalone)
// ═══════════════════════════════════════════════════════════════════════════════

export function useFacebookOAuthConnect() {
  return useMutation({
    mutationFn: () => apiFetch<{ url: string }>('/api/facebook/oauth/connect'),
    onSuccess: (data) => { window.location.href = data.url; },
  });
}

export function useFacebookStatus(enabled = true) {
  return useQuery<FacebookOAuthStatus>({
    queryKey: ['facebook-status'],
    queryFn: () => apiFetch<FacebookOAuthStatus>('/api/facebook/oauth/status'),
    enabled, staleTime: 30_000, retry: false,
  });
}

export function useFacebookDisconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ success: boolean }>('/api/facebook/oauth/disconnect', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facebook-status'] }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// YOUTUBE
// ═══════════════════════════════════════════════════════════════════════════════

export function useYouTubeOAuthConnect() {
  return useMutation({
    mutationFn: () => apiFetch<{ url: string }>('/api/youtube/oauth/connect'),
    onSuccess: (data) => { window.location.href = data.url; },
  });
}

export function useYouTubeStatus(enabled = true) {
  return useQuery<YouTubeOAuthStatus>({
    queryKey: ['youtube-status'],
    queryFn: () => apiFetch<YouTubeOAuthStatus>('/api/youtube/oauth/status'),
    enabled, staleTime: 30_000, retry: false,
  });
}

export function useYouTubeDisconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ success: boolean }>('/api/youtube/oauth/disconnect', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['youtube-status'] }),
  });
}

export function useLinkedInStatus(enabled = true) {
  return useQuery<LinkedInOAuthStatus>({
    queryKey: ['linkedin-status'],
    queryFn: () => apiFetch<LinkedInOAuthStatus>('/api/linkedin/oauth/status'),
    enabled,
    staleTime: 30_000,
    retry: false,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIKTOK METRICS
// ═══════════════════════════════════════════════════════════════════════════════

export function useTiktokMetrics() {
  return useQuery<{ videos: TiktokVideoMetric[]; total: number }>({
    queryKey: ['tiktok-metrics'],
    queryFn: () => apiFetch<{ videos: TiktokVideoMetric[]; total: number }>('/api/social-analytics/tiktok-metrics'),
    staleTime: 60_000,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTAGRAM REELS METRICS
// ═══════════════════════════════════════════════════════════════════════════════

export function useInstagramReelsMetrics() {
  return useQuery<{ reels: InstagramReelMetric[]; total: number }>({
    queryKey: ['instagram-reels-metrics'],
    queryFn: () => apiFetch<{ reels: InstagramReelMetric[]; total: number }>('/api/social-analytics/instagram-reels-metrics'),
    staleTime: 60_000,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// METRICS SYNC (automatic background sync)
// ═══════════════════════════════════════════════════════════════════════════════

export interface MetricsSyncStatus {
  lastSyncAt: string | null;
  syncedPlatforms: string[];
}

export interface MetricsSyncResult {
  enqueued?: boolean;
  synced?: boolean;
  skipped?: boolean;
  reason?: string;
  syncedPlatforms?: string[];
  metricsCount?: number;
  lastSyncAt?: string;
}

/**
 * Triggers a background metrics sync with 6h server-side cooldown.
 * Uses React Query mutation — call `mutate()` on page mount.
 */
export function useTriggerMetricsSync() {
  return useMutation<MetricsSyncResult>({
    mutationFn: () => apiFetch<MetricsSyncResult>('/api/metrics-sync/trigger', { method: 'POST' }),
  });
}

/**
 * Returns the last sync timestamp and synced platforms.
 */
export function useMetricsSyncStatus(enabled = true) {
  return useQuery<MetricsSyncStatus>({
    queryKey: ['metrics-sync-status'],
    queryFn: () => apiFetch<MetricsSyncStatus>('/api/metrics-sync/status'),
    enabled,
    staleTime: 60_000,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED PUBLISHING
// ═══════════════════════════════════════════════════════════════════════════════

export function usePublishNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { postId?: string; channels: string[]; text: string; imageUrl?: string; videoUrl?: string; pageId?: string; platformVariants?: Record<string, string> }) =>
      apiFetch<PublishResponse>('/api/publish/now', { method: 'POST', body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled-posts'] }),
  });
}

export function useSchedulePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { text: string; channels: string[]; scheduledAt: string; timezone?: string; imageUrl?: string; videoUrl?: string; pageId?: string; platformVariants?: Record<string, string> }) =>
      apiFetch<{ success: boolean; post: { id: string; scheduledAt: string; channels: string[]; status: string } }>('/api/publish/schedule', { method: 'POST', body: JSON.stringify(params) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduled-posts'] });
      qc.invalidateQueries({ queryKey: ['post-status'] });
    },
  });
}

export function useRetryPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) =>
      apiFetch<{ success: boolean }>(`/api/publish/retry/${postId}`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled-posts'] }),
  });
}

export function usePostStatus(postId: string | null) {
  return useQuery({
    queryKey: ['post-status', postId],
    queryFn: () => apiFetch<{ id: string; status: string; textContent: string; channels: string; scheduledAt: string }>(`/api/publish/status/${postId}`),
    enabled: !!postId, refetchInterval: (q: any) => (q.state.data?.status === 'scheduled' ? 2000 : false),
  });
}