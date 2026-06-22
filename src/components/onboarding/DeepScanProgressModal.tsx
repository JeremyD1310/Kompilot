/**
 * DeepScanProgressModal — MODULE 1
 * Realistic 35-second deep scan animation that builds the UI step by step.
 * Triggered when the user clicks "Lancer la recherche" in AgencyLeadSearchPage.
 */
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Brain, Search, Star, Eye,
  CheckCircle2, Loader2, Globe, Wifi,
  ShieldCheck, BarChart2,
} from 'lucide-react';

// ── Scan step definitions (35 seconds total) ─────────────────────────────────

interface ScanStep {
  id: string;
  icon: typeof MapPin;
  label: string;
  detail: string;
  durationMs: number;   // how long this step takes
  startPct: number;     // progress bar % when step starts
  endPct: number;       // progress bar % when step ends
  color: string;
  result?: string;      // fake result shown after step completes
}

const SCAN_STEPS: ScanStep[] = [
  {
    id: 'connect',
    icon: Wifi,
    label: 'Connexion aux API Google Maps',
    detail: 'Établissement de la session sécurisée...',
    durationMs: 3500,
    startPct: 0,
    endPct: 12,
    color: 'text-blue-500',
    result: '✓ Connexion établie — Places API v3',
  },
  {
    id: 'places',
    icon: MapPin,
    label: 'Extraction des établissements locaux',
    detail: 'Scraping Google Places dans un rayon de 15 km...',
    durationMs: 5000,
    startPct: 12,
    endPct: 28,
    color: 'text-teal-500',
    result: '✓ 47 établissements détectés',
  },
  {
    id: 'reviews',
    icon: Star,
    label: 'Extraction des avis Google Business',
    detail: 'Analyse des avis non répondus et scores de réputation...',
    durationMs: 5000,
    startPct: 28,
    endPct: 44,
    color: 'text-amber-500',
    result: '✓ 312 avis analysés — 23 sans réponse détectés',
  },
  {
    id: 'geo',
    label: 'Analyse des citations ChatGPT / Gemini',
    icon: Brain,
    detail: 'Détection de la présence dans les réponses IA locales...',
    durationMs: 5500,
    startPct: 44,
    endPct: 60,
    color: 'text-violet-500',
    result: '✓ 18 établissements absents des recommandations IA',
  },
  {
    id: 'perplexity',
    icon: Search,
    label: 'Scannage sémantique Perplexity',
    detail: 'Vérification des index de recommandation intelligente...',
    durationMs: 4000,
    startPct: 60,
    endPct: 72,
    color: 'text-indigo-500',
    result: '✓ Score sémantique moyen : 34/100',
  },
  {
    id: 'visibility',
    icon: Eye,
    label: 'Détection de part de voix locale',
    detail: 'Calcul du share-of-voice sur les recherches clés...',
    durationMs: 4000,
    startPct: 72,
    endPct: 85,
    color: 'text-emerald-500',
    result: '✓ 12 opportunités de marché identifiées',
  },
  {
    id: 'score',
    icon: BarChart2,
    label: 'Scoring et priorisation des prospects',
    detail: 'Attribution des scores G.E.O. et tri par priorité...',
    durationMs: 3500,
    startPct: 85,
    endPct: 95,
    color: 'text-primary',
    result: '✓ 8 prospects haute valeur détectés',
  },
  {
    id: 'final',
    icon: ShieldCheck,
    label: 'Finalisation et sécurisation des données',
    detail: 'Chiffrement et compilation du rapport final...',
    durationMs: 2500,
    startPct: 95,
    endPct: 100,
    color: 'text-green-500',
    result: '✓ Rapport prêt — 47 prospects analysés',
  },
];

// ── Progress bar (animated) ───────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{
          background: 'linear-gradient(90deg, #0D9488, #059669)',
          boxShadow: '0 0 10px rgba(13,148,136,0.5)',
        }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ── Step row ──────────────────────────────────────────────────────────────────

