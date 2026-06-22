/**
 * NoShowExportModal — MODULE 3
 * Export CSV/PDF of No-Show indemnities collected via Stripe Connect.
 * Includes ClickwrapModal for legal validation before export.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download, FileText, Table2, Calendar,
  Filter, CheckCircle2, X, TrendingUp,
  Euro, CreditCard,
} from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { ClickwrapModal } from './ClickwrapModal';

// ── Simulated export data ──────────────────────────────────────────────────────

interface NoShowRecord {
  id: string;
  date: string;
  clientName: string;
  amount: number;
  service: string;
  status: 'collected' | 'refunded' | 'disputed';
  stripePaymentId: string;
}

function generateDemoData(count = 15): NoShowRecord[] {
  const services = ['Coupe homme', 'Consultation médicale', 'Table restaurant', 'Révision auto', 'Massage'];
  const names = ['Martin D.', 'Sophie L.', 'Jean P.', 'Marie C.', 'Thomas B.', 'Lucas M.', 'Emma R.'];
  const statuses: NoShowRecord['status'][] = ['collected', 'collected', 'collected', 'refunded', 'disputed'];

  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i * 2);
    return {
      id: `ns_${i + 1}`,
      date: d.toLocaleDateString('fr-FR'),
      clientName: names[i % names.length],
      amount: [25, 35, 50, 45, 30][i % 5],
      service: services[i % services.length],
      status: statuses[i % statuses.length],
      stripePaymentId: `pi_${Math.random().toString(36).slice(2, 18)}`,
    };
  });
}

// ── CSV export function ───────────────────────────────────────────────────────

function exportAsCSV(records: NoShowRecord[], dateFrom: string, dateTo: string) {
  const headers = ['Date', 'Client', 'Prestation', 'Montant (€)', 'Statut', 'Stripe Payment ID'];
  const rows = records.map(r => [
    r.date,
    r.clientName,
    r.service,
    r.amount.toFixed(2),
    r.status === 'collected' ? 'Encaissé' : r.status === 'refunded' ? 'Remboursé' : 'En litige',
    r.stripePaymentId,
  ]);

  const total = records.filter(r => r.status === 'collected').reduce((s, r) => s + r.amount, 0);
  const summary = ['TOTAL', '', '', total.toFixed(2), 'Encaissé', ''];

  const csv = [
    `# Kompilot — Export Indemnités No-Show`,
    `# Période : ${dateFrom} → ${dateTo}`,
    `# Généré le : ${new Date().toLocaleDateString('fr-FR')}`,
    '',
    headers.join(';'),
    ...rows.map(r => r.join(';')),
    '',
    summary.join(';'),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `noshow-indemnites-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Export CSV téléchargé ✓', {
    description: `${records.length} transactions exportées.`,
  });
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NoShowExportModal({ open, onClose }: Props) {
  const records = generateDemoData(15);
  const [dateFrom] = useState('01/06/2026');
  const [dateTo] = useState(new Date().toLocaleDateString('fr-FR'));
  const [filterStatus, setFilterStatus] = useState<'all' | 'collected' | 'refunded' | 'disputed'>('all');
  const [showClickwrap, setShowClickwrap] = useState(false);

  if (!open) return null;

  const filtered = filterStatus === 'all' ? records : records.filter(r => r.status === filterStatus);
  const totalCollected = records.filter(r => r.status === 'collected').reduce((s, r) => s + r.amount, 0);
  const totalRefunded = records.filter(r => r.status === 'refunded').reduce((s, r) => s + r.amount, 0);

  const handleExportRequest = () => {
    setShowClickwrap(true);
  };

  const handleExportConfirm = () => {
    exportAsCSV(filtered, dateFrom, dateTo);
    setShowClickwrap(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border bg-gradient-to-r from-emerald-50/60 to-transparent dark:from-emerald-950/10">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <Download size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h2 className="font-extrabold text-base text-foreground">Export Comptable — Indemnités No-Show</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exportez vos encaissements Stripe Connect en CSV pour votre comptabilité.
              </p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X size={16} />
            </button>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-3 gap-0 border-b border-border">
            {[
              { label: 'Total encaissé', value: `${totalCollected.toFixed(0)}€`, icon: Euro, color: 'text-emerald-600' },
              { label: 'No-shows collectés', value: records.filter(r => r.status === 'collected').length, icon: CheckCircle2, color: 'text-green-600' },
              { label: 'Remboursements', value: `${totalRefunded.toFixed(0)}€`, icon: CreditCard, color: 'text-amber-600' },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div key={i} className="flex items-center gap-2.5 px-5 py-4 border-r border-border last:border-r-0">
                  <Icon size={16} className={kpi.color} />
                  <div>
                    <p className="font-bold text-sm text-foreground">{kpi.value}</p>
                    <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filter bar */}
          <div className="px-5 py-3 flex items-center gap-2 border-b border-border bg-muted/20">
            <Filter size={13} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground mr-2">Filtrer :</span>
            {(['all', 'collected', 'refunded', 'disputed'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                  filterStatus === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {s === 'all' ? 'Tous' : s === 'collected' ? 'Encaissés' : s === 'refunded' ? 'Remboursés' : 'En litige'}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-y-auto max-h-64">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 border-b border-border sticky top-0">
                <tr>
                  {['Date', 'Client', 'Prestation', 'Montant', 'Statut'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-semibold text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground">{r.date}</td>
                    <td className="px-4 py-2.5 font-medium text-foreground">{r.clientName}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.service}</td>
                    <td className="px-4 py-2.5 font-bold text-foreground">{r.amount.toFixed(2)}€</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        r.status === 'collected'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : r.status === 'refunded'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {r.status === 'collected' ? '✓ Encaissé' : r.status === 'refunded' ? '↩ Remboursé' : '⚠ Litige'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              {filtered.length} transactions · Période : {dateFrom} → {dateTo}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="text-xs h-8">
                Fermer
              </Button>
              <Button
                onClick={handleExportRequest}
                className="gap-2 text-xs h-8"
              >
                <Download size={13} /> Exporter CSV
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Clickwrap before export */}
      <ClickwrapModal
        open={showClickwrap}
        actionLabel="Valider et exporter le CSV"
        checkoutType="export"
        onAccept={handleExportConfirm}
        onCancel={() => setShowClickwrap(false)}
      />
    </>
  );
}
