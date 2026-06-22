/**
 * GeoRadarSection — "Radar des Recommandations IA 🤖"
 * Embedded inside AuditFlashModal results phase.
 * Shows simulated GEO visibility score, per-AI query results,
 * Share-of-Voice pie chart, and contextual CTAs.
 */
import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, ExternalLink, Loader2, Mic, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { blink } from '../../blink/client';
import { RouteErrorBoundary } from '../layout/AppErrorBoundary';
import { SafeModeBanner } from '../shared/SafeModeBanner';
import { CreditCostBadge, useCreditGuard } from '../shared/CreditCostBadge';
import { useAsyncJob } from '../../hooks/useAsyncJob';
import { TermTooltip } from '../shared/TermTooltip';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GeoQuery {
  aiName: string;
  aiEmoji: string;
  aiColor: string; // tailwind bg class for badge
  question: string;
  cited: boolean;
  position?: number; // position in AI response if cited
  competitors: string[]; // competitors cited when not cited
  rawResponse: string; // simulated raw AI answer
  sourcesIndexed?: string[]; // URLs Perplexity-style cites
}

export interface GeoResult {
  geoScore: number; // 0–100
  businessName: string;
  city: string;
  sector: string;
  queries: GeoQuery[];
  missedRequests: number; // estimated local AI queries per month
  missingKeywords: string[]; // semantic keywords absent from posts
  topCompetitor: string;
  topCompetitorReviews: number;
  userReviewsAge: string; // "il y a 23 jours"
}

// ── Score → color helpers ──────────────────────────────────────────────────────

function geoScoreColor(score: number) {
  if (score >= 60) return '#10b981';
  if (score >= 35) return '#f59e0b';
  return '#ef4444';
}

function geoScoreLabel(score: number) {
  if (score >= 60) return 'Présence IA correcte';
  if (score >= 35) return 'Visibilité IA faible';
  return 'Invisible sur les IA 🚨';
}

// ── Per-model score weights ────────────────────────────────────────────────────
const MODEL_WEIGHTS: Record<string, { weight: number; color: string; bg: string; border: string; dot: string; label: string }> = {
  ChatGPT: {
    weight: 40,
    color: '#10b981',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-800/60',
    dot: '🟢',
    label: 'ChatGPT (OpenAI)',
  },
  Gemini: {
    weight: 35,
    color: '#6366f1',
    bg: 'bg-indigo-950/40',
    border: 'border-indigo-800/60',
    dot: '🔵',
    label: 'Gemini (Google)',
  },
  Perplexity: {
    weight: 25,
    color: '#94a3b8',
    bg: 'bg-slate-900/60',
    border: 'border-slate-700/60',
    dot: '⚪',
    label: 'Perplexity AI',
  },
};

function computeWeightedScore(queries: GeoQuery[]): number {
  let total = 0;
  queries.forEach(q => {
    const meta = MODEL_WEIGHTS[q.aiName];
    if (meta && q.cited) total += meta.weight;
  });
  return total;
}

// ── Cross-model alert ─────────────────────────────────────────────────────────

function CrossModelAlerts({ queries }: { queries: GeoQuery[] }) {
  const byModel: Record<string, boolean> = {};
  queries.forEach(q => { byModel[q.aiName] = q.cited; });
  const alerts: { icon: string; text: string; color: string }[] = [];

  if (byModel['ChatGPT'] && !byModel['Gemini']) {
    alerts.push({
      icon: '⚠️',
      text: 'Risque de perte de clients sur mobile Android — vous êtes visible sur ChatGPT mais invisible sur Gemini, moteur par défaut de Google.',
      color: 'border-amber-800/50 bg-amber-950/30 text-amber-400',
    });
  }
  if (!byModel['ChatGPT'] && byModel['Gemini']) {
    alerts.push({
      icon: '⚠️',
      text: 'Invisible sur ChatGPT — plus de 180 millions d\'utilisateurs posent des questions locales sur ChatGPT chaque mois.',
      color: 'border-amber-800/50 bg-amber-950/30 text-amber-400',
    });
  }
  if (!byModel['Perplexity'] && (byModel['ChatGPT'] || byModel['Gemini'])) {
    alerts.push({
      icon: '📌',
      text: 'Perplexity ne vous indexe pas — ce moteur est très utilisé par les 25-40 ans actifs qui comparent les commerces locaux.',
      color: 'border-slate-700/50 bg-slate-900/40 text-slate-400',
    });
  }
  if (alerts.length === 0 && !byModel['ChatGPT'] && !byModel['Gemini'] && !byModel['Perplexity']) {
    alerts.push({
      icon: '🚨',
      text: 'Aucun moteur IA ne vous recommande actuellement. Chaque jour, des clients potentiels partent chez un concurrent.',
      color: 'border-red-800/50 bg-red-950/30 text-red-400',
    });
  }

  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={i} className={`rounded-lg border px-3 py-2.5 flex items-start gap-2 ${a.color}`}>
          <span className="shrink-0 text-sm mt-0.5">{a.icon}</span>
          <p className="text-[11px] font-semibold leading-relaxed">{a.text}</p>
        </div>
      ))}
    </div>
  );
}

// ── Source type badge helper ───────────────────────────────────────────────────

