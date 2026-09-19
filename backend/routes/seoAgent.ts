/**
 * Technical SEO Agent — Module 4
 *
 * Autonomous "set-and-forget" agent that crawls a site, analyzes each page,
 * and generates structured JSON-LD schema, optimized meta tags, alt texts,
 * and internal linking suggestions.
 *
 * Endpoints:
 *   POST /api/seo-agent/register      — register a site for analysis
 *   GET  /api/seo-agent/sites         — list registered sites
 *   POST /api/seo-agent/crawl         — start a crawl (async)
 *   GET  /api/seo-agent/:siteId/pages — get page analyses
 *   GET  /api/seo-agent/:siteId/overview — site overview with scores
 *   POST /api/seo-agent/optimize      — trigger AI optimization for a page
 *   PUT  /api/seo-agent/page/:pageId  — update page status (applied/dismissed)
 */

import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

// ── Auth helper ──────────────────────────────────────────────────────────────

function getDb(env: Env) {
  return createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
}

function getUserId(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try { const p = authHeader.split('.')[1]; const d = JSON.parse(atob(p)); return d.sub ?? d.user_id ?? null; }
  catch { return null; }
}

// ── Types ────────────────────────────────────────────────────────────────────

interface SeoAgentSite {
  id: string;
  userId: string;
  establishmentId: string;
  siteUrl: string;
  sitemapUrl: string;
  lastCrawlAt: string;
  crawlStatus: string;
  pagesCrawled: string;
  totalPages: string;
  overallSeoScore: string;
  createdAt: string;
  updatedAt: string;
}

interface PageAnalysis {
  id: string;
  siteId: string;
  userId: string;
  pageUrl: string;
  pageType: string;
  currentTitle: string;
  currentMetaDesc: string;
  currentH1: string;
  currentImagesMissingAlt: string;
  currentSchemaMarkup: string;
  currentInternalLinks: string;
  optimizedTitle: string;
  optimizedMetaDesc: string;
  suggestedSchema: string;
  suggestedAltTexts: string;
  suggestedInternalLinks: string;
  titleScore: string | null;
  metaDescScore: string | null;
  schemaScore: string | null;
  imageAltScore: string | null;
  internalLinkScore: string | null;
  pageScore: string | null;
  status: string;
  analyzedAt: string;
}

interface SeoAgentTask {
  id: string;
  siteId: string;
  userId: string;
  taskType: string;
  pageUrl: string;
  inputData: string;
  outputData: string;
  status: string;
  aiModel: string;
  tokensUsed: string;
  errorMessage: string;
  createdAt: string;
  completedAt: string;
}

// ── HTML Parser Helpers ──────────────────────────────────────────────────────

function extractTag(html: string, tag: string): string {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return match?.[1]?.trim() ?? '';
}

function extractMeta(html: string, name: string): string {
  // Try name="..." and property="..."
  const match = html.match(new RegExp(`<meta[^>]*(?:name|property)="${name}"[^>]*content="([^"]*)"`, 'i'))
    ?? html.match(new RegExp(`<meta[^>]*content="([^"]*)"[^>]*(?:name|property)="${name}"`, 'i'));
  return match?.[1]?.trim() ?? '';
}

function extractSchemaMarkup(html: string): string {
  const match = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (!match) return '';
  return match.map(m => {
    const content = m.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
    return content;
  }).join('\n');
}

function countImagesMissingAlt(html: string): number {
  const imgs = html.match(/<img[^>]*>/gi) ?? [];
  return imgs.filter(img => !img.match(/alt\s*=\s*["'][^"']+["']/i)).length;
}

function extractInternalLinks(html: string, domain: string): string[] {
  const links = html.match(/<a[^>]*href="([^"]*)"[^>]*>/gi) ?? [];
  const domainClean = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return links
    .map(l => {
      const href = l.match(/href="([^"]*)"/i)?.[1] ?? '';
      return href;
    })
    .filter(href => {
      if (href.startsWith('/') || href.startsWith('#')) return true;
      return href.includes(domainClean);
    });
}

