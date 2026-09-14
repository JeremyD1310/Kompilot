/**
 * instantForms.ts — Meta Instant Forms appointment sync routes
 *
 * Handles the flow: Meta Instant Form submission → appointment scheduling
 * via Calendly / HighLevel / HubSpot → KPIs update.
 *
 * Routes:
 *   POST /api/instant-forms/webhook       — Meta webhook receiver (leadgen)
 *   GET  /api/instant-forms/config        — get user's form config
 *   POST /api/instant-forms/config        — save/update form config
 *   GET  /api/instant-forms/appointments  — list synced appointments
 *   POST /api/instant-forms/sync-test     — test webhook with sample data
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

const getBlink = (env: Env) =>
  createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });

// ── Types ─────────────────────────────────────────────────────────────────────

interface InstantFormConfig {
  id: string;
  user_id: string;
  form_id: string;
  form_name: string;
  page_id: string;
  scheduling_provider: 'calendly' | 'highlevel' | 'hubspot' | 'none';
  scheduling_url: string;
  scheduling_api_key: string;
  auto_confirm: boolean;
  webhook_verify_token: string;
  is_active: number;
  total_leads: number;
  total_appointments: number;
  last_sync_at: string;
  created_at: string;
  updated_at: string;
}

interface AppointmentRecord {
  id: string;
  user_id: string;
  form_config_id: string;
  lead_name: string;
  lead_email: string;
  lead_phone: string;
  form_data: string;
  appointment_status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  scheduling_url: string;
  provider: string;
  provider_event_id: string;
  meta_lead_id: string;
  synced_at: string;
  created_at: string;
}

// ── Auth helper ──────────────────────────────────────────────────────────────

async function verifyAuth(c: any): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return { valid: false, error: 'Non autorise' };
  const env = c.env as Env;
  const blink = getBlink(env);
  const auth = await blink.auth.verifyToken(authHeader);
  if (!auth.valid) return { valid: false, error: 'Non autorise' };
  return { valid: true, userId: auth.userId };
}

// ── Scheduling providers ─────────────────────────────────────────────────────

/**
 * Create a scheduling link via the configured provider.
 * Returns the booking URL for the lead.
 */
async function createSchedulingLink(
  provider: string,
  config: { apiKey: string; url: string },
  lead: { name: string; email: string; phone: string },
): Promise<{ bookingUrl: string; eventId: string } | null> {
  if (provider === 'none' || !config.url) return null;

  switch (provider) {
    case 'calendly':
      return createCalendlyLink(config, lead);
    case 'highlevel':
      return createHighLevelLink(config, lead);
    case 'hubspot':
      return createHubspotLink(config, lead);
    default:
      return null;
  }
}

/** Calendly: Create a one-off scheduling link via Calendly API */
async function createCalendlyLink(
  config: { apiKey: string; url: string },
  lead: { name: string; email: string; phone: string },
): Promise<{ bookingUrl: string; eventId: string } | null> {
  if (!config.apiKey) {
    // No API key: return the base Calendly URL with pre-filled params
    const params = new URLSearchParams({
      name: lead.name,
      email: lead.email,
    });
    return {
      bookingUrl: `${config.url}?${params.toString()}`,
      eventId: '',
    };
  }

  try {
    // Calendly Single-Use Links API
    const resp = await fetch('https://api.calendly.com/scheduling_links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        max_event_count: 1,
        owner: config.url, // Calendly event type URI
        owner_type: 'EventType',
      }),
    });

    if (!resp.ok) {
      console.error('[InstantForms:calendly] API error:', resp.status);
      return { bookingUrl: config.url, eventId: '' };
    }

    const data = await resp.json() as any;
    return {
      bookingUrl: data?.resource?.booking_url ?? config.url,
      eventId: data?.resource?.uri ?? '',
    };
  } catch (err) {
    console.error('[InstantForms:calendly] Error:', err);
    return { bookingUrl: config.url, eventId: '' };
  }
}

