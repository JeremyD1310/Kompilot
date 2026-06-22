import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useGuidedTour } from '../../context/GuidedTourContext';
import { useNavigate } from '@tanstack/react-router';

type Rect = { top: number; left: number; width: number; height: number };

const PADDING = 10; // spotlight padding

function getTargetRect(target: string): Rect | null {
  if (target === 'center') return null;
  const el = document.querySelector(target);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PADDING,
    left: r.left - PADDING,
    width: r.width + PADDING * 2,
    height: r.height + PADDING * 2,
  };
}

function getTooltipPosition(
  placement: string,
  rect: Rect | null,
  tooltipRef: React.RefObject<HTMLDivElement | null>
): React.CSSProperties {
  if (!rect || placement === 'center') {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  const tooltipW = tooltipRef.current?.offsetWidth ?? 340;
  const tooltipH = tooltipRef.current?.offsetHeight ?? 200;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = 16;

  let top = 0;
  let left = 0;

  switch (placement) {
    case 'right':
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left + rect.width + gap;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left - tooltipW - gap;
      break;
    case 'bottom':
      top = rect.top + rect.height + gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      break;
    case 'top':
    default:
      top = rect.top - tooltipH - gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      break;
  }

  // Clamp within viewport
  left = Math.max(16, Math.min(left, vw - tooltipW - 16));
  top = Math.max(16, Math.min(top, vh - tooltipH - 16));

  return { position: 'fixed', top, left };
}

// Arrow pointer connecting tooltip to target
function TooltipArrow({ placement }: { placement: string }) {
  if (placement === 'center') return null;

  const arrowStyle: React.CSSProperties = { position: 'absolute' };
  const size = 10;

  if (placement === 'right') {
    Object.assign(arrowStyle, {
      top: '50%',
      left: -size,
      transform: 'translateY(-50%)',
      borderTop: `${size}px solid transparent`,
      borderBottom: `${size}px solid transparent`,
      borderRight: `${size}px solid hsl(var(--card))`,
    });
  } else if (placement === 'left') {
    Object.assign(arrowStyle, {
      top: '50%',
      right: -size,
      transform: 'translateY(-50%)',
      borderTop: `${size}px solid transparent`,
      borderBottom: `${size}px solid transparent`,
      borderLeft: `${size}px solid hsl(var(--card))`,
    });
  } else if (placement === 'bottom') {
    Object.assign(arrowStyle, {
      top: -size,
      left: '50%',
      transform: 'translateX(-50%)',
      borderLeft: `${size}px solid transparent`,
      borderRight: `${size}px solid transparent`,
      borderBottom: `${size}px solid hsl(var(--card))`,
    });
  } else {
    // top
    Object.assign(arrowStyle, {
      bottom: -size,
      left: '50%',
      transform: 'translateX(-50%)',
      borderLeft: `${size}px solid transparent`,
      borderRight: `${size}px solid transparent`,
      borderTop: `${size}px solid hsl(var(--card))`,
    });
  }

  return <div style={{ ...arrowStyle, width: 0, height: 0 }} />;
}

export function GuidedTour() {
  const { isActive, currentStep, steps, nextStep, prevStep, stopTour, goToStep } = useGuidedTour();
  const navigate = useNavigate();
  const step = steps[currentStep];
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  const updatePositions = useCallback(() => {
    if (!step) return;
    const rect = getTargetRect(step.target);
    setTargetRect(rect);
    const style = getTooltipPosition(step.placement, rect, tooltipRef);
    setTooltipStyle(style);
  }, [step]);

  // Navigate to step route when step changes
  useEffect(() => {
    if (!isActive || !step?.route) return;
    navigate({ to: step.route as any });
  }, [isActive, currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll target into view and update positions
  useEffect(() => {
    if (!isActive || !step) return;

    const el = step.target !== 'center' ? document.querySelector(step.target) : null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Wait for scroll + layout + potential route navigation
    const delay = step.route ? 650 : 400;
    const t = setTimeout(updatePositions, delay);
    return () => clearTimeout(t);
  }, [isActive, step, updatePositions]);

  // Re-calculate on resize
  useEffect(() => {
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [updatePositions]);

  if (!isActive || !step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const isCenter = step.placement === 'center';
  const progress = ((currentStep) / (steps.length - 1)) * 100;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="tour-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
        style={{ pointerEvents: 'none' }}
      >
        {/* Dark overlay with spotlight cutout */}
        {targetRect && !isCenter ? (
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'all' }}
            onClick={stopTour}
          >
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={targetRect.left}
                  y={targetRect.top}
                  width={targetRect.width}
                  height={targetRect.height}
                  rx="12"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.55)"
              mask="url(#spotlight-mask)"
            />
            {/* Glowing border around target */}
            <rect
              x={targetRect.left}
              y={targetRect.top}
              width={targetRect.width}
              height={targetRect.height}
              rx="12"
              fill="none"
              stroke="hsl(171 77% 35%)"
              strokeWidth="2.5"
              className="animate-pulse"
              style={{ pointerEvents: 'none' }}
            />
          </svg>
        ) : (
          <div
            className="absolute inset-0 bg-black/55"
            style={{ pointerEvents: 'all' }}
            onClick={stopTour}
          />
        )}

        {/* Tooltip card */}
        <motion.div
          ref={tooltipRef}
          key={`tooltip-${currentStep}`}
          initial={{ opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 8 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          style={{ ...tooltipStyle, pointerEvents: 'all', zIndex: 10000 }}
          className="w-[340px] max-w-[calc(100vw-32px)]"
        >
          {/* Arrow */}
          {!isCenter && <TooltipArrow placement={step.placement} />}

          <div className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Teal accent top bar */}
            <div className="h-1 bg-gradient-to-r from-primary/80 via-primary to-teal-400" style={{ width: `${progress}%`, transition: 'width 0.4s ease' }} />
            <div className="h-0.5 bg-border -mt-0.5" />

            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {step.icon && (
                    <span className="text-2xl leading-none shrink-0">{step.icon}</span>
                  )}
                  <h3 className="text-sm font-bold text-foreground leading-tight">{step.title}</h3>
                </div>
                <button
                  onClick={stopTour}
                  className="shrink-0 flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors whitespace-nowrap"
                  title="Passer le guide"
                >
                  Passer <X size={10} />
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                {step.description}
              </p>

              {/* Step dots + navigation */}
              <div className="flex items-center justify-between gap-3">
                {/* Dots */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        // navigate to step
                        const ctx = document.querySelector('[data-tour-step]');
                        if (ctx) (ctx as any).__goToStep?.(i);
                      }}
                      className={`rounded-full transition-all duration-200 ${
                        i === currentStep
                          ? 'w-4 h-2 bg-primary'
                          : i < currentStep
                            ? 'w-2 h-2 bg-primary/40'
                            : 'w-2 h-2 bg-muted-foreground/30'
                      }`}
                      title={`Étape ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Step count */}
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {currentStep + 1}/{steps.length}
                </span>
              </div>

              {/* Nav buttons */}
              <div className="flex items-center gap-2 mt-3">
                {!isFirst && (
                  <button
                    onClick={prevStep}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-xl px-3 py-2 transition-colors hover:bg-muted/40"
                  >
                    <ChevronLeft size={13} /> Précédent
                  </button>
                )}

                <button
                  onClick={isLast ? stopTour : nextStep}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl px-4 py-2 transition-colors active:scale-[0.98]"
                >
                  {step.nextLabel ? (
                    <>{step.nextLabel}</>
                  ) : isLast ? (
                    <>🎉 Terminer</>
                  ) : (
                    <>Suivant <ChevronRight size={13} /></>
                  )}
                </button>

                {!isLast && (
                  <button
                    onClick={stopTour}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 shrink-0"
                  >
                    Ignorer
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// Small launch button to re-trigger the tour
export function TourLaunchButton({ className = '' }: { className?: string }) {
  const { startTour } = useGuidedTour();
  return (
    <button
      onClick={startTour}
      className={`flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors ${className}`}
      title="Relancer le guide de démarrage"
    >
      <MapPin size={13} />
      Guide de démarrage : faites votre tour du propriétaire ! 💡
    </button>
  );
}
