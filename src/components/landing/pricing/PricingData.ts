/**
 * PricingData — Source unique de vérité pour la grille tarifaire Kompilot.
 *
 * 3 offres canoniques :
 *   • Pro       — 69 € HT/mois  → planId = 'starter' (identifiant historique conservé)
 *   • Agency    — 149 € HT/mois → planId = 'agency'   (formule phare)
 *   • Enterprise — Sur devis    → planId = 'enterprise'
 *
 * Toggle Mensuel / Annuel :
 *   • Annuel = 11 mois facturés (1 mois offert) → paiement unique annuel
 *   • Les boutons Stripe lisent PRICE_STARTER_MONTHLY_ID, PRICE_STARTER_YEARLY_ID,
 *     PRICE_AGENCY_MONTHLY_ID, PRICE_AGENCY_YEARLY_ID côté backend.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type KompilotPlanId = 'starter' | 'agency' | 'enterprise';
export type BillingInterval = 'monthly' | 'yearly';

export interface KompilotPlan {
  id: KompilotPlanId;
  name: string;
  badge?: string;
  tagline: string;
  /** Monthly price in € HT (null = Sur devis) */
  monthlyPrice: number | null;
  /** Yearly total in € HT — billed as single payment (null = Sur devis) */
  yearlyTotal: number | null;
  /** Price label shown on card (depends on billing toggle) */
  priceLabel: string;
  /** Sub-label under the price (annual billing note) */
  billingNote: string;
  period: string;
  popular: boolean;
  ctaLabel: string;
  ctaHref?: string;
  features: string[];
  highlightColor: string;
  /** Stripe metadata for plan identification */
  metadata: {
    plan: KompilotPlanId;
    billing: BillingInterval;
  };
}

// ── Stripe price config — env vars expected in backend secrets ─────────────────

/**
 * Backend env mapping (to be set in Blink backend secrets):
 *
 * PRICE_STARTER_MONTHLY_ID  → price_xxx  (69 € HT / month, currency: eur)
 * PRICE_STARTER_YEARLY_ID   → price_xxx  (annual Starter price, currency: eur)
 * PRICE_AGENCY_MONTHLY_ID   → price_xxx  (149 € HT / month, currency: eur)
 * PRICE_AGENCY_YEARLY_ID    → price_xxx  (annual Agency price, currency: eur)
 *
 * No legacy public offer IDs are exposed here; backend aliases may remain internal
 * while existing subscriptions are migrated to the canonical catalogue.
 */

/** Stripe creation specs — used by the init script, referenced in webhook config */
export const STRIPE_PRICING_SPECS = {
  starter: {
    monthly: { currency: 'eur', unit_amount: 6900, recurring: { interval: 'month' as const } },
    yearly:  { currency: 'eur', unit_amount: 75900, recurring: { interval: 'year' as const } },
  },
  agency: {
    monthly: { currency: 'eur', unit_amount: 14900, recurring: { interval: 'month' as const } },
    yearly:  { currency: 'eur', unit_amount: 163900, recurring: { interval: 'year' as const } },
  },
} as const;

// ── Price labels (computed once, used by UI) ──────────────────────────────────

/** Canonical monthly prices; annual billing is represented as a product label. */
const STARTER_MONTHLY = 69;
const STARTER_YEARLY_TOTAL = 69 * 11;
const STARTER_YEARLY_MONTHLY = 69;

const AGENCY_MONTHLY = 149;
const AGENCY_YEARLY_TOTAL = 149 * 11;
const AGENCY_YEARLY_MONTHLY = 149;

// ── Plan builder ──────────────────────────────────────────────────────────────

