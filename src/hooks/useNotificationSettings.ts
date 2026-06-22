/**
 * useNotificationSettings — Manages per-user alert visibility preferences
 * stored in the `user_notification_settings` table.
 *
 * Each boolean controls whether a specific alert widget is rendered on the
 * dashboard. If disabled, the corresponding alert is silently hidden.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { blink } from '../blink/client';

export interface NotificationSettings {
  showGeoAlerts: boolean;      // Semantic voice-share drop alerts
  showStripeAlerts: boolean;   // Payment failures, disputes, payout thresholds
  showSmsAlerts: boolean;      // Low SMS balance (< 10 SMS)
  showRaidAlerts: boolean;     // Suspicious review wave / spam detection
  showLeadAlerts: boolean;     // New captured leads notifications
  applyToSubAccounts: boolean; // Agency: inherit config to new sub-accounts
}

export const DEFAULTS: NotificationSettings = {
  showGeoAlerts: true,
  showStripeAlerts: true,
  showSmsAlerts: true,
  showRaidAlerts: true,
  showLeadAlerts: true,
  applyToSubAccounts: false,
};

const LS_KEY = 'kompilot_notif_settings';

function fromDB(row: Record<string, unknown>): NotificationSettings {
  const n = (v: unknown) => Number(v) > 0;
  return {
    showGeoAlerts:      n(row.showGeoAlerts ?? row.show_geo_alerts ?? 1),
    showStripeAlerts:   n(row.showStripeAlerts ?? row.show_stripe_alerts ?? 1),
    showSmsAlerts:      n(row.showSmsAlerts ?? row.show_sms_alerts ?? 1),
    showRaidAlerts:     n(row.showRaidAlerts ?? row.show_raid_alerts ?? 1),
    showLeadAlerts:     n(row.showLeadAlerts ?? row.show_lead_alerts ?? 1),
    applyToSubAccounts: n(row.applyToSubAccounts ?? row.apply_to_sub_accounts ?? 0),
  };
}

function toDB(s: NotificationSettings) {
  return {
    showGeoAlerts:      s.showGeoAlerts      ? 1 : 0,
    showStripeAlerts:   s.showStripeAlerts   ? 1 : 0,
    showSmsAlerts:      s.showSmsAlerts      ? 1 : 0,
    showRaidAlerts:     s.showRaidAlerts     ? 1 : 0,
    showLeadAlerts:     s.showLeadAlerts     ? 1 : 0,
    applyToSubAccounts: s.applyToSubAccounts ? 1 : 0,
  };
}

export function useNotificationSettings(userId: string | undefined) {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    // Try to load from localStorage for immediate render
    try {
      const cached = localStorage.getItem(LS_KEY);
      if (cached) return { ...DEFAULTS, ...JSON.parse(cached) };
    } catch { /* ignore */ }
    return DEFAULTS;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings from DB on mount
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const rows = await blink.db.userNotificationSettings.list({
          where: { userId },
          limit: 1,
        });
        if (rows && rows.length > 0) {
          const parsed = fromDB(rows[0] as Record<string, unknown>);
          setSettings(parsed);
          try { localStorage.setItem(LS_KEY, JSON.stringify(parsed)); } catch { /* ignore */ }
        }
      } catch (err) {
        console.warn('[useNotificationSettings] DB fetch failed, using defaults', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [userId]);

  // Persist a change to DB (debounced 400ms to batch rapid toggles)
  const persistSettings = useCallback(async (next: NotificationSettings, uid: string) => {
    try {
      // localStorage first for instant read
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }

      const rows = await blink.db.userNotificationSettings.list({
        where: { userId: uid },
        limit: 1,
      });

      if (rows && rows.length > 0) {
        await blink.db.userNotificationSettings.update(
          (rows[0] as { id: string }).id,
          { ...toDB(next), updatedAt: new Date().toISOString() }
        );
      } else {
        await blink.db.userNotificationSettings.create({
          userId: uid,
          ...toDB(next),
        });
      }
    } catch (err) {
      console.error('[useNotificationSettings] persist failed', err);
    }
  }, []);

  // Debounced save: update local state immediately, write to DB after 400ms
  const updateSetting = useCallback(
    (key: keyof NotificationSettings, value: boolean) => {
      if (!userId) return;

      setSettings(prev => {
        const next = { ...prev, [key]: value };
        // Debounce DB write
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(async () => {
          setIsSaving(true);
          await persistSettings(next, userId);
          setIsSaving(false);
        }, 400);
        return next;
      });
    },
    [userId, persistSettings]
  );

  // Bulk update (used by "apply to sub-accounts" action)
  const updateAll = useCallback(
    async (next: Partial<NotificationSettings>) => {
      if (!userId) return;
      setSettings(prev => {
        const merged = { ...prev, ...next };
        try { localStorage.setItem(LS_KEY, JSON.stringify(merged)); } catch { /* ignore */ }
        setIsSaving(true);
        persistSettings(merged, userId).finally(() => setIsSaving(false));
        return merged;
      });
    },
    [userId, persistSettings]
  );

  return { settings, isLoading, isSaving, updateSetting, updateAll };
}
