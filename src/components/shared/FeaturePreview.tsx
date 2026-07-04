/**
 * FeaturePreview — Reusable component for showing a blurred preview of
 * premium features with a contextual upgrade CTA.
 *
 * Strategy (Spotify/Notion model): show the user what they're missing,
 * but make it partially visible so they experience the value before paying.
 *
 * Usage:
 *   <FeaturePreview featureName="Radar Concurrentiel" requiredPlan="agency">
 *     <CompetitorRadarWidget />
 *   </FeaturePreview>
 *
 * The children render normally but are blurred + desaturated.
 * A centered overlay shows the feature name, a short description, and a CTA.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowUpRight, X } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

interface FeaturePreviewProps {
  children: React.ReactNode;
  /** Name shown in the overlay */
  featureName: string;
  /** Short description of what the feature does */
  description?: string;
  /** Required plan — used for the CTA label */
  requiredPlan?: 'starter' | 'agency' | 'enterprise';
  /** If true, dismisses the overlay to show a peek (re-blurs after 5s) */
  allowPeek?: boolean;
}

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  agency: 'Agency',
  enterprise: 'Enterprise',
};

export function FeaturePreview({
  children,
  featureName,
  description = 'Débloquez cette fonctionnalité pour aller plus loin.',
  requiredPlan = 'agency',
  allowPeek = true,
}: FeaturePreviewProps) {
  const navigate = useNavigate();
  const [peeking, setPeeking] = useState(false);

  const handlePeek = () => {
    if (!allowPeek) return;
    setPeeking(true);
    // Re-blur after 5 seconds
    setTimeout(() => setPeeking(false), 5000);
  };

  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
      {/* Content (blurred) */}
      <div
        style={{
          filter: peeking ? 'none' : 'blur(8px) saturate(0.3) brightness(0.6)',
          transition: 'filter 0.6s ease',
          pointerEvents: peeking ? 'auto' : 'none',
          userSelect: peeking ? 'auto' : 'none',
        }}
      >
        {children}
      </div>

      {/* Overlay CTA */}
      <AnimatePresence>
        {!peeking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 12, padding: 24, zIndex: 10,
              background: 'rgba(15,23,42,0.7)',
              backdropFilter: 'blur(4px)',
            }}
          >
            {/* Lock icon */}
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Lock size={20} color="#818CF8" />
            </div>

            {/* Text */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#E2E8F0', fontWeight: 800, fontSize: '.95rem', margin: '0 0 4px' }}>
                {featureName}
              </p>
              <p style={{ color: '#94A3B8', fontSize: '.78rem', margin: 0, lineHeight: 1.5, maxWidth: 280 }}>
                {description}
              </p>
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => navigate({ to: '/pricing' as any })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'linear-gradient(135deg, #818CF8, #6366F1)',
                  color: '#fff', fontWeight: 700, fontSize: '.82rem',
                  border: 'none', borderRadius: 10, padding: '10px 20px',
                  cursor: 'pointer', boxShadow: '0 0 20px rgba(99,102,241,.3)',
                  transition: 'transform .15s, box-shadow .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                Passer à {PLAN_LABELS[requiredPlan] || requiredPlan}
                <ArrowUpRight size={14} />
              </button>

              {allowPeek && (
                <button
                  onClick={handlePeek}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'rgba(255,255,255,.06)',
                    border: '1px solid rgba(255,255,255,.12)',
                    color: '#94A3B8', fontWeight: 600, fontSize: '.78rem',
                    borderRadius: 10, padding: '10px 16px',
                    cursor: 'pointer', transition: 'all .2s',
                  }}
                >
                  Aperçu 5s
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Peek timer indicator */}
      <AnimatePresence>
        {peeking && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              position: 'absolute', top: 10, right: 10, zIndex: 20,
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(15,23,42,.85)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(99,102,241,.3)',
              borderRadius: 8, padding: '6px 12px',
            }}
          >
            <motion.div
              animate={{ width: ['100%', '0%'] }}
              transition={{ duration: 5, ease: 'linear' }}
              style={{
                height: 3, borderRadius: 2, overflow: 'hidden',
                background: 'rgba(99,102,241,.3)', width: 60, flexShrink: 0,
              }}
            >
              <div style={{ height: '100%', background: '#818CF8', borderRadius: 2 }} />
            </motion.div>
            <button
              onClick={() => setPeeking(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
            >
              <X size={14} color="#94A3B8" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
