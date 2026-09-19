/**
 * leadMagnet.ts — Lead Magnet Simulator
 *
 * POST /api/lead-magnet/generate — AI audit flash + envoi email Brevo
 * GET  /api/lead-magnet/list     — list des simulations (auth)
 * POST /api/pricing/abandon      — enregistre un abandon de page pricing
 */
import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

function getUserId(h: string | undefined): string | null {
  if (!h?.startsWith('Bearer ')) return null;
  try { const p = h.split('.')[1]; return (JSON.parse(atob(p))).sub ?? null; } catch { return null; }
}

function getBlink(env: Env) {
  return createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });
}

// ── POST /api/lead-magnet/generate ──────────────────────────────────────────

router.post('/api/lead-magnet/generate', async (c) => {
  const userId = getUserId(c.req.header('Authorization')) || '';
  try {
    const body = await c.req.json();
    const { name, email, tools } = body;
    if (!name || !email) return c.json({ error: 'name and email are required' }, 400);

    const blink = getBlink(c.env as unknown as Env);
    const toolsList = Array.isArray(tools) ? tools : [];

    // ── 1. Generate AI savings report ──
    const prompt = `Tu es un expert en automatisation marketing pour les PME françaises.

Analyse cette situation :
- Prospect : ${name} (${email})
- Outils actuellement utilisés : ${toolsList.length > 0 ? toolsList.join(', ') : 'Aucun outil déclaré'}

Génère un mini-rapport d'audit flash structuré en JSON avec :
{
  "savings_monthly_euros": number (économie mensuelle estimée en €),
  "hours_saved_monthly": number (heures gagnées par mois),
  "pain_points": ["3 points de friction détectés"],
  "recommendations": ["3 recommandations actionnables"],
  "roi_summary": "1 phrase percutante de résumé ROI",
  "next_step": "call-to-action personnalisé"
}

Contexte : Kompilot est une plateforme SaaS qui automatise la présence en ligne (Google, réseaux sociaux, IA générative, avis clients).
Sois concret, chiffré, et orienté business. Réponds UNIQUEMENT avec le JSON.`;

    let report: any = {};
    try {
      const ai = await blink.ai.generateText({ prompt, model: 'gpt-4.1-mini' });
      const raw = (ai as any)?.text || (ai as any)?.content || '';
      const clean = raw.replace(/```json\n?/g, '').replace(/\n?```/g, '').trim();
      try {
        report = JSON.parse(clean);
      } catch {
        report = {
          savings_monthly_euros: 450,
          hours_saved_monthly: 12,
          pain_points: ['Gestion manuelle des avis Google', 'Absence de stratégie IA générative', 'Pas de suivi ROI'],
          recommendations: ['Automatiser les réponses aux avis', 'Planifier 3 posts IA/semaine', 'Activer le tracking GA4'],
          roi_summary: `En moyenne, nos clients ${toolsList.length > 0 ? 'comme vous' : 'commerçants'} économisent 450€/mois et 12h de travail grâce à l'automatisation.`,
          next_step: 'Réservez votre démo offerte de 15 minutes',
        };
      }
    } catch {
      report = {
        savings_monthly_euros: 380,
        hours_saved_monthly: 10,
        pain_points: ['Visibilité en ligne non optimisée', 'Temps perdu en tâches répétitives'],
        recommendations: ['Centraliser la gestion de présence en ligne', 'Automatiser la publication de contenu'],
        roi_summary: 'Kompilot vous fait économiser 380€/mois en automatisation de votre présence locale.',
        next_step: 'Essayez Kompilot gratuitement pendant 14 jours',
      };
    }

    // ── 2. Persist to DB ──
    const id = `lm_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    await blink.db.table('lead_magnet_simulations').create({
      id,
      userId,
      name,
      email,
      tools: JSON.stringify(toolsList),
      savingsReport: JSON.stringify(report),
      sentToBrevo: 0,
      createdAt: new Date().toISOString(),
    });

    // ── 3. Send email via blink.notifications ──
    let sentToBrevo = 0;
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0D9488;">⚡ Votre Audit Flash Kompilot</h2>
          <p>Bonjour ${name},</p>
          <p>Voici le résultat de votre simulation d'automatisation :</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 16px 0;">
            <h3 style="color: #0D9488; margin-top: 0;">💰 Économies potentielles</h3>
            <p style="font-size: 32px; font-weight: bold; color: #0D9488; margin: 8px 0;">
              ${report.savings_monthly_euros}€ / mois
            </p>
            <p style="margin: 4px 0;">⏱️ ${report.hours_saved_monthly}h gagnées chaque mois</p>
          </div>
          
          <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h4 style="margin-top: 0;">🔍 Points de friction détectés</h4>
            <ul style="margin: 8px 0;">
              ${report.pain_points.map((p: string) => `<li>${p}</li>`).join('')}
            </ul>
          </div>
          
          <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h4 style="margin-top: 0;">💡 Recommandations</h4>
            <ul style="margin: 8px 0;">
              ${report.recommendations.map((r: string) => `<li>${r}</li>`).join('')}
            </ul>
          </div>
          
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e2e8f0;">
            <h4 style="margin-top: 0; color: #0f172a;">📋 Backlog priorisé — impact / effort</h4>
            <ol style="margin: 8px 0; padding-left: 22px; color: #334155;">
              <li><strong>Élevé / faible</strong> — Corriger les informations locales incohérentes et compléter les profils prioritaires.</li>
              <li><strong>Élevé / moyen</strong> — Publier régulièrement des contenus utiles et répondre aux avis avec validation humaine.</li>
              <li><strong>Moyen / moyen</strong> — Structurer les pages par secteur et renforcer les liens internes.</li>
              <li><strong>Moyen / élevé</strong> — Mettre en place un suivi mensuel des recherches, citations et conversions.</li>
            </ol>
          </div>

          <p style="font-size: 18px; font-weight: bold; color: #0D9488;">${report.roi_summary}</p>
          
          <div style="margin-top: 24px; text-align: center;">
            <a href="https://kompilot.fr/demo" style="background: #0D9488; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              ${report.next_step}
            </a>
          </div>
          
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
            Cet audit a été généré automatiquement par Kompilot. Vous recevez cet email car vous avez utilisé notre simulateur d'économies.
          </p>
        </div>
      `;

      await blink.notifications.email({
        to: email,
        subject: `⚡ ${name}, voici votre Audit Flash Kompilot — ${report.savings_monthly_euros}€/mois d'économies`,
        html,
      });
      sentToBrevo = 1;
      await blink.db.table('lead_magnet_simulations').update(id, { sentToBrevo: 1 });
    } catch (e: any) {
      console.error('[LeadMagnet] Email send failed:', e.message);
    }

    return c.json({
      success: true,
      id,
      report,
      sentToBrevo: !!sentToBrevo,
    });
  } catch (e: any) {
    console.error('[LeadMagnet] Generate error:', e.message);
    return c.json({ error: e.message }, 500);
  }
});

