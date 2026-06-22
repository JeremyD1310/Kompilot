/**
 * DemoPage (/demo) — Mode démonstration public
 *
 * Layout :
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  Bannière fixe teal (h-14)                              │
 *   ├──────────────────────────────────┬──────────────────────┤
 *   │  Onglets persona                 │                      │
 *   │  Aperçu dashboard (gauche)       │  ROISimulatorWidget  │
 *   │                                  │  sticky (droite)     │
 *   ├──────────────────────────────────┴──────────────────────┤
 *   │  GeoScanSection (pleine largeur)                        │
 *   └─────────────────────────────────────────────────────────┘
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, UserCircle, Building2 } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { useNavigate } from '@tanstack/react-router';
import ROISimulatorWidget, { type DemoPersona } from '@/components/demo/ROISimulatorWidget';
import PremiumWinProvider from '@/components/shared/PremiumWinEngine';
import { PersonaTab } from './demo/DemoShared';
import { MerchantView } from './demo/MerchantView';
import { FreelanceView } from './demo/FreelanceView';
import { AgencyView } from './demo/AgencyView';
import { GeoScanSection } from './demo/GeoScanSection';

export default function DemoPage() {
  const [activePersona, setActivePersona] = useState<DemoPersona>('merchant');
  const navigate = useNavigate();
  const goSignup = () => navigate({ to: '/signup' });

  return (
    <PremiumWinProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] pb-24">

        {/* Bannière fixe */}
        <div className="fixed top-0 left-0 right-0 h-14 bg-[#0D9488] text-white z-50 flex items-center justify-between px-4 md:px-8 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="hidden sm:inline">🎯 Mode Démonstration — Explorez Kompilot sans créer de compte</span>
            <span className="sm:hidden font-bold">Kompilot Demo</span>
          </div>
          <Button
            onClick={goSignup}
            className="bg-white text-[#0D9488] hover:bg-slate-100 font-bold text-xs md:text-sm px-3 md:px-4 h-9 shrink-0"
          >
            Créer mon espace 🚀
          </Button>
        </div>

        <div className="pt-20 max-w-7xl mx-auto px-4">

          {/* Onglets persona */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 py-8">
            <PersonaTab active={activePersona === 'merchant'} onClick={() => setActivePersona('merchant')} icon={<Store className="w-4 h-4" />} label="Vue Commerçant" />
            <PersonaTab active={activePersona === 'freelance'} onClick={() => setActivePersona('freelance')} icon={<UserCircle className="w-4 h-4" />} label="Vue Artisan / Bâtiment" />
            <PersonaTab active={activePersona === 'agency'} onClick={() => setActivePersona('agency')} icon={<Building2 className="w-4 h-4" />} label="Vue Agence Premium" />
          </div>

          {/* Grille 2 colonnes : dashboard + widget ROI */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

            {/* Colonne gauche : aperçu dashboard */}
            <div className="min-w-0">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 whitespace-nowrap">
                  Aperçu du tableau de bord
                </span>
                <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activePersona}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3 }}
                >
                  {activePersona === 'merchant'  && <MerchantView  />}
                  {activePersona === 'freelance' && <FreelanceView />}
                  {activePersona === 'agency'    && <AgencyView    />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Colonne droite : ROI Simulator sticky */}
            <div className="lg:sticky lg:top-20 space-y-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePersona}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.28 }}
                >
                  <ROISimulatorWidget persona={activePersona} />
                </motion.div>
              </AnimatePresence>
              <p className="text-center text-[10px] text-slate-400">
                🔒 Calcul local — aucune donnée envoyée
              </p>
            </div>
          </div>

          {/* GEO scan + live social demo section */}
          <div className="mt-16">
            <GeoScanSection />
          </div>

          {/* CTA bas de page */}
          <div className="mt-16 py-12 border-t border-slate-200 dark:border-slate-800 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Prêt à déployer Kompilot pour votre activité ?
            </h2>
            <Button
              size="lg"
              onClick={goSignup}
              className="bg-[#0D9488] hover:bg-[#0B7A6F] text-white font-bold px-8 h-14 rounded-full shadow-xl transition-all hover:scale-105"
            >
              Démarrer mon essai gratuit — 14 jours
            </Button>
          </div>

        </div>
      </div>
    </PremiumWinProvider>
  );
}
