/**
 * GoogleAnalyticsLoader
 *
 * Tracks page views and user identity for GA4 without using any
 * router hooks — avoids the useRouterState null-context crash.
 *
 * How to activate:
 *   1. Go to Google Analytics → Admin → Data Streams → your web stream
 *   2. Copy the Measurement ID (format: G-XXXXXXXXXX)
 *   3. Add  VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX  to your .env.local file
 *   4. Restart the dev server — GA4 will start receiving events
 */

import { useEffect, useRef } from 'react'
import { trackPageView, setUserProperties } from '../../hooks/useAnalytics'
import { useAuth } from '../../hooks/useAuth'

export function GoogleAnalyticsLoader() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
  const { user } = useAuth()
  const lastPath = useRef<string>('')

  // ── 1. Inject gtag.js script once ───────────────────────────────────────
  useEffect(() => {
    if (!measurementId) return
    if (document.getElementById('ga4-script')) return

    window.dataLayer = window.dataLayer || []
    window.gtag = function (...args: unknown[]) {
      window.dataLayer!.push(args)
    }
    window.gtag('js', new Date())
    window.gtag('config', measurementId, { send_page_view: false })

    const script = document.createElement('script')
    script.id = 'ga4-script'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.appendChild(script)
  }, [measurementId])

  // ── 2. Track page views via history events (no router hook) ─────────────
  useEffect(() => {
    if (!measurementId) return

    function sendView(path: string) {
      if (path === lastPath.current) return
      lastPath.current = path
      trackPageView(path)
      // Broadcast to the rest of the app (e.g. DashboardLayout active-link highlighting)
      window.dispatchEvent(new CustomEvent('nc:navigate', { detail: { path } }))
    }

    // Track the initial load
    sendView(window.location.pathname)

    // Patch pushState / replaceState to emit a custom event
    const origPush = history.pushState.bind(history)
    const origReplace = history.replaceState.bind(history)

    history.pushState = (...args) => {
      origPush(...args)
      sendView(window.location.pathname)
    }
    history.replaceState = (...args) => {
      origReplace(...args)
      sendView(window.location.pathname)
    }

    // Also handle browser back/forward
    const onPop = () => sendView(window.location.pathname)
    window.addEventListener('popstate', onPop)

    return () => {
      history.pushState = origPush
      history.replaceState = origReplace
      window.removeEventListener('popstate', onPop)
    }
  }, [measurementId])

  // ── 3. Identify user when they log in ───────────────────────────────────
  useEffect(() => {
    if (!measurementId || !user) return
    const domain = typeof user.email === 'string'
      ? user.email.split('@')[1] || 'unknown'
      : 'unknown'
    setUserProperties(user.id, { email_domain: domain })
  }, [measurementId, user?.id])

  return null
}
