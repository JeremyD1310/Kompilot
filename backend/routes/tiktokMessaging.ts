/**
 * tiktokMessaging.ts — TikTok Direct Message Routes
 *
 * Handles TikTok DM inbox: list conversations, fetch messages, send replies.
 * Uses TikTok Messaging API v2 (requires messaging scope from TikTok for Developers).
 *
 * Routes:
 *   GET  /api/tiktok/messages/conversations  — List DM conversations
 *   GET  /api/tiktok/messages/:conversationId — Get messages in a conversation
 *   POST /api/tiktok/messages/send            — Send a message to a user
 *   POST /api/tiktok/messages/webhook         — Webhook receiver for new messages
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import { tiktokApiCall, tiktokBusinessApiCall, refreshAccessToken, getCreatorInfo, type TiktokApiError } from '../lib/tiktokService';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

async function verifyUserId(c: any): Promise<string | null> {
  const blink = createClient({ projectId: c.env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk', secretKey: c.env.BLINK_SECRET_KEY });
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  return auth.valid ? auth.userId : null;
}

async function getValidTikTokToken(
  env: Env,
  userId: string,
): Promise<{ accessToken: string; openId: string } | null> {
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk', secretKey: env.BLINK_SECRET_KEY });
  const store = createSecureTokenStore(blink, (env as any).TOKEN_ENCRYPTION_KEY);
  const tokens = await store.getByUser(userId, 'tiktok');
  if (!tokens) return null;

  // Check if token is expired, try refresh
  const expiresAt = new Date(tokens.expiresAt).getTime();
  if (expiresAt < Date.now() + 60000) {
    // Token expired or about to expire — try refresh
    const clientKey = (env as any).TIKTOK_CLIENT_KEY;
    const clientSecret = (env as any).TIKTOK_CLIENT_SECRET;
    if (!clientKey || !clientSecret) return null;

    try {
      const decryptedRefresh = await store.decryptAccessToken(tokens.refreshToken);
      const refreshed = await refreshAccessToken(decryptedRefresh, clientKey, clientSecret);
      await store.save({
        userId,
        provider: 'tiktok',
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: new Date(Date.now() + refreshed.expiresIn * 1000).toISOString(),
        scopes: ['user.info.basic', 'video.upload', 'video.publish', 'message.list', 'message.send'],
      });
      const decrypted = refreshed.accessToken;
      let openId = '';
      try { openId = (await getCreatorInfo(decrypted)).openId || ''; } catch { /* API call below may still work */ }
      if (openId) {
        try { await blink.db.table('tiktok_dm_accounts').upsert({ id: `tiktok_${userId}`, userId, openId, updatedAt: new Date().toISOString() }); } catch { /* best effort */ }
      }
      return { accessToken: decrypted, openId };
    } catch {
      return null;
    }
  }

  const decrypted = await store.decryptAccessToken(tokens.accessToken);
  let openId = '';
  try { openId = (await getCreatorInfo(decrypted)).openId || ''; } catch { /* API call below may still work */ }
  if (openId) {
    try { await blink.db.table('tiktok_dm_accounts').upsert({ id: `tiktok_${userId}`, userId, openId, updatedAt: new Date().toISOString() }); } catch { /* best effort */ }
  }
  return { accessToken: decrypted, openId };
}

// ── GET /api/tiktok/messages/conversations ──────────────────────────────────

router.get('/api/tiktok/messages/conversations', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const tokenData = await getValidTikTokToken(env, userId);
  if (!tokenData) return c.json({ error: 'TikTok not connected or token expired' }, 400);

  try {
    // TikTok Messaging API: list recent conversations
    const result = await tiktokApiCall<any>(
      '/v2/message/list/?sort_type=by_active_time&limit=20',
      tokenData.accessToken,
    );

    const conversations = (result?.data?.messages || []).map((msg: any) => ({
      id: msg.message_id || msg.conversation_id,
      senderId: msg.sender?.open_id || '',
      senderName: msg.sender?.display_name || 'Utilisateur TikTok',
      senderAvatar: msg.sender?.avatar_url || '',
      lastMessage: msg.text || '[média]',
      lastMessageAt: msg.create_time ? new Date(parseInt(msg.create_time) * 1000).toISOString() : '',
      isRead: true,
    }));

    return c.json({ conversations });
  } catch (err) {
    const apiErr = err as TiktokApiError;
    return c.json({ error: apiErr.message || 'Failed to fetch conversations' }, apiErr.code || 500);
  }
});

