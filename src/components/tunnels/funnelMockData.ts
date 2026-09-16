/**
 * Mock funnel data — 4 sample creators with tech stack, ad longevity, and watch alerts.
 */
import type { FunnelData, TechStackTool } from './types';

// ── Tech stack catalogs per funnel ───────────────────────────────────────────
const HORMOZI_STACK: TechStackTool[] = [
  { name: 'Stripe', category: 'payment', confidence: 95 },
  { name: 'Kajabi', category: 'builder', confidence: 88 },
  { name: 'ActiveCampaign', category: 'email', confidence: 82 },
  { name: 'Meta Pixel', category: 'ads', confidence: 99 },
  { name: 'Google Analytics 4', category: 'analytics', confidence: 90 },
  { name: 'Hotjar', category: 'analytics', confidence: 74 },
  { name: 'Calendly', category: 'other', confidence: 85 },
];

const BRUNSON_STACK: TechStackTool[] = [
  { name: 'ClickFunnels', category: 'builder', confidence: 99 },
  { name: 'Stripe', category: 'payment', confidence: 95 },
  { name: 'Actionetics', category: 'email', confidence: 90 },
  { name: 'Meta Pixel', category: 'ads', confidence: 99 },
  { name: 'Google Ads Tag', category: 'ads', confidence: 87 },
  { name: 'Intercom', category: 'support', confidence: 78 },
  { name: 'Typeform', category: 'other', confidence: 72 },
];

const FORLEO_STACK: TechStackTool[] = [
  { name: 'Teachable', category: 'builder', confidence: 91 },
  { name: 'Stripe', category: 'payment', confidence: 93 },
  { name: 'ConvertKit', category: 'email', confidence: 88 },
  { name: 'Google Analytics 4', category: 'analytics', confidence: 95 },
  { name: 'Typeform', category: 'other', confidence: 80 },
  { name: 'Intercom', category: 'support', confidence: 71 },
];

const RIGOTTIER_STACK: TechStackTool[] = [
  { name: 'Systeme.io', category: 'builder', confidence: 92 },
  { name: 'Stripe', category: 'payment', confidence: 88 },
  { name: 'Lemlist', category: 'email', confidence: 79 },
  { name: 'Meta Pixel', category: 'ads', confidence: 95 },
  { name: 'Google Analytics 4', category: 'analytics', confidence: 82 },
];

// ── Sample ad creative data with longevity info ───────────────────────────────
export interface AdCreative {
  id: string;
  hook: string;
  daysActive: number;
  format: 'video' | 'image' | 'carousel';
  platform: string;
}

const HORMOZI_ADS: AdCreative[] = [
  { id: 'ad-h1', hook: 'Comment nous avons fait 100M$ sans lever de fonds', daysActive: 87, format: 'video', platform: 'meta' },
  { id: 'ad-h2', hook: 'La raison pour laquelle 99% des business échouent (et comment y remédier)', daysActive: 45, format: 'video', platform: 'meta' },
  { id: 'ad-h3', hook: "J'ai offert à 1000 entrepreneurs un audit gratuit. Voici ce que j'ai découvert.", daysActive: 62, format: 'image', platform: 'meta' },
  { id: 'ad-h4', hook: 'Notre nouvelle offre gratuite', daysActive: 8, format: 'video', platform: 'meta' },
  { id: 'ad-h5', hook: 'Pourquoi votre entreprise plafonne à 100K/an', daysActive: 31, format: 'carousel', platform: 'meta' },
];

const BRUNSON_ADS: AdCreative[] = [
  { id: 'ad-b1', hook: 'Ce funnel nous a rapporté 30M$ en 18 mois (copie-le)', daysActive: 112, format: 'video', platform: 'meta' },
  { id: 'ad-b2', hook: 'Comment créer ton premier funnel en 24h même sans audience', daysActive: 54, format: 'video', platform: 'meta' },
  { id: 'ad-b3', hook: '1 clic pour voir notre funnel qui convertit à 38%', daysActive: 78, format: 'image', platform: 'google' },
  { id: 'ad-b4', hook: 'Rejoins 50,000 entrepreneurs — essai gratuit 14 jours', daysActive: 14, format: 'carousel', platform: 'meta' },
];