function detectPageType(url: string, html: string): string {
  const urlLower = url.toLowerCase();
  const h1 = extractTag(html, 'h1').toLowerCase();
  if (urlLower.match(/\/(index|home)?\/?$/)) return 'homepage';
  if (urlLower.match(/\/(contact|nous-contacter)/)) return 'contact';
  if (urlLower.match(/\/(a-propos|about)/)) return 'about';
  if (urlLower.match(/\/(blog|actualites|news)/)) return 'blog';
  if (urlLower.match(/\/(service|prestation)/)) return 'service';
  if (urlLower.match(/\/(produit|product|shop|boutique)/)) return 'product';
  if (h1.includes('contact')) return 'contact';
  return 'unknown';
}

// ── Scoring helpers ──────────────────────────────────────────────────────────

function scoreTitle(title: string): number {
  if (!title) return 0;
  const len = title.length;
  if (len >= 30 && len <= 60) return 100;
  if (len >= 20 && len <= 70) return 70;
  if (len > 0) return 40;
  return 0;
}

function scoreMetaDesc(desc: string): number {
  if (!desc) return 0;
  const len = desc.length;
  if (len >= 120 && len <= 155) return 100;
  if (len >= 80 && len <= 170) return 70;
  if (len > 0) return 40;
  return 0;
}

function scoreSchema(schema: string): number {
  if (!schema) return 0;
  try {
    const parsed = JSON.parse(schema);
    if (parsed['@context'] === 'https://schema.org' && parsed['@type']) return 100;
    return 50;
  } catch {
    return 0;
  }
}

function scoreImageAlts(missing: number, total: number): number {
  if (total === 0) return 100;
  const ratio = (total - missing) / total;
  return Math.round(ratio * 100);
}

function scoreInternalLinks(count: number): number {
  if (count >= 5) return 100;
  if (count >= 3) return 70;
  if (count >= 1) return 40;
  return 10;
}

// ── Schema JSON-LD generators ────────────────────────────────────────────────

function generateSchemaForPageType(pageType: string, pageUrl: string, title: string, businessName: string): string {
  const base = { '@context': 'https://schema.org' };
  switch (pageType) {
    case 'homepage':
      return JSON.stringify({
        ...base,
        '@type': 'LocalBusiness',
        'name': businessName || title,
        'url': pageUrl,
        'description': title,
      }, null, 2);
    case 'service':
      return JSON.stringify({
        ...base,
        '@type': 'Service',
        'name': title,
        'provider': { '@type': 'LocalBusiness', 'name': businessName },
        'url': pageUrl,
      }, null, 2);
    case 'product':
      return JSON.stringify({
        ...base,
        '@type': 'Product',
        'name': title,
        'brand': { '@type': 'Brand', 'name': businessName },
        'url': pageUrl,
      }, null, 2);
    case 'blog':
      return JSON.stringify({
        ...base,
        '@type': 'Article',
        'headline': title,
        'author': { '@type': 'Organization', 'name': businessName },
        'datePublished': new Date().toISOString(),
        'url': pageUrl,
      }, null, 2);
    case 'contact':
      return JSON.stringify({
        ...base,
        '@type': 'ContactPage',
        'name': title,
        'url': pageUrl,
      }, null, 2);
    default:
      return JSON.stringify({
        ...base,
        '@type': 'WebPage',
        'name': title,
        'url': pageUrl,
      }, null, 2);
  }
}

// ── POST /api/seo-agent/register ─────────────────────────────────────────────

