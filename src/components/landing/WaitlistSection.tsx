/**
 * WaitlistSection — Premium dark-mode waitlist capture for Kompilot early access.
 *
 * Design: Deep dark backgrounds, violet primary accent, neon cyan border highlights.
 * Inspired by Madgicx / WP Rocket / Oposto aesthetics.
 *
 * Features:
 * - Native email form with Brevo SibForms POST integration
 * - Frictionless single-field (email only)
 * - Animated loading spinner on submit
 * - Premium success state after registration
 * - Responsive from 375px to desktop
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, Sparkles, Shield, Zap, Lock } from 'lucide-react';

// Brevo SibForms form ID — split to avoid bundler parsing issues
const SIB_FORM_ID_PARTS = [
  'MUIFAPnschAm9wq9A6_TkgRIXSCSVsDVBFLKI4a2JUqsyFDZZQOoc97C',
  'axvRtx2jmsBdZBJTrKWclHGqJriSGCV3VYmfMIKj9z_VeowoAJ94ynZVTpgf',
  '-KADh3bfsk1ZsCW2bAinoxWXe-E3QKns83n3wjToJH8ZT0aQadYVNT15bH8',
  '52Adyc7QijYpFgQpinZqS89pE5K3s_TzOJw',
  '',
];
const SIB_FORM_ID = SIB_FORM_ID_PARTS.join('');

async function submitToBrevo(email: string): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append('EMAIL', email);
    formData.append('EMAIL_ADDRESS_CHECK', '');
    formData.append('sib_form_id', SIB_FORM_ID);
    formData.append('locale', 'fr');
    formData.append('html_type', 'simple');

    await fetch('https://17e4d553.sibforms.com/api/v2/subscribe', {
      method: 'POST',
      body: formData,
      mode: 'no-cors',
    });

    return true;
  } catch (e) {
    console.error('[Waitlist] Brevo submit error:', e);
    return false;
  }
}

// CSS keyframes — plain string to avoid template-literal bundler issues
const INJECTED_CSS =
  '@keyframes subtlePulse { 0%,100%{opacity:0.5} 50%{opacity:1} }' +
  '@keyframes spin { to{transform:rotate(360deg)} }';

// ── Trust badge ─────────────────────────────────────────────────────────────

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: '#64748B',
        fontSize: '.7rem',
        fontWeight: 500,
        letterSpacing: '.02em',
      }}
    >
      {icon}
      {label}
    </span>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function WaitlistSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validateEmail = useCallback((v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
      if (!validateEmail(email)) { setErrorMsg('Adresse email invalide'); return; }
      setStatus('loading');
      const ok = await submitToBrevo(email);
      if (ok) { setStatus('success'); }
      else {
        const fallbackUrl =
          'https://17e4d553.sibforms.com/serve/MUIFAPnschAm9wq9A6_TkgRIXSCSVsDVBFLKI4a2JUqsyFDZZQOoc97C' +
          'axvRtx2jmsBdZBJTrKWclHGqJriSGCV3VYmfMIKj9z_VeowoAJ94ynZVTpgf' +
          '-KADh3bfsk1ZsCW2bAinoxWXe-E3QKns83n3wjToJH8ZT0aQadYVNT15bH8' +
          '52Adyc7QijYpFgQpinZqS89pE5K3s_TzOJw' + '&EMAIL=' + encodeURIComponent(email);
        window.open(fallbackUrl, '_blank');
        setStatus('success');
      }
    },
    [email, validateEmail],
  );

  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(56px,10vw,100px) 16px', background: '#06080F' }}>
      <style>{INJECTED_CSS}</style>

      {/* Violet radial glow — top-left */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,.12) 0%,transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      {/* Cyan radial glow — bottom-right */}
      <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '50%', height: '50%', borderRadius: '50%', background: 'radial-gradient(circle,rgba(34,211,238,.08) 0%,transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      {/* Subtle grid pattern */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none', maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%,black 30%,transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%,black 30%,transparent 100%)' }} />

      {/* Content */}
      <div style={{ position: 'relative', maxWidth: 580, margin: '0 auto', textAlign: 'center' }}>

        {/* Badge pill */}
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,.1)', border: '1px solid rgba(139,92,246,.25)', borderRadius: 9999, padding: '7px 18px', marginBottom: 24 }}>
            <Sparkles size={13} style={{ color: '#A78BFA' }} />
            <span style={{ color: '#A78BFA', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Accès anticipé exclusif</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, delay: 0.06, ease: [0.22, 1, 0.36, 1] }} style={{ fontSize: 'clamp(1.6rem,4.5vw,2.8rem)', fontWeight: 900, color: '#F1F5F9', lineHeight: 1.15, margin: '0 0 14px', letterSpacing: '-.035em' }}>
          Rejoignez la liste d&#39;attente{' '}
          <span style={{ background: 'linear-gradient(135deg,#A78BFA 0%,#7C3AED 40%,#22D3EE 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>exclusive</span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }} style={{ color: '#64748B', fontSize: 'clamp(.88rem,2vw,1.05rem)', lineHeight: 1.7, margin: '0 auto 36px', maxWidth: 440 }}>
          Lancement officiel le <strong style={{ color: '#A78BFA' }}>7 septembre 2026</strong>. Soyez parmi les premiers à exploiter la puissance de l&#39;IA locale.
        </motion.p>

        {/* Form card */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}>
          <div style={{ position: 'relative', background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: 'clamp(28px,5vw,44px) clamp(24px,4vw,40px)', backdropFilter: 'blur(16px)', boxShadow: '0 0 0 1px rgba(139,92,246,.06),0 32px 80px -16px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.04)' }}>
            {/* Animated gradient accent line */}
            <div style={{ position: 'absolute', top: -1, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg,transparent,#A78BFA,#22D3EE,transparent)', borderRadius: 9999, opacity: 0.5, animation: 'subtlePulse 4s ease-in-out infinite' }} />

            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '12px 0' }}>
                  <div style={{ position: 'relative' }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }} style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(139,92,246,.2),rgba(34,211,238,.15))', border: '1px solid rgba(139,92,246,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={28} style={{ color: '#A78BFA' }} />
                    </motion.div>
                    <motion.div initial={{ scale: 1, opacity: 0.5 }} animate={{ scale: 1.8, opacity: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #A78BFA', pointerEvents: 'none' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ fontSize: 'clamp(1.1rem,2.5vw,1.35rem)', fontWeight: 800, color: '#F1F5F9', margin: '0 0 6px', letterSpacing: '-.02em' }}>Félicitations !</motion.p>
                    <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ fontSize: '.92rem', color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>Votre place est sécurisée. Vérifiez votre boîte mail.</motion.p>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ fontSize: '.78rem', color: '#475569', margin: '8px 0 0' }}>Nous vous recontacterons avant le lancement.</motion.p>
                  </div>
                </motion.div>
              ) : (
                <motion.form key="form" exit={{ opacity: 0, scale: 0.96, y: -8 }} transition={{ duration: 0.25 }} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {/* Email input */}
                    <div style={{ flex: '1 1 220px', position: 'relative' }}>
                      <input
                        ref={inputRef}
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                        placeholder="votre@email.com"
                        disabled={status === 'loading'}
                        autoComplete="email"
                        aria-label="Adresse email"
                        style={{ width: '100%', padding: '15px 18px', borderRadius: 14, border: errorMsg ? '1px solid rgba(239,68,68,.5)' : '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: '#F1F5F9', fontSize: '.95rem', fontWeight: 500, fontFamily: 'Inter,system-ui,sans-serif', letterSpacing: '-.01em', outline: 'none', transition: 'border-color .2s,box-shadow .2s', boxShadow: 'none' }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,.12)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = errorMsg ? 'rgba(239,68,68,.5)' : 'rgba(255,255,255,.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                      <AnimatePresence>
                        {errorMsg && (
                          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'absolute', bottom: -20, left: 4, fontSize: '.7rem', color: '#EF4444', fontWeight: 600, margin: 0 }}>{errorMsg}</motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '15px 28px', borderRadius: 14, border: 'none', background: status === 'loading' ? 'rgba(139,92,246,.6)' : 'linear-gradient(135deg,#7C3AED 0%,#8B5CF6 50%,#6D28D9 100%)', color: '#fff', fontWeight: 700, fontSize: '.95rem', fontFamily: 'Inter,system-ui,sans-serif', letterSpacing: '-.01em', cursor: status === 'loading' ? 'wait' : 'pointer', transition: 'transform .15s,box-shadow .15s,opacity .15s', boxShadow: status === 'loading' ? 'none' : '0 8px 24px -4px rgba(124,58,237,.45),0 0 0 1px rgba(139,92,246,.2)', whiteSpace: 'nowrap', flexShrink: 0, opacity: status === 'loading' ? 0.8 : 1 }}
                      onMouseEnter={e => { if (status !== 'loading') { e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 32px -4px rgba(124,58,237,.55),0 0 0 1px rgba(139,92,246,.3)'; } }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(124,58,237,.45),0 0 0 1px rgba(139,92,246,.2)'; }}
                      onMouseDown={e => { if (status !== 'loading') e.currentTarget.style.transform = 'scale(0.98)'; }}
                      onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'; }}
                    >
                      {status === 'loading' ? (
                        <><Loader2 size={18} style={{ animation: 'spin .8s linear infinite' }} /> Inscription...</>
                      ) : (
                        <>Rejoindre la waitlist <Zap size={15} style={{ opacity: 0.8 }} /></>
                      )}
                    </button>
                  </div>

                  <p style={{ fontSize: '.75rem', color: '#475569', margin: '4px 0 0', letterSpacing: '.01em' }}>
                    <Lock size={11} style={{ display: 'inline', verticalAlign: -1, marginRight: 4 }} />
                    Pas de spam. Accès prioritaire garanti.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5, delay: 0.3 }} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px 24px', marginTop: 28 }}>
          <TrustBadge icon={<Shield size={12} style={{ color: '#475569' }} />} label="Hébergé en France · RGPD conforme" />
          <TrustBadge icon={<Zap size={12} style={{ color: '#475569' }} />} label="Accès prioritaire garanti" />
          <TrustBadge icon={<Lock size={12} style={{ color: '#475569' }} />} label="Désabonnement en 1 clic" />
        </motion.div>
      </div>
    </section>
  );
}
