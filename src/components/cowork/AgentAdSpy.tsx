/**
 * AgentAdSpy — Advanced Ad Spy & Copywriter Strategist panel.
 *
 * Features:
 * - Competitor domain input
 * - Real AI analysis via blink.ai.streamText
 * - Structured insights: ad angles, hooks, SEO gaps, copywriting counter-offers
 * - Expandable insight cards with copy-to-clipboard
 * - "Optimize my funnel" shortcut
 */
import { useState, useCallback } from 'react';
import {
  ShieldAlert, Eye, Loader2, CheckCircle2, Copy,
  RefreshCw, ChevronDown, ChevronUp, TrendingUp,
  AlertTriangle, Lightbulb, Target, ExternalLink, Database,
} from 'lucide-react';
import { cn, toast } from '@blinkdotnew/ui';
import { type AgentQuota } from '../../hooks/useAgentQuota';
import { useAgentSprint } from '../../hooks/useAgentSprint';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Insight {
  type: 'angle' | 'gap' | 'hook' | 'counter';
  label: string;
  content: string;
  impact: 'high' | 'medium' | 'low';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseInsights(raw: string): Insight[] {
  const insights: Insight[] = [];
  const sections: [string, Insight['type'], Insight['impact']][] = [
    ['ANGLE', 'angle', 'high'],
    ['GAP', 'gap', 'high'],
    ['HOOK', 'hook', 'medium'],
    ['CONTRE-OFFRE', 'counter', 'medium'],
  ];
  for (const [keyword, type, impact] of sections) {
    const regex = new RegExp(`###[^#]*${keyword}[^#]*\\n([\\s\\S]*?)(?=###|$)`, 'i');
    const match = raw.match(regex);
    if (match) {
      const lines = match[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^[-*]\s*/, '').trim());
      for (const line of lines.slice(0, 4)) {
        if (line.length > 10) {
          insights.push({ type, label: keyword.charAt(0) + keyword.slice(1).toLowerCase(), content: line, impact });
        }
      }
    }
  }
  // Fallback: extract bullet points
  if (insights.length === 0) {
    const bullets = raw.split('\n').filter(l => l.trim().match(/^[-*•]/)).slice(0, 8);
    for (const b of bullets) {
      insights.push({ type: 'angle', label: 'Insight', content: b.replace(/^[-*•]\s*/, '').trim(), impact: 'medium' });
    }
  }
  return insights;
}

