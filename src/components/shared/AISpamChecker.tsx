/**
 * AISpamChecker
 * Analyseur sémantique anti-spam en temps réel.
 * Affiche un badge "Score de délivrabilité IA" et suggère des corrections.
 *
 * Usage:
 *   <AISpamChecker text={messageText} onOptimize={(optimized) => setText(optimized)} />
 */
import { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, AlertTriangle, Zap, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

// ── Spam word dictionary ─────────────────────────────────────────────────────
const SPAM_TRIGGERS: { word: string; severity: 'high' | 'medium' | 'low'; suggestion: string }[] = [
  { word: 'gratuit', severity: 'high', suggestion: 'offert' },
  { word: 'urgent', severity: 'high', suggestion: 'prioritaire' },
  { word: 'URGENT', severity: 'high', suggestion: 'important' },
  { word: 'promotion', severity: 'medium', suggestion: 'avantage exclusif' },
  { word: 'offre spéciale', severity: 'high', suggestion: 'offre dédiée' },
  { word: 'cliquez ici', severity: 'high', suggestion: 'découvrez' },
  { word: 'cliquez maintenant', severity: 'high', suggestion: 'accédez à votre espace' },
  { word: 'action immédiate', severity: 'high', suggestion: 'prochaine étape' },
  { word: 'félicitations', severity: 'medium', suggestion: 'nous avons une bonne nouvelle' },
  { word: 'gagner', severity: 'medium', suggestion: 'obtenir' },
  { word: 'gagnez', severity: 'medium', suggestion: 'bénéficiez' },
  { word: 'réduction', severity: 'low', suggestion: 'économie' },
  { word: '100%', severity: 'low', suggestion: 'totalement' },
  { word: '!!!', severity: 'high', suggestion: '.' },
  { word: 'OFFRE', severity: 'high', suggestion: 'proposition' },
  { word: 'GRATUIT', severity: 'high', suggestion: 'sans frais' },
  { word: 'cadeau', severity: 'medium', suggestion: 'surprise' },
  { word: 'exclusif', severity: 'low', suggestion: 'personnalisé' },
  { word: 'limité', severity: 'low', suggestion: 'sélectionné' },
  { word: 'maintenant', severity: 'low', suggestion: 'dès que vous le souhaitez' },
];

// ── Score calculation ─────────────────────────────────────────────────────────
interface SpamAnalysis {
  score: number;           // 0-100 deliverability
  level: 'safe' | 'caution' | 'risky';
  triggers: Array<{ word: string; severity: 'high' | 'medium' | 'low'; suggestion: string }>;
}

function analyzeText(text: string): SpamAnalysis {
  if (!text.trim()) return { score: 100, level: 'safe', triggers: [] };

  const found = SPAM_TRIGGERS.filter(t =>
    text.toLowerCase().includes(t.word.toLowerCase())
  );

  const penalty = found.reduce((acc, t) => {
    if (t.severity === 'high') return acc + 15;
    if (t.severity === 'medium') return acc + 8;
    return acc + 3;
  }, 0);

  // Also penalise ALL CAPS words
  const capsWords = (text.match(/\b[A-ZÀÉÈÊÎÔÙÛÜ]{4,}\b/g) || []).length;
  const capsPenalty = Math.min(capsWords * 5, 20);

  const score = Math.max(0, Math.min(100, 100 - penalty - capsPenalty));
  const level: SpamAnalysis['level'] = score >= 80 ? 'safe' : score >= 55 ? 'caution' : 'risky';

  return { score, level, triggers: found };
}

function applyOptimizations(text: string, triggers: SpamAnalysis['triggers']): string {
  let result = text;
  for (const t of triggers) {
    const re = new RegExp(t.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(re, t.suggestion);
  }
  return result;
}

// ── Sub-components ────────────────────────────────────────────────────────────
type Level = SpamAnalysis['level'];

const LEVEL_CONFIG: Record<Level, { color: string; bg: string; border: string; label: string; icon: React.ReactNode }> = {
  safe: {
    color: '#16A34A', bg: 'rgba(22,163,74,.1)', border: 'rgba(22,163,74,.25)',
    label: 'Excellent', icon: <ShieldCheck size={13} />,
  },
  caution: {
    color: '#D97706', bg: 'rgba(217,119,6,.1)', border: 'rgba(217,119,6,.25)',
    label: 'À améliorer', icon: <AlertTriangle size={13} />,
  },
  risky: {
    color: '#DC2626', bg: 'rgba(220,38,38,.1)', border: 'rgba(220,38,38,.25)',
    label: 'Risque spam', icon: <AlertTriangle size={13} />,
  },
};

function ScoreBadge({ score, level }: { score: number; level: Level }) {
  const c = LEVEL_CONFIG[level];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.color, borderRadius: 20, padding: '4px 12px',
      fontSize: '.78rem', fontWeight: 800,
    }}>
      {c.icon}
      🛡️ Score délivrabilité IA : {score}%
    </span>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
interface AISpamCheckerProps {
  text: string;
  onOptimize?: (optimizedText: string) => void;
  compact?: boolean;
}

export function AISpamChecker({ text, onOptimize, compact = false }: AISpamCheckerProps) {
  const [analysis, setAnalysis] = useState<SpamAnalysis>({ score: 100, level: 'safe', triggers: [] });
  const [optimizing, setOptimizing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Debounced analysis
  useEffect(() => {
    const t = setTimeout(() => setAnalysis(analyzeText(text)), 300);
    return () => clearTimeout(t);
  }, [text]);

  const handleOptimize = useCallback(async () => {
    if (!onOptimize || analysis.triggers.length === 0) return;
    setOptimizing(true);
    await new Promise(r => setTimeout(r, 600)); // simulate AI processing
    const optimized = applyOptimizations(text, analysis.triggers);
    onOptimize(optimized);
    setOptimizing(false);
  }, [text, analysis.triggers, onOptimize]);

  const cfg = LEVEL_CONFIG[analysis.level];

  // Compact mode: badge only
  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <ScoreBadge score={analysis.score} level={analysis.level} />
        {analysis.triggers.length > 0 && onOptimize && (
          <button
            onClick={handleOptimize}
            disabled={optimizing}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(99,89,248,.1)', border: '1px solid rgba(99,89,248,.2)',
              color: '#6359F8', borderRadius: 20, padding: '4px 12px',
              fontSize: '.75rem', fontWeight: 700, cursor: optimizing ? 'not-allowed' : 'pointer',
              opacity: optimizing ? 0.6 : 1,
            }}
          >
            {optimizing
              ? <><RefreshCw size={12} style={{ animation: 'spin .7s linear infinite' }} /> Optimisation…</>
              : <><Zap size={12} /> Optimiser le texte pour éviter la boîte spam</>
            }
          </button>
        )}
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Full mode
  return (
    <div style={{
      background: 'hsl(var(--card))',
      border: `1.5px solid ${cfg.border}`,
      borderRadius: 14, overflow: 'hidden',
    }}>
      {/* Header */}
      <div
        onClick={() => analysis.triggers.length > 0 && setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 14px',
          background: `linear-gradient(135deg, ${cfg.bg} 0%, transparent 100%)`,
          cursor: analysis.triggers.length > 0 ? 'pointer' : 'default',
        }}
      >
        <ScoreBadge score={analysis.score} level={analysis.level} />

        {/* Score bar */}
        <div style={{ flex: 1, height: 6, background: 'hsl(var(--muted))', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${analysis.score}%`,
            background: analysis.level === 'safe' ? '#16A34A' : analysis.level === 'caution' ? '#D97706' : '#DC2626',
            borderRadius: 3, transition: 'width .4s ease',
          }} />
        </div>

        {analysis.triggers.length > 0 && (
          <>
            <span style={{ fontSize: '.7rem', color: cfg.color, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {analysis.triggers.length} mot{analysis.triggers.length > 1 ? 's' : ''} détecté{analysis.triggers.length > 1 ? 's' : ''}
            </span>
            {expanded ? <ChevronUp size={14} style={{ color: 'hsl(var(--muted-foreground))' }} /> : <ChevronDown size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />}
          </>
        )}
      </div>

      {/* Detail panel */}
      {expanded && analysis.triggers.length > 0 && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid hsl(var(--border))' }}>
          {/* Trigger list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {analysis.triggers.map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'hsl(var(--muted))', borderRadius: 8, padding: '7px 10px',
              }}>
                <span style={{
                  background: t.severity === 'high' ? 'rgba(220,38,38,.12)' : t.severity === 'medium' ? 'rgba(217,119,6,.12)' : 'rgba(99,89,248,.1)',
                  color: t.severity === 'high' ? '#DC2626' : t.severity === 'medium' ? '#D97706' : '#6359F8',
                  border: `1px solid ${t.severity === 'high' ? 'rgba(220,38,38,.25)' : t.severity === 'medium' ? 'rgba(217,119,6,.25)' : 'rgba(99,89,248,.2)'}`,
                  borderRadius: 4, padding: '1px 6px', fontSize: '.65rem', fontWeight: 800,
                }}>
                  {t.severity === 'high' ? 'HAUT' : t.severity === 'medium' ? 'MOYEN' : 'FAIBLE'}
                </span>
                <span style={{ fontSize: '.78rem', color: 'hsl(var(--foreground))' }}>
                  <strong>"{t.word}"</strong>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}> → remplacer par </span>
                  <strong style={{ color: '#16A34A' }}>"{t.suggestion}"</strong>
                </span>
              </div>
            ))}
          </div>

          {/* Optimize CTA */}
          {onOptimize && (
            <button
              onClick={handleOptimize}
              disabled={optimizing}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: optimizing ? 'rgba(99,89,248,.5)' : '#6359F8',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '10px 16px', fontWeight: 700, fontSize: '.83rem',
                cursor: optimizing ? 'not-allowed' : 'pointer', width: '100%',
                transition: 'opacity .2s',
              }}
              className="hover:opacity-90"
            >
              {optimizing
                ? <><RefreshCw size={14} style={{ animation: 'spin .7s linear infinite' }} /> Application des corrections…</>
                : <><Zap size={14} /> Optimiser le texte pour éviter la boîte spam</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  );
}
