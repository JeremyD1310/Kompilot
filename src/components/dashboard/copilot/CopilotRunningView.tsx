/**
 * CopilotRunningView — vue "En cours d'initialisation".
 * Orb cinématique + log défilant + barre de progression
 */

import { useEffect, useRef } from 'react';
import { CinematicOrb, LogLine } from './CopilotPrimitives';

export function CopilotRunningView({ steps, progress, currentStepLabel }: {
  steps: { id: string; label: string; sublabel?: string; done: boolean; active: boolean; error: boolean }[];
  progress: number;
  currentStepLabel: string;
}) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [steps]);

  return (
    <div className="space-y-5">
      {/* Orb */}
      <CinematicOrb progress={progress} />

      {/* Étape courante */}
      {currentStepLabel && (
        <p className="text-center text-[12px] text-muted-foreground animate-pulse px-4 leading-relaxed">
          {currentStepLabel}
        </p>
      )}

      {/* Barre de progression */}
      <div className="relative h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(173 80% 50%))',
            boxShadow: '0 0 8px hsl(var(--primary) / 0.6)',
          }}
        />
      </div>

      {/* Log défilant */}
      <div
        ref={logRef}
        className="space-y-2.5 max-h-44 overflow-y-auto pr-1"
        style={{ scrollBehavior: 'smooth' }}
      >
        {steps.map(s => (
          <LogLine
            key={s.id}
            label={s.label}
            sublabel={s.sublabel}
            done={s.done}
            active={s.active}
            error={s.error}
          />
        ))}
      </div>

      <p className="text-[10px] text-center text-muted-foreground/40">
        Ne fermez pas cette fenêtre pendant l'initialisation
      </p>
    </div>
  );
}
