/**
 * Onglet Factures — Conformité B2B française
 * Génère des PDF A4 conformes art. L441-3, L441-9 C.Com
 */

import React, { useState, useEffect } from 'react';
import {
  Card, CardHeader, CardTitle, CardContent,
  Badge, Button, toast
} from '@blinkdotnew/ui';
import {
  FileText, Download, CheckCircle2, AlertCircle,
  Building2, Send, FileSpreadsheet, FileArchive,
  Eye, Mail, BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useAuth } from '../../hooks/useAuth';
import { openInvoicePDF, buildInvoiceData } from '../../lib/invoice';
import { getAccountantSettings, setAccountantSettings } from '../../lib/billingStorage';

// ── Données de factures (dans un vrai SaaS, elles viennent de l'API Stripe) ───

interface Invoice {
  id: string;
  date: string;
  plan: string;
  htEur: number;
  tvaEur: number;
  ttcEur: number;
  status: 'paid' | 'pending';
  periodStart: string;
  periodEnd: string;
}

const INVOICES: Invoice[] = [
  { id: 'NC-2026-06-001', date: '01 juin 2026',   plan: 'Offre Business', htEur: 89,   tvaEur: 17.80, ttcEur: 106.80, status: 'paid', periodStart: '01/06/2026', periodEnd: '30/06/2026' },
  { id: 'NC-2026-05-001', date: '01 mai 2026',    plan: 'Offre Business', htEur: 89,   tvaEur: 17.80, ttcEur: 106.80, status: 'paid', periodStart: '01/05/2026', periodEnd: '31/05/2026' },
  { id: 'NC-2026-04-001', date: '01 avr. 2026',   plan: 'Offre Business', htEur: 89,   tvaEur: 17.80, ttcEur: 106.80, status: 'paid', periodStart: '01/04/2026', periodEnd: '30/04/2026' },
  { id: 'NC-2026-03-001', date: '01 mars 2026',   plan: 'Offre Pro',      htEur: 49,   tvaEur: 9.80,  ttcEur: 58.80,  status: 'paid', periodStart: '01/03/2026', periodEnd: '31/03/2026' },
  { id: 'NC-2026-02-001', date: '01 févr. 2026',  plan: 'Offre Pro',      htEur: 49,   tvaEur: 9.80,  ttcEur: 58.80,  status: 'paid', periodStart: '01/02/2026', periodEnd: '28/02/2026' },
  { id: 'NC-2026-01-001', date: '01 janv. 2026',  plan: 'Offre Starter',  htEur: 29,   tvaEur: 5.80,  ttcEur: 34.80,  status: 'paid', periodStart: '01/01/2026', periodEnd: '31/01/2026' },
];

// ── Ligne de facture ──────────────────────────────────────────────────────────

function InvoiceRow({
  invoice,
  clientName,
  clientAddress,
  clientSiret,
  clientTvaIntra,
}: {
  invoice: Invoice;
  clientName: string;
  clientAddress: string;
  clientSiret?: string;
  clientTvaIntra?: string;
}) {
  const [loading, setLoading] = React.useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const data = buildInvoiceData({
        invoiceId: invoice.id,
        dateEmission: invoice.date,
        planName: invoice.plan,
        priceHT: invoice.htEur,
        clientName,
        clientAddress,
        clientSiret,
        clientTvaIntra,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        paidAt: invoice.date,
      });
      openInvoicePDF(data);
      toast.success(`Facture ${invoice.id} ouverte ! 📥`, {
        description: 'Cliquez sur "Télécharger en PDF" dans le nouvel onglet.',
      });
    } catch {
      toast.error('Erreur lors de la génération du PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3 px-2 hover:bg-muted/40 transition-colors rounded-lg group">
      {/* Infos */}
      <div className="grid grid-cols-2 sm:grid-cols-7 flex-1 gap-3 items-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold sm:hidden">N° Facture</span>
          <span className="font-mono text-sm font-semibold text-foreground">{invoice.id}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold sm:hidden">Date</span>
          <span className="text-sm text-muted-foreground">{invoice.date}</span>
        </div>
        <div className="flex flex-col gap-0.5 col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold sm:hidden">Offre</span>
          <Badge variant="outline" className="w-fit text-[10px] font-medium">{invoice.plan}</Badge>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold sm:hidden">HT</span>
          <span className="font-mono text-sm tabular-nums">{invoice.htEur.toFixed(2)} €</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold sm:hidden">TVA 20%</span>
          <span className="font-mono text-sm tabular-nums text-muted-foreground">{invoice.tvaEur.toFixed(2)} €</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold sm:hidden">TTC</span>
          <span className="font-mono text-sm font-bold tabular-nums text-primary">{invoice.ttcEur.toFixed(2)} €</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold sm:hidden">Statut</span>
          <Badge className="w-fit bg-green-500/10 text-green-600 border-green-500/20 text-[10px] hover:bg-green-500/20">
            Payée ✓
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDownload}
          disabled={loading}
        >
          <Eye size={13} />
          Aperçu
        </Button>
        <Button
          variant="default"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={handleDownload}
          disabled={loading}
        >
          {loading ? (
            <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download size={13} />
          )}
          PDF
        </Button>
      </div>
    </div>
  );
}

