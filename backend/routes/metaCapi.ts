/**
 * Meta CAPI (Pixel de conversion) — Routes
 *
 * Endpoints (all require authentication):
 *   GET    /api/meta-capi/config   — get user's CAPI config (no raw token)
 *   POST   /api/meta-capi/config   — create/update CAPI config (agency+)
 *   DELETE /api/meta-capi/config   — deactivate CAPI config
 *   POST   /api/meta-capi/test     — send test event to Meta
 *   GET    /api/meta-capi/events   — list recent conversion events (last 50)
 *   POST   /api/meta-capi/trigger  — manually trigger a conversion for a lead
 *
 * IMPORTANT: Never mention "Meta" or "Facebook" in user-facing messages.
 * Use "Pixel de conversion" / "Tracking publicitaire" instead.
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';
import { checkSubscriptionLevel } from '../lib/checkSubscriptionLevel';
import {
  sendConversionEvent,
  prepareLeadEvent,
  encryptToken,
  decryptToken,
  type CapiConfigRow,
  type CapiEventRow,
} from '../lib/metaCapiService';

export const router = new Hono<{ Bindings: Env }>();

const getBlink = (env: Env) =>
  createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });

// ── Auth helper ──────────────────────────────────────────────────────────────

async function verifyAuth(c: any): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return { valid: false, error: 'Non autorisé' };
  const env = c.env as Env;
  const blink = getBlink(env);
  const auth = await blink.auth.verifyToken(authHeader);
  if (!auth.valid) return { valid: false, error: 'Non autorisé' };
  return { valid: true, userId: auth.userId };
}

// ── GET /api/meta-capi/config ────────────────────────────────────────────────
// Returns user's CAPI config. Never exposes the raw access token.

router.get('/api/meta-capi/config', async (c) => {
  const auth = await verifyAuth(c);
  if (!auth.valid) return c.json({ error: auth.error }, 401);

  const env = c.env as Env;
  const blink = getBlink(env);

  try {
    const configs = await (blink as any).db.table<CapiConfigRow>('meta_capi_configs').list({
      where: { user_id: auth.userId },
      limit: 1,
    });

    if (!configs || configs.length === 0) {
      return c.json({ configured: false });
    }

    const config = configs[0];
    return c.json({
      configured: true,
      id: config.id,
      pixelId: config.pixel_id,
      isActive: Number(config.is_active) > 0,
      testEventCode: config.test_event_code || '',
      eventsSent: config.events_sent || 0,
      eventsFailed: config.events_failed || 0,
      lastEventAt: config.last_event_at,
      lastError: config.last_error || '',
      createdAt: config.created_at,
      updatedAt: config.updated_at,
    });
  } catch (err: any) {
    console.error('[MetaCAPI:GET/config]', err.message);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ── POST /api/meta-capi/config ───────────────────────────────────────────────
// Create or update CAPI config. Agency+ only. Encrypts access token.

router.post(
  '/api/meta-capi/config',
  checkSubscriptionLevel('agency'),
  async (c) => {
    const auth = await verifyAuth(c);
    if (!auth.valid) return c.json({ error: auth.error }, 401);

    const env = c.env as Env;
    const blink = getBlink(env);

    let body: { pixelId?: string; accessToken?: string; testEventCode?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'JSON invalide' }, 400);
    }

    if (!body.pixelId || !body.accessToken) {
      return c.json({ error: 'pixelId et accessToken sont requis' }, 400);
    }

    // Validate pixel ID format (digits only)
    if (!/^\d{10,20}$/.test(body.pixelId.trim())) {
      return c.json({ error: 'ID pixel invalide' }, 400);
    }

    try {
      // Encrypt the access token before storage
      const encryptionKey = (c.env as any).TOKEN_ENCRYPTION_KEY || '';
      const encrypted = await encryptToken(body.accessToken.trim(), encryptionKey);

      // Check for existing config
      const existing = await (blink as any).db.table<CapiConfigRow>('meta_capi_configs').list({
        where: { user_id: auth.userId },
        limit: 1,
      });

      const now = new Date().toISOString();

      if (existing && existing.length > 0) {
        // Update existing config
        await (blink as any).db.table<CapiConfigRow>('meta_capi_configs').update(existing[0].id, {
          pixel_id: body.pixelId.trim(),
          access_token_encrypted: encrypted,
          test_event_code: body.testEventCode || '',
          is_active: 1,
          last_error: '',
          updated_at: now,
        });
        return c.json({ success: true, id: existing[0].id, action: 'updated' });
      } else {
        // Create new config
        const configId = `capicfg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await (blink as any).db.table<CapiConfigRow>('meta_capi_configs').create({
          id: configId,
          user_id: auth.userId,
          pixel_id: body.pixelId.trim(),
          access_token_encrypted: encrypted,
          test_event_code: body.testEventCode || '',
          is_active: 1,
          events_sent: 0,
          events_failed: 0,
          last_error: '',
          created_at: now,
          updated_at: now,
        });
        return c.json({ success: true, id: configId, action: 'created' });
      }
    } catch (err: any) {
      console.error('[MetaCAPI:POST/config]', err.message);
      return c.json({ error: 'Erreur lors de la sauvegarde' }, 500);
    }
  },
);

// ── DELETE /api/meta-capi/config ─────────────────────────────────────────────
// Deactivate CAPI config (soft delete — sets is_active=0).

router.delete(
  '/api/meta-capi/config',
  checkSubscriptionLevel('agency'),
  async (c) => {
    const auth = await verifyAuth(c);
    if (!auth.valid) return c.json({ error: auth.error }, 401);

    const env = c.env as Env;
    const blink = getBlink(env);

    try {
      const configs = await (blink as any).db.table<CapiConfigRow>('meta_capi_configs').list({
        where: { user_id: auth.userId },
        limit: 1,
      });

      if (!configs || configs.length === 0) {
        return c.json({ error: 'Configuration non trouvée' }, 404);
      }

      await (blink as any).db.table<CapiConfigRow>('meta_capi_configs').update(configs[0].id, {
        is_active: 0,
        updated_at: new Date().toISOString(),
      });

      return c.json({ success: true, action: 'deactivated' });
    } catch (err: any) {
      console.error('[MetaCAPI:DELETE/config]', err.message);
      return c.json({ error: 'Erreur serveur' }, 500);
    }
  },
);

// ── POST /api/meta-capi/test ─────────────────────────────────────────────────
// Send a test event using stored config + test_event_code.

router.post('/api/meta-capi/test', async (c) => {
  const auth = await verifyAuth(c);
  if (!auth.valid) return c.json({ error: auth.error }, 401);

  const env = c.env as Env;
  const blink = getBlink(env);

  try {
    const configs = await (blink as any).db.table<CapiConfigRow>('meta_capi_configs').list({
      where: { user_id: auth.userId, is_active: '1' },
      limit: 1,
    });

    if (!configs || configs.length === 0) {
      return c.json({
        error: 'Aucune configuration de tracking publicitaire active',
      }, 404);
    }

    const config = configs[0];

    if (!config.test_event_code) {
      return c.json({
        error: 'Aucun code de test configuré. Ajoutez un test_event_code dans la configuration.',
      }, 400);
    }

    // Decrypt access token
    const encryptionKey = (c.env as any).TOKEN_ENCRYPTION_KEY || '';
    const accessToken = await decryptToken(config.access_token_encrypted, encryptionKey);

    // Build a synthetic test event
    const testEvent = await prepareLeadEvent(
      {
        email: 'test@example.com',
        phone: '+33612345678',
        firstName: 'Test',
        lastName: 'Utilisateur',
        city: 'Paris',
        status: 'test',
      },
      'Lead',
    );

    // Send with test_event_code
    const result = await sendConversionEvent({
      pixelId: config.pixel_id,
      accessToken,
      testEventCode: config.test_event_code,
      events: [testEvent],
    });

    // Log the test event
    const eventId = `captest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      await (blink as any).db.table<CapiEventRow>('meta_capi_events').create({
        id: eventId,
        user_id: auth.userId!,
        config_id: config.id,
        event_name: 'Lead',
        event_time: testEvent.event_time,
        lead_id: '',
        lead_email: '***',
        lead_status: 'test',
        match_keys_used: JSON.stringify(['em', 'ph', 'fn', 'ln', 'ct', 'country']),
        response_status: result.success ? 200 : 400,
        response_body: JSON.stringify(result),
        success: result.success ? 1 : 0,
        test_event_code: config.test_event_code,
      } as any);
    } catch (logErr) {
      console.warn('[MetaCAPI:test] Failed to log test event:', logErr);
    }

    return c.json({
      success: result.success,
      eventsReceived: result.events_received,
      fbtraceId: result.fbtrace_id,
      error: result.error || null,
      message: result.success
        ? 'Événement de test envoyé avec succès. Vérifiez l\'outil Événements de test dans votre Pixel de conversion.'
        : `Erreur: ${result.error}`,
    });
  } catch (err: any) {
    console.error('[MetaCAPI:POST/test]', err.message);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ── GET /api/meta-capi/events ────────────────────────────────────────────────
// List recent conversion events (last 50).

router.get('/api/meta-capi/events', async (c) => {
  const auth = await verifyAuth(c);
  if (!auth.valid) return c.json({ error: auth.error }, 401);

  const env = c.env as Env;
  const blink = getBlink(env);

  try {
    const events = await (blink as any).db.table<CapiEventRow>('meta_capi_events').list({
      where: { user_id: auth.userId },
      orderBy: { created_at: 'desc' },
      limit: 50,
    });

    return c.json({
      events: (events || []).map((e: CapiEventRow) => ({
        id: e.id,
        eventName: e.event_name,
        eventTime: e.event_time,
        leadId: e.lead_id || null,
        leadStatus: e.lead_status || null,
        matchKeysUsed: JSON.parse(e.match_keys_used || '[]'),
        responseStatus: e.response_status,
        success: Number(e.success) > 0,
        testEventCode: e.test_event_code || null,
        createdAt: e.created_at,
      })),
    });
  } catch (err: any) {
    console.error('[MetaCAPI:GET/events]', err.message);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ── POST /api/meta-capi/trigger ──────────────────────────────────────────────
// Manually trigger a conversion event for a lead.

router.post('/api/meta-capi/trigger', async (c) => {
  const auth = await verifyAuth(c);
  if (!auth.valid) return c.json({ error: auth.error }, 401);

  const env = c.env as Env;
  const blink = getBlink(env);

  let body: { leadId?: string; eventName?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'JSON invalide' }, 400);
  }

  if (!body.leadId) {
    return c.json({ error: 'leadId est requis' }, 400);
  }

  try {
    // 1. Get active CAPI config
    const configs = await (blink as any).db.table<CapiConfigRow>('meta_capi_configs').list({
      where: { user_id: auth.userId, is_active: '1' },
      limit: 1,
    });

    if (!configs || configs.length === 0) {
      return c.json({
        error: 'Aucune configuration de tracking publicitaire active',
      }, 404);
    }

    const config = configs[0];

    // 2. Fetch lead data from captured_leads or leads table
    let leadData: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      city?: string;
      status?: string;
    } | null = null;

    // Try captured_leads first (most common for widget-captured leads)
    try {
      const captured = await (blink as any).db.table<any>('captured_leads').get(body.leadId);
      if (captured) {
        leadData = {
          email: captured.email || undefined,
          phone: captured.phone || undefined,
          firstName: captured.firstName || undefined,
          lastName: captured.lastName || undefined,
          city: undefined,
          status: captured.status || 'captured',
        };
      }
    } catch {
      // Not found in captured_leads — try leads
    }

    // Fallback: try leads table
    if (!leadData) {
      try {
        const lead = await (blink as any).db.table<any>('leads').get(body.leadId);
        if (lead) {
          leadData = {
            email: lead.email || undefined,
            phone: lead.phone || undefined,
            firstName: undefined,
            lastName: undefined,
            city: lead.city || undefined,
            status: lead.status || 'Lead_Audit',
          };
        }
      } catch {
        // Not found in leads either
      }
    }

    if (!leadData) {
      return c.json({ error: 'Lead non trouvé' }, 404);
    }

    // 3. Decrypt token
    const encryptionKey = (c.env as any).TOKEN_ENCRYPTION_KEY || '';
    const accessToken = await decryptToken(config.access_token_encrypted, encryptionKey);

    // 4. Prepare and send event
    const eventName = body.eventName || 'Lead';
    const event = await prepareLeadEvent(leadData, eventName);

    const result = await sendConversionEvent({
      pixelId: config.pixel_id,
      accessToken,
      testEventCode: config.test_event_code || undefined,
      events: [event],
    });

    const matchKeysUsed = Object.keys(event.user_data).filter(k =>
      ['em', 'ph', 'fn', 'ln', 'ct', 'country'].includes(k),
    );

    // 5. Log event
    const eventId = `capevt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      await (blink as any).db.table<CapiEventRow>('meta_capi_events').create({
        id: eventId,
        user_id: auth.userId!,
        config_id: config.id,
        event_name: eventName,
        event_time: event.event_time,
        lead_id: body.leadId,
        lead_email: leadData.email ? '***' : '',
        lead_status: leadData.status || '',
        match_keys_used: JSON.stringify(matchKeysUsed),
        response_status: result.success ? 200 : 400,
        response_body: JSON.stringify({
          events_received: result.events_received,
          fbtrace_id: result.fbtrace_id,
          error: result.error || null,
        }),
        success: result.success ? 1 : 0,
        test_event_code: config.test_event_code || '',
      } as any);
    } catch (logErr) {
      console.warn('[MetaCAPI:trigger] Failed to log event:', logErr);
    }

    // 6. Update config counters
    try {
      const now = new Date().toISOString();
      if (result.success) {
        await (blink as any).db.table<CapiConfigRow>('meta_capi_configs').update(config.id, {
          events_sent: (config.events_sent || 0) + 1,
          last_event_at: now,
          last_error: '',
          updated_at: now,
        });
      } else {
        await (blink as any).db.table<CapiConfigRow>('meta_capi_configs').update(config.id, {
          events_failed: (config.events_failed || 0) + 1,
          last_event_at: now,
          last_error: result.error || 'Unknown error',
          updated_at: now,
        });
      }
    } catch (updateErr) {
      console.warn('[MetaCAPI:trigger] Failed to update counters:', updateErr);
    }

    return c.json({
      success: result.success,
      eventsReceived: result.events_received,
      fbtraceId: result.fbtrace_id,
      error: result.error || null,
      eventId,
    });
  } catch (err: any) {
    console.error('[MetaCAPI:POST/trigger]', err.message);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});
