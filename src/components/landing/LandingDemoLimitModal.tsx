/**
 * LandingDemoLimitModal — Shown when an anonymous visitor has used the
 * landing page simulator 2 times.
 *
 * Converts with an urgency-driven copy: acknowledge the demo, offer free signup.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Sparkles, Zap, Star } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

interface LandingDemoLimitModalProps {
  open: boolean;
  onClose: () => void;
}

export function LandingDemoLimitModal({ open, onClose }: LandingDemoLimitModalProps) {
  const navigate = useNavigate();
  const handleSignup = () => {
    onClose();
    navigate({ to: '/signup' });
  };

  const PERKS = [
    { icon: '🤖', text: 'Réponses IA illimitées pendant 14 jours' },
    { icon: '📅', text: 'Calendrier de publication automatisé' },
    { icon: '⭐', text: 'Gestion des avis Google en un clic' },
    { icon: '📊', text: 'Tableau de bord performance en temps réel' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[700] bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed inset-0 z-[701] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Gradient header */}
              <div className="relative bg-gradient-to-br from-primary via-teal-500 to-emerald-400 px-6 pt-8 pb-14">
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center transition-colors"
                  aria-label="Fermer"
                >
                  <X size={13} className="text-white" />
                </button>

                {/* Pulsing icon */}
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-white/30 animate-ping" />
                    <div className="relative w-14 h-14 rounded-2xl bg-white/25 flex items-center justify-center">
                      <Sparkles size={28} className="text-white" />
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-xs font-bold text-white/70 uppercase tracking-widest">
                    🎯 Limite de démo atteinte
                  </p>
                  <h2 className="text-xl font-extrabold text-white leading-tight">
                    Vous avez vu la puissance<br />de Kompilot !
                  </h2>
                  <p className="text-sm text-white/85 leading-relaxed">
                    Créez votre compte gratuit en <strong>30 secondes</strong> et accédez à tout pendant 14 jours.
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="relative -mt-8 px-5 pb-6 space-y-4">
                {/* Perks card */}
                <div className="rounded-2xl border border-border bg-card shadow-lg p-4 space-y-2.5">
                  {PERKS.map((p) => (
                    <div key={p.text} className="flex items-center gap-2.5">
                      <span className="text-base shrink-0">{p.icon}</span>
                      <p className="text-xs font-medium text-foreground/85 leading-snug">{p.text}</p>
                      <div className="ml-auto w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Social proof */}
                <div className="flex items-center justify-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                  ))}
                  <span className="text-[11px] text-muted-foreground ml-1">+1 200 commerçants nous font confiance</span>
                </div>

                {/* Primary CTA */}
                <button
                  onClick={handleSignup}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-600 text-white font-extrabold text-sm py-3.5 transition-all active:scale-[0.98] shadow-lg min-h-[52px]"
                >
                  <Zap size={16} />
                  Créer mon compte gratuit
                  <ArrowRight size={15} />
                </button>

                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  Sans carte bancaire · Essai 14 jours · Annulable à tout moment
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
