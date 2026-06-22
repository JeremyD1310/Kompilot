/**
 * StepProRecommendation — Onboarding step Pro : Résumé IA + recommandation personnalisée
 * Analyse le profil de l'utilisateur et génère un plan d'action IA sur mesure.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, TrendingUp, ArrowRight, ChevronRight } from 'lucide-react';

interface Props { onComplete: () => void; sector?: string }

interface Recommendation {
  icon: string;
  title: string;
  desc: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
}

const SECTOR_RECS: Record<string, Recommendation[]> = {
  restaurant: [
    { icon: '⭐', title: 'Répondre aux 3 derniers avis Google', desc: 'L\'IA a détecté 3 avis sans réponse — impact SEO local', impact: '+12 pts GEO', priority: 'high' },
    { icon: '📸', title: 'Ajouter 5 photos de plats', desc: 'Les restaurants avec photos récentes ont +34% de clics', impact: '+34% clics', priority: 'high' },
    { icon: '📅', title: 'Planifier un post du week-end', desc: 'Vendredi 18h = pic d\'engagement pour la restauration', impact: '+28% reach', priority: 'medium' },
  ],
  coiffeur: [
    { icon: '📱', title: 'Activer les RDV en ligne', desc: 'Réduisez les no-shows de 63% avec l\'empreinte Stripe', impact: '-63% no-shows', priority: 'high' },
    { icon: '✉️', title: 'Lancer une campagne SMS clients inactifs', desc: '47 clients absents depuis +30 jours à réactiver', impact: '+870€ potentiel', priority: 'high' },
    { icon: '🎨', title: 'Créer un post "Avant/Après"', desc: 'Format #1 pour les salons de coiffure sur Instagram', impact: '+41% engagement', priority: 'medium' },
  ],
};

const DEFAULT_RECS: Recommendation[] = [
  { icon: '🏆', title: 'Configurer votre fiche Google My Business', desc: 'Fiche incomplète = -43% de visibilité dans les recherches locales', impact: '+43% visibilité', priority: 'high' },
  { icon: '📲', title: 'Programmer votre première semaine de posts', desc: 'Régularité = clé de la visibilité sur les réseaux sociaux', impact: '+85% engagement', priority: 'high' },
  { icon: '💬', title: 'Répondre aux 5 derniers avis', desc: 'Les réponses aux avis améliorent votre score de confiance Google', impact: '+17 pts score', priority: 'medium' },
];

export function StepProRecommendation({ onComplete, sector = 'general' }: Props) {
  const recs = SECTOR_RECS[sector] ?? DEFAULT_RECS;
  const [loading, setLoading] = useState(true);
  const [loadStep, setLoadStep] = useState(0);
  const [acceptedAll, setAcceptedAll] = useState(false);

  const LOAD_STEPS = [
    'Analyse de votre secteur…',
    'Évaluation de votre visibilité…',
    'Génération de votre plan IA…',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setLoadStep(prev => {
        if (prev >= LOAD_STEPS.length - 1) {
          clearInterval(timer);
          setTimeout(() => setLoading(false), 400);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(timer);
  }, []);

  const priorityColors = {
    high: 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800',
    medium: 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800',
    low: 'border-border bg-muted/20',
  };

  const priorityBadge = {
    high: 'bg-red-500 text-white',
    medium: 'bg-amber-500 text-white',
    low: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 px-3.5 py-3 flex items-start gap-2.5">
        <Sparkles size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>PLAN D'ACTION IA :</strong> Basé sur votre secteur et votre profil, l'IA a identifié
          vos 3 actions prioritaires pour accélérer votre croissance.
        </p>
      </div>

      {/* Loading state */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3 py-4"
          >
            <div className="flex items-center justify-center">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-amber-100 dark:border-amber-900" />
                <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                <Sparkles size={16} className="absolute inset-0 m-auto text-amber-500" />
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground animate-pulse">
              {LOAD_STEPS[loadStep]}
            </p>
            <div className="space-y-1.5">
              {LOAD_STEPS.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    i < loadStep ? 'bg-emerald-500' : i === loadStep ? 'bg-amber-500 animate-pulse' : 'bg-muted'
                  }`}>
                    {i < loadStep && <CheckCircle2 size={8} className="text-white" />}
                  </div>
                  <p className={`text-[10px] transition-all ${i <= loadStep ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="recs"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={12} className="text-amber-500" />
              <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                Votre plan d'action personnalisé
              </p>
            </div>

            {recs.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 }}
                className={`rounded-xl border p-3 ${priorityColors[rec.priority]}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{rec.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-foreground">{rec.title}</p>
                      <span className={`text-[9px] font-black rounded-full px-1.5 py-0.5 uppercase ${priorityBadge[rec.priority]}`}>
                        {rec.priority === 'high' ? 'Urgent' : rec.priority === 'medium' ? 'Important' : 'Bonus'}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{rec.desc}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5">
                      <TrendingUp size={9} className="text-emerald-500" />
                      <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">{rec.impact}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            <button
              onClick={() => { setAcceptedAll(true); setTimeout(onComplete, 400); }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-bold py-2.5 shadow-md transition-all active:scale-[0.98]"
            >
              {acceptedAll ? (
                <><CheckCircle2 size={14} /> Plan activé !</>
              ) : (
                <>
                  <Sparkles size={14} />
                  Valider mon plan d'action
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
