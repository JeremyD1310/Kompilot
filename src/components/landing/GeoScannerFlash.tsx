/**
 * GeoScannerFlash — Full Puppeting UX
 *
 * Phases:
 *   idle     → form visible, user types query
 *   scanning → form fades, DashboardPreviewOverlay takes over (35s)
 *             → at 35s: blur dissolves, isRevealed=true for 1.8s "reveal moment"
 *   result   → FixChecklist shown + ScanOnboardingModal fires
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BLOCKER_ITEMS, SCAN_STEPS, TOTAL_SCAN_MS } from './geoScanner/blockerData';
import { FixChecklist } from './geoScanner/FixChecklist';
import { DashboardPreviewOverlay } from './geoScanner/DashboardPreviewOverlay';
import { ScanOnboardingModal } from './geoScanner/ScanOnboardingModal';
import { validateAndIncrementScan, checkLocalQuota } from '@/lib/scanRateLimit';
import { track, isLikelySuspiciousBot, captureUtmParams, getUtmSector } from '@/lib/tracking';
import type { ScanData } from './geoScanner/DashboardPreviewOverlay';

type Phase = 'idle' | 'scanning' | 'result' | 'rate_limited';

interface Props {
  onCta: () => void;
}

// Deterministic score from query string (no Math.random for security)
function scoreFromQuery(q: string): number {
  let hash = 0;
  for (let i = 0; i < q.length; i++) hash = (hash * 31 + q.charCodeAt(i)) & 0xffff;
  return 28 + (hash % 22); // always 28–49 (concerning range)
}

function buildScanData(query: string): ScanData {
  const seed = scoreFromQuery(query);
  return {
    aiScore: seed,
    googleRating: 3.5 + ((seed % 14) / 10),   // 3.5–4.9
    impressions: 800 + (seed % 22) * 90,        // 800–2738
    activities: [
      { icon: '⭐', text: `Avis 5★ reçu pour "${query}"`, time: 'il y a 2 jours', color: '#FBBF24' },
      { icon: '📸', text: 'Dernière publication détectée sur Instagram', time: 'il y a 4 jours', color: '#818CF8' },
      { icon: '🔍', text: 'Votre établissement cité par Google AI Overview', time: 'il y a 5 jours', color: '#06B6D4' },
      { icon: '💬', text: 'Message client sans réponse depuis 3 jours', time: 'il y a 3 jours', color: '#F87171' },
      { icon: '📊', text: 'Pic de visibilité locale détecté ce weekend', time: 'cette semaine', color: '#34D399' },
    ],
  };
}

export function GeoScannerFlash({ onCta }: Props) {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  // Reveal moment: dashboard visible, fully unblurred, for 1.8s before modal
  const [isRevealed, setIsRevealed] = useState(false);
  // Rate limit
  const [rateLimitMsg, setRateLimitMsg] = useState<string | null>(null);
  const [scansRemaining, setScansRemaining] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(0);

  // Pre-check quota on mount
  useEffect(() => {
    const quota = checkLocalQuota();
    setScansRemaining(quota.scansRemaining);
    if (!quota.allowed) {
      setRateLimitMsg(quota.message);
    }
  }, []);

  const clearAll = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  // Tick the elapsed clock (drives DashboardPreviewOverlay)
  const startClock = () => {
    startTimeRef.current = performance.now();
    const tick = () => {
      const now = performance.now();
      const elapsed = Math.min(now - startTimeRef.current, TOTAL_SCAN_MS);
      setElapsedMs(elapsed);
      if (elapsed < TOTAL_SCAN_MS) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleScan = async () => {
    if (!query.trim() || phase === 'scanning') return;

    // ── Bot / click fraud detection ─────────────────────────────────────────
    if (isLikelySuspiciousBot()) {
      console.warn('[tracking] suspicious bot detected — skipping deep scan');
      // Afficher quand même l'UI mais ne pas déclencher l'event Lead
      setPhase('rate_limited');
      setRateLimitMsg('Activité suspecte détectée. Veuillez réessayer depuis un navigateur classique.');
      return;
    }

    // ── Rate limit check ────────────────────────────────────────────────────
    const quota = await validateAndIncrementScan();
    setScansRemaining(quota.scansRemaining);
    if (!quota.allowed) {
      setRateLimitMsg(quota.message);
      setPhase('rate_limited');
      return;
    }

    // ── Track Lead (Server-Side) ─────────────────────────────────────────────
    const utmParams = captureUtmParams();
    const sector = getUtmSector() ?? undefined;
    track('Lead', {
      sector,
      userType: (utmParams.utm_source?.includes('agency') || utmParams.utm_sector === 'agency') ? 'agency' : 'commerce',
      eventUrl: window.location.href,
    }).catch(() => {});

    const data = buildScanData(query.trim());
    setScanData(data);
    setPhase('scanning');
    setCompletedSteps(new Set());
    setCurrentStepIdx(0);
    setElapsedMs(0);
    setIsRevealed(false);
    setRateLimitMsg(null);
    clearAll();
    startClock();

    // Orchestrate scan step labels (visual progress indicator at the bottom)
    SCAN_STEPS.forEach((step, idx) => {
      const t1 = setTimeout(() => setCurrentStepIdx(idx), step.duration - 800);
      const t2 = setTimeout(() => {
        setCompletedSteps(prev => new Set([...prev, step.id]));
        if (idx < SCAN_STEPS.length - 1) setCurrentStepIdx(idx + 1);
      }, step.duration);
      timersRef.current.push(t1, t2);
    });
  };

  // Called by DashboardPreviewOverlay when 35s is up
  // Step 1: reveal moment (dashboard fully visible, no blur)
  // Step 2: after 1.8s → switch to result + open modal
  const handlePreviewComplete = () => {
    setIsRevealed(true);
    const t = setTimeout(() => {
      setIsRevealed(false);
      setPhase('result');
      setCurrentStepIdx(-1);
      setOnboardingOpen(true);
    }, 1800);
    timersRef.current.push(t);
  };

  useEffect(() => () => clearAll(), []);

  const handleReset = () => {
    clearAll();
    // Re-check local quota (don't reset rate limit, just show correct remaining)
    const quota = checkLocalQuota();
    setScansRemaining(quota.scansRemaining);
    if (!quota.allowed) {
      setRateLimitMsg(quota.message);
      setPhase('rate_limited');
      return;
    }
    setPhase('idle');
    setCompletedSteps(new Set());
    setCurrentStepIdx(-1);
    setQuery('');
    setElapsedMs(0);
    setScanData(null);
    setOnboardingOpen(false);
    setIsRevealed(false);
    setRateLimitMsg(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const progressPct = phase === 'scanning' || isRevealed
    ? Math.round((elapsedMs / TOTAL_SCAN_MS) * 100)
    : phase === 'result' ? 100 : 0;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px' }}>
      {/* ── Outer card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          background: 'linear-gradient(145deg, rgba(13,21,38,.96), rgba(8,14,28,.98))',
          border: '1px solid',
          borderColor: isRevealed ? 'rgba(13,148,136,.6)' : phase === 'scanning' ? 'rgba(6,182,212,.4)' : phase === 'result' ? 'rgba(13,148,136,.5)' : 'rgba(249,115,22,.3)',
          borderRadius: 20,
          padding: 'clamp(18px,4vw,28px)',
          boxShadow: isRevealed
            ? '0 0 60px rgba(13,148,136,.15), 0 0 120px rgba(13,148,136,.06)'
            : phase === 'scanning'
            ? '0 0 40px rgba(6,182,212,.08)'
            : phase === 'result'
              ? '0 0 40px rgba(13,148,136,.08)'
              : '0 0 32px rgba(249,115,22,.06)',
          transition: 'border-color .4s, box-shadow .6s',
        }}
      >
        {/* ── Header ── */}
        <div style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: isRevealed ? 'rgba(13,148,136,.2)' : phase === 'scanning' ? 'rgba(6,182,212,.15)' : 'rgba(249,115,22,.15)',
            border: `1px solid ${isRevealed ? 'rgba(13,148,136,.5)' : phase === 'scanning' ? 'rgba(6,182,212,.3)' : 'rgba(249,115,22,.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', transition: 'all .4s',
          }}>
            {isRevealed ? '🎉' : phase === 'result' ? '🔬' : phase === 'scanning' ? '⚡' : '🤖'}
          </div>
          <div>
            <h3 style={{ color: '#F1F5F9', fontWeight: 800, fontSize: 'clamp(.95rem, 2.5vw, 1.1rem)', margin: '0 0 4px', lineHeight: 1.3 }}>
              Vos futurs clients vous trouvent-ils sur ChatGPT et Google ?
            </h3>
            <p style={{ color: '#64748B', fontSize: '.78rem', margin: 0 }}>
              Diagnostic gratuit — ChatGPT, Gemini, Perplexity, Claude · Résultat en 35s
            </p>
          </div>
        </div>

        {/* ── Scans remaining indicator (idle only) ── */}
        {phase === 'idle' && scansRemaining !== null && scansRemaining < 3 && scansRemaining > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 10, fontSize: '.72rem', color: '#F59E0B',
          }}>
            <span>⚠️</span>
            <span>{scansRemaining} diagnostic{scansRemaining > 1 ? 's' : ''} gratuit{scansRemaining > 1 ? 's' : ''} restant{scansRemaining > 1 ? 's' : ''} aujourd'hui</span>
          </div>
        )}

        {/* ── RATE-LIMITED PHASE ── */}
        <AnimatePresence>
          {phase === 'rate_limited' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                background: 'rgba(239,68,68,.06)',
                border: '1px solid rgba(239,68,68,.25)',
                borderRadius: 14,
                padding: '20px 22px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>🔒</div>
              <p style={{ color: '#FCA5A5', fontWeight: 700, fontSize: '.95rem', margin: '0 0 8px' }}>
                Limite quotidienne atteinte
              </p>
              <p style={{ color: '#94A3B8', fontSize: '.82rem', margin: '0 0 18px', lineHeight: 1.5 }}>
                {rateLimitMsg ?? 'Vous avez atteint la limite de diagnostics gratuits pour aujourd\'hui. Créez un compte pour débloquer des analyses illimitées.'}
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onCta}
                style={{
                  background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                  color: '#fff',
                  fontWeight: 700, fontSize: '.88rem',
                  border: 'none', borderRadius: 12,
                  padding: '12px 24px',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(13,148,136,.4)',
                }}
              >
                🚀 Créer mon compte gratuit — Analyses illimitées
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Input + CTA (idle & result) ── */}
        <AnimatePresence mode="wait">
          {phase !== 'scanning' && !isRevealed && phase !== 'rate_limited' && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: phase === 'result' ? 16 : 0 }}
            >
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
                placeholder="Entrez l'URL de votre site ou le nom de votre commerce"
                disabled={phase !== 'idle'}
                style={{
                  flex: 1, minWidth: 0,
                  background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 12, padding: '11px 16px',
                  color: '#E2E8F0', fontSize: '.88rem', outline: 'none',
                  transition: 'border-color .2s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(249,115,22,.5)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)'; }}
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={phase === 'result' ? handleReset : handleScan}
                disabled={!query.trim() && phase === 'idle'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: phase === 'result' ? 'rgba(255,255,255,.07)' : 'linear-gradient(135deg, #F97316, #EA580C)',
                  color: phase === 'result' ? '#94A3B8' : '#fff',
                  fontWeight: 700, fontSize: '.85rem',
                  borderRadius: 12, padding: '11px 20px',
                  border: 'none', cursor: !query.trim() && phase === 'idle' ? 'not-allowed' : 'pointer',
                  opacity: !query.trim() && phase === 'idle' ? 0.5 : 1,
                  boxShadow: phase !== 'result' ? '0 0 24px rgba(249,115,22,.4)' : 'none',
                  whiteSpace: 'nowrap',
                  animation: phase === 'idle' && query.trim() ? 'scanPulse 1.8s ease-in-out infinite' : 'none',
                }}
              >
                {phase === 'result' ? '↺ Nouveau scan' : '⚡ Lancer le scan gratuit'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SCANNING + REVEAL PHASE: Dashboard Preview Overlay ── */}
        <AnimatePresence>
          {(phase === 'scanning' || isRevealed) && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <DashboardPreviewOverlay
                query={query}
                elapsedMs={elapsedMs}
                scanData={scanData}
                totalMs={TOTAL_SCAN_MS}
                isRevealed={isRevealed}
                onComplete={handlePreviewComplete}
              />

              {/* Mini scan steps ribbon below the preview */}
              <div style={{ marginTop: 12 }}>
                {/* Progress bar */}
                <div style={{ height: 2, background: 'rgba(255,255,255,.07)', borderRadius: 9999, marginBottom: 8, overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{
                      height: '100%', borderRadius: 9999,
                      background: isRevealed
                        ? 'linear-gradient(90deg, #0D9488, #6EE7B7)'
                        : 'linear-gradient(90deg, #06B6D4, #818CF8)',
                      boxShadow: isRevealed ? '0 0 10px rgba(13,148,136,.6)' : '0 0 10px rgba(6,182,212,.5)',
                      transition: 'background .6s',
                    }}
                  />
                </div>
                {/* Active step label OR reveal label */}
                {isRevealed ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 7 }}
                  >
                    <span style={{ fontSize: '.9rem' }}>✅</span>
                    <span style={{ color: '#6EE7B7', fontSize: '.72rem', fontWeight: 700 }}>
                      Analyse complète — Votre espace est configuré
                    </span>
                    <span style={{ marginLeft: 'auto', color: '#0D9488', fontSize: '.68rem', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                      100%
                    </span>
                  </motion.div>
                ) : currentStepIdx >= 0 && currentStepIdx < SCAN_STEPS.length ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: '.9rem' }}>{SCAN_STEPS[currentStepIdx].bot}</span>
                    <span style={{ color: '#67E8F9', fontSize: '.72rem', fontWeight: 600 }}>
                      {SCAN_STEPS[currentStepIdx].label}…
                    </span>
                    <span style={{ marginLeft: 'auto', color: '#475569', fontSize: '.68rem', fontVariantNumeric: 'tabular-nums' }}>
                      {progressPct}%
                    </span>
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── RESULT PHASE: FixChecklist ── */}
        <AnimatePresence>
          {phase === 'result' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Score banner */}
              {scanData && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                  background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)',
                  borderRadius: 14, padding: '14px 18px', marginBottom: 6,
                }}>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{
                      fontSize: '2rem', fontWeight: 900, lineHeight: 1,
                      color: scanData.aiScore >= 60 ? '#34D399' : scanData.aiScore >= 35 ? '#FBBF24' : '#F87171',
                    }}>
                      {scanData.aiScore}%
                    </div>
                    <div style={{ color: '#64748B', fontSize: '.65rem', fontWeight: 600, marginTop: 2 }}>Score G.E.O.</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#E2E8F0', fontWeight: 700, fontSize: '.88rem', margin: '0 0 3px' }}>
                      ⚠️ Visibilité IA insuffisante pour « {query} »
                    </p>
                    <p style={{ color: '#94A3B8', fontSize: '.75rem', margin: 0 }}>
                      {BLOCKER_ITEMS.length} points de blocage détectés — corrigez-les en 1 clic ci-dessous
                    </p>
                  </div>
                </div>
              )}

              <FixChecklist items={BLOCKER_ITEMS} onCta={onCta} query={query} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Post-scan onboarding modal ── */}
      <ScanOnboardingModal
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        query={query}
        scanData={scanData}
        onFinish={() => { setOnboardingOpen(false); onCta(); }}
      />

      <style>{`
        @keyframes scanPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}