const FORLEO_ADS: AdCreative[] = [
  { id: 'ad-f1', hook: 'Le quiz qui a changé la vie de 2 millions d\'entrepreneurs', daysActive: 36, format: 'video', platform: 'google' },
  { id: 'ad-f2', hook: 'Comment j\'ai construit un empire en commençant avec 0€', daysActive: 25, format: 'image', platform: 'google' },
  { id: 'ad-f3', hook: 'B-School : la formation qu\'aucune université n\'enseigne', daysActive: 5, format: 'video', platform: 'google' },
];

const RIGOTTIER_ADS: AdCreative[] = [
  { id: 'ad-r1', hook: 'Comment vivre de mon blog en 6 mois (ma méthode exacte)', daysActive: 44, format: 'video', platform: 'meta' },
  { id: 'ad-r2', hook: 'J\'ai quitté mon CDI pour blogger. Voici comment.', daysActive: 22, format: 'image', platform: 'meta' },
  { id: 'ad-r3', hook: 'Télécharge ma formation gratuite → 0 à 3000€/mois', daysActive: 9, format: 'carousel', platform: 'meta' },
];

// ── Exported map for use in FunnelNode ───────────────────────────────────────
export const FUNNEL_ADS: Record<string, AdCreative[]> = {
  'sample-1': HORMOZI_ADS,
  'sample-2': BRUNSON_ADS,
  'sample-3': FORLEO_ADS,
  'sample-4': RIGOTTIER_ADS,
};

