import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@blinkdotnew/ui';
import { X, Rocket } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { TestDriveWizard } from './TestDriveWizard';

const PROGRESS_KEY = 'kompilot_testdrive_progress';
const DISMISS_KEY = 'kompilot_testdrive_dismissed';

export function TestDriveBanner() {
  const { currentPlan } = useSubscription();
  const [dismissed, setDismissed] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [discoveredCount, setDiscoveredCount] = useState(0);

  useEffect(() => {
    const isDismissed = localStorage.getItem(DISMISS_KEY) === 'true';
    setDismissed(isDismissed);

    const saved = localStorage.getItem(PROGRESS_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.discoveredFeatures) {
          setDiscoveredCount(data.discoveredFeatures.length);
        }
      } catch (e) {
        console.error('Error loading test drive progress:', e);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  const handleOpenWizard = () => {
    setWizardOpen(true);
  };

  const handleCloseWizard = () => {
    setWizardOpen(false);
    // Refresh discovered count
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.discoveredFeatures) {
          setDiscoveredCount(data.discoveredFeatures.length);
        }
      } catch (e) {
        console.error('Error loading test drive progress:', e);
      }
    }
  };

  // Only show for free/trial users and if not dismissed
  if (currentPlan.id !== 'free' || dismissed) {
    return null;
  }

  const progressPercent = (discoveredCount / 4) * 100;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
              <Rocket className="w-5 h-5 text-primary" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">Test Drive Kompilot</h3>
                <p className="text-sm text-muted-foreground">
                  {discoveredCount}/4 fonctionnalités découvertes
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-primary to-primary/70"
                  />
                </div>
              </div>

              <Button
                onClick={handleOpenWizard}
                size="sm"
                variant="outline"
                className="mt-2"
              >
                Continuer le Test Drive
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <TestDriveWizard open={wizardOpen} onClose={handleCloseWizard} />
    </>
  );
}