router.post('/api/seo-agent/register', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Non autorisé' }, 401);

  let body: { siteUrl: string; establishmentId?: string; sitemapUrl?: string };
  try { body = await c.req.json(); } catch { return c.json({ error: 'JSON invalide' }, 400); }

  if (!body.siteUrl) return c.json({ error: 'siteUrl requis' }, 400);

  // Normalize URL
  let siteUrl = body.siteUrl.trim();
  if (!siteUrl.startsWith('http')) siteUrl = `https://${siteUrl}`;

  const blink = getDb(c.env as Env);

  // Check if already registered
  const existing = await blink.db.table<SeoAgentSite>('seo_agent_sites').list({
    where: { userId, siteUrl },
    limit: 1,
  });
  if (existing[0]) return c.json({ error: 'Site déjà enregistré', siteId: existing[0].id }, 409);

  const id = `seo_site_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;

  // Try to auto-detect sitemap
  let sitemapUrl = body.sitemapUrl ?? '';
  if (!sitemapUrl) {
    try {
      const smRes = await fetch(`${siteUrl}/sitemap.xml`, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      if (smRes.ok) sitemapUrl = `${siteUrl}/sitemap.xml`;
    } catch { /* no sitemap detected */ }
  }

  const site = await blink.db.table<SeoAgentSite>('seo_agent_sites').create({
    id,
    userId,
    establishmentId: body.establishmentId ?? '',
    siteUrl,
    sitemapUrl,
    crawlStatus: 'pending',
    pagesCrawled: '0',
    totalPages: '0',
    overallSeoScore: '0',
  });

  return c.json({ success: true, site });
});

// ── GET /api/seo-agent/sites ─────────────────────────────────────────────────

router.get('/api/seo-agent/sites', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Non autorisé' }, 401);

  const blink = getDb(c.env as Env);
  const sites = await blink.db.table<SeoAgentSite>('seo_agent_sites').list({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    limit: 10,
  });

  return c.json({ sites });
});

// ── POST /api/seo-agent/crawl — Start a site crawl ──────────────────────────

router.post('/api/seo-agent/crawl', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Non autorisé' }, 401);

  let body: { siteId: string };
  try { body = await c.req.json(); } catch { return c.json({ error: 'JSON invalide' }, 400); }

  const blink = getDb(c.env as Env);
  const sites = await blink.db.table<SeoAgentSite>('seo_agent_sites').list({ where: { id: body.siteId, userId }, limit: 1 });
  const site = sites[0];
  if (!site) return c.json({ error: 'Site non trouvé' }, 404);

  // Update status to crawling
  await blink.db.table<SeoAgentSite>('seo_agent_sites').update(site.id, { crawlStatus: 'crawling' } as any);

  // Discover pages from sitemap or homepage
  const urls: string[] = [];

  // Try sitemap first
  if (site.sitemapUrl) {
    try {
      const smRes = await fetch(site.sitemapUrl, { signal: AbortSignal.timeout(10000) });
      if (smRes.ok) {
        const smText = await smRes.text();
        const locMatches = smText.match(/<loc>([^<]+)<\/loc>/gi) ?? [];
        for (const m of locMatches) {
          const url = m.replace(/<\/?loc>/gi, '').trim();
          if (url.startsWith(site.siteUrl)) urls.push(url);
        }
      }
    } catch { /* sitemap fetch failed */ }
  }

  // Fallback: just crawl the homepage
  if (urls.length === 0) {
    urls.push(site.siteUrl);
  }

  // Limit to 30 pages per crawl
  const pagesToCrawl = urls.slice(0, 30);
  let pagesCrawled = 0;
  const pageScores: number[] = [];

  for (const pageUrl of pagesToCrawl) {
    try {
      const pageRes = await fetch(pageUrl, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Kompilot-SEO-Agent/1.0' },
      });
      if (!pageRes.ok) continue;
      const html = await pageRes.text();

      const title = extractTag(html, 'title');
      const metaDesc = extractMeta(html, 'description');
      const h1 = extractTag(html, 'h1');
      const schema = extractSchemaMarkup(html);
      const missingAlts = countImagesMissingAlt(html);
      const totalImgs = (html.match(/<img[^>]*>/gi) ?? []).length;
      const internalLinks = extractInternalLinks(html, site.siteUrl);
      const pageType = detectPageType(pageUrl, html);

      // Score each dimension
      const titleS = scoreTitle(title);
      const metaS = scoreMetaDesc(metaDesc);
      const schemaS = scoreSchema(schema);
      const altS = scoreImageAlts(missingAlts, totalImgs);
      const linkS = scoreInternalLinks(internalLinks.length);
      const pageScore = Math.round((titleS + metaS + schemaS + altS + linkS) / 5);

      // Generate suggested schema
      const domain = site.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const suggestedSchema = generateSchemaForPageType(pageType, pageUrl, title || h1, domain);

      const pageId = `seo_page_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
      await blink.db.table<PageAnalysis>('seo_agent_page_analyses').create({
        id: pageId,
        siteId: site.id,
        userId,
        pageUrl,
        pageType,
        currentTitle: title,
        currentMetaDesc: metaDesc,
        currentH1: h1,
        currentImagesMissingAlt: missingAlts.toString(),
        currentSchemaMarkup: schema,
        currentInternalLinks: internalLinks.length.toString(),
        optimizedTitle: '',
        optimizedMetaDesc: '',
        suggestedSchema,
        suggestedAltTexts: '[]',
        suggestedInternalLinks: '[]',
        titleScore: titleS.toString(),
        metaDescScore: metaS.toString(),
        schemaScore: schemaS.toString(),
        imageAltScore: altS.toString(),
        internalLinkScore: linkS.toString(),
        pageScore: pageScore.toString(),
        status: 'analyzed',
      });

      pagesCrawled++;
      pageScores.push(pageScore);
    } catch (e: any) {
      console.error(`[SEO Agent] Crawl error for ${pageUrl}:`, e.message);
    }
  }

  // Calculate overall site score
  const overallScore = pageScores.length > 0
    ? Math.round(pageScores.reduce((a, b) => a + b, 0) / pageScores.length)
    : 0;

  await blink.db.table<SeoAgentSite>('seo_agent_sites').update(site.id, {
    crawlStatus: 'completed',
    lastCrawlAt: new Date().toISOString(),
    pagesCrawled: pagesCrawled.toString(),
    totalPages: pagesToCrawl.length.toString(),
    overallSeoScore: overallScore.toString(),
  });

  return c.json({ success: true, pagesCrawled, totalPages: pagesToCrawl.length, overallScore });
});

