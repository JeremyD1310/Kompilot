/**
 * agencyInvites.ts — Agency client invitation management
 *
 * POST   /api/agency/invite-client        — invite a new client (sends email)
 * GET    /api/agency/invites              — list pending/accepted invites
 * DELETE /api/agency/invites/:id          — cancel a pending invite
 */
import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

type AgencyInvite = {
  id: string; agencyUserId: string; clientEmail: string; clientName: string; token: string;
  status: string; expiresAt?: string; subAccountId?: string; createdAt: string;
};
type AgencySubAccount = {
  id: string; agencyUserId: string; clientUserId: string; clientName: string; planId: string;
  isActive: number; inviteId?: string; status?: string;
};

function getBlink(env: Env) {
  return createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
}

async function verify(c: any) {
  const blink = getBlink(c.env as Env);
  return { blink, auth: await blink.auth.verifyToken(c.req.header('Authorization')) };
}

router.post('/api/agency/invite-client', async (c) => {
  const { blink, auth } = await verify(c);
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const { clientName, clientEmail, planId } = await c.req.json();
    if (!clientName?.trim() || !clientEmail?.trim()) return c.json({ error: 'clientName and clientEmail are required' }, 400);
    const token = crypto.randomUUID();
    const inviteId = `inv_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
    const subAccountId = `sub_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    const invites = blink.db.table<AgencyInvite>('agency_invites');
    const subAccounts = blink.db.table<AgencySubAccount>('agency_sub_accounts');
    await subAccounts.create({ id: subAccountId, agencyUserId: auth.userId, clientUserId: '', clientName: clientName.trim(), planId: planId || 'starter', isActive: 0, inviteId, status: 'pending_invitation' });
    await invites.create({ id: inviteId, agencyUserId: auth.userId, clientEmail: clientEmail.trim().toLowerCase(), clientName: clientName.trim(), token, status: 'pending', expiresAt, subAccountId });
    try {
      const inviteUrl = `https://kompilot.fr/agency-invite/${token}`;
      await blink.notifications.send({ to: clientEmail.trim().toLowerCase(), subject: `${clientName.trim()} — Invitation à rejoindre Kompilot`, html: `<div style="font-family:sans-serif;max-width:560px;margin:auto"><h2 style="color:#0D9488">Vous êtes invité(e) sur Kompilot</h2><p>Votre agence vous invite à rejoindre l'espace client <strong>${clientName.trim()}</strong>.</p><p style="margin:24px 0"><a href="${inviteUrl}" style="background:#0D9488;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Accepter l'invitation</a></p><p style="color:#64748B;font-size:13px">Ce lien est valide 7 jours.</p></div>` });
    } catch (emailError) { console.warn('[AgencyInvite] Email delivery failed', emailError); }
    return c.json({ id: inviteId, clientName: clientName.trim(), clientEmail: clientEmail.trim().toLowerCase(), clientUserId: null, status: 'pending', expiresAt }, 201);
  } catch (error: any) { return c.json({ error: error.message }, 500); }
});

router.get('/api/agency/invites', async (c) => {
  const { blink, auth } = await verify(c);
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const rows = await blink.db.table<AgencyInvite>('agency_invites').list({ where: { agencyUserId: auth.userId }, orderBy: { createdAt: 'desc' } });
    return c.json({ invites: rows.map(row => ({ id: row.id, clientName: row.clientName, clientEmail: row.clientEmail, status: row.status, expiresAt: row.expiresAt, createdAt: row.createdAt })) });
  } catch (error: any) { return c.json({ error: error.message }, 500); }
});

router.get('/api/agency/invites/:token', async (c) => {
  try {
    const { blink } = await verify(c);
    const rows = await blink.db.table<AgencyInvite>('agency_invites').list({ where: { token: c.req.param('token') }, limit: 1 });
    const invite = rows[0];
    if (!invite || invite.status !== 'pending' || !invite.expiresAt || new Date(invite.expiresAt) < new Date()) return c.json({ error: 'Invitation invalide ou expirée' }, 404);
    const agencyRows = await blink.db.table<any>('agency_brand_settings').list({ where: { userId: invite.agencyUserId }, limit: 1 });
    return c.json({ invite: { clientName: invite.clientName, clientEmail: invite.clientEmail, agencyName: agencyRows[0]?.agencyName || 'votre agence', expiresAt: invite.expiresAt } });
  } catch (error: any) { return c.json({ error: error.message }, 500); }
});

router.post('/api/agency/invites/:token/accept', async (c) => {
  const { blink, auth } = await verify(c);
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const invites = blink.db.table<AgencyInvite>('agency_invites');
    const subAccounts = blink.db.table<AgencySubAccount>('agency_sub_accounts');
    const rows = await invites.list({ where: { token: c.req.param('token') }, limit: 1 });
    const invite = rows[0];
    if (!invite || invite.status !== 'pending' || !invite.expiresAt || new Date(invite.expiresAt) < new Date()) return c.json({ error: 'Invitation invalide ou expirée' }, 400);
    if ((auth.email || '').toLowerCase() !== invite.clientEmail.toLowerCase()) return c.json({ error: 'Connectez-vous avec l’adresse e-mail invitée' }, 403);
    await invites.update(invite.id, { status: 'accepted' });
    if (invite.subAccountId) await subAccounts.update(invite.subAccountId, { clientUserId: auth.userId, isActive: 1, status: 'active' });
    return c.json({ success: true, agencyUserId: invite.agencyUserId, clientUserId: auth.userId });
  } catch (error: any) { return c.json({ error: error.message }, 500); }
});

router.delete('/api/agency/invites/:id', async (c) => {
  const { blink, auth } = await verify(c);
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const invites = blink.db.table<AgencyInvite>('agency_invites');
    const rows = await invites.list({ where: { id: c.req.param('id'), agencyUserId: auth.userId }, limit: 1 });
    if (!rows[0]) return c.json({ error: 'Invite not found' }, 404);
    await invites.update(rows[0].id, { status: 'cancelled' });
    return c.json({ success: true });
  } catch (error: any) { return c.json({ error: error.message }, 500); }
});