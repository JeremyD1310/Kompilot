/**
 * TunnelsPage — Sales Funnel Visual Mapper & Competitive Intelligence
 *
 * Thin orchestrator: delegates business logic to useFunnelAnalysis,
 * UI to FunnelTopBar, FunnelCanvas, FunnelSidebar, AISwipesModal.
 *
 * Backend calls (via useFunnelAnalysis):
 *   POST /api/funnels/analyze-full  — tech stack + Meta Ads + 21-day filter
 *   GET  /api/funnels/analyze       — mock funnel structure (fallback)
 */
import { useState, useCallback, useMemo } from 'react';
import { cn } from '@blinkdotnew/ui';
import { TrendingUp, Bell, AlertTriangle, X, Sparkles, GitFork, FileDown, Brain } from 'lucide-react';
import { FunnelCanvas, FunnelCanvasEmpty } from '../components/tunnels/FunnelCanvas';
import { FunnelSidebar } from '../components/tunnels/FunnelSidebar';
import { AISwipesModal } from '../components/tunnels/AISwipesModal';
import { ClientExportModal } from '../components/tunnels/ClientExportModal';
import { PersonaSimulatorModal } from '../components/tunnels/PersonaSimulatorModal';
import { FunnelTopBar } from '../components/tunnels/FunnelTopBar';
import { SAMPLE_FUNNELS, FUNNEL_ADS } from '../components/tunnels/funnelMockData';
import { useFunnelAnalysis } from '../hooks/useFunnelAnalysis';

type Platform = 'meta' | 'google' | 'linkedin';

