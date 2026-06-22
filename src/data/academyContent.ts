/**
 * academyContent.ts — thin facade re-exporting from the modular academy data.
 *
 * Sub-modules:
 *   academy/types.ts        — shared types + channel catalogue
 *   academy/modulesBase.ts  — free & legacy premium modules
 *   academy/modulesSEA.ts   — SEA (Google Ads + Meta Ads) premium modules
 */

export type { AcademyChannel, AcademyFormat, AcademyTier, AcademyModule } from './academy/types';
export { ACADEMY_CHANNELS } from './academy/types';
export { MODULES_BASE } from './academy/modulesBase';
export { MODULES_SEA } from './academy/modulesSEA';

import { MODULES_BASE } from './academy/modulesBase';
import { MODULES_SEA } from './academy/modulesSEA';
import type { AcademyModule } from './academy/types';

export const DEFAULT_MODULES: AcademyModule[] = [
  ...MODULES_BASE,
  ...MODULES_SEA,
];

// ── localStorage persistence (admin overrides) ─────────────────────────────

const STORAGE_KEY = 'academy_modules';

export function loadAcademyModules(): AcademyModule[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: AcademyModule[] = JSON.parse(stored);
      const adminIds = new Set(parsed.map(m => m.id));
      const defaults = DEFAULT_MODULES.filter(m => !adminIds.has(m.id));
      return [...defaults, ...parsed];
    }
  } catch { /* empty */ }
  return DEFAULT_MODULES;
}

export function saveAcademyModules(modules: AcademyModule[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
}

export function getAcademyAdminModules(): AcademyModule[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* empty */ }
  return [];
}
