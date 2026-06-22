/**
 * Client-Side Tracking — Kompilot
 *
 * Orchestre :
 *   - Pixel Meta (fbq) / GA4 (gtag) / TikTok Pixel (ttq) → côté navigateur
 *   - Appels Server-Side via /api/tracking/conversion       → backend sécurisé
 *
 * Utilisation :
 *   import { track } from '@/lib/tracking';
 *   track('Lead', { email: user.email, sector: 'beaute' });
 */

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'https://gbrhsehk.backend.blink.new';

// ── Types ─────────────────────────────────────────────────────────────────────
export type TrackingEvent =
  | 'Lead'
  | 'CompleteRegistration'
  | 'Purchase'
  | 'ScannerAbandon'
  | 'OnboardingIncomplete'
  | 'HighValuePro'
  | 'AgencyScale'
  | 'Agency_Audit_Generated'
  | 'White_Label_Activated'
  | 'Agency_Purchase'
  | 'ViewContent'
  | 'InitiateCheckout';

export interface TrackingOptions {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  value?: number;
  currency?: string;
  sector?: string;
  userType?: 'commerce' | 'agency';
  userId?: string;
  /** Pour la déduplication avec fbclid extrait de l'URL */
  fbclid?: string;
  ttclid?: string;
  eventUrl?: string;
}

// ── Helpers UTM / clid ────────────────────────────────────────────────────────
function getUrlParam(key: string): string | null {
  try {
    const sp = new URLSearchParams(window.location.search);
    return sp.get(key);
  } catch {
    return null;
  }
}

/** Persiste fbclid / ttclid dans sessionStorage pour les pages suivantes */
function persistClickIds(): void {
  const fbclid = getUrlParam('fbclid');
  const ttclid = getUrlParam('ttclid');
  const gclid  = getUrlParam('gclid');
  if (fbclid) sessionStorage.setItem('_fbclid', fbclid);
  if (ttclid) sessionStorage.setItem('_ttclid', ttclid);
  if (gclid)  sessionStorage.setItem('_gclid', gclid);
}

