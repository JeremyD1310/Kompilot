import { useState, useEffect, useMemo } from 'react';
import { X, CalendarPlus, Clock, AlignLeft, User, Send, Repeat, Info } from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { addDays, addWeeks, addMonths, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../../lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

export type EventChannel = 'sms' | 'email';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface RecurrenceConfig {
  type: RecurrenceType;
  interval: number;       // every N days/weeks/months
  occurrences: number;    // how many total sends (1 = no repeat)
}

export interface NewEventData {
  id: string;
  clientName: string;
  clientContact: string;
  date: string;            // yyyy-MM-dd (first occurrence)
  time: string;            // HH:mm
  channel: EventChannel;
  description: string;
  recurrence: RecurrenceConfig;
}

interface NewEventModalProps {
  open: boolean;
  initialDate?: string;   // yyyy-MM-dd — pre-fills the date field
  onClose: () => void;
  onSave: (event: NewEventData) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string; icon: string }[] = [
  { value: 'none',    label: 'Aucune',        icon: '🔂' },
  { value: 'daily',   label: 'Quotidienne',   icon: '📅' },
  { value: 'weekly',  label: 'Hebdomadaire',  icon: '🗓️' },
  { value: 'monthly', label: 'Mensuelle',     icon: '📆' },
];

const MAX_OCCURRENCES: Record<RecurrenceType, number> = {
  none:    1,
  daily:   30,
  weekly:  12,
  monthly: 12,
};

// ── Helper ────────────────────────────────────────────────────────────────────

/** Returns array of yyyy-MM-dd dates for all occurrences */
export function expandRecurrenceDates(
  startDate: string,
  recurrence: RecurrenceConfig,
): string[] {
  if (recurrence.type === 'none' || recurrence.occurrences <= 1) return [startDate];
  const base = new Date(startDate + 'T00:00:00');
  const dates: string[] = [];
  for (let i = 0; i < recurrence.occurrences; i++) {
    let d: Date;
    switch (recurrence.type) {
      case 'daily':   d = addDays(base,   i * recurrence.interval); break;
      case 'weekly':  d = addWeeks(base,  i * recurrence.interval); break;
      case 'monthly': d = addMonths(base, i * recurrence.interval); break;
      default:        d = base;
    }
    dates.push(format(d, 'yyyy-MM-dd'));
  }
  return dates;
}

// ── Recurrence summary label ──────────────────────────────────────────────────

function recurrenceSummary(cfg: RecurrenceConfig, startDate: string): string {
  if (cfg.type === 'none') return '';
  const dates = expandRecurrenceDates(startDate, cfg);
  const last = dates[dates.length - 1];
  const lastFmt = last
    ? format(new Date(last + 'T00:00:00'), 'd MMM yyyy', { locale: fr })
    : '';
  const freq =
    cfg.type === 'daily'   ? (cfg.interval === 1 ? 'tous les jours' : `tous les ${cfg.interval} jours`) :
    cfg.type === 'weekly'  ? (cfg.interval === 1 ? 'toutes les semaines' : `toutes les ${cfg.interval} semaines`) :
    cfg.type === 'monthly' ? (cfg.interval === 1 ? 'tous les mois' : `tous les ${cfg.interval} mois`) : '';
  return `${cfg.occurrences} envoi${cfg.occurrences > 1 ? 's' : ''} ${freq} — dernier le ${lastFmt}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NewEventModal({ open, initialDate, onClose, onSave }: NewEventModalProps) {
  const [clientName,    setClientName]    = useState('');
  const [clientContact, setClientContact] = useState('');
  const [date,          setDate]          = useState(initialDate ?? '');
  const [time,          setTime]          = useState('10:00');
  const [channel,       setChannel]       = useState<EventChannel>('email');
  const [description,   setDescription]   = useState('');
  const [errors,        setErrors]        = useState<Record<string, string>>({});

  // Recurrence
  const [recType,       setRecType]       = useState<RecurrenceType>('none');
  const [interval,      setInterval]      = useState(1);
  const [occurrences,   setOccurrences]   = useState(4);

  // Sync date when modal opens on a specific day
  useEffect(() => {
    if (open) {
      setDate(initialDate ?? '');
      setErrors({});
    }
  }, [open, initialDate]);

  // Reset form on close
  useEffect(() => {
    if (!open) {
      setClientName('');
      setClientContact('');
      setTime('10:00');
      setChannel('email');
      setDescription('');
      setErrors({});
      setRecType('none');
      setInterval(1);
      setOccurrences(4);
    }
  }, [open]);

  const recurrenceConfig: RecurrenceConfig = useMemo(() => ({
    type: recType,
    interval,
    occurrences: recType === 'none' ? 1 : occurrences,
  }), [recType, interval, occurrences]);

  const summary = useMemo(
    () => date ? recurrenceSummary(recurrenceConfig, date) : '',
    [recurrenceConfig, date],
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!clientName.trim()) e.clientName = 'Nom du client requis';
    if (!clientContact.trim()) e.clientContact = 'Contact requis';
    if (!date) e.date = 'Date requise';
    if (!time) e.time = 'Heure requise';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const totalOccurrences = recType === 'none' ? 1 : occurrences;
    onSave({
      id: Date.now().toString(),
      clientName: clientName.trim(),
      clientContact: clientContact.trim(),
      date,
      time,
      channel,
      description: description.trim(),
      recurrence: { type: recType, interval, occurrences: totalOccurrences },
    });
    const label = recType === 'none'
      ? `✅ Demande d'avis programmée pour ${clientName.trim()}`
      : `✅ ${totalOccurrences} envois programmés pour ${clientName.trim()}`;
    toast.success(label);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-card shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/20 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarPlus size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Nouvelle demande d'avis</p>
              <p className="text-[11px] text-muted-foreground">Programmer un envoi pour un client</p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X size={15} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

            {/* Client name */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <User size={12} className="text-muted-foreground" /> Nom du client
              </label>
              <input
                value={clientName}
                onChange={e => { setClientName(e.target.value); setErrors(p => ({ ...p, clientName: '' })); }}
                placeholder="ex : Marie Dupont"
                className={cn(
                  'w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow',
                  errors.clientName ? 'border-destructive' : 'border-border',
                )}
              />
              {errors.clientName && <p className="text-[11px] text-destructive">{errors.clientName}</p>}
            </div>

            {/* Channel + Contact */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Send size={12} className="text-muted-foreground" /> Canal & contact
              </label>
              <div className="flex gap-2">
                {(['email', 'sms'] as EventChannel[]).map(c => (
                  <button
                    key={c}
                    onClick={() => setChannel(c)}
                    className={cn(
                      'flex-1 rounded-xl border py-2 text-xs font-semibold transition-all',
                      channel === c
                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20'
                        : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/40',
                    )}
                  >
                    {c === 'email' ? '✉️ E-mail' : '📱 SMS'}
                  </button>
                ))}
              </div>
              <input
                value={clientContact}
                onChange={e => { setClientContact(e.target.value); setErrors(p => ({ ...p, clientContact: '' })); }}
                placeholder={channel === 'email' ? 'adresse@email.fr' : '06 XX XX XX XX'}
                type={channel === 'email' ? 'email' : 'tel'}
                className={cn(
                  'w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow',
                  errors.clientContact ? 'border-destructive' : 'border-border',
                )}
              />
              {errors.clientContact && <p className="text-[11px] text-destructive">{errors.clientContact}</p>}
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <CalendarPlus size={12} className="text-muted-foreground" />
                  {recType === 'none' ? "Date d'envoi" : '1er envoi'}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => { setDate(e.target.value); setErrors(p => ({ ...p, date: '' })); }}
                  className={cn(
                    'w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow',
                    errors.date ? 'border-destructive' : 'border-border',
                  )}
                />
                {errors.date && <p className="text-[11px] text-destructive">{errors.date}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Clock size={12} className="text-muted-foreground" /> Heure
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={e => { setTime(e.target.value); setErrors(p => ({ ...p, time: '' })); }}
                  className={cn(
                    'w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow',
                    errors.time ? 'border-destructive' : 'border-border',
                  )}
                />
                {errors.time && <p className="text-[11px] text-destructive">{errors.time}</p>}
              </div>
            </div>

            {/* ── Recurrence section ───────────────────────────────────── */}
            <div className="space-y-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Repeat size={12} className="text-primary" /> Récurrence
              </label>

              {/* Type selector */}
              <div className="grid grid-cols-4 gap-1.5">
                {RECURRENCE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRecType(opt.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border py-2.5 px-1 text-center transition-all',
                      recType === opt.value
                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20'
                        : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/40',
                    )}
                  >
                    <span className="text-base leading-none">{opt.icon}</span>
                    <span className="text-[10px] font-semibold leading-tight">{opt.label}</span>
                  </button>
                ))}
              </div>

              {/* Interval + Occurrences (only when recurrence is active) */}
              {recType !== 'none' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="grid grid-cols-2 gap-3">

                    {/* Interval */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Fréquence
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">Tous les</span>
                        <input
                          type="number"
                          min={1}
                          max={recType === 'daily' ? 30 : recType === 'weekly' ? 4 : 6}
                          value={interval}
                          onChange={e => setInterval(Math.max(1, +e.target.value))}
                          className="w-14 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <span className="text-xs text-muted-foreground shrink-0">
                          {recType === 'daily' ? 'jour(s)' : recType === 'weekly' ? 'sem.' : 'mois'}
                        </span>
                      </div>
                    </div>

                    {/* Occurrences */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Nb d'envois
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setOccurrences(o => Math.max(2, o - 1))}
                          className="w-7 h-7 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-bold text-sm"
                        >−</button>
                        <span className="w-8 text-center text-sm font-bold text-foreground tabular-nums">
                          {occurrences}
                        </span>
                        <button
                          onClick={() => setOccurrences(o => Math.min(MAX_OCCURRENCES[recType], o + 1))}
                          className="w-7 h-7 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-bold text-sm"
                        >+</button>
                      </div>
                    </div>
                  </div>

                  {/* Summary banner */}
                  {summary && (
                    <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                      <Info size={13} className="text-primary shrink-0 mt-0.5" />
                      <p className="text-[11px] text-primary leading-snug font-medium">{summary}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description (optional) */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <AlignLeft size={12} className="text-muted-foreground" />
                Note interne
                <span className="text-muted-foreground font-normal">(optionnel)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="ex : Client fidèle, passage suite à coupe + couleur"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-border bg-muted/10 shrink-0">
            <p className="text-[11px] text-muted-foreground">
              {recType !== 'none'
                ? `${occurrences} envoi${occurrences > 1 ? 's' : ''} seront créés`
                : '1 envoi unique'}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Annuler
              </button>
              <Button onClick={handleSave} className="gap-2 text-sm">
                <CalendarPlus size={14} />
                {recType !== 'none' ? `Créer ${occurrences} envoi${occurrences > 1 ? 's' : ''}` : 'Programmer l\'envoi'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
