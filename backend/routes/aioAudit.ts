/**
 * AIO Audit route — POST /api/aio/audit
 *
 * For each industry keyword, asks the Blink AI to respond as a B2B buyer
 * looking for solutions, then checks whether the brand name is cited.
 * Returns per-keyword results: { keyword, aiAnswer, isCited, status, timestamp }
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono();

const getBlink = (env: Env) =>
  createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });

router.post('/api/aio/audit', async (c) => {
  const env = c.env as Env;

  // Auth check
  const blink = getBlink(env);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{ brandName: string; keywords: string[] }>();
  const { brandName, keywords } = body ?? {};

  if (!brandName || !Array.isArray(keywords) || keywords.length === 0) {
    return c.json({ error: 'brandName and keywords[] are required' }, 400);
  }

  if (keywords.length > 10) {
    return c.json({ error: 'Maximum 10 keywords per audit' }, 400);
  }

  const auditResults: {
    keyword: string;
    aiAnswer: string;
    isCited: boolean;
    status: 'VISIBLE' | 'INVISIBLE_DROP';
    timestamp: string;
  }[] = [];

  for (const keyword of keywords) {
    const prompt = `Agis comme un acheteur B2B potentiel. Réponds de manière concise : Quels sont les meilleurs outils ou solutions pour : "${keyword}" ?`;

    try {
      const { text: aiAnswer } = await blink.ai.generateText({
        prompt,
        model: 'gpt-4.1-mini',
      });

      const isCited = aiAnswer.toLowerCase().includes(brandName.toLowerCase());

      auditResults.push({
        keyword,
        aiAnswer,
        isCited,
        status: isCited ? 'VISIBLE' : 'INVISIBLE_DROP',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      // On individual keyword failure, record error entry but continue
      auditResults.push({
        keyword,
        aiAnswer: `Erreur lors de l'analyse : ${(err as Error).message ?? 'unknown'}`,
        isCited: false,
        status: 'INVISIBLE_DROP',
        timestamp: new Date().toISOString(),
      });
    }
  }

  const visibleCount = auditResults.filter(r => r.isCited).length;
  const visibilityScore = Math.round((visibleCount / auditResults.length) * 100);

  return c.json({ auditResults, visibilityScore, brandName });
});
