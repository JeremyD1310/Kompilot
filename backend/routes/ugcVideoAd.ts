/**
 * UGC Video Ad Generator — Analyze product → Generate multi-angle scripts → Generate video
 *
 * POST /api/ugc-video-ad/analyze    — Analyze product image + text → generate multi-angle scripts
 * POST /api/ugc-video-ad/generate   — Generate video for a selected script variant (async via queue)
 * GET  /api/ugc-video-ad/status/:projectId — Get project + generation status
 * GET  /api/ugc-video-ad/projects   — List user's UGC projects
 */

import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';
import { generateAIResponse } from '../lib/aiRouter';
import { consumeExecuteRefund, refundCredits } from '../lib/creditService';

export const router = new Hono<{ Bindings: Env }>();

const getBlink = (env: Env) =>
  createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });

function getUserId(h: string | undefined): string | null {
  if (!h?.startsWith('Bearer ')) return null;
  try { const p = h.split('.')[1]; const d = JSON.parse(atob(p)); return d.sub ?? d.user_id ?? null; }
  catch { return null; }
}

// ── Types ───────────────────────────────────────────────────────────────────────

interface UGCVideoScript {
  angle: string;
  hook: { text: string; type: 'question' | 'provocation' | 'statistic' | 'story' };
  body: { points: Array<{ text: string; duration: string }>; transition: string };
  cta: { text: string; type: 'booking' | 'website' | 'phone' | 'promo' };
  fullScript: string;
  estimatedDuration: string;
  visualDescription: string;
}

interface VideoVariant {
  index: number;
  status: string;
  generationId: string;
  videoUrl: string;
  aspectRatio: string;
  visualPrompt: string;
  errorMessage: string;
}

interface UGCVideoProject {
  id: string;
  userId: string;
  productImageUrl: string;
  productDescription: string;
  productName: string;
  status: string;
  scripts: string;
  videoVariants: string;
  creditsCost: number;
  createdAt: string;
  updatedAt: string;
}

// ── POST /api/ugc-video-ad/analyze ────────────────────────────────────────────