// ── GET /api/tiktok/messages/:conversationId ────────────────────────────────

router.get('/api/tiktok/messages/:conversationId', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const tokenData = await getValidTikTokToken(env, userId);
  if (!tokenData) return c.json({ error: 'TikTok not connected or token expired' }, 400);

  const conversationId = c.req.param('conversationId');

  try {
    const result = await tiktokApiCall<any>(
      `/v2/message/list/?to_open_id=${conversationId}&sort_type=by_active_time&limit=50`,
      tokenData.accessToken,
    );

    const messages = (result?.data?.messages || []).map((msg: any) => ({
      id: msg.message_id,
      fromMe: msg.sender?.open_id === tokenData.openId,
      text: msg.text || '',
      mediaUrl: msg.media?.url || '',
      mediaType: msg.media?.media_type || '',
      timestamp: msg.create_time ? new Date(parseInt(msg.create_time) * 1000).toISOString() : '',
    }));

    return c.json({ messages, conversationId });
  } catch (err) {
    const apiErr = err as TiktokApiError;
    return c.json({ error: apiErr.message || 'Failed to fetch messages' }, apiErr.code || 500);
  }
});

// ── POST /api/tiktok/messages/send ──────────────────────────────────────────

router.post('/api/tiktok/messages/send', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const tokenData = await getValidTikTokToken(env, userId);
  if (!tokenData) return c.json({ error: 'TikTok not connected or token expired' }, 400);

  let body: { messageId?: string; toOpenId?: string; messageText?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  if (!body.toOpenId || !body.messageText) {
    return c.json({ error: 'toOpenId and messageText are required' }, 400);
  }

  try {
    const result = await tiktokApiCall<any>(
      '/v2/message/send/',
      tokenData.accessToken,
      {
        method: 'POST',
        body: {
          to_open_id: body.toOpenId,
          msg_type: 'text',
          content: JSON.stringify({ text: body.messageText }),
        },
      },
    );

    // Keep the reply attached to the original canonical inbox message.
    try {
      const blink = createClient({ projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk', secretKey: env.BLINK_SECRET_KEY });
      const replyId = `reply_tiktok_${userId}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      await blink.db.table('inbox_replies').create({
        id: replyId,
        messageId: body.messageId || `tiktok-${body.toOpenId}`,
        userId,
        fromType: 'me',
        textContent: body.messageText,
      });
      if (body.messageId) await blink.db.table('messages').update(body.messageId, { isRead: true });
    } catch { /* provider delivery remains successful; history is best effort */ }

    return c.json({ success: true, messageId: result?.data?.message_id || '' });
  } catch (err) {
    const apiErr = err as TiktokApiError;
    return c.json({ error: apiErr.message || 'Failed to send message' }, apiErr.code || 500);
  }
});

// ── POST /api/tiktok/messages/webhook/register — register webhook with TikTok Business API ──

router.post('/api/tiktok/messages/webhook/register', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const businessApiKey = (env as any).TIKTOK_BUSINESS_API_KEY;
  if (!businessApiKey) return c.json({ error: 'TIKTOK_BUSINESS_API_KEY not configured' }, 500);

  const backendUrl = (env as any).BACKEND_URL || 'https://gbrhsehk.backend.blink.new';
  const webhookUrl = `${backendUrl}/api/tiktok/messages/webhook`;

  try {
    // Register webhook subscription via TikTok Business API
    const result = await tiktokBusinessApiCall<any>(
      '/open_api/v1.3/event/subscription/create/',
      businessApiKey,
      {
        method: 'POST',
        body: {
          subscription_url: webhookUrl,
          event_types: ['message_received', 'message_sent'],
        },
      },
    );

    return c.json({
      success: true,
      webhookUrl,
      result,
    });
  } catch (err) {
    const apiErr = err as TiktokApiError;
    return c.json({ error: apiErr.message || 'Failed to register webhook' }, apiErr.code || 500);
  }
});

// ── GET /api/tiktok/messages/webhook/status — check webhook registration ─────

router.get('/api/tiktok/messages/webhook/status', async (c) => {
  const userId = await verifyUserId(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const businessApiKey = (env as any).TIKTOK_BUSINESS_API_KEY;
  if (!businessApiKey) return c.json({ error: 'TIKTOK_BUSINESS_API_KEY not configured' }, 500);

  try {
    const result = await tiktokBusinessApiCall<any>(
      '/open_api/v1.3/event/subscription/list/',
      businessApiKey,
    );

    return c.json({ subscriptions: result.data?.list || [], result });
  } catch (err) {
    const apiErr = err as TiktokApiError;
    return c.json({ error: apiErr.message || 'Failed to check webhook status' }, apiErr.code || 500);
  }
});

// ── POST /api/tiktok/messages/webhook — receive new DMs ─────────────────────

router.post('/api/tiktok/messages/webhook', async (c) => {
  // TikTok webhook verification challenge
  const body = await c.req.text();

  try {
    const payload = JSON.parse(body);

    // Handle verification request
    if (payload.challenge) {
      return c.text(payload.challenge);
    }

    const env = c.env as unknown as Env;

    // Verify the webhook request using business API key if header present
    // TikTok may send a signature header for webhook verification
    const configuredSecret = (c.env as any).TIKTOK_WEBHOOK_SECRET;
    const signature = c.req.header('X-TikTok-Signature') || '';
    if (configuredSecret && signature !== configuredSecret) return c.json({ error: 'Invalid webhook signature' }, 401);

    const blink = createClient({ projectId: env.BLINK_PROJECT_ID || 'presence-manager-saas-gbrhsehk', secretKey: env.BLINK_SECRET_KEY });

    // Handle incoming message event
    if (payload.event === 'message_received' || payload.type === 'message') {
      const message = payload.message || payload.data || {};
      const sender = payload.sender || payload.from || {};
      const senderOpenId = sender.open_id || sender.openId || message.sender_open_id || message.from_open_id || '';
      if (!senderOpenId) return c.json({ error: 'Webhook message has no sender open_id' }, 400);
      const mappings = await blink.db.table<any>('tiktok_dm_accounts').list({ where: { openId: senderOpenId }, limit: 1 });
      const mapping = mappings[0];
      if (!mapping?.userId) return c.json({ error: 'Unknown TikTok account' }, 404);
      const deterministicId = String(message.message_id || payload.message_id || `tiktok_${senderOpenId}_${message.create_time || payload.timestamp || Date.now()}`);

      try {
        await blink.db.table('messages').upsert({
          id: deterministicId,
          userId: mapping.userId,
          senderName: sender.display_name || sender.name || 'TikTok User',
          senderEmail: '',
          senderHandle: senderOpenId,
          channel: 'tiktok',
          subject: `TikTok DM de ${sender.display_name || sender.name || 'utilisateur'}`,
          body: message.text || message.content || '[média TikTok]',
          isRead: false,
          isArchived: false,
          isStarred: false,
        });
      } catch (dbErr) {
        console.error('[TikTok webhook] DB error:', dbErr);
      }

      return c.json({ status: 'ok', event: payload.event });
    }

    return c.json({ status: 'ok', event: payload.event || 'unknown' });
  } catch {
    return c.json({ status: 'error', message: 'Invalid webhook payload' }, 400);
  }
});
