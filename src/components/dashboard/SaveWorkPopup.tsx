import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import { Save, X, Shield } from 'lucide-react';
import { useDemoMode } from '../../context/DemoModeContext';

const DISMISSED_KEY = 'kompilot_savework_dismissed';

export function SaveWorkPopup() {
  const { demoActionCount, isDemoActive } = useDemoMode();
  const navigate = useNavigate();

  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [rgpdChecked, setRgpdChecked] = useState(false);
  const [rgpdError, setRgpdError] = useState(false);

  const visible = isDemoActive && demoActionCount >= 3 && !dismissed;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // noop — sessionStorage may be unavailable
    }
  };

  const handleSignup = () => {
    if (!rgpdChecked) {
      setRgpdError(true);
      return;
    }
    setRgpdError(false);
    handleDismiss();
    navigate({ to: '/signup' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header — green success icon + title */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mb-3">
                <Save className="w-6 h-6 text-teal-600" />
              </div>
              <h2 className="text-lg font-semibold text-foreground leading-snug">
                Vous venez de créer quelque chose d&apos;utile
              </h2>
            </div>

            {/* Body paragraph */}
            <p className="text-sm text-muted-foreground text-center mb-5 leading-relaxed">
              En quelques minutes de démo, vous avez déjà généré du contenu, répondu
              à un avis et planifié une publication. Tout ce travail mérite d&apos;être
              sauvegardé — et c&apos;est exactement ce que fait Kompilot chaque jour pour
              plus de 120 professionnels.
            </p>

            {/* RGPD consent checkbox */}
            <div className="mb-5">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-colors cursor-pointer ${
                  rgpdError
                    ? 'border-red-500 bg-red-50'
                    : 'border-border hover:border-teal-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={rgpdChecked}
                  onChange={(e) => {
                    setRgpdChecked(e.target.checked);
                    if (e.target.checked) setRgpdError(false);
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded accent-teal-600"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  En cochant cette case, j&apos;accepte de recevoir des conseils
                  d&apos;optimisation marketing et des communications produit de la part
                  de Kompilot. Je peux me désinscrire à tout moment.{' '}
                  <a
                    href="/legal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:underline font-medium whitespace-nowrap"
                  >
                    Politique de confidentialité →
                  </a>
                </span>
              </label>
              {rgpdError && (
                <p className="text-red-500 text-xs mt-1.5 ml-1">
                  Veuillez accepter la politique de confidentialité pour continuer.
                </p>
              )}
            </div>

            {/* Primary CTA — navigates to /signup */}
            <button
              onClick={handleSignup}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors mb-3"
            >
              <Shield className="w-4 h-4" />
              Sauvegarder mon travail → Créer mon compte
            </button>

            {/* Secondary — dismiss */}
            <button
              onClick={handleDismiss}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
            >
              Continuer la démo
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
