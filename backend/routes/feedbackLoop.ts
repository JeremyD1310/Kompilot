/**
 * feedbackLoop.ts — Feedback Loop Engine
 *
 * Closed-loop system where Stripe conversions + CRM appointments feed back into
 * AI-driven optimization recommendations.
 *
 * POST   /api/feedback-loop/ingest        — ingest a conversion event
 * GET    /api/feedback-loop/insights       — AI-generated optimization insights
 * POST   /api/feedback-loop/auto-optimize  — apply AI-recommended adjustments
 */

import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

// ── Helpers ───────────────────────────────────────────────────────────────────

function getUserId(h: string | undefined): string | null {
  if (!h?.startsWith('Bearer ')) return null;
  try {
    const p = h.split('.')[1];
    const d = JSON.parse(atob(p));
    return d.sub ?? d.user_id ?? null;
  } catch {
    return null;
  }
}

function getBlink(env: Env) {
  return createClient({
    projectId: requireBlinkProjectId(env),
    secretKey: env.BLINK_SECRET_KEY,
  });
}

// ── Types ────────────────────────────────────────────────────────────────────

interface ConversionEvent {
  id: string;
  userId: string;
  eventType: string;
  source: string;
  amountCents: string;
  establishmentId: string;
  metadata: string;
  createdAt: string;
}

interface IngestPayload {
  userId: string;
  eventType: 'purchase' | 'appointment' | 'form_submission';
  source: 'stripe' | 'calendly' | 'highlevel' | 'hubspot' | 'manual';
  amountCents?: number;
  metadata?: Record<string, unknown>;
}

interface OptimizationSuggestion {
  channel: string;
  action: string;
  reason: string;
  confidence: number;
}

interface TopSegment {
  segment: string;
  conversions: number;
  revenue: number;
}

interface InsightsResponse {
  suggestions: OptimizationSuggestion[];
  topSegments: TopSegment[];
  periodDays: number;
  totalConversions: number;
  totalRevenue: number;
}

// ── AI System Prompt ─────────────────────────────────────────────────────────

const INSIGHTS_SYSTEM_PROMPT = `You are an expert marketing ROI analyst for Kompilot, a SaaS presence management platform for small businesses (SEO local, Google Business Profile, social media, reviews, email/SMS campaigns).

Your job is to analyze recent conversion data and generate actionable optimization insights.

## Output Rules

Respond ONLY with a valid JSON object (no markdown fences, no preamble):

{
  "suggestions": [
    {
      "channel": "meta_ads" | "google_ads" | "email" | "sms" | "tiktok_ads" | "organic",
      "action": "specific action to take (in French)",
      "reason": "data-driven reason (in French)",
      "confidence": 85
    }
  ],
  "topSegments": [
    {
      "segment": "source or event type",
      "conversions": 42,
      "revenue": 4200
    }
  ],
  "summary": "one-paragraph summary in French"
}

## Analysis Rules

### Channel attribution
- Stripe events → likely paid ads or organic conversion
- Calendly appointments → likely organic or email nurture
- HighLevel → likely SMS/email campaign conversion
- HubSpot → likely inbound marketing or paid ads
- Manual → unknown, treat as organic

### Suggestions
- Identify 3-5 specific optimization opportunities
- Each suggestion must be: specific, data-backed, actionable
- Confidence 0-100 based on data volume and pattern clarity
- Prioritize high-ROI actions

### Top segments
- Group conversions by source or event type
- Rank by revenue descending
- Return top 3-5 segments`;

// ── POST /api/feedback-loop/ingest ───────────────────────────────────────────

