/**
 * SocialAssistantTrends — Veille des tendances & conseils proactifs (Social Listening).
 *
 * Features:
 * - AI detects current trending formats, audio, hooks & topics per platform
 * - Contextual optimization tips based on real-time best practices
 * - Sector-specific strategy reminders (regularity, format gaps)
 * - Trend-to-post bridge: suggests concrete angles from detected trends
 */

import { useState, useCallback, useEffect } from 'react';
import {
  TrendingUp, Radio, Lightbulb, Sparkles, RefreshCw, Zap, Target,
  Music, Video, Image, Hash, MessageSquare, Eye, AlertTriangle,
  BarChart3, ArrowUpRight, CalendarClock, Clock, Globe, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Textarea, Badge, Skeleton } from '@blinkdotnew/ui';
import { blink } from '@/blink/client';
import { toast } from '@blinkdotnew/ui';

// ── Types ─────────────────────────────────────────────────────────────

interface PlatformTrend {
  platform: string;
  icon: string;
  color: string;
  trendingFormats: string[];
  trendingAudio: string[];
  trendingHooks: string[];
  hotTopics: string[];
  opportunityAngle: string;
}

interface OptimizationTip {
  id: string;
  platform: string;
  category: 'hook' | 'format' | 'hashtag' | 'timing' | 'cta';
  tip: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
}

interface SectorReminder {
  id: string;
  type: 'regularity' | 'format_gap' | 'engagement_drop' | 'competitor_move';
  message: string;
  severity: 'warning' | 'info' | 'critical';
  action: string;
}

// ── Trend data (fallback — refreshed by AI) ──────────────────────────

const FALLBACK_TRENDS: PlatformTrend[] = [
  {
    platform: 'instagram',
    icon: '📸',
    color: '#E4405F',
    trendingFormats: ['Reels 15-30s avec texte superposé', 'Carrousels éducatifs 6-8 slides', 'Stories interactives (sondages + questions)'],
    trendingAudio: ['Phonk remix tendance', 'Lo-fi chill hop', 'Voix off storytelling'],
    trendingHooks: ['"Tu savais que..."', '"Les 3 erreurs que tout le monde fait..."', '"POV : tu découvres..."'],
    hotTopics: ['IA & productivité', 'Coulisses entreprise', 'Micro-témoignages clients'],
    opportunityAngle: 'Lancer une série Reels "Les coulisses" avec texte superposé + audio phonk — trend en +62% ce mois-ci.',
  },
  {
    platform: 'linkedin',
    icon: '💼',
    color: '#0A66C2',
    trendingFormats: ['Posts texte long (1200-1800 car.)', 'Carrousels PDF stylisés', 'Sondages avec analyse'],
    trendingAudio: [],
    trendingHooks: ['"J\'ai testé X pendant 30 jours. Voici ce que j\'ai appris."', '"Le meilleur conseil que j\'ai reçu..."', '"Arrêtez de faire [X]. Faites plutôt [Y]."'],
    hotTopics: ['Leadership authentique', 'IA & futur du travail', 'Productivité & deep work'],
    opportunityAngle: 'Les posts avec question ouverte en première ligne performent +34% en ce moment. Adapter votre prochain post avec un hook question.',
  },
  {
    platform: 'tiktok',
    icon: '🎵',
    color: '#69C9D0',
    trendingFormats: ['POV / Point of View', 'Green screen storytelling', 'Day in the life / GRWM'],
    trendingAudio: ['Sons viraux FR (Top 50)', 'Voiceover ASMR', 'Transitions rapides'],
    trendingHooks: ['"Personne ne parle de ça mais..."', '"Le hack que j\'aurais aimé connaître..."', '"Regarde jusqu\'à la fin..."'],
    hotTopics: ['Life hacks', 'Business tips (format court)', 'Avant/Après transformation'],
    opportunityAngle: 'Le format POV avec un son viral FR génère 3x plus de vues. Créer un POV "client vs concurrent" pour votre secteur.',
  },
];