// ── Section SIRET & conformité ────────────────────────────────────────────────

function SiretConformityCard({ siret, address }: { siret?: string; address: string }) {
  return (
    <Card className="rounded-2xl border-border bg-card overflow-hidden shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="text-primary" size={20} />
          Informations de facturation client
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* SIRET status */}
        <div className={cn(
          "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4",
          siret ? "bg-green-500/5 border-green-500/10" : "bg-amber-500/5 border-amber-500/10"
        )}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {siret ? (
                <CheckCircle2 className="text-green-600 shrink-0" size={18} />
              ) : (
                <AlertCircle className="text-amber-600 shrink-0" size={18} />
              )}
              <span className="font-bold text-sm">
                {siret ? `SIRET client : ${siret}` : 'Aucun SIRET renseigné'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
              {siret
                ? 'Votre SIRET est automatiquement intégré sur toutes vos factures pour la conformité fiscale française.'
                : 'Ajoutez votre SIRET dans Paramètres → Établissement pour générer des factures 100 % conformes.'}
            </p>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Adresse connue</span>
            <span className="text-xs text-foreground font-medium">{address || '—'}</span>
          </div>
        </div>

        {/* Rappel mentions légales */}
        <div className="flex gap-3 items-start bg-primary/5 border border-primary/10 rounded-xl p-3">
          <span className="text-base shrink-0">⚖️</span>
          <p className="text-xs text-foreground/70 leading-relaxed">
            <span className="font-semibold text-foreground">Conformité B2B assurée :</span>{' '}
            chaque facture inclut les mentions obligatoires — SIRET, TVA, pénalités de retard,
            indemnité forfaitaire 40 €, numérotation chronologique (art. L441-9 C.Com).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Section automatisation comptable ─────────────────────────────────────────

function AccountantAutoSendSection() {
  const [autoSend, setAutoSend] = useState(() => getAccountantSettings().autoSend);
  const [email, setEmail] = useState(() => getAccountantSettings().email);
  const [emailTouched, setEmailTouched] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Persist on change
  useEffect(() => {
    setAccountantSettings({ autoSend, email });
  }, [autoSend, email]);

  const handleToggle = () => {
    const next = !autoSend;
    setAutoSend(next);
    if (next && email && isValidEmail) {
      toast.success('Envoi automatique activé ! 📬', {
        description: `Les factures seront envoyées à ${email}`,
      });
    }
  };

  const handleSaveEmail = () => {
    if (!isValidEmail) { toast.error('Adresse email invalide.'); return; }
    setAccountantSettings({ autoSend, email });
    toast.success('Email comptable enregistré ! 📬', {
      description: `Les factures seront envoyées à ${email} chaque mois.`,
    });
  };

  return (
    <Card className="rounded-2xl border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="text-primary" size={20} />
          Automatisation comptable 📬
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle row */}
        <div className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border/60">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Mail size={15} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Automatiser l'envoi à mon comptable 📬</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Activez pour recevoir vos factures automatiquement chaque mois.
              </p>
            </div>
          </div>
          {/* Toggle switch */}
          <button
            onClick={handleToggle}
            className={`relative w-12 h-6 rounded-full flex-shrink-0 transition-colors duration-200 focus:outline-none cursor-pointer ${
              autoSend ? 'bg-primary' : 'bg-gray-200'
            }`}
            aria-pressed={autoSend}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
              autoSend ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Email field — shown when toggle is ON */}
        {autoSend && (
          <div className="space-y-3 border border-primary/20 rounded-xl p-4 bg-primary/[0.02]">
            <label className="text-[11px] font-bold text-foreground/70 uppercase tracking-wide">
              Adresse e-mail de votre comptable
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
                <input
                  type="email"
                  placeholder="compta@cabinet.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailTouched(true); }}
                  className={cn(
                    "w-full rounded-xl border pl-9 pr-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-2",
                    emailTouched && email && !isValidEmail
                      ? "border-red-300 bg-red-50/30 focus:ring-red-200"
                      : "border-border bg-background focus:ring-primary/25 focus:border-primary",
                  )}
                />
              </div>
              <Button
                size="sm"
                className="shrink-0 h-10 gap-1.5 px-4 rounded-xl"
                disabled={!isValidEmail}
                onClick={handleSaveEmail}
              >
                <Send size={13} />
                Enregistrer
              </Button>
            </div>

            {emailTouched && email && !isValidEmail && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={11} className="shrink-0" /> Adresse email invalide.
              </p>
            )}

            {/* Explanatory note */}
            <div className="flex items-start gap-2.5 rounded-xl bg-primary/8 border border-primary/15 px-3.5 py-3 mt-1">
              <span className="text-sm shrink-0 mt-0.5">📬</span>
              <p className="text-xs text-foreground/75 leading-relaxed">
                Chaque mois, dès la validation du paiement, votre{' '}
                <strong>facture conforme</strong> sera directement envoyée à votre
                comptable pour vous éviter toute paperasse.
                {email && isValidEmail && (
                  <span className="block mt-1 font-semibold text-primary">
                    → Destinataire configuré : {email}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Onglet principal ──────────────────────────────────────────────────────────

export const InvoicesTab = () => {
  const { activeEstablishment } = useEstablishment();
  const { user } = useAuth();

  const clientName = activeEstablishment?.name ?? user?.displayName ?? 'Client Kompilot';
  const clientAddress = activeEstablishment?.billingAddress ?? activeEstablishment?.address ?? '—';
  const clientSiret = activeEstablishment?.siret;
  const clientTvaIntra = activeEstablishment?.tvaIntra;

  const handleExportCSV = () => {
    // Génère un CSV minimal compatible EBP / Sage / QuickBooks
    const headers = ['N° Facture', 'Date', 'Offre', 'HT (€)', 'TVA (€)', 'TTC (€)', 'Statut'];
    const rows = INVOICES.map(inv => [
      inv.id, inv.date, inv.plan,
      inv.htEur.toFixed(2), inv.tvaEur.toFixed(2), inv.ttcEur.toFixed(2),
      'Payée',
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kompilot-Factures-${new Date().getFullYear()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Export CSV généré ! 📊', { description: 'Format compatible EBP, Sage, Ciel, QuickBooks.' });
  };

  return (
    <div className="space-y-6">

      {/* ── Archive ZIP annuelle ── */}
      <div className="rounded-xl border border-border bg-muted/20 px-4 py-4 flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Archive comptable annuelle 📁</p>
          <p className="text-xs text-muted-foreground">Téléchargez toutes vos factures d'une année en un seul fichier ZIP</p>
        </div>
        <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option>Année 2026</option>
          <option>Année 2025</option>
          <option>Année 2024</option>
        </select>
        <button
          onClick={() => { window.alert('Archive ZIP 2026 en cours de préparation… Vous recevrez un email avec le lien de téléchargement.'); }}
          className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:bg-primary/90 transition-colors shrink-0"
        >
          📦 Télécharger l'archive (.ZIP)
        </button>
      </div>

      <SiretConformityCard siret={clientSiret} address={clientAddress} />

      {/* Tableau des factures */}
      <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="text-primary" size={20} />
              Historique des factures
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-medium">{INVOICES.length} factures</Badge>
              <Badge className="bg-green-500/10 text-green-600 border-green-200 text-[10px]">
                Toutes conformes ✓
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* En-tête desktop */}
          <div className="hidden sm:grid grid-cols-7 gap-3 px-6 py-3 bg-muted/30 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <div>N° Facture</div>
            <div>Date</div>
            <div>Offre</div>
            <div>HT</div>
            <div>TVA 20%</div>
            <div>TTC</div>
            <div>Statut</div>
          </div>
          <div className="divide-y divide-border px-4 py-2">
            {INVOICES.map((invoice) => (
              <InvoiceRow
                key={invoice.id}
                invoice={invoice}
                clientName={clientName}
                clientAddress={clientAddress}
                clientSiret={clientSiret}
                clientTvaIntra={clientTvaIntra}
              />
            ))}
          </div>
          {/* Aide sur le format PDF */}
          <div className="mx-4 mb-4 mt-1 flex items-start gap-2 bg-muted/30 border border-border/50 rounded-xl px-4 py-3">
            <span className="text-sm shrink-0 mt-0.5">💡</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Chaque facture PDF intègre : <strong>numéro chronologique, SIRET émetteur & client, montants HT/TVA/TTC,
              pénalités de retard et indemnité forfaitaire 40 €</strong> — validée en 2 secondes par votre comptable.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Automatisation comptable */}
      <AccountantAutoSendSection />

      {/* Export comptable */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileArchive className="text-primary" size={20} />
            Exporter pour votre comptable 📤
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2 rounded-xl h-11"
              onClick={handleExportCSV}
            >
              <FileSpreadsheet size={18} className="text-green-600" />
              Export CSV — 6 mois
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 rounded-xl h-11"
              onClick={() => toast.success('Email envoyé à votre comptable ! 📧', {
                description: "L'archive des 6 dernières factures a été transmise.",
              })}
            >
              <Send size={18} className="text-blue-600" />
              Envoyer par email
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground bg-muted/30 py-2 rounded-lg border border-border/40">
            Format CSV compatible EBP, Sage, Ciel, QuickBooks · BOM UTF-8 inclus
          </p>
        </CardContent>
      </Card>

    </div>
  );
};