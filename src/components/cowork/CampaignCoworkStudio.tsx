/**
 * CampaignCoworkStudio — Interface de collaboration IA OpenAI × Claude
 *
 * Pipeline séquentiel en temps réel :
 *   1. Brief utilisateur (objectif / cible / produit / ton de marque)
 *   2. Indicateur "OpenAI réfléchit…" pendant l'étape 1
 *   3. Indicateur "Claude peaufine les détails…" pendant l'étape 2
 *   4. Résultat final : bloc violet GPT-4o + bloc amber Claude, côte à côte
 *
 * Résilience :
 *   - Si Claude échoue (statut "partial"), le bloc GPT-4o s'affiche
 *     avec une bannière d'erreur Claude et un bouton "Réessayer Claude".
 *   - Si GPT-4o échoue, un message d'erreur clair s'affiche avec l'étape en cause.
 */

import { useState, useRef } from 'react';
import { blink } from '@/blink/client';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Skeleton, toast,
} from '@blinkdotnew/ui';
import {
  Sparkles, Zap, Brain, Check, RotateCcw, Copy,
  ArrowRight, AlertTriangle, ChevronDown, ChevronUp,
  Clock, Target, Package, Palette, RefreshCw,
} from 'lucide-react';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdCopy { hook: string; body: string; cta: string; channel: string }

interface OpenAIDraft {
  angles: string[];
  hooks: string[];
  calendar: string;
  strategicNotes?: string;
  rawText: string;
  tokensUsed: number;
  durationMs: number;
}

interface ClaudeRefinement {
  critique: string;
  refinedHooks: string[];
  adCopies: AdCopy[];
  finalTip: string;
  tokensUsed: number;
  durationMs: number;
}

interface CoworkResult {
  status: 'success' | 'partial';
  brief: { objective: string; target: string; product: string; brandTone?: string };
  openai: OpenAIDraft;
  claude: ClaudeRefinement | null;
  claude_error?: string;
  totalDurationMs: number;
  generatedAt: string;
}

// ── États du pipeline ─────────────────────────────────────────────────────────

type PipelineStep =
  | 'idle'      // formulaire affiché
  | 'openai'    // GPT-4o en cours
  | 'claude'    // Claude en cours
  | 'done'      // succès complet
  | 'partial'   // GPT-4o OK, Claude KO
  | 'error';    // GPT-4o KO (erreur fatale)

// ── Helpers ───────────────────────────────────────────────────────────────────

function useCopyText() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    });
  };
  return { copy, copiedId };
}

// ── Sous-composants ───────────────────────────────────────────────────────────

