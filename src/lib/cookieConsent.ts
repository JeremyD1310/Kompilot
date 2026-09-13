export const COOKIE_CONSENT_KEY = 'kompilot_cookie_consent';
export const COOKIE_PREFS_KEY = 'kompilot_cookie_prefs';
export const COOKIE_CONSENT_EVENT = 'kompilot:cookie-consent-changed';

export function hasAnalyticsConsent(): boolean {
  try {
    const state = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (state === 'accepted') return true;
    if (state !== 'custom') return false;
    const preferences = JSON.parse(localStorage.getItem(COOKIE_PREFS_KEY) || '{}');
    return preferences.analytics === true;
  } catch {
    return false;
  }
}

export function notifyConsentChanged(): void {
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT));
}
