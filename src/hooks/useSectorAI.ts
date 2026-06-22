/**
 * useSectorAI — Hook to get the sector-aware AI system prompt
 * and tone configuration for the current user's establishment.
 *
 * Usage:
 *   const { systemPrompt, tone } = useSectorAI(sector);
 *   // Pass `systemPrompt` as the `system` param in blink.ai.text calls.
 */

import { useMemo } from 'react';
import { SECTOR_AI_SYSTEM_PROMPT, SECTOR_AI_TONE } from '@/components/landing/geoScanner/sectorData';
import type { Sector } from '@/components/landing/geoScanner/sectorData';

/**
 * Returns AI configuration adapted to the given sector.
 * @param sector - The sector key ('beauty' | 'medical' | 'restaurant' | 'hotel' | 'auto' | '')
 */
export function useSectorAI(sector: Sector | string) {
  return useMemo(() => {
    const safeSector = (sector || '') as Sector;
    return {
      /** Full system prompt to inject into blink.ai text/object calls */
      systemPrompt: SECTOR_AI_SYSTEM_PROMPT[safeSector] ?? SECTOR_AI_SYSTEM_PROMPT[''],
      /** Short tone label + example for UI preview */
      tone: SECTOR_AI_TONE[safeSector] ?? SECTOR_AI_TONE[''],
      /** The current sector key */
      sector: safeSector,
    };
  }, [sector]);
}

/**
 * Get the sector AI system prompt directly (non-hook version, for server-side or callbacks).
 * @param sector - The sector key
 */
export function getSectorSystemPrompt(sector: string): string {
  return SECTOR_AI_SYSTEM_PROMPT[(sector || '') as Sector] ?? SECTOR_AI_SYSTEM_PROMPT[''];
}
