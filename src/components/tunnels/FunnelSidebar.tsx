/**
 * FunnelSidebar — Right panel: KPIs, tech stack, watch status, organic tab, ghost emails.
 */
import { useState } from 'react';
import { cn } from '@blinkdotnew/ui';
import { TrendingUp, DollarSign, Gauge, Sparkles, X, ExternalLink, Bell, BellOff, AlertTriangle } from 'lucide-react';
import type { FunnelData } from './types';
import { TechStackWidget } from './TechStackWidget';
import { GhostEmailsPanel } from './GhostEmailsPanel';
import { OrganicTrafficTab } from './OrganicTrafficTab';
import { useAuth } from '../../hooks/useAuth';

const PLATFORM_BADGE: Record<string, { label: string; color: string }> = {
  meta: { label: 'Meta Ads', color: 'bg-blue-600 text-white' },
  google: { label: 'Google Ads', color: 'bg-green-600 text-white' },
  linkedin: { label: 'LinkedIn Ads', color: 'bg-sky-700 text-white' },
};

interface FunnelSidebarProps {
  funnel: FunnelData | null;
  onClose?: () => void;
  onGenerateSwipes?: () => void;
  onToggleWatch?: () => void;
}

type Tab = 'kpis' | 'organic';

function ScoreMeter({ score }: { score: number }) {
  const color = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-red-500';
  const bg = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Score Performance</span>
        <span className={cn('text-lg font-black', color)}>{score}<span className="text-xs font-medium">/100</span></span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', bg)} style={{ width: `${score}%` }} />
      </div>
      <p className="text-[10px] text-muted-foreground">
        {score >= 70 ? '🔥 Tunnel haute performance' : score >= 40 ? '⚡ Tunnel en cours d\'optimisation' : '⚠️ Performances faibles détectées'}
      </p>
    </div>
  );
}

