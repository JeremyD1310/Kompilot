/**
 * Server-side Conversion Tracking
 *
 * Fires conversion events to:
 *  - Meta Conversions API (CAPI)
 *  - Google Analytics 4 Measurement Protocol
 *  - TikTok Events API
 *
 * All external calls are fire-and-forget — failures are logged but never thrown.
 * All PII (email, phone) is SHA-256 hashed before being sent.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConversionEvent =
  | 'Lead'
  | 'CompleteRegistration'
  | 'Purchase'
  | 'HighValuePro'
  | 'AgencyScale'
  | 'ScannerAbandon'
  | 'OnboardingIncomplete'
  | 'Agency_Audit_Generated'
  | 'White_Label_Activated'
  | 'Agency_Purchase';

export interface ConversionPayload {
  event: ConversionEvent;
  userId?: string;
  email?: string;
  phone?: string;
  value?: number;
  currency?: string;
  userAgent?: string;
  ip?: string;
  fbp?: string;     // Meta Browser ID cookie (_fbp)
  fbc?: string;     // Meta Click ID cookie (_fbc)
  gclid?: string;   // Google Click ID
  ttclid?: string;  // TikTok Click ID
  userType?: 'professional' | 'agency';
  sector?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmSector?: string;
  customData?: Record<string, unknown>;
}

/** Env bindings — required fields from Env type + optional tracking secrets */
export interface TrackingEnv {
  BLINK_PROJECT_ID: string;
  BLINK_SECRET_KEY: string;
  META_PIXEL_ID?: string;
  META_ACCESS_TOKEN?: string;
  GA4_MEASUREMENT_ID?: string;
  GA4_API_SECRET?: string;
  TIKTOK_PIXEL_ID?: string;
  TIKTOK_ACCESS_TOKEN?: string;
}

// ── PII hashing ───────────────────────────────────────────────────────────────

/**
 * SHA-256 hash a string (lowercase-trimmed) using the Web Crypto API.
 * Used to normalise email/phone before sending to ad platforms.
 */
export async function hashUserData(value: string): Promise<string> {
  const normalised = value.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalised);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ── Meta Conversions API ──────────────────────────────────────────────────────

export async function fireMetaCAPI(
  payload: ConversionPayload,
  env: TrackingEnv,
): Promise<void> {
  const pixelId = (env as any).META_PIXEL_ID;
  const accessToken = (env as any).META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.log('[tracking] Meta CAPI skipped — META_PIXEL_ID / META_ACCESS_TOKEN not set');
    return;
  }

  try {
    const userData: Record<string, unknown> = {};
    if (payload.email)     userData.em  = [await hashUserData(payload.email)];
    if (payload.phone)     userData.ph  = [await hashUserData(payload.phone)];
    if (payload.ip)        userData.client_ip_address = payload.ip;
    if (payload.userAgent) userData.client_user_agent = payload.userAgent;
    if (payload.fbp)       userData.fbp = payload.fbp;
    if (payload.fbc)       userData.fbc = payload.fbc;

    const customData: Record<string, unknown> = {
      currency: payload.currency ?? 'EUR',
      ...(payload.value !== undefined ? { value: payload.value } : {}),
      ...(payload.sector      ? { sector: payload.sector }           : {}),
      ...(payload.userType    ? { user_type: payload.userType }      : {}),
      ...(payload.utmSource   ? { utm_source: payload.utmSource }    : {}),
      ...(payload.utmMedium   ? { utm_medium: payload.utmMedium }    : {}),
      ...(payload.utmCampaign ? { utm_campaign: payload.utmCampaign } : {}),
      ...(payload.utmContent  ? { utm_content: payload.utmContent }  : {}),
      ...(payload.utmSector   ? { utm_sector: payload.utmSector }    : {}),
      ...(payload.customData ?? {}),
    };

    const event = {
      event_name: payload.event,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      user_data: userData,
      custom_data: customData,
      ...(payload.userId ? { event_id: payload.userId } : {}),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [event] }),
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text();
      console.error('[tracking] Meta CAPI error:', res.status, err);
    } else {
      console.log('[tracking] Meta CAPI fired:', payload.event);
    }
  } catch (e: any) {
    console.error('[tracking] Meta CAPI exception:', e.message);
  }
}

// ── Google Analytics 4 Measurement Protocol ───────────────────────────────────

