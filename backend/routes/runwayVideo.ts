import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink } from '../lib/stripeHelpers';
import { consumeCredits, refundCredits } from '../lib/creditService';
import { AI_CREDIT_COSTS } from '../../shared/pricingCatalog';

export const router = new Hono();

const RUNWAY_COST = AI_CREDIT_COSTS.runway_video_generation;
const RUNWAY_MODEL = 'gen4.5';
const RUNWAY_VERSION = '2024-11-06';
const MAX_PROMPT_LENGTH = 1000;

type RunwayGeneration = {
  id: string;
  userId: string;
  taskId: string;
  prompt: string;
  model: string;
  ratio: string;
  duration: number;
  videoUrl: string;
  status: string;
  errorMessage: string;
  creditsCharged: number;
  creditsRefunded: number;
  createdAt: string;
  updatedAt: string;
};

type RunwayTask = {
  id?: string;
  status?: string;
  output?: string[] | { video?: string; url?: string };
  failure?: string;
  failureCode?: string;
};

function normalizeStatus(status = '') {
  const normalized = status.toUpperCase();
  if (normalized === 'SUCCEEDED' || normalized === 'COMPLETED') return 'completed';
  if (normalized === 'FAILED' || normalized === 'CANCELED' || normalized === 'CANCELLED') return 'failed';
  return normalized.toLowerCase() || 'processing';
}

function extractVideoUrl(output: RunwayTask['output']) {
  if (Array.isArray(output)) return output.find((value) => typeof value === 'string') || '';
  return output?.video || output?.url || '';
}

