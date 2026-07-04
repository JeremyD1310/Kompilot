/**
 * HybridLocalScan — Module 1: Onboarding Hybride & Scan Localisé
 *
 * 3-step immersive flow:
 *   Step 1 — Sector selector + city input + partner preview
 *   Step 2 — 35-second deep scan corridor with semantic progress messages
 *   Step 3 — Hybrid lead dashboard with blurred contacts + paywall
 *
 * Self-contained component: all state managed internally via React hooks.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Search, Zap, Lock, Shield, Check, ChevronRight, Globe,
  Eye, EyeOff, Mail, Phone, Building2, Star, Flame, Signal,
  Sparkles, ArrowRight, RotateCcw, Wifi, Link2, MessageCircle,
  Target, TrendingUp, Users, Radio, Navigation,
} from 'lucide-react';
import type { Sector } from './sectorData';
import { SECTORS } from './sectorData';
import {
  generateHybridLeads,
  SCAN_PHASE_MESSAGES,
  SECTOR_PARTNERS,
  type HybridLead,
} from './hybridScanData';
import { blink } from '@/blink/client';

// ── Geolocation helper ─────────────────────────────────────────────────────────

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=fr`,
      { headers: { 'User-Agent': 'Kompilot/1.0' } }
    );
    const data = await resp.json();
    return data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || '';
  } catch {
    return '';
  }
}

function detectCityFromBrowser(): Promise<string> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(''); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const city = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        resolve(city);
      },
      () => resolve(''),
      { timeout: 5000, maximumAge: 600_000 }
    );
  });
}

// ── Constants ───────────────────────────────────────────────────────────────────

const SCAN_DURATION_MS = 35_000;
const LEADS_COUNT = 4;
const TOTAL_LEADS_DETECTED = 57;

// ── Sub-components ──────────────────────────────────────────────────────────────

/** Sector chip selector */
function SectorChip({
  sector,
  selected,
  onClick,
}: {
  sector: (typeof SECTORS)[number];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="relative flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200"
      style={{
        background: selected
          ? 'linear-gradient(135deg, rgba(13,148,136,.25), rgba(13,148,136,.1))'
          : 'rgba(255,255,255,.04)',
        border: `1.5px solid ${selected ? 'rgba(13,148,136,.6)' : 'rgba(255,255,255,.08)'}`,
        color: selected ? '#5EEAD4' : '#94A3B8',
        boxShadow: selected ? '0 0 20px rgba(13,148,136,.15)' : 'none',
      }}
    >
      <span className="text-lg">{sector.emoji}</span>
      <span>{sector.label}</span>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center"
        >
          <Check className="w-3 h-3" style={{ color: '#fff' }} />
        </motion.div>
      )}
    </motion.button>
  );
}

/** Partner integration preview pill */
function PartnerPill({ name, icon, color }: { name: string; icon: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
      style={{
        background: `${color}15`,
        border: `1px solid ${color}30`,
        color: '#CBD5E1',
      }}
    >
      <span>{icon}</span>
      <span>{name}</span>
    </motion.div>
  );
}

/** Animated scan progress bar */
function ScanProgressBar({ progress }: { progress: number }) {
  return (
    <div className="relative w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)' }}>
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          background: 'linear-gradient(90deg, #0D9488, #14B8A6, #5EEAD4)',
          boxShadow: '0 0 16px rgba(13,148,136,.5), 0 0 40px rgba(13,148,136,.2)',
        }}
      />
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-y-0 w-20 rounded-full"
        animate={{ left: ['-20%', '120%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent)',
        }}
      />
    </div>
  );
}

/** Semantic message ticker during scan */
function ScanMessage({ text, icon }: { text: string; icon: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg"
      style={{ background: 'rgba(13,148,136,.08)', border: '1px solid rgba(13,148,136,.15)' }}
    >
      <span className="text-lg flex-shrink-0">{icon}</span>
      <span className="text-sm font-medium" style={{ color: '#94A3B8' }}>{text}</span>
      <motion.span
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        className="ml-auto text-xs font-mono"
        style={{ color: '#5EEAD4' }}
      >
        ●
      </motion.span>
    </motion.div>
  );
}

