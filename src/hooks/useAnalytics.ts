/**
 * useAnalytics — GA4 event tracking hook
 *
 * Usage:
 *   const { trackEvent, trackPageView } = useAnalytics()
 *   trackEvent('post_scheduled', { channel: 'instagram', establishment_id: '...' })
 *
 * To activate GA4, replace the VITE_GA_MEASUREMENT_ID value in .env.local
 * with your Google Analytics 4 Measurement ID (e.g. G-XXXXXXXXXX).
 */

import { hasAnalyticsConsent } from '../lib/cookieConsent'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

const ALLOWED_EVENT_PARAMS = new Set([
  'page_path', 'page_title', 'send_to', 'value', 'currency',
  'content_category', 'user_type', 'channel', 'source', 'medium', 'campaign',
  'method', 'trial_days', 'profile_type', 'plan', 'billing_interval', 'source_page',
])

function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return
  if (!hasAnalyticsConsent()) return
  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag === 'function') {
    window.gtag(...args)
  }
}

function safeParams(params?: Record<string, string | number | boolean | undefined>) {
  return Object.fromEntries(
    Object.entries(params || {}).filter(([key, value]) =>
      ALLOWED_EVENT_PARAMS.has(key) && value !== undefined && typeof value !== 'object'
    )
  )
}

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-58L48L66DD';

export function trackPageView(path: string, title?: string) {
  const measurementId = MEASUREMENT_ID
  if (!measurementId) return

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
  const measurementId = MEASUREMENT_ID
  if (!measurementId) return

  gtag('event', eventName, {
    ...safeParams(params),
    send_to: measurementId,
  })
}

export function setUserProperties(_userId: string, properties?: Record<string, string>) {
  const measurementId = MEASUREMENT_ID
  if (!measurementId) return

  const safeProperties = Object.fromEntries(
    Object.entries(properties || {}).filter(([key, value]) =>
      ALLOWED_EVENT_PARAMS.has(key) && typeof value === 'string'
    )
  )
  gtag('set', 'user_properties', safeProperties)
}

/** Convenience hook — returns pre-bound tracking functions */
export function useAnalytics() {
  return { trackEvent, trackPageView, setUserProperties }
}
