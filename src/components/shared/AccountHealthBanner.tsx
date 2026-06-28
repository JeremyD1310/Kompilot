/**
 * AccountHealthBanner — Discreet but incitative banner shown when the account
 * is detected as "Incomplete/Blocked" (0 connected APIs after 48h).
 *
 * Invites the user to book a 1-click unlock call.
 * Uses useTelemetry to track impressions and CTA clicks for Valentine's team.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Phone, X, Clock } from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { useIntegrationStatus } from '../../context/IntegrationStatusContext';
import { useTelemetry } from '../../hooks/useTelemetry';

export function AccountHealthBanner() {
  const { isAccountIncomplete, connectedCount, dismissIncompleteBanner } = useIntegrationStatus();
  const track = useTelemetry();
  const [visible, setVisible] = useState(false);

  // Show with a slight delay to avoid flash on fast connections
  useEffect(() => {
    if (isAccountIncomplete) {
      const timer = setTimeout(() => {
        setVisible(true);
        track('account_health_banner_viewed', { connectedCount });
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isAccountIncomplete, connectedCount, track]);

  const handleDismiss = () => {
    setVisible(false);
    dismissIncompleteBanner();
  };

  const handleBookCall = () => {
    track('account_health_banner_cta_clicked', { action: 'book_call' });
    // Open Calendly or booking link in a new tab
    window.open('https://cal.com/kompilot/demolive', '_blank');
    toast.success('Redirection vers la prise de rendez-vous', {
      description: 'Un expert vous accompagnera pour débloquer votre compte.',
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-xl px-4 py-3"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(239,68,68,0.06) 100%)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            {/* Icon */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(245,158,11,0.12)' }}>
                <AlertCircle size={18} color="#f59e0b" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: '#fbbf24' }}>
                  Votre compte semble incomplet
                </p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#94a3b8' }}>
                  Aucune API connectée après 48h. Un expert peut vous débloquer en 15 minutes.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Button
                size="sm"
                onClick={handleBookCall}
                className="gap-1.5 text-xs font-semibold flex-1 sm:flex-initial"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: 'none',
                  color: '#fff',
                }}
              >
                <Phone size={12} /> Réserver un appel
              </Button>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-white/5"
                style={{ color: '#64748B' }}
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
