/**
 * CompetitorOnboardingWizard
 * Full-screen overlay wizard shown AFTER sector/objective onboarding.
 * Collects business info + competitor domains, then seeds funnels.
 *
 * Steps:
 *  1 — Your Business (name, URL, industry)
 *  2 — Competitor Tracking (up to 2 competitors)
 *  3 — Loading / Magic Moment (auto-closes after 6s)
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { WizardStep1 } from './WizardStep1';
import { WizardStep2 } from './WizardStep2';
import { WizardStep3 } from './WizardStep3';

export interface CompetitorOnboardingWizardProps {
  isOpen: boolean;
  onComplete: (data: {
    businessName: string;
    businessUrl: string;
    industry: string;
    competitor1Name: string;
    competitor1Url: string;
    competitor2Name?: string;
    competitor2Url?: string;
  }) => void;
  onSkip: () => void;
}

const TOTAL_STEPS = 3;

const slideVariants = {
  enter: { x: 48, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -48, opacity: 0 },
};

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <span
          key={i}
          className={`rounded-full transition-all duration-400 ${
            i + 1 === current
              ? 'w-5 h-2.5 bg-orange-500'
              : i + 1 < current
              ? 'w-2.5 h-2.5 bg-orange-400'
              : 'w-2.5 h-2.5 bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

export function CompetitorOnboardingWizard({ isOpen, onComplete, onSkip }: CompetitorOnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 fields
  const [businessName, setBusinessName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [industry, setIndustry] = useState('');

  // Step 2 fields
  const [competitor1Name, setCompetitor1Name] = useState('');
  const [competitor1Url, setCompetitor1Url] = useState('');
  const [competitor2Name, setCompetitor2Name] = useState('');
  const [competitor2Url, setCompetitor2Url] = useState('');

  const progressPct = (step / TOTAL_STEPS) * 100;

  const goToStep2 = () => setStep(2);

  const goToStep3 = () => {
    // Fire onComplete immediately so backend can start work during loading screen
    onComplete({
      businessName,
      businessUrl: websiteUrl,
      industry,
      competitor1Name,
      competitor1Url,
      competitor2Name: competitor2Name || undefined,
      competitor2Url: competitor2Url || undefined,
    });
    setStep(3);
  };

  const handleDone = useCallback(() => {
    // onComplete already called; just close
    onSkip();
  }, [onSkip]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 w-full">
          <motion.div
            className="h-full bg-orange-500 rounded-full"
            initial={{ width: '33%' }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-5 pb-1">
          <StepDots current={step} />
          {step < 3 && (
            <button
              onClick={onSkip}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip <X size={13} />
            </button>
          )}
        </div>

        {/* Step content */}
        <div className="px-7 pb-8 pt-4" style={{ minHeight: 440 }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <WizardStep1
                  businessName={businessName}
                  setBusinessName={setBusinessName}
                  websiteUrl={websiteUrl}
                  setWebsiteUrl={setWebsiteUrl}
                  industry={industry}
                  setIndustry={setIndustry}
                  onNext={goToStep2}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <WizardStep2
                  competitor1Name={competitor1Name}
                  setCompetitor1Name={setCompetitor1Name}
                  competitor1Url={competitor1Url}
                  setCompetitor1Url={setCompetitor1Url}
                  competitor2Name={competitor2Name}
                  setCompetitor2Name={setCompetitor2Name}
                  competitor2Url={competitor2Url}
                  setCompetitor2Url={setCompetitor2Url}
                  onNext={goToStep3}
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <WizardStep3 onDone={handleDone} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
