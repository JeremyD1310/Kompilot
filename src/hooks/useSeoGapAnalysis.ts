import { useQuery } from '@tanstack/react-query';
import { blink } from '../blink/client';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

export interface GapOpportunity {
  topic: string;
  keywords: string[];
  difficulty: number;
  searchVolume: number;
  competitorPosition: number;
  competitorDomain: string;
  opportunityScore: number;
  suggestedAngle: string;
  contentType: string;
}

export interface GapAnalysisResult {
  opportunities: GapOpportunity[];
  competitorSummary: string;
  actionPlan: string[];
  creditsLeft: number;
  dataSource?: 'dataforseo' | 'serp_api' | 'ai_estimated';
}

export interface GapStatusResult {
  hasCredits: boolean;
  creditsLeft: number;
  creditsLimit: number;
  plan: string;
  isOnboarding: boolean;
  establishment: string | null;
  activity: string | null;
  city: string | null;
  website: string | null;
}

export function useSeoGapStatus() {
  return useQuery({
    queryKey: ['seo-gap-status'],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<GapStatusResult> => {
      const token = await blink.auth.getValidToken().catch(() => null);
      if (!token) throw new Error('Session expirée');

      const res = await fetch(`${BACKEND_URL}/api/seo-gap/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Erreur serveur: ${res.status}`);
      return res.json();
    },
  });
}

export function useSeoGapAnalysis(enabled = false) {
  return useQuery({
    queryKey: ['seo-gap-analysis'],
    staleTime: 10 * 60 * 1000,
    enabled,
    queryFn: async (): Promise<GapAnalysisResult> => {
      const token = await blink.auth.getValidToken().catch(() => null);
      if (!token) throw new Error('Session expirée');

      const res = await fetch(`${BACKEND_URL}/api/seo-gap/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });

      if (res.status === 402) {
        const err = await res.json().catch(() => ({}));
        throw new Error('NO_CREDITS');
      }
      if (!res.ok) throw new Error(`Erreur serveur: ${res.status}`);
      return res.json();
    },
  });
}
