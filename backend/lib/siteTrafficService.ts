import { GA4_ERR_API, GA4_ERR_AUTH, GA4_ERR_CONF } from './ga4ErrorCodes';

export interface SiteTrafficDaily {
  date: string;
  sessions: number;
  activeUsers: number;
  pageViews: number;
  conversions: number;
  engagementRate: number;
}

export interface SiteTrafficSummary {
  totalSessions: number;
  totalActiveUsers: number;
  totalPageViews: number;
  totalConversions: number;
  conversionRate: number;
  avgEngagementRate: number;
  dailyBreakdown: SiteTrafficDaily[];
  dateRange: { startDate: string; endDate: string };
  propertyId: string;
  fetchedAt: string;
}

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DATA_API = 'https://analyticsdata.googleapis.com/v1beta/properties';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

function b64url(value: ArrayBuffer | string) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value);
  let raw = '';
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getToken(email: string, pem: string) {
  try {
    const der = atob(pem.replace(/-----BEGIN.*?-----|-----END.*?-----/g, '').replace(/\\n|\n/g, '').trim());
    const bytes = Uint8Array.from(der, char => char.charCodeAt(0));
    const key = await crypto.subtle.importKey('pkcs8', bytes.buffer as ArrayBuffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = b64url(JSON.stringify({ iss: email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
    const input = `${header}.${payload}`;
    const signature = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, key, new TextEncoder().encode(input));
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${input}.${b64url(signature)}` }),
    });
    if (!response.ok) throw new Error(`OAuth HTTP ${response.status}`);
    const data = await response.json() as { access_token?: string };
    if (!data.access_token) throw new Error('Google access token missing');
    return data.access_token;
  } catch (error) {
    throw Object.assign(new Error(error instanceof Error ? error.message : 'GA4 authentication failed'), { code: GA4_ERR_AUTH });
  }
}

export async function getSiteTraffic(startDate: string, endDate: string, config: { propertyId: string; clientEmail: string; privateKey: string }): Promise<SiteTrafficSummary> {
  if (!config.propertyId || !config.clientEmail || !config.privateKey) {
    throw Object.assign(new Error('GA4_PROPERTY_ID, GA4_CLIENT_EMAIL et GA4_PRIVATE_KEY sont requis.'), { code: GA4_ERR_CONF });
  }
  const token = await getToken(config.clientEmail, config.privateKey);
  const response = await fetch(`${DATA_API}/${config.propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'conversions' },
        { name: 'engagementRate' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      limit: 100,
    }),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw Object.assign(new Error(`GA4 Data API HTTP ${response.status}: ${detail}`), { code: GA4_ERR_API });
  }
  const data = await response.json() as { rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[] };
  const dailyBreakdown = (data.rows ?? []).map(row => {
    const rawDate = row.dimensionValues[0]?.value ?? '';
    return {
      date: rawDate.length === 8 ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6)}` : rawDate,
      sessions: Number(row.metricValues[0]?.value) || 0,
      activeUsers: Number(row.metricValues[1]?.value) || 0,
      pageViews: Number(row.metricValues[2]?.value) || 0,
      conversions: Number(row.metricValues[3]?.value) || 0,
      engagementRate: Number(row.metricValues[4]?.value) || 0,
    };
  });
  const totalSessions = dailyBreakdown.reduce((sum, row) => sum + row.sessions, 0);
  const totalActiveUsers = dailyBreakdown.reduce((sum, row) => sum + row.activeUsers, 0);
  const totalPageViews = dailyBreakdown.reduce((sum, row) => sum + row.pageViews, 0);
  const totalConversions = dailyBreakdown.reduce((sum, row) => sum + row.conversions, 0);
  const avgEngagementRate = totalSessions ? dailyBreakdown.reduce((sum, row) => sum + row.engagementRate * row.sessions, 0) / totalSessions : 0;
  return {
    totalSessions,
    totalActiveUsers,
    totalPageViews,
    totalConversions,
    conversionRate: totalSessions ? Math.round((totalConversions / totalSessions) * 10000) / 100 : 0,
    avgEngagementRate: Math.round(avgEngagementRate * 1000) / 10,
    dailyBreakdown,
    dateRange: { startDate, endDate },
    propertyId: config.propertyId,
    fetchedAt: new Date().toISOString(),
  };
}
