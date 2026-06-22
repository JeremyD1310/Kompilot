/**
 * DashboardPreviewOverlay — Puppeting UX (orchestrator)
 *
 * Timeline (35 seconds total):
 *   0–10s  → Card 1: AI Score counter animates
 *   11–20s → Card 2: Google Stars fill-up
 *   21–30s → Card 3: Semantic impressions + sparkline
 *   31–35s → Live Activity Feed populates item by item
 *   35s    → Blur dissolves + onComplete() fires
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useAnimatedCounter, Sparkline, StarRating,
  KPICard, LiveFeed, BlurOverlay,
} from './previewWidgets';

// ── Types (exported for parent) ───────────────────────────────────────────────

export interface ActivityItem {
  icon: string;
  text: string;
  time: string;
  color: string;
}

export interface ScanData {
  aiScore: number;
  googleRating: number;
  impressions: number;
  activities: ActivityItem[];
}

interface Props {
  query: string;
  elapsedMs: number;
  scanData: ScanData | null;
  totalMs: number;
  isRevealed?: boolean;
  onComplete: () => void;
}

// ── Phase boundaries ──────────────────────────────────────────────────────────

const PHASE1_END = 10000;
const PHASE2_END = 20000;
const PHASE3_END = 30000;
const PHASE4_END = 35000;

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  { icon: '⭐', text: 'Avis 5★ reçu — client satisfait', time: 'il y a 2 jours', color: '#FBBF24' },
  { icon: '📸', text: 'Dernière publication détectée sur Instagram', time: 'il y a 4 jours', color: '#818CF8' },
  { icon: '🔍', text: 'Votre établissement cité par Google AI Overview', time: 'il y a 5 jours', color: '#06B6D4' },
  { icon: '💬', text: 'Message client sans réponse depuis 3 jours', time: 'il y a 3 jours', color: '#F87171' },
  { icon: '📊', text: 'Pic de visibilité locale détecté ce weekend', time: 'cette semaine', color: '#34D399' },
];

// ── Main component ─────────────────────────────────────────────────────────────

export function DashboardPreviewOverlay({ query, elapsedMs, scanData, totalMs, isRevealed = false, onComplete }: Props) {
  const completedRef = useRef(false);
  const progress = Math.min(elapsedMs / totalMs, 1);

  const phase1Active = elapsedMs >= 0 && elapsedMs < PHASE1_END;
  const phase1Done   = elapsedMs >= PHASE1_END;
  const phase2Active = elapsedMs >= PHASE1_END && elapsedMs < PHASE2_END;
  const phase2Done   = elapsedMs >= PHASE2_END;
  const phase3Active = elapsedMs >= PHASE2_END && elapsedMs < PHASE3_END;
  const phase3Done   = elapsedMs >= PHASE3_END;
  const phase4Active = elapsedMs >= PHASE3_END;

  // During reveal: blur is 0, overlay is gone, celebration banner shows
  const blurLevel     = isRevealed ? 0 : Math.max(0, 18 * (1 - Math.max(0, (elapsedMs - 30000) / 5000)));
  const overlayVisible = !isRevealed && elapsedMs < PHASE4_END;

  const aiScore    = useAnimatedCounter(scanData?.aiScore ?? 38, phase1Active || phase1Done, 2600);
  const impressions = useAnimatedCounter(scanData?.impressions ?? 1840, phase3Active || phase3Done, 2800);

  const googleRating = scanData?.googleRating ?? 4.2;
  const activities   = scanData?.activities ?? DEFAULT_ACTIVITIES;

  useEffect(() => {
    if (elapsedMs >= PHASE4_END && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [elapsedMs, onComplete]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* ── Reveal celebration banner ── */}
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{
              marginBottom: 10, borderRadius: 14, overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(13,148,136,.18), rgba(16,185,129,.1))',
              border: '1px solid rgba(13,148,136,.5)',
              padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 0 40px rgba(13,148,136,.12)',
            }}
          >
            <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🎉</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#6EE7B7', fontWeight: 800, fontSize: '.88rem', margin: '0 0 2px', lineHeight: 1.3 }}>
                Votre espace est prêt !
              </p>
              <p style={{ color: '#475569', fontSize: '.72rem', margin: 0 }}>
                Toutes vos données ont été importées — verrouillons cet espace maintenant.
              </p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.4 }}
              style={{
                flexShrink: 0, width: 10, height: 10, borderRadius: '50%',
                background: '#10B981', boxShadow: '0 0 12px #10B981',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dashboard shell ── */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(13,21,38,.96), rgba(8,14,28,.98))',
        border: `1px solid ${isRevealed ? 'rgba(13,148,136,.35)' : 'rgba(255,255,255,.06)'}`,
        borderRadius: 18, padding: 'clamp(14px,3vw,22px)',
        position: 'relative', overflow: 'hidden',
        boxShadow: isRevealed ? '0 0 40px rgba(13,148,136,.1)' : 'none',
        transition: 'border-color .6s, box-shadow .6s',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, #0D9488, #0f766e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem',
          }}>🏪</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#E2E8F0', fontWeight: 700, fontSize: '.82rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {query || 'Votre établissement'}
            </p>
            <p style={{ color: '#475569', fontSize: '.65rem', margin: 0 }}>Dashboard · Vue temps réel</p>
          </div>
          <div style={{
            background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)',
            borderRadius: 20, padding: '3px 10px', color: '#6EE7B7', fontSize: '.62rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ animation: 'livePulse 1.4s ease-in-out infinite' }}>●</span> En ligne
          </div>
        </div>

        {/* ── 3 KPI Cards ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>

          <KPICard active={phase1Active} done={phase1Done} label="Score IA GEO"
            accentColor="rgba(249,115,22,.5)" glowColor="rgba(249,115,22,.1)">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{
                fontSize: 'clamp(1.4rem,4vw,1.9rem)', fontWeight: 900, lineHeight: 1,
                color: aiScore >= 60 ? '#34D399' : aiScore >= 35 ? '#FBBF24' : '#F87171',
                fontVariantNumeric: 'tabular-nums', transition: 'color .4s',
              }}>
                {phase1Active || phase1Done ? aiScore : '—'}
              </span>
              {(phase1Active || phase1Done) && <span style={{ color: '#475569', fontSize: '.75rem', fontWeight: 600 }}>%</span>}
            </div>
            {phase1Done && (
              <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                style={{ color: '#64748B', fontSize: '.62rem', margin: '4px 0 0' }}>
                {aiScore < 40 ? '⚠️ Insuffisant — action requise' : aiScore < 60 ? '📈 En progression' : '✅ Optimisé'}
              </motion.p>
            )}
          </KPICard>

          <KPICard active={phase2Active} done={phase2Done} label="Avis Google"
            accentColor="rgba(251,191,36,.5)" glowColor="rgba(251,191,36,.08)">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'clamp(1.4rem,4vw,1.9rem)', fontWeight: 900, lineHeight: 1, color: '#FBBF24', fontVariantNumeric: 'tabular-nums' }}>
                {phase2Active || phase2Done ? googleRating.toFixed(1) : '—'}
              </span>
              {(phase2Active || phase2Done) && <StarRating rating={googleRating} active={phase2Active || phase2Done} />}
            </div>
            {phase2Done && (
              <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                style={{ color: '#64748B', fontSize: '.62rem', margin: '4px 0 0' }}>
                {googleRating >= 4.5 ? '🌟 Excellente réputation' : googleRating >= 4.0 ? '👍 Bonne réputation' : '📊 À améliorer'}
              </motion.p>
            )}
          </KPICard>

          <KPICard active={phase3Active} done={phase3Done} label="Impressions sémantiques"
            accentColor="rgba(13,148,136,.5)" glowColor="rgba(13,148,136,.08)">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'clamp(1.2rem,3.5vw,1.7rem)', fontWeight: 900, lineHeight: 1, color: '#0D9488', fontVariantNumeric: 'tabular-nums' }}>
                {phase3Active || phase3Done ? impressions.toLocaleString('fr-FR') : '—'}
              </span>
              {(phase3Active || phase3Done) && (
                <div style={{ marginLeft: 'auto' }}>
                  <Sparkline active={phase3Active || phase3Done} />
                </div>
              )}
            </div>
            {phase3Done && (
              <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                style={{ color: '#64748B', fontSize: '.62rem', margin: '4px 0 0' }}>
                {impressions < 1000 ? '📉 Faible présence IA' : impressions < 3000 ? '📊 Présence modérée' : '🚀 Forte visibilité'}
              </motion.p>
            )}
          </KPICard>
        </div>

        {/* ── Live Activity Feed ── */}
        <LiveFeed active={phase4Active} items={activities} />

        {/* ── Bot status bar ── */}
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {['ChatGPT', 'Gemini', 'Perplexity', 'Claude'].map((bot, i) => (
            <motion.span
              key={bot}
              initial={{ opacity: 0 }}
              animate={{ opacity: elapsedMs > i * 2500 + 1000 ? 1 : 0.15 }}
              transition={{ duration: 0.5 }}
              style={{
                fontSize: '.6rem', fontWeight: 600,
                color: elapsedMs > i * 2500 + 1000 ? '#6EE7B7' : '#334155',
                display: 'flex', alignItems: 'center', gap: 3, transition: 'color .4s',
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: elapsedMs > i * 2500 + 1000 ? '#10B981' : '#334155', transition: 'background .4s' }} />
              {bot}
            </motion.span>
          ))}
          <span style={{ marginLeft: 'auto', color: '#334155', fontSize: '.6rem' }}>
            {Math.round(progress * 100)}% analysé
          </span>
        </div>
      </div>

      {/* ── Reveal celebration banner (1.8s moment after scan completes) ── */}
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            key="celebration"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: 0, borderRadius: 18, zIndex: 20,
              pointerEvents: 'none',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 12,
              background: 'linear-gradient(160deg, rgba(13,148,136,.08) 0%, transparent 60%)',
              border: '1px solid rgba(13,148,136,.35)',
            }}
          >
            {/* Confetti-like particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5],
                  y: [-20, -60 - i * 10],
                  x: [(i % 2 === 0 ? 1 : -1) * i * 15],
                }}
                transition={{ duration: 1.2, delay: i * 0.1, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  width: 8, height: 8, borderRadius: '50%',
                  background: ['#0D9488', '#6EE7B7', '#FBBF24', '#818CF8', '#F87171', '#34D399'][i],
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* Main celebration card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              style={{
                background: 'linear-gradient(135deg, rgba(13,148,136,.18), rgba(13,148,136,.08))',
                border: '1px solid rgba(13,148,136,.5)',
                borderRadius: 16,
                padding: '16px 24px',
                textAlign: 'center',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 0 60px rgba(13,148,136,.2), 0 8px 32px rgba(0,0,0,.3)',
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.6, repeat: 2, ease: 'easeInOut' }}
                style={{ fontSize: '2rem', marginBottom: 8 }}
              >
                🎉
              </motion.div>
              <p style={{
                color: '#6EE7B7', fontWeight: 800, fontSize: 'clamp(.88rem, 2.5vw, 1rem)',
                margin: '0 0 4px', letterSpacing: '.01em',
              }}>
                Votre espace est prêt !
              </p>
              <p style={{ color: '#94A3B8', fontSize: '.74rem', margin: 0, lineHeight: 1.5 }}>
                Configuration terminée pour<br />
                <span style={{ color: '#E2E8F0', fontWeight: 700 }}>« {query} »</span>
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, marginTop: 10,
              }}>
                {['✅ GEO optimisé', '📊 KPIs calculés', '📥 Inbox prête'].map((label) => (
                  <span
                    key={label}
                    style={{
                      background: 'rgba(16,185,129,.1)',
                      border: '1px solid rgba(16,185,129,.25)',
                      borderRadius: 20, padding: '2px 8px',
                      color: '#6EE7B7', fontSize: '.6rem', fontWeight: 600,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Glassmorphism blur overlay ── */}
      <AnimatePresence>
        {overlayVisible && (
          <motion.div
            exit={{ opacity: 0, transition: { duration: 1.2, ease: 'easeOut' } }}
            style={{ position: 'absolute', inset: 0, borderRadius: 18, overflow: 'hidden' }}
          >
            <BlurOverlay blurLevel={blurLevel} progress={progress} />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
