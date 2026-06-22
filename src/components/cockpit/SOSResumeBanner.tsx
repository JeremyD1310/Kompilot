import React, { useEffect, useState } from 'react';
import { SOSCrisisStorage } from './SOSCrisisModal';
import { Button } from '@blinkdotnew/ui';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SOSResumeBanner() {
  const [sosState, setSosState] = useState(SOSCrisisStorage.getState());

  useEffect(() => {
    const handleSOSChange = (e: any) => {
      setSosState(e.detail);
    };

    window.addEventListener('kompilot:sos-changed', handleSOSChange);
    return () => window.removeEventListener('kompilot:sos-changed', handleSOSChange);
  }, []);

  if (!sosState.active) return null;

  const handleDeactivate = () => {
    SOSCrisisStorage.deactivate();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[90] bg-gradient-to-r from-red-600 via-orange-600 to-red-600 border-b border-white/20 shadow-lg px-4 h-12 flex items-center justify-between"
      >
        <div className="flex items-center gap-3 text-white overflow-hidden">
          <div className="bg-white/20 p-1 rounded-lg shrink-0">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
          </div>
          <p className="text-sm font-bold truncate">
            Mode SOS actif — Votre établissement est marqué comme temporairement fermé.
            <span className="hidden md:inline ml-2 opacity-90 font-medium border-l border-white/30 pl-2">
              {sosState.reason} • {sosState.duration}
            </span>
          </p>
        </div>

        <Button
          onClick={handleDeactivate}
          size="sm"
          className="bg-white text-green-600 hover:bg-green-50 font-bold gap-2 shadow-sm shrink-0 h-8 px-3 rounded-lg border-0"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span className="hidden sm:inline">Reprendre l'activité normale</span>
          <span className="sm:hidden">Reprendre</span>
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