// ── GET /api/seo-agent/:siteId/pages ────────────────────────────────────────

router.get('/api/seo-agent/:siteId/pages', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Non autorisé' }, 401);

  const siteId = c.req.param('siteId');
  const blink = getDb(c.env as Env);

  const pages = await blink.db.table<PageAnalysis>('seo_agent_page_analyses').list({
    where: { siteId, userId },
    orderBy: { analyzedAt: 'desc' },
    limit: 50,
  });

  return c.json({ pages });
});

// ── GET /api/seo-agent/:siteId/overview ──────────────────────────────────────

router.get('/api/seo-agent/:siteId/overview', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Non autorisé' }, 401);

  const siteId = c.req.param('siteId');
  const blink = getDb(c.env as Env);

  const sites = await blink.db.table<SeoAgentSite>('seo_agent_sites').list({ where: { id: siteId, userId }, limit: 1 });
  const site = sites[0];
  if (!site) return c.json({ error: 'Site non trouvé' }, 404);

  const pages = await blink.db.table<PageAnalysis>('seo_agent_page_analyses').list({
    where: { siteId, userId },
    limit: 100,
  });

  // Aggregate stats
  const stats = {
    total: pages.length,
    avgScore: pages.length > 0 ? Math.round(pages.reduce((sum, p) => sum + (Number(p.pageScore) || 0), 0) / pages.length) : 0,
    titleOptimized: pages.filter(p => Number(p.titleScore) >= 70).length,
    metaOptimized: pages.filter(p => Number(p.metaDescScore) >= 70).length,
    schemaPresent: pages.filter(p => p.currentSchemaMarkup && p.currentSchemaMarkup.length > 10).length,
    imagesMissingAlt: pages.reduce((sum, p) => sum + Number(p.currentImagesMissingAlt || 0), 0),
    pagesWithGoodInternalLinks: pages.filter(p => Number(p.currentInternalLinks) >= 3).length,
    byType: {} as Record<string, number>,
  };

  for (const p of pages) {
    stats.byType[p.pageType] = (stats.byType[p.pageType] || 0) + 1;
  }

  return c.json({ site, stats });
});

// ── POST /api/seo-agent/optimize — AI optimization for a page ────────────────

