import {
  ENTERPRISE_PLAN,
  ONE_TIME_PRODUCTS,
  SUBSCRIPTION_PLANS,
  TRIAL_AND_PILOT_PLANS,
  type BillingInterval,
  type CommercialPlanId,
  type SubscriptionPlanId,
} from '../../../../shared/pricingCatalog';

export type KompilotPlanId = CommercialPlanId;
export type { BillingInterval };

export interface KompilotPlan {
  id: KompilotPlanId;
  name: string;
  badge?: string;
  tagline: string;
  monthlyPrice: number | null;
  yearlyTotal: number | null;
  priceLabel: string;
  billingNote: string;
  period: string;
  popular: boolean;
  ctaLabel: string;
  ctaHref?: string;
  features: string[];
  highlightColor: string;
  metadata: { plan: KompilotPlanId; billing: BillingInterval };
  comparison: Record<string, string>;
}

export const COMPARISON_ROWS = [
  { key: 'users', label: 'Utilisateurs' },
  { key: 'establishments', label: 'Établissements' },
  { key: 'ai', label: 'Crédits IA' },
  { key: 'sms', label: 'SMS' },
  { key: 'content', label: 'Contenu' },
  { key: 'reports', label: 'Rapports' },
  { key: 'whiteLabel', label: 'Marque blanche' },
  { key: 'support', label: 'Support' },
] as const;

export const PILOT_OFFER = {
  description: 'Un lancement guidé avec deux utilisateurs, un établissement et des quotas de démarrage.',
  note: '30 jours, paiement unique.',
  priceLabel: '99 € HT',
};

export const PRICING_SERVICES = ONE_TIME_PRODUCTS
  .filter((product) => product.productType === 'service')
  .map((product) => ({
    id: product.id,
    name: product.name,
    priceLabel: product.amountEurHt === null ? 'Sur devis' : `${product.amountEurHt} € HT`,
    description: product.description,
    paymentRule: product.paymentRule,
  }));

const normalizePlan = (plan: typeof SUBSCRIPTION_PLANS[number], billing: BillingInterval): KompilotPlan => ({
  id: plan.id,
  name: plan.name,
  tagline: plan.tagline,
  monthlyPrice: billing === 'monthly' ? plan.monthlyPriceEurHt : plan.annualPriceEurHt,
  yearlyTotal: plan.annualPriceEurHt,
  priceLabel: String(billing === 'monthly' ? plan.monthlyPriceEurHt : plan.annualPriceEurHt),
  billingNote: billing === 'yearly' ? 'Facturation annuelle · 2 mois offerts' : 'Facturation mensuelle',
  period: '€ HT / mois',
  popular: plan.id === 'multi',
  ctaLabel: `Choisir ${plan.name}`,
  features: plan.features,
  highlightColor: plan.id === 'agency' ? '#818CF8' : '#0D9488',
  metadata: { plan: plan.id, billing },
  comparison: plan.comparison,
});

export function getPlansForBilling(billing: BillingInterval): KompilotPlan[] {
  const recurring = SUBSCRIPTION_PLANS.map((plan) => normalizePlan(plan, billing));
  return [
    { id: 'trial', name: 'Essai gratuit', tagline: 'Découvrez Kompilot sans engagement.', monthlyPrice: 0, yearlyTotal: 0, priceLabel: '0', billingNote: '14 jours · 150 crédits IA · 10 SMS', period: '', popular: false, ctaLabel: 'Commencer gratuitement', features: ['1 utilisateur', '1 établissement', '150 crédits IA', '10 SMS'], highlightColor: '#0D9488', metadata: { plan: 'trial', billing }, comparison: {} },
    { id: 'pilot', name: 'Pilote 30 jours', tagline: 'Un accompagnement concret pour lancer votre cockpit.', monthlyPrice: 99, yearlyTotal: 99, priceLabel: '99', billingNote: 'Paiement unique · 30 jours', period: '', popular: false, ctaLabel: 'Démarrer le pilote', features: ['2 utilisateurs', '1 établissement', '300 crédits IA', '25 SMS', 'Accompagnement guidé'], highlightColor: '#0D9488', metadata: { plan: 'pilot', billing }, comparison: {} },
    ...recurring,
    { id: 'enterprise', name: ENTERPRISE_PLAN.name, tagline: ENTERPRISE_PLAN.tagline, monthlyPrice: null, yearlyTotal: null, priceLabel: ENTERPRISE_PLAN.priceLabel, billingNote: '', period: '', popular: false, ctaLabel: ENTERPRISE_PLAN.ctaLabel, ctaHref: 'mailto:sales@kompilot.fr', features: ENTERPRISE_PLAN.features, highlightColor: '#475569', metadata: { plan: 'enterprise', billing }, comparison: ENTERPRISE_PLAN.comparison },
  ];
}

export const KOMPILOT_PLANS_MONTHLY = getPlansForBilling('monthly');
export const KOMPILOT_PLANS_YEARLY = getPlansForBilling('yearly');
export const KOMPILOT_PLANS = KOMPILOT_PLANS_MONTHLY;
export { ENTERPRISE_PLAN, TRIAL_AND_PILOT_PLANS };
export type { SubscriptionPlanId };
