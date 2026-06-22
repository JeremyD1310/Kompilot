import { cn } from '../../lib/utils';

interface SmartScheduleOptionProps {
  category: string;
  onScheduleNow: () => void;
  onScheduleSmart: () => void;
  onScheduleCustom: () => void;
  disabled?: boolean;
}

const PEAK_TIMES: Record<string, { day: string; hour: string }> = {
  Restaurant: { day: 'Jeudi', hour: '12h00' },
  Coiffeur: { day: 'Mercredi', hour: '10h00' },
  Boulangerie: { day: 'Samedi', hour: '08h30' },
  Spa: { day: 'Vendredi', hour: '18h00' },
  Fleuriste: { day: 'Dimanche', hour: '09h00' },
  default: { day: 'Mercredi', hour: '12h30' },
};

export function SmartScheduleOption({ category, onScheduleNow, onScheduleSmart, onScheduleCustom, disabled }: SmartScheduleOptionProps) {
  const peak = PEAK_TIMES[category] ?? PEAK_TIMES.default;

  return (
    <div className="grid grid-cols-1 gap-2">
      <button
        onClick={onScheduleNow}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all',
          'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        ⚡ Publier maintenant
      </button>

      <button
        onClick={onScheduleSmart}
        disabled={disabled}
        className={cn(
          'flex flex-col items-center gap-0.5 rounded-xl border-2 px-4 py-2.5 transition-all',
          'border-emerald-500 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="text-sm font-bold">
          🎯 Planifier à l'heure d'audience maximale
        </span>
        <span className="text-[11px] font-medium text-emerald-700">
          Recommandé : {peak.day} à {peak.hour}
        </span>
      </button>

      <button
        onClick={onScheduleCustom}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        📅 Choisir ma date et heure
      </button>
    </div>
  );
}
