/**
 * KPITargetModal — Set weekly KPI targets with a simple slider/input UI.
 * Opens from the KPI detail modal "Set target" button or from the KPI card hover.
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Target, TrendingUp, Calendar, Mail, CheckCircle2, Star, ArrowRight } from 'lucide-react'
import { Button, Input, cn } from '@blinkdotnew/ui'

export interface KPITargetMetric {
  key: string
  label: string
  icon: React.ReactNode
  current: number
  defaultValue: number
  unit?: string
  description: string
}

interface KPITargetModalProps {
  open: boolean
  onClose: () => void
  metrics: KPITargetMetric[]
  currentTargets: Record<string, number | null>
  onSave: (key: string, target: number) => void
  onClear: (key: string) => void
}

const PRESET_TARGETS: Record<string, number[]> = {
  scheduledPosts: [3, 5, 7, 10],
  publishedPosts: [2, 4, 6, 8],
  unreadMessages: [0, 5, 10, 20],
  pendingReviews: [0, 3, 5, 10],
}

const PRESET_LABELS: Record<string, string[]> = {
  scheduledPosts: ['Léger', 'Régulier', 'Actif', 'Intensif'],
  publishedPosts: ['Léger', 'Régulier', 'Actif', 'Intensif'],
  unreadMessages: ['Zéro', 'Minimal', 'Modéré', 'Flexible'],
  pendingReviews: ['Zéro', 'Rapide', 'Modéré', 'Flexible'],
}

export function KPITargetModal({ open, onClose, metrics, currentTargets, onSave, onClear }: KPITargetModalProps) {
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {}
      metrics.forEach(m => {
        const existing = currentTargets[m.key]
        initial[m.key] = existing !== null && existing !== undefined ? String(existing) : String(m.defaultValue)
      })
      setValues(initial)
    }
  }, [open, metrics, currentTargets])

  const handleSave = (key: string) => {
    const val = parseInt(values[key], 10)
    if (!isNaN(val) && val >= 0) {
      onSave(key, val)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#0B1120] shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] sticky top-0 bg-[#0B1120] z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target size={16} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Objectifs hebdomadaires</h3>
                    <p className="text-[11px] text-muted-foreground">Définissez vos cibles pour cette semaine</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center hover:bg-white/[0.1] transition-colors"
                >
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>

              {/* Metrics */}
              <div className="p-5 space-y-5">
                {metrics.map(metric => {
                  const currentTarget = currentTargets[metric.key]
                  const presets = PRESET_TARGETS[metric.key] || [3, 5, 7]
                  const presetLabels = PRESET_LABELS[metric.key] || ['Bas', 'Moyen', 'Haut']

                  return (
                    <div key={metric.key} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
                      {/* Metric header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground/70">{metric.icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{metric.label}</p>
                            <p className="text-[10px] text-muted-foreground/60">
                              Actuellement : {metric.current} {metric.unit || ''}
                            </p>
                          </div>
                        </div>
                        {currentTarget !== null && currentTarget !== undefined && (
                          <button
                            onClick={() => onClear(metric.key)}
                            className="text-[10px] text-muted-foreground/40 hover:text-rose-400 transition-colors"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground/50 leading-relaxed">
                        {metric.description}
                      </p>

                      {/* Preset buttons */}
                      <div className="flex gap-1.5">
                        {presets.map((preset, i) => (
                          <button
                            key={preset}
                            onClick={() => {
                              setValues(prev => ({ ...prev, [metric.key]: String(preset) }))
                              onSave(metric.key, preset)
                            }}
                            className={cn(
                              'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
                              values[metric.key] === String(preset)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground',
                            )}
                          >
                            {presetLabels[i]}
                            <span className="block text-[10px] opacity-60 mt-0.5">{preset}</span>
                          </button>
                        ))}
                      </div>

                      {/* Custom input */}
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={values[metric.key] || ''}
                          onChange={e => setValues(prev => ({ ...prev, [metric.key]: e.target.value }))}
                          onBlur={() => handleSave(metric.key)}
                          onKeyDown={e => e.key === 'Enter' && handleSave(metric.key)}
                          className="h-8 text-xs bg-white/[0.04] border-white/[0.08]"
                          placeholder="Valeur personnalisée"
                        />
                        <span className="text-[10px] text-muted-foreground/40 shrink-0">
                          {metric.unit || '/ semaine'}
                        </span>
                      </div>
                    </div>
                  )
                })}

                {/* Info */}
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                  <p className="text-xs text-primary/80 leading-relaxed">
                    💡 Les objectifs sont réinitialisés chaque lundi. Ils apparaissent comme barres de progression sur vos cartes KPI.
                  </p>
                </div>

                {/* Save all */}
                <Button className="w-full gap-2" onClick={onClose}>
                  Enregistrer les objectifs
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
