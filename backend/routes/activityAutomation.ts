import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();
type Row = Record<string, any>;
const table = (b: any, n: string) => b.db.table<Row>(n);
async function actor(c: any) { const b = createClient({ projectId: c.env.BLINK_PROJECT_ID, secretKey: c.env.BLINK_SECRET_KEY }); const a = await b.auth.verifyToken(c.req.header('Authorization')); return a.valid ? { b, id: a.userId, email: a.email } : null; }
const n = (v: any) => Number(v) || 0;
const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>\"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[char] || char));

/** Previous completed Monday-to-Monday reporting window in UTC. */
function previousWeek(now = new Date()) {
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = monday.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday - 7);
  const nextMonday = new Date(monday);
  nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);
  return { from: monday, to: nextMonday };
}

export async function buildWeeklyActivityReport(b: any, userId: string, now = new Date()) {
  const window = previousWeek(now);
  const start = window.from.getTime();
  const end = window.to.getTime();
  const posts = await table(b, 'scheduled_posts').list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 1000 });
  const metrics = await table(b, 'post_engagement_metrics').list({ where: { userId }, orderBy: { recordedAt: 'desc' }, limit: 3000 });
  const recent = (metrics as Row[]).filter(item => {
    const timestamp = new Date(item.recordedAt || item.createdAt || 0).getTime();
    return timestamp >= start && timestamp < end;
  });
  const byPlatform: Record<string, any> = {};
  for (const metric of recent) {
    const platform = metric.platform || 'unknown';
    const totals = byPlatform[platform] ||= { impressions: 0, reach: 0, clicks: 0, shares: 0, comments: 0 };
    for (const key of Object.keys(totals)) totals[key] += n(metric[key]);
  }
  const score = (metric: Row) => n(metric.impressions) + n(metric.reach) + n(metric.clicks) * 3 + n(metric.shares) * 4 + n(metric.comments) * 4;
  const topPosts = [...posts]
    .filter(post => {
      const timestamp = new Date(post.scheduledAt || post.createdAt || 0).getTime();
      return timestamp >= start && timestamp < end;
    })
    .map(post => ({ ...post, score: recent.filter(metric => metric.postId === post.id).reduce((sum, metric) => sum + score(metric), 0) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
  const summary = {
    postsScheduled: topPosts.length,
    impressions: recent.reduce((sum, item) => sum + n(item.impressions), 0),
    reach: recent.reduce((sum, item) => sum + n(item.reach), 0),
    clicks: recent.reduce((sum, item) => sum + n(item.clicks), 0),
    shares: recent.reduce((sum, item) => sum + n(item.shares), 0),
    comments: recent.reduce((sum, item) => sum + n(item.comments), 0),
  };
  return { period: { from: window.from.toISOString(), to: window.to.toISOString() }, summary, byPlatform, topPosts };
}

router.get('/api/activity/weekly-report', async c => {
  const user = await actor(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  return c.json(await buildWeeklyActivityReport(user.b, user.id));
});

router.get('/api/content-suggestions', async c => {
  const user = await actor(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const posts = await table(user.b, 'scheduled_posts').list({ where: { userId: user.id }, limit: 1000 });
  const metrics = await table(user.b, 'post_engagement_metrics').list({ where: { userId: user.id }, limit: 3000 });
  const grouped: Record<string, any> = {};
  for (const metric of metrics as Row[]) { const platform = metric.platform || 'general'; const group = grouped[platform] ||= { posts: 0, impressions: 0, engagement: 0 }; group.posts++; group.impressions += n(metric.impressions); group.engagement += n(metric.clicks) + n(metric.shares) + n(metric.comments); }
  const signals = Object.entries(grouped).map(([platform, value]) => ({ platform, ...(value as any), engagementRate: (value as any).impressions ? (value as any).engagement / (value as any).impressions : 0 })).sort((left, right) => right.engagementRate - left.engagementRate);
  const requested = c.req.query('platform');
  const targets = requested ? [requested] : (signals.length ? signals.slice(0, 3).map(item => item.platform) : ['linkedin', 'instagram']);
  let drafts: any[] = [];
  try {
    const ai = await user.b.ai.generateText({ messages: [{ role: 'system', content: 'You are Kompilot social content strategist. Produce concise platform-aware drafts in French. Return one draft per platform as JSON array with platform, hook, body, cta.' }, { role: 'user', content: JSON.stringify({ targets, signals, topPosts: posts.slice(0, 10).map((post: any) => post.textContent) }) }], maxTokens: 900 });
    const match = ai.text.match(/\[[\s\S]*\]/);
    drafts = match ? JSON.parse(match[0]) : [];
  } catch (error) { console.error('[suggestions] AI unavailable', error); }
  if (!drafts.length) drafts = targets.map(platform => ({ platform, hook: platform === 'linkedin' ? 'Une idée à partager avec votre réseau' : 'Découvrez notre actualité', body: 'Partagez une information utile, concrète et adaptée à votre audience.', cta: 'En savoir plus', source: 'fallback' }));
  return c.json({ signals, drafts, generatedBy: drafts[0]?.source === 'fallback' ? 'fallback' : 'blink-ai' });
});

/** Sends one report per user and calendar week. Failed rows remain retryable. */
export async function deliverWeeklyReports(b: any) {
  const users = await table(b, 'users').list({ limit: 500 });
  const reports = table(b, 'weekly_activity_reports');
  let sent = 0; let skipped = 0; let failed = 0;
  for (const user of users as Row[]) {
    if (!user.email) continue;
    const settings = (await table(b, 'user_notification_settings').list({ where: { userId: user.id }, limit: 1 }))[0];
    if (settings && Number(settings.weeklyReportEnabled) === 0) { skipped++; continue; }
    const report = await buildWeeklyActivityReport(b, user.id);
    const key = `${user.id}:${report.period.from.slice(0, 10)}`;
    let row: Row | undefined;
    let existing = (await reports.list({ where: { idempotencyKey: key }, limit: 1 }))[0] as Row | undefined;
    if (existing?.deliveredAt || existing?.status === 'sent') { skipped++; continue; }
    const attemptStartedAt = existing?.lastAttemptAt ? new Date(existing.lastAttemptAt).getTime() : 0;
    if (existing?.status === 'sending' && Date.now() - attemptStartedAt < 15 * 60 * 1000) { skipped++; continue; }
    try {
      if (!existing) {
        row = await reports.create({ id: crypto.randomUUID(), userId: user.id, periodStart: report.period.from, periodEnd: report.period.to, reportJson: JSON.stringify(report), idempotencyKey: key, status: 'sending', attemptCount: 1, lastAttemptAt: new Date().toISOString() });
      } else {
        row = await reports.update(existing.id, { status: 'sending', attemptCount: Number(existing.attemptCount || 0) + 1, lastAttemptAt: new Date().toISOString(), reportJson: JSON.stringify(report), lastError: '' });
      }
    } catch (error: any) {
      if (error?.status !== 409 && error?.details?.code !== '23505') throw error;
      existing = (await reports.list({ where: { idempotencyKey: key }, limit: 1 }))[0] as Row | undefined;
      if (!existing || existing.deliveredAt || existing.status === 'sending') { skipped++; continue; }
      row = await reports.update(existing.id, { status: 'sending', attemptCount: Number(existing.attemptCount || 0) + 1, lastAttemptAt: new Date().toISOString(), reportJson: JSON.stringify(report), lastError: '' });
    }
    const firstName = escapeHtml(user.displayName || user.email.split('@')[0]);
    const topPostMarkup = report.topPosts.length ? report.topPosts.map((post: Row) => `<li>${escapeHtml(post.textContent).slice(0, 180)}</li>`).join('') : '<li>Pas encore de publication mesurée cette semaine.</li>';
    const platformMarkup = Object.entries(report.byPlatform).map(([platform, value]) => `<tr><td style="padding:6px 8px">${escapeHtml(platform)}</td><td style="padding:6px 8px">${n((value as Row).impressions).toLocaleString('fr-FR')}</td><td style="padding:6px 8px">${n((value as Row).clicks).toLocaleString('fr-FR')}</td></tr>`).join('');
    try {
      await b.notifications.email({
        to: user.email,
        subject: `Votre bilan Kompilot du ${report.period.from.slice(0, 10)} au ${report.period.to.slice(0, 10)}`,
        text: `Bonjour ${user.displayName || user.email.split('@')[0]}, impressions ${report.summary.impressions}, portée ${report.summary.reach}, clics ${report.summary.clicks}, partages ${report.summary.shares}, commentaires ${report.summary.comments}.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#0f172a"><h2 style="color:#0D9488">Votre bilan d’activité Kompilot</h2><p>Bonjour ${firstName}, voici votre activité du ${report.period.from.slice(0, 10)} au ${report.period.to.slice(0, 10)}.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><p style="background:#f0fdfa;padding:12px;border-radius:8px"><strong>${report.summary.impressions.toLocaleString('fr-FR')}</strong><br/>impressions</p><p style="background:#f0fdfa;padding:12px;border-radius:8px"><strong>${report.summary.reach.toLocaleString('fr-FR')}</strong><br/>portée</p><p style="background:#f0fdfa;padding:12px;border-radius:8px"><strong>${report.summary.clicks.toLocaleString('fr-FR')}</strong><br/>clics</p></div><p>Publications : ${report.summary.postsScheduled} · Partages : ${report.summary.shares} · Commentaires : ${report.summary.comments}</p>${platformMarkup ? `<h3>Par plateforme</h3><table style="width:100%;border-collapse:collapse"><tr><th style="text-align:left;padding:6px 8px">Canal</th><th style="text-align:left;padding:6px 8px">Impressions</th><th style="text-align:left;padding:6px 8px">Clics</th></tr>${platformMarkup}</table>` : ''}<h3>Vos meilleurs contenus</h3><ul>${topPostMarkup}</ul><p><a href="https://kompilot.fr/dashboard" style="display:inline-block;background:#0D9488;color:#fff;padding:11px 18px;border-radius:8px;text-decoration:none">Ouvrir Kompilot</a></p><p style="font-size:11px;color:#64748b">Vous pouvez désactiver ce bilan dans Paramètres → Notifications.</p></div>`,
      });
      await reports.update((row as Row).id, { status: 'sent', deliveredAt: new Date().toISOString(), lastError: '' });
      sent++;
    } catch (error) {
      failed++;
      await reports.update((row as Row).id, { status: 'failed', lastError: error instanceof Error ? error.message : String(error) });
      console.error(`[weekly-report] delivery failed for ${user.id}`, error);
    }
  }
  return { sent, skipped, failed };
}
