import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();
type Role = 'owner' | 'admin' | 'editor' | 'reviewer' | 'viewer';
type Row = Record<string, any>;
const canWrite = (r: Role) => ['owner', 'admin', 'editor'].includes(r);
const transitions: Record<string, string[]> = { draft: ['in_review', 'scheduled'], in_review: ['draft', 'approved', 'rejected'], rejected: ['draft', 'in_review'], approved: ['scheduled', 'published'], scheduled: ['published', 'draft'], published: [] };
const id = (p: string) => `${p}_${crypto.randomUUID()}`;
const jsonBody = (c: any) => c.req.json().catch(() => ({}));

async function context(c: any) {
  const projectId = c.env.BLINK_PROJECT_ID;
  const secretKey = c.env.BLINK_SECRET_KEY;
  if (!projectId || !secretKey) return { error: c.json({ error: 'Backend configuration unavailable' }, 500) };
  const blink = createClient({ projectId, secretKey });
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return { blink, error: c.json({ error: 'Unauthorized' }, 401) };
  return { blink, userId: auth.userId };
}
async function workspace(blink: any, workspaceId: string) {
  return (await blink.db.table<Row>('agency_workspaces').list({ where: { id: workspaceId }, limit: 1 }))[0];
}
async function scoped(c: any, workspaceId: string) {
  const x = await context(c); if (x.error) return x;
  if (!(await workspace(x.blink, workspaceId))) return { ...x, error: c.json({ error: 'Workspace not found' }, 404) };
  const m = (await x.blink.db.table<Row>('agency_workspace_members').list({ where: { workspaceId, userId: x.userId, status: 'active' }, limit: 1 }))[0];
  if (!m) return { ...x, error: c.json({ error: 'Workspace access denied' }, 403) };
  return { ...x, role: m.role as Role };
}
async function sameWorkspace(blink: any, table: string, value: string, workspaceId: string) {
  return (await blink.db.table<Row>(table).list({ where: { id: value, workspaceId }, limit: 1 }))[0];
}

router.post('/api/agency/workspaces', async c => {
  const x = await context(c); if (x.error) return x.error;
  const b = await jsonBody(c); if (typeof b.name !== 'string' || !b.name.trim()) return c.json({ error: 'name required' }, 400);
  const wid = id('ws');
  await x.blink.db.table<Row>('agency_workspaces').create({ id: wid, name: b.name.trim(), ownerId: x.userId });
  await x.blink.db.table<Row>('agency_workspace_members').create({ id: id('wm'), workspaceId: wid, userId: x.userId, role: 'owner', status: 'active' });
  return c.json({ id: wid, name: b.name.trim(), role: 'owner' }, 201);
});
router.get('/api/agency/workspaces', async c => {
  const x = await context(c); if (x.error) return x.error;
  const ms = await x.blink.db.table<Row>('agency_workspace_members').list({ where: { userId: x.userId, status: 'active' }, limit: 500 });
  const all = await x.blink.db.table<Row>('agency_workspaces').list({ limit: 500 });
  return c.json({ workspaces: all.filter((w: Row) => ms.some((m: Row) => m.workspaceId === w.id)).map((w: Row) => ({ ...w, role: ms.find((m: Row) => m.workspaceId === w.id)?.role })) });
});

const resources: Record<string, { table: string; required: string[]; fields: string[] }> = {
  assets: { table: 'agency_assets', required: ['name', 'fileUrl'], fields: ['name', 'fileUrl', 'fileType', 'fileSize', 'tags'] },
  'brand-kits': { table: 'agency_brand_kits_v2', required: ['name'], fields: ['name', 'logoUrl', 'primaryColor', 'secondaryColor', 'headingFont', 'bodyFont'] },
  content: { table: 'agency_content_items', required: ['title'], fields: ['title', 'contentType', 'assignedTo'] },
  versions: { table: 'agency_content_versions', required: ['contentItemId', 'body'], fields: ['contentItemId', 'versionNumber', 'body', 'metadata'] },
  approvals: { table: 'agency_approvals', required: ['contentItemId', 'versionId'], fields: ['contentItemId', 'versionId', 'status', 'feedback'] },
  comments: { table: 'agency_comments', required: ['contentItemId', 'body'], fields: ['contentItemId', 'versionId', 'body'] },
  calendar: { table: 'agency_calendar_events', required: ['title', 'startsAt'], fields: ['contentItemId', 'title', 'startsAt', 'endsAt', 'channel', 'status'] }
};
for (const [resource, spec] of Object.entries(resources)) {
  router.get(`/api/agency/workspaces/:workspaceId/${resource}`, async c => { const x = await scoped(c, c.req.param('workspaceId')); if (x.error) return x.error; const rows = await x.blink.db.table<Row>(spec.table).list({ where: { workspaceId: c.req.param('workspaceId') }, orderBy: { createdAt: 'desc' } }); return c.json({ [resource]: rows }); });
  router.post(`/api/agency/workspaces/:workspaceId/${resource}`, async c => {
    const x = await scoped(c, c.req.param('workspaceId')); if (x.error) return x.error; if (!canWrite(x.role)) return c.json({ error: 'Forbidden' }, 403);
    const b = await jsonBody(c); const missing = spec.required.find(k => b[k] === undefined || b[k] === null || (typeof b[k] === 'string' && !b[k].trim())); if (missing) return c.json({ error: `${missing} required` }, 400);
    const wid = c.req.param('workspaceId');
    if (resource === 'versions' || resource === 'approvals' || resource === 'comments') {
      if (!(await sameWorkspace(x.blink, 'agency_content_items', b.contentItemId, wid))) return c.json({ error: 'Content item not found in workspace' }, 400);
    }
    if (resource === 'versions' || resource === 'approvals' || resource === 'comments') {
      // Approvals must target a real version; comments may be attached to the item only.
      if (resource === 'approvals' && !(b.versionId && await sameWorkspace(x.blink, 'agency_content_versions', b.versionId, wid))) return c.json({ error: 'Version not found in workspace' }, 400);
      if (resource === 'comments' && b.versionId && !(await sameWorkspace(x.blink, 'agency_content_versions', b.versionId, wid))) return c.json({ error: 'Version not found in workspace' }, 400);
      if (b.versionId) {
        const version = await sameWorkspace(x.blink, 'agency_content_versions', b.versionId, wid);
        if (version.contentItemId !== b.contentItemId) return c.json({ error: 'Version does not belong to content item' }, 400);
      }
    }
    const actorField = resource === 'approvals' ? 'requestedBy' : resource === 'comments' ? 'authorId' : 'createdBy';
    const payload: Row = { id: id(resource), workspaceId: wid, [actorField]: x.userId };
    for (const field of spec.fields) if (b[field] !== undefined) payload[field] = b[field];
    if (resource === 'content') payload.status = 'draft';
    if (resource === 'versions' && payload.versionNumber === undefined) payload.versionNumber = 1;
    const row = await x.blink.db.table<Row>(spec.table).create(payload);
    if (resource === 'versions') {
      await x.blink.db.table<Row>('agency_content_items').update(b.contentItemId, { currentVersionId: row.id, updatedAt: new Date().toISOString() });
    }
    return c.json(row, 201);
  });
}

