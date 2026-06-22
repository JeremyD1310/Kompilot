/**
 * InvoicePreview — Agency consolidated invoice preview with:
 * - Multi-currency support (EUR, GBP, CHF, CAD, USD…)
 * - Reverse-charge (autoliquidation TVA 0%) for intra-EU B2B
 * - Country-specific legal mentions for white-label compliance
 */

import { useState } from 'react';
import { Card, CardContent, Button, Badge, toast } from '@blinkdotnew/ui';
import { FileText, Loader2, Info, Globe } from 'lucide-react';
import { blink } from '../../../blink/client';

const BACKEND = 'https://gbrhsehk.backend.blink.new';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BackendLineItem {
  description: string;
  quantity?:   number;
  qty?:        number;
  unitPrice:   number;
  total?:      number;
}

interface BackendInvoiceData {
  period:      string;
  agencyName?: string;
  lineItems:   BackendLineItem[];
  subtotal?:   number;
  totalHT?:    number;
  tva:         number;
  total?:      number;
  totalTTC?:   number;
  currency:    string;
  tvaRate?:    number;
}

interface Props {
  agencyName: string;
}

// ── Currency formatter ────────────────────────────────────────────────────────

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style:    'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

// ── Legal mentions by country ─────────────────────────────────────────────────

const LEGAL_MENTIONS: Record<string, string> = {
  FR: 'TVA 20 % — Article 283 du CGI',
  BE: 'TVA 21 % — Loi TVA belge',
  DE: 'MwSt 19 % — § 13b UStG',
  ES: 'IVA 21 % — Art. 84 Ley IVA',
  IT: 'IVA 22 % — DPR 633/72',
  NL: 'BTW 21 % — Wet OB 1968',
  GB: 'VAT 20 % — VATA 1994',
  CH: 'MWST 7.7 % — MWSTG',
  CA: 'TPS/TVH — Loi sur la taxe d\'accise',
  US: 'Sales Tax applicable selon l\'État',
};

const REVERSE_CHARGE_LEGAL =
  'Autoliquidation de la TVA — Article 196 Directive 2006/112/CE. TVA due par le preneur assujetti.';

function getLegalMention(currency: string, tvaRate: number): string {
  if (tvaRate === 0) return REVERSE_CHARGE_LEGAL;
  // Guess country from currency
  const currencyToCountry: Record<string, string> = {
    EUR: 'FR', GBP: 'GB', CHF: 'CH', CAD: 'CA', USD: 'US',
  };
  const cc = currencyToCountry[currency.toUpperCase()] ?? 'FR';
  return LEGAL_MENTIONS[cc] ?? 'TVA applicable selon réglementation locale';
}

// ── Main component ─────────────────────────────────────────────────────────────

export function InvoicePreview({ agencyName }: Props) {
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<BackendInvoiceData | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await blink.auth.getValidToken();
      const res   = await fetch(`${BACKEND}/api/billing/agency/invoice-preview`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: BackendInvoiceData = await res.json();
      setInvoice(data);
    } catch {
      setError("Impossible de générer l'aperçu. Veuillez réessayer.");
      toast.error('Erreur de génération', { description: 'Vérifiez votre connexion et réessayez.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0D9488]/10 flex items-center justify-center shrink-0">
            <FileText size={14} className="text-[#0D9488]" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Aperçu de facture consolidée</h3>
        </div>
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={loading}
          className="gap-1.5 h-9 rounded-xl text-xs"
        >
          {loading
            ? <><Loader2 size={12} className="animate-spin" /> Génération…</>
            : <><FileText size={12} /> Générer l'aperçu</>}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1.5 px-1">
          <Info size={12} className="shrink-0" />{error}
        </p>
      )}

      {invoice && (() => {
        const ht          = invoice.totalHT  ?? invoice.subtotal ?? 0;
        const ttc         = invoice.totalTTC ?? invoice.total    ?? 0;
        const currency    = (invoice.currency ?? 'EUR').toUpperCase();
        const tvaRate     = invoice.tvaRate ?? (invoice.tva > 0 ? invoice.tva / (ht || 1) : 0);
        const isReverse   = tvaRate === 0 && ttc > 0;
        const displayName = invoice.agencyName ?? agencyName;
        const legal       = getLegalMention(currency, isReverse ? 0 : tvaRate);

        return (
          <Card className="rounded-2xl border-[#0D9488]/20 bg-gradient-to-br from-white to-teal-50/30 shadow-sm overflow-hidden">
            <div className={`h-1 w-full bg-gradient-to-r ${isReverse ? 'from-violet-500 to-purple-400' : 'from-[#0D9488] to-teal-300'}`} />
            <CardContent className="p-5 space-y-4">

              {/* Invoice header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-bold text-foreground">{displayName}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">→ Kompilot (usage interne uniquement)</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-[10px] border-[#0D9488]/30 text-[#0D9488]">
                    {invoice.period}
                  </Badge>
                  {currency !== 'EUR' && (
                    <Badge variant="outline" className="text-[10px] gap-1 border-blue-300 text-blue-700">
                      <Globe size={9} />{currency}
                    </Badge>
                  )}
                </div>
              </div>

              {/* White-label disclaimer */}
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
                <Info size={13} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Cette facture vous est adressée à vous (l'agence) uniquement. Vos clients ne la verront jamais.
                </p>
              </div>

              {/* Reverse-charge info banner */}
              {isReverse && (
                <div className="flex items-start gap-2 rounded-xl bg-violet-50 border border-violet-200 px-3 py-2.5">
                  <Info size={13} className="text-violet-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-violet-800 leading-relaxed">
                    <strong>Autoliquidation TVA (0 %)</strong> — Votre numéro TVA intracommunautaire a été détecté.
                    La TVA est due par vous en tant qu'assujetti dans votre pays.
                  </p>
                </div>
              )}

              {/* Line items table */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-center">Qté</div>
                  <div className="col-span-2 text-right">P.U. HT</div>
                  <div className="col-span-2 text-right">Total HT</div>
                </div>
                <div className="divide-y divide-border">
                  {invoice.lineItems.map((item, i) => {
                    const qty       = item.qty ?? item.quantity ?? 0;
                    const lineTotal = item.total ?? (qty * item.unitPrice);
                    return (
                      <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs">
                        <div className="col-span-6 text-foreground">{item.description}</div>
                        <div className="col-span-2 text-center text-muted-foreground">{qty}</div>
                        <div className="col-span-2 text-right tabular-nums text-muted-foreground">
                          {formatMoney(item.unitPrice, currency)}
                        </div>
                        <div className="col-span-2 text-right tabular-nums font-semibold">
                          {formatMoney(lineTotal, currency)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 border-t border-border pt-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Total HT</span>
                  <span className="tabular-nums font-mono">{formatMoney(ht, currency)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {isReverse
                      ? 'TVA — Autoliquidation (0 %)'
                      : `TVA ${Math.round(tvaRate * 100)} %`}
                  </span>
                  <span className="tabular-nums font-mono">
                    {isReverse ? formatMoney(0, currency) : formatMoney(invoice.tva, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-2 mt-1">
                  <span>Total TTC</span>
                  <span className={`tabular-nums font-mono ${isReverse ? 'text-violet-600' : 'text-[#0D9488]'}`}>
                    {formatMoney(ttc, currency)}
                  </span>
                </div>
              </div>

              {/* Legal mentions */}
              <div className="rounded-xl bg-muted/20 border border-border px-3.5 py-2.5">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  <strong className="text-foreground/70">Mentions légales :</strong> {legal}
                </p>
              </div>

            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
