/**
 * SectorWalkthroughEngine — Guide interactif "clic-par-clic" adapté au secteur.
 * Affiche les étapes de walkthrough spécifiques au profil maître de l'utilisateur.
 * Inclut un pop-up de bienvenue premium "Moteur de CA" (localStorage-persisted).
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, CheckCircle2, Compass, Zap, Bell, Sparkles } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { useUserProfile } from '../../context/UserProfileContext';
import { getMasterProfileConfig } from '../../lib/sectorProfiles';
import type { WalkthroughStep } from '../../lib/sectorProfiles';
import { ClickByClickGuide } from './ClickByClickGuide';

const WELCOME_POPUP_KEY = 'kompilot_welcome_popup_shown';

// ── Étape Creative Factory IA ─────────────────────────────────────────────────
const CREATIVE_FACTORY_STEP: WalkthroughStep = {
  title: 'Générez votre premier visuel avec Imagen 4.0',
  content:
    'Dans Creative Factory IA → sélectionnez votre style visuel (flatlay, studio, modern ou vintage) → rédigez un prompt décrivant votre ambiance → cliquez "Générer". Prévisualisez en temps réel sur Google Maps, Instagram Feed ou en Story 9:16. Copiez le texte IA généré et planifiez en 1 clic.',
  action: 'Ouvrir Creative Factory → Générer un visuel → Basculer Story 9:16',
  icon: 'Compass',
};

// ── Étape Stories IA ──────────────────────────────────────────────────────────
const STORIES_STEP: WalkthroughStep = {
  title: 'Publiez votre première Story Instagram & Facebook',
  content:
    'Dans Creative Factory IA → cliquez "Story 9:16" (bouton violet) → choisissez entre Story Instagram (swipe-up + barre de progression) ou Story Facebook (poll J\'aime/M\'alerter + boost Ads). L\'IA génère le visuel plein écran avec sticker CTA et votre filigrane de marque blanche. Publication simultanée sur les deux plateformes en 1 clic.',
  action: 'Creative Factory → Format Story 9:16 → Sélectionner Instagram ou Facebook → Publier',
  icon: 'Zap',
};

// ── Étape AIO Sync ────────────────────────────────────────────────────────────
const AIO_SYNC_STEP: WalkthroughStep = {
  title: 'Activez l\'AIO Sync — Perplexity & ChatGPT',
  content:
    'Dans AIO Sync, configurez vos 12 mots-clés locaux prioritaires (ex: "meilleur coiffeur Lyon", "salon beauté Paris 11"). Chaque lundi à 9h, Kompilot injecte automatiquement ces termes dans les contextes sémantiques de ChatGPT, Perplexity et Gemini. Votre établissement apparaît dans les réponses conversationnelles sans aucune action manuelle.',
  action: 'Ouvrir AIO → Configurer mes 12 mots-clés → Activer le Sync hebdomadaire',
  icon: 'Compass',
};

// ── Étape ROAS Detector ───────────────────────────────────────────────────────
const ROAS_DETECTOR_STEP: WalkthroughStep = {
  title: 'Lancez votre premier audit ROAS',
  content:
    'Dans ROAS Detector → entrez votre budget pub mensuel et votre ROAS cible → cliquez "Analyser". L\'IA audite vos campagnes Meta et Google Ads, identifie les audiences saturées, les créatifs sous-performants et les enchères mal calibrées. Résultat : un plan d\'action priorisé pour réduire le gaspillage pub de 20 à 40% dès le premier mois.',
  action: 'Ouvrir ROAS Detector → Saisir budget → Analyser → Appliquer les recommandations IA',
  icon: 'Zap',
};

// ── Étape finale universelle : notifications push ────────────────────────────
const NOTIFICATION_STEP: WalkthroughStep = {
  title: 'Activez votre radar de trésorerie',
  content:
    'Autorisez Kompilot à vous alerter dès qu\'une opportunité de chiffre d\'affaires est détectée sur votre zone. Aucune notification publicitaire — uniquement des alertes financières concrètes.',
  action: 'Autoriser les alertes de trésorerie',
  icon: 'Bell',
};

// ── Étape découverte Kompilot Index ────────────────────────────────────────
const INDEX_DISCOVERY_STEP: WalkthroughStep = {
  title: 'Activez les leviers manquants — Kompilot Index',
  content:
    'L\'onglet Croissance affiche votre Kompilot Index : un score de performance comparé à la médiane anonymisée de votre secteur et zone. Si un levier (no-show, DMs, avis) est sous la moyenne, le Mentor IA formule UNE question maïeutique pour activer le levier prioritaire. Vos données financières ne sont jamais partagées — données 100% chiffrées et anonymisées.',
  action: 'Ouvrir Croissance > Kompilot Index → Cliquer "Activer maintenant"',
  icon: 'Compass',
};

// ── Étape A/B Testing Engine ──────────────────────────────────────────────────
const AB_TEST_STEP: WalkthroughStep = {
  title: 'Lancez votre premier test A/B en 2 minutes',
  content:
    'Dans Croissance > Test A/B, créez 2 variantes de message ou coupon. Kompilot diffuse chaque variante à 50% de votre audience et déclare le gagnant automatiquement dès +15% de conversion. Mesure sur CA réel, pas uniquement sur les clics.',
  action: 'Ouvrir Croissance > Test A/B',
  icon: 'Zap',
};

// ── Étape Brand Book IA ───────────────────────────────────────────────────────
const BRAND_BOOK_STEP: WalkthroughStep = {
  title: 'Configurez votre Brand Book IA',
  content:
    'Dans Brand Shield, définissez le ton de voix de votre marque, les mots interdits et votre promesse de marque. L\'IA intégrera ces règles dans tous les contenus générés pour vous. Un aperçu de charte se génère en temps réel.',
  action: 'Ouvrir Brand Shield > Brand Book IA',
  icon: 'Compass',
};

// ── Étape Agency PR Kit (visible pour tous — inspire la revente) ──────────────
const AGENCY_PR_STEP: WalkthroughStep = {
  title: 'Générez votre premier post B2B en 1 clic',
  content:
    'Dans Tableau de bord Agence > Kit PR & Vente, sélectionnez le secteur de votre prochain client et copiez un script de prospection haute conversion. Ou appuyez sur "Variante IA" pour obtenir un contenu personnalisé avec les métriques sectorielles réelles. Idéal pour alimenter vos newsletters et démarchages LinkedIn.',
  action: 'Ouvrir Tableau de bord Agence > Kit PR & Vente',
  icon: 'Zap',
};

// ── Étape finale : Guardrail Queue — visa humain ───────────────────────────────
const GUARDRAIL_QUEUE_STEP: WalkthroughStep = {
  title: 'Validez votre première action IA en 1 clic',
  content:
    'Kompilot génère automatiquement des réponses de crise, des campagnes CRM et des posts anti-vide. Avant toute diffusion, ces actions sont placées dans votre File d\'attente de visa ⚡. Appuyez sur le bouton "Actions en attente" (en bas à droite) et approuvez votre première campagne de croissance en un seul clic.',
  action: 'Ouvrir ⚡ Actions en attente > Appuyer sur Approuver',
  icon: 'Zap',
};

// ── Pop-up de bienvenue premium ───────────────────────────────────────────────
function WelcomePopup({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md rounded-2xl bg-[#0F172A] border border-amber-500/30 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-7 pt-8 pb-0 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
            <Zap className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Bienvenue dans Kompilot.
          </h2>
          <p className="text-sm text-slate-400 mt-2 mb-6">
            Avant de commencer, retenez ceci :
          </p>
        </div>

        {/* Accent block */}
        <div className="mx-7 rounded-xl bg-amber-500/8 border border-amber-500/25 px-5 py-4 mb-6">
          <p className="text-sm text-amber-200 leading-relaxed font-medium text-center">
            Kompilot n'est pas un outil de visibilité passive.
            <br />
            <span className="text-amber-300 font-bold">
              C'est un moteur de génération de chiffre d'affaires.
            </span>
          </p>
        </div>

        {/* 3 checkmarks */}
        <div className="mx-7 mb-7 space-y-3">
          {[
            'Chaque coupon validé est tracé en euros',
            'Chaque no-show bloqué reste dans votre trésorerie',
            'Chaque relance IA est mesurée en résultat réel',
          ].map((line, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-sm text-slate-300">{line}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-7 pb-7">
          <button
            onClick={onContinue}
            className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[.98] text-black font-bold text-sm rounded-xl py-3.5 px-4 transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,.35)]"
          >
            Déployer mon moteur de croissance
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
}

