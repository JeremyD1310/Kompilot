/**
 * billingClient.ts — Frontend helper for Kompilot billing endpoints.
 * Calls the deployed Hono backend (/api/billing/*) with Blink auth.
 */
import { blink } from '../blink/client';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

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
    const res = await fetch(`${BACKEND_URL}/api/billing/portal`, {
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
  planId: string,
  legalConsent: CheckoutLegalConsent,
): Promise<{ url: string | null; fallback?: boolean; error?: string; code?: string }> {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${BACKEND_URL}/api/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ planId, legalConsent }),
    });
    const data = await res.json() as { url?: string; fallback?: boolean; error?: string; code?: string };
    if (!res.ok) return { url: null, error: data.error || 'UNKNOWN', code: data.code };
    return { url: data.url ?? null, fallback: data.fallback };
  } catch {
    return { url: null, error: 'NETWORK_ERROR' };
  }
}

/**
 * Fetch the current billing / subscription status from the backend.
 * Falls back gracefully on network error.
 */
export async function fetchBillingStatus(): Promise<BillingStatus> {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${BACKEND_URL}/api/billing/status`, { headers });
    if (!res.ok) return { status: 'active', gracePeriodEnd: null, hasStripeCustomer: false, planId: null, stripeSubscriptionId: null };
    return await res.json() as BillingStatus;
  } catch {
    return { status: 'active', gracePeriodEnd: null, hasStripeCustomer: false, planId: null, stripeSubscriptionId: null };
  }
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
