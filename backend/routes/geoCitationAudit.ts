import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';
import { runGeoAudit } from '../lib/geoCitationAuditService';

export const router = new Hono<{ Bindings: Env }>();

router.post('/api/geo/citation-audit', async c => {
  const env = c.env as Env & Record<string, string | undefined>;
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid || !auth.userId) return c.json({ error: 'Non autorisé' }, 401);
  let body: { brandName?: string; sector?: string; location?: string; siteUrl?: string };
  try { body = await c.req.json(); } catch { return c.json({ error: 'JSON invalide' }, 400); }
  const brandName = body.brandName?.trim() ?? '';
  const sector = body.sector?.trim() ?? '';
  const location = body.location?.trim() ?? '';
  const siteUrl = body.siteUrl?.trim() || undefined;
  if (!brandName || !sector || !location) return c.json({ error: 'Nom de marque, secteur et zone requis.' }, 400);
  if (siteUrl && !/^https:\/\//i.test(siteUrl)) return c.json({ error: 'L’URL du site doit commencer par https://' }, 400);
  const keys = { openai: env.OPENAI_API_KEY, gemini: env.GEMINI_API_KEY, perplexity: env.PERPLEXITY_API_KEY, claude: env.ANTHROPIC_API_KEY } as const;
  if (!Object.values(keys).some(Boolean)) return c.json({ error: 'Aucun moteur IA configuré pour cet audit.' }, 503);
  try {
    return c.json(await runGeoAudit({ brandName, sector, location, siteUrl, keys, serpApiKey: env.SERP_API_KEY }));
  } catch (error) {
    console.error('[GeoCitationAudit]', error);
    return c.json({ error: 'GEO_AUDIT_FAILED', details: error instanceof Error ? error.message : 'Audit impossible' }, 502);
  }
});
