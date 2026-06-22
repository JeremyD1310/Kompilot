/**
 * ProBillingDashboard — Facturation & Abonnements for regular Pro users (non-agency).
 * Sections:
 *  1. Stripe Customer Portal CTA
 *  2. Invoice History (fetched from /api/billing/invoices)
 *  3. Data-protection info banner
 */

import { useState, useEffect } from 'react';
import {
  Card, CardHeader, CardTitle, CardContent,
  Badge, Button, Skeleton,
} from '@blinkdotnew/ui';
import {
  CreditCard, ExternalLink, Loader2,
  FileText, Download, Eye, ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { blink } from '../../blink/client';
import {
  createBillingPortalSession,
  portalErrorLabel,
} from '../../lib/billingClient';
import { toast } from '@blinkdotnew/ui';
import { VATNumberSection } from './VATNumberSection';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StripeInvoice {
  id: string;
  number: string;
  status: 'paid' | 'open' | 'draft' | 'void' | 'uncollectible';
  amount_paid: number; // cents
  currency: string;
  created: number;    // unix timestamp
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  description: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAmount(cents: number, currency: string): string {
  const amount = cents / 100;
  if (currency.toLowerCase() === 'eur') {
    return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }
  return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + currency.toUpperCase();
}

function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString('fr-FR');
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StripeInvoice['status'] }) {
  switch (status) {
    case 'paid':
      return (
        <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-[10px] font-semibold hover:bg-green-500/15 shrink-0">
          Payée
        </Badge>
      );
    case 'open':
      return (
        <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px] font-semibold hover:bg-amber-500/15 shrink-0">
          En attente
        </Badge>
      );
    case 'void':
      return (
        <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-[10px] font-semibold shrink-0">
          Annulée
        </Badge>
      );
    case 'draft':
      return (
        <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground shrink-0">
          Brouillon
        </Badge>
      );
    case 'uncollectible':
      return (
        <Badge className="bg-red-500/10 text-red-700 border-red-200 text-[10px] font-semibold shrink-0">
          Non recouvrable
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] shrink-0">
          {status}
        </Badge>
      );
  }
}

// ── Section 1 — Stripe Portal CTA ────────────────────────────────────────────

