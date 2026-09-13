/**
 * useAnalytics — GA4 event tracking hook
 *
 * Usage:
 *   const { trackEvent, trackPageView } = useAnalytics()
 *   trackEvent('post_scheduled', { channel: 'instagram', establishment_id: '...' })
 *
 * To activate GA4, replace the VITE_GA_MEASUREMENT_ID value in .env.local
 * with your own Google Analytics 4 Measurement ID (e.g. G-XXXXXXXXXX).
 */

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

function getMeasurementId(): string {
  return import.meta.env.VITE_GA_MEASUREMENT_ID || DEFAULT_MEASUREMENT_ID
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag === 'function') {
    window.gtag(...args)
  }
}

export function trackPageView(path: string, title?: string) {
  const measurementId = getMeasurementId()
  if (!hasAnalyticsConsent()) return

  gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    send_to: measurementId,
  })
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>
) {
  const measurementId = getMeasurementId()
  if (!hasAnalyticsConsent()) return

  gtag('event', eventName, {
    ...params,
    send_to: measurementId,
  })
}

export function setUserProperties(userId: string, properties?: Record<string, string>) {
  const measurementId = getMeasurementId()
  if (!hasAnalyticsConsent()) return

  gtag('set', 'user_properties', properties || {})
  gtag('config', measurementId, { user_id: userId })
}

/** Convenience hook — returns pre-bound tracking functions */
export function useAnalytics() {
  return { trackEvent, trackPageView, setUserProperties }
}
