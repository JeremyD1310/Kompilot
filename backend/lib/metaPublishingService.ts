/**
 * Meta (Facebook + Instagram) Publishing Service — Graph API v21.0
 *
 * Publishes content to Facebook Pages and Instagram Business accounts.
 *
 * Required scopes: pages_manage_posts, pages_read_engagement, pages_show_list,
 *   instagram_basic, instagram_content_publish
 */

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  picture?: { data?: { url?: string } };
  instagram_business_account?: { id: string; name: string; username: string; profile_picture_url?: string };
}

export interface PublishResult {
  success: boolean;
  platform: 'facebook' | 'instagram' | 'google_business';
  postId?: string;
  postUrl?: string;
  error?: string;
  errorCode?: number;
}

export interface PublishPayload {
  text: string;
  imageUrl?: string;
  scheduledAt?: string;
}

// ── Core API Call ────────────────────────────────────────────────────────────

export async function graphApiCall<T>(path: string, accessToken: string, options: { method?: string; body?: URLSearchParams | FormData } = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${GRAPH_API_BASE}${path}`;
  const separator = url.includes('access_token=') ? '' : (url.includes('?') ? '&' : '?');
  const tokenParam = url.includes('access_token=') ? '' : `access_token=${encodeURIComponent(accessToken)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  const init: RequestInit = { method: options.method || 'GET', signal: controller.signal };
  if (options.body instanceof FormData) init.body = options.body;
  else if (options.body) { init.body = options.body.toString(); init.headers = { 'Content-Type': 'application/x-www-form-urlencoded' }; }
  try {
    const response = await fetch(`${url}${separator}${tokenParam}`, init);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any;
      throw new MetaApiError(errorData?.error?.message || `Meta API error: ${response.status}`, errorData?.error?.code || response.status);
    }
    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof MetaApiError) throw error;
    throw new MetaApiError(error instanceof Error && error.name === 'AbortError' ? 'Meta API timeout.' : 'Meta API unavailable.', 503);
  } finally {
    clearTimeout(timeout);
  }
}

export class MetaApiError extends Error {
  code: number;
  constructor(message: string, code: number) { super(message); this.name = 'MetaApiError'; this.code = code; }
  get isTokenExpired() { return this.code === 190 || this.code === 102; }
  get isRateLimited() { return this.code === 4 || this.code === 32; }
}

// ── Page Discovery ───────────────────────────────────────────────────────────

export async function getUserPages(userAccessToken: string): Promise<MetaPage[]> {
  const pages: MetaPage[] = [];
  let nextPath: string | null = '/me/accounts?limit=100&fields=id,name,access_token,category,picture.type(large),instagram_business_account{id,name,username,profile_picture_url}';

  while (nextPath) {
    const result = await graphApiCall<{ data?: MetaPage[]; paging?: { next?: string } }>(nextPath, userAccessToken);
    pages.push(...(result.data || []));
    nextPath = result.paging?.next || null;
  }

  return pages;
}

// ── Token Exchange ───────────────────────────────────────────────────────────

export async function exchangeForLongLivedToken(shortLivedToken: string, appId: string, appSecret: string): Promise<{ accessToken: string; expiresIn: number }> {
  const result = await graphApiCall<{ access_token: string; expires_in?: number }>(
    `/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&fb_exchange_token=${encodeURIComponent(shortLivedToken)}`,
    shortLivedToken
  );
  return { accessToken: result.access_token, expiresIn: Number(result.expires_in) || 60 * 24 * 60 * 60 };
}

// ── Facebook Page Publishing ─────────────────────────────────────────────────

export async function publishToFacebookPage(pageId: string, pageAccessToken: string, payload: PublishPayload): Promise<PublishResult> {
  try {
    const body = new URLSearchParams();
    body.set('message', payload.text);
    if (payload.imageUrl) body.set('url', payload.imageUrl);
    if (payload.scheduledAt) {
      body.set('published', 'false');
      body.set('scheduled_publish_time', Math.floor(new Date(payload.scheduledAt).getTime() / 1000).toString());
    }
    const endpoint = payload.imageUrl ? `/${pageId}/photos` : `/${pageId}/feed`;
    const result = await graphApiCall<{ id: string }>(endpoint, pageAccessToken, { method: 'POST', body });
    return { success: true, platform: 'facebook', postId: result.id, postUrl: `https://facebook.com/${result.id}` };
  } catch (err) {
    return { success: false, platform: 'facebook', error: err instanceof Error ? err.message : 'Unknown error', errorCode: err instanceof MetaApiError ? err.code : undefined };
  }
}

// ── Instagram Publishing (2-step: container → publish) ───────────────────────

