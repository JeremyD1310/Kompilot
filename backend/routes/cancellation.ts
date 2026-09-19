import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink, getUserMeta, patchUserMeta } from '../lib/stripeHelpers';

export const router = new Hono();

type FeatureMatch = {
  keywords: string[];
  name: string;
  path: string;
  description: string;
};

const FEATURE_CATALOG: FeatureMatch[] = [
  { keywords: ['avis', 'google', 'review'], name: 'Avis Google', path: '/reviews', description: 'Centralisez vos avis Google et préparez vos réponses depuis la boîte de réception.' },
  { keywords: ['post', 'publication', 'contenu', 'calendrier'], name: 'Calendrier éditorial', path: '/calendrier', description: 'Créez et planifiez vos publications avec validation humaine avant diffusion.' },
  { keywords: ['geo', 'visibilité', 'chatgpt', 'perplexity', 'ia'], name: 'Visibilité GEO', path: '/geo-command-center', description: 'Suivez votre visibilité dans les réponses des moteurs et assistants IA.' },
  { keywords: ['message', 'inbox', 'whatsapp', 'messagerie'], name: 'Messagerie unique', path: '/inbox', description: 'Regroupez vos conversations clients dans une boîte de réception commune.' },
  { keywords: ['email', 'emailing', 'newsletter'], name: 'Email Marketing', path: '/email-marketing', description: 'Préparez vos campagnes email et suivez leurs performances.' },
  { keywords: ['seo', 'référencement'], name: 'SEO local', path: '/seo-local', description: 'Travaillez votre présence locale et les informations clés de votre établissement.' },
];

function normalize(value: string): string {
  return value
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

router.get('/api/cancellation/context', async (c) => {
  const env = c.env as unknown as Env;
  const blink = getBlink(env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const rows = await blink.db.table<any>('daily_analytics').list({
      where: { userId: auth.userId },
      orderBy: { snapshotDate: 'asc' },
      limit: 90,
    });

    const analytics = Array.isArray(rows) ? rows : [];
    const first = analytics[0];
    const latest = analytics[analytics.length - 1];
    const reviewsHandled = analytics.reduce((sum, row) => sum + Number(row.reviewsHandled ?? 0), 0);
    const postsPublished = analytics.reduce((sum, row) => sum + Number(row.postsPublished ?? 0), 0);
    const geoStart = first ? Number(first.geoScore ?? 0) : null;
    const geoCurrent = latest ? Number(latest.geoScore ?? 0) : null;
    const hasPersonalMetrics = analytics.length > 0 && (
      reviewsHandled > 0 || postsPublished > 0 || (geoCurrent ?? 0) > 0
    );

    return c.json({
      hasPersonalMetrics,
      reviewsHandled: reviewsHandled || null,
      postsPublished: postsPublished || null,
      geoScoreStart: geoStart && geoStart > 0 ? geoStart : null,
      geoScoreCurrent: geoCurrent && geoCurrent > 0 ? geoCurrent : null,
      geoScoreDelta: geoStart && geoCurrent ? geoCurrent - geoStart : null,
    });
  } catch (error) {
    console.error('[cancellation/context] failed', error);
    return c.json({
      hasPersonalMetrics: false,
      reviewsHandled: null,
      postsPublished: null,
      geoScoreStart: null,
      geoScoreCurrent: null,
      geoScoreDelta: null,
    });
  }
});

router.post('/api/cancellation/feature-check', async (c) => {
  const env = c.env as unknown as Env;
  const blink = getBlink(env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{ feature?: string }>().catch(() => ({ feature: '' }));
  const feature = String(body.feature ?? '').trim();
  if (feature.length < 3) return c.json({ error: 'Décrivez la fonctionnalité recherchée.' }, 400);

  const normalized = normalize(feature);
  const match = FEATURE_CATALOG.find((item) => item.keywords.some((keyword) => normalized.includes(normalize(keyword))));

  return c.json(match
    ? { exists: true, featureName: match.name, description: match.description, tryPath: match.path }
    : { exists: false });
});

router.post('/api/cancellation/feature-request', async (c) => {
  const env = c.env as unknown as Env;
  const blink = getBlink(env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{ feature?: string }>().catch(() => ({ feature: '' }));
  const feature = String(body.feature ?? '').trim();
  if (feature.length < 3) return c.json({ error: 'Décrivez la fonctionnalité recherchée.' }, 400);

  const meta = await getUserMeta(blink, auth.userId);
  await patchUserMeta(blink, auth.userId, {
    ...meta,
    cancellation_feature_request: feature.slice(0, 1000),
    cancellation_feature_requested_at: new Date().toISOString(),
  });

  return c.json({ success: true });
});
