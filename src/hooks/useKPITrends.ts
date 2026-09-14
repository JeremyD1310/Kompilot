/**
 * useKPITrends — Week-over-week KPI trend data for the dashboard.
 * Computes deltas between current and previous week for each KPI metric.
 */
import { useQuery } from '@tanstack/react-query'
import { blink } from '../blink/client'

export interface KPITrend {
  current: number
  previous: number
  delta: number        // absolute difference
  deltaPercent: number // percentage change
  direction: 'up' | 'down' | 'flat'
  label: string        // e.g. "+12%" or "-5%"
}

export interface KPITrendsData {
  scheduledPosts: KPITrend
  unreadMessages: KPITrend
  publishedPosts: KPITrend
  pendingReviews: KPITrend
}

function computeTrend(current: number, previous: number): KPITrend {
  const delta = current - previous
  const deltaPercent = previous > 0 ? Math.round((delta / previous) * 100) : (current > 0 ? 100 : 0)
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
  const sign = delta > 0 ? '+' : ''
  const label = previous === 0
    ? (current > 0 ? 'Nouveau' : '—')
    : `${sign}${deltaPercent}%`

  return { current, previous, delta, deltaPercent, direction, label }
}

function getWeekRange(weeksAgo: number = 0): { start: string; end: string } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset - (weeksAgo * 7))
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  }
}

export function useKPITrends(userId?: string) {
  return useQuery<KPITrendsData>({
    queryKey: ['kpi-trends', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user')

      const thisWeek = getWeekRange(0)
      const lastWeek = getWeekRange(1)

      // Fetch all posts once, compute by date ranges
      const allPosts = await blink.db.table<Record<string, any>>('scheduledPosts').list({
        where: { userId },
        limit: 500,
      }) ?? []

      // Fetch messages
      const allMessages = await blink.db.table<Record<string, any>>('messages').list({
        where: { userId },
        limit: 500,
      }) ?? []

      // Scheduled posts (status = 'scheduled' or 'Planifié')
      const isScheduled = (p: any) => p.status === 'Planifié' || p.status === 'scheduled'
      const isInDateRange = (dateStr: string, range: { start: string; end: string }) =>
        dateStr >= range.start && dateStr <= range.end

      const currentScheduled = allPosts.filter((p: any) =>
        isScheduled(p) && isInDateRange(p.scheduledAt || p.createdAt || '', thisWeek)
      ).length
      const previousScheduled = allPosts.filter((p: any) =>
        isScheduled(p) && isInDateRange(p.scheduledAt || p.createdAt || '', lastWeek)
      ).length

      // Published posts (status = 'Publié' or 'approved')
      const isPublished = (p: any) => p.status === 'Publié' || p.status === 'approved'
      const currentPublished = allPosts.filter((p: any) =>
        isPublished(p) && isInDateRange(p.scheduledAt || p.createdAt || '', thisWeek)
      ).length
      const previousPublished = allPosts.filter((p: any) =>
        isPublished(p) && isInDateRange(p.scheduledAt || p.createdAt || '', lastWeek)
      ).length

      // Unread messages (current count vs count from last week's snapshot)
      const currentUnread = allMessages.filter((m: any) => !m.isRead).length
      // For unread, we track the total accumulated (not date-bounded), so use a simple heuristic
      const previousUnread = allMessages.filter((m: any) =>
        !m.isRead && isInDateRange(m.createdAt || '', lastWeek)
      ).length

      // Pending reviews (unhandled — simplified since reviews aren't in a dedicated table in this schema)
      const currentReviews = 0
      const previousReviews = 0

      return {
        scheduledPosts: computeTrend(currentScheduled, previousScheduled),
        unreadMessages: computeTrend(currentUnread, previousUnread > 0 ? previousUnread : currentUnread),
        publishedPosts: computeTrend(currentPublished, previousPublished),
        pendingReviews: computeTrend(currentReviews, previousReviews),
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  })
}
