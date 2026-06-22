/**
 * AIPostGeneratorFromInsights
 *
 * Generates optimized social media posts based on:
 * - The user's simple idea/topic input
 * - Their real performance data (best platform, engagement, tone of best posts)
 *
 * Features:
 * - Quick idea input with suggestion chips
 * - Performance-informed prompt building (uses top platform, best post context)
 * - Generates 3 platform-tailored post variants simultaneously
 * - One-click copy + redirect to calendar for scheduling
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, RefreshCw, Copy, Check, Calendar,
  ChevronDown, ChevronUp,
  Lightbulb, Zap, ArrowRight, X,
} from 'lucide-react';
import { blink } from '../../blink/client';
import { useEstablishment } from '../../context/EstablishmentContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PostVariant {
  platform: 'Instagram' | 'Facebook' | 'LinkedIn';
  emoji: string;
  content: string;
  hashtags: string[];
  tip: string;
  charCount: number;
}

interface PerformanceContext {
  topPlatform: string;
  bestPostTitle: string;
  engagementRate: number;
  reach: number;
  posts: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PLATFORM_CONFIG = {
  Instagram: {
    emoji: '📸',
    headerEmoji: '📸',
    color: 'from-pink-500 to-orange-400',
    bg: 'bg-pink-50 border-pink-200',
    text: 'text-pink-700',
    maxChars: 2200,
    hint: 'Stories + Reels favorisés',
  },
  Facebook: {
    emoji: '📘',
    headerEmoji: '📘',
    color: 'from-blue-600 to-blue-400',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    maxChars: 63206,
    hint: 'Portée organique + partage',
  },
  LinkedIn: {
    emoji: '💼',
    headerEmoji: '💼',
    color: 'from-sky-700 to-sky-500',
    bg: 'bg-sky-50 border-sky-200',
    text: 'text-sky-700',
    maxChars: 3000,
    hint: 'Ton professionnel recommandé',
  },
} as const;

const IDEA_CHIPS = [
  '🎉 Promotion flash',
  '🍽️ Plat du jour',
  '💆 Nouvelle prestation',
  '🌟 Témoignage client',
  '📅 Événement à venir',
  '🎁 Offre spéciale',
  '🛠️ Coulisses métier',
  '✨ Avant/après',
];

// ── Platform Card ─────────────────────────────────────────────────────────────

function PlatformCard({
  variant,
  isBest,
}: {
  variant: PostVariant;
  isBest: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const cfg = PLATFORM_CONFIG[variant.platform];

  const fullText = `${variant.content}\n\n${variant.hashtags.join(' ')}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSchedule = () => {
    // Encode content for calendar page pre-fill via URL hash
    const params = new URLSearchParams({
      draft: variant.content,
      hashtags: variant.hashtags.join(' '),
      platform: variant.platform,
    });
    window.location.href = `/calendar?${params.toString()}`;
  };

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all hover:shadow-md ${isBest ? 'ring-2 ring-primary/30' : ''}`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${cfg.color} text-white`}>
        <span className="text-base shrink-0">{cfg.headerEmoji}</span>
        <span className="text-sm font-extrabold flex-1">{variant.platform}</span>
        {isBest && (
          <span className="text-[10px] font-bold bg-white/20 rounded-full px-2 py-0.5">
            ⭐ Top perf
          </span>
        )}
        <span className="text-[10px] opacity-75">{cfg.hint}</span>
        <button
          onClick={() => setExpanded(v => !v)}
          className="p-0.5 hover:bg-white/20 rounded transition-colors"
        >
          {expanded
            ? <ChevronUp size={13} />
            : <ChevronDown size={13} />
          }
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
            {/* Post content */}
            <div className="px-4 pt-3 pb-2">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {variant.content}
              </p>
            </div>

            {/* Hashtags */}
            {variant.hashtags.length > 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1">
                {variant.hashtags.map(tag => (
                  <span
                    key={tag}
                    className="text-[11px] font-semibold text-primary/80 bg-primary/8 rounded-full px-2 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Tip */}
            {variant.tip && (
              <div className="mx-4 mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <Lightbulb size={12} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed">{variant.tip}</p>
              </div>
            )}

            {/* Footer actions */}
            <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {variant.content.length} / {cfg.maxChars.toLocaleString('fr-FR')} car.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground border border-border bg-background hover:bg-muted rounded-lg px-2.5 py-1.5 transition-all"
                >
                  {copied
                    ? <><Check size={11} className="text-green-500" /> Copié !</>
                    : <><Copy size={11} /> Copier</>
                  }
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

// ── Streaming skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {['Instagram', 'Facebook', 'LinkedIn'].map(platform => (
        <div key={platform} className="rounded-2xl border overflow-hidden animate-pulse">
          <div className="h-10 bg-muted" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-muted rounded-full w-full" />
            <div className="h-3 bg-muted rounded-full w-4/5" />
            <div className="h-3 bg-muted rounded-full w-3/5" />
            <div className="h-2 bg-muted/60 rounded-full w-2/5 mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Parse AI response into variants ──────────────────────────────────────────

function parseVariants(raw: string): PostVariant[] {
  const platforms: Array<PostVariant['platform']> = ['Instagram', 'Facebook', 'LinkedIn'];
  const variants: PostVariant[] = [];

  for (const platform of platforms) {
    // Match section between platform markers
    const regex = new RegExp(
      `### ${platform}[\\s\\S]*?(?=### (?:Instagram|Facebook|LinkedIn)|$)`,
      'i'
    );
    const match = raw.match(regex);
    if (!match) continue;

    const section = match[0];

    // Extract content (everything between CONTENU: and HASHTAGS: or CONSEIL:)
    const contentMatch = section.match(/CONTENU:\s*([\s\S]*?)(?=HASHTAGS:|CONSEIL:|$)/i);
    const hashtagsMatch = section.match(/HASHTAGS:\s*([\s\S]*?)(?=CONSEIL:|$)/i);
    const tipMatch = section.match(/CONSEIL:\s*([\s\S]*?)(?=###|$)/i);

    const content = contentMatch?.[1]?.trim() ?? '';
    const hashtagsRaw = hashtagsMatch?.[1]?.trim() ?? '';
    const hashtags = hashtagsRaw
      .split(/\s+/)
      .filter(t => t.startsWith('#'))
      .slice(0, 10);
    const tip = tipMatch?.[1]?.trim() ?? '';

    if (content) {
      variants.push({
        platform,
        emoji: PLATFORM_CONFIG[platform].emoji,
        content,
        hashtags,
        tip,
        charCount: content.length,
      });
    }
  }

  return variants;
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface AIPostGeneratorFromInsightsProps {
  performanceContext?: PerformanceContext;
  /** Pre-fill the idea input (e.g. from an "insight" CTA) */
  prefillIdea?: string;
  compact?: boolean;
}

export function AIPostGeneratorFromInsights({
  performanceContext,
  prefillIdea = '',
  compact = false,
}: AIPostGeneratorFromInsightsProps) {
  const { activeEstablishment } = useEstablishment();

  const [idea, setIdea] = useState(prefillIdea);
  const [loading, setLoading] = useState(false);
  const [rawResponse, setRawResponse] = useState('');
  const [variants, setVariants] = useState<PostVariant[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const ctx = performanceContext ?? {
    topPlatform: 'Instagram',
    bestPostTitle: 'Post le plus engagé',
    engagementRate: 6.5,
    reach: 5000,
    posts: 8,
  };

  const buildPrompt = (userIdea: string): string => {
    const estName = activeEstablishment.name;
    const sector = activeEstablishment.activity;

    return `Tu es un expert en marketing des réseaux sociaux pour les TPE/PME françaises. Génère 3 publications optimisées pour les réseaux sociaux d'un établissement nommé "${estName}" (secteur : ${sector}).

Idée du gérant : "${userIdea}"

Contexte de performance actuel de l'établissement :
- Plateforme la plus performante ce mois : ${ctx.topPlatform}
- Meilleur post récent : "${ctx.bestPostTitle}"
- Taux d'engagement moyen : ${ctx.engagementRate}%
- Portée mensuelle : ${ctx.reach.toLocaleString('fr-FR')} personnes
- Nombre de posts ce mois : ${ctx.posts}

IMPORTANT : Adapte le style et le ton de chaque post à la plateforme et au secteur d'activité. Pour ${ctx.topPlatform}, donne le meilleur contenu possible car c'est la plateforme principale.

Réponds EXACTEMENT dans ce format (respecte les séparateurs ### et les labels en majuscules) :

### Instagram
CONTENU:
[Post Instagram accrocheur, émojis, ton authentique, 150-300 mots, parfait pour le feed ou les Stories. Commence par une phrase d'accroche percutante.]

HASHTAGS:
#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5 #hashtag6 #hashtag7 #hashtag8

CONSEIL:
[Un conseil précis pour maximiser les résultats sur Instagram : meilleur moment de publication, format recommandé (Reel, Carrousel, Story), ou technique d'engagement spécifique.]

### Facebook
CONTENU:
[Post Facebook plus narratif, favorise le partage et la communauté, 100-250 mots. Ton plus chaleureux et conversationnel.]

HASHTAGS:
#hashtag1 #hashtag2 #hashtag3 #hashtag4

CONSEIL:
[Conseil spécifique Facebook : boost, partage en groupe local, heure de publication optimale, etc.]

### LinkedIn
CONTENU:
[Post LinkedIn professionnel et valorisant pour le métier, 150-300 mots. Partage d'expertise, coulisses positives, ton inspirant mais ancré dans le réel.]

HASHTAGS:
#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5

CONSEIL:
[Conseil LinkedIn : format idéal (sondage, article, post standard), heure B2B optimale, invitation à l'interaction.]

Ne rajoute aucun texte avant "### Instagram" ni après le dernier CONSEIL.`;
  };

  const generate = async () => {
    if (!idea.trim()) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setRawResponse('');
    setVariants([]);
    setDone(false);
    setError('');
    setLoading(true);

    try {
      let full = '';
      await blink.ai.streamText(
        {
          messages: [{ role: 'user', content: buildPrompt(idea.trim()) }],
          model: 'gpt-4.1-mini',
          maxTokens: 1200,
          signal: abortRef.current.signal,
        },
        (chunk) => {
          full += chunk;
          setRawResponse(full);
        },
      );
      const parsed = parseVariants(full);
      setVariants(parsed);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (err?.message?.includes('401') || err?.name === 'BlinkAuthError') {
        blink.auth.login(window.location.href);
        return;
      }
      setError('Une erreur est survenue. Vérifiez votre connexion et réessayez.');
    } finally {
      setLoading(false);
      setDone(true);
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setRawResponse('');
    setVariants([]);
    setDone(false);
    setError('');
    setLoading(false);
  };

  const hasResults = variants.length > 0;
  const p = compact ? 'p-4' : 'p-5';

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className={`flex items-center gap-3 ${p} border-b border-border bg-gradient-to-r from-violet-500/10 via-primary/8 to-transparent`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shrink-0 shadow-sm">
          <Zap size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-foreground leading-tight">
            Générateur de Posts Intelligent ✨
          </p>
          <p className="text-[11px] text-muted-foreground">
            Vos performances guident la rédaction — donnez juste l'idée
          </p>
        </div>
        {hasResults && (
          <button
            onClick={reset}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Recommencer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Performance context ribbon */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 bg-muted/15 flex-wrap">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
          Contexte actuel :
        </span>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
          <span>🏆</span> Top : {ctx.topPlatform}
        </span>
        <span className="w-px h-3 bg-border shrink-0" />
        <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
          <span>❤️</span> {ctx.engagementRate}% engagement
        </span>
        <span className="w-px h-3 bg-border shrink-0" />
        <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
          <span>👁️</span> {ctx.reach.toLocaleString('fr-FR')} portée
        </span>
      </div>

      {/* Input zone */}
      {!hasResults && (
        <div className={`${p} space-y-4`}>
          {/* Idea chips */}
          <div>
            <p className="text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-wide">
              Idées rapides →
            </p>
            <div className="flex flex-wrap gap-1.5">
              {IDEA_CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => setIdea(chip.replace(/^[\p{Emoji}]\s*/u, ''))}
                  className="text-[11px] font-semibold text-foreground border border-border bg-background hover:bg-muted hover:border-primary/40 rounded-full px-3 py-1 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Text input */}
          <div className="relative">
            <textarea
              value={idea}
              onChange={e => setIdea(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  generate();
                }
              }}
              placeholder="Décrivez votre idée en quelques mots… ex: « promotion -20% sur les massages ce week-end »"
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <p className="absolute bottom-2.5 right-3 text-[10px] text-muted-foreground/50">
              ⌘↵ pour générer
            </p>
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={!idea.trim() || loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-primary text-white font-extrabold text-sm px-5 py-3 hover:opacity-90 active:scale-[0.99] transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? <><RefreshCw size={14} className="animate-spin" /> Génération en cours…</>
              : <><Sparkles size={14} /> Générer 3 posts optimisés</>
            }
          </button>

          {/* Performance note */}
          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
            L'IA adapte chaque post à votre taux d'engagement de <strong>{ctx.engagementRate}%</strong> et
            à votre meilleure plateforme (<strong>{ctx.topPlatform}</strong>)
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && variants.length === 0 && (
        <div className={`${p}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center">
              <Sparkles size={10} className="text-white animate-pulse" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              Génération des posts en cours…
            </p>
          </div>
          <LoadingSkeleton />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={`${p}`}>
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
          <button
            onClick={reset}
            className="mt-3 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Results */}
      {hasResults && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${p} space-y-3`}
        >
          {/* Idea recap */}
          <div className="flex items-center gap-2 rounded-xl bg-violet-50 border border-violet-200 px-3 py-2">
            <Lightbulb size={13} className="text-violet-600 shrink-0" />
            <p className="text-[11px] text-violet-800 leading-relaxed flex-1">
              <strong>Idée :</strong> {idea}
            </p>
            <button
              onClick={reset}
              className="text-[10px] font-bold text-violet-600 hover:text-violet-800 underline underline-offset-2 shrink-0"
            >
              Modifier
            </button>
          </div>

          {/* Platform variants */}
          {variants.map(variant => (
            <PlatformCard
              key={variant.platform}
              variant={variant}
              isBest={variant.platform === ctx.topPlatform}
            />
          ))}

          {/* If parsing returned no variants (fallback: show raw) */}
          {variants.length === 0 && done && rawResponse && (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {rawResponse}
              </p>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <button
              onClick={generate}
              className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground border border-border bg-background hover:bg-muted rounded-lg px-3 py-2 transition-all"
            >
              <RefreshCw size={11} /> Régénérer
            </button>
            <a
              href="/calendar"
              className="flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/8 hover:bg-primary/15 border border-primary/20 rounded-lg px-3 py-2 transition-colors"
            >
              <Calendar size={11} /> Ouvrir le calendrier
              <ArrowRight size={10} />
            </a>
            <p className="text-[10px] text-muted-foreground ml-auto hidden sm:block">
              3 variantes générées • {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
