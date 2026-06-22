import { type ReactElement } from 'react';
import { Link } from '@tanstack/react-router';
import { Sparkles, Star, ArrowRight, Rocket } from 'lucide-react';
import { useOnboardingProfile } from '../../hooks/useOnboardingProfile';
import { useEstablishment } from '../../context/EstablishmentContext';

/**
 * Smart contextual banner shown at the top of the Dashboard.
 * Content adapts based on the user's selected onboarding objectives.
 */
export function ObjectiveBanner() {
  const profile = useOnboardingProfile();
  const { activeEstablishment } = useEstablishment();

  // Nothing to show if profile not loaded or no objectives
  if (!profile || profile.objectives.length === 0) return null;

  const obs = profile.objectives;
  const allSelected = obs.length >= 4; // all 4 objectives
  const hasReviews = obs.includes('reviews');
  const hasIdeas = obs.includes('ideas');

  // ── ALL objectives selected ───────────────────────────────────────────────
  if (allSelected) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/8 via-primary/4 to-transparent px-5 py-4">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Rocket size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Voyons grand !</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            Kompilot est prêt à booster <span className="font-semibold text-foreground">toute votre stratégie</span> — publications, avis, visibilité et bien plus.
          </p>
        </div>
        <span className="text-2xl shrink-0">🚀</span>
      </div>
    );
  }

  // ── Multiple banners (render up to 2 most relevant) ───────────────────────
  const banners: ReactElement[] = [];

  if (hasReviews) {
    banners.push(
      <div key="reviews" className="flex items-center gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-5 py-4">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <Star size={18} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-900">
            {(activeEstablishment?.pendingReviews ?? 0) > 0
              ? `${activeEstablishment!.pendingReviews} avis Google à traiter`
              : 'Avis Google en attente de réponse'}
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            Répondez rapidement pour améliorer votre réputation locale.
          </p>
        </div>
        <Link
          to="/inbox"
          className="flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors shrink-0 rounded-xl bg-amber-100 hover:bg-amber-200 px-3 py-1.5"
        >
          Voir les avis <ArrowRight size={12} />
        </Link>
      </div>
    );
  }

  if (hasIdeas) {
    banners.push(
      <div key="ideas" className="flex items-center gap-3 rounded-2xl border border-violet-300/60 bg-violet-50 px-5 py-4">
        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <Sparkles size={18} className="text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-violet-900">Générez vos idées de posts avec l'IA</p>
          <p className="text-xs text-violet-700 mt-0.5">
            Décrivez votre idée en une phrase et laissez l'IA créer le contenu parfait.
          </p>
        </div>
        <Link
          to="/calendar"
          className="flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-900 transition-colors shrink-0 rounded-xl bg-violet-100 hover:bg-violet-200 px-3 py-1.5"
        >
          Créer un post <ArrowRight size={12} />
        </Link>
      </div>
    );
  }

  // Generic banner for other objectives (time / visibility)
  if (banners.length === 0) {
    banners.push(
      <div key="generic" className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Rocket size={18} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Votre espace est prêt 🎯</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Commencez dès maintenant à planifier vos publications et suivre vos performances.
          </p>
        </div>
      </div>
    );
  }

  if (banners.length === 0) return null;

  return <div className="space-y-3">{banners}</div>;
}
