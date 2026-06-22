/**
 * CreativeFactoryPage — Tunnel 3 étapes "Créas Flash"
 * Brief IA → Production visuelle → Téléchargement / Planification
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Zap, Download, CalendarCheck, ChevronRight,
  CheckCircle2, ArrowLeft, Image, RefreshCw, Star,
  Share2, Globe, Megaphone, Clock, Target, TrendingUp,
  Palette, Layout, SquareCode, Play,
} from 'lucide-react';
import { cn } from '@blinkdotnew/ui';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Brief {
  objective: string;
  tone: string;
  targetAudience: string;
  keyMessage: string;
  promotionDetail: string;
  channels: string[];
}

interface Creative {
  id: string;
  variant: 'A' | 'B' | 'C';
  format: 'square' | 'story';
  headline: string;
  subtext: string;
  ctaLabel: string;
  colorScheme: string;
  bgGradient: string;
  badge: string;
  emoji: string;
}

// ── Données préremplies par l'IA ──────────────────────────────────────────────
const AI_OBJECTIVES = [
  { id: 'weekend', label: 'Générer des clients ce week-end', icon: '🎯', badge: 'Populaire' },
  { id: 'promo', label: 'Promouvoir une offre spéciale', icon: '🔥', badge: '' },
  { id: 'notoriete', label: 'Booster la notoriété locale', icon: '📍', badge: '' },
  { id: 'fidelite', label: 'Fidéliser mes clients existants', icon: '💎', badge: '' },
  { id: 'event', label: 'Annoncer un événement', icon: '🎉', badge: '' },
  { id: 'avis', label: 'Générer des avis Google', icon: '⭐', badge: 'Recommandé' },
];

const TONES = [
  { id: 'pro', label: 'Professionnel', desc: 'Sérieux & crédible' },
  { id: 'friendly', label: 'Chaleureux', desc: 'Proche & humain' },
  { id: 'urgent', label: 'Urgent', desc: 'Offre limitée' },
  { id: 'premium', label: 'Premium', desc: 'Haut de gamme' },
];

const CHANNELS = [
  { id: 'instagram', label: 'Instagram', icon: Share2, color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { id: 'facebook', label: 'Facebook', icon: Globe, color: 'bg-blue-600' },
  { id: 'meta-ads', label: 'Meta Ads', icon: Megaphone, color: 'bg-gradient-to-br from-blue-600 to-indigo-600' },
];

// ── Générateur de créas simulé ────────────────────────────────────────────────
function generateCreatives(brief: Brief): Creative[] {
  const now = new Date();
  const day = now.toLocaleDateString('fr-FR', { weekday: 'long' });

  return [
    {
      id: 'crea-a',
      variant: 'A',
      format: 'square',
      headline: brief.objective === 'weekend'
        ? `Ce ${day}, venez nous découvrir !`
        : brief.keyMessage || 'Découvrez notre offre exclusive',
      subtext: brief.promotionDetail || 'Profitez-en maintenant',
      ctaLabel: 'Réserver maintenant',
      colorScheme: 'Impact Blue',
      bgGradient: 'from-blue-600 via-blue-700 to-indigo-800',
      badge: '⚡ Best Performer',
      emoji: '🎯',
    },
    {
      id: 'crea-b',
      variant: 'B',
      format: 'story',
      headline: brief.tone === 'urgent'
        ? '⏳ Offre limitée — Ne ratez pas ça !'
        : brief.keyMessage || 'Une opportunité à ne pas manquer',
      subtext: brief.targetAudience ? `Pour ${brief.targetAudience}` : 'Pour tous nos clients',
      ctaLabel: 'Découvrir',
      colorScheme: 'Dark Premium',
      bgGradient: 'from-slate-900 via-slate-800 to-blue-900',
      badge: '🏆 Premium Look',
      emoji: '✨',
    },
    {
      id: 'crea-c',
      variant: 'C',
      format: 'square',
      headline: '🌟 Faites-en parler autour de vous',
      subtext: brief.promotionDetail || 'Venez vivre l\'expérience',
      ctaLabel: 'En savoir plus',
      colorScheme: 'Teal Pro',
      bgGradient: 'from-teal-500 via-teal-600 to-emerald-700',
      badge: '📈 Engagement +',
      emoji: '🚀',
    },
  ];
}

// ── Composant carte créative (preview) ───────────────────────────────────────
function CreativeCard({ creative, selected, onSelect }: {
  creative: Creative;
  selected: boolean;
  onSelect: () => void;
}) {
  const isStory = creative.format === 'story';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: ['A', 'B', 'C'].indexOf(creative.variant) * 0.12 }}
      onClick={onSelect}
      className={cn(
        'relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-200',
        'border-2',
        selected
          ? 'border-blue-500 shadow-lg shadow-blue-500/20 scale-[1.02]'
          : 'border-slate-700 hover:border-blue-400/60 hover:scale-[1.01]',
      )}
    >
      {/* Preview visuel */}
      <div className={cn(
        `bg-gradient-to-br ${creative.bgGradient} flex flex-col items-center justify-center p-6 text-white text-center`,
        isStory ? 'aspect-[9/16] min-h-[220px]' : 'aspect-square min-h-[180px]',
      )}>
        <div className="text-4xl mb-3">{creative.emoji}</div>
        <p className="font-extrabold text-base leading-tight mb-2 drop-shadow">{creative.headline}</p>
        <p className="text-sm text-white/80 mb-4">{creative.subtext}</p>
        <div className="bg-white text-slate-900 font-bold text-xs px-4 py-1.5 rounded-full shadow">
          {creative.ctaLabel}
        </div>
        {/* Format badge */}
        <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
          {isStory ? '9:16 Story' : '1:1 Carré'}
        </div>
      </div>

      {/* Infos */}
      <div className="bg-slate-800/90 backdrop-blur-sm px-3 py-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white font-bold text-sm">Variante {creative.variant}</span>
          <span className="text-[10px] text-blue-400 font-semibold">{creative.colorScheme}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-300">{creative.badge}</span>
        </div>
      </div>

      {/* Sélection indicator */}
      {selected && (
        <div className="absolute top-2 left-2">
          <CheckCircle2 size={20} className="text-blue-400 bg-white rounded-full" />
        </div>
      )}
    </motion.div>
  );
}