/** Blurred contact data with lock tooltip */
function BlurredContact({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  const [showLock, setShowLock] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setShowLock(true)}
      onMouseLeave={() => setShowLock(false)}
      onClick={() => setShowLock((v) => !v)}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#475569' }} />
        <span className="text-xs" style={{ color: '#64748B' }}>{label}:</span>
        <div className="relative">
          <span
            className="text-xs font-medium select-none"
            style={{
              color: '#94A3B8',
              filter: 'blur(5px)',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            {value}
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-3 h-3" style={{ color: '#475569' }} />
          </div>
        </div>
      </div>

      {/* Lock tooltip */}
      <AnimatePresence>
        {showLock && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl text-center"
            style={{
              background: 'linear-gradient(160deg, rgba(13,21,38,.98), rgba(8,14,28,.98))',
              border: '1px solid rgba(13,148,136,.3)',
              boxShadow: '0 0 30px rgba(13,148,136,.15), 0 12px 40px rgba(0,0,0,.5)',
            }}
          >
            <p className="text-xs font-semibold" style={{ color: '#F1F5F9', marginBottom: 4 }}>
              Données verrouillées
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: '#94A3B8' }}>
              Connectez vos comptes publicitaires ou passez à la version Pro pour débloquer les coordonnées directes de ce lead (sans commission).
            </p>
            <div
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
              style={{
                background: 'rgba(8,14,28,.98)',
                borderRight: '1px solid rgba(13,148,136,.3)',
                borderBottom: '1px solid rgba(13,148,136,.3)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Single lead card with blurred data */
function LeadCard({ lead, index }: { lead: HybridLead; index: number }) {
  const signalColors = {
    hot: { bg: 'rgba(239,68,68,.1)', border: 'rgba(239,68,68,.25)', text: '#F87171', icon: '🔥' },
    warm: { bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.25)', text: '#FBBF24', icon: '⚡' },
    new: { bg: 'rgba(13,148,136,.1)', border: 'rgba(13,148,136,.25)', text: '#5EEAD4', icon: '✨' },
  };
  const sig = signalColors[lead.signal];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.12 }}
      className="group relative rounded-xl p-4 transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,.03)',
        border: '1px solid rgba(255,255,255,.06)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(13,148,136,.3)';
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(13,148,136,.04)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,.06)';
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,.03)';
      }}
    >
      {/* Header: Name + Signal badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
            style={{ background: 'rgba(13,148,136,.12)', border: '1px solid rgba(13,148,136,.2)' }}
          >
            <Building2 className="w-4 h-4" style={{ color: '#5EEAD4' }} />
          </div>
          <div className="min-w-0">
            <h4
              className="text-sm font-bold truncate"
              style={{ color: '#F1F5F9' }}
            >
              {lead.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Star className="w-3 h-3" style={{ color: '#FBBF24' }} fill="#FBBF24" />
              <span className="text-xs font-semibold" style={{ color: '#FBBF24' }}>{lead.rating}</span>
              <span className="text-xs" style={{ color: '#475569' }}>({lead.reviews} avis)</span>
            </div>
          </div>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold flex-shrink-0"
          style={{ background: sig.bg, border: `1px solid ${sig.border}`, color: sig.text }}
        >
          <span>{sig.icon}</span>
          <span>{lead.signalLabel}</span>
        </div>
      </div>

      {/* Address */}
      <div className="flex items-center gap-1.5 mb-3">
        <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: '#475569' }} />
        <span className="text-xs truncate" style={{ color: '#64748B' }}>{lead.address}</span>
      </div>

      {/* Blurred contact data */}
      <div className="space-y-2 mb-3">
        <BlurredContact label="Email" value={lead.email} icon={Mail} />
        <BlurredContact label="Tél" value={lead.phone} icon={Phone} />
      </div>

      {/* Source */}
      <div className="flex items-center gap-1.5 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,.04)' }}>
        <span className="text-xs">{lead.sourceIcon}</span>
        <span className="text-[11px]" style={{ color: '#475569' }}>Détecté via {lead.source}</span>
      </div>
    </motion.div>
  );
}

