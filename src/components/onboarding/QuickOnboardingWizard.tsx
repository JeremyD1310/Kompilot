/**
 * QuickOnboardingWizard — Streamlined 3-screen onboarding.
 * Screen 1: Find your establishment (name + city search)
 * Screen 2: Select your main objective (Reviews / Anti No-Show / Traffic)
 * Screen 3: Choose your communication tone
 * AI auto-configures the dashboard from these 3 signals.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@blinkdotnew/ui';
import { Search, Check, ArrowRight, Building2, Star, ShieldAlert, TrendingUp, MessageCircle, Zap, Heart, Megaphone } from 'lucide-react';
import { useUserProfile } from '../../context/UserProfileContext';

interface Props {
  open: boolean;
  onComplete: () => void;
}

type Objective = 'reviews' | 'no_show' | 'traffic';
type Tone = 'pro' | 'friendly' | 'local' | 'urgent';

const OBJECTIVES: { id: Objective; icon: React.ComponentType<any>; color: string; bg: string; title: string; sub: string }[] = [
  {
    id: 'reviews',
    icon: Star,
    color: '#FBBF24',
    bg: 'rgba(251,191,36,.12)',
    title: 'Booster mes avis Google',
    sub: 'Générer plus d\'avis 5 étoiles et y répondre automatiquement',
  },
  {
    id: 'no_show',
    icon: ShieldAlert,
    color: '#2DD4BF',
    bg: 'rgba(45,212,191,.12)',
    title: 'Éliminer les no-shows',
    sub: 'Empreinte bancaire Stripe + rappels SMS automatiques',
  },
  {
    id: 'traffic',
    icon: TrendingUp,
    color: '#818CF8',
    bg: 'rgba(129,140,248,.12)',
    title: 'Attirer plus de clients',
    sub: 'Visibilité locale, posts IA et G.E.O. optimisé',
  },
];

const TONES: { id: Tone; icon: React.ComponentType<any>; color: string; title: string; example: string }[] = [
  {
    id: 'pro',
    icon: Building2,
    color: '#818CF8',
    title: 'Professionnel',
    example: '"Notre équipe vous accueille du lundi au samedi de 9h à 19h."',
  },
  {
    id: 'friendly',
    icon: Heart,
    color: '#F472B6',
    title: 'Chaleureux & proche',
    example: '"On vous attend avec impatience ! Venez nous retrouver cette semaine 😊"',
  },
  {
    id: 'local',
    icon: MessageCircle,
    color: '#2DD4BF',
    title: 'Ancré local',
    example: '"Votre commerce de quartier depuis 2008, fier de servir les habitants."',
  },
  {
    id: 'urgent',
    icon: Megaphone,
    color: '#FBBF24',
    title: 'Promotionnel & percutant',
    example: '"⚡ Offre flash ce weekend — −20 % pour tous nos abonnés !"',
  },
];

const slideVariants = {
  enter: { x: 40, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -40, opacity: 0 },
};

export function QuickOnboardingWizard({ open, onComplete }: Props) {
  const { setSmartProfile, markOnboardingCompleted } = useUserProfile();
  const [screen, setScreen] = useState(0); // 0=search, 1=objective, 2=tone
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [objective, setObjective] = useState<Objective | null>(null);
  const [tone, setTone] = useState<Tone | null>(null);
  const [configuring, setConfiguring] = useState(false);

  if (!open) return null;

  const handleSkip = () => {
    markOnboardingCompleted();
    onComplete();
  };

  const handleFinish = async () => {
    if (!objective || !tone) return;
    setConfiguring(true);

    // Map to existing profile system
    const objectiveMap: Record<Objective, string> = {
      reviews: 'geo',
      no_show: 'no_show',
      traffic: 'geo',
    };

    setSmartProfile({
      smartProfileType: 'commerce',
      sector: null,
      granularSector: null,
      clientCount: null,
      objective: objectiveMap[objective] as any,
      followLocalEvents: true,
    });

    // Short artificial delay so user sees "IA configure…"
    await new Promise(r => setTimeout(r, 1200));
    markOnboardingCompleted();
    onComplete();
  };

  const progress = ((screen + 1) / 3) * 100;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#0F172A] text-white shadow-2xl"
        style={{ border: '1px solid rgba(13,148,136,0.25)' }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-slate-800 w-full">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 to-teal-400"
            initial={{ width: '33%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === screen ? 'w-6 bg-teal-500' : i < screen ? 'w-4 bg-teal-500/50' : 'w-4 bg-slate-700'
                }`}
              />
            ))}
          </div>
          <button onClick={handleSkip} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Passer →
          </button>
        </div>

        <div className="px-6 pb-7 pt-2" style={{ minHeight: 380 }}>
          <AnimatePresence mode="wait">
            {/* ── Screen 0: Recherche établissement ── */}
            {screen === 0 && (
              <motion.div key="s0" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28 }} className="space-y-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center shrink-0">
                      <Search size={15} className="text-teal-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black leading-tight">Trouvons votre commerce</h2>
                      <p className="text-xs text-slate-400">Pour configurer votre présence locale en 60 secondes.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nom de votre établissement</label>
                    <div className="relative">
                      <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={businessName}
                        onChange={e => setBusinessName(e.target.value)}
                        placeholder="Ex: Brasserie du Parc, Salon Emma..."
                        className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:bg-slate-800 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ville</label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="Ex: Lyon, Paris, Bordeaux..."
                        className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:bg-slate-800 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Value hint */}
                <div className="flex items-start gap-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 p-3">
                  <Zap size={13} className="text-teal-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    L'IA analyse votre secteur et configure votre tableau de bord automatiquement.
                  </p>
                </div>

                <Button
                  onClick={() => setScreen(1)}
                  disabled={!businessName.trim()}
                  className="w-full py-5 text-sm font-black bg-teal-600 hover:bg-teal-500 disabled:opacity-40"
                >
                  Continuer <ArrowRight size={15} className="ml-1.5" />
                </Button>
              </motion.div>
            )}

            {/* ── Screen 1: Objectif ── */}
            {screen === 1 && (
              <motion.div key="s1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-black leading-tight">Votre priorité numéro 1</h2>
                  <p className="text-xs text-slate-400 mt-1">L'IA se calibre sur cet objectif dès aujourd'hui.</p>
                </div>

                <div className="space-y-2.5">
                  {OBJECTIVES.map(obj => {
                    const Icon = obj.icon;
                    const active = objective === obj.id;
                    return (
                      <button
                        key={obj.id}
                        onClick={() => setObjective(obj.id)}
                        className={`w-full flex items-center gap-3.5 rounded-2xl border-2 p-4 text-left transition-all ${
                          active ? 'border-teal-500 bg-teal-500/8' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: obj.bg }}>
                          <Icon size={18} style={{ color: obj.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold leading-tight">{obj.title}</p>
                          <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{obj.sub}</p>
                        </div>
                        {active && <Check size={16} className="text-teal-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <Button
                  onClick={() => setScreen(2)}
                  disabled={!objective}
                  className="w-full py-5 text-sm font-black bg-teal-600 hover:bg-teal-500 disabled:opacity-40"
                >
                  Continuer <ArrowRight size={15} className="ml-1.5" />
                </Button>
              </motion.div>
            )}

            {/* ── Screen 2: Ton ── */}
            {screen === 2 && (
              <motion.div key="s2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-black leading-tight">Votre style de communication</h2>
                  <p className="text-xs text-slate-400 mt-1">Les posts IA s'adapteront automatiquement à ce ton.</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {TONES.map(t => {
                    const Icon = t.icon;
                    const active = tone === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTone(t.id)}
                        className={`flex flex-col items-start gap-2.5 rounded-2xl border-2 p-3.5 text-left transition-all ${
                          active ? 'border-teal-500 bg-teal-500/8' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-800">
                          <Icon size={15} style={{ color: t.color }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-tight">{t.title}</p>
                          <p className="text-[10px] text-slate-500 leading-snug mt-0.5 line-clamp-2">{t.example}</p>
                        </div>
                        {active && <Check size={13} className="text-teal-400 ml-auto" />}
                      </button>
                    );
                  })}
                </div>

                <Button
                  onClick={handleFinish}
                  disabled={!tone || configuring}
                  className="w-full py-5 text-sm font-black bg-teal-600 hover:bg-teal-500 disabled:opacity-60"
                >
                  {configuring ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      L'IA configure votre dashboard…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap size={15} />
                      Déployer mon Copilote IA 🚀
                    </span>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