router.post('/api/seo-agent/optimize', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Non autorisé' }, 401);

  let body: { pageId: string };
  try { body = await c.req.json(); } catch { return c.json({ error: 'JSON invalide' }, 400); }

  const blink = getDb(c.env as Env);
  const pages = await blink.db.table<PageAnalysis>('seo_agent_page_analyses').list({ where: { id: body.pageId, userId }, limit: 1 });
  const page = pages[0];
  if (!page) return c.json({ error: 'Page non trouvée' }, 404);

  const env = c.env as any;
  const anthropicKey = env.ANTHROPIC_API_KEY as string | undefined;

  if (!anthropicKey) {
    // Demo mode: generate basic optimizations without AI
    const optimizedTitle = page.currentTitle.length > 60
      ? page.currentTitle.slice(0, 57) + '...'
      : page.currentTitle || page.currentH1 || 'Page sans titre';
    const optimizedMeta = page.currentMetaDesc || `${page.currentH1 || 'Page'} — Découvrez nos services. Réservez en ligne.`;
    const altText = `${page.currentH1 || 'Image'} — ${page.pageType} page`;

    await blink.db.table<PageAnalysis>('seo_agent_page_analyses').update(page.id, {
      optimizedTitle: optimizedTitle.slice(0, 60),
      optimizedMetaDesc: optimizedMeta.slice(0, 155),
      suggestedAltTexts: JSON.stringify([{ imageUrl: 'all', suggestedAlt: altText }]),
    });

    return c.json({ success: true, mode: 'demo', optimizedTitle, optimizedMeta });
  }

  // Real AI optimization via Claude Sonnet
  const prompt = `Tu es un expert SEO technique. Analyse cette page web et génère des optimisations.

PAGE URL: ${page.pageUrl}
TYPE: ${page.pageType}
TITRE ACTUEL: ${page.currentTitle || '(vide)'}
META DESCRIPTION: ${page.currentMetaDesc || '(vide)'}
H1: ${page.currentH1 || '(vide)'}
IMAGES SANS ALT: ${page.currentImagesMissingAlt}
LIENS INTERNES: ${page.currentInternalLinks}
SCHEMA MARKUP ACTUEL: ${page.currentSchemaMarkup || '(aucun)'}

Retourne UNIQUEMENT un objet JSON avec ce format:
{
  "optimized_title": "string (max 60 caractères)",
  "optimized_meta_desc": "string (max 155 caractères)",
  "suggested_schema": { objet JSON-LD complet },
  "suggested_alt_texts": [{ "imageUrl": "all", "suggestedAlt": "description" }],
  "reasoning": "string expliquant les changements"
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return c.json({ error: `Claude API error: ${errText}` }, 502);
    }

    const data = await res.json() as any;
    const rawText = data.content?.[0]?.text ?? '{}';
    let optimized: any;
    try { optimized = JSON.parse(rawText); } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      optimized = match ? JSON.parse(match[0]) : {};
    }

    const tokensUsed = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);

    await blink.db.table<PageAnalysis>('seo_agent_page_analyses').update(page.id, {
      optimizedTitle: (optimized.optimized_title ?? '').slice(0, 60),
      optimizedMetaDesc: (optimized.optimized_meta_desc ?? '').slice(0, 155),
      suggestedSchema: JSON.stringify(optimized.suggested_schema ?? {}),
      suggestedAltTexts: JSON.stringify(optimized.suggested_alt_texts ?? []),
    });

    // Log task
    await blink.db.table<SeoAgentTask>('seo_agent_tasks').create({
      id: `seo_task_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      siteId: page.siteId,
      userId,
      taskType: 'optimize_page',
      pageUrl: page.pageUrl,
      inputData: JSON.stringify({ pageId: page.id }),
      outputData: JSON.stringify(optimized),
      status: 'completed',
      aiModel: 'claude-sonnet-4-20250514',
      tokensUsed: tokensUsed.toString(),
    });

    return c.json({ success: true, optimized, tokensUsed });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── PUT /api/seo-agent/page/:pageId ─────────────────────────────────────────

router.put('/api/seo-agent/page/:pageId', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Non autorisé' }, 401);

  const pageId = c.req.param('pageId');
  let body: { status: string };
  try { body = await c.req.json(); } catch { return c.json({ error: 'JSON invalide' }, 400); }

  if (!['analyzed', 'optimized', 'exported', 'applied', 'dismissed'].includes(body.status)) {
    return c.json({ error: 'Status invalide' }, 400);
  }

  const blink = getDb(c.env as Env);
  const pages = await blink.db.table<PageAnalysis>('seo_agent_page_analyses').list({ where: { id: pageId, userId }, limit: 1 });
  if (!pages[0]) return c.json({ error: 'Page non trouvée' }, 404);

  await blink.db.table<PageAnalysis>('seo_agent_page_analyses').update(pageId, { status: body.status } as any);
  return c.json({ success: true });
});

