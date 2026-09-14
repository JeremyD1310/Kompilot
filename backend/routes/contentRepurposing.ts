import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';
import { consumeContentQuota, releaseContentQuota } from '../lib/contentQuota';
import { scheduleApprovedRepurposing } from '../lib/repurposingScheduler';

export const router = new Hono<{ Bindings: Env }>();
type Row = Record<string, any>;
type Output = { channel: string; title: string; content: string; cta: string; hashtags: string[]; formatHint: string };

const blinkFor = (env: Env) => createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
async function auth(c: any) {
  const client = blinkFor(c.env as Env);
  const verified = await client.auth.verifyToken(c.req.header('Authorization') || '');
  return verified.valid ? { client, userId: verified.userId } : null;
}
const outputSchema = { type: 'object', properties: { outputs: { type: 'array', items: { type: 'object', properties: { channel: { type: 'string' }, title: { type: 'string' }, content: { type: 'string' }, cta: { type: 'string' }, hashtags: { type: 'array', items: { type: 'string' } }, formatHint: { type: 'string' } }, required: ['channel', 'title', 'content', 'cta', 'hashtags', 'formatHint'] } } }, required: ['outputs'] };
const channels = ['linkedin', 'newsletter', 'carousel', 'short_video'];
const allowedTones = ['expert', 'pédagogique', 'direct', 'premium'];
const extractUrlText = async (client: any, sourceUrl: string) => {
  const extracted = await client.data.extractFromUrl(sourceUrl);
  return typeof extracted === 'string' ? extracted.trim() : Array.isArray(extracted) ? extracted.join('\n').trim() : '';
};
const safeSourceUrl = (value: string) => {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const privateHost = host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || host === '::1' || host === '0.0.0.0' || host.startsWith('127.') || host.startsWith('10.') || host.startsWith('192.168.') || host.startsWith('169.254.') || /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host.startsWith('fc') || host.startsWith('fe80:');
    return url.protocol === 'https:' && (!url.port || url.port === '443') && !privateHost;
  } catch { return false; }
};
const normalizeOutput = (item: Row, allowedChannels: string[]): Output | null => {
  if (!item || typeof item.channel !== 'string' || !allowedChannels.includes(item.channel) || typeof item.content !== 'string') return null;
  return {
    channel: item.channel,
    title: String(item.title || 'Contenu dérivé').slice(0, 180),
    content: item.content.slice(0, 12000),
    cta: String(item.cta || 'En savoir plus').slice(0, 240),
    hashtags: Array.isArray(item.hashtags) ? item.hashtags.map(String).map(tag => tag.trim()).filter(Boolean).slice(0, 8) : [],
    formatHint: String(item.formatHint || '').slice(0, 180),
  };
};
const fallback = (source: string): Output[] => [
  { channel: 'linkedin', title: 'Point de vue à partager', content: `${source.slice(0, 550)}\n\nQuel est votre retour d’expérience ?`, cta: 'Inviter à commenter', hashtags: ['#marketing', '#entreprise'], formatHint: 'Post expert · 800 à 1 200 caractères' },
  { channel: 'newsletter', title: 'L’essentiel en 3 minutes', content: `Bonjour,\n\nVoici les idées clés à retenir :\n\n${source.slice(0, 900)}\n\nÀ bientôt,\nL’équipe`, cta: 'Lire la suite', hashtags: [], formatHint: 'Objet + pré-header + email lisible' },
  { channel: 'carousel', title: 'Les idées clés', content: `Slide 1 — Le point de départ\nSlides 2 à 5 — Les enseignements\nDernière slide — Passez à l’action`, cta: 'Enregistrer le carrousel', hashtags: ['#conseils', '#strategie'], formatHint: '6 slides · 1 idée par slide' },
  { channel: 'short_video', title: 'Script vidéo 30 secondes', content: `Hook : Vous faites probablement cette erreur.\n\nCorps : ${source.slice(0, 500)}\n\nConclusion : Testez cette méthode cette semaine.`, cta: 'Suivre pour la suite', hashtags: ['#conseils', '#business'], formatHint: 'Hook · 3 scènes · conclusion' },
];

