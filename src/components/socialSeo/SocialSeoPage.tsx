/**
 * Social-to-SEO Dashboard Page
 *
 * Main page component for the Social-to-SEO feature.
 * Dark mode native, Kompilot design system.
 *
 * This dashboard shows how your social media posts perform in Google search.
 * Key terms:
 * - Social-to-SEO: The link between social media activity and Google visibility
 * - Cross-Network: Analysis comparing different social platforms
 * - GBP: Google Business Profile (your business listing on Google Maps)
 */

import { useState } from 'react'
import { Page, PageHeader, PageTitle, PageBody } from '@blinkdotnew/ui'
import { useSocialSeoDashboard } from '@/hooks/useSocialSeo'
import { PlatformFilter } from './PlatformFilter'
import { KpiCards } from './KpiCards'
import { CrossNetworkInsights } from './CrossNetworkInsights'
import { TopPostsTable } from './TopPostsTable'
import { AgencyMultiAccount } from './AgencyMultiAccount'
import { usePlan } from '@/hooks/usePlan'
import type { Platform } from '@/data/socialSeo/mockData'
import { Skeleton } from '@blinkdotnew/ui'
import { RefreshCw, Download, BookOpen } from 'lucide-react'

export default function SocialSeoPage() {
  const [activePlatform, setActivePlatform] = useState<Platform>('all')
  const { data, isLoading, isRefetching, refetch } = useSocialSeoDashboard()
  const { canAccess } = usePlan()
  const isAgency = canAccess('team_management') || canAccess('multi_establish')

  if (isLoading) {
    return (
      <Page>
        <PageHeader>
          <PageTitle>Social-to-SEO</PageTitle>
        </PageHeader>
        <PageBody>
          <div className="space-y-6">
            <Skeleton className="h-12 w-full bg-slate-800" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-36 bg-slate-800" />
              <Skeleton className="h-36 bg-slate-800" />
              <Skeleton className="h-36 bg-slate-800" />
            </div>
            <Skeleton className="h-64 bg-slate-800" />
            <Skeleton className="h-80 bg-slate-800" />
          </div>
        </PageBody>
      </Page>
    )
  }

  if (!data) return null

  const filteredMetrics = activePlatform === 'all'
    ? data.platformMetrics
    : data.platformMetrics.filter(p => p.platform === activePlatform)

  const filteredPosts = activePlatform === 'all'
    ? data.topPosts
    : data.topPosts.filter(p => p.platform === activePlatform)

  const filteredInsights = activePlatform === 'all'
    ? data.crossNetworkInsights
    : data.crossNetworkInsights.filter(
        i => i.sourcePlatform === activePlatform || i.targetPlatform === activePlatform
      )

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <PageTitle>Social-to-SEO</PageTitle>
            <p className="text-sm text-slate-400 mt-1">
              Pilotage de votre visibilité sociale sur Google
              {data.lastSyncAt && (
                <span className="ml-2 text-xs text-slate-500">
                  Dernière sync : {new Date(data.lastSyncAt).toLocaleString('fr-FR')}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAgency && (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-teal-400 border border-teal-700/40 rounded-lg hover:bg-teal-900/20 transition-colors"
                title="Relancer le guide de configuration"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Relancer le guide
              </button>
            )}
            {isAgency && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors">
                <Download className="w-3.5 h-3.5" />
                Exporter le rapport
              </button>
            )}
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        <div className="space-y-6">
          {/* Agency: Multi-account selector */}
          {isAgency && <AgencyMultiAccount />}

          {/* Platform filter badges */}
          <PlatformFilter
            activePlatform={activePlatform}
            onChange={setActivePlatform}
            connectedPlatforms={data.connectedPlatforms}
          />

          {/* KPI Cards */}
          <KpiCards
            metrics={data.overallMetrics}
            platformMetrics={filteredMetrics}
            activePlatform={activePlatform}
            googleBusinessProfile={data.googleBusinessProfile}
          />

          {/* Cross-Network Insights */}
          <CrossNetworkInsights insights={filteredInsights} />

          {/* Top Performing Posts */}
          <TopPostsTable posts={filteredPosts} activePlatform={activePlatform} />
        </div>
      </PageBody>
    </Page>
  )
}
