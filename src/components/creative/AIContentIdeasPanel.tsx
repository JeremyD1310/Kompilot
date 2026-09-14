/**
 * AIContentIdeasPanel — AI-powered content idea generator
 * Integrated into Studio Creatif to help users overcome creative blocks.
 * Suggests topics based on sector, recent trends, and performance data.
 */
import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, RefreshCw, Lightbulb, TrendingUp, Target,
  Calendar, ArrowRight, Copy, Check, Zap, MessageSquare,
  Image as ImageIcon, Video, Hash, Clock, Search,
} from 'lucide-react'
import { Button, Badge, toast, cn } from '@blinkdotnew/ui'
import { blink } from '../../blink/client'
import { useOnboardingProfile } from '../../hooks/useOnboardingProfile'
import { useRAGTrends, type RAGTrend } from '../../hooks/useRAGTrends'
import { useNavigate } from '@tanstack/react-router'
import { backendFetch, authHeaders, readBackendError } from '../../lib/backend'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContentIdea {
  id: string
  title: string
  hook: string
  format: 'post' | 'story' | 'reel' | 'carousel' | 'email'
  type: 'trending' | 'seasonal' | 'engagement' | 'promo' | 'educational'
  channels: string[]
  bestTime: string
  hashtags: string[]
  estimatedEngagement: 'high' | 'medium' | 'low'
  trending?: boolean
}

