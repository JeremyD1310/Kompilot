/**
 * Unified Publishing Routes
 *
 * POST /api/publish/now           — Publish immediately to all connected platforms
 * POST /api/publish/schedule      — Schedule a post for future publishing
 * POST /api/publish/scheduler/run — Process due scheduled posts (cron trigger)
 * GET  /api/publish/status/:id    — Get post publishing status
 * POST /api/publish/retry/:id     — Retry a failed post
 */

import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import { decryptMetaUserToken } from '../lib/metaAccountStore';
import { getUserPages, publishToMultiplePlatforms, publishToFacebookPage, publishToInstagram, publishInstagramReel } from '../lib/metaPublishingService';
import { createLocalPost } from '../lib/googleBusinessService';
import { postToLinkedIn, getProfile } from '../lib/linkedinPublishingService';
import { postToTikTok } from '../lib/tiktokService';
import { uploadShort } from '../lib/youtubeService';
import type { PublishResult } from '../lib/metaPublishingService';
import type { Env } from '../lib/types';
import { consumeContentQuota, releaseContentQuota } from '../lib/contentQuota';

export const router = new Hono<{ Bindings: Env }>();

async function getUserId(authHeader: string | undefined, env?: Env): Promise<string | null> {
  if (!authHeader || !env) return null;
  try {
    const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
    const verified = await blink.auth.verifyToken(authHeader);
    return verified.valid ? verified.userId : null;
  } catch { return null; }
}

function normalizePlatform(value: string): string {
  const key = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (key === 'google' || key === 'google_business' || key === 'googlebusiness' || key === 'gbp') return 'google_business';
  if (key === 'whatsapp' || key === 'whats_app') return 'whatsapp';
  return key;
}

function normalizeChannels(channels: string[]): string[] {
  return [...new Set((channels || []).map(normalizePlatform).filter(Boolean))];
}

/** MVP recurrence calculator: operates on the supplied ISO instant in UTC.
 * timezone is persisted for future timezone-aware scheduling, but is intentionally
 * not applied during this MVP calculation.
 */
export function getNextOccurrence(at: string, recurrence: Campaign['recurrence']): string {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) throw new Error('startsAt/nextRunAt must be a valid ISO date');
  const days = recurrence === 'daily' ? 1 : recurrence === 'weekly' ? 7 : recurrence === 'twice_weekly' ? 3.5 : 0;
  if (days) date.setUTCMinutes(date.getUTCMinutes() + days * 24 * 60);
  else date.setUTCMonth(date.getUTCMonth() + 1);
  return date.toISOString();
}

interface Campaign {
  id: string; userId: string; name: string; textTemplate: string; channels: string;
  platformVariants: string; imageUrl?: string; recurrence: 'daily'|'weekly'|'twice_weekly'|'monthly';
  timezone: string; startsAt: string; endsAt?: string; maxOccurrences?: number;
  status: 'active'|'paused'|'completed'; nextRunAt: string; occurrenceCount: number;
}

interface ScheduledPost {
  id: string; userId: string; textContent: string; imageUrl?: string;
  scheduledAt: string; channels: string; status: string;
  platformVariants?: string; createdAt: string; campaignId?: string;
}

async function getMetaAccessToken(userId: string, blink: any, tokenStore: any, encryptionKey?: string): Promise<string | null> {
  const connection = await decryptMetaUserToken(blink, userId, encryptionKey || '');
  if (connection?.accessToken) return connection.accessToken;
  const legacyToken = await tokenStore.getByUser(userId, 'meta');
  return legacyToken ? tokenStore.decryptAccessToken(legacyToken.accessToken) : null;
}

// ── POST /api/publish/now ────────────────────────────────────────────────────