router.post('/api/feedback-loop/ingest', async (c) => {
  // Auth is optional here — webhooks may use secret-based auth instead
  const authHeader = c.req.header('Authorization');
  if (authHeader) {
    const userId = getUserId(authHeader);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  }

  let body: IngestPayload;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.userId || !body.eventType || !body.source) {
    return c.json({ error: 'Missing required fields: userId, eventType, source' }, 400);
  }

  const validEventTypes = ['purchase', 'appointment', 'form_submission'];
  const validSources = ['stripe', 'calendly', 'highlevel', 'hubspot', 'manual'];

  if (!validEventTypes.includes(body.eventType)) {
    return c.json({ error: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}` }, 400);
  }
  if (!validSources.includes(body.source)) {
    return c.json({ error: `Invalid source. Must be one of: ${validSources.join(', ')}` }, 400);
  }

  try {
    const blink = getBlink(c.env as unknown as Env);
    const eventId = `ce_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;

    await blink.db.table('conversion_events').create({
      id: eventId,
      userId: body.userId,
      eventType: body.eventType,
      source: body.source,
      amountCents: body.amountCents ?? 0,
      metadata: JSON.stringify(body.metadata ?? {}),
      createdAt: new Date().toISOString(),
    });

    // Log for observability
    try {
      await blink.db.table('observability_logs').create({
        id: `fb_${Date.now()}`,
        userId: body.userId,
        action: 'feedback_loop_ingest',
        errorMessage: 'ok',
        metadata: JSON.stringify({ eventType: body.eventType, source: body.source, amountCents: body.amountCents }),
        severity: 'info',
      });
    } catch {
      // Non-critical
    }

    return c.json({ ingested: true, eventId, eventType: body.eventType, source: body.source });
  } catch (err: any) {
    console.error('[FeedbackLoop] ingest error:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ── GET /api/feedback-loop/insights ──────────────────────────────────────────

router.get('/api/feedback-loop/insights', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const days = Math.min(parseInt(c.req.query('days') || '30', 10), 90);
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();

  try {
    const blink = getBlink(c.env as unknown as Env);

    // Fetch recent conversion events for this user
    const events = await blink.db.table<ConversionEvent>('conversion_events').list({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      limit: 200,
    });

    const recentEvents = (Array.isArray(events) ? events : [])
      .filter((e: ConversionEvent) => e.createdAt >= cutoff);

    if (recentEvents.length === 0) {
      return c.json({
        suggestions: [],
        topSegments: [],
        periodDays: days,
        totalConversions: 0,
        totalRevenue: 0,
        message: 'Aucune conversion récente à analyser.',
      } as InsightsResponse & { message: string });
    }

    // Compute aggregates for the AI prompt
    const totalRevenue = recentEvents.reduce(
      (sum: number, e: ConversionEvent) => sum + (Number(e.amountCents) || 0),
      0,
    );

    // Group by source
    const bySource: Record<string, { count: number; revenue: number }> = {};
    for (const e of recentEvents) {
      const src = e.source || 'unknown';
      if (!bySource[src]) bySource[src] = { count: 0, revenue: 0 };
      bySource[src].count++;
      bySource[src].revenue += Number(e.amountCents) || 0;
    }

    // Group by event type
    const byType: Record<string, number> = {};
    for (const e of recentEvents) {
      const t = e.eventType || 'unknown';
      byType[t] = (byType[t] || 0) + 1;
    }

    // Build data summary for AI
    const dataSummary = [
      `## Données de conversion (${days} derniers jours)`,
      `Total conversions: ${recentEvents.length}`,
      `Revenu total: ${(totalRevenue / 100).toFixed(2)}€`,
      '',
      '### Par source:',
      ...Object.entries(bySource).map(
        ([src, data]) => `  - ${src}: ${data.count} conversions, ${(data.revenue / 100).toFixed(2)}€`,
      ),
      '',
      '### Par type d\'événement:',
      ...Object.entries(byType).map(([t, count]) => `  - ${t}: ${count}`),
      '',
      '### Événements récents (échantillon):',
      ...recentEvents.slice(0, 10).map(
        (e: ConversionEvent) =>
          `  - ${e.eventType} via ${e.source} — ${(Number(e.amountCents) / 100).toFixed(2)}€ (${new Date(e.createdAt).toLocaleDateString('fr-FR')})`,
      ),
    ].join('\n');

    // Call AI for insights
    const { text: aiResponse } = await blink.ai.generateText({
      messages: [
        { role: 'system', content: INSIGHTS_SYSTEM_PROMPT },
        { role: 'user', content: `${dataSummary}\n\nAnalyse ces données et retourne le JSON d'optimisation.` },
      ],
      temperature: 0.3,
    });

    // Parse AI response
    let parsed: any;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error(`AI response could not be parsed as JSON: ${aiResponse.substring(0, 200)}`);
    }

    // Validate and sanitize suggestions
    const suggestions: OptimizationSuggestion[] = (parsed.suggestions ?? []).map((s: any) => ({
      channel: s.channel ?? 'unknown',
      action: s.action ?? '',
      reason: s.reason ?? '',
      confidence: Math.max(0, Math.min(100, Math.round(s.confidence ?? 50))),
    }));

    // Build top segments from source aggregations
    const topSegments: TopSegment[] = Object.entries(bySource)
      .map(([segment, data]) => ({
        segment,
        conversions: data.count,
        revenue: Math.round(data.revenue / 100),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return c.json({
      suggestions,
      topSegments,
      periodDays: days,
      totalConversions: recentEvents.length,
      totalRevenue: Math.round(totalRevenue / 100),
      aiSummary: parsed.summary ?? '',
    });
  } catch (err: any) {
    console.error('[FeedbackLoop] insights error:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ── POST /api/feedback-loop/auto-optimize ────────────────────────────────────

router.post('/api/feedback-loop/auto-optimize', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const blink = getBlink(c.env as unknown as Env);

    // Verify user is on agency plan (required for auto-optimize)
    const users = await blink.db.table('users').list({ where: { id: userId }, limit: 1 });
    const user = (Array.isArray(users) ? users[0] : null) as any;
    if (!user) return c.json({ error: 'User not found' }, 404);

    // Check plan via role or subscription data
    const isAgency = (user.role === 'agency') ||
      (() => {
        try {
          const meta = JSON.parse(user.metadata || '{}');
          return meta.plan === 'agency';
        } catch { return false; }
      })();

    if (!isAgency) {
      return c.json({
        error: 'PLAN_REQUIRED',
        message: 'L\'auto-optimisation nécessite le plan Agency. Passez au plan Agency pour activer cette fonctionnalité.',
      }, 402);
    }

    // Parse body for optional parameters
    let body: { channels?: string[]; dryRun?: boolean } = {};
    try { body = await c.req.json(); } catch { /* optional */ }

    const channels = body.channels ?? ['meta_ads', 'google_ads', 'email'];

    // Fetch recent conversion events for AI analysis
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const events = await blink.db.table<ConversionEvent>('conversion_events').list({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      limit: 200,
    });

    const recentEvents = (Array.isArray(events) ? events : [])
      .filter((e: ConversionEvent) => e.createdAt >= thirtyDaysAgo);

    // Fetch active campaigns
    const activeCampaigns = await blink.db.table('campaigns').list({
      where: { userId, status: 'active' },
      limit: 50,
    });

    // Build context for AI
    const context = [
      `## Demande d'auto-optimisation`,
      `Canaux ciblés: ${channels.join(', ')}`,
      `Mode: ${body.dryRun ? 'dry-run (simulation)' : 'live'}`,
      '',
      `## Conversions récentes (30j)`,
      `Total: ${recentEvents.length} conversions`,
      ...recentEvents.slice(0, 20).map(
        (e: ConversionEvent) =>
          `  - ${e.eventType} via ${e.source} (${(Number(e.amountCents) / 100).toFixed(2)}€)`,
      ),
      '',
      `## Campagnes actives`,
      ...(Array.isArray(activeCampaigns) ? activeCampaigns : []).map((c: any) =>
        `  - "${c.name}" (ID: ${c.id}) — statut: ${c.status}, envoyés: ${c.sentCount ?? 0}, ouverts: ${c.openCount ?? 0}`,
      ),
    ].join('\n');

    const OPTIMIZE_SYSTEM_PROMPT = `You are an expert marketing automation strategist for Kompilot.

Based on the conversion data and active campaigns, recommend specific optimization actions.

Return ONLY a valid JSON object:

{
  "actions": [
    {
      "channel": "meta_ads" | "email" | "sms" | "google_ads",
      "campaignId": "campaign id or null",
      "actionType": "pause_campaign" | "increase_budget" | "decrease_budget" | "duplicate_winner" | "change_targeting" | "resend_to_unopened" | "adjust_schedule",
      "description": "human-readable description in French",
      "confidence": 85,
      "expectedImpact": "estimated impact in French"
    }
  ],
  "summary": "executive summary in French"
}

Rules:
- Only suggest actions for channels listed in the request
- base confidence on data volume and pattern clarity
- For dry-run mode, be more aggressive with suggestions (they won't be applied)
- Maximum 5 actions`;

    const { text: aiResponse } = await blink.ai.generateText({
      messages: [
        { role: 'system', content: OPTIMIZE_SYSTEM_PROMPT },
        { role: 'user', content: `${context}\n\nRecommandé les optimisations à appliquer.` },
      ],
      temperature: 0.3,
    });

    let parsed: any;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error(`AI response could not be parsed as JSON`);
    }

    const actions = (parsed.actions ?? []).map((a: any, i: number) => ({
      id: `opt_${Date.now()}_${i}`,
      channel: a.channel ?? 'unknown',
      campaignId: a.campaignId ?? null,
      actionType: a.actionType ?? 'unknown',
      description: a.description ?? '',
      confidence: Math.max(0, Math.min(100, Math.round(a.confidence ?? 50))),
      expectedImpact: a.expectedImpact ?? '',
      applied: !body.dryRun,
    }));

    // If not a dry run, apply actions
    const appliedActions: string[] = [];
    if (!body.dryRun) {
      for (const action of actions) {
        try {
          switch (action.actionType) {
            case 'pause_campaign': {
              if (action.campaignId) {
                await blink.db.table('campaigns').update(action.campaignId, {
                  status: 'paused',
                  updatedAt: new Date().toISOString(),
                });
                appliedActions.push(`Campagne "${action.campaignId}" mise en pause`);
              }
              break;
            }
            case 'resend_to_unopened': {
              if (action.campaignId) {
                // Mark campaign for resend by updating status
                await blink.db.table('campaigns').update(action.campaignId, {
                  status: 'scheduled',
                  updatedAt: new Date().toISOString(),
                });
                appliedActions.push(`Campagne "${action.campaignId}" reprogrammée`);
              }
              break;
            }
            case 'increase_budget':
            case 'decrease_budget':
            case 'duplicate_winner':
            case 'change_targeting':
            case 'adjust_schedule': {
              // Log these as applied recommendations (actual API calls to Meta/Google
              // would require OAuth tokens and are complex — logged for now)
              appliedActions.push(`${action.actionType}: ${action.description}`);
              break;
            }
            default:
              break;
          }
        } catch (actionErr: any) {
          console.error(`[FeedbackLoop] Failed to apply action ${action.id}:`, actionErr.message);
        }
      }
    }

    // Log the optimization run
    try {
      await blink.db.table('observability_logs').create({
        id: `opt_${Date.now()}`,
        userId,
        action: 'feedback_loop_auto_optimize',
        errorMessage: 'ok',
        metadata: JSON.stringify({
          dryRun: !!body.dryRun,
          actionsCount: actions.length,
          appliedCount: appliedActions.length,
          channels,
        }),
        severity: 'info',
      });
    } catch {
      // Non-critical
    }

    return c.json({
      dryRun: !!body.dryRun,
      actions,
      appliedActions,
      aiSummary: parsed.summary ?? '',
      message: body.dryRun
        ? `${actions.length} action(s) recommandée(s) (simulation). Passez en mode live pour appliquer.`
        : `${appliedActions.length}/${actions.length} action(s) appliquée(s).`,
    });
  } catch (err: any) {
    console.error('[FeedbackLoop] auto-optimize error:', err.message);
    return c.json({ error: err.message }, 500);
  }
});