export async function publishToInstagram(igUserId: string, pageAccessToken: string, payload: PublishPayload): Promise<PublishResult> {
  try {
    if (!payload.imageUrl) return { success: false, platform: 'instagram', error: 'Instagram requires an image.' };
    const containerBody = new URLSearchParams();
    containerBody.set('caption', payload.text);
    containerBody.set('image_url', payload.imageUrl);
    const container = await graphApiCall<{ id: string }>(`/${igUserId}/media`, pageAccessToken, { method: 'POST', body: containerBody });
    const publishBody = new URLSearchParams();
    publishBody.set('creation_id', container.id);
    const result = await graphApiCall<{ id: string }>(`/${igUserId}/media_publish`, pageAccessToken, { method: 'POST', body: publishBody });
    return { success: true, platform: 'instagram', postId: result.id, postUrl: `https://instagram.com/p/${result.id}` };
  } catch (err) {
    return { success: false, platform: 'instagram', error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ── Instagram Reels Publishing (container with media_type=REELS → publish) ────

export async function publishInstagramReel(igUserId: string, pageAccessToken: string, caption: string, videoUrl: string): Promise<PublishResult> {
  try {
    const containerBody = new URLSearchParams();
    containerBody.set('media_type', 'REELS');
    containerBody.set('video_url', videoUrl);
    containerBody.set('caption', caption);
    containerBody.set('share_to_feed', 'true');
    const container = await graphApiCall<{ id: string }>(`/${igUserId}/media`, pageAccessToken, { method: 'POST', body: containerBody });
    const publishBody = new URLSearchParams();
    publishBody.set('creation_id', container.id);
    const result = await graphApiCall<{ id: string }>(`/${igUserId}/media_publish`, pageAccessToken, { method: 'POST', body: publishBody });
    return { success: true, platform: 'instagram', postId: result.id, postUrl: `https://instagram.com/reel/${result.id}` };
  } catch (err) {
    return { success: false, platform: 'instagram', error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ── Fetch Instagram Media (for Reels metrics) ───────────────────────────────

export async function getInstagramMedia(igUserId: string, pageAccessToken: string): Promise<Array<{
  id: string; media_type: string; media_url?: string; thumbnail_url?: string;
  caption?: string; timestamp: string; like_count?: number; comments_count?: number;
  video_view_count?: number; permalink?: string;
}>> {
  const result = await graphApiCall<{ data: Array<{
    id: string; media_type: string; media_url?: string; thumbnail_url?: string;
    caption?: string; timestamp: string; like_count?: number; comments_count?: number;
    video_view_count?: number; permalink?: string;
  }> }>(
    `/${igUserId}/media?fields=id,media_type,media_url,thumbnail_url,caption,timestamp,like_count,comments_count,video_view_count,permalink&limit=50`,
    pageAccessToken
  );
  return result.data || [];
}

// ── Multi-Platform Publish ───────────────────────────────────────────────────

export async function publishToMultiplePlatforms(userAccessToken: string, pageId: string, platforms: ('facebook' | 'instagram')[], payload: PublishPayload): Promise<PublishResult[]> {
  const results: PublishResult[] = [];
  const pages = await getUserPages(userAccessToken);
  const page = pages.find(p => p.id === pageId);
  if (!page) return platforms.map(p => ({ success: false, platform: p, error: `Page ${pageId} not found` }));
  for (const platform of platforms) {
    if (platform === 'facebook') results.push(await publishToFacebookPage(pageId, page.access_token, payload));
    else if (platform === 'instagram') {
      if (!page.instagram_business_account) { results.push({ success: false, platform: 'instagram', error: 'No Instagram Business account linked.' }); continue; }
      results.push(await publishToInstagram(page.instagram_business_account.id, page.access_token, payload));
    }
  }
  return results;
}

// ── Token Validation ─────────────────────────────────────────────────────────

export async function validateToken(accessToken: string, appId?: string, appSecret?: string): Promise<{ valid: boolean; appId?: string; userId?: string; scopes?: string[]; expiresAt?: number }> {
  try {
    const appAccessToken = appId && appSecret ? `${appId}|${appSecret}` : accessToken;
    const result = await graphApiCall<{ data?: { app_id: string; user_id: string; scopes: string[]; expires_at: number; is_valid: boolean } }>(
      `/debug_token?input_token=${encodeURIComponent(accessToken)}`, appAccessToken
    );
    const data = result.data;
    return data ? { valid: data.is_valid, appId: data.app_id, userId: data.user_id, scopes: data.scopes, expiresAt: data.expires_at } : { valid: false };
  } catch { return { valid: false }; }
}