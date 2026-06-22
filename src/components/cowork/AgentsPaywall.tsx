/**
 * AgentsPaywall — locked overlay shown to trial users.
 */
import { Lock, Crown, ArrowRight } from 'lucide-react';
import { cn } from '@blinkdotnew/ui';

interface Props {
  planName: string;
}

const GHOST_GRADIENTS = [
  { gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent', border: 'border-emerald-500/20' },
  { gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent', border: 'border-blue-500/20' },
  { gradient: 'from-violet-500/10 via-purple-500/5 to-transparent', border: 'border-violet-500/20' },
];

export function AgentsPaywall({ planName }: Props) {
  const isAgency = planName.toLowerCase().includes('expert') || planName.toLowerCase().includes('agence');

  return (
    <div className="relative rounded-2xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
      {/* Blurred preview */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center max-w-sm px-6 py-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-indigo-300" />
          </div>
          <h3 className="text-white font-black text-base mb-2">
            🔒 Équipe d'Agents IA Autonomes
          </h3>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed">
            Ce module est disponible dès la fin de votre période d'essai.
            Activez votre abonnement pour débloquer vos agents autonomes.
          </p>
          <div className="flex flex-col gap-2 mb-5">
            <div className={cn(
              'flex items-center justify-between rounded-xl border px-4 py-2.5',
              !isAgency ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-slate-700/40 bg-slate-800/30',
            )}>
              <div className="flex items-center gap-2">
                <Crown size={14} className="text-indigo-400" />
                <span className="text-sm font-bold text-white">Forfait Pro</span>
              </div>
              <span className="text-sm font-black text-indigo-300">+30€/HT/mois</span>
            </div>
            <div className={cn(
              'flex items-center justify-between rounded-xl border px-4 py-2.5',
              isAgency ? 'border-violet-500/40 bg-violet-500/10' : 'border-slate-700/40 bg-slate-800/30',
            )}>
              <div className="flex items-center gap-2">
                <Crown size={14} className="text-violet-400" />
                <span className="text-sm font-bold text-white">Forfait Agence</span>
              </div>
              <span className="text-sm font-black text-violet-300">+50€/HT/mois</span>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-bold py-3 text-sm transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40">
            Activer mon abonnement <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Ghost content */}
      <div className="blur-sm pointer-events-none select-none p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-30">
        {GHOST_GRADIENTS.map((g, i) => (
          <div key={i} className={cn('h-52 rounded-2xl border bg-gradient-to-br', g.gradient, g.border)} />
        ))}
      </div>
      <div className="blur-sm pointer-events-none select-none px-5 pb-5 opacity-20">
        <div className="h-36 rounded-2xl bg-slate-900 border border-slate-800" />
      </div>
    </div>
  );
}
