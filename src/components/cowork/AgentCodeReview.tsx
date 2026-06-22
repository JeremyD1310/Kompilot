/**
 * AgentCodeReview — AI-powered code review agent.
 *
 * Features:
 * - Paste or upload code (any language, auto-detected)
 * - Real AI analysis via blink.ai.streamText (gpt-4.1)
 * - Structured output: Bugs, Performance, Security, Best Practices, Refactor suggestions
 * - Severity badges (critical / warning / info)
 * - Copy-per-finding + overall score gauge
 * - Fair Use quota consumed per review
 */
import { useState, useRef, useCallback } from 'react';
import {
  Code2, ShieldCheck, Loader2, CheckCircle2, Copy, RefreshCw,
  AlertTriangle, Bug, Zap, BookOpen, Wrench, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn, toast } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';
import { type AgentQuota } from '../../hooks/useAgentQuota';

// ── Types ─────────────────────────────────────────────────────────────────────

type Severity = 'critical' | 'warning' | 'info';
type FindingCategory = 'bug' | 'performance' | 'security' | 'practice' | 'refactor';

interface Finding {
  category: FindingCategory;
  severity: Severity;
  title: string;
  detail: string;
  fix?: string;
}

interface ReviewResult {
  language: string;
  score: number; // 0-100
  findings: Finding[];
  summary: string;
}

// ── Config maps ───────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<FindingCategory, { icon: React.ReactNode; label: string; color: string }> = {
  bug:         { icon: <Bug size={12} />,       label: 'Bug',           color: 'border-red-500/30 bg-red-500/5 text-red-300' },
  security:    { icon: <ShieldCheck size={12} />, label: 'Sécurité',    color: 'border-orange-500/30 bg-orange-500/5 text-orange-300' },
  performance: { icon: <Zap size={12} />,        label: 'Performance',  color: 'border-amber-500/30 bg-amber-500/5 text-amber-300' },
  practice:    { icon: <BookOpen size={12} />,   label: 'Bonne pratique', color: 'border-blue-500/30 bg-blue-500/5 text-blue-300' },
  refactor:    { icon: <Wrench size={12} />,     label: 'Refacto',      color: 'border-violet-500/30 bg-violet-500/5 text-violet-300' },
};

const SEVERITY_CONFIG: Record<Severity, { dot: string; label: string }> = {
  critical: { dot: 'bg-red-500',    label: 'Critique' },
  warning:  { dot: 'bg-amber-400',  label: 'Attention' },
  info:     { dot: 'bg-blue-400',   label: 'Info' },
};

const LANGUAGES = ['Auto', 'TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Java', 'SQL', 'CSS', 'Bash'];

// ── Parser ────────────────────────────────────────────────────────────────────

