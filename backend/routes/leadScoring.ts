/**
 * leadScoring.ts — AI Lead Scoring & Qualification
 *
 * Analyses les threads détectés (Reddit, forums) avec blink.ai pour qualifier
 * l'intention d'achat, scorer le lead (0-100) et déclencher des alertes.
 *
 * POST   /api/lead-scoring/score-thread/:threadId  — AI scoring d'un thread
 * GET    /api/lead-scoring/threads                  — threads scorés avec filtres
 * GET    /api/lead-scoring/stats                    — dashboard stats
 * POST   /api/lead-scoring/alert                    — alerte leads > 70
 */

import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

async function authenticate(c: any, blink: any) {
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  return auth.valid && auth.userId ? auth.userId : null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseJsonArray(value: unknown): string[] {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string').slice(0, 5) : [];
  } catch { return []; }
}

function getBlink(env: Env) {
  return createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });
}

// ── Types ────────────────────────────────────────────────────────────────────

interface DetectedThread {
  id: string;
  trackerId: string;
  userId: string;
  title: string;
  url: string;
  subreddit: string;
  author: string;
  content: string;
  keywordMatched: string;
  competitorMatched: string;
  intentType: string;
  geoScore: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface LeadScoreResult {
  intent_type: 'purchase_intent' | 'service_request' | 'complaint' | 'recommendation_request' | 'general_discussion';
  lead_score: number;
  key_signals: string[];
  recommended_action: 'contact_immediately' | 'monitor' | 'nurture' | 'ignore';
  reasoning: string;
  confidence?: number;
}

// ── AI System Prompt ─────────────────────────────────────────────────────────

const SCORING_VERSION = 'lead_scoring_v1';
const PROMPT_VERSION = 'lead_scoring_prompt_v2';
const LEAD_SCORING_SYSTEM_PROMPT = `You are an expert B2B lead qualification analyst for Kompilot, a SaaS presence management platform for small businesses (SEO local, gestion Google Business Profile, réseaux sociaux, avis clients, campagnes email/SMS).

Return a confidence value from 0 to 100. Confidence must be reduced when the content is short, ambiguous, or lacks a commercial signal.

Your job is to analyse forum/Reddit threads and classify the lead quality for Kompilot's sales team.

## Classification Rules

### Intent Types
- **purchase_intent** — The person is actively looking to buy or subscribe to a presence management / SEO local / social media tool. Mentions budget, timeline, or comparison between tools.
- **service_request** — The person needs help with a specific local SEO, Google My Business, or social media task that Kompilot could fulfill.
- **complaint** — The person is complaining about a competitor or current tool (BrightLocal, Yext, Semrush local, etc.). Opportunity to offer Kompilot as alternative.
- **recommendation_request** — The person is asking for tool recommendations in the local SEO / social media management space.
- **general_discussion** — General chat about local SEO, marketing, or small business topics with no clear buying signal.

### Lead Score (0–100)
Score based on urgency, buying signals, and fit:
- **80–100 (Hot)** — Explicit buying intent, mentions budget, asks for demo/pricing, urgent timeline, clearly fits Kompilot's ICP (small business owner, agency, franchisé)
- **60–79 (Warm)** — Strong need expressed, comparing tools, asking for recommendations, or complaining about competitor. Likely to convert with nurturing.
- **40–59 (Lukewarm)** — Mild interest, relevant topic but no urgency. May convert with long-term nurturing.
- **20–39 (Cool)** — Tangentially relevant. Worth monitoring but low priority.
- **0–19 (Cold)** — Not a lead. General discussion with no commercial angle.

### Key Signals
List 2-5 specific phrases, keywords, or patterns from the text that indicate the intent (e.g. "looking for a tool to manage my Google reviews", "BrightLocal is too expensive").

### Recommended Action
- **contact_immediately** — Score ≥ 80: reach out within hours
- **monitor** — Score 60–79: add to watchlist, engage if appropriate
- **nurture** — Score 40–59: add to long-term nurturing sequence
- **ignore** — Score < 40: not a qualified lead

## Output Format

Respond ONLY with a valid JSON object (no markdown, no code fences):

{
  "intent_type": "purchase_intent",
  "lead_score": 85,
  "key_signals": ["looking for a Google My Business management tool", "budget around 50€/month"],
  "recommended_action": "contact_immediately",
  "reasoning": "The user explicitly asks for a GMB management tool with a stated budget, indicating strong purchase intent."
}`;

// ── POST /api/lead-scoring/score-thread/:threadId ───────────────────────────

router.post('/api/lead-scoring/score-thread/:threadId', async (c) => {
  const blink = getBlink(c.env as unknown as Env);
  const userId = await authenticate(c, blink);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const threadId = c.req.param('threadId');
  if (!threadId) return c.json({ error: 'threadId is required' }, 400);

  try {
    // Fetch the thread
    const thread = await blink.db.table<DetectedThread>('detected_threads').get(threadId);
    if (!thread) return c.json({ error: 'Thread not found' }, 404);

    // Check ownership
    if (thread.userId !== userId) {
      return c.json({ error: 'Forbidden: this thread belongs to another user' }, 403);
    }

    // Build the analysis prompt with thread data
    const analysisPrompt = [
      `## Thread to Analyse`,
      `**Title:** ${thread.title}`,
      `**Subreddit/Source:** ${thread.subreddit}`,
      `**Author:** ${thread.author}`,
      `**Matched Keyword:** ${thread.keywordMatched || 'N/A'}`,
      `**Competitor Matched:** ${thread.competitorMatched || 'N/A'}`,
      ``,
      `**Content:**`,
      thread.content || '(no content)',
      ``,
      `Analyse this thread and return the lead qualification JSON.`,
    ].join('\n');

    // Call AI for scoring
    const { text: aiResponse } = await blink.ai.generateText({
      messages: [
        { role: 'system', content: LEAD_SCORING_SYSTEM_PROMPT },
        { role: 'user', content: analysisPrompt },
      ],
      temperature: 0.3,
    });

    // Parse AI response — handle possible markdown code fences
    let scoreResult: LeadScoreResult;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      scoreResult = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error(`AI response could not be parsed as JSON: ${aiResponse.substring(0, 200)}`);
    }

    // Validate enums and clamp all model-controlled values before persistence.
    const allowedIntent = ['purchase_intent', 'service_request', 'complaint', 'recommendation_request', 'general_discussion'];
    const allowedActions = ['contact_immediately', 'monitor', 'nurture', 'ignore'];
    if (!allowedIntent.includes(scoreResult.intent_type) || typeof scoreResult.lead_score !== 'number') {
      throw new Error(`AI response missing valid required fields: ${JSON.stringify(scoreResult)}`);
    }
    if (!allowedActions.includes(scoreResult.recommended_action)) scoreResult.recommended_action = 'monitor';
    scoreResult.key_signals = Array.isArray(scoreResult.key_signals) ? scoreResult.key_signals.filter(Boolean).slice(0, 5) : [];
    scoreResult.reasoning = String(scoreResult.reasoning || '').slice(0, 500);

    const clampedScore = Math.max(0, Math.min(100, Math.round(scoreResult.lead_score)));
    const confidence = Math.max(0, Math.min(100, Math.round(Number(scoreResult.confidence ?? 50))));

    // Update the thread with scoring results
    const scoredAt = new Date().toISOString();
    await blink.db.table('detected_threads').update(threadId, {
      intentType: scoreResult.intent_type,
      geoScore: String(clampedScore),
      confidence,
      keySignals: JSON.stringify(scoreResult.key_signals),
      reasoning: scoreResult.reasoning,
      recommendedAction: scoreResult.recommended_action,
      scoringVersion: SCORING_VERSION,
      scoringProvider: 'blink.ai',
      status: clampedScore >= 80 ? 'hot_lead' : clampedScore >= 60 ? 'warm_lead' : clampedScore >= 40 ? 'nurture' : 'scored',
      updatedAt: scoredAt,
    });
    await blink.db.table('lead_score_events').create({
      id: `score_${crypto.randomUUID()}`,
      threadId,
      userId,
      scoringVersion: SCORING_VERSION,
      promptVersion: PROMPT_VERSION,
      modelProvider: 'blink.ai',
      model: 'default',
      inputSnapshot: JSON.stringify({ title: thread.title, content: thread.content, subreddit: thread.subreddit, keywordMatched: thread.keywordMatched }),
      score: clampedScore,
      confidence,
      intentType: scoreResult.intent_type,
      keySignals: JSON.stringify(scoreResult.key_signals),
      reasoning: scoreResult.reasoning,
      recommendedAction: scoreResult.recommended_action,
      createdAt: scoredAt,
    });

    // Auto-trigger alert for hot leads (score >= 80)
    if (clampedScore >= 80) {
      try {
        await blink.db.table('notifications_queue').create({
          id: `nl_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
          userId,
          title: `🔥 Hot Lead: ${thread.title.substring(0, 80)}`,
          body: `Score ${clampedScore}/100 — ${scoreResult.intent_type.replace(/_/g, ' ')} — ${scoreResult.reasoning.substring(0, 150)}`,
          type: 'lead_alert',
          url: `/lead-scoring?thread=${threadId}`,
          status: 'sent',
          createdAt: new Date().toISOString(),
        });
      } catch {
        // Alert creation is best-effort; don't fail the scoring
      }
    }

    return c.json({
      threadId,
      score: clampedScore,
      confidence,
      intentType: scoreResult.intent_type,
      keySignals: scoreResult.key_signals,
      recommendedAction: scoreResult.recommended_action,
      reasoning: scoreResult.reasoning,
      confidence,
      status: clampedScore >= 80 ? 'hot_lead' : clampedScore >= 60 ? 'warm_lead' : clampedScore >= 40 ? 'nurture' : 'scored',
    });
  } catch (e: any) {
    console.error('[LeadScoring] score-thread error:', e.message);
    return c.json({ error: e.message }, 500);
  }
});

// ── GET /api/lead-scoring/threads ────────────────────────────────────────────

router.get('/api/lead-scoring/threads', async (c) => {
  const blink = getBlink(c.env as unknown as Env);
  const userId = await authenticate(c, blink);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const minScore = parseInt(c.req.query('minScore') || '0', 10);
    const maxScore = parseInt(c.req.query('maxScore') || '100', 10);
    const status = c.req.query('status') || '';
    const intentType = c.req.query('intentType') || '';
    const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 100);
    const offset = parseInt(c.req.query('offset') || '0', 10);

    // Fetch all threads for the user (the DB list method doesn't support complex numeric range queries easily)
    const allThreads = await blink.db.table<DetectedThread>('detected_threads').list({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      limit: 500,
    });

    const threads = Array.isArray(allThreads) ? allThreads : [];

    // Filter in-memory since SQLite REST API doesn't support numeric range comparison well
    let filtered = threads.filter((t: DetectedThread) => {
      const score = Number(t.geoScore) || 0;
      if (score === 0) return false; // only scored threads

      if (score < minScore || score > maxScore) return false;
      if (status && t.status !== status) return false;
      if (intentType && t.intentType !== intentType) return false;

      return true;
    });

    // Sort by score descending
    filtered.sort((a: DetectedThread, b: DetectedThread) => (Number(b.geoScore) || 0) - (Number(a.geoScore) || 0));

    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit);

    return c.json({
      threads: page.map((t: DetectedThread) => ({
        id: t.id,
        trackerId: t.trackerId,
        title: t.title,
        url: t.url,
        subreddit: t.subreddit,
        author: t.author,
        content: t.content,
        keywordMatched: t.keywordMatched,
        competitorMatched: t.competitorMatched,
        intentType: t.intentType,
        score: Number(t.geoScore) || 0,
        confidence: Number((t as any).confidence) || 0,
        keySignals: typeof (t as any).keySignals === 'string' ? parseJsonArray((t as any).keySignals) : [],
        reasoning: String((t as any).reasoning || ''),
        recommendedAction: String((t as any).recommendedAction || 'monitor'),
        scoringVersion: String((t as any).scoringVersion || ''),
        status: t.status,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (e: any) {
    console.error('[LeadScoring] threads error:', e.message);
    return c.json({ error: e.message }, 500);
  }
});

// ── GET /api/lead-scoring/stats ──────────────────────────────────────────────

router.get('/api/lead-scoring/stats', async (c) => {
  const blink = getBlink(c.env as unknown as Env);
  const userId = await authenticate(c, blink);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const allThreads = await blink.db.table<DetectedThread>('detected_threads').list({
      where: { userId },
      limit: 500,
    });

    const threads = Array.isArray(allThreads) ? allThreads : [];
    const totalThreads = threads.length;

    // Scored threads (score > 0)
    const scored = threads.filter((t: DetectedThread) => Number(t.geoScore) > 0);
    const scoredCount = scored.length;

    // Average score
    const avgScore = scoredCount > 0
      ? Math.round(scored.reduce((sum: number, t: DetectedThread) => sum + (Number(t.geoScore) || 0), 0) / scoredCount)
      : 0;

    // Distribution by intent_type
    const distribution: Record<string, number> = {};
    for (const t of scored) {
      const type = t.intentType || 'unknown';
      distribution[type] = (distribution[type] || 0) + 1;
    }

    // Top 5 high-potential leads
    const hotLeads = scored
      .filter((t: DetectedThread) => Number(t.geoScore) >= 60)
      .sort((a: DetectedThread, b: DetectedThread) => (Number(b.geoScore) || 0) - (Number(a.geoScore) || 0))
      .slice(0, 5)
      .map((t: DetectedThread) => ({
        id: t.id,
        title: t.title,
        subreddit: t.subreddit,
        score: Number(t.geoScore),
        intentType: t.intentType,
        status: t.status,
        createdAt: t.createdAt,
      }));

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    for (const t of threads) {
      const st = t.status || 'pending';
      statusBreakdown[st] = (statusBreakdown[st] || 0) + 1;
    }

    // Score ranges
    const hotCount = scored.filter((t: DetectedThread) => Number(t.geoScore) >= 80).length;
    const warmCount = scored.filter((t: DetectedThread) => Number(t.geoScore) >= 60 && Number(t.geoScore) < 80).length;
    const nurtureCount = scored.filter((t: DetectedThread) => Number(t.geoScore) >= 40 && Number(t.geoScore) < 60).length;
    const coldCount = scored.filter((t: DetectedThread) => Number(t.geoScore) > 0 && Number(t.geoScore) < 40).length;

    return c.json({
      overview: {
        totalThreads,
        scoredThreads: scoredCount,
        unscoredThreads: totalThreads - scoredCount,
        averageScore: avgScore,
      },
      scoreBreakdown: {
        hot: hotCount,
        warm: warmCount,
        nurture: nurtureCount,
        cold: coldCount,
      },
      intentDistribution: distribution,
      statusBreakdown,
      topLeads: hotLeads,
    });
  } catch (e: any) {
    console.error('[LeadScoring] stats error:', e.message);
    return c.json({ error: e.message }, 500);
  }
});

// ── POST /api/lead-scoring/alert ─────────────────────────────────────────────

router.post('/api/lead-scoring/alert', async (c) => {
  const blink = getBlink(c.env as unknown as Env);
  const userId = await authenticate(c, blink);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    // Get optional filters from body
    let body: { threadId?: string; minScore?: number } = {};
    try { body = await c.req.json(); } catch { /* body is optional */ }

    // Build query conditions
    const allThreads = await blink.db.table<DetectedThread>('detected_threads').list({
      where: { userId },
      limit: 500,
    });

    const threads = Array.isArray(allThreads) ? allThreads : [];

    // If a specific threadId is provided, only alert for that one
    let candidates: DetectedThread[];

    if (body.threadId) {
      candidates = threads.filter((t: DetectedThread) => t.id === body.threadId);
      if (candidates.length === 0) {
        return c.json({ error: 'Thread not found' }, 404);
      }
    } else {
      const minScore = body.minScore ?? 70;
      candidates = threads.filter((t: DetectedThread) => Number(t.geoScore) >= minScore);
    }

    if (candidates.length === 0) {
      return c.json({ alerted: 0, message: 'No high-potential leads found above threshold.' });
    }

    // Create notifications for each candidate
    const created: string[] = [];
    for (const thread of candidates) {
      const score = Number(thread.geoScore) || 0;
      const intentLabel = (thread.intentType || 'unknown').replace(/_/g, ' ');
      const preview = thread.content
        ? thread.content.substring(0, 120).replace(/\n/g, ' ')
        : thread.title;

      await blink.db.table('notifications_queue').create({
        id: `nl_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
        userId,
        title: `🚨 Lead ${score}/100: ${thread.title.substring(0, 80)}`,
        body: `${intentLabel} · ${thread.subreddit} · "${preview}..."`,
        type: 'lead_alert',
        url: `/lead-scoring?thread=${thread.id}`,
        status: 'sent',
        createdAt: new Date().toISOString(),
      });

      created.push(thread.id);

      // Update thread status to reflect alert was sent
      await blink.db.table('detected_threads').update(thread.id, {
        status: 'alerted',
        updatedAt: new Date().toISOString(),
      });
    }

    // Attempt to send email notification if blink.notifications is available
    let emailSent = 0;
    try {
      // Get user email
      const users = await blink.db.table('users').list({
        where: { id: userId },
        limit: 1,
      });

      const user = Array.isArray(users) && users.length > 0 ? users[0] as any : null;
      if (user?.email) {
        const leadList = candidates
          .map((t: DetectedThread) =>
            `• **${t.title}** (Score: ${Number(t.geoScore)}/100, Type: ${(t.intentType || 'N/A').replace(/_/g, ' ')}) — [Voir le thread](${t.url || '#'})`
          )
          .join('\n');

        await blink.notifications.email({
          to: user.email,
          subject: `🚨 ${candidates.length} lead(s) à fort potentiel détecté(s) — Kompilot`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0D9488;">🔥 Leads qualifiés détectés</h2>
            <p>Bonjour ${user.displayName || user.email.split('@')[0]},</p>
            <p>Nous avons détecté <strong>${candidates.length} lead(s) à fort potentiel</strong> dans vos threads surveillés :</p>
            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
              ${leadList}
            </div>
            <p>
              <a href="https://kompilot.fr/lead-scoring"
                 style="background: #0D9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                Voir tous les leads →
              </a>
            </p>
            <p style="color: #6B7280; font-size: 12px; margin-top: 24px;">
              Cet email a été généré automatiquement par Kompilot Lead Scoring.
            </p>
          </div>`,
        });
        emailSent = 1;
      }
    } catch {
      // Email is best-effort
    }

    return c.json({
      alerted: candidates.length,
      threadIds: created,
      emailSent: emailSent > 0,
      message: `${candidates.length} alert(s) created for high-potential leads.${emailSent > 0 ? ' Email notification sent.' : ''}`,
    });
  } catch (e: any) {
    console.error('[LeadScoring] alert error:', e.message);
    return c.json({ error: e.message }, 500);
  }
});