function getStoredParam(key: string): string | null {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

// ── Pixel helpers (window.fbq / window.gtag / window.ttq) ────────────────────
function fbq(event: string, data?: Record<string, any>): void {
  try {
    const w = window as any;
    if (typeof w.fbq === 'function') w.fbq('track', event, data ?? {});
  } catch { /* noop */ }
}

function gtag(event: string, data?: Record<string, any>): void {
  try {
    const w = window as any;
    if (typeof w.gtag === 'function') w.gtag('event', event, data ?? {});
  } catch { /* noop */ }
}

function ttq(event: string, data?: Record<string, any>): void {
  try {
    const w = window as any;
    if (typeof w.ttq !== 'undefined' && typeof w.ttq.track === 'function') {
      w.ttq.track(event, data ?? {});
    }
  } catch { /* noop */ }
}

// ── Mapping événements → noms pixels ─────────────────────────────────────────
const META_MAP: Record<TrackingEvent, string> = {
  Lead: 'Lead',
  CompleteRegistration: 'CompleteRegistration',
  Purchase: 'Purchase',
  ScannerAbandon: 'CustomEvent',
  OnboardingIncomplete: 'CustomEvent',
  HighValuePro: 'CustomEvent',
  AgencyScale: 'CustomEvent',
  Agency_Audit_Generated: 'CustomEvent',
  White_Label_Activated: 'CustomEvent',
  Agency_Purchase: 'Purchase',
  ViewContent: 'ViewContent',
  InitiateCheckout: 'InitiateCheckout',
};

const GA4_MAP: Record<TrackingEvent, string> = {
  Lead: 'generate_lead',
  CompleteRegistration: 'sign_up',
  Purchase: 'purchase',
  ScannerAbandon: 'scanner_abandon',
  OnboardingIncomplete: 'onboarding_incomplete',
  HighValuePro: 'high_value_pro',
  AgencyScale: 'agency_scale',
  Agency_Audit_Generated: 'agency_audit_generated',
  White_Label_Activated: 'white_label_activated',
  Agency_Purchase: 'agency_purchase',
  ViewContent: 'view_item',
  InitiateCheckout: 'begin_checkout',
};

const TIKTOK_MAP: Record<TrackingEvent, string> = {
  Lead: 'SubmitForm',
  CompleteRegistration: 'CompleteRegistration',
  Purchase: 'PlaceAnOrder',
  ScannerAbandon: 'SubmitForm',
  OnboardingIncomplete: 'CompleteRegistration',
  HighValuePro: 'PlaceAnOrder',
  AgencyScale: 'PlaceAnOrder',
  Agency_Audit_Generated: 'SubmitForm',
  White_Label_Activated: 'Subscribe',
  Agency_Purchase: 'PlaceAnOrder',
  ViewContent: 'ViewContent',
  InitiateCheckout: 'InitiateCheckout',
};

// ── Fonction principale ───────────────────────────────────────────────────────
/**
 * Envoie un événement de conversion sur TOUS les canaux :
 *   1. Pixels client-side (fbq / gtag / ttq)
 *   2. Server-Side via /api/tracking/conversion (données PII hachées backend)
 */
export async function track(event: TrackingEvent, opts: TrackingOptions = {}): Promise<void> {
  // Persister click ids à chaque call (au cas où on serait sur la 1ère page)
  persistClickIds();

  const fbclid = opts.fbclid || getUrlParam('fbclid') || getStoredParam('_fbclid') || undefined;
  const ttclid = opts.ttclid || getUrlParam('ttclid') || getStoredParam('_ttclid') || undefined;

  // 1. Pixels client-side (ne contiennent PAS d'email/téléphone en clair)
  const pixelData = {
    ...(opts.value !== undefined ? { value: opts.value, currency: opts.currency ?? 'EUR' } : {}),
    ...(opts.sector ? { content_category: opts.sector } : {}),
    ...(opts.userType ? { user_type: opts.userType } : {}),
  };

  fbq(META_MAP[event], pixelData);
  gtag(GA4_MAP[event], { ...pixelData, ...(opts.userId ? { user_id: opts.userId } : {}) });
  ttq(TIKTOK_MAP[event], pixelData);

  // 2. Server-Side (données PII envoyées au backend sécurisé qui hash avant CAPI)
  try {
    await fetch(`${BACKEND_URL}/api/tracking/conversion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        ...opts,
        fbclid,
        ttclid,
        eventUrl: window.location.href,
      }),
    });
  } catch (e) {
    // Non-fatal : le pixel client-side a déjà été déclenché
    console.warn('[tracking] server-side call failed (non-fatal):', e);
  }
}

// ── trackAudience — signal d'audience avancé (authentifié) ───────────────────
export async function trackAudience(
  signal: string,
  authToken: string,
  opts: { value?: number; sector?: string; userType?: 'commerce' | 'agency' } = {},
): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/api/tracking/audience`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authToken,
      },
      body: JSON.stringify({ signal, ...opts }),
    });
  } catch (e) {
    console.warn('[tracking/audience] call failed:', e);
  }
}

// ── UTM sector detection ──────────────────────────────────────────────────────
export function getUtmSector(): string | null {
  return getUrlParam('utm_sector') || getStoredParam('_utm_sector');
}

export function getUtmSource(): string | null {
  return getUrlParam('utm_source') || getStoredParam('_utm_source');
}

export function getUtmCampaign(): string | null {
  return getUrlParam('utm_campaign') || getStoredParam('_utm_campaign');
}

