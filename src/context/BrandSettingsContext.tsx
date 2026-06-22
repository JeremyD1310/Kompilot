/**
 * BrandSettingsContext — stores brand identity settings (colors, handles, toggles).
 * Persisted in localStorage. Business name resolved from EstablishmentContext.
 * Also stores default typography style for agency white-label enforcement.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useEstablishment } from './EstablishmentContext';
import type { BrandSettings } from '../lib/brandImageProcessor';
import { applyBrandBanner } from '../lib/brandImageProcessor';
import { DEFAULT_TEXT_STYLE, type TextStyle } from '../lib/typographyStyles';

// ── Re-export for convenience ──────────────────────────────────────────────────
export type { BrandSettings };

// Settings stored (without businessName — resolved at runtime from establishment)
export type StoredBrandSettings = Omit<BrandSettings, 'businessName'>;

interface BrandSettingsContextType {
  stored: StoredBrandSettings;
  update: (patch: Partial<StoredBrandSettings>) => void;
  /** Full resolved settings (includes businessName from active establishment) */
  resolved: BrandSettings;
  /** Process an image URL through the brand banner pipeline */
  process: (imageUrl: string) => Promise<string>;
  /** Brand default typography style (for agency white-label font enforcement) */
  brandTextStyle: TextStyle;
  setBrandTextStyle: (style: TextStyle) => void;
}

const STORAGE_KEY      = 'nc_brand_v1';
const TYPO_STORAGE_KEY = 'nc_brand_typo_v1';

export const DEFAULT_BRAND: StoredBrandSettings = {
  enabled: true,
  primaryColor: '#0D1B2A',
  secondaryColor: '#C9A84C',
  instagramHandle: '',
  phone: '',
  showGoogleBadge: true,
  showCarouselStripe: true,
};

// ── Preset palettes ────────────────────────────────────────────────────────────

export interface BrandPalette {
  id: string;
  label: string;
  emoji: string;
  primary: string;
  secondary: string;
}

export const BRAND_PALETTES: BrandPalette[] = [
  { id: 'noir-dore',   label: 'Noir & Doré',       emoji: '🖤',  primary: '#0D0D0D', secondary: '#C9A84C' },
  { id: 'marine-dore', label: 'Marine & Or',        emoji: '🔵',  primary: '#1B3A5C', secondary: '#F0D080' },
  { id: 'violet-rose', label: 'Violet & Rose',      emoji: '💜',  primary: '#3B0764', secondary: '#F9A8D4' },
  { id: 'vert-creme',  label: 'Vert & Crème',       emoji: '🌿',  primary: '#14532D', secondary: '#FEF3C7' },
  { id: 'rouge-beige', label: 'Bordeaux & Beige',   emoji: '🍷',  primary: '#7C2D12', secondary: '#F5F0E8' },
  { id: 'gris-terra',  label: 'Gris & Terracotta',  emoji: '🏺',  primary: '#1F2937', secondary: '#C2623F' },
  { id: 'blanc-teal',  label: 'Minuit & Teal',      emoji: '🩵',  primary: '#0F172A', secondary: '#2DD4BF' },
  { id: 'noir-jaune',  label: 'Noir & Jaune',       emoji: '⚡',  primary: '#111827', secondary: '#FBBF24' },
];

// ── Context ────────────────────────────────────────────────────────────────────

const BrandSettingsContext = createContext<BrandSettingsContextType | undefined>(undefined);

export function BrandSettingsProvider({ children }: { children: React.ReactNode }) {
  const { activeEstablishment } = useEstablishment();

  const [stored, setStored] = useState<StoredBrandSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_BRAND, ...JSON.parse(raw) } : DEFAULT_BRAND;
    } catch {
      return DEFAULT_BRAND;
    }
  });

  // Brand-default typography (persisted per agency account)
  const [brandTextStyle, setBrandTextStyleState] = useState<TextStyle>(() => {
    try {
      const raw = localStorage.getItem(TYPO_STORAGE_KEY);
      return raw ? { ...DEFAULT_TEXT_STYLE, ...JSON.parse(raw) } : DEFAULT_TEXT_STYLE;
    } catch {
      return DEFAULT_TEXT_STYLE;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stored)); } catch { /* quota */ }
  }, [stored]);

  useEffect(() => {
    try { localStorage.setItem(TYPO_STORAGE_KEY, JSON.stringify(brandTextStyle)); } catch { /* quota */ }
  }, [brandTextStyle]);

  const update = useCallback((patch: Partial<StoredBrandSettings>) => {
    setStored(prev => ({ ...prev, ...patch }));
  }, []);

  const setBrandTextStyle = useCallback((style: TextStyle) => {
    setBrandTextStyleState(style);
  }, []);

  const resolved: BrandSettings = {
    ...stored,
    businessName: activeEstablishment?.name || 'Mon Commerce',
  };

  const process = useCallback(
    (imageUrl: string) => applyBrandBanner(imageUrl, resolved),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stored, activeEstablishment?.name]
  );

  return (
    <BrandSettingsContext.Provider value={{ stored, update, resolved, process, brandTextStyle, setBrandTextStyle }}>
      {children}
    </BrandSettingsContext.Provider>
  );
}

export function useBrandSettings() {
  const ctx = useContext(BrandSettingsContext);
  if (!ctx) throw new Error('useBrandSettings must be inside BrandSettingsProvider');
  return ctx;
}
