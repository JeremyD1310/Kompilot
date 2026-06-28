/**
 * SandboxToggle — Switch between Live Data and Demo Mode.
 *
 * Placed at the top of the dashboard. When APIs are unavailable or the user
 * wants to explore, they can toggle to Demo Mode instantly.
 *
 * Design: Dark pill toggle, minimal footprint, teal accent.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Sparkles, AlertTriangle, ChevronDown } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { useDemoMode } from '../../context/DemoModeContext';
import { useIntegrationStatus } from '../../context/IntegrationStatusContext';

type DataSource = 'live' | 'demo';

export function SandboxToggle() {
  const { isDemoActive, activateDemo, deactivateDemo } = useDemoMode();
  const { problemCount, hasCriticalFailure } = useIntegrationStatus();
  const [expanded, setExpanded] = useState(false);

  const currentSource: DataSource = isDemoActive ? 'demo' : 'live';

  const handleToggle = (target: DataSource) => {
    if (target === currentSource) return;
    if (target === 'demo') {
      activateDemo();
      toast.success('Mode Démo activé', {
        description: 'Données simulées chargées. Explorez librement !',
      });
    } else {
      deactivateDemo();
      toast('Données Live', {
        description: 'Retour aux données réelles.',
      });
    }
    setExpanded(false);
  };

  return (
    <div className="relative">
      {/* Main toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer"
        style={{
          background: isDemoActive
            ? 'rgba(139, 92, 246, 0.12)'
            : 'rgba(13, 148, 136, 0.1)',
          borderColor: isDemoActive
            ? 'rgba(139, 92, 246, 0.3)'
            : 'rgba(13, 148, 136, 0.25)',
          color: isDemoActive ? '#a78bfa' : '#0D9488',
        }}
      >
        {isDemoActive ? (
          <Sparkles size={13} />
        ) : (
          <Database size={13} />
        )}
        {isDemoActive ? 'Démo' : 'Live'}
        {problemCount > 0 && !isDemoActive && (
          <span className="ml-1 w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center">
            {problemCount}
          </span>
        )}
        <ChevronDown size={11} className={`transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-64 rounded-xl border overflow-hidden z-50"
            style={{
              background: 'rgba(15, 23, 42, 0.97)',
              borderColor: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div className="p-3 space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#475569' }}>
                Source de données
              </p>

              {/* Live option */}
              <button
                onClick={() => handleToggle('live')}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 cursor-pointer"
                style={{
                  background: currentSource === 'live' ? 'rgba(13,148,136,0.12)' : 'transparent',
                  border: currentSource === 'live' ? '1px solid rgba(13,148,136,0.25)' : '1px solid transparent',
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(13,148,136,0.15)' }}>
                  <Database size={15} color="#0D9488" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Données Live</p>
                  <p className="text-[11px]" style={{ color: '#64748B' }}>
                    Vos vraies données connectées
                  </p>
                </div>
                {currentSource === 'live' && (
                  <div className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                )}
              </button>

              {/* Demo option */}
              <button
                onClick={() => handleToggle('demo')}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 cursor-pointer"
                style={{
                  background: currentSource === 'demo' ? 'rgba(139,92,246,0.12)' : 'transparent',
                  border: currentSource === 'demo' ? '1px solid rgba(139,92,246,0.25)' : '1px solid transparent',
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(139,92,246,0.15)' }}>
                  <Sparkles size={15} color="#a78bfa" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Mode Démo</p>
                  <p className="text-[11px]" style={{ color: '#64748B' }}>
                    Données simulées pour explorer
                  </p>
                </div>
                {currentSource === 'demo' && (
                  <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                )}
              </button>

              {/* Critical failure warning */}
              {hasCriticalFailure && !isDemoActive && (
                <div className="flex items-start gap-2 mt-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" color="#f59e0b" />
                  <p className="text-[11px] leading-relaxed" style={{ color: '#fbbf24' }}>
                    Certaines API sont indisponibles. Le mode démo vous permet de continuer à explorer.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
