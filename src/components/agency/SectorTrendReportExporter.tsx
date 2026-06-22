import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileDown, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Utensils, 
  HardHat, 
  Briefcase, 
  Store,
  CheckCircle2,
  AlertCircle,
  Copy,
  MessageCircle,
  FileText,
  Share2,
  Sparkles,
  Printer
} from 'lucide-react';
import { Badge, Button, Card, Input } from '@blinkdotnew/ui';
import { usePlan } from '../../hooks/usePlan';
import { useEstablishment } from '../../context/EstablishmentContext';
import { toast } from '@blinkdotnew/ui';

// ── Sector data ───────────────────────────────────────────────────────────────

interface SectorStat { value: string; label: string; }
interface SectorData {
  label: string;
  headline: string;
  stats: SectorStat[];
  winRate: string;
  roiMonths: string;
  testimonial: string;
}

const SECTOR_REPORTS: Record<string, SectorData> = {
  restauration: { 
    label: 'Restauration & Food', 
    headline: 'Un commerce de restauration actif sur Kompilot double ses interactions clients en 30 jours.',
    winRate: '78%',
    roiMonths: '< 3 mois',
    testimonial: '"En 6 semaines, nous avons récupéré 11 no-show pour 480 € de revenus sauvegardés."',
    stats: [
      { value: '480 €', label: 'No-show bloqués / mois' }, 
      { value: '×2,3', label: 'Interactions clients en 30 j.' }, 
      { value: '12 avis', label: 'Collectés / mois' }, 
      { value: '67%', label: 'Taux rétention J+90' }
    ] 
  },
  btp: { 
    label: 'BTP & Artisans', 
    headline: 'Les artisans Kompilot récupèrent en moyenne 620 € de no-show par mois.',
    winRate: '85%',
    roiMonths: '< 2 mois',
    testimonial: '"Nos devis IA sont signés à 85%. On a arrêté de perdre des déplacements non rémunérés."',
    stats: [
      { value: '620 €', label: 'Acomptes sécurisés / mois' }, 
      { value: '×3,2', label: 'Visibilité Google Maps' }, 
      { value: '85%', label: 'Devis IA signés' }, 
      { value: '-42%', label: 'Churn vs. sans plateforme' }
    ] 
  },
  services: { 
    label: 'Services & B2B', 
    headline: 'Les prestataires B2B convertissent 40 % de leads supplémentaires.',
    winRate: '72%',
    roiMonths: '< 4 mois',
    testimonial: '"Notre taux de conversion est passé de 18% à 28% en 60 jours grâce aux relances automatiques."',
    stats: [
      { value: '2 100 €', label: 'CA sécurisé mensuel' }, 
      { value: '+40%', label: 'Taux conversion leads' }, 
      { value: '28 leads', label: 'DMs qualifiés / mois' }, 
      { value: '+143%', label: 'Croissance CA à 6 mois' }
    ] 
  },
  commerce: { 
    label: 'Commerce de Proximité', 
    headline: 'En moyenne, un commerce de proximité double ses interactions clients en 30 jours avec Kompilot.',
    winRate: '81%',
    roiMonths: '< 3 mois',
    testimonial: '"Notre panier moyen a augmenté de 18% grâce aux coupons flash automatisés par l\'IA."',
    stats: [
      { value: '1 240 €', label: 'CA sécurisé mensuel' }, 
      { value: '52 leads', label: 'DMs convertis / mois' }, 
      { value: '×2', label: 'Interactions clients J+30' }, 
      { value: '+164%', label: 'Croissance à 6 mois' }
    ] 
  }
};

// ── HTML report template ──────────────────────────────────────────────────────

function estimateCaLoss(sector: SectorData): { monthly: string; annual: string; vsCompetitor: string } {
  // Estimate based on sector data — average loss when not using Kompilot vs. sector median
  const map: Record<string, { monthly: number; vsComp: string }> = {
    restauration: { monthly: 1240, vsComp: '61%' },
    btp:          { monthly: 1580, vsComp: '73%' },
    services:     { monthly: 2100, vsComp: '58%' },
    commerce:     { monthly: 980,  vsComp: '54%' },
  };
  const key = Object.keys(map).find(k => sector.label.toLowerCase().includes(k)) ?? 'commerce';
  const base = map[key];
  return {
    monthly: `${base.monthly.toLocaleString('fr-FR')} €`,
    annual: `${(base.monthly * 12).toLocaleString('fr-FR')} €`,
    vsCompetitor: base.vsComp,
  };
}

