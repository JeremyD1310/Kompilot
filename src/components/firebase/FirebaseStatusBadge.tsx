/**
 * FirebaseStatusBadge — Compact badge showing Firebase connection status.
 * Shown in the dashboard topbar when Firebase is configured.
 */
import { Flame } from 'lucide-react';
import { isFirebaseConfigured } from '../../firebase/client';

export function FirebaseStatusBadge() {
  if (!isFirebaseConfigured()) return null;
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50">
      <Flame size={11} className="text-orange-500 animate-pulse" />
      <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wide">
        Firebase Live
      </span>
    </div>
  );
}
