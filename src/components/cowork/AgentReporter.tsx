/**
 * AgentReporter — Advanced Account Manager & Auto-Reporter panel.
 *
 * Features:
 * - Client name + period input
 * - Real AI report generation via blink.ai.streamText
 * - Structured sections: KPIs, actions performed, ROI, recommendations
 * - Printable/copyable report with section-level copy buttons
 * - "Download PDF" simulation (copies markdown to clipboard)
 */
import { useState, useCallback } from 'react';
import {
  FileText, LineChart, Loader2, CheckCircle2, Copy,
  RefreshCw, Download, ChevronUp, Printer, Star, BarChart2,
} from 'lucide-react';
import { cn, toast } from '@blinkdotnew/ui';
import { useOnboardingProfile } from '../../hooks/useOnboardingProfile';
import { type AgentQuota } from '../../hooks/useAgentQuota';
import { useAgentSprint } from '../../hooks/useAgentSprint';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReportSection {
  title: string;
  icon: string;
  content: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseReportSections(raw: string): ReportSection[] {
  const sections: ReportSection[] = [];
  const headings = ['RÉSUMÉ EXÉCUTIF', 'KPIS DU MOIS', 'ACTIONS RÉALISÉES', 'ANALYSE ROI', 'RECOMMANDATIONS'];
  const icons = ['📋', '📊', '✅', '💰', '🚀'];

  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    const next = headings[i + 1];
    const regex = next
      ? new RegExp(`###[^#]*${h}[^#]*\\n([\\s\\S]*?)(?=###[^#]*${next})`, 'i')
      : new RegExp(`###[^#]*${h}[^#]*\\n([\\s\\S]*?)$`, 'i');
    const match = raw.match(regex);
    if (match?.[1]?.trim()) {
      sections.push({ title: h.charAt(0) + h.slice(1).toLowerCase().replace('kpis', 'KPIs').replace('roi', 'ROI'), icon: icons[i], content: match[1].trim() });
    }
  }

  // Fallback: split by ### headings
  if (sections.length === 0) {
    const blocks = raw.split(/^###\s+/m).filter(Boolean);
    for (const block of blocks.slice(0, 6)) {
      const [firstLine, ...rest] = block.split('\n');
      sections.push({ title: firstLine.trim(), icon: '📄', content: rest.join('\n').trim() });
    }
  }

  return sections;
}

// ── Section card ──────────────────────────────────────────────────────────────

function ReportSectionCard({ section }: { section: ReportSection }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`## ${section.icon} ${section.title}\n\n${section.content}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-violet-500/15">
        <p className="text-xs font-bold text-violet-300">
          {section.icon} {section.title}
        </p>
        <button onClick={handleCopy} className="text-slate-500 hover:text-violet-300 transition-colors">
          {copied ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
        </button>
      </div>
      <div className="px-4 py-3">
        <p className="text-[12px] text-slate-200 leading-relaxed whitespace-pre-wrap">{section.content}</p>
      </div>
    </div>
  );
}

// ── Satisfaction stars ────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(n)}>
          <Star size={16} className={n <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface AgentReporterProps {
  quota: AgentQuota;
}

export function AgentReporter({ quota }: AgentReporterProps) {
  const profile = useOnboardingProfile();
  const sectorFromProfile = profile?.sector ?? 'Commerce';
  const { runReport } = useAgentSprint();

  const [clientName, setClientName] = useState('');
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  });
  const [sector, setSector] = useState(sectorFromProfile);
  const [highlights, setHighlights] = useState('');
  const [satisfaction, setSatisfaction] = useState(4);
  const [isStreaming, setIsStreaming] = useState(false);
  const [rawOutput, setRawOutput] = useState('');
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [showConfig, setShowConfig] = useState(true);
  const [historyStats, setHistoryStats] = useState<{ postsPublished: number; reviewsHandled: number; smsSent: number } | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!clientName.trim() || isStreaming) return;

    const allowed = quota.consume();
    if (!allowed) {
      toast.error('Quota mensuel atteint', { description: 'Rechargez des crédits pour continuer.' });
      return;
    }

    setIsStreaming(true);
    setRawOutput('');
    setSections([]);
    setHistoryStats(null);
    setShowConfig(false);

    try {
      // Call backend agent endpoint (reads action history + generates enriched report)
      const result = await runReport({
        clientName,
        period,
        sector,
        highlights: highlights || undefined,
        satisfaction,
      });

      setRawOutput(result.content);
      const parsed = parseReportSections(result.content);
      setSections(parsed);

      // Capture real history stats from function call
      const fnResult = result.functionCall?.result as {
        postsPublished?: number;
        reviewsHandled?: number;
        smsSent?: number;
      } | null;
      if (fnResult) {
        setHistoryStats({
          postsPublished: fnResult.postsPublished ?? 0,
          reviewsHandled: fnResult.reviewsHandled ?? 0,
          smsSent: fnResult.smsSent ?? 0,
        });
      }

      toast.success(`📋 Rapport "${clientName}" généré — ${parsed.length} sections prêtes !`);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Erreur de génération', { description: 'Vérifiez votre connexion et réessayez.' });
        setShowConfig(true);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [clientName, period, sector, highlights, satisfaction, isStreaming, quota, runReport]);

  const handleDownload = () => {
    // Copy full report to clipboard (PDF simulation)
    const fullText = `RAPPORT MENSUEL — ${clientName.toUpperCase()}\nPériode : ${period}\n\n${rawOutput}`;
    navigator.clipboard.writeText(fullText).then(() => {
      toast.success('📄 Rapport copié dans le presse-papier (format PDF disponible via impression)');
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Rapport ${clientName} — ${period}</title>
      <style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;line-height:1.6;color:#1a1a1a}
      h1{color:#4f46e5;border-bottom:2px solid #4f46e5;padding-bottom:8px}
      h2{color:#374151;margin-top:24px}ul{padding-left:20px}
      .meta{color:#6b7280;font-size:14px;margin-bottom:24px}</style></head>
      <body>
      <h1>Rapport Mensuel — ${clientName}</h1>
      <div class="meta">Période : ${period} · Secteur : ${sector} · Satisfaction : ${satisfaction}/5</div>
      <pre style="white-space:pre-wrap;font-family:Arial">${rawOutput}</pre>
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const handleReset = () => {
    setRawOutput('');
    setSections([]);
    setHistoryStats(null);
    setShowConfig(true);
    setIsStreaming(false);
  };

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent border-violet-500/20 bg-slate-900/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-violet-400">
            <FileText size={22} />
          </div>
          <div>
            <p className="font-bold text-sm text-white">Account Manager</p>
            <p className="text-[11px] text-slate-400">Auto-Reporter · Génération IA réelle</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-400" />
          <span className="text-[11px] font-semibold text-violet-400">Prêt</span>
        </div>
      </div>

      {/* Config form */}
      {showConfig && (
        <div className="px-5 pb-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Nom du client</label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Ex: Salon Éclat Paris"
                className="w-full rounded-xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-200 placeholder:text-slate-600 px-3 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Période</label>
              <input
                type="text"
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="w-full rounded-xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-200 px-3 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Secteur</label>
            <input
              type="text"
              value={sector}
              onChange={e => setSector(e.target.value)}
              className="w-full rounded-xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-200 px-3 py-2 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Points forts du mois (optionnel)</label>
            <textarea
              value={highlights}
              onChange={e => setHighlights(e.target.value)}
              placeholder="Ex: 3 campagnes SMS envoyées, 12 posts publiés, 24 avis Google gérés, ouverture du compte Stripe Connect…"
              rows={2}
              className="w-full rounded-xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-200 placeholder:text-slate-600 px-3 py-2.5 resize-none focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">
              Note de satisfaction client estimée
            </label>
            <StarRating value={satisfaction} onChange={setSatisfaction} />
          </div>
          <button
            onClick={handleGenerate}
            disabled={!clientName.trim() || isStreaming || quota.isExhausted}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all border',
              clientName.trim() && !quota.isExhausted
                ? 'bg-violet-500/15 border-violet-500/30 text-violet-300 hover:bg-violet-500/25 hover:shadow-lg hover:shadow-violet-500/10'
                : 'opacity-40 cursor-not-allowed border-slate-700/40 bg-slate-800/20 text-slate-500'
            )}
          >
            <LineChart size={15} />
            {quota.isExhausted ? 'Quota atteint' : 'Générer le Rapport Mensuel Client'}
          </button>
        </div>
      )}

      {/* Results */}
      {!showConfig && (
        <div className="px-5 pb-5 space-y-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setShowConfig(v => !v)} className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors">
              <ChevronUp size={12} /> Modifier
            </button>
            <button onClick={handleReset} className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors">
              <RefreshCw size={11} /> Nouveau rapport
            </button>
          </div>

          {isStreaming && sections.length === 0 && (
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 size={13} className="animate-spin text-violet-400" />
                <span className="text-[11px] font-bold text-violet-400">Génération du rapport mensuel…</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono leading-relaxed whitespace-pre-wrap line-clamp-8">
                {rawOutput || '…'}
              </p>
            </div>
          )}

          {sections.length > 0 && (
            <div className="space-y-3">
              {/* Report header */}
              <div className="rounded-xl bg-violet-500/8 border border-violet-500/20 px-4 py-3">
                <p className="text-xs font-black text-violet-300 mb-0.5">RAPPORT MENSUEL · {period.toUpperCase()}</p>
                <p className="text-sm font-bold text-white">{clientName}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} size={12} className={n <= satisfaction ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
                  ))}
                  <span className="text-[10px] text-slate-400 ml-1">{satisfaction}/5 satisfaction client</span>
                </div>
              </div>

              {historyStats && (
                <div className="flex items-center gap-2 rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2">
                  <BarChart2 size={11} className="text-violet-400 shrink-0" />
                  <p className="text-[10px] text-violet-300 font-semibold">
                    Données réelles : {historyStats.postsPublished} posts · {historyStats.reviewsHandled} avis · {historyStats.smsSent} SMS
                  </p>
                </div>
              )}
              {sections.map((s, i) => <ReportSectionCard key={i} section={s} />)}

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold bg-violet-500/15 border border-violet-500/30 text-violet-300 hover:bg-violet-500/25 transition-all"
                >
                  <Download size={13} /> Copier le rapport
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-bold bg-slate-700/40 border border-slate-600/40 text-slate-300 hover:bg-slate-700/60 transition-all"
                >
                  <Printer size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
