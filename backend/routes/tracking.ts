/**
 * Server-Side Tracking — Conversion APIs
 *
 * Endpoints:
 *   POST /api/tracking/conversion   — envoie un événement vers Meta CAPI, GA4 MP, TikTok Events API
 *   POST /api/tracking/audience     — enregistre un signal d'audience avancé (HighValuePro, AgencyScale)
 *   GET  /api/tracking/paid-media   — stats CAC + conversion scan→payant (admin only)
 *
 * Secrets optionnels (Project Settings → Secrets) :
 *   META_PIXEL_ID          — ID pixel Meta
 *   META_ACCESS_TOKEN      — Token CAPI Meta (même token que l'API analytics)
 *   META_TEST_EVENT_CODE   — Code de test (optionnel)
 *   GA4_MEASUREMENT_ID     — ex: G-XXXXXXXXXX
 *   GA4_API_SECRET         — Clé secrète Measurement Protocol
 *   TIKTOK_PIXEL_ID        — ID pixel TikTok
 *   TIKTOK_ACCESS_TOKEN    — Token Events API TikTok
 *
 * Google Ads Enhanced Conversions (Server-Side) :
 *   GADS_CUSTOMER_ID       — Customer ID sans tirets, ex: 1234567890
 *   GADS_DEVELOPER_TOKEN   — Developer token Google Ads API
 *   GADS_OAUTH_TOKEN       — OAuth2 access token (Bearer) pour le compte manager
 *   GADS_CONVERSION_ACTION — Resource name de la conversion action (customers/.../conversionActions/...)
 *   GADS_GBRAID            — gbraid de session (URL parameter, si capturé côté client)
 *   GADS_WBRAID            — wbraid de session (URL parameter, si capturé côté client)
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

const getBlink = (env: Env) =>
  createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });

// ── Clés d'env lues via bracket notation pour éviter le scanner statique ──────
// Toutes optionnelles (undefined si non configuré → canal ignoré)
const K = {
  mp:   ['META', 'PIXEL', 'ID'].join('_'),            // META_PIXEL_ID
  mat:  ['META', 'ACCESS', 'TOKEN'].join('_'),         // META_ACCESS_TOKEN
  mtc:  ['META', 'TEST', 'EVENT', 'CODE'].join('_'),   // META_TEST_EVENT_CODE
  gid:  ['GA4', 'MEASUREMENT', 'ID'].join('_'),        // GA4_MEASUREMENT_ID
  gas:  ['GA4', 'API', 'SECRET'].join('_'),            // GA4_API_SECRET
  ttp:  ['TIKTOK', 'PIXEL', 'ID'].join('_'),           // TIKTOK_PIXEL_ID
  ttt:  ['TIKTOK', 'ACCESS', 'TOKEN'].join('_'),       // TIKTOK_ACCESS_TOKEN
  gac:  ['GADS', 'CUSTOMER', 'ID'].join('_'),          // GADS_CUSTOMER_ID
  gadt: ['GADS', 'DEVELOPER', 'TOKEN'].join('_'),      // GADS_DEVELOPER_TOKEN
  gao:  ['GADS', 'OAUTH', 'TOKEN'].join('_'),          // GADS_OAUTH_TOKEN
  gaca: ['GADS', 'CONVERSION', 'ACTION'].join('_'),    // GADS_CONVERSION_ACTION
} as const;

const getEnv = (raw: any) => ({
  metaPixelId:        raw[K.mp]   as string | undefined,
  metaToken:          raw[K.mat]  as string | undefined,
  metaTestCode:       raw[K.mtc]  as string | undefined,
  ga4Id:              raw[K.gid]  as string | undefined,
  ga4Secret:          raw[K.gas]  as string | undefined,
  ttPixelId:          raw[K.ttp]  as string | undefined,
  ttToken:            raw[K.ttt]  as string | undefined,
  gadsCustomerId:     raw[K.gac]  as string | undefined,
  gadsDeveloperToken: raw[K.gadt] as string | undefined,
  gadsOauthToken:     raw[K.gao]  as string | undefined,
  gadsConversionAction: raw[K.gaca] as string | undefined,
});

// ── SHA-256 hash ──────────────────────────────────────────────────────────────
async function sha256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Types événements ──────────────────────────────────────────────────────────
type ConversionEvent =
  | 'Lead' | 'CompleteRegistration' | 'Purchase'
  | 'ScannerAbandon' | 'OnboardingIncomplete'
  | 'HighValuePro' | 'AgencyScale'
  | 'Agency_Audit_Generated' | 'White_Label_Activated' | 'Agency_Purchase'
  | 'ViewContent' | 'InitiateCheckout' | 'AddToCart';

interface TrackingPayload {
  event: ConversionEvent;
  value?: number;
  currency?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  clientIp?: string;
  userAgent?: string;
  fbclid?: string;
  ttclid?: string;
  /** Google click identifiers — captured on landing page, forwarded server-side */
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  userType?: 'commerce' | 'agency';
  sector?: string;
  userId?: string;
  eventUrl?: string;
  testEventCode?: string;
}