// ── Insight card ──────────────────────────────────────────────────────────────

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(index < 2);

  const typeConfig: Record<Insight['type'], { icon: React.ReactNode; color: string; badge: string }> = {
    angle: { icon: <Target size={12} />, color: 'border-blue-500/30 bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    gap: { icon: <AlertTriangle size={12} />, color: 'border-amber-500/30 bg-amber-500/5', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    hook: { icon: <Lightbulb size={12} />, color: 'border-violet-500/30 bg-violet-500/5', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
    counter: { icon: <TrendingUp size={12} />, color: 'border-emerald-500/30 bg-emerald-500/5', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  };

  const impactDots: Record<Insight['impact'], string> = {
    high: 'bg-red-400',
    medium: 'bg-amber-400',
    low: 'bg-slate-500',
  };

  const cfg = typeConfig[insight.type];

  const handleCopy = () => {
    navigator.clipboard.writeText(insight.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={cn('rounded-xl border transition-all', cfg.color)}>
      <div
        className="flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-2">
          <span className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border', cfg.badge)}>
            {cfg.icon} {insight.label}
          </span>
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', impactDots[insight.impact])} title={`Impact ${insight.impact}`} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); handleCopy(); }}
            className="text-slate-500 hover:text-white transition-colors"
          >
            {copied ? <CheckCircle2 size={11} className="text-emerald-400" /> : <Copy size={11} />}
          </button>
          {expanded ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
        </div>
      </div>
      {expanded && (
        <div className="px-3 pb-3">
          <p className="text-[12px] text-slate-200 leading-relaxed">{insight.content}</p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface AgentAdSpyProps {
  quota: AgentQuota;
}

export function AgentAdSpy({ quota }: AgentAdSpyProps) {
  const { runAdSpy } = useAgentSprint();
  const [competitor, setCompetitor] = useState('');
  const [myBusiness, setMyBusiness] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [rawOutput, setRawOutput] = useState('');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [showConfig, setShowConfig] = useState(true);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [aioKeywordsCount, setAioKeywordsCount] = useState<number | null>(null);

  // Pre-loaded demo insights (always visible before first scan)
  const DEMO_INSIGHTS: Insight[] = [
    { type: 'angle', label: 'Angle', content: 'Concurrents misent sur "expertise locale" — différenciez avec preuves sociales chiffrées (avis clients).', impact: 'high' },
    { type: 'gap', label: 'Gap', content: 'Absence de contenu vidéo court format — opportunité TikTok/Reels à forte visibilité.', impact: 'high' },
    { type: 'hook', label: 'Hook', content: '"Ce que les autres salons ne vous disent pas sur votre colorisation…" → intrigue + curiosité.', impact: 'medium' },
    { type: 'counter', label: 'Contre-offre', content: 'Offre découverte 30€ vs concurrent à 45€ — capturez les indécis avec garantie satisfaction.', impact: 'medium' },
  ];

  const handleAnalyze = useCallback(async () => {
    const cleanCompetitor = competitor.trim();
    if (!cleanCompetitor || isStreaming) return;

    const allowed = quota.consume();
    if (!allowed) {
      toast.error('Quota mensuel atteint', { description: 'Rechargez des crédits pour continuer.' });
      return;
    }

    setIsStreaming(true);
    setRawOutput('');
    setInsights([]);
    setAioKeywordsCount(null);
    setShowConfig(false);

    try {
      // Call backend agent endpoint (reads AIO Sync data + enriches prompt)
      const result = await runAdSpy({
        competitor: cleanCompetitor,
        myBusiness: myBusiness || undefined,
      });

      setRawOutput(result.content);
      const parsed = parseInsights(result.content);
      setInsights(parsed);
      setLastScan(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));

      // Show AIO data injection info
      const fnResult = result.functionCall?.result as { aioDataInjected?: boolean; competitorKeywords?: string[] } | null;
      if (fnResult?.aioDataInjected) {
        setAioKeywordsCount(fnResult.competitorKeywords?.length ?? 0);
      }

      toast.success(`🔍 ${parsed.length} insights concurrentiels détectés !`);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Erreur d\'analyse', { description: 'Vérifiez votre connexion et réessayez.' });
        setShowConfig(true);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [competitor, myBusiness, isStreaming, quota, runAdSpy]);

  const handleReset = () => {
    setRawOutput('');
    setInsights([]);
    setAioKeywordsCount(null);
    setShowConfig(true);
    setIsStreaming(false);
  };

  const displayInsights = insights.length > 0 ? insights : (rawOutput.length === 0 && !isStreaming ? DEMO_INSIGHTS : []);

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border-blue-500/20 bg-slate-900/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400">
            <ShieldAlert size={22} />
          </div>
          <div>
            <p className="font-bold text-sm text-white">Ad Spy & Copywriter</p>
            <p className="text-[11px] text-slate-400">Stratège Concurrentiel · Analyse IA réelle</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Eye size={12} className="text-blue-400" />
          <span className="text-[11px] font-semibold text-blue-400">Veille active</span>
        </div>
      </div>

      {/* Last scan chip */}
      {lastScan && (
        <div className="px-5 pb-3">
          <span className="text-[10px] text-slate-500">Dernier scan : {lastScan}</span>
        </div>
      )}

      {/* Config form */}
      {showConfig && (
        <div className="px-5 pb-5 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">
              Concurrent à analyser
            </label>
            <div className="relative">
              <input
                type="text"
                value={competitor}
                onChange={e => setCompetitor(e.target.value)}
                placeholder="Ex: Salon de coiffure Jean-Pierre Paris 15, ou nom + ville"
                className="w-full rounded-xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-200 placeholder:text-slate-600 px-3 py-2.5 pr-9 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <ExternalLink size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">
              Mon activité (optionnel)
            </label>
            <input
              type="text"
              value={myBusiness}
              onChange={e => setMyBusiness(e.target.value)}
              placeholder="Ex: Salon de coiffure haut de gamme — spécialité colorations naturelles"
              className="w-full rounded-xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-200 placeholder:text-slate-600 px-3 py-2.5 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!competitor.trim() || isStreaming || quota.isExhausted}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all border',
              competitor.trim() && !quota.isExhausted
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-300 hover:bg-blue-500/25 hover:shadow-lg hover:shadow-blue-500/10'
                : 'opacity-40 cursor-not-allowed border-slate-700/40 bg-slate-800/20 text-slate-500'
            )}
          >
            <Eye size={15} />
            {quota.isExhausted ? 'Quota atteint' : 'Analyser la concurrence'}
          </button>
        </div>
      )}

      {/* Results */}
      {!showConfig && (
        <div className="px-5 pb-5 space-y-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setShowConfig(v => !v)} className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors">
              <ChevronUp size={12} /> Modifier
            </button>
            <button onClick={handleReset} className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors">
              <RefreshCw size={11} /> Nouvel audit
            </button>
          </div>

          {isStreaming && insights.length === 0 && (
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 size={13} className="animate-spin text-blue-400" />
                <span className="text-[11px] font-bold text-blue-400">Analyse concurrentielle en cours…</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono leading-relaxed whitespace-pre-wrap line-clamp-6">
                {rawOutput || '…'}
              </p>
            </div>
          )}

          {insights.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-blue-400" />
                <span className="text-[11px] font-bold text-blue-400">{insights.length} insights détectés pour "{competitor}"</span>
              </div>
              {aioKeywordsCount !== null && aioKeywordsCount > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-2">
                  <Database size={11} className="text-indigo-400 shrink-0" />
                  <p className="text-[10px] text-indigo-300 font-semibold">
                    {aioKeywordsCount} mots-clés AIO Sync injectés dans l'analyse
                  </p>
                </div>
              )}
              {insights.map((ins, i) => <InsightCard key={i} insight={ins} index={i} />)}
              {/* Strategic note */}
              {rawOutput.includes('NOTE STRATÉGIQUE') && (
                <div className="rounded-xl bg-blue-500/8 border border-blue-500/20 px-4 py-3 mt-2">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide mb-1">Note stratégique</p>
                  <p className="text-[12px] text-slate-200 leading-relaxed">
                    {rawOutput.match(/\*\*NOTE STRATÉGIQUE[^:]*:\*\*\s*([\s\S]+?)$/i)?.[1]?.trim()}
                  </p>
                </div>
              )}
              <button
                onClick={() => window.location.href = '/lead-gen'}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold bg-slate-700/40 border border-slate-600/40 text-slate-300 hover:bg-slate-700/60 transition-all mt-2"
              >
                <TrendingUp size={13} /> Optimiser mes Tunnels de Vente →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Demo insights when idle */}
      {showConfig && displayInsights === DEMO_INSIGHTS && (
        <div className="px-5 pb-5 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Exemple d'insights détectés :</p>
          {DEMO_INSIGHTS.map((ins, i) => <InsightCard key={i} insight={ins} index={i} />)}
        </div>
      )}
    </div>
  );
}
