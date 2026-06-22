/**
 * EcoModeContext
 *
 * Manages:
 * - Eco/Premium AI mode toggle (halves Level-1 credit costs when active)
 * - Global daily cap: max credits per day (null = unlimited)
 * - Per-category daily caps: independent limits per AI category
 * - Threshold alert: notify user when 80% of monthly plan used
 * - Daily usage tracking (global + per-category) via localStorage
 *
 * How eco mode affects costs:
 *   Level 1 actions (1 credit)  → 0.5 credits in Eco mode
 *   Level 2+ actions             → unchanged (only simple tasks benefit from eco)
 */

import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react';
import { computeDailyRefund, type RefundResult } from '../lib/dailyRefund';

// ── Storage keys ──────────────────────────────────────────────────────────────

const ECO_KEY      = 'kompilot_eco_mode_v1';
const DAILY_KEY    = 'kompilot_daily_usage_v2'; // v2 adds byCategory
const SETTINGS_KEY = 'kompilot_budget_settings_v2'; // v2 adds categoryCaps

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BudgetSettings {
  dailyCap: number | null;
  categoryCaps: Record<string, number | null>;  // per-category daily caps
  thresholdAlert: boolean;
  thresholdEmailSent: boolean;
}

interface DailyUsage {
  date: string;
  used: number;
  byCategory: Record<string, number>; // per-category daily totals
}

interface EcoModeContextValue {
  // Mode
  ecoMode: boolean;
  toggleEcoMode: () => void;
  setEcoMode: (v: boolean) => void;

  // Cost helper
  getEffectiveCost: (baseCost: number) => number;
  ecoMultiplier: number;

  // Global daily cap
  dailyCap: number | null;
  setDailyCap: (cap: number | null) => void;
  dailyUsage: number;
  recordDailyUsage: (n: number, category?: string) => void;
  isDailyCapReached: boolean;
  isDailyCapNearing: boolean; // >= 80% of global cap

  // Per-category daily caps
  categoryCaps: Record<string, number | null>;
  setCategoryCap: (category: string, cap: number | null) => void;
  getCategoryDailyUsage: (category: string) => number;
  isCategoryCapReached: (category: string) => boolean;
  isCategoryCapNearing: (category: string) => boolean; // >= 80% of category cap
  categoryWarnings: string[]; // categories currently at/near their limit

  // Threshold alert
  thresholdAlert: boolean;
  setThresholdAlert: (v: boolean) => void;
  checkThresholdAlert: (usage: number, limit: number) => boolean;

  // Daily refund
  lastRefundResult: RefundResult | null;
  clearRefundResult: () => void;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: BudgetSettings = {
  dailyCap: null,
  categoryCaps: {},
  thresholdAlert: true,
  thresholdEmailSent: false,
};

const EMPTY_DAILY: Omit<DailyUsage, 'date'> = { used: 0, byCategory: {} };

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadSettings(): BudgetSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed, categoryCaps: parsed.categoryCaps ?? {} };
    }
  } catch { /* noop */ }
  return DEFAULT_SETTINGS;
}

function saveSettings(s: BudgetSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

function loadDailyUsage(): DailyUsage {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyUsage;
      if (parsed.date === getTodayStr()) {
        return { ...EMPTY_DAILY, ...parsed, byCategory: parsed.byCategory ?? {} };
      }
    }
  } catch { /* noop */ }
  return { date: getTodayStr(), ...EMPTY_DAILY };
}

function saveDailyUsage(d: DailyUsage) {
  try { localStorage.setItem(DAILY_KEY, JSON.stringify(d)); } catch { /* noop */ }
}

// ── Context ───────────────────────────────────────────────────────────────────

const EcoModeContext = createContext<EcoModeContextValue | null>(null);

