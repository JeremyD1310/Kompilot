/**
 * useUGCScript — React Query hook for UGC script generation.
 */
import { useMutation } from '@tanstack/react-query';
import { blink } from '../blink/client';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UGCScript {
  hook: {
    text: string;
    type: 'question' | 'provocation' | 'statistic' | 'story';
  };
  body: {
    points: Array<{ text: string; duration: string }>;
    transition: string;
  };
  cta: {
    text: string;
    type: 'booking' | 'website' | 'phone' | 'promo';
  };
  fullScript: string;
  estimatedDuration: string;
  voiceNotes: string;
  suggestedVariations: Array<{ tone: string; hook: string }>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGenerateUGCScript() {
  return useMutation({
    mutationFn: async (params: {
      topic: string;
      tone: string;
      keywords?: string[];
    }): Promise<UGCScript> => {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/ugc-script/generate`, {
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
