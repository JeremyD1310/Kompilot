import {
  ONE_TIME_PRODUCTS as SHARED_ONE_TIME_PRODUCTS,
  SUBSCRIPTION_PLANS,
  getOneTimePriceEnvKey,
  resolveOneTimeProduct as resolveSharedOneTimeProduct,
  resolveSubscriptionPlan,
  type BillingInterval,
  type SubscriptionPlanId,
} from '../../shared/pricingCatalog'

export type NewPlanId = SubscriptionPlanId
export { BillingInterval }

export const NEW_PLAN_PRICES: Record<NewPlanId, Record<BillingInterval, number>> = Object.fromEntries(
  SUBSCRIPTION_PLANS.map(plan => [plan.id, { monthly: plan.monthlyPriceEurHt * 100, yearly: plan.annualPriceEurHt * 100 }]),
) as Record<NewPlanId, Record<BillingInterval, number>>

export const ONE_TIME_PRODUCTS = Object.fromEntries(
  SHARED_ONE_TIME_PRODUCTS.map(product => [product.id, {
    amount: product.amountEurHt === null ? 0 : product.amountEurHt * 100,
    currency: 'eur',
    productType: product.productType,
    pilotDays: product.pilotDays,
    creditEligible: product.creditEligible,
    creditType: product.creditType,
    creditAmount: product.creditAmount,
    recurring: product.recurring,
    planId: product.planId,
    billing: product.billing,
    maxTotal: product.maxTotal,
    lookupKey: product.lookupKey,
    name: product.name,
  }]),
) as Record<string, { amount: number; currency: string; productType: string; pilotDays?: number; creditEligible?: boolean; creditType?: 'ai' | 'sms'; creditAmount?: number; recurring?: boolean; planId?: string; billing?: BillingInterval; maxTotal?: number; lookupKey: string; name: string }>

export function resolveNewPlan(planId: unknown, billing: unknown) {
  const resolved = resolveSubscriptionPlan(planId, billing)
  return resolved ? {
    planId: resolved.plan.id,
    billing: resolved.billing,
    lookupKey: resolved.lookupKey,
  } : null
}

export function resolveOneTimeProduct(productId: unknown) {
  const aliases: Record<string, string> = {
    pilot_guided_99: 'pilot_30d_once',
    service_custom_quote: 'onboarding_once',
  };
  const canonicalProductId = typeof productId === 'string' ? aliases[productId] ?? productId : productId;
  const product = resolveSharedOneTimeProduct(canonicalProductId);
  return product ? {
    productId: product.id,
    definition: {
      amount: product.amountEurHt === null ? 0 : product.amountEurHt * 100,
      currency: 'eur',
      productType: product.productType,
      ...(product.pilotDays === undefined ? {} : { pilotDays: product.pilotDays }),
      ...(product.creditEligible === undefined ? {} : { creditEligible: product.creditEligible }),
      ...(product.creditType === undefined ? {} : { creditType: product.creditType }),
      ...(product.creditAmount === undefined ? {} : { creditAmount: product.creditAmount }),
      ...(product.recurring === undefined ? {} : { recurring: product.recurring }),
      lookupKey: product.lookupKey,
      name: product.name,
    },
    lookupKey: getOneTimePriceEnvKey(product.id),
  } : null
}
