import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createSecureTokenStore } from '../lib/secureTokenStore';
import { getUserPages, graphApiCall, type MetaPage } from '../lib/metaPublishingService';
import { decryptMetaUserToken } from '../lib/metaAccountStore';
import type { Env } from '../lib/types';

interface SocialComment {
  id: string;
  platform: 'facebook' | 'instagram';
  pageId: string;
  postId: string;
  postTitle: string;
  authorName: string;
  authorHandle: string;
  content: string;
  likes: number;
  createdAt: string;
  replied: boolean;
}

export const router = new Hono<{ Bindings: Env }>();

async function auth(c: any) {
  const header = c.req.header('Authorization');
  if (!header) return null;
  const blink = createClient({ projectId: c.env.BLINK_PROJECT_ID, secretKey: c.env.BLINK_SECRET_KEY });
  const verified = await blink.auth.verifyToken(header);
  return verified.valid ? { userId: verified.userId, blink } : null;
}

function authorName(value: any) {
  return value?.name || value?.username || 'Utilisateur';
}

function authorHandle(value: any) {
  return value?.username ? `@${value.username}` : authorName(value);
}

function mapComment(comment: any, context: Omit<SocialComment, 'id' | 'authorName' | 'authorHandle' | 'content' | 'likes' | 'createdAt' | 'replied'> & { platform: 'facebook' | 'instagram' }): SocialComment {
  const author = comment.from || comment;
  return {
    ...context,
    id: String(comment.id),
    authorName: authorName(author),
    authorHandle: authorHandle(author),
    content: String(comment.message || comment.text || ''),
    likes: Number(comment.like_count || 0),
    createdAt: comment.created_time || comment.timestamp || new Date().toISOString(),
    replied: false,
  };
}

async function getMetaAccessToken(userId: string, blink: any, encryptionKey: string): Promise<string | null> {
  const connection = await decryptMetaUserToken(blink, userId, encryptionKey);
  if (connection?.accessToken) return connection.accessToken;
  const store = createSecureTokenStore(blink, encryptionKey);
  const legacyToken = await store.getByUser(userId, 'meta');
  return legacyToken ? store.decryptAccessToken(legacyToken.accessToken) : null;
}

async function loadComments(userId: string, blink: any, encryptionKey: string): Promise<SocialComment[]> {
  const accessToken = await getMetaAccessToken(userId, blink, encryptionKey);
  if (!accessToken) return [];
  const pages = await getUserPages(accessToken);
  const comments: SocialComment[] = [];

  for (const page of pages as MetaPage[]) {
    try {
      const feed = await graphApiCall<{ data?: any[] }>(
        `/${page.id}/feed?fields=id,message,created_time,comments.limit(50){id,from,message,created_time,like_count}&limit=25`,
        page.access_token,
      );
      for (const post of feed.data || []) {
        for (const comment of post.comments?.data || []) {
          comments.push(mapComment(comment, {
            platform: 'facebook',
            pageId: page.id,
            postId: String(post.id),
            postTitle: String(post.message || 'Publication Facebook').slice(0, 90),
          }));
        }
      }
    } catch {
      // A page can lack the reviews/comments permission; continue with other pages.
    }

    const instagram = page.instagram_business_account;
    if (!instagram) continue;
    try {
      const media = await graphApiCall<{ data?: any[] }>(
        `/${instagram.id}/media?fields=id,caption,timestamp,comments.limit(50){id,username,text,timestamp,like_count}&limit=25`,
        page.access_token,
      );
      for (const post of media.data || []) {
        for (const comment of post.comments?.data || []) {
          comments.push(mapComment(comment, {
            platform: 'instagram',
            pageId: page.id,
            postId: String(post.id),
            postTitle: String(post.caption || 'Publication Instagram').slice(0, 90),
          }));
        }
      }
    } catch {
      // Continue when Instagram comments are not enabled for an account.
    }
  }

  return comments.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

router.get('/api/social/comments', async (c) => {
  const session = await auth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  try {
    return c.json({ comments: await loadComments(session.userId, session.blink, (c.env as any).TOKEN_ENCRYPTION_KEY || '') });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Unable to load social comments' }, 502);
  }
});

router.post('/api/social/comments/reply', async (c) => {
  const session = await auth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json().catch(() => ({})) as { commentId?: string; platform?: string; pageId?: string; message?: string };
  if (!body.commentId || !body.platform || !body.pageId || !body.message?.trim()) {
    return c.json({ error: 'commentId, platform, pageId and message are required' }, 400);
  }
  if (body.platform !== 'facebook' && body.platform !== 'instagram') {
    return c.json({ error: 'Unsupported social platform' }, 400);
  }

  try {
    const accessToken = await getMetaAccessToken(session.userId, session.blink, (c.env as any).TOKEN_ENCRYPTION_KEY || '');
    if (!accessToken) return c.json({ error: 'Meta is not connected' }, 409);
    const pages = await getUserPages(accessToken);
    const page = pages.find(item => item.id === body.pageId);
    if (!page) return c.json({ error: 'Meta page not found' }, 404);

    const endpoint = body.platform === 'instagram'
      ? `/${body.commentId}/replies`
      : `/${body.commentId}/comments`;
    const params = new URLSearchParams({ message: body.message.trim() });
    const result = await graphApiCall<{ id: string }>(endpoint, page.access_token, { method: 'POST', body: params });
    return c.json({ success: true, commentId: result.id });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Unable to publish comment reply' }, 502);
  }
});
