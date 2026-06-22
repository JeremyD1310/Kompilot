/**
 * useTracking — Hook React pour le tracking de conversions
 *
 * Expose :
 *   - track(event, opts)          → événement standard
 *   - trackAudienceSignal(signal) → signal avancé (HighValuePro, AgencyScale…)
 *   - utmParams                   → paramètres UTM actifs
 *   - sector                      → secteur détecté depuis utm_sector
 *   - userType                    → 'commerce' | 'agency' (depuis URL ou contexte)
 */
import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from './useAuth';
import {
  track as trackFn,
  trackAudience,
  captureUtmParams,
  getUtmSector,
  TrackingEvent,
  TrackingOptions,
} from '@/lib/tracking';
import { blink } from '@/blink/client';

export function useTracking() {
  const { user } = useAuth();
  const tokenRef = useRef<string | null>(null);

  // Capturer les UTM au montage
  const utmParams = useMemo(() => {
    try { return captureUtmParams(); } catch { return {}; }
  }, []);

  const sector    = utmParams.utm_sector || getUtmSector() || undefined;
  const userType: 'commerce' | 'agency' | undefined =
    (typeof window !== 'undefined' && window.location.href.includes('agency'))
      ? 'agency'
      : (utmParams.utm_source?.includes('agency') ? 'agency' : 'commerce');

  // Récupérer le token auth pour les appels audience
  useEffect(() => {
    if (!user) return;
    blink.auth.getValidToken().then(t => { if (t) tokenRef.current = `Bearer ${t}`; }).catch(() => {});
  }, [user]);

  /** Envoie un événement de conversion enrichi avec le contexte session */
  const track = async (event: TrackingEvent, opts: TrackingOptions = {}) => {
    await trackFn(event, {
      userId: user?.id,
      email: user?.email,
      sector,
      userType,
      fbclid: utmParams.fbclid,
      ttclid: utmParams.ttclid,
      ...opts,
    });
  };

  /** Envoie un signal d'audience avancé (requiert auth) */
  const trackAudienceSignal = async (signal: string, opts: { value?: number } = {}) => {
    if (!tokenRef.current) {
      try {
        const t = await blink.auth.getValidToken();
        if (t) tokenRef.current = `Bearer ${t}`;
      } catch { return; }
    }
    if (!tokenRef.current) return;
    await trackAudience(signal, tokenRef.current, { sector, userType, ...opts });
  };

  return { track, trackAudienceSignal, utmParams, sector, userType };
}
