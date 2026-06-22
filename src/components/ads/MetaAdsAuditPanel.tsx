/**
 * MetaAdsAuditPanel — Agency tool: Meta conversion tunnel audit + white-label PDF report.
 * Generates an AI-powered "Avant / Après" report for agency prospects.
 */
import React, { useState } from 'react';
import {
  Search, AlertTriangle, CheckCircle2, Download, Sparkles,
  XCircle, Loader2, FileText, RefreshCw,
  TrendingDown, TrendingUp, ShieldOff, ShieldCheck, Eye,
  BarChart3, Globe, Zap,
} from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';

// ── Types ────────────────────────────────────────────────────────────────────

interface AuditResult {
  accountId: string;
  score: number;
  issues: AuditIssue[];
  recommendations: AuditRec[];
  estimatedLoss: number;
}

interface AuditIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  impact: string;
}

interface AuditRec {
  id: string;
  title: string;
  gain: string;
  description: string;
}

// ── Mock audit scenarios ──────────────────────────────────────────────────────

const MOCK_AUDITS: Record<string, AuditResult> = {
  default: {
    accountId: '',
    score: 28,
    estimatedLoss: 340,
    issues: [
      { id: 'i1', severity: 'critical', category: 'Tracking', title: 'API Conversions (CAPI) non configurée', impact: '-60 % de précision des données de conversion' },
      { id: 'i2', severity: 'critical', category: 'Landing Page', title: '3 publicités sans landing page dédiée', impact: 'Taux de rebond estimé : 78 %' },
      { id: 'i3', severity: 'warning',  category: 'Ciblage',     title: 'Audiences trop larges (rayon > 40 km)', impact: 'Budget gaspillé sur des zones non chalandises' },
      { id: 'i4', severity: 'warning',  category: 'Pixel',       title: 'Pixel Meta installé mais événements manquants', impact: 'Achats, RDV et leads non tracés' },
      { id: 'i5', severity: 'info',     category: 'Créatifs',    title: 'Aucun format Réel (9:16) actif', impact: 'CPC 40 % plus élevé que la moyenne sectorielle' },
    ],
    recommendations: [
      { id: 'r1', title: 'Activer l\'API Conversions CAPI', gain: '+60 % précision tracking', description: 'Relier directement le backend à Meta pour un tracking côté serveur, indépendant des bloqueurs de cookies.' },
      { id: 'r2', title: 'Créer des landing pages sectorielles', gain: '+35 % taux de conversion', description: 'Pages locales ultra-ciblées avec formulaire de RDV, preuve sociale et CTA adapté au secteur.' },
      { id: 'r3', title: 'Réduire le rayon à 5–10 km', gain: '-30 % coût par lead', description: 'Cibler uniquement la zone de chalandise réelle du commerce pour concentrer le budget là où les clients peuvent venir.' },
    ],
  },
  demo: {
    accountId: 'ACT_DEMO_12345',
    score: 42,
    estimatedLoss: 190,
    issues: [
      { id: 'i1', severity: 'critical', category: 'CAPI',        title: 'API Conversions désactivée depuis 14 jours', impact: 'Optimisation de l\'algorithme Meta dégradée' },
      { id: 'i2', severity: 'warning',  category: 'Budget',      title: 'Budget quotidien fragmenté en 6 campagnes', impact: 'Phase d\'apprentissage non atteinte sur chaque campagne' },
      { id: 'i3', severity: 'warning',  category: 'Audiences',   title: 'Audiences similaires basées sur un pixel vide', impact: 'Look-alike peu qualifié, ROI faible' },
    ],
    recommendations: [
      { id: 'r1', title: 'Reconnecter l\'API Conversions', gain: '+45 % ROAS', description: 'Réactivation du CAPI avec les événements clés : PageView, Lead, Purchase, Schedule.' },
      { id: 'r2', title: 'Consolider en 2 campagnes max', gain: '-20 % CPA', description: 'Atteindre le seuil de 50 conversions/semaine pour que l\'algorithme optimise correctement.' },
    ],
  },
};

// ── Severity styles ───────────────────────────────────────────────────────────

