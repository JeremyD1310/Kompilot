/**
 * ExternalApiOutageBanner — Persistent top-of-screen banner when Google/Meta/OpenAI are down.
 *
 * Listens to CustomEvents emitted by externalApiInterceptor.ts:
 *   - 'external-api-outage'         → shows banner for the affected partner
 *   - 'external-api-outage-cleared' → removes that partner from the banner
 *
 * The banner is:
 *   - Persistent (user cannot dismiss, auto-clears when partner recovers)
 *   - Stacks multiple partner outages in a single pill
 *   - Does NOT block the UI — dashboard continues working with cached/fallback data
 */

import { useState, useEffect, useCallback } from 'react';
import { WifiOff, X } from 'lucide-react';
import type { ExternalApiPartner, OutageEvent } from '../../lib/externalApiInterceptor';
import { getActiveOutages } from '../../lib/externalApiInterceptor';

const PARTNER_LABELS: Record<ExternalApiPartner, string> = {
  Google: 'Google',
  Meta: 'Meta (Facebook/Instagram)',
  OpenAI: 'OpenAI',
};

interface ActiveOutage {
  partner: ExternalApiPartner;
  detectedAt: string;
}

export function ExternalApiOutageBanner() {
  const [outages, setOutages] = useState<ActiveOutage[]>(() => {
    // Hydrate from interceptor memory on mount
    return getActiveOutages().map(p => ({
      partner: p,
      detectedAt: new Date().toISOString(),
    }));
  });
  // User-dismissed set (allows manually hiding a banner without clearing the outage flag)
  const [dismissed, setDismissed] = useState<Set<ExternalApiPartner>>(new Set());

  const handleOutage = useCallback((e: Event) => {
    const detail = (e as CustomEvent<OutageEvent>).detail;
    setOutages(prev => {
      if (prev.some(o => o.partner === detail.partner)) return prev;
      return [...prev, { partner: detail.partner, detectedAt: detail.detectedAt }];
    });
    // Re-show if user had dismissed this partner
    setDismissed(prev => {
      const next = new Set(prev);
      next.delete(detail.partner);
      return next;
    });
  }, []);

  const handleCleared = useCallback((e: Event) => {
    const { partner } = (e as CustomEvent<{ partner: ExternalApiPartner }>).detail;
    setOutages(prev => prev.filter(o => o.partner !== partner));
    setDismissed(prev => {
      const next = new Set(prev);
      next.delete(partner);
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('external-api-outage', handleOutage);
    window.addEventListener('external-api-outage-cleared', handleCleared);
    return () => {
      window.removeEventListener('external-api-outage', handleOutage);
      window.removeEventListener('external-api-outage-cleared', handleCleared);
    };
  }, [handleOutage, handleCleared]);

  const visible = outages.filter(o => !dismissed.has(o.partner));
  if (visible.length === 0) return null;

  const partnerNames = visible.map(o => PARTNER_LABELS[o.partner]);

  // Single partner — concise message
  // Multiple partners — combined message
  const partnerText =
    partnerNames.length === 1
      ? partnerNames[0]
      : partnerNames.slice(0, -1).join(', ') + ' et ' + partnerNames[partnerNames.length - 1];

  return (
    <div
      role="alert"
      aria-live="polite"
      className="relative z-50 flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/60"
    >
      {/* Icon */}
      <span className="shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
        <WifiOff size={12} className="text-amber-700 dark:text-amber-300" />
      </span>

      {/* Message */}
      <p className="flex-1 text-xs font-medium text-amber-900 dark:text-amber-200 leading-relaxed min-w-0">
        <span className="font-bold">⚠️ Les serveurs de {partnerText} rencontrent un ralentissement temporaire.</span>
        {' '}Vos automatisations restent actives et en attente de synchronisation.
      </p>

      {/* Partner badges */}
      <div className="hidden sm:flex items-center gap-1 shrink-0">
        {visible.map(o => (
          <span
            key={o.partner}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-800 dark:bg-amber-800/50 dark:text-amber-200 border border-amber-300 dark:border-amber-700/50"
          >
            {o.partner}
          </span>
        ))}
      </div>

      {/* Manual dismiss (per partner or all) */}
      <button
        onClick={() => setDismissed(new Set(visible.map(o => o.partner)))}
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-amber-500 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
        aria-label="Masquer l'alerte"
        title="Masquer jusqu'à la prochaine détection"
      >
        <X size={12} />
      </button>
    </div>
  );
}
