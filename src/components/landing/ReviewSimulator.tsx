/**
 * ReviewSimulator — Floating Google Review bubble
 * - No macOS title bar (completely removed)
 * - Slightly tilted card (-2deg) for depth & dynamism
 * - "⭐ Google Review" badge top-left
 * - Vibrant CTA button
 * - Deep box-shadow to visually float above the ChatGPT simulator
 * - On CTA click: smooth-scrolls to #how-to-start + emerald flash on Step 1
 */
import React, { useState, useRef } from 'react';
import { Star, Sparkles, RotateCcw, CheckCircle2 } from 'lucide-react';
import { LandingDemoLimitModal } from './LandingDemoLimitModal';

// ── Demo use counter (anonymous visitors, stored in localStorage) ─────────────
const DEMO_SIM_KEY = 'nc_landing_sim_count';
const DEMO_SIM_MAX = 2;

function getDemoCount(): number {
  try { return Math.min(Number(localStorage.getItem(DEMO_SIM_KEY) ?? '0'), DEMO_SIM_MAX + 1); }
  catch { return 0; }
}
function incrementDemoCount(): number {
  try {
    const next = getDemoCount() + 1;
    localStorage.setItem(DEMO_SIM_KEY, String(next));
    return next;
  } catch { return 1; }
}

/** Scroll to the onboarding section and briefly flash Step 1 with emerald glow */
function scrollToOnboarding() {
  const target = document.getElementById('how-to-start');
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Flash Step 1 after scroll settles (~700 ms)
    setTimeout(() => {
      const step1 = target.querySelector<HTMLElement>('[data-step="1"]');
      if (step1) {
        step1.style.transition = 'box-shadow 0.3s ease, outline 0.3s ease';
        step1.style.boxShadow = '0 0 0 3px rgba(16,185,129,.7), 0 0 32px rgba(16,185,129,.35)';
        step1.style.outline = '2px solid rgba(16,185,129,.6)';
        step1.style.borderRadius = '20px';
        setTimeout(() => {
          step1.style.boxShadow = '';
          step1.style.outline = '';
        }, 1800);
      }
    }, 700);
  }
}

