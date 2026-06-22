import { Button } from '@blinkdotnew/ui';

interface ReviewRaidDashboardAlertProps {
  onViewDetails: () => void;
  onDismiss: () => void;
}

export function ReviewRaidDashboardAlert({ onViewDetails, onDismiss }: ReviewRaidDashboardAlertProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/30 px-4 py-3 animate-pulse">
      <span className="text-lg shrink-0" role="img" aria-label="Alerte">🚨</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-red-800 dark:text-red-300">
          Activité suspecte détectée sur vos avis
        </p>
        <p className="text-xs text-red-600 dark:text-red-400">
          4 avis ≤ 2★ en moins de 24h — automatisation suspendue
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="destructive"
          onClick={onViewDetails}
          className="text-xs h-7 px-3 animate-none"
        >
          Voir les détails →
        </Button>
        <button
          type="button"
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 text-xs underline underline-offset-2 transition-colors animate-none"
          aria-label="Ignorer l'alerte"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
