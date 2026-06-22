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

const app = new Hono();

// CORS — allow calls from the Kompilot frontend and custom domain
app.use('*', cors({
  origin: [
    'https://www.kompilot.com',
    'https://kompilot.blinkpowered.com',
    // Allow all *.blink.new origins (preview / sandbox)
    /https:\/\/.+\.blink\.new$/,
  ],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }));

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
