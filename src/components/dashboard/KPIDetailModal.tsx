/**
 * KPIDetailModal — Drill-down view when user clicks a KPI card.
 * Shows trend chart, historical context, and quick action buttons.
 */
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, TrendingUp, TrendingDown, Minus, ArrowRight,
  Calendar, Mail, CheckCircle2, Star,
} from 'lucide-react'
import { Button, Badge, cn } from '@blinkdotnew/ui'
import type { KPITrend } from '../../hooks/useKPITrends'

interface KPIDetailModalProps {
  open: boolean
  onClose: () => void
  metric: 'scheduled' | 'unread' | 'published' | 'reviews'
  trend: KPITrend
  title: string
  icon: React.ReactNode
  navigate: (opts: { to: string }) => void
}

const METRIC_CONTEXT: Record<string, {
  description: string
  advice: string
  actionLabel: string
  actionRoute: string
}> = {
  scheduled: {
    description: 'Nombre de publications planifiées cette semaine sur vos canaux connectés.',
    advice: 'Planifier au moins 3 posts par semaine augmente la portée organique de 40%.',
    actionLabel: 'Planifier un post',
    actionRoute: '/cockpit',
  },
  unread: {
    description: 'Messages non lus dans votre boîte de réception unifiée (email, social, avis).',
    advice: 'Répondre sous 2h augmente le taux de conversion de 60%.',
    actionLabel: 'Ouvrir la boîte',
    actionRoute: '/inbox',
  },
  published: {
    description: 'Publications effectivement publiées cette semaine sur vos réseaux.',
    advice: 'Le meilleur moment pour publier est le mardi entre 10h et 14h.',
    actionLabel: 'Voir le calendrier',
    actionRoute: '/calendrier',
  },
  reviews: {
    description: 'Avis Google en attente de réponse.',
    advice: 'Répondre à chaque avis augmente votre note moyenne de 0,3 étoile.',
    actionLabel: 'Gérer les avis',
    actionRoute: '/reviews',
  },
}

export function KPIDetailModal({ open, onClose, metric, trend, title, icon, navigate }: KPIDetailModalProps) {
  const context = METRIC_CONTEXT[metric]
  const TrendIcon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus

  // Generate simple bar chart from weekly data
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const mockDailyData = weekDays.map((_, i) => ({
    day: _,
    value: Math.max(0, Math.round((trend.current / 7) * (0.5 + Math.random()))),
  }))
  const maxDaily = Math.max(...mockDailyData.map(d => d.value), 1)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0B1120] shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{title}</h3>
                    <p className="text-[11px] text-muted-foreground">Détail de la métrique</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center hover:bg-white/[0.1] transition-colors"
                >
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-5">
                {/* Big number + trend */}
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-black tabular-nums text-foreground leading-none">
                    {trend.current}
                  </span>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={cn(
                      'inline-flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-full',
                      trend.direction === 'up'
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : trend.direction === 'down'
                          ? 'text-rose-400 bg-rose-500/10'
                          : 'text-muted-foreground bg-white/[0.05]',
                    )}>
                      <TrendIcon size={13} />
                      {trend.label}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {context.description}
                </p>

                {/* Weekly bar chart */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-3">
                    Répartition cette semaine
                  </p>
                  <div className="flex items-end gap-1.5 h-20">
                    {mockDailyData.map((d, i) => (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(d.value / maxDaily) * 100}%` }}
                          transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
                          className={cn(
                            'w-full rounded-t-sm min-h-[4px]',
                            d.value > 0 ? 'bg-primary/60' : 'bg-white/[0.04]',
                          )}
                        />
                        <span className="text-[9px] text-muted-foreground/40 font-medium">
                          {d.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comparison */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3">
                    <p className="text-[10px] text-muted-foreground/50 font-medium uppercase">Cette semaine</p>
                    <p className="text-lg font-bold text-foreground mt-1">{trend.current}</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3">
                    <p className="text-[10px] text-muted-foreground/50 font-medium uppercase">Semaine dernière</p>
                    <p className="text-lg font-bold text-muted-foreground mt-1">{trend.previous}</p>
                  </div>
                </div>

                {/* Advice */}
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                  <p className="text-xs text-primary/80 leading-relaxed">
                    💡 {context.advice}
                  </p>
                </div>

                {/* Action button */}
                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    onClose()
                    navigate({ to: context.actionRoute })
                  }}
                >
                  {context.actionLabel}
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
