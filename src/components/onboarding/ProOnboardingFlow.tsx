/**
 * ProOnboardingFlow v2 — Flow d'onboarding dédié aux commerçants Pro.
 * Étapes : GEO Radar → Bouclier Stripe → Calendrier IA → SMS → AIO Sync → Objectif → Reco IA → Notifications.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@blinkdotnew/ui';
import {
  Bell, BellOff, MapPin, Shield, Calendar, Target,
  TrendingUp, Users, Star, ChevronRight, Check, Zap, CheckCircle2,
  MessageSquare, Compass, Sparkles
} from 'lucide-react';
import { StepProGEO } from './steps/StepProGEO';
import { StepProStripe } from './steps/StepProStripe';
import { StepProSMS } from './steps/StepProSMS';
import { StepProAIO } from './steps/StepProAIO';
import { StepProRecommendation } from './steps/StepProRecommendation';

interface Props {
  sector?: string;
  onComplete: () => void;
  onSkip: () => void;
}

type ProStep = 'geo' | 'stripe' | 'calendar' | 'sms' | 'aio' | 'objective' | 'recommendation' | 'notifs';

const PRO_OBJECTIVES = [
  {
    id: 'visibility',
    title: '📈 Développer ma visibilité locale',
    sub: 'GEO IA, citations, mots-clés locaux',
    icon: MapPin,
  },
  {
    id: 'revenue',
    title: '💰 Protéger et augmenter mon CA',
    sub: 'Bouclier no-show, SMS clients, fidélisation',
    icon: TrendingUp,
  },
  {
    id: 'content',
    title: '✍️ Automatiser mes publications',
    sub: 'Calendrier IA, multi-posting, visuels auto',
    icon: Calendar,
  },
  {
    id: 'clients',
    title: '🎯 Attirer de nouveaux clients',
    sub: 'Publicités locales, prospection, referral',
    icon: Users,
  },
];

const STEP_ORDER: ProStep[] = ['geo', 'stripe', 'calendar', 'sms', 'aio', 'objective', 'recommendation', 'notifs'];

const STEP_META: Record<ProStep, { icon: React.ReactNode; shortLabel: string }> = {
  geo: { icon: <MapPin size={12} />, shortLabel: 'GEO' },
  stripe: { icon: <Shield size={12} />, shortLabel: 'Stripe' },
  calendar: { icon: <Calendar size={12} />, shortLabel: 'Calendrier' },
  sms: { icon: <MessageSquare size={12} />, shortLabel: 'SMS' },
  aio: { icon: <Compass size={12} />, shortLabel: 'AIO' },
  objective: { icon: <Target size={12} />, shortLabel: 'Objectif' },
  recommendation: { icon: <Sparkles size={12} />, shortLabel: 'Plan IA' },
  notifs: { icon: <Bell size={12} />, shortLabel: 'Alertes' },
};

function StepDots({ current }: { current: ProStep }) {
  const idx = STEP_ORDER.indexOf(current);
  return (
    <div className="flex items-center gap-1.5">
      {STEP_ORDER.map((s, i) => (
        <div
          key={s}
          title={STEP_META[s].shortLabel}
          className={`transition-all duration-300 rounded-full flex items-center justify-center ${
            i === idx
              ? 'w-6 h-2 bg-teal-500'
              : i < idx
              ? 'w-2 h-2 bg-teal-500/60'
              : 'w-2 h-2 bg-slate-700'
          }`}
        />
      ))}
    </div>
  );
}

function CalendarPreview({ onComplete }: { onComplete: () => void }) {
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [keywords, setKeywords] = useState('');

  const SAMPLE_POSTS = [
    { day: 'Lundi', emoji: '📸', text: 'Découvrez notre offre du jour — réservez maintenant!' },
    { day: 'Mercredi', emoji: '⭐', text: 'Merci à nos clients fidèles — avis Google' },
    { day: 'Vendredi', emoji: '🎉', text: 'Bonne fin de semaine ! On vous attend ce week-end' },
    { day: 'Dimanche', emoji: '💬', text: 'Retour sur notre semaine — engagement clients' },
  ];

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
      setTimeout(onComplete, 1000);
    }, 2200);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/30 dark:to-blue-950/20 border border-violet-200 dark:border-violet-800 px-3.5 py-3 flex items-start gap-2.5">
        <Calendar size={16} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-violet-800 dark:text-violet-300 leading-relaxed">
          <strong>CALENDRIER IA :</strong> 4 semaines de posts optimisés générés en 10 secondes
          selon votre secteur et vos événements locaux.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          3 mots-clés prioritaires de votre activité
        </label>
        <input
          type="text"
          placeholder="Ex : coiffeur, balayage, mariage..."
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-all"
        />
      </div>

      {generated ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={11} /> Semaine générée par l'IA
            </p>
            {SAMPLE_POSTS.map((post, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/20 px-3 py-2.5"
              >
                <span className="text-base shrink-0">{post.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-primary uppercase">{post.day}</p>
                  <p className="text-xs text-foreground truncate">{post.text}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-bold py-2.5 shadow-md disabled:opacity-70 transition-all active:scale-[0.98]"
        >
          {generating ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              L'IA génère vos posts…
            </>
          ) : (
            <>
              <Zap size={14} />
              Générer mes 4 semaines de contenu
              <ChevronRight size={14} />
            </>
          )}
        </button>
      )}
    </div>
  );
}

export function ProOnboardingFlow({ sector = 'votre secteur', onComplete, onSkip }: Props) {
  const [step, setStep] = useState<ProStep>('geo');
  const [objective, setObjective] = useState('');
  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);

  const stepIndex = STEP_ORDER.indexOf(step);
  const stepLabel = `Étape ${stepIndex + 1} sur ${STEP_ORDER.length}`;

  const handleNotifRequest = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotifGranted(perm === 'granted');
      } catch {
        setNotifGranted(false);
      }
    } else {
      setNotifGranted(false);
    }
  };

  const next = (nextStep: ProStep) => () => setStep(nextStep);

  const wrapStep = (content: React.ReactNode, title: string, desc: string) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#0F172A] text-white shadow-2xl"
          style={{ border: '1px solid rgba(20,184,166,0.3)' }}
        >
          {/* Teal top accent for pro */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-teal-500 to-transparent" />

          <div className="flex items-center justify-between p-5 pb-2">
            <StepDots current={step} />
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500">{stepLabel}</span>
              <button onClick={onSkip} className="text-xs font-medium text-slate-400 hover:text-white transition-colors">
                Passer
              </button>
            </div>
          </div>

          <div className="px-6 pb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black uppercase tracking-wider mb-3">
              🏪 Activation Pro
            </div>
            <h2 className="text-xl font-black leading-tight">{title}</h2>
            <p className="text-sm text-slate-400 mt-1 mb-4">{desc}</p>
          </div>

          <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
            {content}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );

  if (step === 'geo') {
    return wrapStep(
      <StepProGEO onComplete={next('stripe')} sector={sector} />,
      'Votre visibilité sur les IA locales',
      'ChatGPT, Gemini et Google IA recommandent-ils votre commerce ? Découvrez votre score.'
    );
  }

  if (step === 'stripe') {
    return wrapStep(
      <StepProStripe onComplete={next('calendar')} />,
      'Protégez vos rendez-vous',
      'Activez le bouclier no-show — chaque annulation encaisse une pénalité automatiquement.'
    );
  }

  if (step === 'calendar') {
    return wrapStep(
      <CalendarPreview onComplete={next('sms')} />,
      'Générez votre calendrier IA',
      "4 semaines de contenu planifié en 10 secondes. Publiez partout d'un clic."
    );
  }

  if (step === 'sms') {
    return wrapStep(
      <StepProSMS onComplete={next('aio')} sector={sector} />,
      'Réactivez vos clients silencieux',
      "95% de taux de lecture. L'IA personnalise chaque message selon le profil client."
    );
  }

  if (step === 'aio') {
    return wrapStep(
      <StepProAIO onComplete={next('objective')} sector={sector} />,
      'Apparaissez dans les réponses IA',
      'Configurez 12 mots-clés pour que ChatGPT, Gemini et Perplexity vous recommandent.'
    );
  }

  if (step === 'objective') {
    return wrapStep(
      <div className="space-y-3">
        {PRO_OBJECTIVES.map((obj) => (
          <button
            key={obj.id}
            onClick={() => { setObjective(obj.id); setTimeout(() => setStep('recommendation'), 300); }}
            className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
              objective === obj.id ? 'border-teal-500 bg-teal-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'
            }`}
          >
            <div className={`rounded-lg p-2 ${objective === obj.id ? 'bg-teal-500' : 'bg-slate-800'}`}>
              <obj.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">{obj.title}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">{obj.sub}</div>
            </div>
            {objective === obj.id && <Check className="ml-auto h-5 w-5 text-teal-500" />}
          </button>
        ))}
      </div>,
      'Quel est votre priorité #1 ?',
      'Kompilot configurera son cockpit selon votre objectif principal.'
    );
  }

  if (step === 'recommendation') {
    return wrapStep(
      <StepProRecommendation onComplete={next('notifs')} sector={sector} />,
      'Votre plan d\'action personnalisé',
      "L'IA analyse votre profil et génère les 3 actions prioritaires pour décollage immédiat."
    );
  }

  if (step === 'notifs') {
    return wrapStep(
      <div className="space-y-5">
        <div className="space-y-2">
          {[
            { icon: '💰', title: 'No-show détecté', desc: 'Pénalité encaissée — alerte immédiate' },
            { icon: '⭐', title: 'Nouvel avis Google', desc: 'Répondez en 1 clic avec l\'IA' },
            { icon: '📈', title: 'Opportunité CA', desc: 'Client inactif 30j → SMS de relance auto' },
            { icon: '🤖', title: 'Score GEO IA', desc: 'Rapport hebdomadaire chaque lundi 9h' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-white/4 border border-white/8 p-3">
              <span className="text-lg shrink-0">{item.icon}</span>
              <div>
                <p className="text-xs font-bold text-slate-200">{item.title}</p>
                <p className="text-[10px] text-slate-500 leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {notifGranted === null ? (
          <div className="space-y-2">
            <Button
              onClick={async () => { await handleNotifRequest(); setTimeout(onComplete, 600); }}
              className="w-full py-5 text-base font-black bg-teal-600 hover:bg-teal-500"
            >
              <Bell className="h-4 w-4 mr-2" />
              Activer les alertes financières
            </Button>
            <button onClick={onComplete} className="w-full text-center text-xs text-slate-500 hover:text-slate-400 transition-colors py-2">
              Plus tard — configurer dans Paramètres → Notifications
            </button>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${notifGranted ? 'bg-teal-500/15 text-teal-400' : 'bg-slate-700/50 text-slate-400'}`}>
              {notifGranted ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              {notifGranted ? 'Alertes Pro activées ✓' : 'Configurable dans Paramètres'}
            </div>
            <Button onClick={onComplete} className="w-full py-5 text-base font-black bg-teal-600 hover:bg-teal-500">
              Ouvrir mon cockpit Pro 🚀
            </Button>
          </div>
        )}
      </div>,
      'Restez alerté sur vos revenus',
      'Uniquement des alertes à impact financier direct — aucune notification publicitaire.'
    );
  }

  return null;
}
