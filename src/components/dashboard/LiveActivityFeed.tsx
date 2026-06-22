import { useState, useEffect, useRef } from 'react';
import {
  Star, MessageSquare, Eye, ThumbsUp, Share2, UserCheck,
  MapPin, TrendingUp, Bell, Zap, Download,
} from 'lucide-react';
import { toast } from '@blinkdotnew/ui';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActivityEvent {
  id: string;
  type: 'review' | 'message' | 'view' | 'like' | 'share' | 'follower' | 'mention' | 'alert';
  label: string;
  detail: string;
  platform: string;
  time: number; // epoch ms
  isNew?: boolean;
}

// ── Event generators ──────────────────────────────────────────────────────────

const PLATFORMS = ['Google', 'Instagram', 'Facebook', 'LinkedIn'];
const REVIEW_TEXTS = [
  'Super établissement, je recommande vivement !',
  'Service impeccable, personnel très aimable.',
  'Très bonne expérience, on reviendra.',
  'Rapport qualité-prix excellent !',
];
const MESSAGE_TEXTS = [
  'Bonjour, êtes-vous ouverts ce dimanche ?',
  'Je voudrais réserver pour 4 personnes...',
  'Quels sont vos horaires le samedi ?',
  'Avez-vous des offres pour les groupes ?',
];

function generateEvent(idx: number): ActivityEvent {
  const now = Date.now();
  const types: ActivityEvent['type'][] = ['review', 'message', 'view', 'like', 'share', 'follower', 'mention'];
  const type = types[idx % types.length];
  const platform = PLATFORMS[idx % PLATFORMS.length];

  const MAP: Record<ActivityEvent['type'], { label: string; detail: string }> = {
    review: {
      label: 'Nouvel avis Google',
      detail: REVIEW_TEXTS[idx % REVIEW_TEXTS.length],
    },
    message: {
      label: `Nouveau message ${platform}`,
      detail: MESSAGE_TEXTS[idx % MESSAGE_TEXTS.length],
    },
    view: {
      label: `+${50 + (idx % 30) * 3} vues`,
      detail: `Votre page ${platform} a été visitée`,
    },
    like: {
      label: `${12 + (idx % 8)} nouvelles réactions`,
      detail: `Sur votre dernier post ${platform}`,
    },
    share: {
      label: `Post partagé ${idx % 5 + 1} fois`,
      detail: `Via ${platform} — portée en hausse`,
    },
    follower: {
      label: `+${1 + (idx % 4)} abonné${idx % 4 > 0 ? 's' : ''}`,
      detail: `Nouveau${idx % 4 > 0 ? 'x' : ''} abonné${idx % 4 > 0 ? 's' : ''} ${platform}`,
    },
    mention: {
      label: 'Mention détectée',
      detail: `Votre établissement est mentionné sur ${platform}`,
    },
    alert: {
      label: 'Alerte réputation',
      detail: 'Nouveau commentaire négatif à traiter',
    },
  };

  return {
    id: `evt-${now}-${idx}`,
    type,
    platform,
    label: MAP[type].label,
    detail: MAP[type].detail,
    time: now - (idx * 90_000) + (Math.random() * 30_000),
    isNew: idx === 0,
  };
}

// ── Icon per type ─────────────────────────────────────────────────────────────

