/**
 * scanner.ts — Real backend scan for local acquisition
 *
 * POST /api/scanner/scan-fast  — compute a real visibility score based on
 *                                 business name + city + sector + optional data
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

function getBlink(env: Env) {
  return createClient({
    projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk',
    secretKey: env.BLINK_SECRET_KEY,
  });
}

// ── POST /api/scanner/scan-fast ──────────────────────────────────────────────

router.post('/api/scanner/scan-fast', async (c) => {
  try {
    const body = await c.req.json();
    const { businessName, city, activity = '', website = '', phone = '' } = body;

    if (!businessName || !city) {
      return c.json({ error: 'businessName and city are required' }, 400);
    }

    // Compute a real score based on input quality
    const factors: string[] = [];
    let score = 25; // Base score

    // Name quality (short = better for search)
    const cleanName = businessName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    if (cleanName.length <= 20) {
      score += 8;
      factors.push('Nom concis et mémorisable');
    } else if (cleanName.length <= 35) {
      score += 4;
    }

    // City population tier (heuristic based on name length + presence)
    if (city.length <= 5) {
      score += 3; // Smaller city = less competition
      factors.push('Marché local moins concurrentiel');
    } else if (city.length <= 10) {
      score += 6;
      factors.push('Marché local favorable');
    } else {
      score += 4;
      factors.push('Zone urbaine compétitive');
    }

    // Has website
    if (website && website.length > 5) {
      score += 8;
      factors.push('Site web détecté (+8 points SEO)');
    } else {
      factors.push('Aucun site web — créez-en un pour +15 points');
    }

    // Has phone
    if (phone && phone.length >= 10) {
      score += 5;
      factors.push('Téléphone vérifié');
    }

    // Activity sector bonus
    const sectorBonuses: Record<string, number> = {
      restaurant: 10, boulangerie: 8, coiffeur: 7, salon: 7,
      plombier: 12, electricien: 12, serrurier: 14, dentiste: 6,
      pharmacie: 5, hotel: 8, garage: 10, immobilier: 6,
      beaute: 7, sante: 6, commerce: 5,
    };

    const activityLower = (activity || businessName).toLowerCase();
    let sectorBonus = 0;
    for (const [key, bonus] of Object.entries(sectorBonuses)) {
      if (activityLower.includes(key)) {
        sectorBonus = bonus;
        factors.push(`Secteur "${key}" — bonus +${bonus} (forte demande locale)`);
        break;
      }
    }
    if (sectorBonus === 0) {
      sectorBonus = 3;
      factors.push('Secteur général — potentiel à préciser');
    }
    score += sectorBonus;

    // Cap at 85: this is an input-based estimate, not an external visibility measurement.
    score = Math.min(85, Math.max(0, score));

    const scoringVersion = 'local-heuristic-v1';
    const confidence = Math.min(92, Math.max(35, 45 + (website ? 12 : 0) + (phone ? 8 : 0) + (activity ? 7 : 0)));
    const sourceStatus = 'heuristic_unverified' as const;
    const preview = {
      label: 'Aperçu heuristique / IA — non vérifié',
      disclaimer: 'Estimation calculée à partir des informations saisies. Aucune requête à ChatGPT, Google Maps ou autre moteur externe n’a été effectuée.',
      signals: [
        { key: 'local_presence', label: 'Présence locale', score: Math.min(100, score) },
        { key: 'ai_discoverability', label: 'Prédisposition à la découvrabilité IA', score: Math.min(100, Math.round(score * 0.7)) },
        { key: 'reputation', label: 'Base réputationnelle', score: Math.min(100, Math.round(score * 1.1)) },
      ],
    };

    // Generate recommendations
    const recommendations: string[] = [];
    if (!website) recommendations.push('Créer un site web pour améliorer votre référencement local');
    if (cleanName.length > 35) recommendations.push('Raccourcir le nom commercial pour une meilleure mémorisation');
    if (score < 40) recommendations.push('Ajouter des photos et horaires sur Google Business Profile');
    if (score < 55) recommendations.push('Collecter des avis Google pour booster votre visibilité');
    if (!phone || phone.length < 10) recommendations.push('Ajouter un numéro de téléphone vérifié');
    if (recommendations.length === 0) recommendations.push('Votre présence locale est solide — continuez à publier régulièrement !');

    // Persist to leads table (no auth required for public scan)
    const blink = getBlink(c.env as unknown as Env);
    const leadId = `lead_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    try {
      await (blink.db.table('leads') as any).create({
        id: leadId,
        businessName,
        email: body.email || '',
        phone: phone || '',
        city,
        visibilityScore: score,
        scanData: JSON.stringify({ factors, recommendations, activity, website }),
        status: 'Lead_Audit',
        createdAt: new Date().toISOString(),
      });
    } catch {
      // Non-critical — continue even if DB write fails
    }

    return c.json({
      score,
      factors,
      recommendations,
      leadId,
      scoringVersion,
      confidence,
      sourceStatus,
      preview,
      computedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('[Scanner] Scan-fast error:', e.message);
    return c.json({ error: e.message }, 500);
  }
});
