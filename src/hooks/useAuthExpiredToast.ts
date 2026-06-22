/**
 * useAuthExpiredToast
 *
 * Écoute l'événement global 'kompilot:auth-expired' émis par authFetch
 * et affiche un toast discret invitant à se reconnecter.
 *
 * À monter UNE SEULE FOIS dans DashboardLayout ou AppSidebarShell.
 * Ne crashe pas l'app — c'est un side-effect non bloquant.
 */

import { useEffect, useRef } from 'react';
import { toast } from '@blinkdotnew/ui';
import { AUTH_EXPIRED_EVENT } from '../lib/authFetch';
import { blink } from '../blink/client';

export function useAuthExpiredToast() {
  // Empêche plusieurs toasts simultanés
  const toastShownRef = useRef(false);
  const refreshingRef = useRef(false);

  useEffect(() => {
    const handleExpired = async () => {
      // Dédupliquer : si on tente déjà un refresh, ignorer l'événement suivant
      if (refreshingRef.current) return;
      refreshingRef.current = true;

      // Tentative finale de refresh avant d'afficher le toast
      try {
        const token = await blink.auth.getValidToken();
        if (token) {
          // Token valide récupéré → tout va bien, pas de toast
          refreshingRef.current = false;
          return;
        }
      } catch { /* refresh impossible */ }

      refreshingRef.current = false;

      // Afficher un seul toast, pas de spam
      if (toastShownRef.current) return;
      toastShownRef.current = true;

      toast('Session expirée', {
        description: 'Votre session a expiré. Cliquez pour vous reconnecter.',
        duration: 10_000,
        action: {
          label: 'Reconnecter',
          onClick: () => {
            toastShownRef.current = false;
            blink.auth.login(window.location.href);
          },
        },
      });

      // Réarme après 30s pour permettre un nouveau toast si l'utilisateur ignore
      setTimeout(() => {
        toastShownRef.current = false;
      }, 30_000);
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);
}
