/**
 * ReferralStatsCard
 * Premium dark KPI card for the dashboard Overview tab.
 * Shows: messages sent, links shared, new clients, additional revenue.
 */
import { Link } from '@tanstack/react-router';
import { Gift, Send, Share2, Users, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { useReferral } from '../../hooks/useReferral';

interface KPIItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  iconBg: string;
}

function KPIItem({ icon: Icon, label, value, color, iconBg }: KPIItemProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon size={14} className={color} />
      </div>
      <p className={`text-xl font-extrabold leading-none tabular-nums ${color}`}>{value}</p>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide leading-tight">{label}</p>
    </div>
  );
}

export function ReferralStatsCard() {
  const { stats, campaign, isLoading } = useReferral();

  // Skeleton
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-5 animate-pulse">
        <div className="h-5 w-48 rounded bg-slate-700 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl bg-slate-700" />)}
        </div>
      </div>
    );
  }

  const hasActivity = stats.linksShared > 0 || stats.thankYousSent > 0;
  const isActive = campaign?.isActive ?? false;

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-5 shadow-lg shadow-emerald-900/10 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Gift size={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Fidélisation & Parrainage</h3>
            <p className="text-[11px] text-slate-400 leading-snug">Growth loop automatique via avis Google</p>
          </div>
        </div>

        {/* Status badge */}
        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border ${
          isActive
            ? 'bg-emerald-500/15 border-emerald-500/30 text-slate-900'
            : 'bg-slate-700/50 border-slate-600 text-slate-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          {isActive ? 'Actif' : 'Inactif'}
        </div>
      </div>

      {/* KPI grid */}
      {hasActivity ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPIItem
            icon={Send}
            label="Messages envoyés"
            value={stats.thankYousSent}
            color="text-emerald-300"
            iconBg="bg-emerald-500/15"
          />
          <KPIItem
            icon={Share2}
            label="Liens partagés"
            value={stats.linksShared}
            color="text-blue-300"
            iconBg="bg-blue-500/15"
          />
          <KPIItem
            icon={Users}
            label="Nouveaux clients"
            value={stats.newClientsGenerated}
            color="text-violet-300"
            iconBg="bg-violet-500/15"
          />
          <KPIItem
            icon={TrendingUp}
            label="CA additionnel"
            value={`${stats.additionalRevenue.toFixed(0)} €`}
            color="text-amber-300"
            iconBg="bg-amber-500/15"
          />
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Sparkles size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Démarrez votre boucle de parrainage</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug max-w-xs mx-auto">
              Activez le module et chaque avis 4-5 ⭐ génèrera automatiquement un lien de parrainage unique pour ce client.
            </p>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex items-center justify-between border-t border-slate-700/50 pt-3">
        <p className="text-[10px] text-slate-500">
          {campaign?.discountPercent ?? 10}% offert au filleul · {campaign?.sponsorDiscountPercent ?? 10}% pour le parrain
        </p>
        <Link
          to="/performance"
          className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Gérer le module <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}