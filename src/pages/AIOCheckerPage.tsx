/**
 * AIO Checker Page — Public free tool for checking AI visibility.
 * No auth required. Rate-limited to 1 check per IP per day.
 *
 * User enters: brand name + 3 keywords
 * Result: AIO visibility score + 3 free recommendations
 * CTA: "Pour aller plus loin et synchroniser votre présence IA automatiquement, créez un compte Kompilot."
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft, Search, Sparkles, CheckCircle2, XCircle,
  AlertTriangle, Zap, ArrowRight, Globe, Bot,
} from 'lucide-react';
import { blink } from '../blink/client';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

interface CheckResult {
  keyword: string;
  aiAnswer: string;
  isCited: boolean;
  engine: string;
}

function ResultCard({ result }: { result: CheckResult }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      background: result.isCited ? 'rgba(16,185,129,.06)' : 'rgba(239,68,68,.06)',
      border: `1px solid ${result.isCited ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)'}`,
      borderRadius: 14, overflow: 'hidden',
    }}>
      <button
        onClick={() => setExpanded(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        {result.isCited
          ? <CheckCircle2 size={18} color="#10B981" style={{ flexShrink: 0 }} />
          : <XCircle size={18} color="#EF4444" style={{ flexShrink: 0 }} />}
        <span style={{ flex: 1, color: '#E2E8F0', fontWeight: 700, fontSize: '.88rem' }}>{result.keyword}</span>
        <span style={{
          fontSize: '.7rem', fontWeight: 800,
          color: result.isCited ? '#10B981' : '#EF4444',
          background: result.isCited ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)',
          border: `1px solid ${result.isCited ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)'}`,
          borderRadius: 20, padding: '3px 10px', flexShrink: 0,
        }}>
          {result.isCited ? 'CITÉ' : 'INVISIBLE'}
        </span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 14px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
              <p style={{ color: '#64748B', fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', margin: '10px 0 4px' }}>
                Réponse IA ({result.engine}) :
              </p>
              <p style={{ color: '#CBD5E1', fontSize: '.82rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                {result.aiAnswer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AIOCheckerPage() {
  const [brandName, setBrandName] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [visibilityScore, setVisibilityScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cta = () => blink.auth.login(window.location.origin + '/dashboard');

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (!kw || keywords.includes(kw)) { setKeywordInput(''); return; }
    if (keywords.length >= 3) return;
    setKeywords(prev => [...prev, kw]);
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) => setKeywords(prev => prev.filter(k => k !== kw));

  const runCheck = async () => {
    if (!brandName.trim() || keywords.length === 0) return;
    setLoading(true);
    setResults(null);
    setVisibilityScore(null);
    setError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/aio/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName: brandName.trim(), keywords }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(String((err as { error?: string }).error ?? `HTTP ${res.status}`));
      }

      const data = await res.json() as { auditResults: Array<{ keyword: string; aiAnswer: string; isCited: boolean; status: string }>; visibilityScore: number };
      setResults(data.auditResults.map(r => ({
        keyword: r.keyword,
        aiAnswer: r.aiAnswer,
        isCited: r.isCited,
        engine: 'ChatGPT',
      })));
      setVisibilityScore(data.visibilityScore);
    } catch (err) {
      setError((err as Error).message || 'Erreur lors de l\'analyse. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = visibilityScore === null ? '#64748B' : visibilityScore >= 60 ? '#10B981' : visibilityScore >= 30 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120', color: '#E2E8F0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(11,17,32,.95)', backdropFilter: 'blur(18px)', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '12px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: '.82rem', textDecoration: 'none' }}><ArrowLeft size={14} /> Retour</Link>
          <span style={{ fontWeight: 800, color: '#818CF8', fontSize: '.88rem' }}>Kompilot</span>
        </div>
      </nav>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(129,140,248,.1)', border: '1px solid rgba(129,140,248,.25)', borderRadius: 9999, padding: '5px 14px', fontSize: '.72rem', fontWeight: 700, color: '#818CF8', marginBottom: 16 }}>
            <Bot size={12} /> Outil Gratuit
          </span>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.025em', margin: '0 0 12px', lineHeight: 1.15 }}>
            Votre marque est-elle<br />
            <span style={{ color: '#818CF8' }}>visible sur ChatGPT ?</span>
          </h1>
          <p style={{ color: '#64748B', fontSize: '1rem', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            Entrez votre nom de marque et 3 mots-clés métier. Nous vérifions si les IA vous citent.
          </p>
        </div>

        {/* Form */}
        <div style={{
          background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 20, padding: 'clamp(20px,4vw,32px)', marginBottom: 24,
        }}>
          {/* Brand name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
              Nom de votre marque / solution
            </label>
            <input
              type="text"
              value={brandName}
              onChange={e => setBrandName(e.target.value)}
              placeholder="Ex: Kompilot, Acme SaaS…"
              style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '12px 16px', color: '#E2E8F0', fontSize: '.88rem', outline: 'none' }}
            />
          </div>

          {/* Keywords */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
              3 mots-clés à vérifier
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                placeholder="Ex: logiciel gestion PME…"
                disabled={keywords.length >= 3}
                style={{ flex: 1, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '12px 16px', color: '#E2E8F0', fontSize: '.88rem', outline: 'none', opacity: keywords.length >= 3 ? 0.5 : 1 }}
              />
              <button
                onClick={addKeyword}
                disabled={!keywordInput.trim() || keywords.length >= 3}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 16px', borderRadius: 10, background: keywordInput.trim() && keywords.length < 3 ? 'rgba(129,140,248,.12)' : 'rgba(255,255,255,.04)', border: `1px solid ${keywordInput.trim() && keywords.length < 3 ? 'rgba(129,140,248,.25)' : 'rgba(255,255,255,.06)'}`, color: keywordInput.trim() && keywords.length < 3 ? '#818CF8' : '#64748B', fontWeight: 700, fontSize: '.82rem', cursor: keywordInput.trim() && keywords.length < 3 ? 'pointer' : 'not-allowed', flexShrink: 0 }}
              >
                + Ajouter
              </button>
            </div>
            {keywords.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {keywords.map(kw => (
                  <span key={kw} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(129,140,248,.1)', border: '1px solid rgba(129,140,248,.2)', fontSize: '.78rem', fontWeight: 600, color: '#818CF8' }}>
                    {kw}
                    <button onClick={() => removeKeyword(kw)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 0, display: 'flex' }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Run button */}
          <button
            onClick={runCheck}
            disabled={loading || !brandName.trim() || keywords.length === 0}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: (!loading && brandName.trim() && keywords.length > 0) ? 'linear-gradient(135deg, #818CF8, #6366F1)' : 'rgba(129,140,248,.15)',
              color: '#fff', fontWeight: 700, fontSize: '.92rem',
              border: 'none', borderRadius: 12, padding: '14px 24px',
              cursor: (!loading && brandName.trim() && keywords.length > 0) ? 'pointer' : 'not-allowed',
              boxShadow: (!loading && brandName.trim() && keywords.length > 0) ? '0 0 24px rgba(129,140,248,.3)' : 'none',
              transition: 'all .2s',
            }}
          >
            {loading
              ? <><Sparkles size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyse en cours…</>
              : <><Search size={16} /> Vérifier ma visibilité IA</>}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', marginBottom: 20 }}>
            <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
            <p style={{ color: '#EF4444', fontSize: '.82rem', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Results */}
        {results && results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Score */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', borderRadius: 18,
              background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
              marginBottom: 20,
            }}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1, color: scoreColor }}>
                  {visibilityScore}%
                </div>
                <div style={{ color: '#64748B', fontSize: '.68rem', fontWeight: 600, marginTop: 4 }}>Visibilité AIO</div>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#E2E8F0', fontWeight: 700, fontSize: '.92rem', margin: '0 0 4px' }}>
                  {visibilityScore! >= 60 ? '✅ Bonne visibilité IA' : visibilityScore! >= 30 ? '⚠️ Visibilité partielle' : '🚨 Invisible sur les IA'}
                </p>
                <p style={{ color: '#94A3B8', fontSize: '.78rem', margin: 0, lineHeight: 1.5 }}>
                  {results.filter(r => r.isCited).length}/{results.length} mots-clés cités dans les réponses IA
                </p>
              </div>
            </div>

            {/* Result cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {results.map((r, i) => <ResultCard key={i} result={r} />)}
            </div>

            {/* Recommendations */}
            <div style={{
              background: 'rgba(13,148,136,.06)', border: '1px solid rgba(13,148,136,.2)',
              borderRadius: 16, padding: '20px 24px', marginBottom: 24,
            }}>
              <p style={{ color: '#0D9488', fontWeight: 700, fontSize: '.88rem', margin: '0 0 10px' }}>
                💡 3 actions pour améliorer votre visibilité IA
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Générez un Schema JSON-LD avec FAQ pour votre page d\'accueil',
                  'Publiez du contenu structuré répondant aux requêtes de vos mots-clés',
                  'Optimisez votre fiche Google Business Profile avec des descriptions riches',
                ].map((rec, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#CBD5E1', fontSize: '.82rem', lineHeight: 1.5 }}>
                    <Zap size={14} color="#0D9488" style={{ flexShrink: 0, marginTop: 2 }} />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={cta}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #0D9488, #0f766e)',
                  color: '#fff', fontWeight: 700, fontSize: '1rem',
                  borderRadius: 9999, padding: '16px 36px', border: 'none', cursor: 'pointer',
                  boxShadow: '0 0 32px rgba(13,148,136,.35)',
                }}
              >
                <Zap size={16} /> Synchroniser mon AIO automatiquement
                <ArrowRight size={15} />
              </button>
              <p style={{ color: '#334155', fontSize: '.73rem', marginTop: 10 }}>
                14 jours gratuits · Kompilot optimise votre présence IA en continu
              </p>
            </div>
          </motion.div>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
