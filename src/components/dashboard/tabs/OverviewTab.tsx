import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Clock, CalendarDays, ArrowRight, ChevronRight, ChevronDown } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { LocalVisibilityWidget, buildDemoVisibilityData } from '../../gmaps/LocalVisibilityWidget';
import { format, parseISO, isFuture, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEstablishment } from '../../../context/EstablishmentContext';
import { useScheduledPosts } from '../../../lib/scheduledPostsStore';
import { KPIStripSkeleton } from '../DashboardSkeletons';

// ── Urgency Banner ─────────────────────────────────────────────────────────────

interface UrgencyBannerProps {
  tokenExpired: boolean;
  onReconnect: () => void;
  onDismissToken: () => void;
}

export function UrgencyBanner({ tokenExpired, onReconnect, onDismissToken }: UrgencyBannerProps) {
  const { activeEstablishment } = useEstablishment();
  const totalReviews = activeEstablishment.pendingReviews;
  const totalMessages = activeEstablishment.pendingMessages;
  const alerts = [];

  if (totalReviews > 0) alerts.push({ icon: '⭐', text: `${totalReviews} avis Google en attente de réponse`, href: '/inbox', cta: 'Répondre' });
  if (totalMessages > 0) alerts.push({ icon: '💬', text: `${totalMessages} message${totalMessages > 1 ? 's' : ''} non lu${totalMessages > 1 ? 's' : ''}`, href: '/inbox', cta: 'Voir' });
  if (tokenExpired) alerts.push({ icon: '⚠️', text: 'Connexion LinkedIn interrompue (jeton expiré)', href: '#', cta: 'Reconnecter', onClick: onReconnect });

  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {alerts.map((a, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-2.5 text-sm">
          <span className="shrink-0 text-base leading-none">{a.icon}</span>
          <span className="flex-1 min-w-0 text-xs font-medium text-amber-900 truncate">{a.text}</span>
          {a.onClick ? (
            <button onClick={a.onClick} className="shrink-0 text-[11px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 rounded-lg px-3 py-1 transition-colors">{a.cta}</button>
          ) : (
            <Link to={a.href as any} className="shrink-0 text-[11px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 rounded-lg px-3 py-1 transition-colors">{a.cta}</Link>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Mini KPI Strip ─────────────────────────────────────────────────────────────

function TrendArrow({ value }: { value: number }) {
  if (value > 0) return <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600"><TrendingUp size={10} />+{value}%</span>;
  if (value < 0) return <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500"><TrendingDown size={10} />{value}%</span>;
  return <span className="text-[10px] text-muted-foreground">=</span>;
}

export function MiniKPIStrip() {
  const { activeEstablishment, isLoadingFromDB } = useEstablishment();
  const { kpi } = activeEstablishment;
  const { posts } = useScheduledPosts();

  // Show skeleton on very first load (DB fetching, no stale data available)
  const isDefaultData = activeEstablishment.id === 'est-1' && isLoadingFromDB;
  if (isDefaultData) return <KPIStripSkeleton />;

  // Dynamic booking clicks: count posts with status 'Approuvé' or 'Planifié'
  const scheduledCount = posts.filter(p => p.status === 'Planifié' || p.status === 'Approuvé').length;
  // Derived booking clicks: each scheduled post ~estimated 3-6 clicks on average
  const bookingClicks = Math.max(scheduledCount * 4, kpi.views > 0 ? Math.round(kpi.views * 0.008) : 0);
  // Time saved: 0.5h per scheduled post + base IA time from engagement
  const timeSavedHours = Math.max(Math.round(scheduledCount * 0.5 + kpi.engagement * 0.3), 1);

  const cards = [
    { label: 'Vues totales', value: kpi.views.toLocaleString('fr-FR'), delta: kpi.viewsChange, sub: 'ce mois' },
    { label: 'Portée globale', value: kpi.reach.toLocaleString('fr-FR'), delta: kpi.reachChange, sub: 'personnes touchées' },
    { label: 'Engagement moyen', value: `${kpi.engagement}%`, delta: kpi.engagementChange, sub: 'taux moyen' },
    { label: 'Réservations / Clics', value: bookingClicks.toLocaleString('fr-FR'), delta: scheduledCount > 0 ? 12 : 0, sub: 'via liens publiés' },
    { label: 'Temps gagné IA', value: `${timeSavedHours}h`, delta: 0, sub: 'ce mois-ci', icon: <Clock size={14} className="text-primary" /> },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col gap-1.5 hover:border-primary/30 transition-colors">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground truncate">{c.label}</p>
          <p className="text-xl font-extrabold text-foreground tabular-nums leading-none">{c.value}</p>
          <div className="flex items-center justify-between gap-1">
            {c.delta !== 0 ? <TrendArrow value={c.delta} /> : <span className="text-[9px] text-muted-foreground">{c.sub}</span>}
            {c.delta !== 0 && <span className="text-[9px] text-muted-foreground truncate">{c.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Week Planning Table ────────────────────────────────────────────────────────

const CHANNEL_COLORS: Record<string, string> = {
  Instagram: 'bg-rose-500',
  Facebook:  'bg-blue-600',
  LinkedIn:  'bg-violet-600',
  Google:    'bg-orange-500',
};

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Planifié: 'text-amber-700 bg-amber-50 border-amber-200',
    Approuvé: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    Brouillon: 'text-muted-foreground bg-muted border-border',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${map[status] ?? map.Brouillon}`}>
      {status}
    </span>
  );
}

const INITIAL_VISIBLE = 3;

export function WeekPlanningTable() {
  const { posts } = useScheduledPosts();
  const [showAll, setShowAll] = useState(false);

  const allUpcoming = useMemo(() => {
    return posts
      .filter(p => { try { const d = parseISO(p.date); return isFuture(d) || isToday(d); } catch { return false; } })
      .sort((a, b) => (`${a.date}T${a.time}` < `${b.date}T${b.time}` ? -1 : 1));
  }, [posts]);

  const upcoming = showAll ? allUpcoming : allUpcoming.slice(0, INITIAL_VISIBLE);
  const hasMore = allUpcoming.length > INITIAL_VISIBLE;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-primary" />
          <span className="text-xs font-bold text-foreground">Planning à venir</span>
          {allUpcoming.length > 0 && (
            <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5">{allUpcoming.length}</span>
          )}
        </div>
        <Link to="/calendar" className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
          Calendrier complet <ChevronRight size={11} />
        </Link>
      </div>

      {allUpcoming.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <CalendarDays size={24} className="text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">Aucun post planifié</p>
          <Link to="/calendar" className="flex items-center gap-1 text-[11px] text-primary hover:underline hover:gap-1.5 transition-all">
            Planifier sur le calendrier <ArrowRight size={11} />
          </Link>
        </div>
      ) : (
        <>
          <div className="divide-y divide-border">
            {upcoming.map(post => {
              let dateLabel = post.date;
              try { dateLabel = format(parseISO(post.date), 'EEE d MMM', { locale: fr }); dateLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1); } catch {}
              const ch = post.channels[0];
              return (
                <div key={post.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${CHANNEL_COLORS[ch] ?? 'bg-muted-foreground'}`} />
                  <span className="w-28 shrink-0 text-[11px] text-muted-foreground font-medium">{dateLabel} · {post.time}</span>
                  <span className="flex-1 min-w-0 text-xs text-foreground truncate">{post.text.slice(0, 55)}{post.text.length > 55 ? '…' : ''}</span>
                  <span className="shrink-0 text-[10px] font-semibold text-muted-foreground hidden sm:block">{ch}</span>
                  <StatusPill status={post.status} />
                </div>
              );
            })}
          </div>
          {hasMore && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium text-muted-foreground hover:text-primary hover:bg-muted/20 border-t border-border transition-colors"
            >
              <ChevronDown size={12} className={showAll ? 'rotate-180 transition-transform' : 'transition-transform'} />
              {showAll ? 'Voir moins' : `Voir ${allUpcoming.length - INITIAL_VISIBLE} de plus`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
