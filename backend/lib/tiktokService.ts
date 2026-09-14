/**
 * TikTok API v2 Service — Content Posting
 *
 * Handles OAuth token exchange, creator info, and video content publishing
 * via the TikTok Content Posting API v2.
 *
 * Required scopes: video.upload, video.publish, user.info.basic
 *
 * API docs:
 *   - OAuth: https://developers.tiktok.com/doc/oauth-user-access-token-management
 *   - Content Posting: https://developers.tiktok.com/doc/content-posting-api
 */

const TIKTOK_BASE = 'https://open.tiktokapis.com';
const TIKTOK_BUSINESS_API_BASE = 'https://business-api.tiktok.com';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TiktokPublishResult {
  success: boolean;
  platform: 'tiktok';
  postId?: string;
  postUrl?: string;
  publishId?: string;
  status?: string;
  error?: string;
}

export interface TiktokCreatorInfo {
  displayName: string;
  openId: string;
  avatarUrl?: string;
}

// ── Core API Call ────────────────────────────────────────────────────────────

export async function tiktokApiCall<T>(
  path: string,
  accessToken: string,
  options: { method?: string; body?: Record<string, unknown> } = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${TIKTOK_BASE}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const init: RequestInit = {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      signal: controller.signal,
    };
    if (options.body) init.body = JSON.stringify(options.body);
    const response = await fetch(url, init);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({})) as any;
      throw new TiktokApiError(
        errData?.data?.error_description || errData?.message || `TikTok API error: ${response.status}`,
        response.status,
      );
    }
    const data = await response.json() as T;
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export class TiktokApiError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.name = 'TiktokApiError';
    this.code = code;
  }
  get isTokenExpired() { return this.code === 401; }
  get isRateLimited() { return this.code === 429; }
}

// ── Business API Call (server-to-server, uses TIKTOK_BUSINESS_API_KEY) ────────

/**
 * Call the TikTok Business API (Ads, Messaging, Webhooks) using the long-lived
 * business API key (server-to-server). This bypasses OAuth user tokens for
 * backend operations like webhook registration, ad account management, and
 * business messaging channels.
 *
 * Auth header: `Access-Token: <TIKTOK_BUSINESS_API_KEY>`
 */
export async function tiktokBusinessApiCall<T>(
  path: string,
  businessApiKey: string,
  options: { method?: string; body?: Record<string, unknown> } = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${TIKTOK_BUSINESS_API_BASE}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const init: RequestInit = {
      method: options.method || 'GET',
      headers: {
        'Access-Token': businessApiKey,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    };
    if (options.body) init.body = JSON.stringify(options.body);
    const response = await fetch(url, init);
    const json = await response.json() as any;
    if (json.code !== 0 && json.code !== 200) {
      throw new TiktokApiError(
        json.message || `TikTok Business API error: ${json.code}`,
        response.status,
      );
    }
    return json as T;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Token Exchange ───────────────────────────────────────────────────────────

export async function exchangeCodeForToken(
  code: string,
  clientKey: string,
  clientSecret: string,
  redirectUri: string,
): Promise<{ accessToken: string; expiresIn: number; refreshToken: string; refreshTokenExpiresIn: number; openId: string; scope: string }> {
  const params = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${TIKTOK_BASE}/v2/oauth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as any;
      throw new TiktokApiError(err?.data?.error_description || err?.message || 'Token exchange failed', response.status);
    }
    const data = await response.json() as {
      data: { access_token: string; expires_in: number; refresh_token: string; refresh_token_expires_in: number; open_id: string; scope: string };
    };
    return {
      accessToken: data.data.access_token,
      expiresIn: data.data.expires_in,
      refreshToken: data.data.refresh_token,
      refreshTokenExpiresIn: data.data.refresh_token_expires_in,
      openId: data.data.open_id,
      scope: data.data.scope,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Token Refresh ────────────────────────────────────────────────────────────

export async function refreshAccessToken(
  refreshToken: string,
  clientKey: string,
  clientSecret: string,
): Promise<{ accessToken: string; expiresIn: number; refreshToken: string; refreshTokenExpiresIn: number }> {
  const params = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${TIKTOK_BASE}/v2/oauth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as any;
      throw new TiktokApiError(err?.data?.error_description || 'Token refresh failed', response.status);
    }
    const data = await response.json() as {
      data: { access_token: string; expires_in: number; refresh_token: string; refresh_token_expires_in: number };
    };
    return {
      accessToken: data.data.access_token,
      expiresIn: data.data.expires_in,
      refreshToken: data.data.refresh_token,
      refreshTokenExpiresIn: data.data.refresh_token_expires_in,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Creator Info ─────────────────────────────────────────────────────────────

export async function getCreatorInfo(accessToken: string): Promise<TiktokCreatorInfo> {
  const result = await tiktokApiCall<{ data: { user: { display_name: string; open_id: string; avatar_url?: string } } }>(
    '/v2/post/publish/creator/info/query/',
    accessToken,
    { method: 'POST', body: {} },
  );
  return {
    displayName: result.data.user.display_name,
    openId: result.data.user.open_id,
    avatarUrl: result.data.user.avatar_url,
  };
}

// ── Publish Video (Init + Status) ────────────────────────────────────────────

/**
 * Initialize a direct video publish on TikTok.
 *
 * The actual video upload is multi-step (init → upload → status check).
 * For simplicity, this accepts a pre-uploaded video URL and returns the publishId
 * for status polling. In production, the video must be chunk-uploaded to TikTok.
 *
 * For text-only content, TikTok's Content Posting API v2 supports
 * `source: "PULL_FROM_URL"` with a video_url for direct publishing.
 */
export async function postToTikTok(
  accessToken: string,
  videoUrl: string,
  title: string,
  description: string,
): Promise<TiktokPublishResult> {
  try {
    // Initialize a direct post with a video pulled from URL
    const initResult = await tiktokApiCall<{
      data: { publish_id: string; status: string; upload_url?: string };
    }>('/v2/post/publish/video/init/', accessToken, {
      method: 'POST',
      body: {
        post_info: {
          title: title.substring(0, 150),
          description: description.substring(0, 2200),
          privacy_level: 'PUBLIC_TO_EVERYONE',
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl,
        },
      },
    });

    const publishId = initResult.data.publish_id;

    // Poll status once (best-effort)
    const statusResult = await pollPublishStatus(accessToken, publishId);

    return {
      success: true,
      platform: 'tiktok',
      publishId,
      status: statusResult?.status || 'processing',
    };
  } catch (err) {
    return {
      success: false,
      platform: 'tiktok',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ── Status Polling ───────────────────────────────────────────────────────────

export async function pollPublishStatus(
  accessToken: string,
  publishId: string,
): Promise<{ status: string; postId?: string; postUrl?: string; failReason?: string }> {
  try {
    const result = await tiktokApiCall<{
      data: {
        status: string;
        publicaly_available_post_id?: string[];
        fail_reason?: string;
      };
    }>('/v2/post/publish/status/fetch/', accessToken, {
      method: 'POST',
      body: { publish_id: publishId },
    });

    const status = result.data.status;
    const postId = result.data.publicaly_available_post_id?.[0];

    return {
      status,
      postId,
      postUrl: postId ? `https://www.tiktok.com/@me/video/${postId}` : undefined,
      failReason: result.data.fail_reason,
    };
  } catch {
    return { status: 'unknown' };
  }
}
