/**
 * PlausibleLoader
 *
 * Injects the Plausible Analytics script only if the VITE_PLAUSIBLE_DOMAIN
 * env var is set AND the user has consented to analytics cookies.
 *
 * How to activate:
 *   1. Add  VITE_PLAUSIBLE_DOMAIN=yourdomain.com  to your .env.local file
 *   2. The script is injected only after consent via the CookieBanner
 *
 * Consent logic mirrors CookieBanner:
 *   - "accepted" → analytics allowed
 *   - "custom" + prefs.analytics === true → analytics allowed
 *   - everything else → no analytics
 */

import { useEffect, useRef } from 'react'

const SCRIPT_ID = 'plausible-script'
const CONSENT_KEY = 'kompilot_cookie_consent'
const PREFS_KEY = 'kompilot_cookie_prefs'

function hasAnalyticsConsent(): boolean {
  try {
    const consent = localStorage.getItem(CONSENT_KEY)
    if (consent === 'accepted') return true
    if (consent === 'custom') {
      const raw = localStorage.getItem(PREFS_KEY)
      if (raw) {
        const prefs = JSON.parse(raw)
        return prefs.analytics === true
      }
    }
  } catch {
    // localStorage unavailable or JSON parse error — default to no consent
  }
  return false
}

function injectScript(domain: string) {
  if (document.getElementById(SCRIPT_ID)) return

  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.defer = true
  script.setAttribute('data-domain', domain)
  script.src = 'https://plausible.io/js/script.js'
  document.head.appendChild(script)
}

function removeScript() {
  const el = document.getElementById(SCRIPT_ID)
  if (el) el.remove()
}

export function PlausibleLoader() {
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined
  const hasConsent = useRef(false)

  // ── 1. Evaluate consent → inject or remove script ────────────────────────
  useEffect(() => {
    if (!domain) return

    function sync() {
      const allowed = hasAnalyticsConsent()
      if (allowed && !hasConsent.current) {
        injectScript(domain!)
        hasConsent.current = true
      } else if (!allowed && hasConsent.current) {
        removeScript()
        hasConsent.current = false
      }
    }

    sync()

    // ── 2. Listen for consent changes dispatched by CookieBanner ────────────
    const onConsentChanged = () => sync()
    window.addEventListener('kompilot:consent-changed', onConsentChanged)

    return () => {
      window.removeEventListener('kompilot:consent-changed', onConsentChanged)
      removeScript()
      hasConsent.current = false
    }
  }, [domain])

  return null
}
