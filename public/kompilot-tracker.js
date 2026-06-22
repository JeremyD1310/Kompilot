/**
 * Kompilot Server-Side Tracker — Lightweight Client Script
 * ─────────────────────────────────────────────────────────
 * Drop this script on any client website to forward conversion events
 * to the Kompilot Server-Side Tracking gateway (Meta CAPI + Google Ads
 * Enhanced Conversions + TikTok Events API — no adblocker bypass possible
 * on the client side, but the server sends hashed data directly to the APIs).
 *
 * Usage:
 *   <script src="https://your-domain.com/kompilot-tracker.js" async></script>
 *   <script>
 *     // Fire a conversion event
 *     KompilotTracker.track('Purchase', {
 *       email: 'user@example.com',
 *       phone: '+33612345678',
 *       value: 29.90,
 *       currency: 'EUR',
 *     });
 *   </script>
 *
 * No cookies. No localStorage writes. No PII stored on client.
 * All PII is SHA-256 hashed server-side before forwarding to ad platforms.
 *
 * Supported events: Lead, Purchase, CompleteRegistration, ViewContent,
 *                   InitiateCheckout, AddToCart, Agency_Purchase, ...
 */

(function (window) {
  'use strict';

  // ── Config — replace GATEWAY_URL with your backend domain ─────────────────
  const GATEWAY_URL = 'https://gbrhsehk.backend.blink.new/api/tracking/conversion';

  // ── Collect URL click IDs on page load ────────────────────────────────────
  // These must be collected immediately (URL params are cleaned by redirects).

  function getUrlParam(name) {
    try {
      return new URLSearchParams(window.location.search).get(name) || undefined;
    } catch { return undefined; }
  }

  const SESSION = {
    fbclid: getUrlParam('fbclid'),
    gclid:  getUrlParam('gclid'),
    gbraid: getUrlParam('gbraid'),
    wbraid: getUrlParam('wbraid'),
    ttclid: getUrlParam('ttclid'),
    eventUrl: window.location.href,
    userAgent: navigator.userAgent,
  };

  // ── Main track function ────────────────────────────────────────────────────

  /**
   * Track a conversion event.
   *
   * @param {string} eventName   - Event name (Lead, Purchase, CompleteRegistration, etc.)
   * @param {Object} [userData]  - Optional user data for Enhanced Conversions
   * @param {string} [userData.email]
   * @param {string} [userData.phone]
   * @param {string} [userData.firstName]
   * @param {string} [userData.lastName]
   * @param {string} [userData.city]
   * @param {number} [userData.value]        - Conversion value
   * @param {string} [userData.currency]     - ISO 4217 currency code (default EUR)
   * @param {string} [userData.userId]       - Your internal user ID (not PII)
   * @param {string} [userData.userType]     - 'commerce' | 'agency'
   * @param {string} [userData.sector]       - Business sector
   */
  function track(eventName, userData) {
    if (!eventName) { console.warn('[KompilotTracker] eventName is required'); return; }

    const payload = Object.assign(
      {},
      SESSION,
      { event: eventName },
      userData || {},
    );

    // Fire-and-forget — we don't block the page on the result.
    // Each platform's API call is independent server-side (one failing won't stop others).
    fetch(GATEWAY_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      // keepalive: true allows the request to outlive the page unload
      keepalive: true,
    })
    .then(function (res) {
      if (!res.ok) {
        console.warn('[KompilotTracker] Gateway returned ' + res.status);
        return;
      }
      return res.json();
    })
    .then(function (data) {
      if (data && window.KT_DEBUG) {
        console.log('[KompilotTracker] Event sent:', data);
      }
    })
    .catch(function (err) {
      console.warn('[KompilotTracker] Network error:', err.message);
    });
  }

  // ── Auto-fire ViewContent on page load ───────────────────────────────────
  // Uncomment if you want automatic page view tracking.
  //
  // if (document.readyState === 'loading') {
  //   document.addEventListener('DOMContentLoaded', function () { track('ViewContent'); });
  // } else {
  //   track('ViewContent');
  // }

  // ── Expose public API ─────────────────────────────────────────────────────

  window.KompilotTracker = { track: track };

  // ── Queue: fire any pre-loaded events (KT_QUEUE = [['Lead', {...}], ...]) ──
  var queue = window.KT_QUEUE || [];
  for (var i = 0; i < queue.length; i++) {
    track(queue[i][0], queue[i][1]);
  }
  window.KT_QUEUE = { push: function (args) { track(args[0], args[1]); } };

}(window));
