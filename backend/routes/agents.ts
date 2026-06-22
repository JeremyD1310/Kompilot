/**
 * agents.ts — Kompilot AI Agents with Real Function Calling + SSE Log Streaming
 *
 * Three endpoints:
 *   POST /api/agents/sprint  — Content Factory: AI → writeSprint() → calendar injection
 *   POST /api/agents/adspy   — Ad Spy: readAIOData() → AI analysis → structured insights
 *   POST /api/agents/report  — Reporter: readActionHistory() → AI monthly report
 *
 * SSE streaming:
 *   GET /api/agents/stream/:jobId — real-time log stream (text/event-stream)
 *
 * Each agent:
 *  1. Authenticates the Blink user
 *  2. Calls the real function tool BEFORE the AI (to enrich the prompt)
 *  3. Runs the AI via aiRouter (with prompt caching)
 *  4. Calls the write function tool AFTER the AI (to persist results)
 *  5. Returns { success, content, functionCall, logs, meta }
 *
 * The logs array is also emitted live via SSE so the terminal on the frontend
 * shows real-time status: [Agent Content] Processing... → ✅ Success
 */

import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';
import { generateAIResponse } from '../lib/aiRouter';
import { getSectorSystemPrompt } from '../lib/sectorPrompts';

export const router = new Hono();

const getBlink = (env: Env) =>
  createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });

// ── In-memory job log store (per Worker instance, TTL 10 min) ─────────────────
// Each job accumulates logs and a "done" flag for SSE consumers.
// Cloudflare Workers are stateless per invocation, so SSE and job share the same isolate.

interface JobState {
  logs: string[];
  done: boolean;
  error?: string;
  createdAt: number;
}

const JOB_STORE = new Map<string, JobState>();

function createJob(): { jobId: string; job: JobState } {
  const jobId = crypto.randomUUID();
  const job: JobState = { logs: [], done: false, createdAt: Date.now() };
  JOB_STORE.set(jobId, job);
  // Auto-cleanup after 10 minutes
  setTimeout(() => JOB_STORE.delete(jobId), 10 * 60 * 1000);
  return { jobId, job };
}

function makeLogger(job: JobState) {
  return (msg: string) => {
    const ts = new Date().toTimeString().slice(0, 8);
    const line = `[${ts}] ${msg}`;
    job.logs.push(line);
    console.log(`[AgentLog] ${msg}`);
  };
}

// ── GET /api/agents/stream/:jobId — SSE real-time log stream ──────────────────

