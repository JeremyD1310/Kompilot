/**
 * AIOSyncPanel — Suivi de visibilité IA via SerpApi (Google + Bing)
 *
 * Affiche pour chaque mot-clé suivi :
 *   • Statut de visibilité : "Détecté dans les sources IA" / "Cité" / "Non trouvé"
 *   • Moteurs détecteurs (Google → ChatGPT Search/Gemini, Bing → Copilot)
 *   • Position de la première mention et score de visibilité 0–100
 *   • Date de la dernière analyse
 *
 * Thème : dark "Premium Tech" aligné sur SOVModule (palette C partagée en props).
 * Autonome : peut être utilisé en standalone ou intégré dans SOVModule.
 *
 * Usage :
 *   <AIOSyncPanel brand="Kompilot" defaultKeywords={["logiciel PME"]} />
 */

import { useState, useCallback } from 'react';
import { blink } from '@/blink/client';
import {
  Search, Plus, X, RefreshCw, CheckCircle2, XCircle,
  AlertTriangle, Activity, TrendingUp, Clock, Zap,
  Globe, Monitor,
} from 'lucide-react';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

// ── Palette inline (cohérente avec SOVModule) ─────────────────────────────────

const C = {
  bg0:    '#0c0f12',
  bg1:    '#11151c',
  bg2:    '#181e28',
  border: '#1e2736',
  lime:   '#deff9a',
  cyan:   '#38bdf8',
  text:   '#f5f5f5',
  muted:  '#94a3b8',
  green:  '#22c55e',
  orange: '#f97316',
  red:    '#ef4444',
  indigo: '#818cf8',
};

// ── Types (miroir du backend aioSyncService.ts) ───────────────────────────────

interface SerpOrganicResult {
  position:   number;
  title:      string;
  link:       string;
  snippet:    string;
  brandCited: boolean;
}

interface EngineResult {
  engine:        'google' | 'bing';
  label:         string;
  detected:      boolean;
  firstPosition: number | null;
  firstSnippet:  string | null;
  mentionCount:  number;
  inAiOverview:  boolean;
  topResults:    SerpOrganicResult[];
  durationMs:    number;
}

interface AiVisibilityResult {
  keyword:          string;
  brandName:        string;
  globalDetected:   boolean;
  status:           'VISIBLE' | 'CITED' | 'NOT_FOUND';
  visibilityScore:  number;
  engines:          EngineResult[];
  analyzedAt:       string;
  totalDurationMs:  number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Formatte une date ISO en heure locale française */
function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  } catch { return iso; }
}

/** Couleur + label selon le statut de visibilité */
function statusMeta(status: AiVisibilityResult['status'] | null) {
  switch (status) {
    case 'VISIBLE':   return { color: C.green,  label: 'Détecté dans les sources IA',  icon: <CheckCircle2 size={14} /> };
    case 'CITED':     return { color: C.orange, label: 'Cité (position > 3)',           icon: <AlertTriangle size={14} /> };
    case 'NOT_FOUND': return { color: C.red,    label: 'Non trouvé',                   icon: <XCircle size={14} /> };
    default:          return { color: C.muted,  label: 'Analyse en attente',           icon: <Clock size={14} /> };
  }
}

/** Icône par moteur */
function engineIcon(engine: 'google' | 'bing') {
  return engine === 'google'
    ? <Globe size={12} color={C.cyan} />
    : <Monitor size={12} color={C.indigo} />;
}

// ── Sous-composant : carte résultat d'un mot-clé ─────────────────────────────

interface KeywordResultCardProps {
  result:   AiVisibilityResult;
  onRerun:  () => void;
  loading:  boolean;
}

