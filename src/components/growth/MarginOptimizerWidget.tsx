/**
 * MarginOptimizerWidget — Moteur de Rendement & de Saturation
 *
 * Analyse le taux d'occupation de l'agenda. Si > 85%, l'IA génère
 * une notification maïeutique premium : revalorisation tarifaire ou
 * élévation de l'empreinte bancaire Stripe.
 *
 * Données simulées basées sur les KPIs de l'établissement actif.
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Zap, ChevronDown, ChevronUp,
  ArrowUpRight, Lock, CalendarDays, DollarSign,
  CheckCircle2, Info, RefreshCw
} from 'lucide-react';
import { Badge, Button } from '@blinkdotnew/ui';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { usePlan } from '../../hooks/usePlan';
import { Link } from '@tanstack/react-router';

// ── Saturation thresholds ─────────────────────────────────────────────────────
const THRESHOLD_HIGH   = 85;  // Revalorisation tarifaire suggérée
const THRESHOLD_CRITICAL = 95; // Empreinte bancaire plus haute

// ── Sector price adjustment data ──────────────────────────────────────────────
interface SectorPricing {
  avgIncrease: number;  // % augmentation recommandée
  stripeIncrease: number; // €  montant empreinte recommandé
  timeframe: string;
  maieuticQuestion: string;
  actionLabel: string;
  actionRoute: string;
}

const SECTOR_PRICING: Record<string, SectorPricing> = {
  flux: {
    avgIncrease: 15,
    stripeIncrease: 50,
    timeframe: 'créneaux du vendredi & samedi soir',
    maieuticQuestion: "Votre agenda est saturé à plus de 85%. Les clients acceptent de payer 15-20% de plus pour les créneaux du week-end. Souhaitez-vous que l'IA recalibrage vos tarifs de pointe dès ce soir ?",
    actionLabel: 'Ajuster les tarifs de pointe',
    actionRoute: '/calendar'
  },
  chantier: {
    avgIncrease: 20,
    stripeIncrease: 200,
    timeframe: 'interventions urgentes',
    maieuticQuestion: "Votre planning chantier est saturé à plus de 85%. Les artisans surchargés appliquent une majoration d'urgence de 20-25%. Voulez-vous élever votre empreinte bancaire à 200€ pour filtrer les demandes prioritaires et doubler votre marge sur les interventions urgentes ?",
    actionLabel: "Activer majoration urgence",
    actionRoute: '/calendar'
  },
  services_b2b: {
    avgIncrease: 25,
    stripeIncrease: 150,
    timeframe: 'prestations haute valeur',
    maieuticQuestion: "Votre calendrier de prestations est saturé à plus de 85%. C'est le signal que votre tarif journalier est sous-valorisé. Les prestataires B2B à forte demande augmentent de 25% sans perdre de clients. Souhaitez-vous recalibrer votre grille tarifaire dès la semaine prochaine ?",
    actionLabel: 'Revaloriser ma grille tarifaire',
    actionRoute: '/calendar'
  },
  produits: {
    avgIncrease: 10,
    stripeIncrease: 30,
    timeframe: 'collections premium',
    maieuticQuestion: "Votre stock tourne à plus de 85% de capacité. C'est le moment d'augmenter de 10-15% les prix de vos produits les plus demandés et de créer un segment premium. L'IA peut identifier les 3 références à revaloriser en priorité — le faites-vous ce matin ?",
    actionLabel: 'Identifier les références premium',
    actionRoute: '/cockpit'
  },
  agence: {
    avgIncrease: 30,
    stripeIncrease: 500,
    timeframe: 'contrats haute-valeur',
    maieuticQuestion: "Votre portefeuille clients est saturé à plus de 85%. C'est le signal d'une revalorisation de 25-30% de vos honoraires ou d'une sélection plus sévère des prospects. Souhaitez-vous configurer un filtre d'empreinte bancaire de 500€ pour qualifier uniquement les prospects à fort ROI ?",
    actionLabel: "Filtrer les prospects à fort ROI",
    actionRoute: '/agency'
  }
};

// ── Helper: derive occupancy from KPIs ────────────────────────────────────────
function deriveOccupancy(kpi: { engagement: number; views: number; viewsChange: number }): number {
  // Simulate: higher engagement = more bookings = higher occupancy
  const base = 55 + (kpi.engagement * 0.8) + (kpi.viewsChange * 0.3);
  return Math.min(Math.max(Math.round(base), 45), 100);
}

// ── Component ─────────────────────────────────────────────────────────────────
export function MarginOptimizerWidget() {
  const { activeEstablishment } = useEstablishment();
  const { masterProfile } = useUserProfile();
  const { isStarter } = usePlan();

  const [isOpen, setIsOpen] = useState(true);
  const [showAction, setShowAction] = useState(false);
  const [actionApplied, setActionApplied] = useState(false);

  const kpi = activeEstablishment.kpi;
  const occupancy = useMemo(() => deriveOccupancy(kpi), [kpi]);
  const pricing = SECTOR_PRICING[masterProfile || 'flux'] || SECTOR_PRICING.flux;

  const isSaturated = occupancy >= THRESHOLD_HIGH;
  const isCritical  = occupancy >= THRESHOLD_CRITICAL;

  // Color scheme based on saturation
  const color = isCritical
    ? { ring: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10', badge: 'text-rose-400 bg-rose-500/10' }
    : isSaturated
    ? { ring: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', badge: 'text-amber-400 bg-amber-500/10' }
    : { ring: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', badge: 'text-emerald-400 bg-emerald-500/10' };

  const statusLabel = isCritical ? 'Saturation critique' : isSaturated ? 'Agenda saturé' : 'Capacité disponible';

  const handleApplyAction = () => {
    // Optimistic UI — apply visual success instantly
    setActionApplied(true);
    setTimeout(() => setShowAction(false), 1500);
  };

  return (
    <div data-tour="margin-optimizer" className={`rounded-2xl border ${color.border} bg-gradient-to-br from-[#0F172A] to-[#1A2540] overflow-hidden`}>
      {/* ── Header ── */}
      <div className="p-4 flex items-center justify-between border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center`}>
            <TrendingUp className={`h-5 w-5 ${color.text}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white tracking-tight">Moteur de Rendement</h3>
              {isSaturated && (
                <Badge variant="secondary" className={`${color.badge} border-none text-[10px] h-4 px-1.5 font-bold`}>
                  {statusLabel}
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Optimisation des Marges & Saturation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1" title="Recalculer">
            <RefreshCw className="h-3 w-3" />
          </button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* ── Body ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-6 space-y-6 overflow-hidden"
          >
            {/* Occupancy gauge row */}
            <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-center">
              {/* Radial gauge */}
              <div className="flex flex-col items-center gap-2 mx-auto sm:mx-0">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r="46" stroke="currentColor" strokeWidth="10"
                      fill="transparent" className="text-slate-800" />
                    <motion.circle
                      cx="56" cy="56" r="46"
                      stroke={isCritical ? '#F43F5E' : isSaturated ? '#F59E0B' : '#10B981'}
                      strokeWidth="10" fill="transparent"
                      strokeDasharray={289.0}
                      initial={{ strokeDashoffset: 289.0 }}
                      animate={{ strokeDashoffset: 289.0 - (occupancy / 100) * 289.0 }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-black ${color.text}`}>{occupancy}%</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Occupation</span>
                  </div>
                </div>
                {/* Threshold indicators */}
                <div className="flex flex-col gap-0.5 text-center">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <div className={`w-1.5 h-1.5 rounded-full ${occupancy >= THRESHOLD_HIGH ? 'bg-amber-500' : 'bg-slate-700'}`} />
                    <span className="text-slate-500">Seuil revalorisation : {THRESHOLD_HIGH}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <div className={`w-1.5 h-1.5 rounded-full ${occupancy >= THRESHOLD_CRITICAL ? 'bg-rose-500' : 'bg-slate-700'}`} />
                    <span className="text-slate-500">Seuil critique : {THRESHOLD_CRITICAL}%</span>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      <DollarSign className="h-3 w-3 text-teal-400" />
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Augmentation suggérée</span>
                    </div>
                    <p className={`text-xl font-black ${isSaturated ? color.text : 'text-slate-500'}`}>
                      +{pricing.avgIncrease}%
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{pricing.timeframe}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Lock className="h-3 w-3 text-violet-400" />
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Empreinte Stripe</span>
                    </div>
                    <p className={`text-xl font-black ${isSaturated ? 'text-violet-400' : 'text-slate-500'}`}>
                      {pricing.stripeIncrease} €
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Filtre client recommandé</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-slate-900/40 rounded-lg px-3 py-2 border border-slate-700/30">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {isSaturated
                      ? `Votre agenda est saturé à ${occupancy}% — c'est le signal optimal pour augmenter vos tarifs de ${pricing.avgIncrease}% sur les ${pricing.timeframe}.`
                      : `Votre agenda est à ${occupancy}% de capacité. L'alerte se déclenchera automatiquement si vous dépassez ${THRESHOLD_HIGH}%.`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* ── Maieutic IA suggestion (only if saturated) ── */}
            {isSaturated ? (
              <div data-tour="margin-optimizer-action" className={`p-4 rounded-xl ${color.bg} border ${color.border}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${color.bg} border ${color.border} flex items-center justify-center shrink-0`}>
                    <Zap className={`h-4 w-4 ${color.text}`} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <h4 className={`text-sm font-bold ${color.text}`}>Mentor IA — Opportunité de Marge</h4>
                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      "{pricing.maieuticQuestion}"
                    </p>
                    {!actionApplied ? (
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          className={`${isCritical ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-500 hover:bg-amber-600'} text-white font-bold text-xs gap-1.5`}
                          onClick={() => setShowAction(true)}
                        >
                          <Zap className="h-3 w-3" />
                          {pricing.actionLabel}
                        </Button>
                        {isStarter && (
                          <Button variant="ghost" size="sm" className="text-slate-400 text-xs" asChild>
                            <Link to="/subscription">Passer au plan Business</Link>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 text-emerald-400 pt-1"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-bold">Recommandation appliquée · Synchronisation en cours…</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Non-saturated: show info banner */
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                <Info className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-emerald-400 mb-0.5">Agenda non saturé — pas d'action requise</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Le Moteur de Rendement surveille votre taux d'occupation en continu. 
                    Dès que vous dépassez {THRESHOLD_HIGH}%, il vous proposera automatiquement un plan de revalorisation tarifaire adapté à votre secteur.
                  </p>
                </div>
              </div>
            )}

            {/* ── Quick access ── */}
            <div className="flex justify-end">
              <Link
                to="/calendar"
                className="text-[10px] uppercase tracking-wider font-bold text-teal-400 hover:text-teal-300 flex items-center gap-0.5 transition-colors"
              >
                Gérer mon agenda <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── One-click confirmation modal (Optimistic UI) ── */}
      <AnimatePresence>
        {showAction && !actionApplied && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAction(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-[#0F172A] border border-amber-500/30 p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{pricing.actionLabel}</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    L'IA va préparer une proposition de revalorisation tarifaire (+{pricing.avgIncrease}%) 
                    pour vos {pricing.timeframe}. Vous restez le décideur final.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setShowAction(false)}
                    className="flex-1 border border-slate-700 text-slate-400 hover:text-white text-xs">
                    Annuler
                  </Button>
                  <Button onClick={handleApplyAction}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs">
                    Appliquer maintenant
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
