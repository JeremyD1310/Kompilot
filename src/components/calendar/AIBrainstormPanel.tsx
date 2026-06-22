import { useState, useCallback } from 'react';
import {
  Sparkles, RefreshCw, Zap, ChevronRight, Target, TrendingUp,
  Lightbulb, MessageSquare, BarChart2, ArrowRight, Check,
} from 'lucide-react';
import { blink } from '../../blink/client';
import { useOnboardingProfile } from '../../hooks/useOnboardingProfile';
import { useContentPillars } from '../../context/ContentPillarsContext';
import { toast } from '@blinkdotnew/ui';
import { AIErrorFallback } from '../shared/AIErrorFallback';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContentIdea {
  id: string;
  title: string;
  hook: string;
  pillar?: string;
  pillarEmoji?: string;
  type: 'tip' | 'story' | 'promo' | 'question' | 'trend';
  channels: string[];
}

interface TextAnalysis {
  score: number; // 0-100 engagement score
  hook_quality: string; // 'weak' | 'decent' | 'strong'
  cta_present: boolean;
  emoji_usage: string; // 'none' | 'few' | 'good' | 'too_many'
  length_rating: string; // 'too_short' | 'ideal' | 'too_long'
  suggestions: string[];
  improved_hook: string;
}

const TYPE_META: Record<ContentIdea['type'], { label: string; color: string; bgColor: string }> = {
  tip:      { label: 'Conseil expert',  color: 'text-blue-700',   bgColor: 'bg-blue-50 border-blue-200'    },
  story:    { label: 'Coulisses',        color: 'text-violet-700', bgColor: 'bg-violet-50 border-violet-200' },
  promo:    { label: 'Promotion',        color: 'text-amber-700',  bgColor: 'bg-amber-50 border-amber-200'   },
  question: { label: 'Engagement',       color: 'text-emerald-700',bgColor: 'bg-emerald-50 border-emerald-200'},
  trend:    { label: 'Tendance',         color: 'text-rose-700',   bgColor: 'bg-rose-50 border-rose-200'     },
};

// ── Static fallback ideas (shown before generation) ───────────────────────────

function buildFallbackIdeas(sector: string, pillars: { label: string; emoji: string; id: string }[]): ContentIdea[] {
  const pillar0 = pillars[0] ?? { label: 'Conseils', emoji: '🎓', id: 'p0' };
  const pillar1 = pillars[1] ?? { label: 'Coulisses', emoji: '🎬', id: 'p1' };

  const base: ContentIdea[] = [
    {
      id: 'fb1', title: `Conseil de la semaine — ${pillar0.label}`,
      hook: `💡 Saviez-vous que 72% de vos clients lisent les avis avant de choisir où manger ? Répondre à chaque avis — même négatif — augmente votre note Google de 0,4 point en moyenne. On répond à tous les nôtres sous 24h. Et vous ?`,
      type: 'tip', pillar: pillar0.label, pillarEmoji: pillar0.emoji,
      channels: ['linkedin', 'facebook'],
    },
    {
      id: 'fb2', title: `Coulisses : une journée chez nous`,
      hook: `🌅 5h30 du matin. Le four est déjà chaud. Pendant que la ville dort encore, notre équipe prépare les 80 couverts du déjeuner. Ce que vous voyez dans votre assiette, c'est 4h de travail invisible. Merci de le savourer. 🙏`,
      type: 'story', pillar: pillar1.label, pillarEmoji: pillar1.emoji,
      channels: ['instagram', 'facebook'],
    },
    {
      id: 'fb3', title: "Question engagement — votre avis compte",
      hook: `🤔 On hésite entre deux nouvelles formules pour cet été : la version végétarienne ou le menu Terre & Mer. Et si c'était vous qui décidiez ? Commentez votre préférence 👇 Le gagnant sera sur la carte dès le 1er juin !`,
      type: 'question', channels: ['linkedin', 'instagram'],
    },
    {
      id: 'fb4', title: 'Transformation client — Avant / Après',
      hook: `✨ Ils nous ont confié un événement de 200 personnes avec 15 jours de préavis. Résultat ? 200 sourires, 0 imprévu, 3 tables supplémentaires ouvertes en urgence. La confiance se mérite — on la gagne chaque jour. 🏆`,
      type: 'promo', channels: ['instagram', 'google_business'],
    },
  ];
  return base;
}