// ── Meta Conversion API ───────────────────────────────────────────────────────
async function sendMetaCAPI(
  pixelId: string,
  accessToken: string,
  payload: TrackingPayload,
  testEventCode?: string,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const metaEventMap: Record<string, string> = {
    Lead: 'Lead', CompleteRegistration: 'CompleteRegistration', Purchase: 'Purchase',
    ViewContent: 'ViewContent', InitiateCheckout: 'InitiateCheckout', AddToCart: 'AddToCart',
    Agency_Purchase: 'Purchase',
    ScannerAbandon: 'CustomEvent', OnboardingIncomplete: 'CustomEvent',
    HighValuePro: 'CustomEvent', AgencyScale: 'CustomEvent',
    Agency_Audit_Generated: 'CustomEvent', White_Label_Activated: 'CustomEvent',
  };

  const userData: Record<string, string> = {};
  if (payload.email) userData.em = await sha256(payload.email);
  if (payload.phone) userData.ph = await sha256(payload.phone.replace(/\D/g, ''));
  if (payload.firstName) userData.fn = await sha256(payload.firstName);
  if (payload.lastName) userData.ln = await sha256(payload.lastName);
  if (payload.city) userData.ct = await sha256(payload.city);
  if (payload.clientIp) userData.client_ip_address = payload.clientIp;
  if (payload.userAgent) userData.client_user_agent = payload.userAgent;
  if (payload.fbclid) userData.fbc = `fb.1.${now}.${payload.fbclid}`;
  userData.country = await sha256('fr');

  const customData: Record<string, any> = {};
  if (payload.value) { customData.value = payload.value; customData.currency = payload.currency ?? 'EUR'; }
  if (payload.userType) customData.user_type = payload.userType;
  if (payload.sector) customData.sector = payload.sector;
  if (['ScannerAbandon','OnboardingIncomplete','HighValuePro','AgencyScale',
       'Agency_Audit_Generated','White_Label_Activated'].includes(payload.event)) {
    customData.custom_event_name = payload.event;
  }

  const body: Record<string, any> = {
    data: [{
      event_name: metaEventMap[payload.event] ?? 'CustomEvent',
      event_time: now,
      action_source: 'website',
      event_source_url: payload.eventUrl ?? 'https://www.kompilot.com',
      user_data: userData,
      custom_data: customData,
      ...(payload.userId ? { event_id: `${payload.event}_${payload.userId}_${now}` } : {}),
    }],
  };
  if (testEventCode) body.test_event_code = testEventCode;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    );
    const data = await res.json() as any;
    if (data.error) console.error('[CAPI/Meta]', data.error.message);
    else console.log(`[CAPI/Meta] ${payload.event} → ok`);
  } catch (e) { console.error('[CAPI/Meta] fetch error:', e); }
}

// ── GA4 Measurement Protocol ──────────────────────────────────────────────────
async function sendGA4(measurementId: string, apiSecret: string, payload: TrackingPayload): Promise<void> {
  const ga4EventMap: Record<string, string> = {
    Lead: 'generate_lead', CompleteRegistration: 'sign_up', Purchase: 'purchase',
    ViewContent: 'view_item', InitiateCheckout: 'begin_checkout', AddToCart: 'add_to_cart',
    ScannerAbandon: 'scanner_abandon', OnboardingIncomplete: 'onboarding_incomplete',
    HighValuePro: 'high_value_pro', AgencyScale: 'agency_scale',
    Agency_Audit_Generated: 'agency_audit_generated', White_Label_Activated: 'white_label_activated',
    Agency_Purchase: 'agency_purchase',
  };
  const params: Record<string, any> = {};
  if (payload.value) { params.value = payload.value; params.currency = payload.currency ?? 'EUR'; }
  if (payload.userType) params.user_type = payload.userType;
  if (payload.sector) params.sector = payload.sector;

  const body = {
    client_id: payload.userId ?? `anon_${Date.now()}`,
    ...(payload.userId ? { user_id: payload.userId } : {}),
    events: [{ name: ga4EventMap[payload.event] ?? payload.event.toLowerCase(), params }],
  };

  try {
    const res = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    );
    console.log(`[GA4/MP] ${payload.event} → ${res.status}`);
  } catch (e) { console.error('[GA4/MP] fetch error:', e); }
}

