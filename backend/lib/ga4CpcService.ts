/**
 * ga4CpcService.ts — GA4 CPC (Paid Traffic) Analytics for Ad Audit
 *
 * Reuses the same REST-based GA4 Data API approach as analyticsService.ts
 * (compatible with Cloudflare Workers runtime — no gRPC/Node.js deps).
 *
 * Fetches paid traffic metrics (sessions, engagement, conversions, revenue)
 * filtered by sessionSourceMedium containing "cpc" to capture ALL paid channels:
 * google / cpc, facebook / cpc, meta / cpc, tiktok / cpc, etc.
 *
 * Also fetches total site revenue (all sources) to compute the MER
 * (Marketing Efficiency Ratio = CA Total / Dépenses Totales).
 */

import { GA4_ERR_AUTH, GA4_ERR_API, GA4_ERR_PARSE, GA4_ERR_CONF } from './ga4ErrorCodes';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CpcSourceMetric {
  source: string;           // e.g. "google / cpc", "facebook / cpc"
  sessions: number;
  engagementRate: number;   // 0–1
  conversions: number;
  revenue: number;
}

export interface CpcAnalyticsResult {
  // CPC aggregates
  cpcSessions: number;
  cpcEngagementRate: number;   // weighted avg, 0–100 (%)
  cpcConversions: number;
  cpcRevenue: number;

  // Total site (all sources)
  totalSiteRevenue: number;
  totalSiteSessions: number;

  // Per-source breakdown
  sources: CpcSourceMetric[];

  // Metadata
  dateRange: { startDate: string; endDate: string };
  propertyId: string;
  fetchedAt: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const GA4_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GA4_DATA_API  = 'https://analyticsdata.googleapis.com/v1beta/properties';
const OAUTH_SCOPE   = 'https://www.googleapis.com/auth/analytics.readonly';
const JWT_EXPIRY    = 3600;
const FETCH_TIMEOUT = 15_000;

// ── JWT Helpers (identical to analyticsService.ts — Workers-safe) ──────────────

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlEncode(obj: unknown): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(obj)).buffer as ArrayBuffer);
}

function parsePemToBase64(pem: string): string {
  return pem
    .replace(/-----BEGIN.*?-----/g, '')
    .replace(/-----END.*?-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\n/g, '')
    .trim();
}

async function importServiceAccountKey(privateKeyPem: string): Promise<CryptoKey> {
  const b64 = parsePemToBase64(privateKeyPem);
  const derStr = atob(b64);
  const derBytes = new Uint8Array(derStr.length);
  for (let i = 0; i < derStr.length; i++) derBytes[i] = derStr.charCodeAt(i);

  return crypto.subtle.importKey(
    'pkcs8',
    derBytes.buffer as ArrayBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

async function buildAndSignJWT(clientEmail: string, key: CryptoKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = { iss: clientEmail, scope: OAUTH_SCOPE, aud: GA4_TOKEN_URL, exp: now + JWT_EXPIRY, iat: now };
  const signingInput = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;
  const sigBuf = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${toBase64Url(sigBuf)}`;
}

async function getAccessToken(clientEmail: string, privateKeyPem: string): Promise<string> {
  let key: CryptoKey;
  try {
    key = await importServiceAccountKey(privateKeyPem);
  } catch (err) {
    throw Object.assign(
      new Error(`Échec import clé RSA : ${err instanceof Error ? err.message : String(err)}`),
      { code: GA4_ERR_AUTH },
    );
  }

  const jwt = await buildAndSignJWT(clientEmail, key);
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(GA4_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw Object.assign(new Error(`OAuth HTTP ${res.status} : ${body.slice(0, 300)}`), { code: GA4_ERR_AUTH });
    }

    const data = await res.json() as { access_token?: string; error?: string };
    if (!data.access_token) {
      throw Object.assign(new Error(`Pas d'access_token : ${data.error ?? 'inconnu'}`), { code: GA4_ERR_AUTH });
    }
    return data.access_token;
  } finally {
    clearTimeout(timer);
  }
}

// ── GA4 Report Callers ─────────────────────────────────────────────────────────

type GA4Row = {
  dimensionValues: { value: string }[];
  metricValues:    { value: string }[];
};
type GA4Response = { rows?: GA4Row[]; rowCount?: number };

