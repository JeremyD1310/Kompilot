import { BACKEND_URL as KOMPILOT_BACKEND_URL } from '@/lib/backend';
/**
 * usePresences — React Query hook for presence management (check-in/check-out).
 *
 * Features:
 * - Stale-while-revalidate caching (2 min stale time)
 * - Automatic refetch on window focus
 * - Optimistic cache invalidation on create/delete
 * - Retry with exponential backoff on network errors
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '@/blink/client';

const BACKEND_URL = KOMPILOT_BACKEND_URL;
const STALE_TIME = 2 * 60 * 1000; // 2 minutes

export interface PresenceRecord {
  id: string;
  type: 'check_in' | 'check_out';
  timestamp: string;
  date: string;
  notes: string;
  durationMinutes: number;
  createdAt: string;
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function usePresences(filterDate: string) {
  return useQuery({
    queryKey: ['presences', filterDate],
    queryFn: async (): Promise<PresenceRecord[]> => {
      const token = await blink.auth.getValidToken();
      const url = `${BACKEND_URL}/api/presences${filterDate ? `?date=${filterDate}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Erreur ${res.status}`);
      }
      const data = await res.json();
      return data.presences || [];
    },
    staleTime: STALE_TIME,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export function useMarkPresence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { type: 'check_in' | 'check_out'; notes?: string }) => {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/presences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erreur ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all presence queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['presences'] });
    },
  });
}

export function useDeletePresence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/presences/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Échec de la suppression');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presences'] });
    },
  });
}

// ── Detail ─────────────────────────────────────────────────────────────────

export function usePresenceDetail(id: string | null) {
  return useQuery({
    queryKey: ['presences', 'detail', id],
    queryFn: async (): Promise<PresenceRecord> => {
      if (!id) throw new Error('ID manquant');
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/presences/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Erreur ${res.status}`);
      }
      return res.json();
    },
    enabled: !!id,
    staleTime: STALE_TIME,
    retry: 2,
  });
}
