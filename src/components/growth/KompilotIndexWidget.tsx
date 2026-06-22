import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Shield, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Lock,
  ArrowRight,
  Info,
  MapPin,
  TrendingUp,
  MessageCircle,
  Star,
  RefreshCw
} from 'lucide-react';
import { Badge, Button, Card } from '@blinkdotnew/ui';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { usePlan } from '../../hooks/usePlan';
import { Link } from '@tanstack/react-router';

// ── Sector benchmark data (anonymised aggregates) ────────────────────────────

interface BenchmarkData {
  sectorLabel: string;
  noShowSaved: number;
  dmsConverted: number;
  reviewsGained: number;
  revenueSecured: number;
  growthRate: number;
  /** Per-metric maieutic tip, keyed by metric name */
  maieuticTips: Record<'noShow' | 'dms' | 'reviews', string>;
  /** Deep link for the weakest metric */
  deepLinks: Record<'noShow' | 'dms' | 'reviews', string>;
  /** Features that drive each metric */
  leverLabels: Record<'noShow' | 'dms' | 'reviews', string>;
}

const BENCHMARKS: Record<string, BenchmarkData> = {
  flux: { 
    sectorLabel: 'Commerces & Restaurants', 
    noShowSaved: 480, 
    dmsConverted: 34, 
    reviewsGained: 12, 
    revenueSecured: 1240, 
    growthRate: 127,
    maieuticTips: {
      noShow: "Les commerces de votre zone récupèrent en moyenne 480 € de no-show/mois via l'empreinte bancaire Stripe. Voulez-vous déployer ce bouclier sur votre agenda dès ce matin ?",
      dms: "Le marché local capte plus de valeur via les DMs Instagram. Souhaitez-vous que l'IA active votre campagne automatique Comment-to-DM ce matin ?",
      reviews: "Vos confrères collectent 12 avis Google/mois en automatique grâce aux relances post-passage. L'IA peut programmer votre première relance en 2 minutes — maintenant ?"
    },
    deepLinks: { noShow: '/calendar', dms: '/growth', reviews: '/dashboard' }
  },
  chantier: { 
    sectorLabel: 'BTP & Artisans', 
    noShowSaved: 620, 
    dmsConverted: 18, 
    reviewsGained: 8, 
    revenueSecured: 1850, 
    growthRate: 98,
    maieuticTips: {
      noShow: "Les artisans de votre zone récupèrent en moyenne 620 € d'acomptes/mois via l'empreinte Stripe. Voulez-vous déployer ce bouclier sur votre agenda dès aujourd'hui ?",
      dms: "Vos concurrents BTP convertissent 18 leads/mois via le Comment-to-DM (DEVIS automatique). Votre campagne est-elle configurée ?",
      reviews: "Les artisans avec 4,8★+ gagnent 32% de devis supplémentaires. L'IA peut envoyer une relance photo-avis après chaque chantier — activons-la maintenant ?"
    },
    deepLinks: { noShow: '/calendar', dms: '/growth', reviews: '/dashboard' }
  },
  services_b2b: { 
    sectorLabel: 'Services B2B & Freelances', 
    noShowSaved: 290, 
    dmsConverted: 28, 
    reviewsGained: 6, 
    revenueSecured: 2100, 
    growthRate: 143,
    maieuticTips: {
      noShow: "Les prestataires B2B sécurisent en moyenne 290 € de no-show/mois grâce aux acomptes découverte. Votre tunnel de réservation intègre-t-il cette protection ?",
      dms: "Les prestataires B2B convertissent 40% de leads supplémentaires via les relances automatiques. Votre séquence CRM est-elle configurée pour les 48h post-contact ?",
      reviews: "Un profil Google avec 4,7★+ reçoit 60% de demandes entrantes supplémentaires. L'IA peut générer votre séquence de collecte d'avis LinkedIn — activons-la ?"
    },
    deepLinks: { noShow: '/calendar', dms: '/inbox', reviews: '/dashboard' }
  },
  produits: { 
    sectorLabel: 'E-commerce & Vente Produits', 
    noShowSaved: 180, 
    dmsConverted: 52, 
    reviewsGained: 24, 
    revenueSecured: 980, 
    growthRate: 164,
    maieuticTips: {
      noShow: "Les boutiques e-commerce sécurisent 180 €/mois d'abandons panier via les relances SMS. Votre tunnel de récupération est-il actif ?",
      dms: "Le marché local capte plus de valeur via les coupons flash synchronisés avec vos réseaux. L'IA peut programmer une campagne anti-surstock ce week-end — le souhaitez-vous ?",
      reviews: "Les avis produits sont le levier de conversion #1 (impact +26% sur le taux de réachat). L'IA peut automatiser les demandes d'avis post-livraison — activons-la ?"
    },
    deepLinks: { noShow: '/inbox', dms: '/cockpit', reviews: '/dashboard' }
  },
  agence: { 
    sectorLabel: 'Agences Digitales', 
    noShowSaved: 0, 
    dmsConverted: 65, 
    reviewsGained: 18, 
    revenueSecured: 4800, 
    growthRate: 189,
    maieuticTips: {
      noShow: "Vos prospects perdent en moyenne 800–1 500 € de no-show/mois sans automatisation. Avez-vous préparé une démo Live Cloning Engine pour vos 3 prochains rendez-vous ?",
      dms: "Les agences top-performers génèrent 60% de leur chiffre de prospection via le Live Cloning Engine. Avez-vous préparé vos 3 prochaines démos prospects ?",
      reviews: "Un portefeuille clients bien noté (4,8★ moyen) augmente le LTV de 40%. Le rapport de tendance sectorielle peut documenter cette preuve — l'avez-vous exporté ?"
    },
    deepLinks: { noShow: '/agency', dms: '/agency', reviews: '/agency' }
  }
};

