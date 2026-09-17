/**
 * predictiveScoring.ts — Predictive Scoring Engine
 *
 * Analyzes user behavior to predict lead quality, churn risk, and campaign
 * performance using AI-powered scoring models.
 *
 * GET /api/predictive-scoring/leads            — score CRM contacts (conversion probability)
 * GET /api/predictive-scoring/churn-risk       — identify users at risk of churning
 * GET /api/predictive-scoring/campaign-health  — predict underperforming campaigns
 */

import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';
import { consumeExecuteRefund } from '../lib/creditService';
import { isIdempotentReplayError, replayConflictBody } from '../lib/idempotentReplay';

export const router = new Hono<{ Bindings: Env }>();

async function authenticate(c: any, blink: any) {
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  return auth.valid && auth.userId ? auth.userId : null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getBlink(env: Env) {
  return createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });
}

// ── Types ────────────────────────────────────────────────────────────────────

interface CrmContact {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  company: string;
  tags: string;
  customFields: string;
  source: string;
  status: string;
  notes: string;
  lastContactedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface LeadScore {
  contactId: string;
  email: string;
  name: string;
  score: number;
  topSignals: string[];
  recommendedAction: string;
}

interface ChurnRiskEntry {
  userId: string;
  email: string;
  riskScore: number;
  riskFactors: string[];
  recommendedAction: string;
}

interface CampaignHealthEntry {
  campaignId: string;
  name: string;
  predictedRoas: number;
  confidence: number;
  recommendation: string;
}

// ── AI System Prompts ─────────────────────────────────────────────────────────

const LEAD_SCORING_PROMPT = `You are an expert lead scoring analyst for Kompilot, a SaaS presence management platform.
Analyze CRM contact data and score each contact's conversion probability (0-100).

## Scoring Factors
- **Recency**: recently contacted or created contacts score higher
- **Engagement**: contacts with notes, tags, or custom fields score higher
- **Source quality**: "widget" or "form_submission" > "import" > "manual"
- **Company data**: contacts with company names score higher (B2B signal)
- **Contact info completeness**: email + phone > email only

## Output Format (JSON only, no markdown fences):
{
  "contacts": [
    {
      "contactId": "the_contact_id",
      "score": 78,
      "topSignals": ["has phone number", "contacted within 7 days", "source: widget"],
      "recommendedAction": "call_immediately" | "send_email" | "add_to_nurture" | "low_priority"
    }
  ],
  "summary": "one-paragraph analysis summary in French"
}

Score ranges:
- 80-100: Hot — contact immediately or within 24h
- 60-79: Warm — send personalized email, follow up within 3 days
- 40-59: Lukewarm — add to nurture sequence
- 0-39: Cold — low priority, monitor only`;

const CHURN_RISK_PROMPT = `You are an expert churn prevention analyst for Kompilot, a SaaS presence management platform.

Analyze user activity data and predict churn risk (0-100).

## Risk Factors (each adds to risk score)
- **No login in 7+ days**: +25 risk points
- **No posts scheduled**: +20 risk points  
- **No active campaigns**: +15 risk points
- **AI credits unused (100% remaining)**: +15 risk points
- **No login in 14+ days**: +35 risk points (overrides 7-day)
- **No login in 30+ days**: +50 risk points (critical)
- **Trial ending within 3 days**: +20 risk points
- **Trial ended, no subscription**: +40 risk points

## Output Format (JSON only):
{
  "users": [
    {
      "userId": "user_id",
      "riskScore": 75,
      "riskFactors": ["Inactif depuis 14 jours", "Aucune campagne active", "Crédits IA inutilisés"],
      "recommendedAction": "email_reengagement" | "personal_outreach" | "special_offer" | "monitor"
    }
  ],
  "summary": "one-paragraph overview in French"
}`;

// ── GET /api/predictive-scoring/leads ─────────────────────────────────────────

router.get('/api/predictive-scoring/leads', async (c) => {
  const blink = getBlink(c.env as unknown as Env);
  const userId = await authenticate(c, blink);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 200);
  const requestId = c.req.header('X-Request-Id') || c.req.header('Idempotency-Key') || crypto.randomUUID();
  const referenceId = `predictive-lead-scoring:${userId}:${requestId}`;

  try {
    const charged = await consumeExecuteRefund(
      blink,
      userId,
      'predictive_lead_scoring',
      'Predictive lead scoring',
      referenceId,
      async () => {
        // Fetch CRM contacts for this user
        const contacts = await blink.db.table<CrmContact>('crm_contacts').list({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          limit,
        });

        const contactList = Array.isArray(contacts) ? contacts : [];

        if (contactList.length === 0) {
          return { contacts: [], summary: 'Aucun contact CRM trouvé.', scored: 0 };
        }

        // Build contact data for AI scoring
        const now = Date.now();
        const DAY_MS = 86400000;

        const contactData = contactList.map((c: CrmContact) => {
          let tags: string[] = [];
          let custom: Record<string, unknown> = {};
          try { tags = JSON.parse(c.tags || '[]'); } catch { /* ignore */ }
          try { custom = JSON.parse(c.customFields || '{}'); } catch { /* ignore */ }

          const contactedAt = c.lastContactedAt ? new Date(c.lastContactedAt).getTime() : NaN;
          const createdAt = new Date(c.createdAt).getTime();
          const daysSinceContact = Number.isFinite(contactedAt) ? Math.max(0, Math.floor((now - contactedAt) / DAY_MS)) : null;
          const daysSinceCreated = Number.isFinite(createdAt) ? Math.max(0, Math.floor((now - createdAt) / DAY_MS)) : 999;

          return {
            id: c.id,
            email: c.email,
            firstName: c.firstName || '',
            lastName: c.lastName || '',
            phone: c.phone || null,
            company: c.company || null,
            tags,
            customFields: custom,
            source: c.source || 'manual',
            status: c.status || 'active',
            hasNotes: !!(c.notes && c.notes.trim().length > 0),
            daysSinceContact,
            daysSinceCreated,
            lastContactedAt: c.lastContactedAt || null,
            createdAt: c.createdAt,
          };
        });

        // Batch into chunks of 20 for AI processing
        const chunkSize = 20;
        let allScores: LeadScore[] = [];

        for (let i = 0; i < contactData.length; i += chunkSize) {
          const chunk = contactData.slice(i, i + chunkSize);
          // Compute basic rule-based pre-scores for the AI to refine
          const preScores = chunk.map((c: any) => {
            let score = 30; // baseline
            if (c.phone) score += 15;
            if (c.company) score += 10;
            if (c.hasNotes) score += 10;
            if (c.tags?.length > 0) score += 5;
            if (c.source === 'widget' || c.source === 'form_submission') score += 15;
            if (c.daysSinceContact !== null && c.daysSinceContact <= 7) score += 15;
            if (c.daysSinceCreated <= 7) score += 10;
            return { ...c, ruleBasedScore: Math.min(100, score) };
          });

          try {
            const { text: aiResponse } = await blink.ai.generateText({
              messages: [
                { role: 'system', content: LEAD_SCORING_PROMPT },
                {
                  role: 'user',
                  content: `## Contacts CRM (avec pré-scores basés sur des règles)\n\n${JSON.stringify(preScores, null, 2)}\n\nAnalyse ces contacts et retourne le JSON de scoring.`,
                },
              ],
              temperature: 0.2,
            });

            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              const validIds = new Set(chunk.map((contact: any) => contact.id));
              const scores: LeadScore[] = (parsed.contacts ?? []).filter((s: any) => validIds.has(s.contactId)).map((s: any) => ({
                contactId: s.contactId,
                email: s.email ?? '',
                name: (s.name ?? [s.firstName, s.lastName].filter(Boolean).join(' ')) || '',
                score: Math.max(0, Math.min(100, Math.round(s.score ?? 50))),
                topSignals: Array.isArray(s.topSignals) ? s.topSignals : [],
                recommendedAction: s.recommendedAction ?? 'send_email',
              }));
              const returnedIds = new Set(scores.map(score => score.contactId));
              const missing = preScores.filter((contact: any) => !returnedIds.has(contact.id));
              allScores = allScores.concat(scores, missing.map((c: any) => ({ contactId: c.id, email: c.email, name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email, score: c.ruleBasedScore, topSignals: ['Score de secours déterministe'], recommendedAction: c.ruleBasedScore >= 80 ? 'call_immediately' : c.ruleBasedScore >= 60 ? 'send_email' : 'add_to_nurture' })));
            }
          } catch (aiErr: any) {
            console.error(`[PredictiveScoring] AI scoring failed for chunk ${i}:`, aiErr.message);
            // Fallback: use rule-based scores
            const fallback: LeadScore[] = preScores.map((c: any) => ({
              contactId: c.id,
              email: c.email,
              name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email,
              score: Math.max(0, Math.min(100, c.ruleBasedScore)),
              topSignals: [
                c.phone ? 'A un numéro de téléphone' : null,
                c.company ? `Entreprise: ${c.company}` : null,
                c.source !== 'manual' ? `Source: ${c.source}` : null,
                c.hasNotes ? 'A des notes' : null,
              ].filter(Boolean) as string[],
              recommendedAction: c.ruleBasedScore >= 80 ? 'call_immediately' :
                c.ruleBasedScore >= 60 ? 'send_email' :
                c.ruleBasedScore >= 40 ? 'add_to_nurture' : 'low_priority',
            }));
            allScores = allScores.concat(fallback);
          }
        }

        // Sort by score descending
        allScores.sort((a, b) => b.score - a.score);

        // Build summary
        const hotCount = allScores.filter(s => s.score >= 80).length;
        const warmCount = allScores.filter(s => s.score >= 60 && s.score < 80).length;

        return {
          contacts: allScores,
          scored: allScores.length,
          breakdown: {
            hot: hotCount,
            warm: warmCount,
            lukewarm: allScores.filter(s => s.score >= 40 && s.score < 60).length,
            cold: allScores.filter(s => s.score < 40).length,
          },
          summary: `${allScores.length} contacts analysés. ${hotCount} leads chauds, ${warmCount} leads tièdes.`,
        };
      },
      'ai',
      { provider: 'blink-ai', route: 'predictiveScoring.leads' },
    );
    return c.json({ ...charged.result, creditsLeft: charged.balanceAfter });
  } catch (err: any) {
    console.error('[PredictiveScoring] leads error:', err.message);
    if (err?.message === 'Insufficient credits') return c.json({ error: 'NO_CREDITS', message: 'Crédits insuffisants.', creditsLeft: 0 }, 402);
    // Scores are returned inline and never persisted: no durable result to reload.
    if (isIdempotentReplayError(err)) return c.json(replayConflictBody(err, 'scoring prédictif'), 409);
    return c.json({ error: err.message }, 500);
  }
});

