/**
 * ExhaustiveOnboardingModal
 *
 * Shown on first login after account creation. Presents two paths:
 * A) Video tour — chapters filtered dynamically by plan tier
 * B) Interactive click-by-click guide — steps filtered by plan tier
 *
 * Plan logic:
 *  Starter   → Cockpit Vocal + Calendrier classique + Multi-diffusion + ROI Counter
 *  Business  → Starter + GEO Radar + Calendrier Masse + YouTube Shorts + WhatsApp
 *  Franchise → Business + Gestion d'Équipe + Multi-établissements
 *  Demo      → Full franchise (7 steps), with special welcome message
 *
 * Persists completion to localStorage: 'kompilot_exhaustive_onboarding_v1'
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, ChevronRight, ChevronLeft, CheckCircle2, SkipForward, AlertTriangle, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { useNavigate, Link } from '@tanstack/react-router';
import { usePlan } from '../../hooks/usePlan';

const STORAGE_KEY = 'kompilot_exhaustive_onboarding_v1';

export function useExhaustiveOnboarding(userId?: string) {
  const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(key) !== '1';
  });
  
  const close = () => {
    setShow(false);
    if (typeof window !== 'undefined') localStorage.setItem(key, '1');
  };
  
  return { show, close };
}

// ── Chapter definitions (video path) ─────────────────────────────────────────

interface VideoChapter {
  emoji: string;
  title: string;
  time: string;
  desc: string;
  /** Tiers that see this chapter (undefined = all) */
  tiers?: ('starter' | 'business' | 'franchise')[];
}

const ALL_VIDEO_CHAPTERS: VideoChapter[] = [
  {
    emoji: '🤖',
    title: 'Scan GEO & GEA',
    time: '0:00',
    desc: "L'IA analyse ChatGPT, Gemini et Perplexity, trouve les sources des concurrents et prépare la contre-attaque.",
    tiers: ['business', 'franchise'],
  },
  {
    emoji: '🎙️',
    title: 'Cockpit IA Vocal',
    time: '0:17',
    desc: "Dictez votre idée au micro sans toucher au clavier. L'IA génère, formate et planifie.",
    // available on all tiers
  },
  {
    emoji: '📅',
    title: 'Génération en Masse',
    time: '0:34',
    desc: 'Remplissez 30 jours de posts, carrousels et scripts TikTok/Reels en 1 clic.',
    tiers: ['business', 'franchise'],
  },
  {
    emoji: '📍',
    title: 'Multi-Diffusion Local',
    time: '0:51',
    desc: 'Cross-posting automatique vers Google Maps et YouTube Shorts pour booster votre SEO.',
    tiers: ['business', 'franchise'],
  },
  {
    emoji: '💬',
    title: 'Inbox Unique WhatsApp / Meta',
    time: '1:08',
    desc: "Répondez aux clients avec l'IA et insérez le lien de réservation automatiquement.",
    tiers: ['business', 'franchise'],
  },
  {
    emoji: '💰',
    title: 'Compteur de Croissance',
    time: '1:25',
    desc: "Kompilot prouve son ROI grâce au panier moyen et vos clics, appels, itinéraires.",
    // available on all tiers
  },
  {
    emoji: '🎬',
    title: 'Stories IA — Instagram & Facebook',
    time: '1:42',
    desc: "Créez des Stories verticales 9:16 avec l'IA pour Instagram et Facebook. Sticker CTA, swipe-up, filigrane marque blanche — diffusées en 1 clic.",
    tiers: ['business', 'franchise'],
  },
  {
    emoji: '🖼️',
    title: 'Creative Factory IA — Imagen 4.0',
    time: '1:59',
    desc: "Le moteur Imagen 4.0 de Google génère vos visuels de marque professionnels. Prévisualisez en temps réel sur Google Maps, Instagram Feed et Stories.",
    // available on all tiers
  },
  {
    emoji: '🌐',
    title: 'AIO Sync — Perplexity & ChatGPT',
    time: '2:16',
    desc: "L'AIO Sync injecte automatiquement vos mots-clés locaux dans les moteurs conversationnels (ChatGPT, Perplexity, Gemini) pour vous rendre visible lors des recherches vocales.",
    tiers: ['business', 'franchise'],
  },
  {
    emoji: '📊',
    title: 'ROAS Detector — Vérité Publicitaire',
    time: '2:33',
    desc: "Auditez la vérité de vos campagnes Meta et Google Ads. L'IA détecte les dépenses inutiles et optimise votre ROAS en temps réel.",
    tiers: ['business', 'franchise'],
  },
  {
    emoji: '🔐',
    title: 'Sécurité Équipe & RGPD',
    time: '2:50',
    desc: "Invitez vos employés avec accès bridés — marketing oui, données financières non.",
    tiers: ['franchise'],
  },
];

