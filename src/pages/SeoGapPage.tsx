/**
 * SeoGapPage — L'Espion: SEO Gap Analysis
 * /espion route
 *
 * Three states:
 * 1. Has credits → Show analysis results with GapOpportunityCards
 * 2. No credits → Show EspionPaywall
 * 3. Onboarding flow → Same as #1 with celebratory overlay
 */
import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody, PageActions, Button, toast,
} from '@blinkdotnew/ui';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, Loader2, Sparkles, Zap, RefreshCw, Target, AlertTriangle,
  Shield, ChevronRight,
} from 'lucide-react';
import { useSeoGapStatus, useSeoGapAnalysis, type GapOpportunity } from '../hooks/useSeoGapAnalysis';
import { GapOpportunityCard } from '../components/seo/GapOpportunityCard';
import { EspionPaywall } from '../components/seo/EspionPaywall';

// ── Scanning animation ─────────────────────────────────────────────────────

function ScanningOverlay() {
  const steps = [
    'Analyse des concurrents locaux…',
    'Scan des positions Google…',
    'Identification des failles SEO…',
    'Calcul des scores d\'opportunité…',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-16 space-y-6"
    >
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
          <Eye size={32} className="text-primary animate-pulse" />
        </div>
        <div className="absolute -inset-3 rounded-2xl border-2 border-primary/20 animate-ping" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-bold text-foreground">L'Espion analyse vos concurrents…</h3>
        <p className="text-sm text-muted-foreground">Cela prend quelques secondes</p>
      </div>
      <div className="space-y-2 w-64">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.8 }}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Loader2 size={12} className="text-primary animate-spin" style={{ animationDelay: `${i * 200}ms` }} />
            {step}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Onboarding banner ──────────────────────────────────────────────────────

function OnboardingBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 p-5 text-white shadow-lg shadow-emerald-500/20"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Zap size={20} />
        </div>
        <div>
          <h3 className="text-base font-bold">Première faille détectée !</h3>
          <p className="text-sm text-white/80 mt-1">
            Pendant votre inscription, Kompilot a travaillé pour vous.
            Voici les premières opportunités SEO identifiées pour votre business.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function SeoGapPage() {
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);

  const { data: status, isLoading: statusLoading } = useSeoGapStatus();
  const { data: analysis, isLoading: analysisLoading, refetch, error } = useSeoGapAnalysis(analyzing);

  const isLoading = statusLoading || (analyzing && analysisLoading);

  const handleAnalyze = useCallback(() => {
    setAnalyzing(true);
    refetch().finally(() => setAnalyzing(false));
  }, [refetch]);

  const handleGenerate = useCallback((topic: string, keywords: string[]) => {
    // Navigate to Creative Factory with pre-filled data
    const params = new URLSearchParams();
    params.set('topic', topic);
    params.set('keywords', keywords.join(','));
    params.set('source', 'espion');
    navigate({ to: `/creative-factory?${params.toString()}` });
    toast.success('Redirection vers le Studio Créatif…');
  }, [navigate]);

  const handleRecharge = useCallback((amount: number) => {
    // Would integrate with Stripe checkout
    toast.info(`Recharge de ${amount}€ — intégration Stripe en cours`);
  }, []);

  const handleUpgrade = useCallback(() => {
    navigate({ to: '/subscription' });
  }, [navigate]);

  // Determine which state to show
  const hasCredits = status?.hasCredits ?? true;
  const isOnboarding = status?.isOnboarding ?? false;
  const showPaywall = !statusLoading && !hasCredits;

  return (
    <Page className="page-enter">
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
            <Eye size={20} className="text-amber-500" />
          </div>
          <div>
            <PageTitle>L'Espion</PageTitle>
            <PageDescription>
              Détectez les failles SEO de vos concurrents et générez du contenu pour les surpasser
            </PageDescription>
          </div>
        </div>
        <PageActions>
          {!showPaywall && status && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-1.5 border border-border">
                <Zap size={12} className="text-primary" />
                <span className="font-bold">{status.creditsLeft}</span> crédits restants
              </div>
              {!analysis && (
                <Button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="h-9 gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-xs"
                >
                  {isLoading ? (
                    <><Loader2 size={14} className="animate-spin" /> Analyse en cours…</>
                  ) : (
                    <><Target size={14} /> Lancer l'analyse</>
                  )}
                </Button>
              )}
              {analysis && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="h-9 gap-2 text-xs"
                >
                  <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                  Relancer
                </Button>
              )}
            </div>
          )}
        </PageActions>
      </PageHeader>

      <PageBody>
        {/* Loading skeleton */}
        {statusLoading && (
          <div className="space-y-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {/* State 2: Paywall */}
        {showPaywall && (
          <EspionPaywall
            plan={status?.plan ?? 'starter'}
            onRecharge={handleRecharge}
            onUpgrade={handleUpgrade}
          />
        )}

        {/* State 1 & 3: Has credits */}
        {!statusLoading && hasCredits && (
          <div className="space-y-6">
            {/* Onboarding banner */}
            {isOnboarding && !analysis && <OnboardingBanner />}

            {/* Scanning animation */}
            <AnimatePresence>
              {isLoading && <ScanningOverlay />}
            </AnimatePresence>

            {/* Error state */}
            {error && !isLoading && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center">
                <AlertTriangle size={24} className="text-destructive mx-auto mb-2" />
                <p className="text-sm font-semibold text-destructive">
                  {error.message === 'NO_CREDITS' ? 'Crédits épuisés' : 'Erreur lors de l\'analyse'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {error.message === 'NO_CREDITS'
                    ? 'Rechargez vos crédits pour continuer.'
                    : 'Veuillez réessayer dans quelques instants.'}
                </p>
              </div>
            )}

            {/* Results */}
            {analysis && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Competitor summary */}
                <div className="rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 p-5">
                  <div className="flex items-start gap-3">
                    <Shield size={18} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                        Analyse concurrentielle
                      </p>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {analysis.competitorSummary}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Opportunities */}
                {analysis.opportunities.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-primary" />
                      <h2 className="text-sm font-bold text-foreground">
                        {analysis.opportunities.length} faille{analysis.opportunities.length > 1 ? 's' : ''} SEO détectée{analysis.opportunities.length > 1 ? 's' : ''}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {analysis.opportunities.map((opp, i) => (
                        <GapOpportunityCard
                          key={i}
                          opportunity={opp}
                          index={i}
                          onGenerate={handleGenerate}
                          dataSource={analysis.dataSource}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border bg-card p-8 text-center">
                    <Target size={32} className="text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-muted-foreground">
                      Aucune faille critique détectée
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Vos concurrents semblent bien positionnés. Essayez avec un mot-clé plus spécifique.
                    </p>
                  </div>
                )}

                {/* Action plan */}
                {analysis.actionPlan.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Target size={14} className="text-primary" />
                      Plan d'action prioritaire
                    </h3>
                    <div className="space-y-2">
                      {analysis.actionPlan.map((action, i) => (
                        <div key={i} className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
                          <span className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-xs text-foreground/80 leading-relaxed">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Credits remaining */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    <Zap size={10} className="inline" /> {analysis.creditsLeft} crédits restants après cette analyse
                  </p>
                </div>
              </motion.div>
            )}

            {/* Empty state — no analysis yet */}
            {!analysis && !isLoading && !error && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                  <Eye size={32} className="text-amber-500/60" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Prêt à espionner vos concurrents ?
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  L'Espion analyse les positions Google de vos concurrents et identifie les failles SEO
                  où vous pouvez les surpasser avec du contenu ciblé.
                </p>
                <Button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="h-12 gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm px-8 shadow-lg shadow-primary/20"
                >
                  <Target size={18} />
                  Lancer l'analyse SEO
                </Button>
              </div>
            )}
          </div>
        )}
      </PageBody>
    </Page>
  );
}
