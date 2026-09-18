/**
 * billingClient.ts — Frontend helper for Kompilot billing endpoints.
 * Calls the deployed Hono backend (/api/billing/*) with Blink auth.
 */
import { blink } from '../blink/client';
import { isDemoRuntime } from './demoDomain';
import { backendFetch } from './backend';
import type { BillingInterval, PricingProductId, SubscriptionPlanId } from '../../shared/pricingCatalog';

// ── Types ─────────────────────────────────────────────────────────────────────

export type BackendSubscriptionStatus =
  | 'active'
  | 'payment_failed'
  | 'grace'
  | 'cancelled'
  | 'unpaid';

export interface BillingStatus {
  status: BackendSubscriptionStatus;
  gracePeriodEnd: string | null;
  hasStripeCustomer: boolean;
  planId: string | null;
  stripeSubscriptionId: string | null;
}

export type PortalError =
  | 'STRIPE_NOT_CONFIGURED'
  | 'NO_STRIPE_CUSTOMER'
  | 'UNAUTHORIZED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface PortalResult {
  url: string | null;
  error: PortalError | null;
}

export interface CreditBalance {
  balance: number;
  monthlyIncluded?: number;
  monthlyUsed?: number;
  monthlyLimit?: number;
}

export interface CreditHistoryEntry {
  id: string;
  amount: number;
  action: string;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await blink.auth.getValidToken().catch(() => null);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Request a Stripe Customer Portal session URL.
 * Opens the URL in a new tab (caller's responsibility).
 */
export async function createBillingPortalSession(): Promise<PortalResult> {
  try {
    const headers = await getAuthHeader();
    const res = await backendFetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
    });
    const data = await res.json() as {
      url?: string;
      error?: string;
      code?: string;
    };
    if (!res.ok) {
      const code = (data.code as PortalError) || 'UNKNOWN';
      return { url: null, error: code };
    }
    return { url: data.url ?? null, error: null };
  } catch {
    return { url: null, error: 'NETWORK_ERROR' };
  }
}

/** Clickwrap consent payload sent with every checkout request */
export interface CheckoutLegalConsent {
  cgvAccepted: boolean;
  retractionWaived: boolean;
  cgvVersion: string;
  acceptedAt: string;
  userAgent?: string;
  /** When true, user renounces their free trial → backend sends trial_period_days=0 to Stripe */
  renouncedTrial?: boolean;
}

/**
 * Create a Stripe Checkout session for a given planId.
 * Requires a valid legalConsent payload — backend will reject requests without it (HTTP 422).
 * Returns the checkout URL or null on error.
 */
export async function createCheckoutSession(
  planId: SubscriptionPlanId,
  billing: BillingInterval,
  legalConsent: CheckoutLegalConsent,
): Promise<{ url: string | null; fallback?: boolean; error?: string; code?: string }> {
  try {
    const headers = await getAuthHeader();
    const res = await backendFetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ planId, billing, legalConsent }),
    });
    const data = await res.json() as { url?: string; fallback?: boolean; error?: string; code?: string };
    if (!res.ok) return { url: null, error: data.error || 'UNKNOWN', code: data.code };
    return { url: data.url ?? null, fallback: data.fallback };
  } catch {
    return { url: null, error: 'NETWORK_ERROR' };
  }
}

/** Create a one-time Stripe Checkout session for a catalog product. */
export async function createOneTimeCheckout(
  productId: PricingProductId,
  legalConsent: CheckoutLegalConsent,
): Promise<{ url: string | null; error?: string; code?: string }> {
  if (isDemoRuntime()) {
    return { url: null, error: 'Mode démo : action simulée, aucun paiement réel.', code: 'DEMO_BILLING_BLOCKED' };
  }
  try {
    const headers = await getAuthHeader();
    const res = await backendFetch('/api/billing/one-time-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ productId, legalConsent }),
    });
    const data = await res.json() as { url?: string; error?: string; code?: string };
    if (!res.ok) return { url: null, error: data.error || 'UNKNOWN', code: data.code };
    return { url: data.url ?? null };
  } catch {
    return { url: null, error: 'NETWORK_ERROR' };
  }
}

/**
 * Fetch the current billing / subscription status from the backend.
 * Falls back gracefully on network error.
 */
export async function fetchBillingStatus(): Promise<BillingStatus> {
  const fallback: BillingStatus = {
    status: 'unpaid',
    gracePeriodEnd: null,
    hasStripeCustomer: false,
    planId: null,
    stripeSubscriptionId: null,
  };

  try {
    const token = await blink.auth.getValidToken().catch(() => null);
    if (!token) return fallback;

    const res = await backendFetch('/api/billing/status', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return fallback;
    return await res.json() as BillingStatus;
  } catch {
    return fallback;
  }
}

/**
 * Fetch the current credit balance from the backend.
 */
export async function fetchCreditBalance(): Promise<CreditBalance> {
  const token = await blink.auth.getValidToken().catch(() => null);
  if (!token) {
    // No production fallback, as per instruction.
    // This will throw an error if token is null.
    throw new Error('Authentication token not available.');
  }

  const res = await backendFetch('/api/credits/balance', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    // No production fallback, as per instruction.
    // This will throw an error if the response is not ok.
    throw new Error(`Failed to fetch credit balance: ${res.statusText}`);
  }
  return await res.json() as CreditBalance;
}

/**
 * Fetch the credit history from the backend.
 */
export async function fetchCreditHistory(): Promise<CreditHistoryEntry[]> {
  const token = await blink.auth.getValidToken().catch(() => null);
  if (!token) {
    // No production fallback, as per instruction.
    // This will throw an error if token is null.
    throw new Error('Authentication token not available.');
  }

  const res = await backendFetch('/api/credits/history', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    // No production fallback, as per instruction.
    // This will throw an error if the response is not ok.
    throw new Error(`Failed to fetch credit history: ${res.statusText}`);
  }
  return await res.json() as CreditHistoryEntry[];
}

// ── Human-readable portal error messages ─────────────────────────────────────

export function portalErrorLabel(code: PortalError): string {
  switch (code) {
    case 'STRIPE_NOT_CONFIGURED':
      return "Le portail Stripe n'est pas encore configuré. Contactez le support.";
    case 'NO_STRIPE_CUSTOMER':
      return 'Aucun abonnement actif trouvé. Souscrivez un plan pour accéder au portail.';
    case 'UNAUTHORIZED':
      return 'Session expirée. Reconnectez-vous.';
    case 'NETWORK_ERROR':
      return 'Erreur réseau. Vérifiez votre connexion et réessayez.';
    default:
      return 'Une erreur inattendue est survenue. Réessayez dans un instant.';
  }
}