const TYPE_CONFIG: Record<ContentIdea['type'], { label: string; color: string; bg: string; icon: React.ElementType }> = {
  trending:     { label: 'Tendance',       color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20',     icon: TrendingUp },
  seasonal:     { label: 'Saison',         color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',    icon: Calendar },
  engagement:   { label: 'Engagement',     color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: MessageSquare },
  promo:        { label: 'Promotion',      color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20',  icon: Target },
  educational:  { label: 'Éducatif',       color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',      icon: Lightbulb },
}

const FORMAT_ICONS: Record<ContentIdea['format'], React.ElementType> = {
  post: ImageIcon,
  story: ImageIcon,
  reel: Video,
  carousel: ImageIcon,
  email: MessageSquare,
}

const ENGAGEMENT_COLORS = {
  high: 'text-emerald-400',
  medium: 'text-amber-400',
  low: 'text-muted-foreground/60',
}

// ── Sector-specific trending topics (curated per sector) ─────────────────────

const SECTOR_TRENDS: Record<string, string[]> = {
  restaurant: ['Menu du jour', 'Coulisses cuisine', 'Plat signature', 'Avis clients', 'Événement spécial'],
  beaute: ['Tendances beauté', 'Avant/Après', 'Conseils expert', 'Nouveaux produits', 'Promo fidélité'],
  commerce: ['Nouveautés', 'Promotions flash', 'Avis clients', 'Unboxing', 'Conseils utilisation'],
  sante: ['Bien-être', 'Conseils santé', 'Témoignages', 'Prévention', 'Nouveaux traitements'],
  services: ['Projet réalisé', 'Avant/Après', 'Conseils expert', 'Processus métier', 'Avis clients'],
  fitness: ['Séance type', 'Avant/Après', 'Nutrition', 'Motivation', 'Événement sport'],
  immobilier: ['Visite virtuelle', 'Quartier', 'Conseils achat', 'Tendances marché', 'Nouveau mandat'],
  default: ['Coulisses', 'Conseils', 'Témoignages', 'Promotion', 'Actualités'],
}

// ── Seasonal hooks (auto-detected by month) ─────────────────────────────────

function getSeasonalContext(): string {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'Printemps — renouveau, Pâques, terrasses, beaux jours'
  if (month >= 5 && month <= 7) return 'Été — vacances, festivals, chaleur, tourisme, BBQ'
  if (month >= 8 && month <= 10) return 'Automne — rentrée, Halloween, confort, nature'
  return 'Hiver — Noël, fêtes, soldes, Saint-Valentin, confort'
}

function getDayOfWeekContext(): string {
  const day = new Date().getDay()
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  return days[day]
}

// ── Main Component ───────────────────────────────────────────────────────────

export function AIContentIdeasPanel({ userId }: { userId?: string }) {
  const profile = useOnboardingProfile()
  const navigate = useNavigate()
  const [ideas, setIdeas] = useState<ContentIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<ContentIdea['format'] | 'all'>('all')
  const [generationCount, setGenerationCount] = useState(0)
  const [activity, setActivity] = useState<{ recentPosts: Array<{ title: string; status: string; channels: string; createdAt: string; scheduledAt: string; impressions: number; engagementRate: number }>; recentMessages: Array<{ subject: string; status: string; createdAt: string }>; totals: { posts: number; messages: number } } | null>(null)
  const [activityLoading, setActivityLoading] = useState(false)

  const sector = profile?.sector || 'default'
  const sectorTrends = SECTOR_TRENDS[sector] || SECTOR_TRENDS.default
  const seasonalContext = getSeasonalContext()
  const dayContext = getDayOfWeekContext()

  // RAG: fetch industry trends from knowledge base
  const { data: ragTrends, isLoading: ragLoading } = useRAGTrends(sector, !!sector)

  const loadRecentActivity = useCallback(async () => {
    setActivityLoading(true)
    try {
      const response = await backendFetch('/api/content-trends/activity', { headers: await authHeaders() })
      if (!response.ok) throw await readBackendError(response, 'Impossible de charger votre activité récente')
      setActivity(await response.json())
    } catch (error) {
      console.warn('[AIContentIdeas] activity unavailable', error)
    } finally {
      setActivityLoading(false)
    }
  }, [])

  // Generate ideas via AI (enriched with RAG trends)
  const generateIdeas = useCallback(async () => {
    setLoading(true)
    try {
      // Build RAG context section
      let ragContext = ''
      if (ragTrends && ragTrends.length > 0) {
        ragContext = `\n\nTendances RAG (actualité secteur, sources internes):\n${ragTrends.map(t => `- ${t.excerpt.slice(0, 200)}`).join('\n')}`
      }

      const activityContext = activity ? `\n\nActivité récente du compte (à utiliser comme signal, pas comme vérité absolue):\n- ${activity.totals.posts} publications récentes\n- ${activity.totals.messages} messages récents\n- Publications: ${activity.recentPosts.slice(0, 5).map(post => `${post.title} [${post.status}, ${post.channels || 'canal non précisé'}]`).join(' | ') || 'aucune donnée'}\n- Messages: ${activity.recentMessages.slice(0, 3).map(message => `${message.subject} [${message.status}]`).join(' | ') || 'aucune donnée'}` : ''

      const prompt = `Tu es un expert en marketing de contenu pour les réseaux sociaux. Génère 6 idées de contenu pour un ${profile?.sector || 'commerce local'} ${profile?.companyName ? `(${profile.companyName})` : ''}.

Contexte temporel:
- Jour: ${dayContext}
- Saison: ${seasonalContext}
- Tendances du secteur: ${sectorTrends.join(', ')}${ragContext}${activityContext}

Pour chaque idée, fournis un JSON avec ce format EXACT (tableau de 6 objets):
[
  {
    "title": "Titre court et accrocheur",
    "hook": "Texte complet du post (150-200 mots, avec emojis, prêt à publier)",
    "format": "post" | "story" | "reel" | "carousel" | "email",
    "type": "trending" | "seasonal" | "engagement" | "promo" | "educational",
    "channels": ["instagram", "facebook", "linkedin"],
    "bestTime": "Meilleur moment de publication",
    "hashtags": ["#tag1", "#tag2", "#tag3"],
    "estimatedEngagement": "high" | "medium" | "low",
    "trending": true/false
  }
]

IMPORTANT: Varie les types (au moins 2 trending, 1 promo, 1 engagement, 1 éducatif). Varie les formats. Adapte le ton au secteur. Les hooks doivent être percutants et inclure des emojis pertinents. Si des tendances RAG sont fournies, intègre-en au moins 2 dans tes idées. Retourne UNIQUEMENT le JSON, rien d'autre.`

      const result = await blink.ai.generateText({
        prompt,
        model: 'gpt-4.1-mini',
        maxTokens: 2000,
      })

      const text = typeof result === 'string' ? result : (result as any)?.text ?? ''
      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('Format de réponse invalide')

      const parsed: ContentIdea[] = JSON.parse(jsonMatch[0]).map((idea: any, i: number) => ({
        ...idea,
        id: `idea-${Date.now()}-${i}`,
      }))

      setIdeas(parsed)
      setGenerationCount(prev => prev + 1)
      toast.success(`${parsed.length} idées générées !`)
    } catch (err: any) {
      console.error('[AIContentIdeas] Error:', err)
      toast.error('Erreur de génération — réessayez dans quelques instants')
      // Show fallback ideas on error
      if (ideas.length === 0) {
        setIdeas(getFallbackIdeas(sector))
      }
    } finally {
      setLoading(false)
    }
  }, [profile?.sector, profile?.companyName, sector, sectorTrends, seasonalContext, dayContext, ideas.length, ragTrends, activity])

  // Auto-generate on first mount if no ideas
  useEffect(() => {
    void loadRecentActivity()
  }, [loadRecentActivity])

  useEffect(() => {
    if (ideas.length === 0 && !loading && generationCount === 0) {
      generateIdeas()
    }
  }, [])

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Texte copié !')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleUseIdea = (idea: ContentIdea) => {
    // Navigate to cockpit with prefilled content
    navigate({ to: '/cockpit' })
    // Store in sessionStorage for the cockpit to pick up
    sessionStorage.setItem('prefilled_post', idea.hook)
    sessionStorage.setItem('prefilled_hashtags', idea.hashtags.join(' '))
    toast.success('Idée transférée au Cockpit IA')
  }

  const filteredIdeas = selectedFormat === 'all'
    ? ideas
    : ideas.filter(i => i.format === selectedFormat)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Lightbulb size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Idées de contenu IA</h3>
            <p className="text-xs text-muted-foreground">
              Basées sur votre secteur ({profile?.sector || 'commerce local'}) et les tendances du moment
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={generateIdeas}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Génération…' : 'Nouvelles idées'}
        </Button>
      </div>

      {/* Contextual badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-[10px] bg-rose-500/10 border-rose-500/20 text-rose-400">
          <Calendar size={10} className="mr-1" />
          {dayContext} — {seasonalContext.split('—')[0].trim()}
        </Badge>
        <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/20 text-primary">
          <Target size={10} className="mr-1" />
          {profile?.sector || 'Commerce local'}
        </Badge>
        {ragTrends && ragTrends.length > 0 && (
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
            <Search size={10} className="mr-1" />
            {ragTrends.length} tendance{ragTrends.length > 1 ? 's' : ''} sectorielle{ragTrends.length > 1 ? 's' : ''} via RAG
          </Badge>
        )}
        {sectorTrends.slice(0, 3).map((trend, i) => (
          <Badge key={i} variant="outline" className="text-[10px] bg-white/[0.05] border-white/[0.1] text-muted-foreground">
            <Hash size={9} className="mr-0.5" />
            {trend}
          </Badge>
        ))}
      </div>

      <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><TrendingUp size={15} className="text-primary" /><div><p className="text-xs font-semibold text-foreground">Suggestions basées sur votre activité récente</p><p className="text-[11px] text-muted-foreground">L’IA croise vos dernières publications et messages avec les signaux du secteur.</p></div></div>
          <Button variant="ghost" size="sm" onClick={loadRecentActivity} disabled={activityLoading} className="gap-1.5 text-xs">{activityLoading ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />} Actualiser</Button>
        </div>
        {activity && <div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{activity.totals.posts}</span> publication{activity.totals.posts > 1 ? 's' : ''} récente{activity.totals.posts > 1 ? 's' : ''}</div><div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{activity.totals.messages}</span> message{activity.totals.messages > 1 ? 's' : ''} récent{activity.totals.messages > 1 ? 's' : ''}</div></div>}
      </div>

      {/* Format filter */}
      <div className="flex gap-1 p-1 bg-muted/30 rounded-lg w-fit border border-white/[0.06] overflow-x-auto">
        {[
          { id: 'all', label: 'Tous' },
          { id: 'post', label: 'Posts' },
          { id: 'story', label: 'Stories' },
          { id: 'reel', label: 'Reels' },
          { id: 'carousel', label: 'Carrousels' },
          { id: 'email', label: 'Emails' },
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setSelectedFormat(filter.id as any)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap',
              selectedFormat === filter.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-white/[0.07] bg-[#0F172A] p-5 space-y-3 animate-pulse">
              <div className="h-4 bg-white/[0.05] rounded w-3/4" />
              <div className="h-3 bg-white/[0.05] rounded w-1/2" />
              <div className="space-y-1.5">
                <div className="h-3 bg-white/[0.05] rounded w-full" />
                <div className="h-3 bg-white/[0.05] rounded w-5/6" />
                <div className="h-3 bg-white/[0.05] rounded w-4/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ideas grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredIdeas.map((idea, index) => {
              const typeConfig = TYPE_CONFIG[idea.type]
              const TypeIcon = typeConfig.icon
              const FormatIcon = FORMAT_ICONS[idea.format]

              return (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.06, duration: 0.3 }}
                  className="group rounded-xl border border-white/[0.07] bg-[#0F172A] p-5 hover:border-white/[0.12] hover:shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-all duration-200"
                >
                  {/* Header badges */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border', typeConfig.bg, typeConfig.color)}>
                      <TypeIcon size={10} />
                      {typeConfig.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-white/[0.04] px-2 py-0.5 rounded-full">
                      <FormatIcon size={9} />
                      {idea.format}
                    </span>
                    {idea.trending && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                        <TrendingUp size={9} />
                        Trending
                      </span>
                    )}
                    <span className={cn('ml-auto text-[10px] font-medium', ENGAGEMENT_COLORS[idea.estimatedEngagement])}>
                      ● {idea.estimatedEngagement === 'high' ? 'Fort potentiel' : idea.estimatedEngagement === 'medium' ? 'Bon potentiel' : 'Correct'}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-foreground mb-2 leading-snug">
                    {idea.title}
                  </h4>

                  {/* Hook preview */}
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-4">
                    {idea.hook}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mb-3 text-[10px] text-muted-foreground/60">
                    <span className="flex items-center gap-1">
                      <Clock size={9} />
                      {idea.bestTime}
                    </span>
                    <span className="flex items-center gap-1">
                      {idea.channels.slice(0, 2).join(', ')}
                    </span>
                  </div>

                  {/* Hashtags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {idea.hashtags.slice(0, 4).map((tag, i) => (
                      <span key={i} className="text-[10px] text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUseIdea(idea)}
                      className="gap-1.5 text-xs h-7 px-3"
                    >
                      <Zap size={11} />
                      Utiliser
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(idea.id, `${idea.title}\n\n${idea.hook}\n\n${idea.hashtags.join(' ')}`)}
                      className="gap-1.5 text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                    >
                      {copiedId === idea.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      {copiedId === idea.id ? 'Copié' : 'Copier'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate({ to: '/cockpit' })}
                      className="gap-1 text-xs h-7 px-2 ml-auto text-muted-foreground hover:text-primary"
                    >
                      Ouvrir <ArrowRight size={10} />
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredIdeas.length === 0 && ideas.length > 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Aucune idée pour ce format. Essayez un autre filtre ou générez de nouvelles idées.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Fallback ideas when AI is unavailable ─────────────────────────────────────

function getFallbackIdeas(sector: string): ContentIdea[] {
  const day = getDayOfWeekContext()
  const season = getSeasonalContext()

  return [
    {
      id: 'fallback-1',
      title: `${day} — Conseil de la semaine`,
      hook: `💡 Saviez-vous que 72% des clients lisent les avis avant de choisir ? Aujourd'hui, prenez 5 minutes pour répondre à vos derniers avis Google. Chaque réponse augmente votre visibilité locale de 0,3 point. Votre réputation est votre meilleur commercial ! 🌟`,
      format: 'post',
      type: 'educational',
      channels: ['instagram', 'facebook', 'linkedin'],
      bestTime: '9h - 11h',
      hashtags: ['#conseilPro', '#avisGoogle', '#visibilité'],
      estimatedEngagement: 'high',
    },
    {
      id: 'fallback-2',
      title: `Coulisses — Une journée chez nous`,
      hook: `🎬 Pendant que vous prenez votre café, nous on est déjà à fond ! Voici ce que vous ne voyez pas : 4h de préparation, 3 équipes coordonnées, et 1 seul objectif — vous offrir une expérience mémorable. Merci d'être là 🙏`,
      format: 'story',
      type: 'engagement',
      channels: ['instagram', 'facebook'],
      bestTime: '12h - 14h',
      hashtags: ['#coulisses', '#behindTheScenes', '#authentic'],
      estimatedEngagement: 'high',
    },
    {
      id: 'fallback-3',
      title: `Offre spéciale ${season.split('—')[0].trim()}`,
      hook: `🔥 OFFRE LIMITÉE — ${season.split('—')[0].trim()} nous inspire ! Profitez de -20% sur toute commande passée cette semaine. Utilisez le code ${season.split('—')[0].trim().toUpperCase()}24. Offre valable 7 jours, non cumulable. On vous attend ! 🎁`,
      format: 'post',
      type: 'promo',
      channels: ['instagram', 'facebook', 'email'],
      bestTime: '17h - 19h',
      hashtags: ['#promo', '#offreSpeciale', '#bonPlan'],
      estimatedEngagement: 'medium',
    },
    {
      id: 'fallback-4',
      title: 'Question engagement — Votre avis compte',
      hook: `🤔 On hésite entre deux nouvelles offres pour le mois prochain. Laquelle vous ferait le plus envie ?\n\nA) L'option découverte à prix doux\nB) Le pack complet avec surprise\n\nCommentez A ou B 👇 Le gagnant sera annoncé vendredi !`,
      format: 'post',
      type: 'engagement',
      channels: ['instagram', 'facebook'],
      bestTime: '18h - 20h',
      hashtags: ['#votreAvis', '#engagement', '#communauté'],
      estimatedEngagement: 'high',
    },
    {
      id: 'fallback-5',
      title: 'Tendance — Transformation Avant/Après',
      hook: `✨ AVANT vs APRÈS — Ce que 30 jours de travail passionné peuvent donner ! Merci à notre client qui nous a fait confiance pour cette transformation. Le résultat parle de lui-même. Envie d'en savoir plus ? DM ouvert 📩`,
      format: 'carousel',
      type: 'trending',
      channels: ['instagram'],
      bestTime: '11h - 13h',
      hashtags: ['#avantApres', '#transformation', '#résultats'],
      estimatedEngagement: 'high',
    },
    {
      id: 'fallback-6',
      title: 'Newsletter — Les 3 infos de la semaine',
      hook: `📧 Bonjour ! Voici votre résumé de la semaine :\n\n1️⃣ Nouveauté : notre dernière offre arrive lundi\n2️⃣ Tendance : ce que nos clients adorent en ce moment\n3️⃣ Conseil du pro : comment bien préparer votre prochaine visite\n\nÀ la semaine prochaine ! 💪`,
      format: 'email',
      type: 'educational',
      channels: ['email'],
      bestTime: 'Mardi 10h',
      hashtags: ['#newsletter', '#résumé'],
      estimatedEngagement: 'medium',
    },
  ]
}