/** Scanned channels logos strip */
function ChannelLogos() {
  const channels = [
    { icon: MessageCircle, label: 'WhatsApp', color: '#25D366' },
    { icon: Globe, label: 'Meta', color: '#1877F2' },
    { icon: Search, label: 'Google Ads', color: '#4285F4' },
    { icon: Link2, label: 'LinkedIn', color: '#0A66C2' },
    { icon: Radio, label: 'TikTok', color: '#000' },
  ];

  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      {channels.map((ch) => (
        <div key={ch.label} className="flex items-center gap-1.5 opacity-40">
          <ch.icon className="w-3.5 h-3.5" style={{ color: ch.color }} />
          <span className="text-[10px] font-medium" style={{ color: '#475569' }}>{ch.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────────

type Phase = 'config' | 'scanning' | 'dashboard';

interface HybridLocalScanProps {
  onUnlock?: () => void;
}

export function HybridLocalScan({ onUnlock }: HybridLocalScanProps = {}) {
  const [phase, setPhase] = useState<Phase>('config');
  const [sector, setSector] = useState<Sector>('');
  const [city, setCity] = useState('');
  const [progress, setProgress] = useState(0);
  const [leads, setLeads] = useState<HybridLead[]>([]);
  const [currentMessageIdx, setCurrentMessageIdx] = useState(0);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  // Auto-detect city from geolocation on mount (non-blocking, silent)
  useEffect(() => {
    let cancelled = false;
    detectCityFromBrowser().then((detected) => {
      if (!cancelled && detected && !city) {
        setCity(detected);
      }
    });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDetectLocation = useCallback(async () => {
    setDetectingLocation(true);
    const detected = await detectCityFromBrowser();
    if (detected) setCity(detected);
    setDetectingLocation(false);
  }, []);

  const handleUnlock = useCallback(() => {
    if (onUnlock) {
      onUnlock();
    } else {
      blink.auth.login(window.location.origin + '/dashboard');
    }
  }, [onUnlock]);

  // Memoize derived data
  const partners = useMemo(() => {
    if (!sector) return [];
    return SECTOR_PARTNERS[sector as keyof typeof SECTOR_PARTNERS] || [];
  }, [sector]);

  const currentMessage = useMemo(() => {
    if (currentMessageIdx < SCAN_PHASE_MESSAGES.length) {
      const msg = SCAN_PHASE_MESSAGES[currentMessageIdx];
      return {
        ...msg,
        text: msg.text.replace('{city}', city || 'votre zone'),
      };
    }
    return null;
  }, [currentMessageIdx, city]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Drive the scan progress
  const startScan = useCallback(() => {
    if (!sector || !city.trim()) return;

    // Generate leads
    const generated = generateHybridLeads(sector as Exclude<Sector, ''>, city.trim(), LEADS_COUNT);
    setLeads(generated);

    // Transition to scanning
    setPhase('scanning');
    setProgress(0);
    setCurrentMessageIdx(0);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / SCAN_DURATION_MS) * 100, 100);
      setProgress(pct);

      // Update message index based on progress ranges
      const msgIdx = SCAN_PHASE_MESSAGES.findIndex(
        (m) => pct >= m.range[0] && pct <= m.range[1]
      );
      if (msgIdx >= 0) setCurrentMessageIdx(msgIdx);

      if (pct >= 100) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Brief pause at 100% before showing dashboard
        setTimeout(() => setPhase('dashboard'), 600);
      }
    }, 100);
  }, [sector, city]);

  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('config');
    setProgress(0);
    setCurrentMessageIdx(0);
    setLeads([]);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-3xl mx-auto">
      <AnimatePresence mode="wait">
        {/* ─── PHASE 1: CONFIGURATION ──────────────────────────────────────── */}
        {phase === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl p-6 md:p-8"
            style={{
              background: 'linear-gradient(160deg, rgba(13,21,38,.98), rgba(8,14,28,.98))',
              border: '1px solid rgba(13,148,136,.2)',
              boxShadow: '0 0 60px rgba(13,148,136,.08), 0 24px 60px rgba(0,0,0,.3)',
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(13,148,136,.2), rgba(13,148,136,.05))',
                  border: '1px solid rgba(13,148,136,.3)',
                }}
              >
                <Target className="w-7 h-7" style={{ color: '#5EEAD4' }} />
              </div>
              <h2
                className="text-xl md:text-2xl font-extrabold mb-2"
                style={{ color: '#F1F5F9' }}
              >
                Scan d'Acquisition Local
              </h2>
              <p className="text-sm" style={{ color: '#64748B' }}>
                Identifiez les opportunités commerciales autour de votre établissement en 35 secondes
              </p>
            </div>

            {/* Sector selector */}
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#64748B' }}>
                Secteur d'activité
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {SECTORS.filter((s) => s.id !== '').map((s) => (
                  <SectorChip
                    key={s.id}
                    sector={s}
                    selected={sector === s.id}
                    onClick={() => setSector(s.id)}
                  />
                ))}
              </div>
            </div>

            {/* City input */}
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#64748B' }}>
                Ville ou Code Postal
              </label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <MapPin
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: '#475569' }}
                  />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Paris, Lyon, Bordeaux, 75001..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,.04)',
                      border: '1px solid rgba(255,255,255,.08)',
                      color: '#E2E8F0',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(13,148,136,.4)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; }}
                    onKeyDown={(e) => e.key === 'Enter' && startScan()}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  title="Détecter ma position"
                  className="flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 cursor-pointer flex-shrink-0"
                  style={{
                    background: detectingLocation ? 'rgba(13,148,136,.15)' : 'rgba(255,255,255,.04)',
                    border: '1px solid rgba(255,255,255,.08)',
                  }}
                >
                  <Navigation
                    className="w-4 h-4"
                    style={{
                      color: detectingLocation ? '#5EEAD4' : '#475569',
                      animation: detectingLocation ? 'spin 1s linear infinite' : 'none',
                    }}
                  />
                </motion.button>
              </div>
              {city && (
                <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: '#475569' }}>
                  <MapPin className="w-3 h-3" />
                  Zone de scan : <span style={{ color: '#94A3B8' }}>{city}</span>
                </p>
              )}
            </div>

            {/* Partner integrations preview (dynamic per sector) */}
            <AnimatePresence>
              {sector && partners.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Wifi className="w-3.5 h-3.5" style={{ color: '#0D9488' }} />
                    <span className="text-xs font-semibold" style={{ color: '#64748B' }}>
                      Intégrations partenaires prêtes
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {partners.map((p) => (
                      <PartnerPill key={p.name} name={p.name} icon={p.icon} color={p.color} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: sector && city.trim() ? 1.02 : 1 }}
              whileTap={{ scale: sector && city.trim() ? 0.98 : 1 }}
              onClick={startScan}
              disabled={!sector || !city.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer"
              style={{
                background: sector && city.trim()
                  ? 'linear-gradient(135deg, #0D9488, #0f766e)'
                  : 'rgba(255,255,255,.06)',
                color: sector && city.trim() ? '#fff' : '#475569',
                border: 'none',
                cursor: sector && city.trim() ? 'pointer' : 'not-allowed',
                boxShadow: sector && city.trim() ? '0 0 24px rgba(13,148,136,.3)' : 'none',
                animation: sector && city.trim() ? 'hybridPulse 2s ease-in-out infinite' : 'none',
              }}
            >
              {!sector ? (
                <>
                  <Zap className="w-4 h-4" />
                  Sélectionnez un secteur pour continuer
                </>
              ) : !city.trim() ? (
                <>
                  <MapPin className="w-4 h-4" />
                  Saisissez votre ville ou code postal
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Lancer le scan d'acquisition local
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* ─── PHASE 2: SCAN CORRIDOR (35s) ───────────────────────────────── */}
        {phase === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl overflow-hidden relative"
            style={{
              background: 'linear-gradient(160deg, rgba(13,21,38,.99), rgba(5,10,20,.99))',
              border: '1px solid rgba(13,148,136,.3)',
              boxShadow: '0 0 80px rgba(13,148,136,.12), 0 0 160px rgba(13,148,136,.04)',
            }}
          >
            {/* Neon gradient backdrop accents */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute -top-32 -right-32 w-64 h-64 rounded-full opacity-20 blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(13,148,136,.4), transparent)' }}
              />
              <div
                className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full opacity-15 blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(6,182,212,.3), transparent)' }}
              />
              {/* Scan lines */}
              <motion.div
                className="absolute left-0 right-0 h-px"
                animate={{ top: ['0%', '100%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                style={{ background: 'linear-gradient(90deg, transparent, rgba(13,148,136,.2), transparent)' }}
              />
            </div>

            <div className="relative p-6 md:p-8">
              {/* Header with city */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-5 h-5" style={{ color: '#5EEAD4' }} />
                  </motion.div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5EEAD4' }}>
                    Scan en cours
                  </span>
                </div>
                <h3 className="text-lg font-bold" style={{ color: '#F1F5F9' }}>
                  Analyse de <span style={{ color: '#5EEAD4' }}>{city}</span>
                </h3>
                <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                  {SECTORS.find((s) => s.id === sector)?.emoji} {SECTORS.find((s) => s.id === sector)?.label}
                </p>
              </div>

              {/* Progress percentage */}
              <div className="text-center mb-4">
                <span
                  className="text-4xl font-black tabular-nums"
                  style={{
                    color: progress >= 100 ? '#5EEAD4' : '#14B8A6',
                    textShadow: progress >= 100 ? '0 0 20px rgba(13,148,136,.5)' : 'none',
                  }}
                >
                  {Math.round(progress)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <ScanProgressBar progress={progress} />
              </div>

              {/* Semantic message */}
              <div className="min-h-[52px] mb-6">
                <AnimatePresence mode="wait">
                  {currentMessage && (
                    <ScanMessage
                      key={currentMessageIdx}
                      text={currentMessage.text}
                      icon={currentMessage.icon}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Phase dots */}
              <div className="flex items-center justify-center gap-2">
                {SCAN_PHASE_MESSAGES.map((msg, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: i === currentMessageIdx ? 1.3 : 1,
                      background:
                        i < currentMessageIdx
                          ? '#0D9488'
                          : i === currentMessageIdx
                          ? '#14B8A6'
                          : 'rgba(255,255,255,.08)',
                    }}
                    className="w-2 h-2 rounded-full"
                    style={{
                      boxShadow:
                        i === currentMessageIdx ? '0 0 8px rgba(13,148,136,.5)' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── PHASE 3: HYBRID DASHBOARD ──────────────────────────────────── */}
        {phase === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, rgba(13,21,38,.98), rgba(8,14,28,.98))',
              border: '1px solid rgba(13,148,136,.2)',
              boxShadow: '0 0 60px rgba(13,148,136,.08), 0 24px 60px rgba(0,0,0,.3)',
            }}
          >
            <div className="p-6 md:p-8">
              {/* Header: leads detected counter */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(13,148,136,.15), rgba(13,148,136,.05))',
                    border: '1px solid rgba(13,148,136,.3)',
                  }}
                >
                  <TrendingUp className="w-4 h-4" style={{ color: '#5EEAD4' }} />
                  <span className="text-sm font-bold" style={{ color: '#5EEAD4' }}>
                    {TOTAL_LEADS_DETECTED} Nouveaux leads détectés
                  </span>
                </motion.div>
                <h3 className="text-lg md:text-xl font-extrabold mb-1" style={{ color: '#F1F5F9' }}>
                  Nouveaux leads interceptés à{' '}
                  <span style={{ color: '#5EEAD4' }}>{city}</span>
                </h3>
                <p className="text-xs" style={{ color: '#64748B' }}>
                  {SECTORS.find((s) => s.id === sector)?.emoji}{' '}
                  {SECTORS.find((s) => s.id === sector)?.label} — Données en temps réel
                </p>
              </div>

              {/* Reassurance badges */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                {[
                  { icon: Shield, label: 'Sans intermédiaire' },
                  { icon: Users, label: 'Sans démarchage à froid' },
                  { icon: Target, label: 'Sans commission' },
                ].map((badge) => (
                  <div
                    key={badge.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{
                      background: 'rgba(13,148,136,.08)',
                      border: '1px solid rgba(13,148,136,.15)',
                      color: '#5EEAD4',
                    }}
                  >
                    <badge.icon className="w-3.5 h-3.5" />
                    <span>{badge.label}</span>
                  </div>
                ))}
              </div>

              {/* Lead cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {leads.map((lead, i) => (
                  <LeadCard key={lead.id} lead={lead} index={i} />
                ))}
              </div>

              {/* Unlock CTA */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center p-4 rounded-xl mb-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(13,148,136,.1), rgba(249,115,22,.05))',
                  border: '1px solid rgba(13,148,136,.2)',
                }}
              >
                <Lock className="w-5 h-5 mx-auto mb-2" style={{ color: '#F59E0B' }} />
                <p className="text-sm font-bold mb-1" style={{ color: '#F1F5F9' }}>
                  Débloquez les coordonnées complètes
                </p>
                <p className="text-xs mb-3" style={{ color: '#94A3B8' }}>
                  Connectez vos comptes publicitaires ou passez à la version Pro pour accéder aux emails et téléphones directs.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleUnlock}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #0D9488, #0f766e)',
                    color: '#fff',
                    border: 'none',
                    boxShadow: '0 0 20px rgba(13,148,136,.3)',
                  }}
                >
                  <Zap className="w-4 h-4" />
                  Débloquer les leads
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>

              {/* Scanned channels logos */}
              <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,.04)' }}>
                <p className="text-center text-[10px] uppercase tracking-wider mb-3" style={{ color: '#334155' }}>
                  Canaux scannés
                </p>
                <ChannelLogos />
              </div>

              {/* Reset button */}
              <div className="text-center mt-6">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs cursor-pointer transition-colors duration-200"
                  style={{
                    color: '#475569',
                    background: 'none',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#475569'; }}
                >
                  <RotateCcw className="w-3 h-3" />
                  Nouveau scan
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global animation keyframes */}
      <style>{`
        @keyframes hybridPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
