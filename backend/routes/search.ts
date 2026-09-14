/**
 * search.ts — Global search endpoint
 *
 * GET /api/search?q=...&limit=5
 * Searches across: establishments, scheduled_posts, posts,
 * crm_contacts, messages (inbox), campaigns.
 * Requires auth (user JWT).
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

function getUserId(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const payload = authHeader.split('.')[1];
    return (JSON.parse(atob(payload))).sub ?? null;
  } catch {
    return null;
  }
}

// ── GET /api/search ───────────────────────────────────────────────────────────

router.get('/api/search', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const q = (c.req.query('q') || '').trim();
  if (!q || q.length < 2) {
    return c.json({ results: [] });
  }

  const limitPerCategory = parseInt(c.req.query('limit') || '5', 10);
  const env = c.env as unknown as Env;
  const blink = createClient({
    projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk',
    secretKey: env.BLINK_SECRET_KEY,
  });

  const results: Array<{
    id: string;
    type: 'establishment' | 'post' | 'contact' | 'message' | 'campaign' | 'scheduled_post';
    title: string;
    subtitle: string;
    url: string;
    icon: string;
  }> = [];

  try {
    // ── 1. Establishments ──
    const establishments = await (blink.db.table('establishments') as any).list({
      where: { userId },
      limit: 50,
    });
    const matchedEst = (Array.isArray(establishments) ? establishments : [])
      .filter((e: any) => {
        const searchIn = `${e.name || ''} ${e.activity || ''} ${e.city || ''}`.toLowerCase();
        return searchIn.includes(q.toLowerCase());
      })
      .slice(0, limitPerCategory);
    for (const e of matchedEst) {
      results.push({
        id: e.id,
        type: 'establishment',
        title: e.name || 'Sans nom',
        subtitle: `${e.activity || ''} · ${e.city || ''}`,
        url: `/dashboard?establishment=${e.id}`,
        icon: '🏪',
      });
    }

    // ── 2. Scheduled posts ──
    const schedPosts = await (blink.db.table('scheduled_posts') as any).list({
      where: { userId },
      limit: 200,
    });
    const matchedSched = (Array.isArray(schedPosts) ? schedPosts : [])
      .filter((p: any) => (p.text_content || '').toLowerCase().includes(q.toLowerCase()))
      .slice(0, limitPerCategory);
    for (const p of matchedSched) {
      results.push({
        id: p.id,
        type: 'scheduled_post',
        title: (p.text_content || '').substring(0, 80) + ((p.text_content || '').length > 80 ? '…' : ''),
        subtitle: `Statut: ${p.status || 'draft'}`,
        url: `/cockpit?post=${p.id}`,
        icon: '📅',
      });
    }

    // ── 3. Posts (existing posts table) ──
    const posts = await (blink.db.table('posts') as any).list({
      where: { userId },
      limit: 200,
    });
    const matchedPosts = (Array.isArray(posts) ? posts : [])
      .filter((p: any) => {
        const searchIn = `${p.title || ''} ${p.content || ''}`.toLowerCase();
        return searchIn.includes(q.toLowerCase());
      })
      .slice(0, limitPerCategory);
    for (const p of matchedPosts) {
      results.push({
        id: p.id,
        type: 'post',
        title: p.title || 'Sans titre',
        subtitle: `Statut: ${p.status || 'draft'}`,
        url: `/cockpit?post=${p.id}`,
        icon: '📝',
      });
    }

    // ── 4. Messages (inbox) ──
    const messages = await (blink.db.table('messages') as any).list({
      where: { userId },
      limit: 200,
    });
    const matchedMsgs = (Array.isArray(messages) ? messages : [])
      .filter((m: any) => {
        const searchIn = `${m.subject || ''} ${m.body || ''} ${m.senderName || ''} ${m.senderEmail || ''}`.toLowerCase();
        return searchIn.includes(q.toLowerCase());
      })
      .slice(0, limitPerCategory);
    for (const m of matchedMsgs) {
      results.push({
        id: m.id,
        type: 'message',
        title: m.subject || 'Sans objet',
        subtitle: `${m.senderName || m.senderEmail || 'Inconnu'}`,
        url: `/inbox?message=${m.id}`,
        icon: '✉️',
      });
    }

    // ── 5. CRM Contacts ──
    const contacts = await (blink.db.table('crm_contacts') as any).list({
      where: { userId },
      limit: 200,
    });
    const matchedContacts = (Array.isArray(contacts) ? contacts : [])
      .filter((c: any) => {
        const searchIn = `${c.firstName || ''} ${c.lastName || ''} ${c.email || ''} ${c.company || ''}`.toLowerCase();
        return searchIn.includes(q.toLowerCase());
      })
      .slice(0, limitPerCategory);
    for (const c of matchedContacts) {
      results.push({
        id: c.id,
        type: 'contact',
        title: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || 'Sans nom',
        subtitle: `${c.company || ''} · ${c.email || ''}`,
        url: `/contacts?contact=${c.id}`,
        icon: '👤',
      });
    }

    // ── 6. Campaigns ──
    const campaigns = await (blink.db.table('campaigns') as any).list({
      where: { userId },
      limit: 200,
    });
    const matchedCampaigns = (Array.isArray(campaigns) ? campaigns : [])
      .filter((c: any) => {
        const searchIn = `${c.name || ''} ${c.subject || ''}`.toLowerCase();
        return searchIn.includes(q.toLowerCase());
      })
      .slice(0, limitPerCategory);
    for (const c of matchedCampaigns) {
      results.push({
        id: c.id,
        type: 'campaign',
        title: c.name || 'Sans nom',
        subtitle: `${c.status || 'draft'} · ${c.recipientCount || 0} destinataires`,
        url: `/campaigns?campaign=${c.id}`,
        icon: '📊',
      });
    }

    return c.json({ results });
  } catch (e: any) {
    console.error('[Search] Error:', e.message);
    return c.json({ error: e.message }, 500);
  }
});
