/**
 * Meta CAPI (Pixel de conversion) — Service layer
 *
 * Provides typed helpers for sending conversion events to the
 * server-side Conversion API and encrypting/storing access tokens.
 *
 * Uses AES-256-GCM via the Web Crypto API (available natively in CF Workers).
 * Shares encryption primitives with tokenEncryption.ts.
 *
 * IMPORTANT: Never expose the raw access token to the client.
 */

import { requireBlinkProjectId } from './blinkConfig';
import { encryptToken, decryptToken } from './tokenEncryption';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CapiEvent {
  event_name: string;           // 'Lead' | 'Contact' | any standard Meta event
  event_time: number;           // Unix timestamp (seconds)
  user_data: {
    em?: string;               // SHA-256 hashed email
    ph?: string;               // SHA-256 hashed phone
    fn?: string;               // SHA-256 hashed first name
    ln?: string;               // SHA-256 hashed last name
    ct?: string;               // SHA-256 hashed city
    country?: string;          // SHA-256 hashed country (lowercase)
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;              // Click ID cookie (fb.1.timestamp.clickId)
  };
  custom_data?: {
    content_name?: string;
    content_category?: string;
    value?: number;
    currency?: string;
    [key: string]: unknown;
  };
  action_source?: string;      // 'website' by default
  event_id?: string;           // Deduplication ID
}

export interface SendOptions {
  pixelId: string;
  accessToken: string;
  testEventCode?: string;
  events: CapiEvent[];
}

export interface CapiResponse {
  success: boolean;
  events_received?: number;
  fbtrace_id?: string;
  error?: string;
}

export interface CapiConfigRow {
  id: string;
  user_id: string;
  pixel_id: string;
  access_token_encrypted: string;
  test_event_code: string;
  is_active: number;           // "0" or "1"
  events_sent: number;
  events_failed: number;
  last_event_at: string | null;
  last_error: string;
  created_at: string;
  updated_at: string;
}

export interface CapiEventRow {
  id: string;
  user_id: string;
  config_id: string;
  event_name: string;
  event_time: number;
  lead_id: string;
  lead_email: string;
  lead_status: string;
  match_keys_used: string;     // JSON array
  response_status: number;
  response_body: string;
  success: number;             // "0" or "1"
  test_event_code: string;
  created_at: string;
}

// ── SHA-256 hashing ──────────────────────────────────────────────────────────

/**
 * Hash a value with SHA-256, normalized to lowercase + trimmed.
 * Required by Meta CAPI for all user data fields.
 */
