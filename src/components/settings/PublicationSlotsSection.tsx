import { useState } from 'react';
import { Button, toast } from '@blinkdotnew/ui';
import { Clock, Plus, Trash2, Save, CalendarClock } from 'lucide-react';
import { usePublicationSlots, type DayOfWeek, type PublicationSlot } from '../../context/PublicationSlotsContext';

const DAYS: { id: DayOfWeek; label: string; short: string }[] = [
  { id: 'lun', label: 'Lundi',    short: 'L' },
  { id: 'mar', label: 'Mardi',    short: 'M' },
  { id: 'mer', label: 'Mercredi', short: 'Me' },
  { id: 'jeu', label: 'Jeudi',    short: 'J' },
  { id: 'ven', label: 'Vendredi', short: 'V' },
  { id: 'sam', label: 'Samedi',   short: 'S' },
  { id: 'dim', label: 'Dimanche', short: 'D' },
];

const PRESET_TIMES = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

function SlotRow({
  slot,
  index,
  onRemove,
  onChange,
}: {
  slot: PublicationSlot;
  index: number;
  onRemove: () => void;
  onChange: (updated: PublicationSlot) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/60 last:border-0 group">
      <span className="text-xs text-muted-foreground w-4 shrink-0">{index + 1}</span>

      {/* Day buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        {DAYS.map(d => (
          <button
            key={d.id}
            type="button"
            onClick={() => onChange({ ...slot, day: d.id })}
            className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${
              slot.day === d.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-secondary'
            }`}
          >
            {d.short}
          </button>
        ))}
      </div>

      {/* Time select */}
      <div className="flex items-center gap-1.5 ml-auto">
        <Clock size={12} className="text-muted-foreground shrink-0" />
        <select
          value={slot.time}
          onChange={e => onChange({ ...slot, time: e.target.value })}
          className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {PRESET_TIMES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export function PublicationSlotsSection() {
  const { slots, setSlots } = usePublicationSlots();
  const [local, setLocal] = useState<PublicationSlot[]>(slots);
  const [dirty, setDirty] = useState(false);

  const handleAdd = () => {
    setLocal(prev => [...prev, { day: 'lun', time: '09:00' }]);
    setDirty(true);
  };

  const handleRemove = (i: number) => {
    setLocal(prev => prev.filter((_, idx) => idx !== i));
    setDirty(true);
  };

  const handleChange = (i: number, updated: PublicationSlot) => {
    setLocal(prev => prev.map((s, idx) => idx === i ? updated : s));
    setDirty(true);
  };

  const handleSave = () => {
    setSlots(local);
    setDirty(false);
    toast.success('Créneaux enregistrés !', {
      description: `${local.length} créneau${local.length > 1 ? 'x' : ''} de publication configuré${local.length > 1 ? 's' : ''}.`,
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <CalendarClock size={17} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">Mes créneaux de publication</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ces jours et heures seront utilisés par la file d'attente automatique.
            </p>
          </div>
        </div>
        {dirty && (
          <Button size="sm" onClick={handleSave} className="gap-1.5 h-8 text-xs">
            <Save size={12} /> Enregistrer
          </Button>
        )}
      </div>

      {/* Slots list */}
      <div className="px-5 py-3">
        {local.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CalendarClock size={28} className="mx-auto text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Aucun créneau défini.</p>
            <p className="text-xs text-muted-foreground">Ajoutez des créneaux pour utiliser la file d'attente automatique.</p>
          </div>
        ) : (
          <div>
            {local.map((slot, i) => (
              <SlotRow
                key={i}
                slot={slot}
                index={i}
                onRemove={() => handleRemove(i)}
                onChange={updated => handleChange(i, updated)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
        >
          <Plus size={13} /> Ajouter un créneau
        </button>
        {local.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            {local.length} créneau{local.length > 1 ? 'x' : ''} configuré{local.length > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
