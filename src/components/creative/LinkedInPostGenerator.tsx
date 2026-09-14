/**
 * LinkedInPostGenerator — AI-powered LinkedIn post generation panel.
 * Integrates into AI Creative Studio as a new tab.
 *
 * Uses the Kompilot master prompt for B2B copywriting optimized for AIO.
 */
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Copy, Check, RefreshCw, Target,
  Zap, Hash, Type, MessageSquare, AlertCircle, FileText,
  ArrowRight,
} from 'lucide-react'

/** LinkedIn icon (brand icon removed from lucide-react) */
function LinkedinIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}
import { Button, Badge, toast, cn } from '@blinkdotnew/ui'
import { useLinkedInGenerator, type LinkedInGenerateRequest } from '../../hooks/useLinkedInGenerator'
import { useNavigate } from '@tanstack/react-router'

// ── Goal presets ────────────────────────────────────────────────────────────

const GOAL_PRESETS = [
  { id: 'leads', label: 'Générer des leads', icon: '🎯' },
  { id: 'notoriety', label: 'Notoriété de marque', icon: '📢' },
  { id: 'expertise', label: 'Partage d\'expertise', icon: '💡' },
  { id: 'engagement', label: 'Engagement communautaire', icon: '💬' },
  { id: 'conversion', label: 'Conversion directe', icon: '🔥' },
]

const TONE_PRESETS = [
  { id: 'expert', label: 'Expert mais accessible' },
  { id: 'direct', label: 'Direct et ambitieux' },
  { id: 'storytelling', label: 'Storytelling inspirant' },
  { id: 'provocateur', label: 'Provocateur (mythe-busting)' },
  { id: 'data', label: 'Data-driven factuel' },
]

const LENGTH_PRESETS = [
  { id: 'short', label: 'Court', desc: '~300 car. · Punchy', icon: '⚡' },
  { id: 'medium', label: 'Moyen', desc: '~800 car. · Équilibré', icon: '📝' },
  { id: 'long', label: 'Long', desc: '~1500 car. · Deep dive', icon: '📖' },
  { id: 'thread', label: 'Thread', desc: 'Multi-part · Carousel-style', icon: '🧵' },
]

const CTA_PRESETS = [
  { id: 'question', label: 'Question ouverte', desc: 'Engage les commentaires' },
  { id: 'dm', label: 'Invite DM', desc: 'Pousse vers la conversation privée' },
  { id: 'link_bio', label: 'Lien en bio', desc: 'Redirige vers le profil' },
  { id: 'poll', label: 'Sondage', desc: 'Propose un choix A/B/C' },
  { id: 'tag', label: 'Tag & Partage', desc: 'Invite à taguer quelqu\'un' },
  { id: 'newsletter', label: 'Newsletter', desc: 'Invite à s\'inscrire' },
]

// ── Main Component ──────────────────────────────────────────────────────────

