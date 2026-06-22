/**
 * Credit consumption matrix — 4 levels based on technical complexity and API cost.
 *
 * Level 1 (1 credit)  : Quick daily actions
 * Level 2 (5 credits) : Advanced multi-channel generations
 * Level 3 (10 credits): Heavy strategic intelligence
 * Level 4 (30 credits): Industrial automation
 */

// ── Cost matrix ───────────────────────────────────────────────────────────────

export const CREDIT_COSTS = {
  // ── Level 1: Fluid daily actions (1 credit) ──────────────────────────────
  INBOX_AI_REPLY:    1,  // AI reply in WhatsApp / Instagram / Messenger inbox
  POST_TEXT_SINGLE:  1,  // Single text post or quick Google review reply
  VOICE_DICTATION:   1,  // Simple voice-to-text dictation

  // ── Level 2: Advanced multi-channel generations (5 credits) ──────────────
  VIDEO_SCRIPT:      5,  // Full vertical video script (TikTok / YouTube Shorts) with staging
  CAROUSEL_VISUAL:   5,  // Visual carousel (texts + AI visual suggestions)
  DIAGNOSTIC_REPAIR: 5,  // 1-click connection diagnostic + token auto-repair

  // ── Level 3: Heavy strategic intelligence (10 credits) ───────────────────
  GEO_RADAR_SCAN:   10,  // Full GEO/GEA Radar scan (ChatGPT + Gemini + Perplexity)
  CITATION_ANALYZER:10,  // Citation and competitor source tracking analyzer
  COUNTER_ATTACK:   10,  // Semantic counter-attack (500-word optimized blog article)

  // ── Level 4: Industrial automation (30 credits) ───────────────────────────
  BULK_CALENDAR:    30,  // 30-day editorial calendar bulk generation
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

// ── Plan monthly credit allowances ───────────────────────────────────────────

export const PLAN_CREDITS: Record<string, number> = {
  free:   100,   // Enough for ~100 quick replies or ~3 full bulk calendars
  pro:    500,   // Comfortable daily use across all levels
  expert: 2000,  // Heavy usage / agencies
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getCreditCost(action: CreditAction): number {
  return CREDIT_COSTS[action];
}

export interface CreditLevel {
  level: 1 | 2 | 3 | 4;
  label: string;
  color: string; // tailwind text color
  bgColor: string; // tailwind bg color
  borderColor: string; // tailwind border color
}

export function getCreditLevel(cost: number): CreditLevel {
  if (cost <= 1)  return { level: 1, label: 'Action rapide',               color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',  borderColor: 'border-emerald-200 dark:border-emerald-800/50' };
  if (cost <= 5)  return { level: 2, label: 'Génération avancée',           color: 'text-blue-600 dark:text-blue-400',       bgColor: 'bg-blue-50 dark:bg-blue-950/30',        borderColor: 'border-blue-200 dark:border-blue-800/50' };
  if (cost <= 10) return { level: 3, label: 'Intelligence stratégique',     color: 'text-amber-600 dark:text-amber-400',     bgColor: 'bg-amber-50 dark:bg-amber-950/30',      borderColor: 'border-amber-200 dark:border-amber-800/50' };
  return           { level: 4, label: 'Automatisation industrielle',  color: 'text-violet-600 dark:text-violet-400',   bgColor: 'bg-violet-50 dark:bg-violet-950/30',    borderColor: 'border-violet-200 dark:border-violet-800/50' };
}

// ── Credit spend history tracking (localStorage) ──────────────────────────────

const HISTORY_KEY = 'kompilot_credit_history_v1';

export interface CreditSpendEntry {
  date: string;   // ISO date string YYYY-MM-DD
  amount: number; // credits consumed
  action: CreditAction;
  label: string;  // human-readable action label
}

export function recordCreditSpend(amount: number, action: CreditAction): void {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history: CreditSpendEntry[] = raw ? JSON.parse(raw) : [];
    const today = new Date().toISOString().slice(0, 10);
    history.unshift({
      date: today,
      amount,
      action,
      label: ACTION_LABELS[action] ?? action,
    });
    // Keep last 90 entries
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 90)));
  } catch { /* noop */ }
}

export function getCreditSpendHistory(): CreditSpendEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function getWeeklySpendSummary(): { day: string; total: number }[] {
  const history = getCreditSpendHistory();
  const days: { day: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const total = history.filter(e => e.date === dateStr).reduce((s, e) => s + e.amount, 0);
    days.push({ day: d.toLocaleDateString('fr-FR', { weekday: 'short' }), total });
  }
  return days;
}

// ── Human-readable action labels ─────────────────────────────────────────────

export const ACTION_LABELS: Record<CreditAction, string> = {
  INBOX_AI_REPLY:    'Réponse IA Inbox',
  POST_TEXT_SINGLE:  'Génération de post',
  VOICE_DICTATION:   'Dictée vocale',
  VIDEO_SCRIPT:      'Script vidéo vertical',
  CAROUSEL_VISUAL:   'Carrousel visuel',
  DIAGNOSTIC_REPAIR: 'Diagnostic de connexion',
  GEO_RADAR_SCAN:    'Scan Radar GEO & GEA',
  CITATION_ANALYZER: 'Analyseur de citations',
  COUNTER_ATTACK:    'Contre-attaque sémantique',
  BULK_CALENDAR:     'Calendrier en masse (30j)',
};