router.post('/api/publish/now', async (c) => {
  const userId = await getUserId(c.req.header('Authorization'), c.env as unknown as Env);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const env = c.env as unknown as Env;
  const body = await c.req.json() as { postId?: string; channels: string[]; text: string; imageUrl?: string; videoUrl?: string; pageId?: string; platformVariants?: Record<string, string> };
  body.channels = normalizeChannels(body.channels);
  if (!body.text?.trim()) return c.json({ error: 'text is required' }, 400);
  if (!body.channels?.length) return c.json({ error: 'At least one channel required' }, 400);

  const quota = await consumeContentQuota(env, userId, 1, 'content_publication');
  if (!quota.success) return c.json({ error: 'CONTENT_QUOTA_EXCEEDED', ...quota }, 429);

  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const tokenStore = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const results: PublishResult[] = [];

  // ── Meta channels (Facebook + Instagram)
  const metaChannels = body.channels.filter(c => c === 'facebook' || c === 'instagram');
  let metaConnected = false;
  if (metaChannels.length > 0) {
    const metaAccessToken = await getMetaAccessToken(userId, blink, tokenStore, (env as any).TOKEN_ENCRYPTION_KEY);
    metaConnected = !!metaAccessToken;
    if (!metaAccessToken) {
      for (const platform of metaChannels) results.push({ success: false, platform: platform as 'facebook' | 'instagram', error: 'Not connected to Meta. Connect in Settings.' });
    } else {
      const pages = await getUserPages(metaAccessToken);
      const targetPage = body.pageId ? pages.find(p => p.id === body.pageId) : pages[0];
      if (!targetPage) {
        for (const platform of metaChannels) results.push({ success: false, platform: platform as 'facebook' | 'instagram', error: 'No Facebook Page found for the connected Meta account.' });
      } else {
        const payload = { text: body.platformVariants?.facebook || body.text, imageUrl: body.imageUrl };
        if (metaChannels.includes('facebook')) results.push(await publishToFacebookPage(targetPage.id, targetPage.access_token, payload));
        if (metaChannels.includes('instagram') && targetPage.instagram_business_account) {
          // Use Reels API if videoUrl is provided, otherwise use standard image publish
          if (body.videoUrl) {
            results.push(await publishInstagramReel(targetPage.instagram_business_account.id, targetPage.access_token, body.platformVariants?.instagram || body.text, body.videoUrl));
          } else {
            results.push(await publishToInstagram(targetPage.instagram_business_account.id, targetPage.access_token, { text: body.platformVariants?.instagram || body.text, imageUrl: body.imageUrl }));
          }
        } else if (metaChannels.includes('instagram')) {
          results.push({ success: false, platform: 'instagram', error: 'No Instagram Business account linked to this Page.' });
        }
      }
    }
  }

  // ── Google Business
  if (body.channels.includes('google_business')) {
    const gbpToken = await tokenStore.getByUser(userId, 'google_business');
    if (!gbpToken) {
      results.push({ success: false, platform: 'google_business', error: 'Not connected to Google Business. Connect in Settings.' });
    } else {
      try {
        const decrypted = await tokenStore.decryptAccessToken(gbpToken.accessToken);
        // Get first location automatically
        const accounts = await (await import('../lib/googleBusinessService')).getAccounts(decrypted);
        if (accounts.length === 0) { results.push({ success: false, platform: 'google_business', error: 'No Google Business account found.' }); }
        else {
          const locations = await (await import('../lib/googleBusinessService')).getLocations(decrypted, accounts[0].name);
          if (locations.length === 0) { results.push({ success: false, platform: 'google_business', error: 'No business locations found.' }); }
          else {
            await createLocalPost(decrypted, locations[0].name, body.text, body.imageUrl);
            results.push({ success: true, platform: 'google_business', postId: 'local_post' });
          }
        }
      } catch (err) {
        results.push({ success: false, platform: 'google_business', error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }
  }

  if (body.channels.includes('whatsapp')) {
    results.push({ success: false, platform: 'whatsapp' as any, error: 'WhatsApp publishing is not supported yet.' });
  }

  // ── LinkedIn
  if (body.channels.includes('linkedin')) {
    const liToken = await tokenStore.getByUser(userId, 'linkedin');
    if (!liToken) {
      results.push({ success: false, platform: 'linkedin', error: 'Not connected to LinkedIn. Connect in Settings.' });
    } else {
      try {
        const decrypted = await tokenStore.decryptAccessToken(liToken.accessToken);
        const profile = await getProfile(decrypted);
        const personUrn = profile.sub.startsWith('urn:') ? profile.sub : `urn:li:person:${profile.sub}`;
        const liText = body.platformVariants?.linkedin || body.text;
        results.push(await postToLinkedIn(decrypted, personUrn, liText, body.imageUrl));
      } catch (err) {
        results.push({ success: false, platform: 'linkedin', error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }
  }

  // ── Instagram (standalone — uses 'instagram' provider token)
  if (body.channels.includes('instagram')) {
    // Use the standalone provider only when the Meta connection is absent.
    if (!metaConnected) {
      const igToken = await tokenStore.getByUser(userId, 'instagram');
      if (!igToken) {
        results.push({ success: false, platform: 'instagram', error: 'Not connected to Instagram. Connect in Settings.' });
      } else {
        try {
          const decrypted = await tokenStore.decryptAccessToken(igToken.accessToken);
          const pages = await getUserPages(decrypted);
          const pageWithIg = pages.find((p: any) => p.instagram_business_account);
          if (!pageWithIg || !pageWithIg.instagram_business_account) {
            results.push({ success: false, platform: 'instagram', error: 'No Instagram Business account found.' });
          } else {
            const igText = body.platformVariants?.instagram || body.text;
            results.push(await publishToInstagram(pageWithIg.instagram_business_account.id, pageWithIg.access_token, { text: igText, imageUrl: body.imageUrl }));
          }
        } catch (err) {
          results.push({ success: false, platform: 'instagram', error: err instanceof Error ? err.message : 'Unknown error' });
        }
      }
    }
  }

  // ── TikTok
  if (body.channels.includes('tiktok')) {
    const ttToken = await tokenStore.getByUser(userId, 'tiktok');
    if (!ttToken) {
      results.push({ success: false, platform: 'tiktok' as any, error: 'Not connected to TikTok. Connect in Settings.' });
    } else {
      try {
        const decrypted = await tokenStore.decryptAccessToken(ttToken.accessToken);
        const ttText = body.platformVariants?.tiktok || body.text;
        const ttResult = await postToTikTok(decrypted, body.imageUrl || '', ttText.substring(0, 150), ttText);
        results.push(ttResult as any);
      } catch (err) {
        results.push({ success: false, platform: 'tiktok' as any, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }
  }

  // ── YouTube Shorts
  if (body.channels.includes('youtube')) {
    const ytToken = await tokenStore.getByUser(userId, 'youtube');
    if (!ytToken) {
      results.push({ success: false, platform: 'youtube' as any, error: 'Not connected to YouTube. Connect in Settings.' });
    } else if (!body.videoUrl) {
      results.push({ success: false, platform: 'youtube' as any, error: 'YouTube Shorts requires a video URL.' });
    } else {
      try {
        const decrypted = await tokenStore.decryptAccessToken(ytToken.accessToken);
        const ytText = body.platformVariants?.youtube || body.text;
        const ytResult = await uploadShort(decrypted, body.videoUrl, ytText.substring(0, 100), ytText);
        results.push(ytResult as any);
      } catch (err) {
        results.push({ success: false, platform: 'youtube' as any, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }
  }

  // ── Facebook standalone (uses 'facebook' provider token, not 'meta')
  if (body.channels.includes('facebook')) {
    // Only process if facebook wasn't already handled by the meta block
    // Check if the meta block already processed facebook (meta token exists)
    const metaToken = await tokenStore.getByUser(userId, 'meta');
    if (!metaToken) {
      // No meta token — use standalone facebook provider
      const fbToken = await tokenStore.getByUser(userId, 'facebook');
      if (!fbToken) {
        results.push({ success: false, platform: 'facebook', error: 'Not connected to Facebook. Connect in Settings.' });
      } else {
        try {
          const decrypted = await tokenStore.decryptAccessToken(fbToken.accessToken);
          const pages = await getUserPages(decrypted);
          const targetPage = body.pageId ? pages.find(p => p.id === body.pageId) : pages[0];
          if (!targetPage) {
            results.push({ success: false, platform: 'facebook', error: 'No Facebook Page found.' });
          } else {
            const fbText = body.platformVariants?.facebook || body.text;
            results.push(await publishToFacebookPage(targetPage.id, targetPage.access_token, { text: fbText, imageUrl: body.imageUrl }));
          }
        } catch (err) {
          results.push({ success: false, platform: 'facebook', error: err instanceof Error ? err.message : 'Unknown error' });
        }
      }
    }
    // If metaToken exists, the meta block above already handled facebook
  }

  // Update post status only after confirming it belongs to the authenticated user.
  if (body.postId) {
    try {
      const ownedPost = await (blink.db.table<ScheduledPost>('scheduled_posts') as any).list({ where: { id: body.postId, userId }, limit: 1 });
      if (ownedPost[0]) {
        await (blink.db.table<ScheduledPost>('scheduled_posts') as any).update(body.postId, { status: results.some(r => r.success) ? 'published' : 'failed' });
      }
    } catch {
      // Status update is best-effort; publishing results remain authoritative.
    }
  }

  const published = results.some(r => r.success);
  if (!published) await releaseContentQuota(env, userId, 1);
  return c.json({ success: published, results });
});

// ── POST /api/publish/schedule ──────────────────────────────────────────────

router.post('/api/publish/schedule', async (c) => {
  const userId = await getUserId(c.req.header('Authorization'), c.env as unknown as Env);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const env = c.env as unknown as Env;
  const body = await c.req.json() as { text: string; channels: string[]; scheduledAt: string; imageUrl?: string; videoUrl?: string; pageId?: string; platformVariants?: Record<string, string> };
  body.channels = normalizeChannels(body.channels);
  if (!body.text?.trim() || !body.channels?.length || !body.scheduledAt) return c.json({ error: 'text, channels, scheduledAt required' }, 400);
  const scheduledDate = new Date(body.scheduledAt);
  if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) return c.json({ error: 'scheduledAt must be a valid future ISO date' }, 400);
  body.scheduledAt = scheduledDate.toISOString();
  const quota = await consumeContentQuota(env, userId, 1, 'content_publication');
  if (!quota.success) return c.json({ error: 'CONTENT_QUOTA_EXCEEDED', ...quota }, 429);
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  // Store videoUrl inside platformVariants as _videoUrl since the table has no dedicated column
  const variants: Record<string, string> = { ...(body.platformVariants || {}) };
  if (body.videoUrl) variants._videoUrl = body.videoUrl;
  if (body.pageId) variants._pageId = body.pageId;
  try {
    const post = await (blink.db.table('scheduled_posts') as any).create({
      userId, textContent: body.text, channels: JSON.stringify(body.channels),
      scheduledAt: body.scheduledAt, status: 'scheduled', imageUrl: body.imageUrl || '',
      platformVariants: JSON.stringify(variants),
    });
    return c.json({ success: true, post: { id: post.id, scheduledAt: body.scheduledAt, channels: body.channels, status: 'scheduled' } });
  } catch (error) {
    await releaseContentQuota(env, userId, 1);
    return c.json({ error: error instanceof Error ? error.message : 'Unable to schedule post' }, 500);
  }
});

// ── Campaign CRUD ─────────────────────────────────────────────────────────────

function campaignClient(env: Env) {
  return createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
}

router.get('/api/publish/campaigns', async (c) => {
  const userId = await getUserId(c.req.header('Authorization'), c.env as unknown as Env);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const campaigns = await campaignClient(c.env as unknown as Env).db.table<Campaign>('publishing_campaigns').list({ where: { userId }, orderBy: { createdAt: 'desc' } });
  return c.json({ campaigns });
});

router.post('/api/publish/campaigns', async (c) => {
  const userId = await getUserId(c.req.header('Authorization'), c.env as unknown as Env);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json() as Partial<Campaign>;
  const allowed = ['daily','weekly','twice_weekly','monthly'];
  const channels = normalizeChannels(Array.isArray(body.channels) ? body.channels : []);
  if (!body.name?.trim() || !body.textTemplate?.trim() || !body.startsAt || !allowed.includes(body.recurrence || '') || !channels.length) return c.json({ error: 'name, textTemplate, channels, recurrence and startsAt are required' }, 400);
  try {
    const startsAt = new Date(body.startsAt).toISOString();
    const endsAt = body.endsAt ? new Date(body.endsAt).toISOString() : null;
    if (endsAt && endsAt < startsAt) return c.json({ error: 'endsAt must be after startsAt' }, 400);
    const campaign = await campaignClient(c.env as unknown as Env).db.table<Campaign>('publishing_campaigns').create({
      name: body.name.trim(), textTemplate: body.textTemplate.trim(), channels: JSON.stringify(channels), platformVariants: JSON.stringify(body.platformVariants || {}), imageUrl: body.imageUrl || '', recurrence: body.recurrence, timezone: body.timezone || 'UTC', startsAt, endsAt, maxOccurrences: body.maxOccurrences || null, status: 'active', nextRunAt: startsAt, occurrenceCount: 0, userId,
    } as any);
    return c.json({ campaign }, 201);
  } catch (e) { return c.json({ error: e instanceof Error ? e.message : 'Unable to create campaign' }, 400); }
});

router.patch('/api/publish/campaigns/:id', async (c) => {
  const userId = await getUserId(c.req.header('Authorization'), c.env as unknown as Env);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const table = campaignClient(c.env as unknown as Env).db.table<Campaign>('publishing_campaigns');
  const existing = (await table.list({ where: { id: c.req.param('id'), userId }, limit: 1 }))[0];
  if (!existing) return c.json({ error: 'Campaign not found' }, 404);
  const body = await c.req.json() as Partial<Campaign>;
  const allowedRecurrences = ['daily','weekly','twice_weekly','monthly'];
  const allowedStatuses = ['active', 'paused'];
  const patch: any = {};
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.textTemplate === 'string' && body.textTemplate.trim()) patch.textTemplate = body.textTemplate.trim();
  if (body.channels) {
    const channels = normalizeChannels(body.channels as string[]);
    if (!channels.length) return c.json({ error: 'At least one channel is required' }, 400);
    patch.channels = JSON.stringify(channels);
  }
  if (body.platformVariants) patch.platformVariants = JSON.stringify(body.platformVariants);
  if (body.recurrence && allowedRecurrences.includes(body.recurrence)) patch.recurrence = body.recurrence;
  if (body.status && allowedStatuses.includes(body.status)) patch.status = body.status;
  if (body.startsAt) patch.startsAt = new Date(body.startsAt).toISOString();
  if (body.endsAt !== undefined) patch.endsAt = body.endsAt ? new Date(body.endsAt).toISOString() : null;
  if (body.timezone) patch.timezone = body.timezone;
  if (body.imageUrl !== undefined) patch.imageUrl = body.imageUrl || '';
  if (patch.startsAt && patch.endsAt && patch.endsAt < patch.startsAt) return c.json({ error: 'endsAt must be after startsAt' }, 400);
  if (!Object.keys(patch).length) return c.json({ error: 'No valid fields to update' }, 400);
  try { return c.json({ campaign: await table.update(existing.id, patch) }); } catch (e) { return c.json({ error: e instanceof Error ? e.message : 'Unable to update campaign' }, 400); }
});

router.delete('/api/publish/campaigns/:id', async (c) => {
  const userId = await getUserId(c.req.header('Authorization'), c.env as unknown as Env);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const table = campaignClient(c.env as unknown as Env).db.table<Campaign>('publishing_campaigns');
  const existing = (await table.list({ where: { id: c.req.param('id'), userId }, limit: 1 }))[0];
  if (!existing) return c.json({ error: 'Campaign not found' }, 404);
  await table.delete(existing.id); return c.json({ success: true });
});

// ── POST /api/publish/scheduler/run ──────────────────────────────────────────

router.post('/api/publish/scheduler/run', async (c) => {
  const env = c.env as unknown as Env;
  const schedulerSecret = ((env as any).KOMPILOT_SCHEDULER_SECRET || env.BLINK_SECRET_KEY) as string | undefined;
  const providedSecret = c.req.header('X-Kompilot-Scheduler-Secret');
  if (!schedulerSecret || providedSecret !== schedulerSecret) return c.json({ error: 'Unauthorized scheduler request' }, 401);
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const tokenStore = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const postsTable = blink.db.table<ScheduledPost>('scheduled_posts');
  const campaignsTable = blink.db.table<Campaign>('publishing_campaigns');
  const now = new Date().toISOString();
  // Materialize every missed active run. Deterministic IDs make retries idempotent.
  const campaigns = await campaignsTable.list({ where: { status: 'active' } });
  for (const campaign of campaigns) {
    let runAt = campaign.nextRunAt || campaign.startsAt;
    let count = Number(campaign.occurrenceCount || 0);
    let channels: string[] = [];
    try { channels = normalizeChannels(JSON.parse(campaign.channels || '[]')); } catch { channels = []; }
    const variants = campaign.platformVariants || '{}';
    while (runAt && runAt <= now && (!campaign.endsAt || runAt <= campaign.endsAt) && (!campaign.maxOccurrences || count < campaign.maxOccurrences)) {
      const postId = `campaign_${campaign.id}_${count + 1}`;
      const existing = await postsTable.get(postId);
      if (!existing) await postsTable.create({ id: postId, userId: campaign.userId, textContent: campaign.textTemplate, imageUrl: campaign.imageUrl || '', scheduledAt: runAt, channels: typeof channels === 'string' ? channels : JSON.stringify(channels), platformVariants: variants, status: 'scheduled', campaignId: campaign.id } as any);
      count++;
      runAt = getNextOccurrence(runAt, campaign.recurrence);
    }
    const completed = Boolean((campaign.maxOccurrences && count >= campaign.maxOccurrences) || (campaign.endsAt && runAt > campaign.endsAt));
    if (count !== Number(campaign.occurrenceCount || 0) || completed) await campaignsTable.update(campaign.id, { occurrenceCount: count, nextRunAt: runAt, status: completed ? 'completed' : 'active' } as any);
  }
  const allScheduled = await postsTable.list({ where: { status: 'scheduled' } });
  const duePosts = allScheduled.filter(p => p.scheduledAt && p.scheduledAt <= now);

  if (duePosts.length === 0) return c.json({ processed: 0, published: 0, failed: 0 });

  let published = 0, failed = 0;
  const claimsTable = blink.db.table<any>('scheduled_post_claims');
  for (const post of duePosts) {
    try {
      try {
        await claimsTable.create({ postId: post.id, claimedAt: new Date().toISOString(), claimToken: crypto.randomUUID() });
      } catch (claimError: any) {
        if (claimError?.status === 409 || claimError?.details?.code === '23505') continue;
        throw claimError;
      }
      await postsTable.update(post.id, { status: 'processing' });
      let channels: string[] = [];
      try { channels = normalizeChannels(JSON.parse(post.channels || '[]')); } catch { channels = []; }
      let variants: Record<string, string> = {};
      try { variants = JSON.parse(post.platformVariants || '{}'); } catch { variants = {}; }

      // Extract videoUrl stored inside platformVariants by /api/publish/schedule
      const videoUrl: string | undefined = variants._videoUrl || undefined;
      const selectedPageId: string | undefined = variants._pageId || undefined;
      // Remove internal keys before passing variants to publish functions
      const cleanVariants: Record<string, string> = { ...variants };
      delete cleanVariants._videoUrl;
      delete cleanVariants._pageId;

      const publishBody = { postId: post.id, channels, text: post.textContent, imageUrl: post.imageUrl || undefined, videoUrl, platformVariants: cleanVariants };
      // Re-use the /api/publish/now logic by simulating a request
      const metaChannels = channels.filter(c => c === 'facebook' || c === 'instagram');
      const results: PublishResult[] = [];

      if (channels.includes('whatsapp')) results.push({ success: false, platform: 'whatsapp' as any, error: 'WhatsApp publishing is not supported yet.' });

      if (metaChannels.length > 0) {
        const metaAccessToken = await getMetaAccessToken(post.userId, blink, tokenStore, (env as any).TOKEN_ENCRYPTION_KEY);
        if (metaAccessToken) {
          const pages = await getUserPages(metaAccessToken);
          const page = selectedPageId ? pages.find(p => p.id === selectedPageId) : pages[0];
          if (page) {
            if (metaChannels.includes('facebook')) results.push(await publishToFacebookPage(page.id, page.access_token, { text: variants.facebook || post.textContent, imageUrl: post.imageUrl }));
            if (metaChannels.includes('instagram') && page.instagram_business_account) {
              // Use Reels API if videoUrl is present, otherwise standard image publish
              if (videoUrl) {
                results.push(await publishInstagramReel(page.instagram_business_account.id, page.access_token, cleanVariants.instagram || post.textContent, videoUrl));
              } else {
                results.push(await publishToInstagram(page.instagram_business_account.id, page.access_token, { text: cleanVariants.instagram || post.textContent, imageUrl: post.imageUrl }));
              }
            }
          }
        } else {
          for (const platform of metaChannels) results.push({ success: false, platform: platform as any, error: 'Meta is not connected.' });
        }
      }

      // ── LinkedIn (scheduler)
      if (channels.includes('linkedin')) {
        const liToken = await tokenStore.getByUser(post.userId, 'linkedin');
        if (liToken) {
          try {
            const decrypted = await tokenStore.decryptAccessToken(liToken.accessToken);
            const profile = await getProfile(decrypted);
            const personUrn = profile.sub.startsWith('urn:') ? profile.sub : `urn:li:person:${profile.sub}`;
            results.push(await postToLinkedIn(decrypted, personUrn, variants.linkedin || post.textContent, post.imageUrl));
          } catch {
            results.push({ success: false, platform: 'linkedin' as const, error: 'LinkedIn publish failed' });
          }
        } else results.push({ success: false, platform: 'linkedin' as const, error: 'LinkedIn is not connected.' });
      }

      // ── Instagram standalone (scheduler) — only when Meta is not connected
      if (channels.includes('instagram') && !(await getMetaAccessToken(post.userId, blink, tokenStore, (env as any).TOKEN_ENCRYPTION_KEY))) {
        const igToken = await tokenStore.getByUser(post.userId, 'instagram');
        if (igToken) {
          try {
            const decrypted = await tokenStore.decryptAccessToken(igToken.accessToken);
            const pages = await getUserPages(decrypted);
            const pageWithIg = pages.find((p: any) => p.instagram_business_account);
            if (pageWithIg && pageWithIg.instagram_business_account) {
              if (videoUrl) {
                results.push(await publishInstagramReel(pageWithIg.instagram_business_account.id, pageWithIg.access_token, cleanVariants.instagram || post.textContent, videoUrl));
              } else {
                results.push(await publishToInstagram(pageWithIg.instagram_business_account.id, pageWithIg.access_token, { text: cleanVariants.instagram || post.textContent, imageUrl: post.imageUrl }));
              }
            }
          } catch {
            results.push({ success: false, platform: 'instagram' as const, error: 'Instagram standalone publish failed' });
          }
        }
      }

      // ── TikTok (scheduler)
      if (channels.includes('tiktok')) {
        const ttToken = await tokenStore.getByUser(post.userId, 'tiktok');
        if (ttToken) {
          try {
            const decrypted = await tokenStore.decryptAccessToken(ttToken.accessToken);
            const ttText = variants.tiktok || post.textContent;
            const ttResult = await postToTikTok(decrypted, post.imageUrl || '', ttText.substring(0, 150), ttText);
            results.push(ttResult as any);
          } catch {
            results.push({ success: false, platform: 'tiktok' as any, error: 'TikTok publish failed' });
          }
        } else results.push({ success: false, platform: 'tiktok' as any, error: 'TikTok is not connected.' });
      }

      // ── YouTube Shorts (scheduler)
      if (channels.includes('youtube')) {
        const ytToken = await tokenStore.getByUser(post.userId, 'youtube');
        if (ytToken) {
          try {
            const decrypted = await tokenStore.decryptAccessToken(ytToken.accessToken);
            const ytText = variants.youtube || post.textContent;
            const ytVideoUrl = videoUrl || post.imageUrl;
            if (ytVideoUrl) {
              const ytResult = await uploadShort(decrypted, ytVideoUrl, ytText.substring(0, 100), ytText);
              results.push(ytResult as any);
            } else {
              results.push({ success: false, platform: 'youtube' as any, error: 'YouTube Shorts requires a video URL' });
            }
          } catch {
            results.push({ success: false, platform: 'youtube' as any, error: 'YouTube Shorts publish failed' });
          }
        } else results.push({ success: false, platform: 'youtube' as any, error: 'YouTube is not connected.' });
      }

      // ── Facebook standalone (scheduler) — only if no meta token
      if (channels.includes('facebook')) {
        const metaAccessToken = await getMetaAccessToken(post.userId, blink, tokenStore, (env as any).TOKEN_ENCRYPTION_KEY);
        if (!metaAccessToken) {
          const fbToken = await tokenStore.getByUser(post.userId, 'facebook');
          if (fbToken) {
            try {
              const decrypted = await tokenStore.decryptAccessToken(fbToken.accessToken);
              const pages = await getUserPages(decrypted);
              const targetPage = pages[0];
              if (targetPage) {
                results.push(await publishToFacebookPage(targetPage.id, targetPage.access_token, { text: variants.facebook || post.textContent, imageUrl: post.imageUrl }));
              }
            } catch {
              results.push({ success: false, platform: 'facebook' as const, error: 'Facebook standalone publish failed' });
            }
          }
        }
      }

      const anySuccess = results.length > 0 && results.some(r => r.success);
      await postsTable.update(post.id, { status: anySuccess ? 'published' : 'failed', platformVariants: JSON.stringify({ ...cleanVariants, _publishResults: results }) } as any);
      if (anySuccess) published++; else {
        failed++;
        // Send failure notification when all platforms failed
        try {
          const userRecord = await blink.db.table<{ id: string; email?: string }>('users').get(post.userId);
          if (userRecord?.email) {
            await blink.notifications.email({
              to: userRecord.email,
              subject: '⚠️ Publication échouée — Kompilot',
              html: `<div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
                <h2 style="color:#ef4444;font-size:18px;">Publication échouée</h2>
                <p style="color:#374151;font-size:14px;">Votre post planifié n'a pas pu être publié.</p>
                <p style="color:#6b7280;font-size:13px;"><strong>Contenu :</strong> ${post.textContent?.substring(0, 200) || 'N/A'}</p>
                <p style="color:#6b7280;font-size:13px;"><strong>Plateformes :</strong> ${post.channels || 'N/A'}</p>
                <p style="margin-top:16px;"><a href="https://kompilot.fr/calendar" style="background:#0D9488;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">Voir dans le calendrier</a></p>
              </div>`,
            });
          }
        } catch { /* email failure should not break scheduler */ }
      }
    } catch {
      await postsTable.update(post.id, { status: 'failed', platformVariants: JSON.stringify({ ...((post.platformVariants && JSON.parse(post.platformVariants)) || {}), _publishError: 'Unexpected scheduler error' }) } as any);
      failed++;
      // Send failure notification on unexpected error
      try {
        const userRecord = await blink.db.table<{ id: string; email?: string }>('users').get(post.userId);
        if (userRecord?.email) {
          await blink.notifications.email({
            to: userRecord.email,
            subject: '⚠️ Publication échouée — Kompilot',
            html: `<div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
              <h2 style="color:#ef4444;font-size:18px;">Publication échouée</h2>
              <p style="color:#374151;font-size:14px;">Votre post planifié n'a pas pu être publié.</p>
              <p style="color:#6b7280;font-size:13px;"><strong>Contenu :</strong> ${post.textContent?.substring(0, 200) || 'N/A'}</p>
              <p style="color:#6b7280;font-size:13px;"><strong>Plateformes :</strong> ${post.channels || 'N/A'}</p>
              <p style="margin-top:16px;"><a href="https://kompilot.fr/calendar" style="background:#0D9488;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">Voir dans le calendrier</a></p>
            </div>`,
          });
        }
      } catch { /* email failure should not break scheduler */ }
    }
  }

  return c.json({ processed: duePosts.length, published, failed });
});

// ── GET /api/publish/status/:id ──────────────────────────────────────────────

router.get('/api/publish/status/:id', async (c) => {
  const userId = await getUserId(c.req.header('Authorization'), c.env as unknown as Env);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const postId = c.req.param('id');
  const env = c.env as unknown as Env;
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const post = await (blink.db.table('scheduled_posts') as any).get(postId);
  if (!post) return c.json({ error: 'Not found' }, 404);
  if ((post as any).userId !== userId) return c.json({ error: 'Unauthorized' }, 403);
  return c.json(post);
});

// ── POST /api/publish/retry/:id ──────────────────────────────────────────────

router.post('/api/publish/retry/:id', async (c) => {
  const userId = await getUserId(c.req.header('Authorization'), c.env as unknown as Env);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const postId = c.req.param('id');
  const env = c.env as unknown as Env;
  const blink = createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
  const post = await (blink.db.table('scheduled_posts') as any).get(postId);
  if (!post) return c.json({ error: 'Not found' }, 404);
  if ((post as any).userId !== userId) return c.json({ error: 'Unauthorized' }, 403);
  await (blink.db.table('scheduled_posts') as any).update(postId, { status: 'scheduled', scheduledAt: new Date().toISOString() });
  try { await (blink.db.table('scheduled_post_claims') as any).delete(postId); } catch { /* no claim exists */ }
  return c.json({ success: true, message: 'Post re-queued for publishing' });
});
