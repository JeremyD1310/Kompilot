import { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { blink } from '../blink/client';
import { useNavigate } from '@tanstack/react-router';

import { KompilotLogo } from '../components/brand/KompilotLogo';
function Logo() { return <KompilotLogo variant="icon" height={40} />; }

type Status = 'verifying' | 'success' | 'error' | 'invalid';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(5);
  const hasVerifiedRef = useRef(false);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    // Extract token from URL — handles ?token= (standard), #token= (some email clients),
    // and path-segment rewrites. Works on Chrome, Firefox, Safari, Edge.
    const params = new URLSearchParams(window.location.search);
    let token = params.get('token');

    // Hash fragment fallback: /verify-email#token=xxx
    if (!token && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
      token = hashParams.get('token');
    }

    // Path segment fallback: /verify-email/xxx
    if (!token) {
      const pathMatch = window.location.pathname.match(/\/verify-email\/([^/?#]+)/);
      if (pathMatch) token = pathMatch[1];
    }

    if (!token) {
      setStatus('invalid');
      return;
    }
    if (hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;

    blink.auth.verifyEmail(token)
      .then(() => {
        setStatus('success');
        // Countdown then redirect — use SPA navigation, not full page reload
        let count = 5;
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = setInterval(() => {
          count -= 1;
          setCountdown(count);
          if (count <= 0) {
            clearInterval(countdownIntervalRef.current!);
            countdownIntervalRef.current = null;
            navigate({ to: '/dashboard' });
          }
        }, 1000);
      })
      .catch((err: any) => {
        setStatus('error');
        if (err?.code === 'TOKEN_EXPIRED' || err?.message?.toLowerCase().includes('expir')) {
          setErrorMsg('Ce lien a expiré. Les liens de vérification sont valables 24 heures.');
        } else if (err?.code === 'INVALID_TOKEN' || err?.message?.toLowerCase().includes('invalid')) {
          setErrorMsg('Ce lien est invalide. Il a peut-être déjà été utilisé.');
        } else {
          setErrorMsg('Une erreur est survenue lors de la vérification. Veuillez réessayer.');
        }
      });
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo />
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            {status === 'verifying' ? 'Vérification…'
              : status === 'success' ? 'Email confirmé !'
              : 'Lien invalide'}
          </h1>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">

          {/* Verifying */}
          {status === 'verifying' && (
            <div className="flex flex-col items-center gap-5 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader size={28} className="text-primary animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Activation en cours…</p>
                <p className="text-sm text-muted-foreground">Nous confirmons votre adresse email.</p>
              </div>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-5 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                <CheckCircle size={28} className="text-green-600" />
              </div>
              <div className="space-y-1.5">
                <p className="font-semibold text-foreground">Votre email est vérifié !</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Votre compte est maintenant activé. Vous allez être redirigé vers votre cockpit.
                </p>
              </div>
              <div className="w-full space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs shrink-0 tabular-nums">{countdown}s</span>
                </div>
                <Button
                  onClick={() => {
                    if (countdownIntervalRef.current) {
                      clearInterval(countdownIntervalRef.current);
                      countdownIntervalRef.current = null;
                    }
                    navigate({ to: '/dashboard' });
                  }}
                  className="w-full gap-2"
                >
                  Accéder au cockpit →
                </Button>
              </div>
            </div>
          )}

          {/* Error */}
          {(status === 'error' || status === 'invalid') && (
            <div className="flex flex-col items-center gap-5 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                <AlertCircle size={28} className="text-red-600" />
              </div>
              <div className="space-y-1.5">
                <p className="font-semibold text-foreground">
                  {status === 'invalid' ? 'Lien manquant' : 'Lien invalide ou expiré'}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {status === 'invalid'
                    ? 'Aucun jeton de vérification trouvé dans ce lien. Veuillez utiliser le lien reçu par email.'
                    : errorMsg}
                </p>
              </div>
              <div className="w-full space-y-2.5">
                <Button
                  onClick={() => navigate({ to: '/email-unverified' })}
                  className="w-full"
                >
                  Recevoir un nouveau lien
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate({ to: '/' })}
                  className="w-full text-muted-foreground"
                >
                  Retour à l'accueil
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
