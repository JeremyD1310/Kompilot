/**
 * CreativeStudio — Analyse Meta Ads via Claude Sonnet
 *
 * Fonctionnalités :
 *  - Analyse les performances créatives d'un compte Meta Ads
 *  - Affiche winners / losers / briefs créas
 *  - Bouton "Copier le prompt d'injection IA" pour ChatGPT/Claude
 *  - Sauvegarde les rapports dans Blink DB via le backend Hono
 */
import { useState, useEffect } from 'react';
import {
  Sparkles, Copy, Check, Play, TrendingUp, TrendingDown,
  Lightbulb, AlertTriangle, ChevronDown, ChevronUp, RefreshCw, FileDown,
} from 'lucide-react';
import { blink } from '../../../blink/client';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

interface AnalysisResult {
  winners: string;
  losers: string;
  next_actions: string[];
  budget_waste_euros?: number;
}

interface Report {
  reportId: string;
  analysis: AnalysisResult;
  adsAnalyzed: number;
  budgetWasteDetected: number;
  isDemo?: boolean;
}

interface Stats {
  totalReports: number;
  totalAds: number;
  totalBudgetWasteEuros: number;
}

/* ── CopyButton ─────────────────────────────────────────────────────────── */
function CopyButton({ text, label = 'Copier' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
        border: `1px solid ${copied ? 'rgba(45,212,191,.5)' : 'rgba(255,255,255,.12)'}`,
        background: copied ? 'rgba(13,148,136,.2)' : 'rgba(255,255,255,.06)',
        color: copied ? '#2DD4BF' : '#94A3B8',
        fontSize: '.8rem', fontWeight: 600,
        transition: 'all .2s',
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copié !' : label}
    </button>
  );
}

