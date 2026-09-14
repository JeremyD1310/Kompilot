/**
 * HotjarLoader (+ Contentsquare)
 *
 * Injects the Hotjar + Contentsquare tracking scripts only if the
 * VITE_HOTJAR_ID env var is set AND the user has consented to analytics
 * cookies via the CookieBanner. Contentsquare uses the same Site ID since
 * Hotjar was acquired by Contentsquare.
 *
 * How to activate:
 *   1. Get your Site ID (hjid) from Hotjar → Settings → Sites & Organizations
 *   2. Add  VITE_HOTJAR_ID=6ef7682832d7e  to your .env.local file (or set as secret)
 *   3. Scripts are injected only after consent via the CookieBanner
 *
 * Consent logic mirrors CookieBanner:
 *   - "accepted" → analytics allowed
 *   - "custom" + prefs.analytics === true → analytics allowed
 *   - everything else → no tracking
 *
 * Script removal on consent revocation: removes injected <script> elements
 * and cleans up global Hotjar objects (hj, _hjSettings, hjBootstrap, etc.).
 */

import { useEffect, useRef } from 'react';

const SCRIPT_ID = 'hotjar-script';
const CS_SCRIPT_ID = 'contentsquare-script';
const CONSENT_KEY = 'kompilot_cookie_consent';
const PREFS_KEY = 'kompilot_cookie_prefs';

function hasAnalyticsConsent(): boolean {
  try {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent === 'accepted') return true;
    if (consent === 'custom') {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const prefs = JSON.parse(raw);
        return prefs.analytics === true;
      }
    }
  } catch {
    /* localStorage unavailable — default to no consent */
  }
  return false;
}

function injectScript(hjid: number, hjsv: number = 6) {
  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.async = true;
  script.innerHTML = `
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${hjid},hjsv:${hjsv}};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
  `;
  document.head.appendChild(script);
}

function injectContentsquare(hjid: number) {
  if (document.getElementById(CS_SCRIPT_ID)) return;

  const script = document.createElement('script');
  script.id = CS_SCRIPT_ID;
  script.async = true;
  script.src = `https://t.contentsquare.net/uxa/${hjid}.js`;
  document.head.appendChild(script);
}

function removeScript() {
  const hotjarEl = document.getElementById(SCRIPT_ID);
  if (hotjarEl) hotjarEl.remove();

  const csEl = document.getElementById(CS_SCRIPT_ID);
  if (csEl) csEl.remove();

  // Clean up global Hotjar objects
  const w = window as any;
  delete w.hj;
  delete w._hjSettings;
  delete w.hjBootstrap;
}

export function HotjarLoader() {
  const hotjarIdRaw = import.meta.env.VITE_HOTJAR_ID as string | undefined;
  const hjid = hotjarIdRaw ? parseInt(hotjarIdRaw, 10) : NaN;
  const isValid = !isNaN(hjid) && hjid > 0;
  const hasConsent = useRef(false);

  useEffect(() => {
    if (!isValid) return;

    function sync() {
      const allowed = hasAnalyticsConsent();
      if (allowed && !hasConsent.current) {
        injectScript(hjid);
        injectContentsquare(hjid);
        hasConsent.current = true;
      } else if (!allowed && hasConsent.current) {
        removeScript();
        hasConsent.current = false;
      }
    }

    sync();

    // Listen for consent changes dispatched by CookieBanner
    const onConsentChanged = () => sync();
    window.addEventListener('kompilot:consent-changed', onConsentChanged);

    return () => {
      window.removeEventListener('kompilot:consent-changed', onConsentChanged);
      removeScript();
      hasConsent.current = false;
    };
  }, [isValid, hjid]);

  return null;
}
