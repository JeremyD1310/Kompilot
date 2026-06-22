import { useEffect, useMemo } from 'react';

// ── Confetti particles (generated once at module load) ─────────────────────

const COLORS = [
  '#0d9488', '#14b8a6', '#fbbf24', '#f59e0b',
  '#ec4899', '#8b5cf6', '#3b82f6', '#22c55e',
  '#ef4444', '#f97316', '#a855f7', '#06b6d4',
];

interface Particle {
  id: number;
  left: number;
  color: string;
  width: number;
  height: number;
  duration: number;
  delay: number;
  borderRadius: string;
  startRotation: number;
}

// Fixed seed so particles are the same every time
const PARTICLES: Particle[] = Array.from({ length: 80 }, (_, i) => {
  const rng = (seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };
  return {
    id: i,
    left: rng(i + 0.1) * 100,
    color: COLORS[i % COLORS.length],
    width: 5 + rng(i + 0.2) * 9,
    height: 8 + rng(i + 0.3) * 14,
    duration: 2.5 + rng(i + 0.4) * 2.2,
    delay: rng(i + 0.5) * 1.8,
    borderRadius: rng(i + 0.6) > 0.65 ? '50%' : '2px',
    startRotation: rng(i + 0.7) * 360,
  };
});

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  firstName?: string;
  onClose: () => void;
}

export function FirstPostCelebration({ firstName, onClose }: Props) {
  const name = firstName?.trim() || '';

  // Inject keyframe CSS once
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'nc-confetti-style';
    if (!document.getElementById('nc-confetti-style')) {
      style.innerHTML = `
        @keyframes nc-confetti-fall {
          0%   { transform: translateY(-40px) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(108vh) rotate(540deg); opacity: 0; }
        }
        @keyframes nc-modal-pop {
          0%   { opacity: 0; transform: scale(0.85) translateY(12px); }
          60%  { transform: scale(1.03) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes nc-badge-spin {
          from { transform: rotate(-8deg) scale(1); }
          50%  { transform: rotate(8deg) scale(1.1); }
          to   { transform: rotate(-8deg) scale(1); }
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById('nc-confetti-style');
      if (el) el.remove();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center"
      style={{ pointerEvents: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      {/* Confetti particles */}
      {PARTICLES.map(p => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            left: `${p.left}%`,
            top: 0,
            width: `${p.width}px`,
            height: `${p.height}px`,
            backgroundColor: p.color,
            borderRadius: p.borderRadius,
            transform: `rotate(${p.startRotation}deg)`,
            animation: `nc-confetti-fall ${p.duration}s ${p.delay}s linear forwards`,
            pointerEvents: 'none',
            zIndex: 401,
          }}
        />
      ))}

      {/* Modal card */}
      <div
        className="relative z-[402] bg-card border border-border rounded-3xl shadow-2xl px-8 py-8 w-full max-w-sm mx-4 text-center"
        style={{ animation: 'nc-modal-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
      >
        {/* Trophy emoji with pulse */}
        <div
          className="text-5xl mb-4 inline-block select-none"
          style={{ animation: 'nc-badge-spin 2.4s ease-in-out infinite' }}
        >
          🎉
        </div>

        {/* Decorative stars */}
        <div className="absolute top-4 right-4 text-2xl opacity-60 select-none">⭐</div>
        <div className="absolute top-6 left-5 text-xl opacity-40 select-none">✨</div>

        <h2 className="text-xl font-extrabold text-foreground mb-3 leading-tight">
          Première étape franchie !
        </h2>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          {name ? (
            <>
              Félicitations <span className="font-bold text-primary">{name}</span> !{' '}
            </>
          ) : (
            'Félicitations ! '
          )}
          Votre première publication optimisée par IA est en route pour dynamiser vos réseaux.
          C'est le début d'une grande visibilité pour votre activité !
        </p>

        {/* Stats pills */}
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          {['🚀 Publication planifiée', '✅ IA activée', '📈 Visibilité en route'].map(tag => (
            <span
              key={tag}
              className="text-[11px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-1"
            >
              {tag}
            </span>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground text-sm font-extrabold py-3.5 hover:opacity-90 active:scale-[0.97] transition-all shadow-lg"
        >
          Génial, merci ! 🙌
        </button>

        <p className="text-[10px] text-muted-foreground mt-3">
          Retrouvez cette publication dans votre Calendrier
        </p>
      </div>
    </div>
  );
}
