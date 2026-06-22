/**
 * useOfflineSync — Gestion de l'état réseau + synchronisation de l'outbox
 *
 * Fonctionnalités :
 *   - Détecte online/offline en temps réel (navigator.onLine + events)
 *   - Synchronise automatiquement l'outbox quand la connexion revient
 *   - Expose `queueAction()` pour enregistrer une action hors-ligne
 *   - Expose `pendingCount` (badge) et `isSyncing` (spinner)
 *   - Émet un toast discret après la sync
 *
 * Usage :
 *   const { isOnline, isSyncing, pendingCount, queueAction } = useOfflineSync();
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineDB, type OutboxEntry } from '@/lib/offlineDB';

/* ── Type d'action supportée ─────────────────────────────────── */
export type OfflineActionType =
  | 'UPDATE_POST'
  | 'VALIDATE_PRESENCE'
  | 'MODIFY_NOTE'
  | 'SOS_TRIGGER'
  | 'MARK_MESSAGE_READ'
  | 'CREATE_POST_DRAFT'
  | string;

/* ── Processeur réseau (stub extensible) ─────────────────────── */
async function processEntry(entry: OutboxEntry): Promise<boolean> {
  try {
    // Extension point : router vers l'endpoint réel selon entry.type
    // Exemple : if (entry.type === 'UPDATE_POST') await api.updatePost(entry.payload)
    //
    // Pour l'instant, on simule une sync réussie si on est en ligne
    await new Promise(r => setTimeout(r, 120)); // simule latence réseau
    console.info(`[offlineSync] ✓ Synced: ${entry.type}`, entry.payload);
    return true;
  } catch {
    return false;
  }
}

/* ── Hook principal ─────────────────────────────────────────────── */
export function useOfflineSync() {
  const [isOnline,     setIsOnline]     = useState(() => navigator.onLine);
  const [isSyncing,    setIsSyncing]    = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const syncRef = useRef(false); // prevent concurrent sync runs

  /* Rafraîchit le compteur de la file */
  const refreshCount = useCallback(async () => {
    const queue = await offlineDB.getOutbox();
    setPendingCount(queue.length);
  }, []);

  /* Synchronise l'outbox */
  const syncOutbox = useCallback(async () => {
    if (syncRef.current) return;
    syncRef.current = true;
    setIsSyncing(true);

    try {
      const queue = await offlineDB.getOutbox();
      if (queue.length === 0) { setIsSyncing(false); syncRef.current = false; return; }

      let synced = 0;
      for (const entry of queue) {
        if (entry.retries >= 3) {
          // Abandon après 3 tentatives
          await offlineDB.dequeue(entry.id);
          continue;
        }
        const ok = await processEntry(entry);
        if (ok) {
          await offlineDB.dequeue(entry.id);
          synced++;
        } else {
          await offlineDB.incrementRetry(entry.id);
        }
      }

      await refreshCount();

      if (synced > 0) {
        // Notify — émet un event custom que OfflineBanner écoute
        window.dispatchEvent(
          new CustomEvent('kompilot:outbox:synced', { detail: { count: synced } })
        );
      }
    } finally {
      setIsSyncing(false);
      syncRef.current = false;
    }
  }, [refreshCount]);

  /* Abonnement aux events réseau */
  useEffect(() => {
    const onOnline  = () => { setIsOnline(true);  syncOutbox(); };
    const onOffline = () => { setIsOnline(false); };
    const onEnqueue = () => refreshCount();

    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('kompilot:outbox:enqueued', onEnqueue);

    // Compte initial
    refreshCount();

    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('kompilot:outbox:enqueued', onEnqueue);
    };
  }, [syncOutbox, refreshCount]);

  /* Enregistre une action dans l'outbox */
  const queueAction = useCallback(async (
    type: OfflineActionType,
    payload: unknown,
  ): Promise<string> => {
    const id = await offlineDB.enqueue({ type, payload });
    await refreshCount();
    return id;
  }, [refreshCount]);

  return { isOnline, isSyncing, pendingCount, queueAction, syncOutbox };
}
