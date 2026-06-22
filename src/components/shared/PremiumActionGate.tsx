/**
 * PremiumActionGate — Modale paywall déclenchée quand un utilisateur en essai
 * tente d'utiliser une action premium (Copilote, Quick Suggestions, Approuver post).
 *
 * Style : dark premium, très proche du design NIMT-AI.
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ArrowRight, ShieldCheck, Sparkles, Clock } from 'lucide-react';
import { useTrial } from '../../context/TrialContext';
import { blink } from '../../blink/client';

const FEATURES = [
  { icon: Sparkles, label: 'Génération IA de posts & réponses aux avis' },
  { icon: ShieldCheck, label: 'Protection Anti-No Show & alertes trésorerie' },
  { icon: Zap, label: 'Barre Copilote illimitée + automatisations' },
  { icon: Clock, label: 'Calendrier multi-canaux avec planification auto' },
];

export function PremiumActionGate() {
  const { paywallOpen, closePaywall, trialDaysLeft } = useTrial();

  // Lock scroll when open
  useEffect(() => {
    if (paywallOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [paywallOpen]);

  const handleUpgrade = () => {
    closePaywall();
    blink.auth.login(window.location.origin + '/dashboard');
  };

  return (
    <AnimatePresence>
      {paywallOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9990] bg-black/70 backdrop-blur-sm"
            onClick={closePaywall}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
            className="fixed inset-0 z-[9991] flex items-center justify-center p-4"
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                background: 'linear-gradient(145deg, #0F1A2E 0%, #0D1524 100%)',
                border: '1px solid rgba(13,148,136,0.35)',
                borderRadius: 24,
                maxWidth: 480,
                width: '100%',
                boxShadow: '0 0 0 1px rgba(13,148,136,0.12), 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(13,148,136,0.08)',
                pointerEvents: 'auto',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Gradient accent top */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, #0D9488, #2DD4BF, #818CF8)',
              }} />

              {/* Close */}
              <button
                onClick={closePaywall}
                style={{
                  position: 'absolute', top: 18, right: 18,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#94A3B8',
                }}
              >
                <X size={15} />
              </button>

              <div style={{ padding: '36px 36px 32px' }}>
                {/* Pill + icon */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 18,
                    background: 'rgba(13,148,136,0.15)',
                    border: '1px solid rgba(13,148,136,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 30px rgba(13,148,136,0.2)',
                  }}>
                    <Zap size={28} style={{ color: '#2DD4BF' }} />
                  </div>
                </div>

                {/* Trial badge */}
                {trialDaysLeft > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      color: '#FCD34D',
                      borderRadius: 9999, padding: '5px 14px',
                      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
                    }}>
                      <Clock size={11} />
                      Essai gratuit · {trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''} restant{trialDaysLeft > 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {/* Heading */}
                <h2 style={{
                  textAlign: 'center',
                  fontSize: '1.35rem', fontWeight: 900,
                  color: '#F8FAFC',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.2,
                  margin: '0 0 12px',
                }}>
                  Passez à la vitesse supérieure.
                </h2>
                <p style={{
                  textAlign: 'center',
                  color: '#64748B', fontSize: '0.88rem', lineHeight: 1.65,
                  margin: '0 0 28px',
                  maxWidth: 360, marginLeft: 'auto', marginRight: 'auto',
                }}>
                  Activez votre abonnement pour que votre copilote exécute cette action à votre place.
                </p>

                {/* Features list */}
                <div style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 14, padding: '16px 20px',
                  marginBottom: 24,
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  {FEATURES.map(({ icon: Icon, label }) => (
                    <div key={label} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      fontSize: '0.82rem', color: '#CBD5E1',
                    }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 7,
                        background: 'rgba(13,148,136,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icon size={12} style={{ color: '#2DD4BF' }} />
                      </div>
                      {label}
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={handleUpgrade}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    background: 'linear-gradient(135deg, #0D9488, #14B8A6)',
                    color: '#fff',
                    fontWeight: 800, fontSize: '0.95rem',
                    border: 'none', borderRadius: 14,
                    padding: '15px 24px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 24px rgba(13,148,136,0.4), 0 0 0 1px rgba(13,148,136,0.3)',
                    letterSpacing: '-0.01em',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 32px rgba(13,148,136,0.55), 0 0 0 1px rgba(13,148,136,0.4)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 24px rgba(13,148,136,0.4), 0 0 0 1px rgba(13,148,136,0.3)')}
                >
                  <Zap size={17} />
                  Activer mon abonnement
                  <ArrowRight size={15} />
                </button>

                <p style={{
                  textAlign: 'center', color: '#334155',
                  fontSize: '0.73rem', marginTop: 12,
                }}>
                  Sans engagement · Résiliation à tout moment
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
