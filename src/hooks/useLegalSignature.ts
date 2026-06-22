/**
 * useLegalSignature — logging clickwrap immuable
 *
 * - Vérifie si l'utilisateur a signé les CGV
 * - Expose une mutation pour enregistrer la signature via le backend sécurisé
 * - Utilisé au moment du paywall et de l'onboarding
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '../blink/client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://gbrhsehk.backend.blink.new';

export const CURRENT_CGV_VERSION = '2.1.0';

export interface LegalSignature {
  id: string;
  userId: string;
  ipAddress: string;
  signedAt: string;
  cgvVersionAccepted: string;
  retractionWaiver: boolean;
  planId: string | null;
  checkoutType: string;
}

interface SignaturePayload {
  cgv_version_accepted?: string;
  plan_id?: string;
  checkout_type?: 'paywall' | 'onboarding' | 'upgrade';
  signature_metadata?: Record<string, unknown>;
}

interface SignatureStatus {
  hasSigned: boolean;
  isCurrentVersion: boolean;
  latestSignature: LegalSignature | null;
}

// ── Read: vérifie le statut de signature pour un utilisateur ─────────────────
export function useLegalSignatureStatus(userId: string | undefined) {
  return useQuery({
    queryKey: ['legal-signature', userId],
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 min
    queryFn: async (): Promise<SignatureStatus> => {
      if (!userId) return { hasSigned: false, isCurrentVersion: false, latestSignature: null };

      const rows = await blink.db.legalSignatures.list({
        where: { userId },
        orderBy: { signedAt: 'desc' },
        limit: 1,
      });

      if (!rows || rows.length === 0) {
        return { hasSigned: false, isCurrentVersion: false, latestSignature: null };
      }

      const r = rows[0] as any;
      const sig: LegalSignature = {
        id: r.id,
        userId: r.userId,
        ipAddress: r.ipAddress,
        signedAt: r.signedAt,
        cgvVersionAccepted: r.cgvVersionAccepted,
        retractionWaiver: Number(r.retractionWaiver) > 0,
        planId: r.planId ?? null,
        checkoutType: r.checkoutType,
      };

      return {
        hasSigned: true,
        isCurrentVersion: sig.cgvVersionAccepted === CURRENT_CGV_VERSION,
        latestSignature: sig,
      };
    },
  });
}

// ── Write: enregistre la signature via le backend (immuable) ─────────────────
export function useRecordLegalSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SignaturePayload): Promise<{ success: boolean; signature_id: string; signed_at: string }> => {
      const token = await blink.auth.getValidToken().catch(() => null);
      if (!token) throw new Error('SESSION_EXPIRED');

      // Collecte de métadonnées côté client (fingerprint minimal)
      const metadata: Record<string, unknown> = {
        ...(payload.signature_metadata ?? {}),
        screen_width: window.screen?.width,
        screen_height: window.screen?.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        timestamp_client: new Date().toISOString(),
      };

      const res = await fetch(`${BACKEND_URL}/api/legal/signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cgv_version_accepted: payload.cgv_version_accepted ?? CURRENT_CGV_VERSION,
          plan_id: payload.plan_id,
          checkout_type: payload.checkout_type ?? 'paywall',
          signature_metadata: metadata,
        }),
      });

      if (!res.ok) throw new Error(`Legal signature recording failed: ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      // Invalide le cache pour forcer un re-check
      queryClient.invalidateQueries({ queryKey: ['legal-signature'] });
    },
  });
}

// ── Hook combiné : vérifie + expose la mutation ───────────────────────────────
export function useLegalSignature(userId: string | undefined) {
  const status = useLegalSignatureStatus(userId);
  const record = useRecordLegalSignature();

  return {
    ...status,
    recordSignature: record.mutateAsync,
    isRecording: record.isPending,
    recordError: record.error,
  };
}
