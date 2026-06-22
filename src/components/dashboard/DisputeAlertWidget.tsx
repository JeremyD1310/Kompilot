import { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';

/**
 * DisputeAlertWidget — displays a persistent red alert if the user's
 * Stripe Connect payout account has been suspended due to high dispute rate.
 * Reads `stripe_payouts_suspended` from users.metadata.
 */
export function DisputeAlertWidget() {
  const { user } = useAuth();
  const [suspended, setSuspended] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const rows = await blink.db.users.list({ where: { id: user.id }, limit: 1 });
        const row = (rows as any[])[0];
        if (!row?.metadata) { setLoaded(true); return; }
        const meta = JSON.parse(row.metadata);
        setSuspended(meta.stripe_payouts_suspended === true);
      } catch {
        // non-fatal
      } finally {
        setLoaded(true);
      }
    })();
  }, [user?.id]);

  if (!loaded || !suspended) return null;

  return (
    <div className="rounded-2xl border-2 border-red-400 dark:border-red-700 bg-red-50 dark:bg-red-950/30 px-5 py-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0 mt-0.5">
        <AlertTriangle size={18} className="text-red-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold text-red-800 dark:text-red-300">
          ⚠️ Compte de virement suspendu en raison d'un taux de litige élevé
        </p>
        <p className="text-xs text-red-700 dark:text-red-400 mt-1 leading-relaxed">
          Le taux de contestation de prélèvements de votre Bouclier No-Show a dépassé le seuil de 1,5 % autorisé par Stripe. Les virements automatiques ont été temporairement désactivés pour protéger votre compte.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <a
            href="mailto:support@kompilot.fr?subject=Suspension compte Stripe"
            className="text-xs font-semibold text-red-700 dark:text-red-400 hover:underline"
          >
            Contacter le support
          </a>
          <span className="text-red-400">·</span>
          <a
            href="https://dashboard.stripe.com/disputes"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400 hover:underline"
          >
            Voir les litiges Stripe <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
}
