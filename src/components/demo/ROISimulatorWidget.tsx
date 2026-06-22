/**
 * ROISimulatorWidget — Sidebar droite sticky de la page /demo
 *
 * POLYMORPHISME FINANCIER EXACT selon les specs :
 *
 *  ▸ Commerçant
 *      A : "Nombre de No-Shows par mois"            [0 → 20]
 *      B : "Panier moyen d'une table / prestation"  [20€ → 150€]
 *      Formule  : A × B
 *      Résultat : "Gain estimé grâce au bouclier Stripe : +X€ / mois"
 *
 *  ▸ Artisan / Bâtiment  (persona key = 'freelance')
 *      A : "Déplacements pour devis non signés / mois"  [0 → 20]
 *      B : "Frais de déplacement moyens (€)"            [20€ → 150€]
 *      Formule  : A × B
 *      Résultat : "Argent sauvé sur vos trajets : +X€ / mois"
 *
 *  ▸ Agence  (persona key = 'agency')
 *      A : "Nombre de clients gérés"                               [1 → 50]
 *      B : "Heures / semaine sur visuels et rapports"              [1 → 20h]
 *      Formule  : A × B × 4 (semaines/mois)
 *      Résultat : "Temps libéré par l'IA : +X heures / mois"
 *
 *  Ancrage psychologique : "Ce module vous rapporte X€ pour un
 *  abonnement à seulement 99€/mois. Rentabilisé dès le 1er jour."
 *
 *  CTA : "Créer mon propre espace Kompilot" → /signup
 *  + sessionStorage pour pré-configurer l'onboarding
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, MapPin, Clock, Users, EuroIcon, Rocket, Sparkles, TrendingUp,
} from 'lucide-react';
import { Card, Button, Slider } from '@blinkdotnew/ui';
import { useNavigate } from '@tanstack/react-router';

export type DemoPersona = 'merchant' | 'freelance' | 'agency';

interface Props { persona: DemoPersona }

/* ─────────────────────────────────────────────────────────────
   CONFIG PAR PERSONA
───────────────────────────────────────────────────────────── */
const PERSONA_CONFIG = {
  merchant: {
    accentColor: 'emerald',
    headerIcon: ShieldCheck,
    resultLabel: 'Gain estimé grâce au bouclier Stripe',
    resultUnit: '€',
    isHours: false,
    sliderA: { label: 'Nombre de No-Shows par mois', icon: Users, min: 0, max: 20, step: 1, defaultVal: 8, suffix: '' },
    sliderB: { label: 'Panier moyen d\'une table / prestation', icon: EuroIcon, min: 20, max: 150, step: 5, defaultVal: 65, suffix: '€' },
    formula: (a: number, b: number) => a * b,
    formulaText: (a: number, b: number) => `${a} no-shows × ${b}€ = pertes récupérées`,
  },
  freelance: {
    accentColor: 'amber',
    headerIcon: MapPin,
    resultLabel: 'Argent sauvé sur vos trajets',
    resultUnit: '€',
    isHours: false,
    sliderA: { label: 'Déplacements pour devis non signés par mois', icon: MapPin, min: 0, max: 20, step: 1, defaultVal: 6, suffix: '' },
    sliderB: { label: 'Frais de déplacement moyens (€)', icon: EuroIcon, min: 20, max: 150, step: 5, defaultVal: 45, suffix: '€' },
    formula: (a: number, b: number) => a * b,
    formulaText: (a: number, b: number) => `${a} déplacements × ${b}€ = coût évité`,
  },
  agency: {
    accentColor: 'indigo',
    headerIcon: Clock,
    resultLabel: 'Temps libéré par l\'IA',
    resultUnit: 'h',
    isHours: true,
    sliderA: { label: 'Nombre de clients gérés', icon: Users, min: 1, max: 50, step: 1, defaultVal: 12, suffix: '' },
    sliderB: { label: 'Heures par semaine sur visuels et rapports', icon: Clock, min: 1, max: 20, step: 1, defaultVal: 8, suffix: 'h' },
    formula: (a: number, b: number) => a * b * 4,
    formulaText: (a: number, b: number) => `${a} clients × ${b}h/sem × 4 semaines`,
  },
} as const;

/* ─────────────────────────────────────────────────────────────
   ANCRAGE PSYCHOLOGIQUE
───────────────────────────────────────────────────────────── */
function anchorText(persona: DemoPersona, result: number): string {
  if (persona === 'agency') {
    if (result <= 0) return 'Ajustez les curseurs pour voir le temps que l\'IA vous libère.';
    const equiv = Math.round(result * 45); // valeur horaire estimée à 45€/h
    return `${result} heures libérées ≈ ${equiv.toLocaleString('fr-FR')}€ de valeur temps. Abonnement à seulement 299€/mois — rentabilisé dès la première semaine.`;
  }
  if (result <= 0) return 'Ajustez les curseurs pour visualiser votre gain potentiel.';
  const multiple = (result / 99).toFixed(1);
  return `Ce module vous rapporte ${result.toLocaleString('fr-FR')}€ pour un abonnement à seulement 99€/mois. L'outil est rentabilisé dès le premier jour (×${multiple}).`;
}

