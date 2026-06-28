/**
 * ApiStatusFallback — Standardized loading/error/queue states for API calls.
 *
 * Used in Creative Studio, Campaign Calendar, and any component that depends
 * on external APIs (Luma, OpenAI, Meta, etc.).
 *
 * States:
 *  - skeleton: Premium shimmer while waiting for response
 *  - queue: "Position in queue" with progress for Luma AI etc.
 *  - degraded: API is slow, showing background progress
 *  - error: API failed, with retry button and fallback action
 *  - offline: No connection at all
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@blinkdotnew/ui';
import {
  Loader2, RefreshCw, AlertTriangle, WifiOff, Clock, Zap, Sparkles,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type FallbackState = 'loading' | 'queue' | 'degraded' | 'error' | 'offline' | 'idle';

interface ApiStatusFallbackProps {
  /** Current state */
  state: FallbackState;
  /** Integration name (e.g., "Luma AI", "OpenAI") */
  integration: string;
  /** Queue position (for queue state) */
  queuePosition?: number;
  /** Queue total (for queue state) */
  queueTotal?: number;
  /** Estimated time remaining (e.g., "~30s") */
  estimatedTime?: string;
  /** Error message (for error state) */
  errorMessage?: string;
  /** Called when user clicks retry */
  onRetry?: () => void;
  /** Called when user clicks "Use demo data instead" */
  onUseDemo?: () => void;
  /** Custom class */
  className?: string;
}

// ── Skeleton shimmer ──────────────────────────────────────────────────────────

function SkeletonCard({ width, height }: { width: string; height: string }) {
  return (
    <div
      className="rounded-lg animate-pulse"
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ApiStatusFallback({
  state,
  integration,
  queuePosition,
  queueTotal,
  estimatedTime,
  errorMessage,
  onRetry,
  onUseDemo,
  className = '',
}: ApiStatusFallbackProps) {
  if (state === 'idle') return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
        className={`rounded-xl p-5 ${className}`}
        style={{
          background: state === 'error' || state === 'offline'
            ? 'rgba(239,68,68,0.04)'
            : 'rgba(255,255,255,0.02)',
          border: `1px solid ${
            state === 'error' || state === 'offline'
              ? 'rgba(239,68,68,0.15)'
              : state === 'degraded'
                ? 'rgba(245,158,11,0.15)'
                : 'rgba(255,255,255,0.06)'
          }`,
        }}
      >
        {/* Loading state */}
        {state === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(13,148,136,0.1)' }}>
                <Loader2 size={22} className="animate-spin" color="#0D9488" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
                Génération en cours via {integration}
              </p>
              <p className="text-xs" style={{ color: '#64748B' }}>
                {estimatedTime || 'Cela peut prendre quelques secondes...'}
              </p>
            </div>
            {/* Skeleton placeholders */}
            <div className="w-full flex gap-3 justify-center">
              <SkeletonCard width="120px" height="80px" />
              <SkeletonCard width="120px" height="80px" />
              <SkeletonCard width="120px" height="80px" />
            </div>
          </div>
        )}

        {/* Queue state */}
        {state === 'queue' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.1)' }}>
              <Clock size={22} color="#a78bfa" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
                En file d'attente
              </p>
              <p className="text-xs" style={{ color: '#64748B' }}>
                Position {queuePosition || '?'} / {queueTotal || '?'} — {integration}
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-full max-w-xs">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #a78bfa, #0D9488)' }}
                  initial={{ width: 0 }}
                  animate={{ width: queuePosition && queueTotal ? `${((queueTotal - queuePosition) / queueTotal) * 100}%` : '30%' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              {estimatedTime && (
                <p className="text-center text-[10px] mt-2" style={{ color: '#475569' }}>
                  Temps estimé : {estimatedTime}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Degraded state */}
        {state === 'degraded' && (
          <div className="flex items-center gap-4 py-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(245,158,11,0.1)' }}>
              <Zap size={18} color="#f59e0b" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#fbbf24' }}>
                {integration} répond lentement
              </p>
              <p className="text-xs" style={{ color: '#64748B' }}>
                La génération prend plus de temps que d'habitude. Patientez ou réessayez.
              </p>
            </div>
            {onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry} className="shrink-0 gap-1.5 text-xs">
                <RefreshCw size={12} /> Relancer
              </Button>
            )}
          </div>
        )}

        {/* Error state */}
        {state === 'error' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.08)' }}>
              <AlertTriangle size={22} color="#ef4444" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
                Erreur {integration}
              </p>
              <p className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: '#64748B' }}>
                {errorMessage || 'Une erreur temporaire est survenue. Nos équipes ont été notifiées.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5 text-xs"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#F1F5F9' }}>
                  <RefreshCw size={12} /> Réessayer
                </Button>
              )}
              {onUseDemo && (
                <Button size="sm" onClick={onUseDemo} className="gap-1.5 text-xs font-semibold"
                  style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
                  <Sparkles size={12} /> Données démo
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Offline state */}
        {state === 'offline' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.08)' }}>
              <WifiOff size={22} color="#ef4444" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
                Connexion perdue
              </p>
              <p className="text-xs" style={{ color: '#64748B' }}>
                Vérifiez votre connexion internet. Les données démo restent disponibles.
              </p>
            </div>
            {onUseDemo && (
              <Button size="sm" onClick={onUseDemo} className="gap-1.5 text-xs"
                style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
                <Sparkles size={12} /> Explorer en démo
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Inline wrapper for wrapping any component with fallback ───────────────────

interface WithApiFallbackProps {
  state: FallbackState;
  integration: string;
  children: React.ReactNode;
  fallbackProps?: Partial<ApiStatusFallbackProps>;
}

/**
 * Wraps children with an ApiStatusFallback overlay when not in 'idle' state.
 * Children are rendered behind a blur/overlay during loading, or replaced on error.
 */
export function WithApiFallback({ state, integration, children, fallbackProps }: WithApiFallbackProps) {
  if (state === 'idle') return <>{children}</>;

  const isError = state === 'error' || state === 'offline';

  return (
    <div className="relative">
      {/* Children behind blur (if loading/queue/degraded) */}
      {!isError && (
        <div className="opacity-30 pointer-events-none select-none blur-[2px]">
          {children}
        </div>
      )}

      {/* Fallback overlay */}
      <div className={isError ? '' : 'absolute inset-0 flex items-center justify-center'}>
        <ApiStatusFallback
          state={state}
          integration={integration}
          className={isError ? '' : 'w-full'}
          {...fallbackProps}
        />
      </div>
    </div>
  );
}
