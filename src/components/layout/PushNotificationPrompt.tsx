/**
 * PushNotificationPrompt — Non-intrusive banner that asks the user to enable
 * browser push notifications. Appears once; dismiss persists in localStorage.
 */
import { Bell, BellOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export function PushNotificationPrompt() {
  const { shouldShowPrompt, requestPermission, dismissPrompt, isLoading } = usePushNotifications();

  if (!shouldShowPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-20 left-4 z-50 max-w-sm"
      >
        <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Activer les notifications</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Recevez des alertes en temps réel : nouveaux avis, messages inbox, et mises à jour importantes.
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={requestPermission}
                disabled={isLoading}
                className="text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? 'Activation...' : 'Activer'}
              </button>
              <button
                onClick={dismissPrompt}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 cursor-pointer"
              >
                Plus tard
              </button>
            </div>
          </div>
          <button
            onClick={dismissPrompt}
            className="text-muted-foreground/50 hover:text-foreground transition-colors shrink-0 p-0.5 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