router.post('/api/content-repurposing/source', async (c) => {
  const session = await auth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json().catch(() => ({})) as Row;
  const sourceUrl = String(body.sourceUrl || '').trim();
  if (!safeSourceUrl(sourceUrl)) return c.json({ error: 'Utilisez une URL HTTPS publique sur le port 443.' }, 400);
  try {
    const sourceText = await extractUrlText(session.client, sourceUrl);
    if (sourceText.length < 40) return c.json({ error: 'Aucun contenu exploitable trouvé à cette URL.' }, 422);
    return c.json({ sourceText: sourceText.slice(0, 12000), sourceUrl, wordCount: sourceText.split(/\s+/).filter(Boolean).length });
  } catch (error) {
    return c.json({ error: error instanceof Error ? `Impossible d’extraire cette URL : ${error.message}` : 'Impossible d’extraire cette URL.' }, 422);
  }
});

router.post('/api/content-repurposing/generate', async (c) => {
  const session = await auth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json().catch(() => ({})) as Row;
  let source = String(body.sourceText || '').trim();
  const sourceUrl = String(body.sourceUrl || '').trim();
  const recommendationType = ['advisory', 'geo', 'aio'].includes(String(body.sourceType)) ? String(body.sourceType) : (body.recommendationId ? 'advisory' : '');
  const recommendationId = String(body.recommendationId || '').slice(0, 160);
  const recommendationTitle = String(body.recommendationTitle || '').slice(0, 240);
  if (sourceUrl && !safeSourceUrl(sourceUrl)) return c.json({ error: 'Utilisez une URL HTTPS publique sur le port 443.' }, 400);
  if (source.length < 40 && sourceUrl) {
    try { source = await extractUrlText(session.client, sourceUrl); }
    catch (error) { return c.json({ error: error instanceof Error ? `Impossible d’extraire cette URL : ${error.message}` : 'Impossible d’extraire cette URL.' }, 422); }
  }
  const selected = [...new Set((Array.isArray(body.channels) ? body.channels : channels).filter((channel: string) => channels.includes(channel)))];
  if (selected.length === 0) return c.json({ error: 'Sélectionnez au moins un canal de sortie.' }, 400);
  if (source.length < 40) return c.json({ error: 'Ajoutez au moins 40 caractères de source à recycler.' }, 400);
  const tone = allowedTones.includes(String(body.tone)) ? String(body.tone) : 'expert';
  const quota = await consumeContentQuota(c.env as Env, session.userId, 1, 'content_repurposing');
  if (!quota.success) return c.json({ error: 'Votre quota de génération de contenu est épuisé.', code: 'CONTENT_QUOTA_EXCEEDED', quota }, 429);
  let outputs: Output[];
  let usedFallback = false;
  try {
    const generated = await session.client.ai.generateObject({
      prompt: `Tu es le directeur éditorial de Kompilot pour les TPE/PME françaises. Transforme la source ci-dessous en contenus natifs distincts pour les canaux suivants : ${selected.join(', ')}. Ton : ${tone}. Ne fabrique aucune statistique. Pour carousel, structure le contenu en slides. Pour short_video, écris un script oral avec hook et scènes. Pour newsletter, inclue une accroche et un CTA. Les canaux autorisés sont exactement : ${channels.join(', ')}. Retourne exactement un objet outputs contenant une sortie par canal demandé. Source : ${source.slice(0, 12000)}`,
      schema: outputSchema,
    });
    outputs = ((generated.object as Row).outputs || []).map((item: Row) => normalizeOutput(item, selected)).filter((item): item is Output => Boolean(item));
    const byChannel = new Map(outputs.map(item => [item.channel, item]));
    outputs = selected.map(channel => byChannel.get(channel)).filter((item): item is Output => Boolean(item));
    if (outputs.length !== selected.length) throw new Error('Sorties IA incomplètes');
  } catch (error) {
    console.error('[repurposing] generation failed', error);
    outputs = fallback(source).filter(item => selected.includes(item.channel));
    usedFallback = true;
  }
  if (usedFallback) await releaseContentQuota(c.env as Env, session.userId, 1);
  const now = new Date().toISOString();
  const sourceLabel = String(body.sourceLabel || 'Source importée').slice(0, 180);
  const job = await session.client.db.table<Row>('repurposing_jobs').create({ id: crypto.randomUUID(), userId: session.userId, sourceType: recommendationType || (sourceUrl ? 'url' : 'text'), sourceLabel, sourceUrl, sourceText: source.slice(0, 12000), tone, selectedChannels: JSON.stringify(selected), outputsJson: JSON.stringify(outputs), status: usedFallback ? 'fallback' : 'completed', createdAt: now, updatedAt: now, sourceRecommendationId: recommendationId || null, sourceRecommendationType: recommendationType || null, sourceRecommendationTitle: recommendationTitle || null, autoSchedule: body.autoSchedule !== false, scheduleStartAt: body.scheduleStartAt || null, scheduleTimezone: String(body.scheduleTimezone || 'Europe/Paris').slice(0, 64) });
  return c.json({ jobId: job.id, outputs, generatedAt: now, usedFallback, quota: usedFallback ? null : quota });
});

