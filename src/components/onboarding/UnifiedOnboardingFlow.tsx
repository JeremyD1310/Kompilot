/**
 * UnifiedOnboardingFlow — Single adaptive onboarding for all user types.
 *
 * Replaces: KompilotOnboardingFlow, QuickOnboardingWizard,
 *           ExhaustiveOnboardingModal, SmartOnboardingWizard
 *
 * 5 steps, < 2 minutes, sector-aware.
 *   1. Business identity (name + city + sector)
 *   2. Goal (4 cards: Visibility / Revenue / Content / Clients)
 *   3. Connect (1-click sector API connector — optional)
 *   4. First AI action (auto-generated post + review response)
 *   5. Victory (score + graduation)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Target, Plug, Sparkles, PartyPopper, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../context/UserProfileContext';
import { track, getUtmSector } from '../../lib/tracking';
import { blink } from '../../blink/client';

import type { Step, OnboardingData } from './unified/types';
import type { GranularSector } from '../../lib/sectors/types';
import { persistOnboarding, type EstablishmentRecord, type OnboardingProfileRecord } from '../../lib/onboardingPersistence';
import { StepIdentity } from './unified/StepIdentity';
import { StepGoal } from './unified/StepGoal';
import { StepConnect } from './unified/StepConnect';
import { StepFirstAction } from './unified/StepFirstAction';
import { StepVictory } from './unified/StepVictory';

const STEPS = [
  { label: 'Identité', icon: <MapPin size={14} /> },
  { label: 'Objectif', icon: <Target size={14} /> },
  { label: 'Connexion', icon: <Plug size={14} /> },
  { label: '1ère action', icon: <Sparkles size={14} /> },
  { label: 'C\'est parti', icon: <PartyPopper size={14} /> },
];

interface Props { open: boolean; onComplete: () => void; }

export function UnifiedOnboardingFlow({ open, onComplete }: Props) {
  const { user } = useAuth();
  const { setSmartProfile } = useUserProfile();
  const [step, setStep] = useState<Step>(0);
  const [data, setData] = useState<OnboardingData>({
    businessName: '', city: '', sector: '', profileType: 'commerce', goal: '', connectorDone: false,
  });
  const [persistenceError, setPersistenceError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const update = (patch: Partial<OnboardingData>) => setData(prev => ({ ...prev, ...patch }));

  const canNext = () => {
    if (step === 0) return data.businessName.trim().length > 0 && data.city.trim().length > 0 && data.sector.length > 0;
    if (step === 1) return data.goal.length > 0;
    return true;
  };

  const handleNext = () => {
    if (!canNext()) return;
    if (step === 0) {
      track('CompleteRegistration', {
        sector: data.sector || getUtmSector() || undefined,
        userType: data.profileType,
        eventUrl: window.location.href,
      }).catch(() => {});
    }
    if (step < 4) setStep((step + 1) as Step);
  };

  const GOAL_TO_OBJECTIVE: Record<string, 'geo' | 'no_show' | 'resell'> = {
    visibility: 'geo',
    revenue: 'no_show',
    content: 'resell',
    clients: 'resell',
  };

  const handleFirstActionComplete = async () => {
    if (!user?.id || isSaving) return;
    setIsSaving(true);
    setPersistenceError('');
    try {
      const objective = GOAL_TO_OBJECTIVE[data.goal] ?? 'geo';
      const establishments = blink.db.table<EstablishmentRecord>('establishments');
      const onboardingProfiles = blink.db.table<OnboardingProfileRecord>('onboarding_profiles');
      await persistOnboarding({
        listEstablishments: () => establishments.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'asc' },
          limit: 100,
        }),
        createEstablishment: payload => establishments.create(payload),
        updateEstablishment: (id, payload) => establishments.update(id, payload),
        listProfiles: () => onboardingProfiles.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          limit: 100,
        }),
        createProfile: payload => onboardingProfiles.create(payload),
        updateProfile: (id, payload) => onboardingProfiles.update(id, payload),
      }, {
        userId: user.id,
        businessName: data.businessName,
        city: data.city,
        sector: data.sector,
        objective: data.goal,
        establishmentId: crypto.randomUUID(),
        profileId: `onb_${user.id}`,
      });

      setSmartProfile({
        smartProfileType: data.profileType,
        objective,
        granularSector: data.sector as GranularSector,
        followLocalEvents: true,
      });
    } catch (error) {
      console.error('[onboarding] persistence failed', {
        code: 'ONBOARDING_PERSISTENCE_FAILED',
        operation: 'save_profile_and_establishment',
        error: error instanceof Error ? error.name : 'unknown',
      });
      setPersistenceError('Nous n’avons pas pu enregistrer votre onboarding. Vérifiez votre connexion puis réessayez.');
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
    // Fire Lead event — user completed the full onboarding funnel
    track('Lead', {
      sector: data.sector || getUtmSector() || undefined,
      userType: data.profileType,
      eventUrl: window.location.href,
    }).catch(() => {});
    setStep(4);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="uob-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(5,10,25,0.92)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}
      >
        <motion.div
          key="uob-card" initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          style={{
            width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto',
            background: 'linear-gradient(160deg, rgba(13,21,38,.99), rgba(8,14,28,.99))',
            border: '1px solid rgba(13,148,136,.25)', borderRadius: 22,
            padding: 'clamp(24px,4vw,36px)',
            boxShadow: '0 32px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(13,148,136,.06)',
          }}
        >
          {/* Step dots */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
            {STEPS.map((s, i) => (
              <div key={i} title={s.label} style={{
                width: i === step ? 32 : 8, height: 8, borderRadius: 4,
                background: i < step ? '#10B981' : i === step ? '#0D9488' : 'rgba(255,255,255,.1)',
                transition: 'all .3s',
              }} />
            ))}
          </div>

          {/* Step label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(13,148,136,.1)', border: '1px solid rgba(13,148,136,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D9488',
            }}>{STEPS[step].icon}</div>
            <p style={{ color: '#94A3B8', fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Étape {step + 1}/5 — {STEPS[step].label}
            </p>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              {step === 0 && <StepIdentity data={data} setData={update} />}
              {step === 1 && <StepGoal data={data} setData={update} />}
              {step === 2 && <StepConnect data={data} onDone={() => { update({ connectorDone: true }); setStep(3); }} />}
              {step === 3 && <StepFirstAction data={data} onComplete={handleFirstActionComplete} />}
              {step === 4 && <StepVictory data={data} onComplete={onComplete} />}
            </motion.div>
          </AnimatePresence>

          {persistenceError && (
            <p role="alert" style={{ color: '#FCA5A5', fontSize: '.82rem', lineHeight: 1.5, marginTop: 18 }}>
              {persistenceError}
            </p>
          )}

          {/* Nav buttons (hidden on connect/first-action/victory) */}
          {step < 2 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
              {step > 0 ? (
                <button onClick={() => setStep((step - 1) as Step)} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                  color: '#64748B', fontWeight: 600, fontSize: '.82rem',
                  padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
                }}><ChevronLeft size={14} /> Retour</button>
              ) : <div />}
              <button onClick={handleNext} disabled={!canNext()} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: canNext() ? 'linear-gradient(135deg, #0D9488, #0f766e)' : 'rgba(13,148,136,.15)',
                color: '#fff', fontWeight: 700, fontSize: '.88rem',
                padding: '12px 24px', borderRadius: 12, border: 'none',
                cursor: canNext() ? 'pointer' : 'not-allowed',
                boxShadow: canNext() ? '0 0 20px rgba(13,148,136,.3)' : 'none',
                transition: 'all .2s',
              }}>Continuer <ChevronRight size={16} /></button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
