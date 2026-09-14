import { useState, useCallback, useRef } from 'react';
import { BACKEND_URL } from '../config/api';
import { blink } from '../blink/client';

export interface SiretAiSuggestions {
  suggestedSector: string;
  suggestedObjectives: string[];
  suggestedBusinessName: string;
  reasoning: string;
}

export interface SiretSuggestInput {
  siret: string;
  companyName: string;
  activityCode?: string;
  activityLabel?: string;
  city?: string;
  legalAddress?: string;
  postalCode?: string;
  legalForm?: string;
  verificationSource?: string;
}

interface UseSiretAiSuggestReturn {
  suggestions: SiretAiSuggestions | null;
  isLoading: boolean;
  error: string | null;
  fetchSuggestions: (data: SiretSuggestInput) => Promise<void>;
}

/**
 * Hook to fetch AI-powered onboarding suggestions based on SIRET data.
 * Calls POST /api/siret/ai-suggest (requires auth).
 */
export function useSiretAiSuggest(): UseSiretAiSuggestReturn {
  const [suggestions, setSuggestions] = useState<SiretAiSuggestions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedSiretRef = useRef<string>('');

  const fetchSuggestions = useCallback(async (data: SiretSuggestInput) => {
    // Avoid duplicate calls for the same SIRET
    if (fetchedSiretRef.current === data.siret) return;

    setIsLoading(true);
    setError(null);
    fetchedSiretRef.current = data.siret;

    try {
      const token = await blink.auth.getValidToken();
      const response = await fetch(`${BACKEND_URL}/api/siret/ai-suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({} as any));
        throw new Error((body as any)?.error || `HTTP ${response.status}`);
      }

      const json = await response.json() as { suggestions: SiretAiSuggestions };
      setSuggestions(json.suggestions);
    } catch (err: any) {
      const message = err?.message || 'Erreur lors de la suggestion IA';
      setError(message);
      console.warn('[useSiretAiSuggest]', message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { suggestions, isLoading, error, fetchSuggestions };
}
