/**
 * DemoAutoLoginPage (/demo)
 * ─────────────────────────────────────────────────────────────────────────────
 * Page demo integree au layout de la landing page (LandingNav + LandingFooter).
 *
 * Le bouton "Se connecter" dans LandingNav redirige vers /login.
 * Le CTA "Accéder à la démo" écrit la session sandbox et ouvre /demo/dashboard
 * via rechargement complet.
 *
 * ISOLATION: Aucun appel Blink Auth ou Firebase n'est effectue par le bypass.
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, UserCircle, Building2, Play, Zap, LogIn, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { LandingNav } from '../components/landing/LandingNav';
import { LandingFooter } from '../components/landing/LandingFooter';
import { PWABanner } from '../components/layout/PWABanner';
import { LANDING_CSS } from '../components/landing/LandingPageStyles';
import ROISimulatorWidget, { type DemoPersona } from '../components/demo/ROISimulatorWidget';
import PremiumWinProvider from '../components/shared/PremiumWinEngine';
import { PersonaTab } from './demo/DemoShared';
import { MerchantView } from './demo/MerchantView';
import { FreelanceView } from './demo/FreelanceView';
import { AgencyView } from './demo/AgencyView';
import { GeoScanSection } from './demo/GeoScanSection';
import { OfficialSectorSelector } from '../components/demo/OfficialSectorSelector';
import { saveDemoSession } from '../lib/demoAccount';
import type { OfficialSector } from '../data/sectors/sectorCatalog';

// ── Storage keys (must match DemoModeContext + DemoViewContext) ───────────────
const DEMO_ACTIVE_KEY = 'kompilot_demo_active_session';
const SWITCHER_KEY    = 'kompilot_switcher_unlocked';
const CREDITS_KEY     = 'kompilot_demo_credits_v1';

type Audience = 'commerce' | 'agency';

const getStoredSector = (): OfficialSector => {
  try {
    const value = localStorage.getItem('kompilot_demo_sector');
    return value === 'restaurant' || value === 'artisan' || value === 'beaute' || value === 'sante' || value === 'immobilier' || value === 'commerce' ? value : 'restaurant';
  } catch { return 'restaurant'; }
};

export default function DemoAutoLoginPage() {
  const [activePersona, setActivePersona] = useState<DemoPersona>('merchant');
  const [audience, setAudience] = useState<Audience>('commerce');
  const [selectedSector, setSelectedSector] = useState<OfficialSector>(getStoredSector);
  const navigate = useNavigate();

  // ── SEO meta ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = 'Démo Kompilot — Testez le cockpit IA marketing';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Explorez le cockpit Kompilot avec des données simulées, testez les parcours de prospection et découvrez les offres Starter et Agency.');
  }, []);

  // ── Auto-login: prepare the sandbox before native route navigation ────────
  const activateDemo = useCallback(() => {
    try {
      saveDemoSession();
      sessionStorage.setItem(DEMO_ACTIVE_KEY, 'true');
      localStorage.setItem(SWITCHER_KEY, '1');
      localStorage.setItem(CREDITS_KEY, '0');
      localStorage.setItem('kompilot_demo_sector', selectedSector);
      window.dispatchEvent(new CustomEvent('kompilot:sector-change', { detail: selectedSector }));
      // Start the demo in a fresh module/runtime so main.tsx installs the
      // local DB, auth, AI and backend-fetch guards before dashboard providers mount.
      window.location.assign('/demo/dashboard');
    } catch (err) {
      console.error('[Demo] Failed to activate:', err);
    }
  }, [navigate, selectedSector]);

  return (
    <PremiumWinProvider>
      <PWABanner />
      <div
        style={{ backgroundColor: '#0B1120', color: '#E2E8F0', fontFamily: 'var(--font-sans), sans-serif' }}
        className="min-h-screen overflow-x-hidden" data-demo-sector={selectedSector} data-selected-sector={selectedSector}
      >
        <style>{LANDING_CSS}</style>
        <style>{`
          @keyframes demoActivatePulse { 0%,100% { box-shadow: 0 0 0 0 rgba(13,148,136,.4) } 50% { box-shadow: 0 0 0 10px rgba(13,148,136,0) } }
          .demo-cta-pulse { animation: demoActivatePulse 2s ease-in-out infinite; }
        `}</style>

        {/* ── Header (same as landing page) ──────────────────────────────── */}
        <header>
          <LandingNav
            audience={audience}
            setAudience={setAudience}
            onCta={() => navigate({ to: '/signup' })}
            isLoggedIn={false}
          />
        </header>

        {/* ── Demo hero banner ───────────────────────────────────────────── */}
        <section
          style={{
            background: 'linear-gradient(135deg, rgba(13,148,136,.12) 0%, rgba(6,95,91,.08) 50%, rgba(11,17,32,0) 100%)',
            borderBottom: '1px solid rgba(13,148,136,.15)',
          }}
          className="px-4 md:px-8 pt-8 pb-10"
        >
          <div className="max-w-[1120px] mx-auto flex flex-col lg:flex-row items-center gap-8">
            {/* Left: text + CTA */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  <Play size={11} fill="currentColor" />
                  Mode Démonstration
                </span>
                <span className="text-[11px] text-slate-500">
                  Explorez sans créer de compte
                </span>
              </div>

              <h1 className="text-3xl md:text-[2.6rem] font-extrabold leading-tight mb-3" style={{ lineHeight: 1.15 }}>
                Testez Kompilot
                <span className="text-teal-400"> en conditions réelles</span>
              </h1>

              <p className="text-slate-400 text-sm md:text-base max-w-xl leading-relaxed mb-5">
                Naviguez dans le tableau de bord complet, testez les fonctionnalités de gestion
                de présence locale, publications, avis Google, et ROI — sans inscription.
              </p>

              {/* Sector selector */}
              <div className="mb-6">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Votre secteur d'activité
                </p>
                <OfficialSectorSelector
                  value={selectedSector}
                  onChange={(value) => {
                    setSelectedSector(value);
                    try { localStorage.setItem('kompilot_demo_sector', value); } catch { /* noop */ }
                    window.dispatchEvent(new CustomEvent('kompilot:sector-change', { detail: value }));
                  }}
                />
                <p data-testid="demo-sector-summary" data-selected-sector={selectedSector} aria-live="polite" className="mt-3 rounded-lg border border-teal-400/15 bg-teal-400/[0.06] px-3 py-2 text-xs text-teal-100">
                  Secteur actif : <strong>{selectedSector}</strong> · {selectedSector === 'restaurant' ? 'Menus, réservations et avis gourmands.' : selectedSector === 'artisan' ? 'Devis, chantiers et appels qualifiés.' : selectedSector === 'beaute' ? 'Rendez-vous, transformations et fidélisation.' : selectedSector === 'sante' ? 'Rendez-vous, informations fiables et confidentialité.' : selectedSector === 'immobilier' ? 'Estimations, visites et mandats locaux.' : 'Arrivages, visites en boutique et fidélisation.'}
                </p>
                <output data-testid="demo-sector-value" className="sr-only" aria-live="assertive">{selectedSector}</output>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Main CTA: auto-login demo */}
                <button
                  type="button"
                  onClick={activateDemo}
                  data-testid="demo-primary-cta"
                  className="demo-cta-pulse inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold cursor-pointer transition-all bg-teal-500 hover:bg-teal-600 text-white hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Zap size={15} />
                  Accéder à la démo complète
                </button>

                {/* Secondary: go to login */}
                <button
                  type="button"
                  onClick={() => navigate({ to: '/login' })}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all bg-white/[0.06] border border-white/[0.12] text-slate-300 hover:bg-white/[0.1] hover:text-white"
                >
                  <LogIn size={14} />
                  Connexion client
                </button>
              </div>
            </div>

            {/* Right: sandbox reassurance */}
            <div className="w-full lg:w-auto lg:min-w-[280px] bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-400/70 mb-3">
                Accès instantané
              </p>
              <div className="space-y-2.5 mb-4">
                <p className="flex items-center gap-2 text-xs text-slate-300"><Check size={14} className="text-teal-300" /> Aucun compte à créer</p>
                <p className="flex items-center gap-2 text-xs text-slate-300"><Check size={14} className="text-teal-300" /> Données et actions simulées</p>
                <p className="flex items-center gap-2 text-xs text-slate-300"><Check size={14} className="text-teal-300" /> Réinitialisation à la visite suivante</p>
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed">
                La démo ne connecte aucun réseau social et ne déclenche aucun paiement.
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 md:px-8 py-6 border-b border-white/[0.07]">
          <div className="max-w-[1120px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-teal-500/20 bg-teal-500/[0.06] p-4">
              <p className="text-[10px] uppercase tracking-wider font-bold text-teal-300">Starter</p>
              <p className="mt-1 text-lg font-extrabold text-white">69€ <span className="text-xs font-medium text-slate-400">HT / mois</span></p>
              <p className="mt-1 text-xs text-slate-400">Facturation annuelle disponible · 1 mois offert</p>
              <button onClick={() => navigate({ to: '/pricing-pro' })} className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-teal-500/30 px-3 py-2 text-xs font-bold text-teal-300 transition hover:bg-teal-500/10">Découvrir Starter <ArrowRight size={13} /></button>
            </div>
            <div className="rounded-2xl border border-violet-400/30 bg-violet-500/[0.08] p-4 md:scale-[1.02]">
              <div className="flex items-center justify-between gap-2"><p className="text-[10px] uppercase tracking-wider font-bold text-violet-300">Agency</p><span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-2 py-0.5 text-[9px] font-bold text-violet-200">RECOMMANDÉ</span></div>
              <p className="mt-1 text-lg font-extrabold text-white">149€ <span className="text-xs font-medium text-slate-400">HT / mois</span></p>
              <p className="mt-1 text-xs text-slate-400">Facturation annuelle disponible · 1 mois offert</p>
              <button onClick={() => navigate({ to: '/pricing-agency' })} className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-violet-400 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-violet-300">Découvrir Agency <ArrowRight size={13} /></button>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Dans la démo</p>
              <div className="mt-2 space-y-1.5 text-xs text-slate-300"><p className="flex items-center gap-2"><Check size={13} className="text-teal-300" /> Données simulées et sans risque</p><p className="flex items-center gap-2"><Check size={13} className="text-teal-300" /> Parcours responsive</p><p className="flex items-center gap-2"><Check size={13} className="text-teal-300" /> Aucun abonnement lancé</p></div>
            </div>
          </div>
        </section>

        {/* ── Persona tabs ───────────────────────────────────────────────── */}
        <section className="px-4 md:px-8 pt-8">
          <div className="max-w-[1120px] mx-auto">
            <div className="flex flex-wrap justify-center gap-2 md:gap-3 py-4">
              <PersonaTab
                active={activePersona === 'merchant'}
                onClick={() => setActivePersona('merchant')}
                icon={<Store className="w-4 h-4" />}
                label="Vue Commerçant"
              />
              <PersonaTab
                active={activePersona === 'freelance'}
                onClick={() => setActivePersona('freelance')}
                icon={<UserCircle className="w-4 h-4" />}
                label="Vue Artisan / Bâtiment"
              />
              <PersonaTab
                active={activePersona === 'agency'}
                onClick={() => setActivePersona('agency')}
                icon={<Building2 className="w-4 h-4" />}
                label="Vue Agence Premium"
              />
            </div>

            {/* ── Dashboard preview + ROI simulator ──────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
              {/* Left: dashboard preview */}
              <div className="min-w-0">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 border-t border-white/[0.07]" />
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 whitespace-nowrap">
                    Aperçu du tableau de bord
                  </span>
                  <div className="flex-1 border-t border-white/[0.07]" />
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePersona}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activePersona === 'merchant'  && <MerchantView />}
                    {activePersona === 'freelance' && <FreelanceView />}
                    {activePersona === 'agency'    && <AgencyView />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right: ROI Simulator sticky */}
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
                <p className="text-center text-[10px] text-slate-500">
                  Calcul local — aucune donnée envoyée
                </p>
              </div>
            </div>

            {/* ── GEO scan section ───────────────────────────────────────── */}
            <div className="mt-16">
              <GeoScanSection />
            </div>

            {/* ── Bottom CTA ─────────────────────────────────────────────── */}
            <div className="mt-16 py-12 border-t border-white/[0.07] text-center">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
                Prêt à déployer Kompilot pour votre activité ?
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Explorez la sandbox, puis choisissez Starter ou Agency quand vous êtes prêt — sans paiement depuis la démo.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={activateDemo}
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-bold cursor-pointer transition-all bg-teal-500 hover:bg-teal-600 text-white hover:scale-105 active:scale-100 shadow-xl"
                >
                  <Zap size={16} />
                  Démarrer la démo maintenant
                </button>
                <button
                  onClick={() => navigate({ to: '/signup' })}
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-semibold cursor-pointer transition-all bg-white/[0.06] border border-white/[0.12] text-slate-300 hover:bg-white/[0.1] hover:text-white"
                >
                  Créer mon espace →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer (same as landing page) ──────────────────────────────── */}
        <LandingFooter />
      </div>
    </PremiumWinProvider>
  );
}
