/**
 * CopilotActivationWidget v4 — "Cinematic One-Click"
 *
 * Philosophie WP Rocket : toute la complexité (LLMs, agents AIO, sync API)
 * disparaît derrière une UX fluide qui donne la sensation de "magie instantanée".
 *
 * Ce fichier est le simple assembleur des sous-modules :
 *   CopilotPrimitives  → atoms (Skeleton, StatusPill, LogLine, Orb, HeroBg)
 *   CopilotIdleView    → CTA massif + agents preview
 *   CopilotRunningView → orb cinématique + log défilant
 *   CopilotActiveView  → modules live avec pulse tournant
 *   CopilotErrorView   → diagnostic + retry non-bloquant
 */

import { Sparkles } from 'lucide-react';
import { useKompilotActivation } from '../../hooks/useKompilotActivation';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useAuth } from '../../hooks/useAuth';

import { ActivationSkeleton, StatusPill, HeroBackground } from './copilot/CopilotPrimitives';
import { CopilotIdleView }    from './copilot/CopilotIdleView';
import { CopilotRunningView } from './copilot/CopilotRunningView';
import { CopilotActiveView }  from './copilot/CopilotActiveView';
import { CopilotErrorView }   from './copilot/CopilotErrorView';

export function CopilotActivationWidget() {
  const { user }               = useAuth();
  const { activeEstablishment } = useEstablishment();

  const {
    status, steps, progress, currentStepLabel,
    errorMsg, activatedAt,
    activate, retry, reset,
  } = useKompilotActivation(activeEstablishment?.id, user?.id);

  if (status === 'loading') return <ActivationSkeleton />;

  return (
    <div
      className="rounded-2xl border border-border bg-card overflow-hidden"
      style={{ isolation: 'isolate' }}
    >

      {/* ── En-tête ─────────────────────────────────────────────────────────── */}
      <div className="relative flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
        {/* Glow header (idle/active) */}
        {(status === 'idle' || status === 'active') && (
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{ background: 'radial-gradient(ellipse at top right, hsl(var(--primary) / 0.08) 0%, transparent 70%)' }}
          />
        )}

        <div className="flex items-center gap-2.5 relative z-10">
          {/* Icône dynamique */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500"
            style={{
              background: status === 'active'
                ? 'linear-gradient(135deg, hsl(152 72% 30%) 0%, hsl(173 80% 28%) 100%)'
                : 'hsl(var(--primary) / 0.1)',
              boxShadow: status === 'active' ? '0 2px 10px hsl(152 72% 36% / 0.4)' : 'none',
            }}
          >
            <Sparkles
              size={14}
              style={{ color: status === 'active' ? '#ffffff' : 'hsl(var(--primary))' }}
              className="transition-colors duration-300"
            />
          </div>

          <div>
            <p className="font-bold text-foreground text-[13.5px] leading-tight">Copilote Marketing AI</p>
            <p className="text-[10px] text-muted-foreground">Pilotage automatique de votre présence</p>
          </div>
        </div>

        <StatusPill status={status} />
      </div>

      {/* ── Corps ───────────────────────────────────────────────────────────── */}
      <div className="relative px-5 py-5">
        {status === 'idle' && <HeroBackground />}

        <div className="relative z-10">
          {status === 'idle'    && <CopilotIdleView onActivate={activate} />}
          {status === 'running' && (
            <CopilotRunningView steps={steps} progress={progress} currentStepLabel={currentStepLabel} />
          )}
          {status === 'active'  && (
            <CopilotActiveView activatedAt={activatedAt} onReset={reset} />
          )}
          {status === 'error'   && (
            <CopilotErrorView errorMsg={errorMsg} steps={steps} onRetry={retry} onReset={reset} />
          )}
        </div>
      </div>
    </div>
  );
}
