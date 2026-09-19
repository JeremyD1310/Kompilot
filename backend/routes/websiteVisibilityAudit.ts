import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { requireBlinkProjectId } from '../lib/blinkConfig';
import type { Env } from '../lib/types';
import { runWebsiteVisibilityAudit, validatePublicWebsiteUrl, type WebsiteVisibilityAudit } from '../lib/websiteVisibilityAuditService';

export const router = new Hono<{ Bindings: Env }>();

function client(env: Env) {
  return createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
}

async function userId(c: any, blink: ReturnType<typeof client>) {
  const verified = await blink.auth.verifyToken(c.req.header('Authorization') ?? '');
  return verified.valid && verified.userId ? verified.userId : null;
}

async function persistAudit(blink: ReturnType<typeof client>, ownerId: string, audit: WebsiteVisibilityAudit) {
  await (blink.db as any).sql(
    `INSERT INTO website_visibility_audits
      (id, user_id, requested_url, canonical_origin, scores_json, methodology_json, limitations_json, page_count, finding_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [audit.auditId, ownerId, audit.requestedUrl, audit.canonicalOrigin, JSON.stringify(audit.scores), JSON.stringify(audit.methodology), JSON.stringify(audit.limitations), audit.pages.length, audit.findings.length, audit.observedAt],
  );
  for (const page of audit.pages) {
    await (blink.db as any).sql(
      `INSERT INTO website_visibility_pages
        (id, audit_id, user_id, url, status_code, profile_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [`${audit.auditId}:${crypto.randomUUID()}`, audit.auditId, ownerId, page.url, page.status, JSON.stringify(page), audit.observedAt],
    );
  }
  for (const item of audit.findings) {
    await (blink.db as any).sql(
      `INSERT INTO website_visibility_findings
        (id, audit_id, user_id, category, priority, page_url, title, evidence, impact, recommendation, effort, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'todo', ?, ?)`,
      [item.id, audit.auditId, ownerId, item.category, item.priority, item.pageUrl, item.title, item.evidence, item.impact, item.recommendation, item.effort, audit.observedAt, audit.observedAt],
    );
  }
}

router.post('/api/geo/website-audit', async c => {
  const blink = client(c.env as Env);
  const ownerId = await userId(c, blink);
  if (!ownerId) return c.json({ error: 'Non autorisé' }, 401);

  const body = await c.req.json().catch(() => null) as { url?: string; authorizationConfirmed?: boolean } | null;
  if (!body?.url || body.authorizationConfirmed !== true) return c.json({ error: 'URL et confirmation d’autorisation requises.' }, 400);
  try { validatePublicWebsiteUrl(body.url); } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'URL_INVALID' }, 400);
  }

  try {
    const recent = await (blink.db as any).sql(
      `SELECT COUNT(*) AS total FROM website_visibility_audits
       WHERE user_id = ? AND created_at >= datetime('now', '-1 hour')`, [ownerId],
    ).catch(() => null);
    if (recent && Number(recent[0]?.total ?? 0) >= 5) return c.json({ error: 'AUDIT_RATE_LIMITED', details: 'Limite de 5 audits par heure atteinte.' }, 429);

    const audit = await runWebsiteVisibilityAudit(body.url);
    let persisted = true;
    try { await persistAudit(blink, ownerId, audit); } catch (error) {
      persisted = false;
      console.error('[WebsiteVisibilityAudit] persistence unavailable', error);
    }
    return c.json({ ...audit, persisted });
  } catch (error) {
    console.error('[WebsiteVisibilityAudit]', error);
    return c.json({ error: 'WEBSITE_AUDIT_FAILED', details: error instanceof Error ? error.message : 'Audit impossible' }, 502);
  }
});

router.get('/api/geo/website-audits', async c => {
  const blink = client(c.env as Env);
  const ownerId = await userId(c, blink);
  if (!ownerId) return c.json({ error: 'Non autorisé' }, 401);
  try {
    const rows = await (blink.db as any).sql(
      `SELECT id, requested_url, canonical_origin, scores_json, limitations_json, page_count, finding_count, created_at
       FROM website_visibility_audits WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`, [ownerId],
    );
    return c.json({ audits: (rows ?? []).map((row: any) => ({ id: row.id, requestedUrl: row.requested_url, canonicalOrigin: row.canonical_origin, scores: JSON.parse(row.scores_json || '{}'), limitations: JSON.parse(row.limitations_json || '[]'), pageCount: row.page_count, findingCount: row.finding_count, createdAt: row.created_at })) });
  } catch {
    return c.json({ error: 'WEBSITE_AUDIT_HISTORY_UNAVAILABLE' }, 503);
  }
});

router.patch('/api/geo/website-audits/:auditId/findings/:findingId', async c => {
  const blink = client(c.env as Env);
  const ownerId = await userId(c, blink);
  if (!ownerId) return c.json({ error: 'Non autorisé' }, 401);
  const body = await c.req.json().catch(() => null) as { status?: string } | null;
  if (!body || !['todo', 'in_progress', 'validated', 'ignored'].includes(body.status ?? '')) return c.json({ error: 'Statut invalide' }, 400);
  const result = await (blink.db as any).sql(
    `UPDATE website_visibility_findings SET status = ?, updated_at = ?
     WHERE id = ? AND audit_id = ? AND user_id = ?`,
    [body.status, new Date().toISOString(), c.req.param('findingId'), c.req.param('auditId'), ownerId],
  ).catch(() => null);
  if (!result) return c.json({ error: 'WEBSITE_AUDIT_UPDATE_UNAVAILABLE' }, 503);
  return c.json({ ok: true, status: body.status });
});
