/**
 * UGC Script Engine — Generate UGC-style video scripts
 *
 * POST /api/ugc-script/generate — Generate a UGC video script (auth)
 *
 * Follows strict Hook → Body → CTA architecture with voiceover direction.
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface UGCScript {
  hook: {
    text: string;
    type: 'question' | 'provocation' | 'statistic' | 'story';
  };
  body: {
    points: Array<{
      text: string;
      duration: string;
    }>;
    transition: string;
  };
  cta: {
    text: string;
    type: 'booking' | 'website' | 'phone' | 'promo';
  };
  fullScript: string;
  estimatedDuration: string;
  voiceNotes: string;
  suggestedVariations: Array<{
    tone: string;
    hook: string;
  }>;
}

// ── POST /api/ugc-script/generate ────────────────────────────────────────────

router.post('/api/ugc-script/generate', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
    return c.json({ error: 'AI keys not configured' }, 503);
  }

  let body: {
    topic?: string;
    tone?: 'expert' | 'energetic' | 'seducer';
    keywords?: string[];
    context?: string;
  } = {};
  try { body = await c.req.json(); } catch { /* empty */ }

  if (!body.topic) {
    return c.json({ error: 'topic is required' }, 400);
  }

  const tone = body.tone ?? 'expert';
  const blink = getBlink(env);

  try {
    // 1. Get user's establishment context
    const establishments = await blink.db.establishments.list({ where: { userId }, limit: 1 });
    const est = (establishments[0] as any) ?? {};
    const establishmentName = est.name ?? 'votre établissement';
    const activity = est.activity ?? 'commerce local';
    const city = est.city ?? '';

    // 2. Build the system prompt for Hook → Body → CTA structure
    const systemContext = `Tu es un expert copywriter spécialisé en scripts vidéo UGC (User Generated Content) pour des TPE/PME françaises.

Tu génères des scripts vidéo au format Hook → Body → CTA, optimisés pour les réseaux sociaux (TikTok, Reels, Shorts).

ARCHITECTURE STRICTE:
1. HOOK (0-3 secondes): L'accroche doit ARRÊTER le scroll. 4 types possibles:
   - question: "Vous saviez que...?"
   - provocation: Affirmation choc qui suscite la curiosité
   - statistic: Chiffre surprenant
   - story: Mini-récit captivant

2. BODY (3-25 secondes): 3-5 arguments de vente percutants, chacun avec une durée estimée.
   - Transition naturelle entre le hook et le body
   - Chaque point doit être une idée distincte et percutante
   - Langage oral, naturel, comme si on parlait à un ami

3. CTA (25-30 secondes): Appel à l'action clair et direct
   - booking: "Réservez maintenant"
   - website: "Visitez notre site"
   - phone: "Appelez-nous"
   - promo: Profiter d'une offre

RÈGLES DE TON:
- expert: Autorité, expertise, données, rassurant
- energetic: Dynamique, enthousiaste, emojis dans le ton, punchy
- seducer: Émotionnel, storytelling, aspirationnel, désir

FORMAT DE SORTIE: JSON valide UNIQUEMENT (pas de markdown, pas d'explication).`;

    const userPrompt = `Génère un script vidéo UGC pour "${establishmentName}" (${activity}${city ? ` à ${city}` : ''}).
Sujet: ${body.topic}
Ton: ${tone}
${body.keywords?.length ? `Mots-clés à intégrer: ${body.keywords.join(', ')}` : ''}
${body.context ? `Contexte additionnel: ${body.context}` : ''}

Retourne un JSON avec cette structure EXACTE:
{
  "hook": {
    "text": "texte du hook (dit à l'oral, max 15 mots)",
    "type": "question|provocation|statistic|story"
  },
  "body": {
    "points": [
      { "text": "argument 1 (dit à l'oral)", "duration": "5s" },
      { "text": "argument 2", "duration": "5s" },
      { "text": "argument 3", "duration": "5s" }
    ],
    "transition": "phrase de transition entre hook et body"
  },
  "cta": {
    "text": "texte du call-to-action (dit à l'oral)",
    "type": "booking|website|phone|promo"
  },
  "fullScript": "script complet comme texte continu, prêt à être lu à l'oral, avec des marqueurs de pause (...) et d'emphasis (MAJUSCULES)",
  "estimatedDuration": "30s",
  "voiceNotes": "notes détaillées pour le voiceover: où marquer des pauses, accélérer, ralentir, insister, chuchoter, etc.",
  "suggestedVariations": [
    { "tone": "expert", "hook": "hook alternatif version expert" },
    { "tone": "energetic", "hook": "hook alternatif version énergique" },
    { "tone": "seducer", "hook": "hook alternatif version séducteur" }
  ]
}`;

    // 3. Call AI
    const aiResult = await generateAIResponse(
      {
        taskType: 'CREATIVE_CONTENT',
        prompt: userPrompt,
        systemContext,
        forceJson: true,
        maxTokens: 2000,
      },
      { OPENAI_API_KEY: env.OPENAI_API_KEY, ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY },
      userId,
    );

    // 4. Parse AI response
    let parsed: any;
    try {
      const raw = aiResult.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
      parsed = JSON.parse(raw);
    } catch {
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI response was not valid JSON');
      }
    }

    // 5. Build the script with safe defaults
    const script: UGCScript = {
      hook: {
        text: parsed.hook?.text ?? body.topic,
        type: ['question', 'provocation', 'statistic', 'story'].includes(parsed.hook?.type)
          ? parsed.hook.type
          : 'question',
      },
      body: {
        points: Array.isArray(parsed.body?.points)
          ? parsed.body.points.map((p: any) => ({
              text: String(p.text ?? ''),
              duration: String(p.duration ?? '5s'),
            }))
          : [{ text: body.topic, duration: '5s' }],
        transition: parsed.body?.transition ?? "Alors voilà ce qu'il faut savoir...",
      },
      cta: {
        text: parsed.cta?.text ?? "N'hésitez pas, réservez dès maintenant !",
        type: ['booking', 'website', 'phone', 'promo'].includes(parsed.cta?.type)
          ? parsed.cta.type
          : 'booking',
      },
      fullScript: parsed.fullScript ?? '',
      estimatedDuration: parsed.estimatedDuration ?? '30s',
      voiceNotes: parsed.voiceNotes ?? '',
      suggestedVariations: Array.isArray(parsed.suggestedVariations)
        ? parsed.suggestedVariations.slice(0, 3).map((v: any) => ({
            tone: String(v.tone ?? ''),
            hook: String(v.hook ?? ''),
          }))
        : [],
    };

    // 6. If fullScript is empty, construct it from parts
    if (!script.fullScript) {
      const parts: string[] = [];
      parts.push(`[HOOK - ${script.hook.type}]`);
      parts.push(script.hook.text);
      parts.push('');
      parts.push(`[TRANSITION]`);
      parts.push(script.body.transition);
      parts.push('');
      parts.push('[BODY]');
      for (const point of script.body.points) {
        parts.push(`(${point.duration}) ${point.text}`);
      }
      parts.push('');
      parts.push('[CTA]');
      parts.push(script.cta.text);
      script.fullScript = parts.join('\n');
    }

    // 7. Log the generation
    try {
      await blink.db.observability_logs.create({
        id: `ugc_${Date.now()}`,
        userId,
        action: 'ugc_script_generated',
        provider: aiResult.provider,
        errorMessage: 'ok',
        metadata: JSON.stringify({
          topic: body.topic,
          tone,
          model: aiResult.model,
          tokens: aiResult.inputTokens + aiResult.outputTokens,
        }),
        severity: 'info',
      });
    } catch { /* non-critical */ }

    return c.json({
      script,
      meta: {
        provider: aiResult.provider,
        model: aiResult.model,
        latencyMs: aiResult.latencyMs,
      },
    });
  } catch (err: any) {
    console.error('[UgcScript] generate error:', err);
    return c.json({ error: err.message ?? 'Script generation failed' }, 500);
  }
});
