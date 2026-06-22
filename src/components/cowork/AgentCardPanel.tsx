/**
 * AgentCardPanel — interactive demo card for a single AI agent.
 * Simulates progress then shows completion/download state.
 */
import { useState, useEffect, useRef } from 'react';
import {
  Megaphone, ShieldAlert, FileText, Sparkles, BarChart3, LineChart,
  RefreshCw, CheckCircle2, Download, Loader2,
} from 'lucide-react';
import { cn } from '@blinkdotnew/ui';
import type { AgentCard } from './agentsTypes';

// ── Agent definitions (UI-only demo cards) ───────────────────────────────────

export const AGENTS: AgentCard[] = [
  {
    id: 'content',
    title: 'Content Factory',
    subtitle: 'Expert Média Planner',
    icon: <Megaphone size={22} />,
    status: 'active',
    statusLabel: 'Disponible',
    statusColor: 'text-emerald-400',
    metric: '98%',
    metricLabel: 'Bande passante IA',
    ctaLabel: 'Lancer un Sprint de Contenu',
    ctaIcon: <Sparkles size={14} />,
    gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
    borderColor: 'border-emerald-500/20',
  },
  {
    id: 'adspy',
    title: 'Ad Spy & Copywriter',
    subtitle: 'Stratège Concurrentiel',
    icon: <ShieldAlert size={22} />,
    status: 'watching',
    statusLabel: 'Veille active',
    statusColor: 'text-blue-400',
    metric: '3',
    metricLabel: 'Insights détectés',
    insight: 'Avis concurrents analysés : tendance SEO locale en hausse de +18% ce mois-ci.',
    ctaLabel: 'Optimiser mes Tunnels de Vente',
    ctaIcon: <BarChart3 size={14} />,
    gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent',
    borderColor: 'border-blue-500/20',
  },
  {
    id: 'reporter',
    title: 'Account Manager',
    subtitle: 'Auto-Reporter',
    icon: <FileText size={22} />,
    status: 'idle',
    statusLabel: 'Prêt',
    statusColor: 'text-violet-400',
    metric: '1',
    metricLabel: 'Rapport disponible',
    ctaLabel: 'Générer le Rapport Mensuel Client',
    ctaIcon: <LineChart size={14} />,
    gradient: 'from-violet-500/10 via-purple-500/5 to-transparent',
    borderColor: 'border-violet-500/20',
  },
];

// ── Helper sub-components ─────────────────────────────────────────────────────

function StatusDot({ status }: { status: AgentCard['status'] }) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-400',
    watching: 'bg-blue-400',
    idle: 'bg-violet-400',
  };
  return (
    <span className={cn('w-2 h-2 rounded-full shrink-0', colors[status], status === 'active' && 'animate-pulse')} />
  );
}

function ProductivityBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
      <div className={cn('h-full rounded-full transition-all duration-1000', color)} style={{ width: `${value}%` }} />
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

interface Props {
  agent: AgentCard;
  onAction: (id: string) => void;
}

export function AgentCardPanel({ agent, onAction }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const handleClick = () => {
    if (loading || done) return;
    setLoading(true);
    setProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current!);
          progressIntervalRef.current = null;
          setLoading(false);
          setDone(true);
          if (agent.id === 'reporter') setShowDownload(true);
          onAction(agent.id);
          return 100;
        }
        return prev + (agent.id === 'reporter' ? 4 : 8);
      });
    }, 150);
  };

  const reset = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setDone(false);
    setLoading(false);
    setShowDownload(false);
    setProgress(0);
  };

  const barColors: Record<string, string> = {
    content: 'bg-emerald-400',
    adspy: 'bg-blue-400',
    reporter: 'bg-violet-400',
  };
  const metricColors: Record<string, string> = {
    content: 'text-emerald-400',
    adspy: 'text-blue-400',
    reporter: 'text-violet-400',
  };

  return (
    <div className={cn(
      'relative flex flex-col gap-4 rounded-2xl border bg-gradient-to-br p-5 transition-all duration-300',
      agent.gradient,
      agent.borderColor,
      'bg-slate-900/80 hover:bg-slate-900',
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-white/5 border border-white/10', metricColors[agent.id])}>
            {agent.icon}
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-tight">{agent.title}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{agent.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusDot status={agent.status} />
          <span className={cn('text-[11px] font-semibold', agent.statusColor)}>{agent.statusLabel}</span>
        </div>
      </div>

      {/* Metric */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <span className={cn('text-2xl font-black', metricColors[agent.id])}>{agent.metric}</span>
          <span className="text-[11px] text-slate-400 ml-1.5">{agent.metricLabel}</span>
        </div>
        {done && (
          <button onClick={reset} className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1">
            <RefreshCw size={10} /> Reset
          </button>
        )}
      </div>

      {agent.id === 'content' && <ProductivityBar value={98} color="bg-emerald-400" />}

      {agent.insight && (
        <div className="rounded-lg bg-white/5 border border-blue-500/15 px-3 py-2">
          <p className="text-[11px] text-blue-200 leading-relaxed">💡 {agent.insight}</p>
        </div>
      )}

      {loading && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Traitement en cours…</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <ProductivityBar value={progress} color={barColors[agent.id]} />
        </div>
      )}

      {done && !showDownload && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          <p className="text-[11px] text-emerald-300 font-semibold">
            {agent.id === 'content' ? 'Sprint lancé — planning éditorial mis à jour !' : 'Tunnels optimisés — recommandations disponibles.'}
          </p>
        </div>
      )}

      {showDownload && (
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2">
            <p className="text-[11px] text-violet-300 font-semibold">✅ Rapport généré — 12 pages, format PDF</p>
          </div>
          <button className="flex items-center gap-1.5 text-[11px] font-bold text-violet-300 hover:text-violet-100 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 rounded-lg px-3 py-2 transition-colors shrink-0">
            <Download size={12} /> Télécharger
          </button>
        </div>
      )}

      {!done && (
        <button
          onClick={handleClick}
          disabled={loading}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all duration-200 border',
            loading
              ? 'opacity-60 cursor-not-allowed border-white/10 bg-white/5 text-slate-400'
              : agent.id === 'content'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/10'
                : agent.id === 'adspy'
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-300 hover:bg-blue-500/25 hover:shadow-lg hover:shadow-blue-500/10'
                  : 'bg-violet-500/15 border-violet-500/30 text-violet-300 hover:bg-violet-500/25 hover:shadow-lg hover:shadow-violet-500/10',
          )}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : agent.ctaIcon}
          {loading ? 'En cours…' : agent.ctaLabel}
        </button>
      )}
    </div>
  );
}
