/**
 * CopilotIdleView — vue "Non activé" du widget One-Click.
 * Agents preview · Bouton massif avec shimmer · Garanties
 */

import { useState } from 'react';
import { Zap, ArrowRight, Shield, Bot, BarChart3, Activity } from 'lucide-react';

const AGENTS = [
  { icon: <Bot size={14} />,       label: 'Content Factory',  desc: 'Publie vos posts',          color: 'bg-violet-500/10 text-violet-500' },
  { icon: <BarChart3 size={14} />, label: 'Ad Spy',           desc: 'Surveille vos concurrents', color: 'bg-blue-500/10 text-blue-500' },
  { icon: <Activity size={14} />,  label: 'Account Manager',  desc: 'Répond aux avis',           color: 'bg-teal-500/10 text-teal-500' },
] as const;

export function CopilotIdleView({ onActivate }: { onActivate: () => void }) {
  const [pressed,  setPressed]  = useState(false);
  const [shimmer,  setShimmer]  = useState(false);

  const handleClick = () => {
    setShimmer(true);
    onActivate();
  };

  return (
    <div className="space-y-5 relative">

      {/* Agents preview */}
      <div className="grid grid-cols-3 gap-2">
        {AGENTS.map(a => (
          <div
            key={a.label}
            className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-border/70 bg-muted/20 hover:bg-primary/5 hover:border-primary/25 transition-all duration-200 cursor-default text-center"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${a.color}`}>
              {a.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold text-foreground leading-tight">{a.label}</p>
              <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{a.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Baseline */}
      <p className="text-[12px] text-muted-foreground leading-relaxed text-center">
        Un seul clic active{' '}
        <span className="text-foreground font-semibold">3 agents IA</span>,
        le scan AIO et le calendrier éditorial.{' '}
        <span className="text-foreground font-semibold">Aucune configuration.</span>
      </p>

      {/* ── Bouton One-Click principal ── */}
      <button
        onClick={handleClick}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        className="relative w-full overflow-hidden flex items-center justify-between gap-3 text-primary-foreground font-bold text-[0.9rem] px-5 rounded-2xl transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        style={{
          minHeight: 60,
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(173 80% 36%) 100%)',
          boxShadow: pressed
            ? '0 2px 12px hsl(var(--primary) / 0.3)'
            : '0 6px 28px hsl(var(--primary) / 0.4), 0 1px 3px hsl(var(--primary) / 0.2)',
          transform: pressed ? 'scale(0.985)' : 'scale(1)',
        }}
      >
        {/* Shimmer d'activation */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-in-out pointer-events-none"
          style={{ transform: shimmer ? 'translateX(100%)' : 'translateX(-150%)' }}
        />

        <div className="flex items-center gap-3 z-10">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-sm">
            <Zap size={17} className="fill-white text-white" />
          </div>
          <div className="text-left">
            <span className="block leading-tight">Activer le Copilote Marketing AI</span>
            <span className="block text-[11px] font-normal opacity-70">Lancer l'optimisation automatique →</span>
          </div>
        </div>
        <ArrowRight
          size={17}
          className="z-10 shrink-0 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
        />
      </button>

      {/* Garanties */}
      <div className="flex items-center justify-center gap-5 flex-wrap">
        {['Sans engagement', 'RGPD conforme', 'Résultats en 24h'].map(t => (
          <span key={t} className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
            <Shield size={9} className="text-primary/60 shrink-0" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