async function runwayFetch(path: string, init: RequestInit, apiKey: string) {
  return fetch(`https://api.dev.runwayml.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'X-Runway-Version': RUNWAY_VERSION,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(15000),
  });
}

async function safelyRefund(blink: ReturnType<typeof getBlink>, userId: string, referenceId: string, reason: string) {
  try {
    await refundCredits(blink, userId, RUNWAY_COST, reason, referenceId);
    return true;
  } catch (error) {
    console.error('[runway] Refund failed; reconciliation required:', error);
    return false;
  }
}

router.post('/api/runway/generate', async (c) => {
  const rawEnv = c.env as unknown as Env & { RUNWAY_API_KEY?: string; RUNWAYML_API_SECRET?: string };
  const blink = getBlink(rawEnv);
  const apiKey = rawEnv.RUNWAYML_API_SECRET ?? rawEnv.RUNWAY_API_KEY;
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
  if (!apiKey) return c.json({ error: 'Runway API is not configured', code: 'NO_RUNWAY_KEY' }, 503);

  const body = await c.req.json<{ prompt?: string; ratio?: string; duration?: number }>();
  const prompt = body.prompt?.trim() || '';
  const ratio = body.ratio === '720:1280' ? '720:1280' : '1280:720';
  const duration = body.duration === 10 ? 10 : 5;
  if (!prompt) return c.json({ error: 'A creative brief is required' }, 400);
  if (prompt.length > MAX_PROMPT_LENGTH) return c.json({ error: `The brief cannot exceed ${MAX_PROMPT_LENGTH} characters` }, 400);

  const generationId = `runway_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const creditResult = await consumeCredits(
    blink,
    auth.userId,
    'runway_video_generation',
    'Runway generative video',
    generationId,
    'ai',
    { provider: 'runway', model: RUNWAY_MODEL, ratio, duration },
  );
  if (!creditResult.success) return c.json({ error: creditResult.error || 'Insufficient credits' }, 402);

  try {
    await blink.db.table<RunwayGeneration>('runway_generations').create({
      id: generationId,
      userId: auth.userId,
      taskId: '',
      prompt,
      model: RUNWAY_MODEL,
      ratio,
      duration,
      videoUrl: '',
      status: 'starting',
      errorMessage: '',
      creditsCharged: RUNWAY_COST,
      creditsRefunded: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const runwayResponse = await runwayFetch('/v1/text_to_video', {
      method: 'POST',
      body: JSON.stringify({ model: RUNWAY_MODEL, promptText: prompt, ratio, duration }),
    }, apiKey);
    if (!runwayResponse.ok) {
      const detail = await runwayResponse.text();
      await safelyRefund(blink, auth.userId, generationId, `Runway API error (${runwayResponse.status})`);
      await blink.db.table<RunwayGeneration>('runway_generations').update(generationId, {
        status: 'failed',
        errorMessage: detail,
        creditsRefunded: RUNWAY_COST,
        updatedAt: new Date().toISOString(),
      });
      return c.json({ error: 'Runway generation failed', detail }, 502);
    }

    const task = await runwayResponse.json() as RunwayTask;
    if (!task.id) {
      await safelyRefund(blink, auth.userId, generationId, 'Runway returned no task id');
      await blink.db.table<RunwayGeneration>('runway_generations').update(generationId, {
        status: 'failed',
        errorMessage: 'Runway returned no task id',
        creditsRefunded: RUNWAY_COST,
        updatedAt: new Date().toISOString(),
      });
      return c.json({ error: 'Runway returned an invalid task' }, 502);
    }

    await blink.db.table<RunwayGeneration>('runway_generations').update(generationId, {
      taskId: task.id,
      status: 'processing',
      updatedAt: new Date().toISOString(),
    });

    return c.json({
      success: true,
      generationId,
      taskId: task.id,
      status: 'processing',
      creditsCharged: RUNWAY_COST,
      balanceAfter: creditResult.balanceAfter,
    });
  } catch (error) {
    console.error('[runway/generate] Provider or persistence error:', error);
    try {
      const existing = await blink.db.table<RunwayGeneration>('runway_generations').get(generationId);
      if (existing && !existing.taskId) {
        await safelyRefund(blink, auth.userId, generationId, 'Auto-refund: Runway request did not create a task');
        await blink.db.table<RunwayGeneration>('runway_generations').update(generationId, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Runway generation failed',
          creditsRefunded: RUNWAY_COST,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await blink.db.table<RunwayGeneration>('runway_generations').update(generationId, {
          status: 'processing',
          errorMessage: 'Provider accepted the task; status will be reconciled on the next poll.',
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (reconciliationError) {
      console.error('[runway/generate] Reconciliation failed:', reconciliationError);
    }
    return c.json({ error: error instanceof Error ? error.message : 'Runway generation failed' }, 500);
  }
});

router.get('/api/runway/status/:generationId', async (c) => {
  const rawEnv = c.env as unknown as Env & { RUNWAY_API_KEY?: string; RUNWAYML_API_SECRET?: string };
  const blink = getBlink(rawEnv);
  const apiKey = rawEnv.RUNWAYML_API_SECRET ?? rawEnv.RUNWAY_API_KEY;
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
  if (!apiKey) return c.json({ error: 'Runway API is not configured' }, 503);

  const generation = await blink.db.table<RunwayGeneration>('runway_generations').get(c.req.param('generationId'));
  if (!generation) return c.json({ error: 'Generation not found' }, 404);
  if (generation.userId !== auth.userId) return c.json({ error: 'Forbidden' }, 403);
  if (generation.status === 'completed' || generation.status === 'failed') return c.json(generation);
  if (!generation.taskId) return c.json({ error: 'Runway task is not available yet', status: generation.status }, 409);

  try {
    const runwayResponse = await runwayFetch(`/v1/tasks/${generation.taskId}`, { method: 'GET' }, apiKey);
    if (!runwayResponse.ok) return c.json({ error: 'Unable to read Runway task status' }, 502);
    const task = await runwayResponse.json() as RunwayTask;
    const status = normalizeStatus(task.status);
    const videoUrl = extractVideoUrl(task.output);
    const errorMessage = task.failure || task.failureCode || '';
    const patch: Partial<RunwayGeneration> = {
      status,
      videoUrl,
      errorMessage,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'failed' && generation.creditsRefunded === 0) {
      const refunded = await safelyRefund(blink, generation.userId, generation.id, `Auto-refund: Runway task failed — ${errorMessage || 'unknown error'}`);
      if (refunded) patch.creditsRefunded = generation.creditsCharged;
      else patch.errorMessage = `${errorMessage || 'Runway task failed'} (refund pending reconciliation)`;
    }
    const updated = await blink.db.table<RunwayGeneration>('runway_generations').update(generation.id, patch);
    return c.json(updated);
  } catch (error) {
    console.error('[runway/status] Error:', error);
    return c.json({ error: error instanceof Error ? error.message : 'Failed to fetch Runway status' }, 502);
  }
});

router.get('/api/runway/history', async (c) => {
  const env = c.env as unknown as Env;
  const blink = getBlink(env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
  const generations = await blink.db.table<RunwayGeneration>('runway_generations').list({
    where: { userId: auth.userId },
    orderBy: { createdAt: 'desc' },
    limit: 30,
  });
  return c.json({ generations });
});
