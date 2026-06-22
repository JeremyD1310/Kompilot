import { useState, useMemo } from 'react';
import {
  addDays, format, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, isSameMonth, isToday,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Mail, MessageSquare, Star, Clock, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { NewEventModal, type NewEventData } from './NewEventModal';

// ── Types ──────────────────────────────────────────────────────────────────────

export type ReviewStatus = 'sent' | 'opened' | 'reviewed' | 'scheduled';
export type SendChannel = 'sms' | 'email';

export interface ReviewRecord {
  id: string;
  clientName: string;
  clientContact: string;
  sentAt: string; // "DD/MM/YYYY HHhMM"
  channel: SendChannel;
  status: ReviewStatus;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse "DD/MM/YYYY HHhMM" → Date (or null) */
function parseSentAt(sentAt: string): Date | null {
  const m = sentAt.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2})h(\d{2})/);
  if (!m) return null;
  return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
}

function toKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReviewStatus, { label: string; dot: string; pill: string; text: string; icon: React.ReactNode }> = {
  scheduled: {
    label: 'Programmé',
    dot: 'bg-violet-500',
    pill: 'bg-violet-50 border-violet-200',
    text: 'text-violet-700',
    icon: <Clock size={10} />,
  },
  sent: {
    label: 'Envoyé',
    dot: 'bg-blue-500',
    pill: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    icon: <Mail size={10} />,
  },
  opened: {
    label: 'Ouvert',
    dot: 'bg-amber-500',
    pill: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    icon: <Mail size={10} />,
  },
  reviewed: {
    label: 'Avis déposé',
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    icon: <Star size={10} />,
  },
};

