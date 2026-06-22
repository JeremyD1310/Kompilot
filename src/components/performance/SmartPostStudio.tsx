/**
 * SmartPostStudio
 *
 * Unified AI post creation experience:
 * 1. Performance-based smart suggestions (insight chips → pre-fill idea)
 * 2. Simple text idea input + quick category chips
 * 3. Streams 3 platform-specific post variants (Instagram, Facebook, LinkedIn)
 * 4. One-click copy + calendar scheduling per variant
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Zap, RefreshCw, Copy, Check, Calendar,
  ChevronDown, ChevronUp, X, Lightbulb, TrendingUp,
  ArrowRight, Star, Flame, Target, BarChart2,
} from 'lucide-react';
import { blink } from '../../blink/client';
import { useEstablishment } from '../../context/EstablishmentContext';
import {
  PLATFORM_CONFIG, QUICK_IDEAS,
  buildPostPrompt, parsePostVariants,
  type PerformanceContext, type PostVariant,
} from './smartPostStudioUtils';

// ── Insight suggestion type ────────────────────────────────────────────────────

interface InsightSuggestion {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  sublabel: string;
  idea: string;
  badge?: string;
}

// ── InsightChip ────────────────────────────────────────────────────────────────

function InsightChip({
  suggestion,
  onSelect,
}: {
  suggestion: InsightSuggestion;
  onSelect: (idea: string) => void;
}) {
  const Icon = suggestion.icon;
  return (
    <button
      onClick={() => onSelect(suggestion.idea)}
      className="group flex items-start gap-2.5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/4 p-3 transition-all text-left w-full"
    >
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-primary/8 ${suggestion.iconColor}`}>
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
          {suggestion.label}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{suggestion.sublabel}</p>
      </div>
      {suggestion.badge && (
        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5 shrink-0 self-start">
          {suggestion.badge}
        </span>
      )}
    </button>
  );
}

// ── PostCard ───────────────────────────────────────────────────────────────────

function PostCard({ variant, topPlatform }: { variant: PostVariant; topPlatform: string }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const cfg = PLATFORM_CONFIG[variant.platform];
  const isBest = variant.platform === topPlatform;
  const fullText = `${variant.content}\n\n${variant.hashtags.join(' ')}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSchedule = () => {
    const params = new URLSearchParams({
      draft: variant.content,
      hashtags: variant.hashtags.join(' '),
      platform: variant.platform,
    });
    window.location.href = `/calendar?${params.toString()}`;
  };

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all hover:shadow-md ${isBest ? 'ring-2 ring-primary/25' : ''}`}>
      <div className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${cfg.gradient} text-white`}>
        <span className="text-base shrink-0">{cfg.emoji}</span>
        <span className="text-sm font-extrabold flex-1">{variant.platform}</span>
        {isBest && (
          <span className="text-[10px] font-bold bg-white/25 rounded-full px-2 py-0.5 shrink-0">
            ⭐ Top perf
          </span>
        )}
        <span className="text-[10px] opacity-70 hidden sm:block shrink-0">{cfg.hint}</span>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-0.5 hover:bg-white/20 rounded transition-colors shrink-0"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pt-3 pb-2">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{variant.content}</p>
            </div>

            {variant.hashtags.length > 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1">
                {variant.hashtags.map((tag) => (
                  <span key={tag} className="text-[11px] font-semibold text-primary/80 bg-primary/8 rounded-full px-2 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {variant.tip && (
              <div className="mx-4 mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <Lightbulb size={12} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed">{variant.tip}</p>
              </div>
            )}

            <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {variant.content.length} / {cfg.maxChars.toLocaleString('fr-FR')} car.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground border border-border bg-background hover:bg-muted rounded-lg px-2.5 py-1.5 transition-all"
                >
                  {copied ? <><Check size={11} className="text-green-500" /> Copié !</> : <><Copy size={11} /> Copier</>}
                </button>
                <button
                  onClick={handleSchedule}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-gradient-to-r from-primary to-violet-500 rounded-lg px-2.5 py-1.5 hover:opacity-90 active:scale-[0.97] transition-all shadow-sm"
                >
                  <Calendar size={11} /> Programmer
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3">
      {(['Instagram', 'Facebook', 'LinkedIn'] as const).map((p) => (
        <div key={p} className="rounded-2xl border overflow-hidden animate-pulse">
          <div className="h-10 bg-muted" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-muted rounded-full w-full" />
            <div className="h-3 bg-muted rounded-full w-4/5" />
            <div className="h-3 bg-muted rounded-full w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface SmartPostStudioProps {
  performanceContext?: PerformanceContext;
  prefillIdea?: string;
}

export function SmartPostStudio({ performanceContext, prefillIdea = '' }: SmartPostStudioProps) {
  const { activeEstablishment } = useEstablishment();

  const ctx: PerformanceContext = performanceContext ?? {
    topPlatform: 'Instagram',
    bestPostTitle: 'Post le plus engagé',
    engagementRate: 6.5,
    reach: 5000,
    posts: 8,
    topEngagementDay: 'Mercredi',
  };

  const INSIGHT_SUGGESTIONS: InsightSuggestion[] = [
    {
      icon: Flame,
      iconColor: 'text-orange-500',
      label: `Répliquer le succès sur ${ctx.topPlatform}`,
      sublabel: `Votre plateforme #1 — ${ctx.engagementRate}% d'engagement`,
      idea: `Contenu inspiré de "${ctx.bestPostTitle}" — notre post le plus engagé sur ${ctx.topPlatform}`,
      badge: '⭐ Top',
    },
    {
      icon: TrendingUp,
      iconColor: 'text-emerald-500',
      label: 'Capitaliser sur la tendance du moment',
      sublabel: `Portée : ${ctx.reach.toLocaleString('fr-FR')} personnes ce mois`,
      idea: 'Partager une actualité ou tendance de notre secteur pour surfer sur notre visibilité actuelle',
    },
    {
      icon: Star,
      iconColor: 'text-yellow-500',
      label: 'Témoignage client fort',
      sublabel: 'Les avis augmentent la confiance de +40%',
      idea: 'Partager un témoignage client positif récent pour renforcer notre crédibilité',
      badge: 'Recommandé',
    },
    {
      icon: Target,
      iconColor: 'text-violet-500',
      label: 'Offre ciblée haute saison',
      sublabel: `${ctx.posts} posts ce mois — moment idéal pour convertir`,
      idea: "Créer une offre promotionnelle exclusive avec un call-to-action clair pour notre audience la plus active",
    },
    {
      icon: BarChart2,
      iconColor: 'text-blue-500',
      label: 'Storytelling métier',
      sublabel: 'Coulisses = +25% de portée organique',
      idea: "Montrer les coulisses de notre métier : préparation, savoir-faire, passion qui anime l'équipe",
    },
  ];

  const [idea, setIdea] = useState(prefillIdea);
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<PostVariant[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [rawText, setRawText] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const generate = async () => {
    if (!idea.trim()) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setVariants([]);
    setRawText('');
    setDone(false);
    setError('');
    setLoading(true);

    try {
      let full = '';
      await blink.ai.streamText(
        {
          messages: [{ role: 'user', content: buildPostPrompt(idea.trim(), ctx, activeEstablishment.name, activeEstablishment.activity) }],
          model: 'gpt-4.1-mini',
          maxTokens: 1400,
          signal: abortRef.current.signal,
        },
        (chunk) => { full += chunk; setRawText(full); },
      );
      setVariants(parsePostVariants(full));
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (err?.message?.includes('401') || err?.name === 'BlinkAuthError') {
        blink.auth.login(window.location.href);
        return;
      }
      setError('Erreur lors de la génération. Vérifiez votre connexion et réessayez.');
    } finally {
      setLoading(false);
      setDone(true);
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setVariants([]);
    setRawText('');
    setDone(false);
    setError('');
    setLoading(false);
    setIdea('');
  };

  const hasResults = variants.length > 0;
  const isGenerating = loading && rawText.length === 0;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-violet-500/10 via-primary/6 to-transparent">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shrink-0 shadow-sm">
          <Zap size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-foreground leading-tight">Studio Posts IA ✨</p>
          <p className="text-[11px] text-muted-foreground">
            Vos performances guident la rédaction — donnez juste l'idée
          </p>
        </div>
        {hasResults && (
          <button onClick={reset} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Context ribbon */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 bg-muted/15 flex-wrap">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">Contexte :</span>
        <span className="text-[11px] font-semibold text-foreground">🏆 Top : {ctx.topPlatform}</span>
        <span className="w-px h-3 bg-border shrink-0" />
        <span className="text-[11px] font-semibold text-foreground">❤️ {ctx.engagementRate}% eng.</span>
        <span className="w-px h-3 bg-border shrink-0" />
        <span className="text-[11px] font-semibold text-foreground">👁️ {ctx.reach.toLocaleString('fr-FR')} portée</span>
        {ctx.topEngagementDay && (
          <>
            <span className="w-px h-3 bg-border shrink-0" />
            <span className="text-[11px] font-semibold text-foreground">📅 {ctx.topEngagementDay}</span>
          </>
        )}
      </div>

      {/* Input zone */}
      {!hasResults && (
        <div className="p-5 space-y-5">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-3">
              💡 Suggestions basées sur vos performances →
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INSIGHT_SUGGESTIONS.map((s) => (
                <InsightChip key={s.label} suggestion={s} onSelect={setIdea} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">
              Ou choisissez un type de contenu →
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_IDEAS.map((chip) => (
                <button
                  key={chip.text}
                  onClick={() => setIdea(chip.text)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-foreground border border-border bg-background hover:bg-muted hover:border-primary/40 rounded-full px-3 py-1 transition-all"
                >
                  <span>{chip.emoji}</span>
                  <span>{chip.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate(); }}
              placeholder="Décrivez votre idée en quelques mots… ex: « promotion -20% sur les massages ce week-end »"
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <p className="absolute bottom-2.5 right-3 text-[10px] text-muted-foreground/50">⌘↵ pour générer</p>
          </div>

          <button
            onClick={generate}
            disabled={!idea.trim() || loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-primary text-white font-extrabold text-sm px-5 py-3 hover:opacity-90 active:scale-[0.99] transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? <><RefreshCw size={15} className="animate-spin" /> Génération en cours…</>
              : <><Sparkles size={15} /> Générer 3 posts optimisés</>
            }
          </button>
        </div>
      )}

      {/* Skeleton */}
      {isGenerating && <div className="p-5"><Skeleton /></div>}

      {/* Error */}
      {error && (
        <div className="mx-5 mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-red-500 text-lg">⚠️</span>
          <p className="text-xs text-red-700 flex-1">{error}</p>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 transition-colors"><X size={14} /></button>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {hasResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-primary/4">
              <Sparkles size={12} className="text-primary shrink-0" />
              <p className="text-[11px] text-muted-foreground flex-1 truncate">
                <strong className="text-foreground font-bold">Posts générés depuis :</strong>{' '}{idea}
              </p>
              <button onClick={reset} className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors shrink-0 flex items-center gap-1">
                <RefreshCw size={10} /> Nouvelle idée
              </button>
            </div>

            <div className="p-5 space-y-3">
              {variants.map((v) => (
                <PostCard key={v.platform} variant={v} topPlatform={ctx.topPlatform} />
              ))}
            </div>

            {done && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="px-5 py-4 border-t border-border bg-muted/20 flex items-center gap-3 flex-wrap"
              >
                <a
                  href="/calendar"
                  className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-gradient-to-r from-primary to-violet-500 rounded-lg px-3 py-1.5 hover:opacity-90 transition-all shadow-sm"
                >
                  <Calendar size={11} /> Aller au calendrier <ArrowRight size={10} />
                </a>
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/8 hover:bg-primary/15 border border-primary/20 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Zap size={11} /> Nouvelle idée
                </button>
                <p className="text-[10px] text-muted-foreground ml-auto hidden sm:block">
                  {variants.length} posts pour {activeEstablishment.name}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
