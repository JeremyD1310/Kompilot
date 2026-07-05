/**
 * LLM Visibility Tracker — Module 3
 *
 * Tracks whether a brand is cited by AI engines (OpenAI, Gemini, Perplexity, Claude)
 * on user-defined natural queries.
 *
 * Endpoints:
 *   POST /api/llm-tracker/create        — create a new tracker
 *   GET  /api/llm-tracker/list           — list user's trackers
 *   POST /api/llm-tracker/check          — run a manual visibility check
 *   GET  /api/llm-tracker/:id/results    — get check results
 *   GET  /api/llm-tracker/:id/history    — score history (sparkline)
 *   PUT  /api/llm-tracker/:id            — update tracker config
 *   DELETE /api/llm-tracker/:id          — soft-delete (is_active = 0)
 */

import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

// ── Auth helper ──────────────────────────────────────────────────────────────

function getDb(env: Env) {
  return createClient({ projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk', secretKey: env.BLINK_SECRET_KEY });
}

function getUserId(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try { const p = authHeader.split('.')[1]; const d = JSON.parse(atob(p)); return d.sub ?? d.user_id ?? null; }
  catch { return null; }
}

// ── Types ────────────────────────────────────────────────────────────────────

interface LLMTracker {
  id: string;
  userId: string;
  establishmentId: string;
  brandName: string;
  domainUrl: string;
  naturalQueries: string;
  enginesToCheck: string;
  checkFrequency: string;
  isActive: string;
  lastCheckAt: string;
  overallVisibilityScore: string;
  createdAt: string;
  updatedAt: string;
}

interface LLMResult {
  id: string;
  trackerId: string;
  userId: string;
  queryText: string;
  engine: string;
  responseText: string;
  brandMentioned: string;
  brandPosition: string | null;
  urlCited: string;
  urlCitedText: string;
  sourcesExtracted: string;
  sentiment: string;
  tokensUsed: string;
  responseTimeMs: string;
  checkedAt: string;
}

interface VisibilityHistory {
  id: string;
  trackerId: string;
  userId: string;
  score: string;
  queriesChecked: string;
  brandMentions: string;
  urlCitations: string;
  snapshotDate: string;
  createdAt: string;
}

// ── LLM Engine Callers ───────────────────────────────────────────────────────

async function callOpenAI(prompt: string, apiKey: string): Promise<{ text: string; tokens: number; timeMs: number }> {
  const start = Date.now();
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });
  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content ?? '';
  const tokens = data.usage?.total_tokens ?? 0;
  return { text, tokens, timeMs: Date.now() - start };
}

async function callGemini(prompt: string, apiKey: string): Promise<{ text: string; tokens: number; timeMs: number }> {
  const start = Date.now();
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
    }),
  });
  const data = await res.json() as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const tokens = data.usageMetadata?.totalTokenCount ?? 0;
  return { text, tokens, timeMs: Date.now() - start };
}

async function callPerplexity(prompt: string, apiKey: string): Promise<{ text: string; tokens: number; timeMs: number; sources: string[] }> {
  const start = Date.now();
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });
  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content ?? '';
  const tokens = data.usage?.total_tokens ?? 0;
  // Perplexity returns citations in the response
  const sources: string[] = data.citations ?? [];
  return { text, tokens, timeMs: Date.now() - start, sources };
}

async function callClaude(prompt: string, apiKey: string): Promise<{ text: string; tokens: number; timeMs: number }> {
  const start = Date.now();
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json() as any;
  const text = data.content?.[0]?.text ?? '';
  const tokens = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);
  return { text, tokens, timeMs: Date.now() - start };
}

// ── Detection helpers ────────────────────────────────────────────────────────

function detectBrand(text: string, brandName: string): { mentioned: boolean; position: number | null } {
  const lower = text.toLowerCase();
  const brandLower = brandName.toLowerCase();
  const idx = lower.indexOf(brandLower);
  if (idx === -1) return { mentioned: false, position: null };
  // Count position (1-based: how many sentences before the mention)
  const beforeText = text.substring(0, idx);
  const sentenceCount = (beforeText.match(/[.!?]+/g) || []).length;
  return { mentioned: true, position: sentenceCount + 1 };
}

function detectUrl(text: string, domainUrl: string): { cited: boolean; citedUrl: string } {
  if (!domainUrl) return { cited: false, citedUrl: '' };
  const domainLower = domainUrl.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const lower = text.toLowerCase();
  if (lower.includes(domainLower)) {
    // Try to extract the full URL
    const urlMatch = text.match(new RegExp(`https?://[^\\s]*${domainLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\s]*`, 'i'));
    return { cited: true, citedUrl: urlMatch?.[0] ?? domainUrl };
  }
  return { cited: false, citedUrl: '' };
}

