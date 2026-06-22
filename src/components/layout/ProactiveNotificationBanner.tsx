/**
 * ProactiveNotificationBanner
 * Shows dismissable AI-generated alerts at the top of the dashboard
 * when certain inactivity thresholds are detected.
 */
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface Alert {
  id: string;
  icon: string;
  message: string;
  cta: string;
  ctaHref: string;
  severity: 'warning' | 'info';
}

export function ProactiveNotificationBanner() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newAlerts: Alert[] = [];

    // Check last post date
    const lastPostDate = localStorage.getItem('last_post_date');
    const daysSincePost = lastPostDate
      ? Math.floor((Date.now() - new Date(lastPostDate).getTime()) / (1000 * 60 * 60 * 24))
      : 5; // Default: assume 5 days to show the alert on first visit

    if (daysSincePost >= 4) {
      newAlerts.push({
        id: 'no-post',
        icon: '🤖',
        message: `Aucune publication depuis ${daysSincePost >= 5 ? '+4' : daysSincePost} jours ! Vos futurs clients vous cherchent sur ChatGPT et Google Maps.`,
        cta: 'Créer un post maintenant',
        ctaHref: '/calendar',
        severity: 'warning',
      });
    }

    // Check unread reviews (default 3 to demo the feature)
    const unreadReviews = parseInt(localStorage.getItem('unread_reviews_count') || '3', 10);
    if (unreadReviews > 0) {
      newAlerts.push({
        id: 'unread-reviews',
        icon: '⭐',
        message: `${unreadReviews} avis Google sans réponse. Répondre sous 24h améliore votre note de +0.3 point.`,
        cta: 'Répondre maintenant',
        ctaHref: '/inbox',
        severity: 'info',
      });
    }

    setAlerts(newAlerts);
  }, []);

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));
  if (visibleAlerts.length === 0) return null;

  const alert = visibleAlerts[0];

  const severityClass =
    alert.severity === 'warning'
      ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800/50 dark:text-amber-200'
      : 'bg-teal-50 border-teal-200 text-teal-900 dark:bg-teal-950/30 dark:border-teal-800/50 dark:text-teal-200';

  const ctaClass =
    alert.severity === 'warning'
      ? 'border-amber-400 bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200'
      : 'border-teal-400 bg-teal-100 hover:bg-teal-200 text-teal-900 dark:bg-teal-900/30 dark:border-teal-700 dark:text-teal-200';

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b ${severityClass}`}>
      <span className="text-base shrink-0">{alert.icon}</span>
      <p className="flex-1 text-xs font-medium min-w-0">{alert.message}</p>
      {visibleAlerts.length > 1 && (
        <span className="text-[10px] opacity-60 shrink-0 hidden sm:block">
          +{visibleAlerts.length - 1} autre(s)
        </span>
      )}
      <Link
        to={alert.ctaHref as any}
        className={`shrink-0 text-[11px] font-bold px-3 py-1 rounded-lg border transition-colors ${ctaClass}`}
      >
        {alert.cta} →
      </Link>
      <button
        onClick={() => setDismissed((prev) => new Set([...prev, alert.id]))}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity p-1 rounded"
        aria-label="Ignorer cette notification"
      >
        <X size={13} />
      </button>
    </div>
  );
}
