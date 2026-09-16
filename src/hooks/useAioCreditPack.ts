/**
 * useAioCreditPack — Hook for purchasing the AIO Sync & Creative Studio credit pack.
 *
 * Creates a Stripe Checkout session for the 29€ one-time pack and opens it in a new tab.
 * Returns purchase state and pack info for UI display.
 */

import { useState, useCallback } from 'react';
import { createOneTimeCheckout, type CheckoutLegalConsent } from '../lib/billingClient';
import { isDemoRuntime } from '../lib/demoDomain';
import { ONE_TIME_PRODUCTS } from '../../shared/pricingCatalog';

const CANONICAL_PRODUCT = ONE_TIME_PRODUCTS.find((product) => product.id === 'kompilot_ai_750_once')!;
const CGV_VERSION = 'CGV_V1.0_2026-06';

export interface AioCreditPack {
  productId: 'kompilot_ai_750_once';
  priceHT: number;
  priceTTC: number;
  creditAmount: number;
  label: string;
  description: string;
}

export const AIO_CREDIT_PACK: AioCreditPack = {
  productId: 'kompilot_ai_750_once',
  priceHT: CANONICAL_PRODUCT.amountEurHt ?? 0,
  priceTTC: (CANONICAL_PRODUCT.amountEurHt ?? 0) * 1.2,
  creditAmount: CANONICAL_PRODUCT.creditAmount ?? 0,
  label: CANONICAL_PRODUCT.name,
  description: CANONICAL_PRODUCT.description,
};

export function useAioCreditPack() {
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchase = useCallback(async () => {
    setPurchasing(true);
    setError(null);

    try {
      if (isDemoRuntime()) {
        const message = 'Mode démo : action simulée, aucun paiement réel.';
        setError(message);
        return { url: null, error: message };
      }
      const consent: CheckoutLegalConsent = {
        cgvAccepted: true,
        retractionWaived: true,
        cgvVersion: CGV_VERSION,
        acceptedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };
      const result = await createOneTimeCheckout(CANONICAL_PRODUCT.id, consent);
      if (!result.url) {
        const message = result.error || 'Aucune URL de paiement reçue.';
        setError(message);
        return { url: null, error: message };
      }
      window.open(result.url, '_blank', 'noopener,noreferrer');
      return { url: result.url, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur réseau';
      setError(message);
      return { url: null, error: message };
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