export function FunnelSidebar({ funnel, onClose, onGenerateSwipes, onToggleWatch }: FunnelSidebarProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('kpis');

  if (!funnel) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
          <Gauge size={24} className="text-muted-foreground/40" />
        </div>
        <p className="text-sm font-semibold text-foreground">Sélectionnez un tunnel</p>
        <p className="text-xs text-muted-foreground">Cliquez sur un nœud ou analysez un concurrent pour voir ses KPIs ici.</p>
      </div>
    );
  }

  const platform = PLATFORM_BADGE[funnel.platform] ?? { label: funnel.platform, color: 'bg-slate-700 text-white' };
  const isWatched = funnel.is_watched ?? false;
  const activeAlerts = funnel.watch_alerts?.filter(a => a) ?? [];
  const hasEmailNode = funnel.nodes?.some(n => n.type === 'email_sequence');
  const cleanDomain = funnel.domain_url.replace('https://', '').replace('http://', '').split('/')[0];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', platform.color)}>
                {platform.label}
              </span>
              {isWatched && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <Bell size={8} /> Suivi actif
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-foreground truncate">{funnel.creator_name}</h3>
            {funnel.domain_url && (
              <a
                href={funnel.domain_url.startsWith('http') ? funnel.domain_url : `https://${funnel.domain_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-primary hover:underline mt-0.5"
              >
                <ExternalLink size={9} />
                {cleanDomain}
              </a>
            )}
          </div>
          {onClose && (
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors shrink-0">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Watch alerts */}
      {isWatched && activeAlerts.length > 0 && (
        <div className="shrink-0 mx-3 mt-3 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/20 px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle size={12} className="text-amber-600 shrink-0" />
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
              {activeAlerts.length} alerte{activeAlerts.length > 1 ? 's' : ''} détectée{activeAlerts.length > 1 ? 's' : ''}
            </p>
          </div>
          {activeAlerts.slice(0, 2).map((alert, i) => (
            <p key={i} className="text-[10px] text-amber-800 dark:text-amber-300 leading-tight">• {alert.message}</p>
          ))}
          {activeAlerts.length > 2 && <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">+{activeAlerts.length - 2} autres…</p>}
        </div>
      )}

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-border mx-5 mt-3">
        {(['kpis', 'organic'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-3 pb-2 text-[11px] font-semibold transition-colors border-b-2 -mb-px',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === 'kpis' ? 'KPIs' : 'Organique'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">

        {/* ── KPIs tab ── */}
        {activeTab === 'kpis' && (
          <>
            <ScoreMeter score={funnel.performance_score} />

            <div className="rounded-xl border border-border p-3.5 space-y-1 bg-card">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <DollarSign size={14} className="text-orange-600" />
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Budget mensuel estimé</p>
              </div>
              <p className="text-2xl font-black text-foreground">
                {funnel.estimated_spend >= 1000 ? `${(funnel.estimated_spend / 1000).toFixed(1)}k€` : `${funnel.estimated_spend}€`}
              </p>
              <p className="text-[10px] text-muted-foreground">Estimation IA basée sur les signaux publicitaires</p>
            </div>

            <div className="rounded-xl border border-border p-3.5 space-y-1 bg-card">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp size={14} className="text-primary" />
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Structure du tunnel</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap mt-1">
                {funnel.nodes?.map(node => (
                  <div key={node.id} className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {node.type === 'ad_source' && 'Ads'}
                    {node.type === 'opt_in' && 'Opt-in'}
                    {node.type === 'vsl' && 'VSL'}
                    {node.type === 'checkout' && 'Checkout'}
                    {node.type === 'email_sequence' && 'Email Seq.'}
                  </div>
                ))}
              </div>
            </div>

            {funnel.tech_stack && funnel.tech_stack.length > 0 && (
              <TechStackWidget tools={funnel.tech_stack} />
            )}

            {/* Ghost emails — only when email_sequence node exists */}
            {hasEmailNode && user && (
              <GhostEmailsPanel funnelId={funnel.id} userId={user.id} />
            )}

            <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/20 p-3.5 space-y-1.5">
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">💡 Insights Copilot</p>
              <ul className="space-y-1">
                {funnel.performance_score >= 70 && (
                  <li className="text-[11px] text-amber-800 dark:text-amber-300">Ce tunnel convertit très bien — analysez la copie de l'opt-in en priorité.</li>
                )}
                {funnel.nodes?.some(n => n.type === 'vsl') && (
                  <li className="text-[11px] text-amber-800 dark:text-amber-300">VSL détecté — durée clé : visez 20-45 min pour du high-ticket.</li>
                )}
                {funnel.nodes?.some(n => n.type === 'email_sequence') && (
                  <li className="text-[11px] text-amber-800 dark:text-amber-300">Séquence email active — reverse-engineerez les hooks des 3 premiers emails.</li>
                )}
                {funnel.estimated_spend >= 5000 && (
                  <li className="text-[11px] text-amber-800 dark:text-amber-300">Budget élevé = validation marché confirmée. Le modèle est rentable.</li>
                )}
                {funnel.tech_stack?.some(t => t.name === 'Stripe') && (
                  <li className="text-[11px] text-amber-800 dark:text-amber-300">Stripe détecté — le checkout est optimisé pour les conversions directes.</li>
                )}
              </ul>
            </div>
          </>
        )}

        {/* ── Organic tab ── */}
        {activeTab === 'organic' && (
          <OrganicTrafficTab funnelId={funnel.id} domain={cleanDomain} />
        )}
      </div>

      {/* CTA section */}
      <div className="shrink-0 px-5 pb-5 pt-3 border-t border-border space-y-2">
        <button
          onClick={onGenerateSwipes}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
        >
          <Sparkles size={15} />
          Générer mes AI Swipes
        </button>
        <button
          onClick={onToggleWatch}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all',
            isWatched
              ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40'
              : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {isWatched ? <BellOff size={14} /> : <Bell size={14} />}
          {isWatched ? 'Désactiver les alertes' : 'Watch Funnel (Alertes)'}
          {isWatched && activeAlerts.length > 0 && (
            <span className="ml-auto w-5 h-5 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
              {activeAlerts.length}
            </span>
          )}
        </button>
        <p className="text-center text-[10px] text-muted-foreground">
          {isWatched ? 'Vous recevrez des alertes si ce tunnel change.' : 'Copie IA inspirée de ce tunnel pour votre marché'}
        </p>
      </div>
    </div>
  );
}
