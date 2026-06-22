import { X, Zap, Lock } from 'lucide-react';
import { Dialog, DialogContent } from '@blinkdotnew/ui';
import { Link } from '@tanstack/react-router';

interface Props {
  open: boolean;
  onClose: () => void;
  moduleTitle?: string;
}

export function AcademyUpgradeModal({ open, onClose, moduleTitle }: Props) {
  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Gradient header */}
        <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 px-8 pt-10 pb-12 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={14} />
          </button>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Lock size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white leading-tight">
            Contenu Masterclass ✨
          </h2>
          <p className="text-sm text-white/80 mt-2 leading-relaxed">
            {moduleTitle
              ? <>«&nbsp;{moduleTitle}&nbsp;» est réservé aux abonnés Business et Franchise.</>
              : 'Ce module est réservé aux abonnés Business et Franchise.'
            }
          </p>
        </div>

        {/* Benefits */}
        <div className="px-8 py-6">
          <p className="text-sm font-bold text-foreground mb-4">
            Avec l'offre Business, vous accédez à :
          </p>
          <ul className="space-y-3">
            {[
              { emoji: '🎬', text: 'Toutes les Masterclass Trends (Reels, TikTok, GEO, IA)' },
              { emoji: '🤖', text: 'Cockpit IA vocal et génération avancée' },
              { emoji: '📈', text: 'Analyses de tendances mises à jour chaque semaine' },
              { emoji: '📍', text: 'Stratégies SEO local et Google Maps avancées' },
              { emoji: '💡', text: 'Recommandations personnalisées selon votre secteur' },
            ].map(item => (
              <li key={item.emoji} className="flex items-start gap-3">
                <span className="text-lg shrink-0">{item.emoji}</span>
                <span className="text-sm text-muted-foreground">{item.text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-2">
            <Link to="/subscription" onClick={onClose}>
              <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold py-3 text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/30">
                <Zap size={15} />
                Passer à l'offre Business
              </button>
            </Link>
            <button
              onClick={onClose}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Continuer avec les modules gratuits
            </button>
          </div>

          <p className="text-center text-[11px] text-muted-foreground mt-3">
            Sans engagement · Annulable à tout moment
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