export function EcoModeProvider({ children }: { children: ReactNode }) {
  const [ecoMode, setEcoModeState] = useState<boolean>(() => {
    try { return localStorage.getItem(ECO_KEY) === 'true'; } catch { return false; }
  });

  const [settings, setSettings] = useState<BudgetSettings>(loadSettings);
  const [daily, setDaily] = useState<DailyUsage>(loadDailyUsage);
  const [lastRefundResult, setLastRefundResult] = useState<RefundResult | null>(null);

  // Run daily refund once on mount (guarded internally by date key)
  useEffect(() => {
    const result = computeDailyRefund();
    if (result.applied) setLastRefundResult(result);
  }, []);

  const clearRefundResult = useCallback(() => setLastRefundResult(null), []);

  // Reset daily counter if day changed
  useEffect(() => {
    const today = getTodayStr();
    if (daily.date !== today) {
      const fresh: DailyUsage = { date: today, ...EMPTY_DAILY };
      setDaily(fresh);
      saveDailyUsage(fresh);
    }
  }, []); // only on mount; recordDailyUsage also handles mid-day resets

  const ecoMultiplier = ecoMode ? 0.5 : 1.0;

  const getEffectiveCost = useCallback((baseCost: number): number => {
    if (ecoMode && baseCost <= 1) return 0.5;
    return baseCost;
  }, [ecoMode]);

  const toggleEcoMode = useCallback(() => {
    setEcoModeState(prev => {
      const next = !prev;
      try { localStorage.setItem(ECO_KEY, String(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  const setEcoMode = useCallback((v: boolean) => {
    setEcoModeState(v);
    try { localStorage.setItem(ECO_KEY, String(v)); } catch { /* noop */ }
  }, []);

  // ── Global daily cap ───────────────────────────────────────────────────────

  const setDailyCap = useCallback((cap: number | null) => {
    setSettings(prev => {
      const next = { ...prev, dailyCap: cap };
      saveSettings(next);
      return next;
    });
  }, []);

  const recordDailyUsage = useCallback((n: number, category?: string) => {
    const today = getTodayStr();
    setDaily(prev => {
      const base: DailyUsage = prev.date === today
        ? prev
        : { date: today, ...EMPTY_DAILY };
      const nextByCategory = { ...base.byCategory };
      if (category) {
        nextByCategory[category] = (nextByCategory[category] ?? 0) + n;
      }
      const next: DailyUsage = { ...base, used: base.used + n, byCategory: nextByCategory };
      saveDailyUsage(next);
      return next;
    });
  }, []);

  const isDailyCapReached = settings.dailyCap !== null && daily.used >= settings.dailyCap;
  const isDailyCapNearing = !isDailyCapReached
    && settings.dailyCap !== null
    && settings.dailyCap > 0
    && (daily.used / settings.dailyCap) >= 0.8;

  // ── Per-category daily caps ────────────────────────────────────────────────

  const setCategoryCap = useCallback((category: string, cap: number | null) => {
    setSettings(prev => {
      const nextCaps = { ...prev.categoryCaps, [category]: cap };
      // Remove key if cap is null (clean up)
      if (cap === null) delete nextCaps[category];
      const next: BudgetSettings = { ...prev, categoryCaps: nextCaps };
      saveSettings(next);
      return next;
    });
  }, []);

  const getCategoryDailyUsage = useCallback((category: string): number => {
    return daily.byCategory[category] ?? 0;
  }, [daily]);

  const isCategoryCapReached = useCallback((category: string): boolean => {
    const cap = settings.categoryCaps[category];
    if (cap === null || cap === undefined) return false;
    return (daily.byCategory[category] ?? 0) >= cap;
  }, [settings.categoryCaps, daily.byCategory]);

  const isCategoryCapNearing = useCallback((category: string): boolean => {
    const cap = settings.categoryCaps[category];
    if (cap === null || cap === undefined || cap <= 0) return false;
    const used = daily.byCategory[category] ?? 0;
    const pct = used / cap;
    return pct >= 0.8 && pct < 1;
  }, [settings.categoryCaps, daily.byCategory]);

  // Derived: list of categories currently at or near their cap
  const categoryWarnings: string[] = Object.keys(settings.categoryCaps).filter(cat => {
    const cap = settings.categoryCaps[cat];
    if (cap === null || cap === undefined || cap <= 0) return false;
    const used = daily.byCategory[cat] ?? 0;
    return used / cap >= 0.8;
  });

  // ── Threshold alert ────────────────────────────────────────────────────────

  const setThresholdAlert = useCallback((v: boolean) => {
    setSettings(prev => {
      const next = { ...prev, thresholdAlert: v };
      saveSettings(next);
      return next;
    });
  }, []);

  const checkThresholdAlert = useCallback((usage: number, limit: number): boolean => {
    if (!settings.thresholdAlert || settings.thresholdEmailSent) return false;
    if (limit <= 0) return false;
    if (usage / limit >= 0.8) {
      setSettings(prev => {
        const next = { ...prev, thresholdEmailSent: true };
        saveSettings(next);
        return next;
      });
      return true;
    }
    return false;
  }, [settings.thresholdAlert, settings.thresholdEmailSent]);

  return (
    <EcoModeContext.Provider value={{
      ecoMode, toggleEcoMode, setEcoMode,
      getEffectiveCost, ecoMultiplier,
      dailyCap: settings.dailyCap,
      setDailyCap,
      dailyUsage: daily.used,
      recordDailyUsage,
      isDailyCapReached,
      isDailyCapNearing,
      categoryCaps: settings.categoryCaps,
      setCategoryCap,
      getCategoryDailyUsage,
      isCategoryCapReached,
      isCategoryCapNearing,
      categoryWarnings,
      thresholdAlert: settings.thresholdAlert,
      setThresholdAlert,
      checkThresholdAlert,
      lastRefundResult,
      clearRefundResult,
    }}>
      {children}
    </EcoModeContext.Provider>
  );
}

export function useEcoMode() {
  const ctx = useContext(EcoModeContext);
  if (!ctx) { console.warn('useEcoMode must be used within EcoModeProvider' + ' — context missing, returning safe fallback'); return {} as any; }
  return ctx;
}