router.patch('/api/agency/workspaces/:workspaceId/content/:id/status', async c => { const x = await scoped(c, c.req.param('workspaceId')); if (x.error) return x.error; if (!canWrite(x.role)) return c.json({ error: 'Forbidden' }, 403); const b = await jsonBody(c); const t = x.blink.db.table<Row>('agency_content_items'); const row = (await t.list({ where: { id: c.req.param('id'), workspaceId: c.req.param('workspaceId') }, limit: 1 }))[0]; if (!row) return c.json({ error: 'Not found' }, 404); if (typeof b.status !== 'string' || !transitions[row.status]?.includes(b.status)) return c.json({ error: 'Invalid status transition', from: row.status, to: b.status }, 409); return c.json(await t.update(row.id, { status: b.status, updatedAt: new Date().toISOString() })); });
router.patch('/api/agency/workspaces/:workspaceId/approvals/:id', async c => { const x = await scoped(c, c.req.param('workspaceId')); if (x.error) return x.error; if (!['owner', 'admin', 'reviewer'].includes(x.role)) return c.json({ error: 'Forbidden' }, 403); const b = await jsonBody(c); if (!['approved', 'rejected', 'changes_requested'].includes(b.status)) return c.json({ error: 'Invalid approval status' }, 400); const wid = c.req.param('workspaceId'); const t = x.blink.db.table<Row>('agency_approvals'); const row = (await t.list({ where: { id: c.req.param('id'), workspaceId: wid }, limit: 1 }))[0]; if (!row) return c.json({ error: 'Not found' }, 404); const content = await sameWorkspace(x.blink, 'agency_content_items', row.contentItemId, wid); if (!content) return c.json({ error: 'Content item not found in workspace' }, 404); const updated = await t.update(row.id, { status: b.status, reviewedBy: x.userId, feedback: typeof b.feedback === 'string' ? b.feedback : '', reviewedAt: new Date().toISOString() }); const contentStatus = b.status === 'approved' ? 'approved' : b.status === 'changes_requested' ? 'draft' : 'rejected'; const contentTable = x.blink.db.table<Row>('agency_content_items'); if (transitions[content.status]?.includes(contentStatus)) await contentTable.update(content.id, { status: contentStatus, updatedAt: new Date().toISOString() }); return c.json(updated); });

async function count(table: any, where: Row) { if (typeof table.count === 'function') return table.count({ where }); let total = 0, offset = 0, page: Row[]; do { page = await table.list({ where, limit: 500, offset }); total += page.length; offset += page.length; } while (page.length === 500); return total; }
router.get('/api/agency/workspaces/:workspaceId/report/summary', async c => { const x = await scoped(c, c.req.param('workspaceId')); if (x.error) return x.error; const w = c.req.param('workspaceId'); const ts = ['agency_content_items', 'agency_assets', 'agency_approvals', 'agency_calendar_events']; const totals = await Promise.all(ts.map(t => count(x.blink.db.table<Row>(t), { workspaceId: w }))); const items = await x.blink.db.table<Row>('agency_content_items').list({ where: { workspaceId: w }, limit: 5000 }); const approvals = await x.blink.db.table<Row>('agency_approvals').list({ where: { workspaceId: w }, limit: 5000 }); const byStatus = items.reduce((a: Row, r: Row) => (a[r.status] = (a[r.status] || 0) + 1, a), {}); return c.json({ workspaceId: w, content: { total: totals[0], byStatus }, assets: totals[1], approvals: { total: totals[2], pending: approvals.filter((a: Row) => a.status === 'pending').length }, calendarEvents: totals[3] }); });