// ── Score meter ───────────────────────────────────────────────────────────────

function ScoreMeter({ score }: { score: number }) {
  const color = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-400';
  const label = score >= 75 ? 'Excellent 🔥' : score >= 50 ? 'Bon 👍' : 'À améliorer ⚠️';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-bold text-foreground shrink-0">{score}/100</span>
      <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
    </div>
  );
}

// ── Idea card ─────────────────────────────────────────────────────────────────

function IdeaCard({
  idea,
  onUse,
}: {
  idea: ContentIdea;
  onUse: (hook: string) => void;
}) {
  const meta = TYPE_META[idea.type];
  return (
    <div
      className={`group rounded-xl border ${meta.bgColor} p-3.5 space-y-2 cursor-pointer hover:shadow-sm transition-all duration-150`}
      onClick={() => onUse(idea.hook)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wide ${meta.color} bg-white/70 border rounded-full px-2 py-0.5`}>
            {idea.pillarEmoji && <span className="mr-1">{idea.pillarEmoji}</span>}
            {meta.label}
          </span>
          {idea.pillar && (
            <span className="text-[10px] text-muted-foreground">· {idea.pillar}</span>
          )}
        </div>
        <div className="shrink-0 w-6 h-6 rounded-lg bg-white/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight size={11} className={meta.color} />
        </div>
      </div>
      <p className="text-xs font-semibold text-foreground leading-snug">{idea.title}</p>
      <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">{idea.hook}</p>
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex gap-1 flex-wrap">
          {idea.channels.slice(0, 3).map(ch => (
            <span key={ch} className="text-[10px] rounded-full bg-background border border-border px-1.5 py-0.5 text-muted-foreground capitalize">
              {ch.replace('_', ' ')}
            </span>
          ))}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onUse(idea.hook); }}
          className={`flex items-center gap-1 text-[10px] font-bold ${meta.color} hover:opacity-80 transition-opacity`}
        >
          Utiliser <ChevronRight size={10} />
        </button>
      </div>
    </div>
  );
}

// ── Analysis badge ─────────────────────────────────────────────────────────────

function AnalysisBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border ${
      ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
    }`}>
      {ok
        ? <Check size={11} className="shrink-0" />
        : <span className="text-amber-500 shrink-0">!</span>
      }
      {label}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export type BrainstormTab = 'ideas' | 'optimize';

interface AIBrainstormPanelProps {
  currentText: string;
  onUseIdea: (text: string) => void;
  onReplaceText: (text: string) => void;
  activeTab: BrainstormTab;
  onTabChange: (tab: BrainstormTab) => void;
  onOptimize?: () => void;
}

export function AIBrainstormPanel({
  currentText,
  onUseIdea,
  onReplaceText,
  activeTab,
  onTabChange,
  onOptimize: _onOptimize,
}: AIBrainstormPanelProps) {
  const profile = useOnboardingProfile();
  const { pillars } = useContentPillars();

  // Ideas tab state
  const [ideas, setIdeas] = useState<ContentIdea[]>(() =>
    buildFallbackIdeas(profile?.sector ?? '', pillars)
  );
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [ideasError, setIdeasError] = useState(false);
  const [analysisError, setAnalysisError] = useState(false);

  // Optimize tab state
  const [analysis, setAnalysis] = useState<TextAnalysis | null>(null);
  const [analyzingText, setAnalyzingText] = useState(false);
  const [lastAnalyzedText, setLastAnalyzedText] = useState('');
  const [copiedHook, setCopiedHook] = useState(false);

  // Generate fresh AI ideas ──────────────────────────────────────────────────
  const generateIdeas = useCallback(async () => {
    setGeneratingIdeas(true);
    try {
      const pillarList = pillars.map(p => `${p.emoji} ${p.label}${p.description ? ` (${p.description})` : ''}`).join(', ');
      const { object } = await blink.ai.generateObject({
        prompt: `Tu es expert en content marketing pour TPE/PME.
Secteur de l'entreprise : ${profile?.sector ?? 'général'}
Objectif : ${profile?.objective ?? 'augmenter la visibilité'}
Piliers de contenu : ${pillarList || 'Conseils, Coulisses, Promotion'}

Génère 4 idées de publications originales et concrètes, variées (une par type parmi : tip, story, promo, question, trend).
Chaque idée doit avoir :
- un titre court (5-8 mots max)
- un "hook" prêt à utiliser en ouverture de post (1-2 phrases percutantes avec emojis)
- 2 canaux de diffusion adaptés (parmi: linkedin, instagram, facebook, tiktok, google_business, website)
- le type (tip | story | promo | question | trend)
- optionnel: le pilier associé (label et emoji)

Les hooks doivent être directement utilisables, authentiques et adaptés au secteur.`,
        schema: {
          type: 'object',
          properties: {
            ideas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id:           { type: 'string' },
                  title:        { type: 'string' },
                  hook:         { type: 'string' },
                  type:         { type: 'string', enum: ['tip', 'story', 'promo', 'question', 'trend'] },
                  pillar:       { type: 'string' },
                  pillarEmoji:  { type: 'string' },
                  channels:     { type: 'array', items: { type: 'string' } },
                },
                required: ['id', 'title', 'hook', 'type', 'channels'],
              },
            },
          },
          required: ['ideas'],
        },
      });
      if (Array.isArray((object as any).ideas) && (object as any).ideas.length > 0) {
        setIdeas((object as any).ideas as ContentIdea[]);
        toast.success('Idées fraîches générées !', { description: `${(object as any).ideas.length} nouvelles idées basées sur votre secteur.` });
      }
    } catch (err: any) {
      if (err?.message?.includes('401') || err?.name === 'BlinkAuthError') {
        blink.auth.login(window.location.href);
      } else {
        setIdeasError(true);
      }
    } finally {
      setGeneratingIdeas(false);
    }
  }, [profile, pillars]);

  // Analyze & optimize current text ─────────────────────────────────────────
  const analyzeText = useCallback(async () => {
    if (!currentText.trim() || currentText.length < 30) {
      toast.error('Rédigez au moins 30 caractères avant d\'analyser.');
      return;
    }
    if (currentText === lastAnalyzedText && analysis) return; // No re-analysis needed
    setAnalyzingText(true);
    try {
      const { object } = await blink.ai.generateObject({
        prompt: `Tu es expert en copywriting pour les réseaux sociaux.
Analyse ce texte de publication et évalue-le objectivement :

"${currentText}"

Retourne une analyse structurée avec :
- score : note d'engagement de 0 à 100 (basée sur accroche, CTA, emojis, longueur)
- hook_quality : qualité de l'accroche ("weak" si plate, "decent" si correcte, "strong" si percutante)
- cta_present : est-ce qu'il y a un appel à l'action ? (true/false)
- emoji_usage : utilisation des emojis ("none", "few", "good", "too_many")
- length_rating : longueur du texte ("too_short" <50 car, "ideal" 100-600 car, "too_long" >600 car)
- suggestions : liste de 2 à 3 conseils concrets pour améliorer le texte (phrases courtes et actionnables en français)
- improved_hook : une version améliorée de la première phrase/accroche uniquement (garde le même thème)`,
        schema: {
          type: 'object',
          properties: {
            score:          { type: 'number' },
            hook_quality:   { type: 'string' },
            cta_present:    { type: 'boolean' },
            emoji_usage:    { type: 'string' },
            length_rating:  { type: 'string' },
            suggestions:    { type: 'array', items: { type: 'string' } },
            improved_hook:  { type: 'string' },
          },
          required: ['score', 'hook_quality', 'cta_present', 'emoji_usage', 'length_rating', 'suggestions', 'improved_hook'],
        },
      });
      setAnalysis(object as TextAnalysis);
      setLastAnalyzedText(currentText);
    } catch (err: any) {
      if (err?.message?.includes('401') || err?.name === 'BlinkAuthError') {
        blink.auth.login(window.location.href);
      } else {
        setAnalysisError(true);
      }
    } finally {
      setAnalyzingText(false);
    }
  }, [currentText, lastAnalyzedText, analysis]);

  const handleCopyHook = async () => {
    if (!analysis?.improved_hook) return;
    await navigator.clipboard.writeText(analysis.improved_hook);
    setCopiedHook(true);
    setTimeout(() => setCopiedHook(false), 1800);
  };

  const hasTextChanged = currentText !== lastAnalyzedText && currentText.length >= 30;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-muted/20 border-l border-border">
      {/* Panel header */}
      <div className="shrink-0 px-4 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles size={14} className="text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground">Assistant IA</p>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En ligne
          </span>
        </div>
        {/* Optimize shortcut button */}
        {activeTab !== 'optimize' && currentText.trim().length > 20 && (
          <button
            onClick={() => onTabChange('optimize')}
            className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg py-1.5 mb-2 transition-colors"
          >
            <Sparkles size={11} />
            ✨ Optimiser mon texte
          </button>
        )}
        {/* Tab switcher */}
        <div className="flex rounded-xl bg-muted p-1 gap-1">
          <button
            onClick={() => onTabChange('ideas')}
            className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold rounded-lg py-1.5 transition-all duration-150 ${
              activeTab === 'ideas'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Lightbulb size={11} />
            Idées de posts
          </button>
          <button
            onClick={() => onTabChange('optimize')}
            className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold rounded-lg py-1.5 transition-all duration-150 ${
              activeTab === 'optimize'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart2 size={11} />
            Optimiser
          </button>
        </div>
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">

        {/* ── IDEAS TAB ──────────────────────────────────────── */}
        {activeTab === 'ideas' && (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground leading-tight">
                {profile?.sector
                  ? <><span className="font-semibold text-foreground capitalize">{profile.sector}</span> · Idées prêtes à l'emploi</>
                  : "Idées prêtes à l'emploi"
                }
              </p>
              <button
                onClick={generateIdeas}
                disabled={generatingIdeas}
                className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
                title="Générer de nouvelles idées avec l'IA"
              >
                {generatingIdeas
                  ? <RefreshCw size={11} className="animate-spin" />
                  : <Zap size={11} />
                }
                {generatingIdeas ? 'Génération...' : 'Rafraîchir'}
              </button>
            </div>

            {generatingIdeas ? (
              // Skeleton loader
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2 animate-pulse">
                    <div className="h-3 w-16 bg-muted rounded-full" />
                    <div className="h-4 w-3/4 bg-muted rounded-full" />
                    <div className="h-8 w-full bg-muted rounded-lg" />
                  </div>
                ))}
              </div>
            ) : ideasError ? (
              <AIErrorFallback
                inline
                onRetry={() => { setIdeasError(false); generateIdeas(); }}
              />
            ) : (
              <div className="space-y-2">
                {ideas.map(idea => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onUse={onUseIdea}
                  />
                ))}
              </div>
            )}

            <p className="text-[10px] text-muted-foreground text-center pb-1">
              Cliquez sur une idée pour l'utiliser comme base de votre texte
            </p>
          </>
        )}

        {/* ── OPTIMIZE TAB ──────────────────────────────────── */}
        {activeTab === 'optimize' && (
          <>
            {/* Analyze button */}
            <button
              onClick={analyzeText}
              disabled={analyzingText || (!currentText.trim() || currentText.length < 30)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold py-2.5 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {analyzingText
                ? <><RefreshCw size={13} className="animate-spin" /> Analyse en cours...</>
                : hasTextChanged && analysis
                  ? <><Target size={13} /> Réanalyser le texte</>
                  : <><Target size={13} /> Analyser mon texte</>
              }
            </button>

            {!currentText.trim() && (
              <p className="text-[11px] text-muted-foreground text-center py-4">
                ✍️ Rédigez votre texte principal puis cliquez sur "Analyser" pour obtenir des conseils personnalisés.
              </p>
            )}

            {currentText.trim() && currentText.length < 30 && (
              <p className="text-[11px] text-muted-foreground text-center py-2">
                Écrivez au moins 30 caractères pour activer l'analyse.
              </p>
            )}

            {/* AI Error for analysis */}
            {analysisError && !analyzingText && (
              <AIErrorFallback
                inline
                onRetry={() => { setAnalysisError(false); analyzeText(); }}
              />
            )}

            {/* Analysis results */}
            {analysis && !analyzingText && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Score */}
                <div className="rounded-xl border border-border bg-background p-3 space-y-2">
                  <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-primary" />
                    Score d'engagement
                    {hasTextChanged && (
                      <span className="ml-auto text-[10px] text-amber-500 font-medium">Texte modifié</span>
                    )}
                  </p>
                  <ScoreMeter score={Math.round(analysis.score)} />
                </div>

                {/* Quick diagnostics */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Diagnostic rapide</p>
                  <div className="flex flex-wrap gap-1.5">
                    <AnalysisBadge
                      ok={analysis.hook_quality === 'strong'}
                      label={analysis.hook_quality === 'strong' ? 'Accroche forte' : analysis.hook_quality === 'decent' ? 'Accroche correcte' : 'Accroche faible'}
                    />
                    <AnalysisBadge ok={analysis.cta_present} label={analysis.cta_present ? 'CTA présent' : 'CTA manquant'} />
                    <AnalysisBadge
                      ok={analysis.emoji_usage === 'good' || analysis.emoji_usage === 'few'}
                      label={
                        analysis.emoji_usage === 'none' ? 'Pas d\'emojis'
                        : analysis.emoji_usage === 'too_many' ? 'Trop d\'emojis'
                        : 'Emojis OK'
                      }
                    />
                    <AnalysisBadge
                      ok={analysis.length_rating === 'ideal'}
                      label={
                        analysis.length_rating === 'too_short' ? 'Trop court'
                        : analysis.length_rating === 'too_long' ? 'Trop long'
                        : 'Longueur idéale'
                      }
                    />
                  </div>
                </div>

                {/* Suggestions */}
                {analysis.suggestions.length > 0 && (
                  <div className="rounded-xl border border-border bg-background p-3 space-y-2">
                    <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                      <MessageSquare size={11} className="text-primary" />
                      Conseils pour progresser
                    </p>
                    <ul className="space-y-1.5">
                      {analysis.suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
                          <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improved hook */}
                {analysis.improved_hook && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
                    <p className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                      <Sparkles size={11} />
                      Accroche améliorée par l'IA
                    </p>
                    <p className="text-xs text-foreground leading-relaxed italic">
                      "{analysis.improved_hook}"
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyHook}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted/50 transition-colors"
                      >
                        {copiedHook ? <Check size={11} className="text-green-600" /> : null}
                        {copiedHook ? 'Copié !' : 'Copier'}
                      </button>
                      <button
                        onClick={() => {
                          onReplaceText(analysis!.improved_hook + (currentText.includes('\n') ? '\n' + currentText.split('\n').slice(1).join('\n') : ''));
                          toast.success('Accroche appliquée !', { description: 'Le début de votre texte a été remplacé.' });
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-primary-foreground bg-primary rounded-lg px-2.5 py-1.5 hover:bg-primary/90 transition-colors"
                      >
                        <Zap size={11} />
                        Appliquer cette accroche
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {analyzingText && (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <RefreshCw size={18} className="text-primary animate-spin" />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  L'IA analyse votre texte…<br />
                  <span className="text-[10px]">Score d'engagement · Accroche · CTA</span>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
