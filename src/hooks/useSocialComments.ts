import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './useSocialPublish';

export interface SocialComment {
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

export function useSocialComments(enabled = true) {
  return useQuery<{ comments: SocialComment[] }>({
    queryKey: ['social-comments'],
    queryFn: () => apiFetch<{ comments: SocialComment[] }>('/api/social/comments'),
    enabled,
    staleTime: 30_000,
    retry: false,
  });
}

export function useReplyToSocialComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { commentId: string; platform: SocialComment['platform']; pageId: string; message: string }) =>
      apiFetch<{ success: boolean; commentId: string }>('/api/social/comments/reply', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-comments'] }),
  });
}
