/**
 * AIContentSummarizer — Condense long articles or text into social media posts.
 * Takes user input (URL or raw text) and generates platform-specific summaries.
 */
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Sparkles, Copy, Check, RefreshCw, ArrowRight,
  Globe, MessageSquare, Hash, Type, Zap, AlertCircle,
} from 'lucide-react'
import { Button, Badge, Input, toast, cn } from '@blinkdotnew/ui'
import { blink } from '../../blink/client'
import { useNavigate } from '@tanstack/react-router'

interface SummaryResult {
  platform: string
  label: string
  icon: React.ElementType
  text: string
  charCount: number
  maxChars: number
  hashtags: string[]
  tone: string
}

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: MessageSquare, maxChars: 2200, tone: 'visuel et engageant, avec emojis' },
  { id: 'linkedin', label: 'LinkedIn', icon: Globe, maxChars: 3000, tone: 'professionnel et informatif, storytelling' },
  { id: 'facebook', label: 'Facebook', icon: MessageSquare, maxChars: 500, tone: 'conversationnel et communautaire' },
  { id: 'email', label: 'Email', icon: FileText, maxChars: 1000, tone: 'clair et actionnable, objet accrocheur' },
]

export function AIContentSummarizer() {
  const navigate = useNavigate()
  const [inputText, setInputText] = useState('')
  const [inputUrl, setInputUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SummaryResult[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(['instagram', 'linkedin']))
  const [error, setError] = useState('')

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSummarize = useCallback(async () => {
    if (!inputText.trim() && !inputUrl.trim()) {
      toast.error('Collez un texte ou une URL à résumer')
      return
    }
    if (selectedPlatforms.size === 0) {
      toast.error('Sélectionnez au moins une plateforme')
      return
    }

    setLoading(true)
    setError('')
    setResults([])

    try {
      const source = inputText.trim() || `URL: ${inputUrl.trim()}`
      const platforms = PLATFORMS.filter(p => selectedPlatforms.has(p.id))
      const platformList = platforms.map(p => `${p.label} (max ${p.maxChars} caractères, ton ${p.tone})`).join('\n')

      const prompt = `Tu es un expert en marketing de contenu et copywriting social media. Résume le texte/source ci-dessous en ${platforms.length} versions, une pour chaque plateforme.

TEXTE/SOURCE:
${source}

PLATEFORMES:
${platformList}

Règles:
- Chaque version doit être prête à publier (avec emojis pertinents)
- Adapte le ton à chaque plateforme
- Inclus 3-5 hashtags pertinents pour chaque version
- Pour Email: inclus un objet d'email accrocheur
- Le résume doit capturer l'essentiel du message, pas juste réduire
- Si c'est une URL, résume le contenu probable de la page

Réponds en JSON EXACT (tableau):
[
  {
    "platform": "instagram",
    "text": "Texte du post Instagram avec emojis...",
    "hashtags": ["#tag1", "#tag2", "#tag3"],
    "tone": "visuel et engageant"
  },
  ...
]

Retourne UNIQUEMENT le JSON.`

      const result = await blink.ai.generateText({
        prompt,
        model: 'gpt-4.1-mini',
        maxTokens: 2000,
      })

      const text = typeof result === 'string' ? result : (result as any)?.text ?? ''
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('Format de réponse invalide')

      const parsed = JSON.parse(jsonMatch[0])
      const summaries: SummaryResult[] = parsed.map((item: any) => {
        const platform = PLATFORMS.find(p => p.id === item.platform) || platforms[0]
        return {
          platform: item.platform,
          label: platform.label,
          icon: platform.icon,
          text: item.text,
          charCount: item.text.length,
          maxChars: platform.maxChars,
          hashtags: item.hashtags || [],
          tone: item.tone || platform.tone,
        }
      })

      setResults(summaries)
      toast.success(`${summaries.length} résumés générés !`)
    } catch (err: any) {
      console.error('[AIContentSummarizer] Error:', err)
      setError(err.message || 'Erreur de génération — réessayez')
      toast.error('Erreur de génération')
    } finally {
      setLoading(false)
    }
  }, [inputText, inputUrl, selectedPlatforms])

  const handleCopy = (id: string, text: string, hashtags: string[]) => {
    const full = `${text}\n\n${hashtags.join(' ')}`
    navigator.clipboard.writeText(full)
    setCopiedId(id)
    toast.success('Copié !')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleUseInCockpit = (result: SummaryResult) => {
    sessionStorage.setItem('prefilled_post', result.text)
    sessionStorage.setItem('prefilled_hashtags', result.hashtags.join(' '))
    navigate({ to: '/cockpit' })
    toast.success('Transféré au Cockpit IA')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
            <FileText size={18} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Résumeur IA</h3>
            <p className="text-xs text-muted-foreground">
              Transformez un article ou un texte long en posts prêts à publier
            </p>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
            Collez votre texte source
          </label>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            rows={6}
            placeholder="Collez ici un article, un email, un rapport, une newsletter, un communiqué de presse… Le texte sera condensé en posts optimisés pour chaque réseau social."
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-[10px] text-muted-foreground/40 font-medium">OU</span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
            URL de la page à résumer
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <Input
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                placeholder="https://exemple.com/article"
                className="pl-9 h-9 text-xs bg-white/[0.03] border-white/[0.08]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Platform selection */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">
          Plateformes cibles
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map(p => {
            const Icon = p.icon
            const isSelected = selectedPlatforms.has(p.id)
            return (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  isSelected
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-white/[0.03] border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/[0.12]',
                )}
              >
                <Icon size={12} />
                {p.label}
                <span className="text-[10px] opacity-60">{p.maxChars > 999 ? `${(p.maxChars / 1000).toFixed(0)}k` : p.maxChars} car.</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Generate button */}
      <Button
        onClick={handleSummarize}
        disabled={loading || (!inputText.trim() && !inputUrl.trim()) || selectedPlatforms.size === 0}
        className="w-full gap-2 h-10"
      >
        {loading ? (
          <>
            <RefreshCw size={14} className="animate-spin" />
            Analyse en cours…
          </>
        ) : (
          <>
            <Sparkles size={14} />
            Résumer pour {selectedPlatforms.size} plateforme{selectedPlatforms.size > 1 ? 's' : ''}
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3">
          <AlertCircle size={14} className="text-rose-400 shrink-0" />
          <p className="text-xs text-rose-400">{error}</p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
              Résultats ({results.length})
            </p>

            {results.map((result, index) => {
              const Icon = result.icon
              const isOverLimit = result.charCount > result.maxChars
              return (
                <motion.div
                  key={result.platform}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-xl border border-white/[0.07] bg-[#0F172A] p-5 space-y-3"
                >
                  {/* Platform header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <Icon size={13} className="text-violet-400" />
                      </div>
                      <span className="text-sm font-bold text-foreground">{result.label}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {result.tone}
                      </Badge>
                    </div>
                    <span className={cn(
                      'text-[10px] font-bold',
                      isOverLimit ? 'text-rose-400' : 'text-muted-foreground/40',
                    )}>
                      {result.charCount}/{result.maxChars}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3">
                    <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {result.text}
                    </p>
                  </div>

                  {/* Hashtags */}
                  <div className="flex flex-wrap gap-1">
                    {result.hashtags.map((tag, i) => (
                      <span key={i} className="text-[10px] text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUseInCockpit(result)}
                      className="gap-1.5 text-xs h-7 px-3"
                    >
                      <Zap size={11} />
                      Utiliser dans le Cockpit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(result.platform, result.text, result.hashtags)}
                      className="gap-1.5 text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                    >
                      {copiedId === result.platform ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      {copiedId === result.platform ? 'Copié' : 'Copier'}
                    </Button>
                  </div>
                </motion.div>
              )
            })}

            {/* Use all in cockpit */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                const best = results[0]
                if (best) handleUseInCockpit(best)
              }}
            >
              Utiliser la meilleure version dans le Cockpit IA
              <ArrowRight size={14} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