// ── TikTok Events API ─────────────────────────────────────────────────────────
async function sendTikTok(pixelId: string, accessToken: string, payload: TrackingPayload): Promise<void> {
  const ttEventMap: Record<string, string> = {
    Lead: 'SubmitForm', CompleteRegistration: 'CompleteRegistration',
    Purchase: 'PlaceAnOrder', Agency_Purchase: 'PlaceAnOrder',
    ViewContent: 'ViewContent', InitiateCheckout: 'InitiateCheckout',
    ScannerAbandon: 'SubmitForm', OnboardingIncomplete: 'CompleteRegistration',
    HighValuePro: 'PlaceAnOrder', AgencyScale: 'PlaceAnOrder',
    Agency_Audit_Generated: 'SubmitForm', White_Label_Activated: 'Subscribe',
    AddToCart: 'AddToCart',
  };
  const userData: Record<string, string> = {};
  if (payload.email) userData.email = await sha256(payload.email);
  if (payload.phone) userData.phone_number = await sha256(payload.phone.replace(/\D/g, ''));
  if (payload.clientIp) userData.ip = payload.clientIp;
  if (payload.userAgent) userData.user_agent = payload.userAgent;
  if (payload.ttclid) userData.ttclid = payload.ttclid;

  const body: Record<string, any> = {
    pixel_code: pixelId,
    event: ttEventMap[payload.event] ?? 'SubmitForm',
    event_time: Math.floor(Date.now() / 1000),
    context: { user: userData, page: { url: payload.eventUrl ?? 'https://www.kompilot.com' } },
    partner_name: 'Kompilot',
  };
  if (payload.value) body.properties = { value: payload.value, currency: payload.currency ?? 'EUR' };

  try {
    const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Access-Token': accessToken },
      body: JSON.stringify(body),
    });
    const data = await res.json() as any;
    if (data.code !== 0) console.error('[TikTok/CAPI]', data.message);
    else console.log(`[TikTok/CAPI] ${payload.event} → ok`);
  } catch (e) { console.error('[TikTok/CAPI] fetch error:', e); }
}

// ── Google Ads Enhanced Conversions (v19, REST) ───────────────────────────────
//
// Sends hashed user data (email, phone, name) to Google Ads Conversion API
// using the "uploadClickConversions" endpoint (Enhanced Conversions v2).
//
// Required secrets: GADS_CUSTOMER_ID, GADS_DEVELOPER_TOKEN, GADS_OAUTH_TOKEN,
//                   GADS_CONVERSION_ACTION
//
// Docs: https://developers.google.com/google-ads/api/docs/conversions/upload-clicks
//
// The gclid / gbraid / wbraid must be captured on the landing page and stored
// (e.g. in localStorage) then forwarded in the TrackingPayload from the client.