const CHANNEL_ICON: Record<SendChannel, React.ReactNode> = {
  sms: <MessageSquare size={11} className="text-violet-600 shrink-0" />,
  email: <Mail size={11} className="text-sky-600 shrink-0" />,
};

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ── Sub-components ────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-t border-border bg-muted/10">
      {(Object.keys(STATUS_CONFIG) as ReviewStatus[]).map(s => {
        const cfg = STATUS_CONFIG[s];
        return (
          <div key={s} className="flex items-center gap-1.5">
            <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', cfg.dot)} />
            <span className="text-[11px] text-muted-foreground font-medium">{cfg.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function DayDetail({ date, records }: { date: string; records: ReviewRecord[] }) {
  if (!records.length) return null;
  const d = new Date(date + 'T00:00:00');
  return (
    <div className="border-t border-border bg-muted/10 px-4 py-3 space-y-2 animate-fade-in">
      <p className="text-xs font-bold text-foreground">
        📅 {format(d, 'EEEE d MMMM yyyy', { locale: fr })}
        <span className="ml-2 text-[11px] text-muted-foreground font-normal">
          — {records.length} envoi{records.length > 1 ? 's' : ''}
        </span>
      </p>
      <div className="space-y-1.5">
        {records.map(r => {
          const cfg = STATUS_CONFIG[r.status];
          const timeMatch = r.sentAt.match(/(\d{2}h\d{2})/);
          return (
            <div
              key={r.id}
              className={cn('flex items-center gap-2.5 rounded-xl border px-3 py-2', cfg.pill)}
            >
              <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
              <div className="flex items-center gap-1.5 shrink-0">{CHANNEL_ICON[r.channel]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight truncate">{r.clientName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{r.clientContact}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={cn('flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold', cfg.pill, cfg.text)}>
                  {cfg.icon} {cfg.label}
                </span>
                {timeMatch && (
                  <span className="text-[10px] text-muted-foreground font-mono">{timeMatch[1]}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ReviewCalendarProps {
  records: ReviewRecord[];
  onAddEvent?: (event: NewEventData) => void;
}

export function ReviewCalendar({ records, onAddEvent }: ReviewCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>(undefined);

  // Group records by yyyy-MM-dd key
  const recordsMap = useMemo(() => {
    const map: Record<string, ReviewRecord[]> = {};
    records.forEach(r => {
      const parsed = parseSentAt(r.sentAt);
      if (!parsed) return;
      const key = toKey(parsed);
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [records]);

  // Build calendar days grid (Mon–Sun)
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    const result: Date[] = [];
    let d = start;
    while (d <= end) { result.push(d); d = addDays(d, 1); }
    return result;
  }, [currentMonth]);

  const totalThisMonth = useMemo(() => {
    const monthKey = format(currentMonth, 'yyyy-MM');
    return records.filter(r => {
      const parsed = parseSentAt(r.sentAt);
      return parsed && toKey(parsed).startsWith(monthKey);
    });
  }, [records, currentMonth]);

  const reviewedThisMonth = totalThisMonth.filter(r => r.status === 'reviewed').length;
  const scheduledThisMonth = totalThisMonth.filter(r => r.status === 'scheduled').length;

  const prevMonth = () => {
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    setSelectedDate(null);
  };
  const nextMonth = () => {
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const openNewEvent = (date?: string) => {
    setModalInitialDate(date);
    setModalOpen(true);
  };

  const handleSaveEvent = (event: NewEventData) => {
    onAddEvent?.(event);
  };

  const selectedRecords = selectedDate ? (recordsMap[selectedDate] ?? []) : [];

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* ── Month navigation bar ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">

        {/* Prev month */}
        <button
          onClick={prevMonth}
          aria-label="Mois précédent"
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-background hover:bg-muted hover:border-primary/40 hover:text-primary text-muted-foreground transition-all duration-150 shadow-sm active:scale-95"
        >
          <ChevronLeft size={17} strokeWidth={2.2} />
        </button>

        {/* Month label + stats */}
        <div className="flex-1 text-center min-w-0">
          <p className="text-sm font-bold text-foreground capitalize leading-tight">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
            {totalThisMonth.length > 0 ? (
              <>
                {totalThisMonth.length} envoi{totalThisMonth.length > 1 ? 's' : ''}
                {reviewedThisMonth > 0 && (
                  <span className="text-emerald-600 font-semibold"> · {reviewedThisMonth} avis ✓</span>
                )}
                {scheduledThisMonth > 0 && (
                  <span className="text-violet-600 font-semibold"> · {scheduledThisMonth} programmé{scheduledThisMonth > 1 ? 's' : ''}</span>
                )}
              </>
            ) : (
              <span className="italic">Aucun envoi ce mois</span>
            )}
          </p>
        </div>

        {/* Today shortcut */}
        <button
          onClick={() => { setCurrentMonth(new Date()); setSelectedDate(null); }}
          aria-label="Revenir au mois actuel"
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-primary/5 hover:border-primary/40 hover:text-primary text-muted-foreground text-[11px] font-semibold transition-all duration-150 shadow-sm active:scale-95 shrink-0"
        >
          Aujourd'hui
        </button>

        {/* New event button */}
        <button
          onClick={() => openNewEvent(undefined)}
          aria-label="Nouvel envoi"
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary hover:text-primary-foreground hover:border-primary text-primary transition-all duration-150 shadow-sm active:scale-95 shrink-0"
          title="Programmer un nouvel envoi"
        >
          <Plus size={17} strokeWidth={2.2} />
        </button>

        {/* Next month */}
        <button
          onClick={nextMonth}
          aria-label="Mois suivant"
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-background hover:bg-muted hover:border-primary/40 hover:text-primary text-muted-foreground transition-all duration-150 shadow-sm active:scale-95"
        >
          <ChevronRight size={17} strokeWidth={2.2} />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/10">
        {WEEK_DAYS.map(d => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-border">
        {days.map((day, i) => {
          const key = toKey(day);
          const dayRecords = recordsMap[key] ?? [];
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const isSelected = selectedDate === key;
          const hasScheduled = dayRecords.some(r => r.status === 'scheduled');
          const hasReviewed = dayRecords.some(r => r.status === 'reviewed');

          return (
            <div
              key={i}
              onClick={() => {
                if (!inMonth) return;
                setSelectedDate(prev => prev === key ? null : key);
              }}
              className={cn(
                'relative min-h-[90px] p-1.5 transition-colors duration-100 group/cell',
                inMonth ? 'cursor-pointer hover:bg-secondary/50' : 'opacity-25 bg-muted/10 cursor-default',
                today && 'ring-2 ring-inset ring-primary/50',
                isSelected && inMonth && 'bg-primary/5 ring-2 ring-inset ring-primary',
                hasScheduled && inMonth && !isSelected && 'bg-violet-50/50',
                hasReviewed && inMonth && !isSelected && 'bg-emerald-50/30',
              )}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <div className={cn(
                  'w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold',
                  today ? 'bg-primary text-primary-foreground' : 'text-foreground',
                )}>
                  {format(day, 'd')}
                </div>
                {dayRecords.length > 0 && (
                  <span className="text-[9px] font-bold text-muted-foreground">
                    {dayRecords.length}
                  </span>
                )}
              </div>

              {/* Status dots */}
              {dayRecords.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {dayRecords.slice(0, 6).map(r => (
                    <span
                      key={r.id}
                      className={cn('w-2 h-2 rounded-full shrink-0', STATUS_CONFIG[r.status].dot)}
                      title={`${r.clientName} — ${STATUS_CONFIG[r.status].label}`}
                    />
                  ))}
                  {dayRecords.length > 6 && (
                    <span className="text-[8px] text-muted-foreground font-bold leading-none mt-0.5">
                      +{dayRecords.length - 6}
                    </span>
                  )}
                </div>
              )}

              {/* Mini labels (only on cells with few records to avoid overflow) */}
              {dayRecords.length === 1 && inMonth && (
                <p className="text-[9px] text-muted-foreground leading-tight mt-1 truncate">
                  {dayRecords[0].clientName}
                </p>
              )}

              {/* "+" hover button on each day cell */}
              {inMonth && (
                <button
                  onClick={e => { e.stopPropagation(); openNewEvent(key); }}
                  className="absolute bottom-1 right-1 opacity-0 group-hover/cell:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm"
                  title={`Programmer un envoi le ${format(day, 'd MMM', { locale: fr })}`}
                >
                  <Plus size={11} strokeWidth={2.5} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <DayDetail date={selectedDate} records={selectedRecords} />
      )}

      {/* Legend */}
      <Legend />

      {/* New event modal */}
      <NewEventModal
        open={modalOpen}
        initialDate={modalInitialDate}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEvent}
      />
    </div>
  );
}
