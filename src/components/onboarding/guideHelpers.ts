// ── XP / Storage constants ────────────────────────────────────────────────────

export const XP_STORAGE_KEY = 'kompilot_guide_xp';
export const COMPLETED_STORAGE_KEY = 'kompilot_guide_completed';

// ── XP Level helper ────────────────────────────────────────────────────────────

export function getLevel(xp: number): {
  level: number;
  label: string;
  color: string;
  nextXP: number;
} {
  if (xp >= 700) return { level: 6, label: 'Maitre',     color: 'text-amber-400',   nextXP: 700 };
  if (xp >= 500) return { level: 5, label: 'Expert',     color: 'text-violet-400',  nextXP: 700 };
  if (xp >= 350) return { level: 4, label: 'Avance',     color: 'text-blue-400',    nextXP: 500 };
  if (xp >= 200) return { level: 3, label: 'Competent',  color: 'text-teal-400',    nextXP: 350 };
  if (xp >= 80)  return { level: 2, label: 'Debutant',   color: 'text-emerald-400', nextXP: 200 };
  return           { level: 1, label: 'Novice',     color: 'text-slate-400',   nextXP: 80  };
}