/* ── exportReportToPdf ──────────────────────────────────────────────────── */
function exportReportToPdf(report: Report, adAccountId: string, agencyName = 'Kompilot') {
  const { analysis, adsAnalyzed, budgetWasteDetected } = report;
  const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const nextActions = (analysis.next_actions ?? []).map((a, i) => `${i + 1}. ${a}`).join('\n');

  const content = [
    `RAPPORT CREATIVE STUDIO — ${agencyName.toUpperCase()}`,
    `Généré le ${date} · Compte Meta Ads : ${adAccountId}`,
    `${'─'.repeat(60)}`,
    '',
    `RÉSUMÉ EXÉCUTIF`,
    `• Publicités analysées : ${adsAnalyzed}`,
    `• Budget perdu estimé  : ${budgetWasteDetected} €`,
    '',
    `${'─'.repeat(60)}`,
    `✅ CE QUI PERFORME`,
    `${'─'.repeat(60)}`,
    analysis.winners,
    '',
    `${'─'.repeat(60)}`,
    `🛑 À COUPER / MODIFIER`,
    `${'─'.repeat(60)}`,
    analysis.losers,
    '',
    `${'─'.repeat(60)}`,
    `🚀 PROCHAINS BRIEFS CRÉAS À TESTER`,
    `${'─'.repeat(60)}`,
    nextActions,
    '',
    `${'─'.repeat(60)}`,
    `Rapport généré via Creative Studio × Claude — ${agencyName}`,
    `Données issues de Meta Graph API v19.0 · Analyse : Claude 3.5 Sonnet`,
  ].join('\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rapport-creative-studio-${adAccountId.replace('act_', '')}-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── buildInjectionPrompt ───────────────────────────────────────────────── */
function buildInjectionPrompt(report: Report, adAccountId: string): string {
  const { analysis, adsAnalyzed, budgetWasteDetected } = report;
  return `# Rapport Creative Studio Kompilot — Compte Meta Ads: ${adAccountId}

## Résumé exécutif
- Publicités analysées : ${adsAnalyzed}
- Budget perdu estimé : ${budgetWasteDetected} €

## ✅ Ce qui performe
${analysis.winners}

## 🛑 Ce qu'il faut couper / modifier
${analysis.losers}

## 🚀 Prochains briefs créas à tester
${(analysis.next_actions || []).map((a, i) => `${i + 1}. ${a}`).join('\n')}

---
Contexte : Plateforme Kompilot (SaaS présence locale).
Objectif : Itérer sur les créas gagnantes et éliminer les pertes de budget.
Prompt : À partir de ces données, génère 3 nouvelles accroches publicitaires optimisées pour le CTR et le ROAS.`;
}

/* ── Main Component ─────────────────────────────────────────────────────── */
interface CreativeStudioProps {
  orgId?: string;
  defaultAdAccountId?: string;
}

export default function CreativeStudio({ orgId = '', defaultAdAccountId = '' }: CreativeStudioProps) {
  const [adAccountId, setAdAccountId] = useState(defaultAdAccountId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  /* Load stats on mount */
  useEffect(() => {
    loadStats();
  }, []);

  async function getAuthHeader() {
    try {
      const token = await blink.auth.getValidToken();
      return token ? `Bearer ${token}` : '';
    } catch {
      return '';
    }
  }

  async function loadStats() {
    const auth = await getAuthHeader();
    if (!auth) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/creative-studio/stats`, {
        headers: { Authorization: auth },
      });
      if (res.ok) setStats(await res.json());
    } catch { /* silent */ }
  }

  async function loadHistory() {
    const auth = await getAuthHeader();
    if (!auth) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/creative-studio/reports`, {
        headers: { Authorization: auth },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.reports ?? []);
      }
    } catch { /* silent */ }
  }

  const runAnalysis = async () => {
    if (!adAccountId.trim()) {
      setError('Veuillez saisir un Ad Account ID (ex : act_1234567890).');
      return;
    }
    setLoading(true);
    setError('');
    setReport(null);

    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${BACKEND_URL}/api/creative-studio/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({ adAccountId: adAccountId.trim(), orgId }),
      });

      const data = await res.json() as any;
      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue.');
      } else {
        setReport({ ...data, isDemo: data.isDemo ?? false });
        loadStats();
      }
    } catch (err: any) {
      setError(err.message ?? 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  const injectionPrompt = report ? buildInjectionPrompt(report, adAccountId) : '';

  return (
    <div style={{
      background: '#0F172A',
      border: '1px solid rgba(255,255,255,.08)',
      borderRadius: 20,
      padding: '28px 28px 24px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <h2 style={{ color: '#F8FAFC', fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
              Creative Studio × Claude
            </h2>
          </div>
          <p style={{ color: '#64748B', fontSize: '.8rem', margin: 0 }}>
            Analyse ton ROI créatif Meta Ads et génère tes prochaines itérations.
          </p>
        </div>

        {/* Stats pill */}
        {stats && stats.totalReports > 0 && (
          <div style={{
            background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.25)',
            borderRadius: 30, padding: '6px 14px', fontSize: '.75rem', color: '#A5B4FC',
            fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            Claude a analysé <strong style={{ color: '#C7D2FE' }}>{stats.totalAds}</strong> créas
            {stats.totalBudgetWasteEuros > 0 && (
              <> · identifié <strong style={{ color: '#FCA5A5' }}>{stats.totalBudgetWasteEuros} € perdus</strong></>
            )}
          </div>
        )}
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Ad Account ID (ex : act_1234567890)"
          value={adAccountId}
          onChange={e => { setAdAccountId(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && runAnalysis()}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 12, padding: '12px 16px',
            color: '#F1F5F9', fontSize: '.9rem', outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={runAnalysis}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 22px', borderRadius: 12, border: 'none',
            background: loading ? 'rgba(99,102,241,.4)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: '#fff', fontWeight: 700, fontSize: '.88rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all .2s',
          }}
        >
          {loading ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin .8s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" strokeLinecap="round" />
            </svg>
          ) : <Play size={15} fill="currentColor" />}
          {loading ? 'Analyse en cours…' : 'Scanner les Ads'}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
          borderRadius: 10, padding: '10px 14px',
          color: '#f87171', fontSize: '.8rem', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Results */}
      {report && (
        <div>
          {/* Summary bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            background: 'rgba(255,255,255,.03)', borderRadius: 12,
            padding: '12px 16px', marginBottom: 16,
          }}>
            {report.isDemo && (
              <span style={{
                background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.35)',
                color: '#FCD34D', fontSize: '.7rem', fontWeight: 700,
                padding: '3px 9px', borderRadius: 20, letterSpacing: '.05em',
                textTransform: 'uppercase', flexShrink: 0,
              }}>
                Mode démo — données simulées
              </span>
            )}
            <span style={{ color: '#64748B', fontSize: '.8rem' }}>
              <strong style={{ color: '#A5B4FC' }}>{report.adsAnalyzed}</strong> publicités analysées
            </span>
            {report.budgetWasteDetected > 0 && (
              <span style={{ color: '#64748B', fontSize: '.8rem' }}>
                <strong style={{ color: '#FCA5A5' }}>{report.budgetWasteDetected} €</strong> de budget perdu détecté
              </span>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <CopyButton text={injectionPrompt} label="Copier le prompt d'injection IA" />
              <button
                onClick={() => exportReportToPdf(report, adAccountId)}
                title="Exporter le rapport (format texte)"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                  borderRadius: 10, border: '1px solid rgba(99,102,241,.35)',
                  background: 'rgba(99,102,241,.12)', color: '#A5B4FC',
                  fontSize: '.78rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all .2s',
                }}
              >
                <FileDown size={13} /> Exporter rapport
              </button>
              <button
                onClick={runAnalysis}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                  borderRadius: 10, border: '1px solid rgba(255,255,255,.1)',
                  background: 'rgba(255,255,255,.05)', color: '#64748B',
                  fontSize: '.78rem', cursor: 'pointer',
                }}
              >
                <RefreshCw size={12} /> Relancer
              </button>
            </div>
          </div>

          {/* Analysis grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 14 }}>
            {/* Winners */}
            <div style={{
              background: 'rgba(16,185,129,.07)', border: '1px solid rgba(16,185,129,.2)',
              borderRadius: 14, padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <TrendingUp size={16} color="#34D399" />
                <span style={{ color: '#34D399', fontWeight: 700, fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Ce qui performe 🔥
                </span>
              </div>
              <p style={{ color: '#D1FAE5', fontSize: '.82rem', lineHeight: 1.6, margin: 0 }}>
                {report.analysis.winners}
              </p>
            </div>

            {/* Losers */}
            <div style={{
              background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.2)',
              borderRadius: 14, padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <TrendingDown size={16} color="#F87171" />
                <span style={{ color: '#F87171', fontWeight: 700, fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  À couper / modifier 🛑
                </span>
              </div>
              <p style={{ color: '#FEE2E2', fontSize: '.82rem', lineHeight: 1.6, margin: 0 }}>
                {report.analysis.losers}
              </p>
            </div>

            {/* Next actions */}
            <div style={{
              background: 'rgba(99,102,241,.07)', border: '1px solid rgba(99,102,241,.2)',
              borderRadius: 14, padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <Lightbulb size={16} color="#A5B4FC" />
                <span style={{ color: '#A5B4FC', fontWeight: 700, fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Prochains briefs 🚀
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {(report.analysis.next_actions ?? []).map((action, i) => (
                  <li key={i} style={{ color: '#E0E7FF', fontSize: '.82rem', lineHeight: 1.6, marginBottom: 4 }}>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Prompt preview (collapsible) */}
          <div style={{
            background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', cursor: 'pointer',
            }}
              onClick={() => setShowHistory(h => !h)}>
              <span style={{ color: '#64748B', fontSize: '.8rem', fontWeight: 600 }}>
                Aperçu du prompt d'injection IA (ChatGPT / Claude)
              </span>
              {showHistory ? <ChevronUp size={14} color="#64748B" /> : <ChevronDown size={14} color="#64748B" />}
            </div>
            {showHistory && (
              <div style={{ padding: '0 16px 16px' }}>
                <pre style={{
                  color: '#94A3B8', fontSize: '.73rem', lineHeight: 1.6,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  background: 'rgba(0,0,0,.3)', borderRadius: 8,
                  padding: '12px', margin: '0 0 10px',
                  maxHeight: 220, overflowY: 'auto',
                }}>
                  {injectionPrompt}
                </pre>
                <CopyButton text={injectionPrompt} label="Copier le prompt complet" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