/** Pastille d'étape avec animation */
function StepPill({
  label, icon, state,
}: {
  label: string;
  icon: React.ReactNode;
  state: 'waiting' | 'active' | 'done' | 'error';
}) {
  const styles = {
    waiting: 'bg-muted text-muted-foreground border-border opacity-50',
    active:  'bg-primary text-primary-foreground border-primary',
    done:    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400',
    error:   'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400',
  }[state];

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${styles} ${state === 'active' ? 'animate-pulse' : ''}`}>
      {state === 'done'  ? <Check className="w-3 h-3"  /> :
       state === 'error' ? <AlertTriangle className="w-3 h-3" /> :
       state === 'active'? <RefreshCw className="w-3 h-3 animate-spin" /> :
       icon}
      {label}
    </div>
  );
}

/** Carte de texte publicitaire */
function AdCopyCard({ ad, idx, copy, copiedId }: { ad: AdCopy; idx: number; copy: (t: string, id: string) => void; copiedId: string | null }) {
  const id   = `ad-${idx}`;
  const full = `${ad.hook}\n\n${ad.body}\n\n➤ ${ad.cta}`;
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2 hover:border-amber-300/60 transition-colors group">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-[10px] font-semibold">{ad.channel}</Badge>
        <button onClick={() => copy(full, id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all">
          {copiedId === id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <p className="text-sm font-bold leading-snug">{ad.hook}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{ad.body}</p>
      <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">CTA</span>
        <span className="text-sm font-medium">{ad.cta}</span>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function CampaignCoworkStudio() {
  // ── Formulaire brief
  const [objective,  setObjective]  = useState('');
  const [target,     setTarget]     = useState('');
  const [product,    setProduct]    = useState('');
  const [brandTone,  setBrandTone]  = useState('');
  const [budget,     setBudget]     = useState('');
  const [channels,   setChannels]   = useState('Instagram, Facebook, Google Ads');
  const [duration,   setDuration]   = useState('30');

  // ── État du pipeline
  const [step,   setStep]   = useState<PipelineStep>('idle');
  const [result, setResult] = useState<CoworkResult | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  // ── UI
  const [showRaw,   setShowRaw]   = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const { copy, copiedId } = useCopyText();

  // Timer pour simuler le changement d'étape openai→claude côté UI
  const stepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inputCls = 'mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow';

  // ── Pipeline ──────────────────────────────────────────────────────────────

  async function runPipeline(retryClaudeOnly = false) {
    if (!objective.trim() || !target.trim() || !product.trim()) {
      toast.error('Remplis les 3 champs obligatoires (objectif, cible, produit).');
      return;
    }

    setResult(null);
    setFatalError(null);

    // Étape 1 : indicateur OpenAI
    setStep('openai');
    setStatusMsg('GPT-4o analyse votre brief et structure la campagne…');

    // Timer : bascule vers "claude" après ~5 s pour l'UX (avant que la réponse arrive)
    if (stepTimer.current) clearTimeout(stepTimer.current);
    stepTimer.current = setTimeout(() => {
      setStep('claude');
      setStatusMsg('Claude 3.5 Sonnet critique et peaufine les détails…');
    }, 5_200);

    try {
      const token = await blink.auth.getValidToken();

      const body = retryClaudeOnly && result
        ? { ...result.brief, budget: budget ? parseInt(budget) : undefined, channels: channels.split(',').map(c => c.trim()).filter(Boolean), durationDays: parseInt(duration) || 30 }
        : {
            objective: objective.trim(),
            target:    target.trim(),
            product:   product.trim(),
            brandTone: brandTone.trim() || undefined,
            budget:    budget ? parseInt(budget) : undefined,
            channels:  channels.split(',').map(c => c.trim()).filter(Boolean),
            durationDays: parseInt(duration) || 30,
          };

      const res = await fetch(`${BACKEND_URL}/api/cowork/generate-campaign`, {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      clearTimeout(stepTimer.current!);
      const json = await res.json() as CoworkResult & { error?: string; step?: string };

      if (!res.ok) {
        // Erreur fatale (GPT-4o ou validation)
        setFatalError(json.error ?? `Erreur HTTP ${res.status}`);
        setStep('error');
        return;
      }

      setResult(json);
      setStep(json.status === 'partial' ? 'partial' : 'done');

      if (json.status === 'partial') {
        toast.error('Claude n\'a pas pu affiner la campagne. Les résultats GPT-4o sont disponibles.');
      } else {
        toast.success('Campagne générée par GPT-4o + Claude ✦');
      }
    } catch (err) {
      clearTimeout(stepTimer.current!);
      const msg = err instanceof Error ? err.message : String(err);
      setFatalError(msg);
      setStep('error');
      toast.error('Erreur réseau — vérifiez votre connexion.');
    }
  }

  function handleReset() {
    setStep('idle');
    setResult(null);
    setFatalError(null);
    setStatusMsg('');
  }

  // ── États des pastilles ───────────────────────────────────────────────────

  const openaiState: 'waiting' | 'active' | 'done' | 'error' =
    step === 'idle'             ? 'waiting' :
    step === 'openai'           ? 'active'  :
    step === 'error' && !result ? 'error'   :
    'done';

  const claudeState: 'waiting' | 'active' | 'done' | 'error' =
    step === 'idle' || step === 'openai'  ? 'waiting' :
    step === 'claude'                      ? 'active'  :
    step === 'partial'                     ? 'error'   :
    step === 'done'                        ? 'done'    :
    'waiting';

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-amber-500 flex items-center justify-center shrink-0 shadow-md">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold tracking-tight">Claude Cowork Studio</h2>
          <p className="text-xs text-muted-foreground">GPT-4o structure · Claude 3.5 Sonnet affine · Publicités Meta prêtes</p>
        </div>
        {(step !== 'idle' && step !== 'error') && (
          <button onClick={handleReset} title="Nouveau brief" className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Formulaire brief ─────────────────────────────────────────────── */}
      {(step === 'idle' || step === 'error') && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Votre brief de campagne</CardTitle>
            <p className="text-xs text-muted-foreground">Les 3 premiers champs sont obligatoires. Le ton de marque améliore sensiblement la qualité.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Champs obligatoires */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Target className="w-3 h-3" /> Objectif <span className="text-red-400">*</span>
              </label>
              <input value={objective} onChange={e => setObjective(e.target.value)}
                placeholder="Ex: attirer 30 clients le week-end, lancer une nouvelle offre…"
                className={inputCls} />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Brain className="w-3 h-3" /> Audience cible <span className="text-red-400">*</span>
              </label>
              <input value={target} onChange={e => setTarget(e.target.value)}
                placeholder="Ex: femmes 30-50 ans, sportives, dans un rayon de 10 km…"
                className={inputCls} />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Package className="w-3 h-3" /> Produit ou service <span className="text-red-400">*</span>
              </label>
              <input value={product} onChange={e => setProduct(e.target.value)}
                placeholder="Ex: pizzeria artisanale, salle de sport, boutique enfants…"
                className={inputCls} />
            </div>

            {/* Ton de marque — nouveau champ */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Palette className="w-3 h-3" /> Ton de marque
                <span className="ml-1 text-[10px] text-muted-foreground/60">(optionnel mais recommandé)</span>
              </label>
              <input value={brandTone} onChange={e => setBrandTone(e.target.value)}
                placeholder="Ex: chaleureux et familial, expert et premium, dynamique et jeune…"
                className={inputCls} />
              <p className="text-[10px] text-muted-foreground mt-1">
                Injecté dans les deux IA pour garantir la cohérence tonale de toute la campagne.
              </p>
            </div>

            {/* Paramètres secondaires */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Budget (€/mois)</label>
                <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
                  placeholder="500" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Durée (jours)</label>
                <input type="number" value={duration} onChange={e => setDuration(e.target.value)}
                  placeholder="30" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Canaux</label>
                <input value={channels} onChange={e => setChannels(e.target.value)}
                  placeholder="Instagram, Facebook…" className={inputCls} />
              </div>
            </div>

            {/* Erreur fatale (GPT-4o) */}
            {fatalError && step === 'error' && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800 px-3 py-2.5 text-sm">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-400">Erreur pendant le pipeline</p>
                  <p className="text-red-600 dark:text-red-300 text-xs mt-0.5">{fatalError}</p>
                </div>
              </div>
            )}

            <Button
              onClick={() => runPipeline(false)}
              disabled={!objective.trim() || !target.trim() || !product.trim()}
              className="w-full gap-2 bg-gradient-to-r from-violet-600 to-amber-500 hover:from-violet-700 hover:to-amber-600 text-white font-semibold shadow"
            >
              <Sparkles className="w-4 h-4" />
              Lancer la collaboration IA
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Indicateur de progression en temps réel ──────────────────────── */}
      {(step === 'openai' || step === 'claude') && (
        <Card className="border-primary/20">
          <CardContent className="pt-5 pb-6 space-y-5">
            {/* Barre de progression */}
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full bg-primary transition-all duration-700 ease-out ${step === 'openai' ? 'w-[40%]' : 'w-[85%]'}`} />
            </div>

            {/* Pastilles d'étape */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <StepPill
                label="GPT-4o"
                icon={<Zap className="w-3 h-3" />}
                state={openaiState}
              />
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <StepPill
                label="Claude 3.5"
                icon={<Brain className="w-3 h-3" />}
                state={claudeState}
              />
            </div>

            {/* Message de statut */}
            <div className="text-center space-y-1">
              {step === 'openai' && (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <Zap className="w-3 h-3 text-violet-600 animate-pulse" />
                    </div>
                    <p className="text-sm font-bold text-violet-700 dark:text-violet-400">OpenAI réfléchit…</p>
                  </div>
                  <p className="text-xs text-muted-foreground">GPT-4o structure les angles, accroches et calendrier</p>
                </>
              )}
              {step === 'claude' && (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Brain className="w-3 h-3 text-amber-600 animate-pulse" />
                    </div>
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Claude peaufine les détails…</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Claude 3.5 Sonnet critique + affine + finalise les publicités Meta</p>
                </>
              )}
            </div>

            {/* Squelettes */}
            <div className="space-y-2 px-2">
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-5/6 rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Résultats ────────────────────────────────────────────────────── */}
      {result && (step === 'done' || step === 'partial') && (
        <div className="space-y-4">

          {/* Méta : durée + tokens */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 flex-wrap gap-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(result.generatedAt).toLocaleString('fr-FR')} · {(result.totalDurationMs / 1000).toFixed(1)}s
            </span>
            <span className="flex items-center gap-2">
              <span className="text-violet-500 font-medium">GPT-4o {result.openai.tokensUsed}tk</span>
              {result.claude && <span className="text-amber-500 font-medium">Claude {result.claude.tokensUsed}tk</span>}
            </span>
          </div>

          {/* Pipeline visuel (statique) */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <StepPill label="GPT-4o terminé" icon={<Check className="w-3 h-3" />} state="done" />
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <StepPill
              label={step === 'partial' ? 'Claude — erreur' : 'Claude terminé'}
              icon={<Brain className="w-3 h-3" />}
              state={step === 'partial' ? 'error' : 'done'}
            />
          </div>

          {/* ── BLOC 1 : Brouillon GPT-4o (violet) ───────────────────────── */}
          <Card className="border-violet-200 dark:border-violet-900">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-violet-700 dark:text-violet-400">
                    Étape 1 — GPT-4o · Structure brute
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {result.openai.tokensUsed} tokens · {(result.openai.durationMs / 1000).toFixed(1)}s
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Angles */}
              {result.openai.angles.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Angles d'attaque</p>
                  <ul className="space-y-1.5">
                    {result.openai.angles.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-5 h-5 shrink-0 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Accroches brutes */}
              {result.openai.hooks.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Accroches brutes (avant raffinement Claude)</p>
                  <ul className="space-y-1.5">
                    {result.openai.hooks.map((h, i) => (
                      <li key={i} className="flex items-start gap-1.5 bg-violet-50 dark:bg-violet-950/20 rounded-lg px-3 py-1.5 text-sm italic">
                        <span className="text-violet-300 shrink-0">"</span>{h}<span className="text-violet-300 shrink-0">"</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Calendrier */}
              {result.openai.calendar && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Calendrier de diffusion</p>
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
                    {result.openai.calendar}
                  </div>
                </div>
              )}

              {/* Notes stratégiques */}
              {result.openai.strategicNotes && (
                <p className="text-xs text-muted-foreground italic border-l-2 border-violet-200 pl-3">
                  {result.openai.strategicNotes}
                </p>
              )}

              {/* Réponse brute (collapsible) */}
              <button onClick={() => setShowRaw(v => !v)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                Réponse brute transmise à Claude
              </button>
              {showRaw && (
                <pre className="text-[11px] text-muted-foreground bg-muted/40 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                  {result.openai.rawText}
                </pre>
              )}
            </CardContent>
          </Card>

          {/* ── BLOC 2 : Raffinement Claude (amber) ──────────────────────── */}
          {result.claude ? (
            <Card className="border-amber-200 dark:border-amber-900">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center shrink-0">
                    <Brain className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      Étape 2 — Claude 3.5 Sonnet · Raffinement & copywriting final
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {result.claude.tokensUsed} tokens · {(result.claude.durationMs / 1000).toFixed(1)}s
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Critique constructive */}
                {result.claude.critique && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1.5">
                      Critique constructive du travail de GPT-4o
                    </p>
                    <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed italic">
                      {result.claude.critique}
                    </p>
                  </div>
                )}

                {/* Accroches améliorées */}
                {result.claude.refinedHooks.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Accroches améliorées</p>
                    <ul className="space-y-2">
                      {result.claude.refinedHooks.map((h, i) => (
                        <li key={i} className="flex items-start justify-between gap-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg px-3 py-2">
                          <div className="flex items-start gap-2 text-sm min-w-0">
                            <span className="text-amber-500 shrink-0 mt-0.5">✦</span>
                            <span className="font-semibold">{h}</span>
                          </div>
                          <button onClick={() => copy(h, `hook-${i}`)} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5 transition-colors">
                            {copiedId === `hook-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Ad copies finaux */}
                {result.claude.adCopies.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Textes publicitaires finalisés (Meta)</p>
                    <div className="grid gap-3">
                      {result.claude.adCopies.map((ad, i) => (
                        <AdCopyCard key={i} ad={ad} idx={i} copy={copy} copiedId={copiedId} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Conseil bonus */}
                {result.claude.finalTip && (
                  <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1.5">Conseil bonus de Claude</p>
                    <p className="text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">{result.claude.finalTip}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Claude a échoué — affichage erreur partielle */
            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                      Claude 3.5 Sonnet n'a pas pu affiner la campagne
                    </p>
                    {result.claude_error && (
                      <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">{result.claude_error}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Les résultats GPT-4o ci-dessus sont complets et utilisables.
                      Vous pouvez réessayer le raffinement Claude sans relancer GPT-4o.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => runPipeline(true)}
                  size="sm"
                  variant="outline"
                  className="mt-3 gap-2 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                >
                  <RefreshCw className="w-4 h-4" /> Réessayer le raffinement Claude
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Bouton nouveau brief */}
          <Button onClick={handleReset} variant="outline" size="sm" className="w-full gap-2">
            <RotateCcw className="w-4 h-4" /> Nouveau brief
          </Button>
        </div>
      )}
    </div>
  );
}
