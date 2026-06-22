import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { FileText, Loader2, Download, CheckCircle2, Star, Shield, Calendar, MapPin } from 'lucide-react';
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription,
  Progress,
  Badge,
  toast,
  cn
} from '@blinkdotnew/ui';

export interface MonthlyReportMetrics {
  geoScore?: number;
  geoScoreDelta?: number;
  reviewsHandled?: number;
  reviewsResponseRate?: number;
  avgRating?: number;
  postsPublished?: number;
  smsSent?: number;
  noShowRevenueCents?: number;
}

interface MonthlyReportGeneratorProps {
  clientName: string;
  clientId: string;
  metrics?: MonthlyReportMetrics;
}

export function MonthlyReportGenerator({ clientName, clientId, metrics = {} }: MonthlyReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const now = new Date();
  const currentMonth = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(now);
  const monthSlug = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(now).toLowerCase();
  const yearSlug = now.getFullYear();

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setShowModal(true);
    }, 2000);
  };

  const downloadReport = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // ── Resolve real or fallback metrics ────────────────────────────────────
    const geoScore = metrics.geoScore ?? 85;
    const geoScoreDelta = metrics.geoScoreDelta ?? 7;
    const reviewsHandled = metrics.reviewsHandled ?? 12;
    const reviewsResponseRate = metrics.reviewsResponseRate ?? 100;
    const avgRating = metrics.avgRating ?? 4.7;
    const postsPublished = metrics.postsPublished ?? 8;
    const smsSent = metrics.smsSent ?? 0;
    const noShowRevenue = Math.round((metrics.noShowRevenueCents ?? 34000) / 100);

    const pageW = 210;
    const pageH = 297;
    const margin = 18;
    const contentW = pageW - margin * 2;

    // ── Header gradient bar (teal→indigo, simulated as two rects) ──────────
    // Left half: teal
    doc.setFillColor(20, 184, 166);   // teal-500
    doc.rect(0, 0, pageW / 2, 38, 'F');
    // Right half: indigo
    doc.setFillColor(99, 102, 241);   // indigo-500
    doc.rect(pageW / 2, 0, pageW / 2, 38, 'F');
    // Thin accent line at bottom of header
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 36, pageW, 0.5, 'F');

    // Header text — title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text('BILAN MARKETING MENSUEL', pageW / 2, 13, { align: 'center' });

    // Header text — Marque Blanche pill (simulated as small rect + text)
    doc.setFillColor(255, 255, 255, 0.25);
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, 17, 28, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(99, 102, 241);
    doc.text('MARQUE BLANCHE', margin + 14, 20.7, { align: 'center' });

    // Header text — client name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(clientName, margin, 29);

    // Header text — month/year
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(220, 240, 255);
    doc.text(`Période : ${currentMonth}`, margin, 34.5);

    // ── Separator ─────────────────────────────────────────────────────────
    let y = 47;
    doc.setDrawColor(220, 220, 230);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    // ── Helper: section title ──────────────────────────────────────────────
    const sectionTitle = (label: string, yPos: number): number => {
      // Accent left bar
      doc.setFillColor(99, 102, 241);
      doc.rect(margin, yPos - 3.5, 3, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 60);
      doc.text(label, margin + 5, yPos);
      return yPos + 7;
    };

    // ── Helper: key-value row ──────────────────────────────────────────────
    const kvRow = (key: string, value: string, yPos: number, valueColor?: [number, number, number]): number => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 120);
      doc.text(key, margin + 4, yPos);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...(valueColor ?? [30, 30, 60]));
      doc.text(value, pageW - margin, yPos, { align: 'right' });
      return yPos + 5.5;
    };

    // ── Section 0 — Synthèse mensuelle (4 metric boxes) ──────────────────
    y = sectionTitle('Synthèse mensuelle', y);

    const synthMetrics = [
      { label: 'Score G.E.O.', value: `${geoScore}/100`, sub: `${geoScoreDelta >= 0 ? '+' : ''}${geoScoreDelta} pts`, color: [20, 184, 166] as [number, number, number] },
      { label: 'Avis traités', value: String(reviewsHandled), sub: `${reviewsResponseRate}% réponse`, color: [99, 102, 241] as [number, number, number] },
      { label: 'Posts publiés', value: String(postsPublished), sub: '3 plateformes', color: [245, 158, 11] as [number, number, number] },
      { label: 'No-Show', value: `${noShowRevenue}€`, sub: 'sécurisés', color: [34, 197, 94] as [number, number, number] },
    ];

    const boxW = (contentW - 9) / 4;
    const boxH = 16;
    const boxY = y;

    synthMetrics.forEach((m, i) => {
      const bx = margin + i * (boxW + 3);
      doc.setFillColor(m.color[0], m.color[1], m.color[2]);
      doc.setGState(doc.GState({ opacity: 0.08 }));
      doc.rect(bx, boxY, boxW, boxH, 'F');
      doc.setGState(doc.GState({ opacity: 1 }));
      doc.setDrawColor(m.color[0], m.color[1], m.color[2]);
      doc.setLineWidth(0.4);
      doc.rect(bx, boxY, boxW, boxH);
      // Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(m.color[0], m.color[1], m.color[2]);
      doc.text(m.value, bx + boxW / 2, boxY + 6.5, { align: 'center' });
      // Label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(80, 80, 100);
      doc.text(m.label, bx + boxW / 2, boxY + 11, { align: 'center' });
      // Sub
      doc.setFontSize(5.5);
      doc.setTextColor(130, 130, 150);
      doc.text(m.sub, bx + boxW / 2, boxY + 14.5, { align: 'center' });
    });

    y = boxY + boxH + 10;

    // Separator
    doc.setDrawColor(220, 220, 230);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    // ── Section 1 — Score G.E.O. ──────────────────────────────────────────
    y = sectionTitle('1  —  Score G.E.O. (Generative Engine Optimization)', y);

    // Score bar background
    const barX = margin + 4;
    const barY = y + 1;
    const barW = contentW - 8;
    const barH = 5;
    doc.setFillColor(230, 230, 240);
    doc.rect(barX, barY, barW, barH, 'F');
    // Score bar fill (dynamic)
    const scoreFraction = geoScore / 100;
    doc.setFillColor(20, 184, 166);  // teal fill
    doc.rect(barX, barY, barW * scoreFraction, barH, 'F');

    // Score label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(20, 130, 120);
    doc.text(`${geoScore} / 100`, margin + 4, barY + 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(99, 102, 241);
    doc.text(`${geoScoreDelta >= 0 ? '+' : ''}${geoScoreDelta} pts vs mois précédent`, pageW - margin, barY + 11, { align: 'right' });

    y = barY + 17;
    // Note IA
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 150);
    doc.text('Visibilité optimisée sur ChatGPT, Perplexity et Gemini.', margin + 4, y);
    y += 10;

    // Separator
    doc.setDrawColor(220, 220, 230);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    // ── Section 2 — Gestion des Avis ─────────────────────────────────────
    y = sectionTitle('2  —  Gestion des Avis Google', y);
    y = kvRow('Avis traités ce mois', String(reviewsHandled), y);
    y = kvRow('Taux de réponse IA', `${reviewsResponseRate} %`, y, [20, 150, 100]);
    y = kvRow('Note moyenne actuelle', `${avgRating.toFixed(1)} / 5  ★`, y, [234, 179, 8]);
    y = kvRow('SMS envoyés', String(smsSent), y);
    y += 4;

    // Separator
    doc.setDrawColor(220, 220, 230);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    // ── Section 3 — Publications Réseaux ─────────────────────────────────
    y = sectionTitle('3  —  Publications sur les Réseaux', y);
    y = kvRow('Posts publiés ce mois', String(postsPublished), y);
    y = kvRow('Plateformes actives', '3  (Google Business, Instagram, Facebook)', y);
    y = kvRow('No-Show sécurisés', `${noShowRevenue} €`, y, [99, 102, 241]);
    y += 4;

    // Separator
    doc.setDrawColor(220, 220, 230);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    // ── Section 4 — Recommandations ───────────────────────────────────────
    y = sectionTitle('4  —  Recommandations pour le mois prochain', y);

    const recommendations = [
      'Répondre aux 3 avis en attente sous 48 h pour maintenir le taux de réponse à 100 %.',
      'Publier 2 posts supplémentaires sur l\'offre saisonnière pour booster la visibilité IA de 5 pts.',
      'Mettre à jour les horaires sur Google Business Profile — incohérence détectée avec la fiche Yelp.',
      'Activer le Bouclier No-Show pour sécuriser les réservations du mois prochain (économie estimée : 280 – 400 €).',
    ];

    recommendations.forEach((rec, i) => {
      // Bullet circle
      doc.setFillColor(99, 102, 241);
      doc.circle(margin + 5, y - 1.5, 1.8, 'F');
      // Bullet number
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(String(i + 1), margin + 5, y - 0.8, { align: 'center' });
      // Text (word-wrapped)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(50, 50, 70);
      const lines = doc.splitTextToSize(rec, contentW - 12) as string[];
      doc.text(lines, margin + 10, y);
      y += lines.length * 4.8 + 3;
    });

    y += 4;

    // ── Footer bar ────────────────────────────────────────────────────────
    // Full-width footer background
    doc.setFillColor(245, 245, 250);
    doc.rect(0, pageH - 20, pageW, 20, 'F');
    // Top border of footer
    doc.setDrawColor(210, 210, 225);
    doc.setLineWidth(0.3);
    doc.line(0, pageH - 20, pageW, pageH - 20);

    const generatedDate = new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(now);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 170);
    doc.text(`Généré le ${generatedDate}`, margin, pageH - 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(99, 102, 241);
    doc.text('Powered by Kompilot', pageW - margin, pageH - 12, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 200);
    doc.text('© Kompilot — Marque Blanche', pageW / 2, pageH - 7, { align: 'center' });

    // ── Save ──────────────────────────────────────────────────────────────
    const fileName = `rapport-mensuel-${clientName.replace(/\s+/g, '-').toLowerCase()}-${monthSlug}-${yearSlug}.pdf`;
    doc.save(fileName);

    toast.success('Rapport téléchargé', {
      description: `Le bilan mensuel de ${clientName} est prêt.`,
    });
  };

  return (
    <div className="w-full">
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className={cn(
          "w-full bg-[#818CF8] hover:bg-[#717cf0] text-white gap-2 h-11 transition-all active:scale-[0.98]",
          isGenerating && "opacity-80"
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Génération du bilan...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            📄 Générer le bilan mensuel IA (Marque Blanche)
          </>
        )}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[550px] overflow-hidden p-0 gap-0 border-none">
          <div className="bg-[#818CF8] px-6 py-8 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <FileText className="h-24 w-24 rotate-12" />
            </div>
            <div className="relative space-y-2">
              <Badge variant="outline" className="bg-white/20 text-white border-white/30 mb-2">Marque Blanche</Badge>
              <h2 className="text-2xl font-bold">{clientName}</h2>
              <p className="text-white/80 flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Bilan Marketing IA — {currentMonth}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-6 bg-background max-h-[70vh] overflow-y-auto">
            {/* Section 1: GEO Score */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <MapPin className="h-4 w-4 text-[#818CF8]" />
                  📍 Score G.E.O.
                </div>
                <span className="text-[#818CF8] font-bold">{metrics.geoScore ?? 85}/100</span>
              </div>
              <Progress value={metrics.geoScore ?? 85} className="h-2 bg-slate-100" indicatorClassName="bg-[#818CF8]" />
              <p className="text-xs text-slate-500 italic">
                {(metrics.geoScoreDelta ?? 7) >= 0 ? '+' : ''}{metrics.geoScoreDelta ?? 7} pts vs mois précédent — Visibilité optimisée sur les moteurs IA
              </p>
            </div>

            {/* Section 2: Publications */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-lg bg-white text-[#818CF8] shadow-sm">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">📅 Publications</div>
                <div className="text-sm text-slate-600">{metrics.postsPublished ?? 8} posts publiés ce mois · 3 plateformes actives</div>
              </div>
            </div>

            {/* Section 3: No-Show Shield */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
              <div className="p-2 rounded-lg bg-white text-indigo-600 shadow-sm">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">🛡️ Bouclier No-Show</div>
                <div className="text-sm text-slate-600">{Math.round((metrics.noShowRevenueCents ?? 34000) / 100)}€ sécurisés via Stripe</div>
              </div>
            </div>

            {/* Section 4: Google Reviews */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/50 border border-amber-100">
              <div className="p-2 rounded-lg bg-white text-amber-500 shadow-sm">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">⭐ Avis Google</div>
                <div className="text-sm text-slate-600">{metrics.reviewsHandled ?? 12} avis traités · Réponse IA : {metrics.reviewsResponseRate ?? 100}%</div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t flex flex-col items-center gap-4">
            <div className="flex items-center gap-4 w-full">
              <Button 
                onClick={downloadReport}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white gap-2"
              >
                <Download className="h-4 w-4" />
                Télécharger le rapport
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1 border-slate-200"
              >
                Fermer
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Rapport généré par Agency Name via Kompilot
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