function ActivityIcon({ type }: { type: ActivityEvent['type'] }) {
  const MAP: Record<ActivityEvent['type'], { icon: React.ElementType; bg: string; color: string }> = {
    review:   { icon: Star,       bg: 'bg-amber-50 dark:bg-amber-950/20',   color: 'text-amber-500' },
    message:  { icon: MessageSquare, bg: 'bg-blue-50 dark:bg-blue-950/20',  color: 'text-blue-500' },
    view:     { icon: Eye,        bg: 'bg-primary/8',                        color: 'text-primary' },
    like:     { icon: ThumbsUp,   bg: 'bg-rose-50 dark:bg-rose-950/20',     color: 'text-rose-500' },
    share:    { icon: Share2,     bg: 'bg-violet-50 dark:bg-violet-950/20', color: 'text-violet-500' },
    follower: { icon: UserCheck,  bg: 'bg-emerald-50 dark:bg-emerald-950/20', color: 'text-emerald-500' },
    mention:  { icon: MapPin,     bg: 'bg-teal-50 dark:bg-teal-950/20',    color: 'text-teal-500' },
    alert:    { icon: Bell,       bg: 'bg-red-50 dark:bg-red-950/20',       color: 'text-red-500' },
  };
  const { icon: Icon, bg, color } = MAP[type];
  return (
    <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
      <Icon size={13} className={color} />
    </div>
  );
}

function timeAgo(ms: number): string {
  const diff = Math.max(0, Date.now() - ms);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  return `${Math.floor(m / 60)}h`;
}

// ── Main component ────────────────────────────────────────────────────────────

export function LiveActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>(() =>
    Array.from({ length: 8 }, (_, i) => generateEvent(i + 1))
  );
  const [newCount, setNewCount] = useState(0);
  const counterRef = useRef(10);
  const [tick, setTick] = useState(0);

  // Push a new event every ~12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const evt = generateEvent(counterRef.current++);
      setEvents(prev => [evt, ...prev.slice(0, 9)]);
      setNewCount(n => n + 1);
      setTick(t => t + 1);
    }, 12_000);
    // Also tick for timestamp updates
    const tickInterval = setInterval(() => setTick(t => t + 1), 30_000);
    return () => {
      clearInterval(interval);
      clearInterval(tickInterval);
    };
  }, []);

  const handleAcknowledge = () => setNewCount(0);

  const handleExportCSV = () => {
    const header = 'Date,Heure,Événement,Statut';
    const rows = events.map(evt => {
      const d = new Date(evt.time);
      const date = d.toLocaleDateString('fr-FR');
      const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const evenement = `"${evt.label.replace(/"/g, '""')} — ${evt.detail.replace(/"/g, '""')}"`;
      const statut = evt.platform;
      return `${date},${heure},${evenement},${statut}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kompilot-activite-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Activité exportée en CSV');
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap size={15} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Activité en temps réel</h3>
            <p className="text-[11px] text-muted-foreground">Interactions sur vos plateformes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {newCount > 0 && (
            <button
              onClick={handleAcknowledge}
              className="flex items-center gap-1.5 text-[10px] font-bold text-white bg-primary rounded-full px-2.5 py-1 hover:bg-primary/90 transition-colors"
            >
              {newCount} nouveau{newCount > 1 ? 'x' : ''}
            </button>
          )}
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="text-[10px] font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-1 transition-colors flex items-center gap-1"
          >
            <Download size={12} />
            CSV
          </button>
          {/* Live badge */}
          <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            Live
          </span>
        </div>
      </div>

      {/* Feed */}
      <div className="divide-y divide-border/60 max-h-[340px] overflow-y-auto">
        {events.map((evt, i) => (
          <div
            key={evt.id}
            className={`flex items-start gap-3 px-5 py-3 transition-all duration-500 ${
              i === 0 && evt.isNew
                ? 'bg-primary/5 animate-in'
                : 'hover:bg-muted/30'
            }`}
            style={i === 0 ? { animation: 'slideInFeed 0.4s ease-out' } : undefined}
          >
            <ActivityIcon type={evt.type} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-semibold text-foreground truncate">{evt.label}</p>
                <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                  {timeAgo(evt.time)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{evt.detail}</p>
              <span className="inline-block text-[9px] font-bold text-primary/70 bg-primary/8 rounded-full px-1.5 py-0.5 mt-1">
                {evt.platform}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <TrendingUp size={11} className="text-primary" />
            <strong className="text-foreground">+18%</strong> d'activité vs hier
          </span>
          <button className="text-[11px] font-semibold text-primary hover:underline">
            Voir tout l'historique →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInFeed {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
