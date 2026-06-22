import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Shield, Copy, Check, Play } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { blink } from '../blink/client';
import { readSessionMemory, clearSessionMemory } from '../hooks/useOnboardingProfile';
import { useAdmin } from '../context/AdminContext';
import { useDemoMode } from '../context/DemoModeContext';
import { useDemoView } from '../context/DemoViewContext';
import { isDemoCredentials, saveDemoSession, DEMO_EMAIL } from '../lib/demoAccount';
import { analyticsTrackLogin, analyticsTrackSignup } from '../firebase/analytics';


import { KompilotLogo } from '../components/brand/KompilotLogo';

/* ── Constants ──────────────────────────────────────────────────────────────── */
const DEMO_PASSWORD = 'DemoPassword2026!';
const REMEMBER_ME_KEY = 'nc_remember_email';

/* ── Logo ──────────────────────────────────────────────────────────────────── */
function Logo({ size = 44 }: { size?: number }) {
  return <KompilotLogo variant="icon" height={size} />;
}

/* ── Google icon ───────────────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ── Copy button ───────────────────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copier"
      style={{
        background: copied ? 'rgba(13,148,136,.25)' : 'rgba(255,255,255,.07)',
        border: `1px solid ${copied ? 'rgba(45,212,191,.5)' : 'rgba(255,255,255,.1)'}`,
        borderRadius: 7, padding: '4px 8px', cursor: 'pointer',
        color: copied ? '#2DD4BF' : '#94A3B8',
        display: 'flex', alignItems: 'center', gap: 4,
        fontSize: '.72rem', fontWeight: 600,
        transition: 'all .2s', flexShrink: 0,
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copié !' : 'Copier'}
    </button>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [sessionMemory] = useState(readSessionMemory);
  const { enterAdminMode } = useAdmin();
  const { activateDemo } = useDemoMode();
  const { activateSwitcher } = useDemoView();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem(REMEMBER_ME_KEY) ?? ''; } catch { return ''; }
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try { return !!localStorage.getItem(REMEMBER_ME_KEY); } catch { return false; }
  });

  const firstName = sessionMemory?.displayName?.split(' ')[0]
    ?? sessionMemory?.email?.split('@')[0]
    ?? null;

  useEffect(() => {
    // Don't redirect while auth is still loading — avoids flash on Safari
    if (isLoading) return;
    if (isAuthenticated) navigate({ to: '/dashboard' });
  }, [isAuthenticated, isLoading, navigate]);

  /* Loading spinner ─────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0B1120' }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid rgba(13,148,136,.15)',
          borderTop: '3px solid #0D9488',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  /* ── Email + password login ──────────────────────────────────────────── */
  const handleEmailLogin = async () => {
    if (loggingIn || googleLoading || !email.trim() || !password.trim()) return;
    // Basic client-side email validation to avoid pointless API round-trips
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLoginError('Adresse e-mail invalide. Vérifiez le format.');
      return;
    }
    setLoginError('');
    setLoggingIn(true);

    // Persist / clear remembered email
    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }
    } catch { /* noop */ }

    // ── Demo account bypass ───────────────────────────────────────────────
    // Intercept BEFORE any real API call.
    if (isDemoCredentials(email, password)) {
      // 1. Persist a synthetic session so useAuth picks it up after navigation
      saveDemoSession();
      // 2. Activate demo mode (banner, credits, etc.)
      activateDemo();
      // 3. Unlock the Pro/Agency switcher
      activateSwitcher();
      // 4. Reset loading state BEFORE navigation to avoid stuck button if navigate fails
      setLoggingIn(false);
      navigate({ to: '/dashboard' });
      return;
    }
    // ─────────────────────────────────────────────────────────────────────

    try {
      await blink.auth.signInWithEmail(email.trim(), password);
      analyticsTrackLogin('email');
      // onAuthStateChanged will detect the new session → useEffect redirects
    } catch (err: any) {
      const code: string = err?.code ?? '';
      const msg: string = err?.message ?? '';
      if (code === 'EMAIL_NOT_VERIFIED' || msg.toLowerCase().includes('verified')) {
        setLoggingIn(false);
        navigate({ to: '/email-unverified' });
        return;
      } else if (
        code === 'INVALID_CREDENTIALS' ||
        msg.toLowerCase().includes('invalid') ||
        msg.toLowerCase().includes('credentials') ||
        msg.toLowerCase().includes('password')
      ) {
        setLoginError('Email ou mot de passe incorrect. Vérifiez vos identifiants.');
      } else if (code === 'RATE_LIMITED' || msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('limit')) {
        setLoginError('Trop de tentatives. Patientez quelques instants puis réessayez.');
      } else {
        setLoginError(msg || 'Une erreur est survenue. Veuillez réessayer.');
      }
      setLoggingIn(false);
    }
  };

  /* ── Google OAuth login ──────────────────────────────────────────────── */
  const handleGoogleLogin = async () => {
    if (googleLoading) return;
    setLoginError('');
    setGoogleLoading(true);
    try {
      await blink.auth.signInWithGoogle();
      analyticsTrackLogin('google');
      // onAuthStateChanged will handle the redirect
    } catch (err: any) {
      const code: string = err?.code ?? '';
      const msg: string = err?.message ?? '';
      if (code === 'POPUP_CANCELED' || msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('closed')) {
        // User dismissed the popup — not an error
      } else {
        setLoginError('La connexion Google a échoué. Veuillez réessayer.');
      }
      setGoogleLoading(false);
    }
  };

  /* ── Reconnect for remembered session ───────────────────────────────── */
  const handleReconn = handleGoogleLogin; // fallback — Google is the most common provider
  const handleSwitch = () => { clearSessionMemory(); window.location.reload(); };

  /* Enter key submits form ──────────────────────────────────────────────── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEmailLogin();
  };

  /* ── Instant demo login ──────────────────────────────────────────────── */
  const handleInstantDemo = () => {
    if (loggingIn || googleLoading) return;
    setLoginError('');
    setLoggingIn(true);
    saveDemoSession();
    activateDemo();
    activateSwitcher();
    setLoggingIn(false);
    navigate({ to: '/dashboard' });
  };

  /* ── Page ──────────────────────────────────────────────────────────────── */
  return (
    <div style={{ backgroundColor: '#0B1120', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }}>
      <style>{`
        @keyframes loginIn { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }
        .lc { animation: loginIn .4s cubic-bezier(.4,0,.2,1) both; }
        .nc-field {
          width: 100%; background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.09); border-radius: 12px;
          padding: 14px 16px; font-size: .92rem; color: #F1F5F9; outline: none;
          transition: border-color .2s, box-shadow .2s; box-sizing: border-box;
          font-family: inherit;
        }
        .nc-field::placeholder { color: rgba(148,163,184,.45); }
        .nc-field:focus { border-color: rgba(13,148,136,.55); box-shadow: 0 0 0 3px rgba(13,148,136,.1); }
        .nc-field-pw { padding-right: 44px; }
        .nc-field-err { border-color: rgba(239,68,68,.5) !important; }
      `}</style>

      {/* Back link */}
      <Link to="/" style={{ position: 'absolute', top: 24, left: 24, color: 'var(--muted-foreground, #64748B)', fontSize: '.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'color .2s' }}
        className="hover:text-slate-300">
        ← Retour à l'accueil
      </Link>

      {/* ── Card ──────────────────────────────────────────────────────────── */}
      <div className="lc" style={{
        width: '100%', maxWidth: 420,
        background: '#111c2e',
        border: '1px solid rgba(255,255,255,.07)',
        borderRadius: 24,
        padding: '44px 40px 40px',
        boxShadow: '0 28px 72px rgba(0,0,0,.55)',
      }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <Logo size={52} />
          </div>
          <h1 style={{ color: '#F8FAFC', fontSize: '1.55rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 7 }}>
            {sessionMemory
              ? `Bon retour${firstName ? `, ${firstName}` : ''} !`
              : 'Heureux de vous revoir !'}
          </h1>
          <p style={{ color: 'var(--muted-foreground, #64748B)', fontSize: '.875rem' }}>
            {sessionMemory
              ? sessionMemory.email
              : 'Votre chiffre d\'affaires vous attend. Connectez-vous.'}
          </p>
        </div>

        {/* ── Remembered session ────────────────────────────────────────── */}
        {sessionMemory ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'rgba(13,148,136,.08)', border: '1px solid rgba(13,148,136,.22)', borderRadius: 14, padding: '16px 20px', marginBottom: 4 }}>
              <p style={{ color: '#2DD4BF', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5 }}>Compte reconnu</p>
              <p style={{ color: '#F1F5F9', fontSize: '.9rem', fontWeight: 600 }}>{sessionMemory.email}</p>
            </div>
            <button onClick={handleReconn} style={{ width: '100%', background: '#0D9488', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 12, padding: '15px 0', fontSize: '.95rem', cursor: 'pointer', transition: 'opacity .2s', boxShadow: '0 4px 20px rgba(13,148,136,.3)' }}
              className="hover:opacity-90">
              Continuer en tant que {firstName ?? sessionMemory.email}
            </button>
            <button onClick={handleSwitch} style={{ width: '100%', background: 'transparent', color: 'var(--muted-foreground, #64748B)', fontSize: '.85rem', border: 'none', padding: '10px 0', cursor: 'pointer' }}
              className="hover:text-slate-300 transition-colors">
              Utiliser un autre compte
            </button>
          </div>

        ) : (
          /* ── Standard login form ────────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Email */}
            <div>
              <label style={{ display: 'block', color: '#64748B', fontSize: '.76rem', fontWeight: 600, letterSpacing: '.03em', textTransform: 'uppercase', marginBottom: 8 }}>
                Adresse e-mail
              </label>
              <input
                type="email"
                className={`nc-field${loginError ? ' nc-field-err' : ''}`}
                placeholder="vous@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setLoginError(''); }}
                onKeyDown={handleKeyDown}
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ color: '#64748B', fontSize: '.76rem', fontWeight: 600, letterSpacing: '.03em', textTransform: 'uppercase' }}>
                  Mot de passe
                </label>
                <Link to="/forgot-password"
                  style={{ color: '#0D9488', fontSize: '.78rem', textDecoration: 'none', transition: 'opacity .2s' }}
                  className="hover:opacity-75">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  className={`nc-field nc-field-pw${loginError ? ' nc-field-err' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                  onKeyDown={handleKeyDown}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground, #64748B)', padding: 0, display: 'flex', transition: 'color .2s' }}
                  className="hover:text-slate-300">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
              <div
                onClick={() => setRememberMe(v => !v)}
                style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  border: rememberMe ? 'none' : '1.5px solid rgba(255,255,255,.2)',
                  background: rememberMe ? '#0D9488' : 'rgba(255,255,255,.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .2s', cursor: 'pointer',
                }}
              >
                {rememberMe && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{ color: '#94A3B8', fontSize: '.83rem' }}>
                Se souvenir de moi — facilite l'accès quotidien
              </span>
            </label>

            {/* Error message */}
            {loginError && (
              <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: '.8rem', lineHeight: 1.5 }}>
                {loginError}
              </div>
            )}

            {/* Primary CTA */}
            <button
              onClick={handleEmailLogin}
              disabled={loggingIn || !email.trim() || !password.trim()}
              style={{ width: '100%', background: '#0D9488', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 12, padding: '16px 0', fontSize: '1rem', cursor: loggingIn ? 'not-allowed' : 'pointer', transition: 'opacity .2s, transform .15s', marginTop: 4, boxShadow: '0 4px 24px rgba(13,148,136,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (loggingIn || !email.trim() || !password.trim()) ? 0.65 : 1 }}
              className="active:scale-[.98]"
            >
              {loggingIn ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin .8s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" strokeLinecap="round" />
                  </svg>
                  Connexion en cours…
                </>
              ) : 'Se connecter'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '2px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.06)' }} />
              <span style={{ color: 'var(--muted-foreground, #64748B)', fontSize: '.75rem' }}>ou</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.06)' }} />
            </div>

            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '14px 0', color: '#94A3B8', fontSize: '.9rem', fontWeight: 600, cursor: googleLoading ? 'not-allowed' : 'pointer', transition: 'all .2s', opacity: googleLoading ? 0.65 : 1 }}
              className="hover:border-white/20 hover:text-slate-200"
            >
              {googleLoading ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin .8s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" strokeLinecap="round" />
                </svg>
              ) : <GoogleIcon />}
              {googleLoading ? 'Connexion…' : 'Continuer avec Google'}
            </button>

            {/* Terms */}
            <p style={{ color: 'var(--muted-foreground, #64748B)', fontSize: '.72rem', textAlign: 'center', lineHeight: 1.55, marginTop: 4 }}>
              En continuant, vous acceptez nos{' '}
              <Link to="/legal" style={{ color: '#0D9488', textDecoration: 'none' }}>Mentions légales</Link>{' '}
              et notre{' '}
              <Link to="/privacy" style={{ color: '#0D9488', textDecoration: 'none' }}>Politique de confidentialité</Link>.
            </p>
          </div>
        )}
      </div>

      {/* Sign-up nudge */}
      {!sessionMemory && (
        <p style={{ color: 'var(--muted-foreground, #64748B)', fontSize: '.82rem', marginTop: 22 }}>
          Pas encore de compte ?{' '}
          <Link to="/signup"
            style={{ color: '#0D9488', fontWeight: 600, textDecoration: 'none' }}>
            Déployer mon moteur de croissance 🚀
          </Link>
        </p>
      )}

      {/* ── Accès Démo Client ────────────────────────────────────────────────── */}
      {!sessionMemory && (
        <div className="lc" style={{
          width: '100%', maxWidth: 420, marginTop: 16,
          background: 'rgba(13,148,136,.06)',
          border: '1px solid rgba(13,148,136,.2)',
          borderRadius: 18,
          padding: '24px 28px',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(13,148,136,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Play size={14} color="#2DD4BF" fill="#2DD4BF" />
            </div>
            <span style={{ color: '#2DD4BF', fontSize: '.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em' }}>
              Accès Démo Client
            </span>
          </div>

          <p style={{ color: '#94A3B8', fontSize: '.78rem', lineHeight: 1.55, marginBottom: 18 }}>
            Explorez l'interface avec un aperçu complet de toutes les fonctionnalités, sans aucune restriction.{' '}
            <span style={{ color: 'rgba(148,163,184,.6)' }}>Note : Ce compte de démonstration est partagé entre les testeurs.</span>
          </p>

          {/* Credentials */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {/* Email */}
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#64748B', fontSize: '.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>Email</div>
                <div style={{ color: '#E2E8F0', fontSize: '.83rem', fontFamily: 'monospace', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>demo@kompilot.ai</div>
              </div>
              <CopyButton text="demo@kompilot.ai" />
            </div>

            {/* Password */}
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#64748B', fontSize: '.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>Mot de passe</div>
                <div style={{ color: '#E2E8F0', fontSize: '.83rem', fontFamily: 'monospace', fontWeight: 500 }}>{DEMO_PASSWORD}</div>
              </div>
              <CopyButton text={DEMO_PASSWORD} />
            </div>
          </div>

          {/* Instant login CTA */}
          <button
            onClick={handleInstantDemo}
            disabled={loggingIn || googleLoading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'linear-gradient(135deg, #0D9488, #0891b2)',
              color: '#fff', fontWeight: 700, border: 'none', borderRadius: 12,
              padding: '13px 0', fontSize: '.9rem', cursor: (loggingIn || googleLoading) ? 'not-allowed' : 'pointer',
              transition: 'opacity .2s, transform .15s',
              boxShadow: '0 4px 20px rgba(13,148,136,.3)',
              opacity: (loggingIn || googleLoading) ? 0.65 : 1,
            }}
            className="active:scale-[.98]"
          >
            <Play size={15} fill="currentColor" />
            Connexion Instantanée
          </button>
        </div>
      )}

      {/* Admin access — discreet */}
      <div style={{ marginTop: 14, width: '100%', maxWidth: 420 }}>
        <button onClick={() => { enterAdminMode(); navigate({ to: '/admin' }); }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', border: '1px dashed rgba(255,255,255,.06)', borderRadius: 10, color: 'rgba(71,85,105,.6)', fontSize: '.74rem', padding: '10px 0', cursor: 'pointer', transition: 'all .2s' }}
          className="hover:border-white/10 hover:text-slate-500">
          <Shield size={11} />
          🔑 Accès Admin (interne)
        </button>
      </div>
    </div>
  );
}