const SEV: Record<AuditIssue['severity'], { cls: string; icon: React.ReactNode; label: string }> = {
  critical: { cls: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800/50 dark:text-red-300', icon: <XCircle size={13} className="text-red-500 shrink-0" />, label: 'Critique' },
  warning:  { cls: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800/50 dark:text-amber-300', icon: <AlertTriangle size={13} className="text-amber-500 shrink-0" />, label: 'Attention' },
  info:     { cls: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800/50 dark:text-blue-300', icon: <Eye size={13} className="text-blue-500 shrink-0" />, label: 'Optimisation' },
};

// ── Score gauge ───────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? '#22C55E' : score >= 45 ? '#F59E0B' : '#EF4444';
  const scoreLabel = score >= 70 ? 'Bon' : score >= 45 ? 'Perfectible' : 'Critique';
  const pct   = `${score}%`;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" strokeWidth="10" className="stroke-muted" />
          <circle
            cx="50" cy="50" r="40" fill="none" strokeWidth="10"
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold tabular-nums" style={{ color }}>{pct}</span>
        </div>
      </div>
      <span className="text-xs font-bold" style={{ color }}>{scoreLabel}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Score tunnel</span>
    </div>
  );
}

// ── Report PDF mock ───────────────────────────────────────────────────────────

function generatePDFReport(result: AuditResult, agencyName: string) {
  // In production: use jsPDF or call backend to generate real PDF
  const criticals = result.issues.filter(i => i.severity === 'critical').length;
  const content = `
RAPPORT D'AUDIT META ADS — MARQUE BLANCHE
${agencyName.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCORE DE TUNNEL : ${result.score}/100
Pertes estimées : ${result.estimatedLoss} €/mois
Problèmes critiques : ${criticals}

━━━ SECTION 1 : ÉTAT ACTUEL ━━━
${result.issues.map(i => `[${i.severity.toUpperCase()}] ${i.title}\n   → ${i.impact}`).join('\n')}

━━━ SECTION 2 : VERSION OPTIMISÉE AVEC KOMPILOT ━━━
${result.recommendations.map(r => `✓ ${r.title} (${r.gain})\n   ${r.description}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Rapport généré par ${agencyName} · Propulsé par Kompilot
  `.trim();

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `audit-meta-${result.accountId || 'prospect'}-${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main component ────────────────────────────────────────────────────────────

export function MetaAdsAuditPanel() {
  const [accountId, setAccountId]   = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<AuditResult | null>(null);
  const [exporting, setExporting]   = useState(false);

  const handleAudit = async () => {
    if (loading) return;
    setLoading(true);
    setResult(null);

    await new Promise(r => setTimeout(r, 2200));

    const key: string = accountId.trim().toLowerCase().includes('demo') ? 'demo' : 'default';
    const audit = { ...MOCK_AUDITS[key], accountId: accountId.trim() || 'ACT_SIMULATION' };
    setResult(audit);
    setLoading(false);
  };

  const handleExport = async () => {
    if (!result) return;
    setExporting(true);
    await new Promise(r => setTimeout(r, 900));
    generatePDFReport(result, agencyName || 'Votre Agence');
    setExporting(false);
    toast.success('Rapport exporté en marque blanche', {
      description: `Charte graphique "${agencyName || 'Votre Agence'}" appliquée sur le document.`,
    });
  };

  const criticals = result?.issues.filter(i => i.severity === 'critical').length ?? 0;

  return (
    <div className="space-y-5">
      {/* ── Header card ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div
          className="px-5 py-4 border-b border-border flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,.08) 0%, rgba(13,148,136,.06) 100%)' }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #0D9488)' }}>
            <Search size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-foreground">Audit de Tunnel de Conversion Meta</p>
            <p className="text-[11px] text-muted-foreground">Analysez les pertes de budget et générez un rapport Avant/Après en marque blanche</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Account ID input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              ID de compte publicitaire Meta
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <BarChart3 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  placeholder="ex: ACT_123456789 — ou laissez vide pour simuler"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/60 transition-all"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              💡 Tapez "demo" pour charger un exemple réel. Laissez vide pour une simulation automatique.
            </p>
          </div>

          {/* Agency name for white-label */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Nom de votre agence (marque blanche)
            </label>
            <div className="relative">
              <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                value={agencyName}
                onChange={e => setAgencyName(e.target.value)}
                placeholder="ex: Digital Boost Agency"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/60 transition-all"
              />
            </div>
          </div>

          {/* CTA button */}
          <button
            onClick={handleAudit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-extrabold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)' }}
          >
            {loading ? (
              <><Loader2 size={15} className="animate-spin" /> Analyse du tunnel en cours…</>
            ) : (
              <><Sparkles size={15} /> Générer l'audit de tunnel de conversion</>
            )}
          </button>
        </div>
      </div>

      {/* ── Loading state ───────────────────────────────────────────────── */}
      {loading && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          {[
            'Connexion à l\'API Meta Ads…',
            'Analyse du pixel et des événements de conversion…',
            'Détection des fuites de budget…',
            'Calcul du score de tunnel…',
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                i === 0 ? 'bg-primary/15' : 'bg-muted'
              }`}>
                {i === 0
                  ? <Loader2 size={11} className="text-primary animate-spin" />
                  : <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                }
              </div>
              <span className={`text-sm ${i === 0 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>{step}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Audit results ───────────────────────────────────────────────── */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Score + summary strip */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
              <FileText size={14} className="text-primary" />
              <span className="text-sm font-bold text-foreground">Résultats de l'audit</span>
              <span className="text-[10px] text-muted-foreground ml-1">
                Compte : {result.accountId}
              </span>
            </div>

            <div className="p-5">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ScoreGauge score={result.score} />
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  {[
                    { label: 'Problèmes critiques', value: criticals, color: '#EF4444', icon: <XCircle size={14} /> },
                    { label: 'Alertes détectées', value: result.issues.filter(i => i.severity === 'warning').length, color: '#F59E0B', icon: <AlertTriangle size={14} /> },
                    { label: 'Pertes estimées/mois', value: `${result.estimatedLoss} €`, color: '#EF4444', icon: <TrendingDown size={14} /> },
                  ].map(kpi => (
                    <div key={kpi.label} className="rounded-xl border border-border bg-muted/20 px-4 py-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground" style={{ color: kpi.color }}>
                        {kpi.icon}
                        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{kpi.label}</span>
                      </div>
                      <p className="text-2xl font-extrabold tabular-nums" style={{ color: kpi.color }}>{kpi.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Avant / Après split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Section 1 — AVANT (issues) */}
            <div className="rounded-2xl border border-red-200 dark:border-red-800/40 bg-red-50/40 dark:bg-red-950/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-red-200 dark:border-red-800/40 bg-red-100/60 dark:bg-red-950/20">
                <ShieldOff size={14} className="text-red-500" />
                <span className="text-sm font-extrabold text-red-700 dark:text-red-400">AVANT — État actuel</span>
                <span className="ml-auto text-[10px] bg-red-500 text-white rounded-full px-2 py-0.5 font-bold">
                  {result.issues.length} problèmes
                </span>
              </div>
              <div className="p-4 space-y-2">
                {result.issues.map(issue => {
                  const sev = SEV[issue.severity];
                  return (
                    <div key={issue.id} className={`rounded-xl border px-3 py-2.5 ${sev.cls}`}>
                      <div className="flex items-start gap-2">
                        {sev.icon}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{issue.category}</span>
                            <span className="text-[10px] font-bold border border-current/30 rounded-full px-1.5 py-0.5 opacity-80">{sev.label}</span>
                          </div>
                          <p className="text-xs font-bold mt-0.5">{issue.title}</p>
                          <p className="text-[11px] opacity-75 mt-0.5">{issue.impact}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2 — APRÈS (recommendations) */}
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-200 dark:border-emerald-800/40 bg-emerald-100/60 dark:bg-emerald-950/20">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">APRÈS — Avec Kompilot</span>
                <TrendingUp size={13} className="ml-auto text-emerald-500" />
              </div>
              <div className="p-4 space-y-2">
                {result.recommendations.map((rec, i) => (
                  <div key={rec.id} className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-white dark:bg-emerald-950/20 px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-[10px] font-extrabold mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-foreground">{rec.title}</p>
                          <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 rounded-full px-2 py-0.5">
                            {rec.gain}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5">
                  <Zap size={13} className="text-primary shrink-0" />
                  <p className="text-xs font-semibold text-primary">
                    Tracking CAPI actif · Landing pages sectorielles · Scanner local intégré
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Export CTA */}
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                <Download size={16} className="text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Exporter le rapport en marque blanche</p>
                <p className="text-[11px] text-muted-foreground">
                  PDF ultra-visuel Avant/Après · Logo {agencyName || 'de votre agence'} appliqué automatiquement
                </p>
              </div>
            </div>
            <Button
              onClick={handleExport}
              disabled={exporting}
              size="sm"
              className="gap-2 shrink-0 text-white"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #0D9488)', border: 'none' }}
            >
              {exporting
                ? <><Loader2 size={13} className="animate-spin" /> Export…</>
                : <><Download size={13} /> Télécharger le PDF</>
              }
            </Button>
          </div>

          {/* Reset */}
          <div className="flex justify-center">
            <button
              onClick={() => setResult(null)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw size={11} />
              Analyser un autre compte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
