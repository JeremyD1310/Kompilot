/**
 * coupons.ts — Coupons Flash IA
 *
 * POST /api/coupons/generate   — AI-generated flash coupon + DB persistence
 * GET  /api/coupons             — list user's coupons
 * POST /api/coupons/validate     — validate a coupon code (used by CaissePage)
 * DELETE /api/coupons/:id       — deactivate a coupon
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

function getUserId(h: string | undefined): string | null {
  if (!h?.startsWith('Bearer ')) return null;
  try {
    const payload = h.split('.')[1];
    return (JSON.parse(atob(payload))).sub ?? null;
  } catch {
    return null;
  }
}

function getBlink(env: Env) {
  return createClient({
    projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk',
    secretKey: env.BLINK_SECRET_KEY,
  });
}

// ── POST /api/coupons/generate ───────────────────────────────────────────────

router.post('/api/coupons/generate', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const body = await c.req.json();
    const { businessName, discountPercent = 20, discountType = 'percentage', description = '', validDays = 1, establishmentId = '' } = body;

    if (!businessName) return c.json({ error: 'businessName is required' }, 400);

    const blink = getBlink(c.env as unknown as Env);

    // Generate a unique coupon code
    const prefix = businessName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
    const suffix = crypto.randomUUID().replace(/-/g, '').substring(0, 4).toUpperCase();
    const code = `FLASH_${prefix}${suffix}`;

    // Generate the flash offer text with AI
    const prompt = `Tu es un expert en marketing local. Génère une offre flash (coupon) pour un commerce appelé "${businessName}".

Détails :
- Réduction : ${discountPercent}% (type : ${discountType === 'percentage' ? 'pourcentage' : 'montant fixe'})
- ${description ? `Contexte : ${description}` : 'Offre générique pour attirer des clients'}
- Valable : ${validDays} jour(s)

Format : un message court, percutant, avec emojis, en français. Maximum 3-4 lignes.
Inclus un sentiment d'urgence (offre limitée dans le temps).
Termine par un call-to-action clair.
Ne mets PAS le code promo dans le message — il sera ajouté automatiquement.`;

    let offerText = '';
    try {
      const aiRes = await blink.ai.generateText({ prompt, model: 'gpt-4.1-mini' });
      offerText = (aiRes as any)?.text || (aiRes as any)?.content || '';
    } catch {
      // Fallback: template-based offer if AI fails
      offerText = `⚡ OFFRE FLASH — ${validDays > 1 ? `${validDays} JOURS` : '24H'} SEULEMENT !\n\n🎁 -${discountPercent}% sur votre prochaine visite chez ${businessName}\n⏰ Valable jusqu'à demain soir 23h59\n\nRéservez maintenant ! 👉`;
    }

    // Build the full message with code
    const fullMessage = `${offerText}\n\n🎫 Code : **${code}**\n📲 Présentez ce code en caisse`;

    // Valid until
    const validUntil = new Date(Date.now() + validDays * 86400000).toISOString();

    // Save to DB
    const now = new Date().toISOString();
    const id = `coup_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`;

    const coupon = await (blink.db.table('coupons') as any).create({
      id,
      userId,
      code,
      discountType,
      discountValue: discountPercent,
      description: fullMessage.substring(0, 200),
      validUntil,
      maxUses: 0,
      currentUses: 0,
      isActive: 1,
      establishmentId,
      createdAt: now,
    });

    return c.json({
      coupon,
      message: fullMessage,
      code,
      validUntil,
    }, 201);
  } catch (e: any) {
    console.error('[Coupons] Generate error:', e.message);
    return c.json({ error: e.message }, 500);
  }
});

// ── GET /api/coupons ─────────────────────────────────────────────────────────

router.get('/api/coupons', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const blink = getBlink(c.env as unknown as Env);
    const coupons = await (blink.db.table('coupons') as any).list({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      limit: 50,
    });
    return c.json({ coupons: Array.isArray(coupons) ? coupons : [] });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── POST /api/coupons/validate ───────────────────────────────────────────────

router.post('/api/coupons/validate', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const body = await c.req.json();
    const { code } = body;

    if (!code) return c.json({ valid: false, reason: 'Code manquant' });

    const blink = getBlink(c.env as unknown as Env);

    const coupons = await (blink.db.table('coupons') as any).list({
      where: { userId, code: code.toUpperCase(), isActive: '1' },
      limit: 1,
    });

    const coupon = Array.isArray(coupons) && coupons.length > 0 ? coupons[0] : null;

    if (!coupon) {
      return c.json({ valid: false, reason: 'Code invalide ou expiré' });
    }

    // Check expiration
    if (coupon.validUntil) {
      const now = new Date();
      const expiry = new Date(coupon.validUntil);
      if (now > expiry) {
        return c.json({ valid: false, reason: 'Code expiré' });
      }
    }

    // Check max uses
    if (coupon.maxUses > 0 && Number(coupon.currentUses) >= coupon.maxUses) {
      return c.json({ valid: false, reason: 'Limite d\'utilisation atteinte' });
    }

    // Increment uses
    await (blink.db.table('coupons') as any).update(coupon.id, {
      currentUses: String(Number(coupon.currentUses) + 1),
    });

    return c.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        description: coupon.description,
      },
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── DELETE /api/coupons/:id ──────────────────────────────────────────────────

router.delete('/api/coupons/:id', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const blink = getBlink(c.env as unknown as Env);
    const id = c.req.param('id');
    const existing = await (blink.db.table('coupons') as any).get(id);

    if (!existing) return c.json({ error: 'Not found' }, 404);
    if (existing.userId !== userId) return c.json({ error: 'Forbidden' }, 403);

    await (blink.db.table('coupons') as any).update(id, { isActive: 0 });
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});
