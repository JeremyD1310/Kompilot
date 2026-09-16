/**
 * Kompilot Backend — Hono server on Cloudflare Workers
 *
 * Thin orchestrator: mounts focused route modules.
 *
 * Routes (see individual modules for details):
 *   GET  /health                        — liveness probe          (routes/ai.ts)
 *   GET  /api/ai/models                 — list task types         (routes/ai.ts)
 *   POST /api/ai/generate               — AI router               (routes/ai.ts)
 *   POST  /api/billing/portal                  — Stripe portal session       (routes/billing.ts)
 *   POST  /api/billing/apply-retention-discount — compassionate -50% 2 months (routes/billing.ts)
 *   POST  /api/billing/checkout                — Stripe checkout session      (routes/billing.ts)
 *   GET   /api/billing/status                  — subscription status          (routes/billing.ts)
 *   GET   /api/billing/invoices                — user invoice list            (routes/billing.ts)
 *   GET   /api/billing/agency/status           — agency billing mode          (routes/billing.ts)
 *   PATCH /api/billing/agency/mode             — update agency billing mode   (routes/billing.ts)
 *   GET   /api/billing/agency/sub-accounts     — sub-account consumption      (routes/billing.ts)
 *   POST /api/billing/agency/invoice-preview  — consolidated invoice preview (routes/billing.ts)
 *   POST /api/billing/change-plan             — upgrade/downgrade with proration (routes/billing/changePlan.ts)
 *   POST /api/sms/inbound                  — Twilio STOP webhook → blacklist       (routes/smsBlacklist.ts)
 *   GET  /api/sms/blacklist/check          — check phone before sending            (routes/smsBlacklist.ts)
 *   DELETE /api/sms/blacklist/:phone       — manual blacklist removal              (routes/smsBlacklist.ts)
 *   POST /api/ai/validate                  — AI content guardrails                 (routes/aiGuardrails.ts)
 *   GET  /api/quotas/status                — current quota per plan                (routes/apiQuotas.ts)
 *   POST /api/quotas/consume               — deduct quota credits                  (routes/apiQuotas.ts)
 *   POST /api/stripe-connect/create-account — create/fetch Connect Express account (routes/stripeConnect.ts)
 *   POST /api/stripe-connect/account-link  — generate onboarding Account Link URL  (routes/stripeConnect.ts)
 *   GET  /api/stripe-connect/status        — Connect account capabilities & status  (routes/stripeConnect.ts)
 *   POST /api/webhooks/stripe           — Stripe events           (routes/webhooks.ts)
 *   POST /api/webhooks/stripe/dunning   — dunning email           (routes/webhooks.ts)
 *   POST /api/webhooks/meta             — Meta events             (routes/webhooks.ts)
 *   GET  /api/webhooks/meta             — Meta challenge verify   (routes/webhooks.ts)
 *   DELETE /api/user/data               — RGPD erasure            (routes/webhooks.ts)
 *   GET  /api/scanner/quota              — free scan quota (no auth)       (routes/scanner.ts)
 *   POST /api/scanner/scan               — rate-limited scan gate           (routes/scanner.ts)
 *   POST /api/scanner/deep-scan/check    — deep scan rate-limit (auth)      (routes/scanner.ts)
 *   POST /api/scanner/raid/check         — review raid detection (auth)     (routes/scanner.ts)
 *   GET  /api/scanner/raid/state         — current raid state (auth)        (routes/scanner.ts)
 *   POST /api/scanner/raid/clear         — clear raid alert (auth)          (routes/scanner.ts)
 *
 * Funnels (routes/funnels/):
 *   GET  /api/funnels/analyze?query=&platform= — mock funnel analysis
 *   GET  /api/funnels/samples                  — sample funnels list
 *   GET  /api/funnels                          — user saved funnels (auth)
 *   POST /api/funnels                          — save funnel (auth)
 *   DELETE /api/funnels/:id                    — delete funnel (auth)
 *   POST /api/funnels/generate-swipes          — elite AI copywriter (auth)
 *   POST /api/funnels/ai-swipes               — angle-based hook gen (auth)
 *   POST /api/funnels/detect-stack            — tech stack scan (auth)
 *   PATCH /api/funnels/:id/watch              — watch toggle (auth)
 *   POST /api/funnels/analyze-full            — Meta Ads + tech + 21d filter (auth)
 *   GET  /api/funnels/:id/ghost-emails        — ghost tracking emails (auth)
 *   POST /api/funnels/:id/ghost-emails/register — register tracking address (auth)
 *   GET  /api/funnels/:id/organic             — SEO keywords + referring domains (auth)
 *   POST /api/funnels/onboarding-seed         — seed competitor funnels on signup (auth)
 *
 * Engagement (routes/engagementMetrics.ts):
 *   GET  /api/engagement/metrics?days=30       — aggregated engagement KPIs + trend
 *   GET  /api/engagement/campaigns?days=30     — campaign performance by UTM
 *   POST /api/engagement/record                — record post engagement metrics
 *   POST /api/engagement/sync-campaigns        — recompute campaign_performance
 *
 * L'Espion (routes/seoGapAnalysis.ts):
 *   POST /api/seo-gap/analyze  — AI + real-data SEO gap analysis
 *   GET  /api/seo-gap/status   — user credits + plan info
 *
 * URL-to-Video (routes/urlToVideo.ts):
 *   POST /api/url-to-video/scrape               — scrape URL + extract marketing data
 *   POST /api/url-to-video/generate              — generate video via Luma AI
 *   GET  /api/url-to-video/status/:generationId  — poll video generation status
 *
 * UGC Script (routes/ugcScript.ts):
 *   POST /api/ugc-script/generate  — generate UGC video script (Hook/Body/CTA)
 *
 * Voiceover (routes/voiceover.ts):
 *   POST /api/voiceover/generate   — generate TTS audio from text
 *   GET  /api/voiceover/voices     — list available voice presets
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { router as aiRouter }        from './routes/ai';
import { router as billingRouter }   from './routes/billing/index';
import { router as webhooksRouter }  from './routes/webhooks';
import { router as geoRouter }       from './routes/geo';
import { router as analyticsRouter } from './routes/analytics';
import { router as scannerRouter }   from './routes/scanner';
import { router as trackingRouter }        from './routes/tracking';
import { router as adminAnalyticsRouter }  from './routes/adminAnalytics';
import { router as dataExportRouter }       from './routes/dataExport';
import { router as leadCaptureRouter }      from './routes/leadCapture';
import { router as criticalAlertsRouter }   from './routes/criticalAlerts';
import { router as stripeConnectRouter }     from './routes/stripeConnect';
import { router as smsBlacklistRouter }      from './routes/smsBlacklist';
import { router as aiGuardrailsRouter }      from './routes/aiGuardrails';
import { router as apiQuotasRouter }         from './routes/apiQuotas';
import { router as retentionExtensionRouter } from './routes/retentionExtension';
import { router as onboardingRouter }          from './routes/onboarding';
import { router as funnelsRouter }             from './routes/funnels/index';
import { router as emailMarketingRouter }      from './routes/emailMarketing';
import { router as abTestingRouter }           from './routes/abTesting';
import { router as sequencesRouter }           from './routes/sequences';
import { router as aioAuditRouter }            from './routes/aioAudit';
import { router as aioSyncRouter }             from './routes/aioSync';
import { router as ga4AnalyticsRouter }        from './routes/ga4Analytics';
import { router as agentsRouter }              from './routes/agents';
import { router as creativeStudioRouter }      from './routes/creativeStudio';
import { router as metaMarketingRouter }        from './routes/metaMarketing';
import { router as openaiIntegrationRouter }    from './routes/openaiIntegration';
import { router as claudeIntegrationRouter }    from './routes/claudeIntegration';
import { router as coworkRouter }               from './routes/cowork';
import { router as metaCampaignExportRouter }   from './routes/metaCampaignExport';
import { router as metaLocationFeesRouter }     from './routes/metaLocationFees';
import { unifiedUsageReport }                    from './lib/quotaMiddleware';
import { router as engagementMetricsRouter }     from './routes/engagementMetrics';
import { router as seoGapRouter }                from './routes/seoGapAnalysis';
import { router as urlToVideoRouter }            from './routes/urlToVideo';
import { router as ugcScriptRouter }             from './routes/ugcScript';
import { router as voiceoverRouter }              from './routes/voiceover';
import { rgpdRouter }                             from './routes/rgpd';
import { platformWebhooksRouter }                 from './routes/platformWebhooks';
import { router as weeklyReportRouter }           from './routes/weeklyReport';
import { router as addonCheckoutRouter }          from './routes/addonCheckout';
import { router as creditPackAioRouter }          from './routes/billing/creditPackAio';
import { router as creditPacksRouter }             from './routes/creditPacks';
import { router as creditsRouter }                 from './routes/credits';
import { router as smsCreditsRouter }              from './routes/smsCredits';
import { router as contentQuotaRouter }            from './routes/contentQuota';
import { router as trialExtensionRouter }        from './routes/trialExtension';
import { router as trialSequenceRouter }         from './routes/trialSequence';
import { router as highTouchRouter }             from './routes/highTouch';
import { router as oauthTokensRouter }           from './routes/oauthTokens';
import { router as llmTrackerRouter }            from './routes/llmTracker';
import { router as seoAgentRouter }              from './routes/seoAgent';
import { router as referralRewardsRouter }        from './routes/referralRewards';
import { requireRole }                           from './lib/rbacMiddleware';
import { createClient }                          from '@blinkdotnew/sdk';

const app = new Hono();

// CORS — allow calls from the Kompilot frontend and custom domain
app.use('*', cors({
  origin: [
    'https://kompilot.fr',
    'https://www.kompilot.fr',
    'https://demo.kompilot.fr',
    'https://kompilot.blinkpowered.com',
    // Allow the current Blink preview/backend origins only; never every blink.new origin.
    /^https:\/\/3000-[a-z0-9-]+\.preview-blink\.com$/,
    /^https:\/\/[a-z0-9-]+\.blink\.new$/,
  ],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Kompilot-Internal-Secret'],
}));

const requireInternalSecret = async (c: any, next: any) => {
  const expected = (c.env as Record<string, string | undefined>).KOMPILOT_INTERNAL_SECRET;
  const provided = c.req.header('X-Kompilot-Internal-Secret');
  if (!expected || !provided || provided !== expected) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
};

// Sensitive RBAC checks must run before route modules are mounted.
app.use('/api/billing/*', requireRole('admin'));
app.use('/api/team/*', requireRole('admin'));
app.use('/api/admin/*', requireRole('admin'));
app.use('/api/queues/init', requireInternalSecret);
app.use('/api/queue', requireInternalSecret);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }));

// ── Queue initialization (idempotent — creates queues with parallelism) ──────
app.get('/api/queues/init', async (c) => {
  const env = c.env as any;
  const blink = createClient({
    projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk',
    secretKey: env.BLINK_SECRET_KEY,
  });

  try {
    const queueFn = (blink as any).queue;
    if (!queueFn?.createQueue) {
      return c.json({ error: 'Queue API not available' }, 503);
    }

    // Create all recommended queues (idempotent — won't overwrite existing)
    const queues = [
      { name: 'video-generation', parallelism: 3 },
      { name: 'aio-sync', parallelism: 5 },
      { name: 'campaign-export', parallelism: 2 },
      { name: 'email-sending', parallelism: 10 },
      { name: 'weekly-report', parallelism: 5 },
      { name: 'geo-scan', parallelism: 3 },
    ];

    const results = [];
    for (const q of queues) {
      try {
        await queueFn.createQueue(q.name, { parallelism: q.parallelism });
        results.push({ queue: q.name, parallelism: q.parallelism, status: 'created' });
      } catch (err: any) {
        // Queue may already exist — that's fine
        results.push({ queue: q.name, status: 'exists', error: err.message?.substring(0, 50) });
      }
    }

    return c.json({ success: true, queues: results });
  } catch (err: any) {
    console.error('[Queue Init] Error:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ── Unified usage endpoint (v1 API) ──────────────────────────────────────────
app.get('/api/v1/usage', unifiedUsageReport);

app.route('/', aiRouter);
app.route('/', billingRouter);
app.route('/', webhooksRouter);
app.route('/', geoRouter);
app.route('/', analyticsRouter);
app.route('/', scannerRouter);
app.route('/', trackingRouter);
app.route('/', adminAnalyticsRouter);
app.route('/', dataExportRouter);
app.route('/', leadCaptureRouter);
app.route('/', criticalAlertsRouter);
app.route('/', stripeConnectRouter);
app.route('/', smsBlacklistRouter);
app.route('/', aiGuardrailsRouter);
app.route('/', apiQuotasRouter);
app.route('/', retentionExtensionRouter);
app.route('/', onboardingRouter);
app.route('/api/funnels', funnelsRouter);
app.route('/', emailMarketingRouter);
app.route('/', abTestingRouter);
app.route('/', sequencesRouter);
app.route('/', aioAuditRouter);
app.route('/', aioSyncRouter);
app.route('/', ga4AnalyticsRouter);
app.route('/', agentsRouter);
app.route('/', creativeStudioRouter);
app.route('/', metaMarketingRouter);
app.route('/', openaiIntegrationRouter);
app.route('/', claudeIntegrationRouter);
app.route('/', coworkRouter);
app.route('/', metaCampaignExportRouter);
app.route('/', metaLocationFeesRouter);
app.route('/', engagementMetricsRouter);
app.route('/', seoGapRouter);
app.route('/', urlToVideoRouter);
app.route('/', ugcScriptRouter);
app.route('/', voiceoverRouter);
app.route('/', rgpdRouter);
app.route('/', platformWebhooksRouter);
app.route('/', weeklyReportRouter);
app.route('/', addonCheckoutRouter);
app.route('/', creditPackAioRouter);
app.route('/', creditPacksRouter);
app.route('/', creditsRouter);
app.route('/', smsCreditsRouter);
app.route('/', contentQuotaRouter);
app.route('/', trialExtensionRouter);
app.route('/', trialSequenceRouter);
app.route('/', highTouchRouter);
app.route('/', oauthTokensRouter);
app.route('/', llmTrackerRouter);
app.route('/', seoAgentRouter);
app.route('/', referralRewardsRouter);

// ── RBAC enforcement on sensitive routes ─────────────────────────────────────
// Billing: admin only (prevents members/guests from changing plans)
// Team management: admin only
// Admin analytics: admin only
// These middleware are registered before route mounting above.

// ── Blink Queue handler ──────────────────────────────────────────────────────
app.post('/api/queue', async (c) => {
  let body: { taskName?: string; taskId?: string; payload?: any };
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const { taskName, payload } = body;
  if (!taskName) return c.json({ error: 'taskName required' }, 400);

  const env = c.env as any;
  const blink = createClient({
    projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk',
    secretKey:  env.BLINK_SECRET_KEY,
  });

  switch (taskName) {
    // ── Video generation (Luma AI) ─────────────────────────────────────
    case 'generate-video': {
      const { userId, videoPrompt, aspectRatio, extractedData, generationId } = payload ?? {};
      const lumaKey = env.LUMAAI_API_KEY as string | undefined;
      if (!lumaKey) {
        await blink.db.luma_generations.update(generationId, { status: 'failed' });
        return c.json({ ok: false, error: 'LUMAAI_API_KEY not configured' }, 200);
      }
      try {
        const res = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${lumaKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: videoPrompt, aspect_ratio: aspectRatio ?? '9:16' }),
        });
        if (!res.ok) {
          const errText = await res.text();
          console.error('[Queue:generate-video] Luma error:', errText);
          await blink.db.luma_generations.update(generationId, { status: 'failed' });
          return c.json({ ok: false, error: errText }, 200);
        }
        const data = await res.json() as { id: string; state: string; video?: { url: string } };
        await blink.db.luma_generations.update(generationId, {
          videoUrl: data.video?.url ?? '',
          status: data.state ?? 'processing',
        });
        return c.json({ ok: true, generationId: data.id, status: data.state });
      } catch (err: any) {
        console.error('[Queue:generate-video] error:', err.message);
        await blink.db.luma_generations.update(generationId, { status: 'failed' });
        return c.json({ ok: false, error: err.message }, 200);
      }
    }

    // ── Creative Studio analysis (Meta Ads + Claude) ───────────────────
    case 'analyze-creative': {
      const { userId, adAccountId, orgId, formatted, isMetaDemo, isClaudeDemo } = payload ?? {};
      const anthropicKey = env.ANTHROPIC_API_KEY as string;
      const metaToken = env.META_ADS_GRAPH_TOKEN as string;

      const DEMO_CLAUDE_ANALYSIS = {
        winners: 'Les accroches "Pain Point" (CTR 5.1%, ROAS 6.3x) et "Promo directe" (ROAS 4.2x) surperforment nettement.',
        losers: 'La campagne Delta "Awareness" est à couper (ROAS 0.4x).',
        next_actions: [
          'Tester une déclinaison "Pain Point + chiffre"',
          'Créer une version vidéo courte (15s) de la campagne Alpha',
          'Combiner UGC + promo pour maximiser ROAS',
        ],
        budget_waste_euros: 140,
      };

      try {
        let analysis: any;
        if (isClaudeDemo) {
          analysis = DEMO_CLAUDE_ANALYSIS;
        } else {
          const prompt = `Tu es Creative Strategist. Analyse ces Meta Ads.\n\nAds:\n${JSON.stringify(formatted, null, 2)}\n\nRéponds UNIQUEMENT en JSON:\n{"winners":"...","losers":"...","next_actions":["..."],"budget_waste_euros":0}`;
          const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
            body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
          });
          if (!claudeRes.ok) {
            const errText = await claudeRes.text();
            return c.json({ ok: false, error: `Claude API error: ${errText}` }, 200);
          }
          const claudeData = await claudeRes.json() as { content: { text: string }[] };
          const rawText = claudeData.content?.[0]?.text ?? '{}';
          try { analysis = JSON.parse(rawText); } catch {
            const match = rawText.match(/\{[\s\S]*\}/);
            analysis = match ? JSON.parse(match[0]) : { winners: rawText, losers: '', next_actions: [], budget_waste_euros: 0 };
          }
        }

        const totalBudgetWaste = (formatted ?? []).filter((a: any) => a.roas < 1 && a.spend > 0).reduce((s: number, a: any) => s + a.spend, 0);
        const reportId = crypto.randomUUID();
        await blink.db.creative_reports.create({
          id: reportId, userId, orgId: orgId ?? '', adAccountId,
          adsAnalyzed: (formatted ?? []).length,
          budgetWasteDetected: Math.round(totalBudgetWaste),
          winners: JSON.stringify(analysis.winners ?? ''),
          losers: JSON.stringify(analysis.losers ?? ''),
          nextActions: JSON.stringify(analysis.next_actions ?? []),
          rawMetaData: JSON.stringify(formatted ?? []),
        });

        return c.json({ ok: true, reportId, analysis, adsAnalyzed: (formatted ?? []).length });
      } catch (err: any) {
        console.error('[Queue:analyze-creative] error:', err.message);
        return c.json({ ok: false, error: err.message }, 200);
      }
    }

    // ── AIO Sync (SerpApi) ─────────────────────────────────────────────
    case 'aio-sync-track': {
      const { userId, keyword, brandName } = payload ?? {};
      const serpKey = env.SERP_API_KEY as string ?? '';
      if (!serpKey || serpKey.length < 10) {
        return c.json({ ok: false, error: 'SERP_API_KEY not configured' }, 200);
      }
      try {
        const { trackAiVisibility } = await import('./lib/aioSyncService');
        const result = await trackAiVisibility(keyword, brandName, serpKey);
        return c.json({ ok: true, ...result });
      } catch (err: any) {
        console.error('[Queue:aio-sync-track] error:', err.message);
        return c.json({ ok: false, error: err.message }, 200);
      }
    }

    // ── Data Deletion Warning (J+60 cron) ─────────────────────────────
    case 'data-deletion-warning': {
      const { getDataDeletionWarningHtml } = await import('./lib/emailTemplates/dataDeletion');
      const DASHBOARD_URL = 'https://kompilot.blinkpowered.com/dashboard';

      try {
        // Find users with metadata.last_sign_in older than 55 days
        const allUsers = await blink.db.users.list({ limit: 200 });
        const now = Date.now();
        const DAY_MS = 24 * 60 * 60 * 1000;
        let sent = 0;

        for (const user of allUsers as any[]) {
          if (!user.email || !user.lastSignIn) continue;

          const lastSignIn = new Date(user.lastSignIn).getTime();
          if (isNaN(lastSignIn)) continue;

          const daysInactive = Math.floor((now - lastSignIn) / DAY_MS);

          // Send 30-day warning at exactly 60 days inactive
          if (daysInactive >= 60 && daysInactive < 67) {
            let meta: any = {};
            try { meta = JSON.parse(user.metadata || '{}'); } catch { /* noop */ }

            if (meta.deletion_warning_30d_sent) continue;

            const firstName = (user.displayName || user.email).split(' ')[0];
            const html = getDataDeletionWarningHtml(firstName, 30, DASHBOARD_URL);

            try {
              await blink.notifications.email({
                to: user.email,
                subject: '⚠️ Suppression de vos données dans 30 jours — Kompilot',
                html,
              });
              // Mark as sent
              meta.deletion_warning_30d_sent = new Date().toISOString();
              await blink.db.users.update(user.id, { metadata: JSON.stringify(meta) });
              sent++;
            } catch (e) {
              console.error(`[Queue:data-deletion] email failed for ${user.id}:`, e);
            }
          }

          // Send 7-day warning at 83 days inactive
          if (daysInactive >= 83 && daysInactive < 90) {
            let meta: any = {};
            try { meta = JSON.parse(user.metadata || '{}'); } catch { /* noop */ }

            if (meta.deletion_warning_7d_sent) continue;

            const firstName = (user.displayName || user.email).split(' ')[0];
            const html = getDataDeletionWarningHtml(firstName, 7, DASHBOARD_URL);

            try {
              await blink.notifications.email({
                to: user.email,
                subject: '🚨 Suppression imminente — 7 jours restants — Kompilot',
                html,
              });
              meta.deletion_warning_7d_sent = new Date().toISOString();
              await blink.db.users.update(user.id, { metadata: JSON.stringify(meta) });
              sent++;
            } catch (e) {
              console.error(`[Queue:data-deletion] 7d email failed for ${user.id}:`, e);
            }
          }
        }

        console.log(`[Queue:data-deletion-warning] scanned ${allUsers.length} users, sent ${sent} warnings`);
        return c.json({ ok: true, scanned: allUsers.length, sent });
      } catch (err: any) {
        console.error('[Queue:data-deletion-warning] error:', err.message);
        return c.json({ ok: false, error: err.message }, 200);
      }
    }

    // ── Weekly Report Generation ────────────────────────────────────────
    case 'weekly-report': {
      try {
        // Get all users with active establishments
        const users = await blink.db.users.list({ limit: 100 });
        let sent = 0;

        for (const user of users as any[]) {
          if (!user.email) continue;

          try {
            // Get user's establishments
            const establishments = await blink.db.establishments.list({
              where: { userId: user.id },
              limit: 1,
            });

            if (establishments.length === 0) continue;

            const est = establishments[0] as any;

            // Get latest analytics
            const analytics = await blink.db.daily_analytics.list({
              where: { userId: user.id },
              orderBy: { snapshotDate: 'desc' },
              limit: 7,
            });

            if (analytics.length === 0) continue;

            const latest = analytics[0] as any;
            const weekAgo = analytics.length >= 7 ? (analytics[6] as any) : latest;

            // Calculate trends
            const geoScore = Number(latest.geoScore) || 0;
            const prevGeoScore = Number(weekAgo.geoScore) || geoScore;
            const geoTrend = geoScore - prevGeoScore;

            const postsPublished = Number(latest.postsPublished) || 0;
            const reviewsHandled = Number(latest.reviewsHandled) || 0;
            const unhandledReviews = Number(latest.unhandledReviews) || 0;

            // Build report HTML
            const reportHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0D9488;">📊 Rapport Hebdomadaire Kompilot</h2>
                <p>Bonjour ${user.displayName || user.email.split('@')[0]},</p>
                <p>Voici votre résumé de la semaine pour <strong>${est.name}</strong> :</p>
                
                <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <h3 style="margin-top: 0;">📈 Score G.E.O.</h3>
                  <p style="font-size: 24px; font-weight: bold; color: ${geoTrend >= 0 ? '#10B981' : '#EF4444'};">
                    ${geoScore}/100 ${geoTrend >= 0 ? '↑' : '↓'} ${Math.abs(geoTrend)} pts
                  </p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0;">
                  <div style="background: #f0fdf4; padding: 12px; border-radius: 8px;">
                    <p style="margin: 0; font-size: 14px;">📝 Posts publiés</p>
                    <p style="margin: 4px 0 0; font-size: 20px; font-weight: bold;">${postsPublished}</p>
                  </div>
                  <div style="background: #fef3c7; padding: 12px; border-radius: 8px;">
                    <p style="margin: 0; font-size: 14px;">⭐ Avis traités</p>
                    <p style="margin: 4px 0 0; font-size: 20px; font-weight: bold;">${reviewsHandled}</p>
                  </div>
                </div>
                
                ${unhandledReviews > 0 ? `
                  <div style="background: #fef2f2; padding: 12px; border-radius: 8px; border-left: 4px solid #EF4444;">
                    <p style="margin: 0; color: #991B1B;">
                      ⚠️ <strong>${unhandledReviews} avis en attente</strong> de réponse
                    </p>
                  </div>
                ` : ''}
                
                <p style="margin-top: 24px;">
                  <a href="https://kompilot.blinkpowered.com/dashboard" 
                     style="background: #0D9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                    Voir mon dashboard →
                  </a>
                </p>
              </div>
            `;

            // Send email
            await blink.notifications.email({
              to: user.email,
              subject: `📊 Rapport hebdomadaire — ${est.name}`,
              html: reportHtml,
            });

            sent++;
          } catch (userErr) {
            console.error(`[Queue:weekly-report] Error for user ${user.id}:`, userErr);
          }
        }

        console.log(`[Queue:weekly-report] Sent ${sent} reports`);
        return c.json({ ok: true, sent });
      } catch (err: any) {
        console.error('[Queue:weekly-report] error:', err.message);
        return c.json({ ok: false, error: err.message }, 200);
      }
    }

    // ── LLM Visibility Check ──────────────────────────────────────────────
    case 'llm-visibility-check': {
      try {
        const { handleLLMVisibilityCheck } = await import('./routes/llmTracker');
        const result = await handleLLMVisibilityCheck(env, payload);
        return c.json(result, 200);
      } catch (err: any) {
        console.error('[Queue:llm-visibility-check] error:', err.message);
        return c.json({ ok: false, error: err.message }, 200);
      }
    }

    // ── SEO Agent Crawl ───────────────────────────────────────────────────
    case 'seo-agent-crawl': {
      try {
        const { handleSeoAgentCrawl } = await import('./routes/seoAgent');
        const result = await handleSeoAgentCrawl(env, payload);
        return c.json(result, 200);
      } catch (err: any) {
        console.error('[Queue:seo-agent-crawl] error:', err.message);
        return c.json({ ok: false, error: err.message }, 200);
      }
    }

    default:
      console.warn(`[Queue] Unknown taskName: ${taskName}`);
      return c.json({ error: `Unknown task: ${taskName}` }, 400);
  }
});

// ── Global error handler ─────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('[Backend] Unhandled error:', err.message, err.stack);
  return c.json(
    { error: 'Internal server error', message: err.message ?? 'Unknown error' },
    500
  );
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.notFound((c) => {
  return c.json({ error: 'Not found', path: c.req.path }, 404);
});

export default app;
