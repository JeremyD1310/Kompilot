/**
 * useAdAudit.ts — React Query hooks for Ad Performance Audit
 */

import { useQuery, useMutation } from '@tanstack/react-query'
import { blink } from '@/blink/client'

const API_BASE = 'https://gbrhsehk.backend.blink.new'

async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const token = await blink.auth.getValidToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  return res.json()
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CpcSourceMetric {
  source: string
  sessions: number
  engagementRate: number
  conversions: number
  revenue: number
}

export interface CpcAnalyticsResult {
  cpcSessions: number
  cpcEngagementRate: number
  cpcConversions: number
  cpcRevenue: number
  totalSiteRevenue: number
  totalSiteSessions: number
  sources: CpcSourceMetric[]
  dateRange: { startDate: string; endDate: string }
  propertyId: string
  fetchedAt: string
}

export interface AuditRequest {
  sector: string
  adChannels: string
  adSpend: number
  targetRoas: number
  displayedRoas?: string
  cpcTrend?: string
  churnRate?: string
  ltv?: string
  startDate?: string
  endDate?: string
}

export interface AuditResult {
  inputs: {
    sector: string
    adChannels: string
    adSpend: number
    targetRoas: number
    displayedRoas: string
    cpcTrend: string
    churnRate: string
    ltv: string
  }
  ga4: {
    cpcSessions: number
    cpcEngagementRate: number
    cpcConversions: number
    cpcRevenue: number
    totalSiteRevenue: number
    totalSiteSessions: number
    sources: CpcSourceMetric[]
    dateRange: { startDate: string; endDate: string }
  }
  computed: {
    realRoas: number
    mer: number
    conversionRate: number
    cpa: number
  }
  generatedAt: string
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

/** Fetch raw GA4 CPC data (preview before generating full audit) */
export function useCpcData(startDate?: string, endDate?: string) {
  return useQuery<CpcAnalyticsResult>({
    queryKey: ['ad-audit-cpc', startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      const qs = params.toString()
      return fetchWithAuth(`/api/ad-audit/cpc-data${qs ? `?${qs}` : ''}`)
    },
    staleTime: 5 * 60 * 1000, // 5 min
    retry: 1,
  })
}

/** Generate the full ad audit */
export function useGenerateAudit() {
  return useMutation<AuditResult, Error, AuditRequest>({
    mutationFn: (body) =>
      fetchWithAuth('/api/ad-audit/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  })
}