/* ─────────────────────────────────────────────────────────────
   COULEURS PAR PERSONA
───────────────────────────────────────────────────────────── */
const COLORS = {
  emerald: {
    border:  'border-emerald-200 dark:border-emerald-900/50',
    icon:    'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600',
    label:   'text-emerald-600 dark:text-emerald-400',
    chip:    'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    gauge:   'from-emerald-400 via-emerald-500 to-teal-500',
    card:    'from-emerald-500 to-teal-600 shadow-emerald-500/35',
    halo:    'from-emerald-400/20 via-teal-400/30 to-emerald-400/20',
    anchor:  'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400',
    btn:     'from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/40',
    btnHalo: 'from-emerald-400/25 via-teal-400/30 to-emerald-400/25',
  },
  amber: {
    border:  'border-amber-200 dark:border-amber-900/50',
    icon:    'bg-amber-50 dark:bg-amber-900/30 text-amber-600',
    label:   'text-amber-600 dark:text-amber-400',
    chip:    'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    gauge:   'from-amber-400 via-amber-500 to-orange-500',
    card:    'from-amber-500 to-orange-500 shadow-amber-500/35',
    halo:    'from-amber-400/20 via-orange-400/30 to-amber-400/20',
    anchor:  'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400',
    btn:     'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/40',
    btnHalo: 'from-amber-400/25 via-orange-400/30 to-amber-400/25',
  },
  indigo: {
    border:  'border-indigo-200 dark:border-indigo-900/50',
    icon:    'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600',
    label:   'text-indigo-600 dark:text-indigo-400',
    chip:    'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
    gauge:   'from-indigo-400 via-indigo-500 to-violet-500',
    card:    'from-indigo-500 to-violet-600 shadow-indigo-500/35',
    halo:    'from-indigo-400/20 via-violet-400/30 to-indigo-400/20',
    anchor:  'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400',
    btn:     'from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-indigo-500/40',
    btnHalo: 'from-indigo-400/25 via-violet-400/30 to-indigo-400/25',
  },
} as const;

