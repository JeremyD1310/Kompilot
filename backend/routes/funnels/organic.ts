/**
 * Funnels — Organic Traffic Data
 *
 *   GET /api/funnels/:id/organic — deterministic SEO + referring domain data for a funnel
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';

const app = new Hono<{ Bindings: { BLINK_SECRET_KEY: string } }>();

// Seeded pseudo-random to make data deterministic per domain
function pseudo(seed: number, n: number) {
  return ((seed * n * 9301 + 49297) % 233280) / 233280;
}

function domainSeed(domain: string): number {
  return domain.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

function generateOrganicData(domain: string, funnelId: string) {
  const name = domain.split('.')[0] ?? domain;
  const s = domainSeed(domain + funnelId.slice(0, 4));

  const DIFFICULTIES: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];

  const topKeywords = [
    { keyword: `${name} logiciel`, position: Math.floor(pseudo(s, 1) * 10) + 1, volume: Math.floor(pseudo(s, 2) * 5000) + 200, difficulty: DIFFICULTIES[Math.floor(pseudo(s, 15) * 3)] },
    { keyword: `meilleur outil ${name}`, position: Math.floor(pseudo(s, 3) * 15) + 1, volume: Math.floor(pseudo(s, 4) * 3000) + 100, difficulty: DIFFICULTIES[Math.floor(pseudo(s, 16) * 3)] },
    { keyword: `${name} avis`, position: Math.floor(pseudo(s, 5) * 8) + 1, volume: Math.floor(pseudo(s, 6) * 2000) + 50, difficulty: DIFFICULTIES[Math.floor(pseudo(s, 17) * 3)] },
    { keyword: `alternative ${name}`, position: Math.floor(pseudo(s, 7) * 20) + 1, volume: Math.floor(pseudo(s, 8) * 1500) + 50, difficulty: DIFFICULTIES[Math.floor(pseudo(s, 18) * 3)] },
    { keyword: `${name} prix`, position: Math.floor(pseudo(s, 9) * 12) + 1, volume: Math.floor(pseudo(s, 10) * 1000) + 30, difficulty: DIFFICULTIES[Math.floor(pseudo(s, 19) * 3)] },
    { keyword: `tutorial ${name}`, position: Math.floor(pseudo(s, 11) * 25) + 1, volume: Math.floor(pseudo(s, 12) * 800) + 20, difficulty: DIFFICULTIES[Math.floor(pseudo(s, 20) * 3)] },
    { keyword: `${name} gratuit`, position: Math.floor(pseudo(s, 13) * 30) + 1, volume: Math.floor(pseudo(s, 14) * 600) + 10, difficulty: 'easy' as const },
  ];

  const topReferringDomains = [
    { domain: 'producthunt.com', authority: 88, trafficShare: Math.floor(pseudo(s, 21) * 25) + 5 },
    { domain: 'reddit.com', authority: 91, trafficShare: Math.floor(pseudo(s, 22) * 20) + 3 },
    { domain: 'youtube.com', authority: 100, trafficShare: Math.floor(pseudo(s, 23) * 15) + 2 },
    { domain: 'twitter.com', authority: 89, trafficShare: Math.floor(pseudo(s, 24) * 12) + 1 },
    { domain: 'capterra.com', authority: 72, trafficShare: Math.floor(pseudo(s, 25) * 8) + 1 },
    { domain: 'g2.com', authority: 78, trafficShare: Math.floor(pseudo(s, 26) * 6) + 1 },
  ];

  return {
    domain,
    estimatedOrganicTraffic: Math.floor(pseudo(s, 27) * 50000) + 1000,
    topKeywords,
    topReferringDomains,
    lastRefreshedAt: new Date().toISOString(),
  };
}

// ── GET /:id/organic ───────────────────────────────────────────────────────────
app.get('/:id/organic', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const blink = createClient({
      projectId: 'presence-manager-saas-gbrhsehk',
      secretKey: c.env.BLINK_SECRET_KEY,
    });

    const token = authHeader.split(' ')[1];
    const user = await blink.auth.verifyToken(token);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const funnelId = c.req.param('id');

    // Check cache first (< 24 h)
    const cached = await blink.db.funnelOrganicData.list({
      where: { funnelId, userId: user.id },
      limit: 1,
    });

    if (cached.length > 0) {
      const row = cached[0] as Record<string, unknown>;
      const refreshed = new Date(row.lastRefreshedAt as string).getTime();
      if (Date.now() - refreshed < 24 * 60 * 60 * 1000) {
        return c.json({
          domain: row.domain,
          estimatedOrganicTraffic: row.estimatedOrganicTraffic,
          topKeywords: JSON.parse(row.topKeywords as string),
          topReferringDomains: JSON.parse(row.topReferringDomains as string),
          lastRefreshedAt: row.lastRefreshedAt,
        });
      }
    }

    // Fetch funnel domain
    const funnel = await blink.db.funnels.get(funnelId) as Record<string, unknown> | null;
    const domain = (funnel?.domainUrl as string ?? '')
      .replace('https://', '')
      .replace('http://', '')
      .split('/')[0] ?? 'unknown';

    const data = generateOrganicData(domain, funnelId);

    // Upsert cache
    const existingId = cached[0] ? (cached[0] as Record<string, unknown>).id as string : null;

    if (existingId) {
      await blink.db.funnelOrganicData.update(existingId, {
        topKeywords: JSON.stringify(data.topKeywords),
        topReferringDomains: JSON.stringify(data.topReferringDomains),
        estimatedOrganicTraffic: data.estimatedOrganicTraffic,
        lastRefreshedAt: data.lastRefreshedAt,
      });
    } else {
      await blink.db.funnelOrganicData.create({
        id: crypto.randomUUID().replace(/-/g, ''),
        funnelId,
        userId: user.id,
        domain,
        topKeywords: JSON.stringify(data.topKeywords),
        topReferringDomains: JSON.stringify(data.topReferringDomains),
        estimatedOrganicTraffic: data.estimatedOrganicTraffic,
        lastRefreshedAt: data.lastRefreshedAt,
        createdAt: new Date().toISOString(),
      });
    }

    return c.json(data);
  } catch (err) {
    console.error('[organic GET]', err);
    return c.json({ error: 'Failed to fetch organic data' }, 500);
  }
});

export const router = app;
