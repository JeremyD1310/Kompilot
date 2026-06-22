import { useState, useEffect } from 'react';
import { X, Trophy } from 'lucide-react';
import { getWeeklyActivity, getCurrentWeek } from '../../lib/weeklyActivity';
import { useAuth } from '../../hooks/useAuth';

const DISMISSED_PREFIX = 'kompilot_weekly_praise_dismissed_';

interface Props {
  /** Also show when demo mode is active, even with no real activity */
  forceShow?: boolean;
}

export function WeeklyPraiseBanner({ forceShow = false }: Props) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);

  const firstName = user?.displayName?.split(' ')[0] ?? '';
  const currentWeek = getCurrentWeek();
  const dismissKey = DISMISSED_PREFIX + currentWeek;

  useEffect(() => {
    // Check if already dismissed this week
    if (localStorage.getItem(dismissKey)) return;

    if (forceShow) {
      // Demo mode: always show
      setVisible(true);
      return;
    }

    // Check real activity
    const activity = getWeeklyActivity();
    if (activity.posts >= 1 || activity.reviewsAnswered >= 1) {
      setVisible(true);
    }
  }, [forceShow, dismissKey]);

  const handleDismiss = () => {
    setHiding(true);
    setTimeout(() => {
      localStorage.setItem(dismissKey, '1');
      setVisible(false);
      setHiding(false);
    }, 350);
  };

  if (!visible) return null;

  const activity = forceShow
    ? { posts: 3, reviewsAnswered: 5 }
    : getWeeklyActivity();

  // Build dynamic message based on what was done
  const hasReviews = activity.reviewsAnswered >= 1 || forceShow;
  const postCount = forceShow ? 3 : activity.posts;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-amber-300/60 transition-all duration-350 ${
        hiding ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
      }`}
      style={{
        background: 'linear-gradient(135deg, #fef9ee 0%, #fffbf0 50%, #fef3c7 100%)',
        animation: 'nc-banner-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      }}
    >
      {/* Subtle glow blobs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-8 w-20 h-20 bg-yellow-300/15 rounded-full blur-xl pointer-events-none" />

      <div className="relative flex items-start gap-4 px-5 py-4">
        {/* Trophy icon */}
        <div
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shrink-0 shadow-sm"
          style={{ animation: 'nc-trophy-pulse 2s ease-in-out infinite' }}
        >
          <Trophy size={22} className="text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-amber-900 mb-0.5">
            🏆 Vous assurez{name(firstName)} !
          </p>
          <p className="text-xs text-amber-800 leading-relaxed">
            {hasReviews && postCount >= 1 ? (
              <>
                Cette semaine, vous avez publié{' '}
                <strong>{postCount} fois</strong> et répondu à tous vos avis clients.{' '}
              </>
            ) : postCount >= 1 ? (
              <>Cette semaine, vous avez publié <strong>{postCount} fois</strong>. </>
            ) : (
              <>Vous avez répondu à tous vos avis clients cette semaine. </>
            )}
            Vos efforts payent : votre visibilité est en hausse constante.{' '}
            <span className="font-semibold">Toute l'équipe de Kompilot vous félicite pour votre régularité !</span>
          </p>

          {/* Activity pills */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {postCount >= 1 && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-200/60 text-amber-800 border border-amber-300/50 rounded-full px-2 py-0.5">
                📝 {postCount} publication{postCount > 1 ? 's' : ''} cette semaine
              </span>
            )}
            {hasReviews && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 border border-green-300/50 rounded-full px-2 py-0.5">
                ✅ Avis traités
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-300/50 rounded-full px-2 py-0.5">
              📈 Visibilité en hausse
            </span>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="shrink-0 text-amber-400 hover:text-amber-700 transition-colors mt-0.5"
          aria-label="Fermer"
        >
          <X size={15} />
        </button>
      </div>

      <style>{`
        @keyframes nc-banner-in {
          0%   { opacity: 0; transform: translateY(-10px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes nc-trophy-pulse {
          0%, 100% { transform: rotate(-5deg) scale(1); }
          50%       { transform: rotate(5deg) scale(1.08); }
        }
      `}</style>
    </div>
  );
}

function name(firstName: string): string {
  return firstName ? `, ${firstName}` : '';
}
