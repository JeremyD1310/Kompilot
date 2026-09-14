import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authHeaders, backendFetch, readBackendError } from '../lib/backend';

type Site = { siteUrl: string; permissionLevel: string };
export type Period = { startDate?: string; endDate?: string };
export type Metric = { clicks: number; impressions: number; ctr: number; position: number };
export type DecliningPage = {
  url: string;
  monthlyClicksAtRisk: number;
  trajectory: { m0m3: Metric; m3m6: Metric; m6m9: Metric };
  changes: { recentVsPrevious: number; previousVsOldest: number };
  seasonality: { classified: boolean; reason: string; matchingPriorYearChange: number };
  competitors: { note: string; urls: string[] };
  actions: Array<{ priority: 1 | 2 | 3; action: 'technical' | 'content' | 'internal_linking'; details: string }>;
};
export type AuditCase = { query: string; urls: Array<Metric & { url: string }>; cumulativeImpressions: number; lostImpressions: number; winner: { url: string; reason: string }; actions: Array<{ url: string; action: string; details: string }> };
export type Audit = {
  siteUrl: string;
  periods: { current: Period; previous: Period };
  aggregate: { current: Metric; previous: Metric; deltas: Metric };
  methodology?: { lookbackDays: number; threshold: number; minimumCompetingUrls: number; safetyRule: string };
  cannibalizationCases: AuditCase[];
  summary: { validatedCases: number; competingUrls: number; currentIndexedUrls: number; previousIndexedUrls: number; truncated?: boolean };
};

export type AuditReportMetric = {
  value: number;
  previous: number;
  delta: number;
  percent: number | null;
};
export type ReportPage = Metric & { url: string; deltaClicks: number; deltaClicksPercent: number | null };
export type ReportQuery = { query: string; impressions: number; clicks: number; ctr: number; position: number };
export type OrganicMetric = { clicks: number; impressions: number; ctr: number; position: number };
export type OrganicCause = { key: 'position' | 'impressions' | 'ctr' | 'deindexed' | 'insufficient_evidence'; label: string; evidence: string };
export type OrganicPageLoss = { url: string; lostClicks: number; current: OrganicMetric; previous: OrganicMetric; yearAgo: OrganicMetric; cause: OrganicCause; action: string };
export type OrganicMetricComparison = { value: number; previous: number; delta: number; percent: number | null };
export type OrganicDeclineReport = {
  siteUrl: string;
  periods: { current: Period; previous: Period; yearAgo: Period };
  methodology: { source: string; windowDays: number; reportLagDays: number; causeThresholds: string; noDataRule: string };
  aggregate: { current: OrganicMetric; previous: OrganicMetric; yearAgo: OrganicMetric; vsPrevious: Record<keyof OrganicMetric, OrganicMetricComparison>; vsYearAgo: Record<keyof OrganicMetric, OrganicMetricComparison> };
  rootCause: { key: OrganicCause['key']; label: string; evidence: string };
  dataAvailability: { current: boolean; previous: boolean; yearAgo: boolean; pagesCurrent: boolean; pagesPrevious: boolean; queriesCurrent: boolean; queriesPrevious: boolean };
  pages: OrganicPageLoss[];
  macro: { classification: 'concentrated' | 'diffuse' | 'insufficient_data'; evidence: string; method: string; totalLostClicks: number; clusters: Array<{ name: string; lostClicks: number; queryCount: number; share: number }> };
  summary: { currentPages: number; previousPages: number; topLosses: number; totalClicksLostOnTop10: number; queryLosses: number };
};

export type SearchConsoleReport = {
  siteUrl: string;
  periods: { current90: Period; previous90: Period; current30: Period; previous30: Period };
  methodology: { source: string; reportLagDays: number; quickWinRule: string; titleMetaRule: string; newQueryRule: string };
  keyMetrics: { clicks: AuditReportMetric; impressions: AuditReportMetric; position: AuditReportMetric };
  pages: { tops: ReportPage[]; flops: ReportPage[] };
  quickWins: ReportQuery[];
  titleMeta: Array<ReportPage & { expectedCtr: number; ctrGap: number }>;
  newQueries: ReportQuery[];
  summary: { pagesChecked: number; tops: number; flops: number; quickWins: number; titleMeta: number; newQueries: number; truncated?: boolean };
};

async function request(path: string, init?: RequestInit) {
  const response = await backendFetch(path, { ...init, headers: { ...(init?.headers || {}), ...(await authHeaders(Boolean(init?.body))) } });
  if (!response.ok) throw await readBackendError(response, 'Impossible de récupérer les données Search Console.');
  return response.json();
}

export function useSearchConsoleStatus() {
  return useQuery({ queryKey: ['search-console-status'], queryFn: () => request('/api/search-console/oauth/status'), retry: false });
}

export function useSearchConsoleAudit(siteUrl?: string) {
  return useQuery<Audit>({ queryKey: ['search-console-audit', siteUrl], queryFn: () => request(`/api/search-console/audit?siteUrl=${encodeURIComponent(siteUrl!)}`), enabled: Boolean(siteUrl), retry: false });
}

export function useSearchConsoleActions() {
  const client = useQueryClient();
  const connect = useMutation({ mutationFn: async () => request('/api/search-console/oauth/connect') });
  const disconnect = useMutation({ mutationFn: () => request('/api/search-console/oauth/disconnect', { method: 'POST' }), onSuccess: () => client.invalidateQueries({ queryKey: ['search-console-status'] }) });
  return { connect, disconnect };
}

export function useSlowDeclineAudit(siteUrl?: string) {
  return useQuery<Audit>({ queryKey: ['search-console-slow-decline', siteUrl], queryFn: () => request(`/api/search-console/audit?siteUrl=${encodeURIComponent(siteUrl!)}`), enabled: Boolean(siteUrl), retry: false });
}

export function useSearchConsoleContentGap() {
  return useMutation({
    mutationFn: (input: { siteUrl: string; competitorUrls: string[]; country?: string; language?: string }) => request('/api/search-console/content-gap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }),
  });
}

/** Legacy 90-day report hook retained for other screens. */
export function useSearchConsoleReport(siteUrl?: string) {
  return useQuery<SearchConsoleReport>({ queryKey: ['search-console-report', siteUrl], queryFn: () => request(`/api/search-console/report?siteUrl=${encodeURIComponent(siteUrl!)}`), enabled: Boolean(siteUrl), retry: false });
}

export function useOrganicDeclineReport(siteUrl?: string) {
  return useQuery<OrganicDeclineReport>({ queryKey: ['search-console-organic-decline', siteUrl], queryFn: () => request(`/api/search-console/organic-decline?siteUrl=${encodeURIComponent(siteUrl!)}`), enabled: Boolean(siteUrl), retry: false });
}

export type { Site };
