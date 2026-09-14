/**
 * campaigns.ts — Email campaign routes (Campagnes Email)
 *
 * Starter routes:
 *   GET    /api/campaigns/templates       — list available email templates
 *   GET    /api/campaigns/                — list user's campaigns
 *   GET    /api/campaigns/:id             — get single campaign + stats
 *   POST   /api/campaigns/                — create a new campaign (draft)
 *   POST   /api/campaigns/:id/contacts    — add contacts to campaign
 *   POST   /api/campaigns/:id/send        — send campaign
 *   POST   /api/campaigns/:id/import-csv  — import contacts from parsed CSV
 *   DELETE /api/campaigns/:id             — delete campaign (draft only)
 *
 * Agency-only routes:
 *   POST   /api/campaigns/:id/segment     — segment contacts by tags/fields
 *   POST   /api/campaigns/:id/schedule    — schedule campaign for later
 *   GET    /api/campaigns/:id/report      — detailed per-contact report
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import * as brevo from '../lib/brevoService';
import { checkSubscriptionLevel } from '../lib/checkSubscriptionLevel';

const router = new Hono();

// ── Helpers ──────────────────────────────────────────────────────────────────

function getBlink(env: Record<string, string>) {
  return createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
}

async function getAuth(c: any) {
  const blink = getBlink(c.env as Record<string, string>);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return null;
  return auth;
}

function uid() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── GET /api/campaigns/templates ─────────────────────────────────────────────
// List email templates available for campaign creation

router.get('/api/campaigns/templates', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Non autorisé' }, 401);

  const env = c.env as any;
  const apiKey = env.BREVO_API_KEY || (c.env as any).BREVO_API_KEY;
  if (!apiKey) return c.json({ error: 'Service email non configuré' }, 503);

  const result = await brevo.getTemplates(apiKey);
  if (!result.success) {
    return c.json({ error: result.error ?? 'Impossible de charger les modèles' }, 502);
  }

  // Strip any Brevo-specific branding from template names
  const templates = (result.data?.templates ?? []).map((t: any) => ({
    id: t.id,
    name: t.name.replace(/brevo|sendinblue/gi, 'Kompilot').trim(),
    subject: t.subject,
    isActive: t.isActive,
    htmlContent: t.htmlContent,
  }));

  return c.json({ templates });
});

// ── GET /api/campaigns/ ──────────────────────────────────────────────────────
// List the authenticated user's campaigns

router.get('/api/campaigns/', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Non autorisé' }, 401);

  const blink = getBlink(c.env as Record<string, string>);
  const userId = auth.userId;

  try {
    const campaigns = await (blink as any).db.table('campaigns').list({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      limit: 50,
    });

    return c.json({ campaigns });
  } catch (err: any) {
    console.error('[Campaigns] list error:', err.message);
    return c.json({ error: 'Erreur lors du chargement des campagnes' }, 500);
  }
});

// ── GET /api/campaigns/:id ───────────────────────────────────────────────────
// Get a single campaign with contact count and event stats

router.get('/api/campaigns/:id', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Non autorisé' }, 401);

  const blink = getBlink(c.env as Record<string, string>);
  const campaignId = c.req.param('id');
  const userId = auth.userId;

  try {
    const campaign = await (blink as any).db.table('campaigns').get(campaignId);
    if (!campaign || campaign.userId !== userId) {
      return c.json({ error: 'Campagne introuvable' }, 404);
    }

    // Count contacts
    const contacts = await (blink as any).db.table('campaign_contacts').list({
      where: { campaignId, userId },
      limit: 1,
    });
    const contactCount = await (blink as any).db.table('campaign_contacts').count({
      where: { campaignId, userId },
    });

    // Count events by type
    const events = await (blink as any).db.table('campaign_events').list({
      where: { campaignId },
      limit: 500,
    });

    const eventsByType: Record<string, number> = {};
    for (const ev of events) {
      eventsByType[ev.eventType] = (eventsByType[ev.eventType] ?? 0) + 1;
    }

    return c.json({
      campaign,
      contactCount: contactCount ?? contacts.length,
      eventsByType,
    });
  } catch (err: any) {
    console.error('[Campaigns] get error:', err.message);
    return c.json({ error: 'Erreur lors du chargement de la campagne' }, 500);
  }
});

// ── PATCH /api/campaigns/:id ──────────────────────────────────────────────────
// Persist the campaign wizard fields before the send confirmation step.
router.patch('/api/campaigns/:id', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Non autorisé' }, 401);

  const blink = getBlink(c.env as Record<string, string>);
  const campaignId = c.req.param('id');
  const userId = auth.userId;

  try {
    const campaignTable = (blink as any).db.table('campaigns');
    const campaign = await campaignTable.get(campaignId);
    if (!campaign || campaign.userId !== userId) return c.json({ error: 'Campagne introuvable' }, 404);
    if (campaign.status !== 'draft') return c.json({ error: 'Cette campagne ne peut plus être modifiée' }, 400);

    const body = await c.req.json();
    const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const field of ['name', 'subject', 'fromName', 'fromEmail', 'templateId', 'templateName', 'htmlContent']) {
      if (typeof body[field] === 'string') patch[field] = body[field];
    }
    if (body.establishmentId !== undefined) patch.establishmentId = body.establishmentId || '';
    if (!Object.keys(patch).some(key => key !== 'updatedAt')) return c.json({ error: 'Aucun champ valide à modifier' }, 400);

    return c.json({ campaign: await campaignTable.update(campaignId, patch) });
  } catch (err: any) {
    console.error('[Campaigns] update error:', err.message);
    return c.json({ error: 'Erreur lors de la mise à jour de la campagne' }, 500);
  }
});

// ── GET /api/campaigns/:id/contacts ──────────────────────────────────────────
// Return the real active recipients used by the send confirmation UI.
router.get('/api/campaigns/:id/contacts', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Non autorisé' }, 401);

  const blink = getBlink(c.env as Record<string, string>);
  const campaignId = c.req.param('id');
  const userId = auth.userId;

  try {
    const campaign = await (blink as any).db.table('campaigns').get(campaignId);
    if (!campaign || campaign.userId !== userId) return c.json({ error: 'Campagne introuvable' }, 404);

    const contacts = await (blink as any).db.table('campaign_contacts').list({
      where: { campaignId, userId, status: 'active' },
      orderBy: { createdAt: 'asc' },
      limit: 5000,
    });
    return c.json({ contacts });
  } catch (err: any) {
    console.error('[Campaigns] contacts list error:', err.message);
    return c.json({ error: 'Erreur lors du chargement des contacts' }, 500);
  }
});

// ── POST /api/campaigns/ ─────────────────────────────────────────────────────
// Create a new campaign (draft status)

router.post('/api/campaigns/', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Non autorisé' }, 401);

  const blink = getBlink(c.env as Record<string, string>);
  const userId = auth.userId;

  try {
    const body = await c.req.json();
    const {
      name,
      subject,
      htmlContent,
      fromName,
      fromEmail,
      templateId,
      templateName,
      establishmentId,
      planType,
    } = body;

    if (!name) {
      return c.json({ error: 'Le nom de la campagne est requis' }, 400);
    }

    const id = uid();
    const now = new Date().toISOString();

    await (blink as any).db.table('campaigns').create({
      id,
      userId,
      establishmentId: establishmentId ?? '',
      name,
      subject: subject ?? '',
      fromName: fromName ?? 'Kompilot',
      fromEmail: fromEmail ?? '',
      templateId: templateId ?? '',
      templateName: templateName ?? '',
      htmlContent: htmlContent ?? '',
      status: 'draft',
      planType: planType ?? 'starter',
      recipientCount: 0,
      sentCount: 0,
      openCount: 0,
      clickCount: 0,
      bounceCount: 0,
      unsubscribeCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return c.json({ success: true, campaignId: id });
  } catch (err: any) {
    console.error('[Campaigns] create error:', err.message);
    return c.json({ error: 'Erreur lors de la création de la campagne' }, 500);
  }
});

// ── POST /api/campaigns/:id/contacts ─────────────────────────────────────────
// Add contacts to a campaign

router.post('/api/campaigns/:id/contacts', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Non autorisé' }, 401);

  const blink = getBlink(c.env as Record<string, string>);
  const campaignId = c.req.param('id');
  const userId = auth.userId;

  try {
    const campaign = await (blink as any).db.table('campaigns').get(campaignId);
    if (!campaign || campaign.userId !== userId) {
      return c.json({ error: 'Campagne introuvable' }, 404);
    }
    if (campaign.status !== 'draft') {
      return c.json({ error: 'Impossible de modifier les contacts d\'une campagne déjà envoyée' }, 400);
    }

    const { contacts } = await c.req.json();
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return c.json({ error: 'Aucun contact fourni' }, 400);
    }

    // Validate and deduplicate
    const seen = new Set<string>();
    let added = 0;
    let skipped = 0;
    let invalid = 0;

    // Fetch existing contacts for dedup
    const existing = await (blink as any).db.table('campaign_contacts').list({
      where: { campaignId, userId },
      select: ['email'],
      limit: 10000,
    });
    const existingEmails = new Set(existing.map((c: any) => c.email.toLowerCase()));

    for (const contact of contacts) {
      const email = (contact.email ?? '').trim().toLowerCase();
      if (!email || !isValidEmail(email)) { invalid++; continue; }
      if (seen.has(email) || existingEmails.has(email)) { skipped++; continue; }
      seen.add(email);

      await (blink as any).db.table('campaign_contacts').create({
        id: uid(),
        campaignId,
        userId,
        email,
        firstName: contact.firstName ?? '',
        lastName: contact.lastName ?? '',
        phone: contact.phone ?? '',
        company: contact.company ?? '',
        tags: JSON.stringify(contact.tags ?? []),
        customFields: JSON.stringify(contact.customFields ?? {}),
        status: 'active',
        source: 'manual',
      });
      added++;
    }

    // Update recipient count
    const totalCount = await (blink as any).db.table('campaign_contacts').count({
      where: { campaignId, userId },
    });
    await (blink as any).db.table('campaigns').update(campaignId, {
      recipientCount: totalCount ?? (existing.length + added),
      updatedAt: new Date().toISOString(),
    });

    return c.json({ success: true, added, duplicates: skipped, invalid });
  } catch (err: any) {
    console.error('[Campaigns] add contacts error:', err.message);
    return c.json({ error: 'Erreur lors de l\'ajout des contacts' }, 500);
  }
});

// ── POST /api/campaigns/:id/import-csv ───────────────────────────────────────
// Import contacts from a parsed CSV (already JSON on the frontend)

router.post('/api/campaigns/:id/import-csv', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Non autorisé' }, 401);

  const blink = getBlink(c.env as Record<string, string>);
  const campaignId = c.req.param('id');
  const userId = auth.userId;

  try {
    const campaign = await (blink as any).db.table('campaigns').get(campaignId);
    if (!campaign || campaign.userId !== userId) {
      return c.json({ error: 'Campagne introuvable' }, 404);
    }
    if (campaign.status !== 'draft') {
      return c.json({ error: 'Impossible de modifier les contacts d\'une campagne déjà envoyée' }, 400);
    }

    const { contacts } = await c.req.json();
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return c.json({ error: 'Aucun contact fourni' }, 400);
    }

    // Fetch existing contacts for dedup
    const existing = await (blink as any).db.table('campaign_contacts').list({
      where: { campaignId, userId },
      select: ['email'],
      limit: 10000,
    });
    const existingEmails = new Set(existing.map((c: any) => c.email.toLowerCase()));

    const seen = new Set<string>();
    let imported = 0;
    let duplicates = 0;
    let invalid = 0;

    for (const row of contacts) {
      const email = (row.email ?? '').trim().toLowerCase();
      if (!email || !isValidEmail(email)) { invalid++; continue; }
      if (seen.has(email) || existingEmails.has(email)) { duplicates++; continue; }
      seen.add(email);

      await (blink as any).db.table('campaign_contacts').create({
        id: uid(),
        campaignId,
        userId,
        email,
        firstName: row.firstName ?? row.first_name ?? '',
        lastName: row.lastName ?? row.last_name ?? '',
        phone: row.phone ?? '',
        company: row.company ?? '',
        tags: JSON.stringify([]),
        customFields: JSON.stringify({}),
        status: 'active',
        source: 'csv_import',
      });
      imported++;
    }

    // Update recipient count
    const totalCount = await (blink as any).db.table('campaign_contacts').count({
      where: { campaignId, userId },
    });
    await (blink as any).db.table('campaigns').update(campaignId, {
      recipientCount: totalCount ?? (existing.length + imported),
      updatedAt: new Date().toISOString(),
    });

    return c.json({ success: true, imported, duplicates, invalid });
  } catch (err: any) {
    console.error('[Campaigns] import-csv error:', err.message);
    return c.json({ error: 'Erreur lors de l\'import des contacts' }, 500);
  }
});

// ── POST /api/campaigns/:id/send ─────────────────────────────────────────────
// Send the campaign: uses Brevo transactional SMTP per-contact for small lists,
// or creates a Brevo campaign for larger lists.

router.post('/api/campaigns/:id/send', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Non autorisé' }, 401);

  const blink = getBlink(c.env as Record<string, string>);
  const env = c.env as any;
  const apiKey = env.BREVO_API_KEY || (c.env as any).BREVO_API_KEY;
  if (!apiKey) return c.json({ error: 'Service email non configuré' }, 503);

  const campaignId = c.req.param('id');
  const userId = auth.userId;

  try {
    const campaign = await (blink as any).db.table('campaigns').get(campaignId);
    if (!campaign || campaign.userId !== userId) {
      return c.json({ error: 'Campagne introuvable' }, 404);
    }
    if (!['draft', 'scheduled'].includes(campaign.status)) {
      return c.json({ error: 'Cette campagne a déjà été envoyée' }, 400);
    }

    const contacts = await (blink as any).db.table('campaign_contacts').list({
      where: { campaignId, userId, status: 'active' },
      limit: 5000,
    });

    if (contacts.length === 0) {
      return c.json({ error: 'Aucun contact dans cette campagne' }, 400);
    }

    const subject = campaign.subject || campaign.name;
    const htmlContent = campaign.htmlContent || '<p>(Contenu vide)</p>';
    const fromName = campaign.fromName || 'Kompilot';
    const fromEmail = campaign.fromEmail || 'noreply@kompilot.fr';

    // For small lists (< 50), send individually via transactional API
    // for better tracking and error handling
    let sentCount = 0;
    let failCount = 0;

    // Batch send in groups of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE);
      const sendResult = await brevo.sendEmail(apiKey, {
        to: batch.map((ct: any) => ({
          email: ct.email,
          name: ct.firstName ? `${ct.firstName} ${ct.lastName ?? ''}`.trim() : ct.email,
        })),
        subject,
        htmlContent,
        fromName,
        fromEmail,
        tags: [`campaign_${campaignId}`],
      });

      if (sendResult.success) {
        sentCount += batch.length;
        // Record delivered events for each contact
        for (const ct of batch) {
          await (blink as any).db.table('campaign_events').create({
            id: uid(),
            campaignId,
            contactEmail: ct.email,
            eventType: 'delivered',
            eventData: JSON.stringify({ batchIndex: i / BATCH_SIZE }),
          }).catch(() => { /* non-critical */ });
        }
      } else {
        failCount += batch.length;
        console.error('[Campaigns] send batch error:', sendResult.error);
      }
    }

    // Update campaign status
    await (blink as any).db.table('campaigns').update(campaignId, {
      status: sentCount > 0 ? 'sent' : 'failed',
      sentCount,
      sentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return c.json({
      success: sentCount > 0,
      sent: sentCount,
      failed: failCount,
      total: contacts.length,
    });
  } catch (err: any) {
    console.error('[Campaigns] send error:', err.message);
    return c.json({ error: 'Erreur lors de l\'envoi de la campagne' }, 500);
  }
});