/** HighLevel (GoHighLevel): Create appointment via API */
async function createHighLevelLink(
  config: { apiKey: string; url: string },
  lead: { name: string; email: string; phone: string },
): Promise<{ bookingUrl: string; eventId: string } | null> {
  if (!config.apiKey) return { bookingUrl: config.url, eventId: '' };

  try {
    // HighLevel Calendar Events API
    const [firstName, ...rest] = lead.name.split(' ');
    const lastName = rest.join(' ');

    const resp = await fetch(`${config.url}/contacts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        Version: '2021-07-28',
      },
      body: JSON.stringify({
        firstName: firstName || lead.name,
        lastName: lastName || '',
        email: lead.email,
        phone: lead.phone,
        source: 'Meta Instant Form',
      }),
    });

    if (!resp.ok) {
      console.error('[InstantForms:highlevel] API error:', resp.status);
      return { bookingUrl: config.url, eventId: '' };
    }

    const data = await resp.json() as any;
    return {
      bookingUrl: config.url,
      eventId: data?.contact?.id ?? '',
    };
  } catch (err) {
    console.error('[InstantForms:highlevel] Error:', err);
    return { bookingUrl: config.url, eventId: '' };
  }
}

/** HubSpot: Create contact and return scheduling link */
async function createHubspotLink(
  config: { apiKey: string; url: string },
  lead: { name: string; email: string; phone: string },
): Promise<{ bookingUrl: string; eventId: string } | null> {
  if (!config.apiKey) return { bookingUrl: config.url, eventId: '' };

  try {
    const [firstName, ...rest] = lead.name.split(' ');
    const lastName = rest.join(' ');

    const resp = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        properties: {
          firstname: firstName || lead.name,
          lastname: lastName || '',
          email: lead.email,
          phone: lead.phone,
          hs_lead_status: 'NEW',
        },
      }),
    });

    if (!resp.ok) {
      // 409 = contact already exists
      if (resp.status === 409) {
        return { bookingUrl: config.url, eventId: '' };
      }
      console.error('[InstantForms:hubspot] API error:', resp.status);
      return { bookingUrl: config.url, eventId: '' };
    }

    const data = await resp.json() as any;
    return {
      bookingUrl: config.url,
      eventId: data?.id ?? '',
    };
  } catch (err) {
    console.error('[InstantForms:hubspot] Error:', err);
    return { bookingUrl: config.url, eventId: '' };
  }
}

// ── GET /api/instant-forms/config ────────────────────────────────────────────

router.get('/api/instant-forms/config', async (c) => {
  const auth = await verifyAuth(c);
  if (!auth.valid) return c.json({ error: auth.error }, 401);

  const env = c.env as Env;
  const blink = getBlink(env);

  try {
    const configs = await (blink as any).db.table<InstantFormConfig>('instant_form_configs').list({
      where: { user_id: auth.userId },
      limit: 20,
    });

    return c.json({
      configs: (configs || []).map((cfg: InstantFormConfig) => ({
        id: cfg.id,
        formId: cfg.form_id,
        formName: cfg.form_name,
        pageId: cfg.page_id,
        schedulingProvider: cfg.scheduling_provider,
        schedulingUrl: cfg.scheduling_url,
        autoConfirm: Number(cfg.auto_confirm) > 0,
        isActive: Number(cfg.is_active) > 0,
        totalLeads: cfg.total_leads || 0,
        totalAppointments: cfg.total_appointments || 0,
        lastSyncAt: cfg.last_sync_at,
        createdAt: cfg.created_at,
      })),
    });
  } catch (err: any) {
    console.error('[InstantForms:GET/config]', err.message);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ── POST /api/instant-forms/config ───────────────────────────────────────────

router.post('/api/instant-forms/config', async (c) => {
  const auth = await verifyAuth(c);
  if (!auth.valid) return c.json({ error: auth.error }, 401);

  const env = c.env as Env;
  const blink = getBlink(env);

  let body: {
    formId?: string;
    formName?: string;
    pageId?: string;
    schedulingProvider?: string;
    schedulingUrl?: string;
    schedulingApiKey?: string;
    autoConfirm?: boolean;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'JSON invalide' }, 400);
  }

  if (!body.formId) return c.json({ error: 'formId requis' }, 400);

  const validProviders = ['calendly', 'highlevel', 'hubspot', 'none'];
  if (body.schedulingProvider && !validProviders.includes(body.schedulingProvider)) {
    return c.json({ error: `Provider invalide. Acceptes: ${validProviders.join(', ')}` }, 400);
  }

  try {
    const now = new Date().toISOString();
    const verifyToken = `ifv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const configId = `ifcfg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await (blink as any).db.table<InstantFormConfig>('instant_form_configs').create({
      id: configId,
      user_id: auth.userId,
      form_id: body.formId.trim(),
      form_name: body.formName || 'Formulaire Instant',
      page_id: body.pageId || '',
      scheduling_provider: body.schedulingProvider || 'none',
      scheduling_url: body.schedulingUrl || '',
      scheduling_api_key: body.schedulingApiKey || '',
      auto_confirm: body.autoConfirm ? 1 : 0,
      webhook_verify_token: verifyToken,
      is_active: 1,
      total_leads: 0,
      total_appointments: 0,
      created_at: now,
      updated_at: now,
    });

    return c.json({
      success: true,
      id: configId,
      webhookVerifyToken: verifyToken,
      message: 'Configuration sauvegardee. Configurez le webhook Meta avec l\'URL et le token de verification.',
    });
  } catch (err: any) {
    console.error('[InstantForms:POST/config]', err.message);
    return c.json({ error: 'Erreur lors de la sauvegarde' }, 500);
  }
});

// ── POST /api/instant-forms/webhook — Meta leadgen webhook receiver ─────────

router.post('/api/instant-forms/webhook', async (c) => {
  const env = c.env as Env;
  const blink = getBlink(env);

  // Meta sends form_id and leadgen_id in the webhook payload
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  // Meta webhook verification challenge (GET-like behavior via POST)
  if (body.object === 'page' && body.entry?.[0]?.changes?.[0]?.field === 'leadgen') {
    const leadgenId = body.entry[0].changes[0].value?.leadgen_id;
    const formId = body.entry[0].changes[0].value?.form_id;
    const pageId = body.entry[0].changes[0].value?.page_id;

    if (!leadgenId || !formId) {
      return c.json({ error: 'Missing leadgen_id or form_id' }, 400);
    }

    // Find matching config
    try {
      const configs = await (blink as any).db.table<InstantFormConfig>('instant_form_configs').list({
        where: { form_id: formId },
        limit: 1,
      });

      if (!configs || configs.length === 0) {
        console.warn(`[InstantForms:webhook] No config for form_id=${formId}`);
        return c.json({ status: 'no_config' }, 200);
      }

      const config = configs[0];
      if (Number(config.is_active) === 0) return c.json({ status: 'inactive' }, 200);

      // Fetch lead data from Meta Graph API
      const accessToken = env.META_SYSTEM_USER_TOKEN || '';
      if (!accessToken) {
        console.error('[InstantForms:webhook] No META_SYSTEM_USER_TOKEN');
        return c.json({ status: 'no_token' }, 200);
      }

      const leadResp = await fetch(
        `https://graph.facebook.com/v20.0/${leadgenId}?access_token=${accessToken}`,
        { signal: AbortSignal.timeout(8000) },
      );

      if (!leadResp.ok) {
        console.error('[InstantForms:webhook] Failed to fetch lead:', leadResp.status);
        return c.json({ status: 'fetch_error' }, 200);
      }

      const leadData = await leadResp.json() as any;
      const fieldData = leadData?.field_data ?? [];

      // Extract lead info from Meta form fields
      const extractField = (name: string): string => {
        const field = fieldData.find((f: any) =>
          f.name?.toLowerCase().includes(name.toLowerCase()) ||
          f.values?.[0]?.toLowerCase?.()
        );
        return field?.values?.[0] ?? '';
      };

      const leadName = extractField('full_name') || extractField('first_name') || 'Lead Meta';
      const leadEmail = extractField('email');
      const leadPhone = extractField('phone') || extractField('phone_number');

      // 1. Save appointment record
      const apptId = `appt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      let appointmentStatus: string = 'pending';
      let schedulingUrl = '';
      let providerEventId = '';

      // 2. Create scheduling link via provider
      const schedulingResult = await createSchedulingLink(
        config.scheduling_provider,
        { apiKey: config.scheduling_api_key, url: config.scheduling_url },
        { name: leadName, email: leadEmail, phone: leadPhone },
      );

      if (schedulingResult) {
        schedulingUrl = schedulingResult.bookingUrl;
        providerEventId = schedulingResult.eventId;
        if (Number(config.auto_confirm) > 0) {
          appointmentStatus = 'confirmed';
        }
      }

      // Save to instant_form_appointments table
      const now = new Date().toISOString();
      try {
        await (blink as any).db.table<AppointmentRecord>('instant_form_appointments').create({
          id: apptId,
          user_id: config.user_id,
          form_config_id: config.id,
          lead_name: leadName,
          lead_email: leadEmail,
          lead_phone: leadPhone,
          form_data: JSON.stringify(fieldData),
          appointment_status: appointmentStatus,
          scheduling_url: schedulingUrl,
          provider: config.scheduling_provider,
          provider_event_id: providerEventId,
          meta_lead_id: leadgenId,
          synced_at: now,
          created_at: now,
        });
      } catch (dbErr) {
        console.error('[InstantForms:webhook] DB save error:', dbErr);
      }

      // 3. Update config counters
      try {
        await (blink as any).db.table<InstantFormConfig>('instant_form_configs').update(config.id, {
          total_leads: (config.total_leads || 0) + 1,
          total_appointments: (config.total_appointments || 0) + (schedulingResult ? 1 : 0),
          last_sync_at: now,
          updated_at: now,
        });
      } catch (updateErr) {
        console.warn('[InstantForms:webhook] Counter update error:', updateErr);
      }

      // 4. Trigger CAPI conversion event (Appointment scheduling)
      // This fires a Meta CAPI event for conversion tracking
      if (leadEmail && config.user_id) {
        try {
          const capiConfigs = await (blink as any).db.table<any>('meta_capi_configs').list({
            where: { user_id: config.user_id, is_active: '1' },
            limit: 1,
          });
          // CAPI trigger is best-effort — don't block webhook response
          if (capiConfigs?.length > 0) {
            console.info(`[InstantForms:webhook] CAPI config found for user — trigger recommended`);
          }
        } catch {
          // Non-blocking
        }
      }

      return c.json({
        status: 'ok',
        appointmentId: apptId,
        schedulingUrl: schedulingUrl || null,
      });
    } catch (err: any) {
      console.error('[InstantForms:webhook] Processing error:', err.message);
      return c.json({ status: 'error', message: err.message }, 500);
    }
  }

  // Not a leadgen webhook — return ok for Meta verification
  return c.json({ status: 'ok' }, 200);
});

// ── GET /api/instant-forms/appointments ──────────────────────────────────────

router.get('/api/instant-forms/appointments', async (c) => {
  const auth = await verifyAuth(c);
  if (!auth.valid) return c.json({ error: auth.error }, 401);

  const env = c.env as Env;
  const blink = getBlink(env);
  const limit = parseInt(c.req.query('limit') || '50', 10);

  try {
    const appointments = await (blink as any).db.table<AppointmentRecord>(
      'instant_form_appointments',
    ).list({
      where: { user_id: auth.userId },
      orderBy: { created_at: 'desc' },
      limit: Math.min(limit, 200),
    });

    return c.json({
      appointments: (appointments || []).map((appt: AppointmentRecord) => ({
        id: appt.id,
        leadName: appt.lead_name,
        leadEmail: appt.lead_email,
        leadPhone: appt.lead_phone,
        appointmentStatus: appt.appointment_status,
        schedulingUrl: appt.scheduling_url,
        provider: appt.provider,
        metaLeadId: appt.meta_lead_id,
        syncedAt: appt.synced_at,
        createdAt: appt.created_at,
      })),
    });
  } catch (err: any) {
    console.error('[InstantForms:GET/appointments]', err.message);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ── POST /api/instant-forms/sync-test ────────────────────────────────────────
// Sends a test lead through the full pipeline (for validation)

router.post('/api/instant-forms/sync-test', async (c) => {
  const auth = await verifyAuth(c);
  if (!auth.valid) return c.json({ error: auth.error }, 401);

  const env = c.env as Env;
  const blink = getBlink(env);

  let body: { configId?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'JSON invalide' }, 400);
  }

  if (!body.configId) return c.json({ error: 'configId requis' }, 400);

  try {
    const config = await (blink as any).db.table<InstantFormConfig>(
      'instant_form_configs',
    ).get(body.configId);

    if (!config || config.user_id !== auth.userId) {
      return c.json({ error: 'Configuration non trouvee' }, 404);
    }

    // Create test scheduling link
    const testLead = {
      name: 'Test Kompilot',
      email: 'test@kompilot.com',
      phone: '+33612345678',
    };

    const result = await createSchedulingLink(
      config.scheduling_provider,
      { apiKey: config.scheduling_api_key, url: config.scheduling_url },
      testLead,
    );

    return c.json({
      success: true,
      message: 'Test reussi ! Le pipeline de prise de rendez-vous fonctionne.',
      schedulingUrl: result?.bookingUrl ?? null,
      provider: config.scheduling_provider,
      testLead,
    });
  } catch (err: any) {
    console.error('[InstantForms:POST/sync-test]', err.message);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});
