/**
 * useInitialScan — gestion du premier Deep Scan d'établissement
 *
 * - Récupère le scan initial (immuable) depuis la DB
 * - Expose une fonction pour enregistrer un nouveau scan via le backend
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '../blink/client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://gbrhsehk.backend.blink.new';

export interface InitialScan {
  id: string;
  establishmentId: string;
  userId: string;
  geoScore: number;
  unhandledReviews: number;
  missingKeywords: string[];
  rawScanData: Record<string, unknown>;
  scannedAt: string;
}

interface RecordScanPayload {
  establishment_id: string;
  geo_score: number;
  unhandled_reviews: number;
  missing_keywords: string[];
  raw_scan_data?: Record<string, unknown>;
}

// ── Read: récupère le scan initial d'un établissement ────────────────────────
export function useInitialScan(establishmentId: string | undefined) {
  return useQuery({
    queryKey: ['initial-scan', establishmentId],
    enabled: !!establishmentId,
    staleTime: Infinity, // immuable — jamais re-fetchée
    queryFn: async (): Promise<InitialScan | null> => {
      if (!establishmentId) return null;
      const rows = await blink.db.initialScans.list({
        where: { establishmentId },
        orderBy: { scannedAt: 'asc' },
        limit: 1,
      });
      if (!rows || rows.length === 0) return null;
      const r = rows[0] as any;
      return {
        id: r.id,
        establishmentId: r.establishmentId,
        userId: r.userId,
        geoScore: Number(r.geoScore),
        unhandledReviews: Number(r.unhandledReviews),
        missingKeywords: JSON.parse(r.missingKeywords || '[]'),
        rawScanData: JSON.parse(r.rawScanData || '{}'),
        scannedAt: r.scannedAt,
      };
    },
  });
}

// ── Write: enregistre le scan initial via le backend (immuable si déjà existant) ─
export function useRecordInitialScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RecordScanPayload): Promise<{ already_exists?: boolean; scan: any }> => {
      const token = await blink.auth.getValidToken().catch(() => null);
      if (!token) throw new Error('SESSION_EXPIRED');
      const res = await fetch(`${BACKEND_URL}/api/analytics/initial-scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed to record initial scan: ${res.status}`);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['initial-scan', variables.establishment_id] });
    },
  });
}
