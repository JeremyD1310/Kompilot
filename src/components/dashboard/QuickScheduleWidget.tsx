import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, parseISO, isFuture, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CalendarDays, Clock, Send, Trash2, ChevronRight,
  Briefcase, Camera, Users, Globe, ChevronUp, ChevronDown,
} from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { useScheduledPosts, type PostChannel } from '../../lib/scheduledPostsStore';
import { Link } from '@tanstack/react-router';
import { useAuth } from '../../hooks/useAuth';

// ── Channel config ─────────────────────────────────────────────────────────────

interface ChannelConfig {
  id: PostChannel;
  label: string;
  icon: React.ReactNode;
  selectedClass: string;
  dotClass: string;
}

const CHANNELS: ChannelConfig[] = [
  {
    id: 'LinkedIn',
    label: 'LinkedIn',
    icon: <Briefcase size={13} />,
    selectedClass: 'bg-violet-600 text-white border-violet-600',
    dotClass: 'bg-violet-600',
  },
  {
    id: 'Instagram',
    label: 'Instagram',
    icon: <Camera size={13} />,
    selectedClass: 'bg-rose-500 text-white border-rose-500',
    dotClass: 'bg-rose-500',
  },
  {
    id: 'Facebook',
    label: 'Facebook',
    icon: <Users size={13} />,
    selectedClass: 'bg-blue-600 text-white border-blue-600',
    dotClass: 'bg-blue-600',
  },
  {
    id: 'Google',
    label: 'Google',
    icon: <Globe size={13} />,
    selectedClass: 'bg-orange-500 text-white border-orange-500',
    dotClass: 'bg-orange-500',
  },
];

const CHANNEL_DOT: Record<PostChannel, string> = {
  LinkedIn: 'bg-violet-600',
  Instagram: 'bg-rose-500',
  Facebook: 'bg-blue-600',
  Google: 'bg-orange-500',
};

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'Approuvé') {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-[10px] font-semibold px-2 py-0.5">
        Approuvé
      </span>
    );
  }
  if (status === 'Planifié') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-300 text-amber-700 text-[10px] font-semibold px-2 py-0.5">
        Planifié
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-muted border border-border text-muted-foreground text-[10px] font-semibold px-2 py-0.5">
      Brouillon
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFrenchDate(dateStr: string, timeStr: string): string {
  try {
    const d = parseISO(dateStr);
    const dayLabel = format(d, 'EEE. d MMM', { locale: fr });
    // Capitalize first letter, no trailing period after day abbrev
    const capitalized = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
    return `${capitalized} · ${timeStr}`;
  } catch {
    return `${dateStr} · ${timeStr}`;
  }
}

function tomorrowDate(): string {
  return format(addDays(new Date(), 1), 'yyyy-MM-dd');
}

// ── Main component ─────────────────────────────────────────────────────────────