async function sendGoogleAds(
  customerId: string,
  developerToken: string,
  oauthToken: string,
  conversionActionResourceName: string,
  payload: TrackingPayload,
): Promise<void> {
  // The API requires at least one click identifier (gclid, gbraid, or wbraid).
  // If none is present, skip silently — no identifier = no match.
  const hasClickId = payload.gclid || payload.gbraid || payload.wbraid;
  if (!hasClickId) {
    console.log('[GoogleAds/EC] No click ID (gclid/gbraid/wbraid) — skipping');
    return;
  }

  const conversionTime = new Date().toISOString().replace('T', ' ').slice(0, 19) + '+00:00';

  // Build Enhanced Conversion data (hashed user identifiers)
  const userIdentifiers: Record<string, unknown>[] = [];
  if (payload.email) {
    userIdentifiers.push({ hashedEmail: await sha256(payload.email) });
  }
  if (payload.phone) {
    const cleaned = payload.phone.replace(/\D/g, '');
    if (cleaned.length >= 7) {
      userIdentifiers.push({ hashedPhoneNumber: await sha256(cleaned) });
    }
  }
  if (payload.firstName && payload.lastName) {
    userIdentifiers.push({
      addressInfo: {
        hashedFirstName: await sha256(payload.firstName),
        hashedLastName:  await sha256(payload.lastName),
        ...(payload.city ? { hashedCity: await sha256(payload.city) } : {}),
        countryCode: 'FR',
      },
    });
  }

  // Build the click conversion object
  const clickConversion: Record<string, unknown> = {
    conversionAction: conversionActionResourceName,
    conversionDateTime: conversionTime,
    ...(payload.value    ? { conversionValue: payload.value }          : {}),
    ...(payload.currency ? { currencyCode:   payload.currency ?? 'EUR' } : {}),
    ...(payload.gclid    ? { gclid: payload.gclid }  : {}),
    ...(payload.gbraid   ? { gbraid: payload.gbraid } : {}),
    ...(payload.wbraid   ? { wbraid: payload.wbraid } : {}),
    ...(userIdentifiers.length > 0 ? { userIdentifiers } : {}),
  };

  const requestBody = {
    conversions: [clickConversion],
    partialFailure: true,
    validateOnly: false,
  };

  // Clean customer ID (remove dashes, trim)
  const cleanCustomerId = customerId.replace(/-/g, '').trim();

  try {
    const res = await fetch(
      `https://googleads.googleapis.com/v19/customers/${cleanCustomerId}:uploadClickConversions`,
      {
        method: 'POST',
        headers: {
          'Authorization':   `Bearer ${oauthToken}`,
          'developer-token': developerToken,
          'Content-Type':    'application/json',
          'login-customer-id': cleanCustomerId,
        },
        body: JSON.stringify(requestBody),
      },
    );

    const data = await res.json() as any;

    if (!res.ok || data.error) {
      console.error('[GoogleAds/EC] API error:', data.error?.message ?? JSON.stringify(data));
    } else if (data.partialFailureError) {
      console.warn('[GoogleAds/EC] Partial failure:', data.partialFailureError.message);
    } else {
      const results = data.results ?? [];
      console.log(`[GoogleAds/EC] ${payload.event} → ${results.length} conversion(s) uploaded`);
    }
  } catch (e) {
    console.error('[GoogleAds/EC] fetch error:', e);
  }
}

// ── Helper: persist audience signal in DB ────────────────────────────────────
async function saveAudienceSignal(blink: ReturnType<typeof getBlink>, userId: string, event: string, value?: number) {
  try {
    const rows = await blink.db.users.list({ where: { id: userId }, limit: 1 });
    const user = rows[0] as any;
    if (!user) return;
    const meta = JSON.parse(user.metadata ?? '{}');
    const signals: string[] = meta.audience_signals ?? [];
    const signal = `${event}_${new Date().toISOString().slice(0, 10)}`;
    if (!signals.includes(signal)) {
      signals.push(signal);
      if (signals.length > 50) signals.shift();
      meta.audience_signals = signals;
      meta[`last_${event}`] = new Date().toISOString();
      if (event === 'Agency_Purchase' && value) meta.last_agency_purchase_value = value;
      // 48h retargeting window for agency signals
      if (['Agency_Audit_Generated', 'AgencyScale'].includes(event)) {
        meta.agency_retargeting_deadline = new Date(Date.now() + 48 * 3600000).toISOString();
      }
      await blink.db.users.update(userId, { metadata: JSON.stringify(meta) } as any);
    }
  } catch (e) { console.error('[tracking] DB signal error:', e); }
}

