/**
 * reviewMilestones.ts
 *
 * Standalone milestone checker for Google review processing actions.
 * Called imperatively after the AI successfully publishes a reply so that
 * celebration notifications fire at the exact moment the milestone is reached —
 * not just on page load.
 *
 * All numeric thresholds are read from milestoneThresholds.ts so they can
 * be customised by the user without touching source code.
 *
 * Milestones tracked (review-action driven):
 *   - reply_rate_first  : ≥ replyRateFirst% of reviews replied to
 *   - reply_rate_100    : 100% reply rate achieved (fixed)
 *   - ai_replies_first  : aiRepliesFirst AI-generated replies published
 *   - ai_replies_second : aiRepliesSecond AI replies
 *   - ai_replies_third  : aiRepliesThird AI replies
 *   - review_avg_first  : Average rating crossed ratingFirst
 *   - review_avg_second : Average rating crossed ratingSecond
 *
 * Each milestone fires ONCE per user (localStorage dedup, shared key with
 * usePerformanceMilestones so there's a single source of truth).
 */

import { getThresholdValues } from './milestoneThresholds';

const MILESTONE_KEY = 'kompilot_milestones_fired_v1';

// ── localStorage helpers ──────────────────────────────────────────────────────

function getFired(): Set<string> {
  try {
    const raw = localStorage.getItem(MILESTONE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markFired(id: string): void {
  try {
    const set = getFired();
    set.add(id);
    localStorage.setItem(MILESTONE_KEY, JSON.stringify([...set]));
  } catch { /* noop */ }
}

// ── localStorage counter for AI replies ──────────────────────────────────────

const AI_REPLY_COUNT_KEY = 'kompilot_ai_reply_count_v1';

export function incrementAIReplyCount(): number {
  try {
    const prev = parseInt(localStorage.getItem(AI_REPLY_COUNT_KEY) ?? '0', 10);
    const next = prev + 1;
    localStorage.setItem(AI_REPLY_COUNT_KEY, String(next));
    return next;
  } catch {
    return 0;
  }
}

export function getAIReplyCount(): number {
  try {
    return parseInt(localStorage.getItem(AI_REPLY_COUNT_KEY) ?? '0', 10);
  } catch {
    return 0;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReviewStats {
  /** Total number of reviews */
  totalReviews: number;
  /** Number of reviews that have been replied to (including the current one) */
  repliedCount: number;
  /** Current average rating */
  avgRating: number;
  /** Whether the triggering reply was AI-generated */
  wasAIGenerated: boolean;
}

export interface MilestoneNotification {
  id: string;
  category: 'review' | 'ai';
  emoji: string;
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
}

// ── Dynamic milestone builder ─────────────────────────────────────────────────

/**
 * Returns the milestone definitions with thresholds resolved from config at
 * call time — so changes made in the settings panel take effect immediately
 * on the next reply without reloading the page.
 */
function buildReviewMilestones(t: ReturnType<typeof getThresholdValues>) {
  const replyRatePct = (s: ReviewStats) =>
    s.totalReviews > 0 ? (s.repliedCount / s.totalReviews) * 100 : 0;

  return [
    // ── Reply rate ─────────────────────────────────────────────────────────────
    {
      id: 'reply_rate_first',
      condition: (s: ReviewStats) =>
        s.totalReviews > 0 && replyRatePct(s) >= t.replyRateFirst,
      notification: {
        category: 'review' as const,
        emoji: '🎯',
        title: `${t.replyRateFirst}% de taux de réponse atteint !`,
        body: `Vous répondez à plus de ${t.replyRateFirst}% de vos avis — Google valorise directement votre réactivité dans son algorithme de classement local. Continuez !`,
        actionLabel: 'Voir mes avis',
        actionHref: '/google-maps',
      },
    },
    {
      id: 'reply_rate_100',
      condition: (s: ReviewStats) =>
        s.totalReviews > 0 && s.repliedCount >= s.totalReviews,
      notification: {
        category: 'review' as const,
        emoji: '🏅',
        title: 'Taux de réponse 100% — Perfect !',
        body: 'Vous avez répondu à TOUS vos avis Google. Ce score parfait signale à Google votre engagement client et booste votre positionnement local. Bravo !',
        actionLabel: 'Voir mes avis',
        actionHref: '/google-maps',
      },
    },

    // ── AI reply count ─────────────────────────────────────────────────────────
    {
      id: 'ai_replies_first',
      condition: (s: ReviewStats, aiCount: number) =>
        s.wasAIGenerated && aiCount >= t.aiRepliesFirst,
      notification: {
        category: 'ai' as const,
        emoji: '🤖',
        title: `${t.aiRepliesFirst} réponses IA publiées !`,
        body: `Votre Copilote IA a répondu à ${t.aiRepliesFirst} avis à votre place. Chaque réponse IA renforce votre e-réputation et vous fait gagner un temps précieux.`,
        actionLabel: 'Voir mes avis',
        actionHref: '/google-maps',
      },
    },
    {
      id: 'ai_replies_second',
      condition: (s: ReviewStats, aiCount: number) =>
        s.wasAIGenerated && aiCount >= t.aiRepliesSecond,
      notification: {
        category: 'ai' as const,
        emoji: '⚡',
        title: `${t.aiRepliesSecond} réponses IA — Copilote en action !`,
        body: `Votre Copilote IA a géré ${t.aiRepliesSecond} avis Google en automatique. C'est en moyenne ${Math.round(t.aiRepliesSecond * 3)} minutes d'économisées ! Votre e-réputation est entre de bonnes mains.`,
        actionLabel: 'Voir les statistiques',
        actionHref: '/google-maps',
      },
    },
    {
      id: 'ai_replies_third',
      condition: (s: ReviewStats, aiCount: number) =>
        s.wasAIGenerated && aiCount >= t.aiRepliesThird,
      notification: {
        category: 'ai' as const,
        emoji: '🚀',
        title: `${t.aiRepliesThird} réponses IA — Vous êtes au top !`,
        body: `Incroyable ! ${t.aiRepliesThird} réponses générées par votre Copilote IA. Vous faites partie des établissements les mieux suivis de Google dans votre zone.`,
        actionLabel: 'Voir ma fiche Google',
        actionHref: '/google-maps',
      },
    },

    // ── Rating ────────────────────────────────────────────────────────────────
    {
      id: 'review_avg_first',
      condition: (s: ReviewStats) => s.avgRating >= t.ratingFirst,
      notification: {
        category: 'review' as const,
        emoji: '⭐',
        title: `Note moyenne ${t.ratingFirst}+ dépassée !`,
        body: `Votre note globale vient de franchir les ${t.ratingFirst} étoiles grâce à votre stratégie de réponse active. Cette note améliore directement votre visibilité Google.`,
        actionLabel: 'Voir mes avis',
        actionHref: '/google-maps',
      },
    },
    {
      id: 'review_avg_second',
      condition: (s: ReviewStats) => s.avgRating >= t.ratingSecond,
      notification: {
        category: 'review' as const,
        emoji: '🌟',
        title: `Excellente note ${t.ratingSecond}+ atteinte !`,
        body: `Votre note moyenne atteint ${t.ratingSecond}/5 — vous rejoignez l'élite des établissements locaux ! Cette note d'excellence est un signal fort pour l'algorithme Google Local Pack.`,
        actionLabel: 'Voir ma fiche Google',
        actionHref: '/google-maps',
      },
    },
  ];
}

// ── Main exported function ────────────────────────────────────────────────────

/**
 * Check all review-driven milestones and return notifications to fire.
 * Thresholds are resolved from the current user config at call time.
 * Marks each triggered milestone as fired to prevent duplicates.
 */
export function checkReviewMilestones(
  stats: ReviewStats,
): MilestoneNotification[] {
  const fired = getFired();
  const aiCount = getAIReplyCount();
  const t = getThresholdValues();
  const milestones = buildReviewMilestones(t);
  const toFire: MilestoneNotification[] = [];

  for (const def of milestones) {
    if (fired.has(def.id)) continue;
    if (!def.condition(stats, aiCount)) continue;
    toFire.push({ id: def.id, ...def.notification });
    markFired(def.id);
  }

  return toFire;
}
