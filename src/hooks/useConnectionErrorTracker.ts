import { useState, useCallback } from 'react';

interface ErrorTracker {
  count: number;
  showWhatsApp: boolean;
  recordError: () => void;
  reset: () => void;
}

export function useConnectionErrorTracker(threshold = 2): ErrorTracker {
  const [count, setCount] = useState(0);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  const recordError = useCallback(() => {
    setCount(prev => {
      const next = prev + 1;
      if (next >= threshold) setShowWhatsApp(true);
      return next;
    });
  }, [threshold]);

  const reset = useCallback(() => {
    setCount(0);
    setShowWhatsApp(false);
  }, []);

  return { count, showWhatsApp, recordError, reset };
}
