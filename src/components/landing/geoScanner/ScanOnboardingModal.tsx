/**
 * ScanOnboardingModal — Sector-adaptive post-scan onboarding
 *
 * Step 1 — Business identity + mandatory sector selector
 * Step 2 — Dynamic API connectors based on chosen sector
 * Step 3 — Activate trial with sector-aware AI tone preview
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ScanData } from './DashboardPreviewOverlay';
import { type Sector, STEPS } from './sectorData';
import { ScanMetricsBar, Step1Identity, Step2Networks, Step3Activate } from './onboardingSteps';
import { track, captureUtmParams, getUtmSector } from '@/lib/tracking';

// ── Types ─────────────────────────────────────────────────────────────────────

export type { Sector };

interface Props {
  open: boolean;
  onClose: () => void;
  query: string;
  scanData: ScanData | null;
  onFinish: () => void;
}

// ── Main Modal ─────────────────────────────────────────────────────────────────

export function ScanOnboardingModal({ open, onClose, query, scanData, onFinish }: Props) {
  const [step, setStep] = useState(0);
  const [sector, setSector] = useState<Sector>('');
  const abandonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);

  const currentStep = STEPS[step];

  // Détecter l'abandon : si le modal est ouvert mais l'utilisateur quitte la page
  // ou ferme le modal avant d'entrer son SIRET (step 0 = identité)
  useEffect(() => {
    if (!open) return;
    completedRef.current = false;

    const handleBeforeUnload = () => {
      if (!completedRef.current && step === 0) {
        // Appel synchrone (beacon) pour garantir l'envoi même en cas de navigation
        const utmParams = captureUtmParams();
        const payload = JSON.stringify({
          event: 'ScannerAbandon',
          sector: utmParams.utm_sector || getUtmSector(),
          userType: utmParams.utm_source?.includes('agency') ? 'agency' : 'commerce',
          eventUrl: window.location.href,
        });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            `${(import.meta as any).env?.VITE_BACKEND_URL || 'https://gbrhsehk.backend.blink.new'}/api/tracking/conversion`,
            new Blob([payload], { type: 'application/json' }),
          );
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [open, step]);

  const handleNext = () => {
    if (step === 0 && !sector) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else {
      completedRef.current = true;
      // Track CompleteRegistration quand l'utilisateur termine le wizard
      const utmParams = captureUtmParams();
      track('CompleteRegistration', {
        sector: sector || utmParams.utm_sector || getUtmSector() || undefined,
        userType: utmParams.utm_source?.includes('agency') ? 'agency' : 'commerce',
        eventUrl: window.location.href,
      }).catch(() => {});
      onFinish();
    }
  };

  // Tracker ScannerAbandon quand le modal est fermé à l'étape 0 (pas de SIRET)
  const handleClose = () => {
    if (!completedRef.current && step === 0) {
      const utmParams = captureUtmParams();
      track('ScannerAbandon', {
        sector: utmParams.utm_sector || getUtmSector() || undefined,
        userType: utmParams.utm_source?.includes('agency') ? 'agency' : 'commerce',
        eventUrl: window.location.href,
      }).catch(() => {});
    }
    onClose();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(5,10,25,0.88)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto',
            background: 'linear-gradient(160deg, rgba(13,21,38,.99), rgba(8,14,28,.99))',
            border: '1px solid rgba(13,148,136,.3)',
            borderRadius: 22,
            boxShadow: '0 0 80px rgba(13,148,136,.15), 0 24px 60px rgba(0,0,0,.5)',
            padding: 'clamp(16px,4vw,26px)',
          }}
        >
          {/* Step progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            {STEPS.map((s, i) => (
              <motion.div
                key={s.id}
                animate={{
                  width: i === step ? 28 : 8,
                  background: i < step ? '#10B981' : i === step ? '#0D9488' : 'rgba(255,255,255,.15)',
                }}
                transition={{ duration: 0.3 }}
                style={{ height: 8, borderRadius: 4 }}
              />
            ))}
          </div>

          {/* Scan metrics summary */}
          <ScanMetricsBar scanData={scanData} />

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{currentStep.emoji}</div>
            <h2 style={{ color: '#F1F5F9', fontWeight: 800, fontSize: 'clamp(.95rem,3vw,1.1rem)', margin: '0 0 5px', lineHeight: 1.3 }}>
              {currentStep.title}
            </h2>
            <p style={{ color: '#64748B', fontSize: '.74rem', margin: 0, lineHeight: 1.5 }}>
              {currentStep.subtitle}
            </p>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
            >
              {step === 0 && (
                <Step1Identity query={query} sector={sector} onSectorChange={setSector} />
              )}
              {step === 1 && <Step2Networks sector={sector} />}
              {step === 2 && <Step3Activate onFinish={onFinish} sector={sector} />}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {step < 2 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              {step > 0 && (
                <button
                  onClick={handleBack}
                  style={{
                    flex: '0 0 auto', background: 'rgba(255,255,255,.05)',
                    border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: 10, padding: '10px 16px',
                    color: '#94A3B8', fontSize: '.8rem', fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ← Retour
                </button>
              )}
              <motion.button
                whileHover={{ scale: step === 0 && !sector ? 1 : 1.02 }}
                whileTap={{ scale: step === 0 && !sector ? 1 : 0.98 }}
                onClick={handleNext}
                disabled={step === 0 && !sector}
                style={{
                  flex: 1,
                  background: step === 0 && !sector
                    ? 'rgba(255,255,255,.07)'
                    : 'linear-gradient(135deg, #0D9488, #0f766e)',
                  color: step === 0 && !sector ? '#475569' : '#fff',
                  fontWeight: 700, fontSize: '.83rem',
                  borderRadius: 10, padding: '11px 18px',
                  border: 'none',
                  cursor: step === 0 && !sector ? 'not-allowed' : 'pointer',
                  boxShadow: step === 0 && !sector ? 'none' : '0 0 20px rgba(13,148,136,.35)',
                  transition: 'all .2s',
                }}
              >
                {step === 0 && !sector
                  ? '⚠️ Choisissez votre secteur pour continuer'
                  : step === 1 ? 'Continuer vers l\'activation →'
                  : 'Continuer →'}
              </motion.button>
            </div>
          )}

          {/* Skip link */}
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', fontSize: '.66rem' }}
            >
              Compléter plus tard
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
