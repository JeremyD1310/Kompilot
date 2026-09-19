import { blink } from '@/blink/client';
import { backendFetch, readBackendError } from '@/lib/backend';
import type { BillingInterval, SubscriptionPlanId } from '../../shared/pricingCatalog';
import { fetchBillingStatus, type BillingStatus } from '@/lib/billingClient';

export { type BillingStatus };

export interface CancellationMetrics {
  hasPersonalMetrics: boolean;
  reviewsHandled: number | null;
  postsPublished: number | null;
  geoScoreStart: number | null;
  geoScoreCurrent: number | null;
  geoScoreDelta: number | null;
}

export interface FeatureCheckResult {
  exists: boolean;
  featureName?: string;
  description?: string;
  tryPath?: string;
}

async function authRequest(path: string, init: RequestInit = {}) {
  const token = await blink.auth.getValidToken();
  return backendFetch(path, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
  });
}

export async function fetchCancellationMetrics(): Promise<CancellationMetrics | null> {
  try {
    const response = await authRequest('/api/cancellation/context');
    if (!response.ok) return null;
    return await response.json() as CancellationMetrics;
  } catch {
    return null;
  }
}

export async function fetchCancellationBillingStatus(): Promise<BillingStatus> {
  return fetchBillingStatus();
}

export async function checkMissingFeature(feature: string): Promise<FeatureCheckResult> {
  const response = await authRequest('/api/cancellation/feature-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feature }),
  });
  if (!response.ok) throw await readBackendError(response, 'La vérification de la fonctionnalité a échoué.');
  return await response.json() as FeatureCheckResult;
}

export async function submitMissingFeature(feature: string): Promise<void> {
  const response = await authRequest('/api/cancellation/feature-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feature }),
  });
  if (!response.ok) throw await readBackendError(response, 'La demande n’a pas pu être transmise.');
}

export async function changeBillingPlan(newPlanId: SubscriptionPlanId, newBilling: BillingInterval) {
  const response = await authRequest('/api/billing/change-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPlanId, newBilling }),
  });
  if (!response.ok) throw await readBackendError(response, 'Le changement de forfait n’a pas pu être effectué.');
  return await response.json() as { success: boolean; subscription?: { currentPeriodEnd?: string } };
}

export async function scheduleCancellation() {
  const response = await authRequest('/api/billing/process-refund', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cancel_at_period_end' }),
  });
  if (!response.ok) throw await readBackendError(response, 'La résiliation n’a pas pu être programmée.');
  return await response.json() as { success: boolean; action?: string };
}
