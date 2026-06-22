import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@blinkdotnew/ui';
import { ArrowLeft, KeyRound, Eye, EyeOff, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { blink } from '../blink/client';
import { KompilotLogo } from '../components/brand/KompilotLogo';
function Logo() { return <KompilotLogo variant="icon" height={40} />; }

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    { label: '8 caractères minimum', ok: password.length >= 8 },
    { label: 'Une majuscule', ok: /[A-Z]/.test(password) },
    { label: 'Un chiffre', ok: /[0-9]/.test(password) },
  ];

  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-red-400', 'bg-amber-400', 'bg-green-500'];
  const labels = ['Faible', 'Moyen', 'Fort'];

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : 'bg-muted'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {checks.map(c => (
            <span key={c.label} className={`flex items-center gap-1 text-[11px] ${c.ok ? 'text-green-600' : 'text-muted-foreground'}`}>
              {c.ok ? <CheckCircle size={10} /> : <XCircle size={10} />}
              {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={`text-[11px] font-semibold ${score === 3 ? 'text-green-600' : score === 2 ? 'text-amber-600' : 'text-red-600'}`}>
            {labels[score - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'invalid'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Extract token from URL — handles both ?token= (standard) and #token= (some email clients)
  // Also handles the case where Safari strips query params on redirect.
  useEffect(() => {
    // 1. Standard query string: /reset-password?token=xxx
    const params = new URLSearchParams(window.location.search);
    let t = params.get('token');

    // 2. Hash fragment fallback: /reset-password#token=xxx (some email clients rewrite URLs)
    if (!t && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
      t = hashParams.get('token');
    }

    // 3. Path segment fallback: /reset-password/xxx (in case of CDN rewrite)
    if (!t) {
      const pathMatch = window.location.pathname.match(/\/reset-password\/([^/?#]+)/);
      if (pathMatch) t = pathMatch[1];
    }

    if (!t) {
      setStatus('invalid');
    } else {
      setToken(t);
    }
  }, []);

  const isStrong = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  const matches = password === confirm;
  const canSubmit = isStrong && matches && confirm.length > 0 && status !== 'loading';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !token) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      await blink.auth.confirmPasswordReset(token, password);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      if (err?.message?.includes('expired') || err?.code === 'TOKEN_EXPIRED') {
        setErrorMsg('Ce lien a expiré. Veuillez en demander un nouveau.');
      } else if (err?.message?.includes('invalid') || err?.code === 'INVALID_TOKEN') {
        setErrorMsg('Lien invalide. Veuillez en demander un nouveau.');
      } else {
        setErrorMsg('Une erreur est survenue. Veuillez réessayer.');
      }
    }
  };

  /* ── Invalid / missing token ─────────────────────────────────── */
  if (status === 'invalid') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <Logo />
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Lien invalide</h1>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-4 text-center">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                <AlertCircle size={28} className="text-red-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ce lien de réinitialisation est invalide ou a expiré.<br />
              Veuillez en demander un nouveau.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Demander un nouveau lien →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Success ─────────────────────────────────────────────────── */
  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <Logo />
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Mot de passe modifié !</h1>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-5 text-center">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                <CheckCircle size={28} className="text-green-600" />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground">Tout est prêt !</p>
              <p className="text-sm text-muted-foreground">
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
              </p>
            </div>
            <Button
              onClick={() => navigate({ to: '/login' })}
              size="lg"
              className="w-full gap-2"
            >
              Se connecter →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form ────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <Link
        to="/login"
        className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} /> Retour à la connexion
      </Link>

      <div className="w-full max-w-sm space-y-8">
        {/* Logo + brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Nouveau mot de passe</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Choisissez un mot de passe sécurisé pour votre compte.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-input bg-background pl-9 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label htmlFor="confirm" className="text-sm font-medium text-foreground">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full rounded-lg border bg-background pl-9 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                    confirm && !matches ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-input focus:border-primary'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {confirm && !matches && (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <XCircle size={11} /> Les mots de passe ne correspondent pas.
                </p>
              )}
              {confirm && matches && (
                <p className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle size={11} /> Les mots de passe correspondent.
                </p>
              )}
            </div>

            {/* API error */}
            {status === 'error' && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                <AlertCircle size={14} className="text-red-600 shrink-0" />
                <p className="text-xs text-red-700">{errorMsg}</p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full gap-2"
              disabled={!canSubmit}
            >
              {status === 'loading' ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  Réinitialiser le mot de passe
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
