/**
 * URL-to-Video Pipeline — Scrape → Extract → Generate Video
 *
 * POST /api/url-to-video/scrape   — Scrape a URL, extract marketing data (auth)
 * POST /api/url-to-video/generate — Generate video via Luma AI (auth)
 * GET  /api/url-to-video/status/:generationId — Poll generation status (auth)
 */

import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';
import { generateAIResponse } from '../lib/aiRouter';

export const router = new Hono<{ Bindings: Env }>();

const getBlink = (env: Env) =>
  createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });

function getUserId(h: string | undefined): string | null {
  if (!h?.startsWith('Bearer ')) return null;
  try { const p = h.split('.')[1]; const d = JSON.parse(atob(p)); return d.sub ?? d.user_id ?? null; }
  catch { return null; }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

interface ExtractedData {
  title: string;
  description: string;
  ogImage: string;
  mainText: string;
  images: string[];
  prices: string[];
  productName: string;
  category: string;
}

interface MarketingContext {
  hook: string;
  body: string[];
  cta: string;
  tone: string;
  targetAudience: string;
}

/** Scrape a URL and extract structured marketing data from HTML */
async function scrapeUrl(url: string): Promise<ExtractedData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KompilotBot/1.0; +https://kompilot.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching URL`);
    }

    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() ?? '';

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const description = descMatch?.[1]?.trim() ?? '';

    // Extract OG tags
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    const ogImage = ogImageMatch?.[1]?.trim() ?? '';

    // Extract main text (strip HTML tags, collapse whitespace, take first 2000 chars)
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000);

    // Extract image URLs
    const imgRegex = /<img[^>]*src=["']([^"']+)["']/gi;
    const images: string[] = [];
    let imgMatch: RegExpExecArray | null;
    while ((imgMatch = imgRegex.exec(html)) !== null && images.length < 5) {
      const src = imgMatch[1];
      if (src && !src.startsWith('data:') && !src.includes('pixel') && !src.includes('tracking')) {
        images.push(src);
      }
    }

    // Extract price patterns (€, EUR, price classes)
    const priceRegex = /(\d+[.,]\d{2})\s*(?:€|EUR|euros?)/gi;
    const prices: string[] = [];
    let priceMatch: RegExpExecArray | null;
    while ((priceMatch = priceRegex.exec(html)) !== null) {
      prices.push(`${priceMatch[1]}€`);
    }
    // Also look for structured price data
    const priceSchemaRegex = /"price"\s*:\s*["']?(\d+[.,]\d{2})["']?/gi;
    while ((priceMatch = priceSchemaRegex.exec(html)) !== null && prices.length < 5) {
      const p = `${priceMatch[1]}€`;
      if (!prices.includes(p)) prices.push(p);
    }

    // Extract product name from OG or h1
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i);
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const productName = ogTitleMatch?.[1]?.trim() || h1Match?.[1]?.trim() || title;

    // Category from og:type or breadcrumb
    const ogTypeMatch = html.match(/<meta[^>]*property=["']og:type["'][^>]*content=["']([^"']+)["']/i);
    const category = ogTypeMatch?.[1]?.trim() ?? 'product';

    return {
      title,
      description,
      ogImage,
      mainText: bodyText,
      images,
      prices: [...new Set(prices)].slice(0, 5),
      productName,
      category,
    };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ── POST /api/url-to-video/scrape ────────────────────────────────────────────

router.post('/api/url-to-video/scrape', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const blink = getBlink(env);

  let body: { url?: string } = {};
  try { body = await c.req.json(); } catch { /* empty */ }

  if (!body.url) {
    return c.json({ error: 'URL is required' }, 400);
  }

  // Validate URL
  let validUrl: URL;
  try {
    validUrl = new URL(body.url);
    if (!['http:', 'https:'].includes(validUrl.protocol)) throw new Error('Invalid protocol');
  } catch {
    return c.json({ error: 'Invalid URL format' }, 400);
  }

  try {
    // 1. Deduct 1 credit
    const establishments = await blink.db.establishments.list({ where: { userId }, limit: 1 });
    const est = (establishments[0] as any) ?? {};
    const creditsUsed = Number(est.aiCreditsUsed) || 0;
    const creditsLimit = Number(est.aiCreditsLimit) || 50;
    const creditsLeft = Math.max(0, creditsLimit - creditsUsed);

    if (creditsLeft <= 0) {
      return c.json({
        error: 'NO_CREDITS',
        message: 'Crédits épuisés.',
        creditsLeft: 0,
      }, 402);
    }

    // Deduct credit
    try {
      await blink.db.establishments.update(est.id, {
        aiCreditsUsed: creditsUsed + 1,
        updatedAt: new Date().toISOString(),
      });
    } catch (creditErr) {
      console.warn('[UrlToVideo] credit deduction failed:', creditErr);
    }

    // 2. Scrape URL
    const extractedData = await scrapeUrl(validUrl.href);

    // 3. Use AI to generate marketing context
    const systemContext = `Tu es un expert en marketing vidéo et copywriting pour des TPE/PME françaises.
Analyse les données d'un site web et génère un script vidéo marketing structuré.

RÈGLES:
- Réponds UNIQUEMENT en JSON valide
- Le hook doit capter l'attention en 5 secondes max
- Le body doit contenir 3-5 arguments de vente percutants
- Le CTA doit être clair et orienté action
- Le ton suggéré doit correspondre au produit/service`;

    const userPrompt = `Analyse ce contenu web et génère un contexte marketing pour une vidéo:

Titre: ${extractedData.title}
Description: ${extractedData.description}
Produit: ${extractedData.productName}
Texte principal: ${extractedData.mainText.slice(0, 1000)}
${extractedData.prices.length > 0 ? `Prix trouvés: ${extractedData.prices.join(', ')}` : ''}
Catégorie: ${extractedData.category}

Retourne un JSON avec cette structure:
{
  "hook": "phrase d'accroche percutante pour les 5 premières secondes de la vidéo",
  "body": ["argument 1", "argument 2", "argument 3"],
  "cta": "appel à l'action final",
  "tone": "expert|energetic|seducer",
  "targetAudience": "description de la cible"
}`;

    let marketingContext: MarketingContext = {
      hook: `Découvrez ${extractedData.productName}`,
      body: [extractedData.description || 'Un produit/service exceptionnel'],
      cta: 'En savoir plus dès maintenant !',
      tone: 'expert',
      targetAudience: 'Grand public',
    };

    if (env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY) {
      try {
        const aiResult = await generateAIResponse(
          {
            taskType: 'CREATIVE_CONTENT',
            prompt: userPrompt,
            systemContext,
            forceJson: true,
            maxTokens: 1000,
          },
          { OPENAI_API_KEY: env.OPENAI_API_KEY, ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY },
          userId,
        );

        const raw = aiResult.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        let parsed: any;
        try {
          parsed = JSON.parse(raw);
        } catch {
          const match = raw.match(/\{[\s\S]*\}/);
          parsed = match ? JSON.parse(match[0]) : null;
        }

        if (parsed) {
          marketingContext = {
            hook: parsed.hook ?? marketingContext.hook,
            body: Array.isArray(parsed.body) ? parsed.body : marketingContext.body,
            cta: parsed.cta ?? marketingContext.cta,
            tone: parsed.tone ?? marketingContext.tone,
            targetAudience: parsed.targetAudience ?? marketingContext.targetAudience,
          };
        }
      } catch (aiErr) {
        console.warn('[UrlToVideo] AI marketing context failed, using defaults:', aiErr);
      }
    }

    return c.json({
      extractedData,
      marketingContext,
      creditsLeft: creditsLeft - 1,
    });
  } catch (err: any) {
    console.error('[UrlToVideo] scrape error:', err);
    return c.json({ error: err.message ?? 'Scraping failed' }, 500);
  }
});

// ── POST /api/url-to-video/generate ──────────────────────────────────────────

router.post('/api/url-to-video/generate', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const lumaKey = (env as any).LUMAAI_API_KEY as string | undefined;

  if (!lumaKey) {
    return c.json({ error: 'Video generation not configured (missing LUMAAI_API_KEY)' }, 503);
  }

  let body: {
    extractedData?: ExtractedData;
    marketingContext?: MarketingContext;
    voiceStyle?: string;
    aspectRatio?: string;
  } = {};
  try { body = await c.req.json(); } catch { /* empty */ }

  if (!body.marketingContext) {
    return c.json({ error: 'marketingContext is required (use /scrape first)' }, 400);
  }

  const mc = body.marketingContext;
  const aspectRatio = (['9:16', '16:9', '1:1'].includes(body.aspectRatio ?? ''))
    ? body.aspectRatio as string
    : '9:16';

  // Build a cinematic video prompt from the marketing context
  const videoPrompt = [
    `Cinematic product video, ${mc.tone} tone.`,
    `Opening hook: ${mc.hook}`,
    `Key points: ${mc.body.join('. ')}.`,
    `Call to action: ${mc.cta}`,
    body.extractedData?.productName ? `Product: ${body.extractedData.productName}.` : '',
    `Professional lighting, smooth transitions, modern marketing style, text overlays.`,
  ].filter(Boolean).join(' ');

  try {
    const res = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lumaKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: videoPrompt,
        aspect_ratio: aspectRatio,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[UrlToVideo] Luma AI error ${res.status}: ${errText}`);
      return c.json({ error: `Luma AI error: ${errText}` }, 502);
    }

    const data = (await res.json()) as {
      id: string;
      state: string;
      video?: { url: string };
    };

    // Store the generation in DB for tracking
    const blink = getBlink(env);
    try {
      await blink.db.luma_generations.create({
        id: data.id,
        userId,
        prompt: videoPrompt,
        optimizedPrompt: '',
        imageUrl: body.extractedData?.ogImage ?? '',
        videoUrl: data.video?.url ?? '',
        status: data.state ?? 'processing',
        aspectRatio,
        isAiGenerated: 1,
      });
    } catch (dbErr) {
      console.warn('[UrlToVideo] DB store failed (non-critical):', dbErr);
    }

    return c.json({
      generationId: data.id,
      status: data.state ?? 'processing',
      videoUrl: data.video?.url ?? null,
    });
  } catch (err: any) {
    console.error('[UrlToVideo] generate error:', err);
    return c.json({ error: err.message ?? 'Video generation failed' }, 500);
  }
});

// ── GET /api/url-to-video/status/:generationId ──────────────────────────────

router.get('/api/url-to-video/status/:generationId', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const generationId = c.req.param('generationId');
  if (!generationId) return c.json({ error: 'generationId is required' }, 400);

  const env = c.env as unknown as Env;
  const lumaKey = (env as any).LUMAAI_API_KEY as string | undefined;

  if (!lumaKey) {
    return c.json({ error: 'Video generation not configured' }, 503);
  }

  try {
    const res = await fetch(
      `https://api.lumalabs.ai/dream-machine/v1/generations/${generationId}`,
      {
        headers: {
          'Authorization': `Bearer ${lumaKey}`,
        },
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[UrlToVideo] Luma status error ${res.status}: ${errText}`);
      return c.json({ error: `Luma AI error: ${errText}` }, 502);
    }

    const data = (await res.json()) as {
      id: string;
      state: string;
      video?: { url: string };
      failure_reason?: string;
    };

    // Update DB record if generation completed
    if (data.state === 'completed' && data.video?.url) {
      const blink = getBlink(env);
      try {
        const existing = await blink.db.luma_generations.list({
          where: { id: generationId, userId },
          limit: 1,
        });
        if (existing.length > 0) {
          await blink.db.luma_generations.update(generationId, {
            videoUrl: data.video.url,
            status: 'completed',
          });
        }
      } catch (dbErr) {
        console.warn('[UrlToVideo] DB update failed (non-critical):', dbErr);
      }
    }

    return c.json({
      generationId: data.id,
      status: data.state,
      videoUrl: data.video?.url ?? null,
      failureReason: data.failure_reason ?? null,
    });
  } catch (err: any) {
    console.error('[UrlToVideo] status error:', err);
    return c.json({ error: err.message ?? 'Status check failed' }, 500);
  }
});