function analyzeSentiment(text: string, brandName: string): string {
  const lower = text.toLowerCase();
  const brandIdx = lower.indexOf(brandName.toLowerCase());
  if (brandIdx === -1) return 'neutral';
  // Get surrounding context (200 chars around mention)
  const start = Math.max(0, brandIdx - 100);
  const end = Math.min(text.length, brandIdx + brandName.length + 100);
  const context = lower.substring(start, end);
  const positiveWords = ['excellent', 'recommandé', 'meilleur', 'top', 'populaire', 'efficace', 'innovant', 'leader', 'incontournable'];
  const negativeWords = ['problème', 'lent', 'cher', 'compliqué', 'décevant', 'limité', 'manque'];
  const posCount = positiveWords.filter(w => context.includes(w)).length;
  const negCount = negativeWords.filter(w => context.includes(w)).length;
  if (posCount > negCount) return 'positive';
  if (negCount > posCount) return 'negative';
  return 'neutral';
}

// ── POST /api/llm-tracker/create ─────────────────────────────────────────────

router.post('/api/llm-tracker/create', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Non autorisé' }, 401);

  let body: { brandName: string; domainUrl?: string; naturalQueries: string[]; establishmentId?: string };
  try { body = await c.req.json(); } catch { return c.json({ error: 'JSON invalide' }, 400); }

  if (!body.brandName || !body.naturalQueries?.length) {
    return c.json({ error: 'brandName et naturalQueries[] sont requis' }, 400);
  }
  if (body.naturalQueries.length > 20) {
    return c.json({ error: 'Maximum 20 requêtes par tracker' }, 400);
  }

  const blink = getDb(c.env as Env);
  const id = `llm_trk_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;

  const tracker = await blink.db.table<LLMTracker>('llm_trackers').create({
    id,
    userId,
    establishmentId: body.establishmentId ?? '',
    brandName: body.brandName,
    domainUrl: body.domainUrl ?? '',
    naturalQueries: JSON.stringify(body.naturalQueries),
    enginesToCheck: JSON.stringify(['openai', 'gemini', 'perplexity', 'claude']),
    checkFrequency: 'weekly',
    isActive: '1',
    overallVisibilityScore: '0',
  });

  return c.json({ success: true, tracker });
});

// ── GET /api/llm-tracker/list ────────────────────────────────────────────────

router.get('/api/llm-tracker/list', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Non autorisé' }, 401);

  const blink = getDb(c.env as Env);
  const trackers = await blink.db.table<LLMTracker>('llm_trackers').list({
    where: { userId, isActive: '1' },
    orderBy: { createdAt: 'desc' },
    limit: 20,
  });

  return c.json({ trackers });
});

// ── POST /api/llm-tracker/check — Manual check ──────────────────────────────

router.post('/api/llm-tracker/check', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Non autorisé' }, 401);

  let body: { trackerId: string };
  try { body = await c.req.json(); } catch { return c.json({ error: 'JSON invalide' }, 400); }

  if (!body.trackerId) return c.json({ error: 'trackerId requis' }, 400);

  const blink = getDb(c.env as Env);

  // Get tracker
  const trackers = await blink.db.table<LLMTracker>('llm_trackers').list({
    where: { id: body.trackerId, userId },
    limit: 1,
  });
  const tracker = trackers[0];
  if (!tracker) return c.json({ error: 'Tracker non trouvé' }, 404);

  const queries: string[] = JSON.parse(tracker.naturalQueries || '[]');
  const engines: string[] = JSON.parse(tracker.enginesToCheck || '[]');

  // Get API keys from env
  const env = c.env as any;
  const openaiKey = env.OPENAI_API_KEY as string | undefined;
  const geminiKey = env.GEMINI_API_KEY as string | undefined;
  const perplexityKey = env.PERPLEXITY_API_KEY as string | undefined;
  const anthropicKey = env.ANTHROPIC_API_KEY as string | undefined;

  const allResults: any[] = [];
  let totalMentions = 0;
  let totalUrlCitations = 0;
  let totalQueries = 0;

  // Run checks — limit to first 5 queries per run to control costs
  const queriesToCheck = queries.slice(0, 5);

  for (const query of queriesToCheck) {
    const prompt = query;

    const engineCalls: Promise<{ engine: string; text: string; tokens: number; timeMs: number; sources?: string[] }>[] = [];

    if (engines.includes('openai') && openaiKey) {
      engineCalls.push(callOpenAI(prompt, openaiKey).then(r => ({ ...r, engine: 'openai' })));
    }
    if (engines.includes('gemini') && geminiKey) {
      engineCalls.push(callGemini(prompt, geminiKey).then(r => ({ ...r, engine: 'gemini' })));
    }
    if (engines.includes('perplexity') && perplexityKey) {
      engineCalls.push(callPerplexity(prompt, perplexityKey).then(r => ({ ...r, engine: 'perplexity' })));
    }
    if (engines.includes('claude') && anthropicKey) {
      engineCalls.push(callClaude(prompt, anthropicKey).then(r => ({ ...r, engine: 'claude' })));
    }

    const settled = await Promise.allSettled(engineCalls);
    totalQueries++;

    for (const result of settled) {
      if (result.status !== 'fulfilled') continue;
      const { engine, text, tokens, timeMs, sources } = result.value;

      const brand = detectBrand(text, tracker.brandName);
      const url = detectUrl(text, tracker.domainUrl);
      const sentiment = analyzeSentiment(text, tracker.brandName);

      if (brand.mentioned) totalMentions++;
      if (url.cited) totalUrlCitations++;

      const resultId = `llm_res_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
      const record = {
        id: resultId,
        trackerId: tracker.id,
        userId,
        queryText: query,
        engine,
        responseText: text.slice(0, 4000), // cap storage
        brandMentioned: brand.mentioned ? '1' : '0',
        brandPosition: brand.position?.toString() ?? '',
        urlCited: url.cited ? '1' : '0',
        urlCitedText: url.citedUrl,
        sourcesExtracted: JSON.stringify(sources ?? []),
        sentiment,
        tokensUsed: tokens.toString(),
        responseTimeMs: timeMs.toString(),
      };
      await blink.db.table<LLMResult>('llm_tracker_results').create(record);
      allResults.push(record);
    }
  }

  // Calculate overall score
  const totalChecks = totalQueries * engines.filter(e => {
    if (e === 'openai') return !!openaiKey;
    if (e === 'gemini') return !!geminiKey;
    if (e === 'perplexity') return !!perplexityKey;
    if (e === 'claude') return !!anthropicKey;
    return false;
  }).length;
  const score = totalChecks > 0 ? Math.round((totalMentions / totalChecks) * 100) : 0;

  // Update tracker
  await blink.db.table<LLMTracker>('llm_trackers').update(tracker.id, {
    overallVisibilityScore: score.toString(),
    lastCheckAt: new Date().toISOString(),
  });

  // Save history snapshot
  const today = new Date().toISOString().slice(0, 10);
  await blink.db.table<VisibilityHistory>('llm_visibility_history').create({
    id: `llm_hist_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
    trackerId: tracker.id,
    userId,
    score: score.toString(),
    queriesChecked: queriesToCheck.length.toString(),
    brandMentions: totalMentions.toString(),
    urlCitations: totalUrlCitations.toString(),
    snapshotDate: today,
  });

  return c.json({
    success: true,
    score,
    queriesChecked: queriesToCheck.length,
    brandMentions: totalMentions,
    urlCitations: totalUrlCitations,
    totalEngineCalls: totalChecks,
    results: allResults.length,
  });
});

// ── GET /api/llm-tracker/:id/results ────────────────────────────────────────

router.get('/api/llm-tracker/:id/results', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Non autorisé' }, 401);

  const id = c.req.param('id');
  const blink = getDb(c.env as Env);

  const results = await blink.db.table<LLMResult>('llm_tracker_results').list({
    where: { trackerId: id, userId },
    orderBy: { checkedAt: 'desc' },
    limit: 100,
  });

  return c.json({ results });
});

// ── GET /api/llm-tracker/:id/history ────────────────────────────────────────

router.get('/api/llm-tracker/:id/history', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Non autorisé' }, 401);

  const id = c.req.param('id');
  const blink = getDb(c.env as Env);

  const history = await blink.db.table<VisibilityHistory>('llm_visibility_history').list({
    where: { trackerId: id, userId },
    orderBy: { snapshotDate: 'asc' },
    limit: 52, // ~1 year of weekly data
  });

  return c.json({ history });
});

// ── PUT /api/llm-tracker/:id ────────────────────────────────────────────────

router.put('/api/llm-tracker/:id', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Non autorisé' }, 401);

  const id = c.req.param('id');
  let body: { brandName?: string; domainUrl?: string; naturalQueries?: string[]; checkFrequency?: string };
  try { body = await c.req.json(); } catch { return c.json({ error: 'JSON invalide' }, 400); }

  const blink = getDb(c.env as Env);

  // Verify ownership
  const trackers = await blink.db.table<LLMTracker>('llm_trackers').list({ where: { id, userId }, limit: 1 });
  if (!trackers[0]) return c.json({ error: 'Tracker non trouvé' }, 404);

  const updates: Record<string, string> = {};
  if (body.brandName) updates.brandName = body.brandName;
  if (body.domainUrl !== undefined) updates.domainUrl = body.domainUrl;
  if (body.naturalQueries) updates.naturalQueries = JSON.stringify(body.naturalQueries);
  if (body.checkFrequency) updates.checkFrequency = body.checkFrequency;

  await blink.db.table<LLMTracker>('llm_trackers').update(id, updates as any);
  return c.json({ success: true });
});

// ── DELETE /api/llm-tracker/:id ──────────────────────────────────────────────

router.delete('/api/llm-tracker/:id', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Non autorisé' }, 401);

  const id = c.req.param('id');
  const blink = getDb(c.env as Env);

  const trackers = await blink.db.table<LLMTracker>('llm_trackers').list({ where: { id, userId }, limit: 1 });
  if (!trackers[0]) return c.json({ error: 'Tracker non trouvé' }, 404);

  await blink.db.table<LLMTracker>('llm_trackers').update(id, { isActive: '0' } as any);
  return c.json({ success: true });
});

// ── Queue handler entry point (called from index.ts) ─────────────────────────

export async function handleLLMVisibilityCheck(env: Env, payload: any): Promise<{ ok: boolean; score?: number; error?: string }> {
  const { trackerId } = payload ?? {};
  if (!trackerId) return { ok: false, error: 'trackerId required' };

  const blink = createClient({ projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk', secretKey: env.BLINK_SECRET_KEY });

  const trackers = await blink.db.table<LLMTracker>('llm_trackers').list({ where: { id: trackerId, isActive: '1' }, limit: 1 });
  const tracker = trackers[0];
  if (!tracker) return { ok: false, error: 'Tracker not found or inactive' };

  const queries: string[] = JSON.parse(tracker.naturalQueries || '[]');
  const engines: string[] = JSON.parse(tracker.enginesToCheck || '[]');

  const envAny = env as any;
  const openaiKey = envAny.OPENAI_API_KEY as string | undefined;
  const geminiKey = envAny.GEMINI_API_KEY as string | undefined;
  const perplexityKey = envAny.PERPLEXITY_API_KEY as string | undefined;
  const anthropicKey = envAny.ANTHROPIC_API_KEY as string | undefined;

  let totalMentions = 0;
  let totalChecks = 0;

  for (const query of queries.slice(0, 10)) {
    const calls: Promise<{ engine: string; text: string; tokens: number; timeMs: number; sources?: string[] }>[] = [];
    if (engines.includes('openai') && openaiKey) calls.push(callOpenAI(query, openaiKey).then(r => ({ ...r, engine: 'openai' })));
    if (engines.includes('gemini') && geminiKey) calls.push(callGemini(query, geminiKey).then(r => ({ ...r, engine: 'gemini' })));
    if (engines.includes('perplexity') && perplexityKey) calls.push(callPerplexity(query, perplexityKey).then(r => ({ ...r, engine: 'perplexity' })));
    if (engines.includes('claude') && anthropicKey) calls.push(callClaude(query, anthropicKey).then(r => ({ ...r, engine: 'claude' })));

    const settled = await Promise.allSettled(calls);
    for (const result of settled) {
      if (result.status !== 'fulfilled') continue;
      const { engine, text, tokens, timeMs, sources } = result.value;
      const brand = detectBrand(text, tracker.brandName);
      const url = detectUrl(text, tracker.domainUrl);
      totalChecks++;
      if (brand.mentioned) totalMentions++;

      const resultId = `llm_res_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
      await blink.db.table<LLMResult>('llm_tracker_results').create({
        id: resultId, trackerId, userId: tracker.userId, queryText: query, engine,
        responseText: text.slice(0, 4000), brandMentioned: brand.mentioned ? '1' : '0',
        brandPosition: brand.position?.toString() ?? '', urlCited: url.cited ? '1' : '0',
        urlCitedText: url.citedUrl, sourcesExtracted: JSON.stringify(sources ?? []),
        sentiment: analyzeSentiment(text, tracker.brandName), tokensUsed: tokens.toString(),
        responseTimeMs: timeMs.toString(),
      });
    }
  }

  const score = totalChecks > 0 ? Math.round((totalMentions / totalChecks) * 100) : 0;
  await blink.db.table<LLMTracker>('llm_trackers').update(trackerId, { overallVisibilityScore: score.toString(), lastCheckAt: new Date().toISOString() });

  await blink.db.table<VisibilityHistory>('llm_visibility_history').create({
    id: `llm_hist_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
    trackerId, userId: tracker.userId, score: score.toString(),
    queriesChecked: Math.min(queries.length, 10).toString(),
    brandMentions: totalMentions.toString(), urlCitations: '0',
    snapshotDate: new Date().toISOString().slice(0, 10),
  });

  return { ok: true, score };
}
