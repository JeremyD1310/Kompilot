import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, X, Copy, Check } from 'lucide-react';
import { LinkedinIcon } from '../icons/SocialIcons';
import { useDemoMode } from '../../context/DemoModeContext';

// ── Types ──────────────────────────────────────────────────────────────────────

interface QuickShareButtonProps {
  /** What the user just accomplished (e.g., "généré un post", "audité ma visibilité") */
  actionLabel: string;
  /** Position variant */
  variant?: 'inline' | 'floating';
  /** Optional className for wrapper */
  className?: string;
}

// ── Share text constants ───────────────────────────────────────────────────────

const LINKEDIN_TEXT = `Je viens de tester la démo de Kompilot et le résultat est bluffant.

En moins de 5 minutes, j'ai :
✅ Généré un post optimisé pour mes réseaux sociaux
✅ Obtenu un score de visibilité locale détaillé
✅ Planifié ma semaine de contenu

Kompilot, c'est un cockpit IA pour les commerces et agences qui veulent booster leur présence en ligne — sans y passer des heures.

Kompilot est disponible dès maintenant. Démo gratuite ici 👇
https://www.kompilot.fr

#MarketingLocal #IntelligenceArtificielle #PME #Visibilité`;

const TWITTER_TEXT = `Je viens de tester Kompilot en démo et c'est bluffant 🚀

Un cockpit IA pour gérer :
→ Posts réseaux sociaux (générés par IA)
→ Avis Google (réponses auto)
→ Visibilité locale (score GEO)

Lancement le 7 sept. Essai gratuit 👇
https://www.kompilot.fr

#MarketingLocal #IA`;

const LINKEDIN_SHARE_URL = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://www.kompilot.fr')}`;

const TWITTER_SHARE_URL = `https://x.com/intent/tweet?text=${encodeURIComponent(TWITTER_TEXT)}`;

// ── Share option type ──────────────────────────────────────────────────────────

type ShareOption = 'linkedin' | 'twitter' | 'copy';

// ── Component ──────────────────────────────────────────────────────────────────

export function QuickShareButton({
  actionLabel: _actionLabel,
  variant = 'inline',
  className = '',
}: QuickShareButtonProps) {
  const { isDemoActive } = useDemoMode();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Only render in demo mode
  if (!isDemoActive) return null;

  const handleShare = (option: ShareOption) => {
    switch (option) {
      case 'linkedin':
        window.open(LINKEDIN_SHARE_URL, '_blank', 'noopener,noreferrer');
        setPopoverOpen(false);
        break;
      case 'twitter':
        window.open(TWITTER_SHARE_URL, '_blank', 'noopener,noreferrer');
        setPopoverOpen(false);
        break;
      case 'copy':
        navigator.clipboard.writeText(LINKEDIN_TEXT).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
        break;
    }
  };

  // ── Floating variant: fixed pill at bottom-right ─────────────────────────

  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-20 right-4 z-40 ${className}`}>
        <AnimatePresence>
          {popoverOpen && (
            <motion.div
              className="absolute bottom-full right-0 mb-3 w-72"
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }}
            >
              <SharePopover
                copied={copied}
                onShare={handleShare}
                onClose={() => setPopoverOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setPopoverOpen((p) => !p)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2.5 rounded-full shadow-lg transition-colors"
          aria-expanded={popoverOpen}
          aria-haspopup="true"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm">Partager mon résultat</span>
        </button>
      </div>
    );
  }

  // ── Inline variant: pill button inline ───────────────────────────────────

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setPopoverOpen((p) => !p)}
        className="inline-flex items-center gap-1.5 bg-accent hover:bg-teal-100 text-accent-foreground font-medium px-3 py-1.5 rounded-full text-sm transition-colors border border-teal-200"
        aria-expanded={popoverOpen}
        aria-haspopup="true"
      >
        <Share2 className="w-3.5 h-3.5" />
        Partager mon résultat
      </button>

      <AnimatePresence>
        {popoverOpen && (
          <motion.div
            className="absolute top-full right-0 mt-2 w-72 z-50"
            initial={{ opacity: 0, scale: 0.92, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 4 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }}
          >
            <SharePopover
              copied={copied}
              onShare={handleShare}
              onClose={() => setPopoverOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Share Popover (internal) ───────────────────────────────────────────────────

function SharePopover({
  copied,
  onShare,
  onClose,
}: {
  copied: boolean;
  onShare: (option: ShareOption) => void;
  onClose: () => void;
}) {
  return (
    <div className="bg-background rounded-xl border border-border shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-foreground">
          Partager sur les réseaux
        </p>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Options */}
      <div className="py-1">
        {/* LinkedIn */}
        <button
          onClick={() => onShare('linkedin')}
          className="flex items-center gap-3 w-full px-4 h-12 text-sm text-foreground hover:bg-muted transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center shrink-0">
            <LinkedinIcon className="w-4 h-4 text-[#0A66C2]" />
          </div>
          <span className="font-medium">Partager sur LinkedIn</span>
        </button>

        {/* Twitter / X */}
        <button
          onClick={() => onShare('twitter')}
          className="flex items-center gap-3 w-full px-4 h-12 text-sm text-foreground hover:bg-muted transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-black text-sky-500" aria-hidden="true">𝕏</span>
          </div>
          <span className="font-medium">Partager sur X (Twitter)</span>
        </button>

        {/* Copy */}
        <button
          onClick={() => onShare('copy')}
          className="flex items-center gap-3 w-full px-4 h-12 text-sm text-foreground hover:bg-muted transition-colors"
        >
          {copied ? (
            <>
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-teal-600" />
              </div>
              <span className="font-medium text-teal-600">Copié !</span>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Copy className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="font-medium">Copier le texte LinkedIn</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