// For starter: add a "calendrier classique" chapter in place of masse
const STARTER_CLASSIC_CALENDAR_CHAPTER: VideoChapter = {
  emoji: '📅',
  title: 'Calendrier Éditorial',
  time: '0:34',
  desc: "Planifiez vos posts à l'avance sur Instagram et Facebook avec votre calendrier éditorial visuel.",
};

// ── Step definitions (interactive path) ──────────────────────────────────────

interface GuideStep {
  emoji: string;
  tag: string;
  title: string;
  desc: string;
  actionLabel: string;
  href: string;
  color: string;
  bg: string;
  border: string;
  /** Tiers that see this step (undefined = all) */
  tiers?: ('starter' | 'business' | 'franchise')[];
}

const ALL_GUIDE_STEPS: GuideStep[] = [
  // Step 0 — Radar GEO/GEA (Business + Franchise)
  {
    emoji: '🤖',
    tag: 'Radar GEO & GEA',
    title: 'Votre visibilité sur ChatGPT, Gemini et Perplexity',
    desc: "Ici, l'IA scanne votre visibilité sur ChatGPT, Gemini et Perplexity, et traque les sources de vos concurrents pour vous imposer dans les réponses.",
    actionLabel: 'Voir le Radar GEO',
    href: '/dashboard',
    color: 'from-red-500 to-orange-500',
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800/40',
    tiers: ['business', 'franchise'],
  },
  // Step 1 — Cockpit IA (ALL)
  {
    emoji: '🎙️',
    tag: 'Cockpit IA Vocal',
    title: "Dictez, l'IA rédige et publie",
    desc: "Besoin de poster ? Cliquez sur ce micro géant, dictez votre idée à voix haute, l'IA s'occupe de tout.",
    actionLabel: 'Ouvrir le Cockpit IA',
    href: '/cockpit',
    color: 'from-violet-500 to-indigo-600',
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    border: 'border-violet-200 dark:border-violet-800/40',
  },
  // Step 2 — Calendrier de Masse (Business + Franchise) / classic calendar for Starter shown separately
  {
    emoji: '📅',
    tag: 'Calendrier de Masse',
    title: '1 mois de contenu en 1 clic',
    desc: "Générez ici 1 mois complet de contenu (images, carrousels, et scripts vidéos verticaux TikTok/Reels) en un seul clic.",
    actionLabel: 'Voir le Calendrier',
    href: '/calendar',
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800/40',
    tiers: ['business', 'franchise'],
  },
  // Step 2b — Classic Calendar (Starter only)
  {
    emoji: '📅',
    tag: 'Calendrier Éditorial',
    title: 'Planifiez vos posts à l\'avance',
    desc: "Planifiez et organisez vos publications Instagram et Facebook sur un calendrier visuel. Créez, modifiez et programmez vos posts en quelques secondes.",
    actionLabel: 'Voir le Calendrier',
    href: '/calendar',
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800/40',
    tiers: ['starter'],
  },
  // Step 3 — YouTube Shorts & Maps (Business + Franchise)
  {
    emoji: '📍',
    tag: 'Multi-Diffusion',
    title: 'Google Maps + YouTube Shorts automatiques',
    desc: "Cochez ces cases pour que chaque post alimente automatiquement vos nouveautés Google Maps et vos YouTube Shorts pour booster votre SEO.",
    actionLabel: 'Paramétrer la diffusion',
    href: '/settings',
    color: 'from-teal-500 to-emerald-500',
    bg: 'bg-teal-50 dark:bg-teal-950/20',
    border: 'border-teal-200 dark:border-teal-800/40',
    tiers: ['business', 'franchise'],
  },
  // Step 3b — Multi-diffusion Instagram/Facebook (Starter)
  {
    emoji: '📢',
    tag: 'Multi-Diffusion',
    title: 'Instagram & Facebook en 1 clic',
    desc: "Diffusez chaque post simultanément sur Instagram et Facebook. Un seul bouton publie partout — zéro copier-coller.",
    actionLabel: 'Paramétrer la diffusion',
    href: '/settings',
    color: 'from-teal-500 to-emerald-500',
    bg: 'bg-teal-50 dark:bg-teal-950/20',
    border: 'border-teal-200 dark:border-teal-800/40',
    tiers: ['starter'],
  },
  // Step 4 — WhatsApp Inbox (Business + Franchise)
  {
    emoji: '💬',
    tag: 'Messagerie Unique',
    title: 'WhatsApp, Instagram, Messenger centralisés',
    desc: "Centralisez vos messages WhatsApp, Instagram et Messenger. L'IA rédige vos réponses et glisse votre lien de réservation (Planity, etc.) pour vous.",
    actionLabel: "Ouvrir l'Inbox",
    href: '/inbox',
    color: 'from-green-600 to-emerald-400',
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-800/40',
    tiers: ['business', 'franchise'],
  },
  // Step 5 — ROI Counter (ALL)
  {
    emoji: '💰',
    tag: 'Compteur de Croissance',
    title: 'Votre ROI en chiffres réels',
    desc: "Configurez votre panier moyen ici. Ce tableau de bord vous montre en temps réel le chiffre d'affaires généré par vos clics, appels et itinéraires.",
    actionLabel: 'Voir les Performances',
    href: '/performance',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800/40',
  },
  // Step 5b — Stories IG + FB (Business + Franchise)
  {
    emoji: '🎬',
    tag: 'Stories IA',
    title: 'Stories verticales Instagram & Facebook',
    desc: "Dans la Creative Factory, basculez en mode Story 9:16. L'IA génère un visuel plein écran avec sticker CTA Réserver, barre de progression et lien Swipe-Up Instagram. En 1 clic, diffusez sur Instagram et Facebook simultanément.",
    actionLabel: 'Ouvrir Creative Factory → onglet Story 9:16',
    href: '/creative-factory',
    color: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    border: 'border-purple-200 dark:border-purple-800/40',
    tiers: ['business', 'franchise'],
  },
  // Step 5c — Creative Factory IA (ALL)
  {
    emoji: '🖼️',
    tag: 'Creative Factory IA',
    title: 'Visuels professionnels par Imagen 4.0',
    desc: "Générez un visuel de marque en 15 secondes avec le moteur Imagen 4.0 de Google. Choisissez votre style (flatlay, studio, modern, vintage), rédigez votre prompt, et prévisualisez en direct sur Google Maps, Instagram Feed ou vos Stories. L'agentage Marque Blanche ajoute votre filigrane automatiquement.",
    actionLabel: 'Ouvrir Creative Factory',
    href: '/creative-factory',
    color: 'from-teal-500 to-cyan-400',
    bg: 'bg-teal-50 dark:bg-teal-950/20',
    border: 'border-teal-200 dark:border-teal-800/40',
  },
  // Step 5d — AIO Sync (Business + Franchise)
  {
    emoji: '🌐',
    tag: 'AIO Sync',
    title: 'Imposez-vous sur ChatGPT & Perplexity',
    desc: "L'AIO Sync programme des injections sémantiques sur ChatGPT, Perplexity et Gemini. Chaque lundi, votre établissement est re-positionné sur vos 12 requêtes locales prioritaires. Résultat : vous apparaissez dans les réponses conversationnelles sans jamais payer de pub.",
    actionLabel: 'Configurer AIO Sync',
    href: '/aio',
    color: 'from-indigo-500 to-blue-600',
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
    border: 'border-indigo-200 dark:border-indigo-800/40',
    tiers: ['business', 'franchise'],
  },
  // Step 5e — ROAS Detector (Business + Franchise)
  {
    emoji: '📊',
    tag: 'ROAS Detector',
    title: 'Vérité publicitaire Meta & Google Ads',
    desc: "Entrez votre budget publicitaire mensuel et votre ROAS cible. L'IA Kompilot audite vos campagnes, détecte les audiences saturées, les créatifs sous-performants et les enchères mal calibrées. Résultat : réduction du gaspillage pub de 20 à 40% dès le premier mois.",
    actionLabel: 'Lancer l\'audit ROAS',
    href: '/roas',
    color: 'from-amber-500 to-orange-400',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800/40',
    tiers: ['business', 'franchise'],
  },
  // Step 6 — Team management (Franchise only)
  {
    emoji: '🔐',
    tag: 'Équipe & RGPD',
    title: 'Accès sécurisés pour vos collaborateurs',
    desc: "Invitez vos collaborateurs ici. Leurs accès sont sécurisés : ils gèrent le marketing mais vos données financières et votre facturation restent secrètes.",
    actionLabel: "Gérer l'équipe",
    href: '/settings',
    color: 'from-slate-600 to-slate-500',
    bg: 'bg-slate-50 dark:bg-slate-950/20',
    border: 'border-slate-200 dark:border-slate-800/40',
    tiers: ['franchise'],
  },
];

