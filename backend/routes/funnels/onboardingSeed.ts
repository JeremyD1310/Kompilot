/**
 * Funnels — Onboarding seed route
 *
 *   POST /api/funnels/onboarding-seed — save business info + create competitor funnels
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';

const app = new Hono<{ Bindings: { BLINK_SECRET_KEY: string } }>();

app.post('/onboarding-seed', async (c) => {
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

    const body = await c.req.json() as {
      businessName: string;
      businessUrl: string;
      industry: string;
      competitor1Name: string;
      competitor1Url: string;
      competitor2Name?: string;
      competitor2Url?: string;
    };

    const { businessName, businessUrl, industry, competitor1Name, competitor1Url, competitor2Name, competitor2Url } = body;

    if (!businessName || !businessUrl || !competitor1Name || !competitor1Url) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Upsert user_onboarding_v2
    const existing = await blink.db.userOnboardingV2.list({
      where: { userId: user.id },
      limit: 1,
    });

    const onboardingData = {
      userId: user.id,
      businessName,
      businessUrl,
      industry: industry ?? '',
      competitor1Name,
      competitor1Url,
      competitor2Name: competitor2Name ?? '',
      competitor2Url: competitor2Url ?? '',
      hasCompletedOnboarding: 1,
      updatedAt: new Date().toISOString(),
    };

    if (existing.length > 0) {
      const existingRow = existing[0] as Record<string, unknown>;
      await blink.db.userOnboardingV2.update(existingRow.id as string, onboardingData);
    } else {
      await blink.db.userOnboardingV2.create({
        id: crypto.randomUUID().replace(/-/g, ''),
        ...onboardingData,
        createdAt: new Date().toISOString(),
      });
    }

    // Create funnel for competitor 1
    const funnel1Id = crypto.randomUUID().replace(/-/g, '');
    await blink.db.funnels.create({
      id: funnel1Id,
      userId: user.id,
      creatorName: competitor1Name,
      domainUrl: competitor1Url.startsWith('http') ? competitor1Url : `https://${competitor1Url}`,
      estimatedSpend: 0,
      performanceScore: 0,
      platform: 'meta',
      isSample: 0,
      createdAt: new Date().toISOString(),
    });

    const funnelIds: string[] = [funnel1Id];

    // Create funnel for competitor 2 (optional)
    if (competitor2Name && competitor2Url) {
      const funnel2Id = crypto.randomUUID().replace(/-/g, '');
      await blink.db.funnels.create({
        id: funnel2Id,
        userId: user.id,
        creatorName: competitor2Name,
        domainUrl: competitor2Url.startsWith('http') ? competitor2Url : `https://${competitor2Url}`,
        estimatedSpend: 0,
        performanceScore: 0,
        platform: 'meta',
        isSample: 0,
        createdAt: new Date().toISOString(),
      });
      funnelIds.push(funnel2Id);
    }

    return c.json({ success: true, funnelIds });
  } catch (err) {
    console.error('[onboarding-seed POST]', err);
    return c.json({ error: 'Failed to seed onboarding data' }, 500);
  }
});

export const router = app;