export async function hashSHA256(value: string): Promise<string> {
  const normalized = value.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Token encryption / decryption ────────────────────────────────────────────
// Re-exports from shared tokenEncryption.ts (AES-256-GCM)

export { encryptToken, decryptToken };

// ── Send Conversion Event ────────────────────────────────────────────────────

/**
 * Send one or more conversion events to the Meta CAPI endpoint.
 *
 * @returns CapiResponse with success status and Meta's response details
 */
export async function sendConversionEvent(options: SendOptions): Promise<CapiResponse> {
  const { pixelId, accessToken, testEventCode, events } = options;

  if (!pixelId || !accessToken) {
    return { success: false, error: 'pixelId and accessToken are required' };
  }
  if (!events || events.length === 0) {
    return { success: false, error: 'At least one event is required' };
  }

  const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

  const body: Record<string, unknown> = { data: events };
  if (testEventCode) {
    body.test_event_code = testEventCode;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json() as {
      events_received?: number;
      fbtrace_id?: string;
      error?: { message: string; type: string; code: number };
    };

    if (data.error) {
      return {
        success: false,
        error: data.error.message,
        fbtrace_id: data.fbtrace_id,
      };
    }

    return {
      success: true,
      events_received: data.events_received,
      fbtrace_id: data.fbtrace_id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown fetch error';
    return { success: false, error: message };
  }
}

// ── Prepare Lead Event ───────────────────────────────────────────────────────

/**
 * Build a CapiEvent for a lead conversion from raw lead data.
 * All PII fields are SHA-256 hashed per Meta CAPI requirements.
 */
export async function prepareLeadEvent(
  leadData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    status?: string;
  },
  eventName: string = 'Lead',
): Promise<CapiEvent> {
  const userData: CapiEvent['user_data'] = {};
  const matchKeysUsed: string[] = [];

  if (leadData.email) {
    userData.em = await hashSHA256(leadData.email);
    matchKeysUsed.push('em');
  }
  if (leadData.phone) {
    // Strip non-digit chars for phone hashing
    const cleaned = leadData.phone.replace(/\D/g, '');
    if (cleaned.length >= 7) {
      userData.ph = await hashSHA256(cleaned);
      matchKeysUsed.push('ph');
    }
  }
  if (leadData.firstName) {
    userData.fn = await hashSHA256(leadData.firstName);
    matchKeysUsed.push('fn');
  }
  if (leadData.lastName) {
    userData.ln = await hashSHA256(leadData.lastName);
    matchKeysUsed.push('ln');
  }
  if (leadData.city) {
    userData.ct = await hashSHA256(leadData.city);
    matchKeysUsed.push('ct');
  }
  // Default to FR
  userData.country = await hashSHA256('fr');
  matchKeysUsed.push('country');

  return {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    user_data: userData,
    custom_data: {
      content_name: leadData.status || 'lead',
      content_category: 'lead_generation',
    },
    event_id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
}

// ── Trigger CAPI Conversion (standalone, fire-and-forget) ────────────────────

/**
 * Automatically trigger a conversion event when a lead status changes.
 *
 * This function:
 *  1. Checks if user has an active CAPI config
 *  2. Decrypts access token
 *  3. Calls sendConversionEvent with event_name='Lead'
 *  4. Inserts into meta_capi_events
 *  5. Updates config counters (events_sent/failed, last_event_at)
 *  6. Never throws — always catches and logs errors
 *
 * Designed to be called from any route (lead capture, status change, etc.)
 */
export async function triggerCapiConversion(
  env: Record<string, string>,
  userId: string,
  leadId: string,
  leadData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    status: string;
  },
): Promise<void> {
  try {
    // 1. Blink SDK (server-side)
    const { createClient } = await import('@blinkdotnew/sdk');
    const blink = createClient({
      projectId: requireBlinkProjectId(env),
      secretKey: env.BLINK_SECRET_KEY,
    });

    // 2. Find active CAPI config for user
    const configs = await (blink as any).db.table<CapiConfigRow>('meta_capi_configs').list({
      where: { user_id: userId, is_active: '1' },
      limit: 1,
    });

    if (!configs || configs.length === 0) {
      // No active config — silently skip
      return;
    }

    const config = configs[0];

    // 3. Decrypt access token
    const encryptionKey = env.TOKEN_ENCRYPTION_KEY || (env as any).TOKEN_ENCRYPTION_KEY;
    const accessToken = await decryptToken(config.access_token_encrypted, encryptionKey || '');

    // 4. Prepare hashed event
    const event = await prepareLeadEvent(leadData, 'Lead');

    // 5. Send to Meta CAPI
    const result = await sendConversionEvent({
      pixelId: config.pixel_id,
      accessToken,
      testEventCode: config.test_event_code || undefined,
      events: [event],
    });

    const matchKeysUsed = Object.keys(event.user_data).filter(k =>
      ['em', 'ph', 'fn', 'ln', 'ct', 'country'].includes(k),
    );

    // 6. Log event in meta_capi_events
    const eventId = `capevt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      await (blink as any).db.table<CapiEventRow>('meta_capi_events').create({
        id: eventId,
        user_id: userId,
        config_id: config.id,
        event_name: 'Lead',
        event_time: event.event_time,
        lead_id: leadId || '',
        lead_email: leadData.email ? '***' : '',  // Never store raw email
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
      console.error('[MetaCAPI] Failed to log event:', logErr);
    }

    // 7. Update config counters
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
      console.error('[MetaCAPI] Failed to update config counters:', updateErr);
    }

    if (!result.success) {
      console.warn(`[MetaCAPI] Event failed for user=${userId} lead=${leadId}: ${result.error}`);
    }
  } catch (err: unknown) {
    // Never throw — fire-and-forget
    console.error('[MetaCAPI] triggerCapiConversion error:', err instanceof Error ? err.message : err);
  }
}
