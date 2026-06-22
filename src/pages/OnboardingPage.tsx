import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { blink } from '../blink/client';
import { useAuth } from '../hooks/useAuth';
import { PROFILE_CACHE_KEY } from '../hooks/useOnboardingProfile';
import { useUserProfile } from '../context/UserProfileContext';
import { useWelcomeEmailSequence } from '../hooks/useWelcomeEmailSequence';
import { Building2, MapPin, Hash, Sparkles, Shield, TrendingUp } from 'lucide-react';
import { TOUR_PENDING_KEY } from '../context/GuidedTourContext';
import { track } from '../lib/tracking';
import { SectorConnectorsPanel } from '../components/onboarding/SectorConnectorsPanel';
// MODULE 1: Sector selector
import { SectorSelectorModal, useSector, type Sector } from '../components/onboarding/SectorSelectorModal';
// MODULE 2: Competitor wizard
import { CompetitorOnboardingWizard } from '../components/onboarding/CompetitorOnboardingWizard';
import { ProAgencyOnboardingBanner } from '../components/onboarding/ProAgencyOnboardingBanner';
import { BACKEND_URL } from '../config/api';
import { KompilotLogo } from '../components/brand/KompilotLogo';

// ── Data ──────────────────────────────────────────────────────────────────────

const SECTORS = [
  // ── Flux / Rendez-vous ──
  { id: 'restauration',  label: 'Restauration',           emoji: '🍽️' },
  { id: 'hotellerie',    label: 'Hôtellerie',             emoji: '🏨' },
  { id: 'beaute',        label: 'Beauté',                 emoji: '💇' },
  { id: 'bienetre',      label: 'Bien-être & Spa',        emoji: '🧘' },
  { id: 'medical',       label: 'Santé / Médical',        emoji: '🩺' },
  { id: 'sport',         label: 'Sport & Fitness',        emoji: '🏋️' },
  // ── Commerce / Retail ──
  { id: 'retail',        label: 'Retail / Boutique',      emoji: '🛍️' },
  { id: 'commerce',      label: 'Commerce de proximité',  emoji: '🏪' },
  { id: 'alimentation',  label: 'Alimentation / Épicerie',emoji: '🛒' },
  { id: 'ecommerce',     label: 'E-commerce local',       emoji: '📦' },
  // ── B2B / Services ──
  { id: 'assurance',     label: 'Assurance / Finance',    emoji: '🛡️' },
  { id: 'immobilier',    label: 'Immobilier',             emoji: '🏠' },
  { id: 'conseil',       label: 'Conseil & Coaching',     emoji: '💼' },
  { id: 'juridique',     label: 'Juridique / Notariat',   emoji: '⚖️' },
  { id: 'tech',          label: 'Tech & SaaS',            emoji: '💻' },
  // ── Artisanat / Chantier ──
  { id: 'batiment',      label: 'Bâtiment / BTP',         emoji: '🏗️' },
  { id: 'artisan',       label: 'Artisan',                emoji: '🔨' },
  { id: 'conciergerie',  label: 'Conciergerie / Airbnb',  emoji: '🏡' },
  { id: 'automobile',    label: 'Automobile / Garage',    emoji: '🚗' },
  // ── Autres ──
  { id: 'education',     label: 'Éducation / Formation',  emoji: '📚' },
  { id: 'evenementiel',  label: 'Événementiel',           emoji: '🎉' },
  { id: 'autre',         label: 'Autre secteur',          emoji: '✨' },
];

const OBJECTIVES = [
  { id: 'time',        label: 'Gagner du temps',              emoji: '⏱️', hint: 'Automatisez vos publications & tâches',  color: 'indigo'  },
  { id: 'ideas',       label: 'Créer du contenu avec l\'IA',  emoji: '💡', hint: 'Générez des posts et visuels en un clic', color: 'violet'  },
  { id: 'reviews',     label: 'Gérer mes avis clients',        emoji: '⭐', hint: 'Centralisez et répondez aux avis Google', color: 'amber'   },
  { id: 'visibility',  label: 'Développer ma visibilité',      emoji: '📈', hint: 'Gagnez en portée locale et digitale',     color: 'emerald' },
  { id: 'social',      label: 'Gérer mes réseaux sociaux',     emoji: '📱', hint: 'Planifiez sur Instagram, Facebook, GMB',  color: 'sky'     },
  { id: 'messages',    label: 'Automatiser mes messages',      emoji: '💬', hint: 'SMS, email et WhatsApp automatiques',     color: 'teal'    },
  { id: 'analytics',   label: 'Analyser mes performances',     emoji: '📊', hint: 'Suivez vos KPIs et ROI en temps réel',   color: 'rose'    },
  { id: 'clients',     label: 'Attirer de nouveaux clients',   emoji: '🎯', hint: 'Campagnes ciblées et prospection locale', color: 'orange'  },
];

