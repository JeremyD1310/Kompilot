/**
 * AgentUpsellModal — Premium overlay when a Junior-tier user clicks a Senior feature.
 *
 * Appears when user tries to access:
 * - Visual generation (Square/Vertical)
 * - Auto-publish via API toggle
 *
 * Design: dark #0B0B0C bg, amber #FF6B00 glow accent, glassmorphism card.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Image, Send, Zap, CheckCircle2 } from 'lucide-react';

interface AgentUpsellModalProps {
  open: boolean;
  onClose: () => void;
  agentName: string;
  price?: string;
  feature?: string;
  onConfirm?: () => void;
}

export function AgentUpsellModal({
  open,
  onClose,
  agentName,
  price = 'Disponible selon l’offre Agency',
  feature = 'la préparation de publications validées et la génération de visuels personnalisés',
  onConfirm,
}: AgentUpsellModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[800] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-[801] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-[440px] rounded-2xl overflow-hidden relative"
              style={{ background: '#0B0B0C', border: '1px solid rgba(255,107,0,.15)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Glow accent */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center top, rgba(255,107,0,.12) 0%, transparent 70%)',
                }}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors z-10"
              >
                <X size={13} className="text-slate-400" />
              </button>

              {/* Content */}
              <div className="relative px-7 pt-8 pb-7 text-center">
                {/* Icon */}
                <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,107,0,.15), rgba(255,107,0,.05))',
                    border: '1px solid rgba(255,107,0,.2)',
                    boxShadow: '0 0 40px rgba(255,107,0,.1)',
                  }}
                >
                  <Sparkles size={24} style={{ color: '#FF6B00' }} />
                </div>

                {/* Title */}
                <h3 className="text-lg font-black text-white leading-tight mb-2">
                  Promouvoir {agentName} au rang
                  <br />
                  <span style={{ color: '#FF6B00' }}>Senior</span>
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-[340px] mx-auto">
                  Débloquez <strong className="text-white">{feature}</strong> pour {agentName}.
                </p>

                {/* Features list */}
                <div className="space-y-2.5 text-left mb-6">
                  {[
                    { icon: Image, text: 'Génération de visuels automatiques à votre charte' },
                    { icon: Send, text: 'Publication multi-canal directe (LinkedIn, Instagram, Facebook, X)' },
                    { icon: Zap, text: 'Priorité IA avancée — résultats plus rapides et qualitatifs' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-start gap-3 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.05)' }}>
                      <CheckCircle2 size={14} style={{ color: '#FF6B00' }} className="shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-300 leading-snug">{text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => { onConfirm?.(); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #FF6B00, #FF8C40)',
                    boxShadow: '0 0 30px rgba(255,107,0,.25), 0 4px 16px rgba(255,107,0,.2)',
                  }}
                >
                  <Sparkles size={15} />
                  Confirmer la promotion — {price}
                </button>

                {/* Micro-copy */}
                <p className="text-[10px] text-slate-500 mt-3">
                  Sans engagement · Résiliable en 1 clic · Facturation mensuelle
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