export function QuickScheduleWidget() {
  const { user } = useAuth();
  const { posts, add, remove } = useScheduledPosts(user?.id);

  // ── Form state ──
  const [text, setText] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<PostChannel[]>([]);
  const [date, setDate] = useState(tomorrowDate);
  const [time, setTime] = useState('09:00');
  const [collapsed, setCollapsed] = useState(false);

  // ── Character count ──
  const charCount = text.length;
  const charClass =
    charCount >= 280
      ? 'text-red-500 font-bold'
      : charCount >= 200
      ? 'text-amber-500 font-semibold'
      : 'text-muted-foreground';

  // ── Upcoming posts (future or today, sorted ASC, max 5) ──
  const upcomingPosts = useMemo(() => {
    return posts
      .filter(p => {
        try {
          const d = parseISO(p.date);
          return isFuture(d) || isToday(d);
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const da = `${a.date}T${a.time}`;
        const db = `${b.date}T${b.time}`;
        return da < db ? -1 : da > db ? 1 : 0;
      })
      .slice(0, 5);
  }, [posts]);

  // ── Handlers ──

  function toggleChannel(ch: PostChannel) {
    setSelectedChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch],
    );
  }

  function handleSubmit() {
    if (!text.trim() || selectedChannels.length === 0) return;

    add({
      text: text.trim(),
      channels: selectedChannels,
      date,
      time,
      status: 'Planifié',
      platform: selectedChannels[0],
    });

    const displayDate = formatFrenchDate(date, time);
    toast.success(`Post planifié pour ${displayDate} ✓`);

    setText('');
    setSelectedChannels([]);
    setDate(tomorrowDate());
    setTime('09:00');
  }

  const canSubmit = text.trim().length > 0 && selectedChannels.length > 0;

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <CalendarDays size={16} className="text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground leading-tight">
              Planification rapide
            </h2>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              Composez et planifiez en quelques secondes
            </p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(v => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg px-2 py-1 hover:bg-muted"
        >
          {collapsed ? (
            <>
              Développer <ChevronDown size={13} />
            </>
          ) : (
            <>
              Réduire <ChevronUp size={13} />
            </>
          )}
        </button>
      </div>

      {/* ── Compose form ── */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="compose-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pt-4 pb-5 space-y-4">
              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Que souhaitez-vous partager aujourd'hui ?"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                />
                <span
                  className={`absolute bottom-2.5 right-3 text-[11px] tabular-nums ${charClass}`}
                >
                  {charCount}/280
                </span>
              </div>

              {/* Channel pills */}
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map(ch => {
                  const active = selectedChannels.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChannel(ch.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                        active
                          ? ch.selectedClass
                          : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {ch.icon}
                      {ch.label}
                    </button>
                  );
                })}
              </div>

              {/* Date + Time + Submit */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex items-center gap-2 flex-1 min-w-[140px]">
                  <CalendarDays size={14} className="text-muted-foreground absolute left-3 pointer-events-none" />
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                  />
                </div>
                <div className="relative flex items-center gap-2">
                  <Clock size={14} className="text-muted-foreground absolute left-3 pointer-events-none" />
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="rounded-xl border border-border bg-background pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 shadow-sm ${
                    canSubmit
                      ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90 active:scale-[0.98] cursor-pointer'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  <Send size={14} />
                  Planifier ce post
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upcoming posts ── */}
      <div className="border-t border-border/50">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              Prochaines publications
            </span>
            {upcomingPosts.length > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold w-5 h-5">
                {upcomingPosts.length}
              </span>
            )}
          </div>
        </div>

        {/* Post list */}
        <div className="px-3 pb-3 space-y-1.5 min-h-[56px]">
          <AnimatePresence mode="popLayout">
            {upcomingPosts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col items-center justify-center gap-1.5 py-6 text-center"
              >
                <CalendarDays size={28} className="text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  Aucune publication planifiée. Créez votre premier post ↑
                </p>
              </motion.div>
            ) : (
              upcomingPosts.map(post => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, x: -12, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 12, scale: 0.97 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="flex items-center gap-3 rounded-xl bg-muted/40 border border-border/40 px-3 py-2.5 group hover:bg-muted/70 transition-colors"
                >
                  {/* Channel dot */}
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      CHANNEL_DOT[post.channels[0]] ?? 'bg-muted-foreground'
                    }`}
                  />

                  {/* Channel pill */}
                  <span className="shrink-0 text-[10px] font-semibold text-muted-foreground bg-background border border-border rounded-full px-2 py-0.5">
                    {post.channels[0]}
                    {post.channels.length > 1 && ` +${post.channels.length - 1}`}
                  </span>

                  {/* Text */}
                  <span className="flex-1 min-w-0 text-xs text-foreground truncate" title={post.text}>
                    {post.text.length > 60 ? post.text.slice(0, 60) + '…' : post.text}
                  </span>

                  {/* Date + time */}
                  <span className="shrink-0 text-[11px] text-muted-foreground whitespace-nowrap hidden sm:block">
                    {formatFrenchDate(post.date, post.time)}
                  </span>

                  {/* Status badge */}
                  <div className="shrink-0">
                    <StatusBadge status={post.status} />
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => remove(post.id)}
                    title="Supprimer"
                    className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer link */}
        <div className="border-t border-border/40 px-5 py-2.5">
          <Link
            to="/calendar"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline transition-colors"
          >
            Voir le calendrier complet
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
