import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';

interface StripeConnectStatus {
  connected: boolean;
  payoutsEnabled: boolean;
  requiresAction: boolean;
  disabledReason?: string;
  currentlyDue?: string[];
}

export function StripeConnectStatusWidget() {
  const { user } = useAuth();
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [fetched, setFetched] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function fetchStatus() {
      try {
        const token = await blink.auth.getValidToken().catch(() => null);
        if (!token) return;
        const res = await fetch(
          'https://gbrhsehk.backend.blink.new/api/stripe-connect/status',
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error('fetch failed');
        const data: StripeConnectStatus = await res.json();
        if (!cancelled) setStatus(data);
      } catch {
        // On failure, remain null → render nothing
      } finally {
        if (!cancelled) setFetched(true);
      }
    }

    fetchStatus();
    return () => { cancelled = true; };
  }, [user]);

  const handleUpdateDocuments = async () => {
    setActionLoading(true);
    try {
      const token = await blink.auth.getValidToken().catch(() => null);
      if (!token) { setActionLoading(false); return; }
      const res = await fetch(
        'https://gbrhsehk.backend.blink.new/api/stripe-connect/account-link',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        },
      );
      if (!res.ok) throw new Error('account-link failed');
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      // noop — silently fail
    } finally {
      setActionLoading(false);
    }
  };

  // Not yet fetched, or not connected, or fetch failed → render nothing
  if (!fetched || !status?.connected) return null;

  // ── Payouts enabled: green pill ───────────────────────────────────────────
  if (status.payoutsEnabled) {
    return (
      <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        Compte bancaire vérifié — Versements Stripe actifs
      </div>
    );
  }

  // ── Payouts disabled / action required: amber warning card ────────────────
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3">
      <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
        <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 leading-snug">
          ⚠️ Action requise : Stripe demande la mise à jour de votre pièce d'identité pour débloquer vos fonds.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30 text-xs gap-1.5 h-7 px-3"
        onClick={handleUpdateDocuments}
        disabled={actionLoading}
      >
        {actionLoading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <>
            Mettre à jour mes documents
            <ArrowRight size={11} />
          </>
        )}
      </Button>
    </div>
  );
}