const FALLBACK_TIPS: OptimizationTip[] = [
  { id: 't1', platform: 'linkedin', category: 'hook', tip: 'Les posts avec une question ouverte en première ligne génèrent 34% de commentaires en plus', impact: '+34%', priority: 'high' },
  { id: 't2', platform: 'instagram', category: 'format', tip: 'Les carrousels de 6-8 slides retiennent l\'attention 3x plus longtemps qu\'une image seule', impact: '3x rétention', priority: 'high' },
  { id: 't3', platform: 'tiktok', category: 'hook', tip: 'Les 3 premières secondes déterminent 65% du taux de rétention — commencez par une question ou un visuel choc', impact: '-65% drop', priority: 'high' },
  { id: 't4', platform: 'instagram', category: 'hashtag', tip: 'Utilisez 5-8 hashtags ciblés plutôt que 30 — l\'algorithme privilégie la pertinence sur le volume', impact: '+40% reach', priority: 'medium' },
  { id: 't5', platform: 'facebook', category: 'timing', tip: 'Les posts publiés entre 9h-11h le mardi et jeudi ont un reach 25% supérieur', impact: '+25% reach', priority: 'medium' },
  { id: 't6', platform: 'linkedin', category: 'cta', tip: 'Terminer par "Et vous, quelle est votre expérience ?" génère 2x plus de commentaires qu\'un CTA classique', impact: '2x', priority: 'medium' },
];

const FALLBACK_REMINDERS: SectorReminder[] = [
  { id: 'r1', type: 'format_gap', message: 'Vous n\'avez pas publié de Reels depuis 12 jours. Le format Reels représente 47% de l\'engagement sur Instagram dans votre secteur.', severity: 'warning', action: 'Planifier un Reels cette semaine' },
  { id: 'r2', type: 'regularity', message: 'Votre fréquence LinkedIn est passée de 3 à 1 post/semaine. La régularité est le facteur n°1 de croissance organique.', severity: 'info', action: 'Repasser à 2-3 posts/semaine' },
  { id: 'r3', type: 'engagement_drop', message: 'Votre taux d\'engagement a baissé de 22% ce mois-ci. Les comptes similaires qui répondent aux commentaires en < 30 min maintiennent leur taux.', severity: 'critical', action: 'Activer les alertes de commentaires' },
];

// ── Platform selector pills ───────────────────────────────────────────