// ── Sample funnels ────────────────────────────────────────────────────────────
export const SAMPLE_FUNNELS: FunnelData[] = [
  {
    id: 'sample-1',
    creator_name: 'Alex Hormozi',
    domain_url: 'acquisition.com',
    estimated_spend: 85000,
    performance_score: 94,
    platform: 'meta',
    is_sample: true,
    tech_stack: HORMOZI_STACK,
    nodes: [
      {
        id: 'n1-1', funnel_id: 'sample-1', type: 'ad_source', title: 'Meta Ads — Leads & Notoriété', position_order: 0,
        metadata: { adsCount: 47, spend: 85000, thumbnails: [] },
      },
      {
        id: 'n1-2', funnel_id: 'sample-1', type: 'opt_in', title: 'Livre Gratuit "$100M Offers"', url: 'acquisition.com/offers', position_order: 1,
        metadata: { conversionRate: 42 },
      },
      {
        id: 'n1-3', funnel_id: 'sample-1', type: 'vsl', title: 'VSL — Gagner 1M$ en 12 mois', url: 'acquisition.com/vsl', position_order: 2,
        metadata: {},
      },
      {
        id: 'n1-4', funnel_id: 'sample-1', type: 'checkout', title: 'Programme Mentorship Elite', url: 'acquisition.com/apply', position_order: 3,
        metadata: { price: 18000, tier: 'high_ticket' },
      },
      {
        id: 'n1-5', funnel_id: 'sample-1', type: 'email_sequence', title: 'Nurture Email Automation', position_order: 4,
        metadata: { emailCount: 21 },
      },
    ],
    watch_alerts: [
      { type: 'price_change', message: 'Prix détecté : 14 997€ → 18 000€', detected_at: new Date(Date.now() - 86400000 * 3).toISOString(), old_value: '14997', new_value: '18000' },
    ],
  },
  {
    id: 'sample-2',
    creator_name: 'Russell Brunson',
    domain_url: 'clickfunnels.com',
    estimated_spend: 120000,
    performance_score: 88,
    platform: 'meta',
    is_sample: true,
    tech_stack: BRUNSON_STACK,
    nodes: [
      {
        id: 'n2-1', funnel_id: 'sample-2', type: 'ad_source', title: 'Meta + Google — Acquisition ClickFunnels', position_order: 0,
        metadata: { adsCount: 89, spend: 120000, thumbnails: [] },
      },
      {
        id: 'n2-2', funnel_id: 'sample-2', type: 'opt_in', title: 'Webinar Gratuit "One Funnel Away"', url: 'clickfunnels.com/ofa', position_order: 1,
        metadata: { conversionRate: 38 },
      },
      {
        id: 'n2-3', funnel_id: 'sample-2', type: 'vsl', title: 'VSL 60 min — "30 Days" Challenge', url: 'clickfunnels.com/30days', position_order: 2,
        metadata: {},
      },
      {
        id: 'n2-4', funnel_id: 'sample-2', type: 'checkout', title: 'ClickFunnels 2.0 Annuel + Bonus', url: 'clickfunnels.com/pricing', position_order: 3,
        metadata: { price: 2964, tier: 'mid_ticket' },
      },
      {
        id: 'n2-5', funnel_id: 'sample-2', type: 'email_sequence', title: 'Sequence "Soap Opera" Email', position_order: 4,
        metadata: { emailCount: 30 },
      },
    ],
    watch_alerts: [],
  },
  {
    id: 'sample-3',
    creator_name: 'Marie Forleo',
    domain_url: 'marieforleo.com',
    estimated_spend: 32000,
    performance_score: 76,
    platform: 'google',
    is_sample: true,
    tech_stack: FORLEO_STACK,
    nodes: [
      {
        id: 'n3-1', funnel_id: 'sample-3', type: 'ad_source', title: 'YouTube + Google Display Ads', position_order: 0,
        metadata: { adsCount: 23, spend: 32000, thumbnails: [] },
      },
      {
        id: 'n3-2', funnel_id: 'sample-3', type: 'opt_in', title: 'Quiz Gratuit "Quel entrepreneur êtes-vous ?"', url: 'marieforleo.com/quiz', position_order: 1,
        metadata: { conversionRate: 55 },
      },
      {
        id: 'n3-3', funnel_id: 'sample-3', type: 'vsl', title: 'Masterclass "B-School" — Démo', url: 'marieforleo.com/bschool', position_order: 2,
        metadata: {},
      },
      {
        id: 'n3-4', funnel_id: 'sample-3', type: 'checkout', title: 'B-School — Formation Business Online', url: 'marieforleo.com/join', position_order: 3,
        metadata: { price: 2497, tier: 'mid_ticket' },
      },
      {
        id: 'n3-5', funnel_id: 'sample-3', type: 'email_sequence', title: 'Séquence Nurture 45 jours', position_order: 4,
        metadata: { emailCount: 15 },
      },
    ],
    watch_alerts: [
      { type: 'url_change', message: 'URL checkout modifiée détectée', detected_at: new Date(Date.now() - 86400000 * 1).toISOString(), old_value: '/bschool/checkout', new_value: '/bschool/join' },
    ],
  },
  {
    id: 'sample-4',
    creator_name: 'Maxence Rigottier',
    domain_url: 'vivre-de-son-site.fr',
    estimated_spend: 9500,
    performance_score: 63,
    platform: 'meta',
    is_sample: true,
    tech_stack: RIGOTTIER_STACK,
    nodes: [
      {
        id: 'n4-1', funnel_id: 'sample-4', type: 'ad_source', title: 'Facebook Ads — Blogging & SEO', position_order: 0,
        metadata: { adsCount: 12, spend: 9500, thumbnails: [] },
      },
      {
        id: 'n4-2', funnel_id: 'sample-4', type: 'opt_in', title: 'Formation Gratuite "Vivre de son blog"', url: 'vivre-de-son-site.fr/formation', position_order: 1,
        metadata: { conversionRate: 48 },
      },
      {
        id: 'n4-3', funnel_id: 'sample-4', type: 'vsl', title: 'VSL Coaching Blog → Business', url: 'vivre-de-son-site.fr/coaching', position_order: 2,
        metadata: {},
      },
      {
        id: 'n4-4', funnel_id: 'sample-4', type: 'checkout', title: 'Coaching Individuel 6 mois', url: 'vivre-de-son-site.fr/coaching/apply', position_order: 3,
        metadata: { price: 3500, tier: 'mid_ticket' },
      },
      {
        id: 'n4-5', funnel_id: 'sample-4', type: 'email_sequence', title: 'Email Auto Bienvenue + Valeur', position_order: 4,
        metadata: { emailCount: 9 },
      },
    ],
    watch_alerts: [],
  },
];

