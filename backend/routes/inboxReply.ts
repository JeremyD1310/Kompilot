import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';
import { escapeHtml } from '../lib/http';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import { decryptMetaUserToken } from '../lib/metaAccountStore';
import { getUserPages, graphApiCall } from '../lib/metaPublishingService';

export const router = new Hono<{ Bindings: Env }>();

async function getUserId(header: string | undefined, env: Env) {
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
    const verified = await blink.auth.verifyToken(header);
    return verified.valid ? verified.userId : null;
  } catch { return null; }
}

router.post('/api/inbox/reply', async c => {
  const env = c.env as Env;
  const userId = await getUserId(c.req.header('Authorization'), env);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json() as { messageId?: string; text?: string; channel?: string; senderHandle?: string };
  if (!body.messageId || !body.text?.trim()) return c.json({ error: 'messageId and text are required' }, 400);

  const blink = createClient({ projectId: c.env.BLINK_PROJECT_ID, secretKey: c.env.BLINK_SECRET_KEY });
  const messages = await blink.db.table<any>('messages').list({ where: { id: body.messageId, userId }, limit: 1 });
  const message = messages[0];
  if (!message) return c.json({ error: 'Message not found' }, 404);

  let delivery: 'email' | 'social' | 'internal' = 'internal';
  const socialChannel = body.channel || message.channel;
  if (['instagram', 'facebook', 'linkedin', 'tiktok'].includes(socialChannel)) {
    if (socialChannel === 'tiktok' && body.senderHandle) {
      const response = await fetch(`${new URL(c.req.url).origin}/api/tiktok/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: c.req.header('Authorization') || '' },
        body: JSON.stringify({ messageId: body.messageId, toOpenId: body.senderHandle, messageText: body.text.trim() }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({})) as { error?: string };
        return c.json({ error: errorBody.error || 'Impossible d’envoyer la réponse TikTok.' }, 502);
      }
      delivery = 'social';
    } else if (socialChannel === 'instagram' || socialChannel === 'facebook') {
      const socialAccountId = message.socialAccountId || '';
      if (!socialAccountId || !body.senderHandle) return c.json({ error: 'Conversation sociale incomplète.' }, 409);
      const encryptionKey = (env as any).TOKEN_ENCRYPTION_KEY || '';
      const connection = await decryptMetaUserToken(blink, userId, encryptionKey);
      const store = createSecureTokenStore(blink, encryptionKey);
      const legacyToken = await store.getByUser(userId, 'meta');
      const decrypted = connection?.accessToken || (legacyToken ? await store.decryptAccessToken(legacyToken.accessToken) : null);
      if (!decrypted) return c.json({ error: 'Meta n’est pas connecté.' }, 409);
      const pages = await getUserPages(decrypted);
      const page = pages.find(item => item.id === socialAccountId || item.instagram_business_account?.id === socialAccountId);
      if (!page) return c.json({ error: 'Compte social introuvable.' }, 404);
      const senderId = body.senderHandle;
      const accountId = socialChannel === 'instagram' ? page.instagram_business_account?.id : page.id;
      if (!accountId || !senderId) return c.json({ error: 'Compte social ou destinataire introuvable.' }, 409);
      await graphApiCall(`/${accountId}/messages`, page.access_token, {
        method: 'POST',
        body: new URLSearchParams({ recipient: JSON.stringify({ id: senderId }), message: body.text.trim() }),
      });
      delivery = 'social';
    } else if (socialChannel === 'linkedin') {
      return c.json({ error: 'Les réponses LinkedIn ne sont pas encore disponibles dans la boîte unifiée.' }, 409);
    }
  } else if (message.senderEmail) {
    await blink.notifications.email({
      to: message.senderEmail,
      subject: `Re: ${message.subject || 'Votre message à Kompilot'}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><p>${escapeHtml(body.text.trim()).replace(/\n/g, '<br/>')}</p><hr/><p style="color:#64748b;font-size:12px">Réponse envoyée depuis Kompilot.</p></div>`,
    });
    delivery = 'email';
  }

  await blink.db.table<any>('inbox_replies').create({
    id: `reply_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
    messageId: body.messageId,
    userId,
    fromType: 'me',
    textContent: body.text.trim(),
  });
  await blink.db.table<any>('messages').update(body.messageId, { isRead: 1 });
  return c.json({ success: true, delivery });
});
