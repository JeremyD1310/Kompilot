/** Hot-hours calendar selector for AntiNoShowShield */
import { Clock } from 'lucide-react';
import { DAYS, TIME_SLOTS, DEFAULT_HOT_SLOTS } from './antiNoShowData';
import { Toggle } from './AntiNoShowToggle';

interface Props {
  enabled: boolean;
  onToggleEnabled: (v: boolean) => void;
  hotSlots: Set<string>;
  onToggleSlot: (slot: string) => void;
  onReset: () => void;
}

export function AntiNoShowHotHours({ enabled, onToggleEnabled, hotSlots, onToggleSlot, onReset }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
            <Clock size={16} className="text-orange-500" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-foreground">📅 Heures à Fort Trafic (Heures Chaudes)</h3>
            <p className="text-xs text-muted-foreground">Appliquez le bouclier uniquement sur ces créneaux</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Mode heures chaudes</span>
          <Toggle checked={enabled} onChange={onToggleEnabled} />
        </div>
      </div>

      {/* Calendar grid */}
      <div className={`space-y-2 transition-opacity duration-200 ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        {/* Day headers */}
        <div className="grid gap-1" style={{ gridTemplateColumns: '44px repeat(7, 1fr)' }}>
          <div />
          {DAYS.map(d => (
            <div key={d} className={`text-center text-[10px] font-bold py-1 rounded-lg ${
              d === 'Sam' || d === 'Dim'
                ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-600'
                : 'text-muted-foreground'
            }`}>{d}</div>
          ))}
        </div>

        {/* Time rows */}
        {TIME_SLOTS.map(slot => (
          <div key={slot} className="grid gap-1" style={{ gridTemplateColumns: '44px repeat(7, 1fr)' }}>
            <div className="flex items-center justify-end pr-2">
              <span className="text-[10px] text-muted-foreground font-mono">{slot}</span>
            </div>
            {DAYS.map(day => {
              const key = `${day}-${slot}`;
              const isHot = hotSlots.has(key);
              const isWeekend = day === 'Sam' || day === 'Dim';
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggleSlot(key)}
                  title={`${day} ${slot} — ${isHot ? 'Désactiver' : 'Activer'}`}
                  className={`h-7 rounded-md border text-[9px] font-bold transition-all hover:scale-105 active:scale-95 ${
                    isHot
                      ? isWeekend
                        ? 'bg-orange-500 border-orange-400 text-white shadow-sm'
                        : 'bg-primary border-primary/80 text-white shadow-sm'
                      : 'bg-muted/50 border-border text-transparent hover:border-primary/40'
                  }`}
                >
                  {isHot ? '🛡' : ''}
                </button>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-3.5 h-3.5 rounded bg-primary inline-block" /> Actif (semaine)
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-3.5 h-3.5 rounded bg-orange-500 inline-block" /> Actif (weekend)
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-3.5 h-3.5 rounded bg-muted border border-border inline-block" /> Non protégé
          </span>
          <button
            type="button"
            onClick={onReset}
            className="ml-auto text-[11px] text-primary hover:underline"
          >
            Réinitialiser (IA)
          </button>
        </div>
      </div>

      {!enabled && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
          <Clock size={13} />
          Mode désactivé — le bouclier s'applique sur{' '}
          <strong className="text-foreground ml-1">tous les créneaux</strong>.
        </div>
      )}
    </div>
  );
}

export { DEFAULT_HOT_SLOTS };
