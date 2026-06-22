import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '../blink/client';
import { useAuth } from './useAuth';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ScheduledPost {
  id: string;
  userId: string;
  establishmentId?: string;
  textContent: string;
  channels: string; // JSON array as string e.g. '["Instagram","Facebook"]'
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt?: string;
  imageUrl?: string;
  platformVariants?: string; // JSON object as string
  createdAt: string;
  updatedAt: string;
}

export type ScheduledPostCreate = Omit<ScheduledPost, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type ScheduledPostUpdate = Partial<ScheduledPostCreate>;

const QUERY_KEY = 'scheduled-posts';

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useScheduledPosts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? '';

  const { data: posts = [], isLoading } = useQuery<ScheduledPost[]>({
    queryKey: [QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];
      const rows = await blink.db.scheduledPosts.list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      return rows as ScheduledPost[];
    },
    enabled: !!userId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

  const createPost = useMutation({
    mutationFn: async (data: ScheduledPostCreate) => {
      const now = new Date().toISOString();
      return blink.db.scheduledPosts.create({
        ...data,
        userId,
        channels: data.channels ?? '[]',
        status: data.status ?? 'draft',
        createdAt: now,
        updatedAt: now,
      });
    },
    onSuccess: invalidate,
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ScheduledPostUpdate }) => {
      return blink.db.scheduledPosts.update(id, {
        ...patch,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: invalidate,
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => blink.db.scheduledPosts.delete(id),
    onSuccess: invalidate,
  });

  const publishPost = useMutation({
    mutationFn: async (id: string) =>
      blink.db.scheduledPosts.update(id, {
        status: 'published',
        updatedAt: new Date().toISOString(),
      }),
    onSuccess: invalidate,
  });

  return {
    posts,
    isLoading,
    createPost: (data: ScheduledPostCreate) => createPost.mutateAsync(data),
    updatePost: (id: string, patch: ScheduledPostUpdate) =>
      updatePost.mutateAsync({ id, patch }),
    deletePost: (id: string) => deletePost.mutateAsync(id),
    publishPost: (id: string) => publishPost.mutateAsync(id),
    refresh: invalidate,
  };
}

export default useScheduledPosts;