// ── DELETE /api/campaigns/:id ────────────────────────────────────────────────
// Delete a campaign (only if draft)

router.delete('/api/campaigns/:id', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Non autorisé' }, 401);

  const blink = getBlink(c.env as Record<string, string>);
  const campaignId = c.req.param('id');
  const userId = auth.userId;

  try {
    const campaign = await (blink as any).db.table('campaigns').get(campaignId);
    if (!campaign || campaign.userId !== userId) {
      return c.json({ error: 'Campagne introuvable' }, 404);
    }
    if (campaign.status !== 'draft') {
      return c.json({ error: 'Seules les campagnes en brouillon peuvent être supprimées' }, 400);
    }

    // Delete associated contacts and events
    const contacts = await (blink as any).db.table('campaign_contacts').list({
      where: { campaignId, userId },
      limit: 10000,
      select: ['id'],
    });
    for (const ct of contacts) {
      await (blink as any).db.table('campaign_contacts').delete(ct.id).catch(() => {});
    }

    const events = await (blink as any).db.table('campaign_events').list({
      where: { campaignId },
      limit: 10000,
      select: ['id'],
    });
    for (const ev of events) {
      await (blink as any).db.table('campaign_events').delete(ev.id).catch(() => {});
    }

    await (blink as any).db.table('campaigns').delete(campaignId);

    return c.json({ success: true });
  } catch (err: any) {
    console.error('[Campaigns] delete error:', err.message);
    return c.json({ error: 'Erreur lors de la suppression' }, 500);
  }
});