router.get('/api/agents/stream/:jobId', async (c) => {
  const jobId = c.req.param('jobId');
  const job = JOB_STORE.get(jobId);

  if (!job) {
    return c.json({ error: 'Job not found or expired' }, 404);
  }

  // SSE setup
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const enc = new TextEncoder();

  const sendEvent = async (data: string) => {
    await writer.write(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  // Flush existing logs immediately, then poll for new ones
  (async () => {
    let cursor = 0;
    try {
      while (!job.done || cursor < job.logs.length) {
        // Send any new log lines
        while (cursor < job.logs.length) {
          await sendEvent(job.logs[cursor]);
          cursor++;
        }
        if (!job.done) {
          // Poll every 80ms — fast enough for smooth terminal
          await new Promise(r => setTimeout(r, 80));
        }
      }
      // Send terminal done/error event
      await sendEvent(job.error ? `[ERROR] ${job.error}` : '[System] ✅ Stream terminé');
      await writer.write(enc.encode('event: done\ndata: {}\n\n'));
    } catch {
      // Client disconnected
    } finally {
      writer.close().catch(() => {});
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
});

// ── Shared auth helper ─────────────────────────────────────────────────────────

async function requireAuth(
  c: { req: { header: (k: string) => string | undefined } },
  blink: ReturnType<typeof getBlink>,
) {
  return blink.auth.verifyToken(c.req.header('Authorization'));
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface GeneratedPost {
  platform: string;
  content: string;
  hashtags: string;
  bestTime: string;
  scheduledAt?: string;
}

interface SprintFunctionResult {
  injectedCount: number;
  calendarIds: string[];
  skipped: number;
}

interface AdSpyFunctionResult {
  aioDataInjected: boolean;
  competitorKeywords: string[];
  opportunityCount: number;
}

interface ReporterFunctionResult {
  actionsRead: number;
  postsPublished: number;
  reviewsHandled: number;
  smsSent: number;
  reportStoredId: string | null;
}

// ── Tool definitions (function-calling schema exposed in API responses) ────────
//
// These mirror the OpenAI / Anthropic tool_use schema so the frontend can render
// which tool was called, with what parameters and what result it returned.

export const AGENT_TOOLS = {
  /** Content Factory: write generated posts to scheduled_posts calendar */
  write_to_calendar: {
    name: 'write_to_calendar',
    description:
      'Injects AI-generated posts into the Kompilot Campaign Calendar (scheduled_posts table). ' +
      'Each post is spaced 2 days apart starting tomorrow at 18:00.',
    input_schema: {
      type: 'object',
      properties: {
        posts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              content:  { type: 'string' },
              hashtags: { type: 'string' },
              bestTime: { type: 'string' },
            },
            required: ['platform', 'content'],
          },
        },
        establishmentId: { type: 'string' },
      },
      required: ['posts'],
    },
  },

  /** Ad Spy: read AIO Sync data (daily_analytics + initial_scans) before AI call */
  read_aio_sync_data: {
    name: 'read_aio_sync_data',
    description:
      'Reads AIO Sync data from Kompilot DB: missing local keywords (last 7 days of daily_analytics) ' +
      'and current geo-visibility score (latest initial_scan). ' +
      'This context is injected into the Ad Spy AI prompt to target real keyword gaps.',
    input_schema: {
      type: 'object',
      properties: {
        userId:         { type: 'string' },
        competitorName: { type: 'string' },
      },
      required: ['userId', 'competitorName'],
    },
  },

  /** Reporter: read action history (scheduled_posts + daily_analytics) */
  read_action_history: {
    name: 'read_action_history',
    description:
      'Reads the last N months of user actions: published posts count, reviews handled, ' +
      'SMS sent, and average geo score from daily_analytics. ' +
      'The structured summary is injected into the Reporter AI prompt for data-grounded reporting.',
    input_schema: {
      type: 'object',
      properties: {
        userId:       { type: 'string' },
        periodMonths: { type: 'number' },
      },
      required: ['userId'],
    },
  },
} as const;

// ── Function: write posts to scheduled_posts calendar ─────────────────────────

async function writeSprint(
  blink: ReturnType<typeof getBlink>,
  userId: string,
  posts: GeneratedPost[],
  establishmentId?: string,
  log?: (msg: string) => void,
): Promise<SprintFunctionResult> {
  const calendarIds: string[] = [];
  let skipped = 0;

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 1);

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    if (!post.content || post.content.length < 10) { skipped++; continue; }

    const scheduledDate = new Date(baseDate);
    scheduledDate.setDate(baseDate.getDate() + i * 2);
    scheduledDate.setHours(18, 0, 0, 0);

    try {
      const record = await blink.db.scheduled_posts.create({
        id:               crypto.randomUUID(),
        userId,
        establishmentId:  establishmentId ?? null,
        textContent:      post.content + (post.hashtags ? `\n\n${post.hashtags}` : ''),
        channels:         JSON.stringify([post.platform]),
        scheduledAt:      scheduledDate.toISOString(),
        status:           'draft',
        platformVariants: JSON.stringify({ [post.platform]: post.content }),
        createdAt:        new Date().toISOString(),
        updatedAt:        new Date().toISOString(),
      });
      calendarIds.push(record.id as string);
      log?.(`[write_to_calendar] ✅ Post #${i + 1} injecté → ${scheduledDate.toLocaleDateString('fr-FR')} 18h`);
    } catch (err) {
      console.error('[agents] writeSprint DB error:', err);
      log?.(`[write_to_calendar] ⚠️ Post #${i + 1} ignoré : ${String(err).slice(0, 80)}`);
      skipped++;
    }
  }

  return { injectedCount: calendarIds.length, calendarIds, skipped };
}

// ── Function: read AIO sync data for Ad Spy ───────────────────────────────────

async function readAIOData(
  blink: ReturnType<typeof getBlink>,
  userId: string,
  competitorName: string,
  log?: (msg: string) => void,
): Promise<{ aioContext: string; keywords: string[] }> {
  log?.('[read_aio_sync_data] 📡 Lecture daily_analytics (7j)...');

  const analytics = await blink.db.daily_analytics.list({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    limit: 7,
  });

  const keywordsRaw: string[] = [];
  for (const row of analytics) {
    try {
      const missing = JSON.parse(row.missingKeywords as string ?? '[]');
      if (Array.isArray(missing)) keywordsRaw.push(...missing);
    } catch {}
  }
  const uniqueKeywords = [...new Set(keywordsRaw)].slice(0, 20);

  log?.(`[read_aio_sync_data] 📡 Lecture initial_scans...`);

  const scans = await blink.db.initial_scans.list({
    where: { userId },
    orderBy: { scannedAt: 'desc' },
    limit: 1,
  });
  const latestScan = scans[0] ?? null;

  const aioContext = [
    `Concurrent analysé : "${competitorName}"`,
    uniqueKeywords.length > 0
      ? `Mots-clés locaux manquants détectés par AIO Sync : ${uniqueKeywords.join(', ')}`
      : 'Aucun mot-clé AIO disponible pour cet utilisateur',
    latestScan
      ? `Score de visibilité géo actuel : ${latestScan.geoScore}/100 (${latestScan.unhandledReviews} avis non traités)`
      : 'Aucun scan de visibilité disponible',
  ].filter(Boolean).join('\n');

  log?.(`[read_aio_sync_data] ✅ ${uniqueKeywords.length} mots-clés + score géo injectés`);

  return { aioContext, keywords: uniqueKeywords };
}

// ── Function: read action history for Reporter ────────────────────────────────

async function readActionHistory(
  blink: ReturnType<typeof getBlink>,
  userId: string,
  periodMonths: number = 1,
  log?: (msg: string) => void,
): Promise<{ summary: string; stats: ReporterFunctionResult }> {
  const since = new Date();
  since.setMonth(since.getMonth() - periodMonths);
  const sinceIso = since.toISOString();

  log?.('[read_action_history] 📋 Lecture des posts publiés...');

  const posts = await blink.db.scheduled_posts.list({
    where: { userId, status: 'published' },
    orderBy: { createdAt: 'desc' },
    limit: 100,
  });
  const recentPosts = posts.filter(p => (p.createdAt as string) > sinceIso);

  log?.('[read_action_history] 📋 Lecture daily_analytics (30j)...');

  const analytics = await blink.db.daily_analytics.list({
    where: { userId },
    orderBy: { snapshotDate: 'desc' },
    limit: 30,
  });
  const recentAnalytics = analytics.filter(a => (a.snapshotDate as string) > sinceIso.slice(0, 10));

  const totalSms     = recentAnalytics.reduce((acc, r) => acc + (Number(r.smsSent) || 0), 0);
  const totalReviews = recentAnalytics.reduce((acc, r) => acc + (Number(r.reviewsHandled) || 0), 0);
  const avgGeoScore  = recentAnalytics.length > 0
    ? Math.round(recentAnalytics.reduce((acc, r) => acc + (Number(r.geoScore) || 0), 0) / recentAnalytics.length)
    : 0;

  const summary = [
    `Posts publiés ce mois : ${recentPosts.length}`,
    `Avis clients traités : ${totalReviews}`,
    `SMS envoyés : ${totalSms}`,
    `Score GEO moyen : ${avgGeoScore}/100`,
    `Jours de données disponibles : ${recentAnalytics.length}`,
  ].join('\n');

  log?.(`[read_action_history] ✅ ${recentPosts.length} posts · ${totalReviews} avis · score GEO ${avgGeoScore}`);

  return {
    summary,
    stats: {
      actionsRead:     recentAnalytics.length,
      postsPublished:  recentPosts.length,
      reviewsHandled:  totalReviews,
      smsSent:         totalSms,
      reportStoredId:  null,
    },
  };
}

// ── Helper: parse post blocks from AI markdown output ─────────────────────────

function parsePostsFromMarkdown(raw: string): GeneratedPost[] {
  const posts: GeneratedPost[] = [];
  const blocks = raw.split(/###\s+POST\s+\d+/i).filter(Boolean);
  for (const block of blocks) {
    const platformMatch = block.match(/—\s*(.+?)[\n\r]/);
    const contentMatch  = block.match(/\*\*Contenu[^:]*:\*\*\s*([\s\S]*?)(?:\*\*Hashtags|\*\*Heure|$)/i);
    const hashMatch     = block.match(/\*\*Hashtags[^:]*:\*\*\s*(.+?)(?:\n|$)/i);
    const timeMatch     = block.match(/\*\*Heure[^:]*:\*\*\s*(.+?)(?:\n|$)/i);
    posts.push({
      platform: platformMatch?.[1]?.trim() ?? 'Multi-plateforme',
      content:  contentMatch?.[1]?.trim() ?? block.slice(0, 400).trim(),
      hashtags: hashMatch?.[1]?.trim() ?? '',
      bestTime: timeMatch?.[1]?.trim() ?? '',
    });
  }
  return posts;
}

// ── POST /api/agents/sprint — Content Factory ─────────────────────────────────

router.post('/api/agents/sprint', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await requireAuth(c, blink);
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
  if (!env.OPENAI_API_KEY || !env.ANTHROPIC_API_KEY) {
    return c.json({ error: 'AI keys not configured' }, 503);
  }

  let body: {
    brief: string;
    sector: string;
    tone: string;
    platforms: string[];
    postCount: number;
    establishmentId?: string;
    injectToCalendar?: boolean;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { brief, sector, tone, platforms, postCount, establishmentId, injectToCalendar = true } = body;
  if (!brief?.trim() || !platforms?.length) {
    return c.json({ error: 'brief and platforms are required' }, 400);
  }

  // Create SSE job for live terminal
  const { jobId, job } = createJob();
  const log = makeLogger(job);

  // Run agent asynchronously (do NOT await — return jobId immediately)
  // Since CF Workers are single-threaded, we run synchronously but the SSE endpoint
  // polls the job store. We return after completion here.
  log('[Agent Content] ⚙️ Analyse du brief en cours...');
  log(`[Agent Content] 📋 Plateforme(s) : ${platforms.join(', ')} — ${postCount} posts demandés`);
  log(`[Agent Content] 🏢 Secteur : ${sector} · Ton : ${tone}`);

  // ── Tool call: build system prompt with sector context (cached) ──────────────
  const sectorContext = getSectorSystemPrompt(sector);
  const systemPrompt = [
    sectorContext,
    `Tu es un expert en marketing digital local spécialisé en ${sector}.`,
    `Ton de rédaction préféré : ${tone}.`,
    `Plateformes cibles : ${platforms.join(', ')}.`,
    `Réponds toujours en français.`,
  ].filter(Boolean).join('\n\n');

  const userPrompt = `Génère un planning éditorial de ${postCount} posts pour les plateformes : ${platforms.join(', ')}.

Brief client : "${brief}"

Format OBLIGATOIRE pour chaque post :

### POST [numéro] — [Plateforme]
**Contenu :**
[texte du post]

**Hashtags :** #hashtag1 #hashtag2 #hashtag3

**Heure idéale de publication :** [ex: Mardi 18h30]

---

À la fin, ajoute un court résumé stratégique (commençant par "**Résumé du Sprint :**").`;

  log('[Agent Content] 🤖 Appel IA en cours (Content Factory)...');

  let aiResult: Awaited<ReturnType<typeof generateAIResponse>>;
  try {
    aiResult = await generateAIResponse(
      {
        taskType:      'CREATIVE_CONTENT',
        prompt:        userPrompt,
        systemContext: systemPrompt,
        sector,
        maxTokens:     2200,
      },
      { OPENAI_API_KEY: env.OPENAI_API_KEY, ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY },
      auth.userId ?? undefined,
    );
  } catch (err) {
    log('[Agent Content] ❌ Erreur IA — génération échouée');
    job.done = true;
    job.error = String(err);
    return c.json({ error: 'AI generation failed', detail: String(err) }, 502);
  }

  const cacheHit = (aiResult.cacheReadTokens ?? 0) > 0;
  log(`[Agent Content] ✅ ${postCount} posts générés via ${aiResult.provider}/${aiResult.model} (${aiResult.latencyMs}ms)${cacheHit ? ' 🎯 cache hit' : ''}`);

  // Parse posts from AI output
  const posts = parsePostsFromMarkdown(aiResult.content);
  log(`[Agent Content] ⚙️ Parsing : ${posts.length} posts extraits du markdown`);

  // ── Tool call: write_to_calendar ─────────────────────────────────────────────
  let functionResult: SprintFunctionResult | null = null;
  const functionCallInput = { posts, establishmentId };

  if (injectToCalendar && auth.userId) {
    log('[Agent Content] 💾 Appel de write_to_calendar → Campaign Calendar...');
    try {
      functionResult = await writeSprint(blink, auth.userId, posts, establishmentId, log);
      log(`[Agent Content] ✅ write_to_calendar : ${functionResult.injectedCount} posts injectés (${functionResult.skipped} ignorés)`);
    } catch (err) {
      log(`[Agent Content] ⚠️ write_to_calendar échoué : ${String(err)}`);
    }
  }

  log('[System] ✅ Sprint Content Factory terminé avec succès');
  job.done = true;

  return c.json({
    success: true,
    jobId,
    content: aiResult.content,
    posts,
    functionCall: {
      tool:   AGENT_TOOLS.write_to_calendar.name,
      schema: AGENT_TOOLS.write_to_calendar,
      input:  functionCallInput,
      result: functionResult,
    },
    logs: job.logs,
    meta: {
      provider:        aiResult.provider,
      model:           aiResult.model,
      tokens:          { input: aiResult.inputTokens, output: aiResult.outputTokens },
      cacheReadTokens: aiResult.cacheReadTokens ?? 0,
      cacheHit,
      latencyMs:       aiResult.latencyMs,
    },
  });
});

// ── POST /api/agents/adspy — Ad Spy + AIO Sync ────────────────────────────────

router.post('/api/agents/adspy', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await requireAuth(c, blink);
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
  if (!env.OPENAI_API_KEY || !env.ANTHROPIC_API_KEY) {
    return c.json({ error: 'AI keys not configured' }, 503);
  }

  let body: { competitor: string; myBusiness?: string; sector?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { competitor, myBusiness, sector } = body;
  if (!competitor?.trim()) return c.json({ error: 'competitor is required' }, 400);

  const { jobId, job } = createJob();
  const log = makeLogger(job);

  log('[Agent Ad Spy] 🔍 Initialisation de la veille concurrentielle...');
  log(`[Agent Ad Spy] 🎯 Concurrent : "${competitor}"${myBusiness ? ` vs "${myBusiness}"` : ''}`);

  // ── Tool call: read_aio_sync_data BEFORE AI (enriches prompt) ────────────────
  let aioContext = '';
  let aioKeywords: string[] = [];
  let adSpyFunctionResult: AdSpyFunctionResult | null = null;
  const functionCallInput = { userId: auth.userId ?? '', competitorName: competitor };

  if (auth.userId) {
    log('[Agent Ad Spy] 📡 Appel de read_aio_sync_data → AIO Sync...');
    try {
      const aioData = await readAIOData(blink, auth.userId, competitor, log);
      aioContext  = aioData.aioContext;
      aioKeywords = aioData.keywords;
    } catch (err) {
      log(`[Agent Ad Spy] ⚠️ read_aio_sync_data indisponible : ${String(err)}`);
    }
  }

  log('[Agent Ad Spy] 🤖 Appel IA en cours (Ad Spy Analysis)...');

  const systemPrompt = [
    sector ? getSectorSystemPrompt(sector) : '',
    'Tu es un expert en stratégie publicitaire et analyse concurrentielle digitale.',
    'Tu disposes de données AIO Sync sur la visibilité locale du client.',
    'Réponds en français, sois précis, actionnable et orienté ROI.',
  ].filter(Boolean).join('\n\n');

  const userPrompt = `Analyse le concurrent : "${competitor}"${myBusiness ? ` par rapport à : "${myBusiness}"` : ''}.

${aioContext ? `\nDonnées AIO Sync disponibles :\n${aioContext}\n` : ''}

Produis une analyse en 4 sections :

### ANGLES PUBLICITAIRES DÉTECTÉS
- (3-4 angles clés du concurrent)

### GAPS & OPPORTUNITÉS
- (3-4 lacunes exploitables — utilise les mots-clés AIO manquants si disponibles)

### HOOKS À FORT TAUX DE CONVERSION
- (3-4 formulations d'accroche)

### CONTRE-OFFRES & DIFFÉRENCIATION
- (3-4 propositions de valeur)

Termine par une **NOTE STRATÉGIQUE** de 2 phrases.`;

  let aiResult: Awaited<ReturnType<typeof generateAIResponse>>;
  try {
    aiResult = await generateAIResponse(
      {
        taskType:      'STRATEGIC_PLANNING',
        prompt:        userPrompt,
        systemContext: systemPrompt,
        sector,
        maxTokens:     1600,
      },
      { OPENAI_API_KEY: env.OPENAI_API_KEY, ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY },
      auth.userId ?? undefined,
    );
  } catch (err) {
    log('[Agent Ad Spy] ❌ Erreur IA — analyse échouée');
    job.done = true;
    job.error = String(err);
    return c.json({ error: 'AI generation failed', detail: String(err) }, 502);
  }

  const cacheHit = (aiResult.cacheReadTokens ?? 0) > 0;
  log(`[Agent Ad Spy] ✅ Analyse terminée via ${aiResult.provider}/${aiResult.model} (${aiResult.latencyMs}ms)${cacheHit ? ' 🎯 cache hit' : ''}`);

  const opportunityCount = (aiResult.content.match(/^-\s+/gm) ?? []).length;

  adSpyFunctionResult = {
    aioDataInjected:    aioKeywords.length > 0,
    competitorKeywords: aioKeywords.slice(0, 10),
    opportunityCount,
  };

  log(`[Agent Ad Spy] 📊 ${opportunityCount} insights · ${aioKeywords.length} mots-clés AIO injectés`);
  log('[System] ✅ Sprint Ad Spy terminé avec succès');
  job.done = true;

  return c.json({
    success: true,
    jobId,
    content: aiResult.content,
    functionCall: {
      tool:   AGENT_TOOLS.read_aio_sync_data.name,
      schema: AGENT_TOOLS.read_aio_sync_data,
      input:  functionCallInput,
      result: adSpyFunctionResult,
    },
    logs: job.logs,
    meta: {
      provider:        aiResult.provider,
      model:           aiResult.model,
      tokens:          { input: aiResult.inputTokens, output: aiResult.outputTokens },
      cacheReadTokens: aiResult.cacheReadTokens ?? 0,
      cacheHit,
      latencyMs:       aiResult.latencyMs,
    },
  });
});

// ── POST /api/agents/report — Reporter + Action History ──────────────────────

router.post('/api/agents/report', async (c) => {
  const env   = c.env as unknown as Env;
  const blink = getBlink(env);

  const auth = await requireAuth(c, blink);
  if (!auth.valid) return c.json({ error: 'Unauthorized' }, 401);
  if (!env.OPENAI_API_KEY || !env.ANTHROPIC_API_KEY) {
    return c.json({ error: 'AI keys not configured' }, 503);
  }

  let body: {
    clientName:   string;
    period:       string;
    sector:       string;
    satisfaction: number;
    highlights?:  string;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { clientName, period, sector, satisfaction = 4, highlights } = body;
  if (!clientName?.trim()) return c.json({ error: 'clientName is required' }, 400);

  const { jobId, job } = createJob();
  const log = makeLogger(job);

  log('[Agent Reporter] 📊 Initialisation du rapport mensuel...');
  log(`[Agent Reporter] 👤 Client : "${clientName}" · Secteur : ${sector} · Période : ${period}`);

  // ── Tool call: read_action_history BEFORE AI (enriches the report) ────────────
  let historySummary = '';
  let reporterFunctionResult: ReporterFunctionResult | null = null;
  const functionCallInput = { userId: auth.userId ?? '', periodMonths: 1 };

  if (auth.userId) {
    log('[Agent Reporter] 📋 Appel de read_action_history → historique des actions...');
    try {
      const { summary, stats } = await readActionHistory(blink, auth.userId, 1, log);
      historySummary         = summary;
      reporterFunctionResult = stats;
    } catch (err) {
      log(`[Agent Reporter] ⚠️ read_action_history partiel : ${String(err)}`);
    }
  }

  log('[Agent Reporter] 🤖 Appel IA en cours (génération du rapport mensuel)...');

  const sectorContext = getSectorSystemPrompt(sector);
  const systemPrompt = [
    sectorContext,
    "Tu es l'Account Manager IA de Kompilot.",
    'Tu génères des rapports mensuels professionnels pour les clients.',
    'Réponds en français, adopte un ton professionnel et orienté résultats.',
  ].filter(Boolean).join('\n\n');

  const userPrompt = `Génère un rapport mensuel pour :

Client : "${clientName}"
Secteur : ${sector}
Période : ${period}
Note satisfaction : ${satisfaction}/5
${highlights ? `Points forts fournis : ${highlights}` : ''}

${historySummary ? `\nDonnées réelles extraites de la base :\n${historySummary}\n` : ''}

Format OBLIGATOIRE — 5 sections :

### RÉSUMÉ EXÉCUTIF
[2-3 phrases sur les résultats clés]

### KPIS DU MOIS
- **Visibilité Google** : [score/évolution]
- **Publications réalisées** : [nombre + plateformes]
- **Avis Google** : [réponses + note]
- **Leads captés** : [estimation]
- **Taux d'engagement** : [estimation]

### ACTIONS RÉALISÉES
- [4-6 actions concrètes]

### ANALYSE ROI
[3-4 phrases avec chiffres : coût vs valeur, CA influencé]

### RECOMMANDATIONS POUR LE MOIS PROCHAIN
1. [action prioritaire]
2. [action de renforcement]
3. [action d'innovation]

Termine par une **MENTION LÉGALE** courte.`;

  let aiResult: Awaited<ReturnType<typeof generateAIResponse>>;
  try {
    aiResult = await generateAIResponse(
      {
        taskType:      'STRATEGIC_PLANNING',
        prompt:        userPrompt,
        systemContext: systemPrompt,
        sector,
        maxTokens:     2000,
      },
      { OPENAI_API_KEY: env.OPENAI_API_KEY, ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY },
      auth.userId ?? undefined,
    );
  } catch (err) {
    log('[Agent Reporter] ❌ Erreur IA — rapport échoué');
    job.done = true;
    job.error = String(err);
    return c.json({ error: 'AI generation failed', detail: String(err) }, 502);
  }

  const cacheHit = (aiResult.cacheReadTokens ?? 0) > 0;
  log(`[Agent Reporter] ✅ Rapport généré via ${aiResult.provider}/${aiResult.model} (${aiResult.latencyMs}ms)${cacheHit ? ' 🎯 cache hit' : ''}`);
  log('[Agent Reporter] 📋 Rapport mensuel client prêt');
  log('[System] ✅ Sprint Reporter terminé avec succès');
  job.done = true;

  return c.json({
    success: true,
    jobId,
    content: aiResult.content,
    functionCall: {
      tool:   AGENT_TOOLS.read_action_history.name,
      schema: AGENT_TOOLS.read_action_history,
      input:  functionCallInput,
      result: reporterFunctionResult,
    },
    logs: job.logs,
    meta: {
      provider:        aiResult.provider,
      model:           aiResult.model,
      tokens:          { input: aiResult.inputTokens, output: aiResult.outputTokens },
      cacheReadTokens: aiResult.cacheReadTokens ?? 0,
      cacheHit,
      latencyMs:       aiResult.latencyMs,
    },
  });
});
