/**
 * useKPIGoals — Persist weekly KPI targets per user.
 * Stored in localStorage (no DB table needed — goals reset weekly).
 * Provides current goals and progress computation.
 */
import { useState, useEffect, useCallback } from 'react'

export interface KPIGoal {
  target: number
  updatedAt: string  // ISO date
  weekStart: string   // Monday ISO date
}

export interface KPIGoals {
  scheduledPosts: KPIGoal | null
  publishedPosts: KPIGoal | null
  unreadMessages: KPIGoal | null  // target = max acceptable unread (lower is better)
  pendingReviews: KPIGoal | null  // target = 0 (always aim to reply to all)
}

export interface GoalProgress {
  goal: KPIGoal | null
  current: number
  target: number
  percent: number        // 0-100+
  isLowerBetter: boolean // true for unread/reviews (aim for 0)
  status: 'achieved' | 'on-track' | 'behind' | 'no-goal'
}

const STORAGE_KEY = (userId: string) => `kompilot_kpi_goals_${userId}`

function getMonday(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - now.getDate()
  const monday = new Date(now)
  monday.setDate(now.getDate() + (day === 0 ? -6 : 1 - day))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().slice(0, 10)
}

function getWeekKey(): string {
  return getMonday()
}

const LOWER_BETTER_METRICS = new Set(['unreadMessages', 'pendingReviews'])

export function useKPIGoals(userId?: string) {
  const [goals, setGoals] = useState<KPIGoals>({
    scheduledPosts: null,
    publishedPosts: null,
    unreadMessages: null,
    pendingReviews: null,
  })
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage
  useEffect(() => {
    if (!userId) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY(userId))
      if (raw) {
        const parsed = JSON.parse(raw) as KPIGoals
        // Check if goals are from this week — reset if not
        const thisWeek = getWeekKey()
        const isValid = (g: KPIGoal | null) => g && g.weekStart === thisWeek
        setGoals({
          scheduledPosts: isValid(parsed.scheduledPosts) ? parsed.scheduledPosts : null,
          publishedPosts: isValid(parsed.publishedPosts) ? parsed.publishedPosts : null,
          unreadMessages: isValid(parsed.unreadMessages) ? parsed.unreadMessages : null,
          pendingReviews: isValid(parsed.pendingReviews) ? parsed.pendingReviews : null,
        })
      }
    } catch { /* ignore */ }
    setLoaded(true)
  }, [userId])

  // Save goal
  const setGoal = useCallback((metric: keyof KPIGoals, target: number) => {
    if (!userId) return
    const goal: KPIGoal = {
      target: Math.max(0, Math.round(target)),
      updatedAt: new Date().toISOString(),
      weekStart: getWeekKey(),
    }
    setGoals(prev => {
      const next = { ...prev, [metric]: goal }
      try {
        localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(next))
      } catch { /* ignore */ }
      return next
    })
  }, [userId])

  // Clear a single goal
  const clearGoal = useCallback((metric: keyof KPIGoals) => {
    if (!userId) return
    setGoals(prev => {
      const next = { ...prev, [metric]: null }
      try {
        localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(next))
      } catch { /* ignore */ }
      return next
    })
  }, [userId])

  // Compute progress for a metric
  const getProgress = useCallback((metric: keyof KPIGoals, current: number): GoalProgress => {
    const goal = goals[metric]
    if (!goal) return { goal: null, current, target: 0, percent: 0, isLowerBetter: false, status: 'no-goal' }

    const isLowerBetter = LOWER_BETTER_METRICS.has(metric)
    const target = goal.target
    let percent: number
    let status: GoalProgress['status']

    if (isLowerBetter) {
      // For unread/reviews: target=0 is ideal. percent = how close to 0
      percent = target > 0 ? Math.round(((target - current) / target) * 100) : (current === 0 ? 100 : 0)
      status = current <= target ? 'achieved' : current <= target * 1.5 ? 'on-track' : 'behind'
    } else {
      // For posts: higher is better
      percent = target > 0 ? Math.round((current / target) * 100) : 0
      status = current >= target ? 'achieved' : current >= target * 0.5 ? 'on-track' : 'behind'
    }

    return { goal, current, target, percent: Math.max(0, percent), isLowerBetter, status }
  }, [goals])

  // Check if any goals are set for this week
  const hasGoals = goals.scheduledPosts !== null ||
    goals.publishedPosts !== null ||
    goals.unreadMessages !== null ||
    goals.pendingReviews !== null

  return { goals, setGoal, clearGoal, getProgress, loaded, hasGoals }
}