// ── POST /api/campaigns/:id/segment — Agency+ ───────────────────────────────
// Segment contacts by tags or custom fields

router.post(
  '/api/campaigns/:id/segment',
  checkSubscriptionLevel('agency'),
  async (c) => {
    const blink = getBlink(c.env as Record<string, string>);
    const campaignId = c.req.param('id');
    const userId = c.get('userId') as string;

    try {
      const campaign = await (blink as any).db.table('campaigns').get(campaignId);
      if (!campaign || campaign.userId !== userId) {
        return c.json({ error: 'Campagne introuvable' }, 404);
      }

      const { tags, customField, customValue, status: contactStatus } = await c.req.json();

      // Build filter
      const where: any = { campaignId, userId };
      if (contactStatus) where.status = contactStatus;

      let contacts = await (blink as any).db.table('campaign_contacts').list({
        where,
        limit: 10000,
      });

      // Filter by tags
      if (tags && Array.isArray(tags) && tags.length > 0) {
        contacts = contacts.filter((ct: any) => {
          const ctTags: string[] = JSON.parse(ct.tags ?? '[]');
          return tags.some((t: string) => ctTags.includes(t));
        });
      }

      // Filter by custom field
      if (customField && customValue !== undefined) {
        contacts = contacts.filter((ct: any) => {
          const fields = JSON.parse(ct.customFields ?? '{}');
          return String(fields[customField]) === String(customValue);
        });
      }

      return c.json({
        success: true,
        total: contacts.length,
        contacts: contacts.map((ct: any) => ({
          id: ct.id,
          email: ct.email,
          firstName: ct.firstName,
          lastName: ct.lastName,
          tags: JSON.parse(ct.tags ?? '[]'),
          customFields: JSON.parse(ct.customFields ?? '{}'),
          status: ct.status,
        })),
      });
    } catch (err: any) {
      console.error('[Campaigns] segment error:', err.message);
      return c.json({ error: 'Erreur lors de la segmentation' }, 500);
    }
  },
);