function KeywordResultCard({ result, onRerun, loading }: KeywordResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const sm = statusMeta(result.status);

  return (
    <div style={{
      background: C.bg2, border: `1px solid ${C.border}`,
      borderRadius: 14, overflow: 'hidden',
    }}>
      {/* En-tête résultat */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
        background: 'rgba(255,255,255,0.02)',
      }}>
        <span style={{ color: sm.color, flexShrink: 0 }}>{sm.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {result.keyword}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: sm.color }}>{sm.label}</p>
        </div>

        {/* Score */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '4px 10px', borderRadius: 10,
          background: `rgba(${result.visibilityScore > 60 ? '34,197,94' : result.visibilityScore > 30 ? '249,115,22' : '239,68,68'},0.12)`,
          border: `1px solid rgba(${result.visibilityScore > 60 ? '34,197,94' : result.visibilityScore > 30 ? '249,115,22' : '239,68,68'},0.3)`,
        }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: sm.color, lineHeight: 1 }}>{result.visibilityScore}</span>
          <span style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>score</span>
        </div>

        {/* Relancer */}
        <button
          onClick={onRerun}
          disabled={loading}
          title="Relancer l'analyse"
          style={{
            padding: 6, borderRadius: 8, border: `1px solid ${C.border}`,
            background: 'rgba(255,255,255,0.04)', cursor: loading ? 'not-allowed' : 'pointer',
            color: C.muted, display: 'flex', alignItems: 'center',
          }}
        >
          <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
        </button>
      </div>

      {/* Moteurs */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {result.engines.map(e => (
          <div key={e.engine} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 10,
            background: e.detected ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
            border: `1px solid ${e.detected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)'}`,
          }}>
            {engineIcon(e.engine)}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.text }}>{e.label}</p>
              {e.firstSnippet && (
                <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.firstSnippet.slice(0, 80)}…
                </p>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {e.detected ? (
                <>
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.green }}>
                    #{e.firstPosition}
                  </span>
                  {e.inAiOverview && (
                    <span style={{ display: 'block', fontSize: 9, color: C.cyan, fontWeight: 700, textTransform: 'uppercase' }}>AI Overview</span>
                  )}
                </>
              ) : (
                <span style={{ fontSize: 10, color: C.red, fontWeight: 600 }}>Absent</span>
              )}
            </div>
          </div>
        ))}

        {/* Footer : date + toggle détails */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: C.muted }}>
            <Clock size={10} /> {fmtDate(result.analyzedAt)} · {(result.totalDurationMs / 1000).toFixed(1)}s
          </span>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{ fontSize: 10, color: C.indigo, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            {expanded ? 'Masquer les extraits' : 'Voir les extraits'}
          </button>
        </div>

        {/* Extraits SERP (collapsible) */}
        {expanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            {result.engines.flatMap(e =>
              e.topResults.filter(r => r.brandCited).map((r, i) => (
                <div key={`${e.engine}-${i}`} style={{
                  padding: '8px 12px', borderRadius: 10,
                  background: 'rgba(56,189,248,0.06)', border: `1px solid rgba(56,189,248,0.15)`,
                }}>
                  <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: C.cyan }}>
                    {engineIcon(e.engine)} #{r.position} — {e.engine.toUpperCase()}
                  </p>
                  <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 600, color: C.text }}>{r.title}</p>
                  <p style={{ margin: 0, fontSize: 10, color: C.muted, lineHeight: 1.5 }}>{r.snippet}</p>
                </div>
              ))
            )}
            {result.engines.every(e => e.topResults.filter(r => r.brandCited).length === 0) && (
              <p style={{ margin: 0, fontSize: 11, color: C.muted, textAlign: 'center', padding: 8 }}>
                Aucun extrait avec mention de la marque.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface AIOSyncPanelProps {
  brand?:           string;
  defaultKeywords?: string[];
}

export function AIOSyncPanel({
  brand           = 'Kompilot',
  defaultKeywords = [],
}: AIOSyncPanelProps) {
  const [keywords,    setKeywords]    = useState<string[]>(defaultKeywords);
  const [inputValue,  setInputValue]  = useState('');
  const [results,     setResults]     = useState<Record<string, AiVisibilityResult>>({});
  const [loading,     setLoading]     = useState<Record<string, boolean>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // ── Analyse d'un mot-clé ──────────────────────────────────────────────────

  const runTrack = useCallback(async (keyword: string) => {
    setLoading(prev => ({ ...prev, [keyword]: true }));
    setGlobalError(null);

    try {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/aio/sync/track`, {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword, brandName: brand }),
      });

      const json = await res.json() as AiVisibilityResult & { error?: string; code?: string };

      if (!res.ok) {
        // Erreurs connues avec messages utiles
        if (json.code === 'SERP_MISSING_KEY') {
          setGlobalError('SERP_API_KEY non configurée — contactez l\'administrateur.');
        } else if (json.code === 'SERP_QUOTA') {
          setGlobalError('Quota SerpApi dépassé. Réessayez dans quelques minutes.');
        } else {
          setGlobalError(json.error ?? `Erreur HTTP ${res.status}`);
        }
        return;
      }

      setResults(prev => ({ ...prev, [keyword]: json }));
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(prev => ({ ...prev, [keyword]: false }));
    }
  }, [brand]);

  // ── Ajouter un mot-clé et lancer l'analyse ────────────────────────────────

  const addKeyword = () => {
    const kw = inputValue.trim();
    if (!kw || keywords.includes(kw)) { setInputValue(''); return; }
    const next = [...keywords, kw];
    setKeywords(next);
    setInputValue('');
    runTrack(kw);
  };

  const removeKeyword = (kw: string) => {
    setKeywords(prev => prev.filter(k => k !== kw));
    setResults(prev => { const n = { ...prev }; delete n[kw]; return n; });
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      background: C.bg1, border: `1px solid ${C.border}`,
      borderRadius: 16, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 18px', borderBottom: `1px solid ${C.border}`,
        background: 'rgba(99,102,241,0.06)',
      }}>
        <Activity size={16} color={C.indigo} />
        <span style={{ fontWeight: 800, fontSize: 13, color: C.text }}>
          AIO Sync — Visibilité dans les sources IA
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 700,
          color: C.cyan, background: 'rgba(56,189,248,0.1)',
          border: `1px solid rgba(56,189,248,0.2)`, borderRadius: 8, padding: '2px 8px',
        }}>
          Google · Bing
        </span>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Explication courte */}
        <p style={{ margin: 0, fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
          Vérifie si <strong style={{ color: C.text }}>{brand}</strong> est mentionné dans les résultats Google et Bing —
          les mêmes sources qu'ingèrent <span style={{ color: C.cyan }}>ChatGPT Search</span>,{' '}
          <span style={{ color: C.lime }}>Gemini</span> et <span style={{ color: C.indigo }}>Copilot</span>.
        </p>

        {/* Input ajout mot-clé */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: C.bg0, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: '8px 12px',
          }}>
            <Search size={13} color={C.muted} />
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addKeyword()}
              placeholder='Ex: "logiciel gestion PME", "présence en ligne"…'
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: 12, color: C.text,
              }}
            />
          </div>
          <button
            onClick={addKeyword}
            disabled={!inputValue.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10, fontWeight: 700, fontSize: 12,
              background: inputValue.trim() ? 'linear-gradient(135deg, rgba(222,255,154,0.2), rgba(56,189,248,0.2))' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${inputValue.trim() ? 'rgba(222,255,154,0.3)' : C.border}`,
              color: inputValue.trim() ? C.lime : C.muted,
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            <Plus size={14} /> Analyser
          </button>
        </div>

        {/* Tags mots-clés actifs */}
        {keywords.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {keywords.map(kw => (
              <span key={kw} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 20,
                background: 'rgba(129,140,248,0.1)', border: `1px solid rgba(129,140,248,0.25)`,
                fontSize: 11, fontWeight: 600, color: C.indigo,
              }}>
                {loading[kw] && <RefreshCw size={10} style={{ animation: 'spin 1s linear infinite', color: C.indigo }} />}
                {kw}
                <button onClick={() => removeKeyword(kw)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: 0 }}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Erreur globale */}
        {globalError && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 14px', borderRadius: 12,
            background: 'rgba(239,68,68,0.08)', border: `1px solid rgba(239,68,68,0.25)`,
          }}>
            <AlertTriangle size={14} color={C.red} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 11, color: C.red }}>{globalError}</p>
          </div>
        )}

        {/* État vide */}
        {keywords.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(129,140,248,0.1)', border: `1px solid rgba(129,140,248,0.2)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={22} color={C.indigo} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>Aucun mot-clé suivi</p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: C.muted }}>
                Entrez un mot-clé pour lancer votre première analyse SerpApi.
              </p>
            </div>
            {/* Suggestions rapides */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {[`logiciel gestion ${brand}`, 'présence en ligne PME', 'gestion avis Google'].map(s => (
                <button
                  key={s}
                  onClick={() => { setInputValue(s); }}
                  style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: 'rgba(56,189,248,0.08)', border: `1px solid rgba(56,189,248,0.2)`,
                    color: C.cyan, cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Résultats par mot-clé */}
        {keywords.map(kw => {
          const result = results[kw];
          const isLoading = loading[kw] ?? false;

          if (!result) {
            // Skeleton pendant le chargement
            return (
              <div key={kw} style={{
                background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14,
                padding: '16px', display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isLoading && <RefreshCw size={13} color={C.indigo} style={{ animation: 'spin 1s linear infinite' }} />}
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{kw}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>
                    {isLoading ? 'Analyse en cours via SerpApi…' : 'En attente'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[1, 2].map(i => (
                    <div key={i} style={{
                      height: 40, borderRadius: 10,
                      background: `rgba(255,255,255,0.03)`,
                      border: `1px solid ${C.border}`,
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                  ))}
                </div>
              </div>
            );
          }

          return (
            <KeywordResultCard
              key={kw}
              result={result}
              onRerun={() => runTrack(kw)}
              loading={isLoading}
            />
          );
        })}

        {/* Légende sources */}
        <div style={{
          display: 'flex', gap: 14, flexWrap: 'wrap',
          padding: '10px 14px', borderRadius: 12,
          background: C.bg0, border: `1px solid ${C.border}`,
        }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', width: '100%' }}>Sources analysées</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={11} color={C.cyan} />
            <span style={{ fontSize: 10, color: C.muted }}>Google → <span style={{ color: C.text }}>ChatGPT Search, Gemini</span></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Monitor size={11} color={C.indigo} />
            <span style={{ fontSize: 10, color: C.muted }}>Bing → <span style={{ color: C.text }}>Copilot, ChatGPT Browser</span></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={11} color={C.lime} />
            <span style={{ fontSize: 10, color: C.muted }}>Score 0–100 = position × moteurs détecteurs</span>
          </div>
        </div>

      </div>

      {/* Keyframes CSS inline */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
