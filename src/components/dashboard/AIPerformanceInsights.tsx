/**
 * AIPerformanceInsights
 * Streams an AI-powered analysis of social media performance data.
 * Analyzes reach, engagement, post frequency, top content, and ROI
 * to surface actionable recommendations directly on the dashboard.
 * After analysis, automatically sends a performance alert email if
 * thresholds for critical drop or positive trend are met.
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, RefreshCw, TrendingUp, AlertTriangle,
  Target, Lightbulb, ChevronDown, ChevronUp, Zap, ArrowRight,
  Mail, CheckCircle, AlertCircle,
} from 'lucide-react';
import { blink } from '../../blink/client';
import { useEstablishment } from '../../context/EstablishmentContext';
import { usePerformanceAlertEmail } from '../../hooks/usePerformanceAlertEmail';
import type { PerformanceSnapshot } from '../../lib/performanceAlertTemplates';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PerformanceData {
  reach: number;
  reachChange: number;
  views: number;
  viewsChange: number;
  engagement: number; // %
  engagementChange: number;
  posts: number; // this month
  bestPost: { title: string; platform: string; engagementRate: string };
  topPlatform: string;
  weeklyFrequency: number; // avg posts/week
  bookingClicks: number;
  estimatedRevenue: number;
}

// ── Section parser (splits streaming markdown into segments) ──────────────────

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) {
      return (
        <p key={i} className="text-sm font-extrabold text-foreground mt-4 mb-1 first:mt-0">
          {line.replace('## ', '')}
        </p>
      );
    }
    if (/^\d+\.\s\*\*/.test(line)) {
      const match = line.match(/^\d+\.\s\*\*(.*?)\*\*\s*:\s*(.*)/);
      if (match) {
        return (
          <div key={i} className="flex items-start gap-2 mb-1.5">
            <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[9px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
              {line[0]}
            </span>
            <p className="text-xs text-foreground leading-relaxed">
              <strong className="font-bold">{match[1]}</strong>
              {match[2] ? ` : ${match[2]}` : ''}
            </p>
          </div>
        );
      }
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      const content = line.replace(/^[-•]\s/, '');
      return (
        <div key={i} className="flex items-start gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
          <p className="text-xs text-foreground/85 leading-relaxed flex-1"
            dangerouslySetInnerHTML={{
              __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
            }}
          />
        </div>
      );
    }
    if (line.trim() === '') return null;
    return (
      <p key={i} className="text-xs text-foreground/85 leading-relaxed mb-1"
        dangerouslySetInnerHTML={{
          __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
        }}
      />
    );
  });
}

// ── Score ring ─────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Bon' : 'À améliorer';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <circle
            cx="32" cy="32" r={r} fill="none"
            stroke={color} strokeWidth="6"
            strokeDasharray={`${filled} ${c}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-extrabold text-foreground">{score}</span>
        </div>
      </div>
      <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Quick stats strip ──────────────────────────────────────────────────────────

function StatChip({ emoji, label, value, trend }: { emoji: string; label: string; value: string; trend: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 flex-1 min-w-0">
      <span className="text-base shrink-0">{emoji}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground leading-none mb-0.5 truncate">{label}</p>
        <p className={`text-xs font-extrabold leading-none ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-foreground'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface AIPerformanceInsightsProps {
  /** Optional: override default mock data with real data */
  data?: Partial<PerformanceData>;
  /** Whether to show in compact mode (less padding) */
  compact?: boolean;
}

