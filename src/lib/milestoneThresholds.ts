/**
 * milestoneThresholds.ts
 *
 * Central config store for all performance milestone trigger values.
 * Each threshold group maps to a named metric and contains:
 *   - value     : the current active threshold
 *   - default   : the factory default (used for reset)
 *   - min/max   : bounds for the UI controls
 *   - step      : increment for sliders
 *   - unit      : display string (e.g. "avis", "%", "★", "pos.")
 *   - label     : human-readable name shown in the panel
 *   - description: why this metric matters
 *
 * Thresholds are persisted in localStorage so changes survive page reloads.
 * Both usePerformanceMilestones and checkReviewMilestones read from here.
 */

const STORAGE_KEY = 'kompilot_milestone_thresholds_v1';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ThresholdDef {
  value: number;
  default: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  label: string;
  description: string;
}

export interface MilestoneThresholds {
  // ── Rank / position ──────────────────────────────────────────────────────────
  /** Rank at which "Top N" milestone fires (e.g. 3 = Top 3) */
  rankTopN: ThresholdDef;

  // ── Review volume ────────────────────────────────────────────────────────────
  /** First review-count milestone */
  reviewsFirst: ThresholdDef;
  /** Second review-count milestone */
  reviewsSecond: ThresholdDef;
  /** Third review-count milestone */
  reviewsThird: ThresholdDef;

  // ── Average rating ───────────────────────────────────────────────────────────
  /** First rating milestone (e.g. 4.0) */
  ratingFirst: ThresholdDef;
  /** Second (higher) rating milestone (e.g. 4.5) */
  ratingSecond: ThresholdDef;

  // ── Reply rate ───────────────────────────────────────────────────────────────
  /** First reply-rate milestone (e.g. 80%) */
  replyRateFirst: ThresholdDef;
  /** Perfect reply-rate milestone — always 100, shown read-only */
  replyRatePerfect: ThresholdDef;

  // ── AI reply count ───────────────────────────────────────────────────────────
  /** First AI-reply count milestone */
  aiRepliesFirst: ThresholdDef;
  /** Second AI-reply count milestone */
  aiRepliesSecond: ThresholdDef;
  /** Third AI-reply count milestone */
  aiRepliesThird: ThresholdDef;
}

// ── Factory defaults ──────────────────────────────────────────────────────────

export const DEFAULT_THRESHOLDS: MilestoneThresholds = {
  rankTopN: {
    value: 3, default: 3, min: 2, max: 10, step: 1,
    unit: 'pos.', label: 'Seuil Top N',
    description: 'Position Google Maps à partir de laquelle le cap "Top N" est célébré.',
  },
  reviewsFirst: {
    value: 50, default: 50, min: 5, max: 200, step: 5,
    unit: 'avis', label: '1er cap d\'avis',
    description: 'Nombre d\'avis pour la première célébration.',
  },
  reviewsSecond: {
    value: 100, default: 100, min: 10, max: 500, step: 10,
    unit: 'avis', label: '2e cap d\'avis',
    description: 'Nombre d\'avis pour la deuxième célébration.',
  },
  reviewsThird: {
    value: 200, default: 200, min: 50, max: 1000, step: 25,
    unit: 'avis', label: '3e cap d\'avis',
    description: 'Nombre d\'avis pour la troisième célébration.',
  },
  ratingFirst: {
    value: 4.0, default: 4.0, min: 3.0, max: 4.4, step: 0.1,
    unit: '★', label: '1re note cible',
    description: 'Note moyenne déclenchant la première alerte de qualité.',
  },
  ratingSecond: {
    value: 4.5, default: 4.5, min: 3.5, max: 5.0, step: 0.1,
    unit: '★', label: '2e note cible',
    description: 'Note moyenne déclenchant la deuxième alerte de qualité.',
  },
  replyRateFirst: {
    value: 80, default: 80, min: 50, max: 95, step: 5,
    unit: '%', label: 'Taux de réponse (1er cap)',
    description: 'Pourcentage de réponses aux avis pour la première célébration.',
  },
  replyRatePerfect: {
    value: 100, default: 100, min: 100, max: 100, step: 1,
    unit: '%', label: 'Taux parfait (100%)',
    description: 'Cap fixe à 100% — non modifiable.',
  },
  aiRepliesFirst: {
    value: 10, default: 10, min: 1, max: 50, step: 1,
    unit: 'rép. IA', label: '1er cap de réponses IA',
    description: 'Nombre de réponses IA générées pour la première célébration.',
  },
  aiRepliesSecond: {
    value: 25, default: 25, min: 5, max: 100, step: 5,
    unit: 'rép. IA', label: '2e cap de réponses IA',
    description: 'Nombre de réponses IA générées pour la deuxième célébration.',
  },
  aiRepliesThird: {
    value: 50, default: 50, min: 10, max: 200, step: 5,
    unit: 'rép. IA', label: '3e cap de réponses IA',
    description: 'Nombre de réponses IA générées pour la troisième célébration.',
  },
};

// ── Persistence helpers ───────────────────────────────────────────────────────

/** Load saved thresholds from localStorage, merged over defaults. */
export function loadThresholds(): MilestoneThresholds {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THRESHOLDS;

    const saved = JSON.parse(raw) as Partial<Record<keyof MilestoneThresholds, { value: number }>>;

    // Merge: keep all structure from defaults, only override `value` from saved
    const merged = { ...DEFAULT_THRESHOLDS } as MilestoneThresholds;
    for (const key of Object.keys(DEFAULT_THRESHOLDS) as (keyof MilestoneThresholds)[]) {
      if (saved[key]?.value !== undefined) {
        const v = saved[key]!.value;
        const def = DEFAULT_THRESHOLDS[key];
        // Clamp to valid range
        merged[key] = {
          ...def,
          value: Math.min(def.max, Math.max(def.min, v)),
        };
      }
    }
    return merged;
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}

/** Persist a single threshold change. */
export function saveThreshold(key: keyof MilestoneThresholds, value: number): void {
  try {
    const current = loadThresholds();
    const updated: Record<string, { value: number }> = {};
    for (const k of Object.keys(current) as (keyof MilestoneThresholds)[]) {
      updated[k] = { value: current[k].value };
    }
    updated[key] = { value };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { /* noop */ }
}

/** Reset all thresholds to factory defaults. */
export function resetThresholds(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* noop */ }
}

/** Quick accessor — returns only the `value` map for use in condition checks. */
export function getThresholdValues(): Record<keyof MilestoneThresholds, number> {
  const t = loadThresholds();
  return Object.fromEntries(
    Object.entries(t).map(([k, v]) => [k, (v as ThresholdDef).value]),
  ) as Record<keyof MilestoneThresholds, number>;
}
