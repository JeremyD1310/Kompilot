import { useState } from 'react';
import { MessageCircle, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WhatsAppSupportButtonProps {
  variant: 'floating' | 'error-banner';
  errorContext?: string;
  userId?: string;
  className?: string;
}

const WHATSAPP_NUMBER = '33600000000';
const SUPPORT_HOURS = 'Lun-Ven 9h-18h';

function buildWhatsAppUrl(context: string, userId?: string) {
  const message = encodeURIComponent(
    `Bonjour, j'ai besoin d'aide pour ${context} sur mon compte Kompilot${userId ? ` [ID: ${userId}]` : ''}. Pouvez-vous m'aider ?`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
}

export function WhatsAppSupportButton({
  variant,
  errorContext = 'connecter mes réseaux sociaux',
  userId,
  className = '',
}: WhatsAppSupportButtonProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed && variant === 'error-banner') return null;

  if (variant === 'floating') {
    return (
      <motion.a
        href={buildWhatsAppUrl('utiliser Kompilot', userId)}
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-24 right-4 z-[150] flex items-center justify-center bg-[#25D366] hover:bg-[#22bf5b] text-white rounded-full shadow-lg shadow-[#25D366]/30 transition-colors ${className}`}
        title="Aide en direct sur WhatsApp"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 3, type: 'spring', stiffness: 260, damping: 20 }}
      >
        <div className="w-12 h-12 flex items-center justify-center">
          <MessageCircle className="w-6 h-6 fill-white" />
        </div>
      </motion.a>
    );
  }

  // error-banner variant
  return (
    <AnimatePresence>
      <motion.div
        className="rounded-2xl bg-gradient-to-r from-[#25D366] to-[#128C7E] p-4 text-white relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-3 h-3" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <MessageCircle className="w-7 h-7 fill-white" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <p className="font-bold text-sm">Besoin d'aide en direct ?</p>
            <p className="text-xs text-white/85 mt-0.5 leading-relaxed">
              Notre équipe vous guide pas à pas pour {errorContext}
            </p>
            <div className="flex items-center gap-1 mt-1 text-white/70 text-xs">
              <Clock className="w-3 h-3 shrink-0" />
              <span>{SUPPORT_HOURS}</span>
            </div>
          </div>
        </div>

        <a
          href={buildWhatsAppUrl(errorContext, userId)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 w-full bg-white text-[#128C7E] font-bold text-sm rounded-xl py-3 hover:bg-white/90 active:scale-[0.98] transition-all"
        >
          <MessageCircle className="w-4 h-4 fill-[#25D366] text-[#25D366]" />
          💬 Être aidé en direct sur WhatsApp
        </a>
      </motion.div>
    </AnimatePresence>
  );
}
