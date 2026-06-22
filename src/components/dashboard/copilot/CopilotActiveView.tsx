/**
 * CopilotActiveView — vue "Actif & Optimisé" du widget.
 * Bandeau succès · Grille modules avec pulse tournant · Reset discret
 */

import { useEffect, useState } from 'react';
import { CheckCircle2, Bot, BarChart3, Cpu, Activity, Layers, Radio } from 'lucide-react';

const MODULES = [
  { icon: <Bot size={12} />,       label: 'Content Factory',  sub: 'Génère vos posts auto',         color: 'bg-violet-500/10 text-violet-500' },
  { icon: <BarChart3 size={12} />, label: 'Scan AIO',         sub: 'ChatGPT · Gemini · Perplexity', color: 'bg-blue-500/10 text-blue-500' },
  { icon: <Cpu size={12} />,       label: 'Pilotage auto',    sub: 'Calendrier & réponses IA',       color: 'bg-primary/10 text-primary' },
  { icon: <Activity size={12} />,  label: 'Account Manager',  sub: 'Réponses aux avis Google',       color: 'bg-teal-500/10 text-teal-500' },
  { icon: <Layers size={12} />,    label: 'Ad Spy',           sub: 'Veille concurrentielle',         color: 'bg-amber-500/10 text-amber-500' },
  { icon: <Radio size={12} />,     label: 'AIO Sync',         sub: 'Optimisation continue',          color: 'bg-rose-500/10 text-rose-500' },
] as const;

export function CopilotActiveView({
  activatedAt,
  onReset,
}: {
  activatedAt: string | null;
  onReset: () => void;
}) {
  const [pulseIdx, setPulseIdx] = useState(0);

  // Pulse tournant — impression de systèmes actifs
  useEffect(() => {
    const t = setInterval(() => setPulseIdx(i => (i + 1) % MODULES.length), 1800);
    return () => clearInterval(t);
  }, []);

  const formattedDate = activatedAt
    ? new Date(activatedAt).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <div className="space-y-4">

      {/* ── Bandeau succès ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-4"
        style={{
          background: 'linear-gradient(135deg, hsl(152 72% 10% / 0.8) 0%, hsl(173 80% 8% / 0.8) 100%)',
          border: '1px solid hsl(152 60% 30% / 0.35)',
        }}
      >
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl"
          style={{ background: 'radial-gradient(circle, hsl(152 72% 36% / 0.25) 0%, transparent 70%)' }}
        />
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, hsl(152 72% 36%) 0%, hsl(173 80% 36%) 100%)',
              boxShadow: '0 4px 16px hsl(152 72% 36% / 0.4)',
            }}
          >
            <CheckCircle2 size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-emerald-300 leading-tight">Copilote Marketing en ligne</p>
            <p className="text-[11px] text-emerald-500/80 mt-0.5">
              {formattedDate ? `Actif depuis le ${formattedDate}` : 'Vos agents IA travaillent 24h/24.'}
            </p>
          </div>
          {/* Mini-VU-meter animé */}
          <div className="flex items-end gap-[3px] shrink-0 h-5">
            {[4, 8, 5, 10, 6].map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-emerald-500 opacity-70"
                style={{
                  height: h + 'px',
                  animation: `vuPulse ${0.6 + i * 0.13}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Keyframe vu-meter via style tag */}
      <style>{`@keyframes vuPulse { from { transform: scaleY(0.4); } to { transform: scaleY(1.1); } }`}</style>

      {/* ── Grille des modules ── */}
      <div className="grid grid-cols-2 gap-1.5">
        {MODULES.map((m, i) => (
          <div
            key={i}
            className="flex items-center gap-2 p-2.5 rounded-xl border transition-all duration-500 cursor-default"
            style={{
              background: i === pulseIdx ? 'hsl(var(--primary) / 0.04)' : 'hsl(var(--muted) / 0.3)',
              borderColor: i === pulseIdx ? 'hsl(var(--primary) / 0.25)' : 'hsl(var(--border) / 0.6)',
            }}
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${m.color}`}>
              {m.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-foreground leading-tight truncate">{m.label}</p>
              <p className="text-[9px] text-muted-foreground truncate">{m.sub}</p>
            </div>
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300"
              style={{
                background: i === pulseIdx ? 'hsl(var(--primary))' : 'hsl(152 72% 44%)',
                boxShadow: i === pulseIdx ? '0 0 5px hsl(var(--primary) / 0.8)' : 'none',
              }}
            />
          </div>
        ))}
      </div>

      {/* Reset discret */}
      <button
        onClick={onReset}
        className="w-full text-center text-[10px] text-muted-foreground/35 hover:text-muted-foreground/60 transition-colors py-1 cursor-pointer"
      >
        Réinitialiser le Copilote
      </button>
    </div>
  );
}
