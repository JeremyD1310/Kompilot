/**
 * useAioCreditPack — Hook for purchasing the AIO Sync & Creative Studio credit pack.
 *
 * Creates a Stripe Checkout session for the 29€ one-time pack and opens it in a new tab.
 * Returns purchase state and pack info for UI display.
 */

import { useCallback, useState } from 'react';
import { createOneTimeCheckout, type CheckoutLegalConsent } from '../lib/billingClient';
import { isDemoRuntime } from '../lib/demoDomain';
import { ONE_TIME_PRODUCTS, type PricingProductId } from '../../shared/pricingCatalog';

const CGV_VERSION = 'CGV_V1.0_2026-06';
const AI_PRODUCT_IDS = ['kompilot_ai_250_once', 'kompilot_ai_750_once', 'kompilot_ai_2000_once'] as const;
export type AioCreditProductId = typeof AI_PRODUCT_IDS[number];

export interface AioCreditPack {
  productId: AioCreditProductId;
  priceHT: number;
  priceTTC: number;
  creditAmount: number;
  label: string;
  description: string;
}

export const AIO_CREDIT_PACKS: readonly AioCreditPack[] = AI_PRODUCT_IDS.map((productId) => {
  const product = ONE_TIME_PRODUCTS.find((item) => item.id === productId);
  if (!product || product.creditType !== 'ai' || !product.creditAmount || product.amountEurHt === null) {
    throw new Error(`Offre IA canonique introuvable: ${productId}`);
  }
  return {
    productId,
    priceHT: product.amountEurHt,
    priceTTC: product.amountEurHt * 1.2,
    creditAmount: product.creditAmount,
    label: product.name,
    description: product.description,
  };
});

/** Backwards-compatible default used by compact consumers: the middle offer. */
export const AIO_CREDIT_PACK = AIO_CREDIT_PACKS[1];

function isAllowedAioProduct(productId: PricingProductId): productId is AioCreditProductId {
  return AI_PRODUCT_IDS.includes(productId as AioCreditProductId);
}

export function useAioCreditPack() {
  const [purchasingProductId, setPurchasingProductId] = useState<AioCreditProductId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const purchase = useCallback(async (productId: PricingProductId = AIO_CREDIT_PACK.productId) => {
    setError(null);
    if (!isAllowedAioProduct(productId)) {
      const message = 'Offre de recharge IA inconnue.';
      setError(message);
      return { url: null, error: message, code: 'INVALID_PRODUCT' };
    }
    setPurchasingProductId(productId);
    try {
      if (isDemoRuntime()) {
        const message = 'Mode démo : action simulée, aucun paiement réel.';
        setError(message);
        return { url: null, error: message, code: 'DEMO_BILLING_BLOCKED' };
      }
      const legalConsent: CheckoutLegalConsent = {
        cgvAccepted: true,
        retractionWaived: true,
        cgvVersion: CGV_VERSION,
        acceptedAt: new Date().toISOString(),
        userAgent: typeof navigator === 'undefined' ? undefined : navigator.userAgent,
      };
      const result = await createOneTimeCheckout(productId, legalConsent);
      if (!result.url) {
        const message = result.error || 'Aucune URL de paiement reçue.';
        setError(message);
        return { url: null, error: message, code: result.code };
      }
      const popup = window.open(result.url, '_blank', 'noopener,noreferrer');
      if (!popup) {
        const message = 'Autorisez les fenêtres pop-up puis réessayez.';
        setError(message);
        return { url: null, error: message, code: 'POPUP_BLOCKED' };
      }
      return { url: result.url, error: null };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Erreur réseau';
      setError(message);
      return { url: null, error: message, code: 'CHECKOUT_ERROR' };
    } finally {
      setPurchasingProductId(null);
    }
  }, []);

  return {
    packs: AIO_CREDIT_PACKS,
    pack: AIO_CREDIT_PACK,
    purchase,
    purchasing: purchasingProductId !== null,
    purchasingProductId,
    error,
    clearError: () => setError(null),
  };
}
