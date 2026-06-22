import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { X, BookOpen, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { blink } from '../../blink/client';

const LS_KEY = 'kompilot_guide_banner_dismissed';

async function loadDismissedFromDB(userId: string): Promise<boolean> {
  try {
    const rows = await blink.db.dailyAnalytics.list({
      where: { userId },
      orderBy: { snapshotDate: 'desc' },
      limit: 1,
    } as any);
    if (!rows || (rows as any[]).length === 0) return false;
    const ext = JSON.parse((rows as any[])[0].extendedData || '{}');
    return ext.welcomeBannerDismissed === true;
  } catch {
    return false;
  }
}

async function saveDismissedToDB(userId: string) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await blink.db.dailyAnalytics.list({
      where: { userId, snapshotDate: today },
      limit: 1,
    } as any);

    if (rows && (rows as any[]).length > 0) {
      const row = (rows as any[])[0];
      const ext = JSON.parse(row.extendedData || '{}');
      ext.welcomeBannerDismissed = true;
      await blink.db.dailyAnalytics.update(row.id, {
        extendedData: JSON.stringify(ext),
      } as any);
    } else {
      await blink.db.dailyAnalytics.create({
        id: `da_welcome_${userId.slice(0, 8)}_${today}`,
        userId,
        establishmentId: 'default',
        snapshotDate: today,
        geoScore: 0,
        unhandledReviews: 0,
        postsPublished: 0,
        reviewsHandled: 0,
        smsSent: 0,
        localVisibility: 0,
        missingKeywords: '[]',
        noshowRevenueCents: 0,
        extendedData: JSON.stringify({ welcomeBannerDismissed: true }),
        createdAt: new Date().toISOString(),
      } as any);
    }
  } catch (e) {
    console.warn('[WelcomeBanner] DB save error:', e);
  }
}

export function WelcomeBanner() {
  const { user } = useAuth();
  const lsKey = user ? `${LS_KEY}_${user.id}` : LS_KEY;

  // Optimistic: check localStorage first (instant UX)
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(lsKey) === '1'; } catch { return false; }
  });
  const [dbChecked, setDbChecked] = useState(false);

  // Then verify DB (cross-device sync)
  useEffect(() => {
    if (!user?.id || dbChecked || dismissed) return;
    loadDismissedFromDB(user.id).then(dbDismissed => {
      setDbChecked(true);
      if (dbDismissed) {
        setDismissed(true);
        try { localStorage.setItem(lsKey, '1'); } catch { /* noop */ }
      }
    });
  }, [user?.id, dbChecked, dismissed, lsKey]);

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(lsKey, '1'); } catch { /* noop */ }
    if (user?.id) saveDismissedToDB(user.id);
  };

  if (dismissed) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
      {/* Icon */}
      <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
        <BookOpen size={14} className="text-primary" />
      </div>

      {/* Text */}
      <p className="flex-1 text-foreground/80 text-xs leading-snug">
        <span className="font-semibold text-foreground">Nouveau ici ?</span>
        {' '}Suivez notre guide de démarrage pour être opérationnel en 2 minutes.
      </p>

      {/* CTA */}
      <Link
        to="/guide"
        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-2 shrink-0"
      >
        Voir le guide <ArrowRight size={12} />
      </Link>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Fermer"
      >
        <X size={13} />
      </button>
    </div>
  );
}
