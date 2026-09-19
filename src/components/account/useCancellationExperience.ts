import { useEffect, useState } from 'react';
import {
  fetchCancellationBillingStatus,
  fetchCancellationMetrics,
  type BillingStatus,
  type CancellationMetrics,
} from '../../lib/cancellationClient';

export function useCancellationExperience() {
  const [metrics, setMetrics] = useState<CancellationMetrics | null>(null);
  const [billing, setBilling] = useState<BillingStatus>({
    status: 'unpaid',
    gracePeriodEnd: null,
    hasStripeCustomer: false,
    planId: null,
    stripeSubscriptionId: null,
  });

  useEffect(() => {
    fetchCancellationMetrics().then(setMetrics);
    fetchCancellationBillingStatus().then(setBilling);
  }, []);

  return { metrics, billing, setBilling };
}
