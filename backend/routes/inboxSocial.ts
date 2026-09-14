import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import type { Env } from '../lib/types';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import { decryptMetaUserToken } from '../lib/metaAccountStore';
import { getUserPages, graphApiCall, type MetaPage } from '../lib/metaPublishingService';

export const router = new Hono<{ Bindings: Env }>();

async function auth(c: any) {
  const env = c.env as Env;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  const verified = await blink.auth.verifyToken(c.req.header('Authorization'));
  return verified.valid ? { userId: verified.userId, blink } : null;
}

async function getMetaToken(userId: string, blink: any, env: Env) {
  const encryptionKey = (env as any).TOKEN_ENCRYPTION_KEY || '';
  const connection = await decryptMetaUserToken(blink, userId, encryptionKey);
  if (connection?.accessToken) return connection.accessToken;
  const store = createSecureTokenStore(blink, encryptionKey);
  const token = await store.getByUser(userId, 'meta');
  return token ? store.decryptAccessToken(token.accessToken) : null;
}

function normalizedMessage(input: Record<string, any>) {
  const createdAt = input.createdAt || input.created_time || input.timestamp || new Date().toISOString();
  return {
    id: String(input.id),
    userId: input.userId,
    senderName: input.senderName || input.from?.name || input.from?.username || 'Utilisateur',
    senderEmail: input.senderEmail || '',
    senderHandle: input.senderHandle || input.from?.id || input.from?.username || '',
    subject: input.subject || `Message ${input.channel || 'social'}`,
    body: input.body || input.message || input.text || '[média]',
    isRead: input.isRead ?? false,
    isArchived: input.isArchived ?? false,
    isStarred: input.isStarred ?? false,
    channel: input.channel || 'social',
    socialAccountId: input.socialAccountId || '',
    socialThreadId: input.socialThreadId || '',
    createdAt,
  };
}

async function loadMetaMessages(userId: string, blink: any, env: Env) {
  const token = await getMetaToken(userId, blink, env);
  if (!token) return [];
  const pages = await getUserPages(token);
  const messages: Record<string, any>[] = [];

  for (const page of pages as MetaPage[]) {
    try {
      const threads = await graphApiCall<{ data?: any[] }>(`/${page.id}/conversations?fields=id,updated_time,participants,messages.limit(25){id,from,message,created_time}&limit=25`, page.access_token);
      for (const thread of threads.data || []) {
        const last = thread.messages?.data?.[0];
        if (!last) continue;
        const sender = last.from || thread.participants?.data?.find((person: any) => person.id !== page.id);
        messages.push(normalizedMessage({
          id: `meta-${thread.id}-${last.id}`,
          userId,
          channel: 'facebook',
          socialAccountId: page.id,
          socialThreadId: thread.id,
          senderName: sender?.name,
          senderHandle: sender?.id,
          subject: `Message Facebook · ${page.name}`,
          body: last.message,
          createdAt: last.created_time || thread.updated_time,
        }));
      }
    } catch {
      // Conversations permission is optional; continue with Instagram/page data.
    }

    const instagram = page.instagram_business_account;
    if (!instagram) continue;
    try {
      const inbox = await graphApiCall<{ data?: any[] }>(`/${instagram.id}/conversations?fields=id,updated_time,participants,messages.limit(25){id,from,message,created_time}&limit=25`, page.access_token);
      for (const thread of inbox.data || []) {
        const last = thread.messages?.data?.[0];
        if (!last) continue;
        const sender = last.from || thread.participants?.data?.find((person: any) => person.id !== instagram.id);
        messages.push(normalizedMessage({
          id: `meta-${thread.id}-${last.id}`,
          userId,
          channel: 'instagram',
          socialAccountId: instagram.id,
          socialThreadId: thread.id,
          senderName: sender?.name || sender?.username,
          senderHandle: sender?.id || sender?.username,
          subject: `Message Instagram · ${page.name}`,
          body: last.message,
          createdAt: last.created_time || thread.updated_time,
        }));
      }
    } catch {
      // Instagram messaging permission is optional.
    }
  }
  return messages;
}

router.get('/api/inbox/social-messages', async c => {
  const session = await auth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const env = c.env as Env;
  try {
    const stored = await session.blink.db.table<any>('messages').list({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      limit: 100,
    });
    const socialRows = stored.filter((row: any) => ['instagram', 'facebook', 'linkedin', 'tiktok'].includes(row.channel));
    const remote = await loadMetaMessages(session.userId, session.blink, env);
    const rowsToPersist = remote.map(row => {
      const existing = stored.find((candidate: any) => candidate.id === row.id);
      return {
        ...row,
        isRead: existing?.isRead ?? row.isRead,
        isArchived: existing?.isArchived ?? row.isArchived,
        isStarred: existing?.isStarred ?? row.isStarred,
        socialAccountId: row.socialAccountId || existing?.socialAccountId || row.senderHandle || '',
        socialThreadId: row.socialThreadId || existing?.socialThreadId || row.id,
      };
    });
    for (const row of rowsToPersist) {
      await session.blink.db.table<any>('messages').upsert(row);
    }
    const merged = [...rowsToPersist, ...socialRows].filter((row, index, rows) => rows.findIndex(candidate => candidate.id === row.id) === index);
    return c.json({ messages: merged.slice(0, 100) });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Unable to load social inbox' }, 502);
  }
});
