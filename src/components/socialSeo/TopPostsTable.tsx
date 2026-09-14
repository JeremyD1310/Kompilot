/**
 * Top Posts Table — top performing social posts visible on Google
 *
 * This table shows which of your social media posts are most visible
 * in Google search results, along with their engagement metrics.
 */

import { useState } from 'react'
import { ExternalLink, TrendingUp, Filter } from 'lucide-react'
import { ResponsiveImage } from '@/components/shared/ResponsiveImage'
import { TermTooltip } from '@/components/shared/TermTooltip'
import type { TopPost, Platform } from '@/data/socialSeo/mockData'

interface TopPostsTableProps {
  posts: TopPost[]
  activePlatform: Platform
}

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <span className="text-xs font-bold text-pink-400 bg-pink-400/10 rounded px-1.5 py-0.5">IG</span>,
  tiktok: <span className="text-xs font-bold text-white bg-slate-700 rounded px-1.5 py-0.5">T</span>,
  linkedin: <span className="text-xs font-bold text-blue-400 bg-blue-400/10 rounded px-1.5 py-0.5">in</span>,
  youtube: <span className="text-xs font-bold text-red-400 bg-red-400/10 rounded px-1.5 py-0.5">YT</span>,
}

const platformLabels: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  return `Il y a ${days}j`
}

export function TopPostsTable({ posts, activePlatform }: TopPostsTableProps) {
  const [sortKey, setSortKey] = useState<'impressions' | 'clicks' | 'ctr' | 'engagementRate'>('impressions')
  const [showQueries, setShowQueries] = useState<string | null>(null)

  const sorted = [...posts].sort((a, b) => b[sortKey] - a[sortKey])

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Top Performing Posts sur Google</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Publications sociales les plus visibles dans les résultats de recherche
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            "Requêtes clés" = les mots que les gens tapent sur Google pour trouver vos posts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
            className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="impressions">Trier par impressions</option>
            <option value="clicks">Trier par clics</option>
            <option value="ctr">Trier par CTR</option>
            <option value="engagementRate">Trier par engagement</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-700/30">
              <th className="text-left px-5 py-3 font-medium">Publication</th>
              <th className="text-left px-4 py-3 font-medium">Réseau</th>
              <th className="text-right px-4 py-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  Impressions
                  <TermTooltip term="Impressions" size="sm" />
                </span>
              </th>
              <th className="text-right px-4 py-3 font-medium">Clics</th>
              <th className="text-right px-4 py-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  CTR
                  <TermTooltip term="CTR" size="sm" />
                </span>
              </th>
              <th className="text-right px-4 py-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  Engagement
                  <TermTooltip term="ENGAGEMENT_RATE" size="sm" />
                </span>
              </th>
              <th className="text-left px-4 py-3 font-medium">Requêtes clés</th>
              <th className="text-right px-5 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/20">
            {sorted.map((post) => (
              <tr
                key={post.id}
                className="group hover:bg-slate-700/20 transition-colors"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2 max-w-xs">
                    {post.thumbnailUrl && (
                      <ResponsiveImage
                        src={post.thumbnailUrl}
                        alt={`Miniature de la publication ${post.title}`}
                        width={40}
                        height={40}
                        sizes="40px"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{post.title}</p>
                      {post.url && (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-slate-500 hover:text-teal-400 transition-colors flex items-center gap-1 truncate"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          {post.url.replace(/^https?:\/\/(www\.)?/, '').substring(0, 40)}...
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    {platformIcons[post.platform]}
                    <span className="text-xs text-slate-300">{platformLabels[post.platform]}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-sm font-mono text-white">{formatNum(post.impressions)}</span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-sm font-mono text-slate-300">{formatNum(post.clicks)}</span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className={`text-sm font-mono font-medium ${post.ctr > 7 ? 'text-emerald-400' : post.ctr > 5 ? 'text-teal-400' : 'text-slate-400'}`}>
                    {post.ctr.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className={`text-sm font-mono font-medium ${post.engagementRate > 8 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {post.engagementRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {post.associatedQueries.slice(0, 2).map((q, i) => (
                      <span key={i} className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono truncate max-w-[120px]">
                        {q}
                      </span>
                    ))}
                    {post.associatedQueries.length > 2 && (
                      <button
                        onClick={() => setShowQueries(showQueries === post.id ? null : post.id)}
                        className="text-[10px] text-teal-400 hover:text-teal-300 px-1"
                      >
                        +{post.associatedQueries.length - 2}
                      </button>
                    )}
                  </div>
                  {showQueries === post.id && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {post.associatedQueries.slice(2).map((q, i) => (
                        <span key={i} className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                          {q}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="text-xs text-slate-500">{timeAgo(post.publishedAt)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-500">Aucun post trouvé pour ce filtre</p>
        </div>
      )}
    </div>
  )
}
