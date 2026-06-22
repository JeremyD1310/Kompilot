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
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
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
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (!measurementId) return

  gtag('event', eventName, {
    ...params,
    send_to: measurementId,
  })
}

export function setUserProperties(userId: string, properties?: Record<string, string>) {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (!measurementId) return

  gtag('set', 'user_properties', properties || {})
  gtag('config', measurementId, { user_id: userId })
}

/** Convenience hook — returns pre-bound tracking functions */
export function useAnalytics() {
  return { trackEvent, trackPageView, setUserProperties }
}
