/**
 * Funnels — read-only discovery routes
 *
 *   GET /api/funnels/analyze?query=&platform=  — analyze a creator/domain funnel
 *   GET /api/funnels/samples                   — list sample funnels
 */
import { Hono } from 'hono';

const app = new Hono<{ Bindings: { BLINK_SECRET_KEY: string } }>();

// ── Sample data (mock) ────────────────────────────────────────────────────────
const SAMPLE_FUNNELS = [
  {
    id: 'sample-1',
    creator_name: 'Alex Hormozi',
    domain_url: 'acquisition.com',
    estimated_spend: 85000,
    performance_score: 94,
    platform: 'meta',
    is_sample: true,
    nodes: [
      { id: 'n1-1', funnel_id: 'sample-1', type: 'ad_source', title: 'Meta Ads — Leads & Notoriété', position_order: 0, metadata: { adsCount: 47, spend: 85000, thumbnails: [] } },
      { id: 'n1-2', funnel_id: 'sample-1', type: 'opt_in', title: 'Livre Gratuit "$100M Offers"', url: 'acquisition.com/offers', position_order: 1, metadata: { conversionRate: 42 } },
      { id: 'n1-3', funnel_id: 'sample-1', type: 'vsl', title: 'VSL — Gagner 1M$ en 12 mois', url: 'acquisition.com/vsl', position_order: 2, metadata: {} },
      { id: 'n1-4', funnel_id: 'sample-1', type: 'checkout', title: 'Programme Mentorship Elite', url: 'acquisition.com/apply', position_order: 3, metadata: { price: 18000, tier: 'high_ticket' } },
      { id: 'n1-5', funnel_id: 'sample-1', type: 'email_sequence', title: 'Nurture Email Automation', position_order: 4, metadata: { emailCount: 21 } },
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
    nodes: [
      { id: 'n2-1', funnel_id: 'sample-2', type: 'ad_source', title: 'Meta + Google — Acquisition ClickFunnels', position_order: 0, metadata: { adsCount: 89, spend: 120000 } },
      { id: 'n2-2', funnel_id: 'sample-2', type: 'opt_in', title: 'Webinar Gratuit "One Funnel Away"', url: 'clickfunnels.com/ofa', position_order: 1, metadata: { conversionRate: 38 } },
      { id: 'n2-3', funnel_id: 'sample-2', type: 'vsl', title: 'VSL 60 min — "30 Days" Challenge', url: 'clickfunnels.com/30days', position_order: 2, metadata: {} },
      { id: 'n2-4', funnel_id: 'sample-2', type: 'checkout', title: 'ClickFunnels 2.0 Annuel + Bonus', url: 'clickfunnels.com/pricing', position_order: 3, metadata: { price: 2964, tier: 'mid_ticket' } },
      { id: 'n2-5', funnel_id: 'sample-2', type: 'email_sequence', title: 'Sequence "Soap Opera" Email', position_order: 4, metadata: { emailCount: 30 } },
    ],
  },
  {
    id: 'sample-3',
    creator_name: 'Marie Forleo',
    domain_url: 'marieforleo.com',
    estimated_spend: 32000,
    performance_score: 76,
    platform: 'google',
    is_sample: true,
    nodes: [
      { id: 'n3-1', funnel_id: 'sample-3', type: 'ad_source', title: 'YouTube + Google Display Ads', position_order: 0, metadata: { adsCount: 23, spend: 32000 } },
      { id: 'n3-2', funnel_id: 'sample-3', type: 'opt_in', title: 'Quiz Gratuit "Quel entrepreneur êtes-vous?"', url: 'marieforleo.com/quiz', position_order: 1, metadata: { conversionRate: 55 } },
      { id: 'n3-3', funnel_id: 'sample-3', type: 'vsl', title: 'Masterclass "B-School" — Démo', url: 'marieforleo.com/bschool', position_order: 2, metadata: {} },
      { id: 'n3-4', funnel_id: 'sample-3', type: 'checkout', title: 'B-School — Formation Business Online', url: 'marieforleo.com/join', position_order: 3, metadata: { price: 2497, tier: 'mid_ticket' } },
      { id: 'n3-5', funnel_id: 'sample-3', type: 'email_sequence', title: 'Séquence Nurture 45 jours', position_order: 4, metadata: { emailCount: 15 } },
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
    nodes: [
      { id: 'n4-1', funnel_id: 'sample-4', type: 'ad_source', title: 'Facebook Ads — Blogging & SEO', position_order: 0, metadata: { adsCount: 12, spend: 9500 } },
      { id: 'n4-2', funnel_id: 'sample-4', type: 'opt_in', title: 'Formation Gratuite "Vivre de son blog"', url: 'vivre-de-son-site.fr/formation', position_order: 1, metadata: { conversionRate: 48 } },
      { id: 'n4-3', funnel_id: 'sample-4', type: 'vsl', title: 'VSL Coaching Blog → Business', url: 'vivre-de-son-site.fr/coaching', position_order: 2, metadata: {} },
      { id: 'n4-4', funnel_id: 'sample-4', type: 'checkout', title: 'Coaching Individuel 6 mois', url: 'vivre-de-son-site.fr/coaching/apply', position_order: 3, metadata: { price: 3500, tier: 'mid_ticket' } },
      { id: 'n4-5', funnel_id: 'sample-4', type: 'email_sequence', title: 'Email Auto Bienvenue + Valeur', position_order: 4, metadata: { emailCount: 9 } },
    ],
  },
];

function findSample(query: string) {
  const q = query.toLowerCase().replace(/https?:\/\//, '').replace(/www\./, '');
  return SAMPLE_FUNNELS.find(f =>
    f.creator_name.toLowerCase().includes(q) ||
    f.domain_url.toLowerCase().includes(q)
  ) ?? null;
}

function generateMock(query: string, platform: string) {
  const score = Math.floor(Math.random() * 40) + 50;
  const spend = Math.floor(Math.random() * 40000) + 5000;
  const domain = query.includes('.') ? query : `${query.toLowerCase().replace(/\s+/g, '-')}.com`;
  const name = domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const id = `gen-${Date.now()}`;

  return {
    id,
    creator_name: name,
    domain_url: domain,
    estimated_spend: spend,
    performance_score: score,
    platform: platform || 'meta',
    is_sample: true,
    nodes: [
      { id: `${id}-1`, funnel_id: id, type: 'ad_source', title: `Publicités ${platform === 'google' ? 'Google' : platform === 'linkedin' ? 'LinkedIn' : 'Meta'}`, position_order: 0, metadata: { adsCount: Math.floor(Math.random() * 30) + 5, spend, thumbnails: [] } },
      { id: `${id}-2`, funnel_id: id, type: 'opt_in', title: 'Page de Capture — Lead Magnet', url: `https://${domain}/optin`, position_order: 1, metadata: { conversionRate: Math.floor(Math.random() * 30) + 20 } },
      { id: `${id}-3`, funnel_id: id, type: 'vsl', title: "Vidéo de Présentation de l'Offre", url: `https://${domain}/video`, position_order: 2, metadata: {} },
      { id: `${id}-4`, funnel_id: id, type: 'checkout', title: 'Page de Vente Principale', url: `https://${domain}/checkout`, position_order: 3, metadata: { price: Math.floor(Math.random() * 2000) + 500, tier: score >= 75 ? 'high_ticket' : score >= 50 ? 'mid_ticket' : 'low_ticket' } },
      { id: `${id}-5`, funnel_id: id, type: 'email_sequence', title: 'Séquence Email Automatisée', position_order: 4, metadata: { emailCount: Math.floor(Math.random() * 15) + 5 } },
    ],
  };
}

// ── GET /analyze ──────────────────────────────────────────────────────────────
app.get('/analyze', async (c) => {
  const query = c.req.query('query')?.trim() ?? '';
  const platform = c.req.query('platform') ?? 'meta';

  if (!query) {
    return c.json({ error: 'Missing query parameter' }, 400);
  }

  // 1. Try to match a known sample funnel
  const sample = findSample(query);
  if (sample) {
    return c.json({ funnel: sample, source: 'sample' });
  }

  // 2. Generate a plausible mock funnel
  const mock = generateMock(query, platform);
  return c.json({ funnel: mock, source: 'generated' });
});

// ── GET /samples ──────────────────────────────────────────────────────────────
app.get('/samples', (c) => {
  return c.json({ funnels: SAMPLE_FUNNELS });
});

export const router = app;
