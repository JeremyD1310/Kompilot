/**
 * useAioCreditPack — Hook for purchasing the AIO Sync & Creative Studio credit pack.
 *
 * Creates a Stripe Checkout session for the 29€ one-time pack and opens it in a new tab.
 * Returns purchase state and pack info for UI display.
 */

import { useState, useCallback } from 'react';
import { blink } from '../blink/client';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

export interface AioCreditPack {
  priceHT: number;
  priceTTC: number;
  lumaCredits: number;
  serpapiCredits: number;
  label: string;
  description: string;
}

export const AIO_CREDIT_PACK: AioCreditPack = {
  priceHT: 29,
  priceTTC: 34.80, // 29 × 1.20 TVA
  lumaCredits: 50,
  serpapiCredits: 500,
  label: 'Pack AIO Sync & Creative Studio',
  description: '50 générations vidéo Luma AI + 500 requêtes SerpApi — crédits sans limite de durée',
};

export function useAioCreditPack() {
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchase = useCallback(async () => {
    setPurchasing(true);
    setError(null);

    try {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/billing/credit-pack-aio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json() as { url?: string; error?: string; code?: string };

      if (!res.ok) {
        const msg = data.error || `Erreur HTTP ${res.status}`;
        setError(msg);
        return { url: null, error: msg };
      }

      if (data.url) {
        // Open Stripe Checkout in new tab (Stripe blocks iframes)
        window.open(data.url, '_blank', 'noopener,noreferrer');
        return { url: data.url, error: null };
      }

      setError('Aucune URL de paiement reçue.');
      return { url: null, error: 'No URL returned' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau';
      setError(msg);
      return { url: null, error: msg };
    } finally {
      setPurchasing(false);
    }
  }, []);

  return {
    pack: AIO_CREDIT_PACK,
    purchase,
    purchasing,
    error,
    clearError: () => setError(null),
  };
}