// ── POST /api/campaigns/:id/schedule — Agency+ ──────────────────────────────
// Schedule a campaign for later delivery

router.post(
  '/api/campaigns/:id/schedule',
  checkSubscriptionLevel('agency'),
  async (c) => {
    const blink = getBlink(c.env as Record<string, string>);
    const env = c.env as any;
    const apiKey = env.BREVO_API_KEY || (c.env as any).BREVO_API_KEY;
    const campaignId = c.req.param('id');
    const userId = c.get('userId') as string;

    try {
      const campaign = await (blink as any).db.table('campaigns').get(campaignId);
      if (!campaign || campaign.userId !== userId) {
        return c.json({ error: 'Campagne introuvable' }, 404);
      }
      if (campaign.status !== 'draft') {
        return c.json({ error: 'Seules les campagnes en brouillon peuvent être programmées' }, 400);
      }

      const { scheduledAt } = await c.req.json();
      if (!scheduledAt) {
        return c.json({ error: 'La date de programmation est requise' }, 400);
      }

      const scheduledDate = new Date(scheduledAt);
      if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
        return c.json({ error: 'La date de programmation doit être dans le futur' }, 400);
      }

      // Update local DB
      await (blink as any).db.table('campaigns').update(campaignId, {
        status: 'scheduled',
        scheduledAt: scheduledDate.toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Optionally create campaign in Brevo if API key is available
      if (apiKey && campaign.htmlContent) {
        const contacts = await (blink as any).db.table('campaign_contacts').list({
          where: { campaignId, userId, status: 'active' },
          limit: 1,
        });
        const contactCount = await (blink as any).db.table('campaign_contacts').count({
          where: { campaignId, userId, status: 'active' },
        });

        // Try to create a Brevo campaign for scheduling (requires list IDs)
        // For now, we just store the schedule locally — Brevo scheduling
        // will be triggered when the campaign has a linked Brevo list.
      }

      return c.json({
        success: true,
        scheduledAt: scheduledDate.toISOString(),
        message: `Campagne programmée pour le ${scheduledDate.toLocaleDateString('fr-FR', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
        })}`,
      });
    } catch (err: any) {
      console.error('[Campaigns] schedule error:', err.message);
      return c.json({ error: 'Erreur lors de la programmation' }, 500);
    }
  },
);

// ── GET /api/campaigns/:id/report — Agency+ ─────────────────────────────────
// Detailed report with per-contact event breakdown

router.get(
  '/api/campaigns/:id/report',
  checkSubscriptionLevel('agency'),
  async (c) => {
    const blink = getBlink(c.env as Record<string, string>);
    const env = c.env as any;
    const apiKey = env.BREVO_API_KEY || (c.env as any).BREVO_API_KEY;
    const campaignId = c.req.param('id');
    const userId = c.get('userId') as string;

    try {
      const campaign = await (blink as any).db.table('campaigns').get(campaignId);
      if (!campaign || campaign.userId !== userId) {
        return c.json({ error: 'Campagne introuvable' }, 404);
      }

      // Get all contacts for this campaign
      const contacts = await (blink as any).db.table('campaign_contacts').list({
        where: { campaignId, userId },
        limit: 10000,
      });

      // Get all events for this campaign
      const events = await (blink as any).db.table('campaign_events').list({
        where: { campaignId },
        limit: 50000,
      });

      // Build per-contact event map
      const contactMap: Record<string, any> = {};
      for (const ct of contacts) {
        contactMap[ct.email.toLowerCase()] = {
          email: ct.email,
          firstName: ct.firstName,
          lastName: ct.lastName,
          company: ct.company,
          events: [],
        };
      }

      const eventCounts: Record<string, number> = {};
      for (const ev of events) {
        const key = ev.contactEmail?.toLowerCase();
        if (key && contactMap[key]) {
          contactMap[key].events.push({
            type: ev.eventType,
            data: ev.eventData ? JSON.parse(ev.eventData) : {},
            createdAt: ev.createdAt,
          });
        }
        eventCounts[ev.eventType] = (eventCounts[ev.eventType] ?? 0) + 1;
      }

      // Try to get live stats from Brevo as well
      let brevoStats = null;
      if (apiKey && campaign.brevoCampaignId) {
        const statsResult = await brevo.getCampaignStats(apiKey, campaign.brevoCampaignId);
        if (statsResult.success) {
          brevoStats = statsResult.data;
        }
      }

      return c.json({
        campaign: {
          id: campaign.id,
          name: campaign.name,
          subject: campaign.subject,
          status: campaign.status,
          sentCount: campaign.sentCount,
          openCount: campaign.openCount,
          clickCount: campaign.clickCount,
          bounceCount: campaign.bounceCount,
          unsubscribeCount: campaign.unsubscribeCount,
          sentAt: campaign.sentAt,
          createdAt: campaign.createdAt,
        },
        summary: eventCounts,
        brevoStats,
        contacts: Object.values(contactMap),
      });
    } catch (err: any) {
      console.error('[Campaigns] report error:', err.message);
      return c.json({ error: 'Erreur lors du chargement du rapport' }, 500);
    }
  },
);

export { router };