function getSourceBadge(url: string): { label: string; className: string } {
  const u = url.toLowerCase();
  if (u.includes('google.com/maps')) return { label: '📍 Google Maps', className: 'bg-blue-950/60 border-blue-700/60 text-blue-300' };
  if (u.includes('tripadvisor')) return { label: '⭐ Avis', className: 'bg-amber-950/60 border-amber-700/60 text-amber-300' };
  if (u.includes('leboncoin')) return { label: '📋 Annonce', className: 'bg-orange-950/60 border-orange-700/60 text-orange-300' };
  // Local press / news article detection
  if (/actu\.fr|leparisien|lefigaro|leprogres|lyonnaise|madeinmarseille|lamontagne|ouest-france|sudouest|lanouvellerepublique|lepopulaire|larep|nicematin|ladepeche|varmatin|courrier-picard|voixdunord|estrepublicain|alsace\.fr|ledauphine|lalsace\.fr|presse-ocean|lemensetra|lejdd|lequipe|lepoint|lexpress|marianne/.test(u)) {
    return { label: '📰 Presse locale', className: 'bg-violet-950/60 border-violet-700/60 text-violet-300' };
  }
  // Generic news/blog article
  if (/article|actualite|actu|journal|news|blog|magazine|communique/.test(u)) {
    return { label: '📰 Article', className: 'bg-violet-950/60 border-violet-700/60 text-violet-300' };
  }
  return { label: '🌐 Web', className: 'bg-slate-800/60 border-slate-600/60 text-slate-400' };
}

