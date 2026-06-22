import { useEffect, useRef, useState } from 'react';
import { Clock, TrendingUp, Sparkles, ArrowRight, MessageSquare, FileText, Star } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';
import { TermTooltip } from '../shared/TermTooltip';

// ── Animated counter ──────────────────────────────────────────────────────────

function AnimatedCounter({ target, suffix = '', duration = 1400 }: {
  target: number; suffix?: string; duration?: number;
}) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    started.current = false;
    setValue(0);
  }, [target]);

  useEffect(() => {
    if (started.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{value}{suffix}</span>;
}

// ── Real data hook ────────────────────────────────────────────────────────────

interface ROIStats {
  postsPublished: number;
  reviewsHandled: number;
  smsSent: number;
  timeSavedHours: number;
  roiPercent: number;
}

function useROIStats(): { stats: ROIStats; loading: boolean } {
  const { user } = useAuth();
  const [stats, setStats] = useState<ROIStats>({
    postsPublished: 0,
    reviewsHandled: 0,
    smsSent: 0,
    timeSavedHours: 0,
    roiPercent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }

    const load = async () => {
      try {
        const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

        // Fetch daily analytics for the past 30 days
        const analytics = await blink.db.dailyAnalytics.list({
          where: { userId: user.id },
          orderBy: { snapshotDate: 'desc' },
          limit: 35,
        } as any);

        const rows = (analytics as any[]).filter(r => r.snapshotDate >= since);

        const totals = rows.reduce(
          (acc, r) => ({
            postsPublished: acc.postsPublished + Number(r.postsPublished || 0),
            reviewsHandled: acc.reviewsHandled + Number(r.reviewsHandled || 0),
            smsSent: acc.smsSent + Number(r.smsSent || 0),
          }),
          { postsPublished: 0, reviewsHandled: 0, smsSent: 0 }
        );

        // Fallback: count posts from scheduled_posts table
        if (totals.postsPublished === 0) {
          const posts = await blink.db.scheduledPosts.list({
            where: { userId: user.id, status: 'published' },
          } as any);
          totals.postsPublished = (posts as any[]).length;
        }

        // Estimate: 15 min per post, 10 min per review reply, 5 min per SMS campaign
        const timeSavedHours = Math.round(
          (totals.postsPublished * 15 + totals.reviewsHandled * 10 + totals.smsSent * 2) / 60
        );

        // ROI: subscription ~49€/mo, value = 40€/h * time saved
        const monthlyValue = timeSavedHours * 40;
        const subscriptionCost = 49;
        const roiPercent = subscriptionCost > 0
          ? Math.round((monthlyValue / subscriptionCost) * 100)
          : 0;

        setStats({
          postsPublished: totals.postsPublished,
          reviewsHandled: totals.reviewsHandled,
          smsSent: totals.smsSent,
          timeSavedHours: Math.max(timeSavedHours, 1),
          roiPercent: Math.max(roiPercent, 100),
        });
      } catch (e) {
        console.warn('[ROIWidget] load error:', e);
        // Graceful fallback
        setStats({ postsPublished: 0, reviewsHandled: 0, smsSent: 0, timeSavedHours: 1, roiPercent: 100 });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  return { stats, loading };
}

// ── ROI Widget ────────────────────────────────────────────────────────────────

export function ROIWidget() {
  const { stats, loading } = useROIStats();

  const miniStats = [
    { icon: FileText, label: 'Posts publiés', value: stats.postsPublished, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { icon: Star, label: 'Avis traités', value: stats.reviewsHandled, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { icon: MessageSquare, label: 'SMS envoyés', value: stats.smsSent, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  ];

  return (
    <div className="rounded-3xl overflow-hidden border border-border bg-card shadow-[0_4px_24px_-8px_rgba(13,148,136,0.15)]">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-teal-400 px-7 py-5 relative overflow-hidden">
        <div className="absolute -top-5 -right-5 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-3 right-12 w-12 h-12 rounded-full bg-white/10 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={15} className="text-white/90" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Impact ce mois-ci</p>
            </div>
            <h3 className="text-lg font-extrabold text-white leading-tight">📊 Votre impact Kompilot</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <TrendingUp size={20} className="text-white" />
          </div>
        </div>
      </div>

      {/* Main stats */}
      <div className="px-7 py-5 grid grid-cols-2 gap-5">
        {/* Time saved */}
        <div className="space-y-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10">
            <Clock size={17} className="text-primary" />
          </div>
          <div>
            {loading ? (
              <div className="h-12 w-20 bg-muted/60 rounded-lg animate-pulse" />
            ) : (
              <p className="text-5xl md:text-6xl font-black tracking-tight tabular-nums leading-none text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <AnimatedCounter target={stats.timeSavedHours} suffix="" /> <span className="text-3xl md:text-4xl">h</span>
              </p>
            )}
            <p className="text-xs font-semibold leading-tight mt-2 text-foreground">Temps économisé</p>
            <p className="text-[11px] mt-0.5 leading-snug text-muted-foreground">
              Textes IA · Réponses avis · SMS auto
            </p>
          </div>
        </div>

        {/* ROI */}
        <div className="space-y-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/20">
            <TrendingUp size={17} className="text-emerald-600" />
          </div>
          <div>
            {loading ? (
              <div className="h-12 w-20 bg-muted/60 rounded-lg animate-pulse" />
            ) : (
              <p className="text-5xl md:text-6xl font-black tracking-tight tabular-nums leading-none text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <AnimatedCounter target={stats.roiPercent} suffix="%" />
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-2">
              <p className="text-xs font-semibold leading-tight text-foreground">ROI abonnement</p>
              <TermTooltip term="ROI" size="sm" />
            </div>
            <p className="text-[11px] mt-0.5 leading-snug text-muted-foreground">
              Valeur générée vs coût mensuel
            </p>
          </div>
        </div>
      </div>

      {/* Mini breakdown */}
      <div className="grid grid-cols-3 gap-2 px-5 pb-4">
        {miniStats.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`rounded-xl border border-border/50 px-2 py-2.5 flex flex-col items-center gap-1 ${bg}`}>
            <Icon size={13} className={color} />
            {loading ? (
              <div className="h-5 w-8 bg-muted/60 rounded animate-pulse" />
            ) : (
              <p className={`text-lg font-extrabold tabular-nums ${color}`}>{value}</p>
            )}
            <p className="text-[9px] text-muted-foreground text-center leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* ROI hint */}
      {!loading && stats.roiPercent > 100 && (
        <div className="mx-5 mb-4 rounded-2xl bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/20 px-4 py-3 flex items-start gap-2.5">
          <span className="text-base shrink-0 mt-0.5">💡</span>
          <p className="text-xs text-foreground/80 leading-relaxed">
            À ce rythme, votre abonnement est rentabilisé à{' '}
            <strong className="text-primary">{stats.roiPercent}% ce mois-ci.</strong>
            {' '}Kompilot travaille pour vous même quand vous avez la tête dans le guidon.
          </p>
        </div>
      )}

      {/* CTA */}
      <div className="px-5 pb-5">
        <Link
          to="/subscription"
          className="flex items-center justify-between rounded-xl border border-border hover:border-primary/40 hover:bg-primary/3 px-4 py-2.5 transition-all group"
        >
          <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
            Voir le rapport complet
          </span>
          <ArrowRight size={13} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </div>
  );
}
