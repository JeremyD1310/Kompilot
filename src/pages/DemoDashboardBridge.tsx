/**
 * DemoDashboardBridge — Redirects /demo/dashboard to /dashboard
 * when a demo session exists, so the user sees the real production
 * dashboard (powered by DashboardLayout + AuthGuard + mock proxy).
 *
 * On demo.kompilot.fr: the inline bootstrap already wrote the session,
 * so the redirect is immediate.
 *
 * On kompilot.fr: DemoAutoLoginPage writes the session before navigating here,
 * so the redirect picks it up on the next render.
 *
 * If NO session exists (direct URL access without activation), redirects
 * back to /demo to start the flow.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { readDemoSession } from '../lib/demoAccount';
import { IS_DEMO_DOMAIN, bootstrapDemoSession } from '../lib/demoDomain';

const REDIRECT_TIMEOUT_MS = 5_000; // 5-second safety timeout
const POLL_INTERVAL_MS   = 300;     // Re-check session every 300ms

export default function DemoDashboardBridge() {
  const navigate = useNavigate();
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let redirected = false;
    let timeout: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;

    const attemptRedirect = (): boolean => {
      try {
        const session = readDemoSession();
        const activeFlag = sessionStorage.getItem('kompilot_demo_active_session');
        const domainFlag = IS_DEMO_DOMAIN || (window as any).__kompilotDemoDomain;

        if (session || activeFlag === 'true' || domainFlag) {
          // Demo session exists → redirect to real dashboard
          window.location.href = '/dashboard';
          return true;
        }
      } catch (err: any) {
        setError(err?.message || 'Stockage inaccessible');
      }

      // No session → redirect to /demo to start the flow (only once)
      return false;
    };

    // ── 1st attempt (instant) ────────────────────────────────────────────
    if (attemptRedirect()) return;

    // ── Poll session every POLL_INTERVAL_MS ──────────────────────────────
    interval = setInterval(() => {
      if (redirected) return;
      if (attemptRedirect()) {
        redirected = true;
        clearInterval(interval);
        clearTimeout(timeout);
      }
    }, POLL_INTERVAL_MS);

    // ── Safety timeout: show fallback after REDIRECT_TIMEOUT_MS ──────────
    timeout = setTimeout(() => {
      clearInterval(interval);
      if (redirected) return;

      // Last attempt — try again one more time
      try {
        const session = readDemoSession();
        const activeFlag = sessionStorage.getItem('kompilot_demo_active_session');
        if (session || activeFlag === 'true') {
          window.location.href = '/dashboard';
          redirected = true;
          return;
        }
      } catch { /* swallow */ }

      setHasTimedOut(true);
    }, REDIRECT_TIMEOUT_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [navigate]);

  // ── Spinner (with fallback after timeout) ─────────────────────────────
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
        {!hasTimedOut ? (
          <>
            <div className="w-10 h-10 border-[3px] border-primary/15 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Chargement du cockpit démo…</p>
            <p className="text-xs text-muted-foreground/50">
              Redirection vers le tableau de bord en cours
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-destructive">
                Redirection bloquée
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {error
                  ? `Erreur : ${error}`
                  : "La session démo n'a pas pu être chargée. Vérifiez que les cookies et le stockage local sont activés."
                }
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => { window.location.href = '/dashboard'; }}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
              >
                Accéder au dashboard
              </button>
              <button
                onClick={() => {
                  try {
                    bootstrapDemoSession();
                  } catch { /* noop */ }
                  window.location.href = '/demo';
                }}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Réessayer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
