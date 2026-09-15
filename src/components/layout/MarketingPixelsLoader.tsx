/**
 * MarketingPixelsLoader
 *
 * Injects Meta Pixel, TikTok Pixel and LinkedIn Insight Tag scripts
 * ONLY when the user has consented to marketing cookies via the CookieBanner.
 *
 * Consent logic mirrors CookieBanner:
 *   - "accepted" → marketing allowed
 *   - "custom" + prefs.marketing === true → marketing allowed
 *   - everything else → no marketing pixels
 *
 * Env vars required:
 *   VITE_META_PIXEL_ID      — Meta (Facebook) Pixel ID
 *   VITE_TIKTOK_PIXEL_ID    — TikTok Pixel ID
 *   VITE_LINKEDIN_PIXEL_ID  — LinkedIn Insight Tag Partner ID
 *
 * Script removal on consent revocation: removes injected <script> + <noscript>
 * elements and cleans up global objects (fbq, ttq, lintrk, _fbq, etc.).
 */

import { useEffect, useRef, useCallback } from 'react';
import { injectPixelScripts } from '../../lib/tracking';
import { isDemoRuntime } from '../../lib/demoDomain';

const CONSENT_KEY = 'kompilot_cookie_consent';
const PREFS_KEY = 'kompilot_cookie_prefs';
const INJECTED_MARKER = 'data-kompilot-marketing-pixel';

function hasMarketingConsent(): boolean {
  try {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent === 'accepted') return true;
    if (consent === 'custom') {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const prefs = JSON.parse(raw);
        return prefs.marketing === true;
      }
    }
  } catch {
    /* localStorage unavailable — default to no consent */
  }
  return false;
}

function removeAllMarketingPixels() {
  // Remove all script/noscript elements we injected
  document
    .querySelectorAll(`[${INJECTED_MARKER}]`)
    .forEach((el) => el.remove());

  // Clean up global pixel objects so they don't accumulate stale state
  const w = window as any;
  delete w.fbq;
  delete w._fbq;
  delete w.ttq;
  delete w.lintrk;
  delete w._linkedin_data_partner_ids;
  delete w._linkedin_partner_id;
  delete w.TiktokAnalyticsObject;
}

/**
 * Wraps injectPixelScripts so we can tag all injected elements with a
 * data attribute, enabling clean removal on consent revocation.
 */
function injectWithMarker(config: {
  metaPixelId?: string;
  tiktokPixelId?: string;
  linkedinPixelId?: string;
}) {
  const before = new Set(
    Array.from(document.querySelectorAll('script, noscript')),
  );

  injectPixelScripts(config);

  // Tag any newly-added script/noscript elements
  const after = document.querySelectorAll('script, noscript');
  after.forEach((el) => {
    if (!before.has(el)) {
      el.setAttribute(INJECTED_MARKER, '');
    }
  });
}

export function MarketingPixelsLoader() {
  const metaPixelId = import.meta.env.VITE_META_PIXEL_ID as string | undefined;
  const tiktokPixelId = import.meta.env.VITE_TIKTOK_PIXEL_ID as string | undefined;
  const linkedinPixelId = import.meta.env.VITE_LINKEDIN_PIXEL_ID as string | undefined;

  const hasAnyPixelId = !!(metaPixelId || tiktokPixelId || linkedinPixelId);
  const hasConsent = useRef(false);

  const sync = useCallback(() => {
    if (!hasAnyPixelId || isDemoRuntime()) {
      if (hasConsent.current) {
        removeAllMarketingPixels();
        hasConsent.current = false;
      }
      return;
    }

    const allowed = hasMarketingConsent();
    if (allowed && !hasConsent.current) {
      injectWithMarker({
        metaPixelId,
        tiktokPixelId,
        linkedinPixelId,
      });
      hasConsent.current = true;
    } else if (!allowed && hasConsent.current) {
      removeAllMarketingPixels();
      hasConsent.current = false;
    }
  }, [hasAnyPixelId, metaPixelId, tiktokPixelId, linkedinPixelId]);

  useEffect(() => {
    sync();

    const onConsentChanged = () => sync();
    window.addEventListener('kompilot:consent-changed', onConsentChanged);

    return () => {
      window.removeEventListener('kompilot:consent-changed', onConsentChanged);
      removeAllMarketingPixels();
      hasConsent.current = false;
    };
  }, [sync]);

  return null;
}
