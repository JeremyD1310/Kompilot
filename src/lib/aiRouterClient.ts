/**
 * aiRouterClient.ts — Frontend helper for the Kompilot AI Model Router
 *
 * Wraps calls to the backend /api/ai/generate endpoint.
 * The backend handles provider selection, fallback, and token logging.
 *
 * Usage:
 *   import { aiGenerate } from '@/lib/aiRouterClient';
 *
 *   const result = await aiGenerate({
 *     taskType: 'MARKETING_COPY',
 *     prompt: 'Rédige une publication Instagram pour notre nouvelle offre d'été.',
 *     contextData: { establishmentName: 'Salon Beauté Plus', city: 'Lyon' },
 *   });
 *   console.log(result.content);
 */

import { blink } from '../blink/client';
import { isAgentEnabled } from './billingStorage';
import { reportApiOutage } from './externalApiInterceptor';

/** Backend URL — Cloudflare Workers deployment */
const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

// ── Types (mirrors backend RouterRequest / RouterResponse) ────────────────────

export type TaskType =
  | 'SEO_AUDIT'
  | 'STRATEGIC_PLANNING'
  | 'CREATIVE_CONTENT'
  | 'MARKETING_COPY'
  | 'QUICK_REPLY'
  | 'CHAT_AUTOMATION';

export interface AIGenerateRequest {
  taskType: TaskType;
  /** Main instruction / user message */
  prompt: string;
  /** Optional: override the default system context */
  systemContext?: string;
  /** Optional: additional structured context merged into system prompt */
  contextData?: Record<string, unknown>;
  /** Optional: force JSON-mode output */
  forceJson?: boolean;
  /** Optional: max output tokens (default 2048) */
  maxTokens?: number;
}

export interface AIGenerateMeta {
  provider: 'openai' | 'anthropic';
  model: string;
  usedFallback: boolean;
  taskType: TaskType;
  tokens: { input: number; output: number; total: number };
  latencyMs: number;
}

export interface AIGenerateResponse {
  content: string;
  meta: AIGenerateMeta;
}

// ── Human-readable labels for each task type ──────────────────────────────────

export const TASK_TYPE_LABELS: Record<TaskType, { label: string; provider: string; use: string }> = {
  SEO_AUDIT:          { label: 'Audit SEO / G.E.O.',         provider: 'Anthropic Claude',   use: 'Rapports structurés, données JSON, plans éditoriaux' },
  STRATEGIC_PLANNING: { label: 'Planification stratégique',   provider: 'Anthropic Claude',   use: 'Calendriers éditoriaux, analyses de visibilité'     },
  CREATIVE_CONTENT:   { label: 'Contenu créatif',             provider: 'OpenAI GPT',         use: 'Publications réseaux sociaux, storytelling'          },
  MARKETING_COPY:     { label: 'Copywriting marketing',       provider: 'OpenAI GPT',         use: 'Accroches, CTAs, descriptions produits'              },
  QUICK_REPLY:        { label: 'Réponse rapide',              provider: 'OpenAI GPT mini',    use: 'Réponses aux avis, commentaires Instagram/Facebook'  },
  CHAT_AUTOMATION:    { label: 'Automatisation messagerie',   provider: 'OpenAI GPT mini',    use: 'DM automatiques, triggers Manychat-style'            },
};

// ── Client function ───────────────────────────────────────────────────────────

/**
 * Call the Kompilot AI Router backend.
 * Automatically attaches the user's Blink auth token.
 * Throws on network error or non-2xx response.
 */
export async function aiGenerate(req: AIGenerateRequest): Promise<AIGenerateResponse> {
  // ── Agent kill switch: block AI calls when subscription is cancelled/unpaid past grace ──
  if (!isAgentEnabled()) {
    throw new Error(
      'Les services IA sont suspendus — votre abonnement est inactif. Réactivez votre plan depuis la page Facturation.',
    );
  }

  // Get the current user's auth token to attach to the request
  const token = await blink.auth.getValidToken().catch(() => null);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/api/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
  } catch (netErr) {
    clearTimeout(timeout);
    // Network-level error → report OpenAI outage (backend couldn't reach provider)
    reportApiOutage('OpenAI', 'NETWORK_ERROR');
    throw netErr;
  } finally {
    clearTimeout(timeout);
  }

  const data = await res.json() as {
    success: boolean;
    content: string;
    meta: AIGenerateMeta;
    error?: string;
    detail?: string;
  };

  if (!res.ok || !data.success) {
    // 502/503/504 from backend = upstream AI provider is down
    if (res.status >= 500) {
      const providerHint = req.taskType === 'SEO_AUDIT' || req.taskType === 'STRATEGIC_PLANNING'
        ? 'OpenAI' as const
        : 'OpenAI' as const;
      reportApiOutage(providerHint, `HTTP_${res.status}`);
    }
    throw new Error(data.detail ?? data.error ?? `AI generation failed (HTTP ${res.status})`);
  }

  return {
    content: data.content,
    meta:    data.meta,
  };
}

// ── Convenience wrappers ──────────────────────────────────────────────────────

/** Generate a social media post or marketing copy (OpenAI GPT, creative) */
export const generateMarketingCopy = (
  prompt: string,
  contextData?: Record<string, unknown>,
) =>
  aiGenerate({ taskType: 'MARKETING_COPY', prompt, contextData });

/** Generate creative social content (OpenAI GPT, creative) */
export const generateCreativeContent = (
  prompt: string,
  contextData?: Record<string, unknown>,
) =>
  aiGenerate({ taskType: 'CREATIVE_CONTENT', prompt, contextData });

/** Run a GEO/SEO audit and return structured JSON (Anthropic Claude) */
export const runSeoAudit = (
  prompt: string,
  contextData?: Record<string, unknown>,
) =>
  aiGenerate({ taskType: 'SEO_AUDIT', prompt, contextData, forceJson: true });

/** Generate a strategic editorial plan in JSON (Anthropic Claude) */
export const generateStrategicPlan = (
  prompt: string,
  contextData?: Record<string, unknown>,
) =>
  aiGenerate({ taskType: 'STRATEGIC_PLANNING', prompt, contextData, forceJson: true });

/** Generate an instant reply for a review or comment (OpenAI GPT mini, fast) */
export const generateQuickReply = (
  prompt: string,
  contextData?: Record<string, unknown>,
) =>
  aiGenerate({ taskType: 'QUICK_REPLY', prompt, contextData });

/** Generate an automated DM for a trigger response (OpenAI GPT mini, fast) */
export const generateChatAutomation = (
  prompt: string,
  contextData?: Record<string, unknown>,
) =>
  aiGenerate({ taskType: 'CHAT_AUTOMATION', prompt, contextData });