// ── GET /api/predictive-scoring/churn-risk ────────────────────────────────────

router.get('/api/predictive-scoring/churn-risk', async (c) => {
  const blink = getBlink(c.env as unknown as Env);
  const userId = await authenticate(c, blink);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const now = Date.now();
    const DAY_MS = 86400000;

    // Fetch all users
    const allUsers = await blink.db.table('users').list({ limit: 500 });
    const userList = Array.isArray(allUsers) ? allUsers : [];

    const atRisk: ChurnRiskEntry[] = [];

    for (const user of userList as any[]) {
      if (!user.email) continue;

      const riskFactors: string[] = [];
      let riskScore = 0;

      // 1. Login recency
      const lastSignIn = user.lastSignIn ? new Date(user.lastSignIn).getTime() : null;
      const daysSinceLogin = lastSignIn ? Math.floor((now - lastSignIn) / DAY_MS) : 999;

      if (daysSinceLogin >= 30) {
        riskScore += 50;
        riskFactors.push(`Inactif depuis ${daysSinceLogin} jours`);
      } else if (daysSinceLogin >= 14) {
        riskScore += 35;
        riskFactors.push(`Inactif depuis ${daysSinceLogin} jours`);
      } else if (daysSinceLogin >= 7) {
        riskScore += 25;
        riskFactors.push(`Inactif depuis ${daysSinceLogin} jours`);
      }

      // 2. Trial status
      if (user.trialEnd) {
        const trialEnd = new Date(user.trialEnd).getTime();
        const daysUntilTrialEnd = Math.floor((trialEnd - now) / DAY_MS);

        if (daysUntilTrialEnd < 0) {
          // Trial ended
          const role = user.role || '';
          // eslint-disable-next-line eqeqeq
          if (role == 'starter' || role == 'free') {
            riskScore += 40;
            riskFactors.push('Période d\'essai terminée sans abonnement');
          }
        } else if (daysUntilTrialEnd <= 3) {
          riskScore += 20;
          riskFactors.push(`Période d\'essai se termine dans ${daysUntilTrialEnd} jour(s)`);
        }
      }

      // 3. No posts scheduled — check scheduled_posts
      try {
        const posts = await blink.db.table('scheduled_posts').list({
          where: { userId: user.id },
          limit: 1,
        });
        if ((Array.isArray(posts) ? posts : []).length === 0) {
          riskScore += 20;
          riskFactors.push('Aucun post programmé');
        }
      } catch {
        // Best-effort
      }

      // 4. No active campaigns
      try {
        const campaigns = await blink.db.table('campaigns').list({
          where: { userId: user.id, status: 'active' },
          limit: 1,
        });
        if ((Array.isArray(campaigns) ? campaigns : []).length === 0) {
          riskScore += 15;
          riskFactors.push('Aucune campagne active');
        }
      } catch {
        // Best-effort
      }

      // 5. AI credits unused — read the canonical ledger, never establishments.aiCreditsUsed.
      try {
        const ledger = await blink.db.sql<{ total: number; count: number }>(
          `SELECT COALESCE(SUM(credits_delta), 0) AS total, COUNT(*) AS count
           FROM credit_transactions
           WHERE user_id = ? AND COALESCE(credit_type, 'ai') = 'ai'`,
          [user.id],
        );
        const hasAiActivity = Number(ledger.rows[0]?.count ?? 0) > 0;
        const balance = Number(ledger.rows[0]?.total ?? 0);
        if (hasAiActivity && balance > 0) {
          riskScore += 15;
          riskFactors.push('Crédits IA disponibles mais inutilisés récemment');
        }
      } catch {
        // Best-effort
      }

      // Clamp risk score
      riskScore = Math.max(0, Math.min(100, riskScore));

      // Only include users with risk score > 0
      if (riskScore > 0) {
        let recommendedAction = 'monitor';
        if (riskScore >= 70) recommendedAction = 'personal_outreach';
        else if (riskScore >= 40) recommendedAction = 'email_reengagement';
        else if (riskScore >= 20) recommendedAction = 'monitor';

        atRisk.push({
          userId: user.id,
          email: user.email,
          riskScore,
          riskFactors,
          recommendedAction,
        });
      }
    }

    // Sort by risk score descending
    atRisk.sort((a, b) => b.riskScore - a.riskScore);

    const highRisk = atRisk.filter(u => u.riskScore >= 70).length;
    const mediumRisk = atRisk.filter(u => u.riskScore >= 40 && u.riskScore < 70).length;

    return c.json({
      users: atRisk,
      totalUsers: userList.length,
      atRiskCount: atRisk.length,
      breakdown: {
        high: highRisk,
        medium: mediumRisk,
        low: atRisk.filter(u => u.riskScore < 40).length,
      },
      summary: `${atRisk.length}/${userList.length} utilisateurs présentent un risque de churn (${highRisk} élevé, ${mediumRisk} moyen).`,
    });
  } catch (err: any) {
    console.error('[PredictiveScoring] churn-risk error:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ── GET /api/predictive-scoring/campaign-health ───────────────────────────────

router.get('/api/predictive-scoring/campaign-health', async (c) => {
  const blink = getBlink(c.env as unknown as Env);
  const userId = await authenticate(c, blink);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {

    // Fetch campaigns and performance data
    const campaigns = await blink.db.table('campaigns').list({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      limit: 100,
    });

    const campaignList = Array.isArray(campaigns) ? campaigns : [];

    if (campaignList.length === 0) {
      return c.json({
        campaigns: [],
        summary: 'Aucune campagne trouvée.',
        analyzed: 0,
      });
    }

    // Fetch campaign performance data
    const performance = await blink.db.table('campaign_performance').list({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      limit: 100,
    });

    const perfList = Array.isArray(performance) ? performance : [];

    // Build campaign health entries using rule-based scoring
    const campaignHealth: CampaignHealthEntry[] = campaignList.map((c: any) => {
      const sentCount = Number(c.sentCount) || 0;
      const openCount = Number(c.openCount) || 0;
      const clickCount = Number(c.clickCount) || 0;
      const bounceCount = Number(c.bounceCount) || 0;
      const unsubscribeCount = Number(c.unsubscribeCount) || 0;

      // Calculate engagement rates
      const openRate = sentCount > 0 ? openCount / sentCount : 0;
      const clickRate = sentCount > 0 ? clickCount / sentCount : 0;
      const bounceRate = sentCount > 0 ? bounceCount / sentCount : 0;

      // Rule-based ROAS prediction (simplified model)
      let predictedRoas = 0;
      let confidence = 50;
      let recommendation = '';

      if (sentCount === 0) {
        predictedRoas = 0;
        confidence = 30;
        recommendation = 'Campagne non envoyée — envoyer pour collecter des données.';
      } else if (openRate > 0.30 && clickRate > 0.05) {
        predictedRoas = 4.5 + (clickRate * 20);
        confidence = 75;
        recommendation = '✅ Campagne performante. Augmenter le budget ou dupliquer.';
      } else if (openRate > 0.20 && clickRate > 0.02) {
        predictedRoas = 2.5 + (clickRate * 15);
        confidence = 65;
        recommendation = '📈 Campagne correcte. Optimiser le contenu pour améliorer le taux de clic.';
      } else if (openRate > 0.10) {
        predictedRoas = 1.0 + (clickRate * 10);
        confidence = 55;
        recommendation = '⚠️ Performance faible. Tester de nouveaux sujets d\'email.';
      } else if (sentCount > 0) {
        predictedRoas = 0.5;
        confidence = 50;
        recommendation = '🔴 Campagne sous-performante. Revoir le sujet, l\'expéditeur et le contenu.';
      }

      if (bounceRate > 0.05) {
        recommendation += ' Nettoyer la liste de contacts (taux de rebond élevé).';
        predictedRoas *= 0.7;
      }
      if (unsubscribeCount > 0) {
        predictedRoas *= 0.9;
      }

      // Adjust with campaign performance data if available
      const relatedPerf = perfList.filter((p: any) => p.campaignId === c.id);
      if (relatedPerf.length > 0) {
        const avgEngagement = relatedPerf.reduce(
          (sum: number, p: any) => sum + (Number(p.avgEngagementRate) || 0),
          0,
        ) / relatedPerf.length;
        // Boost confidence and adjust ROAS based on real data
        confidence = Math.min(95, confidence + 15);
        predictedRoas = predictedRoas * 0.5 + (avgEngagement * 50) * 0.5;
      }

      return {
        campaignId: c.id,
        name: c.name || 'Sans nom',
        predictedRoas: Math.round(predictedRoas * 100) / 100,
        confidence,
        recommendation,
      };
    });

    // Sort by predicted ROAS ascending (worst first)
    campaignHealth.sort((a, b) => a.predictedRoas - b.predictedRoas);

    const underperforming = campaignHealth.filter(c => c.predictedRoas < 2.0).length;
    const healthy = campaignHealth.filter(c => c.predictedRoas >= 3.0).length;

    return c.json({
      campaigns: campaignHealth,
      analyzed: campaignHealth.length,
      breakdown: {
        underperforming,
        average: campaignHealth.filter(c => c.predictedRoas >= 2.0 && c.predictedRoas < 3.0).length,
        healthy,
      },
      summary: `${underperforming} campagne(s) sous-performante(s) détectée(s), ${healthy} en bonne santé.`,
    });
  } catch (err: any) {
    console.error('[PredictiveScoring] campaign-health error:', err.message);
    return c.json({ error: err.message }, 500);
  }
});