function buildPlans(billing: BillingInterval): KompilotPlan[] {
  const isYearly = billing === 'yearly';

  return [
    // ── Starter ─────────────────────────────────────────────────────────────
    {
      id: 'starter',
      name: 'Pro',
      tagline: "L'essentiel pour les consultants solos, freelances et commerçants qui automatisent leur présence.",
      monthlyPrice: STARTER_MONTHLY,
      yearlyTotal: STARTER_YEARLY_TOTAL,
      priceLabel: isYearly ? String(STARTER_YEARLY_MONTHLY) : String(STARTER_MONTHLY),
      billingNote: isYearly ? 'Facturation annuelle · 1 mois offert' : '',
      period: '€ HT / mois',
      popular: false,
      ctaLabel: 'Commencer avec Pro',
      highlightColor: '#0D9488',
      metadata: { plan: 'starter', billing },
      features: [
        '1 Compte Publicitaire Meta connecté',
        '"Claude Cowork" & "Creative Studio" — 20 générations IA / mois (déclinaisons visuels, SMS/Emails de rappel automatiques)',
        'Rapports G.E.O. de base et IA prédictive pour le contenu',
        '"Campaign Calendar" standard (Planification et génération de briefs)',
        '"AIO Sync" — Visibilité IA sur 5 mots-clés stratégiques face aux concurrents dans ChatGPT',
        'Scan d\'acquisition local — identification automatique des leads et opportunités commerciales dans votre zone',
        'Coupons Flash IA & Module de fidélisation de base',
        'Support client standard par email',
      ],
    },

    // ── Agency (formule phare) ──────────────────────────────────────────────
    {
      id: 'agency',
      name: 'Agency',
      badge: '⭐ Formule Phare',
      tagline: "La solution complète pour les équipes, marques et agences qui gèrent jusqu'à 30 fiches/comptes clients.",
      monthlyPrice: AGENCY_MONTHLY,
      yearlyTotal: AGENCY_YEARLY_TOTAL,
      priceLabel: isYearly ? String(AGENCY_YEARLY_MONTHLY) : String(AGENCY_MONTHLY),
      billingNote: isYearly ? 'Facturation annuelle · 1 mois offert' : '',
      period: '€ HT / mois',
      popular: true,
      ctaLabel: 'Choisir Agency',
      highlightColor: '#818CF8',
      metadata: { plan: 'agency', billing },
      features: [
        '"Claude Cowork" & "Creative Studio" en ILLIMITÉ (double IA GPT-4o / Claude 3.5 Sonnet)',
        'Marque Blanche Totale — votre logo + domaine personnalisé pour vos clients',
        'Hub de pilotage G.E.A. multi-comptes (Rapports complets et Boost publicitaire inclus)',
        'Scan d\'acquisition local avancé — leads multi-zones, scoring IA et export CSV',
        'Pack crédits IA & Requêtes G.E.O. illimitées (usage équitable)',
        'Sliders ROI personnalisables — bilans clairs pour vos clients',
        '"Moteur de Prospection IA Maximal" — scraping intelligent, ROI auto, pitchs IA, jusqu\'à 100 audits PDF / mois',
        '"Campaign Calendar" Avancé — export Drafts vers Business Manager Meta + tracking Dépenses/Clics/CTR/Impressions',
        '"Radar Concurrentiel & Espionnage IA" — failles G.E.O. de vos 3 principaux concurrents',
        'Intégration Google Analytics 4 — conversions réelles et synchro CA',
        'Support prioritaire 24h/24, 7j/7',
      ],
    },

    // ── Enterprise (Sur devis) ──────────────────────────────────────────────
    {
      id: 'enterprise',
      name: 'Enterprise',
      tagline: 'Pour les grands réseaux de franchises, volumes industriels et besoins sur-mesure.',
      monthlyPrice: null,
      yearlyTotal: null,
      priceLabel: 'Sur devis',
      billingNote: '',
      period: '',
      popular: false,
      ctaLabel: 'Contacter notre équipe',
      ctaHref: 'mailto:sales@kompilot.fr',
      highlightColor: '#475569',
      metadata: { plan: 'enterprise', billing },
      features: [
        'Volume de fiches clients, comptes Meta et mots-clés AIO illimités',
        "Clés d'API LLM dédiées et intégrations personnalisées dans vos outils internes",
        'SLA garanti & Accompagnement par un ingénieur dédié',
      ],
    },
  ];
}

// ── Exports ───────────────────────────────────────────────────────────────────

/** Pre-built plans for each billing interval */
export const KOMPILOT_PLANS_MONTHLY = buildPlans('monthly');
export const KOMPILOT_PLANS_YEARLY  = buildPlans('yearly');

/** Legacy default (monthly) — kept for backward compatibility */
export const KOMPILOT_PLANS = KOMPILOT_PLANS_MONTHLY;

/** Get plans for a billing interval */
export function getPlansForBilling(billing: BillingInterval): KompilotPlan[] {
  return billing === 'yearly' ? KOMPILOT_PLANS_YEARLY : KOMPILOT_PLANS_MONTHLY;
}

/** Get the Stripe env key name for a plan + billing combination */
export function getStripePriceEnvKey(planId: KompilotPlanId, billing: BillingInterval): string | null {
  const map: Record<string, string> = {
    'starter_monthly': 'PRICE_STARTER_MONTHLY_ID',
    'starter_yearly':  'PRICE_STARTER_YEARLY_ID',
    'agency_monthly':  'PRICE_AGENCY_MONTHLY_ID',
    'agency_yearly':   'PRICE_AGENCY_YEARLY_ID',
  };
  return map[`${planId}_${billing}`] ?? null;
}