function StripePortalCard() {
  const [loading, setLoading] = useState(false);

  const handlePortal = async () => {
    setLoading(true);
    try {
      const result = await createBillingPortalSession();
      if (result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
      } else {
        const label = portalErrorLabel(result.error!);
        toast.error('Portail inaccessible', { description: label });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl border-primary/25 bg-gradient-to-br from-primary/5 via-teal-50/20 to-transparent shadow-sm overflow-hidden">
      {/* Teal accent stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-[#0D9488] to-teal-400" />

      <CardHeader className="pb-3 pt-5">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
          <div className="w-7 h-7 rounded-lg bg-[#0D9488] flex items-center justify-center shrink-0">
            <CreditCard size={14} className="text-white" />
          </div>
          Gérer mon abonnement Stripe
          <span className="ml-auto shrink-0 text-[10px] font-bold bg-primary/10 text-primary rounded-full px-2.5 py-0.5 border border-primary/20">
            Portail sécurisé
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pb-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Accédez à votre espace de facturation Stripe pour mettre à jour vos informations
          de paiement, modifier ou résilier votre abonnement et consulter vos paiements.
        </p>

        <Button
          onClick={handlePortal}
          disabled={loading}
          className="w-full h-11 gap-2 rounded-xl text-sm font-bold shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Ouverture du portail…
            </>
          ) : (
            <>
              <CreditCard size={15} />
              Gérer mon abonnement Stripe
              <ExternalLink size={12} className="ml-auto opacity-70" />
            </>
          )}
        </Button>

        <p className="text-center text-[10px] text-muted-foreground/60">
          Portail sécurisé par Stripe · Aucune donnée bancaire stockée sur nos serveurs
        </p>
      </CardContent>
    </Card>
  );
}

// ── Section 2 — Invoice History ───────────────────────────────────────────────

function InvoiceRow({ invoice }: { invoice: StripeInvoice }) {
  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 px-2 rounded-xl hover:bg-muted/40 transition-colors">
      {/* Data columns */}
      <div className="grid grid-cols-2 sm:flex sm:flex-row flex-1 gap-x-4 gap-y-1 items-start sm:items-center min-w-0">
        {/* Date */}
        <div className="flex flex-col gap-0.5 sm:w-24 shrink-0">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground sm:hidden">
            Date
          </span>
          <span className="text-sm text-foreground tabular-nums">
            {formatDate(invoice.created)}
          </span>
        </div>

        {/* Number */}
        <div className="flex flex-col gap-0.5 sm:w-36 shrink-0">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground sm:hidden">
            Numéro
          </span>
          <span className="font-mono text-xs text-muted-foreground truncate">
            {invoice.number || invoice.id.slice(0, 14) + '…'}
          </span>
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-0.5 sm:w-24 shrink-0">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground sm:hidden">
            Montant
          </span>
          <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
            {formatAmount(invoice.amount_paid, invoice.currency)}
          </span>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-0.5 items-start">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground sm:hidden">
            Statut
          </span>
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {invoice.invoice_pdf && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs rounded-lg"
            asChild
          >
            <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer">
              <Download size={12} />
              PDF
            </a>
          </Button>
        )}
        {invoice.hosted_invoice_url && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs rounded-lg"
            asChild
          >
            <a href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
              <Eye size={12} />
              Voir
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

function InvoiceSkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3.5 px-2">
      <Skeleton className="h-4 w-20 rounded-md" />
      <Skeleton className="h-4 w-32 rounded-md" />
      <Skeleton className="h-4 w-16 rounded-md" />
      <Skeleton className="h-5 w-14 rounded-full" />
      <div className="ml-auto flex gap-2">
        <Skeleton className="h-8 w-14 rounded-lg" />
        <Skeleton className="h-8 w-14 rounded-lg" />
      </div>
    </div>
  );
}

function InvoiceHistoryCard() {
  const [invoices, setInvoices] = useState<StripeInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchInvoices() {
      setLoading(true);
      setError(null);
      try {
        const token = await blink.auth.getValidToken();
        const res = await fetch('https://gbrhsehk.backend.blink.new/api/billing/invoices', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error(`Erreur ${res.status}`);
        }
        const data = await res.json() as StripeInvoice[] | { invoices?: StripeInvoice[] };
        if (!cancelled) {
          // Handle both array response and wrapped { invoices: [...] }
          const list = Array.isArray(data) ? data : (data.invoices ?? []);
          setInvoices(list);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchInvoices();
    return () => { cancelled = true; };
  }, []);

  return (
    <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText size={14} className="text-primary" />
            </div>
            Historique des factures
          </CardTitle>

          {!loading && !error && invoices.length > 0 && (
            <Badge variant="outline" className="font-medium text-xs">
              {invoices.length} facture{invoices.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop column headers */}
        {!loading && invoices.length > 0 && (
          <div className="hidden sm:flex flex-row items-center gap-4 px-6 py-2.5 bg-muted/30 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <div className="w-24 shrink-0">Date</div>
            <div className="w-36 shrink-0">Numéro</div>
            <div className="w-24 shrink-0">Montant</div>
            <div className="flex-1">Statut</div>
            <div className="w-32 shrink-0 text-right">Actions</div>
          </div>
        )}

        <div className="px-4 py-2 divide-y divide-border/60">
          {/* Loading state — 3 skeleton rows */}
          {loading && (
            <>
              <InvoiceSkeletonRow />
              <InvoiceSkeletonRow />
              <InvoiceSkeletonRow />
            </>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex items-start gap-3 py-6 px-2">
              <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Impossible de charger les factures</p>
                <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && invoices.length === 0 && (
            <div className="py-10 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center">
                <FileText size={22} className="text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Aucune facture disponible</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                  Vos premières factures apparaîtront ici après votre premier paiement.
                </p>
              </div>
            </div>
          )}

          {/* Invoice list */}
          {!loading && !error && invoices.map((invoice) => (
            <InvoiceRow key={invoice.id} invoice={invoice} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Section 3 — Data Protection Banner ───────────────────────────────────────

function DataProtectionBanner() {
  return (
    <Card className="rounded-2xl border-border/60 bg-muted/30 shadow-none">
      <CardContent className="py-4 px-5">
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-[#0D9488]/10 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck size={16} className="text-[#0D9488]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Facturation directe & sécurisée
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Chaque facture est émise <strong>automatiquement</strong> par Kompilot à votre
              adresse email enregistrée, au nom de Kompilot, avec TVA applicable (20 %) et
              le détail complet des prestations. Aucune donnée bancaire n'est stockée sur nos
              serveurs — tout est géré par Stripe.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Exported Component ────────────────────────────────────────────────────────

export function ProBillingDashboard() {
  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <StripePortalCard />
      <InvoiceHistoryCard />
      {/* B2B EU VAT validation — intra-community reverse-charge */}
      <VATNumberSection />
      <DataProtectionBanner />
    </div>
  );
}
