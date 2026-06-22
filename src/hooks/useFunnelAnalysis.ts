/**
 * useFunnelAnalysis — business logic hook for TunnelsPage
 *
 * Handles:
 *  - Calling backend /api/funnels/analyze-full (tech stack + Meta Ads + 21-day filter)
 *  - Calling backend /api/funnels/analyze (mock funnel structure fallback)
 *  - Local mock fallback when backend is unreachable
 *  - Watch toggle (optimistic + backend PATCH)
 *  - Recent searches persistence
 */
import { useState, useCallback } from 'react';
import { blink } from '../blink/client';
import { apiFetch } from '../config/api';
import {
  findSampleFunnel,
  generateMockFunnel,
} from '../components/tunnels/funnelMockData';
import type { FunnelData } from '../components/tunnels/types';
import type { TechStackTool } from '../components/tunnels/types';
import toast from 'react-hot-toast';

// ── Category map for backend tool names → TechStackTool['category'] ──────────
const CATEGORY_BY_NAME: Record<string, TechStackTool['category']> = {
  Stripe: 'payment', PayPal: 'payment', Gumroad: 'payment', Mollie: 'payment', Braintree: 'payment',
  ClickFunnels: 'builder', 'Systeme.io': 'builder', WordPress: 'builder', Kajabi: 'builder',
  Teachable: 'builder', Webflow: 'builder', Shopify: 'builder', Leadpages: 'builder',
  Typeform: 'other', Tally: 'other', Calendly: 'other',
  ActiveCampaign: 'email', Mailchimp: 'email', ConvertKit: 'email', Drip: 'email',
  Lemlist: 'email', Brevo: 'email', HubSpot: 'crm',
  Intercom: 'support', Crisp: 'support',
  'Meta Pixel': 'ads', 'Google Analytics': 'analytics', Hotjar: 'analytics',
  Clarity: 'analytics', 'TikTok Pixel': 'ads', 'LinkedIn Insight': 'ads', PostHog: 'analytics',
  'Google Ads Tag': 'ads',
};

function namesToTools(names: string[]): TechStackTool[] {
  return names.map(name => ({
    name,
    category: CATEGORY_BY_NAME[name] ?? 'other',
    confidence: 90,
  }));
}

interface AnalyzeFullResponse {
  success: boolean;
  techStack: string[];
  metrics: { estimatedPerformanceScore: number };
}

interface AnalyzeMockResponse {
  funnel: FunnelData;
}

// ── Checklist helpers ──────────────────────────────────────────────────────
function markChecklist(key: string) {
  try {
    const userId = localStorage.getItem('blink_user_id') ?? '';
    if (userId) localStorage.setItem(`${key}_${userId}`, '1');
  } catch { /* noop */ }
}

export function useFunnelAnalysis() {
  const [activeFunnel, setActiveFunnel] = useState<FunnelData | null>(null);
  const [isAnalyzing, setIsAnalyzing]   = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('tunnels_recent') ?? '[]'); } catch { return []; }
  });

  const analyze = useCallback(async (query: string, platform: string) => {
    const q = query.trim();
    if (!q) return;

    setIsAnalyzing(true);

    try {
      // 1. Fast local match (instant — 0 ms)
      let funnel: FunnelData | null = findSampleFunnel(q);

      // 2. JWT — fetch once, reuse for all subsequent calls
      const token = await blink.auth.getValidToken().catch(() => null);

      // 3. Backend structure fetch (if no local match)
      if (!funnel && token) {
        try {
          const params = new URLSearchParams({ query: q, platform });
          const res = await apiFetch<AnalyzeMockResponse>(
            `/api/funnels/analyze?${params}`,
            { method: 'GET', token, timeoutMs: 8_000 },
          );
          funnel = res.funnel;
        } catch {
          funnel = generateMockFunnel(q, platform);
        }
      } else if (!funnel) {
        funnel = generateMockFunnel(q, platform);
      }

      if (!funnel) funnel = generateMockFunnel(q, platform);

      // ── PHASE 1: Show funnel structure IMMEDIATELY (no waiting for slow APIs)
      setActiveFunnel(funnel);
      setIsAnalyzing(false);

      // Persist recent searches (synchronous after first display)
      const next = [q, ...recentSearches.filter(s => s !== q)].slice(0, 6);
      setRecentSearches(next);
      try { localStorage.setItem('tunnels_recent', JSON.stringify(next)); } catch {}

      toast.success(`Tunnel de "${funnel.creator_name}" chargé !`);
      // Mark checklist: viewed first tunnel map
      markChecklist('checklist_viewed_tunnels');

      // ── PHASE 2: Silent background enrichment (tech stack + Meta Ads)
      // Does NOT block the UI — user can already explore the funnel
      if (token && !funnel.is_sample) {
        apiFetch<AnalyzeFullResponse>(
          '/api/funnels/analyze-full',
          {
            method: 'POST',
            token,
            timeoutMs: 15_000,  // allow more time for external scans
            body: JSON.stringify({
              domainUrl: funnel.domain_url,
              competitorName: funnel.creator_name,
            }),
          },
        )
          .then(full => {
            setActiveFunnel(prev => {
              if (!prev) return prev; // user may have cleared the funnel
              return {
                ...prev,
                performance_score: full.metrics.estimatedPerformanceScore > 0
                  ? full.metrics.estimatedPerformanceScore
                  : prev.performance_score,
                tech_stack: full.techStack.length > 0
                  ? namesToTools(full.techStack)
                  : prev.tech_stack,
              };
            });
          })
          .catch(() => { /* non-critical — keep existing data */ });
      }
    } catch {
      toast.error("Impossible d'analyser ce tunnel. Réessayez.");
      setIsAnalyzing(false);
    }
  }, [recentSearches]);

  const toggleWatch = useCallback(async (funnel: FunnelData) => {
    const nowWatched = !funnel.is_watched;
    setActiveFunnel(prev => prev ? { ...prev, is_watched: nowWatched } : prev);

    try {
      const token = await blink.auth.getValidToken().catch(() => null);
      if (token && !funnel.is_sample) {
        await apiFetch(`/api/funnels/${funnel.id}/watch`, {
          method: 'PATCH',
          token,
          body: JSON.stringify({ is_watched: nowWatched }),
        });
      }
    } catch { /* optimistic — ignore backend error */ }

    if (nowWatched) {
      toast.success('Tunnel ajouté à la watchlist.', { duration: 3000 });
      // Mark checklist: activated Watch Funnel
      markChecklist('checklist_watched_funnel');
    } else {
      toast('Alertes désactivées.');
    }
  }, []);

  const clearFunnel = useCallback(() => setActiveFunnel(null), []);

  const dismissAlerts = useCallback(() => {
    setActiveFunnel(prev => prev ? { ...prev, watch_alerts: [] } : prev);
  }, []);

  return {
    activeFunnel,
    setActiveFunnel,
    isAnalyzing,
    recentSearches,
    analyze,
    toggleWatch,
    clearFunnel,
    dismissAlerts,
  };
}
