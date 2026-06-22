/**
 * useAgencyClients — fetches agency sub-accounts from DB, falls back to MOCK_CLIENTS when empty.
 */
import { useQuery } from '@tanstack/react-query';
import { blink } from '../blink/client';
import { MOCK_CLIENTS, SECTOR_EMOJIS, type MockClient } from '../components/agency/ClientCard';

/** Deterministic pseudo-random score from an ID string (range 60–90) */
function idToGeoScore(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return 60 + (hash % 31); // 60–90
}

export function useAgencyClients(userId: string | undefined) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['agency-clients', userId],
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const rows = await blink.db.agencySubAccounts.list({
        where: { agencyUserId: userId, isActive: '1' },
        orderBy: { createdAt: 'desc' },
      });
      return rows as Array<{
        id: string;
        clientName: string;
        planId: string | null;
        createdAt: string;
      }>;
    },
  });

  const hasRealClients = Array.isArray(data) && data.length > 0;
  const isDemo = !hasRealClients;

  const clients: MockClient[] = isDemo
    ? MOCK_CLIENTS
    : (data ?? []).map(row => ({
        id: row.id,
        name: row.clientName,
        type: row.planId ?? 'Établissement',
        city: '',
        geoScore: idToGeoScore(row.id),
        trend: 5,
        reviewsUnread: 0,
        status: 'ok' as const,
        emoji: SECTOR_EMOJIS[row.planId ?? ''] ?? '🏢',
      }));

  return { clients, isLoading, isDemo, refetch };
}
