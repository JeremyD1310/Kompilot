import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './useSocialPublish';

export interface InstagramPublishInput {
  text: string;
  imageUrl?: string;
  videoUrl?: string;
}

export function usePublishToInstagram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InstagramPublishInput) =>
      apiFetch<{ success: boolean; results: Array<{ platform: string; success: boolean; postId?: string; postUrl?: string; error?: string }> }>('/api/publish/now', {
        method: 'POST',
        body: JSON.stringify({
          channels: ['instagram'],
          text: input.text,
          imageUrl: input.imageUrl,
          videoUrl: input.videoUrl,
          platformVariants: { instagram: input.text },
        }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] }),
  });
}