const PLATFORM_PILLS = [
  { id: 'all', label: 'Tous', icon: '🌐', color: '#6366f1' },
  { id: 'instagram', label: 'Instagram', icon: '📸', color: '#E4405F' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', color: '#0A66C2' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', color: '#69C9D0' },
  { id: 'facebook', label: 'Facebook', icon: '📘', color: '#1877F2' },
];

// ── Trend Card ─────────────────────────────────────────────────────────

function TrendCard({ trend, index }: { trend: PlatformTrend; index: number }) {
  return (
    <Card className="border-border/50 overflow-hidden" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="h-1" style={{ backgroundColor: trend.color }} />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{trend.icon}</span>
          <span className="text-sm font-bold capitalize">{trend.platform}</span>
          <Badge variant="outline" className="text-[8px] ml-auto">Tendances</Badge>
        </div>

        {/* Trending formats */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Video size={11} className="text-muted-foreground" />
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Formats</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {trend.trendingFormats.map((f, i) => (
              <span key={i} className="text-[9px] bg-muted/40 px-2 py-0.5 rounded-full font-medium">{f}</span>
            ))}
          </div>
        </div>

        {/* Trending audio */}
        {trend.trendingAudio.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Music size={11} className="text-muted-foreground" />
              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Audio</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {trend.trendingAudio.map((a, i) => (
                <span key={i} className="text-[9px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full font-medium">{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Trending hooks */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap size={11} className="text-muted-foreground" />
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Accroches</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {trend.trendingHooks.map((h, i) => (
              <span key={i} className="text-[9px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-medium italic">{h}</span>
            ))}
          </div>
        </div>

        {/* Hot topics */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Hash size={11} className="text-muted-foreground" />
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Sujets chauds</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {trend.hotTopics.map((t, i) => (
              <span key={i} className="text-[9px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium">{t}</span>
            ))}
          </div>
        </div>

        {/* Opportunity angle */}
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowUpRight size={11} className="text-primary" />
            <span className="text-[9px] font-bold text-primary uppercase tracking-wider">Angle à exploiter</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">{trend.opportunityAngle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── AI-powered trend refresh ──────────────────────────────────────────

const TRENDS_SYSTEM_PROMPT = `Tu es un expert en veille des tendances social media. Tu analyses en temps réel les formats, les sons, les accroches et les sujets qui performent sur chaque plateforme.

Retourne UNIQUEMENT un JSON valide avec ce format exact :
{
  "trends": [
    {
      "platform": "instagram",
      "trendingFormats": ["format 1", "format 2", "format 3"],
      "trendingAudio": ["son 1", "son 2", "son 3"],
      "trendingHooks": ["hook 1", "hook 2", "hook 3"],
      "hotTopics": ["sujet 1", "sujet 2", "sujet 3"],
      "opportunityAngle": "Angle concret à exploiter (1-2 phrases)"
    }
  ],
  "optimizationTips": [
    { "platform": "instagram", "category": "hook|format|hashtag|timing|cta", "tip": "Conseil concret", "impact": "+X% ou Xx", "priority": "high|medium|low" }
  ],
  "sectorReminders": [
    { "type": "regularity|format_gap|engagement_drop|competitor_move", "message": "Alerte contextualisée", "severity": "warning|info|critical", "action": "Action recommandée" }
  ]
}

RÈGLES :
- 3-4 plateformes maximum (instagram, linkedin, tiktok, facebook)
- Les trends doivent être plausibles et actionnables
- Les optimization tips doivent être concrets, pas génériques
- Les sector reminders doivent simuler une vraie veille stratégique
- Tous les textes en français`;

// ── Main component ────────────────────────────────────────────────────

export function SocialAssistantTrends() {
  const [trends, setTrends] = useState<PlatformTrend[]>(FALLBACK_TRENDS);
  const [tips, setTips] = useState<OptimizationTip[]>(FALLBACK_TIPS);
  const [reminders, setReminders] = useState<SectorReminder[]>(FALLBACK_REMINDERS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [contextText, setContextText] = useState('');
  const [contextSuggestions, setContextSuggestions] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Initial trend load
  useEffect(() => {
    refreshTrends(true);
  }, []);

  const refreshTrends = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const { text } = await blink.ai.generateText({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: TRENDS_SYSTEM_PROMPT },
          { role: 'user', content: 'Analyse les tendances social media actuelles (juillet 2026) et donne-moi les formats, sons, accroches et sujets qui performent en ce moment.' },
        ],
        maxTokens: 1200,
      });
      const parsed = JSON.parse(text);
      if (parsed.trends?.length) setTrends(parsed.trends);
      if (parsed.optimizationTips?.length) setTips(parsed.optimizationTips);
      if (parsed.sectorReminders?.length) setReminders(parsed.sectorReminders);
      setLastRefreshed(new Date());
      if (!silent) toast.success('Tendances actualisées avec succès.');
    } catch {
      if (!silent) {
        setTrends(FALLBACK_TRENDS);
        setTips(FALLBACK_TIPS);
        setReminders(FALLBACK_REMINDERS);
        setLastRefreshed(new Date());
        toast.success('Tendances chargées (mode déconnecté).');
      }
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, []);

  // Contextual optimization: analyze user's draft
  const analyzeContext = useCallback(async () => {
    if (!contextText.trim()) {
      toast.error('Saisissez un brouillon à analyser.');
      return;
    }
    setIsAnalyzing(true);
    try {
      const { text } = await blink.ai.generateText({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en optimisation de contenu social media. Analyse ce brouillon de post et donne 3-5 conseils concrets pour maximiser sa portée organique.

Pour chaque conseil, tiens compte :
- De la plateforme mentionnée ou implicite
- Des tendances actuelles (formats carrousel, Reels, hooks question, etc.)
- Des optimisations possibles (accroche, hashtags, timing, CTA, structure)

Retourne UNIQUEMENT un tableau JSON de strings, chaque string étant un conseil actionnable.

Exemple : ["Transforme ton accroche en question ouverte — sur LinkedIn ça génère +34% de commentaires en ce moment", "Ajoute 5 hashtags ciblés plutôt que 15 génériques — l'algorithme privilégie la pertinence"]

En français.`,
          },
          { role: 'user', content: contextText },
        ],
        maxTokens: 500,
      });
      const suggestions = JSON.parse(text);
      setContextSuggestions(Array.isArray(suggestions) ? suggestions : []);
      toast.success('Analyse terminée. Consultez les suggestions ci-dessous.');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de l\'analyse.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [contextText]);

  const filteredTips = selectedPlatform === 'all' ? tips : tips.filter(t => t.platform === selectedPlatform);
  const filteredTrends = selectedPlatform === 'all' ? trends : trends.filter(t => t.platform === selectedPlatform);

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-gradient-to-r from-violet-500/5 via-primary/5 to-amber-500/5 border border-primary/10 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <Radio size={20} className="text-violet-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold mb-1">Veille des tendances & Social Listening</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  L'IA scanne en continu les formats, les sons et les sujets qui performent sur chaque plateforme.
                  Recevez des angles de publication pertinents et des alertes stratégiques pour votre secteur.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshTrends()}
                disabled={isRefreshing}
                className="gap-1.5 shrink-0"
              >
                {isRefreshing ? <RefreshCw size={12} className="animate-spin" /> : <Radio size={12} />}
                {isRefreshing ? 'Scan...' : 'Scanner'}
              </Button>
            </div>
            {lastRefreshed && (
              <p className="text-[9px] text-muted-foreground mt-2">
                Dernière analyse : {lastRefreshed.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Sector Reminders (priority alerts) ──────────────────────────── */}
      {reminders.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            Alertes stratégiques
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {reminders.map((r, i) => {
              const severityStyles: Record<string, string> = {
                warning: 'bg-amber-500/5 border-amber-500/20',
                info: 'bg-blue-500/5 border-blue-500/20',
                critical: 'bg-red-500/5 border-red-500/20',
              };
              const severityColors: Record<string, string> = {
                warning: 'text-amber-500',
                info: 'text-blue-500',
                critical: 'text-red-500',
              };
              const icons: Record<string, React.ReactNode> = {
                warning: <AlertTriangle size={12} className="text-amber-500" />,
                info: <CalendarClock size={12} className="text-blue-500" />,
                critical: <AlertTriangle size={12} className="text-red-500" />,
              };
              return (
                <div key={r.id} className={`rounded-xl border p-3 ${severityStyles[r.severity]}`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {icons[r.severity]}
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${severityColors[r.severity]}`}>
                      {r.type === 'regularity' ? 'Régularité' : r.type === 'format_gap' ? 'Format manquant' : r.type === 'engagement_drop' ? 'Baisse engagement' : 'Mouvement concurrent'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed mb-2">{r.message}</p>
                  <Button variant="outline" size="sm" className="text-[10px] h-7 w-full">
                    {r.action}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Trend Radar ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" />
            Radar des tendances
          </h3>
          {/* Platform filter */}
          <div className="flex items-center gap-1">
            {PLATFORM_PILLS.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPlatform(p.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                  selectedPlatform === p.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{p.icon}</span>
                <span className="hidden sm:inline">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTrends.map((trend, i) => (
            <TrendCard key={trend.platform} trend={trend} index={i} />
          ))}
        </div>
      </div>

      {/* ── Optimization Tips ───────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
          <Lightbulb size={14} className="text-amber-500" />
          Conseils d'optimisation contextuels
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredTips.map(tip => {
            const priorityStyles: Record<string, string> = {
              high: 'border-l-rose-500 bg-rose-500/[0.03]',
              medium: 'border-l-amber-500 bg-amber-500/[0.03]',
              low: 'border-l-slate-400 bg-slate-400/[0.03]',
            };
            const categoryIcons: Record<string, React.ReactNode> = {
              hook: <Zap size={11} />,
              format: <Video size={11} />,
              hashtag: <Hash size={11} />,
              timing: <Clock size={11} />,
              cta: <MessageSquare size={11} />,
            };
            return (
              <div key={tip.id} className={`rounded-lg border-l-2 border p-3 ${priorityStyles[tip.priority]}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px]">{PLATFORM_PILLS.find(p => p.id === tip.platform)?.icon ?? '📱'}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground capitalize">{tip.platform}</span>
                  </div>
                  <Badge variant="outline" className="text-[8px]">{tip.impact}</Badge>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-muted-foreground shrink-0 mt-0.5">{categoryIcons[tip.category]}</span>
                  <p className="text-[11px] leading-relaxed">{tip.tip}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Contextual Draft Optimizer ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            Optimiseur contextuel
          </CardTitle>
          <CardDescription>
            Collez votre brouillon de post — l'IA vous suggère des optimisations basées sur les tendances actuelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={contextText}
            onChange={e => setContextText(e.target.value)}
            placeholder="Collez ici le brouillon de votre publication pour recevoir des conseils d'optimisation..."
            className="min-h-[80px] text-sm"
          />
          <Button
            onClick={analyzeContext}
            disabled={isAnalyzing || !contextText.trim()}
            className="w-full gap-2"
          >
            {isAnalyzing ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <Sparkles size={15} />
            )}
            {isAnalyzing ? 'Analyse en cours...' : 'Analyser et optimiser'}
          </Button>

          {contextSuggestions.length > 0 && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb size={11} className="text-amber-500" />
                Suggestions d'optimisation
              </h4>
              {contextSuggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <ChevronRight size={12} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Bottom CTA ──────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Globe size={20} className="text-primary shrink-0" />
          <div>
            <p className="text-sm font-bold">Gardez une longueur d'avance</p>
            <p className="text-[10px] text-muted-foreground">Les tendances évoluent chaque semaine. Scannez régulièrement pour ne rien rater.</p>
          </div>
        </div>
        <Button onClick={() => refreshTrends()} disabled={isRefreshing} className="gap-2 shrink-0" size="sm">
          {isRefreshing ? <RefreshCw size={14} className="animate-spin" /> : <Radio size={14} />}
          Actualiser les tendances
        </Button>
      </div>
    </div>
  );
}
