import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ImageIcon, Zap, CheckCircle2, Download } from 'lucide-react'
import { toast } from '@blinkdotnew/ui'
import { blink } from '@/blink/client'
import { textStyleToPromptHint, DEFAULT_TEXT_STYLE, type TextStyle } from '../../lib/typographyStyles'

interface VisualSet {
  square?: string
  story?: string
  loading: boolean
}

interface Props {
  angles: string[]
  logoUrl?: string
  brandColor?: string
  businessName?: string
  onSelectVisual?: (url: string) => void
  textStyle?: TextStyle
}

export function VisualAutoGenerator({
  angles,
  brandColor = '#0D9488',
  businessName,
  onSelectVisual,
  textStyle,
}: Props) {
  const typoHint = textStyleToPromptHint(textStyle ?? DEFAULT_TEXT_STYLE)
  const [visuals, setVisuals] = useState<Record<number, VisualSet>>(
    Object.fromEntries(angles.map((_, i) => [i, { loading: false }]))
  )

  const buildPrompt = (angle: string) =>
    `Professional social media visual for a local business, ${angle}, minimalist design, ${brandColor} accent color, clean typography, no text overlay, instagram-worthy, high quality commercial photography style, square format 1:1. ${typoHint}`

  const generateForAngle = async (index: number) => {
    const angle = angles[index]
    setVisuals(prev => ({ ...prev, [index]: { ...prev[index], loading: true } }))
    try {
      const [squareRes, storyRes] = await Promise.all([
        blink.ai.generateImage({ prompt: buildPrompt(angle), size: '1024x1024' }),
        blink.ai.generateImage({ prompt: buildPrompt(angle), size: '1024x1536' }),
      ])
      setVisuals(prev => ({
        ...prev,
        [index]: { loading: false, square: squareRes.data[0].url, story: storyRes.data[0].url },
      }))
      toast.success('Visuels générés !', { description: `Angle ${index + 1} prêt.` })
    } catch {
      setVisuals(prev => ({ ...prev, [index]: { loading: false } }))
      toast.error('Erreur de génération', { description: 'Impossible de générer le visuel.' })
    }
  }

  const generateAll = async () => {
    await Promise.all(angles.map((_, i) => generateForAngle(i)))
    toast.success('Tous les visuels générés !', { description: '3 angles × 2 formats prêts.' })
  }

  const anyLoading = Object.values(visuals).some(v => v.loading)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-400" />
            <h2 className="text-base font-semibold text-gray-100">
              Visuels IA Automatiques
            </h2>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">
              Pro
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Formats carré (Instagram/Google) et story générés automatiquement
            {businessName && ` · ${businessName}`}
          </p>
        </div>
        <button
          onClick={generateAll}
          disabled={anyLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors shrink-0"
        >
          <Zap className="h-3.5 w-3.5" />
          Tout générer
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {angles.map((angle, index) => {
          const visual = visuals[index]
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.35, ease: 'easeOut' }}
              className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 space-y-3"
            >
              {/* Angle label + badges */}
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-300 leading-snug line-clamp-2 flex-1">
                  {angle}
                </p>
                <div className="flex gap-1.5 shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 border border-gray-600">
                    Carré 1:1
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 border border-gray-600">
                    Story 9:16
                  </span>
                </div>
              </div>

              {/* Content */}
              {visual.loading ? (
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1].map(i => (
                    <div
                      key={i}
                      className="animate-pulse bg-gray-700/70 rounded-lg flex items-center justify-center"
                      style={{ aspectRatio: i === 0 ? '1/1' : '9/16', maxHeight: '120px' }}
                    >
                      <ImageIcon className="h-6 w-6 text-gray-600" />
                    </div>
                  ))}
                </div>
              ) : visual.square ? (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { url: visual.square, label: 'Carré', ratio: '1 / 1' },
                    { url: visual.story, label: 'Story', ratio: '9 / 16' },
                  ].map(({ url, label, ratio }) =>
                    url ? (
                      <div key={label} className="relative group rounded-lg overflow-hidden border border-gray-700">
                        <img
                          src={url}
                          alt={label}
                          className="w-full object-cover"
                          style={{ aspectRatio: ratio, maxHeight: '140px' }}
                        />
                        <div className="absolute inset-0 bg-gray-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          <button
                            onClick={() => onSelectVisual?.(url)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Sélectionner
                          </button>
                          <a
                            href={url}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Télécharger
                          </a>
                        </div>
                        <span className="absolute bottom-1 left-1 text-[9px] px-1 py-0.5 rounded bg-gray-900/80 text-gray-300">
                          {label}
                        </span>
                      </div>
                    ) : null
                  )}
                </div>
              ) : (
                <button
                  onClick={() => generateForAngle(index)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-gray-600 hover:border-teal-500/60 hover:bg-teal-500/5 text-gray-500 hover:text-teal-400 text-xs font-medium transition-all"
                >
                  <ImageIcon className="h-4 w-4" />
                  Générer les visuels pour cet angle
                </button>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
