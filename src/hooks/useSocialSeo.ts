/**
 * Social-to-SEO data fetching hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '@/blink/client'
import type { SocialSeoDashboardData } from '@/data/socialSeo/mockData'

export interface OnboardingState {
  hasCompletedOnboarding: boolean
  currentStep: number
  connectedPlatforms: string[]
  gscConnected: boolean
}

export interface GraderResult {
  domain: string
  score: number
  grade: string
  partialResults: {
    impressions: number
    platformsDetected: string[]
    estimatedClicks: number
    topQueryCount: number
    opportunitiesDetected: number
  }
  isPartial: boolean
  message: string
}

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

// ─── Dashboard Data ───────────────────────────────────────────────────

export function useSocialSeoDashboard() {
  return useQuery<SocialSeoDashboardData & { fromCache: boolean }>({
    queryKey: ['social-seo', 'dashboard'],
    queryFn: () => fetchWithAuth('/api/social-seo/dashboard'),
    staleTime: 5 * 60 * 1000, // 5 minutes (cache TTL is 24h server-side)
    refetchOnWindowFocus: false,
  })
}

// ─── Onboarding State ─────────────────────────────────────────────────

export function useSocialSeoOnboarding() {
  return useQuery<OnboardingState>({
    queryKey: ['social-seo', 'onboarding'],
    queryFn: () => fetchWithAuth('/api/social-seo/onboarding'),
    staleTime: 30 * 1000,
  })
}

export function useUpdateOnboarding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<OnboardingState & { currentStep: number; hasCompletedOnboarding: boolean }>) =>
      fetchWithAuth('/api/social-seo/onboarding', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-seo', 'onboarding'] }),
  })
}

// ─── Insight Dismiss ──────────────────────────────────────────────────

export function useDismissInsight() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (insightId: string) =>
      fetchWithAuth(`/api/social-seo/insights/${insightId}/dismiss`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-seo'] }),
  })
}

// ─── Lead Magnet Grader (public, no auth) ─────────────────────────────

export function useGrader(domain: string, enabled: boolean) {
  return useQuery<GraderResult>({
    queryKey: ['social-seo', 'grader', domain],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/social-seo/grader?domain=${encodeURIComponent(domain)}`)
      if (!res.ok) throw new Error('Grader failed')
      return res.json()
    },
    enabled,
    staleTime: 60 * 1000,
  })
}
