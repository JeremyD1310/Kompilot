/**
 * useOptimisticAction — Hook d'Optimistic UI pour les actions critiques.
 *
 * Applique immédiatement l'état visuel de succès (ou d'erreur) AVANT
 * même la confirmation du serveur. En cas d'erreur définitive, rollback
 * automatique avec notification.
 *
 * Usage :
 *   const { trigger, status, reset } = useOptimisticAction(async () => {
 *     await api.validateCoupon(id);
 *   });
 *
 *   <button onClick={trigger} disabled={status === 'loading'}>
 *     {status === 'success' ? '✓ Validé' : 'Valider'}
 *   </button>
 *
 * Lifecycle :
 *   idle → loading → success (optimistic, instant) → confirmed | rolled_back
 *
 * Options :
 *   optimisticDelay: ms avant de montrer le succès (défaut: 0 = instantané)
 *   successDuration: ms d'affichage du succès avant reset (défaut: 2000)
 *   onSuccess:       callback post-confirmation serveur
 *   onError:         callback post-erreur (avec rollback)
 */
import { useState, useCallback, useRef } from 'react';

export type OptimisticStatus = 'idle' | 'loading' | 'success' | 'error';

interface Options<T = void> {
  /** Délai avant d'afficher le succès optimiste (0 = instantané, défaut) */
  optimisticDelay?: number;
  /** Durée d'affichage du succès avant reset auto (ms, 0 = pas de reset auto) */
  successDuration?: number;
  /** Callback appelé après confirmation serveur */
  onSuccess?: (result: T) => void;
  /** Callback appelé après erreur + rollback */
  onError?: (error: unknown) => void;
}

interface OptimisticState<T = void> {
  status:   OptimisticStatus;
  result:   T | null;
  error:    unknown;
  trigger:  (...args: any[]) => Promise<void>;
  reset:    () => void;
}

export function useOptimisticAction<T = void>(
  asyncFn: (...args: any[]) => Promise<T>,
  options: Options<T> = {}
): OptimisticState<T> {
  const {
    optimisticDelay   = 0,
    successDuration   = 2000,
    onSuccess,
    onError,
  } = options;

  const [status, setStatus]   = useState<OptimisticStatus>('idle');
  const [result, setResult]   = useState<T | null>(null);
  const [error,  setError]    = useState<unknown>(null);
  const resetTimerRef         = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  const trigger = useCallback(async (...args: any[]) => {
    if (status === 'loading') return;

    setStatus('loading');
    setError(null);

    // ── Optimistic success flash ───────────────────────────────────────────
    if (optimisticDelay >= 0) {
      const showOptimistic = () => setStatus('success');
      if (optimisticDelay === 0) {
        showOptimistic();
      } else {
        setTimeout(showOptimistic, optimisticDelay);
      }
    }

    try {
      const res = await asyncFn(...args);
      setResult(res ?? null);
      setStatus('success');
      onSuccess?.(res);

      // Auto-reset after successDuration
      if (successDuration > 0) {
        resetTimerRef.current = setTimeout(reset, successDuration);
      }
    } catch (err) {
      setError(err);
      setStatus('error');
      onError?.(err);

      // Auto-rollback after 1.5s
      resetTimerRef.current = setTimeout(reset, 1500);
    }
  }, [status, asyncFn, optimisticDelay, successDuration, onSuccess, onError, reset]);

  return { status, result, error, trigger, reset };
}

// ── Convenience: fire & forget with golden flash ───────────────────────────
/**
 * useGoldenAction — Version simplifiée pour les validations de coupon / no-show.
 * Déclenche immédiatement un succès doré (Optimistic UI) puis exécute l'action.
 */
export function useGoldenAction(
  asyncFn: () => Promise<void>,
  options?: Omit<Options<void>, 'optimisticDelay'>
) {
  return useOptimisticAction(asyncFn, { optimisticDelay: 0, successDuration: 2200, ...options });
}