export async function fireGoogleConversion(
  payload: ConversionPayload,
  env: TrackingEnv,
): Promise<void> {
  const measurementId = (env as any).GA4_MEASUREMENT_ID;
  const apiSecret     = (env as any).GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    console.log('[tracking] GA4 MP skipped — GA4_MEASUREMENT_ID / GA4_API_SECRET not set');
    return;
  }

  try {
    // Map our event names to GA4-friendly snake_case names
    const ga4EventName = payload.event.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const eventParams: Record<string, unknown> = {
      currency: payload.currency ?? 'EUR',
      ...(payload.value !== undefined ? { value: payload.value } : {}),
      ...(payload.userId    ? { user_id: payload.userId }          : {}),
      ...(payload.sector    ? { sector: payload.sector }           : {}),
      ...(payload.userType  ? { user_type: payload.userType }      : {}),
      ...(payload.utmSource ? { utm_source: payload.utmSource }    : {}),
      ...(payload.utmMedium ? { utm_medium: payload.utmMedium }    : {}),
      ...(payload.utmCampaign ? { utm_campaign: payload.utmCampaign } : {}),
      ...(payload.utmContent  ? { utm_content: payload.utmContent } : {}),
      ...(payload.utmSector   ? { utm_sector: payload.utmSector }   : {}),
      ...(payload.gclid     ? { gclid: payload.gclid }             : {}),
      ...(payload.customData ?? {}),
    };

    const body = {
      client_id: payload.userId ?? `server_${Date.now()}`,
      ...(payload.userId ? { user_id: payload.userId } : {}),
      events: [{ name: ga4EventName, params: eventParams }],
    };

    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    // GA4 MP returns 204 on success with no body
    if (res.status !== 204 && !res.ok) {
      console.error('[tracking] GA4 MP error:', res.status);
    } else {
      console.log('[tracking] GA4 MP fired:', payload.event);
    }
  } catch (e: any) {
    console.error('[tracking] GA4 MP exception:', e.message);
  }
}

// ── TikTok Events API ─────────────────────────────────────────────────────────

export async function fireTikTokCAPI(
  payload: ConversionPayload,
  env: TrackingEnv,
): Promise<void> {
  const pixelId     = (env as any).TIKTOK_PIXEL_ID;
  const accessToken = (env as any).TIKTOK_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.log('[tracking] TikTok CAPI skipped — TIKTOK_PIXEL_ID / TIKTOK_ACCESS_TOKEN not set');
    return;
  }

  try {
    const properties: Record<string, unknown> = {
      pixel_code: pixelId,
      ...(payload.value !== undefined ? { value: payload.value, currency: payload.currency ?? 'EUR' } : {}),
      ...(payload.customData ?? {}),
    };

    const context: Record<string, unknown> = {};
    if (payload.ip)        context.ip = payload.ip;
    if (payload.userAgent) context.user_agent = payload.userAgent;
    if (payload.ttclid)    context.ttclid = payload.ttclid;

    const userInfo: Record<string, unknown> = {};
    if (payload.email) userInfo.email     = await hashUserData(payload.email);
    if (payload.phone) userInfo.phone_number = await hashUserData(payload.phone);
    if (Object.keys(userInfo).length) context.user = userInfo;

    const body = {
      pixel_code: pixelId,
      event: payload.event,
      event_time: Math.floor(Date.now() / 1000),
      context,
      properties,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(
      'https://business-api.tiktok.com/open_api/v1.3/event/track/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Token': accessToken,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text();
      console.error('[tracking] TikTok CAPI error:', res.status, err);
    } else {
      console.log('[tracking] TikTok CAPI fired:', payload.event);
    }
  } catch (e: any) {
    console.error('[tracking] TikTok CAPI exception:', e.message);
  }
}

// ── Unified dispatcher ────────────────────────────────────────────────────────

/**
 * Fire a conversion event to all configured platforms in parallel.
 * Uses Promise.allSettled — individual failures are logged but never thrown.
 */
export async function fireConversionEvent(
  payload: ConversionPayload,
  env: TrackingEnv,
): Promise<void> {
  const results = await Promise.allSettled([
    fireMetaCAPI(payload, env),
    fireGoogleConversion(payload, env),
    fireTikTokCAPI(payload, env),
  ]);

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[tracking] fireConversionEvent — one platform threw:', result.reason);
    }
  }
}
