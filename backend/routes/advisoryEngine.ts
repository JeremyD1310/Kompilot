import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';
import { ADVISORY_SCHEMA, buildAdvisoryPrompt } from '../lib/advisoryPrompts';

export const router = new Hono<{ Bindings: Env }>();

type AnyRow = Record<string, unknown>;

function getBlink(env: Env) { return createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY }); }

const VALID_STATUSES = new Set(['critical', 'attention', 'opportunity', 'healthy']);
const VALID_IMPACTS = new Set(['high', 'medium', 'low']);
const VALID_EFFORTS = new Set(['low', 'medium', 'high']);

function safeText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeActions(actions: unknown) {
  if (!Array.isArray(actions)) return [];
  return actions.slice(0, 3).flatMap((action, index) => {
    if (!action || typeof action !== 'object') return [];
    const item = action as Record<string, unknown>;
    return [{
      id: safeText(item.id, `action-${index + 1}`),
      title: safeText(item.title, 'Action recommandée'),
      detail: safeText(item.detail, 'Complétez cette action depuis votre espace Kompilot.'),
      impact: VALID_IMPACTS.has(String(item.impact)) ? String(item.impact) : 'medium',
      effort: VALID_EFFORTS.has(String(item.effort)) ? String(item.effort) : 'medium',
    }];
  });
}
function compact(rows: AnyRow[], fields: string[], limit = 20) { return rows.slice(0, limit).map(row => Object.fromEntries(fields.map(field => [field, row[field]]))); }
function maturity(rows: AnyRow[]) { return rows.length > 20 ? 'established' : rows.length > 5 ? 'developing' : 'emerging'; }

function metricSnapshot(rows: AnyRow[]) {
  const sum = (field: string) => rows.reduce((total, row) => total + (Number(row[field]) || 0), 0);
  return {
    posts: rows.length,
    impressions: sum('impressions'),
    reach: sum('reach'),
    clicks: sum('clicks'),
    engagementRate: rows.length ? rows.reduce((total, row) => total + (Number(row.engagementRate) || 0), 0) / rows.length : 0,
  };
}

async function buildContext(blink: any, userId: string) {
  const [establishments, daily, engagement, campaigns, trackers, history, posts, reports] = await Promise.all([
    blink.db.table('establishments').list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 10 }),
    blink.db.table('daily_analytics').list({ where: { userId }, orderBy: { snapshotDate: 'desc' }, limit: 30 }),
    blink.db.table('post_engagement_metrics').list({ where: { userId }, orderBy: { recordedAt: 'desc' }, limit: 100 }),
    blink.db.table('campaign_performance').list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 30 }),
    blink.db.table('llm_trackers').list({ where: { userId }, orderBy: { updatedAt: 'desc' }, limit: 10 }),
    blink.db.table('llm_visibility_history').list({ where: { userId }, orderBy: { snapshotDate: 'desc' }, limit: 30 }),
    blink.db.table('scheduled_posts').list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 50 }),
    blink.db.table('creative_reports').list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 10 }),
  ]);
  const business = establishments[0] ?? {};
  return {
    verifiedProfile: {
      name: business.name ?? 'Entreprise non renseignée',
      sector: business.activityLabel || (business.activity ?? 'Secteur non renseigné'),
      city: business.city ?? 'Ville non renseignée',
      siret: business.siret ?? null,
      legalAddress: business.legalAddress ?? null,
      postalCode: business.postalCode ?? null,
      activityCode: business.activityCode ?? null,
      activityLabel: business.activityLabel ?? null,
      legalForm: business.legalForm ?? null,
      website: business.website ?? null,
      description: business.description ?? null,
      verificationSource: business.verificationSource ?? 'unknown',
      verifiedAt: business.verifiedAt ?? null,
      verifiedViaPappers: business.verificationSource === 'pappers',
    },
    maturity: maturity(posts),
    metrics: {
      dailyAnalytics: compact(daily, ['snapshotDate', 'geoScore', 'unhandledReviews', 'postsPublished', 'reviewsHandled', 'localVisibility']),
      social: compact(engagement, ['platform', 'impressions', 'reach', 'clicks', 'shares', 'comments', 'engagementRate', 'ctr', 'recordedAt']),
      campaigns: compact(campaigns, ['campaignName', 'totalImpressions', 'totalClicks', 'avgEngagementRate', 'avgCtr', 'periodStart', 'periodEnd']),
      geo: compact(trackers, ['brandName', 'enginesToCheck', 'checkFrequency', 'overallVisibilityScore', 'lastCheckAt']),
      geoHistory: compact(history, ['trackerId', 'score', 'queriesChecked', 'brandMentions', 'urlCitations', 'snapshotDate']),
      contentPlan: compact(posts, ['status', 'scheduledAt', 'channels', 'textContent', 'createdAt'], 30),
      acquisition: compact(reports, ['adsAnalyzed', 'budgetWasteDetected', 'winners', 'losers', 'nextActions', 'rawMetaData', 'createdAt']),
    },
    connectedSources: [
      contextSource(business),
      daily.length ? 'Analytics Kompilot' : null,
      engagement.length ? 'Métriques sociales' : null,
      campaigns.length ? 'Campagnes SEA' : null,
      trackers.length ? 'Suivi GEO' : null,
      reports.length ? 'Rapports créatifs GEA' : null,
      posts.length ? 'Calendrier éditorial' : null,
    ].filter(Boolean),
  };
}