router.post('/api/ugc-video-ad/analyze', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
    return c.json({ error: 'AI keys not configured' }, 503);
  }

  let body: {
    productImageUrl?: string;
    productDescription?: string;
    productName?: string;
  } = {};
  try { body = await c.req.json(); } catch { /* empty */ }

  if (!body.productImageUrl || !body.productDescription) {
    return c.json({ error: 'productImageUrl and productDescription are required' }, 400);
  }

  const blink = getBlink(env);
  const projectId = crypto.randomUUID();
  const productName = body.productName || 'Produit';
  const creditReferenceId = `ugc-analyze:${userId}:${projectId}`;

  try {
    const charged = await consumeExecuteRefund(
      blink,
      userId,
      'text_generation',
      'UGC Video Ad script analysis',
      creditReferenceId,
      async () => {
        // Build system prompt for multi-angle UGC script generation
        const systemContext = `Tu es un expert en création de scripts vidéo UGC (User Generated Content) pour des marques et e-commerces.

Tu génères des scripts vidéo UGC multi-angles pour la publicité sur réseaux sociaux (TikTok, Reels, Shorts).

Ta mission: analyser le produit et générer 3-4 scripts vidéo avec des angles marketing DIFFÉRENTS.

ANGLES POSSIBLES:
- "Témoignage authentique" : L'utilisateur raconte son expérience réelle, crédible
- "Avant/Après transformation" : Montrer le problème AVANT et la solution APRÈS
- "Problème/Solution" : Identifier une frustration commune → présenter la solution
- "Déballage/Découverte" : Unboxing, premières impressions, réaction authentique
- "Storytelling émotionnel" : Histoire personnelle qui crée une connexion émotionnelle
- "Démonstration produit" : Montrer le produit en action, ses features uniques
- "Comparaison" : Avant c'était comme ça, maintenant avec ce produit c'est mieux
- "Urgence/Offre limitée" : Créer un sentiment d'urgence positif

ARCHITECTURE STRICTE DE CHAQUE SCRIPT:
1. HOOK (0-3 secondes): L'accroche qui arrête le scroll. Types: question, provocation, statistic, story
2. BODY (3-25 secondes): 3-5 points clés avec durée estimée + transition naturelle
3. CTA (25-30 secondes): Appel à l'action clair (booking, website, phone, promo)

RÈGLES DE TON:
- Naturel, conversationnel, comme une vraie personne qui filme avec son téléphone
- Pas de langage corporate ou trop marketing
- Authentique, crédible, imparfait (hésitations légères = plus de confiance)
- Émotions palpables (surprise, joie, satisfaction, soulagement)

FORMAT DE SORTIE: JSON valide UNIQUEMENT (pas de markdown, pas d'explication).`;

        const userPrompt = `Analyse ce produit et génère 3-4 scripts vidéo UGC avec des angles marketing différents.

PRODUIT: "${productName}"
DESCRIPTION: ${body.productDescription}
IMAGE: ${body.productImageUrl}

Pour chaque angle, crée un script complet avec:
- hook (accroche percutante)
- body (3-5 points avec durée)
- cta (appel à l'action)
- fullScript (script complet prêt à être lu à l'oral)
- visualDescription (description DÉTAILLÉE de ce qu'on doit voir à l'écran pour la génération vidéo/image — décris la scène, les couleurs, l'éclairage, le cadrage, l'ambiance, le mouvement de caméra... comme un prompt pour génération AI vidéo)

Retourne un tableau JSON de scripts avec cette structure EXACTE:
{
  "scripts": [
    {
      "angle": "Nom de l'angle marketing",
      "hook": { "text": "...", "type": "question|provocation|statistic|story" },
      "body": {
        "points": [
          { "text": "...", "duration": "5s" },
          { "text": "...", "duration": "5s" }
        ],
        "transition": "..."
      },
      "cta": { "text": "...", "type": "booking|website|phone|promo" },
      "fullScript": "script complet comme texte continu...",
      "estimatedDuration": "30s",
      "visualDescription": "Description détaillée pour génération vidéo..."
    }
  ]
}`;

        const aiResult = await generateAIResponse(
          { taskType: 'CREATIVE_CONTENT', prompt: userPrompt, systemContext, forceJson: true, maxTokens: 4000 },
          { OPENAI_API_KEY: env.OPENAI_API_KEY, ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY },
          userId,
        );

        let parsed: any;
        try {
          const raw = aiResult.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
          parsed = JSON.parse(raw);
        } catch {
          const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('AI response was not valid JSON');
          parsed = JSON.parse(jsonMatch[0]);
        }

        const rawScripts: any[] = Array.isArray(parsed.scripts) ? parsed.scripts : (Array.isArray(parsed) ? parsed : []);
        const scripts: UGCVideoScript[] = rawScripts.map((s: any, i: number) => ({
          angle: String(s.angle ?? `Angle ${i + 1}`),
          hook: { text: String(s.hook?.text ?? ''), type: ['question', 'provocation', 'statistic', 'story'].includes(s.hook?.type) ? s.hook.type : 'question' },
          body: {
            points: Array.isArray(s.body?.points) ? s.body.points.map((p: any) => ({ text: String(p.text ?? ''), duration: String(p.duration ?? '5s') })) : [{ text: String(s.body?.text ?? ''), duration: '5s' }],
            transition: String(s.body?.transition ?? ''),
          },
          cta: { text: String(s.cta?.text ?? ''), type: ['booking', 'website', 'phone', 'promo'].includes(s.cta?.type) ? s.cta.type : 'booking' },
          fullScript: String(s.fullScript ?? ''),
          estimatedDuration: String(s.estimatedDuration ?? '30s'),
          visualDescription: String(s.visualDescription ?? ''),
        }));

        for (const script of scripts) {
          if (!script.fullScript) {
            script.fullScript = [
              `[HOOK - ${script.hook.type}] ${script.hook.text}`,
              `[TRANSITION] ${script.body.transition}`,
              ...script.body.points.map(point => `(${point.duration}) ${point.text}`),
              `[CTA] ${script.cta.text}`,
            ].join('\n\n');
          }
          if (!script.visualDescription) script.visualDescription = `UGC style video of ${productName}, natural lighting, handheld phone camera, authentic feel. ${script.hook.text}`;
        }

        const videoVariants: VideoVariant[] = scripts.map((_, i) => ({ index: i, status: 'pending', generationId: '', videoUrl: '', aspectRatio: '9:16', visualPrompt: '', errorMessage: '' }));
        const projectTable = blink.db.table<UGCVideoProject>('ugc_video_projects');
        await projectTable.create({ id: projectId, userId, productImageUrl: body.productImageUrl, productDescription: body.productDescription, productName, status: 'scripts_ready', scripts: JSON.stringify(scripts), videoVariants: JSON.stringify(videoVariants), creditsCost: 1 });

        try {
          await blink.db.observability_logs.create({
            id: `ugcva_${Date.now()}`,
            userId,
            action: 'ugc_video_ad_analyzed',
            provider: aiResult.provider,
            errorMessage: 'ok',
            metadata: JSON.stringify({ projectId, productName, scriptCount: scripts.length, model: aiResult.model, tokens: aiResult.inputTokens + aiResult.outputTokens }),
            severity: 'info',
          });
        } catch { /* non-critical */ }

        return { projectId, scripts, videoVariants, creditsCost: 1, meta: { provider: aiResult.provider, model: aiResult.model, latencyMs: aiResult.latencyMs } };
      },
      'ai',
      { provider: 'openai-or-anthropic', phase: 'analysis' },
    );

    return c.json({ ...charged.result, creditsLeft: charged.balanceAfter });
  } catch (error: any) {
    console.error('[UgcVideoAd] analyze error:', error);
    if (error?.message === 'Insufficient credits') return c.json({ error: 'NO_CREDITS', message: 'Crédits épuisés.', creditsLeft: 0 }, 402);
    return c.json({ error: error?.message ?? 'UGC analysis failed' }, 500);
  }
});

