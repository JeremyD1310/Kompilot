/**
 * Funnels — sub-router aggregator
 *
 * Mounts all focused funnel sub-routers onto a single Hono router
 * that is exported and mounted at /api/funnels in backend/index.ts.
 *
 * Sub-modules:
 *   discovery.ts    — GET /analyze, GET /samples
 *   crud.ts         — GET /, POST /, DELETE /:id
 *   swipes.ts       — POST /generate-swipes, POST /ai-swipes
 *   stack.ts        — POST /detect-stack, PATCH /:id/watch
 *   analyzeFull.ts  — POST /analyze-full (Meta Ads + tech stack + 21-day filter)
 */
import { Hono } from 'hono';
import { router as discoveryRouter }        from './discovery';
import { router as crudRouter }             from './crud';
import { router as swipesRouter }           from './swipes';
import { router as stackRouter }            from './stack';
import { router as analyzeFullRouter }      from './analyzeFull';
import { router as ghostEmailsRouter }      from './ghostEmails';
import { router as emailAnalyticsRouter }   from './emailAnalytics';
import { router as clientExportRouter }     from './clientExport';
import { router as personaSimulatorRouter } from './personaSimulator';
import { router as organicRouter }          from './organic';
import { router as onboardingSeedRouter }   from './onboardingSeed';

const app = new Hono<{ Bindings: { BLINK_SECRET_KEY: string; META_ACCESS_TOKEN?: string } }>();

app.route('/', discoveryRouter);
app.route('/', crudRouter);
app.route('/', swipesRouter);
app.route('/', stackRouter);
app.route('/', analyzeFullRouter);
app.route('/', ghostEmailsRouter);
app.route('/', emailAnalyticsRouter);
app.route('/', clientExportRouter);
app.route('/', personaSimulatorRouter);
app.route('/', organicRouter);
app.route('/', onboardingSeedRouter);

export const router = app;
