/**
 * PricingData — Source unique de vérité pour la grille tarifaire Kompilot.
 *
 * 3 forfaits uniquement (anciens 49€/99€/299€/599€ supprimés définitivement) :
 *   • Pro       — 69 € HT/mois  → planId = 'starter'
 *   • Agency    — 149 € HT/mois → planId = 'agency'   (formule phare)
 *   • Enterprise — Sur devis    → planId = 'enterprise'
 *
 * Les boutons Stripe lisent PRICE_STARTER_ID et PRICE_AGENCY_ID côté backend.
 */

export type KompilotPlanId = 'starter' | 'agency' | 'enterprise';

export interface KompilotPlan {
  id: KompilotPlanId;
  name: string;
  badge?: string;
  tagline: string;
  price: number | null;      // null = Sur devis
  priceLabel: string;
  period: string;
  popular: boolean;           // Agency = true
  ctaLabel: string;
  ctaHref?: string;           // Enterprise seulement
  features: string[];
  highlightColor: string;
}

export const KOMPILOT_PLANS: KompilotPlan[] = [
  // ── Pro (69 €) ─────────────────────────────────────────────────────────────
  {
    id: 'starter',
    name: 'Pro',
    tagline: "L'essentiel pour les consultants solos, freelances et commerçants qui automatisent leur présence.",
    price: 69,
    priceLabel: '69',
    period: '€ HT / mois',
    popular: false,
    ctaLabel: 'Commencer avec Pro',
    highlightColor: '#0D9488',
    features: [
      '1 Compte Publicitaire Meta connecté',
      '"Claude Cowork" & "Creative Studio" — 20 générations IA / mois (déclinaisons visuels, SMS/Emails de rappel automatiques)',
      'Rapports G.E.O. de base et IA prédictive pour le contenu',
      '"Campaign Calendar" standard (Planification et génération de briefs)',
      '"AIO Sync" — Visibilité IA sur 5 mots-clés stratégiques face aux concurrents dans ChatGPT',
      'Coupons Flash IA & Module de fidélisation de base',
      'Support client standard par email',
    ],
  },

  // ── Agency (149 €) — formule phare ─────────────────────────────────────────
  {
    id: 'agency',
    name: 'Agency',
    badge: '⭐ Formule Phare',
    tagline: 'La solution complète pour les équipes, marques et agences qui gèrent jusqu\'à 30 fiches/comptes clients.',
    price: 149,
    priceLabel: '149',
    period: '€ HT / mois',
    popular: true,             // → mise en valeur graphique
    ctaLabel: 'Choisir Agency',
    highlightColor: '#818CF8',
    features: [
      '"Claude Cowork" & "Creative Studio" en ILLIMITÉ (double IA GPT-4o / Claude 3.5 Sonnet)',
      'Marque Blanche Totale — votre logo + domaine personnalisé pour vos clients',
      'Hub de pilotage G.E.A. multi-comptes (Rapports complets et Boost publicitaire inclus)',
      'Pack crédits IA & Requêtes G.E.O. illimitées (usage équitable)',
      'Sliders ROI personnalisables — bilans clairs pour vos clients',
      '"Moteur de Prospection IA Maximal" — scraping intelligent, ROI auto, pitchs IA, jusqu\'à 100 audits PDF / mois',
      '"Campaign Calendar" Avancé — export Drafts vers Business Manager Meta + tracking Dépenses/Clics/CTR/Impressions',
      '"Radar Concurrentiel & Espionnage IA" — failles G.E.O. de vos 3 principaux concurrents',
      'Intégration Google Analytics 4 — conversions réelles et synchro CA',
      'Support prioritaire 24h/24, 7j/7',
    ],
  },

  // ── Enterprise (Sur devis) ──────────────────────────────────────────────────
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Pour les grands réseaux de franchises, volumes industriels et besoins sur-mesure.',
    price: null,
    priceLabel: 'Sur devis',
    period: '',
    popular: false,
    ctaLabel: 'Contacter notre équipe',
    ctaHref: 'mailto:sales@kompilot.fr',
    highlightColor: '#475569',
    features: [
      'Volume de fiches clients, comptes Meta et mots-clés AIO illimités',
      "Clés d'API LLM dédiées et intégrations personnalisées dans vos outils internes",
      'SLA garanti & Accompagnement par un ingénieur dédié',
    ],
  },
];