/* ─────────────────────────────────────────────────────────────
   COMPOSANT PRINCIPAL
───────────────────────────────────────────────────────────── */
export default function ROISimulatorWidget({ persona }: Props) {
  const navigate = useNavigate();
  const cfg   = PERSONA_CONFIG[persona];
  const clr   = COLORS[cfg.accentColor as keyof typeof COLORS];
  const Icon  = cfg.headerIcon;

  /* États des sliders — chaque persona a ses propres valeurs */
  const [valA, setValA] = useState([cfg.sliderA.defaultVal]);
  const [valB, setValB] = useState([cfg.sliderB.defaultVal]);

  /* Reset des valeurs quand on change de persona */
  useEffect(() => {
    setValA([PERSONA_CONFIG[persona].sliderA.defaultVal]);
    setValB([PERSONA_CONFIG[persona].sliderB.defaultVal]);
  }, [persona]);

  /* Calcul */
  const result    = cfg.formula(valA[0], valB[0]);
  const isPositive = result > 0;
  const ceiling    = cfg.isHours ? 4000 : 3000;
  const gaugeVal   = Math.min(100, Math.max(0, Math.round((result / ceiling) * 100)));

  /* sessionStorage — pré-configure l'onboarding */
  useEffect(() => {
    try {
      sessionStorage.setItem('kompilot_demo_roi', JSON.stringify({
        persona,
        result,
        unit: cfg.resultUnit,
        sliderA: valA[0],
        sliderB: valB[0],
        savedAt: new Date().toISOString(),
      }));
    } catch { /* mode privé strict */ }
  }, [persona, result, valA, valB, cfg.resultUnit]);

  /* CTA */
  const handleCTA = () => {
    try {
      sessionStorage.setItem('kompilot_signup_persona', persona);
    } catch { /* ignore */ }
    navigate({ to: '/signup' });
  };

  return (
    <Card className={`relative overflow-hidden border-2 ${clr.border} bg-white dark:bg-slate-900 shadow-2xl shadow-emerald-100/40 dark:shadow-none p-6 space-y-5`}>

      {/* Orb décoratif */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 opacity-[0.06] bg-current rounded-full blur-3xl" />

      {/* ── En-tête ─────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${clr.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
            Calculez vos gains
          </h3>
          <p className={`text-xs mt-0.5 font-semibold ${clr.label}`}>
            {cfg.resultLabel}
          </p>
        </div>
      </div>

      {/* ── Sliders polymorphes ──────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={persona}
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -14 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          {/* Slider A */}
          <SliderRow
            label={cfg.sliderA.label}
            Icon={cfg.sliderA.icon}
            value={valA}
            onChange={setValA}
            min={cfg.sliderA.min}
            max={cfg.sliderA.max}
            step={cfg.sliderA.step}
            display={`${valA[0]}${cfg.sliderA.suffix}`}
            chipCls={clr.chip}
          />

          {/* Slider B */}
          <SliderRow
            label={cfg.sliderB.label}
            Icon={cfg.sliderB.icon}
            value={valB}
            onChange={setValB}
            min={cfg.sliderB.min}
            max={cfg.sliderB.max}
            step={cfg.sliderB.step}
            display={`${valB[0]}${cfg.sliderB.suffix}`}
            chipCls={clr.chip}
          />

          {/* Tag formule */}
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="font-mono text-slate-400 text-xs shrink-0 mt-px">≡</span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {cfg.formulaText(valA[0], valB[0])}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Jauge émeraude ──────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-semibold text-slate-500">
          <span>Potentiel atteint</span>
          <span className={clr.label}>{gaugeVal}%</span>
        </div>

        <div className="relative h-5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner">
          {/* Barre de progression */}
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${clr.gauge}`}
            animate={{ width: `${gaugeVal}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
          {/* Shimmer sur la barre */}
          {isPositive && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
              animate={{ x: ['-120%', '220%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
            />
          )}
          {/* Labels extrémités */}
          <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none select-none">
            <span className="text-[9px] text-slate-400">0</span>
            <span className="text-[9px] text-slate-400">max</span>
          </div>
        </div>
      </div>

      {/* ── Carte résultat ──────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${result}-${persona}`}
          initial={{ scale: 0.96, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.22 }}
          className={`rounded-2xl p-5 text-center shadow-xl ${
            isPositive
              ? `bg-gradient-to-br ${clr.card}`
              : 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-slate-900/20'
          }`}
        >
          <p className="text-[10px] uppercase tracking-widest text-white/70 mb-2 leading-tight">
            {cfg.resultLabel}
          </p>

          <div className="flex items-baseline justify-center gap-1">
            <span className={`text-4xl font-black tabular-nums ${isPositive ? 'text-white' : 'text-red-300'}`}>
              {isPositive ? '+' : ''}{result.toLocaleString('fr-FR')}
            </span>
            <span className="text-xl font-light text-white/70 ml-0.5">{cfg.resultUnit}</span>
          </div>

          <p className="text-xs text-white/55 mt-1">par mois</p>
        </motion.div>
      </AnimatePresence>

      {/* ── Ancrage psychologique ───────────────────────────── */}
      <div className={`rounded-xl px-4 py-3 border ${clr.anchor}`}>
        <p className="text-[11px] leading-relaxed">
          💡 {anchorText(persona, result)}
        </p>
      </div>

      {/* ── CTA pulsant rétroéclairé ─────────────────────────── */}
      <div className="relative pt-1">
        {/* Halo externe pulsant */}
        <motion.div
          className={`absolute -inset-[3px] rounded-2xl bg-gradient-to-r ${clr.btnHalo} blur-sm`}
          animate={{ opacity: [0.2, 0.65, 0.2], scale: [1, 1.025, 1] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Backlight statique */}
        <div className={`absolute -inset-px rounded-2xl bg-gradient-to-r ${clr.halo}`} />

        <Button
          onClick={handleCTA}
          className={`relative w-full h-14 bg-gradient-to-r ${clr.btn} text-white font-bold text-sm rounded-xl gap-2.5 shadow-xl transition-all duration-200 hover:scale-[1.015] hover:brightness-110`}
        >
          <Rocket className="w-5 h-5 shrink-0" />
          Créer mon propre espace Kompilot
        </Button>
      </div>

      <p className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3 h-3 text-emerald-400" />
        14 jours gratuits · Sans carte bancaire
      </p>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────
   SliderRow — ligne label + slider + tick marks
───────────────────────────────────────────────────────────── */
interface SliderRowProps {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  value: number[];
  onChange: (v: number[]) => void;
  min: number;
  max: number;
  step: number;
  display: string;
  chipCls: string;
}

function SliderRow({ label, Icon, value, onChange, min, max, step, display, chipCls }: SliderRowProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400 min-w-0 pt-0.5">
          <Icon className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span className="leading-snug">{label}</span>
        </div>
        <span className={`shrink-0 text-xs font-bold tabular-nums px-2 py-0.5 rounded-md whitespace-nowrap ml-1 ${chipCls}`}>
          {display}
        </span>
      </div>

      <Slider
        min={min} max={max} step={step}
        value={value} onValueChange={onChange}
      />

      <div className="flex justify-between text-[9px] text-slate-400 tabular-nums select-none">
        <span>{min}</span>
        <span>{Math.round((min + max) / 2)}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
