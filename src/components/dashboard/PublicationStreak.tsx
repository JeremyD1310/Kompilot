/**
 * PublicationStreak — Compteur gamifié de jours d'activité consécutifs.
 *
 * Suit : posts publiés, avis répondus, coupons validés.
 * Persistance : daily_analytics (extendedData.streak) + localStorage comme fallback offline.
 */

import { useState, useEffect, useCallback } from 'react';
import { Flame, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';

/* ── Types ────────────────────────────────────────────────────── */
interface StreakData {
  current:    number;   // jours consécutifs actuels
  best:       number;   // meilleur streak historique
  lastActive: string;   // ISO date YYYY-MM-DD
  totalDays:  number;   // total jours actifs cumulés
}

/* ── Helpers ──────────────────────────────────────────────────── */
const today = () => new Date().toISOString().slice(0, 10);
const yesterday = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const STREAK_KEY = 'kompilot_streak';
const EMPTY: StreakData = { current: 0, best: 0, lastActive: '', totalDays: 0 };

function lsGet(userId?: string): StreakData {
  try {
    const key = userId ? `${STREAK_KEY}_${userId}` : STREAK_KEY;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return EMPTY;
}

function lsSet(data: StreakData, userId?: string) {
  try {
    const key = userId ? `${STREAK_KEY}_${userId}` : STREAK_KEY;
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* noop */ }
}

function computeStreak(prev: StreakData): StreakData {
  const t = today();
  if (prev.lastActive === t) return prev; // already recorded today
  const isConsecutive = prev.lastActive === yesterday();
  const next: StreakData = {
    current:    isConsecutive ? prev.current + 1 : 1,
    best:       Math.max(prev.best, isConsecutive ? prev.current + 1 : 1),
    lastActive: t,
    totalDays:  prev.totalDays + 1,
  };
  return next;
}

/* ── DB helpers ───────────────────────────────────────────────── */
async function loadStreakFromDB(userId: string): Promise<StreakData | null> {
  try {
    const rows = await blink.db.dailyAnalytics.list({
      where: { userId },
      orderBy: { snapshotDate: 'desc' },
      limit: 1,
    } as any);
    if (!rows || (rows as any[]).length === 0) return null;
    const row = (rows as any[])[0];
    const ext = JSON.parse(row.extendedData || '{}');
    if (ext.streak) return ext.streak as StreakData;
    return null;
  } catch {
    return null;
  }
}

async function saveStreakToDB(userId: string, streak: StreakData) {
  try {
    const t = today();
    const rows = await blink.db.dailyAnalytics.list({
      where: { userId, snapshotDate: t },
      limit: 1,
    } as any);

    if (rows && (rows as any[]).length > 0) {
      const row = (rows as any[])[0];
      const ext = JSON.parse(row.extendedData || '{}');
      ext.streak = streak;
      await blink.db.dailyAnalytics.update(row.id, {
        extendedData: JSON.stringify(ext),
      } as any);
    } else {
      // Create minimal snapshot to carry the streak
      await blink.db.dailyAnalytics.create({
        id: `da_streak_${userId.slice(0, 8)}_${t}`,
        userId,
        establishmentId: 'default',
        snapshotDate: t,
        geoScore: 0,
        unhandledReviews: 0,
        postsPublished: 0,
        reviewsHandled: 0,
        smsSent: 0,
        localVisibility: 0,
        missingKeywords: '[]',
        noshowRevenueCents: 0,
        extendedData: JSON.stringify({ streak }),
        createdAt: new Date().toISOString(),
      } as any);
    }
  } catch (e) {
    console.warn('[PublicationStreak] DB save error:', e);
  }
}

/* ── Hook ─────────────────────────────────────────────────────── */
export function useStreak() {
  const { user } = useAuth();
  const userId = user?.id;
  const [streak, setStreak] = useState<StreakData>(() => lsGet(userId));
  const [dbLoaded, setDbLoaded] = useState(false);

  // Load from DB on mount
  useEffect(() => {
    if (!userId || dbLoaded) return;
    loadStreakFromDB(userId).then(dbStreak => {
      setDbLoaded(true);
      if (dbStreak) {
        // Prefer DB value (cross-device) if more recent/better
        const ls = lsGet(userId);
        const best = dbStreak.totalDays >= ls.totalDays ? dbStreak : ls;
        setStreak(best);
        lsSet(best, userId);
      }
    });
  }, [userId, dbLoaded]);

  const record = useCallback(() => {
    setStreak(prev => {
      const next = computeStreak(prev);
      if (next === prev) return prev;
      lsSet(next, userId);
      if (userId) saveStreakToDB(userId, next);
      return next;
    });
  }, [userId]);

  return { streak, record };
}

/* ── Legacy export for backward compat ──────────────────────────── */
export function getStreakData(): StreakData {
  return lsGet();
}

export function recordActivityToday() {
  const data = lsGet();
  const next = computeStreak(data);
  if (next !== data) lsSet(next);
  return next;
}

/* ── Mini chip (sidebar) ────────────────────────────────────────── */
export function StreakChip() {
  const { streak } = useStreak();
  if (streak.current === 0) return null;

  const isOnFire = streak.current >= 7;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black ${
        isOnFire
          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
      }`}
    >
      <Flame className={`w-3 h-3 ${isOnFire ? 'text-orange-500' : 'text-slate-400'}`} />
      <span>{streak.current}j</span>
    </motion.div>
  );
}

/* ── Full widget (dashboard) ────────────────────────────────────── */
export function StreakWidget() {
  const { streak } = useStreak();

  if (streak.current === 0 && streak.totalDays === 0) return null;

  const isOnFire  = streak.current >= 7;
  const isBest    = streak.current === streak.best && streak.best > 0;

  return (
    <div className={`rounded-xl border p-3 flex items-center gap-3 ${
      isOnFire
        ? 'bg-orange-50 dark:bg-orange-900/15 border-orange-200 dark:border-orange-800/40'
        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
    }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        isOnFire ? 'bg-orange-100 dark:bg-orange-900/40' : 'bg-slate-100 dark:bg-slate-800'
      }`}>
        {isOnFire
          ? <Flame className="w-5 h-5 text-orange-500" />
          : <Zap className="w-5 h-5 text-slate-500" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-black text-slate-900 dark:text-white">
            {streak.current === 0 ? 'Reprendre votre streak' : `🔥 ${streak.current} jour${streak.current > 1 ? 's' : ''} actif${streak.current > 1 ? 's' : ''}`}
          </p>
          {isBest && streak.best > 1 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              Record !
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          {streak.current === 0
            ? 'Publiez un post ou répondez à un avis'
            : `Meilleur : ${streak.best}j · Total : ${streak.totalDays}j d'activité`}
        </p>
      </div>

      <div className="text-right shrink-0">
        <TrendingUp className={`w-4 h-4 ${isOnFire ? 'text-orange-400' : 'text-slate-400'}`} />
      </div>
    </div>
  );
}