const COLOR_MAP: Record<string, { border: string; bg: string; label: string; hint: string; badge: string }> = {
  indigo:  { border: 'border-indigo-400',  bg: 'bg-indigo-50 dark:bg-indigo-950/40',  label: 'text-indigo-700 dark:text-indigo-300',  hint: 'text-indigo-500',  badge: 'bg-indigo-400'  },
  violet:  { border: 'border-violet-400',  bg: 'bg-violet-50 dark:bg-violet-950/40',  label: 'text-violet-700 dark:text-violet-300',  hint: 'text-violet-500',  badge: 'bg-violet-400'  },
  amber:   { border: 'border-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/40',    label: 'text-amber-700 dark:text-amber-300',    hint: 'text-amber-500',   badge: 'bg-amber-400'   },
  emerald: { border: 'border-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40',label: 'text-emerald-700 dark:text-emerald-300',hint: 'text-emerald-500', badge: 'bg-emerald-400' },
  sky:     { border: 'border-sky-400',     bg: 'bg-sky-50 dark:bg-sky-950/40',        label: 'text-sky-700 dark:text-sky-300',        hint: 'text-sky-500',     badge: 'bg-sky-400'     },
  teal:    { border: 'border-teal-400',    bg: 'bg-teal-50 dark:bg-teal-950/40',      label: 'text-teal-700 dark:text-teal-300',      hint: 'text-teal-500',    badge: 'bg-teal-400'    },
  rose:    { border: 'border-rose-400',    bg: 'bg-rose-50 dark:bg-rose-950/40',      label: 'text-rose-700 dark:text-rose-300',      hint: 'text-rose-500',    badge: 'bg-rose-400'    },
  orange:  { border: 'border-orange-400',  bg: 'bg-orange-50 dark:bg-orange-950/40',  label: 'text-orange-700 dark:text-orange-300',  hint: 'text-orange-500',  badge: 'bg-orange-400'  },
};

// ── Logo ──────────────────────────────────────────────────────────────────────

function Logo() { return <KompilotLogo variant="icon" height={40} />; }

// ── Sector card (single-select) ───────────────────────────────────────────────