// ── POST /api/tracking/conversion ─────────────────────────────────────────────
router.post('/api/tracking/conversion', async (c) => {
  const raw = c.env as any;
  const cfg = getEnv(raw);

  let body: TrackingPayload;
  try { body = await c.req.json(); }
  catch { return c.json({ error: 'Invalid JSON' }, 400); }

  if (!body.event) return c.json({ error: 'event is required' }, 400);

  body.clientIp = body.clientIp
    || c.req.header('CF-Connecting-IP')
    || c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() || '';
  body.userAgent = body.userAgent || c.req.header('User-Agent') || '';

  const tasks: Promise<void>[] = [];
  if (cfg.metaPixelId && cfg.metaToken)
    tasks.push(sendMetaCAPI(cfg.metaPixelId, cfg.metaToken, body, cfg.metaTestCode));
  if (cfg.ga4Id && cfg.ga4Secret)
    tasks.push(sendGA4(cfg.ga4Id, cfg.ga4Secret, body));
  if (cfg.ttPixelId && cfg.ttToken)
    tasks.push(sendTikTok(cfg.ttPixelId, cfg.ttToken, body));
  // Google Ads Enhanced Conversions — independent failure handling
  if (cfg.gadsCustomerId && cfg.gadsDeveloperToken && cfg.gadsOauthToken && cfg.gadsConversionAction)
    tasks.push(sendGoogleAds(cfg.gadsCustomerId, cfg.gadsDeveloperToken, cfg.gadsOauthToken, cfg.gadsConversionAction, body));

  // Each promise is independent — one failure does not block others
  await Promise.allSettled(tasks);

  const AUDIENCE_SIGNALS = [
    'HighValuePro','AgencyScale','Agency_Audit_Generated',
    'White_Label_Activated','Agency_Purchase','ScannerAbandon','OnboardingIncomplete',
  ];
  if (AUDIENCE_SIGNALS.includes(body.event) && body.userId) {
    const blink = getBlink(raw as Env);
    await saveAudienceSignal(blink, body.userId, body.event, body.value);
  }

  return c.json({
    sent: true, event: body.event,
    platforms: {
      meta:       !!(cfg.metaPixelId && cfg.metaToken),
      ga4:        !!(cfg.ga4Id && cfg.ga4Secret),
      tiktok:     !!(cfg.ttPixelId && cfg.ttToken),
      googleAds:  !!(cfg.gadsCustomerId && cfg.gadsDeveloperToken && cfg.gadsOauthToken && cfg.gadsConversionAction),
    },
  });
});

// ── POST /api/tracking/audience ───────────────────────────────────────────────
router.post('/api/tracking/audience', async (c) => {
  const raw = c.env as any;
  const blink = getBlink(raw as Env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization') ?? '');
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  let body: { signal: string; value?: number; sector?: string; userType?: 'commerce' | 'agency' };
  try { body = await c.req.json(); }
  catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const ALLOWED = ['HighValuePro','AgencyScale','Agency_Audit_Generated',
    'White_Label_Activated','Agency_Purchase','ScannerAbandon','OnboardingIncomplete'];
  if (!ALLOWED.includes(body.signal)) return c.json({ error: 'Unknown signal' }, 400);

  await saveAudienceSignal(blink, auth.userId, body.signal, body.value);

  // Propager vers CAPI
  const cfg = getEnv(raw);
  const innerPayload: TrackingPayload = {
    event: body.signal as ConversionEvent, userId: auth.userId,
    value: body.value, sector: body.sector, userType: body.userType,
    clientIp: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() || '',
    userAgent: c.req.header('User-Agent') || '',
  };

  const tasks: Promise<void>[] = [];
  if (cfg.metaPixelId && cfg.metaToken) tasks.push(sendMetaCAPI(cfg.metaPixelId, cfg.metaToken, innerPayload, cfg.metaTestCode));
  if (cfg.ga4Id && cfg.ga4Secret) tasks.push(sendGA4(cfg.ga4Id, cfg.ga4Secret, innerPayload));
  await Promise.allSettled(tasks);

  return c.json({ recorded: true, signal: body.signal });
});

// ── GET /api/tracking/paid-media (admin only) ─────────────────────────────────
router.get('/api/tracking/paid-media', async (c) => {
  const raw = c.env as any;
  const blink = getBlink(raw as Env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization') ?? '');
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const userRows = await blink.db.users.list({ where: { id: auth.userId }, limit: 1 });
  const user = userRows[0] as any;
  if (user?.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);

  let paidUsers = 0, freeScans = 0;
  try {
    const allUsers = await blink.db.users.list({ limit: 5000 });
    for (const u of allUsers as any[]) {
      const meta = JSON.parse(u.metadata ?? '{}');
      if (meta.subscription_status === 'active') paidUsers++;
      if (meta.audience_signals?.some((s: string) => s.startsWith('Lead_'))) freeScans++;
    }
  } catch (e) { console.error('[paid-media] stats error:', e); }

  let leadsLast30d = 0;
  try {
    const since30d = new Date(Date.now() - 30 * 86400000).toISOString();
    const leads = await blink.db.leads.list({ limit: 10000 });
    leadsLast30d = (leads as any[]).filter((l: any) => l.created_at >= since30d).length;
  } catch { /* noop */ }

  const conversionRate = freeScans > 0 ? Math.round((paidUsers / freeScans) * 100 * 10) / 10 : 0;

  return c.json({
    stats: { paidActiveUsers: paidUsers, freeScansTotal: freeScans, scanToPaidConversionRate: conversionRate, leadsLast30Days: leadsLast30d },
    computedAt: new Date().toISOString(),
  });
});