import { Hono } from 'hono';
import { getBlink } from '../lib/stripeHelpers';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] ?? char));
}

router.post('/api/audit/capture', async (c) => {
  const body = await c.req.json<{
    businessName?: string;
    email?: string;
    phone?: string;
    city?: string;
    address?: string;
    score?: number;
    consent?: boolean;
    attribution?: { utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string };
  }>().catch(() => null);
  if (!body?.businessName || !body.email || body.consent !== true) return c.json({ error: 'businessName, email and consent are required' }, 400);

  const env = c.env as Env;
  const blink = getBlink(env);
  const attribution = body.attribution ?? {};
  const source = attribution.utmSource || 'audit';
  const id = `audit_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const createdAt = new Date().toISOString();

  try {
    await blink.db.table<Record<string, unknown>>('leads').create({
      id,
      businessName: body.businessName.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || '',
      city: body.city?.trim() || '',
      address: body.address?.trim() || '',
      visibilityScore: Number(body.score) || 0,
      scanData: JSON.stringify({ score: Number(body.score) || 0, attribution, consentAt: createdAt }),
      status: 'Lead_Audit',
      createdAt,
    });
    await blink.db.table<Record<string, unknown>>('conversion_events').create({
      id: `conv_${crypto.randomUUID()}`,
      userId: 'anonymous',
      eventType: 'Lead',
      funnelStep: 'audit_capture',
      source,
      medium: attribution.utmMedium || '',
      campaign: attribution.utmCampaign || '',
      metadata: JSON.stringify({ leadId: id, businessName: body.businessName, score: Number(body.score) || 0, utmContent: attribution.utmContent || '', consentAt: createdAt }),
      createdAt,
    });
  } catch (error) {
    console.error('[auditCapture] persistence failed', error);
    return c.json({ error: 'Unable to save audit lead' }, 500);
  }

  let emailSent = false;
  try {
    const name = escapeHtml(body.businessName.trim());
    const signupUrl = `https://kompilot.fr/signup?ref=audit&email=${encodeURIComponent(body.email.trim())}`;
    await blink.notifications.email({
      to: body.email.trim(),
      subject: `Votre audit Kompilot — score ${Number(body.score) || 0}/100`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2 style="color:#0D9488">Votre audit de visibilité Kompilot</h2><p>Bonjour,</p><p>Le diagnostic de <strong>${name}</strong> est prêt : <strong>${Number(body.score) || 0}/100</strong>.</p><p>Votre rapport complet et vos recommandations sont disponibles dans votre espace de travail.</p><p><a href="${signupUrl}" style="display:inline-block;background:#0D9488;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Créer mon compte gratuit</a></p><p style="font-size:12px;color:#64748b">Vous avez demandé cet audit et accepté d’être recontacté par Kompilot.</p></div>`,
    });
    emailSent = true;
  } catch (error) {
    console.warn('[auditCapture] email delivery failed', error);
  }

  return c.json({ success: true, leadId: id, emailSent });
});
