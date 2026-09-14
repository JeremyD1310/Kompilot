/**
 * Cross-Network Insights — predictive recommendations from the Bridge algorithm
 *
 * "Cross-Network" means comparing performance across different social platforms
 * and Google to find opportunities.
 */

import { useState } from 'react'
import { Lightbulb, ArrowRight, X, TrendingUp, AlertTriangle, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { TermTooltip } from '@/components/shared/TermTooltip'
import type { CrossNetworkInsight } from '@/data/socialSeo/mockData'

interface CrossNetworkInsightsProps {
  insights: CrossNetworkInsight[]
}

const severityConfig = {
  high: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: Zap, label: 'Haute' },
  medium: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: TrendingUp, label: 'Moyenne' },
  low: { bg: 'bg-slate-700/50', border: 'border-slate-600/30', text: 'text-slate-400', icon: Lightbulb, label: 'Info' },
}

const typeLabels = {
  keyword_opportunity: 'Opportunité mot-clé',
  content_repurpose: 'Repositionnement contenu',
  trend_alert: 'Alerte tendance',
  gap_detected: 'Gap détecté',
}

export function CrossNetworkInsights({ insights }: CrossNetworkInsightsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = insights.filter(i => !dismissed.has(i.id))

  if (visible.length === 0) return null

  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900 border border-slate-700/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700/50 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <Lightbulb className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
            Cross-Network Insights
            <TermTooltip term="CROSS_NETWORK" size="sm" />
          </h3>
          <p className="text-xs text-slate-400">Recommandations prédictives basées sur vos données inter-réseaux</p>
        </div>
        <span className="ml-auto text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full font-medium">
          {visible.length} recommandation{visible.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="divide-y divide-slate-700/30">
        {visible.slice(0, 5).map(insight => {
          const config = severityConfig[insight.severity]
          const Icon = config.icon
          const isExpanded = expandedId === insight.id

          return (
            <div key={insight.id} className={`${config.bg} transition-all duration-200`}>
              <div className="px-5 py-3.5 flex items-start gap-3">
                <div className={`mt-0.5 p-1.5 rounded-md ${config.bg} border ${config.border}`}>
                  <Icon className={`w-4 h-4 ${config.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] uppercase tracking-wider font-semibold ${config.text}`}>
                      {config.label}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {typeLabels[insight.type]}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {insight.sourcePlatform} → {insight.targetPlatform}
                    </span>
                  </div>
                  <p className="text-sm text-white mt-1 font-medium leading-snug">
                    {insight.title}
                  </p>
                  {insight.estimatedImpact && (
                    <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {insight.estimatedImpact}
                    </p>
                  )}

                  {isExpanded && (
                    <div className="mt-3 space-y-2 pl-3 border-l-2 border-slate-600">
                      <p className="text-xs text-slate-300">{insight.description}</p>
                      <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/50">
                        <p className="text-xs text-teal-400 font-medium mb-1">Recommandation :</p>
                        <p className="text-xs text-slate-200">{insight.actionableRecommendation}</p>
                      </div>
                      {insight.relatedQuery && (
                        <p className="text-xs text-slate-500">
                          Requête associée : <span className="text-slate-300 font-mono">"{insight.relatedQuery}"</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setDismissed(prev => new Set(prev).add(insight.id))
                      setExpandedId(null)
                    }}
                    className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {visible.length > 5 && (
        <div className="px-5 py-3 border-t border-slate-700/30 text-center">
          <button className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
            Voir {visible.length - 5} autre{visible.length - 5 > 1 ? 's' : ''} recommandation{visible.length - 5 > 1 ? 's' : ''}
            <ArrowRight className="w-3 h-3 inline ml-1" />
          </button>
        </div>
      )}
    </div>
  )
}
