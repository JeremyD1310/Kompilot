/**
 * StaleDataBanner — Discrete warning shown when live API data is unavailable
 * and cached/saved data is being displayed instead.
 *
 * Design: subtle amber inline banner, not a full-page error.
 * Includes a "Réessayer" button to trigger a fresh fetch.
 */
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface StaleDataBannerProps {
  /** Age in fractional hours (e.g. 2.5 = "2h 30 min" ago) */
  staleAgeHours: number | null;
  /** Callback fired when user clicks "Réessayer" */
  onRetry?: () => void | Promise<void>;
  /** Optional CSS class override */
  className?: string;
  /** Show even if staleAgeHours is null */
  forceShow?: boolean;
}

function formatAge(hours: number | null): string {
  if (hours === null || hours <= 0) return 'il y a quelques instants';
  if (hours < 1) return `il y a ${Math.round(hours * 60)} min`;
  if (hours < 24) return `il y a ${Math.round(hours)} heure${hours >= 2 ? 's' : ''}`;
  const days = Math.round(hours / 24);
  return `il y a ${days} jour${days > 1 ? 's' : ''}`;
}

export function StaleDataBanner({
  staleAgeHours,
  onRetry,
  className = '',
  forceShow = false,
}: StaleDataBannerProps) {
  const [retrying, setRetrying] = useState(false);

  if (staleAgeHours === null && !forceShow) return null;

  const handleRetry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${className}`}
      style={{
        background: 'rgba(245,158,11,.08)',
        border: '1px solid rgba(245,158,11,.25)',
        color: '#92400E',
      }}
    >
      <AlertTriangle
        size={13}
        style={{ color: '#F59E0B', flexShrink: 0 }}
      />
      <span style={{ flex: 1, color: '#B45309', fontWeight: 500 }}>
        ⚠️ Affichage des données sauvegardées{' '}
        {staleAgeHours !== null && (
          <span style={{ fontWeight: 600 }}>{formatAge(staleAgeHours)}</span>
        )}
        {' '}— connexion aux APIs externe temporairement indisponible.
      </span>
      {onRetry && (
        <button
          onClick={handleRetry}
          disabled={retrying}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(245,158,11,.15)',
            border: '1px solid rgba(245,158,11,.35)',
            borderRadius: 6,
            padding: '3px 8px',
            color: '#92400E',
            fontWeight: 600,
            fontSize: '0.7rem',
            cursor: retrying ? 'not-allowed' : 'pointer',
            opacity: retrying ? 0.6 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          <RefreshCw size={10} style={{ animation: retrying ? 'spin 0.8s linear infinite' : 'none' }} />
          {retrying ? 'Actualisation…' : 'Réessayer'}
        </button>
      )}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </motion.div>
  );
}
