import {
  ANNUAL_MONTHS_FREE,
  ENTERPRISE_PLAN,
  ONE_TIME_PRODUCTS,
  PILOT_DURATION_DAYS,
  PILOT_PRICE_EUR_HT,
  PRICING_CATALOG_VERSION,
  SUBSCRIPTION_PLANS,
  TRIAL_DAYS,
  formatPrice,
  type BillingInterval,
  type ComparisonKey,
  type PricingProductId,
  type SubscriptionPlanId,
} from '../../../../shared/pricingCatalog'
import { PRICING_FAQ } from '../../../../shared/pricingFaq'

export type KompilotPlanId = SubscriptionPlanId | 'enterprise'
export type { BillingInterval, ComparisonKey, PricingProductId }
export { ENTERPRISE_PLAN, ONE_TIME_PRODUCTS, PRICING_CATALOG_VERSION, TRIAL_DAYS, PILOT_DURATION_DAYS, PILOT_PRICE_EUR_HT }

export interface KompilotPlan {
  id: KompilotPlanId
  name: string
  badge?: string
  target: string
  tagline: string
  monthlyPrice: number | null
  yearlyTotal: number | null
  priceLabel: string
  billingNote: string
  period: string
  popular: boolean
  ctaLabel: string
  ctaHref?: string
  features: string[]
  comparison: Record<string, string>
  metadata: { plan: KompilotPlanId; billing: BillingInterval }
}

export interface PricingService {
  id: PricingProductId
  name: string
  priceLabel: string
  description: string
  paymentRule: string
}

export const ANNUAL_MONTHS_FREE_DISPLAY = ANNUAL_MONTHS_FREE
const buildPlan = (planId: SubscriptionPlanId, billing: BillingInterval): KompilotPlan => {
  const definition = SUBSCRIPTION_PLANS.find(plan => plan.id === planId)!
  const yearly = billing === 'yearly'
  return {
    id: definition.id,
    name: definition.name,
    badge: definition.id === 'multi' ? 'Le plus choisi' : undefined,
    target: definition.target,
    tagline: definition.tagline,
    monthlyPrice: definition.monthlyPriceEurHt,
    yearlyTotal: definition.annualPriceEurHt,
    priceLabel: yearly ? `${formatPrice(definition.annualPriceEurHt)} / an` : `${formatPrice(definition.monthlyPriceEurHt)} / mois`,
    billingNote: yearly ? '2 mois offerts · paiement annuel' : 'Facturation mensuelle',
    period: yearly ? 'par an' : 'par mois',
    popular: definition.id === 'multi',
    ctaLabel: `Essayer gratuitement pendant ${TRIAL_DAYS} jours`,
    features: [...definition.features],
    comparison: { ...definition.comparison },
    metadata: { plan: definition.id, billing },
  }
}

export const KOMPILOT_PLANS_MONTHLY = SUBSCRIPTION_PLANS.map(plan => buildPlan(plan.id, 'monthly'))
export const KOMPILOT_PLANS_YEARLY = SUBSCRIPTION_PLANS.map(plan => buildPlan(plan.id, 'yearly'))
export const KOMPILOT_PLANS = KOMPILOT_PLANS_MONTHLY
export function getPlansForBilling(billing: BillingInterval): KompilotPlan[] { return [...(billing === 'yearly' ? KOMPILOT_PLANS_YEARLY : KOMPILOT_PLANS_MONTHLY), ENTERPRISE_PLAN as KompilotPlan] }

export const PILOT_OFFER = {
  id: 'pilot_guided_99' as const,
  name: 'Pilote Kompilot — 30 jours accompagnés',
  priceLabel: `${PILOT_PRICE_EUR_HT} € HT`,
  description: 'Rendez-vous de lancement, configuration d’un établissement, accès à Kompilot Pro pendant 30 jours, plan d’action initial, accompagnement à la prise en main et rendez-vous de bilan.',
  note: 'Les 99 € HT du pilote sont déduits du premier paiement annuel si vous souscrivez une formule annuelle Kompilot à l’issue du pilote.',
  features: ['Paiement comptant, sans renouvellement automatique', 'Crédits plafonnés', 'Aucune diffusion sans validation humaine', 'Rappel interne avant le bilan'],
}

export { PRICING_FAQ }

export const PRICING_SERVICES: PricingService[] = ONE_TIME_PRODUCTS.filter(product => product.productType === 'service').map(product => ({
  id: product.id,
  name: product.name,
  priceLabel: product.amountEurHt === null ? 'Sur devis' : formatPrice(product.amountEurHt),
  description: product.description,
  paymentRule: product.paymentRule,
}))

export const COMPARISON_ROWS: Array<{ key: string; label: string }> = [
  { key: 'establishments', label: 'Nombre d’établissements' }, { key: 'users', label: 'Utilisateurs' }, { key: 'ai', label: 'Crédits IA' }, { key: 'sms', label: 'Crédits SMS' }, { key: 'content', label: 'Contenus' }, { key: 'reviews', label: 'Avis' }, { key: 'messages', label: 'Messages' }, { key: 'geo', label: 'GEO et SEO local' }, { key: 'reports', label: 'Rapports' }, { key: 'whiteLabel', label: 'Marque blanche' }, { key: 'multiClient', label: 'Gestion multi-clients' }, { key: 'support', label: 'Support' }, { key: 'onboarding', label: 'Accompagnement' },
]

export function getStripePriceEnvKey(planId: Exclude<KompilotPlanId, 'enterprise'>, billing: BillingInterval): string { return `PRICE_${planId.toUpperCase()}_${billing.toUpperCase()}_ID` }
