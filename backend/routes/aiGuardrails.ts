/** AI content guardrails — semantic validation before GMB/social publication */
import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink } from '../lib/stripeHelpers';

export const router = new Hono();

// Sensitive patterns: injurious, defamatory, prompt-injection, medical claims
const BLOCKED_PATTERNS = [
  /\bignore\s+(previous|above|all|these|your)\b/i,
  /\b(instructions?|system\s+prompt|override|jailbreak)\b/i,
  /\bavarié\b/i,
  /\b(putain|merde|connard|salaud|idiot|imbécile|crétin|enculé)\b/i,
  /\b(raciste?|antisémite?|islamophobe?|homophobe?)\b/i,
  /\bprompt\s*injection\b/i,
  /\b(mensonge|arnaque|escroquerie|fraude)\b/i,
  /\b(guarante?e|certif[yi]|promis?e?)\s+(guérison|résultat|remboursement)/i,
];

const REQUIRES_MODERATION_PATTERNS = [
  /\b(insatisfait|mécontent|déçu|horrible|catastrophique|nul)\b/i,
  /\b(remboursement|litige|plainte|procès|tribunal|avocat)\b/i,
  /\b(intoxication|allergie|blessure|accident|danger)\b/i,
];

function checkContent(text: string): { blocked: boolean; requiresModeration: boolean; reason: string | null } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        blocked: true,
        requiresModeration: true,
        reason: `Contenu bloqué : motif sensible détecté (${pattern.source.slice(0, 30)}...)`,
      };
    }
  }
  for (const pattern of REQUIRES_MODERATION_PATTERNS) {
    if (pattern.test(text)) {
      return { blocked: false, requiresModeration: true, reason: `Modération requise : contenu sensible détecté` };
    }
  }
  return { blocked: false, requiresModeration: false, reason: null };
}

// POST /api/ai/validate — validate AI-generated content before publish
router.post('/api/ai/validate', async (c) => {
  const blink = getBlink(c.env as Env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  let body: { text?: string; context?: string };
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  if (!body.text) return c.json({ error: 'Missing text field' }, 400);

  const fullText = [body.text, body.context].filter(Boolean).join(' ');
  const result = checkContent(fullText);

  return c.json({
    valid: !result.blocked && !result.requiresModeration,
    blocked: result.blocked,
    requiresModeration: result.requiresModeration,
    reason: result.reason,
    canPublishDirectly: !result.blocked && !result.requiresModeration,
  });
});