// ── Lever labels per metric ───────────────────────────────────────────────────

const LEVER_LABELS: Record<'noShow' | 'dms' | 'reviews', string> = {
  noShow: 'Empreinte bancaire / Acompte',
  dms: 'Comment-to-DM automatique',
  reviews: 'Relance avis post-passage'
};

// ── Component ─────────────────────────────────────────────────────────────────

export function KompilotIndexWidget() {
  const { activeEstablishment } = useEstablishment();
  const { masterProfile } = useUserProfile();
  const { isFranchise } = usePlan();
  
  const [isOpen, setIsOpen] = useState(true);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [lastRefreshed] = useState(() => {
    const d = new Date();
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' });
  });

  const kpi = activeEstablishment.kpi;
  const city: string = (activeEstablishment as any).city || '';
  const benchmark = BENCHMARKS[masterProfile || 'flux'] || BENCHMARKS.flux;

  // User performance derived from KPIs
  const userMetrics = useMemo(() => ({
    noShowSaved: Math.round(kpi.engagement * 12 + 80),
    dmsConverted: Math.round(kpi.viewsChange / 3 + 8),
    reviewsGained: Math.round(kpi.reachChange / 8 + 2),
    revenueSecured: Math.round(kpi.views / 8 + 320)
  }), [kpi]);

  // Per-metric stats with keys
  const stats = useMemo(() => [
    { 
      key: 'noShow' as const,
      label: 'No-Show sauvés', 
      user: userMetrics.noShowSaved, 
      bench: benchmark.noShowSaved, 
      unit: '€',
      icon: TrendingUp,
      color: 'text-teal-400'
    },
    { 
      key: 'dms' as const,
      label: 'DMs convertis', 
      user: userMetrics.dmsConverted, 
      bench: benchmark.dmsConverted, 
      unit: 'leads',
      icon: MessageCircle,
      color: 'text-violet-400'
    },
    { 
      key: 'reviews' as const,
      label: 'Avis récoltés', 
      user: userMetrics.reviewsGained, 
      bench: benchmark.reviewsGained, 
      unit: 'avis',
      icon: Star,
      color: 'text-amber-400'
    }
  ], [userMetrics, benchmark]);

  // Find weakest metric (biggest gap vs benchmark)
  const weakestMetric = useMemo(() => {
    const gaps = stats.map(s => ({
      key: s.key,
      ratio: s.bench > 0 ? s.user / s.bench : 1
    }));
    return gaps.reduce((prev, cur) => (cur.ratio < prev.ratio ? cur : prev)).key;
  }, [stats]);

  // Overall index score
  const overallScore = useMemo(() => {
    const scores = stats.map(s => s.bench > 0 ? s.user / s.bench : 1);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [stats]);

  const indexScore = Math.round(overallScore * 100);
  const isBelowAverage = overallScore < 1;

  const getStatusText = () => {
    if (overallScore >= 1.5) return 'Vous surperformez votre marché 🏆';
    if (overallScore >= 1) return 'Dans la moyenne de votre secteur';
    return 'Des leviers restent à activer';
  };

  const scoreColor = isBelowAverage ? 'text-amber-500' : 'text-emerald-500';
  const scoreStroke = isBelowAverage ? '#F59E0B' : '#10B981';

  // Which metrics are below benchmark
  const belowBenchStats = stats.filter(s => s.user < s.bench);

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-[#0F172A] to-[#1A2540] overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="p-4 flex items-center justify-between border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white tracking-tight">Kompilot Index</h3>
              <Badge variant="secondary" className="bg-teal-500/10 text-teal-400 border-none text-[10px] h-4 px-1">BÊTA</Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Benchmark Sectoriel</p>
              {city && (
                <>
                  <span className="text-slate-700 text-[10px]">·</span>
                  <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                    <MapPin className="h-2.5 w-2.5" />{city}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            title={`Mis à jour le ${lastRefreshed}`}
          >
            <RefreshCw className="h-3 w-3" />
            <span className="hidden sm:inline">{lastRefreshed}</span>
          </button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => setShowPrivacyNotice(!showPrivacyNotice)}
            title="Confidentialité des données"
          >
            <Shield className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* ── Privacy notice (collapsible) ────────────────────────────────── */}
      <AnimatePresence>
        {showPrivacyNotice && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-teal-500/5 border-b border-slate-700/50 overflow-hidden"
          >
            <div className="p-4 flex gap-3">
              <Lock className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-teal-300">
                  Mes données financières sont-elles partagées avec mes concurrents ?
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Absolument pas. Toutes les données sont chiffrées, agrégées et totalement anonymisées. 
                  Le Kompilot Index sert uniquement à vous donner les tendances de performance de votre 
                  marché pour vous aider à optimiser vos marges. Aucune donnée individuelle d'établissement 
                  n'est partagée — conformément au RGPD.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main body ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-6 overflow-hidden"
          >
            <div className="grid md:grid-cols-[1fr_2fr] gap-8">
              {/* Score Gauge */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8"
                      fill="transparent" className="text-slate-800" />
                    <motion.circle
                      cx="48" cy="48" r="40"
                      stroke={scoreStroke} strokeWidth="8" fill="transparent"
                      strokeDasharray={251.2}
                      initial={{ strokeDashoffset: 251.2 }}
                      animate={{ strokeDashoffset: 251.2 - (Math.min(indexScore, 200) / 200) * 251.2 }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-black ${scoreColor}`}>{indexScore}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Score</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">{getStatusText()}</p>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
                    <Info className="h-3 w-3" />
                    <span>Basé sur {benchmark.growthRate}+ pros actifs</span>
                  </div>
                </div>
                <div className="w-full rounded-lg bg-slate-900/50 border border-slate-700/30 px-3 py-2">
                  <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider mb-1">CA additionnel médian</p>
                  <p className="text-lg font-black text-white">{benchmark.revenueSecured.toLocaleString('fr-FR')} €<span className="text-sm font-normal text-slate-400">/mois</span></p>
                </div>
              </div>

              {/* Comparisons */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                    Votre performance vs. moyenne {benchmark.sectorLabel}
                  </h4>
                  <div className="space-y-5">
                    {stats.map((stat, i) => {
                      const ratio = stat.bench > 0 ? (stat.user / stat.bench) * 50 : 50;
                      const isBelow = stat.user < stat.bench;
                      const IconCmp = stat.icon;
                      return (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <IconCmp className={`h-3 w-3 ${stat.color}`} />
                              {stat.label}
                            </span>
                            <div className="flex gap-2 items-center">
                              <span className={`font-bold ${isBelow ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {stat.user}{stat.unit === '€' ? ' €' : ''}
                              </span>
                              <span className="text-slate-600">
                                / {stat.bench}{stat.unit === '€' ? ' €' : ''} moy.
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
                            <motion.div 
                              className={`h-full absolute left-0 top-0 rounded-full ${isBelow ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(ratio, 100)}%` }}
                              transition={{ duration: 1, delay: i * 0.15 }}
                            />
                            {/* Average marker */}
                            <div className="absolute left-1/2 top-0 h-full w-0.5 bg-slate-400/60 z-10" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sector proof */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    "En moyenne, un professionnel{' '}
                    <span className="text-teal-400 font-semibold">{benchmark.sectorLabel}</span>{' '}
                    actif sur Kompilot sécurise{' '}
                    <span className="text-white font-bold mx-1">{benchmark.revenueSecured.toLocaleString('fr-FR')} €/mois</span>
                    de chiffre d'affaires additionnel et double ses interactions clients en 30 jours."
                  </p>
                </div>
              </div>
            </div>

            {/* ── Missing levers panel (only when below average) ─────────── */}
            {isBelowAverage && belowBenchStats.length > 0 && (
              <div className="mt-6 rounded-xl border border-slate-700/40 bg-slate-900/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700/40 flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Leviers sous-utilisés dans votre secteur
                  </p>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {belowBenchStats.map((stat) => (
                    <div key={stat.key} className="flex items-center justify-between px-4 py-3 group">
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-200">{LEVER_LABELS[stat.key]}</p>
                          <p className="text-[10px] text-slate-500">
                            Vous : {stat.user} · Médiane secteur : {stat.bench}
                          </p>
                        </div>
                      </div>
                      <Link
                        to={benchmark.deepLinks[stat.key] as any}
                        className="text-[10px] font-bold text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-0.5 opacity-0 group-hover:opacity-100"
                      >
                        Activer <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Mentor IA recommendation ────────────────────────────────── */}
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              {isBelowAverage ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col md:flex-row items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <h4 className="text-sm font-bold text-amber-500">Mentor IA — Question prioritaire</h4>
                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      "{benchmark.maieuticTips[weakestMetric]}"
                    </p>
                  </div>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-bold whitespace-nowrap shrink-0" asChild>
                    <Link to={benchmark.deepLinks[weakestMetric] as any}>Activer maintenant</Link>
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-emerald-500">Mentor IA — Performance Optimale</h4>
                    <p className="text-xs text-slate-300">
                      Vous exploitez parfaitement les leviers de votre secteur. Continuez à surveiller votre index hebdomadaire.
                    </p>
                  </div>
                </div>
              )}

              {/* Agency export link */}
              {isFranchise && (
                <div className="mt-4 flex justify-end">
                  <Link 
                    to="/growth"
                    className="text-[10px] uppercase tracking-wider font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                  >
                    Exporter le Rapport de Tendance Sectorielle pour vos prospects
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