function extractDomain(url: string): string {
  try { return new URL('https://' + url.replace(/^https?:\/\//, '')).hostname.replace('www.', ''); }
  catch { return url.split('/')[0]; }
}

// ── MultiModelPanel — 3-section display ───────────────────────────────────────

function MultiModelPanel({ queries, businessName }: { queries: GeoQuery[]; businessName: string }) {
  const [rawOpen, setRawOpen] = useState<string | null>(null);
  const openQuery = queries.find(q => q.aiName === rawOpen) || null;
  const bizFirst = businessName.toLowerCase().split(' ')[0];

  return (
    <>
      <div className="space-y-3">
        {queries.map((q) => {
          const meta = MODEL_WEIGHTS[q.aiName] || { bg: 'bg-slate-900', border: 'border-slate-700', dot: '🔘', label: q.aiName, color: '#94a3b8', weight: 33 };
          return (
            <div key={q.aiName} className={`rounded-xl border ${meta.border} ${meta.bg} overflow-hidden`}>
              {/* Model header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                <span className="text-lg shrink-0">{meta.dot}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-extrabold text-[#e6edf3]">{meta.label}</p>
                  <p className="text-[10px] text-[#8b949e] truncate">« {q.question} »</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {q.cited ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-900/60 border border-emerald-700 text-emerald-400 text-[9px] font-extrabold px-2 py-0.5">
                      ✅ RECOMMANDÉ #{q.position ?? 1}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-red-900/60 border border-red-700 text-red-400 text-[9px] font-extrabold px-2 py-0.5">
                      ❌ ABSENT
                    </span>
                  )}
                  <span className="text-[9px] font-bold text-[#8b949e]">{meta.weight}%</span>
                </div>
              </div>
              {/* Body */}
              <div className="px-4 py-3 space-y-2">
                {!q.cited && q.competitors.length > 0 && (
                  <div className="rounded-lg bg-red-950/30 border border-red-800/30 px-3 py-2">
                    <p className="text-[10px] font-bold text-red-400 mb-1">Concurrents recommandés à votre place :</p>
                    <div className="flex flex-wrap gap-1.5">
                      {q.competitors.map((c, i) => (
                        <span key={i} className="text-[10px] text-[#e6edf3] font-semibold bg-red-950/40 rounded px-1.5 py-0.5">#{i + 1} {c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {q.cited && (
                  <div className="rounded-lg bg-emerald-950/30 border border-emerald-800/30 px-3 py-2">
                    <p className="text-[10px] text-emerald-400 font-semibold">✅ Ce moteur vous cite — continuez à publier régulièrement pour maintenir ce positionnement.</p>
                  </div>
                )}

                {/* ── Rich Sources Section ── */}
                <div className="rounded-lg bg-[#161b22] border border-[#30363d] px-3 py-2.5 space-y-1.5">
                  <p className="text-[9px] font-bold text-[#8b949e] uppercase tracking-wide">🔗 Sources utilisées par l'IA pour cette recommandation :</p>
                  {q.sourcesIndexed && q.sourcesIndexed.length > 0 ? (
                    q.sourcesIndexed.map((url, i) => {
                      const badge = getSourceBadge(url);
                      const domain = extractDomain(url);
                      const isYou = url.toLowerCase().includes(bizFirst);
                      return (
                        <div key={i} className="flex items-center gap-1.5 min-w-0">
                          <ExternalLink size={9} className="text-[#58a6ff] shrink-0" />
                          <span className="text-[10px] text-[#58a6ff] truncate flex-1 min-w-0">{domain}</span>
                          <span className={`shrink-0 text-[8px] font-bold rounded border px-1 py-0.5 ${badge.className}`}>{badge.label}</span>
                          {isYou ? (
                            <span className="shrink-0 text-[8px] font-bold rounded bg-emerald-950/60 border border-emerald-700/60 text-emerald-400 px-1 py-0.5">✅ Vous</span>
                          ) : (
                            <span className="shrink-0 text-[8px] font-bold rounded bg-red-950/60 border border-red-700/60 text-red-400 px-1 py-0.5">⚠ Pas vous</span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[10px] text-[#8b949e] leading-relaxed">
                      {q.aiName === 'Perplexity'
                        ? '⚠️ Aucune source indexée détectée.'
                        : '💡 ChatGPT / Gemini ne publient pas leurs sources — l\'IA s\'est basée sur son entraînement et vos données publiques.'}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setRawOpen(q.aiName)}
                  className="flex items-center gap-1.5 text-[10px] text-[#58a6ff] hover:text-[#79c0ff] transition-colors font-semibold"
                >
                  👁️ Voir la réponse brute
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {openQuery && (
        <RawResponseModal query={openQuery} open={!!rawOpen} onClose={() => setRawOpen(null)} businessName={businessName} />
      )}
    </>
  );
}

// ── SplitViewBeforeAfter — Before/After AI response comparison ────────────────

function SplitViewBeforeAfter({
  query,
  businessName,
}: {
  query: GeoQuery;
  businessName: string;
}) {
  const competitor = query.competitors[0] ?? 'concurrent';

  const truncate = (text: string, max = 280) =>
    text.length > max ? text.slice(0, max) + '…' : text;

  const beforeText = truncate(query.rawResponse.replace(/\*\*/g, ''));

  const afterText = truncate(
    query.rawResponse
      .replace(/\[CONCURRENT\]/g, '')
      .split(competitor).join(businessName) +
      '\n\n★ 4,9/5 — Recommandé par l\'IA locale ✅'
  );

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wide text-center">
        ⚡ Simulation visuelle — Effet Conquête GEA
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Before */}
        <div className="rounded-xl border border-red-800/50 bg-red-950/25 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-red-800/30 bg-red-950/40">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <p className="text-[10px] font-extrabold text-red-400 uppercase tracking-wide">
              AVANT — ChatGPT aujourd'hui 🔴
            </p>
          </div>
          <div className="px-3 py-2.5 space-y-1">
            <p className="text-[10px] text-[#c9d1d9] leading-relaxed font-mono whitespace-pre-wrap">
              {beforeText}
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[9px] text-red-400 font-bold bg-red-950/60 border border-red-700/50 rounded px-1.5 py-0.5">
                ⚠ {competitor} est cité — pas vous
              </span>
            </div>
          </div>
        </div>
        {/* After */}
        <div
          className="rounded-xl border border-emerald-700/60 bg-emerald-950/20 overflow-hidden"
          style={{ animation: 'shimmer-glow 2s ease-in-out infinite' }}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-emerald-800/30 bg-emerald-950/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wide">
              APRÈS — Avec Kompilot ✨
            </p>
          </div>
          <div className="px-3 py-2.5 space-y-1">
            <p className="text-[10px] text-[#c9d1d9] leading-relaxed font-mono whitespace-pre-wrap">
              {afterText}
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-700/50 rounded px-1.5 py-0.5">
                ✅ {businessName} prend la 1ère place
              </span>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes shimmer-glow { 0%,100% { box-shadow: 0 0 16px rgba(16,185,129,0.15); } 50% { box-shadow: 0 0 32px rgba(16,185,129,0.45), 0 0 50px rgba(251,191,36,0.15); } }`}</style>
    </div>
  );
}

// ── ConqueteGEAPanel ───────────────────────────────────────────────────────────

function ConqueteGEAPanel({
  queries, businessName, missingKeywords, onNavigateCockpit,
}: {
  queries: GeoQuery[];
  businessName: string;
  missingKeywords: string[];
  onNavigateCockpit: (kw?: string) => void;
}) {
  const { fire: fireContent, isActive: isGenerating } = useAsyncJob<string>('seo_article');
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { guard: creditGuard, modalNode: creditModal } = useCreditGuard({ cost: 10, action: 'COUNTER_ATTACK' });

  const target = queries.find(q => !q.cited && q.competitors.length > 0);
  const allCited = !target;

  if (allCited) {
    return (
      <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/20 px-4 py-4 flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5">✅</span>
        <div>
          <p className="text-[12px] font-extrabold text-emerald-300 mb-0.5">Félicitations !</p>
          <p className="text-[11px] text-[#8b949e] leading-relaxed">Vous êtes déjà recommandé par tous les moteurs. Continuez à publier régulièrement.</p>
        </div>
      </div>
    );
  }

  const competitor = target.competitors[0];
  const keyword = missingKeywords[0] || 'mots-clés locaux';

  const handleGenerate = () => {
    creditGuard(async () => {
      setGeneratedContent(null);
      fireContent(
        async () => {
          const prompt = [
            `Commerce: ${businessName}`,
            `Concurrent: ${competitor}`,
            `Mots-clés manquants: ${missingKeywords.join(", ")}`,
            ``,
            "Génère un article de blog de 500 mots hyper-optimisé pour le référencement IA local.",
            "Intègre les mots-clés, la ville, et structure pour ChatGPT/Gemini/Perplexity.",
            "Commence par le titre.",
          ].join("\n");
          const { text } = await blink.ai.generateText({
            messages: [
              { role: "system", content: "Tu es un expert SEO local et GEO. Génère du contenu optimisé pour que les moteurs IA recommandent ce commerce." },
              { role: "user", content: prompt },
            ],
            model: "gpt-4.1-mini",
          });
          return text;
        },
        { onDone: (result) => setGeneratedContent(result as string) },
      );
    }); // end creditGuard
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-teal-800/60 bg-teal-950/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-teal-800/40 bg-teal-950/30">
        <span className="text-lg shrink-0">⚔️</span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-extrabold text-[#e6edf3] tracking-tight">Conseil Stratégique — Conquête GEA</p>
          <p className="text-[10px] text-[#8b949e]">Générez du contenu IA pour prendre la place de vos concurrents</p>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Attack target summary */}
        <p className="text-[11px] text-[#8b949e] leading-relaxed">
          L'IA cite{' '}
          <strong className="text-red-400">{competitor}</strong>{' '}
          grâce à{' '}
          <strong className="text-teal-300">«&nbsp;{keyword}&nbsp;»</strong>.
          Voici comment prendre sa place :
        </p>

        {/* ── Split View Before / After ── */}
        <SplitViewBeforeAfter query={target} businessName={businessName} />

        {/* Generate button */}
        {!generatedContent && (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[12px] font-extrabold py-3 shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98]"
          >
            {isGenerating ? (
              <><Loader2 size={14} className="animate-spin" /> Génération en cours…</>
            ) : (
              <>✨ Prendre la place de {competitor} sur {target.aiName} <CreditCostBadge cost={10} variant="ghost" className="text-white/80" /></>
            )}
          </button>
        )}
        {creditModal}

        {/* Generated content block */}
        {generatedContent && (
          <div className="space-y-2">
            <div className="relative rounded-lg bg-[#0d1117] border border-[#30363d] p-3 max-h-52 overflow-y-auto">
              <pre className="text-[10px] text-[#e6edf3] leading-relaxed font-mono whitespace-pre-wrap">{generatedContent}</pre>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-[#30363d] bg-[#161b22] hover:bg-[#21262d] text-[#e6edf3] text-[10px] font-semibold px-3 py-2 transition-all"
              >
                <Copy size={11} />
                {copied ? 'Copié !' : 'Copier'}
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-1.5 rounded-lg border border-teal-700/60 bg-teal-950/30 hover:bg-teal-950/50 text-teal-300 text-[10px] font-semibold px-3 py-2 transition-all disabled:opacity-50"
              >
                {isGenerating ? <Loader2 size={11} className="animate-spin" /> : '↺'} Régénérer
              </button>
            </div>
            <button
              onClick={() => onNavigateCockpit(missingKeywords[0])}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#30363d] bg-[#161b22] hover:bg-[#21262d] text-[#e6edf3] text-[11px] font-semibold py-2.5 transition-all active:scale-[0.98]"
            >
              📅 Planifier ce post dans le Cockpit IA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Circular gauge ────────────────────────────────────────────────────────────

function GeoGauge({ score }: { score: number }) {
  const R = 44;
  const cx = 56, cy = 56;
  const circumference = 2 * Math.PI * R;
  const offset = circumference * (1 - score / 100);
  const color = geoScoreColor(score);

  return (
    <svg width="112" height="112" viewBox="0 0 112 112" className="shrink-0">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="9" />
      <circle
        cx={cx} cy={cy} r={R}
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 1.4s ease-out' }}
      />
      <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="middle" fontSize="22" fontWeight="800" fill="hsl(var(--foreground))">
        {score}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
        / 100
      </text>
    </svg>
  );
}

// ── Minimal SVG pie chart ─────────────────────────────────────────────────────

interface PieSlice { label: string; pct: number; color: string; isUser?: boolean }

function PieChart({ slices }: { slices: PieSlice[] }) {
  let cumulative = 0;
  const cx = 60, cy = 60, r = 52;

  const paths = slices.map(slice => {
    const startAngle = (cumulative / 100) * 2 * Math.PI - Math.PI / 2;
    cumulative += slice.pct;
    const endAngle = (cumulative / 100) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = slice.pct > 50 ? 1 : 0;
    const d = slice.pct >= 99.9
      ? `M ${cx} ${cy} m -${r} 0 a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 -${2 * r} 0`
      : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { d, color: slice.color, label: slice.label, pct: slice.pct, isUser: slice.isUser };
  });

  return (
    <div className="flex items-center gap-4">
      <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0">
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth="1.5" />
        ))}
        {/* Center hole */}
        <circle cx={cx} cy={cy} r={28} fill="hsl(var(--card))" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="hsl(var(--muted-foreground))" fontWeight="600">
          IA locale
        </text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className={cn('text-[11px] truncate flex-1', s.isUser ? 'font-bold text-foreground' : 'text-muted-foreground')}>
              {s.label}
            </span>
            <span className={cn('text-[11px] font-extrabold tabular-nums shrink-0', s.isUser ? 'text-emerald-600' : 'text-red-600')}>
              {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Raw AI response modal ─────────────────────────────────────────────────────

function RawResponseModal({
  query, open, onClose, businessName,
}: {
  query: GeoQuery; open: boolean; onClose: () => void; businessName: string;
}) {
  if (!open) return null;

  // Highlight competitor names in red
  const renderHighlighted = (text: string) => {
    const parts = text.split(/(\[CONCURRENT\])/g);
    return parts.map((part, i) =>
      part === '[CONCURRENT]'
        ? <mark key={i} className="bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-300 rounded px-0.5 not-italic font-semibold">⚠ concurrent</mark>
        : part
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg rounded-2xl bg-[#0d1117] border border-[#30363d] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* ChatGPT-style header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#30363d]">
            <span className="text-lg">{query.aiEmoji}</span>
            <p className="text-sm font-semibold text-[#e6edf3] flex-1">
              Réponse brute de {query.aiName}
            </p>
            <button onClick={onClose} className="text-[#8b949e] hover:text-[#e6edf3] transition-colors">
              <X size={16} />
            </button>
          </div>
          {/* User prompt bubble */}
          <div className="px-4 pt-4">
            <div className="ml-auto max-w-[85%] bg-[#1f6feb] rounded-2xl rounded-tr-sm px-3 py-2 mb-3">
              <p className="text-[12px] text-white leading-relaxed">{query.question}</p>
            </div>
          </div>
          {/* AI response bubble */}
          <div className="px-4 pb-4">
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl rounded-tl-sm px-3 py-3">
              <p className="text-[12px] text-[#e6edf3] leading-relaxed font-mono whitespace-pre-wrap">
                {renderHighlighted(query.rawResponse)}
              </p>
              {/* Sources strip */}
              {query.sourcesIndexed && query.sourcesIndexed.length > 0 && (
                <div className="mt-3 pt-2 border-t border-[#30363d] space-y-1">
                  <p className="text-[9px] font-bold text-[#8b949e] uppercase tracking-wide">Sources indexées</p>
                  {query.sourcesIndexed.map((url, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <ExternalLink size={9} className="text-[#58a6ff] shrink-0" />
                      <span className="text-[10px] text-[#58a6ff] truncate">{url}</span>
                      {!url.toLowerCase().includes(businessName.toLowerCase().split(' ')[0]) && (
                        <span className="ml-auto text-[9px] font-bold text-red-400 shrink-0">Pas vous</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="px-4 pb-3 text-[10px] text-[#8b949e] text-center">
            🔍 Simulation basée sur les données réelles de votre secteur et localisation · Audit Kompilot
          </div>
        </div>
      </div>
    </>
  );
}

// ── Query accordion row ───────────────────────────────────────────────────────

function QueryRow({
  query, businessName,
}: {
  query: GeoQuery; businessName: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);

  return (
    <>
      <div className="border-b border-[#30363d] last:border-b-0">
        {/* Header row */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
        >
          <span className="text-base shrink-0">{query.aiEmoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-[#e6edf3]">{query.aiName}</p>
            <p className="text-[10px] text-[#8b949e] truncate">« {query.question} »</p>
          </div>
          {/* Cited badge */}
          {query.cited ? (
            <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-900/60 border border-emerald-700 text-emerald-400 text-[9px] font-extrabold px-2 py-0.5">
              ✅ RECOMMANDÉ #{query.position}
            </span>
          ) : (
            <span className="shrink-0 flex items-center gap-1 rounded-full bg-red-900/60 border border-red-700 text-red-400 text-[9px] font-extrabold px-2 py-0.5">
              ❌ ABSENT
            </span>
          )}
          {expanded ? <ChevronDown size={13} className="text-[#8b949e] shrink-0" /> : <ChevronRight size={13} className="text-[#8b949e] shrink-0" />}
        </button>

        {/* Expanded detail */}
        {expanded && (
          <div className="px-4 pb-3 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Competitors cited */}
            {!query.cited && query.competitors.length > 0 && (
              <div className="rounded-lg bg-red-950/30 border border-red-800/40 px-3 py-2 space-y-1">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide">Concurrents cités à votre place</p>
                {query.competitors.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-red-500 text-[10px] font-extrabold">#{i + 1}</span>
                    <span className="text-[11px] text-[#e6edf3] font-semibold">{c}</span>
                    <span className="ml-auto text-[9px] text-red-400">Capte vos clients</span>
                  </div>
                ))}
              </div>
            )}

            {/* Sources indexées (Perplexity) */}
            {query.sourcesIndexed && query.sourcesIndexed.length > 0 && (
              <div className="rounded-lg bg-[#161b22] border border-[#30363d] px-3 py-2 space-y-1">
                <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wide">Sources web indexées par l'IA</p>
                {query.sourcesIndexed.map((url, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <ExternalLink size={9} className="text-[#58a6ff] shrink-0" />
                    <span className="text-[10px] text-[#58a6ff] truncate flex-1">{url}</span>
                    {!url.toLowerCase().includes(businessName.toLowerCase().split(' ')[0]) && (
                      <span className="text-[9px] font-bold text-red-400 shrink-0">≠ Votre fiche</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* View raw response */}
            <button
              onClick={e => { e.stopPropagation(); setRawOpen(true); }}
              className="flex items-center gap-1.5 text-[10px] text-[#58a6ff] hover:text-[#79c0ff] transition-colors font-semibold"
            >
              👁️ Voir la réponse brute de l'IA
            </button>
          </div>
        )}
      </div>

      <RawResponseModal query={query} open={rawOpen} onClose={() => setRawOpen(false)} businessName={businessName} />
    </>
  );
}

// ── Main GEO Radar Section ────────────────────────────────────────────────────

interface GeoRadarSectionProps {
  result: GeoResult;
  onNavigateCockpit: (prefillKeywords?: string) => void;
  /** Set true when data comes from cache (API in fallback mode) */
  isFallback?: boolean;
  /** ISO string of when cached data was captured */
  cachedAt?: string | null;
  /** Called when user clicks "Réessayer" on the fallback banner */
  onRetry?: () => void;
}

export function GeoRadarSection({ result, onNavigateCockpit }: GeoRadarSectionProps) {
  const citedCount = result.queries.filter(q => q.cited).length;
  const totalAIs = result.queries.length;
  // Use weighted score (ChatGPT 40% + Gemini 35% + Perplexity 25%)
  const weightedScore = computeWeightedScore(result.queries);
  const displayScore = weightedScore > 0 ? weightedScore : result.geoScore;
  const alertStatus = citedCount === 0
    ? `Alerte : Vous êtes invisible sur les ${totalAIs} principales IA du marché.`
    : citedCount < totalAIs
    ? `Présence partielle : ${citedCount}/${totalAIs} IA vous citent. Optimisation requise.`
    : 'Bonne visibilité IA — maintenez votre rythme de publication.';

  // Pie chart data
  const pieSlices: { label: string; pct: number; color: string; isUser?: boolean }[] = [
    { label: result.topCompetitor, pct: 60, color: '#ef4444' },
    { label: 'Concurrent 2', pct: 30, color: '#f97316' },
    { label: result.businessName, pct: citedCount > 0 ? 10 : 0, color: '#10b981', isUser: true },
    { label: 'Autres', pct: citedCount > 0 ? 0 : 10, color: '#6b7280' },
  ].filter(s => s.pct > 0);

  const kwList = result.missingKeywords.join(', ');

  return (
    <div className="rounded-xl overflow-hidden border border-[#30363d] bg-[#0d1117]">
      {/* ── Section header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#30363d] bg-gradient-to-r from-violet-950/50 to-teal-950/30">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
          <span className="text-base">🤖</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-[#e6edf3] tracking-tight">
            Radar des Recommandations IA
          </p>
          <p className="text-[10px] text-[#8b949e]">
            ChatGPT · Gemini · Perplexity — Scan en temps réel
          </p>
        </div>
        <span className={cn(
          'shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-extrabold',
          citedCount === 0
            ? 'bg-red-950/60 border-red-700 text-red-400'
            : citedCount < totalAIs
            ? 'bg-amber-950/60 border-amber-700 text-amber-400'
            : 'bg-emerald-950/60 border-emerald-700 text-emerald-400'
        )}>
          {citedCount}/{totalAIs} IA
        </span>
      </div>

      <div className="p-4 space-y-4">

        {/* ── GEO score + status ── */}
        <div className="flex items-center gap-4">
          <GeoGauge score={displayScore} />
          <div className="flex-1 space-y-2">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wide">Score GEO pondéré (3 moteurs)</p>
                <TermTooltip term="GEO" size="sm" />
              </div>
              <p className="text-lg font-extrabold leading-tight" style={{ color: geoScoreColor(displayScore) }}>
                {geoScoreLabel(displayScore)}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {result.queries.map(q => {
                  const meta = MODEL_WEIGHTS[q.aiName];
                  if (!meta) return null;
                  return (
                    <span key={q.aiName} className={`text-[9px] font-extrabold rounded-full px-1.5 py-0.5 border ${q.cited ? 'bg-emerald-900/50 border-emerald-700 text-emerald-400' : 'bg-red-900/50 border-red-700 text-red-400'}`}>
                      {meta.dot} {q.aiName}: {q.cited ? `+${meta.weight}pts` : '0pt'}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className={cn(
              'rounded-lg border px-3 py-2',
              citedCount === 0
                ? 'border-red-800/40 bg-red-950/30'
                : 'border-amber-800/40 bg-amber-950/30'
            )}>
              <p className={cn('text-[11px] font-semibold leading-relaxed', citedCount === 0 ? 'text-red-400' : 'text-amber-400')}>
                {alertStatus}
              </p>
            </div>
          </div>
        </div>

        {/* ── Cross-model alerts ── */}
        <CrossModelAlerts queries={result.queries} />

        {/* ── Dual KPI: SERPs classiques vs Part de Voix IA ── */}
        <div className="grid grid-cols-2 gap-2">
          {/* Card 1 — SERPs Classiques */}
          <div className="rounded-xl border border-blue-800/40 bg-blue-950/30 px-3 py-2.5">
            <div className="flex items-center gap-1">
              <p className="text-[10px] font-extrabold text-blue-300 uppercase tracking-wide">🔍 SERPs Classiques</p>
              <TermTooltip term="SEO" size="sm" />
            </div>
            <p className="text-[9px] text-[#8b949e]">Moteurs traditionnels</p>
            <p className="text-xl font-black text-blue-200">74/100</p>
            <div className="h-1.5 rounded-full bg-[#30363d] mt-1.5 overflow-hidden">
              <div className="h-full rounded-full bg-blue-400" style={{ width: '74%' }} />
            </div>
            <p className="text-[9px] text-[#8b949e] mt-1.5">Google · Maps · Bing</p>
          </div>

          {/* Card 2 — Part de Voix IA */}
          <div className="rounded-xl border border-amber-800/40 bg-amber-950/30 px-3 py-2.5">
            <div className="flex items-center gap-1">
              <p className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wide">🤖 Part de Voix IA</p>
              <TermTooltip term="AIO" size="sm" />
            </div>
            <p className="text-[9px] text-[#8b949e]">ChatGPT · Perplexity · Gemini</p>
            <p className={`text-xl font-black ${displayScore >= 60 ? 'text-emerald-300' : displayScore >= 35 ? 'text-amber-300' : 'text-red-300'}`}>
              {displayScore}/100
            </p>
            <div className="h-1.5 rounded-full bg-[#30363d] mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${displayScore >= 60 ? 'bg-emerald-400' : displayScore >= 35 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${displayScore}%` }}
              />
            </div>
            {displayScore < 35 ? (
              <div className="rounded-md bg-red-950/40 border border-red-800/40 px-2 py-1 mt-1.5">
                <p className="text-[9px] text-red-400 font-semibold">⚠ Faible — L'IA vous ignore sur 2/3 moteurs</p>
              </div>
            ) : displayScore < 60 ? (
              <p className="text-[9px] text-amber-300 mt-1.5 font-semibold">⚡ Partiel — Optimisation possible</p>
            ) : null}
          </div>
        </div>

        {/* ── Accordion: queries per AI ── */}
        <MultiModelPanel queries={result.queries} businessName={result.businessName} />

        {/* ── Conquête GEA strategic panel ── */}
        <ConqueteGEAPanel
          queries={result.queries}
          businessName={result.businessName}
          missingKeywords={result.missingKeywords}
          onNavigateCockpit={onNavigateCockpit}
        />

        {/* ── Why copilot diagnosis ── */}
        <div className="rounded-xl bg-violet-950/30 border border-violet-800/40 px-4 py-3 space-y-1.5">
          <p className="text-[11px] font-extrabold text-violet-300">💡 Pourquoi l'IA vous ignore</p>
          <p className="text-[11px] text-[#8b949e] leading-relaxed">
            ChatGPT et Perplexity se basent sur la <strong className="text-[#e6edf3]">fraîcheur de vos avis Google</strong> et sur la{' '}
            <strong className="text-[#e6edf3]">sémantique locale de vos posts</strong>.
            Votre dernier avis textuel optimisé date de{' '}
            <strong className="text-amber-400">{result.userReviewsAge}</strong>, alors que{' '}
            <strong className="text-red-400">{result.topCompetitor}</strong> a reçu{' '}
            <strong className="text-[#e6edf3]">{result.topCompetitorReviews} avis positifs</strong>{' '}
            ce mois-ci avec les mots-clés exacts recherchés par l'IA.
          </p>
          <p className="text-[11px] text-[#8b949e] leading-relaxed">
            Kompilot optimise vos contenus avec les termes{' '}
            <strong className="text-violet-300">{kwList}</strong>{' '}
            pour que vous deveniez la réponse N°1 de ces IA.
          </p>
        </div>

        {/* ── Share of Voice pie chart ── */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-4 space-y-3">
          <p className="text-[11px] font-bold text-[#e6edf3]">
            📊 Répartition des recommandations IA dans votre zone
          </p>
          <p className="text-[10px] text-[#8b949e]">30 derniers jours · Requêtes locales estimées</p>
          <PieChart slices={pieSlices} />
          {/* Urgency stat */}
          <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 px-3 py-2 flex items-start gap-2">
            <span className="text-base shrink-0">⚠️</span>
            <p className="text-[11px] text-amber-400 leading-relaxed">
              <strong>Flux de clients perdus :</strong> L'IA a répondu à environ{' '}
              <strong className="text-[#e6edf3]">{result.missedRequests} requêtes locales</strong>{' '}
              concernant votre activité à {result.city} ce mois-ci.
              Vous n'étiez présent sur <strong className="text-red-400">aucune d'entre elles</strong>.
            </p>
          </div>
        </div>

        {/* ── Sources d'influence UGC détectées ── */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#30363d] flex items-center gap-2">
            <span className="text-base">📦</span>
            <div>
              <p className="text-[12px] font-extrabold text-[#e6edf3]">Sources d'influence détectées</p>
              <p className="text-[10px] text-[#8b949e]">Analyse UGC · Semrush Insights</p>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#30363d]/50">
            {/* Reddit */}
            <div className="px-4 py-3 flex items-start gap-3">
              <span className="text-[9px] font-bold rounded px-1.5 py-0.5 bg-orange-950/60 border border-orange-700/60 text-orange-300 shrink-0 mt-0.5">reddit</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#e6edf3]">
                  0 mention dans r/{result.sector} · r/{result.city}
                </p>
                <p className="text-[10px] text-[#8b949e]">Ce mois-ci — Aucune conversation ne vous cite</p>
              </div>
              <span className="text-[9px] font-bold rounded-full px-2 py-0.5 bg-red-950/50 border border-red-700/50 text-red-400 shrink-0">Non détecté</span>
            </div>

            {/* LinkedIn */}
            <div className="px-4 py-3 flex items-start gap-3">
              <span className="text-[9px] font-bold rounded px-1.5 py-0.5 bg-indigo-950/60 border border-indigo-700/60 text-indigo-300 shrink-0 mt-0.5">linkedin</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#e6edf3]">Aucune publication sectorielle ne vous mentionne</p>
                <p className="text-[10px] text-[#8b949e]">Publications professionnelles B2B analysées</p>
              </div>
              <span className="text-[9px] font-bold rounded-full px-2 py-0.5 bg-red-950/50 border border-red-700/50 text-red-400 shrink-0">Non détecté</span>
            </div>

            {/* Presse locale */}
            <div className="px-4 py-3 flex items-start gap-3">
              <span className="text-[9px] font-bold rounded px-1.5 py-0.5 bg-violet-950/60 border border-violet-700/60 text-violet-300 shrink-0 mt-0.5">presse</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#e6edf3]">1 article local vous cite</p>
                <p className="text-[10px] text-[#8b949e]">Cité dans actu.fr · avril 2025</p>
              </div>
              <span className="text-[9px] font-bold rounded-full px-2 py-0.5 bg-emerald-950/50 border border-emerald-700/50 text-emerald-400 shrink-0">1 mention</span>
            </div>

            {/* Google Q&A */}
            <div className="px-4 py-3 flex items-start gap-3">
              <span className="text-[9px] font-bold rounded px-1.5 py-0.5 bg-teal-950/60 border border-teal-700/60 text-teal-300 shrink-0 mt-0.5">google q&amp;a</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#e6edf3]">2 questions sans réponse</p>
                <p className="text-[10px] text-[#8b949e]">Sur votre fiche Google Maps Business</p>
              </div>
              <span className="text-[9px] font-bold rounded-full px-2 py-0.5 bg-amber-950/50 border border-amber-700/50 text-amber-400 shrink-0">2 sans réponse</span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-[#0d1117] border-t border-[#30363d]">
            <p className="text-[10px] text-[#8b949e] leading-relaxed">
              💡 ChatGPT, Gemini et Perplexity analysent Reddit, LinkedIn et la presse locale pour générer leurs réponses. Être cité sur ces plateformes améliore directement votre Part de Voix IA.
            </p>
          </div>
        </div>

        {/* ── CTAs ── */}
        <div className="space-y-2">
          <button
            onClick={() => onNavigateCockpit()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 hover:from-violet-700 hover:to-teal-600 text-white text-sm font-extrabold py-3.5 shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98]"
          >
            🚀 Optimiser ma visibilité sur ChatGPT & Google Maps
          </button>
          <button
            onClick={() => onNavigateCockpit(kwList)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#30363d] bg-[#161b22] hover:bg-[#21262d] text-[#e6edf3] text-xs font-semibold py-2.5 transition-all active:scale-[0.98]"
          >
            <Mic size={13} className="text-violet-400" />
            Rédiger un post optimisé GEO avec le Cockpit IA 🎙️
          </button>
        </div>
      </div>
    </div>
  );
}

// ── GEO result builder ────────────────────────────────────────────────────────

type Sector = 'beauty' | 'restaurant' | 'generic';

export function buildGeoResult(businessName: string, query: string, sector: Sector): GeoResult {
  const city = query.match(/\b([A-ZÀÂÆÇÉÈÊËÎÏÔŒÙÛÜ][a-zàâæçéèêëîïôœùûü]{2,})\b/g)?.pop() || 'votre ville';
  const name = businessName || query.split(' ')[0] || 'Votre commerce';

  const sectorLabel = sector === 'beauty' ? 'salon de beauté' : sector === 'restaurant' ? 'restaurant' : 'commerce';
  const competitor1 = sector === 'beauty' ? `Studio Élégance ${city}` : sector === 'restaurant' ? `Le Bistrot de ${city}` : `Boutique Centrale ${city}`;
  const competitor2 = sector === 'beauty' ? `Institut Lumière` : sector === 'restaurant' ? `Chez Marcel` : `L'Enseigne Premium`;
  const missingKw = sector === 'beauty'
    ? [`soin visage ${city}`, `lissage cheveux ${city}`, 'meilleur salon']
    : sector === 'restaurant'
    ? [`restaurant recommandé ${city}`, 'plat du jour', `meilleur resto ${city}`]
    : [`boutique ${city}`, `service local ${city}`, 'avis clients'];

  const geoScore = 28; // low by default to trigger urgency

  const queries: GeoQuery[] = [
    {
      aiName: 'ChatGPT',
      aiEmoji: '🤖',
      aiColor: 'bg-emerald-900',
      question: `Où trouver un bon ${sectorLabel} recommandé à ${city} ?`,
      cited: false,
      competitors: [competitor1, competitor2],
      rawResponse: `Bien sûr ! Voici les meilleures adresses à ${city} :\n\n1. **${competitor1}** — très bien noté, ${sector === 'beauty' ? '4,8/5 avec 87 avis récents mentionnant des soins de qualité.' : sector === 'restaurant' ? '4,6/5 avec 120 avis, spécialité du terroir local.' : '4,7/5 avec 65 avis positifs récents.'}\n\n2. **${competitor2}** — [CONCURRENT] apprécié des habitués, notamment pour ${sector === 'beauty' ? 'ses soins visage et colorations.' : sector === 'restaurant' ? 'son ambiance chaleureuse et sa carte du marché.' : 'son service personnalisé.'}\n\n3. D'autres établissements moins référencés existent à ${city}, mais leurs fiches Google manquent d'informations récentes pour être recommandés en toute confiance.`,
      sourcesIndexed: undefined,
    },
    {
      aiName: 'Perplexity',
      aiEmoji: '🔍',
      aiColor: 'bg-blue-900',
      question: `Avis et retours sur les ${sectorLabel}s de ${city}`,
      cited: false,
      competitors: [competitor1],
      rawResponse: `Selon les sources web indexées, les établissements les plus fréquemment cités à ${city} sont :\n\n• **${competitor1}** — Mentionné dans plusieurs guides locaux et forums. [CONCURRENT] Score de confiance élevé basé sur 15 avis textuel récents.\n\nVotre établissement n'apparaît pas dans les sources actuellement indexées par notre moteur de recherche sémantique.`,
      sourcesIndexed: [
        `actu.fr/article-meilleur-${sectorLabel}-${city.toLowerCase()}-2025`,
        `google.com/maps/search/${sectorLabel}+${city.toLowerCase()}`,
        `tripadvisor.fr/restaurants/${city.toLowerCase()}`,
        `leboncoin.fr/annonces/${city.toLowerCase()}-services`,
        `${competitor1.toLowerCase().replace(/\s/g, '')}.fr`,
      ],
    },
    {
      aiName: 'Gemini',
      aiEmoji: '✨',
      aiColor: 'bg-violet-900',
      question: `Meilleur ${sectorLabel} proche de ${city} — recommandations 2025`,
      cited: false,
      competitors: [competitor1, competitor2],
      rawResponse: `Je peux vous suggérer plusieurs adresses réputées à ${city} :\n\n**${competitor1}** 🏆 — Fiche Google complète, photos récentes, réponses aux avis. Très bien référencé localement.\n\n**${competitor2}** — [CONCURRENT] Présence régulière sur Instagram avec des posts optimisés pour les recherches locales.\n\n💡 Note : les établissements que je recommande sont ceux dont la fiche Google est active (avis < 30 jours) et dont le site contient des mots-clés géolocalisés.`,
      sourcesIndexed: undefined,
    },
  ];

  return {
    geoScore,
    businessName: name,
    city,
    sector: sectorLabel,
    queries,
    missedRequests: Math.floor(Math.random() * 400) + 200,
    missingKeywords: missingKw,
    topCompetitor: competitor1,
    topCompetitorReviews: Math.floor(Math.random() * 10) + 12,
    userReviewsAge: 'il y a plus d\'un mois',
  };
}