router.post('/api/content-repurposing/:jobId/approval', async (c) => {
  const session = await auth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const jobId = c.req.param('jobId');
  const job = (await session.client.db.table<Row>('repurposing_jobs').list({ where: { id: jobId, userId: session.userId }, limit: 1 }))[0];
  if (!job) return c.json({ error: 'Pack introuvable.' }, 404);
  const body = await c.req.json().catch(() => ({})) as Row;
  const approvalTable = session.client.db.table<Row>('repurposing_approvals');
  const existing = (await approvalTable.list({ where: { jobId, userId: session.userId, status: 'pending' }, limit: 1 }))[0];
  if (existing) return c.json({ approvalId: existing.id, token: existing.token, slackSent: Boolean(existing.slackSent), status: existing.status }, 200);
  if (Array.isArray(body.outputs)) {
    const original = (() => { try { const parsed = JSON.parse(job.outputsJson || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; } })();
    const originalChannels = new Set(original.map((item: Row) => item.channel));
    const safeOutputs = body.outputs.map((item: Row) => normalizeOutput(item, [...originalChannels])).filter((item): item is Output => Boolean(item)).slice(0, 8);
    if (safeOutputs.length) await session.client.db.table<Row>('repurposing_jobs').update(job.id, { outputsJson: JSON.stringify(safeOutputs), updatedAt: new Date().toISOString() });
  }
  const approval = await approvalTable.create({ id: crypto.randomUUID(), userId: session.userId, jobId, token: crypto.randomUUID(), status: 'pending', feedback: '', slackSent: false, approvalSource: 'app', autoSchedule: job.autoSchedule !== false, scheduleStartAt: job.scheduleStartAt || null, scheduleTimezone: job.scheduleTimezone || 'Europe/Paris', scheduleStatus: 'pending', expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), createdAt: new Date().toISOString() });
  const slackWebhook = String((c.env as Record<string, string | undefined>)['SLACK_APPROVAL_WEBHOOK'] || '');
  let slackSent = false;
  if (slackWebhook) {
    try {
      const approvalUrl = `${String((c.env as any).APP_URL || 'https://kompilot.fr').replace(/\/$/, '')}/approval/${approval.token}`;
      const hookResponse = await fetch(slackWebhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: `Kompilot · validation requise\n${String(job.sourceLabel || '').slice(0, 180)}\n${String(body.message || 'Un pack de contenus attend votre validation.').slice(0, 500)}`, blocks: [{ type: 'section', text: { type: 'mrkdwn', text: `*Validation requise*\n${String(job.sourceLabel || '').slice(0, 180)}\n${String(body.message || 'Un pack de contenus attend votre validation.').slice(0, 500)}` } }, { type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'Ouvrir la validation' }, url: approvalUrl, action_id: 'open_approval' }] }] }), signal: AbortSignal.timeout(8000) });
      slackSent = hookResponse.ok;
      if (slackSent) await session.client.db.table<Row>('repurposing_approvals').update(approval.id, { slackSent: true });
    } catch (error) { console.warn('[repurposing] Slack notification failed', error); }
  }
  await session.client.db.table<Row>('notifications_queue').create({ id: crypto.randomUUID(), userId: session.userId, title: 'Validation requise · pack de contenus', body: `${job.sourceLabel} attend votre validation avant programmation.`, type: 'approval_required', url: '/notifications', status: 'sent', createdAt: new Date().toISOString() });
  return c.json({ approvalId: approval.id, token: approval.token, slackSent, status: 'pending' }, 201);
});

