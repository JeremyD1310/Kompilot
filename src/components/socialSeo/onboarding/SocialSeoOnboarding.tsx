/**
 * Social-to-SEO Interactive Onboarding
 *
 * Step-by-step guided tour with spotlight overlays.
 * Clic-par-clic walkthrough that auto-activates on first visit.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles, Eye, Lightbulb, Table2, Users, CheckCircle2 } from 'lucide-react'
import { useSocialSeoOnboarding, useUpdateOnboarding } from '@/hooks/useSocialSeo'
import { usePlan } from '@/hooks/usePlan'

interface OnboardingStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  targetSelector?: string // CSS selector for spotlight target
  position: 'center' | 'top' | 'bottom'
  isAgencyOnly?: boolean
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Bienvenue dans Social-to-SEO !',
    description: 'Découvrez comment vos publications sociales influencent votre visibilité sur Google. Connectez votre première propriété sociale ou votre Search Console pour commencer l\'analyse en temps réel.',
    icon: <Sparkles className="w-6 h-6 text-teal-400" />,
    position: 'center',
  },
  {
    id: 2,
    title: 'Vos KPI en un coup d\'œil',
    description: 'Ces 3 cartes affichent vos impressions Google totales, vos clics organiques et l\'évolution de votre visibilité. Les données proviennent de Google Search Console et sont agrégées par plateforme sociale.',
    icon: <Eye className="w-6 h-6 text-blue-400" />,
    targetSelector: '[data-onboarding="kpi-cards"]',
    position: 'bottom',
  },
  {
    id: 3,
    title: 'Cross-Network Insights',
    description: 'Notre algorithme "Bridge" analyse vos performances inter-réseaux et détecte automatiquement les opportunités : si un sujet cartonne sur TikTok, il vous recommande de le décliner sur YouTube ou X.',
    icon: <Lightbulb className="w-6 h-6 text-amber-400" />,
    targetSelector: '[data-onboarding="cross-network"]',
    position: 'top',
  },
  {
    id: 4,
    title: 'Top Performing Posts',
    description: 'Ce tableau classe vos publications sociales les plus visibles sur Google. Filtrez par réseau et découvrez quelles requêtes clés génèrent le plus de trafic vers chacun de vos posts.',
    icon: <Table2 className="w-6 h-6 text-emerald-400" />,
    targetSelector: '[data-onboarding="top-posts"]',
    position: 'top',
  },
  {
    id: 5,
    title: 'Multi-comptes & Export (Plan Agency)',
    description: 'En tant qu\'agence, vous pouvez basculer entre vos différents clients et exporter des rapports Social-to-SEO en marque blanche (PDF/CSV) pour vos présentations.',
    icon: <Users className="w-6 h-6 text-purple-400" />,
    targetSelector: '[data-onboarding="agency-controls"]',
    position: 'top',
    isAgencyOnly: true,
  },
]

export function SocialSeoOnboarding() {
  const { data: onboardingState, isLoading } = useSocialSeoOnboarding()
  const updateOnboarding = useUpdateOnboarding()
  const { canAccess } = usePlan()
  const isAgency = canAccess('agency_features') || canAccess('multi_client')

  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Filter steps based on plan
  const steps = ONBOARDING_STEPS.filter(s => !s.isAgencyOnly || isAgency)

  // Auto-activate on first visit
  useEffect(() => {
    if (!isLoading && onboardingState && !onboardingState.hasCompletedOnboarding) {
      // Small delay to let the page render
      const timer = setTimeout(() => {
        setIsActive(true)
        setCurrentStep(onboardingState.currentStep || 0)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [isLoading, onboardingState])

  const persistStep = useCallback((step: number) => {
    updateOnboarding.mutate({ currentStep: step })
  }, [updateOnboarding])

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1
      setCurrentStep(next)
      persistStep(next)
    } else {
      handleComplete()
    }
  }, [currentStep, steps.length, persistStep])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      const prev = currentStep - 1
      setCurrentStep(prev)
      persistStep(prev)
    }
  }, [currentStep, persistStep])

  const handleComplete = useCallback(() => {
    setIsCompleting(true)
    updateOnboarding.mutate(
      { hasCompletedOnboarding: true, currentStep: steps.length },
      { onSuccess: () => {
        setTimeout(() => setIsActive(false), 400)
      }}
    )
  }, [updateOnboarding, steps.length])

  const handleSkip = useCallback(() => {
    handleComplete()
  }, [handleComplete])

  // Manual restart (Agency button)
  useEffect(() => {
    const handler = () => {
      setCurrentStep(0)
      setIsActive(true)
      persistStep(0)
    }
    window.addEventListener('social-seo-restart-onboarding', handler)
    return () => window.removeEventListener('social-seo-restart-onboarding', handler)
  }, [persistStep])

  if (!isActive || isLoading) return null

  const step = steps[currentStep]
  if (!step) return null

  // Calculate spotlight position
  let spotlightRect: DOMRect | null = null
  if (step.targetSelector) {
    const target = document.querySelector(step.targetSelector)
    if (target) {
      spotlightRect = target.getBoundingClientRect()
    }
  }

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[9999] transition-opacity duration-300 ${isCompleting ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Dark overlay with spotlight cutout */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm">
        {spotlightRect && (
          <div
            className="absolute transition-all duration-500 ease-out rounded-xl"
            style={{
              top: spotlightRect.top - 8,
              left: spotlightRect.left - 8,
              width: spotlightRect.width + 16,
              height: spotlightRect.height + 16,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
              border: '2px solid rgba(13,148,136,0.4)',
              background: 'transparent',
            }}
          />
        )}
      </div>

      {/* Tooltip / Dialog */}
      <div
        className={`
          absolute z-10 w-full max-w-md
          ${step.position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
          ${step.position === 'bottom' && spotlightRect ? 'left-1/2 -translate-x-1/2' : ''}
          ${step.position === 'top' && spotlightRect ? 'left-1/2 -translate-x-1/2' : ''}
        `}
        style={
          step.position === 'bottom' && spotlightRect
            ? { top: spotlightRect.bottom + 20 }
            : step.position === 'top' && spotlightRect
              ? { top: spotlightRect.top - 220 }
              : undefined
        }
      >
        <div className="mx-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl shadow-slate-900/80 overflow-hidden">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 pt-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-6 bg-teal-400' : i < currentStep ? 'w-2 bg-teal-600' : 'w-2 bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-slate-700/50 border border-slate-600/30 shrink-0">
                {step.icon}
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">{step.title}</h3>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">{step.description}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-800/50 border-t border-slate-700/50">
            <button
              onClick={handleSkip}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Passer le guide
            </button>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Précédent
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-500 transition-colors"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Terminer
                  </>
                ) : (
                  <>
                    Suivant
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
