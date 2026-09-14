/**
 * KPI Cards — 3 main metrics: Impressions Google, Clics Organiques, Évolution Globale
 *
 * Technical terms used:
 * - Impressions: Number of times content appeared in Google search results
 * - CTR (Click-Through Rate): % of people who clicked after seeing your content
 * - GBP (Google Business Profile): Your business listing on Google Maps
 */

import { Eye, MousePointerClick, TrendingUp, Star, MapPin } from 'lucide-react'
import { TermTooltip } from '@/components/shared/TermTooltip'
import type { PlatformMetrics, GoogleBusinessProfileMetrics, Platform } from '@/data/socialSeo/mockData'

interface KpiCardsProps {
  metrics: {
    totalImpressions: number
    totalClicks: number
    globalCtr: number
    impressionsEvolution: number
  }
  platformMetrics: PlatformMetrics[]
  activePlatform: Platform
  googleBusinessProfile: GoogleBusinessProfileMetrics
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function KpiCards({ metrics, platformMetrics, activePlatform, googleBusinessProfile }: KpiCardsProps) {
  // Get best performing platform this week
  const bestPlatform = platformMetrics.reduce(
    (best, p) => (p.weeklyTrend > (best?.weeklyTrend ?? -Infinity) ? p : best),
    platformMetrics[0]
  )

  return (
    <div className="space-y-4">
      {/* Main KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Impressions Google */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                Impressions Google
                <TermTooltip term="Impressions" size="sm" />
              </p>
              <p className="text-3xl font-bold text-white mt-2">{formatNum(metrics.totalImpressions)}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium">+{metrics.impressionsEvolution}%</span>
                <span className="text-xs text-slate-500">vs semaine dernière</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
              <Eye className="w-6 h-6 text-teal-400" />
            </div>
          </div>
        </div>

        {/* Clics Organiques */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                Clics Organiques
                <TermTooltip term="Organique" size="sm" />
              </p>
              <p className="text-3xl font-bold text-white mt-2">{formatNum(metrics.totalClicks)}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-slate-400">
                  CTR global : <span className="text-white font-medium">{metrics.globalCtr}%</span>
                </span>
                <TermTooltip term="CTR" size="sm" />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <MousePointerClick className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Évolution Globale / Best Platform */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Top Plateforme</p>
              <p className="text-2xl font-bold text-white mt-2 capitalize">{bestPlatform?.platform}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-sm text-amber-400 font-medium">+{bestPlatform?.weeklyTrend}%</span>
                <span className="text-xs text-slate-500">cette semaine</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <TrendingUp className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Google Business Profile strip */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-teal-400" />
          <span className="text-sm font-medium text-slate-300">Google Business Profile</span>
          <TermTooltip term="GBP" size="sm" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <GBPStat label="Avis" value={googleBusinessProfile.reviewsCount.toString()} sub={`${googleBusinessProfile.averageRating}★`} />
          <GBPStat label="Nouveaux avis" value={`+${googleBusinessProfile.newReviewsThisWeek}`} sub="cette semaine" />
          <GBPStat label="Vues profil" value={formatNum(googleBusinessProfile.profileViews)} sub="" />
          <GBPStat label="Clics site" value={formatNum(googleBusinessProfile.websiteClicks)} sub="" />
          <GBPStat label="Itinéraires" value={formatNum(googleBusinessProfile.directionRequests)} sub="" />
          <GBPStat label="Appels" value={googleBusinessProfile.callClicks.toString()} sub="" />
        </div>
      </div>
    </div>
  )
}

function GBPStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-teal-400">{sub}</p>}
    </div>
  )
}
