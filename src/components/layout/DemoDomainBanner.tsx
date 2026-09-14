/**
 * DemoDomainBanner — Persistent banner shown on demo.kompilot.fr
 * Appears at the top of the dashboard to indicate demo mode.
 * All features are unlocked — this is just a visual indicator.
 */
import { useState } from 'react';
import { X, Zap, Shield, ExternalLink } from 'lucide-react';
import { IS_DEMO_DOMAIN } from '../../lib/demoDomain';

export function DemoDomainBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (!IS_DEMO_DOMAIN || dismissed) return null;

  return (
    <div
      className="relative z-[var(--z-header)] flex h-10 max-h-10 w-full shrink-0 items-center justify-center gap-3 overflow-hidden px-3 py-2 text-sm font-semibold md:px-4"
      style={{
        zIndex: 'var(--z-header)',
        background: 'linear-gradient(90deg, rgba(13,148,136,.15) 0%, rgba(6,182,212,.12) 50%, rgba(13,148,136,.15) 100%)',
        borderBottom: '1px solid rgba(13,148,136,.25)',
        color: '#2DD4BF',
      }}
    >
      <Zap size={14} className="shrink-0" />
      <span>
        Mode Démo — Toutes les fonctionnalités sont débloquées
      </span>
      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/30">
        <Shield size={10} />
        Plan Agency
      </span>
      <a
        href="https://www.kompilot.fr"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-slate-400 hover:text-white transition-colors no-underline"
      >
        <ExternalLink size={10} />
        kompilot.fr
      </a>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/[0.1] transition-colors cursor-pointer bg-transparent border-none text-teal-400/60 hover:text-teal-300"
        aria-label="Fermer"
      >
        <X size={14} />
      </button>
    </div>
  );
}