export function LinkedInPostGenerator() {
  const navigate = useNavigate()
  const { mutate: generatePost, data, isPending, error, reset } = useLinkedInGenerator()

  // Form state
  const [sourceContent, setSourceContent] = useState('')
  const [keywordsInput, setKeywordsInput] = useState('')
  const [postGoal, setPostGoal] = useState('expertise')
  const [brandTone, setBrandTone] = useState('expert')
  const [postLength, setPostLength] = useState('medium')
  const [ctaType, setCtaType] = useState('question')
  const [copied, setCopied] = useState(false)

  const handleGenerate = useCallback(() => {
    if (!sourceContent.trim()) {
      toast.error('Collez un contenu source ou décrivez votre sujet')
      return
    }

    const keywords = keywordsInput
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)

    const goalLabel = GOAL_PRESETS.find(g => g.id === postGoal)?.label || postGoal
    const toneLabel = TONE_PRESETS.find(t => t.id === brandTone)?.label || brandTone
    const lengthLabel = LENGTH_PRESETS.find(l => l.id === postLength)?.desc || postLength
    const ctaLabel = CTA_PRESETS.find(c => c.id === ctaType)?.label || ctaType

    const request: LinkedInGenerateRequest = {
      sourceContent: sourceContent.trim(),
      keywordsAio: keywords,
      postGoal: goalLabel,
      brandTone: toneLabel,
      postLength: lengthLabel,
      ctaType: ctaLabel,
    }

    generatePost(request)
  }, [sourceContent, keywordsInput, postGoal, brandTone, postLength, ctaType, generatePost])

  const handleCopy = () => {
    if (data?.post) {
      navigator.clipboard.writeText(data.post)
      setCopied(true)
      toast.success('Post copié dans le presse-papier !')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleUseInCockpit = () => {
    if (data?.post) {
      sessionStorage.setItem('prefilled_post', data.post)
      const keywords = keywordsInput.split(',').map(k => k.trim()).filter(Boolean)
      sessionStorage.setItem('prefilled_hashtags', keywords.map(k => `#${k}`).join(' '))
      navigate({ to: '/cockpit' })
      toast.success('Post transféré au Cockpit IA')
    }
  }

  const handleRegenerate = () => {
    reset()
    handleGenerate()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
            <LinkedinIcon size={18} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Générateur LinkedIn AIO</h3>
            <p className="text-xs text-muted-foreground">
              Transformez vos données en posts LinkedIn percutants, optimisés pour l'IA
            </p>
          </div>
        </div>
        {data && (
          <Button variant="ghost" size="sm" onClick={() => { reset(); }} className="gap-1.5 text-xs">
            <RefreshCw size={12} /> Nouveau post
          </Button>
        )}
      </div>

      {/* Input area */}
      <div className="space-y-4">
        {/* Source content */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
            Contenu source <span className="text-rose-400">*</span>
          </label>
          <textarea
            value={sourceContent}
            onChange={e => setSourceContent(e.target.value)}
            rows={5}
            placeholder="Collez ici un article de blog, des données de performance AIO, un rapport SEO, ou décrivez votre sujet principal...&#10;&#10;Exemple : « Notre analyse AIO montre que 73% des PME françaises ne sont pas citées par ChatGPT quand on cherche leurs services. Le score de visibilité IA moyen est de 18/100... »"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        {/* Keywords + Goal + Tone row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* AIO Keywords */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              <Hash size={11} className="inline mr-1" />
              Mots-clés AIO
            </label>
            <input
              value={keywordsInput}
              onChange={e => setKeywordsInput(e.target.value)}
              placeholder="visibilité IA, AIO, ChatGPT SEO"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-[10px] text-muted-foreground/40 mt-1">Séparés par des virgules</p>
          </div>

          {/* Goal */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              <Target size={11} className="inline mr-1" />
              Objectif
            </label>
            <div className="flex flex-wrap gap-1">
              {GOAL_PRESETS.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => setPostGoal(goal.id)}
                  className={cn(
                    'px-2 py-1 rounded-md text-[10px] font-medium transition-all',
                    postGoal === goal.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]',
                  )}
                >
                  {goal.icon} {goal.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              <Type size={11} className="inline mr-1" />
              Ton
            </label>
            <div className="flex flex-wrap gap-1">
              {TONE_PRESETS.map(tone => (
                <button
                  key={tone.id}
                  onClick={() => setBrandTone(tone.id)}
                  className={cn(
                    'px-2 py-1 rounded-md text-[10px] font-medium transition-all',
                    brandTone === tone.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]',
                  )}
                >
                  {tone.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Post Length + CTA Type row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Post Length */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              <FileText size={11} className="inline mr-1" />
              Longueur du post
            </label>
            <div className="flex flex-wrap gap-1">
              {LENGTH_PRESETS.map(length => (
                <button
                  key={length.id}
                  onClick={() => setPostLength(length.id)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all flex items-center gap-1',
                    postLength === length.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]',
                  )}
                >
                  <span>{length.icon}</span>
                  <span>{length.label}</span>
                  <span className="opacity-60">· {length.desc.split('·')[1]?.trim()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CTA Type */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              <MessageSquare size={11} className="inline mr-1" />
              Type d'appel à l'action
            </label>
            <div className="flex flex-wrap gap-1">
              {CTA_PRESETS.map(cta => (
                <button
                  key={cta.id}
                  onClick={() => setCtaType(cta.id)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all',
                    ctaType === cta.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]',
                  )}
                  title={cta.desc}
                >
                  {cta.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={isPending || !sourceContent.trim()}
        className="w-full gap-2 h-10"
      >
        {isPending ? (
          <>
            <RefreshCw size={14} className="animate-spin" />
            Génération en cours…
          </>
        ) : (
          <>
            <Sparkles size={14} />
            Générer le post LinkedIn
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3">
          <AlertCircle size={14} className="text-rose-400 shrink-0" />
          <p className="text-xs text-rose-400">{error.message}</p>
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {data?.post && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-4">
              {/* Post content */}
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-4">
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {data.post}
                </p>
              </div>

              {/* Metadata badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-[10px]">
                  <FileText size={9} className="mr-1" />
                  {data.metadata.charCount} caractères
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  <Type size={9} className="mr-1" />
                  {data.metadata.wordCount} mots
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  <Hash size={9} className="mr-1" />
                  {data.metadata.hashtagCount} hashtags
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  <Target size={9} className="mr-1" />
                  {data.metadata.goal}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  <Zap size={9} className="mr-1" />
                  {data.metadata.tone}
                </Badge>
                {data.metadata.postLength && (
                  <Badge variant="outline" className="text-[10px]">
                    <FileText size={9} className="mr-1" />
                    {data.metadata.postLength}
                  </Badge>
                )}
                {data.metadata.ctaType && (
                  <Badge variant="outline" className="text-[10px]">
                    <MessageSquare size={9} className="mr-1" />
                    CTA: {data.metadata.ctaType}
                  </Badge>
                )}
              </div>

              {/* Keywords used */}
              {data.metadata.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] text-muted-foreground/50 mr-1">Mots-clés :</span>
                  {data.metadata.keywords.map((kw, i) => (
                    <span key={i} className="text-[10px] text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded">
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                <Button size="sm" onClick={handleUseInCockpit} className="gap-1.5 text-xs h-7 px-3">
                  <Zap size={11} />
                  Utiliser dans le Cockpit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1.5 text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                >
                  {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  {copied ? 'Copié' : 'Copier'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  className="gap-1.5 text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                  disabled={isPending}
                >
                  <RefreshCw size={11} className={isPending ? 'animate-spin' : ''} />
                  Régénérer
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