function normalize(raw: any, context: any, id?: string) {
  const labels: Record<string, string> = { social: 'Social Media', seo: 'SEO', geo: 'GEO', sea: 'SEA', gea: 'GEA' };
  const pillars = ['social', 'seo', 'geo', 'sea', 'gea'].map(id => {
    const found = raw?.pillars?.find((p: any) => p?.id === id) ?? {};
    const status = VALID_STATUSES.has(String(found.status)) ? String(found.status) : 'attention';
    const signals = Array.isArray(found.signals) ? found.signals.filter((signal: unknown): signal is string => typeof signal === 'string').slice(0, 4) : [];
    return {
      id,
      label: safeText(found.label, labels[id]),
      score: Math.max(0, Math.min(100, Number(found.score) || 0)),
      status,
      summary: safeText(found.summary, 'Données insuffisantes : connectez une source pour affiner ce conseil.'),
      signals,
      actions: normalizeActions(found.actions),
    };
  });
  const business = context.verifiedProfile;
  return { id, generatedAt: new Date().toISOString(), overallScore: Number(raw?.overallScore) || Math.round(pillars.reduce((sum, p) => sum + p.score, 0) / pillars.length), criticalCount: Number(raw?.criticalCount) || pillars.filter(p => p.status === 'critical').length, business: { name: business.name, sector: business.sector, city: business.city, siret: business.siret || undefined, maturity: context.maturity, profileVerified: business.verifiedViaPappers, verificationSource: business.verificationSource }, sources: context.connectedSources, pillars };
}

async function generateForUser(env: Env, userId: string) {
  const blink = getBlink(env);
  const context = await buildContext(blink, userId);
  let generated: any;
  try {
    const result = await blink.ai.generateObject({ prompt: buildAdvisoryPrompt(context), schema: ADVISORY_SCHEMA, model: 'google/gemini-3-flash' });
    generated = result.object;
  } catch (error) {
    console.error('[AdvisoryEngine] AI generation failed:', error);
    throw new Error('Le moteur conseil IA est temporairement indisponible. Réessayez dans quelques instants.');
  }
  const report = normalize(generated, context);
  const saved = await blink.db.table('advisory_reports').create({ userId, scope: 'all', reportJson: JSON.stringify(report), dataFingerprint: JSON.stringify({ sources: report.sources, generatedAt: report.generatedAt }) });
  return { ...report, id: saved.id };
}

router.get('/api/advisory/latest', async c => {
  const blink = getBlink(c.env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid || !auth.userId) return c.json({ error: 'Unauthorized' }, 401);
  const userId = auth.userId;
  const rows = await blink.db.table('advisory_reports').list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 1 });
  if (!rows[0]) return c.json({ error: 'No advisory report' }, 404);
  try { return c.json(JSON.parse(rows[0].reportJson)); } catch { return c.json({ error: 'Invalid advisory report' }, 500); }
});

router.post('/api/advisory/analyze', async c => {
  const blink = getBlink(c.env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid || !auth.userId) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const recent = await blink.db.table('advisory_reports').list({ where: { userId: auth.userId }, orderBy: { createdAt: 'desc' }, limit: 1 });
    const latestCreatedAt = recent[0]?.createdAt ? new Date(String(recent[0].createdAt)).getTime() : 0;
    if (latestCreatedAt && Date.now() - latestCreatedAt < 10 * 60 * 1000) {
      return c.json({ error: 'Une analyse a déjà été générée récemment. Réessayez dans quelques minutes.' }, 429, { 'Retry-After': '600' });
    }
    return c.json(await generateForUser(c.env, auth.userId));
  } catch (error: any) {
    console.error('[AdvisoryEngine]', error);
    return c.json({ error: error?.message || 'Advisory analysis failed' }, error?.message?.includes('indisponible') ? 503 : 500);
  }
});

router.get('/api/advisory/impact', async c => {
  const blink = getBlink(c.env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid || !auth.userId) return c.json({ error: 'Unauthorized' }, 401);

  const [reports, metrics] = await Promise.all([
    blink.db.table('advisory_reports').list({ where: { userId: auth.userId }, orderBy: { createdAt: 'desc' }, limit: 1 }),
    blink.db.table('post_engagement_metrics').list({ where: { userId: auth.userId }, orderBy: { recordedAt: 'asc' }, limit: 500 }),
  ]);
  const recommendationAt = String(reports[0]?.createdAt || new Date().toISOString());
  const boundary = new Date(recommendationAt).getTime();
  const validBoundary = Number.isFinite(boundary) ? boundary : Date.now();
  const beforeRows = metrics.filter((row: AnyRow) => new Date(String(row.recordedAt || row.createdAt || '')).getTime() < validBoundary);
  const afterRows = metrics.filter((row: AnyRow) => new Date(String(row.recordedAt || row.createdAt || '')).getTime() >= validBoundary);
  const before = metricSnapshot(beforeRows);
  const after = metricSnapshot(afterRows);
  return c.json({ recommendationAt, before, after, hasAfterData: afterRows.length > 0 });
});

export { generateForUser };