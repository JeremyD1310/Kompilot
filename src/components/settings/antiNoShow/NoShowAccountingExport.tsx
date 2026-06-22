/**
 * NoShowAccountingExport — Export comptable mensuel des no-shows (frais Stripe inclus).
 * Génère un CSV réel ou un TXT formaté pour comptable.
 */
import { useState } from 'react';
import { BarChart3, Download, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import {
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@blinkdotnew/ui';

/* ── Types ── */
interface NoShowEntry {
  date: string;
  client: string;
  service: string;
  grossAmount: number;
}

/* ── Données simulées réalistes (santé / beauté) ── */
const SIMULATED_DATA: NoShowEntry[] = [
  { date: '2025-06-03', client: 'Camille Durand',   service: 'Soin visage hydratant',   grossAmount: 55 },
  { date: '2025-06-05', client: 'Sophie Martin',    service: 'Massage relaxant 60 min', grossAmount: 70 },
  { date: '2025-06-09', client: 'Marie Lefevre',    service: 'Épilation complète',       grossAmount: 45 },
  { date: '2025-06-12', client: 'Anaïs Petit',      service: 'Manucure gel',             grossAmount: 35 },
  { date: '2025-06-16', client: 'Clara Bernard',    service: 'Consultation ostéo 45min', grossAmount: 65 },
  { date: '2025-06-18', client: 'Julie Thomas',     service: 'Soin corps enveloppant',   grossAmount: 80 },
  { date: '2025-06-23', client: 'Laura Moreau',     service: 'Coiffure coloration',      grossAmount: 60 },
  { date: '2025-06-27', client: 'Emma Girard',      service: 'Pédicure spa',             grossAmount: 40 },
];

/* ── Calculs Stripe (2.9% + 0.25€) ── */
function stripeFee(gross: number): number {
  return Math.round((gross * 0.029 + 0.25) * 100) / 100;
}
function netAmount(gross: number): number {
  return Math.round((gross - stripeFee(gross)) * 100) / 100;
}

/* ── Utilitaires export ── */
function formatEur(val: number): string {
  return val.toFixed(2).replace('.', ',') + ' €';
}

function buildRows(data: NoShowEntry[]) {
  return data.map(r => ({
    ...r,
    fee: stripeFee(r.grossAmount),
    net: netAmount(r.grossAmount),
  }));
}

function exportCSV(data: NoShowEntry[], month: string) {
  const rows = buildRows(data);
  const header = ['Date', 'Client', 'Service', 'Montant Brut (€)', 'Frais Stripe (€)', 'Net Perçu (€)'];
  const lines = [
    header.join(';'),
    ...rows.map(r =>
      [r.date, r.client, r.service,
       r.grossAmount.toFixed(2), r.fee.toFixed(2), r.net.toFixed(2)].join(';')
    ),
    '',
    ['TOTAL', '', '',
     rows.reduce((s, r) => s + r.grossAmount, 0).toFixed(2),
     rows.reduce((s, r) => s + r.fee, 0).toFixed(2),
     rows.reduce((s, r) => s + r.net, 0).toFixed(2)].join(';'),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `no-shows-export-${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportTXT(data: NoShowEntry[], month: string) {
  const rows = buildRows(data);
  const totalGross = rows.reduce((s, r) => s + r.grossAmount, 0);
  const totalFee   = rows.reduce((s, r) => s + r.fee, 0);
  const totalNet   = rows.reduce((s, r) => s + r.net, 0);

  const sep = '─'.repeat(74);
  const lines = [
    '╔══════════════════════════════════════════════════════════════════════════╗',
    '║          EXPORT COMPTABLE — NO-SHOWS & PÉNALITÉS STRIPE                 ║',
    `║          Période : ${month.replace('-', '/')}${''.padEnd(52 - month.length)}║`,
    '╚══════════════════════════════════════════════════════════════════════════╝',
    '',
    sep,
    `${'Date'.padEnd(12)} ${'Client'.padEnd(20)} ${'Service'.padEnd(22)} ${'Brut'.padStart(7)} ${'Frais'.padStart(7)} ${'Net'.padStart(7)}`,
    sep,
    ...rows.map(r =>
      `${r.date.padEnd(12)} ${r.client.substring(0,19).padEnd(20)} ${r.service.substring(0,21).padEnd(22)} ${(r.grossAmount.toFixed(2)+' €').padStart(7)} ${(r.fee.toFixed(2)+' €').padStart(7)} ${(r.net.toFixed(2)+' €').padStart(7)}`
    ),
    sep,
    `${'TOTAL'.padEnd(12)} ${''.padEnd(20)} ${''.padEnd(22)} ${(totalGross.toFixed(2)+' €').padStart(7)} ${(totalFee.toFixed(2)+' €').padStart(7)} ${(totalNet.toFixed(2)+' €').padStart(7)}`,
    sep,
    '',
    'Frais Stripe appliqués : 2,9% + 0,25 € par transaction',
    'Document généré automatiquement — Kompilot',
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `no-shows-comptable-${month}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Composant principal ── */
export function NoShowAccountingExport() {
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(defaultMonth);

  const rows = buildRows(SIMULATED_DATA);
  const totalGross = rows.reduce((s, r) => s + r.grossAmount, 0);
  const totalFee   = rows.reduce((s, r) => s + r.fee, 0);
  const totalNet   = rows.reduce((s, r) => s + r.net, 0);

  return (
    <>
      {/* ── Trigger ── */}
      <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
            <BarChart3 size={18} className="text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-foreground">Export Comptable</p>
            <p className="text-xs text-muted-foreground">No-shows · frais Stripe · net perçu</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-2 border-teal-500/30 text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 shrink-0"
        >
          <BarChart3 size={14} />
          Export Comptable Mensuel
        </Button>
      </div>

      {/* ── Modal ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <BarChart3 size={18} className="text-teal-600" />
              Export Comptable Mensuel
              <Badge variant="secondary" className="text-[11px] font-semibold">
                {rows.length} no-shows
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            {/* Sélecteur mois */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 w-full max-w-[220px]">
                <Calendar size={14} className="text-muted-foreground shrink-0" />
                <input
                  type="month"
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-foreground outline-none w-full"
                />
              </div>
              <p className="text-xs text-muted-foreground">Données simulées à titre d'exemple</p>
            </div>

            {/* Tableau */}
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    {['Date', 'Client', 'Service', 'Montant Brut', 'Frais Stripe', 'Net Perçu'].map(col => (
                      <th key={col} className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-3 py-2.5 text-muted-foreground font-mono whitespace-nowrap">{r.date}</td>
                      <td className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{r.client}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{r.service}</td>
                      <td className="px-3 py-2.5 font-semibold text-foreground text-right whitespace-nowrap">
                        {formatEur(r.grossAmount)}
                      </td>
                      <td className="px-3 py-2.5 text-rose-600 text-right whitespace-nowrap font-mono">
                        −{formatEur(r.fee)}
                      </td>
                      <td className="px-3 py-2.5 text-teal-700 font-bold text-right whitespace-nowrap">
                        {formatEur(r.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/40 border-t-2 border-border">
                    <td colSpan={3} className="px-3 py-3 font-extrabold text-foreground text-xs uppercase tracking-wide">
                      Total
                    </td>
                    <td className="px-3 py-3 font-extrabold text-foreground text-right whitespace-nowrap">
                      {formatEur(totalGross)}
                    </td>
                    <td className="px-3 py-3 font-bold text-rose-600 text-right whitespace-nowrap font-mono">
                      −{formatEur(totalFee)}
                    </td>
                    <td className="px-3 py-3 font-extrabold text-teal-700 text-right whitespace-nowrap">
                      {formatEur(totalNet)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Légende frais */}
            <div className="flex items-start gap-2 rounded-xl border border-teal-500/20 bg-teal-50/50 dark:bg-teal-950/20 px-4 py-3">
              <CheckCircle2 size={14} className="text-teal-600 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Frais Stripe</span> calculés selon la grille standard :{' '}
                <span className="font-mono text-foreground">2,9% + 0,25 €</span> par transaction prélevée.
                Le net perçu correspond au montant réel crédité sur votre compte.
              </p>
            </div>

            {/* Boutons export */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                className="gap-2 bg-teal-600 hover:bg-teal-700 text-white flex-1"
                onClick={() => exportCSV(SIMULATED_DATA, month)}
              >
                <Download size={14} />
                Exporter CSV
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-border flex-1"
                onClick={() => exportTXT(SIMULATED_DATA, month)}
              >
                <FileText size={14} />
                Exporter PDF (texte)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
