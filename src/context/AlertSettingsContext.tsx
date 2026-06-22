/**
 * AlertSettingsContext — provides notification settings to all dashboard components
 * so they can conditionally render/hide alert widgets.
 *
 * Usage:
 *   const { settings } = useAlertSettings();
 *   if (!settings.showRaidAlerts) return null;
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useNotificationSettings, type NotificationSettings, DEFAULTS } from '../hooks/useNotificationSettings';
import { useAuth } from '../hooks/useAuth';

interface AlertSettingsCtx {
  settings: NotificationSettings;
  isLoading: boolean;
}

const AlertSettingsContext = createContext<AlertSettingsCtx>({
  settings: DEFAULTS,
  isLoading: false,
});

export function AlertSettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { settings, isLoading } = useNotificationSettings(user?.id);
  return (
    <AlertSettingsContext.Provider value={{ settings, isLoading }}>
      {children}
    </AlertSettingsContext.Provider>
  );
}

export function useAlertSettings(): AlertSettingsCtx {
  return useContext(AlertSettingsContext);
}
