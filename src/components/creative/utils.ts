/**
 * Shared types and helpers for AI Creative Studio sections.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type Format = '1:1' | '9:16' | '4:3';

export interface GeneratedImage {
  url: string;
  prompt: string;
  format: Format;
}

export interface VideoScript {
  hook: string;
  body: string;
  cta: string;
  format: string;
  broll?: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const FORMAT_LABELS: Record<Format, string> = {
  '1:1':  '📷 Carré 1:1 (Post)',
  '9:16': '📱 Vertical 9:16 (Story/Reel)',
  '4:3':  '🖥️ Paysage 4:3 (Google)',
};

export const FORMAT_SIZES: Record<Format, string> = {
  '1:1':  '1024x1024',
  '9:16': '1024x1536',
  '4:3':  '1536x1024',
};

export function markCreativeGenerated(userId: string) {
  try { localStorage.setItem(`ai_creative_generated_${userId}`, '1'); } catch { /* noop — incognito strict mode */ }
}