export function findSampleFunnel(query: string): FunnelData | null {
  const q = query.toLowerCase().replace(/https?:\/\//, '').replace(/www\./, '');
  return SAMPLE_FUNNELS.find(f =>
    f.creator_name.toLowerCase().includes(q) ||
    f.domain_url.toLowerCase().includes(q)
  ) ?? null;
}

const GENERIC_STACKS: TechStackTool[][] = [
  [
    { name: 'Stripe', category: 'payment', confidence: 90 },
    { name: 'Mailchimp', category: 'email', confidence: 75 },
    { name: 'Meta Pixel', category: 'ads', confidence: 95 },
    { name: 'Google Analytics 4', category: 'analytics', confidence: 88 },
    { name: 'WordPress', category: 'builder', confidence: 70 },
  ],
  [
    { name: 'PayPal', category: 'payment', confidence: 82 },
    { name: 'Brevo', category: 'email', confidence: 78 },
    { name: 'Google Ads Tag', category: 'ads', confidence: 85 },
    { name: 'Typeform', category: 'other', confidence: 68 },
    { name: 'Webflow', category: 'builder', confidence: 72 },
  ],
  [
    { name: 'Stripe', category: 'payment', confidence: 93 },
    { name: 'ActiveCampaign', category: 'email', confidence: 81 },
    { name: 'Meta Pixel', category: 'ads', confidence: 97 },
    { name: 'Lemlist', category: 'email', confidence: 65 },
    { name: 'Systeme.io', category: 'builder', confidence: 88 },
  ],
];

export function generateMockFunnel(query: string, platform: string): FunnelData {
  const score = Math.floor(Math.random() * 40) + 50;
  const spend = Math.floor(Math.random() * 40000) + 5000;
  const domain = query.includes('.') ? query : `${query.toLowerCase().replace(/\s+/g, '-')}.com`;
  const name = domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const id = `gen-${Date.now()}`;
  const stack = GENERIC_STACKS[Math.floor(Math.random() * GENERIC_STACKS.length)];

  return {
    id,
    creator_name: name,
    domain_url: domain,
    estimated_spend: spend,
    performance_score: score,
    platform: (platform as FunnelData['platform']) || 'meta',
    is_sample: true,
    tech_stack: stack,
    watch_alerts: [],
    nodes: [
      {
        id: `${id}-1`, funnel_id: id, type: 'ad_source', title: `Publicités ${platform === 'google' ? 'Google' : platform === 'linkedin' ? 'LinkedIn' : 'Meta'}`, position_order: 0,
        metadata: { adsCount: Math.floor(Math.random() * 30) + 5, spend, thumbnails: [] },
      },
      {
        id: `${id}-2`, funnel_id: id, type: 'opt_in', title: 'Page de Capture — Lead Magnet', url: `https://${domain}/optin`, position_order: 1,
        metadata: { conversionRate: Math.floor(Math.random() * 30) + 20 },
      },
      {
        id: `${id}-3`, funnel_id: id, type: 'vsl', title: "Vidéo de Présentation de l'Offre", url: `https://${domain}/video`, position_order: 2,
        metadata: {},
      },
      {
        id: `${id}-4`, funnel_id: id, type: 'checkout', title: 'Page de Vente Principale', url: `https://${domain}/checkout`, position_order: 3,
        metadata: {
          price: Math.floor(Math.random() * 2000) + 500,
          tier: score >= 75 ? 'high_ticket' : score >= 50 ? 'mid_ticket' : 'low_ticket',
        },
      },
      {
        id: `${id}-5`, funnel_id: id, type: 'email_sequence', title: 'Séquence Email Automatisée', position_order: 4,
        metadata: { emailCount: Math.floor(Math.random() * 15) + 5 },
      },
    ],
  };
}
