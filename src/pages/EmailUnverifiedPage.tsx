import { useState, useEffect, useRef } from 'react';
import { Button } from '@blinkdotnew/ui';
import { MailCheck, RefreshCw, LogOut, AlertCircle, CheckCircle, Send } from 'lucide-react';
import { blink } from '../blink/client';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from '@tanstack/react-router';

import { KompilotLogo } from '../components/brand/KompilotLogo';

function Logo() {
  return <KompilotLogo variant="icon" height={40} />;
}

const RESEND_COOLDOWN = 60; // seconds

/** Builds and sends the verification email via Blink notifications. */
async function sendVerificationEmail(userEmail: string) {
  const { token } = await blink.auth.generateEmailVerificationToken();
  const verifyUrl = `${window.location.origin}/verify-email?token=${token}`;
  const year = new Date().getFullYear();

  await blink.notifications.email({
    to: userEmail,
    subject: '✅ Confirmez votre adresse email — Kompilot',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:28px 32px;">
          <h1 style="margin:0;color:#f8fafc;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Kompilot</h1>
          <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Gestionnaire de présence en ligne</p>
        </div>

        <!-- Banner -->
        <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px 32px;display:flex;align-items:center;gap:12px;">
          <span style="font-size:24px;">✉️</span>
          <div>
            <p style="margin:0;font-size:14px;font-weight:600;color:#15803d;">Vérifiez votre adresse email</p>
            <p style="margin:3px 0 0;font-size:12px;color:#16a34a;">Un dernier clic et vous êtes prêt !</p>
          </div>
        </div>

        <!-- Content -->
        <div style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#0f172a;line-height:1.6;">
            Bonjour,<br/>
            Merci de vous être inscrit sur <strong>Kompilot</strong>. Pour activer votre compte et accéder à votre cockpit, cliquez sur le bouton ci-dessous.
          </p>

          <div style="text-align:center;margin:28px 0;">
            <a href="${verifyUrl}" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:-0.2px;">
              ✅ Confirmer mon email
            </a>
          </div>

          <p style="margin:20px 0 0;font-size:12px;color:#64748b;line-height:1.6;">
            Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>
            <a href="${verifyUrl}" style="color:#0d9488;word-break:break-all;">${verifyUrl}</a>
          </p>

          <div style="margin-top:24px;padding:14px 18px;background:#fefce8;border:1px solid #fde68a;border-radius:8px;">
            <p style="margin:0;font-size:12px;color:#92400e;">
              ⏱️ Ce lien expire dans <strong>24 heures</strong>. Si vous n'avez pas créé de compte, ignorez cet email.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
            © ${year} Kompilot — Tous droits réservés
          </p>
        </div>
      </div>
    `,
    text: `Confirmez votre email Kompilot\n\nCliquez sur ce lien pour activer votre compte :\n${verifyUrl}\n\nCe lien expire dans 24 heures.`,
  });
}

export default function EmailUnverifiedPage() {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated, logout, refreshUser } = useAuth();

  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [cooldown, setCooldown] = useState(0);
  const [checkStatus, setCheckStatus] = useState<'idle' | 'checking' | 'still-unverified'>('idle');
  const hasSentRef = useRef(false);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    };
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/' });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Redirect if already verified
  useEffect(() => {
    if (user && !!user.emailVerified) {
      navigate({ to: '/dashboard' });
    }
  }, [user, navigate]);

  // Auto-send verification email once on mount
  useEffect(() => {
    if (!user?.email || hasSentRef.current) return;
    hasSentRef.current = true;
    setSendStatus('sending');
    sendVerificationEmail(user.email)
      .then(() => {
        setSendStatus('sent');
        startCooldown();
      })
      .catch(() => setSendStatus('error'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // Countdown timer for resend cooldown
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

  const handleResend = async () => {
    if (!user?.email || cooldown > 0) return;
    setSendStatus('sending');
    try {
      await sendVerificationEmail(user.email);
      setSendStatus('sent');
      startCooldown();
    } catch {
      setSendStatus('error');
    }
  };

  const handleCheckVerification = async () => {
    setCheckStatus('checking');
    const fresh = await refreshUser();
    if (fresh && !!fresh.emailVerified) {
      navigate({ to: '/dashboard' });
    } else {
      setCheckStatus('still-unverified');
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
      checkTimerRef.current = setTimeout(() => setCheckStatus('idle'), 3000);
    }
  };

  // Loading state while auth resolves
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const emailDomain = user.email?.split('@')[1] ?? '';
  const webmailUrl = emailDomain.includes('gmail') ? 'https://mail.google.com'
    : emailDomain.includes('outlook') || emailDomain.includes('hotmail') || emailDomain.includes('live') ? 'https://outlook.live.com'
    : emailDomain.includes('yahoo') ? 'https://mail.yahoo.com'
    : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo + heading */}
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Vérifiez votre email</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Un email de confirmation a été envoyé à{' '}
              <span className="font-semibold text-foreground">{user.email}</span>
            </p>
          </div>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">

          {/* Illustration strip */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border-b border-border px-6 py-8 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                <MailCheck size={36} className="text-primary" />
              </div>
              {sendStatus === 'sent' && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 border-2 border-card flex items-center justify-center">
                  <CheckCircle size={14} className="text-white" />
                </div>
              )}
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Send status */}
            {sendStatus === 'sending' && (
              <div className="flex items-center gap-2.5 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent shrink-0" />
                <p className="text-sm text-blue-700">Envoi de l'email de confirmation…</p>
              </div>
            )}
            {sendStatus === 'sent' && (
              <div className="flex items-start gap-2.5 rounded-lg bg-green-50 border border-green-100 px-4 py-3">
                <CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Email envoyé !</p>
                  <p className="text-xs text-green-700 mt-0.5">Vérifiez votre boîte de réception et vos spams.</p>
                </div>
              </div>
            )}
            {sendStatus === 'error' && (
              <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">Erreur lors de l'envoi. Utilisez le bouton ci-dessous pour réessayer.</p>
              </div>
            )}

            {/* Instructions */}
            <ol className="space-y-3">
              {[
                { n: 1, text: "Ouvrez l'email de Kompilot dans votre boîte de réception." },
                { n: 2, text: 'Cliquez sur le bouton « Confirmer mon email ».' },
                { n: 3, text: 'Vous serez automatiquement redirigé vers votre cockpit.' },
              ].map(step => (
                <li key={step.n} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary mt-0.5">
                    {step.n}
                  </span>
                  {step.text}
                </li>
              ))}
            </ol>

            {/* Actions */}
            <div className="space-y-2.5 pt-1">
              {/* Open webmail shortcut */}
              {webmailUrl && (
                <a
                  href={webmailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity"
                >
                  <MailCheck size={15} />
                  Ouvrir{' '}
                  {emailDomain.includes('gmail') ? 'Gmail'
                    : emailDomain.includes('yahoo') ? 'Yahoo Mail'
                    : 'Outlook'}
                </a>
              )}

              {/* Check verification */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleCheckVerification}
                disabled={checkStatus === 'checking'}
              >
                {checkStatus === 'checking' ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" /> Vérification…</>
                ) : (
                  <><RefreshCw size={14} /> J'ai confirmé mon email</>
                )}
              </Button>
              {checkStatus === 'still-unverified' && (
                <p className="text-xs text-center text-amber-600">
                  Email pas encore confirmé. Pensez à vérifier vos spams.
                </p>
              )}

              {/* Resend */}
              <button
                onClick={handleResend}
                disabled={cooldown > 0 || sendStatus === 'sending'}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-1"
              >
                <Send size={11} />
                {cooldown > 0
                  ? `Renvoyer l'email dans ${cooldown}s`
                  : "Renvoyer l'email de confirmation"}
              </button>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="text-center">
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={12} /> Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}