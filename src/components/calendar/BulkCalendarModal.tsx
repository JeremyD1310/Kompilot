/**
 * BulkCalendarModal
 * 3-step wizard to collect: objective · tone · frequency
 * Then triggers AI generation and opens BulkCalendarResultView.
 */
import { useState } from 'react';
import { X, Sparkles, Target, Palette, Clock, ChevronRight } from 'lucide-react';
import { CreditCostBadge, useCreditGuard } from '../shared/CreditCostBadge';
import { useAsyncJob } from '../../hooks/useAsyncJob';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface BulkCalendarConfig {
  objective: string;
  tone: string;
  frequency: string; // e.g. "2_week", "3_week", "daily"
}

interface Props {
  open: boolean;
  onClose: () => void;
  onGenerate: (config: BulkCalendarConfig) => void;
}

// ── Options ────────────────────────────────────────────────────────────────────

const OBJECTIVES = [
  { id: 'promo', emoji: '🎁', label: 'Promouvoir une prestation', desc: 'Mettre en avant une offre ou un service phare ce mois-ci' },
  { id: 'recruit', emoji: '🧑‍💼', label: 'Recruter', desc: 'Attirer des candidats et valoriser la culture de l\'entreprise' },
  { id: 'notoriete', emoji: '🌟', label: 'Notoriété locale', desc: 'Renforcer la présence locale et fidéliser la clientèle de proximité' },
  { id: 'engagement', emoji: '💬', label: 'Engagement communauté', desc: 'Animer la communauté, lancer des sondages et favoriser les interactions' },
  { id: 'evenement', emoji: '📅', label: 'Préparer un événement', desc: 'Créer l\'anticipation autour d\'une ouverture, d\'une soirée ou d\'un lancement' },
  { id: 'saisonnier', emoji: '🌸', label: 'Thème saisonnier', desc: 'Surfer sur une tendance ou une période calendaire (été, fêtes, rentrée…)' },
];

const TONES = [
  { id: 'warm', emoji: '😊', label: 'Chaleureux', desc: 'Proximité, authenticité, bienveillance' },
  { id: 'pro', emoji: '💼', label: 'Professionnel', desc: 'Expert, crédible, rassurant' },
  { id: 'casual', emoji: '🤙', label: 'Décontracté', desc: 'Fun, naturel, proche du client' },
  { id: 'inspiring', emoji: '✨', label: 'Inspirant', desc: 'Ambitieux, aspirationnel, motivant' },
  { id: 'urgent', emoji: '⚡', label: 'Urgent / Promo', desc: 'Offres limitées, CTA forts, sentiment d\'exclusivité' },
  { id: 'storytelling', emoji: '📖', label: 'Storytelling', desc: 'Coulisses, récits, histoires humaines' },
];

const FREQUENCIES = [
  { id: '2_week', emoji: '📅', label: '2 posts / semaine', postsCount: 8, desc: 'Idéal pour maintenir la présence sans surcharger' },
  { id: '3_week', emoji: '🗓️', label: '3 posts / semaine', postsCount: 12, desc: 'Rythme optimal pour la plupart des commerces locaux' },
  { id: '5_week', emoji: '📆', label: '5 posts / semaine', postsCount: 20, desc: 'Fort engagement, nécessite des contenus variés' },
  { id: 'daily', emoji: '🔥', label: 'Tous les jours', postsCount: 30, desc: 'Visibilité maximale — recommandé offre Business/Expert' },
];

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current ? 'bg-primary w-6' : i === current ? 'bg-primary w-4' : 'bg-muted w-3'
          }`}
        />
      ))}
    </div>
  );
}

// ── Option card ────────────────────────────────────────────────────────────────

function OptionCard<T extends string>({
  id, emoji, label, desc, selected, onSelect,
}: { id: T; emoji: string; label: string; desc: string; selected: boolean; onSelect: (id: T) => void }) {
  return (
    <button
      onClick={() => onSelect(id)}
      className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all active:scale-[0.98] ${
        selected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
          : 'border-border hover:border-primary/40 hover:bg-muted/40'
      }`}
    >
      <span className="text-xl shrink-0 mt-0.5">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground leading-tight">{label}</p>
        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{desc}</p>
      </div>
      {selected && (
        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      )}
    </button>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────

