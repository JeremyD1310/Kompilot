/**
 * AI routes — /health, /api/ai/models, /api/ai/generate
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import {
  generateAIResponse,
  type TaskType,
  type RouterRequest,
} from '../lib/aiRouter';
import { isMedicalSector, sanitizeMedicalPrompt, anonymizeMedicalPayload } from '../lib/medicalAnonymizer';
import { getSectorSystemPrompt, ALL_VALID_SECTORS } from '../lib/sectorPrompts';
import type { Env } from '../lib/types';

export const router = new Hono();

const VALID_TASK_TYPES: TaskType[] = [
  'SEO_AUDIT',
  'STRATEGIC_PLANNING',
  'CREATIVE_CONTENT',
  'MARKETING_COPY',
  'QUICK_REPLY',
  'CHAT_AUTOMATION',
];

const getBlink = (env: Env) =>
  createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });

// ── Health ────────────────────────────────────────────────────────────────────

router.get('/health', (c) =>
  c.json({ ok: true, service: 'kompilot-backend', ts: new Date().toISOString() })
);

// ── AI router info ────────────────────────────────────────────────────────────

router.get('/api/ai/models', (c) =>
  c.json({
    taskTypes: {
      SEO_AUDIT:          { provider: 'anthropic', model: 'claude-sonnet-4-5', temperature: 0.2, json: true  },
      STRATEGIC_PLANNING: { provider: 'anthropic', model: 'claude-sonnet-4-5', temperature: 0.2, json: true  },
      CREATIVE_CONTENT:   { provider: 'openai',    model: 'gpt-4.1',           temperature: 0.7, json: false },
      MARKETING_COPY:     { provider: 'openai',    model: 'gpt-4.1',           temperature: 0.7, json: false },
      QUICK_REPLY:        { provider: 'openai',    model: 'gpt-4.1-mini',      temperature: 0.4, json: false },
      CHAT_AUTOMATION:    { provider: 'openai',    model: 'gpt-4.1-mini',      temperature: 0.4, json: false },
    },
    fallbackPolicy: 'auto — switches to secondary provider on rate-limit or timeout',
    timeoutMs: 28000,
  })
);

// ── Core AI generation endpoint ───────────────────────────────────────────────

router.post('/api/ai/generate', async (c) => {
  const env = c.env as unknown as Env;

  // 1. Verify Blink auth token
  const blink = getBlink(env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized', detail: auth.error }, 401);

  // 2. Validate secrets are configured
  if (!env.OPENAI_API_KEY || !env.ANTHROPIC_API_KEY) {
    return c.json({
      error: 'Server configuration error',
      detail: 'AI API keys not configured. Add OPENAI_API_KEY and ANTHROPIC_API_KEY in project secrets.',
    }, 503);
  }

  // 3. Parse + validate request body
  let body: Partial<RouterRequest>;
  try {
    body = await c.req.json<Partial<RouterRequest>>();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.taskType || !VALID_TASK_TYPES.includes(body.taskType)) {
    return c.json({ error: 'Invalid taskType', validTaskTypes: VALID_TASK_TYPES }, 400);
  }

  // Optional sector validation (accepts all legacy + new sector keys)
  if (body.sector !== undefined && !ALL_VALID_SECTORS.includes(body.sector as string)) {
    return c.json({ error: 'Invalid sector', validSectors: ALL_VALID_SECTORS.filter(Boolean) }, 400);
  }

  if (!body.prompt || typeof body.prompt !== 'string' || !body.prompt.trim()) {
    return c.json({ error: 'prompt is required and must be a non-empty string' }, 400);
  }

  // 4. Medical sector: anonymize prompt + contextData before routing
  const sector = typeof body.sector === 'string' ? body.sector : undefined;
  let finalPrompt = body.prompt.trim();
  let finalContextData = body.contextData;
  let medicalWarning: string | null = null;

  if (isMedicalSector(sector)) {
    // Sanitize free-text prompt
    const { prompt: cleanedPrompt, hadPII, warning } = sanitizeMedicalPrompt(finalPrompt, auth.userId ?? undefined);
    finalPrompt = cleanedPrompt;
    medicalWarning = warning;

    // Anonymize contextData object if present
    if (finalContextData && typeof finalContextData === 'object') {
      const { payload: cleanContext } = anonymizeMedicalPayload(
        finalContextData as Record<string, unknown>,
        auth.userId ?? undefined,
      );
      finalContextData = cleanContext;
    }
  }

  // 5. Inject sector-contextual system prompt
  const sectorPromptSuffix = getSectorSystemPrompt(sector);
  const enrichedSystemContext = [
    body.systemContext,
    sectorPromptSuffix,
  ].filter(Boolean).join('\n\n') || undefined;

  // 6. Route to the appropriate AI provider
  try {
    const result = await generateAIResponse(
      {
        taskType:      body.taskType,
        prompt:        finalPrompt,
        systemContext: enrichedSystemContext,
        contextData:   finalContextData,
        forceJson:     body.forceJson,
        maxTokens:     body.maxTokens,
        sector,
      },
      {
        OPENAI_API_KEY:    env.OPENAI_API_KEY,
        ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
      },
      auth.userId,
    );

    return c.json({
      success: true,
      content: result.content,
      ...(medicalWarning ? { medicalComplianceWarning: medicalWarning } : {}),
      meta: {
        provider:     result.provider,
        model:        result.model,
        usedFallback: result.usedFallback,
        taskType:     result.taskType,
        tokens: {
          input:  result.inputTokens,
          output: result.outputTokens,
          total:  result.inputTokens + result.outputTokens,
        },
        latencyMs: result.latencyMs,
        ...(isMedicalSector(sector) ? { medicalCompliance: true } : {}),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/ai/generate] Router error:', message);
    return c.json({ error: 'AI generation failed', detail: message }, 502);
  }
});
