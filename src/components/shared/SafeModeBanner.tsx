/**
 * SafeModeBanner — Inline notification shown when a component is using fallback/cached data.
 * Use this to inform users that results are optimised locally without blocking their navigation.
 */
import { AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SafeModeBannerProps {
  message?: string;
  cachedAt?: string | null;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export function SafeModeBanner({
  message = 'Analyse locale en cours d\'optimisation, vos résultats arrivent dans quelques instants…',
  cachedAt,
  onRetry,
  className,
  compact = false,
}: SafeModeBannerProps) {
  const cachedLabel = cachedAt
    ? `Données depuis ${new Date(cachedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    : null;

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/50 px-3 py-1.5',
        className,
      )}>
        <AlertTriangle size={12} className="text-amber-500 shrink-0" />
        <span className="text-[11px] text-amber-700 dark:text-amber-400 flex-1">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
          >
            <RefreshCw size={10} />
            Réessayer
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/50 px-4 py-3',
      className,
    )}>
      <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          Optimisation en cours
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
          {message}
        </p>
        {cachedLabel && (
          <p className="flex items-center gap-1 text-[10px] text-amber-600/70 dark:text-amber-500 mt-1">
            <Clock size={9} />
            {cachedLabel}
          </p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 shrink-0 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
        >
          <RefreshCw size={12} />
          Réessayer
        </button>
      )}
    </div>
  );
}