// ── GET /api/lead-magnet/list ────────────────────────────────────────────────

router.get('/api/lead-magnet/list', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const blink = getBlink(c.env as unknown as Env);
    const rows = await blink.db.table('lead_magnet_simulations').list({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      limit: 50,
    });
    return c.json({ simulations: Array.isArray(rows) ? rows : [] });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── POST /api/pricing/abandon ────────────────────────────────────────────────

router.post('/api/pricing/abandon', async (c) => {
  try {
    const body = await c.req.json();
    const { planId, billing = 'monthly', email = '', pageUrl = '' } = body;
    if (!planId) return c.json({ error: 'planId is required' }, 400);

    const blink = getBlink(c.env as unknown as Env);
    const userId = getUserId(c.req.header('Authorization')) || '';

    const id = `pab_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    await blink.db.table('pricing_abandon_events').create({
      id,
      userId,
      email,
      planId,
      billing,
      pageUrl,
      abandonedAt: new Date().toISOString(),
      reminderSent: 0,
    });

    // If we have an email, send internal notification
    if (email) {
      try {
        await blink.notifications.email({
          to: 'romain@kompilot.fr',
          subject: `🔔 Abandon pricing — Plan ${planId} (${billing})`,
          html: `
            <p><strong>Prospect :</strong> ${email}</p>
            <p><strong>Plan :</strong> ${planId} (${billing})</p>
            <p><strong>Page :</strong> ${pageUrl || 'N/A'}</p>
            <p><strong>Horodatage :</strong> ${new Date().toISOString()}</p>
            <p><a href="https://kompilot.fr/admin">Voir dans l'admin</a></p>
          `,
        });
      } catch { /* non-critical */ }
    }

    return c.json({ success: true, id });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});
