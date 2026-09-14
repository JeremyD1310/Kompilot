/**
 * YouTube Data API v3 Service
 *
 * Handles OAuth token exchange, channel info, Shorts upload, and video metrics
 * via the YouTube Data API v3.
 *
 * YouTube Shorts are videos ≤60 seconds with #Shorts in the description.
 *
 * Required scopes:
 *   - https://www.googleapis.com/auth/youtube.upload
 *   - https://www.googleapis.com/auth/youtube.readonly
 *
 * API docs:
 *   - OAuth: https://developers.google.com/identity/protocols/oauth2
 *   - YouTube API: https://developers.google.com/youtube/v3
 */

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_UPLOAD_BASE = 'https://www.googleapis.com/upload/youtube/v3';

// ── Types ────────────────────────────────────────────────────────────────────

export interface YouTubePublishResult {
  success: boolean;
  platform: 'youtube';
  videoId?: string;
  videoUrl?: string;
  error?: string;
}

export interface YouTubeChannelInfo {
  channelId: string;
  title: string;
  thumbnailUrl: string;
  subscriberCount: string;
  videoCount: string;
}

export interface YouTubeVideoMetrics {
  views: string;
  likes: string;
  comments: string;
  favorites: string;
}

// ── Core API Call ────────────────────────────────────────────────────────────

async function youtubeApiCall<T>(
  url: string,
  accessToken: string,
  options: { method?: string; body?: unknown; contentType?: string } = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const init: RequestInit = {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...(options.contentType ? { 'Content-Type': options.contentType } : {}),
      },
      signal: controller.signal,
    };
    if (options.body !== undefined) {
      init.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }
    const response = await fetch(url, init);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({})) as any;
      throw new YouTubeApiError(
        errData?.error?.message || `YouTube API error: ${response.status}`,
        response.status,
      );
    }
    const data = await response.json() as T;
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export class YouTubeApiError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.name = 'YouTubeApiError';
    this.code = code;
  }
  get isTokenExpired() { return this.code === 401; }
  get isRateLimited() { return this.code === 429; }
}

// ── Token Exchange ───────────────────────────────────────────────────────────

export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<{ accessToken: string; expiresIn: number; refreshToken: string; scope: string; tokenType: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
      signal: controller.signal,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as any;
      throw new YouTubeApiError(err?.error_description || 'Token exchange failed', response.status);
    }
    const data = await response.json() as {
      access_token: string; expires_in: number; refresh_token: string; scope: string; token_type: string;
    };
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      refreshToken: data.refresh_token,
      scope: data.scope,
      tokenType: data.token_type,
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }).toString(),
      signal: controller.signal,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as any;
      throw new YouTubeApiError(err?.error_description || 'Token refresh failed', response.status);
    }
    const data = await response.json() as { access_token: string; expires_in: number };
    return { accessToken: data.access_token, expiresIn: data.expires_in };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Channel Info ─────────────────────────────────────────────────────────────

export async function getChannelInfo(accessToken: string): Promise<YouTubeChannelInfo> {
  const url = `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&mine=true`;
  const result = await youtubeApiCall<{
    items: Array<{
      id: string;
      snippet: { title: string; thumbnails?: { default?: { url: string } } };
      statistics: { subscriberCount: string; videoCount: string };
    }>;
  }>(url, accessToken);

  const channel = result.items?.[0];
  if (!channel) throw new YouTubeApiError('No YouTube channel found for this account', 404);

  return {
    channelId: channel.id,
    title: channel.snippet.title,
    thumbnailUrl: channel.snippet.thumbnails?.default?.url || '',
    subscriberCount: channel.statistics.subscriberCount || '0',
    videoCount: channel.statistics.videoCount || '0',
  };
}

// ── Upload Short ─────────────────────────────────────────────────────────────

