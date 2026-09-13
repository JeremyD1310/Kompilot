/**
 * Loads GA4 only after explicit analytics consent.
 *
 * The measurement ID is public by design. The environment variable can
 * override the production fallback for previews and alternate deployments.
 */

import { useEffect, useRef, useState } from 'react'
import { trackPageView, setUserProperties } from '../../hooks/useAnalytics'
import { useAuth } from '../../hooks/useAuth'

const DEFAULT_MEASUREMENT_ID = 'G-58L48L66DD'
const CONSENT_KEY = 'kompilot_cookie_consent'
const PREFS_KEY = 'kompilot_cookie_prefs'

function hasAnalyticsConsent(): boolean {
  try {
    const consent = localStorage.getItem(CONSENT_KEY)
    if (consent === 'accepted') return true
    if (consent !== 'custom') return false

    const preferences = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')
    return preferences.analytics === true
  } catch {
    return false
  }
}

export function GoogleAnalyticsLoader() {
  const measurementId =
    (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) ||
    DEFAULT_MEASUREMENT_ID
  const { user } = useAuth()
  const [analyticsAllowed, setAnalyticsAllowed] = useState(hasAnalyticsConsent)
  const lastPath = useRef<string>('')

  // Keep consent state in sync with the cookie banner.
  useEffect(() => {
    const onConsentUpdated = () => setAnalyticsAllowed(hasAnalyticsConsent())
    window.addEventListener('kompilot:consent-updated', onConsentUpdated)
    window.addEventListener('storage', onConsentUpdated)
    return () => {
      window.removeEventListener('kompilot:consent-updated', onConsentUpdated)
      window.removeEventListener('storage', onConsentUpdated)
    }
  }, [])

  // Inject gtag.js only after consent; no Google Analytics request is made before it.
  useEffect(() => {
    if (!analyticsAllowed) return
    if (document.getElementById('ga4-script')) return

    window.dataLayer = window.dataLayer || []
    window.gtag = function (...args: unknown[]) {
      window.dataLayer!.push(args)
    }
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })
    window.gtag('js', new Date())
    window.gtag('config', measurementId, {
      send_page_view: false,
      anonymize_ip: true,
    })

    const script = document.createElement('script')
    script.id = 'ga4-script'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.appendChild(script)
  }, [analyticsAllowed, measurementId])

  // Track SPA page views after consent.
  useEffect(() => {
    if (!analyticsAllowed) return

    function sendView() {
      const path = window.location.pathname + window.location.search
      if (path === lastPath.current) return
      lastPath.current = path
      trackPageView(path)
      window.dispatchEvent(new CustomEvent('nc:navigate', {
        detail: { path: window.location.pathname },
      }))
    }

    sendView()

    const origPush = history.pushState.bind(history)
    const origReplace = history.replaceState.bind(history)

    history.pushState = (...args) => {
      origPush(...args)
      sendView()
    }
    history.replaceState = (...args) => {
      origReplace(...args)
      sendView()
    }

    window.addEventListener('popstate', sendView)
    return () => {
      history.pushState = origPush
      history.replaceState = origReplace
      window.removeEventListener('popstate', sendView)
    }
  }, [analyticsAllowed, measurementId])

  // Add pseudonymous user properties only after consent.
  useEffect(() => {
    if (!analyticsAllowed || !user) return
    const domain = typeof user.email === 'string'
      ? user.email.split('@')[1] || 'unknown'
      : 'unknown'
    setUserProperties(user.id, { email_domain: domain })
  }, [analyticsAllowed, measurementId, user?.id])

  return null
}