function parseReview(raw: string): ReviewResult {
  const scoreMatch = raw.match(/score[:\s]+(\d+)/i);
  const score = scoreMatch ? Math.min(100, parseInt(scoreMatch[1], 10)) : 70;

  const langMatch = raw.match(/langage?[:\s]+(\w[\w+#-]*)/i);
  const language = langMatch?.[1] ?? 'Code';

  const summaryMatch = raw.match(/\*\*RÉSUMÉ[^:]*:\*\*\s*([\s\S]*?)(?=\*\*|###|$)/i);
  const summary = summaryMatch?.[1]?.trim() ?? '';

  const findings: Finding[] = [];
  // Parse each ### SECTION block
  const categoryMap: Record<string, FindingCategory> = {
    bug: 'bug', bogue: 'bug',
    sécurité: 'security', securite: 'security', security: 'security',
    performance: 'performance',
    'bonne pratique': 'practice', pratique: 'practice', practice: 'practice',
    refactoring: 'refactor', refacto: 'refactor', refactor: 'refactor', amélioration: 'refactor',
  };

  const blocks = raw.split(/^###\s+/m).filter(Boolean);
  for (const block of blocks) {
    const firstLine = block.split('\n')[0].toLowerCase().replace(/[^a-zéèêëàâùûüîïç\s]/g, '').trim();
    const cat: FindingCategory = Object.entries(categoryMap).find(([k]) => firstLine.includes(k))?.[1] ?? 'practice';

    const itemPattern = /\*\*(.+?)\*\*\s*(?:\[?(critique|attention|warning|critical|info)\]?)?\s*\n([\s\S]*?)(?=\*\*|$)/gi;
    let m: RegExpExecArray | null;
    while ((m = itemPattern.exec(block)) !== null) {
      const title = m[1].trim();
      const sevRaw = (m[2] ?? '').toLowerCase();
      const severity: Severity = sevRaw.includes('crit') ? 'critical' : sevRaw.includes('atten') || sevRaw.includes('warn') ? 'warning' : 'info';
      const rest = m[3].trim();
      const fixMatch = rest.match(/\*\*Correction[^:]*:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
      const detail = rest.replace(/\*\*Correction[^:]*:[\s\S]*/i, '').trim();
      if (title.length > 3) {
        findings.push({ category: cat, severity, title, detail, fix: fixMatch?.[1]?.trim() });
      }
    }
  }

  // Fallback: extract bullet findings
  if (findings.length === 0) {
    const bullets = raw.split('\n').filter(l => l.trim().match(/^[-*•►]/));
    for (const b of bullets.slice(0, 8)) {
      findings.push({ category: 'practice', severity: 'info', title: b.replace(/^[-*•►]\s*/, '').slice(0, 80), detail: '', fix: undefined });
    }
  }

  return { language, score, findings, summary };
}

// ── Score gauge ───────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  const barColor = score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-amber-400' : 'bg-red-400';
  const label = score >= 80 ? 'Bon code' : score >= 60 ? 'À améliorer' : 'Critique';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className={cn('h-full rounded-full transition-all duration-1000', barColor)} style={{ width: `${score}%` }} />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <span className={cn('text-xl font-black', color)}>{score}</span>
        <span className="text-[10px] text-slate-500">/100</span>
      </div>
      <span className={cn('text-[11px] font-bold shrink-0', color)}>{label}</span>
    </div>
  );
}

// ── Finding card ──────────────────────────────────────────────────────────────

function FindingCard({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const cfg = CATEGORY_CONFIG[finding.category];
  const sev = SEVERITY_CONFIG[finding.severity];

  const handleCopy = () => {
    const text = `${finding.title}\n${finding.detail}${finding.fix ? `\n\nCorrection :\n${finding.fix}` : ''}`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div className={cn('rounded-xl border overflow-hidden', cfg.color.split(' ')[0], cfg.color.split(' ')[1])}>
      <div className="flex items-center gap-2 px-3 py-2 cursor-pointer" onClick={() => setOpen(v => !v)}>
        <span className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0', cfg.color)}>
          {cfg.icon} {cfg.label}
        </span>
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', sev.dot)} title={sev.label} />
        <span className="text-[12px] font-semibold text-slate-200 flex-1 truncate">{finding.title}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={e => { e.stopPropagation(); handleCopy(); }} className="text-slate-500 hover:text-white transition-colors">
            {copied ? <CheckCircle2 size={11} className="text-emerald-400" /> : <Copy size={11} />}
          </button>
          {open ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
        </div>
      </div>
      {open && (finding.detail || finding.fix) && (
        <div className="px-3 pb-3 space-y-2">
          {finding.detail && <p className="text-[11px] text-slate-300 leading-relaxed">{finding.detail}</p>}
          {finding.fix && (
            <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/20 px-3 py-2">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-1">💡 Correction suggérée</p>
              <p className="text-[11px] text-emerald-200 font-mono leading-relaxed whitespace-pre-wrap">{finding.fix}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface AgentCodeReviewProps {
  quota: AgentQuota;
}

export function AgentCodeReview({ quota }: AgentCodeReviewProps) {
  const [code, setCode] = useState('');
  const [lang, setLang] = useState('Auto');
  const [isStreaming, setIsStreaming] = useState(false);
  const [rawOutput, setRawOutput] = useState('');
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [showInput, setShowInput] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const handleReview = useCallback(async () => {
    if (!code.trim() || isStreaming) return;
    const allowed = quota.consume();
    if (!allowed) {
      toast.error('Quota mensuel atteint', { description: 'Rechargez des crédits pour continuer.' });
      return;
    }
    setIsStreaming(true);
    setRawOutput('');
    setResult(null);
    setShowInput(false);

    const prompt = `Tu es un expert senior en revue de code (10+ ans d'expérience). Analyse le code suivant${lang !== 'Auto' ? ` (${lang})` : ''} de manière exhaustive.

CODE À ANALYSER :
\`\`\`${lang !== 'Auto' ? lang.toLowerCase() : ''}
${code.slice(0, 4000)}
\`\`\`

Produis une revue structurée en 5 sections OBLIGATOIRES :

### BUGS & ERREURS
**[Titre du bug]** [Critique/Attention/Info]
[Description précise du problème et de son impact]
**Correction :** [suggestion de code ou d'approche]

### SÉCURITÉ
**[Titre]** [Critique/Attention/Info]
[Description + impact potentiel]
**Correction :** [patch suggéré]

### PERFORMANCE
**[Titre]** [Critique/Attention/Info]
[Description + gain estimé]
**Correction :** [optimisation concrète]

### BONNES PRATIQUES
**[Titre]** [Attention/Info]
[Pourquoi c'est important + convention standard]
**Correction :** [exemple concret]

### REFACTORING & AMÉLIORATIONS
**[Titre]** [Info]
[Suggestion d'architecture ou de lisibilité]
**Correction :** [code refactorisé ou pattern recommandé]

---

Termine par :
**LANGAGE :** [langage détecté]
**SCORE :** [0-100 — note globale de qualité du code]
**RÉSUMÉ :** [2-3 phrases synthétisant les forces et faiblesses principales]

Sois précis, technique et actionnable. Réponds en français.`;

    try {
      abortRef.current = new AbortController();
      let accumulated = '';
      await blink.ai.streamText(
        { prompt, model: 'gpt-4.1', maxTokens: 2500, signal: abortRef.current.signal },
        (chunk: string) => { accumulated += chunk; setRawOutput(accumulated); }
      );
      setResult(parseReview(accumulated));
      toast.success('✅ Revue de code terminée !');
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Erreur', { description: 'Analyse échouée. Réessayez.' });
        setShowInput(true);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [code, lang, isStreaming, quota]);

  const handleReset = () => {
    abortRef.current?.abort();
    setRawOutput('');
    setResult(null);
    setShowInput(true);
    setIsStreaming(false);
  };

  const criticalCount = result?.findings.filter(f => f.severity === 'critical').length ?? 0;
  const warningCount = result?.findings.filter(f => f.severity === 'warning').length ?? 0;

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-indigo-500/10 via-slate-800/5 to-transparent border-indigo-500/20 bg-slate-900/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400">
            <Code2 size={22} />
          </div>
          <div>
            <p className="font-bold text-sm text-white">Agent Code Review</p>
            <p className="text-[11px] text-slate-400">Bugs · Sécurité · Performance · Best Practices</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-indigo-400">Prêt</span>
        </div>
      </div>

      {/* Input panel */}
      {showInput && (
        <div className="px-5 pb-5 space-y-3">
          <div className="flex gap-2 items-center">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide shrink-0">Langage :</label>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={cn('text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all',
                    lang === l ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-300'
                  )}
                >{l}</button>
              ))}
            </div>
          </div>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Collez votre code ici… (max 4000 caractères analysés)"
            rows={10}
            className="w-full rounded-xl bg-slate-950 border border-slate-700/60 text-sm text-emerald-300 placeholder:text-slate-600 px-4 py-3 font-mono resize-y focus:outline-none focus:border-indigo-500/50 transition-colors"
            spellCheck={false}
          />
          <button onClick={handleReview} disabled={code.trim().length < 20 || isStreaming || quota.isExhausted}
            className={cn('w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all border',
              code.trim().length >= 20 && !quota.isExhausted
                ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/10'
                : 'opacity-40 cursor-not-allowed border-slate-700/40 bg-slate-800/20 text-slate-500'
            )}
          >
            <Code2 size={15} />
            {quota.isExhausted ? 'Quota atteint' : 'Analyser le code'}
          </button>
        </div>
      )}

      {/* Streaming */}
      {isStreaming && !result && (
        <div className="px-5 pb-5">
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 size={13} className="animate-spin text-indigo-400" />
              <span className="text-[11px] font-bold text-indigo-400">Analyse du code en cours…</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono leading-relaxed whitespace-pre-wrap line-clamp-8">{rawOutput || '…'}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="px-5 pb-5 space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setShowInput(v => !v)} className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors">
              <ChevronUp size={12} /> {showInput ? 'Masquer' : 'Modifier le code'}
            </button>
            <button onClick={handleReset} className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors">
              <RefreshCw size={11} /> Nouvelle revue
            </button>
          </div>

          {/* Score + stats */}
          <div className="rounded-xl bg-indigo-500/8 border border-indigo-500/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-indigo-300">{result.language} · Score de qualité</p>
              <div className="flex gap-3">
                {criticalCount > 0 && <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">{criticalCount} critique{criticalCount > 1 ? 's' : ''}</span>}
                {warningCount > 0 && <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">{warningCount} attention{warningCount > 1 ? 's' : ''}</span>}
              </div>
            </div>
            <ScoreGauge score={result.score} />
            {result.summary && <p className="text-[12px] text-slate-300 leading-relaxed">{result.summary}</p>}
          </div>

          {/* Findings */}
          <div className="space-y-2">
            {result.findings.map((f, i) => <FindingCard key={i} finding={f} />)}
            {result.findings.length === 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/8 border border-emerald-500/20 px-4 py-3">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-300 font-semibold">Aucun problème majeur détecté — code de bonne qualité !</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
