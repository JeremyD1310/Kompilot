/**
 * OfflineBanner — Bannière discrète "Mode hors-ligne actif"
 *
 * Affichage :
 *   HORS-LIGNE  → bande jaune-ambrée épurée en haut du dashboard
 *                 "⚡ Mode hors-ligne actif. Vos modifications seront
 *                  synchronisées dès le retour du réseau."
 *
 *   EN LIGNE    → si des actions sont en cours de sync, affiche brièvement
 *                 "✓ Connexion rétablie. Synchronisation en cours…" (vert)
 *                 puis disparaît après 3 s.
 *
 *   SYNCED      → toast discret "X action(s) synchronisée(s)" puis disparaît.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';

type BannerState = 'offline' | 'syncing' | 'synced' | 'hidden';

export function OfflineBanner() {
  const { isOnline, isSyncing, pendingCount } = useOfflineSync();
  const [state, setState]         = useState<BannerState>('hidden');
  const [syncedCount, setSynced]  = useState(0);

  /* Écoute l'événement sync terminée */
  useEffect(() => {
    const handler = (e: Event) => {
      const count = (e as CustomEvent<{ count: number }>).detail?.count ?? 0;
      setSynced(count);
      setState('synced');
      setTimeout(() => setState('hidden'), 3500);
    };
    window.addEventListener('kompilot:outbox:synced', handler);
    return () => window.removeEventListener('kompilot:outbox:synced', handler);
  }, []);

  /* Gestion de la transition offline → online → syncing → synced */
  useEffect(() => {
    if (!isOnline) {
      setState('offline');
      return;
    }
    // Vient de revenir en ligne
    if (isSyncing) {
      setState('syncing');
      return;
    }
    // En ligne et pas de sync en cours ni d'actions pendantes
    if (state === 'offline') {
      if (pendingCount === 0) {
        // Disparaît immédiatement si rien à syncher
        setState('hidden');
      }
      // sinon on attend l'event synced
    }
  }, [isOnline, isSyncing, pendingCount, state]);

  /* ── Config visuelle par état ─────────────────────────────── */
  const variants = {
    offline: {
      bg:       'bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50',
      text:     'text-amber-800 dark:text-amber-300',
      iconCls:  'text-amber-500',
      icon:     <WifiOff className="w-3.5 h-3.5 shrink-0" />,
      message:  `⚡ Mode hors-ligne actif. Vos modifications seront synchronisées dès le retour du réseau.`,
      badge:    pendingCount > 0 ? `${pendingCount} action${pendingCount > 1 ? 's' : ''} en attente` : null,
    },
    syncing: {
      bg:       'bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800/50',
      text:     'text-blue-700 dark:text-blue-300',
      iconCls:  'text-blue-500',
      icon:     <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" />,
      message:  'Connexion rétablie — Synchronisation des données en cours…',
      badge:    null,
    },
    synced: {
      bg:       'bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-800/50',
      text:     'text-emerald-700 dark:text-emerald-300',
      iconCls:  'text-emerald-500',
      icon:     <CheckCircle className="w-3.5 h-3.5 shrink-0" />,
      message:  `✓ ${syncedCount} action${syncedCount > 1 ? 's' : ''} synchronisée${syncedCount > 1 ? 's' : ''} avec succès.`,
      badge:    null,
    },
    hidden: null,
  };

  const cfg = variants[state];

  return (
    <AnimatePresence>
      {cfg && state !== 'hidden' && (
        <motion.div
          key={state}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className={`flex items-center justify-between gap-3 px-4 py-2 ${cfg.bg}`}>
            <div className={`flex items-center gap-2 ${cfg.text} text-xs font-medium`}>
              <span className={cfg.iconCls}>{cfg.icon}</span>
              <span>{cfg.message}</span>
            </div>
            {cfg.badge && (
              <span className="shrink-0 text-[10px] font-bold bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
                {cfg.badge}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