/**
 * Upload a YouTube Short via resumable upload init.
 *
 * YouTube Shorts are videos ≤60 seconds with #Shorts in the description.
 * This function initializes the resumable upload and returns the videoId.
 *
 * For simplicity, this uses the resumable upload protocol: it sends the metadata
 * and gets back a resumable upload URI. The caller can then PUT the video binary
 * to that URI. Here we return the initial response for the caller to proceed.
 *
 * If videoUrl is provided, we pull the video binary from that URL and upload it.
 * Otherwise, for text-only, we create a metadata-only entry (not typical for Shorts).
 */
export async function uploadShort(
  accessToken: string,
  videoUrl: string,
  title: string,
  description: string,
  privacyStatus: 'public' | 'unlisted' | 'private' = 'public',
): Promise<YouTubePublishResult> {
  try {
    // Ensure #Shorts tag
    const shortDescription = description.includes('#Shorts')
      ? description
      : `${description}\n\n#Shorts`;

    // Step 1: Initialize resumable upload
    const metadata = {
      snippet: {
        title: title.substring(0, 100),
        description: shortDescription.substring(0, 5000),
        tags: ['Shorts'],
        categoryId: '22', // People & Blogs
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    };

    const initUrl = `${YOUTUBE_UPLOAD_BASE}/videos?uploadType=resumable&part=snippet,status`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    let initResponse: Response;
    try {
      initResponse = await fetch(initUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': 'video/*',
        },
        body: JSON.stringify(metadata),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!initResponse.ok) {
      const errData = await initResponse.json().catch(() => ({})) as any;
      throw new YouTubeApiError(
        errData?.error?.message || `Upload init failed: ${initResponse.status}`,
        initResponse.status,
      );
    }

    const uploadUri = initResponse.headers.get('Location');
    if (!uploadUri) {
      throw new YouTubeApiError('No upload URI returned from YouTube', 500);
    }

    // Step 2: Fetch video binary from the provided URL and upload
    const videoController = new AbortController();
    const videoTimeout = setTimeout(() => videoController.abort(), 60_000);
    let videoBuffer: ArrayBuffer;
    try {
      const videoFetch = await fetch(videoUrl, { signal: videoController.signal });
      if (!videoFetch.ok) throw new YouTubeApiError('Failed to fetch video from URL', 400);
      videoBuffer = await videoFetch.arrayBuffer();
    } finally {
      clearTimeout(videoTimeout);
    }

    // Step 3: Upload video binary to the resumable URI
    const uploadController = new AbortController();
    const uploadTimeout = setTimeout(() => uploadController.abort(), 120_000);
    let uploadResponse: Response;
    try {
      uploadResponse = await fetch(uploadUri, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/*',
          'Content-Length': String(videoBuffer.byteLength),
        },
        body: videoBuffer,
        signal: uploadController.signal,
      });
    } finally {
      clearTimeout(uploadTimeout);
    }

    if (!uploadResponse.ok) {
      const errData = await uploadResponse.json().catch(() => ({})) as any;
      throw new YouTubeApiError(
        errData?.error?.message || `Video upload failed: ${uploadResponse.status}`,
        uploadResponse.status,
      );
    }

    const result = await uploadResponse.json() as { id: string };
    return {
      success: true,
      platform: 'youtube',
      videoId: result.id,
      videoUrl: `https://www.youtube.com/shorts/${result.id}`,
    };
  } catch (err) {
    return {
      success: false,
      platform: 'youtube',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ── Video Metrics ────────────────────────────────────────────────────────────

export async function getVideoMetrics(
  accessToken: string,
  videoId: string,
): Promise<YouTubeVideoMetrics> {
  const url = `${YOUTUBE_API_BASE}/videos?part=statistics&id=${encodeURIComponent(videoId)}`;
  const result = await youtubeApiCall<{
    items: Array<{
      statistics: {
        viewCount: string;
        likeCount: string;
        commentCount: string;
        favoriteCount: string;
      };
    }>;
  }>(url, accessToken);

  const video = result.items?.[0];
  if (!video) throw new YouTubeApiError('Video not found', 404);

  return {
    views: video.statistics.viewCount || '0',
    likes: video.statistics.likeCount || '0',
    comments: video.statistics.commentCount || '0',
    favorites: video.statistics.favoriteCount || '0',
  };
}
