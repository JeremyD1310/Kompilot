/**
 * AuditReportView.tsx — Full report view: scores, keywords, gaps, competitors, opportunities, CTA
 */
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Search, Eye, Download, Copy, X, BarChart2,
} from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { type AuditReport, exportReportAsText } from './auditTypes';
import { AuditScoreRing, scoreColor, priorityStyle } from './AuditScoreRing';

interface AuditReportViewProps {
  report: AuditReport;
  onClose: () => void;
}

export function AuditReportView({ report, onClose }: AuditReportViewProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(exportReportAsText(report));
    toast.success('Rapport copié');
  };

  const handleDownload = () => {
    const blob = new Blob([exportReportAsText(report)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-flash-${report.businessName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Téléchargement démarré');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

      {/* Report header */}
      <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3 bg-muted/10 border-t border-border">
        <div>
          <p className="text-sm font-black text-foreground">{report.businessName} — {report.city}</p>
          <p className="text-xs text-muted-foreground">{report.sector} · Audit Flash Kompilot</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <Copy size={12} />Copier
          </button>
          <Button
            size="sm"
            onClick={handleDownload}
            className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white"
          >
            <Download size={12} /> Télécharger
          </Button>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Score rings */}
      <div className="px-5 py-5 border-t border-border">
        <div className="flex items-center gap-3 mb-5">
          <BarChart2 size={14} className="text-muted-foreground" />
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Scores de visibilité</p>
        </div>
        <div className="flex items-center justify-around flex-wrap gap-6">
          <AuditScoreRing score={report.globalScore} size={88} label="Global" />
          <AuditScoreRing score={report.googleScore} size={72} label="Google Maps" />
          <AuditScoreRing score={report.geoScore} size={72} label="G.E.O. (IA)" />
          <AuditScoreRing score={report.socialScore} size={72} label="Réseaux Sociaux" />
          <AuditScoreRing score={report.reputationScore} size={72} label="Réputation" />
        </div>

        {/* Estimated loss */}
        <div
          className="mt-5 rounded-xl border p-4 flex items-center gap-4 flex-wrap"
          style={{ background: 'rgba(239,68,68,.06)', borderColor: 'rgba(239,68,68,.2)' }}
        >
          <TrendingDown size={28} className="text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-0.5">Manque à gagner estimé par mois</p>
            <p className="text-3xl font-black text-red-400 tabular-nums">
              {report.estimatedLoss.toLocaleString('fr-FR')}€
              <span className="text-sm font-normal text-muted-foreground">/mois</span>
            </p>
          </div>
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-full border"
            style={{ background: 'rgba(239,68,68,.1)', borderColor: 'rgba(239,68,68,.3)', color: '#EF4444' }}
          >
            En clients perdus face aux concurrents
          </span>
        </div>
      </div>

      {/* Critical gaps */}
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={13} className="text-red-400" />
          <p className="text-xs font-bold text-foreground">Problèmes critiques ({report.criticalGaps.length})</p>
        </div>
        <div className="space-y-2">
          {report.criticalGaps.map((gap, i) => {
            const ps = priorityStyle(gap.priority);
            return (
              <div key={i} className="rounded-xl border p-3 space-y-1" style={{ background: ps.bg, borderColor: ps.border }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-foreground flex-1">{gap.issue}</p>
                  <span className="text-[9px] font-black shrink-0" style={{ color: ps.text }}>{ps.label}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{gap.impact}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Competitors */}
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <Eye size={13} className="text-muted-foreground" />
          <p className="text-xs font-bold text-foreground">Concurrents dominants</p>
        </div>
        <div className="space-y-2">
          {report.competitors.map((comp, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 bg-muted/20">
              <span className="text-[10px] font-black text-muted-foreground/60 shrink-0 w-4">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{comp.name}</p>
                <p className="text-[10px] text-muted-foreground">Domine sur : {comp.dominates}</p>
              </div>
              <span className="text-sm font-black shrink-0" style={{ color: scoreColor(comp.score) }}>{comp.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Keywords */}
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <Search size={13} className="text-muted-foreground" />
          <p className="text-xs font-bold text-foreground">Mots-clés analysés</p>
        </div>
        <div className="space-y-2">
          {report.topKeywords.map((kw, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 bg-muted/20">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{kw.keyword}</p>
                <p className="text-[10px] text-muted-foreground">{kw.volume.toLocaleString('fr-FR')} recherches/mois</p>
              </div>
              <div className="shrink-0 text-right">
                {kw.position
                  ? <span className="text-[11px] font-bold" style={{ color: kw.position <= 3 ? '#22C55E' : kw.position <= 10 ? '#F59E0B' : '#EF4444' }}>#{kw.position}</span>
                  : <span className="text-[10px] text-red-400 font-bold">Absent</span>
                }
              </div>
              {kw.opportunity && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 shrink-0">
                  OPPORT.
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Opportunities */}
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={13} className="text-green-400" />
          <p className="text-xs font-bold text-foreground">Plan d'action recommandé</p>
        </div>
        <div className="space-y-2">
          {report.opportunities.map((opp, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2">
              <CheckCircle2 size={13} className="text-green-500 shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">{opp}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA banner */}
      <div className="px-5 py-4 border-t border-border">
        <div
          className="rounded-xl overflow-hidden p-4 text-center space-y-3"
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)' }}
        >
          <p className="text-sm font-black text-white">{report.recommendation}</p>
          <p
            className="text-base font-black text-white py-2 px-4 rounded-lg inline-block cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            ✅ {report.cta}
          </p>
          <p className="text-[10px] text-white/60">
            Rapport généré par Kompilot Agency · Données simulées à des fins de démonstration
          </p>
        </div>
      </div>

    </motion.div>
  );
}
