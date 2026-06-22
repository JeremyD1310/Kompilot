import { useState, useEffect } from 'react';
import { Download, Receipt, X, Printer } from 'lucide-react';
import { useOnboardingProfile } from '../../hooks/useOnboardingProfile';
import { getStoredInvoices, type StoredInvoice } from '../../lib/billingStorage';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Invoice {
  id: string;
  number: string;
  date: string;
  description: string;
  amountHT: number;
  tvaRate: number;
}

// ── Fake billing data ─────────────────────────────────────────────────────────

const INVOICES: Invoice[] = [
  { id: 'inv1', number: 'NC-2026-0047', date: '01/05/2026', description: 'Abonnement Pro – Mai 2026', amountHT: 15.83, tvaRate: 20 },
  { id: 'inv2', number: 'NC-2026-0031', date: '01/04/2026', description: 'Abonnement Pro – Avril 2026', amountHT: 15.83, tvaRate: 20 },
  { id: 'inv3', number: 'NC-2026-0021', date: '12/03/2026', description: 'Pack 20 crédits supplémentaires', amountHT: 8.25, tvaRate: 20 },
  { id: 'inv4', number: 'NC-2026-0018', date: '01/03/2026', description: 'Abonnement Pro – Mars 2026', amountHT: 15.83, tvaRate: 20 },
  { id: 'inv5', number: 'NC-2026-0008', date: '01/02/2026', description: 'Abonnement Pro – Février 2026', amountHT: 15.83, tvaRate: 20 },
  { id: 'inv6', number: 'NC-2026-0001', date: '01/01/2026', description: 'Abonnement Pro – Janvier 2026', amountHT: 15.83, tvaRate: 20 },
];

function fmt(n: number) {
  return n.toFixed(2).replace('.', ',') + ' €';
}

// ── Invoice modal ─────────────────────────────────────────────────────────────

function InvoiceModal({ invoice, company, onClose }: {
  invoice: Invoice;
  company: string;
  onClose: () => void;
}) {
  const tva = invoice.amountHT * (invoice.tvaRate / 100);
  const ttc = invoice.amountHT + tva;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Facture {invoice.number}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <Printer size={13} /> Imprimer
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Invoice body — printable */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto print:p-8" id="invoice-print">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                    <span className="text-white text-[10px] font-extrabold">NC</span>
                  </div>
                  <span className="font-extrabold text-gray-900">Kompilot</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Kompilot SAS<br />
                  12 rue de la Paix, 75001 Paris<br />
                  SIRET : 123 456 789 00012<br />
                  TVA Intracomm. : FR12 123456789
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-gray-900">FACTURE</p>
                <p className="text-sm text-gray-500 mt-1">N° {invoice.number}</p>
                <p className="text-xs text-gray-400 mt-0.5">Date : {invoice.date}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Client */}
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Facturé à</p>
              <p className="text-sm font-semibold text-gray-900">{company || 'Votre Entreprise'}</p>
              <p className="text-xs text-gray-500">Client Kompilot</p>
            </div>

            {/* Line items */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide pb-2">Description</th>
                  <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wide pb-2">Montant HT</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-50">
                  <td className="py-3 text-gray-800">{invoice.description}</td>
                  <td className="py-3 text-right font-medium text-gray-800">{fmt(invoice.amountHT)}</td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Sous-total HT</span>
                <span>{fmt(invoice.amountHT)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>TVA ({invoice.tvaRate}%)</span>
                <span>{fmt(tva)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-base text-gray-900 pt-2 border-t border-gray-200 mt-2">
                <span>Total TTC</span>
                <span>{fmt(ttc)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="rounded-xl bg-teal-50 border border-teal-100 px-4 py-3 text-[11px] text-teal-700 leading-relaxed">
              Paiement reçu par carte bancaire · Facture acquittée.<br />
              Conformément à l'article L441-10 du Code de Commerce.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

export function BillingHistorySection() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [dynamicInvoices, setDynamicInvoices] = useState<StoredInvoice[]>([]);
  const profile = useOnboardingProfile();
  const company = profile?.companyName ?? 'Votre Entreprise';

  // Reload dynamic invoices on mount and when localStorage changes
  useEffect(() => {
    const load = () => setDynamicInvoices(getStoredInvoices());
    load();
    window.addEventListener('storage', load);
    // Also poll briefly after mount to catch same-tab writes
    const t = setTimeout(load, 300);
    return () => { window.removeEventListener('storage', load); clearTimeout(t); };
  }, []);

  // Merge: dynamic invoices first (most recent), then static history
  const allInvoices: Invoice[] = [
    ...dynamicInvoices.map(d => ({
      id: d.id,
      number: d.number,
      date: d.date,
      description: d.description,
      amountHT: d.amountHT,
      tvaRate: d.tvaRate,
    })),
    ...INVOICES,
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Receipt size={16} className="text-muted-foreground" />
        <h3 className="text-sm font-bold text-foreground">🧾 Historique de facturation</h3>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 bg-muted/40 border-b border-border">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">TTC</span>
          <span></span>
        </div>

        {/* Rows */}
        {allInvoices.map((inv, i) => {
          const ttc = inv.amountHT * (1 + inv.tvaRate / 100);
          return (
            <div
              key={inv.id}
              className={`grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-muted/30 transition-colors ${
                i < allInvoices.length - 1 ? 'border-b border-border/50' : ''
              }`}
            >
              <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">{inv.date}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{inv.description}</p>
                <p className="text-[11px] text-muted-foreground">{inv.number}</p>
              </div>
              <span className="text-sm font-bold text-foreground tabular-nums whitespace-nowrap">
                {fmt(ttc)}
              </span>
              <button
                onClick={() => setSelectedInvoice(inv)}
                className="flex items-center gap-1.5 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary text-[11px] font-semibold px-3 py-1.5 transition-all whitespace-nowrap"
              >
                <Download size={11} /> PDF
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Les factures sont générées automatiquement chaque mois. Contactez <a href="mailto:billing@kompilot.app" className="text-primary hover:underline">billing@kompilot.app</a> pour toute question.
      </p>

      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          company={company}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}