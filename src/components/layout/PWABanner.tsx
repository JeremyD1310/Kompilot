import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone } from 'lucide-react';

const DISMISSED_KEY = 'pwa_banner_dismissed';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function isDismissed(): boolean {
  const val = localStorage.getItem(DISMISSED_KEY);
  if (!val) return false;
  return Date.now() - parseInt(val, 10) < SEVEN_DAYS;
}

/* ── iOS instructions modal ──────────────────────────────────────────────── */
function IOSModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[201] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-md bg-white rounded-t-2xl p-6 pb-8 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Smartphone size={20} className="text-teal-600" />
            <span className="font-bold text-gray-900 text-base">Installer Kompilot</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {[
            { n: 1, text: 'Appuyez sur Partager ↑ en bas de Safari' },
            { n: 2, text: "Sélectionnez « Sur l'écran d'accueil »" },
            { n: 3, text: "Confirmez en appuyant sur « Ajouter »" },
          ].map(({ n, text }) => (
            <div key={n} className="flex items-center gap-4">
              <span className="shrink-0 w-8 h-8 rounded-full bg-teal-500 text-white font-bold text-sm flex items-center justify-center">
                {n}
              </span>
              <p className="text-gray-700 text-sm leading-snug">{text}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors"
        >
          Fermer
        </button>
      </motion.div>
    </div>
  );
}

/* ── Main banner ─────────────────────────────────────────────────────────── */
export function PWABanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (isDismissed()) return;

    const isMobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
    if (!isMobile) return;

    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsIOS(ios);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (ios) {
      const t = setTimeout(() => setShow(true), 2000);
      return () => { window.removeEventListener('beforeinstallprompt', handler); clearTimeout(t); };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  };

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') dismiss();
      setDeferredPrompt(null);
    } else {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[200] md:hidden"
          >
            <div className="bg-gradient-to-r from-[#0D9488] to-[#0F766E] rounded-t-2xl px-5 pt-4 pb-6 shadow-2xl">
              {/* Dismiss */}
              <button
                onClick={dismiss}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                aria-label="Fermer"
              >
                <X size={16} className="text-white" />
              </button>

              {/* Content */}
              <div className="flex items-start gap-3 mb-4 pr-8">
                <span className="text-2xl shrink-0 mt-0.5">📲</span>
                <div>
                  <p className="text-white font-bold text-sm leading-snug">
                    Ajoutez Kompilot sur votre écran d'accueil en 1 clic !
                  </p>
                  <p className="text-white/75 text-xs mt-1 leading-snug">
                    Accédez instantanément sans chercher le site
                  </p>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={install}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-teal-700 font-bold text-sm shadow-md active:scale-[0.98] transition-transform"
              >
                <Smartphone size={16} />
                Installer l'app →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIOSModal && <IOSModal onClose={() => { setShowIOSModal(false); dismiss(); }} />}
      </AnimatePresence>
    </>
  );
}