export function ReviewSimulator() {
  const fullResponse =
    "Merci beaucoup Marie pour votre retour positif ! Nous prenons note de votre remarque sur les délais — nous travaillons activement à l'améliorer. À très bientôt ! 🙏";

  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTyping = () => {
    if (isTyping || isComplete) return;
    setIsTyping(true);
    let index = 0;
    intervalRef.current = setInterval(() => {
      index++;
      setTypedText(fullResponse.slice(0, index));
      if (index >= fullResponse.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsTyping(false);
        setIsComplete(true);
      }
    }, 28);
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTypedText('');
    setIsTyping(false);
    setIsComplete(false);
  };

  const closeLimitModal = () => setLimitModalOpen(false);

  const handleCtaClick = () => {
    const count = incrementDemoCount();
    // After hitting the cap, show the upgrade modal instead of running the sim again
    if (count > DEMO_SIM_MAX) {
      setLimitModalOpen(true);
      return;
    }
    startTyping();
    scrollToOnboarding();
  };

  return (
    <>
    <div style={{
      maxWidth: 370,
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto',
      // Slight tilt for depth & dynamism
      transform: 'rotate(-1.8deg)',
      // Deep shadow makes it "float" well above the ChatGPT simulator
      filter: 'drop-shadow(0 32px 64px rgba(0,0,0,.70)) drop-shadow(0 12px 28px rgba(251,188,4,.18))',
      position: 'relative',
      zIndex: 2,
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 18,
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,.12)',
        boxShadow: '0 40px 80px -16px rgba(0,0,0,.55), 0 0 0 1px rgba(251,188,4,.22), 0 8px 24px rgba(0,0,0,.25)',
      }}>
        {/* ── Google Review badge ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px 0',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'linear-gradient(135deg, #FBBC04, #FF9900)',
            color: '#fff',
            fontWeight: 800, fontSize: '.7rem', letterSpacing: '.04em',
            borderRadius: 9999, padding: '3px 10px',
            boxShadow: '0 2px 8px rgba(251,188,4,.45)',
          }}>
            ⭐ Google Review
          </span>
          {/* Google G logo */}
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.2 33.6 29.7 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 6 1.1 8.2 3l6-6C34.4 5.2 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.8 0 20.2-7.7 21.7-18.2.2-1.2.3-2.5.3-3.8 0-1.1-.1-2-.5-3z"/>
            <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16 19.3 13 24 13c3.1 0 6 1.1 8.2 3l6-6C34.4 5.2 29.5 3 24 3 16.1 3 9.4 7.9 6.3 14.7z"/>
            <path fill="#FBBC05" d="M24 45c5.4 0 10.4-2 14.1-5.2l-6.5-5.5C29.6 36.2 26.9 37 24 37c-5.6 0-10.2-3.4-12-8.3l-7 5.4C8.9 41.2 16 45 24 45z"/>
            <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.8 3.1-2.9 5.7-5.8 7.3l6.5 5.5C40.7 37.4 44 31.4 44 24c0-1.4-.2-2.7-.5-4z"/>
          </svg>
        </div>

        {/* ── Reviewer info ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 8px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #F97316, #EF4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '.85rem', flexShrink: 0,
          }}>M</div>
          <div>
            <p style={{ margin: 0, fontSize: '.82rem', fontWeight: 700, color: '#1F2937', lineHeight: 1.2 }}>Marie D.</p>
            <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i} size={11}
                  fill={i < 4 ? '#FBBC04' : 'none'}
                  style={{ color: i < 4 ? '#FBBC04' : '#D1D5DB' }}
                />
              ))}
            </div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '.7rem', color: '#9CA3AF', fontWeight: 500 }}>Il y a 2 jours</span>
        </div>

        {/* ── Review text ── */}
        <div style={{ padding: '0 16px 12px', borderBottom: '1px solid rgba(0,0,0,.07)' }}>
          <p style={{ margin: 0, fontSize: '.82rem', color: '#374151', lineHeight: 1.6, fontStyle: 'italic' }}>
            "Très bon service mais j'aurais aimé plus de rapidité dans les délais."
          </p>
        </div>

        {/* ── AI Action area ── */}
        <div style={{ padding: '12px 16px 16px', background: 'rgba(13,148,136,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Sparkles size={11} style={{ color: '#0D9488' }} />
            <span style={{ fontSize: '.65rem', fontWeight: 800, color: '#0D9488', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              🤖 Réponse IA Kompilot
            </span>
          </div>

          {/* Response box */}
          <div style={{
            minHeight: 72, padding: '10px 12px', borderRadius: 12,
            background: 'rgba(255,255,255,.8)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(13,148,136,.25)',
            fontSize: '.78rem', color: '#1F2937', lineHeight: 1.65,
            position: 'relative', marginBottom: 10,
          }}>
            {typedText || (
              <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Prêt à répondre instantanément…</span>
            )}
            {isTyping && (
              <span style={{ display: 'inline-block', width: 6, height: 12, background: '#0D9488', borderRadius: 2, marginLeft: 2, verticalAlign: 'middle', animation: 'blinkGR .7s infinite' }} />
            )}
            {isComplete && (
              <div style={{
                position: 'absolute', top: 8, right: 8,
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.4)',
                borderRadius: 9999, padding: '2px 8px',
              }}>
                <CheckCircle2 size={9} style={{ color: '#10B981' }} />
                <span style={{ fontSize: '.62rem', fontWeight: 800, color: '#10B981' }}>Réponse envoyée !</span>
              </div>
            )}
          </div>

          {/* CTA button — vibrant amber/orange to stand out immediately */}
          {!isComplete ? (
            <button
              onClick={handleCtaClick}
              disabled={isTyping}
              style={{
                width: '100%', height: 46,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: isTyping
                  ? 'rgba(249,115,22,.5)'
                  : 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
                color: '#fff', fontWeight: 900, fontSize: '.88rem',
                border: 'none', borderRadius: 12, cursor: isTyping ? 'not-allowed' : 'pointer',
                boxShadow: isTyping ? 'none' : '0 8px 28px rgba(249,115,22,.5), 0 0 0 3px rgba(249,115,22,.18), inset 0 1px 0 rgba(255,255,255,.25)',
                transition: 'transform .15s, box-shadow .15s',
                letterSpacing: '.02em',
                textShadow: '0 1px 3px rgba(0,0,0,.2)',
              }}
              onMouseEnter={e => {
                if (!isTyping) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 36px rgba(249,115,22,.65), 0 0 0 4px rgba(249,115,22,.25), inset 0 1px 0 rgba(255,255,255,.25)';
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(249,115,22,.5), 0 0 0 3px rgba(249,115,22,.18), inset 0 1px 0 rgba(255,255,255,.25)';
              }}
            >
              {isTyping ? (
                <>
                  <span style={{ animation: 'blinkGR .7s infinite', fontSize: '.9rem' }}>●</span>
                  Génération en cours…
                </>
              ) : (
                <>
                  <span style={{ fontSize: '1.1rem' }}>⚡</span>
                  Générer la réponse IA
                </>
              )}
            </button>
          ) : (
            <button
              onClick={reset}
              style={{
                width: '100%', height: 38,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: 'rgba(0,0,0,.06)', color: '#6B7280',
                fontWeight: 700, fontSize: '.78rem',
                border: '1px solid rgba(0,0,0,.10)', borderRadius: 12, cursor: 'pointer',
                transition: 'background .15s',
              }}
            >
              <RotateCcw size={13} />
              Réessayer
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes blinkGR { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
    {React.createElement(LandingDemoLimitModal, { open: limitModalOpen, onClose: closeLimitModal })}
    </>
  );
}