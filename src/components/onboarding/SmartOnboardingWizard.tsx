/**
 * SmartOnboardingWizard — Questionnaire d'inscription en 3 étapes.
 * Étape 2 étendue : 12 secteurs granulaires mappés aux 4 profils maîtres.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Checkbox } from '@blinkdotnew/ui';
import { Check, User, Users, Building, Globe, Target, ShieldAlert, BadgeDollarSign, Bell, BellOff, Sparkles, TrendingUp, Palette } from 'lucide-react';
import { useUserProfile, type SmartProfileType, type CommerceSector, type PrimaryObjective } from '../../context/UserProfileContext';
import type { GranularSector } from '../../lib/sectorProfiles';
import { COMMERCE_SECTORS } from '../../lib/sectors/profiles';
import { SectorVideoPlayer } from './SectorVideoPlayer';
import { SECTOR_TO_MASTER_PROFILE } from '../../lib/sectorProfiles';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';
import { URLSnapshotWidget } from './URLSnapshotWidget';
import type { SnapshotData } from '../../hooks/useURLSnapshot';
import { StepAPIConnectors } from './steps/StepAPIConnectors';
import { StepAgencyROI } from './steps/StepAgencyROI';
import { StepAgencyWhiteLabel } from './steps/StepAgencyWhiteLabel';
import { StepAgencyClients } from './steps/StepAgencyClients';
import { StepProStripe } from './steps/StepProStripe';
import { StepProGEO } from './steps/StepProGEO';
import { AgencyOnboardingFlow as AgencyOnboardingFlowWrapper } from './AgencyOnboardingFlow';
import { ProOnboardingFlow } from './ProOnboardingFlow';
import { mapOnboardingSectorToConnectorKey, ONBOARDING_SECTOR_OPTIONS } from '../../lib/sectors/connectors';

interface Props {
  open: boolean;
  onComplete: () => void;
}

export function SmartOnboardingWizard({ open, onComplete }: Props) {
  const { setSmartProfile, markOnboardingCompleted } = useUserProfile();
  const { user } = useAuth();
  const [step, setStep] = useState(0); // 0=URL, 1=welcome, 2=profil, 3a/3b=sector/agency, 35=API connectors, 4=objectif, 5=notifs
  const [urlSnapshotData, setUrlSnapshotData] = useState<SnapshotData | null>(null);
  const [smartProfileType, setSmartProfileType] = useState<SmartProfileType>(null);
  const [granularSector, setGranularSector] = useState<GranularSector | null>(null);
  const [clientCount, setClientCount] = useState<number | null>(null);
  const [objective, setObjective] = useState<PrimaryObjective>(null);
  const [followLocalEvents, setFollowLocalEvents] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);

  if (!open) return null;

  // Mapping granulaire → legacy (rétro-compatibilité)
  const legacySector: CommerceSector = (() => {
    if (!granularSector) return null;
    if (['restauration', 'beaute'].includes(granularSector)) return granularSector as CommerceSector;
    if (['retail', 'ecommerce', 'autre'].includes(granularSector)) return 'retail';
    return 'autre';
  })();

  const masterProfile = granularSector ? SECTOR_TO_MASTER_PROFILE[granularSector] : null;

  const handleSnapshot = (data: SnapshotData) => {
    setUrlSnapshotData(data);
    if (data.sector) {
      setGranularSector(data.sector as GranularSector);
    }
    setStep(1);
  };

  const handleSnapshotSkip = () => {
    setStep(1);
  };

  const handleRequestNotifications = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotifGranted(permission === 'granted');
      } catch {
        setNotifGranted(false);
      }
    } else {
      setNotifGranted(false);
    }
  };

  const handleFinalComplete = async () => {
    if (!smartProfileType || !objective) return;
    setSmartProfile({ smartProfileType, sector: legacySector, granularSector, clientCount, objective, followLocalEvents });
    markOnboardingCompleted();
    if (user?.id) {
      try {
        await blink.db.onboardingProfiles.upsert({
          id: user.id,
          userId: user.id,
          sector: legacySector || granularSector || 'autre',
          objective: objective || 'geo',
        });
      } catch (e) {
        console.error('[onboarding] DB persist failed', e);
      }
    }
    setShowVideo(true);
  };

  const handleVideoClose = () => {
    setShowVideo(false);
    onComplete();
  };

  const handleSkip = () => {
    markOnboardingCompleted();
    onComplete();
  };

  if (showVideo && masterProfile) {
    return <SectorVideoPlayer masterProfile={masterProfile} onClose={handleVideoClose} />;
  }

  // Compute connector key from granular sector
  const connectorKey = mapOnboardingSectorToConnectorKey(granularSector ?? 'autre');

  // ── Step 0 : URL Snapshot ──────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#0F172A] shadow-2xl"
          style={{ border: '1px solid rgba(20,184,166,0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}
        >
          {/* Header dots */}
          <div className="flex items-center justify-between p-6 pb-2">
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((s) => (
                <div key={s} className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  s === step ? 'bg-teal-500' : s < step ? 'bg-teal-500/50' : 'bg-slate-700'
                }`} />
              ))}
            </div>
            <button onClick={handleSkip} className="text-xs font-medium text-slate-500 hover:text-white transition-colors">
              Passer
            </button>
          </div>

          <div className="p-8 pt-4 space-y-6">
            <div className="space-y-3 text-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                ✦ NOUVEAU — Import automatique par URL
              </div>
              <h2 className="text-2xl font-black leading-tight">
                Importez votre activité en 30 secondes
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed px-4">
                L'IA analyse votre site ou fiche Google et pré-configure tout votre espace — sans saisie manuelle.
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/8">
              <URLSnapshotWidget onSnapshot={handleSnapshot} onSkip={handleSnapshotSkip} />
            </div>

            <p className="text-[10px] text-center text-slate-500">
              Étape 1 sur 7 — Vous pourrez modifier ces informations par la suite.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Step 1 : Welcome / Mission Statement ──────────────────────────────────
  if (step === 1) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#0F172A] text-white shadow-2xl"
          style={{ border: '1px solid rgba(212,175,55,0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.08)' }}
        >
          {/* Gold top accent */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

          <div className="p-8 text-center space-y-6">
            {/* Logo badge */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 flex items-center justify-center">
                <span className="text-3xl">💰</span>
              </div>
              <p className="text-[10px] text-[#D4AF37] uppercase tracking-[0.3em] font-black">Kompilot</p>
            </div>

            {/* Main message */}
            <div className="space-y-3">
              <h2 className="text-2xl font-black leading-tight text-white">
                Bienvenue.
              </h2>
              <p className="text-base font-bold leading-relaxed text-slate-200">
                Kompilot n'est pas un outil de visibilité passive.
              </p>
              <p className="text-base font-black leading-relaxed text-[#D4AF37]">
                C'est un moteur de génération de chiffre d'affaires.
              </p>
            </div>

            {/* ── Sector dropdown (new!) ── */}
            <div className="text-left space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Sélectionnez votre secteur d'activité
              </label>
              <select
                value={granularSector ?? ''}
                onChange={e => setGranularSector(e.target.value as GranularSector || null)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 focus:outline-none focus:border-teal-500 transition-colors cursor-pointer appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
              >
                <option value="">— Choisissez votre secteur —</option>
                {ONBOARDING_SECTOR_OPTIONS.map(opt => (
                  <option key={opt.key} value={opt.key === 'beaute' ? 'beaute' : opt.key === 'medical' ? 'medical' : opt.key === 'restauration' ? 'restauration' : opt.key === 'hotellerie' ? 'conciergerie' : opt.key === 'automobile' ? 'artisan' : 'autre'}>
                    {opt.emoji} {opt.label}
                  </option>
                ))}
              </select>
              {granularSector && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] text-teal-400 font-semibold"
                >
                  ✓ Interface adaptée au secteur <strong>{ONBOARDING_SECTOR_OPTIONS.find(o => ['beaute','medical','restauration','conciergerie','artisan','autre'].includes(o.key) || o.key === granularSector)?.label ?? granularSector}</strong>
                </motion.p>
              )}
            </div>

            {/* Value proposition */}
            <div className="rounded-2xl bg-white/5 border border-white/8 p-4 space-y-2 text-left">
              {[
                { icon: '🛡️', text: 'Chaque no-show bloqué = euros récupérés sur-le-champ' },
                { icon: '🎟️', text: 'Chaque coupon validé = trésorerie augmentée en direct' },
                { icon: '🤖', text: 'Chaque relance IA = devis signé sans effort humain' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm shrink-0">{item.icon}</span>
                  <p className="text-xs text-slate-300 leading-snug">{item.text}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full py-5 text-base font-black bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 transition-all"
            >
              Activer mon moteur de croissance →
            </Button>

            <button onClick={handleSkip} className="text-xs text-slate-500 hover:text-slate-400 transition-colors">
              Passer la configuration
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Step 36 : Agency Flow (Pro enrichi agence) ───────────────────────────
  if (step === 36) {
    return (
      <AgencyOnboardingFlowWrapper
        onComplete={handleFinalComplete}
        onSkip={handleSkip}
      />
    );
  }

  // ── Step 37 : Pro Flow (commerçants) ─────────────────────────────────────
  if (step === 37) {
    return (
      <ProOnboardingFlow
        sector={granularSector ?? undefined}
        onComplete={handleFinalComplete}
        onSkip={() => setStep(4)}
      />
    );
  }

  // ── Step 35 : API Connectors (after sector selection) ────────────────────
  if (step === 35) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#0F172A] text-white shadow-2xl"
          style={{ border: '1px solid rgba(13,148,136,0.25)' }}
        >
          <div className="flex items-center justify-between p-6 pb-2">
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((s) => (
                <div key={s} className={`h-2 w-2 rounded-full transition-colors ${
                  s === 3 ? 'bg-teal-500' : s < 4 ? 'bg-teal-500/50' : 'bg-slate-700'
                }`} />
              ))}
            </div>
            <button onClick={() => setStep(smartProfileType === 'commerce' ? 37 : 4)} className="text-xs font-medium text-slate-400 hover:text-white transition-colors">
              Passer
            </button>
          </div>

          <div className="p-6 pt-3">
            <div className="mb-5 text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black uppercase tracking-wider mb-2">
                Étape 4 sur 7 — Connexion des canaux
              </div>
              <h2 className="text-xl font-black leading-tight">
                Connectez vos plateformes sectorielles
              </h2>
              <p className="text-sm text-slate-400">
                Centralisez vos avis et messages depuis vos outils métier.
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-5 border border-white/8">
              <StepAPIConnectors
                sectorKey={connectorKey}
                onComplete={() => setStep(smartProfileType === 'commerce' ? 37 : 4)}
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Step 5 : Notifications permission ────────────────────────────────────
  if (step === 5) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#0F172A] text-white shadow-2xl"
          style={{ border: '1px solid rgba(13,148,136,0.25)' }}
        >
          <div className="p-7 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto">
                <Bell className="h-7 w-7 text-teal-400" />
              </div>
              <h2 className="text-xl font-black leading-tight">
                Une dernière étape pour sécuriser votre chiffre d'affaires
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Autorisez Kompilot à vous alerter dès qu'une opportunité de chiffre d'affaires est détectée sur votre zone.
              </p>
            </div>

            {/* Alert types */}
            <div className="space-y-2">
              {[
                { icon: '⚠️', title: 'Alerte No-Show', desc: 'Empreinte Stripe manquante sur un RDV imminent' },
                { icon: '📋', title: 'Relance CRM', desc: 'Note client arrivant à échéance de suivi' },
                { icon: '✅', title: 'Lead Social', desc: 'Coordonnée capturée via Comment-to-DM' },
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

            <p className="text-[10px] text-slate-500 text-center">
              Aucune notification publicitaire. Uniquement des alertes à valeur financière directe.
            </p>

            {notifGranted === null ? (
              <div className="space-y-2">
                <Button
                  onClick={async () => { await handleRequestNotifications(); setTimeout(handleFinalComplete, 600); }}
                  className="w-full py-5 text-base font-black bg-teal-600 hover:bg-teal-500"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Activer les alertes financières
                </Button>
                <button
                  onClick={handleFinalComplete}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-400 transition-colors py-2"
                >
                  Pas maintenant — je les activerai plus tard dans Paramètres
                </button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${notifGranted ? 'bg-teal-500/15 text-teal-400' : 'bg-slate-700/50 text-slate-400'}`}>
                  {notifGranted ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  {notifGranted ? 'Alertes financières activées ✓' : 'Vous pourrez les activer depuis Paramètres'}
                </div>
                <Button onClick={handleFinalComplete} className="w-full py-5 text-base font-black bg-teal-600 hover:bg-teal-500">
                  Déployer mon moteur de croissance 🚀
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#0F172A] text-white shadow-2xl">
        {/* Header dots */}
        <div className="flex items-center justify-between p-6 pb-2">
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((s) => (
              <div key={s} className={`h-2 w-2 rounded-full transition-colors ${
                s === step ? 'bg-teal-500' : s < step ? 'bg-teal-500/50' : 'bg-slate-700'
              }`} />
            ))}
          </div>
          <button onClick={handleSkip} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Passer
          </button>
        </div>

        <div className="p-6 pt-2">
          <AnimatePresence mode="wait">
            {/* ── Étape 2 : Profil ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold">Quel est votre profil ?</h2>
                  <p className="mt-2 text-slate-400 text-sm">Sélectionnez l'option qui vous correspond le mieux.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    { type: 'commerce' as SmartProfileType, emoji: '🏪', title: 'Je suis un commerçant', sub: 'Restaurant, Salon, Boutique, Artisan, Conseil...' },
                    { type: 'agency' as SmartProfileType, emoji: '🏢', title: 'Je suis une agence', sub: 'Gestion multi-clients, marque blanche' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => { setSmartProfileType(item.type); setTimeout(() => setStep(3), 300); }}
                      className={`flex flex-col items-center gap-4 rounded-2xl border-2 p-6 text-center transition-all ${
                        smartProfileType === item.type ? 'border-teal-500 bg-teal-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className={`rounded-full p-4 ${smartProfileType === item.type ? 'bg-teal-500' : 'bg-slate-800'}`}>
                        <span className="text-2xl">{item.emoji}</span>
                      </div>
                      <div>
                        <div className="font-bold">{item.title}</div>
                        <div className="mt-1 text-xs text-slate-400 leading-tight">{item.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Étape 3a : Secteur (commerce) ── */}
            {step === 3 && smartProfileType === 'commerce' && (
              <motion.div key="step3a" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-4">
                <div className="text-center">
                  <h2 className="text-2xl font-bold">Quel est votre secteur ?</h2>
                  <p className="mt-2 text-slate-400 text-sm">Kompilot adapte son Intelligence Locale à votre métier.</p>
                </div>

                {/* Quick-select dropdown (NEW) */}
                <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 space-y-2">
                  <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">🎯 Sélection rapide</p>
                  <select
                    value={granularSector ?? ''}
                    onChange={e => {
                      if (e.target.value) {
                        setGranularSector(e.target.value as GranularSector);
                        setTimeout(() => setStep(35), 300);
                      }
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 text-white text-sm font-semibold px-3 py-2.5 focus:outline-none focus:border-teal-500 transition-colors cursor-pointer"
                  >
                    <option value="">— Sélectionnez votre secteur d'activité —</option>
                    {ONBOARDING_SECTOR_OPTIONS.map(opt => (
                      <option key={opt.key} value={
                        opt.key === 'beaute' ? 'beaute'
                        : opt.key === 'medical' ? 'medical'
                        : opt.key === 'restauration' ? 'restauration'
                        : opt.key === 'hotellerie' ? 'conciergerie'
                        : opt.key === 'automobile' ? 'artisan'
                        : 'autre'
                      }>
                        {opt.emoji} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-[10px] text-slate-500 text-center">— ou choisissez parmi tous les secteurs —</p>

                <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                  {COMMERCE_SECTORS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setGranularSector(item.id); setTimeout(() => setStep(35), 300); }}
                      className={`flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-all ${
                        granularSector === item.id ? 'border-teal-500 bg-teal-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xl">{item.emoji}</span>
                      <div>
                        <div className="font-semibold text-sm">{item.label}</div>
                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{item.description}</div>
                      </div>
                      {granularSector === item.id && <Check className="h-4 w-4 text-teal-500 ml-auto" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Étape 3b : Taille (agence) ── */}
            {step === 3 && smartProfileType === 'agency' && (
              <motion.div key="step3b" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold">Combien de clients gérez-vous ?</h2>
                  <p className="mt-2 text-slate-400 text-sm">Pour adapter nos outils de gestion multi-comptes.</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: '👤 Moins de 5 clients', count: 3, icon: User },
                    { label: '👥 5 à 10 clients', count: 7, icon: Users },
                    { label: '🏢 10 à 30 clients', count: 20, icon: Building },
                    { label: '🌐 Plus de 30 clients', count: 35, icon: Globe },
                  ].map((item) => (
                    <button
                      key={item.count}
                      onClick={() => { setClientCount(item.count); setTimeout(() => setStep(36), 300); }}
                      className={`flex items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                        clientCount === item.count ? 'border-teal-500 bg-teal-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 ${clientCount === item.count ? 'text-teal-500' : 'text-slate-400'}`} />
                      <span className="font-medium">{item.label}</span>
                      {clientCount === item.count && <Check className="ml-auto h-5 w-5 text-teal-500" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Étape 4 : Objectif + suivi événements ── */}
            {step === 4 && (
              <motion.div key="step4" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-5">
                <div className="text-center">
                  <h2 className="text-2xl font-bold">Quelle est votre priorité de croissance ?</h2>
                  <p className="mt-2 text-slate-400 text-sm">Votre moteur sera calibré sur cet objectif dès le premier jour.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'geo', title: '🔍 Capter les clients qui cherchent mes services sur l\'IA', sub: 'Score G.E.O. — ChatGPT, Google, Perplexity', icon: Target },
                    { id: 'no_show', title: '🛡️ Éliminer les no-shows et sécuriser ma trésorerie', sub: 'Bouclier Stripe — empreinte de garantie', icon: ShieldAlert },
                    { id: 'resell', title: '💰 Déployer cette solution chez mes clients', sub: 'Mode Agence — marque blanche & multi-comptes', icon: BadgeDollarSign },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setObjective(item.id as PrimaryObjective)}
                      className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                        objective === item.id ? 'border-teal-500 bg-teal-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className={`rounded-lg p-2 ${objective === item.id ? 'bg-teal-500' : 'bg-slate-800'}`}>
                        <item.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-sm leading-tight">{item.title}</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">{item.sub}</div>
                      </div>
                      {objective === item.id && <Check className="ml-auto h-5 w-5 text-teal-500" />}
                    </button>
                  ))}
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-slate-900/50 p-4">
                  <Checkbox
                    id="events"
                    checked={followLocalEvents}
                    onCheckedChange={(v) => setFollowLocalEvents(!!v)}
                    className="mt-1 border-slate-600 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                  />
                  <label htmlFor="events" className="text-xs leading-relaxed text-slate-400 cursor-pointer">
                    🎉 Je souhaite que le Copilote suive les événements locaux (Sport, Concerts, Marchés) pour animer mon commerce.
                  </label>
                </div>

                <Button
                  onClick={() => { if (objective) setStep(5); }}
                  disabled={!objective}
                  className="w-full bg-teal-600 py-6 text-base font-bold hover:bg-teal-500 transition-colors"
                >
                  Continuer → Activer les alertes financières
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
