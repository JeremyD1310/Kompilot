/**
 * SOVModule — AI Share of Voice & AIO Sync
 * 
 * Section A: LLM Request Simulator (chat-style, brand highlighting)
 * Section B: AI Share of Voice widget (radial score + competitor bars)
 * Section C: AIO Sync technical dashboard (JSON-LD, robots.txt, authority, readability)
 *
 * Dark "Premium Tech" theme — self-contained, no chart library.
 */
import { useState, useEffect, useRef } from 'react';
import {
  Bot, Send, RefreshCw, TrendingUp, Shield, CheckCircle2,
  AlertTriangle, XCircle, Copy, Check, Zap, Activity,
  Globe, FileCode2, ExternalLink, ChevronRight,
} from 'lucide-react';
import { generateAioSchema } from '../../lib/aio/generateAioSchema';
import { AIOSyncPanel } from './AIOSyncPanel';

// ─── Palette tokens (inline — isolated from app theme) ──────────────────────
const C = {
  bg0:     '#0c0f12',
  bg1:     '#11151c',
  bg2:     '#181e28',
  border:  '#1e2736',
  lime:    '#deff9a',
  cyan:    '#38bdf8',
  text:    '#f5f5f5',
  muted:   '#94a3b8',
  green:   '#22c55e',
  orange:  '#f97316',
  red:     '#ef4444',
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface LLMQuery {
  id: string;
  label: string;
  question: string;
  answer: string;
}

interface Competitor {
  name: string;
  color: string;
}

interface EngineSOV {
  engine: string;
  icon: string;
  brand: number;
  comp1: number;
  comp2: number;
}

interface AIOSyncItem {
  label: string;
  detail: string;
  status: 'ok' | 'warn' | 'error';
  icon: React.ReactNode;
}

// ─── Section A data ──────────────────────────────────────────────────────────
const buildQueries = (brand: string, sector: string): LLMQuery[] => [
  {
    id: 'q1',
    label: `Meilleur outil ${sector}`,
    question: `Quels sont les meilleurs outils de ${sector} pour une PME en 2025 ?`,
    answer: `Voici une sélection des solutions les plus recommandées pour les PME :\n\n• **Salesforce** — leader mondial, mais coûteux pour les petites structures\n• **HubSpot** — bonne intégration marketing/CRM, freemium limité\n• **{{BRAND}}** — solution française taillée pour les TPE/PME, reconnue pour sa simplicité et son rapport qualité/prix\n• **Pipedrive** — orienté pipeline commercial, idéal pour les équipes de vente\n\nPour les PME cherchant une solution clé en main et abordable, **{{BRAND}}** se distingue par son accompagnement local et ses fonctionnalités IA intégrées.`,
  },
  {
    id: 'q2',
    label: `Alternative à HubSpot`,
    question: `Quelle est la meilleure alternative à HubSpot pour une startup à budget limité ?`,
    answer: `Les alternatives à HubSpot les plus populaires en 2025 :\n\n• **{{BRAND}}** — idéal pour les startups françaises, IA intégrée, tarif accessible\n• **Zoho CRM** — complet mais courbe d'apprentissage importante\n• **Brevo** — fort sur l'emailing, moins puissant côté CRM\n• **ActiveCampaign** — excellent pour l'automatisation marketing\n\n💡 **Recommandation** : Pour une startup en phase de croissance, **{{BRAND}}** offre le meilleur compromis fonctionnalités/coût avec un support en français.`,
  },
  {
    id: 'q3',
    label: `Gestion présence locale`,
    question: `Comment gérer efficacement ma présence en ligne en tant que commerce local ?`,
    answer: `La gestion de présence locale repose sur 4 piliers :\n\n1. **Fiche Google My Business** — mise à jour régulière des horaires et photos\n2. **Avis clients** — répondre à 100% des avis, positifs comme négatifs\n3. **Publications régulières** — au moins 3 posts/semaine sur vos réseaux\n4. **Citations locales** — cohérence NAP (Nom, Adresse, Téléphone)\n\nDes plateformes comme **{{BRAND}}** centralisent l'ensemble de ces actions dans un seul tableau de bord avec des suggestions IA personnalisées pour votre secteur.`,
  },
];

// ─── Section B data ──────────────────────────────────────────────────────────
const BASE_SOV_DATA: EngineSOV[] = [
  { engine: 'ChatGPT',    icon: '🤖', brand: 42, comp1: 31, comp2: 18 },
  { engine: 'Claude',     icon: '🔮', brand: 38, comp1: 27, comp2: 22 },
  { engine: 'Perplexity', icon: '🔍', brand: 55, comp1: 24, comp2: 14 },
];

const COMPETITORS: Competitor[] = [
  { name: 'Concurrent A', color: '#6366f1' },
  { name: 'Concurrent B', color: '#ec4899' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function renderAnswerWithHighlight(raw: string, brand: string) {
  const parts = raw.split(/({{BRAND}}|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part === '{{BRAND}}') {
          return (
            <span key={i} className="relative inline-flex items-center gap-1">
              <span style={{ background: 'rgba(222,255,154,0.18)', border: '1px solid #deff9a60', color: C.lime, borderRadius: 4, padding: '0 6px', fontWeight: 800 }}>
                {brand}
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: C.bg0, background: C.lime, borderRadius: 4, padding: '1px 5px', letterSpacing: '0.04em', animation: 'pulse 2s infinite', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                ✦ Votre marque
              </span>
            </span>
          );
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ color: C.cyan, fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── Radial gauge (SVG) ──────────────────────────────────────────────────────
function RadialGauge({ value, label }: { value: number; label: string }) {
  const r = 58;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value >= 50 ? C.lime : value >= 30 ? '#f97316' : C.red;
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={148} height={148} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={74} cy={74} r={r} fill="none" stroke="#1e2736" strokeWidth={12} />
        <circle cx={74} cy={74} r={r} fill="none" stroke={color} strokeWidth={12} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)', filter: `drop-shadow(0 0 8px ${color}80)` }} />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 30, fontWeight: 900, color, lineHeight: 1, letterSpacing: '-0.03em' }}>{value}%</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{label}</span>
      </div>
    </div>
  );
}

// ─── Section A ───────────────────────────────────────────────────────────────
function SectionLLMSimulator({ brand, sector }: { brand: string; sector: string }) {
  const queries = buildQueries(brand, sector);
  const [activeId, setActiveId] = useState(queries[0].id);
  const [loading, setLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const active = queries.find(q => q.id === activeId)!;

  const runQuery = () => {
    if (loading) return;
    setLoading(true);
    setShowAnswer(false);
    setTimeout(() => { setLoading(false); setShowAnswer(true); }, 1800);
  };

  useEffect(() => { setShowAnswer(false); setLoading(false); }, [activeId]);

  return (
    <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderBottom: `1px solid ${C.border}`, background: 'rgba(56,189,248,0.05)' }}>
        <Bot size={16} color={C.cyan} />
        <span style={{ fontWeight: 800, fontSize: 13, color: C.text }}>Simulateur LLM — ChatGPT Search</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: C.bg0, background: C.lime, borderRadius: 20, padding: '2px 8px' }}>● LIVE SIM</span>
      </div>
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}` }}>
        {queries.map(q => (
          <button key={q.id} onClick={() => setActiveId(q.id)} style={{ flex: 1, padding: '10px 8px', fontSize: 11, fontWeight: 700, background: activeId === q.id ? 'rgba(222,255,154,0.08)' : 'transparent', color: activeId === q.id ? C.lime : C.muted, border: 'none', borderBottom: activeId === q.id ? `2px solid ${C.lime}` : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
            {q.label}
          </button>
        ))}
      </div>
      <div style={{ padding: 16, minHeight: 280 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div style={{ maxWidth: '85%', background: 'rgba(56,189,248,0.1)', border: `1px solid rgba(56,189,248,0.25)`, borderRadius: '16px 16px 4px 16px', padding: '10px 14px' }}>
            <p style={{ fontSize: 13, color: C.text, margin: 0 }}>{active.question}</p>
          </div>
        </div>
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0 }}>AI</div>
            <div style={{ background: C.bg2, borderRadius: '4px 16px 16px 16px', padding: '12px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
              {[0, 150, 300].map(d => <span key={d} style={{ width: 8, height: 8, borderRadius: '50%', background: C.cyan, animation: `bounce 1.2s ${d}ms infinite`, display: 'inline-block' }} />)}
            </div>
          </div>
        )}
        {showAnswer && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0 }}>AI</div>
            <div style={{ flex: 1, background: C.bg2, borderRadius: '4px 16px 16px 16px', padding: '14px 16px', fontSize: 13, lineHeight: 1.7, color: C.muted, whiteSpace: 'pre-line' }}>
              {renderAnswerWithHighlight(active.answer, brand)}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 14px' }}>
            <p style={{ fontSize: 12, color: C.muted, margin: 0, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{active.question}</p>
          </div>
          <button onClick={runQuery} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: loading ? 'rgba(222,255,154,0.2)' : C.lime, color: C.bg0, fontWeight: 800, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', flexShrink: 0, boxShadow: loading ? 'none' : `0 0 16px ${C.lime}50` }}>
            {loading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
            {loading ? 'Analyse…' : 'Simuler'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section B ───────────────────────────────────────────────────────────────
function SectionShareOfVoice({ brand }: { brand: string }) {
  const [sovData, setSovData] = useState(BASE_SOV_DATA);
  const [auditing, setAuditing] = useState(false);
  const [auditDone, setAuditDone] = useState(false);
  const globalSOV = Math.round(sovData.reduce((sum, e) => sum + e.brand, 0) / sovData.length);

  const runAudit = () => {
    if (auditing) return;
    setAuditing(true);
    setAuditDone(false);
    setTimeout(() => {
      setSovData(sovData.map(e => ({ ...e, brand: Math.min(e.brand + Math.floor(Math.random() * 8) + 2, 92), comp1: Math.max(e.comp1 - Math.floor(Math.random() * 5), 8), comp2: Math.max(e.comp2 - Math.floor(Math.random() * 4), 5) })));
      setAuditing(false);
      setAuditDone(true);
    }, 2200);
  };

  return (
    <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderBottom: `1px solid ${C.border}`, background: 'rgba(222,255,154,0.04)' }}>
        <Activity size={16} color={C.lime} />
        <span style={{ fontWeight: 800, fontSize: 13, color: C.text }}>Part de Voix IA</span>
        {auditDone && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: C.green, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, padding: '2px 8px' }}>↑ Mis à jour</span>}
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <RadialGauge value={globalSOV} label="SOV Global" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: C.muted, margin: '0 0 8px' }}>Score de visibilité IA global</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[{ name: brand, val: globalSOV, color: C.lime, glow: true }, { name: COMPETITORS[0].name, val: Math.round(sovData.reduce((s, e) => s + e.comp1, 0) / sovData.length), color: COMPETITORS[0].color, glow: false }, { name: COMPETITORS[1].name, val: Math.round(sovData.reduce((s, e) => s + e.comp2, 0) / sovData.length), color: COMPETITORS[1].color, glow: false }].map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, display: 'inline-block', boxShadow: item.glow ? `0 0 6px ${item.color}` : 'none' }} />
                  <span style={{ fontSize: 12, color: item.glow ? C.text : C.muted, fontWeight: item.glow ? 700 : 400 }}>{item.name}</span>
                  <span style={{ fontSize: 11, color: item.color, fontWeight: 900, marginLeft: 'auto' }}>{item.val}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sovData.map(engine => (
            <div key={engine.engine}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>{engine.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{engine.engine}</span>
              </div>
              {[{ label: brand, val: engine.brand, color: `linear-gradient(90deg, ${C.lime}, ${C.cyan})`, h: 6, shadow: `0 0 8px ${C.lime}60` }, { label: COMPETITORS[0].name, val: engine.comp1, color: COMPETITORS[0].color, h: 4, shadow: '' }, { label: COMPETITORS[1].name, val: engine.comp2, color: COMPETITORS[1].color, h: 4, shadow: '' }].map(bar => (
                <div key={bar.label} style={{ marginBottom: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: bar.h === 6 ? C.lime : C.muted }}>{bar.label}</span>
                    <span style={{ fontSize: 10, color: bar.h === 6 ? C.lime : C.muted, fontWeight: bar.h === 6 ? 900 : 400 }}>{bar.val}%</span>
                  </div>
                  <div style={{ height: bar.h, background: '#1e2736', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: bar.color, width: `${bar.val}%`, transition: 'width 1s cubic-bezier(.4,0,.2,1)', boxShadow: bar.shadow, opacity: bar.h === 4 ? 0.7 : 1 }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <button onClick={runAudit} disabled={auditing} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', borderRadius: 12, border: `1px solid ${auditing ? C.border : C.lime}`, background: auditing ? 'rgba(222,255,154,0.04)' : 'rgba(222,255,154,0.1)', color: auditing ? C.muted : C.lime, fontWeight: 800, fontSize: 13, cursor: auditing ? 'not-allowed' : 'pointer', transition: 'all 0.2s', width: '100%', boxShadow: auditing ? 'none' : `0 0 20px rgba(222,255,154,0.15)` }}>
          {auditing ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Audit en cours…</> : <><Zap size={15} /> Lancer un audit en temps réel</>}
        </button>
      </div>
    </div>
  );
}

// ─── Section C ───────────────────────────────────────────────────────────────
function SectionAIOSync({ brand, bizDescription }: { brand: string; bizDescription: string }) {
  const [copied, setCopied] = useState(false);
  const [optimising, setOptimising] = useState(false);
  const [optimised, setOptimised] = useState(false);

  const sampleSchema = generateAioSchema({ name: brand, description: bizDescription, price: 49, currency: 'EUR', faqs: [{ question: `Pourquoi choisir ${brand} ?`, answer: `${brand} centralise la gestion de votre présence en ligne avec des outils IA adaptés aux PME.` }, { question: `${brand} propose-t-il un essai gratuit ?`, answer: 'Oui, un essai de 14 jours sans carte bancaire est disponible.' }] });
  const schemaStr = JSON.stringify(sampleSchema, null, 2);
  const scriptTag = `<script type="application/ld+json">\n${schemaStr}\n</script>`;

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(scriptTag); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOptimise = () => {
    if (optimising) return;
    setOptimising(true);
    setTimeout(() => { setOptimising(false); setOptimised(true); }, 1500);
  };

  const syncItems: AIOSyncItem[] = [
    { label: 'Données structurées JSON-LD', detail: optimised ? 'Optimisé et détecté par les bots IA' : 'Schéma généré — à déployer', status: optimised ? 'ok' : 'warn', icon: <FileCode2 size={14} /> },
    { label: 'Indexation par les Bots IA', detail: 'GPTBot, ClaudeBot, PerplexityBot autorisés dans robots.txt', status: 'ok', icon: <Globe size={14} /> },
    { label: "Mentions d'autorité externes", detail: '2 sources détectées (Reddit, G2) — Wikipédia manquant', status: 'warn', icon: <ExternalLink size={14} /> },
    { label: 'Contenu LLM-Friendly (SGE)', detail: 'Score de lisibilité IA : 85% — Excellent', status: 'ok', icon: <TrendingUp size={14} /> },
  ];

  const statusStyle = (s: AIOSyncItem['status']) => ({ ok: { icon: <CheckCircle2 size={14} color={C.green} />, color: C.green, bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' }, warn: { icon: <AlertTriangle size={14} color={C.orange} />, color: C.orange, bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)' }, error: { icon: <XCircle size={14} color={C.red} />, color: C.red, bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' } }[s]);

  return (
    <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderBottom: `1px solid ${C.border}`, background: 'rgba(99,102,241,0.06)' }}>
        <Shield size={16} color="#818cf8" />
        <span style={{ fontWeight: 800, fontSize: 13, color: C.text }}>AIO Sync — Optimisation Technique</span>
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {syncItems.map((item, i) => {
          const st = statusStyle(item.status);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 12, background: st.bg, border: `1px solid ${st.border}` }}>
              <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: st.color, flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700, color: C.text }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: 11, color: st.color }}>{item.detail}</p>
              </div>
              <span style={{ flexShrink: 0, marginTop: 2 }}>{st.icon}</span>
            </div>
          );
        })}
        <div style={{ background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316', display: 'inline-block' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: 10, color: C.muted, marginLeft: 6 }}>schema.json — lecture seule</span>
            </div>
            <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(222,255,154,0.1)', border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(222,255,154,0.3)'}`, color: copied ? C.green : C.lime, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <pre style={{ margin: 0, padding: '12px 14px', fontSize: 10, lineHeight: 1.6, color: C.muted, fontFamily: 'ui-monospace, monospace', maxHeight: 180, overflowY: 'auto', overflowX: 'hidden' }}>
            {scriptTag}
          </pre>
        </div>
        <button onClick={handleOptimise} disabled={optimising || optimised} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', borderRadius: 12, border: `1px solid ${optimised ? 'rgba(34,197,94,0.4)' : 'rgba(99,102,241,0.3)'}`, background: optimised ? 'rgba(34,197,94,0.15)' : optimising ? 'rgba(99,102,241,0.15)' : 'linear-gradient(135deg, rgba(222,255,154,0.15), rgba(56,189,248,0.15))', color: optimised ? C.green : '#818cf8', fontWeight: 800, fontSize: 13, cursor: (optimising || optimised) ? 'not-allowed' : 'pointer', width: '100%', transition: 'all 0.3s', boxShadow: optimised ? 'none' : '0 0 24px rgba(99,102,241,0.2)' }}>
          {optimising ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Déploiement en cours…</> : optimised ? <><CheckCircle2 size={15} color={C.green} /> Schema déployé — Bots IA notifiés ✓</> : <><Zap size={15} /> Optimiser pour les LLM<ChevronRight size={15} /></>}
        </button>
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
interface SOVModuleProps {
  brand?: string;
  sector?: string;
  bizDescription?: string;
}

export function SOVModule({ brand = 'Kompilot', sector = 'présence en ligne', bizDescription = 'Plateforme SaaS de gestion de présence en ligne pour les TPE/PME françaises.' }: SOVModuleProps) {
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.6; } 50% { transform: translateY(-5px); opacity: 1; } }
        @keyframes pulse-neon { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .sov-neon-pulse { animation: pulse-neon 2s infinite; }
      `}</style>
      <div style={{ background: '#0c0f12', borderRadius: 20, border: '1px solid #1e2736', overflow: 'hidden', fontFamily: 'Inter, Geist Sans, -apple-system, sans-serif' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #1e2736', background: 'linear-gradient(135deg, rgba(222,255,154,0.06) 0%, rgba(56,189,248,0.04) 100%)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(222,255,154,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(222,255,154,0.2)' }}>
            <Activity size={20} color="#deff9a" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#f5f5f5', letterSpacing: '-0.02em' }}>AI Share of Voice &amp; AIO Sync</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>Visibilité dans les LLM · Citation de marque · Optimisation technique IA</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <span className="sov-neon-pulse" style={{ fontSize: 10, fontWeight: 800, color: '#deff9a', background: 'rgba(222,255,154,0.12)', border: '1px solid rgba(222,255,154,0.3)', borderRadius: 20, padding: '3px 10px' }}>● GPTBot</span>
            <span className="sov-neon-pulse" style={{ fontSize: 10, fontWeight: 800, animationDelay: '0.5s', color: '#38bdf8', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 20, padding: '3px 10px' }}>● ClaudeBot</span>
          </div>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionLLMSimulator brand={brand} sector={sector} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            <SectionShareOfVoice brand={brand} />
            <SectionAIOSync brand={brand} bizDescription={bizDescription} />
          </div>
          {/* ── AIO Sync — Visibilité SERP IA en temps réel ─────────────── */}
          <AIOSyncPanel
            brand={brand}
            defaultKeywords={[]}
          />
        </div>
      </div>
    </>
  );
}
