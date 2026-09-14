/**
 * Google Business Profile (GBP) API Service
 *
 * Manages business profiles, responds to reviews, and posts local updates
 * via the Google Business Profile API.
 *
 * API docs: https://developers.google.com/my-business/reference
 *
 * Required OAuth scopes:
 *   - https://www.googleapis.com/auth/business.manage
 *   - https://www.googleapis.com/auth/plus.business.manage (legacy)
 */

const GBP_API_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';
const GBP_ACCOUNTS_API = 'https://mybusinessaccountmanagement.googleapis.com/v1';

// ── Types ────────────────────────────────────────────────────────────────────

export interface GBPLocation {
  name: string;           // accounts/{accountId}/locations/{locationId}
  locationName: string;
  title: string;
  websiteUri: string;
  phoneNumbers?: { primaryPhone?: string };
  address?: { addressLines?: string[]; locality?: string; postalCode?: string; country?: string };
  profile?: { description?: string };
  storeCode?: string;
}

export interface GBPReview {
  name: string;           // locations/{locationId}/reviews/{reviewId}
  reviewId: string;
  reviewer?: { displayName?: string; profilePhotoUri?: string };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
}

export interface GBPLocalPost {
  name: string;
  languageCode: string;
  summary: string;
  callToAction?: { actionType: string; url: string };
  media?: { mediaFormat: string; googleUrl?: string }[];
  topicType: string;
  state: string;
  event?: { title: string; schedule: { startDate: object; startTime: string } };
}

// ── Core API Call ────────────────────────────────────────────────────────────

async function gbpApiCall<T>(url: string, accessToken: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const init: RequestInit = {
    method: options.method || 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  };
  if (options.body) init.body = JSON.stringify(options.body);
  const response = await fetch(url, init);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as any;
    throw new GBApiError(errorData?.error?.message || `GBP API error: ${response.status}`, response.status);
  }
  return response.json() as Promise<T>;
}

export class GBApiError extends Error {
  code: number;
  constructor(message: string, code: number) { super(message); this.name = 'GBApiError'; this.code = code; }
}

// ── Token Exchange ───────────────────────────────────────────────────────────

export async function exchangeCodeForToken(code: string, clientId: string, clientSecret: string, redirectUri: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }).toString(),
  });
  if (!response.ok) { const err = await response.json().catch(() => ({})) as any; throw new GBApiError(err?.error_description || 'Token exchange failed', response.status); }
  const data = await response.json() as { access_token: string; refresh_token: string; expires_in: number };
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
}

export async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret, grant_type: 'refresh_token' }).toString(),
  });
  if (!response.ok) throw new GBApiError('Token refresh failed', response.status);
  const data = await response.json() as { access_token: string; expires_in: number };
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

// ── Account & Location Discovery ─────────────────────────────────────────────

export async function getAccounts(accessToken: string): Promise<{ name: string; accountName: string; type: string }[]> {
  const result = await gbpApiCall<{ accounts: { name: string; accountName: string; type: string }[] }>(
    `${GBP_ACCOUNTS_API}/accounts`, accessToken
  );
  return result.accounts || [];
}

export async function getLocations(accessToken: string, accountName: string): Promise<GBPLocation[]> {
  const result = await gbpApiCall<{ locations: GBPLocation[] }>(
    `${GBP_API_BASE}/${accountName}/locations?readMask=name,locationName,title,websiteUri,phoneNumbers,address,profile,storeCode`,
    accessToken
  );
  return result.locations || [];
}

// ── Reviews ──────────────────────────────────────────────────────────────────

export async function getReviews(accessToken: string, locationName: string): Promise<GBPReview[]> {
  const result = await gbpApiCall<{ reviews: GBPReview[] }>(
    `https://mybusiness.googleapis.com/v1/${locationName}/reviews?orderBy=updateTime desc&pageSize=50`,
    accessToken
  );
  return result.reviews || [];
}

export async function replyToReview(accessToken: string, reviewName: string, replyText: string): Promise<void> {
  await gbpApiCall(
    `https://mybusiness.googleapis.com/v1/${reviewName}/reply`,
    accessToken,
    { method: 'PUT', body: { comment: replyText } }
  );
}

// ── Local Posts ──────────────────────────────────────────────────────────────

export async function createLocalPost(accessToken: string, locationName: string, summary: string, imageUrl?: string, callToAction?: { actionType: string; url: string }): Promise<GBPLocalPost> {
  const body: Record<string, unknown> = { languageCode: 'fr', summary, topicType: 'STANDARD' };
  if (callToAction) body.callToAction = callToAction;
  if (imageUrl) body.media = [{ mediaFormat: 'PHOTO', sourceUri: imageUrl }];
  const result = await gbpApiCall<GBPLocalPost>(
    `https://mybusiness.googleapis.com/v1/${locationName}/localPosts`,
    accessToken,
    { method: 'POST', body }
  );
  return result;
}

export async function getLocalPosts(accessToken: string, locationName: string): Promise<GBPLocalPost[]> {
  const result = await gbpApiCall<{ localPosts: GBPLocalPost[] }>(
    `https://mybusiness.googleapis.com/v1/${locationName}/localPosts`,
    accessToken
  );
  return result.localPosts || [];
}