function SectorCard({ emoji, label, selected, onClick }: {
  emoji: string; label: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-center transition-all duration-150 cursor-pointer hover:scale-[1.02] active:scale-[0.97] ${
        selected
          ? 'border-primary bg-primary/8 shadow-md shadow-primary/15'
          : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
      }`}
    >
      <span className="text-2xl leading-none">{emoji}</span>
      <span className={`text-xs font-semibold leading-tight ${selected ? 'text-primary' : 'text-foreground'}`}>
        {label}
      </span>
      {selected && (
        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
    </button>
  );
}

// ── Objective card (multi-select) ─────────────────────────────────────────────

function ObjectiveCard({ emoji, label, hint, color, selected, disabled, onClick }: {
  emoji: string; label: string; hint: string; color: string;
  selected: boolean; disabled: boolean; onClick: () => void;
}) {
  const c = COLOR_MAP[color];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative flex items-start gap-3 rounded-2xl border-2 px-4 py-4 text-left w-full transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed ${
        selected
          ? `${c.border} ${c.bg} shadow-sm`
          : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30 hover:scale-[1.01]'
      } ${disabled ? 'opacity-40' : ''}`}
    >
      <span className="text-2xl leading-none mt-0.5 shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold leading-tight ${selected ? c.label : 'text-foreground'}`}>{label}</p>
        <p className={`text-xs mt-0.5 leading-snug ${selected ? c.hint : 'text-muted-foreground'}`}>{hint}</p>
      </div>
      <span className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150 mt-0.5 ${
        selected ? `${c.badge} border-transparent` : 'border-border/60 bg-transparent'
      }`}>
        {selected && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profileType, siret, isB2B } = useUserProfile();
  const { triggerJ0 } = useWelcomeEmailSequence();
  // MODULE 1: Sector selector modal
  const { sector: savedSector, saveSector } = useSector();
  const [showSectorModal, setShowSectorModal] = useState(!savedSector);

  const [companyName, setCompanyName] = useState('');
  const [city, setCity]               = useState('');
  const [postalCode, setPostalCode]   = useState('');
  const [sector, setSector]           = useState('');
  const [objectives, setObjectives]   = useState<Set<string>>(new Set());
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  // MODULE 2: Competitor wizard shown after primary onboarding saves
  const [showCompetitorWizard, setShowCompetitorWizard] = useState(false);
  // MODULE 3: Pro/Agency banner shown at bottom of form
  const [showProBanner, setShowProBanner] = useState(false);

  const trimmedCompany = companyName.trim();
  const trimmedCity    = city.trim();
  const hasLocation    = trimmedCity.length > 0;
  const hasObjective   = objectives.size > 0;

  // Progress: company → location → sector → objectives
  const progress =
    trimmedCompany && hasLocation && sector && hasObjective ? 100
    : trimmedCompany && hasLocation && sector ? 72
    : trimmedCompany && hasLocation ? 44
    : trimmedCompany ? 20
    : 5;

  const toggleObjective = (id: string) => {
    if (!sector) return;
    setObjectives(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectionLabel = () => {
    if (objectives.size === 0) return null;
    if (objectives.size === OBJECTIVES.length) return '🚀 Tous les objectifs — allons-y !';
    return `${objectives.size} objectif${objectives.size > 1 ? 's' : ''} sélectionné${objectives.size > 1 ? 's' : ''}`;
  };

  const handleSubmit = async () => {
    if (!trimmedCompany || !hasLocation || !sector || !hasObjective || !user) return;
    setSaving(true);
    setError('');

    const objectiveStr = Array.from(objectives).join(',');

    // Persist full profile to localStorage (instant on next load)
    // Also writes the sector so DemoModeContext picks it up for the GEO citation widget
    const profileData = { sector, objectives: Array.from(objectives), companyName: trimmedCompany, city: trimmedCity, postalCode: postalCode.trim() };
    localStorage.setItem(PROFILE_CACHE_KEY(user.id), JSON.stringify(profileData));
    localStorage.setItem(`onboarding_done_${user.id}`, '1');

    try {
      await blink.db.onboardingProfiles.create({
        id: crypto.randomUUID(),
        userId: user.id,
        sector,
        objective: objectiveStr,
      });

      // For B2B users: create an establishment with the SIRET
      if (isB2B && siret) {
        try {
          await blink.db.establishments.create({
            id: crypto.randomUUID(),
            userId: user.id,
            name: trimmedCompany,
            activity: sector,
            city: trimmedCity ? (postalCode.trim() ? `${trimmedCity} (${postalCode.trim()})` : trimmedCity) : '',
            siret: siret,
          });
        } catch {
          // Non-blocking
        }
      } else if (trimmedCity) {
        // Non-B2B: still create a minimal establishment record so the city is available
        try {
          await blink.db.establishments.create({
            id: crypto.randomUUID(),
            userId: user.id,
            name: trimmedCompany,
            activity: sector,
            city: postalCode.trim() ? `${trimmedCity} (${postalCode.trim()})` : trimmedCity,
          });
        } catch {
          // Non-blocking
        }
      }

      // Trigger the welcome tour on next dashboard load
      localStorage.setItem(`${TOUR_PENDING_KEY}_${user.id}`, '1');

      // ── Grant 50 welcome SMS credits (idempotent) ────────────────────────
      try {
        const existingRows = await blink.db.smsCredits.list({ where: { userId: user.id }, limit: 1 } as any);
        if (!existingRows || (existingRows as any[]).length === 0) {
          const smsId = `sms_${user.id.slice(0, 8)}_${Date.now()}`;
          await blink.db.smsCredits.create({
            id: smsId,
            userId: user.id,
            balance: 50,
            totalUsed: 0,
            totalGiven: 50,
            planMonthlyQuota: 50,
            welcomePackGranted: 1,
            lastRechargeAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as any);
        }
      } catch {
        // Non-blocking — credits will be granted on first SMS widget load
      }

      // ── Track CompleteRegistration (full onboarding, not just scan modal) ──
      track('CompleteRegistration', {
        userId: user.id,
        email: user.email,
        sector,
        userType: 'commerce',
        eventUrl: window.location.href,
      }).catch(() => {});

      // ── OnboardingIncomplete : onboarding terminé mais Stripe non configuré ──
      // On déclenche toujours ce signal — il sera automatiquement désactivé
      // (remplacé par HighValuePro) quand le Bouclier Stripe sera activé
      track('OnboardingIncomplete', {
        userId: user.id,
        sector,
        userType: 'commerce',
        eventUrl: window.location.href,
      }).catch(() => {});

      // ── Welcome email J0 — fire-and-forget, silent errors ────────────────
      triggerJ0({
        userId:      user.id,
        sector,
        objective:   objectiveStr,
        displayName: user.display_name ?? user.email ?? '',
        email:       user.email ?? '',
      }).catch(() => {});

      // Show pro/agency banner and competitor wizard before redirecting to dashboard
      setShowProBanner(true);
      setShowCompetitorWizard(true);
      setSaving(false);
    } catch (err: any) {
      if (err?.message?.includes('UNIQUE')) {
        setShowCompetitorWizard(true);
        setSaving(false);
        return;
      }
      setError('Une erreur est survenue. Veuillez réessayer.');
      setSaving(false);
    }
  };

  // ── Competitor Wizard handlers ─────────────────────────────────────────────
  const handleWizardComplete = async (data: {
    businessName: string; businessUrl: string; industry: string;
    competitor1Name: string; competitor1Url: string;
    competitor2Name?: string; competitor2Url?: string;
  }) => {
    if (!user) return;
    // Activate the launch checklist widget
    try { localStorage.setItem(`checklist_show_${user.id}`, '1'); } catch { /* noop */ }
    // Seed funnels in backend (fire-and-forget)
    blink.auth.getValidToken().then(token => {
      fetch(`${BACKEND_URL}/api/funnels/onboarding-seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      }).catch(() => {});
    }).catch(() => {});
  };

  const handleWizardSkip = () => {
    if (user) {
      try { localStorage.setItem(`checklist_show_${user.id}`, '1'); } catch { /* noop */ }
    }
    navigate({ to: '/dashboard' });
  };

  return (
    <>
    {/* MODULE 2: Competitor onboarding wizard */}
    <CompetitorOnboardingWizard
      isOpen={showCompetitorWizard}
      onComplete={handleWizardComplete}
      onSkip={handleWizardSkip}
    />

    {/* MODULE 1: Sector selector modal — shown first time on onboarding */}
    <SectorSelectorModal
      open={showSectorModal}
      onSelect={(s: Sector) => {
        saveSector(s);
        setSector(s);
        setShowSectorModal(false);
      }}
      onDismiss={() => setShowSectorModal(false)}
    />

    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div className="h-full bg-primary transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Bienvenue 👋</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Configurons votre espace</h1>
            <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto leading-relaxed">
              Quelques questions rapides pour personnaliser Kompilot selon votre activité et vos objectifs.
            </p>
          </div>
        </div>

        {/* 🎁 Welcome SMS gift banner */}
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 dark:border-emerald-800/40 px-5 py-4 shadow-sm">
          <span className="text-2xl shrink-0">🎁</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300 leading-tight">
              Cadeau de bienvenue : 50 SMS professionnels inclus
            </p>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400 mt-0.5 leading-relaxed">
              Pour tester l'automatisation SMS &amp; WhatsApp en direct, dès votre première connexion.
            </p>
          </div>
          <div className="shrink-0 rounded-xl bg-emerald-500 text-white text-xs font-extrabold px-3 py-1.5 whitespace-nowrap">
            50 SMS
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-border bg-card shadow-lg overflow-hidden">

          {/* ── Nom de l'entreprise ── */}
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">1</span>
              <h2 className="text-base font-bold text-foreground">Nom de votre entreprise ou de votre marque</h2>
            </div>
            <div className="relative">
              <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Ex : La Boulangerie du Coin, Studio Créa, Plomberie Dupont…"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                maxLength={60}
                className={`w-full rounded-2xl border-2 bg-background pl-11 pr-4 py-3.5 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none transition-all duration-150 ${
                  trimmedCompany
                    ? 'border-primary shadow-sm shadow-primary/15 focus:border-primary'
                    : 'border-border hover:border-primary/40 focus:border-primary/60'
                }`}
                autoFocus
              />
              {trimmedCompany && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </div>
            {trimmedCompany && (
              <p className="text-xs text-primary font-medium mt-2 ml-1">
                ✓ Parfait, nous préparerons votre espace pour <strong>{trimmedCompany}</strong>.
              </p>
            )}

            {/* ── Localisation ── */}
            <div className={`mt-5 transition-all duration-300 ${trimmedCompany ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={15} className="text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground">Localisation de votre établissement</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Ville */}
                <div className="relative col-span-2 sm:col-span-1">
                  <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Ville  (ex : Paris, Lyon…)"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    maxLength={60}
                    className={`w-full rounded-2xl border-2 bg-background pl-10 pr-4 py-3 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none transition-all duration-150 ${
                      trimmedCity
                        ? 'border-primary shadow-sm shadow-primary/15'
                        : 'border-border hover:border-primary/40 focus:border-primary/60'
                    }`}
                  />
                </div>
                {/* Code postal */}
                <div className="relative col-span-2 sm:col-span-1">
                  <Hash size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Code postal  (ex : 75001)"
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    maxLength={5}
                    className={`w-full rounded-2xl border-2 bg-background pl-10 pr-4 py-3 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none transition-all duration-150 ${
                      postalCode.length === 5
                        ? 'border-primary shadow-sm shadow-primary/15'
                        : 'border-border hover:border-primary/40 focus:border-primary/60'
                    }`}
                  />
                </div>
              </div>
              {trimmedCity && (
                <p className="text-xs text-primary font-medium mt-2 ml-1">
                  📍 {postalCode ? `${trimmedCity} — ${postalCode}` : trimmedCity}
                </p>
              )}
            </div>
          </div>

          <div className="mx-8 border-t border-border" />

          {/* ── Secteur d'activité ── */}
          <div className="px-8 pt-6 pb-6">
            <div className="flex items-center gap-3 mb-5">
              <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-all duration-300 ${
                trimmedCompany && hasLocation ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>2</span>
              <h2 className={`text-base font-bold transition-colors duration-300 ${trimmedCompany && hasLocation ? 'text-foreground' : 'text-muted-foreground'}`}>
                Quel est votre secteur d'activité ?
              </h2>
            </div>
            <div className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 transition-opacity duration-300 ${trimmedCompany && hasLocation ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              {SECTORS.map(s => (
                <SectorCard
                  key={s.id}
                  emoji={s.emoji}
                  label={s.label}
                  selected={sector === s.id}
                  onClick={() => (trimmedCompany && hasLocation) && setSector(s.id)}
                />
              ))}
            </div>
          </div>

          {/* ── Connecteurs sectoriels (dynamic) ── */}
          {sector && (
            <div className="px-8">
              <SectorConnectorsPanel onboardingSector={sector} />
            </div>
          )}

          {/* ── Objectifs d'utilisation (multi-select) ── */}
          <div className="px-8 pt-6 pb-8">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-all duration-300 ${
                  sector ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>3</span>
                <div>
                  <h2 className={`text-base font-bold transition-colors duration-300 ${sector ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Comment comptez-vous utiliser Kompilot ?
                  </h2>
                  <p className={`text-xs mt-0.5 transition-colors duration-300 ${sector ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                    Sélectionnez tous vos objectifs d'utilisation
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 rounded-full px-2.5 py-0.5 shrink-0 self-start mt-1">
                Multi-choix
              </span>
            </div>

            {/* Selection counter */}
            <div className={`mb-4 h-5 transition-all duration-300 ${hasObjective ? 'opacity-100' : 'opacity-0'}`}>
              {hasObjective && <p className="text-xs font-semibold text-primary">✓ {selectionLabel()}</p>}
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 transition-opacity duration-300 ${sector ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              {OBJECTIVES.map(o => (
                <ObjectiveCard
                  key={o.id}
                  emoji={o.emoji}
                  label={o.label}
                  hint={o.hint}
                  color={o.color}
                  selected={objectives.has(o.id)}
                  disabled={!sector}
                  onClick={() => toggleObjective(o.id)}
                />
              ))}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="bg-muted/20 border-t border-border px-8 py-5 flex items-center justify-between gap-4">
            <div>
              {error
                ? <p className="text-xs text-destructive">{error}</p>
                : <p className="text-xs text-muted-foreground">
                    {trimmedCompany && hasLocation && sector && hasObjective
                      ? <span className="text-green-600 font-semibold">✓ Parfait, votre espace est prêt !</span>
                      : !trimmedCompany ? 'Commencez par nommer votre entreprise.'
                      : !hasLocation ? 'Indiquez la ville de votre établissement.'
                      : !sector ? 'Choisissez votre secteur d\'activité.'
                      : 'Sélectionnez au moins un objectif.'}
                  </p>
              }
            </div>
            <button
              onClick={handleSubmit}
              disabled={!trimmedCompany || !hasLocation || !sector || !hasObjective || saving}
              className="flex items-center gap-2 rounded-xl bg-foreground text-background text-sm font-bold px-6 py-3 shadow-lg hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 10h-2a8 8 0 01-8-8z"/>
                  </svg>
                  Enregistrement…
                </>
              ) : 'Accéder au tableau de bord →'}
            </button>
          </div>
        </div>

        {/* MODULE 3: Pro/Agency banner — shown after successful save */}
        {showProBanner && (
          <ProAgencyOnboardingBanner
            userName={user?.display_name ?? undefined}
            onDismiss={() => setShowProBanner(false)}
          />
        )}

        <p className="text-center text-xs text-muted-foreground">
          Vous pourrez modifier ces préférences dans vos paramètres à tout moment.
        </p>
      </div>
    </div>
    </>
  );
}