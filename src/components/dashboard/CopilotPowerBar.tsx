import { useState } from 'react';
import { CheckCircle2, Trophy } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';

const MICRO_ACTIONS = [
  {
    id: 'faq',
    emoji: '🗝️',
    title: 'Compléter la FAQ sémantique',
    description: "Ajoutez 5 questions/réponses pour que l'IA comprenne votre secteur",
    credits: 10,
  },
  {
    id: 'photos',
    emoji: '📸',
    title: 'Ajouter 3 photos à votre fiche Google',
    description: 'Des photos récentes augmentent les clics de 42%',
    credits: 8,
  },
  {
    id: 'reviews',
    emoji: '⭐',
    title: 'Répondre à vos 2 avis en attente',
    description: 'Chaque réponse améliore votre score de réputation',
    credits: 12,
  },
];

const BASE_POWER = 45;
const POWER_PER_ACTION = 18;

const CONFETTI_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#f97316'];

function ConfettiPiece({ color, left, delay }: { color: string; left: number; delay: number }) {
  return (
    <span
      className="confetti-piece"
      style={{
        position: 'absolute',
        top: 0,
        left: `${left}%`,
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        animationDelay: `${delay}ms`,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
}

function ConfettiBurst() {
  const pieces = Array.from({ length: 10 }, (_, i) => ({
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: 5 + i * 9,
    delay: i * 50,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} {...p} />
      ))}
    </div>
  );
}

export function CopilotPowerBar() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [bursting, setBursting] = useState<Set<string>>(new Set());

  const powerLevel = Math.min(100, BASE_POWER + completed.size * POWER_PER_ACTION);

  function handleValidate(actionId: string, credits: number, title: string) {
    if (completed.has(actionId)) return;

    setCompleted((prev) => new Set(prev).add(actionId));
    setBursting((prev) => new Set(prev).add(actionId));

    toast.success(`+${credits} Crédits G.E.A. gagnés !`, {
      description: `"${title}" complétée avec succès.`,
    });

    setTimeout(() => {
      setBursting((prev) => {
        const next = new Set(prev);
        next.delete(actionId);
        return next;
      });
    }, 900);
  }

  return (
    <>
      <style>{`
        @keyframes confetti {
          0%   { transform: translateY(0) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(60px) rotate(360deg); opacity: 0; }
        }
        .confetti-piece {
          animation: confetti 0.85s ease-out forwards;
        }
        @keyframes power-fill {
          from { width: 0%; }
        }
        .power-bar-fill {
          transition: width 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      <div
        className="rounded-2xl border p-5 flex flex-col gap-4"
        style={{
          background: 'hsl(var(--background))',
          borderColor: 'hsl(var(--border, 220 13% 22%))',
          boxShadow: '0 4px 24px -4px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5" style={{ color: '#f59e0b' }} />
          <span className="font-semibold text-base" style={{ color: 'hsl(var(--foreground))' }}>
            🏆 Puissance de votre Copilote
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground) / 0.6)' }}>
              Niveau de puissance de votre Copilote
            </span>
            <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>
              {powerLevel}%
            </span>
          </div>
          <div
            className="h-3 rounded-full overflow-hidden"
            style={{ background: 'hsl(var(--accent, 220 13% 16%))' }}
          >
            <div
              className="power-bar-fill h-full rounded-full"
              style={{
                width: `${powerLevel}%`,
                background: 'linear-gradient(90deg, #f59e0b 0%, #ef4444 60%, #f97316 100%)',
              }}
            />
          </div>
        </div>

        {/* Action cards */}
        <div className="flex flex-col gap-3">
          {MICRO_ACTIONS.map((action) => {
            const isDone = completed.has(action.id);
            const isBursting = bursting.has(action.id);

            return (
              <div
                key={action.id}
                className="relative rounded-xl border p-3.5 flex items-start gap-3 overflow-hidden"
                style={{
                  borderColor: isDone ? '#10b981' : 'hsl(var(--border, 220 13% 22%))',
                  background: isDone
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'hsl(var(--accent, 220 13% 13%) / 0.4)',
                  transition: 'border-color 0.3s, background 0.3s',
                }}
              >
                {isBursting && <ConfettiBurst />}

                {/* Emoji */}
                <span className="text-2xl leading-none shrink-0 mt-0.5">{action.emoji}</span>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className="text-sm font-semibold leading-snug"
                      style={{
                        color: isDone ? '#10b981' : 'hsl(var(--foreground))',
                        transition: 'color 0.3s',
                      }}
                    >
                      {action.title}
                    </p>
                    {isDone && <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#10b981' }} />}
                  </div>
                  <p
                    className="text-xs mt-0.5 leading-relaxed"
                    style={{ color: 'hsl(var(--foreground) / 0.55)' }}
                  >
                    {action.description}
                  </p>
                  <div className="flex items-center justify-between mt-2.5 gap-2">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: isDone ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.12)',
                        color: isDone ? '#10b981' : '#f59e0b',
                      }}
                    >
                      +{action.credits} Crédits G.E.A.
                    </span>
                    {!isDone ? (
                      <button
                        onClick={() => handleValidate(action.id, action.credits, action.title)}
                        className="text-xs font-semibold px-3 py-1 rounded-lg"
                        style={{
                          background: 'hsl(var(--primary))',
                          color: 'hsl(var(--primary-foreground))',
                          transition: 'opacity 0.15s, transform 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
                        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        Valider
                      </button>
                    ) : (
                      <span className="text-xs font-semibold" style={{ color: '#10b981' }}>
                        Complétée ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
