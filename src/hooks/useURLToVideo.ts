/**
 * useURLToVideo — React Query hooks for the URL-to-Video pipeline.
 * Scrape → Generate → Poll status
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { blink } from '../blink/client';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScrapedData {
  extractedData: {
    title: string;
    description: string;
    images: string[];
    prices: string[];
    category: string;
  };
  marketingContext: {
    hook: string;
    body: string[];
    cta: string;
    tone: string;
    targetAudience: string;
  };
}

export interface VideoGenerationResult {
  generationId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useScrapeURL() {
  return useMutation({
    mutationFn: async (url: string): Promise<ScrapedData> => {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/url-to-video/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });

      if (res.status === 422) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Impossible de lire cette URL.');
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Erreur serveur: ${res.status}`);
      }
      return res.json();
    },
  });
}

export function useGenerateVideo() {
  return useMutation({
    mutationFn: async (params: {
      scrapedData: ScrapedData;
      format?: 'square' | 'story' | 'landscape';
      duration?: number;
      style?: string;
    }): Promise<VideoGenerationResult> => {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/url-to-video/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Erreur serveur: ${res.status}`);
      }
      return res.json();
    },
  });
}

export function useVideoStatus(generationId: string | null) {
  return useQuery({
    queryKey: ['video-status', generationId],
    enabled: !!generationId,
    refetchInterval: 3000,
    queryFn: async (): Promise<VideoGenerationResult> => {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/url-to-video/status/${generationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Erreur serveur: ${res.status}`);
      return res.json();
    },
  });
}
