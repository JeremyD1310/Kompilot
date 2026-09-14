/**
 * LinkedIn Publishing Service — OpenID Connect + UGC Posts API
 *
 * Publishes content to LinkedIn personal profiles via the UGC Posts API.
 *
 * Required OAuth scopes: openid, profile, email, w_member_social
 *
 * API docs:
 *   - OpenID Connect userinfo: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2
 *   - UGC Posts: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin
 */

const LINKEDIN_API_BASE = 'https://api.linkedin.com';

// ── Types ────────────────────────────────────────────────────────────────────

export interface LinkedInProfile {
  sub: string;           // Unique member ID (person URN suffix)
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  locale?: string;
}

export interface LinkedInPublishResult {
  success: boolean;
  platform: 'linkedin';
  postId?: string;
  postUrl?: string;
  error?: string;
  errorCode?: number;
}

// ── Errors ───────────────────────────────────────────────────────────────────

export class LinkedInApiError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.name = 'LinkedInApiError';
    this.code = code;
  }
  get isTokenExpired() { return this.code === 401; }
  get isRateLimited() { return this.code === 429; }
}

// ── Core API Call ────────────────────────────────────────────────────────────

async function linkedinApiCall<T>(
  path: string,
  accessToken: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${LINKEDIN_API_BASE}${path}`;
  const init: RequestInit = {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
  };
  if (options.body) init.body = JSON.stringify(options.body);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any;
      throw new LinkedInApiError(
        errorData?.message || errorData?.error_description || `LinkedIn API error: ${response.status}`,
        response.status,
      );
    }
    // Some endpoints return 201/204 with no body
    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Token Exchange ───────────────────────────────────────────────────────────

export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<{ accessToken: string; expiresIn: number; refreshToken?: string; refreshTokenExpiresIn?: number; scope: string }> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as any;
      throw new LinkedInApiError(err?.error_description || 'Token exchange failed', response.status);
    }
    const data = await response.json() as {
      access_token: string; expires_in: number;
      refresh_token?: string; refresh_token_expires_in?: number; scope: string;
    };
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      refreshToken: data.refresh_token,
      refreshTokenExpiresIn: data.refresh_token_expires_in,
      scope: data.scope,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Token Refresh ────────────────────────────────────────────────────────────

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<{ accessToken: string; expiresIn: number }> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as any;
      throw new LinkedInApiError(err?.error_description || 'Token refresh failed', response.status);
    }
    const data = await response.json() as { access_token: string; expires_in: number };
    return { accessToken: data.access_token, expiresIn: data.expires_in };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Profile (OpenID Connect) ─────────────────────────────────────────────────

export async function getProfile(accessToken: string): Promise<LinkedInProfile> {
  return linkedinApiCall<LinkedInProfile>('/v2/userinfo', accessToken);
}

// ── Publish to LinkedIn ──────────────────────────────────────────────────────

/**
 * Post content to LinkedIn via the UGC Posts API.
 *
 * @param accessToken - OAuth2 access token with w_member_social scope
 * @param personUrn   - Author URN, e.g. "urn:li:person:XXXXX" (from userinfo.sub)
 * @param text        - Post body text
 * @param imageUrl    - Optional image URL to attach as a rich media thumbnail
 */
export async function postToLinkedIn(
  accessToken: string,
  personUrn: string,
  text: string,
  imageUrl?: string,
): Promise<LinkedInPublishResult> {
  try {
    const author = personUrn.startsWith('urn:') ? personUrn : `urn:li:person:${personUrn}`;

    // Build the UGC Post body
    const ugcPost: Record<string, any> = {
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: imageUrl ? 'ARTICLE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    // If image provided, add it as an article/thumbnail
    if (imageUrl) {
      ugcPost.specificContent['com.linkedin.ugc.ShareContent'].media = [{
        status: 'READY',
        originalUrl: imageUrl,
        title: { text: '' },
      }];
    }

    const result = await linkedinApiCall<{ id: string }>(
      '/v2/ugcPosts',
      accessToken,
      { method: 'POST', body: ugcPost },
    );

    return {
      success: true,
      platform: 'linkedin',
      postId: result.id,
      postUrl: `https://www.linkedin.com/feed/update/${result.id}`,
    };
  } catch (err) {
    return {
      success: false,
      platform: 'linkedin',
      error: err instanceof Error ? err.message : 'Unknown error',
      errorCode: err instanceof LinkedInApiError ? err.code : undefined,
    };
  }
}
