import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';
export const router = new Hono<{ Bindings: Env }>();
type Row = Record<string, any>;
const auth = async (c: any) => { const h = c.req.header('Authorization'); if (!h) return null; const blink = createClient({ projectId: requireBlinkProjectId(c.env), secretKey: c.env.BLINK_SECRET_KEY }); const v = await blink.auth.verifyToken(h); return v.valid ? { id: v.userId, email: v.email, blink } : null; };
const date = (v: any) => { const t = new Date(v || 0).getTime(); return Number.isFinite(t) ? t : 0; };
async function build(u: any) { const to = Date.now(); const from = to - 7 * 86400000; const campaigns = await u.blink.db.table<Row>('campaigns').list({ where: { userId: u.id }, limit: 500 }); const ids = new Set(campaigns.map(x => x.id)); const events = (await u.blink.db.table<Row>('campaign_events').list({ limit: 2000 })).filter(x => ids.has(x.campaignId) && date(x.createdAt) >= from && date(x.createdAt) <= to); const posts = await u.blink.db.table<Row>('scheduled_posts').list({ where: { userId: u.id }, limit: 500 }); const metrics = (await u.blink.db.table<Row>('post_engagement_metrics').list({ where: { userId: u.id }, limit: 2000 })).filter(x => date(x.recordedAt || x.createdAt) >= from && date(x.recordedAt || x.createdAt) <= to); const count = (types: string[]) => events.filter(x => types.includes(String(x.eventType).toLowerCase())).length; const delivered = count(['delivered', 'sent']); const opened = count(['opened', 'open']); const clicked = count(['clicked', 'click']); const byCampaign = campaigns.map(c => ({ campaign: c, events: events.filter(e => e.campaignId === c.id).length })).sort((a, b) => b.events - a.events); const byPost = posts.map(p => ({ post: p, score: metrics.filter(m => m.postId === p.id).reduce((n, m) => n + Number(m.impressions || 0) + Number(m.clicks || 0) + Number(m.shares || 0) + Number(m.comments || 0), 0) })).sort((a, b) => b.score - a.score); return { period: { from: new Date(from).toISOString(), to: new Date(to).toISOString() }, summary: { delivered, opened, clicked, ctr: delivered ? clicked / delivered : 0, topCampaign: byCampaign[0]?.campaign || null, topSocialPost: byPost[0]?.post || null } }; }
router.get('/api/weekly-email-report/latest', async c => { const u = await auth(c); if (!u) return c.json({ error: 'Unauthorized' }, 401); return c.json(await build(u)); });
router.post('/api/weekly-email-report/send', async c => {
  const u = await auth(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  return c.json({ error: 'Use the canonical activity report delivery from the weekly schedule.' }, 410);
});