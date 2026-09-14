/**
 * AIContentSuggestions — Suggestions de contenu IA pour le calendrier.
 * Génère des idées de posts basées sur le secteur, la date et le contexte.
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, RefreshCw, Plus, ChevronDown, ChevronUp, Lightbulb, SlidersHorizontal, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import { generateContentSuggestions, type GeneratedContentSuggestion, type ContentTrendContext } from '../../lib/aiContentSuggestions';
import { apiFetch } from '../../hooks/useSocialPublish';
import { useAuth } from '../../hooks/useAuth';
import { useDemoMode } from '../../context/DemoModeContext';

// ── Types ────────────────────────────────────────────────────────────────────

type Suggestion = GeneratedContentSuggestion;
interface ActivityOverview {
  summary?: { totalPosts?: number };
  platformBreakdown?: Record<string, { avgEngagementRate?: number; postCount?: number }>;
  topPosts?: Array<{ text?: string }>;
}
interface TrendResponse { trends: ContentTrendContext[]; source: 'live-web' | 'fallback'; generatedAt: string; warning?: string; sources?: string[]; sourceDetails?: Array<{ url: string; title?: string }>; }

const DEMO_TRENDS: ContentTrendContext[] = [
  { title: 'Coulisses et preuve du savoir-faire', summary: 'Montrez les personnes et gestes qui rendent votre établissement unique.', contentAngles: ['Une journée dans votre établissement'], platforms: ['Instagram', 'TikTok'], signal: 'Format recommandé' },
  { title: 'Conseil utile en format court', summary: 'Répondez à une question fréquente avec une astuce immédiatement applicable.', contentAngles: ['Une erreur à éviter'], platforms: ['LinkedIn', 'Instagram'], signal: 'Fort potentiel d’engagement' },
  { title: 'Ancrage local et communauté', summary: 'Reliez votre activité à la vie du quartier et invitez les habitants à participer.', contentAngles: ['Question aux habitants'], platforms: ['Facebook', 'Google Business'], signal: 'Pertinent localement' },
];

const DEMO_SUGGESTIONS: Suggestion[] = [
  { id: 'demo-suggestion-1', title: '📍 Une preuve locale à montrer', content: 'Montrez en quelques images les gestes, visages et détails qui font la différence dans votre établissement. Invitez votre communauté à partager le moment qu’elle préfère.\n\n#CommerceLocal #SavoirFaire', tone: 'engageant', platform: 'Instagram', emoji: '📍' },
  { id: 'demo-suggestion-2', title: '💡 Le conseil du professionnel', content: 'Répondez à une question fréquente de vos clients avec une méthode simple, une étape par étape et une invitation à vous écrire pour aller plus loin.\n\n#Conseil #Expertise', tone: 'professionnel', platform: 'LinkedIn', emoji: '💡' },
  { id: 'demo-suggestion-3', title: '🤝 La conversation du quartier', content: 'Posez une question concrète à votre communauté locale et utilisez les réponses pour préparer votre prochaine publication ou offre.\n\n#Communauté #Local', tone: 'engageant', platform: 'Facebook', emoji: '🤝' },
];

const TONE_COLORS: Record<Suggestion['tone'], string> = {
  professionnel: 'bg-blue-100 text-blue-700',
  engageant: 'bg-violet-100 text-violet-700',
  promotionnel: 'bg-amber-100 text-amber-700',
};

// ── Suggestion Card ──────────────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  onUse,
  expanded,
  onToggle,
}: {
  suggestion: Suggestion;
  onUse: (text: string) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-border rounded-xl bg-background overflow-hidden hover:border-primary/30 transition-all">
      <button
        className="w-full flex items-start gap-3 p-3 text-left"
        onClick={onToggle}
      >
        <span className="text-lg shrink-0 mt-0.5">{suggestion.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <p className="text-xs font-bold text-foreground">{suggestion.title}</p>
            <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', TONE_COLORS[suggestion.tone])}>
              {suggestion.tone}
            </span>
            <span className="text-[9px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
              {suggestion.platform}
            </span>
          </div>
          <p className={cn('text-[11px] text-muted-foreground leading-relaxed', expanded ? '' : 'line-clamp-2')}>
            {suggestion.content}
          </p>
        </div>
        <div className="shrink-0 text-muted-foreground mt-0.5">
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3">
          <button
            onClick={() => onUse(suggestion.content)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
          >
            <Plus size={12} /> Utiliser ce post
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface AIContentSuggestionsProps {
  sector?: string;
  city?: string;
  onUseIdea: (text: string) => void;
  className?: string;
}

export function AIContentSuggestions({ sector, city, onUseIdea, className }: AIContentSuggestionsProps) {
  const { user } = useAuth();
  const { isDemoActive } = useDemoMode();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [tone, setTone] = useState<Suggestion['tone']>('professionnel');
  const [objective, setObjective] = useState('engagement');
  const [language, setLanguage] = useState('français');
  const autoGeneratedRef = useRef(false);

  const { data: activity } = useQuery<ActivityOverview>({
    queryKey: ['social-activity-overview', user?.id],
    queryFn: () => apiFetch<ActivityOverview>('/api/social-analytics/overview?days=30'),
    enabled: Boolean(user?.id) && !isDemoActive,
    staleTime: 300_000,
    retry: false,
  });
  const { data: trendData, isLoading: trendsLoading, isFetching: trendsFetching, isError: trendsError, refetch: refetchTrends } = useQuery<TrendResponse>({
    queryKey: ['content-trends', sector, city],
    queryFn: () => apiFetch<TrendResponse>(`/api/content-trends?sector=${encodeURIComponent(sector || 'commerce local')}&city=${encodeURIComponent(city || 'France')}`),
    enabled: Boolean(user?.id) && !isDemoActive,
    staleTime: 15 * 60 * 1000,
    retry: false,
  });

  const activityContext = activity ? {
    postCount: activity.summary?.totalPosts ?? 0,
    metricCount: Object.values(activity.platformBreakdown ?? {}).reduce((total, item) => total + (item.postCount ?? 0), 0),
    topPlatform: Object.entries(activity.platformBreakdown ?? {}).sort(([, left], [, right]) => (right.avgEngagementRate ?? 0) - (left.avgEngagementRate ?? 0))[0]?.[0],
    averageEngagementRate: (() => { const entries = Object.values(activity.platformBreakdown ?? {}); return entries.length ? Math.round((entries.reduce((total, item) => total + (item.avgEngagementRate ?? 0), 0) / entries.length) * 100) / 100 : 0; })(),
    recentThemes: (activity.topPosts ?? []).map(post => post.text?.trim()).filter(Boolean).slice(0, 3) as string[],
  } : undefined;
  const trends = isDemoActive ? DEMO_TRENDS : (trendData?.trends ?? DEMO_TRENDS);

  const generateSuggestions = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      if (isDemoActive) {
        await new Promise(resolve => setTimeout(resolve, 350));
        setSuggestions(DEMO_SUGGESTIONS);
        setExpandedId(null);
        return;
      }
      const generated = await generateContentSuggestions({ sector, city, tone, objective, language, trends, activity: activityContext });
      setSuggestions(generated);
      setExpandedId(null);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Impossible de générer des suggestions. Vérifiez votre connexion.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isDemoActive) return;
    if (!user?.id || (!trendData && !trendsError) || autoGeneratedRef.current) return;
    autoGeneratedRef.current = true;
    void generateSuggestions();
  }, [trendData, trendsError, user?.id, isDemoActive]);

  return (
    <div className={cn('rounded-2xl border border-border bg-card overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-violet-500/5 to-primary/5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-200 flex items-center justify-center">
              <Lightbulb size={13} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-none">Suggestions IA</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {sector ? `Pour ${sector}${city ? ` · ${city}` : ''}` : 'Idées adaptées à votre activité'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowControls(value => !value)}
              className={cn('flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold transition-all', showControls ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}
              title="Personnaliser les suggestions"
            >
              <SlidersHorizontal size={11} />
            </button>
            <button
              onClick={() => { void refetchTrends(); void generateSuggestions(); }}
              disabled={isGenerating || trendsFetching}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 rounded-lg px-2.5 py-1.5 transition-all disabled:opacity-50"
            >
              {isGenerating || trendsFetching ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
              {isGenerating ? 'Génération...' : 'Actualiser'}
            </button>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          {isDemoActive ? 'Aperçu de démonstration · aucune recherche web effectuée' : trendsLoading ? 'Recherche des tendances récentes...' : trendData?.source === 'live-web' ? `Tendances web · actualisées ${new Date(trendData.generatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : trendsError ? 'Conseils evergreen · recherche web indisponible' : 'Tendances de secours · recherche web indisponible'}
        </p>
        {!isDemoActive && trendData?.sourceDetails?.length ? <div className="mt-1 flex flex-wrap gap-2">{trendData.sourceDetails.slice(0, 3).map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"><ExternalLink size={9} />{source.title || 'Source web'}</a>)}</div> : null}
      </div>

      {showControls && (
        <div className="grid grid-cols-1 gap-2 border-b border-border bg-muted/20 px-4 py-3 sm:grid-cols-3">
          <label className="text-[10px] font-semibold text-muted-foreground">Ton
            <select value={tone} onChange={event => setTone(event.target.value as Suggestion['tone'])} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground">
              <option value="professionnel">Professionnel</option>
              <option value="engageant">Engageant</option>
              <option value="promotionnel">Promotionnel</option>
            </select>
          </label>
          <label className="text-[10px] font-semibold text-muted-foreground">Objectif
            <select value={objective} onChange={event => setObjective(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground">
              <option value="engagement">Engagement</option>
              <option value="conversion">Conversion</option>
              <option value="visibilité">Visibilité</option>
            </select>
          </label>
          <label className="text-[10px] font-semibold text-muted-foreground">Langue
            <select value={language} onChange={event => setLanguage(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground">
              <option value="français">Français</option>
              <option value="anglais">Anglais</option>
              <option value="espagnol">Espagnol</option>
            </select>
          </label>
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div className="px-4 py-2 text-xs text-red-500 bg-red-50 border-b border-red-100">
          {errorMsg}
        </div>
      )}

      {suggestions.length === 0 && !isGenerating && !errorMsg && (
        <div className="px-4 py-7 text-center text-xs text-muted-foreground">
          Générez des idées adaptées à votre secteur, votre ville et aux tendances récentes.
        </div>
      )}

      {/* Suggestions */}
      <div className="p-3 space-y-2">
        {isGenerating ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-3 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-muted rounded shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-muted rounded w-1/3" />
                    <div className="h-2 bg-muted rounded w-4/5" />
                    <div className="h-2 bg-muted rounded w-3/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          suggestions.map(s => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              onUse={onUseIdea}
              expanded={expandedId === s.id}
              onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
            />
          ))
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-3 pb-3 pt-1 border-t border-border bg-muted/20">
        <button
          onClick={generateSuggestions}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-primary/30 text-xs font-semibold text-primary hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-40"
        >
          <Sparkles size={11} /> Générer de nouvelles idées avec l'IA
        </button>
      </div>
    </div>
  );
}
