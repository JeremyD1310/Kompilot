import { useState, useEffect, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import { blink } from '../blink/client';

// ── Types ──────────────────────────────────────────────────────────────────────

export type PostStatus = 'Brouillon' | 'Planifié' | 'Approuvé';
export type PostChannel = 'LinkedIn' | 'Instagram' | 'Facebook' | 'Google';

export interface ScheduledPostStore {
  id: string;
  text: string;
  channels: PostChannel[];
  date: string;       // 'yyyy-MM-dd'
  time: string;       // 'HH:mm'
  status: PostStatus;
  platform?: string;
}

// ── Storage key ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'kompilot_scheduled_posts';

// ── Seed data (pre-populated on first load) ────────────────────────────────────

function buildSeedPosts(): ScheduledPostStore[] {
  const today = new Date();
  return [
    {
      id: 'seed-1',
      text: '🚀 Découvrez notre nouvelle fonctionnalité IA qui va révolutionner votre présence sur les réseaux sociaux. Restez connectés pour la grande annonce !',
      channels: ['LinkedIn', 'Facebook'],
      date: format(addDays(today, 1), 'yyyy-MM-dd'),
      time: '09:00',
      status: 'Planifié',
      platform: 'LinkedIn',
    },
    {
      id: 'seed-2',
      text: '💡 5 conseils pour booster votre engagement Instagram en 2024. Enregistrez ce post pour y revenir plus tard !',
      channels: ['Instagram'],
      date: format(addDays(today, 3), 'yyyy-MM-dd'),
      time: '11:30',
      status: 'Approuvé',
      platform: 'Instagram',
    },
    {
      id: 'seed-3',
      text: '📊 Résultats du trimestre : +42% de portée organique grâce à notre stratégie de contenu. Merci à toute notre équipe !',
      channels: ['LinkedIn'],
      date: format(addDays(today, 5), 'yyyy-MM-dd'),
      time: '14:00',
      status: 'Brouillon',
      platform: 'LinkedIn',
    },
  ];
}

// ── Core CRUD functions (localStorage) ────────────────────────────────────────

export function getScheduledPosts(): ScheduledPostStore[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeds = buildSeedPosts();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
      return seeds;
    }
    return JSON.parse(raw) as ScheduledPostStore[];
  } catch {
    return [];
  }
}

export function addScheduledPost(
  post: Omit<ScheduledPostStore, 'id'>,
): ScheduledPostStore {
  const newPost: ScheduledPostStore = {
    ...post,
    id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  const current = getScheduledPosts();
  const updated = [...current, newPost];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newPost;
}

export function updatePostStatus(id: string, status: PostStatus): void {
  const posts = getScheduledPosts();
  const updated = posts.map(p => (p.id === id ? { ...p, status } : p));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function deleteScheduledPost(id: string): void {
  const posts = getScheduledPosts();
  const updated = posts.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

// ── DB sync helpers (fire-and-forget, non-blocking) ───────────────────────────

function statusToDb(status: PostStatus): 'draft' | 'scheduled' | 'published' {
  if (status === 'Planifié' || status === 'Approuvé') return 'scheduled';
  return 'draft';
}

async function syncPostToDb(post: ScheduledPostStore, userId: string): Promise<void> {
  try {
    // Try upsert — blink.db.scheduledPosts.upsert by id
    const scheduledAt = post.date && post.time ? `${post.date}T${post.time}:00` : null;
    await blink.db.scheduledPosts.upsert({
      id: post.id,
      userId,
      textContent: post.text,
      channels: JSON.stringify(post.channels),
      status: statusToDb(post.status),
      scheduledAt: scheduledAt ?? undefined,
    });
  } catch {
    // Non-blocking — localStorage is the source of truth for now
  }
}

async function deletePostFromDb(id: string): Promise<void> {
  try {
    await blink.db.scheduledPosts.delete(id);
  } catch {
    // Non-blocking
  }
}

// ── Convert DB scheduled post → local store format ────────────────────────────

function dbPostToStore(p: any): ScheduledPostStore | null {
  try {
    const channels: PostChannel[] = (() => {
      try { return JSON.parse(p.channels || '[]') as PostChannel[]; } catch { return []; }
    })();
    let date = '';
    let time = '09:00';
    if (p.scheduledAt) {
      const d = new Date(p.scheduledAt);
      if (!isNaN(d.getTime())) {
        date = format(d, 'yyyy-MM-dd');
        time = format(d, 'HH:mm');
      }
    }
    const status: PostStatus = p.status === 'scheduled' ? 'Planifié' : 'Brouillon';
    return { id: p.id, text: p.textContent ?? '', channels, date, time, status };
  } catch {
    return null;
  }
}

// ── React hook ─────────────────────────────────────────────────────────────────

export function useScheduledPosts(userId?: string) {
  const [posts, setPosts] = useState<ScheduledPostStore[]>(() => getScheduledPosts());
  const [dbSynced, setDbSynced] = useState(false);

  // On mount with a userId: pull from DB and merge into localStorage
  useEffect(() => {
    if (!userId || dbSynced) return;
    let cancelled = false;
    blink.db.scheduledPosts
      .list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 200 })
      .then((rows: any[]) => {
        if (cancelled) return;
        const dbPosts = rows.map(dbPostToStore).filter(Boolean) as ScheduledPostStore[];
        if (dbPosts.length > 0) {
          // Merge: DB wins for IDs that match, add new ones
          const localPosts = getScheduledPosts();
          const localIds = new Set(localPosts.map(p => p.id));
          const seedIds = new Set(['seed-1', 'seed-2', 'seed-3']);
          // Keep local non-seed posts + all DB posts
          const merged = [
            ...dbPosts,
            ...localPosts.filter(p => !seedIds.has(p.id) && !dbPosts.find(d => d.id === p.id)),
          ];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          setPosts(merged);
        }
        setDbSynced(true);
      })
      .catch(() => setDbSynced(true));
    return () => { cancelled = true; };
  }, [userId, dbSynced]);

  // Sync from localStorage on focus (other tabs/windows)
  useEffect(() => {
    const onFocus = () => setPosts(getScheduledPosts());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const add = useCallback((post: Omit<ScheduledPostStore, 'id'>): ScheduledPostStore => {
    const newPost = addScheduledPost(post);
    setPosts(getScheduledPosts());
    if (userId) syncPostToDb(newPost, userId);
    return newPost;
  }, [userId]);

  const updateStatus = useCallback((id: string, status: PostStatus): void => {
    updatePostStatus(id, status);
    setPosts(getScheduledPosts());
    if (userId) {
      const updated = getScheduledPosts().find(p => p.id === id);
      if (updated) syncPostToDb(updated, userId);
    }
  }, [userId]);

  const remove = useCallback((id: string): void => {
    deleteScheduledPost(id);
    setPosts(getScheduledPosts());
    if (userId) deletePostFromDb(id);
  }, [userId]);

  return { posts, add, updateStatus, remove };
}