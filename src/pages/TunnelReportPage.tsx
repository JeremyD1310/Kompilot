/**
 * TunnelReportPage — Public white-label competitor intelligence report.
 * Accessed via /tunnel-report/:token — no authentication required.
 * No Kompilot branding — shows only the agency name.
 */
import { useState, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { BACKEND_URL } from '../config/api';
import {
  TrendingUp, Eye, Target, Cpu, Mail,
  CheckCircle, AlertCircle, Clock,
} from 'lucide-react';
import { cn } from '@blinkdotnew/ui';

interface ReportData {
  title: string;
  agencyName?: string;
  agencyLogoUrl?: string;
  expiresAt?: string;
  viewCount: number;
  createdAt: string;
  summaryData: {
    creatorName: string;
    domainUrl: string;
    platform: string;
    estimatedSpend: number;
    performanceScore: number;
    ghostEmailCount: number;
    generatedAt: string;
    analysis?: {
      metrics?: {
        totalActiveAds: number;
        winningAdsCount: number;
        estimatedPerformanceScore: number;
      };
      techStack?: string[];
    };
  };
}

const RECOMMENDATIONS = [
  'Analysez les publicités rentables (21j+) du concurrent pour identifier ses hooks gagnants.',
  "Capturez la séquence email complète via l'adresse de tracking dédiée.",
  'Testez vos propres publicités avec un simulateur Persona avant de les publier.',
  'Ciblez les mêmes mots-clés SEO organiques pour capter leur trafic qualifié.',
  'Surveillez les changements dans leur tunnel (nouvelles pubs, nouveaux prix) via Watch.',
];

export default function TunnelReportPage() {
  const { token } = useParams({ from: '/tunnel-report/$token' });
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BACKEND_URL}/api/funnels/export/${token}`)
      .then(r => r.ok ? r.json() : r.json().then((b: { error?: string }) => Promise.reject(b.error ?? 'Erreur')))
      .then((data: ReportData) => { if (!cancelled) { setReport(data); setLoading(false); } })
      .catch((msg: string) => { if (!cancelled) { setError(msg); setLoading(false); } });
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Chargement du rapport…</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Rapport introuvable</h1>
          <p className="text-sm text-slate-500">
            {error === 'Report expired'
              ? 'Ce rapport a expiré. Demandez un nouveau lien à votre contact.'
              : 'Ce rapport n\'existe pas ou le lien est invalide.'}
          </p>
        </div>
      </div>
    );
  }

  const sd = report.summaryData;
  const agencyName = report.agencyName || 'Votre agence';
  const expiryDate = report.expiresAt
    ? new Date(report.expiresAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;
  const generatedDate = new Date(sd.generatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">{agencyName}</p>
              <h1 className="text-2xl font-black text-white leading-tight">{report.title}</h1>
              <p className="text-slate-400 text-sm mt-2">Généré le {generatedDate}</p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-3xl font-black text-white">{sd.performanceScore}</div>
              <div className="text-slate-400 text-xs">/100 performance</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Competitor identity */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-600" /> Concurrent analysé
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Nom', value: sd.creatorName },
              { label: 'Domaine', value: sd.domainUrl },
              { label: 'Plateforme', value: sd.platform.charAt(0).toUpperCase() + sd.platform.slice(1) },
              { label: 'Budget estimé', value: `~${sd.estimatedSpend >= 1000 ? `${(sd.estimatedSpend / 1000).toFixed(0)}k€` : `${sd.estimatedSpend}€`}/mois` },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5 break-all">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* KPI grid */}
        {sd.analysis?.metrics && (
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Eye, label: 'Pubs actives', value: sd.analysis.metrics.totalActiveAds, color: 'bg-blue-50 text-blue-600' },
              { icon: Target, label: 'Pubs rentables', value: sd.analysis.metrics.winningAdsCount, color: 'bg-green-50 text-green-600' },
              { icon: TrendingUp, label: 'Score pub', value: `${sd.analysis.metrics.estimatedPerformanceScore}/100`, color: 'bg-purple-50 text-purple-600' },
              { icon: Mail, label: 'Emails capturés', value: sd.ghostEmailCount, color: 'bg-orange-50 text-orange-600' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-2xl border border-slate-200 p-4 text-center space-y-1">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mx-auto', item.color.split(' ')[0])}>
                  <item.icon size={16} className={item.color.split(' ')[1]} />
                </div>
                <p className="text-xl font-black text-slate-900">{item.value}</p>
                <p className="text-[10px] text-slate-400 font-medium">{item.label}</p>
              </div>
            ))}
          </section>
        )}

        {/* Tech stack */}
        {sd.analysis?.techStack && sd.analysis.techStack.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu size={16} className="text-slate-600" /> Stack technologique détectée
            </h2>
            <div className="flex flex-wrap gap-2">
              {sd.analysis.techStack.map(tech => (
                <span key={tech} className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold border border-slate-200">
                  {tech}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Performance score bar */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900">Score de performance global</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Score concurrent</span>
              <span className={cn('text-sm font-black',
                sd.performanceScore >= 70 ? 'text-green-600' :
                sd.performanceScore >= 40 ? 'text-amber-600' : 'text-red-500'
              )}>{sd.performanceScore}/100</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700',
                  sd.performanceScore >= 70 ? 'bg-green-500' :
                  sd.performanceScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
                )}
                style={{ width: `${sd.performanceScore}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              {sd.performanceScore >= 70
                ? '🔥 Concurrent à haute performance — stratégie publicitaire mature.'
                : sd.performanceScore >= 40
                ? '⚡ Concurrent en phase d\'optimisation — opportunité de le dépasser.'
                : '⚠️ Concurrent faible — fenêtre d\'opportunité à saisir rapidement.'}
            </p>
          </div>
        </section>

        {/* Recommendations */}
        <section className="bg-slate-900 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" /> Recommandations stratégiques
          </h2>
          <div className="space-y-3">
            {RECOMMENDATIONS.map((rec, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center space-y-2 pb-8">
          <p className="text-xs text-slate-400">
            Rapport confidentiel — {agencyName}
          </p>
          {expiryDate && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Clock size={11} /> Lien valide jusqu'au {expiryDate} · {report.viewCount} vue{report.viewCount > 1 ? 's' : ''}
            </p>
          )}
          <p className="text-[10px] text-slate-300 opacity-40 mt-1">
            Ne pas distribuer sans autorisation
          </p>
        </footer>
      </div>
    </div>
  );
}
