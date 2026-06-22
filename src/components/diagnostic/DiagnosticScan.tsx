/**
 * DiagnosticScan — Step 2: animated scanning sequence with progress steps.
 * Runs for ~4 seconds then calls onComplete.
 */
import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

const SCAN_STEPS = [
  { label: 'Localisation de l\'établissement sur Google Maps...', duration: 700 },
  { label: 'Analyse des positions dans le Pack Local (3km, 5km, 10km)...', duration: 900 },
  { label: 'Vérification de l\'exposition ChatGPT & Perplexity...', duration: 900 },
  { label: 'Audit des avis clients et score de réputation...', duration: 700 },
  { label: 'Calcul du Score de Visibilité Kompilot...', duration: 800 },
];

interface Props {
  businessName: string;
  onComplete: () => void;
}

export function DiagnosticScan({ businessName, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let stepIndex = 0;
    let elapsed = 0;
    const totalDuration = SCAN_STEPS.reduce((s, step) => s + step.duration, 0);

    // Progress bar ticker
    const ticker = setInterval(() => {
      elapsed += 50;
      setProgress(Math.min(99, (elapsed / totalDuration) * 100));
    }, 50);

    // Step sequencer
    const runSteps = async () => {
      for (const step of SCAN_STEPS) {
        setCurrentStep(stepIndex);
        await new Promise(r => setTimeout(r, step.duration));
        setCompletedSteps(prev => [...prev, stepIndex]);
        stepIndex++;
      }
      clearInterval(ticker);
      setProgress(100);
      await new Promise(r => setTimeout(r, 400));
      onComplete();
    };

    runSteps();
    return () => clearInterval(ticker);
  }, [onComplete]);

  return (
    <div className="py-8 space-y-6">
      {/* Radar animation */}
      <div className="flex justify-center">
        <div className="relative w-24 h-24">
          {/* Concentric rings */}
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping"
              style={{ animationDelay: `${i * 0.25}s`, animationDuration: '2s', transform: `scale(${i * 0.33})`, transformOrigin: 'center' }}
            />
          ))}
          <div className="absolute inset-0 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
            <div
              className="absolute w-1 h-10 bg-gradient-to-t from-primary to-transparent rounded-full origin-bottom"
              style={{ animation: 'spin 2s linear infinite', transformOrigin: '50% 100%', bottom: '50%', left: 'calc(50% - 2px)' }}
            />
            <div className="w-3 h-3 rounded-full bg-primary z-10" />
          </div>
        </div>
      </div>

      {/* Business being scanned */}
      <div className="text-center">
        <p className="text-sm font-bold text-foreground">Scan en cours</p>
        <p className="text-xs text-muted-foreground mt-0.5">{businessName}</p>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-teal-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground text-right tabular-nums">{Math.round(progress)}%</p>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {SCAN_STEPS.map((step, i) => {
          const done = completedSteps.includes(i);
          const active = currentStep === i && !done;
          return (
            <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${active ? 'bg-primary/8 border border-primary/20' : done ? 'opacity-60' : 'opacity-30'}`}>
              {done ? (
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              ) : active ? (
                <Loader2 size={14} className="text-primary shrink-0 animate-spin" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
              )}
              <p className={`text-xs ${active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Analyse alimentée par l'IA Kompilot · Données temps réel
      </p>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