export function SectorWalkthroughEngine({ open, onClose }: Props) {
  const { masterProfile } = useUserProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showWelcome, setShowWelcome] = useState(false);
  const [showInteractiveGuide, setShowInteractiveGuide] = useState(false);

  const config = getMasterProfileConfig(masterProfile);
  const baseSteps: WalkthroughStep[] = config?.walkthroughSteps ?? [];
  // Append universal notification step + index discovery step to every profile
  const steps: WalkthroughStep[] = [
    ...baseSteps,
    CREATIVE_FACTORY_STEP,
    STORIES_STEP,
    AIO_SYNC_STEP,
    ROAS_DETECTOR_STEP,
    NOTIFICATION_STEP,
    INDEX_DISCOVERY_STEP,
    AB_TEST_STEP,
    BRAND_BOOK_STEP,
    AGENCY_PR_STEP,
    GUARDRAIL_QUEUE_STEP,
  ];

  // Check welcome popup on open
  useEffect(() => {
    if (open) {
      const alreadyShown = localStorage.getItem(WELCOME_POPUP_KEY);
      if (!alreadyShown) {
        setShowWelcome(true);
      }
    }
  }, [open]);

  if (!open || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleWelcomeContinue = () => {
    localStorage.setItem(WELCOME_POPUP_KEY, '1');
    setShowWelcome(false);
  };

  const handleNext = async () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));

    // Handle notification step action
    if (step.icon === 'Bell' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch (_) {
          // permission request failed silently
        }
      }
    }

    if (isLast) {
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  // Resolve icon for step
  const StepIcon = step.icon === 'Bell' ? Bell : step.icon === 'Zap' ? Zap : Compass;

  return (
    <>
      {/* Welcome popup */}
      <AnimatePresence>
        {showWelcome && <WelcomePopup onContinue={handleWelcomeContinue} />}
      </AnimatePresence>

      {/* Interactive guide (ClickByClickGuide) */}
      {showInteractiveGuide && (
        <ClickByClickGuide
          open={true}
          onClose={() => setShowInteractiveGuide(false)}
          profileMode="auto"
        />
      )}

      {/* Walkthrough panel */}
      <div className="fixed bottom-6 right-6 z-50 w-80">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="rounded-2xl bg-[#0F172A] border border-amber-500/30 text-white shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center">
                <StepIcon className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Guide {config?.label ?? 'Kompilot'}</p>
                <p className="text-[10px] text-slate-500">Étape {currentStep + 1} / {steps.length}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
              <X className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-slate-800 mx-4">
            <motion.div
              className="h-full bg-amber-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -10, opacity: 0 }}
              className="p-4 space-y-3"
            >
              <div>
                <h3 className="font-bold text-sm leading-tight">{step.title}</h3>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{step.content}</p>
              </div>

              {step.action && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                  <p className="text-amber-300 text-xs font-medium">→ {step.action}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 px-4 pb-3">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep ? 'w-4 bg-amber-500' : completedSteps.has(i) ? 'w-1.5 bg-amber-500/50' : 'w-1.5 bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-2 px-4 pb-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrev} className="flex-1 h-9 text-xs border-slate-700 text-slate-400 hover:text-white">
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Précédent
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={`flex-1 h-9 text-xs font-bold ${isLast ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-800 hover:bg-slate-700'}`}
            >
              {isLast ? (
                <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Terminé</>
              ) : (
                <>Suivant <ChevronRight className="h-3.5 w-3.5 ml-1" /></>
              )}
            </Button>
          </div>

          {/* Interactive mode button */}
          <div className="px-4 pb-4">
            <button
              onClick={() => setShowInteractiveGuide(true)}
              className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-amber-500/70 hover:text-amber-400 transition-colors py-1"
            >
              <Sparkles size={10} />
              Passer en mode interactif Pro/Agence
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