router.get('/api/content-repurposing/approval/:token', async (c) => {
  const client = blinkFor(c.env as Env);
  const approval = (await client.db.table<Row>('repurposing_approvals').list({ where: { token: c.req.param('token') }, limit: 1 }))[0];
  if (!approval) return c.json({ error: 'Demande introuvable.' }, 404);
  return c.json({ approvalId: approval.id, jobId: approval.jobId, status: approval.status, expiresAt: approval.expiresAt, message: 'Confirmez la décision avec une requête POST.' });
});

router.post('/api/content-repurposing/approval/:token/:decision', async (c) => {
  const decision = c.req.param('decision');
  if (!['approve', 'reject'].includes(decision)) return c.json({ error: 'Décision invalide.' }, 400);
  const client = blinkFor(c.env as Env);
  const approval = (await client.db.table<Row>('repurposing_approvals').list({ where: { token: c.req.param('token') }, limit: 1 }))[0];
  if (!approval) return c.json({ error: 'Demande introuvable.' }, 404);
  if (approval.status !== 'pending' || new Date(String(approval.expiresAt)) < new Date()) return c.json({ error: 'Cette demande a déjà été traitée ou a expiré.' }, 409);
  const status = decision === 'approve' ? 'approved' : 'rejected';
  const now = new Date().toISOString();
  await client.db.table<Row>('repurposing_approvals').update(approval.id, { status, approvalSource: 'token', approvedBy: 'token', decidedAt: now });
  const job = (await client.db.table<Row>('repurposing_jobs').list({ where: { id: approval.jobId, userId: approval.userId }, limit: 1 }))[0];
  if (!job) return c.json({ error: 'Pack introuvable.' }, 404);
  await client.db.table<Row>('repurposing_jobs').update(approval.jobId, { status, updatedAt: now });
  let scheduled = 0;
  if (status === 'approved' && approval.autoSchedule !== false) {
    scheduled = await scheduleApprovedRepurposing(c.env as Env, approval, job);
    await client.db.table<Row>('repurposing_approvals').update(approval.id, { scheduleStatus: 'scheduled', scheduledAt: now });
  }
  return c.json({ success: true, status, scheduled, message: status === 'approved' ? `${scheduled} contenu(s) programmé(s) dans le calendrier.` : 'Pack refusé.' });
});

router.get('/api/content-repurposing/jobs', async (c) => {
  const session = await auth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const rows = await session.client.db.table<Row>('repurposing_jobs').list({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' }, limit: 20 });
  return c.json({ jobs: rows.map(row => ({ id: row.id, sourceLabel: row.sourceLabel, sourceType: row.sourceType, sourceUrl: row.sourceUrl, tone: row.tone, selectedChannels: row.selectedChannels, status: row.status, createdAt: row.createdAt, updatedAt: row.updatedAt, outputs: (() => { try { const parsed = JSON.parse(row.outputsJson || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; } })() })) });
});
