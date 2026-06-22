/**
 * LoginModal — Inline login modal for the landing page.
 * Email + password form with "Se connecter" CTA and Google sign-in.
 */
import { useState } from 'react';
import { X, Eye, EyeOff, Zap, ArrowRight } from 'lucide-react';
import { blink } from '../../blink/client';
import { Link, useNavigate } from '@tanstack/react-router';

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

interface Props {
  onClose: () => void;
}

export function LoginModal({ onClose }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Anti-spam-click
    if (!email.trim() || !password) { setError('Veuillez remplir tous les champs.'); return; }
    setLoading(true);
    setError('');
    try {
      await blink.auth.signInWithEmail(email.trim(), password);
      onClose();
      navigate({ to: '/dashboard' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('credentials') || msg.includes('password') || msg.includes('Invalid')) {
        setError('Email ou mot de passe incorrect.');
      } else if (msg.includes('verified')) {
        setError('Veuillez vérifier votre email avant de vous connecter.');
      } else if (msg.includes('network') || msg.includes('fetch')) {
        setError('Erreur réseau. Vérifiez votre connexion internet.');
      } else {
        setError('Connexion impossible. Vérifiez vos identifiants.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (googleLoading) return; // Anti-spam-click
    setGoogleLoading(true);
    setError('');
    try {
      await blink.auth.signInWithGoogle();
      onClose();
      navigate({ to: '/dashboard' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('cancel') || msg.includes('popup')) {
        setError('Connexion Google annulée.');
      } else {
        setError('Connexion Google indisponible. Réessayez.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div style={{
        background: '#111827', border: '1px solid rgba(255,255,255,.10)',
        borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,.6)',
        position: 'relative',
        animation: 'slideUp .2s ease-out both',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#94A3B8', transition: 'background .2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.06)')}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: 'rgba(13,148,136,.15)',
            border: '1px solid rgba(13,148,136,.3)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 14px',
          }}>
            <Zap size={22} color="#0D9488" />
          </div>
          <h2 style={{ color: '#F1F5F9', fontSize: '1.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Bon retour 👋
          </h2>
          <p style={{ color: '#64748B', fontSize: '.85rem', margin: '6px 0 0' }}>
            Connectez-vous à votre espace Kompilot
          </p>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 12, padding: '11px 16px', color: '#E2E8F0',
            fontSize: '.875rem', fontWeight: 600, cursor: 'pointer',
            transition: 'all .2s', marginBottom: 18, opacity: googleLoading ? .6 : 1,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.09)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.05)')}
        >
          <GoogleIcon />
          {googleLoading ? 'Connexion…' : 'Continuer avec Google'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }} />
          <span style={{ color: '#475569', fontSize: '.78rem', fontWeight: 500 }}>ou par email</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Email */}
          <div>
            <label style={{ color: '#94A3B8', fontSize: '.78rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Adresse email
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.fr"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.10)',
                borderRadius: 10, padding: '11px 14px', color: '#F1F5F9',
                fontSize: '.875rem', outline: 'none', transition: 'border .2s',
              }}
              onFocus={e => (e.currentTarget.style.border = '1px solid rgba(13,148,136,.6)')}
              onBlur={e => (e.currentTarget.style.border = '1px solid rgba(255,255,255,.10)')}
            />
          </div>

          {/* Password */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ color: '#94A3B8', fontSize: '.78rem', fontWeight: 600 }}>
                Mot de passe
              </label>
              <Link
                to="/forgot-password"
                onClick={onClose}
                style={{ color: '#0D9488', fontSize: '.75rem', fontWeight: 600, textDecoration: 'none' }}
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.10)',
                  borderRadius: 10, padding: '11px 42px 11px 14px', color: '#F1F5F9',
                  fontSize: '.875rem', outline: 'none', transition: 'border .2s',
                }}
                onFocus={e => (e.currentTarget.style.border = '1px solid rgba(13,148,136,.6)')}
                onBlur={e => (e.currentTarget.style.border = '1px solid rgba(255,255,255,.10)')}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 0,
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p style={{
              color: '#F87171', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
              borderRadius: 8, padding: '8px 12px', fontSize: '.8rem', margin: 0,
            }}>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'linear-gradient(135deg, #0D9488, #0F766E)',
              border: 'none', borderRadius: 12, padding: '12px 16px',
              color: '#fff', fontSize: '.875rem', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1,
              transition: 'opacity .2s, transform .15s', marginTop: 2,
              boxShadow: '0 4px 20px rgba(13,148,136,.35)',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? 'Connexion en cours…' : <><ArrowRight size={16} /> Se connecter</>}
          </button>
        </form>

        {/* Footer */}
        <p style={{ color: '#475569', fontSize: '.78rem', textAlign: 'center', marginTop: 20, marginBottom: 0 }}>
          Pas encore de compte ?{' '}
          <Link
            to="/signup"
            onClick={onClose}
            style={{ color: '#0D9488', fontWeight: 700, textDecoration: 'none' }}
          >
            Créer un compte gratuit
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
