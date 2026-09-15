/**
 * Tavus AI Video Generation routes
 *
 *   POST /api/videos/generate         — start a Tavus video generation (10 credits)
 *   POST /api/webhooks/tavus          — Tavus callback (no auth)
 *   GET  /api/videos/status/:videoId  — poll video generation status
 *   GET  /api/videos/history          — user's video generation history
 */

import { Hono } from 'hono';
import type { Env } from '../lib/types';
import { getBlink, getUserMeta } from '../lib/stripeHelpers';
import { consumeCredits, refundCredits } from '../lib/creditService';
import { AI_CREDIT_COSTS } from '../../shared/pricingCatalog';

export const router = new Hono();

// ── Types ──────────────────────────────────────────────────────────────────────

interface VideoGeneration {
  id: string;
  userId: string;
  tavusVideoId: string;
  replicaId: string;
  script: string;
  videoUrl: string;
  thumbnailUrl: string;
  status: string;
  creditsCharged: number;
  creditsRefunded: number;
  errorMessage: string;
  callbackReceivedAt: string;
  createdAt: string;
  updatedAt: string;
  callbackToken: string;
}

interface CreditTransaction {
  id: string;
  userId: string;
  type: string;
  actionType: string;
  creditsDelta: number;
  balanceAfter: number;
  description: string;
  referenceId: string;
  metadata: string;
  createdAt: string;
}

const VIDEO_GENERATION_COST = AI_CREDIT_COSTS.tavus_video_generation;
const MAX_SCRIPT_LENGTH = 300; // ~30 seconds of speech

// ── POST /api/videos/generate ──────────────────────────────────────────────────