// ── Queue handler entry point (called from index.ts) ─────────────────────────

export async function handleSeoAgentCrawl(env: Env, payload: any): Promise<{ ok: boolean; pagesCrawled?: number; error?: string }> {
  const { siteId, userId } = payload ?? {};
  if (!siteId || !userId) return { ok: false, error: 'siteId and userId required' };

  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });

  const sites = await blink.db.table<SeoAgentSite>('seo_agent_sites').list({ where: { id: siteId, userId }, limit: 1 });
  const site = sites[0];
  if (!site) return { ok: false, error: 'Site not found' };

  await blink.db.table<SeoAgentSite>('seo_agent_sites').update(siteId, { crawlStatus: 'crawling' } as any);

  const urls: string[] = [];
  if (site.sitemapUrl) {
    try {
      const smRes = await fetch(site.sitemapUrl, { signal: AbortSignal.timeout(10000) });
      if (smRes.ok) {
        const smText = await smRes.text();
        const locMatches = smText.match(/<loc>([^<]+)<\/loc>/gi) ?? [];
        for (const m of locMatches) {
          const url = m.replace(/<\/?loc>/gi, '').trim();
          if (url.startsWith(site.siteUrl)) urls.push(url);
        }
      }
    } catch { /* noop */ }
  }
  if (urls.length === 0) urls.push(site.siteUrl);

  const pagesToCrawl = urls.slice(0, 30);
  let pagesCrawled = 0;
  const pageScores: number[] = [];

  for (const pageUrl of pagesToCrawl) {
    try {
      const pageRes = await fetch(pageUrl, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Kompilot-SEO-Agent/1.0' } });
      if (!pageRes.ok) continue;
      const html = await pageRes.text();

      const title = extractTag(html, 'title');
      const metaDesc = extractMeta(html, 'description');
      const h1 = extractTag(html, 'h1');
      const schema = extractSchemaMarkup(html);
      const missingAlts = countImagesMissingAlt(html);
      const totalImgs = (html.match(/<img[^>]*>/gi) ?? []).length;
      const internalLinks = extractInternalLinks(html, site.siteUrl);
      const pageType = detectPageType(pageUrl, html);

      const titleS = scoreTitle(title);
      const metaS = scoreMetaDesc(metaDesc);
      const schemaS = scoreSchema(schema);
      const altS = scoreImageAlts(missingAlts, totalImgs);
      const linkS = scoreInternalLinks(internalLinks.length);
      const pageScore = Math.round((titleS + metaS + schemaS + altS + linkS) / 5);

      const domain = site.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const suggestedSchema = generateSchemaForPageType(pageType, pageUrl, title || h1, domain);

      const pageId = `seo_page_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
      await blink.db.table<PageAnalysis>('seo_agent_page_analyses').create({
        id: pageId, siteId: site.id, userId, pageUrl, pageType,
        currentTitle: title, currentMetaDesc: metaDesc, currentH1: h1,
        currentImagesMissingAlt: missingAlts.toString(), currentSchemaMarkup: schema,
        currentInternalLinks: internalLinks.length.toString(),
        optimizedTitle: '', optimizedMetaDesc: '', suggestedSchema,
        suggestedAltTexts: '[]', suggestedInternalLinks: '[]',
        titleScore: titleS.toString(), metaDescScore: metaS.toString(),
        schemaScore: schemaS.toString(), imageAltScore: altS.toString(),
        internalLinkScore: linkS.toString(), pageScore: pageScore.toString(),
        status: 'analyzed',
      });

      pagesCrawled++;
      pageScores.push(pageScore);
    } catch { /* skip failed pages */ }
  }

  const overallScore = pageScores.length > 0 ? Math.round(pageScores.reduce((a, b) => a + b, 0) / pageScores.length) : 0;
  await blink.db.table<SeoAgentSite>('seo_agent_sites').update(siteId, {
    crawlStatus: 'completed', lastCrawlAt: new Date().toISOString(),
    pagesCrawled: pagesCrawled.toString(), totalPages: pagesToCrawl.length.toString(),
    overallSeoScore: overallScore.toString(),
  });

  return { ok: true, pagesCrawled };
}