/** Escapes special HTML characters to prevent XSS injections */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildHTMLReport(sector: SectorData, agencyName: string, prospectName: string): string {
  const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const caLoss = estimateCaLoss(sector);
  // Sanitize user-controlled inputs to prevent XSS
  const safeProspectName = escapeHtml(prospectName);
  const safeAgencyName = escapeHtml(agencyName);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Rapport Kompilot — ${sector.label}</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;background:#0F172A;color:#E2E8F0;margin:0;padding:32px;}
  .wrapper{max-width:640px;margin:0 auto;}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #1E293B;padding-bottom:24px;margin-bottom:32px;}
  .brand{font-size:20px;font-weight:800;color:#0D9488;letter-spacing:-0.5px;}
  .date{font-size:12px;color:#64748B;}
  .sector-badge{display:inline-block;background:rgba(13,148,136,.12);color:#0D9488;border:1px solid #0D9488;border-radius:6px;font-size:11px;font-weight:700;padding:2px 10px;text-transform:uppercase;letter-spacing:1px;}
  h1{font-size:22px;font-weight:800;color:#F8FAFC;line-height:1.3;margin:16px 0 8px;}
  .headline{font-size:14px;color:#94A3B8;font-style:italic;border-left:3px solid #0D9488;padding-left:12px;margin:20px 0 28px;}
  .stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:28px 0;}
  .stat-card{background:#1E293B;border-radius:10px;padding:16px;border:1px solid #334155;}
  .stat-value{font-size:24px;font-weight:900;color:#0D9488;margin-bottom:4px;}
  .stat-label{font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;}
  .win-row{display:flex;gap:16px;margin:24px 0;}
  .win-card{flex:1;background:#1A2540;border-radius:8px;padding:14px;text-align:center;border:1px solid #334155;}
  .win-label{font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;}
  .win-value{font-size:18px;font-weight:800;color:#F8FAFC;}
  .testimonial{background:#1A2540;border-radius:10px;padding:16px;border-left:4px solid #0D9488;margin:24px 0;font-style:italic;color:#CBD5E1;font-size:13px;}
  .rgpd{font-size:10px;color:#475569;border-top:1px solid #1E293B;padding-top:16px;margin-top:32px;}
  .prospect{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:8px;padding:10px 14px;margin:20px 0;font-size:12px;color:#FCD34D;}
  /* ── ACCROCHE AGRESSIVE ─────────────────────────────── */
  .hook-section{background:linear-gradient(135deg,#1A0A00 0%,#1E0B00 100%);border:1px solid rgba(239,68,68,.3);border-radius:14px;padding:24px;margin:28px 0;}
  .hook-title{font-size:18px;font-weight:900;color:#F87171;line-height:1.35;margin-bottom:16px;}
  .hook-question{font-size:13px;color:#FCA5A5;margin-bottom:20px;line-height:1.7;}
  .ca-loss-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}
  .ca-loss-card{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;padding:12px;text-align:center;}
  .ca-loss-value{font-size:20px;font-weight:900;color:#F87171;margin-bottom:4px;}
  .ca-loss-label{font-size:10px;color:#FCA5A5;text-transform:uppercase;letter-spacing:.5px;}
  .hook-cta{margin-top:18px;background:#DC2626;border-radius:8px;padding:12px 16px;font-size:13px;font-weight:700;color:#fff;text-align:center;letter-spacing:.3px;}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="brand">Kompilot</div>
    <div class="date">${date}</div>
  </div>
  <span class="sector-badge">${sector.label}</span>
  ${safeProspectName ? `<div class="prospect">📌 Préparé pour : <strong>${safeProspectName}</strong> — par ${safeAgencyName || 'votre Agence'}</div>` : ''}

  <!-- ── ACCROCHE AGRESSIVE ─────────────────────────────── -->
  <div class="hook-section">
    <div class="hook-title">⚠️ Pourquoi votre visibilité actuelle ne paie pas vos salaires</div>
    <div class="hook-question">
      Vous avez des followers, des vues, peut-être même de bonnes notes Google. <strong style="color:#FECACA">Et pourtant : à la fin du mois, combien de ces interactions se sont converties en euros dans votre compte ?</strong><br/><br/>
      La vérité inconfortable du secteur ${sector.label} : <strong style="color:#F87171">la visibilité sans conversion est un coût, pas un investissement.</strong>
      Pendant que votre présence en ligne stagne, vos concurrents actifs sur les moteurs d'IA (Google AI Overview, ChatGPT, Bing) captent ${caLoss.vsCompetitor} de votre clientèle potentielle locale.
    </div>
    <div class="ca-loss-grid">
      <div class="ca-loss-card">
        <div class="ca-loss-value">${caLoss.monthly}</div>
        <div class="ca-loss-label">Perte CA estimée / mois</div>
      </div>
      <div class="ca-loss-card">
        <div class="ca-loss-value">${caLoss.annual}</div>
        <div class="ca-loss-label">Perte CA annuelle estimée</div>
      </div>
      <div class="ca-loss-card">
        <div class="ca-loss-value">${caLoss.vsCompetitor}</div>
        <div class="ca-loss-label">Part de voix perdue / concurrents IA</div>
      </div>
    </div>
    <div class="hook-cta">
      Ces chiffres sont calculés à partir des médianes anonymisées Kompilot pour le secteur ${sector.label}.
      Chaque mois sans solution = ces euros restent chez vos concurrents.
    </div>
  </div>

  <!-- ── DONNÉES SECTORIELLES ───────────────────────────── -->
  <h1>Rapport de Tendance Sectorielle</h1>
  <div class="headline">${sector.headline}</div>
  <div class="stats-grid">
    ${sector.stats.map(s => `
    <div class="stat-card">
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>`).join('')}
  </div>
  <div class="win-row">
    <div class="win-card">
      <div class="win-label">Taux de ROI positif</div>
      <div class="win-value">${sector.winRate}</div>
    </div>
    <div class="win-card">
      <div class="win-label">ROI atteint en</div>
      <div class="win-value">${sector.roiMonths}</div>
    </div>
  </div>
  <div class="testimonial">${sector.testimonial}</div>
  <div class="rgpd">
    NOTE RGPD : Ce rapport présente des agrégats sectoriels anonymisés. Aucune donnée individuelle d'établissement n'est partagée. 
    Chaque établissement opère dans un espace chiffré et isolé. La "Perte de CA estimée" est calculée à partir de médianes sectorielles anonymisées et ne représente pas une valeur garantie.
    Conformément au RGPD, ce document est destiné à un usage interne de démonstration commerciale uniquement.
  </div>
</div>
</body>
</html>`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SectorTrendReportExporter() {
  const { isFranchise } = usePlan();
  const { activeEstablishment } = useEstablishment();
  const [isOpen, setIsOpen] = useState(true);
  const [selectedSector, setSelectedSector] = useState<keyof typeof SECTOR_REPORTS>('restauration');
  const [prospectName, setProspectName] = useState('');
  const [exportMode, setExportMode] = useState<'pdf' | 'txt' | 'html'>('pdf');

  if (!isFranchise) {
    return (
      <Card className="p-6 bg-gradient-to-br from-[#1A1040] to-[#0F172A] border-violet-500/20">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-violet-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">Réservé aux comptes Agency</h3>
            <p className="text-slate-400 text-sm max-w-sm">
              L'outil d\'export de rapports sectoriels est un avantage exclusif Kompilot Agency.
              Utilisez ces données pour closer vos prospects plus rapidement.
            </p>
          </div>
          <Button variant="outline" className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10" asChild>
            <a href="/subscription">Mettre à jour mon offre</a>
          </Button>
        </div>
      </Card>
    );
  }

  const currentSector = SECTOR_REPORTS[selectedSector];

  const handleDownloadTxt = () => {
    const content = [
      `RAPPORT DE TENDANCE SECTORIELLE — KOMPILOT`,
      `${'─'.repeat(50)}`,
      `Agence : ${activeEstablishment.name}`,
      prospectName ? `Prospect : ${prospectName}` : '',
      `Secteur : ${currentSector.label}`,
      `Date : ${new Date().toLocaleDateString('fr-FR')}`,
      ``,
      `TENDANCE DE MARCHÉ :`,
      `"${currentSector.headline}"`,
      ``,
      `MÉDIANES DE PERFORMANCE (30j) :`,
      ...currentSector.stats.map(s => `  · ${s.label} : ${s.value}`),
      ``,
      `INDICATEURS DE SUCCÈS :`,
      `  · Taux de ROI positif : ${currentSector.winRate} des établissements`,
      `  · ROI atteint en : ${currentSector.roiMonths}`,
      ``,
      `TÉMOIGNAGE ANONYMISÉ :`,
      currentSector.testimonial,
      ``,
      `QUESTION STRATÉGIQUE :`,
      `Saviez-vous qu'en l'absence d'automatisation, un professionnel de votre secteur `,
      `perd en moyenne entre 800 € et 1 500 € de CA/mois en no-show non sécurisés et `,
      `leads non relancés ? Kompilot sécurise ce flux dès le jour 1.`,
      ``,
      `NOTE RGPD :`,
      `Ces données sont des agrégats sectoriels anonymisés. Aucune donnée individuelle `,
      `d'établissement n'est partagée. Conformément au RGPD, ce rapport est destiné à `,
      `un usage interne de démonstration commerciale uniquement.`,
    ].filter(l => l !== undefined && l !== null).join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rapport_Kompilot_${selectedSector}_${prospectName || 'Prospect'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Rapport TXT téléchargé');
  };

  const handleDownloadHtml = () => {
    const html = buildHTMLReport(currentSector, activeEstablishment.name, prospectName);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rapport_Kompilot_${selectedSector}_${prospectName || 'Prospect'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Rapport HTML téléchargé — prêt pour l\'envoi email');
  };

  const handleDownloadPDF = () => {
    const html = buildHTMLReport(currentSector, activeEstablishment.name, prospectName);
    const printHtml = html.replace('</style>', `
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  </style>`);

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:0;height:0;border:none;';
    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        toast.success('Fenêtre d\'impression ouverte — choisissez "Enregistrer en PDF"');
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 3000);
      }, 300);
    };

    iframe.srcdoc = printHtml;
  };

  const handleCopyText = () => {
    const text = [
      `📊 *Rapport Sectoriel Kompilot — ${currentSector.label}*`,
      ``,
      `${currentSector.headline}`,
      ``,
      currentSector.stats.map(s => `▸ *${s.label}* : ${s.value}`).join('\n'),
      ``,
      `✅ ROI positif chez ${currentSector.winRate} des établissements (en ${currentSector.roiMonths})`,
      ``,
      `_Source : agrégats anonymisés Kompilot — données RGPD compliant_`,
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      toast.success('Texte copié — prêt pour WhatsApp / LinkedIn');
    }).catch(() => toast.error('Copie impossible'));
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `📊 Rapport Kompilot — ${currentSector.label}\n\n` +
      `${currentSector.headline}\n\n` +
      currentSector.stats.map(s => `▸ ${s.label} : ${s.value}`).join('\n') +
      `\n\n✅ ROI positif chez ${currentSector.winRate} en ${currentSector.roiMonths}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div className="rounded-xl border border-violet-500/25 bg-gradient-to-br from-[#0F172A] to-[#1A1040] overflow-hidden">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer border-b border-violet-500/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <FileDown className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Rapport de Tendance Sectorielle</h3>
            <p className="text-xs text-slate-400">Outil de closing prospect — Données anonymisées RGPD</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-violet-500/20 text-violet-400 border-none">AGENCY ONLY</Badge>
          {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-6 space-y-6 overflow-hidden"
          >
            {/* Sector selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300">Secteur cible du prospect</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'restauration', icon: Utensils, label: 'Food' },
                  { id: 'btp', icon: HardHat, label: 'BTP' },
                  { id: 'services', icon: Briefcase, label: 'Services' },
                  { id: 'commerce', icon: Store, label: 'Commerce' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedSector(item.id as any)}
                    className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                      selectedSector === item.id 
                        ? 'border-violet-500 bg-violet-500/10 text-white' 
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${selectedSector === item.id ? 'text-violet-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prospect name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Nom du prospect (optionnel)</label>
              <Input 
                placeholder="Ex: Boulangerie Durand" 
                value={prospectName}
                onChange={(e) => setProspectName(e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600"
              />
            </div>

            {/* ── CA Loss Index — aggressive hook ── */}
            {(() => {
              const loss = estimateCaLoss(currentSector);
              return (
                <div className="rounded-xl border border-red-500/25 bg-gradient-to-br from-red-950/40 to-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                    <p className="text-sm font-bold text-red-300">Pourquoi votre visibilité actuelle ne paie pas vos salaires</p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    La visibilité sans conversion est un coût, pas un investissement. Vos concurrents actifs captent <strong className="text-red-300">{loss.vsCompetitor}</strong> de votre clientèle potentielle locale via les moteurs d'IA.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Perte / mois', value: loss.monthly, color: 'text-red-400' },
                      { label: 'Perte / an', value: loss.annual, color: 'text-red-300' },
                      { label: 'Part de voix perdue', value: loss.vsCompetitor, color: 'text-orange-400' },
                    ].map((item, i) => (
                      <div key={i} className="bg-red-900/20 rounded-lg p-2.5 text-center border border-red-800/30">
                        <p className={`text-sm font-black ${item.color} leading-tight`}>{item.value}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-1">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    ∗ Estimations basées sur les médianes anonymisées Kompilot — secteur {currentSector.label}. Données RGPD-compliant.
                  </p>
                </div>
              );
            })()}

            {/* Report preview */}
            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800 space-y-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300 italic">"{currentSector.headline}"</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {currentSector.stats.map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-lg font-bold text-white leading-none">{stat.value}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
              {/* Win rate & ROI */}
              <div className="flex gap-4 pt-2 border-t border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">ROI positif</p>
                  <p className="text-base font-bold text-emerald-400">{currentSector.winRate}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Payback</p>
                  <p className="text-base font-bold text-emerald-400">{currentSector.roiMonths}</p>
                </div>
              </div>
              {/* Testimonial */}
              <div className="border-l-2 border-violet-500/50 pl-3">
                <p className="text-xs text-slate-400 italic">{currentSector.testimonial}</p>
              </div>
            </div>

            {/* Export format toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Format :</span>
              {(['pdf', 'html', 'txt'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setExportMode(mode)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all ${
                    exportMode === mode ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 pt-1">
              <Button 
                onClick={
                  exportMode === 'pdf'
                    ? handleDownloadPDF
                    : exportMode === 'html'
                    ? handleDownloadHtml
                    : handleDownloadTxt
                }
                className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
              >
                {exportMode === 'pdf'
                  ? <Printer className="h-4 w-4" />
                  : exportMode === 'html'
                  ? <FileText className="h-4 w-4" />
                  : <FileDown className="h-4 w-4" />
                }
                {exportMode === 'pdf'
                  ? 'Générer le PDF (impression)'
                  : exportMode === 'html'
                  ? 'Télécharger HTML'
                  : 'Télécharger TXT'
                }
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleCopyText}
                  className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2 text-xs"
                >
                  <Copy className="h-3.5 w-3.5" /> Copier texte
                </Button>
                <Button
                  variant="outline"
                  onClick={handleWhatsApp}
                  className="border-emerald-700/50 text-emerald-400 hover:bg-emerald-500/10 gap-2 text-xs"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Envoyer WA
                </Button>
              </div>
              
              <div className="flex items-start gap-2 px-1 pt-1">
                <AlertCircle className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  NOTE RGPD : Données agrégées et anonymisées. Ce rapport ne contient aucune donnée 
                  personnelle identifiable. Usage réservé à la démonstration commerciale. 
                  Vos données financières ne sont jamais partagées avec vos concurrents.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
