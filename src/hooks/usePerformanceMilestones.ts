/**
 * usePerformanceMilestones
 *
 * Detects when a user crosses key Google Business performance thresholds and
 * fires in-app celebration notifications + a congratulatory email.
 *
 * All numeric thresholds are read from milestoneThresholds.ts so they can be
 * customised by the user from the Google Maps settings panel.
 *
 * Milestones tracked (via LocalVisibilityData):
 *   - rank_topN     : entered Top N local (configurable, default ≤ 3)
 *   - rank_top1     : reached #1 position (always fixed)
 *   - reviews_first : crossed reviewsFirst reviews
 *   - reviews_second: crossed reviewsSecond reviews
 *   - reviews_third : crossed reviewsThird reviews
 *   - rating_first  : reached ratingFirst average rating
 *   - rating_second : reached ratingSecond average rating
 *
 * Each milestone fires ONCE (localStorage dedup shared with reviewMilestones).
 */
import { useEffect, useCallback } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { useMilestoneEmail } from './useMilestoneEmail';
import { getThresholdValues } from '../lib/milestoneThresholds';
import type { LocalVisibilityData } from '../components/gmaps/LocalVisibilityWidget';

// ── Storage key (shared with reviewMilestones) ────────────────────────────────

const MILESTONE_KEY = 'kompilot_milestones_fired_v1';

function getFiredMilestones(): Set<string> {
  try {
    const raw = localStorage.getItem(MILESTONE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markMilestoneFired(id: string) {
  try {
    const set = getFiredMilestones();
    set.add(id);
    localStorage.setItem(MILESTONE_KEY, JSON.stringify([...set]));
  } catch { /* noop */ }
}

// ── Dynamic milestone builder ─────────────────────────────────────────────────

function buildVisibilityMilestones(t: ReturnType<typeof getThresholdValues>) {
  return [
    {
      id: 'rank_topN',
      condition: (d: LocalVisibilityData) =>
        d.currentRank <= t.rankTopN && d.currentRank > 1,
      notification: {
        emoji: '🏆',
        title: `Entrée dans le Top ${t.rankTopN} local !`,
        body: `Félicitations ! Grâce à vos optimisations, votre fiche vient d'atteindre la {rank} position dans votre zone. Continuez comme ça !`,
        actionLabel: 'Voir mon tableau de bord',
        actionHref: '/google-maps',
      },
    },
    {
      id: 'rank_top1',
      condition: (d: LocalVisibilityData) => d.currentRank === 1,
      notification: {
        emoji: '🥇',
        title: 'Vous êtes N°1 dans votre zone ! 🎉',
        body: `Incroyable ! Votre fiche est désormais en 1ère position sur votre mot-clé principal. Kompilot vous a propulsé au sommet !`,
        actionLabel: 'Voir ma fiche Google',
        actionHref: '/google-maps',
      },
    },
    {
      id: 'reviews_first',
      condition: (d: LocalVisibilityData) => d.currentReviews >= t.reviewsFirst,
      notification: {
        emoji: '⭐',
        title: `${t.reviewsFirst} avis Google franchis !`,
        body: `Votre fiche a dépassé les ${t.reviewsFirst} avis. La preuve sociale est en marche — les nouveaux clients vous font de plus en plus confiance.`,
        actionLabel: 'Voir mes avis',
        actionHref: '/google-maps',
      },
    },
    {
      id: 'reviews_second',
      condition: (d: LocalVisibilityData) => d.currentReviews >= t.reviewsSecond,
      notification: {
        emoji: '🎉',
        title: `Cap des ${t.reviewsSecond} avis franchi !`,
        body: `Félicitations ! 🎉 Votre fiche vient d'atteindre ${t.reviewsSecond} avis Google grâce aux réponses automatiques de votre Copilote IA. Un cap qui booste votre référencement local.`,
        actionLabel: 'Voir mon tableau de bord',
        actionHref: '/google-maps',
      },
    },
    {
      id: 'reviews_third',
      condition: (d: LocalVisibilityData) => d.currentReviews >= t.reviewsThird,
      notification: {
        emoji: '🚀',
        title: `${t.reviewsThird} avis — vous êtes une référence locale !`,
        body: `${t.reviewsThird} avis Google ! Vous faites partie des commerces les mieux notés de votre secteur. Votre réputation en ligne est exemplaire.`,
        actionLabel: 'Voir mes statistiques',
        actionHref: '/google-maps',
      },
    },
    {
      id: 'rating_first',
      condition: (d: LocalVisibilityData) => d.avgRating >= t.ratingFirst,
      notification: {
        emoji: '⭐',
        title: `Note moyenne ${t.ratingFirst}+ atteinte !`,
        body: `Note moyenne de {rating}/5 — Votre excellence de service est reconnue par Google. Cela améliore directement votre visibilité dans le Pack Local.`,
        actionLabel: 'Voir ma note',
        actionHref: '/google-maps',
      },
    },
    {
      id: 'rating_second',
      condition: (d: LocalVisibilityData) => d.avgRating >= t.ratingSecond,
      notification: {
        emoji: '🌟',
        title: `Note moyenne ${t.ratingSecond}+ atteinte !`,
        body: `Votre note de {rating}/5 vous place dans l'élite des établissements locaux. Un signal fort pour l'algorithme Google Local Pack.`,
        actionLabel: 'Voir ma note',
        actionHref: '/google-maps',
      },
    },
  ];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePerformanceMilestones(data: LocalVisibilityData | undefined) {
  const { push } = useNotifications();
  const { sendMilestoneEmail } = useMilestoneEmail();

  const checkMilestones = useCallback(() => {
    if (!data) return;
    const fired = getFiredMilestones();
    // Read thresholds fresh each check so config changes apply immediately
    const t = getThresholdValues();
    const milestones = buildVisibilityMilestones(t);

    for (const milestone of milestones) {
      if (fired.has(milestone.id)) continue;
      if (!milestone.condition(data)) continue;

      const body = milestone.notification.body
        .replace('{rank}', `${data.currentRank}ème`)
        .replace('{rating}', `${data.avgRating}`);

      const hydratedMilestone = {
        emoji: milestone.notification.emoji,
        title: milestone.notification.title,
        body,
        actionLabel: milestone.notification.actionLabel,
        actionHref: milestone.notification.actionHref,
      };

      // 1. In-app notification toast
      push({
        id: `milestone_${milestone.id}`,
        category: 'review',
        ...hydratedMilestone,
      });

      // 2. Email notification — fire-and-forget
      sendMilestoneEmail({ milestone: hydratedMilestone }).catch(() => {});

      markMilestoneFired(milestone.id);
    }
  }, [data, push, sendMilestoneEmail]);

  // Check on mount and whenever data changes
  useEffect(() => {
    const timer = setTimeout(checkMilestones, 1800);
    return () => clearTimeout(timer);
  }, [checkMilestones]);

  /** Manual trigger — unlocks a specific milestone and re-checks immediately. */
  const testMilestone = useCallback((milestoneId: string) => {
    try {
      const fired = getFiredMilestones();
      fired.delete(milestoneId);
      localStorage.setItem(MILESTONE_KEY, JSON.stringify([...fired]));
    } catch { /* noop */ }
    checkMilestones();
  }, [checkMilestones]);

  /** Reset ALL milestones (dev / admin helper). */
  const resetAllMilestones = useCallback(() => {
    try { localStorage.removeItem(MILESTONE_KEY); } catch { /* noop */ }
  }, []);

  return { testMilestone, resetAllMilestones };
}