// ── POST /api/ugc-video-ad/generate ───────────────────────────────────────────

router.post('/api/ugc-video-ad/generate', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const lumaKey = (env as any).LUMAAI_API_KEY as string | undefined;

  if (!lumaKey) {
    return c.json({ error: 'Video generation not configured (missing LUMAAI_API_KEY)' }, 503);
  }

  let body: {
    projectId?: string;
    variantIndex?: number;
    aspectRatio?: string;
  } = {};
  try { body = await c.req.json(); } catch { /* empty */ }

  if (!body.projectId || body.variantIndex === undefined) {
    return c.json({ error: 'projectId and variantIndex are required' }, 400);
  }

  const blink = getBlink(env);
  const projectTable = blink.db.table<UGCVideoProject>('ugc_video_projects');

  const project = await projectTable.get(body.projectId);
  if (!project || project.userId !== userId) {
    return c.json({ error: 'Project not found' }, 404);
  }

  let scripts: UGCVideoScript[] = [];
  let videoVariants: VideoVariant[] = [];
  try { scripts = JSON.parse(project.scripts); } catch { scripts = []; }
  try { videoVariants = JSON.parse(project.videoVariants); } catch { videoVariants = []; }

  const variantIndex = body.variantIndex;
  if (variantIndex < 0 || variantIndex >= scripts.length) {
    return c.json({ error: `Invalid variantIndex. Must be 0-${scripts.length - 1}` }, 400);
  }

  const script = scripts[variantIndex];
  const aspectRatio = (['9:16', '16:9', '1:1'].includes(body.aspectRatio ?? ''))
    ? body.aspectRatio as string
    : '9:16';

  const visualPrompt = script.visualDescription ||
    `UGC style video of ${project.productName}, ${script.hook.text}, natural lighting, authentic feel`;

  const generationId = crypto.randomUUID();
  const creditReferenceId = `ugc-video:${body.projectId}:${variantIndex}`;

  try {
    const charged = await consumeExecuteRefund(
      blink,
      userId,
      'ugc_video_generation',
      `UGC Video Ad generation: ${project.productName} - ${script.angle}`,
      creditReferenceId,
      async () => {
        if (!videoVariants[variantIndex]) {
          videoVariants[variantIndex] = { index: variantIndex, status: 'queued', generationId: '', videoUrl: '', aspectRatio, visualPrompt: '', errorMessage: '' };
        }
        videoVariants[variantIndex].status = 'queued';
        videoVariants[variantIndex].generationId = generationId;
        videoVariants[variantIndex].aspectRatio = aspectRatio;
        videoVariants[variantIndex].visualPrompt = visualPrompt;
        videoVariants[variantIndex].errorMessage = '';

        await projectTable.update(body.projectId, { status: 'generating', videoVariants: JSON.stringify(videoVariants), updatedAt: new Date().toISOString() });
        const queueFn = (blink as any).queue;
        if (queueFn?.enqueue) {
          await queueFn.enqueue('ugc-video-generate', { userId, projectId: body.projectId, variantIndex, visualPrompt, aspectRatio, generationId });
        } else {
          console.warn('[UgcVideoAd] Queue API not available, falling back to sync');
          const res = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
            method: 'POST',
            headers: { Authorization: `Bearer ${lumaKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: visualPrompt, aspect_ratio: aspectRatio }),
          });
          if (!res.ok) {
            const errText = await res.text();
            videoVariants[variantIndex].status = 'failed';
            videoVariants[variantIndex].errorMessage = errText;
            await projectTable.update(body.projectId, { status: 'failed', videoVariants: JSON.stringify(videoVariants), updatedAt: new Date().toISOString() });
            throw new Error(`Luma AI error: ${errText}`);
          }
          const data = await res.json() as { id: string; state: string; video?: { url: string } };
          videoVariants[variantIndex].status = data.state ?? 'processing';
          videoVariants[variantIndex].generationId = data.id;
          if (data.video?.url) videoVariants[variantIndex].videoUrl = data.video.url;
          await projectTable.update(body.projectId, { videoVariants: JSON.stringify(videoVariants), updatedAt: new Date().toISOString() });
        }
        return { mode: 'async', projectId: body.projectId, variantIndex, status: 'queued', generationId };
      },
      'ai',
      { provider: 'luma', projectId: body.projectId, variantIndex },
    );

    return c.json({ ...charged.result, creditsLeft: charged.balanceAfter });
  } catch (error: any) {
    console.error('[UgcVideoAd] Queue enqueue failed:', error);
    videoVariants[variantIndex].status = 'failed';
    videoVariants[variantIndex].errorMessage = error?.message ?? 'Queue enqueue failed';
    await projectTable.update(body.projectId, { status: 'failed', videoVariants: JSON.stringify(videoVariants), updatedAt: new Date().toISOString() });
    if (error?.message === 'Insufficient credits') return c.json({ error: 'NO_CREDITS', message: 'Crédits insuffisants pour la génération vidéo (10 crédits requis).', creditsLeft: 0 }, 402);
    return c.json({ error: error?.message ?? 'UGC video generation failed' }, 502);
  }
});

// ── GET /api/ugc-video-ad/status/:projectId ──────────────────────────────────

router.get('/api/ugc-video-ad/status/:projectId', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const projectId = c.req.param('projectId');
  if (!projectId) return c.json({ error: 'projectId is required' }, 400);

  const env = c.env as unknown as Env;
  const blink = getBlink(env);
  const projectTable = blink.db.table<UGCVideoProject>('ugc_video_projects');

  const project = await projectTable.get(projectId);
  if (!project || project.userId !== userId) {
    return c.json({ error: 'Project not found' }, 404);
  }

  let scripts: UGCVideoScript[] = [];
  let videoVariants: VideoVariant[] = [];
  try { scripts = JSON.parse(project.scripts); } catch { scripts = []; }
  try { videoVariants = JSON.parse(project.videoVariants); } catch { videoVariants = []; }

  const lumaKey = (env as any).LUMAAI_API_KEY as string | undefined;
  if (lumaKey) {
    let updated = false;
    for (const variant of videoVariants) {
      if (variant.status === 'processing' && variant.generationId) {
        try {
          const res = await fetch(
            `https://api.lumalabs.ai/dream-machine/v1/generations/${variant.generationId}`,
            { headers: { 'Authorization': `Bearer ${lumaKey}` } },
          );
          if (res.ok) {
            const data = await res.json() as {
              id: string; state: string; video?: { url: string }; failure_reason?: string;
            };
            if (data.state === 'completed' && data.video?.url) {
              variant.status = 'completed';
              variant.videoUrl = data.video.url;
              updated = true;
            } else if (data.state === 'failed') {
              variant.status = 'failed';
              variant.errorMessage = data.failure_reason ?? 'Luma generation failed';
              updated = true;
            }
          }
        } catch { /* polling best-effort */ }
      }
    }
    if (updated) {
      const allDone = videoVariants.every(v =>
        v.status === 'completed' || v.status === 'failed' || v.status === 'pending');
      const anyCompleted = videoVariants.some(v => v.status === 'completed');
      const newStatus = allDone ? (anyCompleted ? 'completed' : 'failed') : project.status;

      await projectTable.update(projectId, {
        status: newStatus,
        videoVariants: JSON.stringify(videoVariants),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return c.json({
    project: {
      id: project.id,
      userId: project.userId,
      productImageUrl: project.productImageUrl,
      productDescription: project.productDescription,
      productName: project.productName,
      status: project.status,
      creditsCost: project.creditsCost,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    scripts,
    videoVariants,
  });
});

// ── GET /api/ugc-video-ad/projects ────────────────────────────────────────────

router.get('/api/ugc-video-ad/projects', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = getBlink(env);
  const projectTable = blink.db.table<UGCVideoProject>('ugc_video_projects');

  try {
    const projects = await projectTable.list({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      limit: 50,
    });

    return c.json({
      projects: projects.map(p => ({
        id: p.id,
        productImageUrl: p.productImageUrl,
        productDescription: p.productDescription,
        productName: p.productName,
        status: p.status,
        creditsCost: p.creditsCost,
        variantCount: (() => { try { return JSON.parse(p.videoVariants).length; } catch { return 0; } })(),
        scriptCount: (() => { try { return JSON.parse(p.scripts).length; } catch { return 0; } })(),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (err: any) {
    console.error('[UgcVideoAd] projects list error:', err);
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});
