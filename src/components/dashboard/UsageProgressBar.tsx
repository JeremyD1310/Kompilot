import { useCredits } from '../../context/CreditsContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { TrendingUp, Zap } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function UsageProgressBar() {
  const { usage, limit } = useCredits();
  const { currentPlan } = useSubscription();

  const percent = Math.min(100, Math.round((usage / limit) * 100));
  const remaining = Math.max(0, limit - usage);
  const isFull = usage >= limit;
  const isNearFull = percent >= 80 && !isFull;

  // Dynamic label per plan
  const limitLabel =
    currentPlan.id === 'expert'
      ? `${usage} / ${limit} contenus (Posts & Stories) utilisés ce mois-ci`
      : currentPlan.id === 'pro'
        ? `${usage} / ${limit} posts utilisés ce mois-ci`
        : `${usage} / ${limit} posts utilisés ce mois-ci`;

  // Bar color
  const barColor = isFull
    ? 'bg-red-500'
    : isNearFull
      ? 'bg-amber-500'
      : 'bg-primary';

  // Background
  const bgColor = isFull
    ? 'bg-red-50 border-red-200'
    : isNearFull
      ? 'bg-amber-50 border-amber-200'
      : 'bg-card border-border/60';

  return (
    <div className={`rounded-2xl border p-5 transition-colors duration-300 ${bgColor}`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className={isFull ? 'text-red-500' : isNearFull ? 'text-amber-600' : 'text-primary'} />
          <span className="text-sm font-semibold text-foreground">📈 Consommation de votre forfait ce mois-ci</span>
        </div>
        <span className={`text-xs font-bold rounded-full px-2.5 py-1 ${
          isFull
            ? 'bg-red-100 text-red-700 border border-red-200'
            : isNearFull
              ? 'bg-amber-100 text-amber-700 border border-amber-200'
              : 'bg-primary/10 text-primary border border-primary/20'
        }`}>
          Offre {currentPlan.name}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Labels */}
        <div className="flex items-center justify-between">
          <p className={`text-xs font-medium ${isFull ? 'text-red-600' : isNearFull ? 'text-amber-700' : 'text-muted-foreground'}`}>
            {limitLabel}
          </p>
          <p className={`text-xs font-bold tabular-nums ${isFull ? 'text-red-600' : isNearFull ? 'text-amber-600' : 'text-muted-foreground'}`}>
            {percent}%
          </p>
        </div>
      </div>

      {/* Action strip */}
      {isFull ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-red-100 border border-red-200 px-3 py-2.5">
          <span className="text-sm shrink-0">🚫</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-red-800">Limite mensuelle atteinte</p>
            <p className="text-[11px] text-red-600 leading-snug">Passez à l'offre supérieure pour continuer à publier.</p>
          </div>
          <Link
            to="/subscription"
            className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
          >
            <Zap size={11} /> Upgrader
          </Link>
        </div>
      ) : isNearFull ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
          <span className="text-sm shrink-0">⚠️</span>
          <p className="text-[11px] text-amber-700 flex-1 leading-snug">
            Plus que <strong>{remaining} {remaining > 1 ? 'publications' : 'publication'}</strong> disponible{remaining > 1 ? 's' : ''} ce mois-ci.
          </p>
          <Link to="/subscription" className="shrink-0 text-[11px] font-bold text-amber-800 hover:underline whitespace-nowrap">
            Voir les offres →
          </Link>
        </div>
      ) : currentPlan.id !== 'expert' ? (
        <p className="mt-2 text-[11px] text-muted-foreground/70 leading-snug">
          {currentPlan.id === 'free'
            ? 'Passez à Pro (19€/mois) pour 15 posts/mois, ou Expert (39€/mois) pour 30 contenus + Stories.'
            : 'Passez à Expert (39€/mois) pour 30 contenus/mois incluant les Stories Instagram & Facebook.'
          }
        </p>
      ) : (
        <p className="mt-2 text-[11px] text-muted-foreground/70 leading-snug">
          Inclut les posts classiques <strong>et</strong> les Stories Instagram & Facebook.
        </p>
      )}
    </div>
  );
}
