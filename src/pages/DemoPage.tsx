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
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, UserCircle, Building2, Network, ArrowRight } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { useNavigate } from '@tanstack/react-router';
import ROISimulatorWidget from '@/components/demo/ROISimulatorWidget';
import PremiumWinProvider from '@/components/shared/PremiumWinEngine';
import { PersonaTab } from './demo/DemoShared';
import { MerchantView } from './demo/MerchantView';
import { FreelanceView } from './demo/FreelanceView';
import { AgencyView } from './demo/AgencyView';
import { GeoScanSection } from './demo/GeoScanSection';
import { DemoSafetyNotice } from '@/components/demo/DemoSafetyNotice';
import { useDemoData } from '../context/DemoDataProvider';
import type { DemoProfile } from '../lib/demoProductData';
import type { DemoPersona } from '@/components/demo/ROISimulatorWidget';

const personaToProfile: Record<DemoPersona, DemoProfile> = {
  merchant: 'commerce',
  freelance: 'artisan',
  agency: 'agency',
  multi_location: 'network',
};

export default function DemoPage() {
  const [activePersona, setActivePersona] = useState<DemoPersona>('merchant');
  const [demoInfoOpen, setDemoInfoOpen] = useState(false);
  const { setProfile, resetDemo } = useDemoData();
  const navigate = useNavigate();
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setDemoInfoOpen(false); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const goSignup = () => navigate({ to: '/signup' });
  const selectPersona = (persona: DemoPersona) => {
    setActivePersona(persona);
    setProfile(personaToProfile[persona]);
  };
  const enterWorkspace = () => navigate({ to: '/demo/workspace' });

  return (
    <PremiumWinProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] pb-24">

        {/* Compact demo header */}
        <div className="fixed left-0 right-0 top-0 z-50 flex min-h-12 items-center justify-between border-b border-teal-700 bg-[#0D9488] px-3 text-white shadow-md sm:px-6">
          <button type="button" onClick={() => setDemoInfoOpen(true)} className="min-h-11 rounded-xl px-2 text-left text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-white" aria-hidden="true" /> Kompilot <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] uppercase tracking-wide">Démo</span></span>
          </button>
          <Button onClick={goSignup} className="min-h-11 bg-white px-3 text-xs font-bold text-[#0D9488] hover:bg-slate-100">Créer mon espace</Button>
        </div>
        {demoInfoOpen && <div className="fixed inset-0 z-[60] bg-slate-950/40" role="presentation" onMouseDown={event => event.target === event.currentTarget && setDemoInfoOpen(false)}><section role="dialog" aria-modal="true" aria-labelledby="demo-info-title" className="absolute inset-x-0 top-12 rounded-b-2xl bg-white p-4 shadow-2xl sm:inset-x-4 sm:top-16 sm:rounded-2xl"><div className="flex items-start justify-between gap-3"><div><h2 id="demo-info-title" className="text-base font-bold text-slate-950">Mode démonstration</h2><p className="mt-1 text-sm leading-6 text-slate-600">Explorez un cockpit fictif sans créer de compte. Les actions sont locales et aucune donnée client ou connexion externe n’est utilisée.</p></div><button type="button" onClick={() => setDemoInfoOpen(false)} aria-label="Fermer les informations de démonstration" className="min-h-11 min-w-11 rounded-xl text-xl text-slate-600 hover:bg-slate-100">×</button></div><p className="mt-3 rounded-xl bg-teal-50 p-3 text-xs font-semibold text-teal-900">Mode démo — aucun envoi réel</p></section></div>}

        <div className="pt-20 max-w-7xl mx-auto px-4">

          {/* Choix de profil avant exploration du vrai cockpit */}
          <section className="mx-auto max-w-5xl py-8 text-center">
            <DemoSafetyNotice />
            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">Explorez le cockpit Kompilot</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 md:text-base">Choisissez un profil, puis parcourez cinq étapes : priorité, validation, simulation, résultats et prochaine décision. Aucun compte, aucune connexion client et aucune écriture de production.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Profils de démonstration">
              <button onClick={() => selectPersona('merchant')} aria-pressed={activePersona === 'merchant'} className={`flex min-h-24 flex-col items-start gap-2 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 ${activePersona === 'merchant' ? 'border-teal-600 ring-2 ring-teal-100' : 'border-slate-200'}`}><Store size={20} className="text-teal-700" /><span className="text-sm font-bold">Commerce local</span><span className="text-xs text-slate-500">Avis, fiche Google, contenu local</span></button>
              <button onClick={() => selectPersona('freelance')} aria-pressed={activePersona === 'freelance'} className={`flex min-h-24 flex-col items-start gap-2 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 ${activePersona === 'freelance' ? 'border-teal-600 ring-2 ring-teal-100' : 'border-slate-200'}`}><UserCircle size={20} className="text-teal-700" /><span className="text-sm font-bold">Artisan ou PME</span><span className="text-xs text-slate-500">Réalisation, post, prospects locaux</span></button>
              <button onClick={() => selectPersona('agency')} aria-pressed={activePersona === 'agency'} className={`flex min-h-24 flex-col items-start gap-2 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 ${activePersona === 'agency' ? 'border-teal-600 ring-2 ring-teal-100' : 'border-slate-200'}`}><Building2 size={20} className="text-teal-700" /><span className="text-sm font-bold">Agence</span><span className="text-xs text-slate-500">Clients, alertes, rapports marque blanche</span></button>
              <button onClick={() => selectPersona('multi_location')} aria-pressed={activePersona === 'multi_location'} className={`flex min-h-24 flex-col items-start gap-2 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 ${activePersona === 'multi_location' ? 'border-teal-600 ring-2 ring-teal-100' : 'border-slate-200'}`}><Network size={20} className="text-teal-700" /><span className="text-sm font-bold">Multi-établissements</span><span className="text-xs text-slate-500">Cohérence et rapport consolidé</span></button>
            </div>
          </section>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 pb-8">
            <PersonaTab active={activePersona === 'merchant'} onClick={() => selectPersona('merchant')} icon={<Store className="w-4 h-4" />} label="Aperçu Commerce" />
            <PersonaTab active={activePersona === 'freelance'} onClick={() => selectPersona('freelance')} icon={<UserCircle className="w-4 h-4" />} label="Aperçu Artisan" />
            <PersonaTab active={activePersona === 'agency'} onClick={() => selectPersona('agency')} icon={<Building2 className="w-4 h-4" />} label="Aperçu Agence" />
            <PersonaTab active={activePersona === 'multi_location'} onClick={() => selectPersona('multi_location')} icon={<Network className="w-4 h-4" />} label="Aperçu Multi-sites" />
          </div>

          <div className="flex flex-wrap justify-center gap-3 pb-8">
            <Button size="lg" onClick={enterWorkspace} className="gap-2 bg-[#0D9488] px-6 font-bold text-white hover:bg-[#0B7A6F]">

              Explorer le cockpit <ArrowRight size={16} />
            </Button>
            <Button size="lg" variant="outline" onClick={resetDemo} className="gap-2 border-slate-300 px-6 font-bold text-slate-700">Réinitialiser la démo</Button>
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
                  {(activePersona === 'agency' || activePersona === 'multi_location') && <AgencyView    />}
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
              Calcul local · estimation indicative · aucune donnée envoyée
              </p>
            </div>
          </div>

          {/* GEO scan + live social demo section */}
          <div className="mt-16">
            <GeoScanSection />
          </div>

          {/* CTA bas de page */}
          <div className="mt-16 py-12 border-t border-slate-200 dark:border-slate-800 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Vous voulez voir le vrai cockpit ?
            </h2>
            <p className="mx-auto mb-6 max-w-xl text-sm text-slate-500">Explorez d’abord la démonstration locale, puis créez votre espace pour mesurer vos propres résultats.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={enterWorkspace} className="gap-2 border border-[#0D9488] bg-transparent text-[#0D9488] hover:bg-teal-50 font-bold px-6 h-12"><ArrowRight size={16} /> Explorer le cockpit</Button>
              <Button size="lg" onClick={goSignup} className="bg-[#0D9488] hover:bg-[#0B7A6F] text-white font-bold px-6 h-12">Créer mon espace</Button>
            </div>
          </div>

        </div>
      </div>
    </PremiumWinProvider>
  );
}
