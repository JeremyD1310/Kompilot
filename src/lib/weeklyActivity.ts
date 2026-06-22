// ── Weekly activity tracker ────────────────────────────────────────────────
// Lightweight localStorage-backed tracker for gamification state.

const ACTIVITY_KEY = 'kompilot_weekly_activity';
const FIRST_POST_KEY = 'kompilot_first_post_done';

export interface WeeklyActivity {
  week: string;    // e.g. "2026-W21"
  posts: number;
  reviewsAnswered: number;
}

function getISOWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function getCurrentWeek(): string {
  return getISOWeekKey();
}

export function getWeeklyActivity(): WeeklyActivity {
  const currentWeek = getCurrentWeek();
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (raw) {
      const data: WeeklyActivity = JSON.parse(raw);
      if (data.week === currentWeek) return data;
    }
  } catch { /* noop */ }
  return { week: currentWeek, posts: 0, reviewsAnswered: 0 };
}

function saveWeeklyActivity(activity: WeeklyActivity): void {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
  } catch { /* noop */ }
}

export function incrementWeeklyPosts(): void {
  const a = getWeeklyActivity();
  a.posts += 1;
  saveWeeklyActivity(a);
}

export function incrementWeeklyReviews(): void {
  const a = getWeeklyActivity();
  a.reviewsAnswered += 1;
  saveWeeklyActivity(a);
}

export function isFirstPost(): boolean {
  return !localStorage.getItem(FIRST_POST_KEY);
}

export function markFirstPostDone(): void {
  try {
    localStorage.setItem(FIRST_POST_KEY, '1');
  } catch { /* noop */ }
}
