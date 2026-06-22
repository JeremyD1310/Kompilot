import { useState, useRef, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { blink } from '../blink/client';
import { KompilotLogo } from '../components/brand/KompilotLogo';

function Logo() {
  return <KompilotLogo variant="icon" height={44} />;
}

/**
 * Returns the canonical app origin, preferring the production domain.
 * Falls back to window.location.origin in dev/preview.
 */
function getResetRedirectUrl(): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  // Always redirect to the current domain — works on kompilot.fr, .blinkpowered.com, and localhost
  return `${origin}/reset-password`;
}

const RESEND_COOLDOWN = 60;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup interval on unmount to avoid state updates on unmounted component
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  function startCooldown() {
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    setCooldown(RESEND_COOLDOWN);
    cooldownIntervalRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownIntervalRef.current!);
          cooldownIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || status === 'loading') return;

    setStatus('loading');
    setErrorMsg('');

    try {
      // Primary path: use the built-in SDK email (handles delivery, tokens, and whitelisting automatically)
      await blink.auth.sendPasswordResetEmail(email.trim(), {
        redirectUrl: getResetRedirectUrl(),
      });
      setStatus('sent');
      startCooldown();
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      const code: string = err?.code ?? '';

      // User not found → show success to prevent email enumeration
      if (
        code === 'USER_NOT_FOUND' ||
        msg.toLowerCase().includes('not found') ||
        msg.toLowerCase().includes('no user') ||
        msg.toLowerCase().includes('does not exist')
      ) {
        setStatus('sent');
        startCooldown();
        return;
      }

      // Rate limit
      if (
        code === 'RATE_LIMITED' ||
        msg.toLowerCase().includes('rate') ||
        msg.toLowerCase().includes('limit') ||
        msg.toLowerCase().includes('too many')
      ) {
        setStatus('error');
        setErrorMsg('Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.');
        return;
      }

      // Network / CORS / domain error
      if (
        msg.toLowerCase().includes('network') ||
        msg.toLowerCase().includes('cors') ||
        msg.toLowerCase().includes('fetch') ||
        msg.toLowerCase().includes('failed')
      ) {
        setStatus('error');
        setErrorMsg('Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.');
        return;
      }

      // Any other error — show a generic but visible message
      setStatus('error');
      setErrorMsg(msg || 'Une erreur est survenue. Veuillez réessayer dans quelques instants.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div style={{
      backgroundColor: '#0B1120', minHeight: '100vh', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative',
    }}>
      <style>{`
        @keyframes fpIn { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }
        .fp-card { animation: fpIn .4s cubic-bezier(.4,0,.2,1) both; }
        .fp-field {
          width: 100%; background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.09); border-radius: 12px;
          padding: 14px 16px 14px 42px; font-size: .92rem; color: #F1F5F9; outline: none;
          transition: border-color .2s, box-shadow .2s; box-sizing: border-box;
          font-family: inherit;
        }
        .fp-field::placeholder { color: rgba(148,163,184,.45); }
        .fp-field:focus { border-color: rgba(13,148,136,.55); box-shadow: 0 0 0 3px rgba(13,148,136,.1); }
        .fp-field-err { border-color: rgba(239,68,68,.4) !important; }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      {/* Back link */}
      <Link to="/login" style={{
        position: 'absolute', top: 24, left: 24, color: 'var(--muted-foreground, #64748B)',
        fontSize: '.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
        transition: 'color .2s',
      }} className="hover:text-slate-300">
        ← Retour à la connexion
      </Link>

      <div className="fp-card" style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Logo />
          </div>
          <h1 style={{ color: '#F8FAFC', fontSize: '1.55rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 7 }}>
            Mot de passe oublié ?
          </h1>
          <p style={{ color: 'var(--muted-foreground, #64748B)', fontSize: '.875rem', lineHeight: 1.55 }}>
            Saisissez votre email et nous vous enverrons un lien pour choisir un nouveau mot de passe.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#111c2e', border: '1px solid rgba(255,255,255,.07)',
          borderRadius: 24, padding: '36px 36px 32px',
          boxShadow: '0 28px 72px rgba(0,0,0,.55)',
        }}>
          {status === 'sent' ? (
            /* ── Success state ─────────────────────────────────────── */
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle size={28} style={{ color: '#22C55E' }} />
              </div>
              <div>
                <p style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>
                  Email envoyé !
                </p>
                <p style={{ color: '#64748B', fontSize: '.875rem', lineHeight: 1.6, margin: 0 }}>
                  Si un compte existe pour{' '}
                  <span style={{ color: '#CBD5E1', fontWeight: 600 }}>{email}</span>,
                  vous recevrez un lien de réinitialisation dans quelques minutes.
                </p>
                <p style={{ color: 'var(--muted-foreground, #64748B)', fontSize: '.78rem', marginTop: 10 }}>
                  Pensez à vérifier vos spams. Le lien expire dans 1 heure.
                </p>
              </div>

              {/* Resend */}
              <button
                onClick={() => handleSubmit()}
                disabled={cooldown > 0 || status === 'loading'}
                style={{
                  background: 'transparent', border: 'none',
                  cursor: cooldown > 0 ? 'default' : 'pointer',
                  color: cooldown > 0 ? 'var(--muted-foreground, #64748B)' : '#0D9488', fontSize: '.82rem',
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0',
                  opacity: cooldown > 0 ? 0.6 : 1, transition: 'opacity .2s',
                }}
              >
                <Send size={13} />
                {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : "Renvoyer l'email"}
              </button>

              <Link to="/login" style={{
                color: '#0D9488', fontSize: '.85rem', fontWeight: 600,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <ArrowLeft size={13} /> Retour à la connexion
              </Link>
            </div>

          ) : (
            /* ── Form ──────────────────────────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{
                  display: 'block', color: '#64748B', fontSize: '.76rem',
                  fontWeight: 600, letterSpacing: '.03em', textTransform: 'uppercase', marginBottom: 8,
                }}>
                  Adresse e-mail
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{
                    position: 'absolute', left: 14, top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--muted-foreground, #64748B)', pointerEvents: 'none',
                  }} />
                  <input
                    type="email"
                    className={`fp-field${status === 'error' ? ' fp-field-err' : ''}`}
                    placeholder="vous@example.com"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      setErrorMsg('');
                      if (status === 'error') setStatus('idle');
                    }}
                    onKeyDown={handleKeyDown}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {/* Error banner — always visible when status === 'error' */}
              {status === 'error' && errorMsg && (
                <div style={{
                  background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)',
                  borderRadius: 10, padding: '12px 14px',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <AlertCircle size={16} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ color: '#f87171', fontSize: '.82rem', fontWeight: 600, margin: '0 0 2px' }}>
                      Une erreur est survenue
                    </p>
                    <p style={{ color: '#fca5a5', fontSize: '.78rem', margin: 0, lineHeight: 1.5 }}>
                      {errorMsg}
                    </p>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={() => handleSubmit()}
                disabled={status === 'loading' || !email.trim()}
                style={{
                  width: '100%', background: '#0D9488', color: '#fff', fontWeight: 700,
                  border: 'none', borderRadius: 12, padding: '16px 0', fontSize: '1rem',
                  cursor: (status === 'loading' || !email.trim()) ? 'not-allowed' : 'pointer',
                  transition: 'opacity .2s, transform .15s',
                  opacity: (status === 'loading' || !email.trim()) ? 0.65 : 1,
                  boxShadow: '0 4px 24px rgba(13,148,136,.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'inherit',
                }}
                className="active:scale-[.98]"
              >
                {status === 'loading' ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      style={{ animation: 'spin .8s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                        strokeDasharray="40" strokeDashoffset="10" strokeLinecap="round" />
                    </svg>
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    Envoyer le lien de réinitialisation
                  </>
                )}
              </button>

              <p style={{ color: 'var(--muted-foreground, #64748B)', fontSize: '.78rem', textAlign: 'center', margin: 0 }}>
                Vous vous souvenez ?{' '}
                <Link to="/login" style={{ color: '#0D9488', fontWeight: 600, textDecoration: 'none' }}>
                  Se connecter
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