router.post('/api/videos/generate', async (c) => {
  const env    = c.env as unknown as Env;
  const rawEnv = c.env as any;
  const blink  = getBlink(env);
  const tavusKey = rawEnv.TAVUS_API_KEY as string | undefined;

  // 1. Auth
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  // 2. Tavus configured?
  if (!tavusKey) {
    return c.json({ error: 'Tavus API not configured', code: 'NO_TAVUS_KEY' }, 503);
  }

  // 3. Parse body
  const body = await c.req.json<{ script: string; replicaId?: string }>();
  const { script } = body;
  if (!script || script.trim().length === 0) {
    return c.json({ error: 'script is required' }, 400);
  }

  // 3b. Strict script length validation — must happen BEFORE credit deduction
  if (script.length > MAX_SCRIPT_LENGTH) {
    return c.json({
      error: `Script too long. Maximum length is ${MAX_SCRIPT_LENGTH} characters.`,
      code: 'SCRIPT_TOO_LONG',
      maxLength: MAX_SCRIPT_LENGTH,
      actualLength: script.length,
    }, 400);
  }

  const replicaId = body.replicaId || rawEnv.TAVUS_DEFAULT_REPLICA_ID as string || '';
  const callbackToken = crypto.randomUUID();
  // Use the durable video record id as the credit reference so webhook refunds
  // remain linked to the exact charge even when callbacks arrive later.
  const videoId = `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // 4. Deduct credits
  const creditReferenceId = videoId;
  const creditResult = await consumeCredits(
    blink,
    auth.userId,
    'tavus_video_generation',
    'Tavus video generation',
    creditReferenceId,
    'ai',
    { provider: 'tavus', replicaId },
  );
  if (!creditResult.success) {
    return c.json({ error: creditResult.error }, 402);
  }

  // 5. Call Tavus API
  const backendUrl = rawEnv.BACKEND_URL || 'https://gbrhsehk.backend.blink.new';
  const callbackUrl = `${backendUrl}/api/webhooks/tavus?token=${encodeURIComponent(callbackToken)}`;

  try {
    const tavusRes = await fetch('https://tavusapi.com/v2/videos', {
      method: 'POST',
      headers: {
        'x-api-key': tavusKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        replica_id: replicaId,
        script,
        callback_url: callbackUrl,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!tavusRes.ok) {
      const errText = await tavusRes.text();
      console.error('[videos/generate] Tavus API error:', errText);

      // Refund credits on Tavus API failure
      try {
        await refundCredits(
          blink,
          auth.userId,
          VIDEO_GENERATION_COST,
          `Auto-refund: Tavus API error (${tavusRes.status})`,
          creditReferenceId,
        );
      } catch (refundError) {
        console.error('[videos/generate] Refund failed; reconciliation required:', refundError);
      }

      return c.json({ error: 'Video generation failed', detail: errText }, 502);
    }

    const tavusData = await tavusRes.json() as {
      video_id: string;
      status: string;
      stream_url?: string;
      hosted_url?: string;
    };

    // 6. Save record in video_generations table
    const videoTable = blink.db.table<VideoGeneration>('video_generations');

    await videoTable.create({
      id: videoId,
      userId: auth.userId,
      tavusVideoId: tavusData.video_id || '',
      replicaId,
      script,
      videoUrl: '',
      thumbnailUrl: '',
      status: 'processing',
      creditsCharged: VIDEO_GENERATION_COST,
      creditsRefunded: 0,
      errorMessage: '',
      callbackReceivedAt: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      callbackToken,
    });

    return c.json({
      success: true,
      videoId,
      tavusVideoId: tavusData.video_id,
      status: 'processing',
      creditsCharged: VIDEO_GENERATION_COST,
      balanceAfter: creditResult.balanceAfter,
    });
  } catch (err: any) {
    console.error('[videos/generate] Error:', err.message);

    // Refund on unexpected error
    try {
      await refundCredits(
        blink,
        auth.userId,
        VIDEO_GENERATION_COST,
        `Auto-refund: unexpected error — ${err.message}`,
        creditReferenceId,
      );
    } catch (refundError) {
      console.error('[videos/generate] Refund failed; reconciliation required:', refundError);
    }

    return c.json({ error: 'Video generation failed', detail: err.message }, 500);
  }
});

// ── POST /api/webhooks/tavus — Public webhook (no auth) ───────────────────────

router.post('/api/webhooks/tavus', async (c) => {
  const env    = c.env as unknown as Env;
  const blink  = getBlink(env);

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const { video_id, status, stream_url, hosted_url, still_image_url } = body;
  const callbackToken = c.req.query('token') || '';
  if (!video_id || !callbackToken) {
    return c.json({ error: 'Missing video_id or callback token' }, 400);
  }

  try {
    const videoTable = blink.db.table<VideoGeneration>('video_generations');
    // Find the video record by tavus_video_id
    const videos = await videoTable.list({
      where: { tavusVideoId: video_id },
      limit: 1,
    });

    if (videos.length === 0) {
      console.warn(`[webhooks/tavus] No video found for tavus_video_id=${video_id}`);
      return c.json({ received: true, matched: false });
    }

    const video = videos[0];
    if (video.callbackToken !== callbackToken) {
      console.warn(`[webhooks/tavus] Invalid callback token for tavus_video_id=${video_id}`);
      return c.json({ error: 'Invalid callback token' }, 403);
    }

    if (status === 'ready' || status === 'completed') {
      await videoTable.update(video.id, {
        videoUrl: stream_url || hosted_url || video.videoUrl,
        thumbnailUrl: still_image_url || video.thumbnailUrl,
        status: 'completed',
        callbackReceivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else if (status === 'failed' || status === 'error') {
      const errorMsg = body.error || body.message || 'Video generation failed';
      let refunded = video.creditsRefunded > 0;

      // Refund credits using the same stable reference used at charge time.
      if (video.creditsCharged > 0 && !refunded) {
        try {
          await refundCredits(
            blink,
            video.userId,
            video.creditsCharged,
            `Auto-refund: Tavus video failed — ${errorMsg}`,
            video.id,
          );
          refunded = true;
          await videoTable.update(video.id, {
            creditsRefunded: video.creditsCharged,
            updatedAt: new Date().toISOString(),
          });
        } catch (refundError) {
          console.error('[webhooks/tavus] Refund failed; reconciliation required:', refundError);
        }
      }

      await videoTable.update(video.id, {
        status: 'failed',
        errorMessage: refunded ? errorMsg : `${errorMsg} (remboursement en attente de réconciliation)`,
        callbackReceivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Intermediate status update (e.g., 'generating', 'processing')
      await videoTable.update(video.id, {
        status: status || video.status,
        updatedAt: new Date().toISOString(),
      });
    }

    return c.json({ received: true, videoId: video.id, status });
  } catch (err: any) {
    console.error('[webhooks/tavus] Error:', err.message);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

// ── GET /api/videos/status/:videoId ────────────────────────────────────────────

router.get('/api/videos/status/:videoId', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const videoId = c.req.param('videoId');
  if (!videoId) return c.json({ error: 'videoId required' }, 400);

  try {
    const videoTable = blink.db.table<VideoGeneration>('video_generations');
    const video = await videoTable.get(videoId);

    if (!video) return c.json({ error: 'Video not found' }, 404);
    if (video.userId !== auth.userId) return c.json({ error: 'Forbidden' }, 403);

    return c.json({
      id: video.id,
      tavusVideoId: video.tavusVideoId,
      script: video.script,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      status: video.status,
      creditsCharged: video.creditsCharged,
      creditsRefunded: video.creditsRefunded,
      errorMessage: video.errorMessage,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    });
  } catch (err: any) {
    console.error('[videos/status] Error:', err.message);
    return c.json({ error: 'Failed to fetch video status' }, 500);
  }
});

// ── GET /api/videos/history ────────────────────────────────────────────────────

router.get('/api/videos/history', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const limit  = Math.min(Number(c.req.query('limit')) || 20, 100);
  const offset = Number(c.req.query('offset')) || 0;

  try {
    const videoTable = blink.db.table<VideoGeneration>('video_generations');
    const videos = await videoTable.list({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      limit,
      offset,
    });

    return c.json({
      videos: videos.map((v) => ({
        id: v.id,
        tavusVideoId: v.tavusVideoId,
        script: v.script.substring(0, 200),
        videoUrl: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl,
        status: v.status,
        creditsCharged: v.creditsCharged,
        creditsRefunded: v.creditsRefunded,
        errorMessage: v.errorMessage,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
      limit,
      offset,
      count: videos.length,
    });
  } catch (err: any) {
    console.error('[videos/history] Error:', err.message);
    return c.json({ error: 'Failed to fetch video history' }, 500);
  }
});
