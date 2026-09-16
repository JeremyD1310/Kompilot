/**
 * Creative Studio — Analyse Meta Ads via Claude Sonnet
 *
 * POST /api/creative-studio/analyze  — lance l'analyse (auth requise)
 * GET  /api/creative-studio/reports  — liste les rapports sauvegardés
 * GET  /api/creative-studio/stats    — agrégats mensuels pour le dashboard
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { consumeExecuteRefund } from '../lib/creditService';

type Env = {
  BLINK_SECRET_KEY: string;
  ANTHROPIC_API_KEY: string;
  META_ADS_GRAPH_TOKEN: string;
};

export const router = new Hono<{ Bindings: Env }>();

/* ── Auth helper ─────────────────────────────────────────────────────────── */
function getDb(env: Env) {
  return createClient({ projectId: 'presence-manager-saas-gbrhsehk', secretKey: env.BLINK_SECRET_KEY });
}

function getUserId(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const payload = authHeader.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.sub ?? decoded.user_id ?? null;
  } catch {
    return null;
  }
}

/* ── POST /api/creative-studio/analyze ──────────────────────────────────── */
router.post('/api/creative-studio/analyze', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Non autorisé' }, 401);

  const { adAccountId, orgId = '', async: useQueue = false } = await c.req.json<{ adAccountId: string; orgId?: string; async?: boolean }>();
  const requestId = c.req.header('Idempotency-Key') || c.req.header('X-Request-Id') || `creative-studio:${userId}:${crypto.randomUUID()}`;
  const db = getDb(c.env);
  if (!adAccountId) return c.json({ error: 'adAccountId requis' }, 400);

  const metaToken = c.env.META_ADS_GRAPH_TOKEN;
  const anthropicKey = c.env.ANTHROPIC_API_KEY;

  /* ── Demo-mode guards ────────────────────────────────────────────────── */
  const isMetaDemo  = !metaToken  || metaToken.includes('dummy')  || metaToken === 'undefined';
  const isClaudeDemo = !anthropicKey || anthropicKey.includes('dummy') || anthropicKey === 'undefined';

  /* Demo Meta Ads data — retournée si le token Meta n'est pas configuré */
  const DEMO_META_ADS = [
    { name: 'Campagne Test Alpha — Accroche Promo',  text: 'Profitez de -20% sur votre première commande !', title: 'Offre limitée', ctr: 3.8, roas: 4.2, spend: 120 },
    { name: 'Campagne Test Beta — Storytelling UGC',  text: 'Ils ont essayé, ils ont adoré. Voici leur retour.', title: 'Avis clients', ctr: 1.2, roas: 0.8, spend: 85 },
    { name: 'Campagne Test Gamma — Pain Point',       text: 'Vous perdez des clients à cause de votre visibilité ?', title: 'Visibilité locale', ctr: 5.1, roas: 6.3, spend: 210 },
    { name: 'Campagne Test Delta — Awareness',        text: 'Découvrez Kompilot, le copilote de votre présence locale.', title: 'Présentation', ctr: 0.9, roas: 0.4, spend: 55 },
  ];

  try {
    /* ── Analyse Claude (ou réponse démo) — sync fallback ─────────────── */
    const DEMO_CLAUDE_ANALYSIS = {
      winners: 'Les accroches "Pain Point" (Gamma, CTR 5.1%, ROAS 6.3x) et "Promo directe" (Alpha, ROAS 4.2x) surperforment nettement. Le format court avec chiffre de réduction + urgence génère le meilleur CTR. Les visuels UGC avec preuve sociale fonctionnent bien sur le mid-funnel.',
      losers: 'La campagne Delta "Awareness" est à couper immédiatement (ROAS 0.4x, CTR <1%). La campagne Beta UGC perd du budget (ROAS 0.8x) — le storytelling seul sans CTA chiffré ne convertit pas sur ce segment.',
      next_actions: [
        'Tester une déclinaison "Pain Point + chiffre" : "87% de nos clients ont doublé leur visibilité locale en 30 jours"',
        'Créer une version vidéo courte (15s) de la campagne Alpha avec compteur de réduction animé',
        'Combiner UGC + promo : témoignage client + offre -20% en fin de vidéo pour maximiser ROAS',
      ],
      budget_waste_euros: 140,
    };

    let analysis: { winners: string; losers: string; next_actions: string[]; budget_waste_euros: number };
    let formatted: any[];
    let reportId: string;
    let totalBudgetWaste: number;

    const charged = await consumeExecuteRefund(
      db,
      userId,
      'ai_analysis',
      'Creative Studio Meta Ads analysis',
      requestId,
      async () => {
        /* 1. Fetch Meta Ads (ou données démo) ──────────────────────────────── */
        if (isMetaDemo) {
          formatted = DEMO_META_ADS;
        } else {
          const metaUrl =
            `https://graph.facebook.com/v19.0/${adAccountId}/ads` +
            `?fields=name,creative{image_url,body,title},insights{spend,inline_link_click_ctr,purchase_roas}` +
            `&access_token=${metaToken}`;

          const metaRes = await fetch(metaUrl);
          const metaData = await metaRes.json() as { data?: any[]; error?: any };

          if (!metaData.data) {
            const msg = metaData.error?.message ?? 'Impossible de récupérer les données Meta Ads.';
            throw new Error(`Meta Ads error: ${msg}`);
          }

          formatted = metaData.data
            .map((ad: any) => ({
              name: ad.name ?? '',
              text: ad.creative?.body ?? '',
              title: ad.creative?.title ?? '',
              ctr: parseFloat(ad.insights?.[0]?.inline_link_click_ctr ?? '0'),
              roas: parseFloat(ad.insights?.[0]?.purchase_roas?.[0]?.value ?? '0'),
              spend: parseFloat(ad.insights?.[0]?.spend ?? '0'),
            }))
            .filter((ad: any) => ad.spend > 10);

          if (formatted.length === 0) {
            throw new Error('Aucune publicité avec budget dépensé trouvée sur ce compte.');
          }
        }

        /* 2. Async queue mode: enqueue Claude analysis ─────────────────────── */
        if (useQueue) {
          try {
            const blink = getDb(c.env) as any;
            if (blink.queue?.enqueue) {
              await blink.queue.enqueue('analyze-creative', {
                userId, adAccountId, orgId, formatted, isMetaDemo, isClaudeDemo,
              });
              return c.json({
                mode: 'async',
                status: 'queued',
                adsAnalyzed: formatted.length,
                message: 'Analysis queued. Poll reports endpoint for results.',
              });
            }
          } catch (queueErr) {
            console.warn('[CreativeStudio] Queue enqueue failed, falling back to sync:', queueErr);
          }
        }

        /* 3. Analyse Claude (ou réponse démo) — sync fallback ─────────────── */
        if (isClaudeDemo) {
          analysis = DEMO_CLAUDE_ANALYSIS;
        } else {
          /* Prompt Claude Sonnet */
          const prompt = `Tu es Creative Strategist pour Kompilot. Analyse ces Meta Ads (données réelles).

Identifie ce qui surperforme (CTR/ROAS élevés) vs ce qui perd du budget.

Ads :
${JSON.stringify(formatted, null, 2)}

Réponds UNIQUEMENT avec un JSON valide (pas de markdown, pas d'explication) :
{
  "winners": "description des patterns performants (angles, hooks, formats)",
  "losers": "ce qu'il faut couper immédiatement et pourquoi",
  "next_actions": ["brief créa 1", "brief créa 2", "brief créa 3"],
  "budget_waste_euros": 0
}`;

          const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': anthropicKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 1500,
              messages: [{ role: 'user', content: prompt }],
            }),
          });

          if (!claudeRes.ok) {
            const errText = await claudeRes.text();
            throw new Error(`Claude API error: ${errText}`);
          }

          const claudeData = await claudeRes.json() as { content: { text: string }[] };
          const rawText = claudeData.content?.[0]?.text ?? '{}';

          try {
            analysis = JSON.parse(rawText);
          } catch {
            const match = rawText.match(/\{[\s\S]*\}/);
            analysis = match ? JSON.parse(match[0]) : { winners: rawText, losers: '', next_actions: [], budget_waste_euros: 0 };
          }
        }

        /* 4. Save to Blink DB ────────────────────────────────────────────── */
        const db = getDb(c.env);
        reportId = crypto.randomUUID();
        totalBudgetWaste = formatted
          .filter((a: any) => a.roas < 1 && a.spend > 0)
          .reduce((sum: number, a: any) => sum + a.spend, 0);

        await db.db.creative_reports.create({
          id: reportId,
          userId,
          orgId,
          adAccountId,
          adsAnalyzed: formatted.length,
          budgetWasteDetected: Math.round(totalBudgetWaste),
          winners: JSON.stringify(analysis.winners ?? ''),
          losers: JSON.stringify(analysis.losers ?? ''),
          nextActions: JSON.stringify(analysis.next_actions ?? []),
          rawMetaData: JSON.stringify(formatted),
        });

        return { reportId, analysis, adsAnalyzed: formatted.length, budgetWasteDetected: isClaudeDemo ? (analysis.budget_waste_euros ?? 140) : Math.round(totalBudgetWaste), isDemo: isMetaDemo || isClaudeDemo };
      },
      'ai',
      { provider: 'anthropic', route: 'creativeStudio.analyze', adAccountId, orgId },
    );
    return c.json({ ...charged.result, creditsLeft: charged.balanceAfter });

  } catch (err: any) {
    console.error('[CreativeStudio] analyze error:', err);
    const message = err.message ?? 'Erreur inconnue';
    const status = message.includes('Aucune publicité') ? 422 : message.includes('Meta Ads error:') ? 400 : message.includes('Claude API error:') ? 502 : message.includes('Insufficient credits') ? 402 : 500;
    return c.json({ error: message }, status as 400 | 402 | 422 | 500);
  }
});

/* ── GET /api/creative-studio/reports ───────────────────────────────────── */
router.get('/api/creative-studio/reports', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Non autorisé' }, 401);
  const db = getDb(c.env);
  const reports = await db.db.creative_reports.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 20 });
  return c.json({ reports });
});

/* ── GET /api/creative-studio/stats ─────────────────────────────────────── */
router.get('/api/creative-studio/stats', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Non autorisé' }, 401);
  const db = getDb(c.env);
  const reports = await db.db.creative_reports.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 100 });
  const totalAds = reports.reduce((s: number, r: any) => s + (Number(r.adsAnalyzed) || 0), 0);
  const totalWaste = reports.reduce((s: number, r: any) => s + (Number(r.budgetWasteDetected) || 0), 0);
  return c.json({ totalReports: reports.length, totalAds, totalBudgetWasteEuros: totalWaste });
});
