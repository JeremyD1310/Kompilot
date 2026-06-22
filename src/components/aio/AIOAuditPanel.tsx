/**
 * AIOAuditPanel — Real brand visibility audit via Blink AI backend.
 *
 * For each keyword the user enters, the backend asks the AI
 * "What are the best solutions for <keyword>?" as a B2B buyer,
 * then checks whether the brand name is cited in the answer.
 */
import { useState } from 'react';
import { Search, Plus, X, Sparkles, RefreshCw, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';
import { AioPromptCopier } from './AioPromptCopier';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

interface AuditResult {
  keyword: string;
  aiAnswer: string;
  isCited: boolean;
  status: 'VISIBLE' | 'INVISIBLE_DROP';
  timestamp: string;
}

interface AuditResponse {
  auditResults: AuditResult[];
  visibilityScore: number;
  brandName: string;
}

function KeywordTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="w-3.5 h-3.5 rounded-full hover:bg-primary/20 flex items-center justify-center transition-colors"
      >
        <X size={9} strokeWidth={3} />
      </button>
    </span>
  );
}

function ResultRow({ result }: { result: AuditResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-xl border transition-colors ${result.isCited ? 'border-green-200 bg-green-50/50 dark:border-green-900/40 dark:bg-green-950/20' : 'border-red-200 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/20'}`}>
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded(v => !v)}
      >
        {result.isCited
          ? <CheckCircle2 size={16} className="text-green-600 shrink-0" />
          : <XCircle size={16} className="text-red-500 shrink-0" />
        }
        <span className="flex-1 text-sm font-semibold text-foreground truncate">{result.keyword}</span>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${result.isCited ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'}`}>
          {result.isCited ? 'VISIBLE' : 'INVISIBLE'}
        </span>
        {expanded ? <ChevronUp size={14} className="text-muted-foreground shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3 border-t border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2 mb-1">
            Réponse de l'IA :
          </p>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result.aiAnswer}</p>
        </div>
      )}
    </div>
  );
}

interface AIOAuditPanelProps {
  defaultBrandName?: string;
}

export function AIOAuditPanel({ defaultBrandName = '' }: AIOAuditPanelProps) {
  const [brandName, setBrandName] = useState(defaultBrandName);
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([
    'gestion présence en ligne PME',
    'outil calendrier publication réseaux sociaux',
    'logiciel avis clients TPE',
  ]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AuditResult[] | null>(null);
  const [visibilityScore, setVisibilityScore] = useState<number | null>(null);

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (!kw || keywords.includes(kw)) { setKeywordInput(''); return; }
    if (keywords.length >= 10) { toast.error('Maximum 10 mots-clés'); return; }
    setKeywords(prev => [...prev, kw]);
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) => setKeywords(prev => prev.filter(k => k !== kw));

  const runAudit = async () => {
    if (!brandName.trim()) { toast.error('Entrez le nom de votre marque.'); return; }
    if (keywords.length === 0) { toast.error('Ajoutez au moins un mot-clé.'); return; }

    setLoading(true);
    setResults(null);
    setVisibilityScore(null);

    try {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/aio/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ brandName: brandName.trim(), keywords }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(String((err as { error?: string }).error ?? `HTTP ${res.status}`));
      }

      const data = await res.json() as AuditResponse;
      setResults(data.auditResults);
      setVisibilityScore(data.visibilityScore);

      const visible = data.auditResults.filter(r => r.isCited).length;
      toast.success(`Audit terminé — ${visible}/${data.auditResults.length} requêtes avec citation`);
    } catch (err) {
      toast.error(`Erreur audit : ${(err as Error).message ?? 'Réessayez.'}`);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = visibilityScore === null ? '' : visibilityScore >= 60 ? 'text-green-600' : visibilityScore >= 30 ? 'text-amber-600' : 'text-red-500';

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Search size={16} className="text-primary" />
        </div>
        <div>
          <h2 className="font-extrabold text-sm text-foreground">Audit de Citation IA</h2>
          <p className="text-xs text-muted-foreground">Vérifie si votre marque est citée par les modèles IA pour vos mots-clés métier</p>
        </div>
        {visibilityScore !== null && (
          <div className={`ml-auto text-right`}>
            <p className={`text-2xl font-black ${scoreColor}`}>{visibilityScore}%</p>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Visibilité IA</p>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Brand name */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
            Nom de votre marque / solution
          </label>
          <input
            type="text"
            value={brandName}
            onChange={e => setBrandName(e.target.value)}
            placeholder="Ex: Kompilot, Acme SaaS…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
        </div>

        {/* Keywords */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
            Mots-clés à auditer <span className="normal-case font-normal">(max 10)</span>
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
              placeholder="Ex: logiciel gestion avis clients…"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={addKeyword}
              disabled={!keywordInput.trim() || keywords.length >= 10}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>

          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {keywords.map(kw => (
                <KeywordTag key={kw} label={kw} onRemove={() => removeKeyword(kw)} />
              ))}
            </div>
          )}
        </div>

        {/* Run button */}
        <Button
          onClick={runAudit}
          disabled={loading || !brandName.trim() || keywords.length === 0}
          className="w-full gap-2"
        >
          {loading
            ? <><RefreshCw size={14} className="animate-spin" /> Analyse en cours…</>
            : <><Sparkles size={14} /> Lancer l'audit de visibilité IA</>
          }
        </Button>

        {/* Results */}
        {results && results.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Résultats par mot-clé</p>
              <span className="text-xs text-muted-foreground">
                {results.filter(r => r.isCited).length}/{results.length} citations
              </span>
            </div>
            {results.map((r, i) => <ResultRow key={i} result={r} />)}

            {/* Prompt IA — affiché après les résultats */}
            <AioPromptCopier
              keywords={results.map(r => ({ term: r.keyword, status: r.status, isCited: r.isCited }))}
              brandName={brandName}
              showPreview
            />
          </div>
        )}
      </div>
    </div>
  );
}
