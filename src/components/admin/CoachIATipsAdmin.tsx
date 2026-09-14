/**
 * CoachIATipsAdmin — Admin dashboard for tip analytics and moderation
 * Displays: analytics overview, pending tips for approval, top performing tips.
 */

import { useState } from 'react';
import {
  Lightbulb, Eye, Heart, MousePointer, Users, Clock, CheckCircle2,
  XCircle, Trash2, TrendingUp, BarChart3, ChevronDown, ChevronRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useTipAnalytics,
  usePendingTips,
  useModerateTip,
  useDeleteTip,
  type CoachTip,
} from '../../hooks/useCoachTips';

const CATEGORY_COLORS: Record<string, string> = {
  Followers: '#E4405F',
  Engagement: '#818CF8',
  Visibilite: '#2DD4BF',
  Contenu: '#FBBF24',
  general: '#64748B',
};

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: typeof Eye; color: string; sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        <p className="text-xl font-black text-foreground leading-none mt-0.5">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── Pending Tip Row ──────────────────────────────────────────────────────────

function PendingTipRow({ tip }: { tip: CoachTip }) {
  const moderate = useModerateTip();
  const deleteTip = useDeleteTip();

  const handleApprove = () => moderate.mutate({ id: tip.id, status: 'approved' });
  const handleReject = () => moderate.mutate({ id: tip.id, status: 'rejected' });
  const handleDelete = () => {
    if (confirm('Supprimer ce conseil ?')) deleteTip.mutate(tip.id);
  };

  const color = CATEGORY_COLORS[tip.category] || '#64748B';

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${color}15` }}>
        <Lightbulb size={13} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold text-foreground truncate">{tip.title}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
            style={{ background: `${color}15`, color }}>
            {tip.category}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground line-clamp-2">{tip.content}</p>
        <p className="text-[9px] text-muted-foreground/60 mt-1">
          Par {tip.submittedByName} — {new Date(tip.createdAt).toLocaleDateString('fr-FR')}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleApprove}
          disabled={moderate.isPending}
          className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/15 transition-colors"
          title="Approuver"
        >
          <CheckCircle2 size={15} />
        </button>
        <button
          onClick={handleReject}
          disabled={moderate.isPending}
          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition-colors"
          title="Rejeter"
        >
          <XCircle size={15} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleteTip.isPending}
          className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Supprimer"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Top Tips Row ─────────────────────────────────────────────────────────────

function TopTipRow({ tip, rank }: { tip: CoachTip; rank: number }) {
  const color = CATEGORY_COLORS[tip.category] || '#64748B';
  const engagement = (Number(tip.views) || 0) + (Number(tip.likes) || 0) * 3 + (Number(tip.clicks) || 0) * 2;

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors">
      <span className="text-[10px] font-black text-muted-foreground/40 w-4 text-center">{rank}</span>
      <div className="w-1.5 h-6 rounded-full" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{tip.title}</p>
        <p className="text-[9px] text-muted-foreground">{tip.category}</p>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground shrink-0">
        <span className="flex items-center gap-1"><Eye size={10} />{Number(tip.views)}</span>
        <span className="flex items-center gap-1"><Heart size={10} />{Number(tip.likes)}</span>
        <span className="flex items-center gap-1"><MousePointer size={10} />{Number(tip.clicks)}</span>
      </div>
      <span className="text-[10px] font-bold text-primary/70 bg-primary/10 px-2 py-0.5 rounded shrink-0">
        {engagement}
      </span>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function CoachIATipsAdmin() {
  const { data: analytics, isLoading: analyticsLoading } = useTipAnalytics();
  const { data: pendingTips, isLoading: pendingLoading } = usePendingTips();
  const [showPending, setShowPending] = useState(true);

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground">Coach IA — Statistiques</h2>
        <p className="text-xs text-muted-foreground">Gérez les conseils et analysez leur performance</p>
      </div>

      {/* KPI strip */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total conseils" value={analytics.totalTips} icon={Lightbulb} color="#2DD4BF" sub={`${analytics.userSubmitted} soumis par les users`} />
          <StatCard label="Vues totales" value={analytics.totalViews.toLocaleString()} icon={Eye} color="#818CF8" />
          <StatCard label="Likes totaux" value={analytics.totalLikes.toLocaleString()} icon={Heart} color="#E4405F" />
          <StatCard label="Clics totaux" value={analytics.totalClicks.toLocaleString()} icon={MousePointer} color="#FBBF24" />
        </div>
      )}

      {/* Pending moderation */}
      {pendingTips && pendingTips.length > 0 && (
        <div>
          <button
            onClick={() => setShowPending(s => !s)}
            className="flex items-center gap-2 mb-3 cursor-pointer"
          >
            {showPending ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="text-sm font-bold text-foreground">
              En attente de modération
            </span>
            <span className="text-[10px] font-bold bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded-full">
              {pendingTips.length}
            </span>
          </button>
          {showPending && (
            <div className="space-y-2">
              {pendingTips.map(tip => (
                <PendingTipRow key={tip.id} tip={tip} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category breakdown */}
      {analytics?.categoryBreakdown && Object.keys(analytics.categoryBreakdown).length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 size={14} className="text-muted-foreground" />
            Répartition par catégorie
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(analytics.categoryBreakdown).map(([cat, data]) => {
              const color = CATEGORY_COLORS[cat] || '#64748B';
              const maxViews = Math.max(...Object.values(analytics.categoryBreakdown).map(d => d.views), 1);
              return (
                <div key={cat} className="p-3 rounded-xl border border-border bg-card/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-xs font-bold text-foreground">{cat}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{data.count} conseils</span>
                  </div>
                  <div className="flex items-end gap-3">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Vues</p>
                      <p className="text-sm font-bold text-foreground">{data.views.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Likes</p>
                      <p className="text-sm font-bold text-foreground">{data.likes.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(data.views / maxViews) * 100}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top tips */}
      {analytics?.topTips && analytics.topTips.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-500" />
            Top conseils par engagement
          </h3>
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {analytics.topTips.map((tip, i) => (
              <TopTipRow key={tip.id} tip={tip} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {analytics && analytics.totalTips === 0 && (
        <div className="text-center py-12">
          <Lightbulb size={32} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Aucun conseil pour l'instant</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Les conseils soumis par les utilisateurs apparaîtront ici</p>
        </div>
      )}
    </div>
  );
}
