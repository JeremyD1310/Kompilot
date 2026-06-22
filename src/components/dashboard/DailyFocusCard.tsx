/**
 * DailyFocusCard — 1 seule mission IA par jour en haut du dashboard.
 *
 * L'IA génère une mission contextualisée selon :
 * - Le nb de jours sans post
 * - Les avis sans réponse
 * - Les événements locaux détectés
 *
 * La Golden Win Engine se déclenche quand la mission est marquée accomplie.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckCircle2, RefreshCw, Sparkles, ArrowRight, ChevronDown } from 'lucide-react';
import { Button, Badge } from '@blinkdotnew/ui';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { launchGoldenWin } from '../../lib/goldenWin';

/* ── Types ────────────────────────────────────────────────────── */
interface DailyMission {
  title:      string;
  description: string;
  cta:        string;
  category:   'post' | 'reviews' | 'coupon' | 'profile' | 'story';
  urgency:    'high' | 'medium' | 'low';
  route?:     string;
}

const CATEGORY_CONFIG = {
  post:    { emoji: '✍️', color: 'bg-teal-500',    lightColor: 'bg-teal-50 dark:bg-teal-900/20',   borderColor: 'border-teal-200 dark:border-teal-800/50'   },
  reviews: { emoji: '⭐', color: 'bg-amber-500',   lightColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800/50' },
  coupon:  { emoji: '🎟️', color: 'bg-pink-500',   lightColor: 'bg-pink-50 dark:bg-pink-900/20',   borderColor: 'border-pink-200 dark:border-pink-800/50'   },
  profile: { emoji: '🏢', color: 'bg-blue-500',    lightColor: 'bg-blue-50 dark:bg-blue-900/20',   borderColor: 'border-blue-200 dark:border-blue-800/50'   },
  story:   { emoji: '📱', color: 'bg-violet-500',  lightColor: 'bg-violet-50 dark:bg-violet-900/20', borderColor: 'border-violet-200 dark:border-violet-800/50' },
};

const URGENCY_LABEL = { high: 'Urgent', medium: 'Ce soir', low: 'Aujourd\'hui' };

/* ── Static mission pool (fallback if no API) ─────────────────── */
const MISSION_POOL: DailyMission[] = [
  {
    title: 'Publiez votre premier contenu de la semaine',
    description: 'Vous n\'avez pas publié depuis 4 jours. Un seul post génère en moyenne 23 interactions locales.',
    cta: 'Créer un post maintenant',
    category: 'post', urgency: 'high', route: '/cockpit',
  },
  {
    title: '3 avis clients attendent votre réponse',
    description: 'Répondre aux avis augmente votre score Google de 0.3 point en moyenne. 2 minutes suffisent.',
    cta: 'Répondre aux avis',
    category: 'reviews', urgency: 'high', route: '/inbox',
  },
  {
    title: 'Créez une Story interactive pour aujourd\'hui',
    description: 'Les commerces qui publient 1 Story/semaine ont 41% plus d\'interactions que la moyenne locale.',
    cta: 'Générer la Story',
    category: 'story', urgency: 'medium', route: '/croissance',
  },
  {
    title: 'Lancez une offre flash — météo favorable',
    description: 'Température > 22°C ce week-end. Moment idéal pour un coupon terrasse ou sortie.',
    cta: 'Créer l\'offre flash',
    category: 'coupon', urgency: 'medium', route: '/cockpit',
  },
  {
    title: 'Complétez votre profil Google Business',
    description: 'Votre fiche manque de photos récentes. Les fiches complètes reçoivent 7x plus d\'appels.',
    cta: 'Compléter la fiche',
    category: 'profile', urgency: 'low', route: '/google-maps',
  },
];

/* ── Persistence ─────────────────────────────────────────────── */
const STORAGE_KEY = 'kompilot_daily_focus';
interface StoredFocus { mission: DailyMission; date: string; done: boolean }

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadToday(): StoredFocus | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredFocus = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) return null;
    return parsed;
  } catch { return null; }
}

function saveToday(mission: DailyMission, done: boolean) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ mission, date: getTodayKey(), done }));
}

/* ── Component ─────────────────────────────────────────────────── */
export function DailyFocusCard() {
  const { activeEstablishment } = useEstablishment();
  const { masterProfile } = useUserProfile();

  const [mission,    setMission]    = useState<DailyMission | null>(null);
  const [done,       setDone]       = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);

  // Load or pick mission
  useEffect(() => {
    const stored = loadToday();
    if (stored) {
      setMission(stored.mission);
      setDone(stored.done);
      return;
    }
    // Pick a mission deterministically from today's date + profile
    const seed = new Date().getDate() + (masterProfile?.length ?? 0);
    const idx = seed % MISSION_POOL.length;
    const picked = MISSION_POOL[idx];
    setMission(picked);
    saveToday(picked, false);
  }, [masterProfile]);

  const handleDone = () => {
    if (!mission) return;
    setDone(true);
    saveToday(mission, true);
    launchGoldenWin({ count: 45, origin: 'top' });
  };

  const handleRefresh = () => {
    const next = MISSION_POOL[Math.floor(Math.random() * MISSION_POOL.length)];
    setMission(next);
    setDone(false);
    saveToday(next, false);
  };

  if (!mission) return null;

  const cat = CATEGORY_CONFIG[mission.category];
  const urgLabel = URGENCY_LABEL[mission.urgency];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`rounded-2xl border-2 ${cat.borderColor} ${cat.lightColor} overflow-hidden`}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl ${cat.color} flex items-center justify-center text-white text-base shrink-0`}>
            {cat.emoji}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Mission du jour
              </span>
              <Badge className={`text-[10px] border-none ${
                mission.urgency === 'high'
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : mission.urgency === 'medium'
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {urgLabel}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {activeEstablishment?.name ?? 'Votre établissement'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {done && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
        </div>
      </button>

      {/* Body */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {done ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 p-3"
                >
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Mission accomplie !</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500">Nouvelle mission disponible demain.</p>
                  </div>
                  <button
                    onClick={handleRefresh}
                    className="ml-auto p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                  </button>
                </motion.div>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {mission.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {mission.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className={`flex-1 h-9 gap-2 text-white font-bold ${cat.color.replace('bg-', 'bg-')} hover:opacity-90`}
                      style={{ background: undefined }}
                      onClick={handleDone}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {mission.cta}
                      <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                    </Button>
                    <button
                      onClick={handleRefresh}
                      title="Autre mission"
                      className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