export function AIPerformanceInsights({ data, compact = false }: AIPerformanceInsightsProps) {
  const { activeEstablishment } = useEstablishment();
  const estKpi = activeEstablishment.kpi;
  const { alertStatus, alertType, sendAlertIfNeeded, reset: resetAlert } = usePerformanceAlertEmail();

  // Merge real establishment data with defaults
  const perfData: PerformanceData = {
    reach: data?.reach ?? estKpi.reach,
    reachChange: data?.reachChange ?? estKpi.reachChange,
    views: data?.views ?? estKpi.views,
    viewsChange: data?.viewsChange ?? estKpi.viewsChange,
    engagement: data?.engagement ?? estKpi.engagement,
    engagementChange: data?.engagementChange ?? estKpi.engagementChange,
    posts: data?.posts ?? estKpi.posts,
    bestPost: data?.bestPost ?? {
      title: '🎉 Anniversaire 5 ans',
      platform: 'Instagram',
      engagementRate: '11.3%',
    },
    topPlatform: data?.topPlatform ?? 'Instagram',
    weeklyFrequency: data?.weeklyFrequency ?? (estKpi.posts > 0 ? Math.round((estKpi.posts / 4) * 10) / 10 : 2),
    bookingClicks: data?.bookingClicks ?? 0,
    estimatedRevenue: data?.estimatedRevenue ?? 0,
  };

  const [streamedText, setStreamedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  // Compute a simple performance score from the data
  const computeScore = (d: PerformanceData): number => {
    let s = 50;
    if (d.reachChange > 0) s += Math.min(15, d.reachChange / 2);
    if (d.engagementChange > 0) s += Math.min(10, d.engagementChange / 2);
    if (d.posts >= 8) s += 10;
    if (d.posts >= 12) s += 5;
    if (d.weeklyFrequency >= 3) s += 5;
    if (d.bookingClicks > 50) s += 5;
    return Math.min(100, Math.max(0, Math.round(s)));
  };

  const buildPrompt = (d: PerformanceData): string => {
    const revenueLine = d.estimatedRevenue > 0
      ? `\n- CA estimé généré : ${d.estimatedRevenue.toLocaleString('fr-FR')} €`
      : '';
    const clicksLine = d.bookingClicks > 0
      ? `\n- Clics sur liens de réservation : ${d.bookingClicks}`
      : '';

    return `Tu es un expert en marketing digital pour les TPE/PME françaises. Analyse ces données de performance des réseaux sociaux et fournis une analyse concise et actionnable en français.

Établissement : ${activeEstablishment.name}

Données de performance du mois en cours :
- Portée totale : ${d.reach.toLocaleString('fr-FR')} personnes (${d.reachChange >= 0 ? '+' : ''}${d.reachChange}% vs mois dernier)
- Vues totales : ${d.views.toLocaleString('fr-FR')} (${d.viewsChange >= 0 ? '+' : ''}${d.viewsChange}% vs mois dernier)
- Taux d'engagement moyen : ${d.engagement}% (${d.engagementChange >= 0 ? '+' : ''}${d.engagementChange}% vs mois dernier)
- Nombre de publications ce mois : ${d.posts} (objectif recommandé : 12/mois)
- Fréquence hebdomadaire : ${d.weeklyFrequency} post(s)/semaine
- Meilleur post : "${d.bestPost.title}" sur ${d.bestPost.platform} avec ${d.bestPost.engagementRate} d'engagement
- Plateforme la plus performante : ${d.topPlatform}${revenueLine}${clicksLine}

Réponds UNIQUEMENT avec ce format Markdown (pas d'introduction) :

## 🏆 Ce qui fonctionne
[2-3 points sur les points forts observés, quantifiés]

## ⚠️ Points d'amélioration
[2-3 faiblesses identifiées avec impact concret]

## 🎯 3 actions prioritaires cette semaine
1. **[Action courte]** : [explication concrète de pourquoi et comment]
2. **[Action courte]** : [explication concrète de pourquoi et comment]
3. **[Action courte]** : [explication concrète de pourquoi et comment]

## 💬 Sentiment des commentaires clients
[Synthèse du sentiment perçu en 2 phrases : tonalité générale (positif/neutre/négatif), signal d'alerte ou point fort, recommandation pour améliorer la perception]

## ⏰ Meilleurs créneaux de publication
[2 créneaux optimaux spécifiques à la plateforme top (jour + heure + raison courte), ex: Mardi 18h–19h (+28% engagement) — retour de bureau, forte activité scrolling]

## 💡 Opportunité cachée
[1 insight non-évident basé sur les données — insight que le gérant n'a probablement pas vu]

Maximum 280 mots. Sois direct, quantifié et axé résultats business.`;
  };

  const generate = async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setStreamedText('');
    setDone(false);
    setLoading(true);
    setScore(null);
    setExpanded(true);
    resetAlert();

    let fullText = '';

    try {
      await blink.ai.streamText(
        {
          messages: [{ role: 'user', content: buildPrompt(perfData) }],
          model: 'gpt-4.1-mini',
          maxTokens: 500,
          signal: abortRef.current.signal,
        },
        (chunk) => {
          fullText += chunk;
          setStreamedText(prev => prev + chunk);
        },
      );
      setScore(computeScore(perfData));

      // Build performance snapshot and send alert email if thresholds are met
      const snap: PerformanceSnapshot = {
        reach: perfData.reach,
        reachChange: perfData.reachChange,
        engagement: perfData.engagement,
        engagementChange: perfData.engagementChange,
        posts: perfData.posts,
        topPlatform: perfData.topPlatform,
        bestPostTitle: perfData.bestPost.title,
        estimatedRevenue: perfData.estimatedRevenue,
        establishmentName: activeEstablishment.name,
      };
      // Fire & forget — does not block UI
      sendAlertIfNeeded(snap, fullText).catch(() => {});
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (err?.message?.includes('401') || err?.name === 'BlinkAuthError') {
        blink.auth.login(window.location.href);
        return;
      }
      setStreamedText('Une erreur est survenue. Vérifiez votre connexion et réessayez.');
    } finally {
      setLoading(false);
      setDone(true);
    }
  };

  const hasAnalysis = streamedText.length > 0;
  const p = compact ? 'p-4' : 'p-5';

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className={`flex items-center gap-3 ${p} border-b border-border bg-gradient-to-r from-primary/8 via-violet-500/5 to-transparent`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-foreground leading-tight">
            Analyse IA des Performances ✨
          </p>
          <p className="text-[11px] text-muted-foreground">
            {done ? `Analyse de ${activeEstablishment.name} terminée` : 'Basée sur vos données du mois en cours'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasAnalysis && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title={expanded ? 'Réduire' : 'Agrandir'}
            >
              {expanded
                ? <ChevronUp size={14} className="text-muted-foreground" />
                : <ChevronDown size={14} className="text-muted-foreground" />
              }
            </button>
          )}
          <button
            onClick={generate}
            disabled={loading}
            className={`flex items-center gap-1.5 rounded-xl text-xs font-extrabold px-3 py-2 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${
              hasAnalysis
                ? 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                : 'bg-gradient-to-r from-primary to-violet-500 text-white shadow-md hover:opacity-90'
            }`}
          >
            {loading
              ? <><RefreshCw size={12} className="animate-spin" /> Analyse…</>
              : hasAnalysis
                ? <><RefreshCw size={12} /> Réanalyser</>
                : <><Zap size={12} /> Analyser mes performances</>
            }
          </button>
        </div>
      </div>

      {/* Quick stats strip — always visible */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${p} border-b border-border/60 bg-muted/20`}>
        <StatChip
          emoji="👁️"
          label="Portée ce mois"
          value={`${perfData.reach.toLocaleString('fr-FR')} (+${perfData.reachChange}%)`}
          trend="up"
        />
        <StatChip
          emoji="❤️"
          label="Engagement"
          value={`${perfData.engagement}% (${perfData.engagementChange >= 0 ? '+' : ''}${perfData.engagementChange}%)`}
          trend={perfData.engagementChange >= 0 ? 'up' : 'down'}
        />
        <StatChip
          emoji="📝"
          label="Publications"
          value={`${perfData.posts}/12 recommandés`}
          trend={perfData.posts >= 8 ? 'up' : 'down'}
        />
        <StatChip
          emoji="🏆"
          label="Top plateforme"
          value={perfData.topPlatform}
          trend="neutral"
        />
      </div>

      {/* Empty state — prompt to analyze */}
      {!hasAnalysis && !loading && (
        <div className={`flex flex-col items-center justify-center gap-4 ${compact ? 'py-8' : 'py-10'} px-6 text-center`}>
          <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center">
            <TrendingUp size={24} className="text-primary/50" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-foreground">
              Prêt à analyser vos performances
            </p>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              L'IA va étudier vos KPIs, identifier ce qui performe et vous donner 3 actions concrètes pour cette semaine.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {[
              { icon: TrendingUp, label: 'Tendances' },
              { icon: AlertTriangle, label: 'Alertes' },
              { icon: Target, label: 'Actions' },
              { icon: Lightbulb, label: 'Insights' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1">
                <Icon size={11} className="text-primary/60" />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={generate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-500 text-white font-extrabold text-sm px-5 py-2.5 hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
          >
            <Sparkles size={14} /> Lancer l'analyse IA
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && streamedText.length === 0 && (
        <div className={`${p} space-y-3`}>
          {[70, 50, 90, 60, 80].map((w, i) => (
            <div
              key={i}
              className="h-2.5 rounded-full bg-muted animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      )}

      {/* Streaming analysis */}
      <AnimatePresence>
        {hasAnalysis && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className={`${p} flex gap-5`}>
              {/* Score ring — shown after completion */}
              {score !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="shrink-0 flex flex-col items-center gap-2"
                >
                  <ScoreRing score={score} />
                  <p className="text-[10px] text-muted-foreground text-center leading-snug max-w-[64px]">
                    Score mensuel
                  </p>
                </motion.div>
              )}

              {/* Analysis text */}
              <div className="flex-1 min-w-0 space-y-0.5">
                {renderMarkdown(streamedText)}
                {loading && (
                  <span className="inline-block w-1 h-3.5 ml-0.5 bg-primary animate-pulse rounded-sm align-middle" />
                )}
              </div>
            </div>

            {/* Footer actions — shown after generation */}
            {done && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`flex items-center gap-3 ${p} pt-0 border-t border-border/50 flex-wrap`}
              >
                <a
                  href="/performance?tab=analytics#post-generator"
                  className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-gradient-to-r from-violet-500 to-primary rounded-lg px-3 py-1.5 hover:opacity-90 transition-all shadow-sm"
                >
                  <Sparkles size={11} /> Générer un post depuis cet insight
                  <ArrowRight size={10} />
                </a>
                <a
                  href="/calendar"
                  className="flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/8 hover:bg-primary/15 border border-primary/20 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <ArrowRight size={11} /> Aller au calendrier
                </a>
                <a
                  href="/performance"
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors"
                >
                  <TrendingUp size={11} /> Stats détaillées
                </a>
                <p className="text-[10px] text-muted-foreground ml-auto hidden sm:block">
                  Analyse générée le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </p>
              </motion.div>
            )}

            {/* Email alert status badge — shown after analysis when an alert was sent */}
            {done && (alertStatus === 'sent' || alertStatus === 'sending' || alertStatus === 'error') && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className={`mx-5 mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                  alertStatus === 'sent'
                    ? alertType === 'critical_drop'
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : alertStatus === 'error'
                      ? 'bg-muted text-muted-foreground border border-border'
                      : 'bg-muted/60 text-muted-foreground border border-border'
                }`}
              >
                {alertStatus === 'sending' && (
                  <><Mail size={12} className="animate-pulse shrink-0" /><span>Envoi de l'alerte e-mail…</span></>
                )}
                {alertStatus === 'sent' && alertType === 'critical_drop' && (
                  <><AlertCircle size={12} className="shrink-0 text-red-500" /><span>⚠️ Alerte baisse de performance envoyée par e-mail</span></>
                )}
                {alertStatus === 'sent' && alertType === 'positive_trend' && (
                  <><CheckCircle size={12} className="shrink-0 text-emerald-500" /><span>🚀 Rapport de tendance positive envoyé par e-mail ✓</span></>
                )}
                {alertStatus === 'error' && (
                  <><Mail size={12} className="shrink-0" /><span>Alerte e-mail non envoyée — vérifiez votre connexion</span></>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed hint */}
      {hasAnalysis && !expanded && (
        <div className={`${p} py-3 flex items-center gap-2 text-xs text-muted-foreground`}>
          <Sparkles size={11} className="text-primary/60 shrink-0" />
          Analyse disponible — cliquez sur ▲ pour l'afficher
          {score !== null && (
            <span className="ml-auto text-xs font-bold text-foreground">
              Score : {score}/100
            </span>
          )}
        </div>
      )}
    </div>
  );
}
