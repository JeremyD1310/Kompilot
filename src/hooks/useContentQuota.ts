import { useQuery, useQueryClient } from '@tanstack/react-query';
import { blink } from '../blink/client';
import { backendFetch } from '../lib/backend';

export interface ContentQuota {
  monthlyLimit: number;
  additionalCredits: number;
  currentUsage: number;
  totalLimit: number;
  remaining: number;
  usageMonth: string;
  blocked: boolean;
  packs?: Array<{ id: string; label: string; credits: number; priceHt: number }>;
  stripeDeferred?: boolean;
}

const EMPTY: ContentQuota = { monthlyLimit: 30, additionalCredits: 0, currentUsage: 0, totalLimit: 30, remaining: 30, usageMonth: '', blocked: false };

export function useContentQuota() {
  const queryClient = useQueryClient();
  const query = useQuery<ContentQuota>({
    queryKey: ['content-quota'],
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const token = await blink.auth.getValidToken();
      const response = await backendFetch('/api/content-credits/status', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Le quota de contenu est indisponible.');
      return response.json() as Promise<ContentQuota>;
    },
  });

  const consume = async (amount = 1, action = 'content_generation') => {
    const token = await blink.auth.getValidToken();
    const response = await backendFetch('/api/content-credits/consume', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, action }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error === 'CONTENT_QUOTA_EXCEEDED' ? 'Plafond de contenu atteint. Ajoutez des crédits pour continuer.' : payload.error || 'Impossible de vérifier le quota.');
    queryClient.setQueryData(['content-quota'], payload);
    return payload as ContentQuota;
  };

  const release = async (amount = 1) => {
    const token = await blink.auth.getValidToken();
    await backendFetch('/api/content-credits/release', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    await queryClient.invalidateQueries({ queryKey: ['content-quota'] });
  };

  return { ...EMPTY, ...(query.data ?? {}), isLoading: query.isLoading, isError: query.isError, refetch: query.refetch, consume, release };
}