/** Persiste tous les paramètres UTM pour la durée de la session */
export function captureUtmParams(): Record<string, string> {
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_sector'];
  const captured: Record<string, string> = {};
  const sp = new URLSearchParams(window.location.search);

  for (const key of utmKeys) {
    const val = sp.get(key);
    if (val) {
      sessionStorage.setItem(`_${key}`, val);
      captured[key] = val;
    } else {
      const stored = sessionStorage.getItem(`_${key}`);
      if (stored) captured[key] = stored;
    }
  }

  // fbclid / ttclid / gclid
  persistClickIds();
  const fbclid = getUrlParam('fbclid') || getStoredParam('_fbclid');
  const ttclid = getUrlParam('ttclid') || getStoredParam('_ttclid');
  const gclid  = getUrlParam('gclid')  || getStoredParam('_gclid');
  if (fbclid) captured.fbclid = fbclid;
  if (ttclid) captured.ttclid = ttclid;
  if (gclid)  captured.gclid  = gclid;

  return captured;
}

// ── Bot / click fraud detection ───────────────────────────────────────────────
const BOT_SIGNALS = {
  ipCounts: new Map<string, { count: number; firstSeen: number }>(),
};

export function isLikelySuspiciousBot(): boolean {
  try {
    const w = window as any;
    // Détection des bots connus par User-Agent
    const ua = navigator.userAgent.toLowerCase();
    const botPatterns = [
      'bot', 'crawler', 'spider', 'headless', 'phantomjs', 'selenium',
      'puppeteer', 'playwright', 'curl', 'wget', 'python-requests',
    ];
    if (botPatterns.some(p => ua.includes(p))) return true;

    // Vérifier si webdriver est exposé (ex: Selenium)
    if (w.navigator?.webdriver === true) return true;

    // Pas de plugins = potentiellement headless
    if (navigator.plugins?.length === 0 && navigator.languages?.length === 0) return true;

    return false;
  } catch {
    return false;
  }
}

/** Rate-limit côté client (bucket local par session) */
export function checkScanRateClientSide(): boolean {
  try {
    const key = '_scan_rate';
    const now = Date.now();
    const raw = sessionStorage.getItem(key);
    const bucket = raw ? JSON.parse(raw) : { count: 0, windowStart: now };

    // Fenêtre de 10 minutes
    if (now - bucket.windowStart > 10 * 60 * 1000) {
      bucket.count = 0;
      bucket.windowStart = now;
    }

    bucket.count += 1;
    sessionStorage.setItem(key, JSON.stringify(bucket));

    // Plus de 15 scans en 10 min = suspect
    return bucket.count <= 15;
  } catch {
    return true;
  }
}

// ── Injection des scripts pixels ──────────────────────────────────────────────
/**
 * À appeler UNE FOIS au montage de l'app (App.tsx ou main.tsx).
 * Injecte les scripts Meta Pixel, GA4 et TikTok Pixel de manière asynchrone.
 */
export function injectPixelScripts(config: {
  metaPixelId?: string;
  ga4MeasurementId?: string;
  tiktokPixelId?: string;
}): void {
  const { metaPixelId, ga4MeasurementId, tiktokPixelId } = config;

  // ── Meta Pixel ──
  if (metaPixelId && !(window as any).fbq) {
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${metaPixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    // Noscript fallback
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1"/>`;
    document.head.appendChild(noscript);
  }

  // ── Google Analytics 4 ──
  if (ga4MeasurementId && !(window as any).gtag) {
    const script1 = document.createElement('script');
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`;
    script1.async = true;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${ga4MeasurementId}', { send_page_view: true });
    `;
    document.head.appendChild(script2);
  }

  // ── TikTok Pixel ──
  if (tiktokPixelId && !(window as any).ttq) {
    const script = document.createElement('script');
    script.innerHTML = `
      !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
      ttq.load('${tiktokPixelId}');
      ttq.page();
    }(window, document, 'ttq');
    `;
    document.head.appendChild(script);
  }

  // Pixels injected silently in production
}

// Export des utilitaires séparés pour les hooks
export { getUrlParam };
