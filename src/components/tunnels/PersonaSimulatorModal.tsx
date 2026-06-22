/**
 * PersonaSimulatorModal — Customer Persona + AI Ad Scoring
 *
 * Load a "Customer Persona" (e.g. "Stressed Marketing Director, 40yo")
 * and the AI scores BOTH the competitor's ad AND your ad 0-100 based
 * on that persona's psychology — before you even publish.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@blinkdotnew/ui';
import {
  X, User, Plus, Trash2, Sparkles, ChevronRight,
  Loader2, Target, TrendingUp, TrendingDown,
  Check, Brain, Zap, AlertCircle,
} from 'lucide-react';
import { blink } from '../../blink/client';
import { apiFetch } from '../../config/api';
import type { FunnelData } from './types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Persona {
  id: string;
  name: string;
  age?: number | null;
  jobTitle?: string | null;
  painPoints: string[];
  goals: string[];
  buyingTriggers: string[];
  description?: string | null;
}

interface RawPersonaRow {
  id: string;
  name: string;
  age?: number | null;
  jobTitle?: string | null;
  painPoints?: string;
  goals?: string;
  buyingTriggers?: string;
  description?: string | null;
}

interface ScoreBreakdown {
  emotionalHook: number;
  problemFit: number;
  benefitClarity: number;
  socialProof: number;
  callToAction: number;
}

interface SimulationResult {
  competitorScore: number;
  userScore: number;
  competitorBreakdown: ScoreBreakdown;
  userBreakdown: ScoreBreakdown;
  competitorStrengths: string[];
  competitorWeaknesses: string[];
  userStrengths: string[];
  userWeaknesses: string[];
  personaReaction: string;
  recommendation: string;
}

interface PersonaSimulatorModalProps {
  funnel: FunnelData;
  defaultCompetitorAd?: string;
  onClose: () => void;
}

// ── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} stroke="currentColor" strokeWidth="4" fill="none" className="text-muted/40" />
          <circle
            cx="32" cy="32" r={r}
            stroke="currentColor" strokeWidth="4" fill="none"
            strokeDasharray={`${filled} ${circ}`}
            strokeLinecap="round"
            className={color}
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black text-foreground">{score}</span>
        </div>
      </div>
      <p className="text-[10px] font-semibold text-muted-foreground text-center leading-tight max-w-[70px]">{label}</p>
    </div>
  );
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  const maxPts: Record<string, number> = {
    emotionalHook: 25, problemFit: 25, benefitClarity: 20, socialProof: 15, callToAction: 15,
  };
  const max = maxPts[label.replace(/\s/g, '')] ?? 25;
  const pct = Math.round((value / max) * 100);
  const LABELS: Record<string, string> = {
    emotionalHook: 'Accroche émot.',
    problemFit: 'Adéquation pb',
    benefitClarity: 'Clarté bénéfice',
    socialProof: 'Preuve sociale',
    callToAction: "Appel à l'action",
  };

  return (
    <div className="flex items-center gap-2">
      <p className="text-[10px] text-muted-foreground w-24 shrink-0">{LABELS[label] ?? label}</p>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-bold text-foreground w-8 text-right">{value}/{max}</span>
    </div>
  );
}

// ── Persona Form ──────────────────────────────────────────────────────────────

function PersonaForm({ onCreated }: { onCreated: (p: Persona) => void }) {
  const [name, setName]     = useState('');
  const [age, setAge]       = useState('');
  const [job, setJob]       = useState('');
  const [desc, setDesc]     = useState('');
  const [pains, setPains]   = useState('');
  const [goals, setGoals]   = useState('');
  const [triggers, setTriggers] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) { setError('Le nom du persona est requis.'); return; }
    setSaving(true);
    setError(null);
    try {
      const token = await blink.auth.getValidToken();
      const res = await apiFetch<{ persona: RawPersonaRow }>(
        '/api/funnels/personas',
        {
          method: 'POST',
          token,
          body: JSON.stringify({
            name: name.trim(),
            age: age ? parseInt(age, 10) : undefined,
            jobTitle: job.trim() || undefined,
            description: desc.trim() || undefined,
            painPoints: pains.split(',').map(s => s.trim()).filter(Boolean),
            goals: goals.split(',').map(s => s.trim()).filter(Boolean),
            buyingTriggers: triggers.split(',').map(s => s.trim()).filter(Boolean),
          }),
        },
      );
      const raw = res.persona;
      onCreated({
        id: raw.id,
        name: raw.name,
        age: raw.age ?? null,
        jobTitle: raw.jobTitle ?? null,
        description: raw.description ?? null,
        painPoints: raw.painPoints ? JSON.parse(raw.painPoints as string) : [],
        goals: raw.goals ? JSON.parse(raw.goals as string) : [],
        buyingTriggers: raw.buyingTriggers ? JSON.parse(raw.buyingTriggers as string) : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">Nouveau Persona</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground">Nom *</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Ex: Directeur Marketing stressé" className="w-full text-xs bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors placeholder:text-muted-foreground/50" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground">Âge</label>
          <input type="number" value={age} onChange={e => setAge(e.target.value)}
            placeholder="40" className="w-full text-xs bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground">Poste / Rôle</label>
          <input value={job} onChange={e => setJob(e.target.value)}
            placeholder="CMO B2B" className="w-full text-xs bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors placeholder:text-muted-foreground/50" />
        </div>
        <div className="col-span-2 space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground">Description courte</label>
          <input value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Ex: Responsable de 3 personnes, sous pression résultats..." className="w-full text-xs bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors placeholder:text-muted-foreground/50" />
        </div>
        <div className="col-span-2 space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground">Problèmes (séparés par virgule)</label>
          <input value={pains} onChange={e => setPains(e.target.value)}
            placeholder="manque de temps, budget serré, ROI difficile à mesurer" className="w-full text-xs bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors placeholder:text-muted-foreground/50" />
        </div>
        <div className="col-span-2 space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground">Objectifs (séparés par virgule)</label>
          <input value={goals} onChange={e => setGoals(e.target.value)}
            placeholder="augmenter le CA, automatiser les tâches, réduire les coûts" className="w-full text-xs bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors placeholder:text-muted-foreground/50" />
        </div>
        <div className="col-span-2 space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground">Déclencheurs d'achat (séparés par virgule)</label>
          <input value={triggers} onChange={e => setTriggers(e.target.value)}
            placeholder="témoignages clients, garantie résultats, démo gratuite" className="w-full text-xs bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors placeholder:text-muted-foreground/50" />
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-all"
      >
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        {saving ? 'Enregistrement…' : 'Créer ce persona'}
      </button>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export function PersonaSimulatorModal({
  funnel,
  defaultCompetitorAd = '',
  onClose,
}: PersonaSimulatorModalProps) {
  const [personas, setPersonas]           = useState<Persona[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [showCreateForm, setShowCreateForm]   = useState(false);
  const [competitorAd, setCompetitorAd]       = useState(defaultCompetitorAd);
  const [userAd, setUserAd]                   = useState('');
  const [simulating, setSimulating]           = useState(false);
  const [result, setResult]                   = useState<SimulationResult | null>(null);
  const [error, setError]                     = useState<string | null>(null);

  // ── Load personas ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await blink.auth.getValidToken().catch(() => null);
        if (!token || cancelled) return;
        const data = await apiFetch<{ personas: RawPersonaRow[] }>(
          '/api/funnels/personas',
          { token },
        );
        if (cancelled) return;
        const parsed: Persona[] = (data.personas ?? []).map(p => ({
          ...p,
          painPoints: p.painPoints ? JSON.parse(p.painPoints as string) : [],
          goals: p.goals ? JSON.parse(p.goals as string) : [],
          buyingTriggers: p.buyingTriggers ? JSON.parse(p.buyingTriggers as string) : [],
        }));
        setPersonas(parsed);
        if (parsed.length > 0) setSelectedPersona(parsed[0]);
      } catch { /* noop */ }
      finally { if (!cancelled) setLoadingPersonas(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Delete persona ──────────────────────────────────────────────────────────
  async function deletePersona(id: string) {
    try {
      const token = await blink.auth.getValidToken();
      await apiFetch(`/api/funnels/personas/${id}`, { method: 'DELETE', token });
      setPersonas(prev => prev.filter(p => p.id !== id));
      if (selectedPersona?.id === id) setSelectedPersona(null);
    } catch { /* noop */ }
  }

  // ── Run simulation ──────────────────────────────────────────────────────────
  async function handleSimulate() {
    if (!selectedPersona || !competitorAd.trim() || !userAd.trim()) {
      setError('Sélectionnez un persona et remplissez les deux publicités.');
      return;
    }
    setSimulating(true);
    setError(null);
    setResult(null);
    try {
      const token = await blink.auth.getValidToken();
      const data = await apiFetch<SimulationResult>(
        '/api/funnels/personas/simulate',
        {
          method: 'POST',
          token,
          timeoutMs: 30_000,
          body: JSON.stringify({
            personaId: selectedPersona.id,
            competitorAd: competitorAd.trim(),
            userAd: userAd.trim(),
            funnelId: funnel.id,
          }),
        },
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la simulation.');
    } finally {
      setSimulating(false);
    }
  }

  const scoreDiff = result ? result.userScore - result.competitorScore : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain size={17} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Persona Ad Simulator</h2>
              <p className="text-[11px] text-muted-foreground">Notez vos pubs 0-100 selon la psychologie de votre cible</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">

          {/* ── Persona selector ─────────────────────────────────────────────── */}
          <div className="px-6 pt-5 pb-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <User size={10} className="inline mr-1" />Customer Persona
              </p>
              <button
                onClick={() => setShowCreateForm(v => !v)}
                className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
              >
                <Plus size={10} /> Nouveau persona
              </button>
            </div>

            {/* Create form */}
            <AnimatePresence>
              {showCreateForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-border bg-muted/30 p-3.5">
                    <PersonaForm
                      onCreated={p => {
                        setPersonas(prev => [p, ...prev]);
                        setSelectedPersona(p);
                        setShowCreateForm(false);
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Persona list */}
            {loadingPersonas ? (
              <div className="h-16 rounded-xl bg-muted/40 animate-pulse" />
            ) : personas.length === 0 && !showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full rounded-xl border border-dashed border-border py-4 text-[11px] text-muted-foreground hover:border-primary/40 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={12} /> Créer votre premier persona
              </button>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {personas.map(p => (
                  <div
                    key={p.id}
                    className={cn(
                      'group flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer transition-all',
                      selectedPersona?.id === p.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-background hover:border-primary/40'
                    )}
                    onClick={() => setSelectedPersona(p)}
                  >
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0',
                      selectedPersona?.id === p.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-foreground truncate max-w-[120px]">{p.name}</p>
                      {(p.age || p.jobTitle) && (
                        <p className="text-[9px] text-muted-foreground truncate">
                          {[p.age && `${p.age} ans`, p.jobTitle].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    {selectedPersona?.id === p.id && <Check size={10} className="text-primary shrink-0" />}
                    <button
                      onClick={e => { e.stopPropagation(); deletePersona(p.id); }}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-red-500 transition-all ml-1"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Ad inputs ────────────────────────────────────────────────────── */}
          <div className="px-6 pb-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Target size={10} className="text-red-500" /> Pub du concurrent
                </label>
                <textarea
                  value={competitorAd}
                  onChange={e => setCompetitorAd(e.target.value)}
                  placeholder={`Hook / accroche de ${funnel.creator_name}…`}
                  rows={4}
                  className="w-full text-xs bg-muted/40 border border-border rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/40 transition-colors placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Zap size={10} className="text-primary" /> Ma publicité
                </label>
                <textarea
                  value={userAd}
                  onChange={e => setUserAd(e.target.value)}
                  placeholder="Votre hook / accroche actuelle ou en cours de création…"
                  rows={4}
                  className="w-full text-xs bg-muted/40 border border-border rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 text-sm text-red-700 dark:text-red-300">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              onClick={handleSimulate}
              disabled={simulating || !selectedPersona}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {simulating
                ? <><Loader2 size={15} className="animate-spin" /> Simulation en cours…</>
                : <><Sparkles size={15} /> Simuler le test de persona <ChevronRight size={14} /></>}
            </button>
          </div>

          {/* ── Results ──────────────────────────────────────────────────────── */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 pb-6 space-y-4 border-t border-border pt-4"
              >
                {/* Score comparison */}
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4 text-center">
                    Scores selon le persona : {selectedPersona?.name}
                  </p>
                  <div className="flex items-center justify-around">
                    <ScoreRing score={result.competitorScore} label={`Pub ${funnel.creator_name}`} color="text-red-500" />
                    <div className="flex flex-col items-center gap-1">
                      {scoreDiff > 0
                        ? <TrendingUp size={20} className="text-green-500" />
                        : scoreDiff < 0
                        ? <TrendingDown size={20} className="text-red-500" />
                        : <div className="w-5 h-0.5 bg-muted-foreground" />}
                      <span className={cn('text-sm font-black',
                        scoreDiff > 0 ? 'text-green-500' : scoreDiff < 0 ? 'text-red-500' : 'text-muted-foreground'
                      )}>
                        {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff}
                      </span>
                    </div>
                    <ScoreRing score={result.userScore} label="Votre publicité" color="text-primary" />
                  </div>

                  {/* Delta interpretation */}
                  <div className={cn(
                    'mt-3 rounded-lg px-3 py-2 text-center text-[11px] font-semibold',
                    scoreDiff >= 10 ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400'
                    : scoreDiff >= 0 ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400'
                    : 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400'
                  )}>
                    {scoreDiff >= 10
                      ? `✅ Votre pub surpasse le concurrent de ${scoreDiff} points sur ce persona.`
                      : scoreDiff >= 0
                      ? `🔵 Vos pubs sont équilibrées — affinez votre pub avec les recommandations.`
                      : `⚠️ Le concurrent est ${Math.abs(scoreDiff)} pts devant sur ce persona. Améliorez votre pub.`}
                  </div>
                </div>

                {/* Breakdown side by side */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Competitor */}
                  <div className="rounded-xl border border-border p-3 space-y-2">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                      <Target size={9} /> Concurrent
                    </p>
                    {Object.entries(result.competitorBreakdown).map(([k, v]) => (
                      <BreakdownBar key={k} label={k} value={v} />
                    ))}
                    <div className="pt-1 space-y-1">
                      {result.competitorStrengths.map(s => (
                        <p key={s} className="text-[9px] text-green-600 flex items-start gap-1"><Check size={8} className="mt-0.5 shrink-0" />{s}</p>
                      ))}
                      {result.competitorWeaknesses.map(w => (
                        <p key={w} className="text-[9px] text-red-500 flex items-start gap-1"><AlertCircle size={8} className="mt-0.5 shrink-0" />{w}</p>
                      ))}
                    </div>
                  </div>

                  {/* User */}
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                      <Zap size={9} /> Votre pub
                    </p>
                    {Object.entries(result.userBreakdown).map(([k, v]) => (
                      <BreakdownBar key={k} label={k} value={v} />
                    ))}
                    <div className="pt-1 space-y-1">
                      {result.userStrengths.map(s => (
                        <p key={s} className="text-[9px] text-green-600 flex items-start gap-1"><Check size={8} className="mt-0.5 shrink-0" />{s}</p>
                      ))}
                      {result.userWeaknesses.map(w => (
                        <p key={w} className="text-[9px] text-red-500 flex items-start gap-1"><AlertCircle size={8} className="mt-0.5 shrink-0" />{w}</p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Persona reaction */}
                <div className="rounded-xl bg-muted/40 border border-border p-3.5 space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Brain size={10} /> Réaction du persona
                  </p>
                  <p className="text-xs text-foreground leading-relaxed italic">"{result.personaReaction}"</p>
                </div>

                {/* Recommendation */}
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3.5 space-y-2">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={10} /> Recommandation IA
                  </p>
                  <p className="text-xs text-foreground leading-relaxed">{result.recommendation}</p>
                </div>

                {/* Re-run */}
                <button
                  onClick={() => setResult(null)}
                  className="w-full py-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-muted transition-all"
                >
                  Modifier les publicités et relancer
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