export default function TunnelsPage() {
  const [query, setQuery]                     = useState('');
  const [platform, setPlatform]               = useState<Platform>('meta');
  const [selectedNodeId, setSelectedNodeId]   = useState<string | undefined>();
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [profitableAdsOnly, setProfitableAdsOnly] = useState(false);
  const [showSwipesModal, setShowSwipesModal]         = useState(false);
  const [showExportModal, setShowExportModal]         = useState(false);
  const [showPersonaModal, setShowPersonaModal]       = useState(false);

  const {
    activeFunnel, setActiveFunnel,
    isAnalyzing, recentSearches,
    analyze, toggleWatch, clearFunnel, dismissAlerts,
  } = useFunnelAnalysis();

  const handleAnalyze = useCallback((q = query) => {
    analyze(q, platform);
  }, [analyze, query, platform]);

  const handleToggleWatch = useCallback(() => {
    if (activeFunnel) toggleWatch(activeFunnel);
  }, [activeFunnel, toggleWatch]);

  const handleCloseCanvas = () => {
    clearFunnel();
    setSelectedNodeId(undefined);
    setQuery('');
  };

  const funnelAds = useMemo(
    () => activeFunnel ? (FUNNEL_ADS[activeFunnel.id] ?? []) : [],
    [activeFunnel?.id],
  );
  const profitableAdsCount = useMemo(
    () => funnelAds.filter(a => a.daysActive >= 21).length,
    [funnelAds],
  );
  const activeAlerts = useMemo(
    () => activeFunnel?.watch_alerts?.filter(Boolean) ?? [],
    [activeFunnel?.watch_alerts],
  );
  const isWatched = activeFunnel?.is_watched ?? false;

  return (
    <div className="flex flex-col h-full bg-background">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <FunnelTopBar
        query={query}
        platform={platform}
        isAnalyzing={isAnalyzing}
        hasFunnel={!!activeFunnel}
        profitableAdsOnly={profitableAdsOnly}
        profitableAdsCount={profitableAdsCount}
        totalAdsCount={funnelAds.length}
        showPlatformDropdown={showPlatformDropdown}
        recentSearches={recentSearches}
        onQueryChange={setQuery}
        onPlatformChange={setPlatform}
        onAnalyze={() => handleAnalyze()}
        onToggleProfitable={() => setProfitableAdsOnly(v => !v)}
        onTogglePlatformDropdown={setShowPlatformDropdown}
        onRecentSearch={s => { setQuery(s); handleAnalyze(s); }}
      />

      {/* ── Main area ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* Canvas */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Loading state */}
          {isAnalyzing && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
                  <GitFork size={16} className="text-primary" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">Analyse du tunnel en cours…</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tech stack + publicités + cartographie</p>
              </div>
              <div className="flex items-center gap-2">
                {['Publicités', 'Tech Stack', 'Opt-in', 'Checkout', 'Emails'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground animate-pulse" style={{ animationDelay: `${i * 200}ms` }}>
                      {step}
                    </span>
                    {i < 4 && <span className="text-muted-foreground/30 text-xs">→</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Funnel loaded */}
          {!isAnalyzing && activeFunnel && (
            <>
              {/* Info bar */}
              <div className="shrink-0 px-5 py-2.5 border-b border-border/60 bg-muted/30 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <TrendingUp size={13} className="text-primary" />
                  <span className="text-xs font-bold text-foreground">{activeFunnel.creator_name}</span>
                  <span className="text-[10px] text-muted-foreground">· {activeFunnel.domain_url}</span>
                </div>

                {/* Watch toggle */}
                <button
                  onClick={handleToggleWatch}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all',
                    isWatched
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Bell size={11} className={isWatched ? 'fill-amber-500 text-amber-500' : ''} />
                  {isWatched ? 'Watching' : 'Watch Funnel'}
                  {isWatched && activeAlerts.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[8px] font-black flex items-center justify-center">
                      {activeAlerts.length}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-1.5 ml-auto">
                  {profitableAdsOnly && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800/40">
                      🔥 Pubs 21j+
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">Score :</span>
                  <span className={cn(
                    'text-[11px] font-black',
                    activeFunnel.performance_score >= 70 ? 'text-green-600' :
                    activeFunnel.performance_score >= 40 ? 'text-amber-600' : 'text-red-500'
                  )}>{activeFunnel.performance_score}/100</span>
                  {activeFunnel.is_sample && (
                    <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold ml-1">
                      EXEMPLE
                    </span>
                  )}

                  {/* Persona simulator */}
                  <button
                    onClick={() => setShowPersonaModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all ml-1"
                    title="Tester vos pubs via un Persona IA"
                  >
                    <Brain size={11} /> Persona
                  </button>

                  {/* Client export */}
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                    title="Exporter un rapport client marque blanche"
                  >
                    <FileDown size={11} /> Exporter
                  </button>
                </div>
              </div>

              {/* Watch alerts banner */}
              {isWatched && activeAlerts.length > 0 && (
                <div className="shrink-0 mx-4 mt-2 rounded-xl border border-amber-200 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/20 px-4 py-2.5 flex items-start gap-2.5">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-0.5">
                      {activeAlerts.length} changement{activeAlerts.length > 1 ? 's' : ''} détecté{activeAlerts.length > 1 ? 's' : ''}
                    </p>
                    {activeAlerts.map((alert, i) => (
                      <p key={i} className="text-[10px] text-amber-800 dark:text-amber-300">
                        • {alert.message} — <span className="opacity-70">{new Date(alert.detected_at).toLocaleDateString('fr-FR')}</span>
                      </p>
                    ))}
                  </div>
                  <button onClick={dismissAlerts} className="w-5 h-5 rounded flex items-center justify-center text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors shrink-0">
                    <X size={11} />
                  </button>
                </div>
              )}

              <div className="flex-1 min-h-0 overflow-hidden p-4">
                <FunnelCanvas
                  funnel={activeFunnel}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  profitableAdsOnly={profitableAdsOnly}
                />
              </div>
            </>
          )}

          {/* Empty state */}
          {!isAnalyzing && !activeFunnel && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <FunnelCanvasEmpty />
              <div className="px-6 pb-8">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Exemples de tunnels — Cliquez pour explorer
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SAMPLE_FUNNELS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => { setActiveFunnel(f); setQuery(f.creator_name); }}
                      className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all text-left group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <GitFork size={16} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-foreground truncate">{f.creator_name}</p>
                          <span className={cn(
                            'text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                            f.performance_score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            f.performance_score >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          )}>{f.performance_score}/100</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{f.domain_url}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-primary">
                            ~{f.estimated_spend >= 1000 ? `${(f.estimated_spend / 1000).toFixed(0)}k€` : `${f.estimated_spend}€`}/mois
                          </span>
                          <span className="text-[10px] text-muted-foreground">· {f.nodes.length} étapes</span>
                          {f.tech_stack && f.tech_stack.length > 0 && (
                            <span className="text-[10px] text-muted-foreground">· {f.tech_stack.length} outils</span>
                          )}
                          {f.watch_alerts && f.watch_alerts.length > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/40">
                              <AlertTriangle size={8} /> {f.watch_alerts.length} alerte{f.watch_alerts.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <Sparkles size={13} className="text-muted-foreground/30 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="shrink-0 w-[290px] border-l border-border bg-card hidden lg:flex flex-col">
          <FunnelSidebar
            funnel={activeFunnel}
            onClose={handleCloseCanvas}
            onGenerateSwipes={() => activeFunnel && setShowSwipesModal(true)}
            onToggleWatch={handleToggleWatch}
          />
        </div>
      </div>

      {/* AI Swipes Modal */}
      {showSwipesModal && activeFunnel && (
        <AISwipesModal
          funnel={activeFunnel}
          sourceAds={funnelAds}
          onClose={() => setShowSwipesModal(false)}
        />
      )}

      {/* Client Export Modal */}
      {showExportModal && activeFunnel && (
        <ClientExportModal
          funnel={activeFunnel}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Persona Simulator Modal */}
      {showPersonaModal && activeFunnel && (
        <PersonaSimulatorModal
          funnel={activeFunnel}
          defaultCompetitorAd={
            funnelAds.length > 0
              ? funnelAds.filter(a => a.daysActive >= 21).slice(0, 3).map(a => a.hook).join('\n') ||
                funnelAds[0].hook
              : ''
          }
          onClose={() => setShowPersonaModal(false)}
        />
      )}
    </div>
  );
}