/**
 * Fetch CPC traffic breakdown by sessionSourceMedium
 */
async function fetchCpcBreakdown(
  propertyId: string,
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<CpcSourceMetric[]> {
  const body = {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'sessionSourceMedium' }],
    metrics: [
      { name: 'sessions' },
      { name: 'engagementRate' },
      { name: 'conversions' },
      { name: 'totalRevenue' },
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'sessionSourceMedium',
        stringFilter: { matchType: 'CONTAINS', value: 'cpc', caseSensitive: false },
      },
    },
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 50,
  };

  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(`${GA4_DATA_API}/${propertyId}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw Object.assign(new Error(`GA4 CPC report HTTP ${res.status} : ${text.slice(0, 400)}`), { code: GA4_ERR_API });
    }

    const data = await res.json() as GA4Response;
    return (data.rows ?? []).map(row => ({
      source:         row.dimensionValues[0]?.value ?? '',
      sessions:       parseInt(row.metricValues[0]?.value ?? '0', 10),
      engagementRate: parseFloat(row.metricValues[1]?.value ?? '0'),
      conversions:    parseInt(row.metricValues[2]?.value ?? '0', 10),
      revenue:        parseFloat(row.metricValues[3]?.value ?? '0'),
    }));
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch total site revenue and sessions (all traffic sources)
 */
async function fetchTotalSiteMetrics(
  propertyId: string,
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<{ totalRevenue: number; totalSessions: number }> {
  const body = {
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalRevenue' },
    ],
  };

  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(`${GA4_DATA_API}/${propertyId}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw Object.assign(new Error(`GA4 total report HTTP ${res.status} : ${text.slice(0, 400)}`), { code: GA4_ERR_API });
    }

    const data = await res.json() as GA4Response;
    const row = data.rows?.[0];
    return {
      totalSessions: parseInt(row?.metricValues[0]?.value ?? '0', 10),
      totalRevenue:  parseFloat(row?.metricValues[1]?.value ?? '0'),
    };
  } finally {
    clearTimeout(timer);
  }
}

// ── Main Export ────────────────────────────────────────────────────────────────

/**
 * getCpcAnalytics — fetches all CPC paid traffic data + total site metrics
 * from GA4 for the Ad Performance Audit.
 */
export async function getCpcAnalytics(
  startDate: string,
  endDate: string,
  config: { propertyId: string; clientEmail: string; privateKey: string },
): Promise<CpcAnalyticsResult> {
  const { propertyId, clientEmail, privateKey } = config;

  if (!propertyId || !clientEmail || !privateKey) {
    throw Object.assign(
      new Error('Secrets GA4 manquants : GA4_PROPERTY_ID, GA4_CLIENT_EMAIL et GA4_PRIVATE_KEY requis.'),
      { code: GA4_ERR_CONF },
    );
  }

  console.log(`[ga4CpcService] getCpcAnalytics — property=${propertyId} ${startDate} → ${endDate}`);

  const accessToken = await getAccessToken(clientEmail, privateKey);

  // Parallel fetches
  const [cpcSources, totalSite] = await Promise.all([
    fetchCpcBreakdown(propertyId, accessToken, startDate, endDate),
    fetchTotalSiteMetrics(propertyId, accessToken, startDate, endDate),
  ]);

  const cpcSessions    = cpcSources.reduce((s, r) => s + r.sessions, 0);
  const cpcConversions = cpcSources.reduce((s, r) => s + r.conversions, 0);
  const cpcRevenue     = cpcSources.reduce((s, r) => s + r.revenue, 0);

  const cpcEngagementRate = cpcSessions > 0
    ? cpcSources.reduce((s, r) => s + r.engagementRate * r.sessions, 0) / cpcSessions
    : 0;

  return {
    cpcSessions,
    cpcEngagementRate: Math.round(cpcEngagementRate * 10000) / 100, // → %
    cpcConversions,
    cpcRevenue:        Math.round(cpcRevenue * 100) / 100,
    totalSiteRevenue:  Math.round(totalSite.totalRevenue * 100) / 100,
    totalSiteSessions: totalSite.totalSessions,
    sources:           cpcSources,
    dateRange:         { startDate, endDate },
    propertyId,
    fetchedAt:         new Date().toISOString(),
  };
}