function StepRow({ step, status, result }: {
  step: ScanStep;
  status: 'pending' | 'active' | 'done';
  result?: string;
}) {
  const Icon = step.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0 transition-all ${
        status === 'pending' ? 'opacity-30' : 'opacity-100'
      }`}
    >
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
        status === 'done'
          ? 'bg-green-100 dark:bg-green-900/30'
          : status === 'active'
            ? 'bg-primary/10'
            : 'bg-muted'
      }`}>
        {status === 'done' ? (
          <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />
        ) : status === 'active' ? (
          <Loader2 size={14} className={`animate-spin ${step.color}`} />
        ) : (
          <Icon size={14} className="text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${
          status === 'active' ? 'text-foreground' : status === 'done' ? 'text-muted-foreground' : 'text-muted-foreground/60'
        }`}>
          {step.label}
        </p>
        {status === 'active' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground mt-0.5 italic"
          >
            {step.detail}
          </motion.p>
        )}
        {status === 'done' && result && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] text-green-600 dark:text-green-400 font-medium mt-0.5"
          >
            {result}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  query?: string;
  location?: string;
  onComplete: () => void;
  onCancel?: () => void;
}

export function DeepScanProgressModal({
  open,
  query = 'Restaurants',
  location = 'Paris',
  onComplete,
  onCancel,
}: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!open) return;

    // Reset state
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setProgress(0);
    setDone(false);

    let elapsed = 0;

    SCAN_STEPS.forEach((step, idx) => {
      // Start this step
      const startTimer = setTimeout(() => {
        setCurrentStep(idx);
        setProgress(step.startPct);
      }, elapsed);
      timerRef.current.push(startTimer);

      // Animate progress during this step
      const midTimer = setTimeout(() => {
        setProgress(step.endPct);
      }, elapsed + step.durationMs / 2);
      timerRef.current.push(midTimer);

      // End this step
      const endTimer = setTimeout(() => {
        setProgress(step.endPct);
        setCompletedSteps(prev => new Set([...prev, idx]));
      }, elapsed + step.durationMs);
      timerRef.current.push(endTimer);

      elapsed += step.durationMs;
    });

    // Final completion
    const doneTimer = setTimeout(() => {
      setDone(true);
      setProgress(100);
    }, elapsed + 300);
    timerRef.current.push(doneTimer);

    const closeTimer = setTimeout(() => {
      onComplete();
    }, elapsed + 1800);
    timerRef.current.push(closeTimer);

    return () => {
      timerRef.current.forEach(clearTimeout);
      timerRef.current = [];
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div
          className="px-6 py-5 border-b border-border"
          style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.12) 0%, rgba(5,150,105,0.06) 100%)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #0D9488, #059669)' }}
            >
              <Globe size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-foreground text-base">Analyse G.E.O. en cours</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-semibold text-primary">{query}</span> · {location}
              </p>
            </div>
            {!done && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 size={12} className="animate-spin" />
                <span className="tabular-nums font-mono">{Math.round(progress)}%</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <ProgressBar pct={progress} />

          {done && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-2 text-sm font-bold text-green-600 dark:text-green-400"
            >
              <CheckCircle2 size={16} />
              Analyse terminée — Résultats chargés
            </motion.div>
          )}
        </div>

        {/* Steps */}
        <div className="px-6 py-4 max-h-80 overflow-y-auto">
          {SCAN_STEPS.map((step, idx) => {
            let status: 'pending' | 'active' | 'done' = 'pending';
            if (completedSteps.has(idx)) status = 'done';
            else if (currentStep === idx) status = 'active';

            return (
              <StepRow
                key={step.id}
                step={step}
                status={status}
                result={step.result}
              />
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground italic">
            🔒 Données traitées localement — aucun stockage permanent
          </p>
          {onCancel && !done && (
            <button
              onClick={onCancel}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Annuler
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
