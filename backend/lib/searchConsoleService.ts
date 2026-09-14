export type GscRow = { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number };
export type GscQueryResponse = { rows?: GscRow[]; responseAggregationType?: string };
export type LiveSerpResult = {
  position: number;
  domain: string;
  title: string;
  url: string;
  snippet: string;
};

export type PageProfile = {
  url: string;
  title: string;
  headings: string[];
  wordCount: number;
  headingCount: number;
  latestYear: number | null;
  hasNumericData: boolean;
  hasFaq: boolean;
  format: 'comparatif' | 'guide' | 'liste' | 'service' | 'article';
};

const API = 'https://searchconsole.googleapis.com/webmasters/v3';
const ROW_LIMIT = 25_000;
const MAX_ROWS = 100_000;

async function request<T = any>(url: string, init: RequestInit = {}) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`GSC ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return response.json() as Promise<T>;
}

export async function exchangeCode(code: string, clientId: string, secret: string, redirectUri: string) {
  const body = new URLSearchParams({ code, client_id: clientId, client_secret: secret, redirect_uri: redirectUri, grant_type: 'authorization_code' });
  return request('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
}

export async function refreshAccessToken(refreshToken: string, clientId: string, secret: string) {
  const body = new URLSearchParams({ refresh_token: refreshToken, client_id: clientId, client_secret: secret, grant_type: 'refresh_token' });
  return request('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
}

export async function listSites(token: string) {
  const data = await request<{ siteEntry?: Array<{ siteUrl: string; permissionLevel: string }> }>(`${API}/sites`, { headers: { Authorization: `Bearer ${token}` } });
  return (data.siteEntry ?? []).map(s => ({ siteUrl: s.siteUrl, permissionLevel: s.permissionLevel }));
}

export async function query(token: string, siteUrl: string, startDate: string, endDate: string, dimensions: string[] = [], startRow = 0) {
  return request<GscQueryResponse>(`${API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ startDate, endDate, dimensions, rowLimit: ROW_LIMIT, startRow, aggregationType: 'auto', dataState: 'final' }),
  });
}

export async function fetchAllRows(token: string, siteUrl: string, startDate: string, endDate: string, dimensions: string[]) {
  const rows: GscRow[] = [];
  let startRow = 0;
  let truncated = false;
  while (startRow < MAX_ROWS) {
    const page = await query(token, siteUrl, startDate, endDate, dimensions, startRow);
    const nextRows = page.rows ?? [];
    rows.push(...nextRows);
    if (nextRows.length < ROW_LIMIT) break;
    startRow += ROW_LIMIT;
  }
  if (rows.length >= MAX_ROWS) truncated = true;
  return { rows: rows.slice(0, MAX_ROWS), truncated };
}

export function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
export function subtractDays(date: Date, days: number) { const x = new Date(date); x.setUTCDate(x.getUTCDate() - days); return x; }
export function addDays(date: Date, days: number) { const x = new Date(date); x.setUTCDate(x.getUTCDate() + days); return x; }
export function period(end: Date, length: number) { return { startDate: isoDate(subtractDays(end, length - 1)), endDate: isoDate(end) }; }

export function metricFromRows(rows: GscRow[]) {
  const clicks = rows.reduce((sum, row) => sum + (Number(row.clicks) || 0), 0);
  const impressions = rows.reduce((sum, row) => sum + (Number(row.impressions) || 0), 0);
  const weightedPosition = rows.reduce((sum, row) => sum + (Number(row.position) || 0) * (Number(row.impressions) || 0), 0);
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: impressions ? weightedPosition / impressions : 0 };
}

export function normalizeDomain(value: string) {
  const raw = value.trim();
  if (raw.toLowerCase().startsWith('sc-domain:')) return raw.slice('sc-domain:'.length).replace(/^www\./, '').toLowerCase();
  try {
    return new URL(raw.startsWith('http') ? raw : `https://${raw}`).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return raw.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
  }
}

function isPublicHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.local') || host === '::1') return false;
    if (/^(10|127)\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

function cleanHtmlText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHeading(value: string) {
  return cleanHtmlText(value).replace(/\s+/g, ' ').trim();
}

function detectFormat(title: string, text: string, html: string): PageProfile['format'] {
  const haystack = `${title} ${text}`.toLowerCase();
  if (/comparatif|comparaison|vs\.?|contre|alternatives?/.test(haystack)) return 'comparatif';
  if (/comment|guide|tout savoir|conseils?|méthode|choisir/.test(haystack)) return 'guide';
  if (/<ol\b|<ul\b/i.test(html) || /top\s?\d+|meilleurs?|liste/.test(haystack)) return 'liste';
  if (/tarif|prix|acheter|réserver|devis|service|solution/.test(haystack)) return 'service';
  return 'article';
}

export async function fetchLiveSerp(keyword: string, serpApiKey: string): Promise<LiveSerpResult[]> {
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(keyword)}&api_key=${encodeURIComponent(serpApiKey)}&gl=fr&hl=fr&num=10`;
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`SERP ${response.status}: ${(await response.text()).slice(0, 200)}`);
  const data = await response.json() as { organic_results?: Array<{ position?: number; link?: string; title?: string; snippet?: string; displayed_link?: string; domain?: string }> };
  return (data.organic_results ?? []).map((result, index) => ({
    position: Number(result.position) || index + 1,
    domain: result.domain || normalizeDomain(result.link || result.displayed_link || ''),
    title: result.title || '',
    url: result.link || '',
    snippet: result.snippet || '',
  })).filter(result => result.url && isPublicHttpUrl(result.url));
}

export async function fetchPageProfile(url: string): Promise<PageProfile> {
  if (!isPublicHttpUrl(url)) throw new Error('URL de page non publique ou non valide');
  const response = await fetch(url, {
    signal: AbortSignal.timeout(12000),
    headers: { Accept: 'text/html,application/xhtml+xml', Range: 'bytes=0-1000000', 'User-Agent': 'Kompilot-SEO-Audit/1.0' },
  });
  if (!response.ok) throw new Error(`Page ${response.status}`);
  const html = (await response.text()).slice(0, 1_000_000);
  const title = decodeHeading(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const headings = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)].map(match => decodeHeading(match[1])).filter(Boolean).slice(0, 40);
  const text = cleanHtmlText(html);
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const years = [...text.matchAll(/\b(20\d{2})\b/g)].map(match => Number(match[1]));
  return {
    url,
    title,
    headings,
    wordCount: words.length,
    headingCount: headings.length,
    latestYear: years.length ? Math.max(...years) : null,
    hasNumericData: /\b\d+(?:[.,]\d+)?\s?(?:%|€|euros?|ans?|jours?|mois?|clients?|avis|points?|fois|milliards?|millions?)\b/i.test(text),
    hasFaq: /faq|questions fréquentes|foire aux questions|questions et réponses/i.test(`${title} ${text}`),
    format: detectFormat(title, text, html),
  };
}

export function rowsByKey(rows: GscRow[]) {
  const grouped = new Map<string, GscRow[]>();
  for (const row of rows) {
    const key = row.keys?.[0];
    if (!key) continue;
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }
  return new Map([...grouped.entries()].map(([key, values]) => [key, metricFromRows(values)]));
}

export function declineRate(current: number, previous: number) {
  if (previous <= 0) return current <= 0 ? 0 : 1;
  return (current - previous) / previous;
}

export function sameCalendarPeriodLastYear(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear() - 1, date.getUTCMonth(), date.getUTCDate()));
}

export function mergePageRows(rows: GscRow[]) {
  const grouped = new Map<string, GscRow[]>();
  for (const row of rows) {
    const page = row.keys?.[0];
    if (!page) continue;
    grouped.set(page, [...(grouped.get(page) ?? []), row]);
  }
  return new Map([...grouped.entries()].map(([page, values]) => [page, metricFromRows(values)]));
}