/**
 * ClientExportModal — Generate white-label PDF / public link report for clients.
 *
 * Features:
 * - Agency name branding (no Kompilot logo in output)
 * - One-click public shareable link (7-day validity)
 * - PDF download of the report
 * - Preview of competitor movement summary + recommendations
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@blinkdotnew/ui';
import {
  X, FileDown, Link, Check, Copy, Building2, Sparkles,
  ExternalLink, Clock, Eye, ChevronRight, Loader2,
} from 'lucide-react';
import { blink } from '../../blink/client';
import { apiFetch } from '../../config/api';
import type { FunnelData } from './types';

interface ClientExportModalProps {
  funnel: FunnelData;
  onClose: () => void;
}

interface ExportResult {
  success: boolean;
  reportToken: string;
  publicUrl: string;
  expiresAt: string;
  summaryData: {
    creatorName: string;
    domainUrl: string;
    platform: string;
    estimatedSpend: number;
    performanceScore: number;
    ghostEmailCount: number;
    analysis: {
      metrics?: { totalActiveAds: number; winningAdsCount: number; estimatedPerformanceScore: number };
      techStack?: string[];
    };
    generatedAt: string;
  };
}

export function ClientExportModal({ funnel, onClose }: ClientExportModalProps) {
  const [agencyName, setAgencyName]   = useState('');
  const [title, setTitle]             = useState(`Rapport Concurrentiel — ${funnel.creator_name}`);
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<ExportResult | null>(null);
  const [copiedUrl, setCopiedUrl]     = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const token = await blink.auth.getValidToken();
      const data = await apiFetch<ExportResult>(
        `/api/funnels/${funnel.id}/export`,
        {
          method: 'POST',
          token,
          timeoutMs: 15_000,
          body: JSON.stringify({
            agencyName: agencyName.trim() || undefined,
            title: title.trim() || undefined,
          }),
        },
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération du rapport.');
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    if (!result) return;
    navigator.clipboard.writeText(result.publicUrl).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    });
  }

  async function downloadPDF() {
    if (!result) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const sd = result.summaryData;
    const agName = agencyName.trim() || 'Votre Agence';
    const W = 210;
    const margin = 20;

    // Header band
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, W, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(agName, margin, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(title, margin, 27);

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text(`Généré le ${new Date(sd.generatedAt).toLocaleDateString('fr-FR')} · Confidentiel`, margin, 35);

    // Competitor block
    let y = 55;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Concurrent analysé', margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Nom : ${sd.creatorName}`, margin, y); y += 6;
    doc.text(`Domaine : ${sd.domainUrl}`, margin, y); y += 6;
    doc.text(`Plateforme : ${sd.platform}`, margin, y); y += 6;
    doc.text(`Budget estimé : ${sd.estimatedSpend.toLocaleString('fr-FR')} €/mois`, margin, y); y += 6;
    doc.text(`Score de performance : ${sd.performanceScore}/100`, margin, y); y += 6;
    doc.text(`Emails séquence capturés : ${sd.ghostEmailCount}`, margin, y); y += 12;

    // Ad metrics
    if (sd.analysis?.metrics) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Activité publicitaire', margin, y); y += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Publicités actives : ${sd.analysis.metrics.totalActiveAds}`, margin, y); y += 6;
      doc.text(`Publicités rentables (21j+) : ${sd.analysis.metrics.winningAdsCount}`, margin, y); y += 6;
      doc.text(`Score de performance estimé : ${sd.analysis.metrics.estimatedPerformanceScore}/100`, margin, y); y += 12;
    }

    // Tech stack
    if (sd.analysis?.techStack && sd.analysis.techStack.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Stack technologique détectée', margin, y); y += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(sd.analysis.techStack.join('  ·  '), margin, y, { maxWidth: W - margin * 2 }); y += 12;
    }

    // Recommendations
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Recommandations stratégiques', margin, y); y += 8;

    const recs = [
      `Analysez les ${sd.analysis?.metrics?.winningAdsCount ?? 0} publicités rentables du concurrent pour identifier les hooks gagnants.`,
      `Utilisez l'adresse de tracking pour capturer la séquence email et adapter votre propre nurturing.`,
      `Comparez votre score de performance (via Persona Simulator) aux ${sd.performanceScore}/100 du concurrent.`,
      `Ciblez les mêmes mots-clés SEO organiques que votre concurrent pour capter leur trafic.`,
    ];

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    for (const rec of recs) {
      doc.text(`• ${rec}`, margin, y, { maxWidth: W - margin * 2 });
      y += 8;
    }

    // Footer
    doc.setFillColor(241, 245, 249);
    doc.rect(0, 275, W, 22, 'F');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`${agName} · Rapport confidentiel · Ne pas distribuer`, margin, 284);
    doc.text(`Lien web : ${result.publicUrl}`, margin, 290);

    const filename = `rapport-concurrent-${sd.creatorName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    doc.save(filename);
  }

  const expiryDate = result
    ? new Date(result.expiresAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileDown size={17} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Export Client</h2>
              <p className="text-[11px] text-muted-foreground">Rapport marque blanche — {funnel.creator_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-4">
                {/* Customization */}
                <div className="rounded-xl bg-muted/40 border border-border p-4 space-y-3">
                  <p className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={11} className="text-primary" /> Personnalisation marque blanche
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground">Nom de votre agence</label>
                    <input
                      value={agencyName}
                      onChange={e => setAgencyName(e.target.value)}
                      placeholder="Ex: Growth Strategies SAS"
                      className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors placeholder:text-muted-foreground/50"
                    />
                    <p className="text-[10px] text-muted-foreground">Apparaîtra à la place du logo Kompilot</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground">Titre du rapport</label>
                    <input
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors"
                    />
                  </div>
                </div>

                {/* What's included */}
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3.5 space-y-2">
                  <p className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={10} /> Contenu du rapport
                  </p>
                  {[
                    'Mouvements concurrents de la semaine',
                    'Publicités actives + publicités rentables (21j+)',
                    'Stack technologique détectée',
                    'Séquence email capturée (nombre)',
                    'Recommandations stratégiques personnalisées',
                    'Score de performance du concurrent',
                  ].map(item => (
                    <div key={item} className="flex items-start gap-2">
                      <Check size={10} className="text-primary mt-0.5 shrink-0" />
                      <p className="text-[11px] text-foreground">{item}</p>
                    </div>
                  ))}
                </div>

                {/* Info */}
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-muted/60 text-[10px] text-muted-foreground">
                  <Clock size={10} className="shrink-0 mt-0.5" />
                  Le lien public est valide 7 jours et peut être partagé sans connexion. Le PDF est téléchargeable après génération.
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all"
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Génération en cours…</>
                    : <><FileDown size={15} /> Générer le rapport <ChevronRight size={14} /></>}
                </button>
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 space-y-4">
                {/* Success badge */}
                <div className="flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/60 p-3.5">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                    <Check size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">Rapport généré !</p>
                    <p className="text-[11px] text-green-600 dark:text-green-500">Valide jusqu'au {expiryDate}</p>
                  </div>
                </div>

                {/* Public link */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">🔗 Lien public marque blanche</p>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/60 border border-border px-3 py-2">
                    <span className="flex-1 text-[10px] font-mono text-foreground truncate">{result.publicUrl}</span>
                    <button
                      onClick={copyLink}
                      className={cn(
                        'shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all',
                        copiedUrl
                          ? 'bg-green-100 text-green-600'
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      )}
                    >
                      {copiedUrl ? <Check size={10} /> : <Copy size={10} />}
                      {copiedUrl ? 'Copié !' : 'Copier'}
                    </button>
                    <a
                      href={result.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                {/* Summary preview */}
                <div className="rounded-xl border border-border p-3.5 space-y-2.5">
                  <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">Contenu du rapport</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Publicités actives', value: result.summaryData.analysis?.metrics?.totalActiveAds ?? 0 },
                      { label: 'Pubs rentables', value: result.summaryData.analysis?.metrics?.winningAdsCount ?? 0 },
                      { label: 'Score concurrent', value: `${result.summaryData.performanceScore}/100` },
                      { label: 'Emails capturés', value: result.summaryData.ghostEmailCount },
                    ].map(item => (
                      <div key={item.label} className="rounded-lg bg-muted/40 p-2.5 text-center">
                        <p className="text-[13px] font-black text-foreground">{item.value}</p>
                        <p className="text-[9px] text-muted-foreground">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  {result.summaryData.analysis?.techStack && result.summaryData.analysis.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {result.summaryData.analysis.techStack.map(tech => (
                        <span key={tech} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{tech}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={downloadPDF}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all"
                  >
                    <FileDown size={14} /> Télécharger PDF
                  </button>
                  <button
                    onClick={() => { setResult(null); setError(null); }}
                    className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
                  >
                    Nouveau
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1">
                  <Eye size={9} />
                  Le rapport ne contient aucune mention de Kompilot.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