export function BulkCalendarModal({ open, onClose, onGenerate }: Props) {
  const [step, setStep] = useState(0);
  const [objective, setObjective] = useState('');
  const [tone, setTone] = useState('');
  const [frequency, setFrequency] = useState('');
  const [generating, setGenerating] = useState(false);
  const { fire: fireCalendar, isActive: calendarRunning, progress: calendarProgress } = useAsyncJob<BulkCalendarConfig>('bulk_calendar');

  const { guard: creditGuard, modalNode: creditModal } = useCreditGuard({ cost: 30, action: 'BULK_CALENDAR' });

  const STEPS = ['Objectif', 'Ton', 'Fréquence'];

  if (!open) return null;

  const handleClose = () => {
    setStep(0); setObjective(''); setTone(''); setFrequency('');
    onClose();
  };

  const canNext = () => {
    if (step === 0) return !!objective;
    if (step === 1) return !!tone;
    if (step === 2) return !!frequency;
    return false;
  };

  const handleNext = async () => {
    if (step < 2) {
      setStep(s => s + 1);
    } else {
      // Level 4 action: 30 credits — check balance before proceeding
      const proceed = creditGuard(async () => {
        const config = { objective, tone, frequency };
        fireCalendar(
          async () => { await new Promise(r => setTimeout(r, 400)); return config; },
          { onDone: (result) => onGenerate(result) }
        );
        handleClose();
      });
      if (!proceed) return;
    }
  };

  const selectedFreq = FREQUENCIES.find(f => f.id === frequency);
  const selectedObj = OBJECTIVES.find(o => o.id === objective);
  const selectedTone = TONES.find(t => t.id === tone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 px-6 py-5 border-b border-border bg-gradient-to-r from-primary/10 to-violet-500/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shrink-0 shadow-lg">
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-foreground text-base">Générer 30 jours de posts en 1 clic ✨</p>
            <p className="text-xs text-muted-foreground mt-0.5">L'IA crée une stratégie de contenu équilibrée pour tout le mois</p>
          </div>
          <StepDots current={step} total={3} />
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 ml-2">
            <X size={18} />
          </button>
        </div>

        {/* Step label */}
        <div className="shrink-0 flex items-center gap-2 px-6 py-3 border-b border-border bg-muted/20">
          {step === 0 && <><Target size={14} className="text-primary" /><span className="text-xs font-bold text-foreground">Étape 1/3 — Quel est l'objectif ce mois-ci ?</span></>}
          {step === 1 && <><Palette size={14} className="text-primary" /><span className="text-xs font-bold text-foreground">Étape 2/3 — Quel est votre ton ?</span></>}
          {step === 2 && <><Clock size={14} className="text-primary" /><span className="text-xs font-bold text-foreground">Étape 3/3 — Fréquence souhaitée ?</span></>}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {OBJECTIVES.map(obj => (
                <OptionCard<string>
                  key={obj.id}
                  id={obj.id}
                  emoji={obj.emoji}
                  label={obj.label}
                  desc={obj.desc}
                  selected={objective === obj.id}
                  onSelect={setObjective}
                />
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TONES.map(t => (
                <OptionCard<string>
                  key={t.id}
                  id={t.id}
                  emoji={t.emoji}
                  label={t.label}
                  desc={t.desc}
                  selected={tone === t.id}
                  onSelect={setTone}
                />
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2.5">
              {FREQUENCIES.map(f => (
                <OptionCard<string>
                  key={f.id}
                  id={f.id}
                  emoji={f.emoji}
                  label={`${f.label} — ${f.postsCount} posts générés`}
                  desc={f.desc}
                  selected={frequency === f.id}
                  onSelect={setFrequency}
                />
              ))}

              {/* Summary */}
              {objective && tone && frequency && (
                <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 space-y-2">
                  <p className="text-xs font-bold text-primary uppercase tracking-wide">📋 Récapitulatif de votre campagne</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Objectif</p>
                      <p className="font-semibold text-foreground">{selectedObj?.emoji} {selectedObj?.label}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ton</p>
                      <p className="font-semibold text-foreground">{selectedTone?.emoji} {selectedTone?.label}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Posts générés</p>
                      <p className="font-semibold text-foreground">{selectedFreq?.postsCount} posts</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-muted/10">
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Retour
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleNext}
            disabled={!canNext() || generating}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
              step === 2
                ? 'bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-700'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {calendarRunning ? (
              <><span className="inline-block w-3 h-3 rounded-full bg-white/60 animate-pulse mr-1" /> Copilote au travail… {calendarProgress}%</>
            ) : step === 2 ? (
              <><Sparkles size={15} /> ✨ Générer mon calendrier de 30 jours <CreditCostBadge cost={30} variant="ghost" className="text-white/80" /></>
            ) : (
              <>Suivant <ChevronRight size={15} /></>
            )}
          </button>
        </div>
      </div>
      {creditModal}
    </div>
  );
}