// ── Étape 1 : Brief Assisté ───────────────────────────────────────────────────
function StepBrief({ brief, onChange, onNext }: {
  brief: Brief;
  onChange: (b: Brief) => void;
  onNext: () => void;
}) {
  const isValid = brief.objective && brief.tone && brief.channels.length > 0;

  const toggleChannel = (id: string) => {
    const next = brief.channels.includes(id)
      ? brief.channels.filter(c => c !== id)
      : [...brief.channels, id];
    onChange({ ...brief, channels: next });
  };

  return (
    <div className="space-y-6">
      {/* Objectif */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <Target size={14} className="text-blue-400" />
          Quel est votre objectif ?
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {AI_OBJECTIVES.map(obj => (
            <button
              key={obj.id}
              onClick={() => onChange({ ...brief, objective: obj.id })}
              className={cn(
                'relative flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-150',
                brief.objective === obj.id
                  ? 'bg-blue-600/20 border-blue-500 text-white'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-blue-400/50 hover:bg-slate-800',
              )}
            >
              <span className="text-lg">{obj.icon}</span>
              <span className="text-xs font-semibold leading-tight">{obj.label}</span>
              {obj.badge && (
                <span className="absolute top-1 right-1 text-[8px] bg-blue-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                  {obj.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Ton */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <Palette size={14} className="text-blue-400" />
          Quel ton adopter ?
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {TONES.map(t => (
            <button
              key={t.id}
              onClick={() => onChange({ ...brief, tone: t.id })}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-center transition-all duration-150',
                brief.tone === t.id
                  ? 'bg-blue-600/20 border-blue-500 text-white'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-blue-400/50',
              )}
            >
              <span className="text-xs font-bold">{t.label}</span>
              <span className="text-[9px] text-slate-500">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message clé (optionnel) */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
          <Sparkles size={14} className="text-blue-400" />
          Message principal <span className="text-slate-500 text-xs font-normal">(optionnel — l'IA le génère)</span>
        </h3>
        <input
          value={brief.keyMessage}
          onChange={e => onChange({ ...brief, keyMessage: e.target.value })}
          placeholder="Ex: -20% sur tous nos services ce week-end"
          className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Canaux */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <Layout size={14} className="text-blue-400" />
          Où souhaitez-vous publier ?
        </h3>
        <div className="flex gap-2">
          {CHANNELS.map(ch => {
            const Icon = ch.icon;
            const active = brief.channels.includes(ch.id);
            return (
              <button
                key={ch.id}
                onClick={() => toggleChannel(ch.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all duration-150',
                  active
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-blue-400/50',
                )}
              >
                <Icon size={14} />
                {ch.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        disabled={!isValid}
        onClick={onNext}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-200',
          isValid
            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 hover:scale-[1.01] active:scale-[0.99]'
            : 'bg-slate-700 text-slate-500 cursor-not-allowed',
        )}
      >
        <Zap size={16} />
        Lancer la production IA
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── Étape 2 : Production IA ───────────────────────────────────────────────────
function StepProduction({ brief, onDone }: { brief: Brief; onDone: (creatives: Creative[]) => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(false);

  const phases = [
    { label: 'Analyse de votre brief...', icon: '🧠' },
    { label: 'Génération des visuels...', icon: '🎨' },
    { label: 'Optimisation Meta Ads...', icon: '⚡' },
    { label: 'Finalisation du pack...', icon: '✅' },
  ];

  // Simule la progression
  useState(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 12 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => {
          setDone(true);
          onDone(generateCreatives(brief));
        }, 400);
      }
      setProgress(Math.min(p, 100));
      setPhase(Math.floor((p / 100) * phases.length));
    }, 180);
    return () => clearInterval(interval);
  });

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8">
      {/* Indicateur rotatif */}
      <div className="relative w-28 h-28">
        <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl">{done ? '✅' : (phases[Math.min(phase, phases.length - 1)]?.icon ?? '🎨')}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm space-y-2">
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>{phases[Math.min(phase, phases.length - 1)]?.label ?? 'Finalisation...'}</span>
          <span className="text-blue-400 font-bold">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Liste des étapes */}
      <div className="w-full max-w-sm space-y-2">
        {phases.map((ph, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300',
              i < phase ? 'bg-blue-600/10 text-blue-300' : i === phase ? 'bg-slate-800 text-white' : 'text-slate-600',
            )}
          >
            {i < phase ? (
              <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
            ) : (
              <div className={cn('w-4 h-4 rounded-full border-2 shrink-0', i === phase ? 'border-blue-400 animate-pulse' : 'border-slate-600')} />
            )}
            <span className="font-medium">{ph.icon} {ph.label}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500 text-center">
        Vos créas sont générées par notre IA en analysant<br />votre secteur et les tendances Meta actuelles
      </p>
    </div>
  );
}

// ── Étape 3 : Résultats & Actions ─────────────────────────────────────────────
function StepResults({ creatives, onRegenerate }: {
  creatives: Creative[];
  onRegenerate: () => void;
}) {
  const [selected, setSelected] = useState<string>(creatives[0]?.id ?? '');
  const [scheduled, setScheduled] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const handleSchedule = () => {
    setScheduled(true);
  };

  if (scheduled) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center space-y-4"
      >
        <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center">
          <CalendarCheck size={36} className="text-blue-400" />
        </div>
        <h3 className="text-xl font-extrabold text-white">Publication planifiée ! 🎉</h3>
        <p className="text-slate-400 text-sm max-w-xs">
          Votre créa sera automatiquement publiée sur les canaux sélectionnés au meilleur moment.
        </p>
        <button
          onClick={onRegenerate}
          className="mt-4 flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-semibold"
        >
          <RefreshCw size={14} />
          Créer un nouveau pack
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header résultats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-white">3 créas premium prêtes ! ✨</h3>
          <p className="text-xs text-slate-400 mt-0.5">Sélectionnez votre favorite et publiez</p>
        </div>
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold border border-blue-500/30 rounded-lg px-3 py-1.5 hover:bg-blue-600/10 transition-colors"
        >
          <RefreshCw size={12} />
          Régénérer
        </button>
      </div>

      {/* Grille des créas */}
      <div className="grid grid-cols-3 gap-3">
        {creatives.map(crea => (
          <CreativeCard
            key={crea.id}
            creative={crea}
            selected={selected === crea.id}
            onSelect={() => setSelected(crea.id)}
          />
        ))}
      </div>

      {/* Stats simulées */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Reach estimé', value: '1,200–4,500', icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Engagement', value: '+340%', icon: Star, color: 'text-yellow-400' },
          { label: 'Prêt en', value: '< 2 min', icon: Clock, color: 'text-blue-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700">
            <stat.icon size={14} className={cn('mx-auto mb-1', stat.color)} />
            <p className="text-xs font-extrabold text-white">{stat.value}</p>
            <p className="text-[9px] text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* CTA Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border transition-all duration-200',
            downloaded
              ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
              : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-blue-400 hover:text-white',
          )}
        >
          {downloaded ? <CheckCircle2 size={16} /> : <Download size={16} />}
          {downloaded ? 'Téléchargé !' : 'Télécharger le Pack'}
        </button>
        <button
          onClick={handleSchedule}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-150"
        >
          <CalendarCheck size={16} />
          Planifier sur Instagram / Meta
        </button>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: 'Brief IA', icon: SquareCode },
  { num: 2, label: 'Production', icon: Sparkles },
  { num: 3, label: 'Prêt à poster', icon: Play },
];

const defaultBrief: Brief = {
  objective: 'weekend',
  tone: 'friendly',
  targetAudience: '',
  keyMessage: '',
  promotionDetail: '',
  channels: ['instagram'],
};

export default function CreativeFactoryPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [brief, setBrief] = useState<Brief>(defaultBrief);
  const [creatives, setCreatives] = useState<Creative[]>([]);

  const handleGenerate = () => setStep(2);

  const handleProductionDone = (result: Creative[]) => {
    setCreatives(result);
    setStep(3);
  };

  const handleRegenerate = () => {
    setStep(1);
    setBrief(defaultBrief);
    setCreatives([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Image size={16} className="text-white" />
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                🎨 Créas Flash
                <span className="ml-2 text-[10px] font-bold bg-blue-600/30 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full align-middle">
                  Style Kreative
                </span>
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Vos visuels réseaux &amp; Meta Ads prêts en 2 min — Remplissez un micro-brief, l'IA produit le reste
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div key={s.num} className="flex items-center flex-1">
                <div className={cn(
                  'flex items-center gap-2 flex-1',
                  i > 0 ? 'flex-1' : '',
                )}>
                  {i > 0 && (
                    <div className={cn(
                      'h-px flex-1 transition-colors',
                      isDone ? 'bg-blue-500' : 'bg-slate-700',
                    )} />
                  )}
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all',
                    isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' :
                      isDone ? 'bg-blue-600/15 text-blue-400' :
                        'bg-slate-800 text-slate-500',
                  )}>
                    {isDone ? <CheckCircle2 size={13} /> : <Icon size={13} />}
                    <span>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn('h-px flex-1 transition-colors', step > s.num ? 'bg-blue-500' : 'bg-slate-700')} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Card principale */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <SquareCode size={16} className="text-blue-400" />
                    Brief Assisté — 1 minute
                  </h2>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                    <Sparkles size={9} />
                    Pré-rempli par l'IA
                  </span>
                </div>
                <StepBrief brief={brief} onChange={setBrief} onNext={handleGenerate} />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-blue-400" />
                    Production IA Instantanée
                  </h2>
                </div>
                <StepProduction brief={brief} onDone={handleProductionDone} />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <button
                    onClick={() => setStep(1)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Play size={16} className="text-blue-400" />
                    Tu reçois, tu postes
                  </h2>
                </div>
                <StepResults creatives={creatives} onRegenerate={handleRegenerate} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Zap size={11} className="text-blue-400" /> Formats Square &amp; Story</span>
          <span className="flex items-center gap-1"><Megaphone size={11} className="text-blue-400" /> Compatible Meta Ads</span>
          <span className="flex items-center gap-1"><Clock size={11} className="text-blue-400" /> Prêt en 2 minutes</span>
        </div>
      </div>
    </div>
  );
}
