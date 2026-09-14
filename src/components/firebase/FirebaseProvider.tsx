/**
 * FirebaseProvider — initializes consent-approved Firebase services on mount.
 * FCM is initialized only after the user explicitly enables notifications.
 */
import { useEffect, useState } from 'react';
import { getFirebaseAnalytics, getFirebaseFirestore, isFirebaseConfigured } from '../../firebase/client';
import { COOKIE_CONSENT_EVENT, hasAnalyticsConsent } from '../../lib/cookieConsent';

interface FirebaseProviderProps {
  children: React.ReactNode;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const [analyticsAllowed, setAnalyticsAllowed] = useState(hasAnalyticsConsent);

  useEffect(() => {
    const updateConsent = () => setAnalyticsAllowed(hasAnalyticsConsent());
    window.addEventListener(COOKIE_CONSENT_EVENT, updateConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, updateConsent);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured() || !analyticsAllowed) return;

    // Firebase Analytics and Firestore are opt-in on the public consent banner.
    getFirebaseAnalytics().catch(() => {});
    getFirebaseFirestore();
  }, [analyticsAllowed]);

  return <>{children}</>;
}
