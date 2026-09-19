import { useState } from 'react';
import { ExternalLink, Loader2, Receipt } from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { createBillingPortalSession, portalErrorLabel } from '../../lib/billingClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export function BillingHistorySection() {
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    setLoading(true);
    try {
      const result = await createBillingPortalSession();
      if (result.url) window.open(result.url, '_blank', 'noopener,noreferrer');
      else toast.error('Portail inaccessible', { description: portalErrorLabel(result.error!) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Receipt size={16} className="text-muted-foreground" />
        <h3 className="text-sm font-bold text-foreground">🧾 Historique de facturation</h3>
      </div>

      <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-3">
        <p className="text-sm font-semibold text-foreground">Vos factures officielles sont disponibles dans Stripe.</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Kompilot n'affiche aucune facture reconstituée localement. Consultez et téléchargez uniquement les documents émis par le portail de facturation sécurisé.
        </p>
        <Button onClick={openPortal} disabled={loading} variant="outline" className="gap-2">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
          Ouvrir mes factures Stripe
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Pour toute question de facturation, contactez <a href="mailto:billing@kompilot.fr" className="text-primary hover:underline">billing@kompilot.fr</a>.
      </p>
    </div>
  );
}