// ── Video path component ──────────────────────────────────────────────────────

type Tier = 'starter' | 'business' | 'franchise';

function VideoPath({ onComplete, tier, isDemoActive }: { onComplete: () => void; tier: Tier; isDemoActive: boolean }) {
  // Filter chapters for this tier
  const chapters = ALL_VIDEO_CHAPTERS.filter(ch =>
    !ch.tiers || ch.tiers.includes(tier) ||
    // For starter: swap the "masse" chapter with the classic calendar chapter
    (tier === 'starter' && ch.emoji === '📅' && !ch.tiers)
  ).map(ch => {
    // Replace mass-calendar entry with classic calendar for starter
    if (tier === 'starter' && ch.title === 'Génération en Masse') {
      return STARTER_CLASSIC_CALENDAR_CHAPTER;
    }
    return ch;
  });

  // For starter: use ~60s; business: ~120s; franchise: ~150s
  const duration = tier === 'starter' ? 60 : tier === 'business' ? 120 : 150;

  const [activeChapter, setActiveChapter] = useState(0);
  const [watched, setWatched] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);
  const playIconTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Typewriter effect for Cockpit chapter
  const COCKPIT_PHRASE = 'Je veux un post Instagram pour annoncer nos sushis du moment à La Rochelle…';
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCockpitChapter = chapters[activeChapter]?.title === 'Cockpit IA Vocal';

  useEffect(() => {
    if (!isCockpitChapter || simulatedProgress === 0) {
      setTypewriterText('');
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      return;
    }
    setTypewriterText('');
    let idx = 0;
    typewriterRef.current = setInterval(() => {
      idx++;
      setTypewriterText(COCKPIT_PHRASE.slice(0, idx));
      if (idx >= COCKPIT_PHRASE.length) {
        clearInterval(typewriterRef.current!);
        // Reset and retype after a pause
        setTimeout(() => {
          idx = 0;
          setTypewriterText('');
          typewriterRef.current = setInterval(() => {
            idx++;
            setTypewriterText(COCKPIT_PHRASE.slice(0, idx));
            if (idx >= COCKPIT_PHRASE.length) clearInterval(typewriterRef.current!);
          }, 45);
        }, 2000);
      }
    }, 45);
    return () => { if (typewriterRef.current) clearInterval(typewriterRef.current); };
  }, [isCockpitChapter, simulatedProgress]);

  const startSimulation = () => {
    if (timerRef.current) return;
    pausedRef.current = false;
    setPaused(false);
    timerRef.current = setInterval(() => {
      if (pausedRef.current) return;
      setSimulatedProgress(p => {
        const next = p + 100 / duration;
        if (next >= 100) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setWatched(true);
          return 100;
        }
        const chapterIdx = Math.min(Math.floor((next / 100) * chapters.length), chapters.length - 1);
        setActiveChapter(chapterIdx);
        return next;
      });
    }, 1000);
  };

  // Jump to chapter at its fractional timestamp
  const jumpToChapter = (idx: number) => {
    setActiveChapter(idx);
    const targetPct = (idx / chapters.length) * 100;
    setSimulatedProgress(targetPct);
    if (simulatedProgress === 0) startSimulation();
    // Resume if paused
    if (pausedRef.current) {
      pausedRef.current = false;
      setPaused(false);
    }
  };

  const togglePause = () => {
    if (simulatedProgress === 0) { startSimulation(); return; }
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    // Show ephemeral play/pause icon
    setShowPlayIcon(true);
    if (playIconTimerRef.current) clearTimeout(playIconTimerRef.current);
    playIconTimerRef.current = setTimeout(() => setShowPlayIcon(false), 900);
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    if (playIconTimerRef.current) clearTimeout(playIconTimerRef.current);
  }, []);

  return (
    <div className="space-y-4">
      {/* Demo welcome banner */}
      {isDemoActive && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/40 px-4 py-3">
          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 leading-snug">
            🎁 Mode Démo Activé : Vous bénéficiez d'un accès exclusif à 100 % des fonctionnalités de Kompilot pour propulser votre commerce au sommet de l'IA.
          </p>
        </div>
      )}

      {/* Tier badge */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full border text-[10px] font-bold px-2 py-0.5 ${
          tier === 'franchise' ? 'border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-950/20 dark:border-violet-800/40 dark:text-violet-300' :
          tier === 'business'  ? 'border-teal-200 bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:border-teal-800/40 dark:text-teal-300' :
          'border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-800/30 dark:border-slate-700 dark:text-slate-300'
        }`}>
          {tier === 'franchise' ? '🏢 Franchise' : tier === 'business' ? '💼 Business' : '🚀 Starter'}
          {' '}· {duration}s
        </span>
        <span className="text-[10px] text-muted-foreground">{chapters.length} chapitre{chapters.length !== 1 ? 's' : ''} personnalisés</span>
      </div>

      {/* Video player */}
      <div
        className="relative rounded-xl overflow-hidden bg-slate-900 border border-border cursor-pointer select-none"
        style={{ aspectRatio: '16/9' }}
        onClick={togglePause}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
          <span className="text-5xl">{chapters[activeChapter]?.emoji}</span>
          <p className="text-white font-bold text-lg text-center leading-tight">{chapters[activeChapter]?.title}</p>

          {/* Typewriter effect for Cockpit IA chapter */}
          {isCockpitChapter && simulatedProgress > 0 ? (
            <div className="max-w-xs text-center space-y-2">
              {/* Audio wave bars */}
              <div className="flex items-end justify-center gap-0.5 h-6">
                {[3,6,10,7,12,8,5,11,4,9,6,13,7,4,8].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-teal-400"
                    style={{
                      height: `${paused ? 4 : h}px`,
                      transition: 'height 0.15s ease',
                      animationDelay: `${i * 60}ms`,
                    }}
                  />
                ))}
              </div>
              <p className="text-teal-300 text-xs leading-relaxed min-h-[3rem]">
                {typewriterText}<span className="animate-pulse">|</span>
              </p>
            </div>
          ) : (
            <p className="text-slate-300 text-sm text-center leading-relaxed max-w-sm">{chapters[activeChapter]?.desc}</p>
          )}
        </div>

        {/* Initial play overlay */}
        {simulatedProgress === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
              <Play size={28} className="text-slate-900 ml-1" />
            </div>
          </div>
        )}

        {/* Ephemeral play/pause icon on click */}
        {showPlayIcon && simulatedProgress > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center animate-ping" style={{ animationDuration: '0.9s', animationIterationCount: 1 }}>
              {paused
                ? <Play size={24} className="text-white ml-1" />
                : <div className="flex gap-1"><div className="w-1.5 h-6 bg-white rounded-full"/><div className="w-1.5 h-6 bg-white rounded-full"/></div>
              }
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-primary transition-all duration-1000"
            style={{ width: `${simulatedProgress}%` }}
          />
        </div>

        {simulatedProgress > 0 && (
          <div className="absolute top-3 right-3 rounded-full bg-black/60 text-white text-[10px] font-bold px-2 py-0.5">
            {chapters[activeChapter]?.time}
          </div>
        )}
      </div>

      {/* Chapter list — clickable with active state */}
      <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-0.5">
        {chapters.map((ch, i) => {
          const isActive = i === activeChapter && simulatedProgress > 0;
          const isDone = simulatedProgress > 0 && i < activeChapter;
          return (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); jumpToChapter(i); }}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all ${
                isActive
                  ? 'bg-primary/10 border border-primary/30'
                  : 'hover:bg-muted/40 border border-transparent'
              }`}
            >
              <span className={`text-base shrink-0 transition-all ${isActive && ch.title === 'Cockpit IA Vocal' ? 'animate-pulse' : ''}`}>
                {ch.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>{ch.title}</p>
                {isActive && (
                  <div className="flex items-end gap-0.5 mt-0.5 h-2">
                    {[2,4,3,5,3,4,2,5,3,4].map((h, j) => (
                      <div key={j} className="w-0.5 rounded-full bg-primary/60" style={{ height: `${h * 2}px` }} />
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{ch.time}</span>
              {isDone && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
              {isActive && !isDone && <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Locked chapters preview for Starter */}
      {tier === 'starter' && (
        <div className="rounded-xl border border-dashed border-border/60 p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Lock size={9} /> Chapitres débloqués avec Business
          </p>
          <div className="flex flex-wrap gap-1.5">
            {['🤖 Radar GEO', '🎬 Stories IA', '🌐 AIO Sync', '💬 WhatsApp IA', '📅 Génération Masse', '📊 ROAS Detector', '🔐 Équipe RGPD'].map(ch => (
              <span key={ch} className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
                {ch}
              </span>
            ))}
          </div>
          <Link
            to="/subscription"
            search={{ plan: 'pro' } as any}
            className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
          >
            Débloquer avec l'offre Business ✨ <ArrowRight size={10} />
          </Link>
        </div>
      )}

      {/* CTA — smooth progress */}
      <button
        onClick={onComplete}
        disabled={!watched}
        className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
          watched
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg active:scale-[0.98]'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        }`}
      >
        {watched ? (
          "🚀 J'ai tout compris, j'active mon cockpit !"
        ) : (
          <span className="flex items-center gap-2">
            <span
              className="inline-block h-2 rounded-full bg-primary transition-all duration-1000"
              style={{ width: `${Math.max(8, simulatedProgress)}%`, maxWidth: '60%' }}
            />
            <span>Vidéo en cours… ({Math.round(simulatedProgress)}%)</span>
          </span>
        )}
      </button>
      {!watched && simulatedProgress > 0 && (
        <button onClick={onComplete} className="w-full text-xs text-muted-foreground underline hover:text-foreground transition-colors text-center">
          Passer la fin de la vidéo
        </button>
      )}
    </div>
  );
}

// ── Interactive guide path ────────────────────────────────────────────────────

function GuidePath({ onComplete, tier, isDemoActive }: { onComplete: () => void; tier: Tier; isDemoActive: boolean }) {
  // Build filtered steps for this tier
  const visibleSteps = ALL_GUIDE_STEPS.filter(step =>
    !step.tiers || step.tiers.includes(tier)
  );

  const [step, setStep] = useState(0);
  const [confirmed, setConfirmed] = useState<boolean[]>(new Array(visibleSteps.length).fill(false));
  const [skipConfirm, setSkipConfirm] = useState(false);
  const navigate = useNavigate();
  const total = visibleSteps.length;
  const current = visibleSteps[step];

  const markAndNext = () => {
    setConfirmed(prev => { const n = [...prev]; n[step] = true; return n; });
    if (step < total - 1) setStep(s => s + 1);
    else onComplete();
  };

  const handleAction = () => {
    navigate({ to: current.href as any });
  };

  // Locked features (not in this tier's steps)
  const lockedStepNames = ALL_GUIDE_STEPS
    .filter(s => s.tiers && !s.tiers.includes(tier))
    .filter((s, i, arr) => arr.findIndex(x => x.tag === s.tag) === i) // dedupe by tag
    .slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Demo welcome banner */}
      {isDemoActive && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/40 px-4 py-3">
          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 leading-snug">
            🎁 Mode Démo Activé : Vous bénéficiez d'un accès exclusif à 100 % des fonctionnalités de Kompilot pour propulser votre commerce au sommet de l'IA.
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">Étape {step + 1} / {total}</span>
          <button
            onClick={() => setSkipConfirm(true)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <SkipForward size={11} /> Passer le tutoriel
          </button>
        </div>
        <div className="flex gap-1">
          {visibleSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < step ? 'bg-emerald-500' : i === step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Skip confirm */}
      <AnimatePresence>
        {skipConfirm && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40 p-4 space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-extrabold text-amber-800 dark:text-amber-300 leading-snug">
                  Vous risquez de passer à côté de fonctionnalités clés
                </p>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                  Les commerçants qui terminent le guide obtiennent en moyenne <strong>2× plus de résultats</strong> dès le premier mois.
                </p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {[
                { emoji: '🤖', label: 'Scan GEO / GEA — visibilité sur ChatGPT, Gemini, Perplexity' },
                { emoji: '🎙️', label: 'Cockpit Vocal — dicter pour publier sans toucher au clavier' },
                { emoji: '🎬', label: 'Stories IA — Instagram & Facebook verticales 9:16 en 1 clic' },
                { emoji: '🖼️', label: 'Creative Factory — visuels Imagen 4.0 avec preview smartphone' },
                { emoji: '🌐', label: 'AIO Sync — injection Perplexity, ChatGPT, Gemini chaque lundi' },
                { emoji: '📅', label: 'Génération en masse — 1 mois de contenu en 1 clic' },
                { emoji: '📊', label: 'ROAS Detector — vérité publicitaire Meta & Google Ads' },
                { emoji: '💬', label: 'Inbox centralisé — WhatsApp, Instagram, Messenger réunis' },
                { emoji: '💰', label: 'Compteur ROI — mesurer le CA généré par vos posts' },
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                  <span className="text-sm shrink-0">{f.emoji}</span>
                  <span>{f.label}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => setSkipConfirm(false)} className="flex-1 gap-1.5 text-xs h-8">
                Continuer le guide →
              </Button>
              <Button size="sm" variant="outline" onClick={onComplete} className="text-[10px] h-8 gap-1 shrink-0 border-amber-300 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                <SkipForward size={11} /> Ignorer
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className={`rounded-2xl border ${current.border} ${current.bg} p-5 space-y-3`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${current.color} flex items-center justify-center text-xl shrink-0`}>
              {current.emoji}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{current.tag}</p>
              <p className="text-sm font-extrabold text-foreground leading-tight">{current.title}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{current.desc}</p>
          <button
            onClick={handleAction}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {current.actionLabel} <ChevronRight size={13} />
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-2">
        {step > 0 && (
          <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)} className="gap-1.5 h-9">
            <ChevronLeft size={14} /> Précédent
          </Button>
        )}
        <Button onClick={markAndNext} className="flex-1 gap-1.5 h-9">
          {step < total - 1
            ? <><CheckCircle2 size={14} /> Compris, étape suivante <ChevronRight size={14} /></>
            : <><CheckCircle2 size={14} /> J&apos;ai tout vu — Activer mon cockpit 🚀</>
          }
        </Button>
      </div>

      {/* Completed steps */}
      {confirmed.some(Boolean) && (
        <div className="flex flex-wrap gap-1">
          {visibleSteps.map((s, i) => confirmed[i] && (
            <span key={i} className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-full px-2 py-0.5">
              ✓ {s.tag}
            </span>
          ))}
        </div>
      )}

      {/* Locked features teaser for Starter */}
      {tier === 'starter' && lockedStepNames.length > 0 && (
        <div className="rounded-xl border border-dashed border-border/60 p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Lock size={9} /> Fonctionnalités débloquées avec Business
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lockedStepNames.map(s => (
              <span key={s.tag} className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
                {s.emoji} {s.tag}
              </span>
            ))}
          </div>
          <Link
            to="/subscription"
            search={{ plan: 'pro' } as any}
            className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
          >
            Débloquer avec l'offre Business ✨ <ArrowRight size={10} />
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

type Path = 'select' | 'video' | 'guide';

export function ExhaustiveOnboardingModal({ open, onClose }: Props) {
  const [path, setPath] = useState<Path>('select');
  const { tier, isDemoActive } = usePlan();

  // Tier-specific welcome message on the select screen
  const welcomeTitle = isDemoActive
    ? '🎁 Mode Démo — Accès Intégral Activé'
    : tier === 'franchise'
    ? '🏢 Bienvenue sur Kompilot Franchise !'
    : tier === 'business'
    ? '💼 Bienvenue sur Kompilot Business !'
    : '🚀 Bienvenue sur Kompilot !';

  const welcomeSub = isDemoActive
    ? "Vous bénéficiez d'un accès exclusif à 100 % des fonctionnalités pour propulser votre commerce au sommet de l'IA."
    : tier === 'franchise'
    ? 'Votre cockpit marketing multi-établissements est prêt — gérez votre réseau depuis un seul endroit.'
    : tier === 'business'
    ? 'Cockpit IA, Radar GEO, WhatsApp, Calendrier en masse — tout est prêt pour dominer votre marché local.'
    : 'Votre cockpit marketing IA est prêt — Cockpit vocal, Calendrier, Multi-diffusion et ROI Counter vous attendent.';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-violet-500/5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-base">🚀</span>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-foreground">{welcomeTitle}</p>
                    <p className="text-[10px] text-muted-foreground">{welcomeSub}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5">
                {path === 'select' && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed text-center">
                      Pour ne manquer aucune fonctionnalité adaptée à votre offre, choisissez votre guide :
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={() => setPath('video')}
                        className="flex items-start gap-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-primary/4 p-4 text-left transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                          📺
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">Regarder la vidéo intégrale</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                            {tier === 'starter' ? '3 chapitres · 1 min' : tier === 'business' ? '6 chapitres · 2 min' : '7 chapitres · 2 min 30'}
                            {' '}· Tout voir d&apos;un coup
                          </p>
                          <p className="text-[11px] text-primary font-semibold mt-1.5">Meilleur pour les pressés →</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setPath('guide')}
                        className="flex items-start gap-4 rounded-2xl border border-primary/30 bg-primary/4 hover:border-primary/60 hover:bg-primary/8 p-4 text-left transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/30 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                          🎯
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">Découvrir pas à pas</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                            {tier === 'starter' ? '4' : tier === 'business' ? '6' : '7'} étapes interactives · Clic par clic · Accès direct à chaque fonctionnalité
                          </p>
                          <p className="text-[11px] text-primary font-semibold mt-1.5">⭐ Recommandé — maximise votre prise en main →</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {path === 'video' && (
                  <div className="space-y-3">
                    <button onClick={() => setPath('select')} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                      ← Retour
                    </button>
                    <VideoPath onComplete={onClose} tier={tier} isDemoActive={isDemoActive} />
                  </div>
                )}

                {path === 'guide' && (
                  <div className="space-y-3">
                    <button onClick={() => setPath('select')} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                      ← Retour
                    </button>
                    <GuidePath onComplete={onClose} tier={tier} isDemoActive={isDemoActive} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}